---
id: lesson-10
slug: crossing-boundaries
title: "Crossing Boundaries"
level: intermediate
order: 10
duration: 22
tags:
  - boundaries
  - input-output-ports
  - request-response-models
  - flow-of-control
  - dtos
summary: "The mechanics of an architectural boundary crossing — input and output ports as the interfaces control passes through, request and response models as the data that crosses, and how dependency inversion lets the flow of control cross a boundary in the opposite direction to the source-code dependency."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Describe what happens when control **crosses an architectural boundary**.
- Use **input ports** and **output ports** to let control cross while dependencies point inward.
- Define **request** and **response models** and why they, not entities, cross the boundary.
- Recognize when the flow of control goes "against" the source-code dependency and how DIP fixes it.

# Why It Matters

A boundary is only useful if things can *cross* it — a request has to get in, and a result has to get
out. The art is letting that happen without letting the two sides become entangled. This lesson turns the
abstract Dependency Rule into a concrete, repeatable crossing mechanism you'll use in every feature you
build from here on.

# Concept Explanation

### What a boundary crossing is

An **architectural boundary** is a line between two components where you control dependencies. A
**crossing** is any moment control passes from one side to the other — a controller invoking a use case,
a use case invoking a gateway, a use case handing a result to a presenter.

There are two kinds of crossing, and they need different handling:

- **Calling with the flow (inward):** an outer component calls an inner one. This is easy — the outer
  code depends inward, which the Dependency Rule already allows. A controller calling a use case is this
  kind.
- **Calling against the flow (outward):** an inner component needs to trigger an outer one. This is the
  hard case, because a naive call would make the inner code depend outward. **DIP** resolves it: the
  inner component calls **through an interface it owns**, which the outer component implements.

### Input ports and output ports

Two interfaces make a full boundary crossing clean:

- An **input port** is the interface a use case *exposes* so drivers can invoke it. The controller
  depends on the input port and calls it. (Often the input port is just the use-case interface itself.)
- An **output port** is the interface a use case *owns and calls* to send results outward. The presenter
  (or another outer component) implements the output port. Control flows out; the dependency points in.

```typescript
// Input port: how the outside asks the use case to run.
interface PlaceOrderInput {
  place(req: PlaceOrderRequest): void;
}

// Output port: how the use case reports results outward (owned by the use case).
interface PlaceOrderOutput {
  present(res: PlaceOrderResponse): void;
}

class PlaceOrder implements PlaceOrderInput {
  constructor(private readonly output: PlaceOrderOutput, private readonly orders: OrderRepository) {}
  place(req: PlaceOrderRequest): void {
    // ...apply rules via entities...
    this.output.present({ orderId: '...', total: '...' }); // call outward through the port
  }
}
```

The controller depends on `PlaceOrderInput`; the presenter depends on `PlaceOrderOutput`; both point
inward. The use case depends on neither the controller nor the presenter.

### Request and response models cross the boundary

Notice `PlaceOrderRequest` and `PlaceOrderResponse` in the code. These are **request/response models** —
plain data structures created specifically to cross the boundary. They carry only what the use case
needs (request) or produces (response), in a form that mentions nothing framework-specific.

Rules for what crosses:

- **Never pass an entity across a boundary.** Entities carry behavior and rules that outer code
  shouldn't depend on; passing them tempts violations and couples the sides.
- **Never pass a database/ORM object inward.** That would make the inner side know the database.
- **Cross with a purpose-built, isolated data structure.** When in doubt, make a new little type for the
  crossing.
- **Keep the data structure's dependencies pointing inward** — the outer side may depend on the request
  model, but the request model must not depend on the outer side.

### Against the flow, visualized

```text
                    flow of control
 Controller ──────────────▶ PlaceOrder ──────────────▶ Presenter
    │  depends on               │  owns & calls              ▲
    ▼                           ▼                            │ implements
 «PlaceOrderInput»        «PlaceOrderOutput» ◀───────────────┘
    ▲                           ▲
    └── source-code deps point inward (toward the use case) ──┘
```

Control marches left-to-right through the whole feature; every source-code dependency points toward the
center. That opposition — control one way, dependencies the other — is the signature of a well-made
boundary.

# Key Terminology

- **Boundary crossing** — any transfer of control from one side of an architectural boundary to the other.
- **Input port** — the interface a use case exposes so drivers can invoke it.
- **Output port** — the interface a use case owns and calls to send results outward; implemented by an outer component.
- **Request model** — a plain data structure carrying a use case's inputs across the boundary.
- **Response model** — a plain data structure carrying a use case's outputs across the boundary.
- **Against the flow** — a crossing where control goes outward; resolved by calling through an owned interface (DIP).

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Returning a result | `return` a response model from the use case | Push it through an output-port presenter | A return value is simpler; an output port suits multiple/streamed outputs or strict Clean-style presenters. |
| Data crossing the boundary | Reuse the entity | Purpose-built request/response model | Use a dedicated model so neither side binds to the other's internals. |
| Input port identity | Separate interface | The use-case class's own public method | A separate interface aids swapping/mocking; the method alone is fine for small systems. |

# Worked Example

A crossing that goes against the flow — sending a notification mid-use-case:

