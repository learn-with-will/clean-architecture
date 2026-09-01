---
id: lesson-18
slug: component-principles
title: "Component Cohesion and Coupling"
level: advanced
order: 18
duration: 24
tags:
  - components
  - cohesion
  - coupling
  - stability
  - main-sequence
summary: "Scaling the design principles up to components — the three cohesion principles (REP, CCP, CRP) that decide which classes belong together, the three coupling principles (ADP, SDP, SAP) that govern dependencies between components, and the stability and abstractness metrics behind the Main Sequence."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Define a **component** and the three **cohesion** principles: **REP, CCP, CRP**.
- Explain the three **coupling** principles: **ADP, SDP, SAP**.
- Compute **instability (I)** and **abstractness (A)** and interpret the **Main Sequence**.
- Detect and break a **dependency cycle** between components.

# Why It Matters

At small scale you reason about classes; at large scale you reason about **components** — the jars, gems,
packages, or modules you build and release. The same forces (cohesion, coupling, stability) reappear, but
now with named principles and even metrics. These are the tools for keeping a big system's *macro*
structure sound, and they're a favorite source of precise-but-easily-muddled exam questions — so get the
acronyms exactly right.

# Concept Explanation

### What a component is

A **component** is a unit of **deployment/release** — the smallest thing you can build and ship
independently: a `.jar`, a `.dll`, a gem, an npm package, a Python wheel, or a well-isolated module. The
component principles are about *which classes belong in which component* and *how components may depend on
one another*.

### Cohesion: which classes belong together (REP, CCP, CRP)

- **REP — Reuse/Release Equivalence Principle.** *The granule of reuse is the granule of release.* Classes
  grouped into a component should be **releasable together** — versioned, with release notes — because
  people reuse *released* components, not loose classes.
- **CCP — Common Closure Principle.** *Gather classes that change for the same reasons and at the same
  times; separate those that change for different reasons.* This is the **SRP for components**: a component
  should ideally have **one reason to change**, so a given change touches as few components as possible.
- **CRP — Common Reuse Principle.** *Don't force users of a component to depend on things they don't need.*
  Classes that are used together belong together; those not reused together shouldn't be lumped in. This is
  the **ISP for components** — depending on a component means depending on **everything** in it, so don't
  pad it.

These pull against each other. REP and CCP are **inclusive** — they push components to be **larger** (group
more together). CRP is **exclusive** — it pushes components to be **smaller** (split unneeded things out).
Good component design **balances the tension**, and where you sit on it shifts as a project matures (early
on, favor CCP/developability; later, favor REP/reusability).

### Coupling: how components may depend on each other (ADP, SDP, SAP)

- **ADP — Acyclic Dependencies Principle.** *Allow no cycles in the component dependency graph.* The graph
  of components must be a **directed acyclic graph (DAG)**. Cycles create the "morning-after syndrome"
  where nothing builds because everything depends on everything. Break a cycle by applying **DIP** (invert
  one dependency with an interface) or by extracting a new component the cyclic pair both depend on.
- **SDP — Stable Dependencies Principle.** *Depend in the direction of stability.* A component should depend
  only on components **more stable than itself**. Stability is measured by **instability**:

  ```text
  I = fan-out / (fan-in + fan-out) = Ce / (Ca + Ce)
      Ca = afferent couplings  (classes outside that depend on this component)
      Ce = efferent couplings  (classes inside that depend on outside components)
  I = 0  → maximally stable   (much depends on it, it depends on nothing)
  I = 1  → maximally unstable (it depends on much, nothing depends on it)
  ```

  SDP says the I of a component should be **higher** than the I of the components it depends on — arrows run
  from unstable to stable.
- **SAP — Stable Abstractions Principle.** *A component's abstractness should be proportional to its
  stability.* Stable components (hard to change) should be **abstract** (interfaces/abstract classes) so
  they can still be *extended* without modification; unstable components should be **concrete**. Abstractness
  is measured as:

  ```text
  A = Na / Nc     (Na = number of abstract classes/interfaces, Nc = total classes)
  A = 0 → fully concrete,  A = 1 → fully abstract
  ```

  SDP + SAP together say: **stable ⇒ abstract, unstable ⇒ concrete.**

