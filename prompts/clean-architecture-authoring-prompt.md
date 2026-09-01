# Clean Architecture Course — Authoring Prompt & No-Hallucination Contract

This file is the contract for writing and maintaining the **Clean Architecture** course in this repo.
Every lesson and quiz must obey it. The goal: a beginner-friendly, **source-cited** course on designing
maintainable systems — the Dependency Rule, the layers, ports & adapters, boundaries, and dependency
inversion — with **zero invented facts** and **precise attribution**.

## Audience & voice

- **Suitable for everyone.** Assume the reader is a working or aspiring developer who is new to
  software architecture. They can read simple code but may have never heard "use case," "boundary,"
  or "dependency inversion." Define every term the first time it appears. Prefer short sentences and
  concrete examples.
- Explain the *why*, not just the *how*. Use **one plain-language analogy per lesson** (buildings,
  wiring, power sockets, restaurants, org charts — anything that makes an abstract idea physical).
- Be honest about **cost and trade-offs**. Clean Architecture is not free: boundaries add indirection,
  DTOs add mapping code, and abstractions you don't need are waste. Never preach "always add an
  interface." Name when a rule is worth it and when it is over-engineering (YAGNI).
- Keep code **minimal and runnable-in-principle**, written in **TypeScript** (readable, statically
  typed, shows interfaces clearly). Prefer tiny, self-contained snippets — an interface, a class, a
  wiring function. Use `text` fences for folder trees, layer diagrams, and console output. Code is an
  *illustration of structure*, not a framework tutorial.

## Currency & honesty

- Clean Architecture is a set of **principles**, not a product with version numbers. Do **not** invent
  version numbers, benchmarks, dates, or "fastest/most popular" claims. Where a date or edition
  matters (e.g. the 2012 blog post, the 2017 book, Cockburn's 2005 article, Palermo's 2008 posts),
  state it only if it is accurate; otherwise say "as originally described."
- Quote the primary authors' own definitions where possible (the Dependency Rule, the goal of
  architecture, the SOLID names). If a claim isn't backed by a source below (or another primary
  source), don't write it — qualify it or leave it out. Never put words in Robert C. Martin's,
  Alistair Cockburn's, or Jeffrey Palermo's mouth.

## Authoritative sources (cite these; do not invent)

- **Robert C. Martin — *Clean Architecture: A Craftsman's Guide to Software Structure and Design***
  (Prentice Hall, 2017). The book: SOLID, component principles, the Dependency Rule, boundaries,
  "the database/web is a detail," partial boundaries, services.
- **Robert C. Martin — "The Clean Architecture"** (2012) —
  <https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html> — the four-circle
  diagram and the Dependency Rule in his own words.
- **Robert C. Martin — "Screaming Architecture"** (2011) —
  <https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html>.
- **The Clean Code Blog** — <https://blog.cleancoder.com/> — SOLID essays and related posts.
- **Alistair Cockburn — Hexagonal Architecture (Ports & Adapters)** —
  <https://alistair.cockburn.us/hexagonal-architecture/> — the original definition, ports/adapters,
  primary vs secondary.
- **Jeffrey Palermo — The Onion Architecture** (2008) —
  <https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/> (and parts 2–4).
