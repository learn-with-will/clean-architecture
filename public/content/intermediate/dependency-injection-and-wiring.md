---
id: lesson-13
slug: dependency-injection-and-wiring
title: "Dependency Injection and Wiring"
level: intermediate
order: 13
duration: 20
tags:
  - dependency-injection
  - composition-root
  - main-component
  - wiring
  - containers
summary: "Where all the concrete pieces get connected — the Main component or composition root as the outermost, most detailed part of the system that instantiates implementations and injects them into the abstractions that need them, why nothing should depend on it, and how manual wiring compares to a DI container."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain the role of the **Main component / composition root** in a Clean Architecture system.
- Describe why **Main is the dirtiest, outermost** detail and why nothing depends on it.
- Wire a small system with **manual constructor injection**.
- Compare **manual wiring** to a **DI container** and choose sensibly.

# Why It Matters

You've spent several lessons making inner code depend only on abstractions. But *someone* has to create
the concrete `PostgresRepository`, the `SesMailer`, and the interactors, and connect them. If that
"someone" is scattered through your codebase, concretions leak everywhere and the Dependency Rule
crumbles. The answer is to concentrate all wiring in **one** place — the composition root — so the rest
of the system stays clean.

# Concept Explanation

### The Main component

Every program has a starting point — a `main` function or bootstrap file. In Clean Architecture this is
the **Main component**, and it has a special status: it is the **lowest-level, outermost, dirtiest**
module in the system. Main is where the ugly, concrete truth lives — which database, which framework,
which config — precisely so that nothing else has to know.

The key property: **Main depends on everything; nothing depends on Main.** It sits outside even the
frameworks ring, plugs the pieces together, and hands control to the application. Because no other module
imports it, all its concrete knowledge is quarantined.

### The composition root

The single place where you **compose** the object graph — instantiate concrete implementations and inject
them into the abstractions that need them — is called the **composition root** (a term from Mark
Seemann). It usually lives in (or is called by) Main. The rule of thumb: **construct your objects as
close to the program's entry point as possible, in one place.**

This is where the `new` keyword belongs. Inner layers avoid `new`-ing their volatile collaborators (they
receive them via injection); the composition root is the one spot allowed to name concrete classes and
wire them together.

### Wiring by hand

Manual wiring is just constructor calls in the right order:

```typescript
// composition root — the only place that names concrete implementations
export function buildApp(config: Config) {
  // driven adapters (concrete)
  const db = new PostgresConnection(config.databaseUrl);
  const users = new PostgresUserGateway(db);
  const mailer = new SesMailer(config.awsRegion);

  // use cases (inner) receive interfaces via injection
  const register = new RegisterUser(users, mailer);

  // driving adapters (concrete) receive the use cases
  const controller = new RegisterUserController(register);

  return { controller };
}

// main
const { controller } = buildApp(loadConfig());
startWebServer(controller);
```

Read the dependency directions: `RegisterUser` depends on the `UserGateway` and `Mailer` *interfaces*;
`buildApp` is the only code that knows those interfaces are really Postgres and SES. Swap either by
editing this one function.

### Injection styles

- **Constructor injection** (preferred) — dependencies are required parameters of the constructor, so an
  object can't exist without them. Makes dependencies explicit and objects always valid.
- **Setter/property injection** — dependencies set after construction; risks half-built objects. Use
  sparingly.
- **Interface injection** — the dependency is passed into a method. Rare.

Default to **constructor injection**; it pairs naturally with the interactors you've been writing.

### Manual wiring vs a DI container

A **DI container** (also confusingly called an "IoC container") automates construction: you register
which implementation satisfies which interface, and it builds the graph for you.

```text
Manual wiring            DI container
─────────────            ────────────
explicit, greppable      less boilerplate at scale
no library               a dependency + its conventions
easy to follow           can hide the graph / add "magic"
great for small/medium   helpful for large graphs
```

Neither is "the architecture." Recall from the DIP lesson: **a container does not make you compliant with
DIP** — if your inner code still imports concretions, you've violated the rule no matter how you
construct objects. Many teams start with manual wiring and adopt a container only when the graph grows
unwieldy.

# Key Terminology

- **Main component** — the outermost, lowest-level module that everything is plugged into; depends on everything, depended on by nothing.
- **Composition root** — the single place where concrete implementations are created and injected into abstractions.
- **Constructor injection** — supplying dependencies as required constructor parameters (the preferred style).
- **DI container / IoC container** — a library that constructs the object graph from registered mappings.
- **Object graph** — the network of constructed objects and the dependencies connecting them.
- **Wiring** — the act of connecting concrete implementations to the interfaces that need them.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| How to construct the graph | Manual wiring | DI container | Manual for small/medium and clarity; a container when the graph is large and repetitive. |
| Injection style | Constructor | Setter/property | Prefer constructor (objects always valid); setters only for genuinely optional dependencies. |
| Where `new` appears | Anywhere convenient | Only at the composition root | Confine `new` of volatile types to the composition root; elsewhere, inject. |

# Worked Example

