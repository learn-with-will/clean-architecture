---
id: lesson-24
slug: capstone-end-to-end
title: "Capstone: A System End to End"
level: advanced
order: 24
duration: 24
tags:
  - capstone
  - end-to-end
  - composition-root
  - review
  - practice
summary: "A full walk through one small feature applying every principle in the course — entities enforcing rules, a use-case interactor behind input and output ports, gateway and presenter adapters, wiring at the composition root, and a boundary test — followed by a recap of the whole architecture and where to go next."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Assemble a complete feature across all four layers, obeying the **Dependency Rule** throughout.
- Wire the concrete pieces at a **composition root** and test the use case at its **boundary**.
- Trace one request from the **outside in and back out**, naming each part.
- Summarize the whole course and choose your **next steps**.

# Why It Matters

You've learned the pieces — entities, use cases, ports, adapters, DI, testing, component principles, and the
judgment to apply them proportionately. The capstone puts them together on one small feature so you can see
the whole machine turn. Building even a tiny slice end-to-end is the fastest way to make the architecture
stick.

# Concept Explanation

### The feature

We'll build **"check out a library book."** Its rules make it a genuine domain, not just CRUD:

- A member may not exceed their **loan limit** (say, 5 books).
- A book copy can only be checked out if it is **available**.
- Checking out records a **loan** and marks the copy unavailable.

### The core: entities (enterprise rules)

```typescript
// Entities — pure, framework-free, enforce their own invariants.
class Member {
  constructor(readonly id: string, private activeLoans: number, readonly limit = 5) {}
  canBorrow(): boolean { return this.activeLoans < this.limit; }
  recordBorrow(): void {
    if (!this.canBorrow()) throw new DomainError('Loan limit reached');
    this.activeLoans++;
  }
}
class BookCopy {
  constructor(readonly id: string, private available: boolean) {}
  isAvailable(): boolean { return this.available; }
  checkOut(): void {
    if (!this.available) throw new DomainError('Copy is not available');
    this.available = false;
  }
}
```

### The use case: an interactor behind ports

```typescript
// Boundaries and models owned by the use-case layer.
interface CheckOutBookInput { run(req: CheckOutRequest): void; }
interface CheckOutBookOutput { present(res: CheckOutResponse): void; }
interface MemberGateway { byId(id: string): Member | null; save(m: Member): void; }
interface CopyGateway { byId(id: string): BookCopy | null; save(c: BookCopy): void; }
interface LoanGateway { record(memberId: string, copyId: string, at: Date): void; }
type CheckOutRequest = { memberId: string; copyId: string };
type CheckOutResponse = { ok: true; message: string } | { ok: false; error: string };

class CheckOutBook implements CheckOutBookInput {
  constructor(
    private readonly members: MemberGateway,
    private readonly copies: CopyGateway,
    private readonly loans: LoanGateway,
    private readonly clock: Clock,
    private readonly output: CheckOutBookOutput,
  ) {}

  run(req: CheckOutRequest): void {
    const member = this.members.byId(req.memberId);
    const copy = this.copies.byId(req.copyId);
    if (!member || !copy) return this.output.present({ ok: false, error: 'Unknown member or copy' });

    try {
      member.recordBorrow();          // entity rule: loan limit
      copy.checkOut();                // entity rule: availability
    } catch (e) {
      return this.output.present({ ok: false, error: (e as DomainError).message });
    }

    this.members.save(member);
    this.copies.save(copy);
    this.loans.record(member.id, copy.id, this.clock.now());
    this.output.present({ ok: true, message: `Checked out ${copy.id}` });
  }
}
```

Read what the interactor depends on: **entities** and **interfaces it owns** — nothing else. No SQL, no HTTP,
no framework.

### The adapters: controller, gateways, presenter

```typescript
// Driving adapter (edge): HTTP → request model → call the input port.
class CheckOutController {
  constructor(private readonly useCase: CheckOutBookInput) {}
  handle(httpReq: HttpRequest) {
    this.useCase.run({ memberId: httpReq.body.memberId, copyId: httpReq.body.copyId });
  }
}
// Driven adapters (edge): implement the gateways; the ONLY place SQL lives.
class SqlMemberGateway implements MemberGateway { /* map rows ↔ Member */ }
// Presenter (edge): response model → humble view model.
class CheckOutPresenter implements CheckOutBookOutput {
  constructor(private readonly view: { render(vm: { text: string; error: boolean }): void }) {}
  present(res: CheckOutResponse) {
    this.view.render(res.ok ? { text: res.message, error: false } : { text: res.error, error: true });
  }
}
```

