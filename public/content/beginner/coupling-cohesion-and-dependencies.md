---
id: lesson-03
slug: coupling-cohesion-and-dependencies
title: "Coupling, Cohesion, and Dependencies"
level: beginner
order: 3
duration: 20
tags:
  - coupling
  - cohesion
  - dependencies
  - direction
  - foundations
summary: "The vocabulary the rest of the course rests on — what a dependency is (and why source-code dependencies differ from runtime calls), tight versus loose coupling, high versus low cohesion, stable versus volatile modules, and why the direction of dependencies is the single most important thing architecture controls."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Define a **dependency** and distinguish a **source-code (compile-time)** dependency from a **runtime**
  call.
- Explain **coupling** (tight vs loose) and **cohesion** (high vs low) and why you want low coupling and
  high cohesion.
- Describe **incoming** and **outgoing** dependencies and what makes a module **stable** or **volatile**.
- Explain why the **direction** of a dependency is the thing architecture most cares about.

# Why It Matters

Every architectural rule in this course — the Dependency Rule, dependency inversion, boundaries — is
really a rule about **dependencies**: who is allowed to know about whom, and in which direction. If the
words *dependency*, *coupling*, and *cohesion* are fuzzy, everything built on them stays fuzzy. Nail
these down now and the rest of the course clicks into place.

# Concept Explanation

### What a dependency is

A module **A depends on** module B if A needs B to compile or run — A mentions B's name, imports it,
calls it, or uses its types. Dependencies are the arrows in every architecture diagram.

A crucial distinction:

- A **source-code dependency** is what your code *mentions*: an `import`, a type annotation, a class it
  extends. It's fixed at compile time.
- A **runtime dependency (flow of control)** is which code actually *calls* which at run time.

