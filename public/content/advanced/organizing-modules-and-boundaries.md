---
id: lesson-19
slug: organizing-modules-and-boundaries
title: "Organizing Modules and Boundaries"
level: advanced
order: 19
duration: 22
tags:
  - modules
  - packaging
  - enforcement
  - modular-monolith
  - boundaries
summary: "How boundaries actually take shape in a codebase — the packaging choices (by layer, feature, or component), the spectrum from a source-level boundary to a package to a separate service, and how to enforce the Dependency Rule with module systems and lint tools so boundaries don't quietly erode."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Compare packaging strategies: **by layer**, **by feature**, and **by component**.
- Describe the **spectrum of boundary strength**, from a source-level discipline to a separate service.
- **Enforce** the Dependency Rule with module systems and lint/architecture tools.
- Explain the **modular monolith** and why strong internal boundaries matter without microservices.

# Why It Matters

A boundary that exists only in a diagram is a wish. Real boundaries live in how you **package** code and in
what **stops** a forbidden import from compiling or merging. Without enforcement, boundaries erode one
"just this once" import at a time until the architecture is gone. This lesson is about making boundaries
**real and durable**.

# Concept Explanation

### Three packaging strategies

- **Package by layer** — top-level folders are technical roles (`controllers/`, `usecases/`, `entities/`,
  `gateways/`). Simple, but scatters each feature and screams the framework (see the previous lesson).
- **Package by feature** — top-level folders are domain capabilities (`billing/`, `accounts/`). Cohesive
  and intent-revealing; you layer *within* each feature.
- **Package by component** (Simon Brown) — group each coarse-grained component behind a single public
  entry point, hiding its internals so other components can only use the intended interface. A middle
  ground that combines feature grouping with enforced encapsulation.

Most Clean Architecture codebases land on **by feature** or **by component** at the top, with the four
layers expressed *inside* a feature.

### The spectrum of boundary strength

A "boundary" isn't one thing — it's a **dial** from cheap-and-weak to expensive-and-strong:

```text
weaker / cheaper ─────────────────────────────────────────▶ stronger / costlier
 source-level      package/module        deployment           separate
 discipline        (compile-enforced)    component             service (process)
 (an interface,    (module can't be      (own build/jar,       (network call,
  a folder rule)    imported wrongly)     versioned)            independent deploy)
```