### The composition root: wire it once

```typescript
function buildCheckOut(db: Db, view: View) {
  const presenter = new CheckOutPresenter(view);
  const useCase = new CheckOutBook(
    new SqlMemberGateway(db), new SqlCopyGateway(db), new SqlLoanGateway(db),
    new SystemClock(), presenter,
  );
  return new CheckOutController(useCase); // hand the controller to the web framework
}
```

Only this function names concrete classes. Swap SQL for in-memory, or the web for a CLI, by editing here —
nowhere else.

### Trace one request

```text
HTTP POST /checkout
  → CheckOutController        (driving adapter: build request model)
    → CheckOutBook.run        (use case: orchestrate)
        → Member.recordBorrow / BookCopy.checkOut   (entity rules)
        → MemberGateway/CopyGateway/LoanGateway.save/record  (driven adapters ⇄ DB)
    → CheckOutBookOutput.present  (output port)
  → CheckOutPresenter → view    (humble view renders the view model)

Control weaves out to the DB and back to the view; every source-code dependency points inward.
```

### Test at the boundary

```typescript
test('rejects when the member is at their loan limit', () => {
  const members = new InMemoryMemberGateway({ id: 'm1', activeLoans: 5 }); // at limit
  const copies = new InMemoryCopyGateway({ id: 'c1', available: true });
  const output = new CapturingOutput();
  const useCase = new CheckOutBook(members, copies, new NullLoanGateway(), fixedClock, output);

  useCase.run({ memberId: 'm1', copyId: 'c1' });

  expect(output.last).toEqual({ ok: false, error: 'Loan limit reached' });
});
```

No database, no web server, milliseconds — the payoff of every boundary you built.

# Key Terminology

- **End-to-end slice** — one feature implemented across all four layers, from driving adapter to entities and back.
- **Composition root** — the single wiring point that constructs and injects concrete adapters.
- **Boundary test** — a test that drives a use case at its input port with in-memory doubles.
- **Trace** — following one request through controller, use case, entities, gateways, and presenter.
- **Humble view** — the logic-free renderer of the presenter's view model.
- **Domain error** — an error raised by an entity when an invariant would be broken.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Reporting results | Output port + presenter | Return a response model | Output port matches strict Clean style and multi-output UIs; returning is simpler and fine for many apps. |
| Persistence in the capstone | Real SQL gateways | In-memory gateways | In-memory for tests and early development; SQL behind the same interfaces for production. |
| Scope of the slice | Full stack now | Start with entities + use case | For a rich feature build the full slice; for a spike, start inside and add adapters when needed. |

# Worked Example

Extend the capstone yourself: add a **"return a book"** use case. It needs a `ReturnBook` interactor that
loads the member and copy, calls `member.recordReturn()` and `copy.markAvailable()` (new entity methods),
saves them, closes the loan via `LoanGateway`, and reports through an output port. Notice you add it by
**writing new code behind the same kinds of ports** — the existing check-out code is untouched (Open-Closed
in action).

# Real World Analogy

You've assembled the whole **kitchen** from the earlier analogies: the **recipes and culinary facts**
(entities), the **chef's procedure** for a dish (use case), the **waiter and expediter** translating orders
and plates (controller/presenter), the **pantry and suppliers** (gateways/DB), and the **head of house**
plugging it all together before service (composition root). Because each station meets the others through
standard hand-offs (tickets, trays, interfaces), you can change the supplier, redecorate the dining room, or
add a new dish without rebuilding the kitchen.

# Examples

## Example 1 — Basic: name the part

In the capstone, what is `SqlMemberGateway`? Answer: a **driven adapter** (a gateway) in the Interface
Adapters layer that implements the `MemberGateway` interface owned by the use-case layer.

**Why this works:** it converts between the `Member` entity and database rows and is the only place SQL
lives, matching the gateway's role exactly.

