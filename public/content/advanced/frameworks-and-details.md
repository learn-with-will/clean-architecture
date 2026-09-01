---
id: lesson-22
slug: frameworks-and-details
title: "Frameworks and Databases as Details"
level: advanced
order: 22
duration: 20
tags:
  - frameworks
  - details
  - coupling
  - dont-marry-the-framework
  - edge
summary: "Why frameworks, databases, and the web are details to keep at the edge — the asymmetric bargain a framework offers, the risks of coupling your core to it, the strategy of using a framework from the outer ring behind your own abstractions, and how to couple knowingly when you must."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain why **frameworks are details**, not architectures.
- Describe the **asymmetric bargain** a framework offers and its risks.
- Keep a framework **at the edge**, behind your own abstractions.
- Decide **when to couple** to a framework knowingly and how to limit the blast radius.

# Why It Matters

Frameworks are enormously useful — they save you from re-implementing routing, ORMs, serialization, DI, and
more. But they're also the single biggest source of coupling in most codebases, because they *invite* you to
build your whole application inside them. Clean Architecture's stance — **"frameworks are tools, not
architectures; don't marry the framework"** — is about keeping that usefulness without letting the framework
become the shape of your system.

# Concept Explanation

### A framework is a detail

In Clean Architecture's rings, frameworks live in the **outermost** circle with the database, the web, and
the UI. They are **delivery mechanisms and tools** — how your program talks to the world — not the business
value it provides. The database is a detail (you saw that in the persistence lesson); the web is a detail;
the framework is a detail. The core of your system — entities and use cases — should not depend on any of
them.

### The asymmetric bargain

When you adopt a framework, you enter a relationship that is **not** balanced:

- **You commit heavily to the framework.** You inherit from its base classes, sprinkle its annotations
  through your code, structure your app the way it expects, and organize around its conventions.
- **The framework does not commit to you.** Its authors solved *their* problem, for many users; they will
  make breaking changes, deprecate features, and evolve on their schedule, not yours.

Martin calls this an **asymmetric marriage**: you take on all the risk. If the framework's assumptions leak
into your entities and use cases, then a framework upgrade, a security change, or a migration reaches all the
way into your business rules — the most valuable, most stable code — which is exactly what you never want.

### Keep the framework at the edge

The strategy is not "avoid frameworks" — it's **use the framework from the outer ring, behind your own
abstractions.** Concretely:

- Let controllers, gateways, and Main **use** the framework; keep entities and use cases free of it.
- Where the framework offers a capability your core needs (sending mail, scheduling, caching), define **your
  own interface** for that capability and implement it with the framework in an adapter. Your core depends on
  *your* interface, not the framework's types.
- **Don't inherit** your entities from framework base classes, and don't decorate them with framework
  annotations — that drags the framework into the core.

```typescript
// Core owns a small interface; the framework is hidden in an adapter.
interface Clock { now(): Date; }                 // core depends on this
class SystemClock implements Clock { now() { return new Date(); } }   // edge/adapter
// A framework-based scheduler, cache, or mailer is wrapped the same way:
interface Cache { get(k: string): string | null; set(k: string, v: string): void; }
class RedisCache implements Cache { /* framework/library used only here */ }
```

Now the framework is a **plugin** to your application, not the platform your application is built inside.

### Couple knowingly when you must

Sometimes full isolation isn't worth it — a framework is so central (a UI framework, say) that wrapping every
feature would be pure ceremony. That's a legitimate choice, but make it **deliberately**:

- Couple to the framework **at the edge**, where the code is already a detail (controllers, view components),
  not in entities or use cases.
- Keep the **business rules reachable** without the framework, so they can still be tested and reused.
- Accept the coupling **with open eyes**, knowing the cost you're taking on, rather than letting it happen by
  default everywhere.

The goal isn't zero coupling; it's **coupling confined to the outer ring**, where change is expected and
cheap.

# Key Terminology

- **Framework** — a tool/delivery mechanism (web, ORM, DI, UI library) that lives in the outer ring; a detail.
- **Asymmetric marriage** — the imbalanced bargain where you commit to a framework but it doesn't commit to you.
- **Don't marry the framework** — keep the framework at arm's length so it can't dictate or invade your core.
- **Wrapping / adapter** — hiding a framework capability behind your own interface so the core depends on your abstraction.
- **Plugin architecture** — treating frameworks, DBs, and UIs as plugins to your business rules, not the platform.
- **Blast radius** — how far a change (like a framework upgrade) can reach into your code.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Using a framework feature in the core | Call the framework directly | Wrap it behind your own interface | Wrap volatile/central features so the core depends on your abstraction; direct is fine for truly stable, trivial ones. |
| Entities and framework | Inherit base classes / annotate | Keep entities plain | Keep entities plain and framework-free; annotations/inheritance drag the framework into the core. |
| A very central framework (e.g., UI) | Wrap everything | Couple knowingly at the edge | Wrapping everything can be ceremony; coupling at the edge deliberately is fine if business rules stay reachable. |

# Worked Example

Confine a framework's blast radius. Your core needs scheduled jobs, and your framework provides a scheduler:

