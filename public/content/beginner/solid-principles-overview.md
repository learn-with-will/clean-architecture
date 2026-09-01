---
id: lesson-04
slug: solid-principles-overview
title: "The SOLID Principles"
level: beginner
order: 4
duration: 20
tags:
  - solid
  - srp
  - ocp
  - lsp
  - principles
summary: "A beginner's tour of the five SOLID principles that underpin Clean Architecture — Single Responsibility (one reason to change), Open-Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion — with correct attributions and the common misreadings to avoid, especially of SRP."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Name the five **SOLID** principles and what each acronym letter stands for.
- State each principle correctly — especially **SRP**, which is widely misquoted.
- Attribute **LSP** to Barbara Liskov and know where SOLID comes from.
- Explain why SOLID is the class-level groundwork that Clean Architecture builds on.

# Why It Matters

Clean Architecture's layers and boundaries don't appear out of nowhere — they are the SOLID principles
applied at a larger scale. **SOLID** is a set of five guidelines (assembled and named by Robert C.
Martin, drawing on work by Barbara Liskov, Bertrand Meyer, and others) for arranging functions and
classes so software is easier to change. If you understand SOLID at the class level, the architecture
that follows will feel like the same ideas zoomed out.

# Concept Explanation

### S — Single Responsibility Principle (SRP)

The most **misquoted** principle. SRP is **not** "a function should do only one thing." Its real
statement: **a module should have one, and only one, reason to change** — it should be responsible to
**one actor** (one stakeholder or group whose needs drive changes).

If one class serves two actors — say, an `Employee` class whose `calculatePay()` is owned by Finance and
whose `reportHours()` is owned by HR — then a change requested by Finance can accidentally break HR's
feature. SRP says: separate code that different actors would ask to change.

### O — Open-Closed Principle (OCP)

Coined by Bertrand Meyer: software entities should be **open for extension but closed for
modification**. You should be able to add new behavior by adding new code, not by editing existing,
working code. In practice this means designing so new cases plug in behind an interface, rather than
adding another `if` branch to a function everyone depends on. OCP is the principle behind why
architectural boundaries let you extend a system without disturbing its core.

### L — Liskov Substitution Principle (LSP)

Named for **Barbara Liskov** (from her 1987 work on data abstraction): subtypes must be **substitutable**
for their base types. If code works with a type `T`, it must keep working when handed any subtype of `T`
without knowing the difference. A `Square` that secretly breaks the contract of `Rectangle` (setting the
width also changes the height) violates LSP and will surprise callers. LSP is what makes it safe to
depend on an interface and accept *any* implementation.

### I — Interface Segregation Principle (ISP)

**Don't force clients to depend on methods they don't use.** Prefer several small, focused interfaces
over one fat interface. If a class only needs to `read()`, don't make it depend on a giant
`FileSystem` interface that also declares `write()`, `chmod()`, and `delete()` — changes to those
unrelated methods would needlessly ripple to the reader.

### D — Dependency Inversion Principle (DIP)

The principle Clean Architecture leans on most: **depend on abstractions, not on concretions.** High-
level policy should not depend on low-level detail; both should depend on an abstraction (an interface).
This is what lets a business rule depend on a `Repository` interface while the database implements it
from the outside. DIP gets its own full lesson next — here, just register that it's the "D."

### Why SOLID underpins the architecture

Each SOLID letter scales up:

```text
SRP  →  separate components by the actors/reasons that change them
OCP  →  boundaries let you extend the system without modifying the core
LSP  →  you can swap any adapter behind a port safely
ISP  →  boundaries expose narrow, client-specific interfaces
DIP  →  source-code dependencies point inward, toward abstractions
```

The Dependency Rule you met in lesson 1 is essentially DIP + OCP applied to whole layers.

# Key Terminology

- **SOLID** — five class-level design principles (SRP, OCP, LSP, ISP, DIP) that make software easier to change.
- **Actor** — a stakeholder or group whose needs drive changes to a module; central to SRP.
- **Open for extension, closed for modification** — add behavior by adding code, not by editing working code (OCP).
- **Substitutability** — a subtype can stand in for its base type without breaking callers (LSP).
- **Fat interface** — an interface with more methods than any single client needs; ISP argues against it.
- **Abstraction / concretion** — an interface or policy vs a specific implementation/detail (DIP).

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| One class serving two teams | Keep it together | Split by actor (SRP) | Split when different actors request conflicting changes; keep together if truly one owner. |
| Adding a new variant | Edit the existing function | Add a new implementation behind an interface (OCP) | Prefer extension when variants will keep arriving; a one-off may not justify an interface. |
| Interface size | One broad interface | Several narrow ones (ISP) | Segregate when clients need different subsets; a small cohesive interface can stay whole. |

# Worked Example

An SRP fix, in miniature:

```typescript
// Violates SRP: one class answers to Finance (pay) AND HR (hours reporting).
class Employee {
  calculatePay() {/* Finance's rules */}
  reportHours() {/* HR's rules */}
  save() {/* DBA's concern */}
}
```

