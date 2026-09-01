---
id: lesson-01
slug: what-is-clean-architecture
title: "What Is Clean Architecture?"
level: beginner
order: 1
duration: 18
tags:
  - foundations
  - dependency-rule
  - layers
  - overview
  - independence
summary: "A plain-language introduction to Clean Architecture — the goal of keeping business logic independent of UI, database, and frameworks, the concentric layers as an illustrative example, the single Dependency Rule that holds it together, and how it relates to (but differs from) Hexagonal and Onion architecture."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain in plain language what **Clean Architecture** is and the problem it solves.
- State the **goal** of a good architecture in Robert C. Martin's terms.
- Name the four example **layers** and describe the single **Dependency Rule** that governs them.
- Distinguish **Clean Architecture** from **Hexagonal (Ports & Adapters)** and **Onion** architecture, and attribute each correctly.
- Give an **honest** account of what Clean Architecture does and does not buy you.

# Why It Matters

Most software doesn't die because a feature was impossible — it dies because change becomes too
expensive. A tangle where the business rules know about the database, the database knows about the web
framework, and everything knows about everything means one small change ripples everywhere. **Clean
Architecture** is one well-known answer to that problem: a way of organizing code so the important
parts — your **business rules** — stay independent of the parts that change often, like the UI, the
database, and the framework. Before any single technique, it helps to see the whole shape: the goal,
the layers, and the one rule that ties them together.

# Concept Explanation

### The goal: keep options open

Robert C. Martin (often called "Uncle Bob") summarizes the goal of software architecture as *"to
minimize the human resources required to build and maintain the required system."* A closely related
idea runs through his book **Clean Architecture** (2017): a good architecture **keeps options open**.
It lets you **defer decisions** about details — which database, which web framework, which UI — for as
long as possible, and change them cheaply later.

To do that, Clean Architecture aims to make your core software **independent** of four things:

- **Frameworks** — a framework is a tool you use, not an architecture you marry into.
- **The UI** — the user interface can change (web, mobile, CLI) without touching business rules.
- **The database** — Oracle or Postgres or a flat file is a detail decided late.
- **Any external agency** — your business rules shouldn't even know the outside world exists.

### The concentric layers (an example, not a law)

Clean Architecture is usually drawn as concentric circles. From the inside out:

```text
        ┌─────────────────────────────────────────────┐
        │   Frameworks & Drivers  (web, DB, UI, tools) │   outer: details
        │   ┌─────────────────────────────────────┐    │
        │   │   Interface Adapters                 │    │
        │   │   (controllers, presenters, gateways)│    │
        │   │   ┌─────────────────────────────┐    │    │
        │   │   │   Use Cases                  │    │    │
        │   │   │   (application business rules)│   │    │
        │   │   │   ┌─────────────────────┐    │    │    │
        │   │   │   │   Entities          │    │    │    │
        │   │   │   │   (enterprise rules)│    │    │    │
        │   │   │   └─────────────────────┘    │    │    │
        │   │   └─────────────────────────────┘    │    │
        │   └─────────────────────────────────────┘    │
        └─────────────────────────────────────────────┘
              source-code dependencies point inward  ►
```

The further **in** you go, the **higher-level** and more stable the code: **Entities** (rules that
would exist even without this app) at the core, then **Use Cases** (what this application does), then
**Interface Adapters** (translators), then **Frameworks & Drivers** (the volatile outside world).

Important: **there is no rule that says exactly four circles.** Martin is explicit that the number of
layers is illustrative — a system might have more. The circles are a picture; the *rule* is what
matters.

### The Dependency Rule in one sentence

> **The Dependency Rule:** source-code dependencies must point **only inward**, toward higher-level
> policy. Nothing in an inner circle may know anything about an outer circle.

An entity can't import the database. A use case can't import the web framework. Names, functions, and
data structures declared in an outer circle must not be mentioned by an inner circle. That one
constraint is the whole engine of Clean Architecture — everything else is a technique for obeying it.

### Clean, Hexagonal, and Onion — related but distinct

