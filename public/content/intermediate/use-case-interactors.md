---
id: lesson-11
slug: use-case-interactors
title: "Use-Case Interactors"
level: intermediate
order: 11
duration: 22
tags:
  - interactors
  - use-cases
  - request-response
  - orchestration
  - testability
summary: "How to actually write a use case — the interactor at the center, its input boundary and request model, the entities and gateway interfaces it orchestrates, and its output boundary and response model — built end-to-end for one feature and kept entirely free of frameworks so it can be tested in isolation."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Identify the parts of a **use-case interactor**: input boundary, request model, interactor, output
  boundary, response model.
- Write an interactor that **orchestrates** entities and gateway interfaces.
- Report success and failure through an **output boundary** without knowing the UI.
- Keep an interactor **framework-free** so it's unit-testable in isolation.

# Why It Matters

Use cases are where your application's behavior actually lives. A well-written interactor reads like a
clear statement of what the feature does, mentions no framework, and can be tested in milliseconds with
fakes. A badly written one becomes a dumping ground of validation, SQL, and formatting that no one dares
touch. This lesson gives you a repeatable shape for the good version.

# Concept Explanation

### Anatomy of an interactor

A full use case has five collaborating parts (names from Clean Architecture):

```text
   Controller ─▶ «Input Boundary» ─▶ [ Interactor ] ─▶ «Output Boundary» ─▶ Presenter
                     (input port)         │                (output port)
                 RequestModel  ──────────▶│──────────▶  ResponseModel
                                          ▼
                                 Entities + «Gateways»
```

- **Input boundary** — the interface the interactor exposes to be driven.
- **Request model** — a plain structure of inputs the interactor needs.
- **Interactor** — the class that runs the use case, orchestrating entities and gateways.
- **Output boundary** — the interface the interactor calls to report results.
- **Response model** — a plain structure of outputs the interactor produces.

The interactor depends only inward: on **entities** and on **interfaces it owns** (gateways, output
boundary). It never imports a controller, a presenter implementation, a framework, or a database.

### The interactor orchestrates; entities decide

The interactor is a **conductor**, not a soloist. It gathers inputs, loads entities through gateways,
lets the *entities* enforce their rules, coordinates the steps, and reports a result. Business rules that
belong to the domain live in **entities**; the interactor supplies only the application-specific glue —
the order of operations for *this* feature.

### Reporting results through the output boundary

Rather than returning HTML or throwing framework exceptions, the interactor calls its **output boundary**
with a response model. That output boundary is implemented by a presenter (outer), so the interactor
stays ignorant of the UI. Both success and failure go out this way — a failed validation becomes a
response the presenter can render as an error page, a JSON error, or a CLI message, its choice.

### A complete example: register a user

```typescript
// ---- boundaries & models (owned by the use-case layer) ----
interface RegisterUserInput { register(req: RegisterUserRequest): void; }
interface RegisterUserOutput { present(res: RegisterUserResponse): void; }
interface UserGateway {
  existsByEmail(email: string): boolean;
  save(user: User): void;
}
type RegisterUserRequest = { email: string; password: string };
type RegisterUserResponse =
  | { ok: true; userId: string }
  | { ok: false; error: string };

// ---- the interactor ----
class RegisterUser implements RegisterUserInput {
  constructor(
    private readonly users: UserGateway,     // interface it owns
    private readonly output: RegisterUserOutput,
  ) {}

  register(req: RegisterUserRequest): void {
    if (this.users.existsByEmail(req.email)) {
      return this.output.present({ ok: false, error: 'Email already registered' });
    }
    // Entity enforces its own rule (e.g., password strength) and may throw a domain error.
    const user = User.create(req.email, req.password);
    this.users.save(user);
    this.output.present({ ok: true, userId: user.id });
  }
}
```

Read it top to bottom: it states the feature plainly, defers the domain rule to `User.create`, talks to a
`UserGateway` interface (not a database), and reports through `RegisterUserOutput` (not a screen). There
is nothing framework-specific to see.

### Why this is trivially testable

Because every collaborator is an interface, a test supplies **fakes**: an in-memory `UserGateway` and a
capturing `RegisterUserOutput`. No web server, no database, no mocking framework required.

```typescript
const users = new InMemoryUserGateway();
const output = new CapturingOutput();
new RegisterUser(users, output).register({ email: 'a@b.com', password: 'longenough12' });
// assert: output.last === { ok: true, userId: ... } and users now contains the user
```

# Key Terminology

- **Interactor** — the class implementing a use case; orchestrates entities and gateways to fulfill one goal.
- **Input boundary** — the interface a driver uses to invoke the interactor.
- **Output boundary** — the interface the interactor calls to report results, implemented by a presenter.
- **Request model / response model** — plain input/output data structures for the use case.
- **Gateway** — an interface (owned by the use-case layer) for loading and saving entities.
- **Orchestration** — coordinating the steps and collaborators of one operation without embedding domain rules.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Reporting the result | Call an output boundary (presenter) | Return the response model | Output boundary matches strict Clean style and multi-output cases; returning is simpler and fine for many apps. |
| Validation location | All in the interactor | Domain invariants in entities, app checks in interactor | Keep general rules in entities; put application-specific checks (uniqueness, auth) in the interactor. |
| One class or many | A big service with many methods | One interactor per use case | Prefer one interactor per goal for cohesion and testability. |