```typescript
// SRP-aligned: each responsibility answers to one actor and changes for one reason.
class PayCalculator { calculate(e: EmployeeData) {/* Finance */} }
class HoursReporter { report(e: EmployeeData) {/* HR */} }
class EmployeeRepository { save(e: EmployeeData) {/* persistence */} }
```

Now a change from Finance touches `PayCalculator` only — it can't accidentally break HR's report.

# Real World Analogy

SOLID is like the rules of a **well-run kitchen**. SRP: each station (grill, pastry, sauce) has one job
and one head who changes it. OCP: you add a new dish by adding a recipe card, not by rewriting the
existing ones. LSP: any line cook trained to the recipe can stand in without the diner noticing. ISP:
the dishwasher gets the dish-washing instructions, not the whole restaurant operations manual. DIP: the
menu (the abstraction) sits between diners and cooks, so either side can change without renegotiating
with the other.

# Examples

## Example 1 — Basic: naming the letter

Which principle is violated? A `PdfReport` subclass throws "not supported" for `getPageCount()` that its
`Report` base promises. Answer: **LSP** — the subtype isn't safely substitutable for the base.

**Why this works:** callers relying on `Report.getPageCount()` break when handed a `PdfReport`, which is
exactly the substitutability LSP protects.

## Example 2 — Real-world: OCP saves the core

A checkout supports one payment provider via a `PaymentGateway` interface. Adding a second provider
means writing a new class that implements the interface — the checkout code isn't touched. Six months
and four providers later, the core has never been reopened.

**Why this works:** new behavior arrived by *adding* code behind an abstraction, keeping the core closed
to modification.

## Example 3 — Pitfall: the fat interface

A `Repository` interface declares 20 methods. A read-only report screen only needs `findById`, but now
depends on `delete`, `bulkImport`, and more. A change to `bulkImport`'s signature forces the report
screen to recompile and re-test for no reason.

**Why this bites:** violating ISP couples clients to methods they never call, spreading unrelated changes
across the system.

# Common Mistakes

- **Misquoting SRP** as "do one thing." It's *one reason to change / one actor*.
- **Treating OCP as "never edit code."** You still edit code; OCP is about not modifying *stable,
  depended-on* code to add new variants.
- **Forgetting LSP's author.** The "L" is Barbara Liskov; attribute it.
- **Building fat interfaces** because "one interface is simpler." Simpler to declare, costlier to depend
  on.

# Best Practices

- Separate code by the **actor** that requests its changes (SRP).
- Design new variants to **plug in** behind an abstraction (OCP + DIP).
- Keep interfaces **narrow and client-specific** (ISP).
- Ensure every implementation truly **honors the contract** it claims (LSP).

# Summary

- **SOLID** = SRP, OCP, LSP, ISP, DIP — five principles for change-friendly code, assembled by Robert C.
  Martin.
- **SRP** is *one reason to change / responsible to one actor* — not "do one thing."
- **OCP** = open for extension, closed for modification; **LSP** (Barbara Liskov) = safe substitutability;
  **ISP** = no fat interfaces; **DIP** = depend on abstractions.
- Clean Architecture is these same principles applied to **whole components and layers**; the Dependency
  Rule is essentially DIP + OCP at scale.

# Flash Cards

Q: What does SRP actually state (not the common misquote)?
A: A module should have one reason to change — it should be responsible to a single actor/stakeholder. It is NOT "a function should do only one thing."

Q: State the Open-Closed Principle.
A: Software entities should be open for extension but closed for modification — add new behavior by adding code, not by editing existing, depended-on code.

Q: Who is the Liskov Substitution Principle named after, and what does it require?
A: Barbara Liskov. Subtypes must be substitutable for their base types, so code using the base keeps working with any subtype.

Q: What does the Interface Segregation Principle advise?
A: Don't force clients to depend on methods they don't use; prefer several small, focused interfaces over one fat interface.

Q: What does the Dependency Inversion Principle say?
A: High-level policy should not depend on low-level details; both should depend on abstractions (interfaces). Details depend on abstractions, not the reverse.

Q: How do the SOLID principles relate to Clean Architecture?
A: Clean Architecture applies them at the scale of components and layers; the Dependency Rule is essentially DIP and OCP applied across whole boundaries.

# Exercises

### Easy
Write the five SOLID letters and, from memory, one sentence for each. Then check them against this
lesson and correct any you got wrong (especially SRP).

### Medium
Find a class in your code that serves two different "actors" (e.g., business logic *and* persistence, or
two teams). Sketch how you'd split it so each part changes for one reason.

### Challenging
Locate an interface in a project with many methods. Identify a client that uses only a few of them.
Redesign the interfaces (ISP) so that client depends only on what it needs, and explain what future
change that would now isolate.

# Further Reading

- Robert C. Martin — *Clean Architecture* (2017), Part III: "Design Principles" (SRP, OCP, LSP, ISP, DIP)
- Robert C. Martin — *The Principles of OOD*: <https://blog.cleancoder.com/uncle-bob/2020/10/18/Solid-Relevance.html>
- Barbara Liskov — *Data Abstraction and Hierarchy* (1987 keynote), the origin of LSP
- Martin Fowler — *DesignStaminaHypothesis*: <https://martinfowler.com/bliki/DesignStaminaHypothesis.html>