## Example 2 — Real-world: swapping the delivery mechanism

The library adds a self-service kiosk. A new `KioskController` builds the same `CheckOutRequest` and calls the
same input port; the entities, use case, gateways, and presenter are reused untouched.

**Why this works:** the use case never knew its driver, so a new delivery mechanism is just another driving
adapter — the independence the whole course was building toward.

## Example 3 — Pitfall: the shortcut that unravels it

Under deadline, a developer adds an "availability check" as an `if` in the controller and writes directly to
the database there, bypassing the use case. Soon the kiosk path lacks the check, and the rule exists in two
places that disagree.

**Why this bites:** putting a rule and persistence in an adapter broke the boundaries, so the rule couldn't be
reused and drifted out of sync — exactly the failure the architecture prevents when respected.

# Common Mistakes

- **Sneaking rules or SQL into controllers,** bypassing the use case and its boundaries.
- **Constructing dependencies inside the use case** instead of at the composition root.
- **Passing entities to the view** instead of a presenter's view model.
- **Testing only through HTTP,** missing the fast, focused boundary tests.

# Best Practices

- Build each feature as a **full slice** through the layers, entities-first.
- Keep the interactor dependent only on **entities and owned interfaces**; wire concretes at the **root**.
- Report results through an **output port**/response model and render with a **humble view**.
- Cover the rules with **boundary tests** using in-memory doubles.

# Summary

- A complete feature flows **controller → use case → entities + gateways → output port → presenter → view**,
  with every source-code dependency pointing **inward**.
- Concrete adapters are wired once at the **composition root**; the use case is tested at its **boundary**
  with in-memory doubles.
- New behavior is added by **writing new code behind the same ports** (Open-Closed), not by editing the core.
- This is the whole course in one slice — entities, use cases, boundaries, DIP, adapters, DI, and testing,
  applied with proportionate judgment.

# Flash Cards

Q: In the capstone, what does the interactor (CheckOutBook) depend on?
A: Only inward things — the entities (Member, BookCopy) and interfaces it owns (the gateways, the clock, and the output port). It has no SQL, HTTP, or framework dependencies.

Q: Where are the concrete adapters (SQL gateways, presenter) constructed and connected?
A: At the composition root — a single wiring function near the entry point — which is the only place that names concrete classes and injects them into the abstractions.

Q: In a full request trace, how do control flow and source-code dependencies relate?
A: Control weaves outward (to the database) and back (to the view), while every source-code dependency points inward toward the use case and entities.

Q: How do you add a "return a book" feature without touching check-out?
A: Write a new interactor behind its own ports and adapters — new code plugged in behind the same kinds of boundaries — leaving the existing check-out code unchanged (Open-Closed Principle).

Q: Why can the capstone's rules be tested in milliseconds?
A: Because the use case depends only on interfaces, a boundary test supplies in-memory gateways and a capturing output, so no database or web server is involved.

Q: What breaks if a developer adds an availability check directly in the controller?
A: The rule bypasses the use case and its boundary, so it can't be reused by other drivers and drifts out of sync between paths — the exact failure the architecture prevents.

# Exercises

### Easy
Redraw the capstone's request trace from memory, labeling each box with its layer (entity, use case,
interface adapter, framework) and confirming the dependency arrows point inward.

### Medium
Implement the "return a book" use case sketched above: new entity methods, an interactor behind input/output
ports and gateways, and a boundary test with in-memory doubles. Keep the check-out code untouched.

### Challenging
Take a real feature you own and rebuild one slice of it Clean-Architecture style: entities with invariants, a
use case behind ports, gateway and presenter adapters, and a composition root. Then write two boundary tests,
and reflect on which boundaries were worth it and which were ceremony.

# Further Reading

- Robert C. Martin — *Clean Architecture* (2017), ch. 22 "The Clean Architecture" and the case-study chapters (ch. 33–34)
- Robert C. Martin — *The Clean Architecture* (2012): <https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html>
- Alistair Cockburn — *Hexagonal Architecture*: <https://alistair.cockburn.us/hexagonal-architecture/>
- Eric Evans — *Domain-Driven Design* (2003) and Vaughn Vernon — *Implementing Domain-Driven Design* (2013), for going deeper on the domain model