# Worked Example

Trace `RegisterUser` for a duplicate email:

```text
1. Controller builds RegisterUserRequest { email, password } and calls register().
2. Interactor asks UserGateway.existsByEmail → true.
3. Interactor calls output.present({ ok:false, error:'Email already registered' }).
4. Presenter turns that into a 409 response / an error banner / a CLI line — its choice.
```

The interactor made one decision (email taken → report an error) using only interfaces. Swap the web for
a CLI, or Postgres for in-memory, and steps 1–4 read identically.

# Real World Analogy

An interactor is an **orchestra conductor**. The conductor doesn't play an instrument (doesn't contain
the domain rules) — the musicians (entities) do that. The conductor reads the score for *this*
performance (the use case), cues each section in order (orchestration), and signals the result to the
front of house (the output boundary). Change the concert hall (the framework) or the recording equipment
(the database) and the conductor's job is unchanged.

# Examples

## Example 1 — Basic: what belongs in the interactor?

Should "hash the password" live in the interactor? Answer: the *decision to require hashing* is a domain
concern (put it in the `User`/`Password` entity), but *invoking a hashing service* is done through a
gateway/port the interactor owns. The interactor orchestrates; it doesn't implement crypto inline.

**Why this works:** it keeps the domain rule in the entity and the mechanism behind an interface, so both
stay swappable and testable.

## Example 2 — Real-world: three drivers, one interactor

`RegisterUser` is driven by a web signup form, an admin bulk-import script, and an integration test. All
three build a `RegisterUserRequest` and call the input boundary; all three get results via an output
boundary or return value. Zero duplication of registration logic.

**Why this works:** the interactor's ignorance of its driver lets every entry point reuse it.

## Example 3 — Pitfall: the interactor that knew too much

An interactor imports the web framework's `Response` object to set status codes and the ORM's `Model` to
query. Now it can't run in a test without booting both, and a framework upgrade breaks the use case.

**Why this bites:** the interactor took on outer responsibilities (HTTP, ORM), coupling application rules
to volatile details and destroying isolation.

# Common Mistakes

- **Embedding domain rules in the interactor** instead of delegating to entities.
- **Returning framework objects** (HTTP responses, ORM rows) from the interactor.
- **Talking to the database directly** rather than through a gateway interface.
- **One giant "service"** handling many use cases, which erodes cohesion and testability.

# Best Practices

- Give each use case **its own interactor** with clear request/response models.
- Depend only on **entities and owned interfaces**; keep frameworks and databases out.
- Delegate **domain rules to entities**; keep only **orchestration** in the interactor.
- Report **success and failure** through the output boundary (or a returned response model), never via UI
  concerns.

# Summary

- A use case is an **interactor** plus its **input/output boundaries** and **request/response models**.
- The interactor **orchestrates** entities and gateway interfaces; entities hold the domain rules.
- Results — success or failure — are reported through an **output boundary** (or returned), keeping the
  UI unknown to the use case.
- Because every collaborator is an interface, the interactor is **framework-free and unit-testable** with
  simple fakes.

# Flash Cards

Q: What are the five parts of a full use-case interactor?
A: The input boundary (input port), the request model, the interactor itself, the output boundary (output port), and the response model.

Q: What is the interactor's job relative to entities?
A: The interactor orchestrates — it coordinates the steps and collaborators of one use case — while the entities hold and enforce the domain rules.

Q: How does an interactor report its result without knowing the UI?
A: It calls an output boundary (an interface it owns) with a response model; a presenter implements that boundary and decides how to display it.

Q: What may an interactor depend on?
A: Only inward things: entities and interfaces it owns (gateways, the output boundary). Not controllers, presenters, frameworks, or databases.

Q: Why is a well-formed interactor easy to test?
A: All its collaborators are interfaces, so a test can supply in-memory fakes and a capturing output — no web server, database, or mocking framework needed.

Q: Where should a uniqueness check like "email already registered" go?
A: In the interactor (an application-specific rule using a gateway), whereas general invariants like password strength belong in the entity.

# Exercises

### Easy
Pick a feature and write its **request model** and **response model** (including a failure case) as field
lists. Note which fields are inputs and which are outputs.

### Medium
Write an interactor (pseudocode or TypeScript) for "change email address": check the new email isn't
taken via a gateway, update the entity, save, and report success/failure through an output boundary or
return value. Keep it framework-free.

### Challenging
Take a controller in a real project that contains business logic and database calls. Extract a clean
interactor with an input boundary, request/response models, and gateway interfaces. Then write (in words)
the in-memory fakes you'd use to unit-test it with no framework.

# Further Reading

- Robert C. Martin — *Clean Architecture* (2017), ch. 20 "Business Rules" and ch. 22–23 (interactors, boundaries, presenters)
- Robert C. Martin — *The Clean Architecture* (2012): <https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html>
- Alistair Cockburn — *Hexagonal Architecture*: <https://alistair.cockburn.us/hexagonal-architecture/>
- Ivar Jacobson — *Object-Oriented Software Engineering* (1992), the origin of use cases