### The Main Sequence

Plot every component with **I** on one axis and **A** on the other. The healthy line is **A + I = 1**, the
**Main Sequence**. Two bad corners to avoid:

```text
 A 1 ┤ (0,1) Zone of            ● components ideally sit
     │        Uselessness         near the line A + I = 1
     │            ╲
     │              ╲  Main Sequence
     │                ╲
     │                  ╲
   0 ┤ (0,0) Zone of      ╲ (1,0)
     │        Pain          ╲
     └───────────────────────── I
        0                     1
```

- **Zone of Pain** (low A, low I): stable *and* concrete — rigid and hard to change, yet everything depends
  on it (e.g., a concrete utility everyone imports). Painful to modify.
- **Zone of Uselessness** (high A, high I): abstract *and* unstable — abstractions nobody depends on. Dead
  weight.

The **distance from the Main Sequence**, `D = |A + I − 1|`, is a metric: components far from the line are
worth a second look. Treat these as **heuristics and smells**, not laws — they point where to think, they
don't dictate.

# Key Terminology

- **Component** — a unit of deployment/release (jar, package, module) that the principles group and connect.
- **REP / CCP / CRP** — cohesion principles: release together / change together / reuse together.
- **ADP / SDP / SAP** — coupling principles: no cycles / depend toward stability / stable-means-abstract.
- **Instability (I)** — Ce / (Ca + Ce); 0 = maximally stable, 1 = maximally unstable.
- **Abstractness (A)** — Na / Nc; fraction of a component's classes that are abstract.
- **Main Sequence** — the line A + I = 1; the Zones of Pain and Uselessness are the corners to avoid.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Component size early vs late | Optimize reuse (REP) now | Optimize developability (CCP) now | Favor CCP early when the code churns; shift toward REP as things stabilize and reuse matters. |
| Breaking a cycle | Extract a shared component | Invert a dependency with DIP | DIP is lightest when one arrow is the problem; extract a component when both truly share concepts. |
| A stable, concrete "core utils" | Leave it | Add abstractions / split it | If it's in the Zone of Pain and changes hurt, introduce abstractions or split; leave truly frozen utilities alone. |

# Worked Example

Compute stability and check SDP. A `domain` component has `Ca = 12` (twelve outside classes depend on it)
and `Ce = 0` (it depends on nothing). A `web` component has `Ca = 0`, `Ce = 9`.

```text
domain:  I = 0 / (12 + 0) = 0.0   → maximally stable
web:     I = 9 / (0 + 9)  = 1.0   → maximally unstable
web → domain?  I(web)=1.0 > I(domain)=0.0  ✓ depends toward stability (SDP satisfied)
domain → web?  would be 0.0 → 1.0, from stable to unstable  ✗ SDP violated
```

The unstable `web` correctly depends on the stable `domain`, never the reverse — exactly the direction the
Dependency Rule already demanded, now quantified.

# Real World Analogy

