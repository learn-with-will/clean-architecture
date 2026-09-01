---
id: lesson-05
slug: dependency-inversion-principle
title: "The Dependency Inversion Principle"
level: beginner
order: 5
duration: 22
tags:
  - dip
  - dependency-injection
  - inversion-of-control
  - abstractions
  - boundaries
summary: "The principle Clean Architecture leans on most — depend on abstractions, not on concretions — and the careful distinction between DIP (a design principle), Dependency Injection (a technique), and Inversion of Control (a broad idea), which are constantly and wrongly used as synonyms."
---

# Learning Objectives

By the end of this lesson you will be able to:

- State the **Dependency Inversion Principle (DIP)** in full and explain what is being "inverted."
- Show how inserting an **abstraction** flips a source-code dependency at a boundary.
- Explain who should **own** the abstraction and why.
- Precisely distinguish **DIP**, **Dependency Injection (DI)**, and **Inversion of Control (IoC)** —
  three ideas that are related but *not* synonyms.

# Why It Matters

Every arrow that points inward in a Clean Architecture diagram points that way because of **DIP**. It's
the mechanism that lets a high-level business rule use a database without depending on it. But DIP is
surrounded by two other terms — **DI** and **IoC** — that people use interchangeably, which muddies all
three. Getting these straight is one of the highest-leverage things you can learn in this course, and
one of the most common interview traps.

# Concept Explanation

### What DIP says

The Dependency Inversion Principle has two clauses (Robert C. Martin):

1. **High-level modules should not depend on low-level modules. Both should depend on abstractions.**
2. **Abstractions should not depend on details. Details should depend on abstractions.**

"High-level" means closer to policy and business value; "low-level" means closer to mechanism and
detail (I/O, database, framework). Left alone, high-level code tends to call — and therefore depend on —
low-level code. DIP says: don't; put an abstraction between them.

### What gets "inverted"

The natural, un-inverted dependency looks like this:

```text
Policy (high-level)  ───▶  Detail (low-level)      "the report imports the database"
```

A change in the volatile detail can now force a change in the precious policy. DIP inserts an interface
**owned by the policy** and has the detail implement it:

```text
Policy  ───▶  «interface»  ◀───  Detail
 (high)        (abstraction)      (low)
```

The source-code arrow from the detail now points **up** toward the abstraction — it has been *inverted*
relative to the flow of control. At runtime the policy still causes the detail to run; but in **source
code**, the detail depends on the policy's abstraction, not the other way around. That flip is the
entire trick behind the Dependency Rule.

### Who owns the abstraction

This is the subtle, essential part: **the abstraction belongs to the high-level policy (the client),
not to the detail.** The use case declares "I need something that can `save(order)`" — a `Repository`
interface that lives *with the use case, in the inner layer*. The database adapter, in the outer layer,
implements that interface. Because the interface is defined inward and implemented outward, the
source-code dependency points inward, satisfying the Dependency Rule.

```typescript
// Inner layer (policy) OWNS and declares the abstraction it needs.
interface OrderRepository {
  save(order: Order): void;
}
class PlaceOrder { // high-level use case
  constructor(private readonly orders: OrderRepository) {}
  run(order: Order) { /* business rules... */ this.orders.save(order); }
}
```

```typescript
// Outer layer (detail) depends INWARD by implementing the inner interface.
class PostgresOrderRepository implements OrderRepository {
  save(order: Order) { /* SQL here */ }
}
```

`PlaceOrder` never imports `PostgresOrderRepository`. The database can be replaced, deferred, or faked,
and the use case is untouched.

### DIP ≠ DI ≠ IoC

These three travel together but mean different things. Keep them apart:

- **Dependency Inversion Principle (DIP)** — a **design principle** about the *direction of
  dependencies*: depend on abstractions, not concretions. It's a goal.
- **Dependency Injection (DI)** — a **technique** for *supplying* a component's dependencies from the
  outside (via the constructor, a setter, or an interface) instead of the component creating them with
  `new`. It's one common *way to implement* DIP. In the code above, passing the repository into the
  constructor is DI.