```typescript
interface Notifier { orderPlaced(orderId: string): void; } // output-ish port, owned inward

class PlaceOrder {
  constructor(private readonly notifier: Notifier) {}
  place(req: PlaceOrderRequest) {
    // ...rules...
    this.notifier.orderPlaced('ord_123'); // control flows OUT to whoever notifies
  }
}
// Outer adapter implements the inward-owned interface:
class SlackNotifier implements Notifier { orderPlaced(id: string) { /* HTTP to Slack */ } }
```

At runtime `PlaceOrder` reaches out to Slack. In source, `SlackNotifier` depends on `Notifier`, which
lives with the use case. The crossing went outward; the dependency stayed inward.

# Real World Analogy

A restaurant **kitchen pass** is a boundary. Orders come *in* on a ticket (a **request model**) — a
standardized slip, never the customer themselves wandering into the kitchen. Finished plates go *out*
through the same pass on a tray (a **response model**). The kitchen defines the format of the ticket and
the tray (the **ports**); the waiters and diners conform to it. Control (the order, then the plate) crosses
back and forth, but the kitchen never depends on any particular customer — only on the ticket format it
set.

# Examples

## Example 1 — Basic: which port is this?

A use case needs to display a progress percentage as it runs. What kind of port does it call? Answer: an
**output port** it owns, implemented by a presenter — control flows outward while the dependency points
inward.

**Why this works:** the use case produces output and must reach the display without depending on it, the
exact role of an output port.

## Example 2 — Real-world: swapping the delivery, keeping the crossing

A `PlaceOrder` use case is invoked through an input port. Today a REST controller calls it; tomorrow a
GraphQL resolver and a message-queue consumer both call the *same* input port with the same request
model. None of the use case changes.

**Why this works:** the request model and input port isolate the use case from *how* it's invoked, so new
drivers just build their own request model and call in.

## Example 3 — Pitfall: leaking an entity across

To "avoid mapping," a team returns the `Order` entity straight to the web layer, which then reads and even
mutates its fields to render a page. Later, changing an entity rule silently breaks the web view, and the
web view's needs start dictating the entity's shape.

**Why this bites:** an entity crossed the boundary, so the outer layer became coupled to inner internals —
precisely what request/response models exist to prevent.

# Common Mistakes

- **Calling outward directly from an inner component.** Always call through an interface the inner side
  owns.
- **Passing entities or ORM objects across boundaries.** Use dedicated request/response models.
- **Letting the request/response model depend on the framework.** It must stay a plain, inward-pointing
  structure.
- **Skipping the boundary for "simple" features,** then paying when a second driver or store appears.

# Best Practices

- Model each crossing explicitly with an **input port**, an **output port** (or a return value), and
  **request/response models**.
- Keep crossing data **plain and purpose-built**; map at the edge.
- Ensure every boundary interface is **owned by the inner side**.
- Verify each feature: control may flow outward, but **every source dependency points inward**.

# Summary

- A **boundary crossing** transfers control between components; calling **inward** is easy, calling
  **outward** needs an interface the inner side owns (DIP).
- **Input ports** let drivers invoke a use case; **output ports** let the use case report results outward
  without depending on the outer layer.
- **Request and response models** — plain, dedicated data structures — are what cross the boundary; never
  entities or ORM objects.
- A healthy boundary shows **control flowing one way and source dependencies the other**.

# Flash Cards

Q: What is the difference between calling "with the flow" and "against the flow" across a boundary?
A: Calling with the flow is an outer component calling inward (already allowed); calling against the flow is an inner component triggering an outer one, which requires calling through an interface the inner side owns.

Q: What is an input port versus an output port?
A: An input port is the interface a use case exposes so drivers can invoke it; an output port is an interface the use case owns and calls to send results outward, implemented by an outer component.

Q: What data should cross an architectural boundary?
A: Purpose-built request and response models (plain data structures) — never entities or database/ORM objects.

Q: When control flows outward across a boundary, which way does the source-code dependency point, and why?
A: Inward — because the inner component calls through an interface it owns, which the outer component implements (dependency inversion).

Q: Why not return the entity directly to the web layer?
A: It couples the outer layer to the entity's internals and lets the view's needs distort the entity; a response model keeps the sides independent.

Q: In a well-made boundary, how do control flow and dependency direction relate?
A: They point in opposite directions: control can flow outward while every source-code dependency points inward.

# Exercises

### Easy
For a feature you know, write its **request model** and **response model** as plain field lists. Confirm
neither mentions a framework or database type.

### Medium
Sketch a use case with an input port and an output port. Draw the flow-of-control arrows and the source-
dependency arrows and confirm they oppose each other.

### Challenging
Find code where an inner function calls an outer service directly (e.g., a domain function calling an
HTTP client). Introduce an output port it owns, move the concrete call to an adapter, and describe the
request/response data that now crosses the boundary.

# Further Reading

- Robert C. Martin — *Clean Architecture* (2017), ch. 17 "Boundaries" and ch. 19 "Policy and Level"
- Robert C. Martin — *Clean Architecture* (2017), ch. 22–23 (input/output ports, presenters)
- Alistair Cockburn — *Hexagonal Architecture*: <https://alistair.cockburn.us/hexagonal-architecture/>
- Martin Fowler — *DataTransferObject*: <https://martinfowler.com/eaaCatalog/dataTransferObject.html>
