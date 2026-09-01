---
id: lesson-23
slug: pitfalls-and-tradeoffs
title: "Pitfalls and Trade-offs"
level: advanced
order: 23
duration: 22
tags:
  - anti-patterns
  - over-engineering
  - yagni
  - tradeoffs
  - judgment
summary: "An honest look at where Clean Architecture goes wrong in practice — over-abstraction and astronaut architecture, leaking entities and anemic use cases, mapping overhead, and treating the rules as dogma — plus when a simpler design is the right call and how to match architectural investment to a system's stakes."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Recognize the common **anti-patterns** teams fall into when applying Clean Architecture.
- Weigh the **costs** (indirection, mapping, ceremony) against the benefits.
- Decide **when a simpler design** is the better engineering choice.
- Apply the architecture as **judgment**, not dogma.

# Why It Matters

A tool applied without judgment causes as much harm as no tool at all. Teams that discover Clean
Architecture often swing from a tangled ball of mud to a cathedral of needless abstraction — and slow down
just as badly, now with more files. The trustworthy version of this material has to say plainly: Clean
Architecture has **costs**, it is sometimes the **wrong** choice, and its rules are heuristics to be applied
with taste.

# Concept Explanation

### The costs you're actually paying

Every boundary and abstraction buys independence at a price:

- **Indirection** — following a request now means hopping through a controller, an input port, an interactor,
  an output port, a presenter, and a gateway. More files, more jumps, a steeper first read.
- **Mapping overhead** — request models, response models, and entity↔row mapping are real code to write and
  maintain. It's the seam that lets layers evolve independently, but it isn't free.
- **Up-front effort** — designing boundaries takes time you could spend shipping behavior.

These costs are worth it when the system is **long-lived, complex, and likely to change**. They are dead
weight when it isn't. Naming the costs out loud is how you keep the trade-off honest.

### Anti-pattern: astronaut / over-abstraction

The most common failure is **over-abstraction** ("architecture astronauts"): an interface for every class,
layers around trivial CRUD, a factory for objects that never vary. Symptoms: **every interface has exactly
one implementation**, forever; a one-line change touches six files; new developers can't find where anything
actually happens.

This is a **YAGNI** violation. An interface earns its place when there's a *real* second implementation, a
*real* boundary to test across, or a *real* volatility to isolate — not on speculation. When in doubt, start
concrete and extract an abstraction the moment a second case appears.

### Anti-pattern: leaking entities across boundaries

To "avoid mapping," teams return entities straight to controllers or pass ORM rows into use cases. This
recouples the layers you worked to separate: the UI starts depending on entity internals, and the entity's
shape gets distorted by presentation or storage needs. The mapping you skipped was the point.

### Anti-pattern: anemic use cases and misplaced rules

Two mirror-image mistakes: **anemic use cases** that just forward calls to a gateway (no orchestration, no
value — a sign the boundary was pointless here), and use cases stuffed with **domain rules** that belong in
entities (so rules get duplicated across use cases). Keep general rules in **entities**, orchestration in
**use cases**, and don't wrap a pure CRUD passthrough in ceremony that adds nothing.

### Anti-pattern: dogma over judgment

Treating "always add a port," "never skip a layer," "one interactor per action" as **laws** produces
ceremony. Recall the partial-boundaries lesson: Martin himself says decide **which boundaries to implement
and which to ignore**. The rules are **heuristics** serving a goal (cheap change); when a rule stops serving
that goal in a given spot, the rule is wrong there, not the goal.

### When NOT to use full Clean Architecture

Simpler is sometimes better engineering:

- **Short-lived or throwaway** code (a script, a spike, a one-week experiment).
- **Simple CRUD** with little business logic — a thin framework-native app may be entirely appropriate; the
  Active Record style can be fine here.
- **Tiny apps** where the whole thing fits in your head and won't grow.
- **Uncertain, exploratory** products where you're still learning the domain — over-structuring locks in the
  wrong shape.

The counter-caution: the alternative to *some* structure is often the **Big Ball of Mud** (Foote & Yoder's
name for the haphazard, sprawl-of-everything system). The answer isn't "no architecture" — it's
**proportionate** architecture. Leave **seams** even in simple apps so you can add boundaries when the system
earns them.

### The goal, restated

The point was never "add layers." It's to **minimize the cost of change and keep options open**. If an
abstraction lowers the lifetime cost of change, keep it; if it only adds indirection, remove it. Measure your
design against that goal, not against how many boxes match the diagram.

# Key Terminology

- **Over-abstraction / astronaut architecture** — adding interfaces, layers, and indirection with no real need; a YAGNI violation.
- **Leaking entities** — passing entities or ORM rows across boundaries, recoupling layers.
- **Anemic use case** — a use case that only forwards to a gateway, adding a boundary with no value.
- **Big Ball of Mud** — a system with no discernible architecture; the failure mode of *too little* structure.
- **YAGNI** — "You Aren't Gonna Need It"; don't build on speculation.
- **Proportionate architecture** — matching architectural investment to the system's complexity, lifespan, and stakes.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| A CRUD screen with no rules | Full Clean stack | Framework-native / Active Record | Keep it simple when there's no real business logic; add structure if rules and longevity appear. |
| An interface with one implementation | Keep it "for flexibility" | Inline the concrete, extract later | Inline until a second implementation or a test boundary is real; extract on demand. |
| A short-lived spike | Architect it properly | Ship it plainly, plan to discard | Don't architect throwaway code; if it survives, re-shape it then. |

# Worked Example

Right-size the design for a feature:

```text
Feature A: "Admin edits a lookup table of country codes." No rules, rarely changes, internal.
Decision:  Framework-native CRUD. No ports, no interactors. Adding them would be pure ceremony.

Feature B: "Loan approval": many rules, audited, will change often, several channels.
Decision:  Full Clean stack — entities for the rules, a use case, gateways, tested at the port.

Same codebase, different investment — matched to each feature's complexity and stakes.
```

Applying the full stack to Feature A would be over-engineering; applying none to Feature B would breed a mud
ball. The skill is telling them apart.

# Real World Analogy

Building codes scale with the **building**. A garden shed doesn't need structural engineers, fire-rated
stairwells, and redundant systems — demanding them would be absurd and wasteful. A hospital needs all of it,
and skipping it would be dangerous. Using hospital-grade process on a shed (over-engineering) wastes money
and time; using shed-grade process on a hospital (under-engineering) is negligent. Good engineers **match the
rigor to the stakes** — and that judgment, not a fixed checklist, is the craft.

# Examples

## Example 1 — Basic: is this over-abstraction?

Every service in a codebase has an interface with exactly one implementation, and there's no test that swaps
them. Over-abstraction? Answer: **very likely yes** — the interfaces add indirection with no realized
benefit; inline them until a real second implementation or test boundary appears.

**Why this works:** an abstraction with a single, permanent implementation and no boundary to test across is
cost without benefit — the definition of over-abstraction.

## Example 2 — Real-world: proportionate design ships faster

A team uses framework-native CRUD for admin lookup screens and reserves the full Clean stack for the pricing
engine. The admin screens ship quickly; the pricing engine stays testable and changeable. Neither part is
over- or under-built.

**Why this works:** investment was matched to each part's complexity and lifespan, so effort landed where it
paid off.

## Example 3 — Pitfall: cargo-cult layering

A team applies every pattern uniformly — ports, presenters, DTOs, and factories around trivial CRUD. Simple
changes now take a day and thread through eight files; morale and velocity drop, and juniors can't find the
real logic.

**Why this bites:** the rules were followed as dogma rather than in service of cheap change, so the team paid
full architectural cost across the board for benefits most of the code never needed.

# Common Mistakes

- **Over-abstracting** — interfaces/layers with a single implementation and no real boundary.
- **Leaking entities/ORM objects** across boundaries to dodge mapping.
- **Applying the full stack uniformly,** including to trivial CRUD.
- **Treating the rules as dogma** instead of heuristics serving the cost-of-change goal.

# Best Practices

- Name the **costs** (indirection, mapping) and weigh them per feature against the benefits.
- Start **concrete**; extract abstractions when a **real** second case or boundary appears.
- Keep general rules in **entities**, orchestration in **use cases**; skip ceremony for pure CRUD.
- Match **investment to stakes**, and leave **seams** so simple apps can grow structure later.

# Summary

- Clean Architecture has real **costs** — indirection, mapping, up-front effort — worth paying for complex,
  long-lived systems and wasteful for simple ones.
- Watch for anti-patterns: **over-abstraction**, **leaking entities**, **anemic use cases**, and **dogma over
  judgment**.
- Sometimes the right call is **simpler** (CRUD, spikes, tiny apps) — but avoid the **Big Ball of Mud** by
  keeping architecture **proportionate** and leaving seams.
- The measure is always the **cost of change and keeping options open**, not conformance to a diagram.

# Flash Cards

Q: What are the main costs of applying Clean Architecture?
A: Indirection (more files and hops to follow a request), mapping overhead (request/response models and entity↔row mapping), and up-front design effort. They pay off for complex, long-lived systems and are wasteful for simple ones.

Q: What is over-abstraction (astronaut architecture), and how do you spot it?
A: Adding interfaces, layers, and indirection with no real need. A tell-tale sign is interfaces that have exactly one implementation forever, with no boundary being tested across — a YAGNI violation.

Q: Why is passing entities or ORM rows across boundaries a pitfall?
A: It recouples the layers you separated — the UI or use case starts depending on entity/ORM internals, and the entity's shape gets distorted by presentation or storage concerns. The mapping you skipped was the point.

Q: When might full Clean Architecture be the wrong choice?
A: For short-lived/throwaway code, simple CRUD with little logic, tiny apps that fit in your head, or exploratory products where the domain is still unclear — but keep seams to avoid a Big Ball of Mud.

Q: What is the real goal that all the rules serve?
A: Minimizing the cost of change and keeping options open. Abstractions that lower lifetime change cost are worth keeping; those that only add indirection should be removed.

Q: Should Clean Architecture's rules be treated as strict laws?
A: No — they're heuristics serving the cost-of-change goal. Architects decide which boundaries to implement and which to ignore; where a rule stops serving the goal, it's the wrong rule for that spot.

# Exercises

### Easy
Find an interface in a project that has a single implementation. Ask honestly whether a second one or a test
boundary is realistic. Decide whether it earns its abstraction or should be inlined.

### Medium
Pick two features in a system — one trivial, one complex. Argue how much architecture each deserves, and
describe what "proportionate" looks like for both.

### Challenging
Find an over-engineered area (ceremony around simple logic) and a under-structured area (a mud ball) in real
code. Propose how you'd rebalance: what to simplify, what to add, and what seams to leave — all justified by
cost of change.

# Further Reading

- Robert C. Martin — *Clean Architecture* (2017), ch. 24 "Partial Boundaries" and ch. 34 (on judgment and packaging)
- Brian Foote & Joseph Yoder — *Big Ball of Mud* (1997): <http://www.laputan.org/mud/>
- Martin Fowler — *Yagni*: <https://martinfowler.com/bliki/Yagni.html> and *IsQualityWorthCost*: <https://martinfowler.com/articles/is-quality-worth-cost.html>
- Martin Fowler — *DesignStaminaHypothesis*: <https://martinfowler.com/bliki/DesignStaminaHypothesis.html>
