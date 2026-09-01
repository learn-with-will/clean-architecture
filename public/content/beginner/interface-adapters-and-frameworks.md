---
id: lesson-08
slug: interface-adapters-and-frameworks
title: "Interface Adapters and Frameworks"
level: beginner
order: 8
duration: 20
tags:
  - interface-adapters
  - controllers
  - presenters
  - gateways
  - frameworks
summary: "The two outer layers — Interface Adapters (controllers, presenters, and gateways) whose job is to convert data between the form use cases like and the form the outside world likes, and Frameworks & Drivers (web, database, UI, devices) which are the volatile details kept at arm's length."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Describe the job of the **Interface Adapters** layer: converting data across the boundary.
- Identify **controllers**, **presenters**, and **gateways** and what each converts.
- Explain what lives in **Frameworks & Drivers** and why it's kept at the edge.
- See how all four layers fit together for one request.

# Why It Matters

The inner layers (entities, use cases) hold your value but can't talk to the world on their own — they
don't speak HTTP, SQL, or HTML. The outer two layers are the **translators and the plumbing** that
connect that pure core to real inputs and outputs while keeping the Dependency Rule intact. Understanding
them completes your mental model of the four circles and prepares you to build a full slice end-to-end.

# Concept Explanation

### Interface Adapters: the translation layer

The **Interface Adapters** layer exists for one job: **convert data** between the format most convenient
for **use cases and entities** and the format most convenient for some **external agency** (the web, the
database, the UI). It's a two-way translation membrane. Three kinds of adapter live here:

- **Controllers** take input from the outside (an HTTP request, a CLI command) and convert it into a
  plain **request model** that a use case accepts, then call the use case.
- **Presenters** take a use case's **response model** and convert it into a **view model** — strings,
  flags, and formatted values ready for a screen to display with no further logic.
- **Gateways** (repository implementations) convert between **entities** and an external store — turning
  a domain object into SQL rows on the way out, and rows back into domain objects on the way in. This is
  where SQL and ORM code live.

```typescript
// Controller: HTTP → request model → call the use case. No business rules here.
class TransferController {
  constructor(private readonly transfer: TransferMoney) {}
  handle(httpReq: HttpRequest): void {
    const req = {                       // convert the outside format to the inside one
      fromId: httpReq.body.from,
      toId: httpReq.body.to,
      amount: Money.parse(httpReq.body.amount),
    };
    this.transfer.run(req);             // hand control to the use case
  }
}
```

The adapters are where "MVC" typically lives — but note the model here is the entity/use-case data, the
controller is thin, and the view is *humble* (logic-free), fed by the presenter.

### Frameworks & Drivers: the details at the edge

The outermost circle — **Frameworks & Drivers** — is the web framework, the database engine, the UI
toolkit, the message broker, the device drivers. Martin's stance is blunt: **frameworks are tools, not
architectures; don't marry them.** You generally **write little code** here beyond configuration and
glue that points the framework at your adapters. Everything in this ring is a **detail** you want to keep
replaceable.

The reason to keep it at arm's length: this ring changes the most (framework upgrades, database swaps,
new UI tech). If your business rules never mention it, those changes stay contained in the outer ring.

### Putting the four layers together

One request, start to finish:

```text
 HTTP request
     │  (Frameworks & Drivers: web server receives it, routes to a controller)
     ▼
 Controller ── converts → request model ──▶ Use Case
     │                                          │  applies Entities' rules
     │                                          │  calls Gateway interface (owned inward)
     │                                          ▼
     │                                    Gateway (adapter) ⇄ Database (framework)
     │                                          │
     ▼                                          ▼
 Presenter ◀── response model ────────────── Use Case output port
     │  converts → view model
     ▼
 View (humble UI) renders it
```

Follow the arrows: control weaves outward and back, but **every source-code dependency still points
inward** — controllers and gateways depend on the use case's interfaces, never the reverse.

# Key Terminology

- **Interface Adapters** — the layer that converts data between inner (use-case/entity) form and outer (web/DB/UI) form.
- **Controller** — an adapter that turns external input into a use-case request model and invokes the use case.
- **Presenter** — an adapter that turns a use-case response model into a view model for display.
- **Gateway** — an adapter that implements a repository interface, converting entities to/from an external store.
- **Frameworks & Drivers** — the outermost layer: web framework, database, UI, devices — volatile details.
- **View model** — a display-ready data structure with no logic, consumed by a humble view.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Where SQL/ORM code goes | In the use case | In a gateway (adapter) | Always in the gateway, so use cases stay database-free. |
| Formatting for the screen | Inside the use case | In a presenter → view model | Presenter, so use cases return raw data and the UI stays humble. |
| Coupling to the web framework | Business logic in controllers | Thin controllers calling use cases | Keep controllers thin; logic in use cases means the framework stays swappable. |

# Worked Example

Trace where each concern belongs for "show a user's profile":