You will see three names used almost interchangeably. They **share a family idea** — dependencies
point inward, toward the domain — but they are **distinct** works by different authors, and you should
attribute them correctly:

- **Clean Architecture** — Robert C. Martin (blog post 2012, book 2017). The four circles and the
  Dependency Rule; it explicitly integrates ideas from the other two.
- **Hexagonal Architecture**, also called **Ports & Adapters** — Alistair Cockburn (c. 2005). The
  application sits inside a hexagon; **ports** (interfaces) let **adapters** plug in on the outside.
- **Onion Architecture** — Jeffrey Palermo (2008). Layers like an onion with the **domain model** at
  the center, built explicitly on dependency inversion.

They are not "the same thing," and none of them invented the others. This course focuses on Clean
Architecture but names its relatives honestly.

# Key Terminology

- **Clean Architecture** — an approach to structuring software so business rules are independent of UI, database, and frameworks, governed by the Dependency Rule.
- **Business rules** — the logic that makes your software valuable (calculations, policies, workflows), as opposed to plumbing.
- **The Dependency Rule** — source-code dependencies may point only inward, toward higher-level policy.
- **Layer / circle** — a band of code at a similar level of policy; inner = higher-level and more stable.
- **Detail** — anything decided late and changeable: the database, the web, the UI, a framework.
- **Ports & Adapters (Hexagonal)** — Cockburn's equivalent framing using interfaces (ports) and plug-ins (adapters).

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Where business rules live | Mixed into controllers/DB code | Isolated in inner layers | Isolate them when the app has real logic and a long life; skip the ceremony for a throwaway script. |
| How many layers | Force exactly four circles | As many boundaries as the system needs | The Dependency Rule matters, not the count — add a boundary only where change justifies it. |
| Framework role | Build *inside* the framework | Treat the framework as an outer detail | Keep frameworks at the edge for long-lived apps; a quick prototype can lean on the framework. |

# Worked Example

Imagine a tiny payroll feature: *"calculate an employee's monthly pay."* Where does each piece go?

```text
Entity        Employee, Money, the pay calculation itself     ← innermost, pure rules
Use Case      "CalculatePay": load employee, compute, save    ← app-specific orchestration
Adapter       a Controller turning an HTTP request into a     ← translates outside ↔ inside
              use-case call; a Gateway saving to Postgres
Framework     Express/Fastify, the Postgres driver, the UI    ← outermost details
```

Notice the calculation (an **entity**) doesn't know it's triggered by HTTP or stored in Postgres. Swap
Postgres for MySQL, or the web for a CLI, and the entity and use case don't change at all. That
independence is the payoff.

# Real World Analogy

Think of a **house**. The rooms and how you live in them are the *business rules*. The plumbing,
wiring, and gas are *details* hidden behind standard interfaces — a faucet, a socket, a thermostat.
You can switch your electricity provider or replace the boiler without rebuilding the kitchen, because
the house depends on the *interface* (the socket), not on the power plant. Clean Architecture puts
sockets between your business rules and every volatile detail so you can swap the detail without
demolishing the house.

# Examples

## Example 1 — Basic: sorting code into layers

Given four items, name the layer each belongs to: (a) a `TaxRate` rule that's true company-wide, (b) a
`SubmitTimesheet` workflow, (c) a `PostgresTimesheetGateway`, (d) the Express route handler.

Answer: (a) **Entity** — an enterprise-wide rule; (b) **Use Case** — application-specific; (c)
**Interface Adapter** — a gateway translating to the DB; (d) **Frameworks & Drivers** — the web
framework at the edge.

**Why this works:** each item is placed by *how often it changes* and *how general it is*, exactly
what the circles encode.

## Example 2 — Real-world: swapping a detail

A team ships a product with a REST API backed by MongoDB. A year later a big customer needs the same
logic exposed as a scheduled batch job writing to their SQL warehouse. Because the use cases depend on
a `Repository` interface (not on Mongo), they add a new SQL gateway and a new "batch" entry point, and
the business rules are reused untouched.