- **Source-level** — the boundary is just an interface plus a convention ("don't import infrastructure
  from domain"). Free, but only as strong as your discipline and tooling.
- **Package/module** — the language or build system makes a wrong import **fail to compile** (a module
  that doesn't export its internals). Stronger, still in one deployable.
- **Deployment component** — a separately built and versioned artifact; crossing it means depending on a
  released version.
- **Service** — a separate process reached over the network; the strongest and most expensive boundary
  (covered next lesson and in the services lesson).

Crucial point: **the same architectural boundary can be implemented anywhere on this dial.** You choose the
strength based on need — and you can **upgrade** a boundary later (source → module → service) as pressure
justifies. Don't reach for the strongest form by default; it's the most expensive.

### Enforcing the Dependency Rule

Discipline alone fails at scale. Make the rule mechanical:

- **Module systems / visibility** — export only a feature's public entry point; keep internals package-
  private or unexported so illegal imports don't even resolve.
- **Architecture/lint tools** — dependency linters check the import graph in CI: e.g. `dependency-cruiser`
  or ESLint boundary rules (JS/TS), **ArchUnit** (Java/Kotlin/.NET variants), import-linter (Python). You
  encode rules like "`domain` may not import `infrastructure`" and the build fails if violated.

```json
// dependency-cruiser (conceptual): forbid the domain importing outward.
{
  "forbidden": [
    {
      "name": "domain-stays-pure",
      "from": { "path": "^src/[^/]+/domain" },
      "to":   { "path": "^src/[^/]+/(web|infra|db)" }
    }
  ]
}
```

A rule like this turns the Dependency Rule from a hope into a **build failure**, which is the only kind of
rule that survives a busy team.

### The modular monolith

You do **not** need microservices to have boundaries. A **modular monolith** is a single deployable with
**strong internal boundaries** — features as modules that communicate only through published interfaces,
with the import graph enforced by tooling. You get most of the changeability benefits of separate services
with none of the network, deployment, and data-consistency costs. Many systems are best served by a well-
bounded monolith, upgrading specific boundaries to services only where a real force (scaling, team
autonomy, independent deploy) demands it.

# Key Terminology

- **Package by layer / feature / component** — organizing top-level code by technical role / domain capability / encapsulated component.
- **Boundary strength** — how strongly a boundary is enforced, from source convention to a separate service.
- **Module visibility** — language/build features that hide a component's internals so illegal imports won't compile.
- **Architecture/lint tool** — a checker (dependency-cruiser, ArchUnit, import-linter) that fails the build on forbidden dependencies.
- **Modular monolith** — a single deployable unit with strong, enforced internal module boundaries.
- **Boundary upgrade** — moving a boundary to a stronger form (source → module → service) as needs change.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Enforce the Dependency Rule | Team discipline / reviews | Automated lint/module rules | Automate it; discipline alone erodes. Reviews supplement, not replace, tooling. |
| Boundary form | Separate service now | Source/module boundary now | Start with the cheapest form that works; upgrade to a service only when a real force demands it. |
| Top-level packaging | By layer | By feature/component | Prefer feature/component for cohesion and intent; by-layer only for very small apps. |

# Worked Example

Encode and enforce one architectural rule end-to-end:

```text
Rule (words):   Nothing in a feature's `domain` or `usecases` may import from `web`, `db`, or `infra`.
Structure:      src/billing/{domain,usecases,web,db}/...   (package by feature, layered within)
Visibility:     each feature exports only src/billing/index.ts (its public port + factory)
CI check:       a dependency-cruiser rule fails the build if domain/usecases import web/db/infra
```

Now a developer who writes `import { pool } from '../db/pool'` inside a use case gets a **red build**, not a
subtle architectural erosion discovered months later.

# Real World Analogy

Think of **doors and locks** in a building. A drawn line on the floor plan ("staff only") is a source-level
convention — easily ignored. A **locked door** with a keycard is a module boundary — you *can't* get
through without authorization. A **separate building** across the street is a service boundary — strong
isolation, but now you need to cross the road, deal with weather, and carry things between sites.
Enforcement (locks, CI rules) is what turns a line on a plan into a boundary people actually respect.

# Examples

## Example 1 — Basic: which boundary form?

A team wants the domain isolated but ships one deployable and wants zero network overhead. Which boundary
form fits? Answer: a **package/module boundary** enforced by module visibility and a lint rule — strong
isolation, still in-process.

**Why this works:** it gives compile-time enforcement without the cost of a separate service, matching the
stated need.

## Example 2 — Real-world: the lint rule that saved the architecture

A growing team adds a CI dependency check. Over the next month it catches a dozen accidental
domain→infrastructure imports in pull requests. Each is fixed before merge, and the architecture stays
intact even as headcount doubles.

**Why this works:** automated enforcement made the Dependency Rule a build gate, so erosion couldn't
accumulate silently.

## Example 3 — Pitfall: premature services

A startup splits a small app into eight microservices "for clean boundaries." Now every feature spans
several services, local reasoning is gone, and a simple change requires coordinated deploys and distributed
debugging — far more cost than the boundaries were worth.

**Why this bites:** they jumped to the strongest, most expensive boundary form without a force that
required it; a modular monolith would have given the same isolation far more cheaply.

# Common Mistakes

- **Relying on discipline** instead of automated enforcement of the Dependency Rule.
- **Defaulting to services** for boundaries that a module could provide in-process.
- **Package-by-layer at the top,** scattering features and hiding intent.
- **No public entry point per module,** so other code reaches into internals freely.

# Best Practices

- Package **by feature/component**; express layers **within** each feature.
- Give each module a **single public entry point** and hide internals via visibility.
- **Enforce** the Dependency Rule in CI with a dependency/architecture linter.
- Start boundaries at the **cheapest effective form** and **upgrade** only when a real force appears.

# Summary

- Boundaries take shape through **packaging** (prefer by feature/component) and **enforcement**, not
  diagrams.
- Boundary **strength is a spectrum**: source discipline → module (compile-enforced) → deployment component
  → separate service, each stronger and costlier; the same boundary can be implemented at any level and
  **upgraded** later.
- **Enforce** the Dependency Rule mechanically with module visibility and **architecture lint tools**, so it
  can't erode.
- A **modular monolith** delivers strong boundaries without the cost of microservices; go to services only
  when a real force demands it.

# Flash Cards

Q: Name the three packaging strategies and what each groups by.
A: Package by layer (technical role: controllers, models), package by feature (domain capability: billing, accounts), and package by component (encapsulated components with a single public entry point).

Q: Describe the spectrum of boundary strength.
A: From weak/cheap to strong/costly: a source-level convention/interface, a compile-enforced module, a separately deployed component, and a separate service over the network. The same boundary can be implemented at any level.

Q: How do you keep the Dependency Rule from eroding on a busy team?
A: Enforce it mechanically — hide module internals via visibility and add architecture/lint rules (e.g., dependency-cruiser, ArchUnit) that fail the build on forbidden imports; don't rely on discipline alone.

Q: What is a modular monolith?
A: A single deployable unit with strong, enforced internal module boundaries — features communicate only through published interfaces — giving much of the changeability of services without their network and deployment costs.

Q: Why not always use the strongest boundary form (a service)?
A: Services are the most expensive boundary (network calls, independent deploys, distributed data). Use the cheapest form that meets the need and upgrade only when a real force (scaling, team autonomy) requires it.

Q: What does "package by component" add over "package by feature"?
A: It hides each component's internals behind a single public entry point, so other components can only use the intended interface — enforced encapsulation on top of feature grouping.

# Exercises

### Easy
Describe how your current project is packaged (by layer, feature, or component) and what — if anything —
stops a forbidden import today.

### Medium
Write one architectural rule in words for a codebase (e.g., "usecases must not import web"), then sketch how
you'd enforce it: module visibility, a lint rule, or both.

### Challenging
Take a small system and design it as a modular monolith: define 2–3 feature modules, each with a single
public entry point, and specify the CI checks that would keep the Dependency Rule intact. Note which
boundary you'd upgrade to a service first, and what force would justify it.

# Further Reading

- Robert C. Martin — *Clean Architecture* (2017), ch. 17 "Boundaries" and ch. 32 "Frameworks Are Details" / ch. 34 (the "Missing Chapter" by Simon Brown on packaging)
- Simon Brown — *Modular Monoliths* and *Package by component*: <https://www.codingthearchitecture.com/2015/03/08/package_by_component_and_architecturally_aligned_testing.html>
- dependency-cruiser (JS/TS): <https://github.com/sverweij/dependency-cruiser> · ArchUnit (JVM): <https://www.archunit.org/>
- Martin Fowler — *MonolithFirst*: <https://martinfowler.com/bliki/MonolithFirst.html>