```text
Wrong:   Use case imports the framework's Scheduler and its annotations directly.
         → a framework upgrade or swap changes the use case.

Right:   Core defines  interface JobScheduler { schedule(job: Job, at: Date): void }
         Adapter       class FrameworkScheduler implements JobScheduler { /* framework here */ }
         Wiring        composition root injects FrameworkScheduler where JobScheduler is needed.
         → swapping the framework touches only FrameworkScheduler.
```

The capability the core wanted (scheduling) is expressed as *its own* interface; the framework is a
replaceable plugin behind it.

# Real World Analogy

A framework is like building your house around a specific brand of **prefab wall system**. Used well, it's a
huge time-saver — you snap in walls instead of laying every brick. Used badly, you bolt the plumbing,
wiring, and even the foundation to that one vendor's proprietary panels. When the vendor discontinues the
line or changes the connectors (they don't consult you — the marriage is asymmetric), you're trapped. The
wise builder uses the panels for the **walls** (the edge) but keeps the foundation and utilities on
**standard interfaces**, so a new vendor can be swapped in.

# Examples

## Example 1 — Basic: where may framework code appear?

Is it OK for a controller to use the web framework's request object? What about an entity using an ORM base
class? Answer: the **controller** may use the framework (it's an edge adapter); the **entity must not**
inherit an ORM base class — that pulls the framework into the core.

**Why this works:** frameworks belong in the outer ring; using them in adapters is expected, but invading
entities violates the Dependency Rule.

## Example 2 — Real-world: surviving a major upgrade

A team wrapped their mailer, cache, and scheduler behind core interfaces. When the underlying libraries
released breaking major versions, only three adapter classes changed; entities and use cases — and their
tests — were untouched.

**Why this works:** the framework's blast radius was confined to adapters, so upgrades couldn't reach the
core.

## Example 3 — Pitfall: the framework in the veins

Another team annotated entities with ORM and serialization decorators and extended framework base classes
throughout the domain. A required framework migration forced edits to nearly every business class, took
months, and introduced regressions in core rules.

**Why this bites:** the framework had married the core, so its change propagated straight into the most
valuable code — the exact failure "don't marry the framework" warns against.

# Common Mistakes

- **Building the whole app *inside* the framework,** so it becomes the architecture.
- **Annotating or subclassing entities with framework types,** dragging it into the core.
- **Depending on framework types in use cases** instead of your own interfaces.
- **Coupling to a framework by default** rather than as a deliberate, edge-confined choice.

# Best Practices

- Treat frameworks, databases, and the web as **plugins** to your business rules.
- Keep **entities and use cases framework-free**; use frameworks in **adapters and Main**.
- **Wrap** framework capabilities the core needs behind **your own interfaces**.
- When you must couple, do it **knowingly, at the edge**, keeping business rules reachable and testable.

# Summary

- **Frameworks (and databases and the web) are details** in the outer ring — tools and delivery mechanisms,
  not your architecture.
- A framework is an **asymmetric marriage**: you commit to it, it doesn't commit to you, so keeping it out of
  the core protects your most valuable code.
- Use frameworks **from the edge, behind your own abstractions**, so they remain replaceable **plugins**.
- Full isolation isn't always worth it — when you couple, do so **deliberately and at the edge**, keeping
  business rules framework-free and testable.

# Flash Cards

Q: In Clean Architecture, what kind of thing is a framework?
A: A detail — a tool and delivery mechanism in the outermost ring, like the database and the web. It is not the architecture, and the core must not depend on it.

Q: What is the "asymmetric marriage" with a framework?
A: You commit heavily to the framework (inheriting, annotating, structuring around it), but the framework doesn't commit to you — its authors change and deprecate it on their schedule, so you carry all the risk.

Q: How should the core use a framework capability it needs (e.g., caching)?
A: Define your own interface for the capability and implement it with the framework in an adapter, so the core depends on your abstraction, not the framework's types.

Q: Why must entities not inherit framework base classes or carry framework annotations?
A: Doing so drags the framework into the innermost layer, so a framework change reaches your most valuable, most stable code — violating the Dependency Rule.

Q: Does "don't marry the framework" mean avoid frameworks?
A: No. Use frameworks — but from the outer ring, behind your own abstractions, so they stay replaceable plugins rather than the platform your app is built inside.

Q: What does it mean to couple to a framework "knowingly"?
A: To couple deliberately and only at the edge (controllers, view components), accepting the cost with open eyes while keeping business rules framework-free and testable.

# Exercises

### Easy
List the frameworks/libraries a project you know depends on. For each, note whether it appears in the core
(entities/use cases) or only at the edge (adapters/Main).

### Medium
Pick one framework capability your core currently calls directly (mail, cache, scheduler, HTTP). Define an
interface the core would own for it and describe the adapter that wraps the framework.

### Challenging
Find an entity or use case coupled to a framework (base class, annotation, or type). Refactor on paper to
remove that coupling, and estimate the blast radius of a future framework upgrade before and after your
change.

# Further Reading

- Robert C. Martin — *Clean Architecture* (2017), ch. 32 "Frameworks Are Details" (and ch. 30–31 on the database and the web)
- Robert C. Martin — *The Clean Architecture* (2012): <https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html>
- Martin Fowler — *InversionOfControl*: <https://martinfowler.com/bliki/InversionOfControl.html>
- Alistair Cockburn — *Hexagonal Architecture*: <https://alistair.cockburn.us/hexagonal-architecture/>
