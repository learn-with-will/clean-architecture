---
id: lesson-20
slug: partial-and-evolving-boundaries
title: "Partial and Evolving Boundaries"
level: advanced
order: 20
duration: 22
tags:
  - partial-boundaries
  - yagni
  - deferring-decisions
  - cost-benefit
  - over-engineering
summary: "Boundaries cost something, so you shouldn't build all of them fully — the partial-boundary techniques (skip the last step, one-dimensional boundaries, and facades) that leave a seam without the full price, plus the architect's ongoing judgment of which boundaries to implement, defer, or ignore."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain why a **full boundary has real costs** and shouldn't be applied everywhere.
- Describe three **partial-boundary** techniques and their trade-offs.
- Treat a boundary as an **option** you can strengthen later.
- Make an **explicit cost/benefit** call about which boundaries to build, defer, or skip.

# Why It Matters

It's easy to walk away from the earlier lessons thinking "put an interface at every boundary, always."
That's how you get **over-engineered** systems drowning in indirection. Robert C. Martin is explicit that
architects must decide **which boundaries to fully implement, which to partially implement, and which to
ignore** — and that this judgment is *ongoing*. Knowing the cheaper, partial options is what lets you keep
that judgment honest.

# Concept Explanation

### Full boundaries cost something

A **full boundary** — reciprocal interfaces (input and output ports), dedicated request/response data
structures, and two independently-managed components on either side — buys maximum independence. But it
costs: more code, more indirection, and the ongoing effort of **managing two separate components** (build,
version, keep in sync). Anticipating a boundary you never need is a classic form of over-engineering; you
pay the cost and never collect the benefit.

So the architect's question is never "should everything have a boundary?" but "**is the independence this
boundary buys worth its cost, here, now?**" Often the answer is "not yet" — which is where partial
boundaries come in.

### Partial boundary 1: skip the last step

Do **all** the design work of a full boundary — define the interfaces, the DTOs, keep the code separated —
but **don't** split it into two separately-compiled/deployed components. You keep everything in one
component for now.

```text
Full boundary:     [ component A ] ──▶ «interface» ◀── [ component B ]   (two build units)
Skip last step:    one component containing A, the «interface», and B    (one build unit)
```

You save the recurring cost of managing two components, while keeping the code **ready** to split the day
you need to. The risk: without the physical separation, discipline can let a shortcut creep across the
seam — so pair it with the lint enforcement from the previous lesson.

### Partial boundary 2: one-dimensional boundary

A full boundary uses **reciprocal** interfaces (the client calls in *and* results come back through a
separate output port). A **one-dimensional boundary** uses a **single** interface (a Strategy-style port)
— the client depends on an abstraction, but there's no return-path port.

```text
Full:            Client ─▶ «Input» ,  Service ─▶ «Output» ─▶ Client   (two interfaces)
One-dimensional: Client ─▶ «ServiceBoundary» ◀── ServiceImpl          (one interface)
```

It's cheaper and still inverts the main dependency, but it's **weaker**: it's easier for the boundary to
degrade over time because only one direction is protected. Good when you mainly need to swap the *service*
implementation, not to fully decouple both directions.

### Partial boundary 3: facade

The simplest option: a **Facade** class that presents a clean surface and delegates to the services behind
it. There's **no dependency inversion** here — the facade *depends on* the concrete services, and clients
depend on the facade, so clients are transitively coupled to the services' existence.

```text
Client ─▶ Facade ─▶ { ServiceA, ServiceB, ServiceC }   (facade depends on the concretes)
```

It buys a tidy entry point and hides some structure, but not independence — a change behind the facade can
still ripple to clients. It's the lightest "seam," useful as a starting point you can strengthen later.

### Boundaries are options you exercise later

The through-line: a boundary is an **option**. You can start with the cheapest seam that expresses the
intent (a facade, or a single interface) and **strengthen** it — to a full boundary, then to a separate
component, then to a service — *when a real force appears* (a second implementation, a scaling need, a team
split). Leaving a **seam** where change is plausible is cheap; building the full boundary before you need it
is not.

### It's an ongoing judgment

Martin stresses that deciding which boundaries to implement is **not** a one-time, up-front act. You
**watch** for the friction that signals a boundary is now worth its cost — repeated churn across a seam, a
looming second database or UI, a team that needs to deploy independently — and you strengthen the boundary
*then*. Guess too early and you over-build; ignore the signals and you under-build. The skill is reading the
signals.

# Key Terminology

- **Full boundary** — reciprocal interfaces plus DTOs plus two independently-managed components; maximum independence, maximum cost.
- **Skip the last step** — a partial boundary with all the interfaces/DTOs but kept in one component.
- **One-dimensional boundary** — a single (Strategy-style) interface instead of reciprocal input/output ports.
- **Facade** — a partial boundary offering a clean entry point that delegates to concrete services, with no dependency inversion.
- **Seam** — a place where a boundary could later be introduced or strengthened cheaply.
- **YAGNI ("You Aren't Gonna Need It")** — don't build capability (or boundaries) on speculation.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Boundary you *might* need | Build it fully now | Leave a seam, strengthen later | Leave a seam unless a concrete force already exists; strengthen when friction appears. |
| Cheap seam form | Facade (no inversion) | One-dimensional interface | Facade to just tidy structure; one-dimensional when you actually need to swap the implementation. |
| Keeping it in one component | Split into two components now | Skip the last step (one component) | Stay in one component until independent build/deploy is genuinely needed. |

# Worked Example

Choose a boundary strength by cost/benefit. A reporting module *might* one day move to its own service, but
today there's one implementation and one team.