Think of a supply chain. **Raw-material suppliers** (stable components) are depended on by many factories;
they change rarely and expose **standard specifications** (abstractions) so factories can build on them
safely. **Consumer products** (unstable components) depend on many suppliers, change constantly, and are
concrete. Trouble comes from **cycles** (two firms each waiting on the other's part — nothing ships) and
from a supplier that is both **critical and rigid** (a single concrete part everyone needs but no one can
modify — the Zone of Pain). Healthy chains flow from volatile products toward stable, standardized
suppliers.

# Examples

## Example 1 — Basic: compute I

A component depends on 3 external classes (Ce = 3) and is depended on by 1 (Ca = 1). What is its
instability? Answer: `I = 3 / (1 + 3) = 0.75` — fairly unstable, so it should be relatively concrete and
should depend only on more stable components.

**Why this works:** plugging Ca and Ce into `Ce / (Ca + Ce)` yields I directly, telling you which direction
its dependencies should run.

## Example 2 — Real-world: breaking a build cycle

`orders` depends on `billing`, and `billing` grows a dependency back on `orders`, creating a cycle so CI
can't build either alone. The team applies **DIP**: `billing` defines an interface for what it needs, and
`orders` implements it — the arrow inverts and the cycle is gone (ADP restored).

**Why this works:** inverting one dependency with an interface turns the cyclic graph back into a DAG
without merging the components.

## Example 3 — Pitfall: the Zone of Pain

A `common` package is concrete (A ≈ 0) and everything depends on it (I ≈ 0). Every small change to
`common` forces a rebuild and retest of the entire system, and it can't be extended without editing.

**Why this bites:** stable + concrete = rigid but universally depended upon; SAP says a component that
stable should be abstract, so it can be extended rather than modified.

# Common Mistakes

- **Swapping the acronyms.** CCP is SRP-for-components; CRP is ISP-for-components — keep them straight.
- **Allowing cycles** in the component graph and living with fragile builds.
- **Depending from stable to unstable,** so volatile components can break stable ones.
- **Treating the metrics as laws.** I, A, and D are heuristics that flag places to think, not verdicts.

# Best Practices

- Group classes by **common closure (CCP)** so a change hits few components; balance with REP and CRP.
- Keep the component dependency graph a **DAG (ADP)**; break cycles with **DIP** or a new component.
- Ensure dependencies run **toward stability (SDP)** and that stable components are **abstract (SAP)**.
- Use **I, A, and distance D** as smells to investigate outliers, not as targets to game.

# Summary

- A **component** is a unit of release; **REP/CCP/CRP** decide which classes belong in one (release
  together, change together, reuse together), trading larger vs smaller.
- **ADP/SDP/SAP** govern dependencies: **no cycles**, **depend toward stability**, and **stable ⇒ abstract**.
- **Instability I = Ce/(Ca+Ce)** and **abstractness A = Na/Nc**; healthy components sit near the **Main
  Sequence A + I = 1**, avoiding the Zones of Pain and Uselessness.
- Break cycles with **DIP**; treat the metrics as **heuristics**, not laws.

# Flash Cards

Q: What do the three component cohesion principles REP, CCP, and CRP say?
A: REP — the granule of reuse is the granule of release (releasable together). CCP — group classes that change for the same reasons (SRP for components). CRP — don't force clients to depend on classes they don't use (ISP for components).

Q: What does the Acyclic Dependencies Principle (ADP) require, and how do you fix a violation?
A: The component dependency graph must have no cycles (be a DAG). Break a cycle by inverting a dependency with DIP or by extracting a new component both depend on.

Q: State the formula for instability (I) and what its extremes mean.
A: I = Ce / (Ca + Ce), where Ce is outgoing and Ca is incoming coupling. I = 0 is maximally stable (much depends on it, it depends on nothing); I = 1 is maximally unstable.

Q: What do the Stable Dependencies and Stable Abstractions Principles say together?
A: SDP: depend in the direction of stability (toward lower-I components). SAP: a component's abstractness should match its stability — stable components should be abstract, unstable ones concrete.

Q: What is the Main Sequence, and what are the two zones to avoid?
A: The line A + I = 1. Avoid the Zone of Pain (stable and concrete — rigid but heavily depended on) and the Zone of Uselessness (abstract and unstable — abstractions nobody uses).

Q: Are the component metrics (I, A, D) hard rules?
A: No — they're heuristics that flag components worth examining (e.g., far from the Main Sequence), not laws to obey blindly.

# Exercises

### Easy
For a component/package you know, estimate Ca (things that depend on it) and Ce (things it depends on) and
compute I. Is it stable or unstable, and does that match its role?

### Medium
Draw the component dependency graph of a small project. Check for cycles (ADP) and for any arrow pointing
from a stable component to a less stable one (SDP). Propose a fix for one problem you find.

### Challenging
Pick a widely-depended-on, concrete "utils/common" component (likely Zone of Pain). Propose how to move it
toward the Main Sequence — which abstractions to introduce or how to split it — and predict which rebuilds
that would stop triggering.

# Further Reading

- Robert C. Martin — *Clean Architecture* (2017), Part IV: "Component Principles" (ch. 12–14)
- Robert C. Martin — *Agile Software Development, Principles, Patterns, and Practices* (2002), the origin of the component principles and metrics
- Robert C. Martin — *Granularity* (the OODCA metrics paper, 1996)
- Martin Fowler — *ReducingCoupling*: <https://martinfowler.com/articles/reducing-coupling.html>
