---
id: lesson-21
slug: microservices-and-boundaries
title: "Services and Boundaries"
level: advanced
order: 21
duration: 22
tags:
  - microservices
  - decoupling-modes
  - distributed
  - boundaries
  - fallacy
summary: "How services relate to architecture — the three decoupling modes (source, deployment, service), why a service boundary is a deployment decision rather than an automatic architecture, the fallacy that splitting into microservices decouples by itself, and why each service still needs Clean Architecture inside it."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Describe the three **decoupling modes**: source-level, deployment-level, and service-level.
- Explain why a **service boundary is a deployment choice**, not automatically good architecture.
- State the **service fallacy** and how cross-cutting changes can still couple services.
- Apply **Clean Architecture *within*** each service.

# Why It Matters

"Let's use microservices" is often pitched as an architecture — as if crossing a network boundary
automatically gives you independence. It doesn't. Services solve certain **operational** problems
(independent scaling and deployment, team autonomy) at a real cost, but they can be just as tangled as a
bad monolith if the boundaries inside and between them are wrong. This lesson separates what services
*actually* buy from what people wrongly assume they buy.

# Concept Explanation

### Three modes of decoupling

Robert C. Martin describes decoupling as happening at three **levels**, and a good architecture leaves your
options open across all three:

- **Source-level** — components in the **same process** depend on each other only through interfaces
  (changes don't force each other to recompile beyond the interface). You control the source-code
  dependencies.
- **Deployment-level** — components are separately **deployable units** (jars, DLLs, packages); one can be
  redeployed without rebuilding the others.
- **Service-level** — components run in **separate processes**, communicating over a network; they share
  only a data/API contract and can be developed and deployed fully independently.

A microservice is decoupling pushed to the **service level**. It's the strongest and most expensive form of
the boundary spectrum you saw earlier.

### A service boundary is a deployment decision

Crucially, **the service boundary is about how the system is deployed and operated**, not about whether it
has a good internal structure. Two services can be as tightly coupled as two functions if they share a
database, leak internal shapes through their contracts, or must change together for every feature. The
network hop is a strong *physical* boundary, but physical separation is not the same as **architectural**
independence.

So: choose services for **operational** reasons — independent scaling, independent deployment cadence,
fault isolation, team autonomy, polyglot needs — not because you believe the split *is* the architecture.

### The service fallacy

Two claims are commonly made for microservices, and both have a catch:

1. **"Services are strongly decoupled."** Only at the source and deployment level. They can still be
   **coupled through data and behavior**: if service A depends on the exact shape of a record service B
   owns, a change in B still breaks A. Shared schemas and chatty contracts recouple services across the
   wire.
2. **"Services can be developed and deployed independently."** True *until* a **cross-cutting feature**
   arrives that touches several services at once. Then you're coordinating changes and deploys across teams
   and repositories — sometimes *harder* than editing one codebase. Martin illustrates this with a scenario
   where a new feature forces changes across every service that was supposedly independent.

The honest summary: services give **real** benefits, but "we used microservices" does **not** by itself
mean the system is decoupled or well-architected. The same design discipline is required — just distributed.

### The costs services add

Going to the service level adds genuine costs you don't pay in-process:

```text
+ independent scaling & deploy        − network latency & partial failure
+ fault isolation (sometimes)         − distributed data / eventual consistency
+ team & tech autonomy                − harder debugging, tracing, testing
                                      − operational complexity (deploy, monitor, secure many things)
```

These are why the previous lessons urged starting with a **modular monolith** and upgrading a boundary to a
service only when a concrete force justifies it.

### Clean Architecture *inside* each service

A service is not a substitute for architecture; it's a **container** for one. Each service should still have
its **entities, use cases, and adapters**, obeying the Dependency Rule internally. The network endpoint is
just a **driving adapter** (a controller) on the outside, and the service's database is just a **driven
adapter** (a gateway). Done well, a service can even be **carved out of a modular monolith** with little
change, because its use cases were already isolated behind boundaries.

# Key Terminology

- **Decoupling modes** — source-level (interfaces in one process), deployment-level (separate deployables), service-level (separate processes over a network).
- **Microservice** — a component decoupled to the service level; the strongest, costliest boundary form.
- **Service fallacy** — the mistaken belief that splitting into services automatically yields decoupling and independent development.
- **Cross-cutting feature** — a change that spans several services, forcing coordinated changes and deploys.
- **Distributed data / eventual consistency** — the reality that data split across services can't be trivially transactionally consistent.
- **Driving/driven adapter (in a service)** — the network endpoint (in) and the service's own database (out).

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Boundary form | Microservice now | Modular monolith module | Prefer a module until a concrete operational force (scaling, deploy cadence, team autonomy) demands a service. |
| Sharing data between services | Shared database/schema | Owned data + explicit contracts | Own your data and expose contracts; a shared database recouples services and undermines the split. |
| Internal structure of a service | Endpoint straight to DB | Entities + use cases + adapters | Keep Clean Architecture inside each service so it stays changeable and testable. |

# Worked Example

Decide whether to split a module into a service:

```text
Feature:  Image thumbnail generation, CPU-heavy, bursty load.
Force?    Yes — it needs to scale independently of the web tier and can tolerate async processing.
Decision: Extract it as a service (a worker), reached via a queue (driving adapter).
Inside:   Still has a GenerateThumbnail use case, a ThumbnailStore gateway, an entity for the job.
Not this: Splitting the tiny, tightly-coupled "user settings" CRUD into its own service — no force,
          and it shares data with the profile module; keep it a module.
```

The thumbnail split is justified by a real scaling force; the settings split would pay service costs for no
benefit and recouple through shared data.

# Real World Analogy

Splitting a company into **separate legal subsidiaries** (services) can grant each its own budget, hiring,
and offices (independent scaling and deployment). But if every subsidiary still needs sign-off from the
others for any real decision — because they share the same customers and contracts (shared data) — you've
added lawyers, inter-office mail, and coordination overhead without gaining true independence. Incorporation
(a network boundary) is an *operational* structure; whether the parts are actually decoupled depends on how
you divided the *work*, not on the org chart.

# Examples

## Example 1 — Basic: which decoupling mode is this?

Two modules in the same process communicate only through an interface, one deployable. Which mode? Answer:
**source-level** decoupling — same process, dependencies controlled via an interface, not separate
deployables or processes.

**Why this works:** no separate deployment or network is involved, so the decoupling is purely at the source
level.

## Example 2 — Real-world: monolith-first pays off

A team builds a modular monolith with clean boundaries. When one module (search) needs heavy independent
scaling, they extract it as a service in days — its use cases were already isolated, so the endpoint became a
driving adapter and its index a driven adapter.

**Why this works:** internal Clean Architecture made the service extraction cheap; the boundary was upgraded
only when a real scaling force appeared.

## Example 3 — Pitfall: distributed monolith

Another team splits early into many services that all read and write one shared database and call each other
synchronously for every request. A single feature now requires coordinated changes across five services and
lockstep deploys — a "distributed monolith" with all the costs of services and none of the independence.

**Why this bites:** the split was treated as architecture, but shared data and chatty contracts recoupled the
services, proving the boundary was physical, not architectural.

# Common Mistakes

- **Believing microservices *are* the architecture.** They're a deployment form; the Dependency Rule still
  applies inside and between them.
- **Sharing a database across services,** recoupling them and defeating the split.
- **Splitting before a real force,** paying distributed costs for no benefit.
- **Skipping internal structure** in a service, so each one becomes a little ball of mud.

# Best Practices

- Choose services for **operational** forces (scaling, deploy cadence, autonomy), not as a stand-in for good
  design.
- Keep each service's **data owned** and its **contracts explicit and stable**; avoid shared schemas.
- Maintain **Clean Architecture inside** every service — entities, use cases, adapters.
- Prefer a **modular monolith** first; **extract** a service when a concrete force justifies the cost.

# Summary

- Decoupling happens at three levels — **source, deployment, service** — and a good architecture keeps
  options open across them.
- A **service boundary is a deployment/operational decision**, not automatically good architecture; services
  can still be coupled through **shared data** and **cross-cutting features** (the service fallacy).
- Services add real **distributed costs** (network, partial failure, eventual consistency, operational
  complexity).
- Each service still needs **Clean Architecture inside**; a well-bounded modular monolith makes later service
  extraction cheap.

# Flash Cards

Q: What are the three modes of decoupling?
A: Source-level (interfaces within one process), deployment-level (separately deployable units), and service-level (separate processes communicating over a network).

Q: Is a microservice boundary primarily an architectural or a deployment decision?
A: A deployment/operational decision. Physical separation over a network doesn't guarantee architectural independence — services can still be tightly coupled.

Q: State the service fallacy.
A: The belief that splitting a system into services automatically makes it decoupled and independently developable. In reality, shared data and cross-cutting features can still force coordinated changes across services.

Q: Name two costs that the service level adds over in-process decoupling.
A: Any two of: network latency and partial failure, distributed data/eventual consistency, harder debugging and testing, and greater operational complexity.

Q: Where do a service's network endpoint and its database fit in Clean Architecture terms?
A: The endpoint is a driving (input) adapter and the service's database is a driven (output) adapter; the service still has its own entities and use cases inside.

Q: What is a "distributed monolith," and why is it bad?
A: Many services that share a database and call each other for every request, so features require coordinated cross-service changes and deploys — you pay all the costs of services with none of the independence.

# Exercises

### Easy
For a system you know, identify one boundary at each decoupling level (source, deployment, service) — or
note which levels it uses at all.

### Medium
Pick a module and argue whether it should be a separate service. Name the concrete operational force (or its
absence), and list two distributed costs you'd take on if you split it.

### Challenging
Sketch a modular monolith for a small system, then choose one module to extract as a service. Show how its
endpoint becomes a driving adapter and its store a driven adapter, and describe how you'd keep it from
recoupling to the rest through shared data.

# Further Reading

- Robert C. Martin — *Clean Architecture* (2017), ch. 27 "Services: Great and Small"
- Martin Fowler — *Microservices*: <https://martinfowler.com/articles/microservices.html> and *MicroservicePremium*: <https://martinfowler.com/bliki/MicroservicePremium.html>
- Martin Fowler — *MonolithFirst*: <https://martinfowler.com/bliki/MonolithFirst.html>
- Sam Newman — *Building Microservices* (O'Reilly), on service boundaries and data ownership