```text
Force present now?   No second impl, no scaling need, one team.
Decision:            Skip the last step — define a ReportingPort + DTOs, keep it in the monolith.
Enforcement:         Lint rule forbids other modules importing reporting internals.
Later trigger:       If reporting needs independent scaling → upgrade the seam to a service.
```

You get a clean, testable seam now, pay almost nothing extra, and keep the door open to a service later —
without building the service today.

# Real World Analogy

Home builders leave **stub-outs**: a capped pipe and a blank electrical box where a future bathroom *might*
go. That's a **seam** — cheap to leave, expensive to retrofit if you didn't. But they don't build the whole
bathroom on speculation (that's over-engineering — full boundary too early), and they don't pour a
foundation with *no* stub-outs anywhere change is likely (under-engineering). A good builder reads the plans
and leaves stub-outs where change is plausible, finishing the room only when someone actually needs it.

# Examples

## Example 1 — Basic: which partial boundary has no dependency inversion?

Skip-the-last-step, one-dimensional, or facade? Answer: the **facade** — clients depend on the facade,
which depends on the concrete services, so no dependency is inverted.

**Why this works:** a facade only re-fronts concretes; without an owned abstraction between client and
service, there's no inversion, so it's the weakest of the three.

## Example 2 — Real-world: strengthening on a real signal

A team keeps a payments seam as a one-dimensional interface. When a second payment provider is actually
contracted, they promote it to a full boundary with proper request/response models — cheaply, because the
seam was already there.

**Why this works:** they deferred the full cost until a concrete force (a real second provider) justified
it, and the pre-existing seam made the upgrade easy.

## Example 3 — Pitfall: boundaries nobody needed

An architect builds full reciprocal boundaries — interfaces, DTOs, separate components — around every module
"to be safe." Two years later most have exactly one implementation, and every trivial change threads through
layers of indirection. Velocity suffers with no offsetting benefit.

**Why this bites:** boundaries were built on speculation against forces that never materialized, so the team
paid full cost for independence it never used — textbook over-engineering.

# Common Mistakes

- **Full boundaries everywhere,** paying for independence you never use.
- **No seams anywhere,** so a needed boundary is a painful retrofit.
- **Treating boundary decisions as one-time,** instead of revisiting them as forces appear.
- **Calling a facade "decoupling."** It hides structure but doesn't invert dependencies.

# Best Practices

- Ask, per boundary, whether its **independence is worth its cost *now***; if not, use a partial form or a
  seam.
- Prefer **skip-the-last-step** to keep code ready without managing two components.
- **Leave seams** where change is plausible; **strengthen** them when friction actually appears.
- Revisit boundary decisions **continually**; treat "which boundaries" as ongoing architectural work.

# Summary

- **Full boundaries cost real effort**, so you deliberately implement some fully, some partially, and some
  not at all.
- **Partial boundaries**: *skip the last step* (all interfaces/DTOs, one component), *one-dimensional*
  (single Strategy interface), and *facade* (clean entry point, **no** inversion) — decreasing cost and
  decreasing strength.
- A boundary is an **option**: leave a cheap **seam** and **strengthen** it when a concrete force appears.
- Choosing which boundaries to build is an **ongoing judgment**, guided by watching for real friction —
  avoiding both over- and under-engineering.

# Flash Cards

Q: Why shouldn't you fully implement every architectural boundary?
A: Full boundaries cost extra code, indirection, and the ongoing effort of managing two components; building ones you don't need is over-engineering — you pay the cost without collecting the benefit.

Q: What is the "skip the last step" partial boundary?
A: You create all the interfaces and DTOs of a full boundary but keep everything in a single component, saving the cost of managing two components while leaving the code ready to split later.

Q: How does a one-dimensional boundary differ from a full boundary?
A: A full boundary uses reciprocal input and output interfaces; a one-dimensional boundary uses a single (Strategy-style) interface — cheaper but weaker and more prone to degrading over time.

Q: Which partial boundary provides no dependency inversion, and what does that imply?
A: The facade — clients depend on it and it depends on concrete services, so clients stay transitively coupled to those services; it tidies structure but doesn't buy independence.

Q: What does it mean to treat a boundary as an "option"?
A: You leave a cheap seam where change is plausible and strengthen it (to a full boundary, component, or service) only when a real force appears, instead of building the full boundary up front.

Q: Is deciding which boundaries to build a one-time, up-front task?
A: No — it's ongoing. Architects watch for friction (a second implementation, scaling needs, team splits) and strengthen boundaries when the cost becomes justified.

# Exercises

### Easy
List two places in a system you know where you'd leave a **seam** but not build a full boundary yet, and
say what future force would make you strengthen each.

### Medium
For one module, sketch the three partial-boundary options (skip-the-last-step, one-dimensional, facade) and
note the cost and strength of each. Which would you choose today, and why?

### Challenging
Find an over-abstracted area in real code (interfaces/components with a single implementation each). Propose
how you'd simplify it toward a partial boundary or seam without losing the ability to strengthen it later,
and estimate the indirection you'd remove.

# Further Reading

- Robert C. Martin — *Clean Architecture* (2017), ch. 24 "Partial Boundaries" and ch. 25 "Layers and Boundaries"
- Martin Fowler — *Yagni*: <https://martinfowler.com/bliki/Yagni.html>
- Martin Fowler — *SacrificialArchitecture*: <https://martinfowler.com/bliki/SacrificialArchitecture.html>
- Robert C. Martin — *The Clean Architecture* (2012): <https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html>