**Why this works:** the details (web vs batch, Mongo vs SQL) lived in the outer ring, so replacing them
didn't reach the core.

## Example 3 — Pitfall: the framework at the core

Another team builds every business rule as methods on their web framework's controller classes and ORM
models. When they later need a CLI and want to upgrade the framework's major version, they discover the
rules can't be called without booting the whole framework. The "architecture" was really just the
framework's shape.

**Why this bites:** with dependencies pointing *outward* to the framework, the framework became
impossible to remove — the opposite of keeping options open.

# Common Mistakes

- **Treating the four circles as a mandatory template.** The Dependency Rule is the point; the number
  of layers is not fixed.
- **Conflating Clean, Hexagonal, and Onion.** They rhyme, but they're distinct works — attribute them.
- **Believing "independent of the framework" means "no framework."** You still use frameworks; you just
  keep them at the edge as replaceable details.
- **Adding layers to a script that will never change.** Architecture is an investment; a throwaway
  program may not need it.

# Best Practices

- Start every design by asking *what are the business rules, and what are details?*
- Push volatile things (DB, web, UI, frameworks) **outward**; keep policy **inward**.
- Learn the **Dependency Rule** first; the layers follow from it.
- Be honest about cost: apply the architecture where change is likely and the system will live a while.

# Summary

- **Clean Architecture** organizes code so business rules stay **independent** of UI, database, and
  frameworks — the goal is to keep options open and change cheap.
- It's drawn as concentric circles — **Entities → Use Cases → Interface Adapters → Frameworks &
  Drivers** — but the number of circles is an example, not a law.
- The one non-negotiable is the **Dependency Rule**: source-code dependencies point only inward.
- **Clean (Martin)**, **Hexagonal/Ports & Adapters (Cockburn)**, and **Onion (Palermo)** are related
  but distinct — attribute each correctly.
- Architecture is an **investment** with real cost; apply it where it pays off.

# Flash Cards

Q: In one sentence, what is the goal of Clean Architecture?
A: To keep business rules independent of details (UI, database, frameworks) so the system stays easy and cheap to change — keeping options open.

Q: State the Dependency Rule.
A: Source-code dependencies must point only inward, toward higher-level policy; nothing in an inner circle may know anything about an outer circle.

Q: What are the four example layers from inside out?
A: Entities (enterprise business rules), Use Cases (application business rules), Interface Adapters (controllers/presenters/gateways), and Frameworks & Drivers (web, DB, UI, tools).

Q: Is there a rule that Clean Architecture must have exactly four layers?
A: No. Martin says the four circles are illustrative; a system may have more. The Dependency Rule is what's mandatory, not the number of layers.

Q: Who created Clean, Hexagonal, and Onion architecture?
A: Clean Architecture — Robert C. Martin; Hexagonal / Ports & Adapters — Alistair Cockburn; Onion Architecture — Jeffrey Palermo. They are related but distinct.

Q: Does "independent of frameworks" mean you avoid frameworks entirely?
A: No — you still use frameworks, but you keep them at the outer edge as replaceable details rather than building your business rules inside them.

# Exercises

### Easy
Write down a small app you know. List three things that are **business rules** and three that are
**details** (things you could swap without changing what the app fundamentally does).

### Medium
Draw the four concentric circles on paper and place these into them: a "money transfer" rule, a
`StripePaymentGateway`, a React screen, and a "transfer funds" workflow. Then draw the dependency
arrows and confirm they all point inward.

### Challenging
Find a small project of yours where a business rule imports the database or the web framework directly.
Describe, in words, what interface you would introduce and which direction the dependency would then
point. What decision would that let you defer or change later?

# Further Reading

- Robert C. Martin — *The Clean Architecture* (2012): <https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html>
- Robert C. Martin — *Clean Architecture: A Craftsman's Guide to Software Structure and Design* (Prentice Hall, 2017)
- Alistair Cockburn — *Hexagonal Architecture (Ports & Adapters)*: <https://alistair.cockburn.us/hexagonal-architecture/>
- Jeffrey Palermo — *The Onion Architecture* (2008): <https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/>