These usually point the same way — but architecture's best trick is making them point in **opposite**
directions (you'll see how in the Dependency Inversion lesson). For now, just hold the two ideas apart:
"A imports B" is not the same statement as "A calls B."

### Coupling: how tangled two things are

**Coupling** measures how much one module depends on the internals of another.

- **Tight coupling** — module A reaches into B's details, so a change in B tends to break A. Hard to
  change, hard to test in isolation, hard to reuse.
- **Loose coupling** — A depends only on a small, stable contract of B (ideally an interface), so B's
  internals can change freely.

```typescript
// Tight coupling: OrderService reaches straight into a concrete emailer.
class SmtpMailer {
  sendViaSmtp(to: string, body: string) {/* ... */}
}
class OrderService {
  private mailer = new SmtpMailer(); // knows the exact class and its method
  confirm(order: Order) {
    this.mailer.sendViaSmtp(order.email, 'Confirmed'); // change SmtpMailer → change here
  }
}
```

```typescript
// Loose coupling: OrderService depends on a small contract, not a concrete class.
interface Mailer {
  send(to: string, body: string): void;
}
class OrderService {
  constructor(private readonly mailer: Mailer) {} // any Mailer will do
  confirm(order: Order) {
    this.mailer.send(order.email, 'Confirmed');
  }
}
```

The second `OrderService` doesn't know or care whether email goes over SMTP, a cloud API, or a test
fake. That is loose coupling.

### Cohesion: how well a module's parts belong together

**Cohesion** measures how strongly the elements *inside* a module belong together.

- **High cohesion** — everything in the module serves one clear purpose (an `Invoice` module that only
  handles invoices). Easy to understand, name, and change.
- **Low cohesion** — a grab-bag `Utils` module of unrelated helpers. Hard to reason about; changes for
  many unrelated reasons.

The rule of thumb: **things that change together should live together; things that change for different
reasons should be kept apart.** Good design is **low coupling, high cohesion**.

### Incoming, outgoing, stable, and volatile

Look at a module and count its dependency arrows:

- **Outgoing (efferent)** dependencies — modules it depends on.
- **Incoming (afferent)** dependencies — modules that depend on it.

A module with **many incoming** dependencies is **stable**: lots of code relies on it, so changing it
is expensive and disruptive — you don't want to change it often. A module with **few incoming and many
outgoing** dependencies is **volatile**: easy to change because little depends on it.

The healthy arrangement is that **stable modules are also abstract** (interfaces, policies) and
**volatile modules are concrete** (a specific database driver). You want your code to **depend in the
direction of stability** — volatile details depending on stable policy, never the reverse.

### Direction is everything

Two modules can have the *same* coupling but very different consequences depending on which way the
arrow points. Architecture is largely the art of controlling the **direction** of source-code
dependencies so that volatile details point at stable policy — and never the other way around. That
single idea becomes the Dependency Rule.

# Key Terminology

- **Dependency** — a relationship where one module needs another to compile or run.
- **Source-code dependency** — what your code mentions/imports (compile-time); the arrows architecture governs.
- **Runtime dependency (flow of control)** — which code calls which at run time.
- **Coupling** — how much one module relies on another's details; you want it *loose*.
- **Cohesion** — how well the parts inside a module belong together; you want it *high*.
- **Afferent / efferent coupling** — incoming dependencies (things that depend on you) / outgoing (things you depend on).
- **Stable / volatile** — hard-to-change because much depends on it / easy-to-change because little does.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Depend on a class | Concrete class directly | An interface it implements | Use an interface across boundaries or where the concrete part is volatile; direct is fine within a cohesive module. |
| Grouping code | By technical kind (all controllers, all models) | By feature/reason-to-change | Group by reason-to-change for cohesion; purely technical grouping scatters related changes. |
| A big shared "utils" module | Keep one catch-all | Split into cohesive modules | Split when it changes for many unrelated reasons; a tiny stable helper set can stay. |

# Worked Example

Trace the dependency direction in the loose-coupling example above:

```text
OrderService ───▶ Mailer (interface)     ◀─── SmtpMailer (implements)
   (policy)          (contract)                    (detail)

Source-code arrows: OrderService → Mailer,  SmtpMailer → Mailer
Runtime call:       OrderService → SmtpMailer (via the interface)
```

Notice the *detail* (`SmtpMailer`) depends on the *contract* (`Mailer`), and so does the *policy*
(`OrderService`). No arrow points from policy to detail. At runtime `OrderService` still causes
`SmtpMailer` to run — the call flows one way while the source dependency points the other. Holding those
two apart is the whole game.

# Real World Analogy

A wall **power socket** is a contract. Your laptop charger depends on the socket's shape; so does the
building's wiring. Neither the charger nor the wiring depends on the *other* — they meet at the socket.
That's loose coupling through a stable interface. A device soldered directly into the building's wiring
(tight coupling) can't be unplugged without an electrician. **Cohesion** is keeping all the kitchen
outlets on one clearly-labeled circuit instead of scattering them randomly across the fuse box.

# Examples

## Example 1 — Basic: spotting the tighter coupling

Which is more tightly coupled? (a) `Report` imports a `Clock` interface and calls `clock.now()`; (b)
`Report` calls `Date.now()` directly and formats with a specific library's private helper. Answer: (b)
— it's bound to concrete details it can't swap or fake in a test.

**Why this works:** coupling is about depending on *changeable details*; (a) depends on a small stable
contract instead.

## Example 2 — Real-world: cohesion saves a change

An `Invoicing` module contains only invoice rules; a tax-rule change touches that one module and its
tests. In a sibling system the same logic is smeared across three controllers and a "helpers" file, so
the same change is a scavenger hunt.

**Why this works:** high cohesion made the code that changes together live together, so the change
stayed local.

## Example 3 — Pitfall: the wrong direction

A team makes their `Domain` module import their `Postgres` module "just to reuse a type." Now the
business rules can't compile without the database driver, and the DB — the most volatile part — sits
*below* the policy in the dependency graph.

**Why this bites:** the dependency points from stable policy toward a volatile detail, so the detail can
no longer be swapped or deferred — the exact thing architecture is supposed to prevent.

# Common Mistakes

- **Confusing "A calls B" with "A depends on B in source."** They often differ, and the difference is
  where architecture lives.
- **Chasing low coupling while ignoring cohesion (or vice versa).** You want both: loose coupling *and*
  high cohesion.
- **Grouping code by technical type only.** "All controllers here, all models there" scatters things
  that change together.
- **Letting stable, widely-used modules depend on volatile ones.** Depend in the direction of stability.

# Best Practices

- Depend on **small, stable contracts** (interfaces) across boundaries, not on concrete details.
- Keep modules **cohesive**: one clear reason to change each.
- Watch the **direction** of every dependency; make details point at policy.
- Treat a growing pile of **incoming** dependencies as a signal to keep a module stable and abstract.

# Summary

- A **dependency** is one module needing another; **source-code** dependencies (what you import) are
  distinct from **runtime** calls, and they need not point the same way.
- **Coupling** is how tangled two modules are (want it loose); **cohesion** is how well a module's parts
  belong together (want it high).
- Modules with many **incoming** dependencies are **stable**; those with few are **volatile**. Depend in
  the direction of **stability**.
- Architecture is mostly about controlling the **direction** of dependencies — the seed of the
  Dependency Rule.

# Flash Cards

Q: What is the difference between a source-code dependency and a runtime dependency?
A: A source-code dependency is what your code mentions/imports at compile time; a runtime dependency is which code actually calls which at run time. They can point in opposite directions.

Q: Define loose coupling.
A: A module depends only on a small, stable contract (like an interface) of another, so the other's internals can change without breaking it.

Q: Define high cohesion.
A: The elements inside a module all serve one clear purpose and change for the same reasons, so the module is easy to understand and change.

Q: What makes a module "stable" versus "volatile"?
A: Stable modules have many incoming dependencies (much relies on them, so they're costly to change); volatile modules have few, so they're easy to change.

Q: In a healthy design, which way should dependencies point — toward stability or toward volatility?
A: Toward stability: volatile, concrete details should depend on stable, abstract policy, never the other way around.

Q: What single design guideline captures both coupling and cohesion?
A: Things that change together should live together (cohesion); things that change for different reasons should be kept loosely connected (coupling).

# Exercises

### Easy
Pick a class in your code. List its **outgoing** dependencies (what it imports/uses) and, as best you
can tell, its **incoming** ones (what uses it). Is it more stable or more volatile?

### Medium
Find a tightly coupled spot where a class constructs a concrete collaborator with `new`. Rewrite it (on
paper or in code) to depend on an interface passed into the constructor, and note what you could now
swap or fake.

### Challenging
Open a "utils" or "helpers" module in a project. Judge its cohesion: how many *different reasons to
change* does it have? Propose how you'd split it into cohesive modules, and identify one dependency
whose direction you'd reverse.

# Further Reading

- Robert C. Martin — *Clean Architecture* (2017), Part V: "Component Coupling" (stable/volatile, Ca/Ce)
- Martin Fowler — *ReducingCoupling*: <https://martinfowler.com/articles/reducing-coupling.html>
- Martin Fowler — *BeckDesignRules* (on cohesion and duplication): <https://martinfowler.com/bliki/BeckDesignRules.html>
- Robert C. Martin — *The Clean Architecture* (2012): <https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html>