- **Inversion of Control (IoC)** — a **broad principle** in which a framework or runtime, rather than
  your code, controls the flow ("Don't call us, we'll call you" — the Hollywood Principle). Event loops,
  callbacks, and web frameworks calling *your* handler are all IoC. **DI is one specific form of IoC**
  (inverting control over *dependency acquisition*); an "IoC container" is really a **DI container**.

A one-line memory aid: **DIP is the goal, DI is a technique that helps reach it, and IoC is the wider
family DI belongs to.** You can follow DIP without a DI framework (just pass arguments), and you can use
a framework's IoC without honoring DIP (if you still depend on concretions).

### You can't invert *everything*

DIP targets **volatile** concretions — the things likely to change (databases, web frameworks, external
services). It's fine to depend directly on **stable** concretions like the language's `String` or `Math`;
wrapping those in interfaces is pointless ceremony. Invert the dependencies that are worth inverting.

# Key Terminology

- **Dependency Inversion Principle (DIP)** — depend on abstractions, not concretions; abstractions don't depend on details.
- **Abstraction** — an interface or abstract type that hides a detail behind a contract.
- **Dependency Injection (DI)** — supplying a component's collaborators from outside rather than constructing them internally.
- **Inversion of Control (IoC)** — a framework/runtime driving your code's flow rather than your code driving it.
- **Composition root** — the one place (outermost) where concrete implementations are wired to the abstractions that need them.
- **Volatile concretion** — a concrete detail likely to change; the kind DIP tells you to depend on through an abstraction.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Getting a collaborator | `new` it inside the class | Inject it via the constructor (DI) | Inject volatile/boundary collaborators; `new` a stable value object is fine. |
| Where the interface lives | Next to the implementation | Next to the client that needs it | Put it with the client (inner layer) so dependencies point inward. |
| Wiring implementations | A DI/IoC container | Manual wiring in a composition root | Manual is clearer for small systems; a container helps at scale — either can honor DIP. |

# Worked Example

Watch the arrow flip. Before DIP:

```text
NotificationService ──▶ TwilioSmsClient         source dep points at the detail
```

After introducing an interface the service owns:

```text
NotificationService ──▶ «Sms»  ◀── TwilioSmsClient
        (policy)      (abstraction)     (detail)
```

```typescript
interface Sms { send(to: string, text: string): void; }               // owned by the policy
class NotificationService {                                           // high-level
  constructor(private readonly sms: Sms) {}                           // DI supplies it
  alert(user: User) { this.sms.send(user.phone, 'Alert!'); }
}
class TwilioSmsClient implements Sms { send(/*...*/){} }              // low-level detail
```

The service depends on `Sms`; Twilio depends on `Sms`; the service does **not** depend on Twilio. Swap
Twilio for a different provider or a test fake without editing the policy.

# Real World Analogy

A **wall socket** again, now for DIP specifically. Your appliances (policy) and the power company
(detail) never depend on each other directly — they both conform to the **socket standard** (the
abstraction). The standard is defined for the benefit of the *appliance side* (the client), and the
utility must comply with it. **DI** is the act of plugging a specific appliance in. **IoC** is the grid
deciding when to deliver power — the flow is controlled by the system, not by your toaster.

# Examples

## Example 1 — Basic: which term is this?

A web framework calls your route handler when a request arrives. Which idea is that? Answer: **IoC** —
the framework controls the flow and calls your code. (It is *not*, by itself, DIP, and not necessarily
DI.)

**Why this works:** control over *when your code runs* has been inverted to the framework — the defining
feature of IoC.

## Example 2 — Real-world: deferring the database

A team starts a project not yet knowing whether they'll use Postgres or DynamoDB. They write use cases
against a `Repository` interface and a temporary in-memory implementation. Months later they pick
Postgres and write one adapter. The core shipped and was tested long before the database decision was
made.