- **Martin Fowler** — <https://martinfowler.com/> — especially *Inversion of Control Containers and
  the Dependency Injection pattern* (<https://martinfowler.com/articles/injection.html>), *InversionOfControl*,
  and *PresentationDomainDataLayering*.
- **Eric Evans — *Domain-Driven Design*** (Addison-Wesley, 2003) — entities, value objects, the
  domain model. A distinct body of work; cite it only where it genuinely overlaps, and label it as
  DDD, not Clean Architecture.
- **Robert C. Martin — *Agile Software Development, Principles, Patterns, and Practices* (PPP)**
  (2002) — the origin of the SOLID principles and the component principles.
- **Barbara Liskov** — the Liskov Substitution Principle (keynote "Data Abstraction and Hierarchy,"
  1987) — attribute the "L" in SOLID to her.

## High-risk facts to get right (anti-hallucination checklist)

These are the classic places architecture material goes wrong — through vague hand-waving or
conflation. Getting them right is the point of the course.

1. **Three architectures are related but DISTINCT — attribute precisely.**
   - **Clean Architecture** — Robert C. Martin (blog 2012, book 2017).
   - **Hexagonal Architecture / Ports & Adapters** — Alistair Cockburn (c. 2005).
   - **Onion Architecture** — Jeffrey Palermo (2008).
   They *share* the idea that source-code dependencies point inward, toward the domain, and Martin
   explicitly says Clean Architecture integrates ideas from the others. But they have different
   origins, vocabularies, and emphases. **Never** say Martin invented hexagonal, or that they are
   "the same thing," or attribute onion to Cockburn, etc.
2. **DIP ≠ DI ≠ IoC.** Keep these three separate and defined:
   - **Dependency Inversion Principle (DIP)** — the "D" in SOLID, a *design principle*: high-level
     modules should not depend on low-level modules; both depend on **abstractions**. Abstractions
     should not depend on details; details depend on abstractions. It is about the **direction of
     source-code dependencies**.
   - **Dependency Injection (DI)** — a *technique* for supplying a component's dependencies from the
     outside (constructor/setter/interface injection) instead of the component creating them. It is
     **one way to implement** DIP, not the principle itself.
   - **Inversion of Control (IoC)** — a *broad* idea where a framework/runtime, not your code, drives
     the flow ("don't call us, we'll call you," the Hollywood Principle). DI is a specific form of
     IoC applied to acquiring dependencies; an "IoC container" is a DI container. (Anchor on Fowler.)
3. **The Dependency Rule is about SOURCE-CODE dependencies, not the runtime flow of control.** "Source
   code dependencies must point only inward, toward higher-level policies." At runtime, control often
   flows *outward* across a boundary (a use case triggers a database write). That is not a violation:
   DIP resolves it by putting an **interface** at the boundary so the source dependency still points
   inward while control flows outward. Never conflate "A depends on B" (compile-time) with "A calls B"
   (runtime).
4. **The four circles are an EXAMPLE, not a law.** Entities · Use Cases · Interface Adapters ·
   Frameworks & Drivers is the canonical diagram, but Martin explicitly writes there is **no rule that
   there are exactly four** layers — there may be more. The *rule* is the Dependency Rule; the number
   of rings is illustrative.
5. **Entities vs Use Cases — don't swap them.** **Entities** hold *Enterprise* Business Rules: the
   most general, highest-level policy that would exist even without this application; least affected
   by external change. **Use Cases (interactors)** hold *Application* Business Rules: application-
   specific orchestration of entities to achieve a user goal. Entities know nothing of use cases; use
   cases know entities but nothing of controllers/DB/UI.
6. **The UI, the database, the web, and frameworks are DETAILS.** Inner layers depend on **gateway /
   repository interfaces** that they own; the database, ORM, web framework, and UI live in the outer
   ring and implement those interfaces. "The database is a detail." "The web is a detail." "Frameworks
   are tools, not architectures — don't marry them." State these as Martin's positions.
7. **Interface Adapters convert data.** Controllers, presenters, and gateways live here. Their job is
   to **convert** data between the form most convenient for use cases & entities and the form most
   convenient for an external agency (DB rows, HTTP, the view). A **presenter** produces a **View
   Model**; the **View** is a Humble Object with no logic.
8. **Data that crosses a boundary is a simple structure (a DTO / request-response model), never an
   entity or a DB row.** Passing an entity or ORM row across a boundary couples layers and violates
   the Dependency Rule. Map to a plain data structure at the boundary.
9. **Boundaries have a COST; you should not fully implement all of them.** Martin devotes a chapter to
   **partial boundaries** and deferring decisions. Over-abstraction (interfaces and layers you don't
   need) is a real anti-pattern. The course must teach judgment, not ceremony. Say plainly when a full
   boundary is *not* worth it.
10. **SOLID — names, authors, and correct meanings.** SRP, OCP, LSP, ISP, DIP.
    - **SRP** is *not* "a function does one thing." It is: a module should have **one reason to
      change** — be responsible to **one actor/stakeholder**.
    - **OCP** — open for extension, closed for modification.
    - **LSP** — **Barbara Liskov's** substitutability: subtypes must be usable through the base type's
      contract without breaking it.
    - **ISP** — don't force clients to depend on methods they don't use.
    - **DIP** — see item 2.
11. **Component principles (advanced) have precise names — get the acronyms right.** Cohesion: **REP**
    (Reuse/Release Equivalence), **CCP** (Common Closure), **CRP** (Common Reuse). Coupling: **ADP**
    (Acyclic Dependencies Principle — no cycles in the component graph), **SDP** (Stable Dependencies —
    depend in the direction of stability), **SAP** (Stable Abstractions — a component's abstractness
    should rise with its stability). Mention **instability I = fan-out/(fan-in+fan-out)**, abstractness
    **A**, and the **Main Sequence** honestly, as metrics/heuristics, not laws.
12. **Hexagonal specifics.** Cockburn's own terms are **ports** (interfaces) and **adapters**
    (implementations). **Primary/driving** adapters (left) are actors that drive the application;
    **secondary/driven** adapters (right) are driven by it (DB, external services). The hexagon shape
    is just "room for several ports" — it does **not** mean six layers or six of anything.
13. **Onion specifics.** Palermo's Onion puts the **domain model** at the center, then domain services,
    then application services, with UI/infrastructure/tests on the outside; all couplings point toward
    the center and it is built explicitly on the Dependency Inversion Principle. It predates Clean
    Architecture (2008) and is one of its influences.
14. **Screaming Architecture.** The top-level structure should reveal the **use cases / domain** ("this
    is a health-care system"), not the delivery framework ("this is a Rails/Spring app"). It is about
    intent visible in structure; it does **not** mean "avoid frameworks entirely."
15. **Clean Architecture is not tied to a language, OOP, DDD, or microservices.** It applies to
    monoliths and to services; it works in OO and functional styles. **Service boundaries alone do not
    give you good architecture** — a system of microservices can still be a tangled monolith in
    disguise. Don't claim CA *requires* microservices, DDD, or a particular stack.
16. **Testability is a consequence, not the goal.** Because policy doesn't depend on volatile details,
    you can test use cases and entities without a DB, UI, or web server. "The tests are the outermost
    circle." But the **goal** of architecture (Martin) is to **minimize the lifetime cost / human
    effort** of the system and to **keep options (decisions) open** — testability follows from that.
17. **State the goal in Martin's terms, and stay honest about limits.** The aim is software that is
    independent of frameworks, UI, database, and any external agency, and cheap to change. Clean
    Architecture does **not** make code run faster, does **not** guarantee correctness, and **adds**
    indirection and up-front effort. Present costs alongside benefits every time.

## Lesson structure (match the shell + the other courses)

Front-matter (YAML): `id` (`lesson-NN`), `slug`, `title`, `level` (`beginner|intermediate|advanced`),
`order` (1–24), `duration` (minutes), `tags` (exactly 5), `summary` (one sentence — used to generate
the manifest). Then these H1 (`#`) sections, in order:

`Learning Objectives` · `Why It Matters` · `Concept Explanation` (use `###` subsections) ·
`Key Terminology` · `Options and Trade-offs` (a Markdown table) · `Worked Example` ·
`Real World Analogy` · `Examples` (`## Example 1/2/3`: basic, real-world, pitfall) ·
`Common Mistakes` · `Best Practices` · `Summary` · `Flash Cards` (≥5 `Q:`/`A:` pairs; put 6) ·
`Exercises` (`### Easy/Medium/Challenging`) · `Further Reading` (links to the sources above).

## Code fences (only these languages — enforced by the validator)

`typescript` (the **primary** language — interfaces, entities, use cases, adapters, wiring), `bash`
(tooling and shell commands), `json` (small config snippets like `package.json`/`tsconfig`), `text`
(folder trees, layer/boundary diagrams, console output). **No other fence languages.**

## Curriculum (24 lessons, 8/8/8)

Beginner: 01 what-is-clean-architecture · 02 why-architecture-matters · 03
coupling-cohesion-and-dependencies · 04 solid-principles-overview · 05 dependency-inversion-principle ·
06 the-dependency-rule · 07 entities-and-use-cases · 08 interface-adapters-and-frameworks.

Intermediate: 09 ports-and-adapters-hexagonal · 10 crossing-boundaries · 11 use-case-interactors · 12
entities-and-domain-model · 13 dependency-injection-and-wiring · 14 gateways-and-persistence · 15
presenters-and-the-ui · 16 testing-across-boundaries.

Advanced: 17 screaming-architecture · 18 component-principles · 19 organizing-modules-and-boundaries ·
20 partial-and-evolving-boundaries · 21 microservices-and-boundaries · 22 frameworks-and-details · 23
pitfalls-and-tradeoffs · 24 capstone-end-to-end.

## Quizzes

One per lesson: `public/quizzes/lesson-NN.json`, `id` `quiz-lesson-NN`, `lessonId` `lesson-NN`,
`passingScore` 60, 5–6 questions spanning the five types (`single-choice`, `multiple-choice`,
`fill-blank`, `ordering`, `match-pair`). Every answer must be traceable to the lesson text; add an
`explanation` to each. Keep `fill-blank` answers short and provide case variants. Use the quiz to
reinforce the anti-hallucination points above — especially DIP vs DI vs IoC, the Dependency Rule
(source code vs control flow), attributing Clean/Hexagonal/Onion correctly, "the database is a
detail," and that boundaries have a cost.