Change the database in one place. Given the `buildApp` above, switching Postgres to an in-memory store
for a test is a single edit at the composition root:

```typescript
export function buildAppForTest() {
  const users = new InMemoryUserGateway();     // swapped
  const mailer = new FakeMailer();             // swapped
  const register = new RegisterUser(users, mailer);
  return { controller: new RegisterUserController(register), users, mailer };
}
```

`RegisterUser`, `RegisterUserController`, and every entity are byte-for-byte the same. Only the wiring
changed — the payoff of concentrating construction in one root.

# Real World Analogy

Think of a **stage crew before a show**. During the performance, actors (use cases) never run around
plugging in cables — they just act. Before the curtain, the **stage crew** (composition root) connects
every microphone, light, and speaker (concrete adapters) to the right jacks (interfaces). If a venue uses
different equipment, only the crew's setup changes; the script and the actors don't. The crew is
backstage (Main) — essential, but no one in the audience or cast depends on *them*.

# Examples

## Example 1 — Basic: where does `new PostgresGateway()` belong?

In a use case, or at the composition root? Answer: the **composition root**. Use cases receive a gateway
*interface* by injection; only the root names the concrete Postgres class.

**Why this works:** keeping `new` of volatile types at the root preserves inward-pointing dependencies
everywhere else.

## Example 2 — Real-world: two entry points, one wiring module

An app runs both a web server and a nightly worker. Both call the same `buildApp` to construct the object
graph, then attach their own driving adapter (HTTP vs scheduler). The business graph is defined once and
reused.

**Why this works:** the composition root centralizes construction, so multiple entry points share
identical, correctly wired objects.

## Example 3 — Pitfall: scattered construction

A codebase calls `new StripeClient()` inside three different use cases "for convenience." When Stripe's
constructor signature changes and a second payment provider is needed, the team must edit many inner
files and can't swap providers without touching business logic.

**Why this bites:** construction leaked out of the root into inner layers, spreading a concretion across
the system and breaking the ability to swap it.

# Common Mistakes

- **Constructing volatile dependencies inside inner layers** instead of injecting them.
- **Believing a DI container equals good architecture.** It's a construction tool; DIP is about what you
  depend on.
- **Spreading wiring across many files,** so no one place shows the object graph.
- **Overusing setter injection,** leaving objects half-initialized and invalid.

# Best Practices

- Keep a **single composition root** near the entry point; construct the graph there.
- Prefer **constructor injection**; make dependencies explicit and required.
- Confine `new` of **volatile** implementations to the root; inject everywhere else.
- Reach for a **container only when** the manual graph becomes genuinely unwieldy — and keep inner code
  free of container annotations.

# Summary

- The **Main component** is the outermost, dirtiest module: it depends on everything and nothing depends
  on it.
- The **composition root** is the one place that instantiates concrete implementations and injects them
  into the abstractions that need them — the home of the `new` keyword for volatile types.
- Prefer **constructor injection**; keep inner layers construction-free.
- **Manual wiring vs a DI container** is a convenience trade-off, not an architectural one — neither makes
  you DIP-compliant on its own.

# Flash Cards

Q: What is special about the Main component's dependencies?
A: Main depends on everything, but nothing depends on Main. It's the outermost, lowest-level module, so its concrete knowledge is quarantined from the rest of the system.

Q: What is a composition root?
A: The single place — near the program's entry point — where concrete implementations are constructed and injected into the abstractions that need them.

Q: Where is the `new` keyword for volatile dependencies allowed to live?
A: At the composition root. Inner layers receive their collaborators by injection rather than constructing them.

Q: Which injection style is preferred, and why?
A: Constructor injection, because dependencies become required parameters, so objects can't exist in a half-built or invalid state and their needs are explicit.

Q: Does using a DI container mean you're following the Dependency Inversion Principle?
A: No. A container only constructs objects; if inner code still imports concretions, DIP is violated regardless of how objects are built.

Q: Why concentrate all wiring in one place?
A: So concrete choices (database, framework, providers) can be changed by editing one module, and no concretion leaks into inner layers.

# Exercises

### Easy
Find (or imagine) the entry point of a project. List every place a concrete adapter is constructed with
`new`. Are they all in one composition root, or scattered?

### Medium
Write a small composition root that wires a use case with a gateway and a mailer, then a second variant
that swaps in in-memory fakes for tests. Keep the use case and entities identical between them.

### Challenging
Take a project where use cases construct their own dependencies. Refactor construction into a single
composition root using constructor injection, and describe one detail (database or provider) you can now
swap by editing only that root.

# Further Reading

- Robert C. Martin — *Clean Architecture* (2017), ch. 26 "The Main Component"
- Mark Seemann — *Dependency Injection Principles, Practices, and Patterns* (the "Composition Root" concept): <https://blog.ploeh.dk/2011/07/28/CompositionRoot/>
- Martin Fowler — *Inversion of Control Containers and the Dependency Injection pattern*: <https://martinfowler.com/articles/injection.html>
- Robert C. Martin — *The Clean Architecture* (2012): <https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html>