**Why this works:** DIP let the policy depend on an abstraction, so the concrete database was a late,
reversible decision.

## Example 3 — Pitfall: a DI container that still violates DIP

Another team uses a fancy DI container, so they believe they're "doing dependency inversion." But their
use cases still `import` the concrete `MongoUserRepository` type directly and just have the container
`new` it for them. The source-code dependency still points at the detail — DIP is violated despite the
container.

**Why this bites:** DI (or an IoC container) is only a delivery mechanism; DIP is about *what you depend
on in source*. Using a container doesn't invert a dependency that still names a concretion.

# Common Mistakes

- **Using DIP, DI, and IoC as synonyms.** They're a principle, a technique, and a broad family,
  respectively.
- **Putting the interface next to the implementation.** The client (inner layer) should own it, or the
  dependency won't point inward.
- **Thinking "we use a DI container, so we follow DIP."** Not if your policy still imports concretions.
- **Inverting stable concretions.** Don't wrap `String`, `Date`, or trivial value objects in interfaces
  for no reason.

# Best Practices

- Make high-level policy depend on **interfaces it owns**; implement them in outer layers.
- Prefer **constructor injection** to supply volatile collaborators.
- Concentrate the messy wiring of concretions in a single **composition root** (covered later).
- Reserve inversion for **volatile** details worth the abstraction.

# Summary

- **DIP**: high-level modules and low-level modules both depend on **abstractions**; details depend on
  abstractions, not vice versa.
- Inserting an interface **owned by the policy** flips the source-code dependency inward, even though
  control still flows outward at runtime.
- **DIP** (principle) ≠ **DI** (technique for supplying dependencies) ≠ **IoC** (framework-controlled
  flow); DI is one form of IoC and one way to achieve DIP.
- Invert **volatile** concretions, not stable ones; a DI container alone doesn't guarantee DIP.

# Flash Cards

Q: State the Dependency Inversion Principle.
A: High-level modules should not depend on low-level modules; both should depend on abstractions. Abstractions should not depend on details; details depend on abstractions.

Q: In DIP, who should own the abstraction — the client or the implementation?
A: The client (the high-level policy) owns and declares the abstraction; the low-level detail implements it, so the source-code dependency points inward.

Q: How is Dependency Injection different from DIP?
A: DIP is a design principle about depending on abstractions; DI is a technique for supplying a component's dependencies from outside. DI is one way to implement DIP, not the principle itself.

Q: How is Inversion of Control different from Dependency Injection?
A: IoC is the broad idea of a framework/runtime controlling the flow of your program; DI is a specific form of IoC that inverts control over acquiring dependencies. An "IoC container" is really a DI container.

Q: Does using a DI container guarantee you follow DIP?
A: No. If your high-level code still imports concrete types, the source-code dependency points at a detail and DIP is violated, container or not.

Q: Should you invert every concrete dependency?
A: No — invert volatile concretions likely to change (databases, frameworks). Depending directly on stable concretions like String or Math is fine.

# Exercises

### Easy
In one sentence each, define DIP, DI, and IoC so a teammate could tell them apart. Then give one
concrete example of each from any code you know.

### Medium
Take a class that does `new SomeApiClient()` inside a method. Introduce an interface the class owns,
inject an implementation through the constructor, and note where the source-code dependency now points.

### Challenging
Find a place in a codebase where a high-level module imports a concrete database or HTTP client type.
Redesign it so the interface lives with the high-level module and the concrete type implements it. Draw
the before/after source-code arrows and confirm the direction inverted.

# Further Reading

- Robert C. Martin — *Clean Architecture* (2017), ch. 11: "DIP" and Part III design principles
- Martin Fowler — *Inversion of Control Containers and the Dependency Injection pattern*: <https://martinfowler.com/articles/injection.html>
- Martin Fowler — *InversionOfControl*: <https://martinfowler.com/bliki/InversionOfControl.html>
- Robert C. Martin — *The Clean Architecture* (2012): <https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html>
