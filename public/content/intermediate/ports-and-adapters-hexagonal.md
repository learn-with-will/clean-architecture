---
id: lesson-09
slug: ports-and-adapters-hexagonal
title: "Ports and Adapters (Hexagonal)"
level: intermediate
order: 9
duration: 22
tags:
  - hexagonal
  - ports
  - adapters
  - cockburn
  - boundaries
summary: "Alistair Cockburn's Hexagonal Architecture, also called Ports and Adapters — the application inside a hexagon exposing ports (interfaces) that adapters plug into, the distinction between primary/driving and secondary/driven sides, and how this relates to (but is not identical to) Clean Architecture."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain **Hexagonal Architecture (Ports & Adapters)** and attribute it to **Alistair Cockburn**.
- Define a **port** and an **adapter**, and tell **primary/driving** from **secondary/driven**.
- Say what the hexagon shape does — and does not — mean.
- Map Hexagonal onto Clean Architecture and describe how they relate.

# Why It Matters

Ports & Adapters is the pattern that makes the Dependency Rule *practical*. It gives you a concrete
recipe — "put an interface at every boundary and plug implementations into it" — and a vocabulary that
much of the industry uses. It's also the most-confused-with Clean Architecture, so learning it precisely
sharpens both.

# Concept Explanation

### The core idea

**Alistair Cockburn** introduced **Hexagonal Architecture** (which he also named **Ports & Adapters**)
around 2005. His one-line intent: *"Allow an application to equally be driven by users, programs,
automated test, or batch scripts, and to be developed and tested in isolation from its eventual run-time
devices and databases."*

You draw the application as a **hexagon**. Its inside is your business logic (in Clean Architecture terms,
use cases and entities). Around the edge are **ports**; **adapters** plug into those ports from the
outside.

```text
        ┌───────── driving (primary) side ─────────┐
        │  Web adapter     CLI adapter    Test      │
        │       \             |            /        │
        │        ▼            ▼           ▼         │
        │      ╔═════════ PORTS ══════════╗         │
        │      ║                          ║         │
        │      ║      Application         ║         │
        │      ║   (use cases + entities) ║         │
        │      ║                          ║         │
        │      ╚═════════ PORTS ══════════╝         │
        │        ▲            ▲           ▲         │
        │       /             |            \        │
        │  DB adapter   Email adapter   Message bus │
        └───────── driven (secondary) side ─────────┘
```

### Ports and adapters, defined

- A **port** is an **interface** — a technology-agnostic description of a conversation the application
  can have. "A way to save orders." "A way to receive a place-order command."
- An **adapter** is an **implementation** that connects a port to a specific technology. A Postgres
  adapter, a REST adapter, a test-double adapter.

The application defines the **ports**; the outside world provides the **adapters**. Because the ports
belong to the application, dependencies point **inward** — the same inversion you learned as DIP.

### Primary/driving vs secondary/driven

The two sides of the hexagon are not the same:

- **Primary (driving) adapters** sit on the left. They **drive** the application — an actor initiates
  action. A web controller, a CLI, or a test calls **into** a driving port (often the use-case interface
  itself). Control flows *into* the hexagon.
- **Secondary (driven) adapters** sit on the right. They are **driven by** the application — the app
  calls **out** through a driven port that the adapter implements. A database, an email service, a
  message queue. Control flows *out of* the hexagon.

A memory aid: **driving = "who calls the app"; driven = "who the app calls."** Both sides use the same
ports-and-adapters mechanism, which is why the architecture is symmetric.

### What the hexagon shape means

Almost nothing — and that's deliberate. Cockburn chose a hexagon simply to give himself **room to draw
several ports** on different edges, and to break the misleading top-to-bottom "layers" picture. **It
does not mean six layers, six ports, or six of anything.** Don't invent significance for the six sides.

### How it relates to Clean Architecture

Hexagonal and Clean are close cousins, and Martin explicitly lists Ports & Adapters as one of the ideas
Clean Architecture integrates. Roughly:

```text
Hexagonal                     Clean Architecture
─────────                     ──────────────────
inside the hexagon      ≈     Use Cases + Entities
ports                   ≈     boundary interfaces (input/output ports, gateways)
adapters                ≈     Interface Adapters layer
driving/driven          ≈     controllers (in) / gateways & presenters (out)
```

They are **not identical**: Clean Architecture adds the explicit four-circle layering, the entities/use-
cases split, and the component principles; Hexagonal focuses tightly on the boundary. But if you obey
one well, you're most of the way to the other.

# Key Terminology

- **Hexagonal Architecture / Ports & Adapters** — Cockburn's pattern isolating an application behind interfaces (ports) that adapters plug into.
- **Port** — an interface describing a conversation the application supports, owned by the application.
- **Adapter** — an implementation connecting a port to a specific technology (web, DB, test, etc.).
- **Primary / driving adapter** — an actor that drives the app by calling into a driving port (control flows in).
- **Secondary / driven adapter** — a technology the app drives by calling out through a driven port (control flows out).
- **Symmetry** — the same ports-and-adapters mechanism is used on both the driving and driven sides.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Driving port shape | Reuse the use-case interface as the port | A separate command/handler port | Reusing the use-case interface is simplest; add a distinct port only if multiple drivers need different shapes. |
| Number of ports | One big port for everything | One port per distinct conversation | Prefer focused ports (ISP); merge only trivially related ones. |
| Reading the hexagon | Treat six sides as meaningful | Treat it as "room for ports" | It's just room for ports — don't over-read the shape. |

# Worked Example

A "subscribe to newsletter" feature, in ports-and-adapters terms:

```typescript
// Driving port (primary): what the outside can ask the app to do.
interface SubscribeToNewsletter { run(email: string): void; }

// Driven port (secondary): what the app needs from the outside.
interface SubscriberStore { add(email: string): void; }
interface Mailer { sendWelcome(email: string): void; }

// The application implements the driving port and depends on driven ports.
class SubscribeInteractor implements SubscribeToNewsletter {
  constructor(private store: SubscriberStore, private mailer: Mailer) {}
  run(email: string) { this.store.add(email); this.mailer.sendWelcome(email); }
}
```

Adapters plug in from outside: a `WebSubscribeController` (driving) calls `SubscribeToNewsletter`; a
`PostgresSubscriberStore` and `SesMailer` (driven) implement the secondary ports. Swap any adapter — a
CLI driver, an in-memory store for tests — without touching the interactor.

# Real World Analogy

A **stage play**. The script and actors (the application) sit at the center. The theatre provides
**sockets** around the edge — power outlets, microphone jacks, lighting rigs (**ports**). Different
equipment (**adapters**) plugs into those sockets: this venue's speakers, that venue's projector. The
**audience and director** drive the show from the front (primary side); the **lights and sound systems**
are driven by the performance (secondary side). Move the play to a new theatre and you re-plug the
adapters; the script never changes.

# Examples

## Example 1 — Basic: driving or driven?

A nightly cron job that calls `GenerateReports.run()` — is its adapter primary or secondary? Answer:
**primary (driving)** — the cron job initiates action and calls *into* the application, just like a web
request would.

**Why this works:** "who starts the interaction" decides the side; the cron job drives the app, so its
adapter is on the driving side.

## Example 2 — Real-world: test as a first-class adapter

A team writes an automated test that drives the same `PlaceOrder` port a web controller uses, backed by
an in-memory `OrderStore` adapter. The business logic is exercised with **no web server and no
database**, running in milliseconds.

**Why this works:** because tests and production share ports, the test is just another adapter — exactly
what Cockburn designed the pattern to enable.

## Example 3 — Pitfall: an adapter with business logic

A REST adapter, instead of just translating the request, starts applying discount rules and validating
inventory before calling the port. Now that logic can't be reused by the CLI adapter and is coupled to
the web.

**Why this bites:** adapters must only translate; putting rules in an adapter defeats the isolation the
hexagon exists to provide.

# Common Mistakes

- **Reading meaning into "six sides."** The hexagon is just room for ports.
- **Confusing driving and driven.** Driving = calls into the app; driven = called by the app.
- **Putting business logic in adapters.** Adapters translate; the hexagon's inside holds the rules.
- **Assuming Hexagonal and Clean are identical.** They're close relatives by different authors, not the
  same thing.

# Best Practices

- Define a **port for every conversation** the app has with the outside, and let the app own it.
- Keep adapters **thin translators**; no business rules on the edge.
- Treat **tests as adapters** on the driving side and **in-memory fakes** as adapters on the driven side.
- Name ports by **intent** ("SubscriberStore"), not by technology ("PostgresDao").

# Summary

- **Hexagonal Architecture / Ports & Adapters** (Alistair Cockburn, c. 2005) isolates the application
  behind **ports** (interfaces it owns) that **adapters** plug into from outside.
- The **driving/primary** side calls into the app; the **driven/secondary** side is called by the app —
  same mechanism, symmetric.
- The **hexagon shape is not significant** — it's just room to draw ports.
- Hexagonal maps closely onto Clean Architecture's boundaries and adapters, but the two are **related,
  distinct** works.

# Flash Cards

Q: Who created Hexagonal Architecture, and what is its other name?
A: Alistair Cockburn; it is also called Ports and Adapters.

Q: What is the difference between a port and an adapter?
A: A port is an interface the application owns describing a conversation it supports; an adapter is an implementation connecting that port to a specific technology.

Q: What distinguishes a primary/driving adapter from a secondary/driven one?
A: A driving adapter calls into the application (an actor initiates action); a driven adapter is called by the application (the app drives a technology like a database).

Q: Does the hexagon's six-sided shape carry technical meaning?
A: No — Cockburn chose it only to leave room to draw multiple ports; it does not mean six layers, ports, or anything else.

Q: How does Hexagonal relate to Clean Architecture?
A: They are related but distinct: the hexagon's inside maps to use cases and entities, ports to boundary interfaces, and adapters to the Interface Adapters layer. Clean Architecture adds explicit layering and component principles.

Q: Why can a test be considered an adapter?
A: Because a test can drive the same port a web controller uses, backed by in-memory driven adapters, exercising the app with no real database or web server.

# Exercises

### Easy
For a feature you know, list its **ports**: which conversations does the app have with the outside?
Label each as driving (into the app) or driven (out of the app).

### Medium
Write a driving port and a driven port for a "reset password" feature, plus an interactor that implements
the driving port using the driven one. Then name two adapters for each port (e.g., web + test; Postgres +
in-memory).

### Challenging
Take an existing endpoint whose handler talks straight to the database. Redesign it as ports & adapters:
identify the driving and driven ports, move the logic into the hexagon, and describe how you'd test it
with no web server or database.

# Further Reading

- Alistair Cockburn — *Hexagonal Architecture (Ports & Adapters)*: <https://alistair.cockburn.us/hexagonal-architecture/>
- Robert C. Martin — *Clean Architecture* (2017), ch. 22 (lists Ports & Adapters among its influences)
- Martin Fowler — *InversionOfControl*: <https://martinfowler.com/bliki/InversionOfControl.html>
- Netflix Tech Blog — *Ready for changes with Hexagonal Architecture* (an industry write-up): <https://netflixtechblog.com/ready-for-changes-with-hexagonal-architecture-b315ec967749>