```text
Parse the HTTP GET, extract the user id          → Controller  (adapter)
Load the user, enforce "profile is public" rule  → Use Case + Entity (inner)
Read the user row from Postgres                   → Gateway (adapter) ⇄ Postgres (framework)
Turn the result into { name, joinedText, avatar } → Presenter → view model (adapter)
Render the HTML                                    → View (framework/UI)
```

The only pieces that know about Postgres and HTTP are the gateway and controller — the outer ring. The
use case and entity are untouched by either.

# Real World Analogy

Interface Adapters are the **translators and dock workers** at a country's border. The **controller** is
the customs officer who takes an arriving shipment (foreign paperwork) and rewrites it onto the standard
domestic form your businesses understand. The **presenter** repackages goods leaving the country into the
destination's required format. The **gateway** is the warehouse crew moving goods in and out of storage.
**Frameworks & Drivers** are the trucks, ships, and the port itself — swappable infrastructure. The
country's laws (entities) and its trade procedures (use cases) never change just because a new shipping
company shows up.

# Examples

## Example 1 — Basic: name the adapter

Which adapter converts a use case's `{ balanceCents: 10599 }` into `{ balance: "$105.99" }` for the
screen? Answer: a **presenter**, producing a view model.

**Why this works:** formatting for display is a conversion from inner form to outer form — exactly a
presenter's job — keeping the use case free of formatting concerns.

## Example 2 — Real-world: swapping the web framework

An app moves from one web framework to another. Because all business logic lives in use cases and only
thin controllers touch the framework, the migration rewrites the controllers and routing but leaves
entities, use cases, and gateways alone.

**Why this works:** the framework was confined to the outer ring, so replacing it didn't reach the core.

## Example 3 — Pitfall: fat controller

A controller parses the request *and* computes discounts, checks inventory, and writes to the database
directly. When a scheduled job needs the same behavior, none of it can be reused — it's trapped inside a
web controller.

**Why this bites:** business rules leaked into an adapter, coupling them to the web framework and
destroying reuse across delivery mechanisms.

# Common Mistakes

- **Putting business rules in controllers or gateways.** Adapters only *convert*; rules live inward.
- **Formatting inside use cases.** Return raw data; let a presenter format it.
- **Writing lots of code in the framework ring.** It should be thin glue and config, not logic.
- **Letting the view contain logic.** Keep the view humble; the presenter does the work.

# Best Practices

- Keep controllers and gateways **thin**: convert and delegate, nothing more.
- Route all persistence through **gateways** so SQL/ORM never appears inward.
- Use **presenters** to produce logic-free **view models**.
- Treat the framework ring as **replaceable**; write as little there as you can.

# Summary

- **Interface Adapters** convert data across the boundary: **controllers** (outside → request model),
  **presenters** (response model → view model), and **gateways** (entities ⇄ external store).
- **Frameworks & Drivers** is the outer ring of volatile details — web, database, UI, devices — kept at
  arm's length with minimal code.
- For any request, control weaves outward and back, but every **source-code dependency still points
  inward**.
- Keeping rules out of adapters and details out of the core is what makes frameworks and databases
  swappable.

# Flash Cards

Q: What is the single job of the Interface Adapters layer?
A: To convert data between the form most convenient for use cases and entities and the form most convenient for an external agency (web, database, UI).

Q: What does a controller convert, and what does a presenter convert?
A: A controller converts external input into a use-case request model and calls the use case; a presenter converts a use-case response model into a display-ready view model.

Q: Where do SQL and ORM code belong?
A: In gateways (repository implementations) in the Interface Adapters layer — never in use cases or entities.

Q: What lives in the Frameworks & Drivers layer, and how much code should you write there?
A: The web framework, database, UI, and device drivers — volatile details. You write as little as possible: mostly configuration and glue.

Q: What is a "humble" view?
A: A view with no logic that simply renders a view model prepared by a presenter, so there's nothing in it worth unit-testing.

Q: Why keep controllers thin?
A: So business rules stay in use cases (reusable across delivery mechanisms) and the web framework remains a swappable outer detail.

# Exercises

### Easy
For an endpoint you know, list which parts are the **controller**, the **use case**, the **gateway**,
and the **presenter/view**. Note anything currently in the wrong place.

### Medium
Write a thin controller (pseudocode) that converts a request into a use-case input and calls it, plus a
presenter that turns the use case's output into a view model. Keep all rules out of both.

### Challenging
Find a "fat controller" or a use case that contains SQL. Refactor on paper: move rules into a use
case/entity, move persistence into a gateway behind an interface, and describe what you could now swap
(framework or database) without touching the core.

# Further Reading

- Robert C. Martin — *Clean Architecture* (2017), ch. 22–23: "The Clean Architecture" and "Presenters and Humble Objects"
- Robert C. Martin — *The Clean Architecture* (2012): <https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html>
- Martin Fowler — *Presentation Domain Data Layering*: <https://martinfowler.com/bliki/PresentationDomainDataLayering.html>
- Martin Fowler — *GUI Architectures* (MVC/MVP background): <https://martinfowler.com/eaaDev/uiArchs.html>
