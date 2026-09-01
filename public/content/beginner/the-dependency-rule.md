---
id: lesson-06
slug: the-dependency-rule
title: "The Dependency Rule"
level: beginner
order: 6
duration: 20
tags:
  - dependency-rule
  - boundaries
  - flow-of-control
  - layers
  - dtos
summary: "A close look at the single rule that defines Clean Architecture — source-code dependencies point only inward — including the crucial distinction from the runtime flow of control, what may cross a boundary (simple data structures, never entities or details), and how the levels of a system are ordered."
---

# Learning Objectives

By the end of this lesson you will be able to:

- State the **Dependency Rule** precisely and apply it to decide whether an import is allowed.
- Explain why the rule constrains **source-code dependencies**, not the **flow of control**, and how
  those can point in opposite directions.
- Describe what may **cross a boundary** and in what form.
- Order parts of a system by **level** (distance from the core).

# Why It Matters

You've met the Dependency Rule twice now — it deserves its own lesson because *it is the definition of
Clean Architecture*. Every other technique (interfaces, use cases, adapters, presenters) exists only to
help you obey it. If you can look at any two modules and correctly say "that import is legal / illegal
under the Dependency Rule," you can navigate the whole architecture.

# Concept Explanation

### The rule, precisely

> **Source-code dependencies must point only inward, toward higher-level policies. Nothing declared in
> an outer circle may be mentioned by code in an inner circle** — not its name, not its functions, not
> its data structures.

Read it as a permission check on `import` statements. An **entity** may not import a **use case**, an
**adapter**, or the **database**. A **use case** may import **entities** (inward) but not **controllers**
or the **web framework** (outward). If an inner module needs something an outer module provides, it must
express that need as an **abstraction it owns** (an interface) and let the outer module implement it —
that's DIP doing the work.

### Source code vs flow of control — the key subtlety

Here is where people trip. The Dependency Rule is about **source-code dependencies** (what imports what).
It says **nothing** about the **flow of control** (who calls whom at run time). These frequently point in
**opposite** directions.

Consider a use case that must display a result. At runtime, control flows **outward**: the use case
triggers the presenter, which updates the view. But the *source-code* dependency must point **inward**.
The resolution is an **output port**: an interface the use case owns and calls; the presenter (outer)
implements it.

```text
              runtime flow of control  ─────────────▶
   ┌───────────────┐        ┌────────────────┐        ┌──────────┐
   │   Use Case    │ ─────▶ │  «OutputPort»  │ ◀───── │Presenter │
   │  (inner)      │  calls │  (owned inner) │ impl.  │ (outer)  │
   └───────────────┘        └────────────────┘        └──────────┘
              ◀─────────────  source-code dependency
```

The use case *calls* outward but *depends* inward, because it calls **through an interface it defines**.
Master this diagram and you understand Clean Architecture's central move.

### What crosses a boundary

When data passes across a boundary, it must be in a form the inner side is allowed to know — a **simple
data structure**, often called a **DTO** (Data Transfer Object) or a request/response model. You must
**not** pass an **entity** outward as-is (it would tempt outer code to depend on inner rules in fragile
ways) and you must **not** pass a database row or ORM object **inward** (the inner layer would then know
the database). Convert at the boundary to a plain structure that violates no dependency.

A safe rule of thumb: **whatever crosses a boundary is a humble bag of data, isolated from both sides'
internals.**

### Levels: ordering a system

"Level" means distance from the inputs and outputs of the system. The **highest-level** policy is the
one **furthest** from I/O — the core business rules that would be true regardless of how the program is
delivered. The **lowest-level** code is closest to I/O — the keyboard, the screen, the disk, the network.
The Dependency Rule simply says: **lower levels depend on higher levels, never the reverse.**

```text
higher level  ├─ Entities      (enterprise rules)          least likely to change
              ├─ Use Cases     (application rules)
              ├─ Adapters      (controllers/presenters/gateways)
lower level   └─ Frameworks    (web, DB, UI, devices)       most likely to change
```

# Key Terminology

- **The Dependency Rule** — source-code dependencies may point only inward, toward higher-level policy.
- **Flow of control** — the order in which code actually executes/calls at run time; independent of source-code dependency direction.
- **Boundary** — a line between two layers/components across which dependencies are controlled.
- **Output port / input port** — an interface (owned by the inner layer) through which control crosses a boundary while dependencies still point inward.
- **DTO (Data Transfer Object)** — a simple data structure used to carry data across a boundary.
- **Level** — a module's distance from the system's inputs and outputs; higher = further from I/O.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Inner needs an outer service | Import the outer class | Define an interface inward, implement outward (DIP) | Always choose the interface to preserve inward dependencies; the direct import breaks the rule. |
| Returning data to the UI | Return the entity | Return a DTO/response model | Return a DTO so outer code doesn't bind to entity internals. |
| Reading from the DB | Hand the ORM row to the use case | Map the row to a domain object at the gateway | Map at the boundary so the use case never knows the ORM. |

# Worked Example

Decide if each import is legal under the Dependency Rule:

```text
1. entities/Money.ts        imports  usecases/PlaceOrder.ts     → ILLEGAL (inner → outer)
2. usecases/PlaceOrder.ts   imports  entities/Money.ts          → legal   (outer → inner)
3. usecases/PlaceOrder.ts   imports  adapters/HttpController.ts → ILLEGAL (inner → outer)
4. adapters/PostgresRepo.ts imports  usecases/OrderRepository.ts (interface) → legal (outer → inner)
5. entities/Money.ts        imports  pg (Postgres driver)       → ILLEGAL (inner → framework)
```

Every "legal" arrow points inward; every "illegal" one points outward. Case 4 is DIP in action: the
outer repo depends inward on an interface the use-case layer owns.

# Real World Analogy

Think of a **secured building** with nested zones: lobby (outer), offices (middle), and a vault (inner).
Security clearance flows one way: vault staff may walk out to the lobby, but lobby visitors may never
walk into the vault. That's the *dependency* direction. Yet a *request* can travel the other way — a
lobby visitor drops a form in a slot (an interface) that vault staff choose to act on. The visitor never
enters the vault; they hand data through a controlled opening. Control crosses inward through the slot;
trust (dependency) still only flows outward.

# Examples

## Example 1 — Basic: legal or not?

A `PricingRule` entity imports the JSON config-parsing library to read a config file. Legal? Answer:
**No** — the entity (innermost) now depends on an outer framework/detail. Move config reading to an outer
adapter and pass the parsed values in.

**Why this works:** the entity mentioning a library is a source-code dependency pointing outward, which
the rule forbids.

## Example 2 — Real-world: control out, dependency in

A "generate invoice" use case must send an email at the end. It calls an `EmailSender` **interface** it
owns; an outer `SesEmailSender` implements it. At runtime control flows out to Amazon SES; in source,
SES depends inward on the interface. The use case has no idea SES exists.

**Why this works:** the output port lets control cross outward while the dependency stays inward — the
Dependency Rule holds.

## Example 3 — Pitfall: leaking the ORM inward

A gateway hands the raw ORM `UserRow` object straight into the use case "to save mapping code." Now the
use case references ORM-specific fields and lazy-loading behavior. When the team swaps ORMs, the use
cases break.

**Why this bites:** a detail (the ORM object) crossed the boundary unconverted, so the inner layer ended
up depending on an outer detail.

# Common Mistakes

- **Confusing the rule with flow of control.** "But the use case calls the presenter!" — calling outward
  is fine; *importing* outward is not.
- **Passing entities or ORM objects across boundaries.** Convert to DTOs at the edge.
- **Sneaking an outer import into an inner module** "just this once" for a type or a helper.
- **Thinking the rule is about folders.** It's about *dependencies*; folders just make them visible.

# Best Practices

- Treat every `import` as a **direction check**: is this arrow pointing inward?
- When an inner module needs an outer capability, **define an interface inward** and implement it outward.
- Cross boundaries with **simple data structures**, converting at the edge.
- Keep the **highest-level policy** free of any mention of I/O, frameworks, or delivery mechanisms.

# Summary

- The **Dependency Rule**: source-code dependencies point only inward; an inner circle may not mention
  anything in an outer circle.
- It governs **source-code dependencies**, not the **flow of control** — the two often point opposite
  ways, reconciled by **ports** (interfaces the inner layer owns).
- Data crossing a boundary must be a **simple structure (DTO)** — never an entity or a database/ORM
  object.
- **Levels** order the system by distance from I/O; lower levels depend on higher, never the reverse.

# Flash Cards

Q: State the Dependency Rule as a check on imports.
A: An inner module may not import or mention anything from an outer module; source-code dependencies may point only inward, toward higher-level policy.

Q: How can a use case "call" a presenter without violating the Dependency Rule?
A: It calls through an output port — an interface the use case owns — which the presenter implements. Control flows outward while the source-code dependency points inward.

Q: The Dependency Rule constrains which kind of dependency?
A: Source-code (compile-time) dependencies — what imports/mentions what. It does not constrain the runtime flow of control.

Q: In what form should data cross a boundary?
A: As a simple data structure (a DTO / request or response model), never as an entity or a database/ORM object.

Q: Which code is "highest level" in Clean Architecture?
A: The code furthest from inputs and outputs — the core entities and business rules that don't depend on how the program is delivered.

Q: Why is passing a raw ORM row into a use case a violation?
A: The use case would then depend on the ORM (an outer detail), so a source-code dependency would point outward — breaking the Dependency Rule.

# Exercises

### Easy
Write three `import` statements from a project (or invent them) and label each **inward** (legal) or
**outward** (illegal) under the Dependency Rule.

### Medium
Sketch a use case that needs to write to a file. Show the interface it owns, the outer class that
implements it, and draw both the runtime control arrow and the source-code dependency arrow, confirming
they point opposite ways.

### Challenging
Find a place where an entity or use case in a codebase imports something from an outer layer (a
framework, a DB client, a controller). Describe the interface you'd introduce to make the dependency
point inward, and what DTO you'd use to cross the boundary.

# Further Reading

- Robert C. Martin — *The Clean Architecture* (2012), "The Dependency Rule": <https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html>
- Robert C. Martin — *Clean Architecture* (2017), ch. 22: "The Clean Architecture" and ch. 11 on DIP
- Alistair Cockburn — *Hexagonal Architecture*: <https://alistair.cockburn.us/hexagonal-architecture/>
- Martin Fowler — *DataTransferObject*: <https://martinfowler.com/eaaCatalog/dataTransferObject.html>
