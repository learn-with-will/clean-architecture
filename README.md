# Clean Architecture Learning Portal

A **frontend-only** Clean Architecture course: read Markdown lessons, take quizzes, and track
your progress — all in the browser. No sign-up, no backend.

Live at **<https://learn-with-will.github.io/clean-architecture/>**.

## What this is

The portal shell is built with React 19, Vite, TypeScript, React Router, Tailwind CSS v4,
`marked`, and PrismJS. It renders a **24-lesson curriculum** that takes you from "what is Clean
Architecture?" through coupling and the SOLID principles, the Dependency Inversion Principle and the
Dependency Rule, the four layers (entities, use cases, interface adapters, frameworks & drivers),
ports & adapters (hexagonal architecture), boundaries and dependency injection, gateways and
presenters, testing across boundaries, component design, and the pragmatic trade-offs — ending in an
end-to-end capstone. Every lesson is written in plain, welcoming English and cited to primary sources
(see **Sources** below).

> **Attribution matters here.** **Clean Architecture** (Robert C. Martin), **Hexagonal / Ports &
> Adapters** (Alistair Cockburn), and **Onion Architecture** (Jeffrey Palermo) are *related but
> distinct*; and **DIP** (a design principle) ≠ **DI** (a technique) ≠ **IoC** (a broad pattern). The
> course keeps these straight and the authoring contract enforces it.

Progress, bookmarks, and quiz scores live in `localStorage` under `clean-architecture-learning-*`
keys, so nothing leaves your machine.

## Run it locally

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build
```

## How the content works

The app is **data-driven** — adding a lesson needs no code changes:

1. Write the lesson Markdown in `public/content/<level>/<slug>.md` with YAML front-matter
   (including a `summary`).
2. Add a quiz at `public/quizzes/lesson-NN.json`.
3. Regenerate `public/content/course-manifest.json` from the front-matter (the manifest is
   generated, so it can't drift).

> **Code fences** must declare one of the highlighted languages: `typescript` (the primary language —
> entities, use cases, ports, adapters), `bash` (tooling and shell commands), `json` (small config
> snippets like `package.json`/`tsconfig`), or `text` (folder trees, layer diagrams, console output);
> see `src/core/prism.ts`.

## Curriculum

**Beginner — the foundations:** what is Clean Architecture? · why architecture matters · coupling,
cohesion & dependencies · the SOLID principles · the Dependency Inversion Principle · the Dependency
Rule · entities & use cases · interface adapters & frameworks.

**Intermediate — building it:** ports & adapters (hexagonal) · crossing boundaries · use-case
interactors · entities & the domain model · dependency injection & wiring · gateways & persistence ·
presenters & the UI · testing across boundaries.

**Advanced — production & trade-offs:** screaming architecture · component cohesion & coupling
principles · organizing modules & boundaries · partial & evolving boundaries · services &
boundaries · frameworks & databases as details · common pitfalls & trade-offs · capstone.

## Accuracy: cite, don't invent

Every definition and claim is traceable to a primary source, and the three architectures above are
attributed precisely. The per-lesson authoring contract lives in
`prompts/clean-architecture-authoring-prompt.md`.

**Sources:**

- **Robert C. Martin — *Clean Architecture: A Craftsman's Guide to Software Structure and Design***
  (Prentice Hall, 2017), and the essay **"The Clean Architecture"** (2012) —
  <https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html>. The primary
  reference for the Dependency Rule, the layers, and the SOLID & component principles.
- **Alistair Cockburn — Hexagonal Architecture (Ports & Adapters)** —
  <https://alistair.cockburn.us/hexagonal-architecture/>.
- **Jeffrey Palermo — The Onion Architecture** —
  <https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/>.
- **Martin Fowler** — <https://martinfowler.com/> — especially *Inversion of Control Containers and
  the Dependency Injection pattern* (<https://martinfowler.com/articles/injection.html>) and
  *Presentation Domain Data Layering*.
- **Eric Evans — *Domain-Driven Design*** (Addison-Wesley, 2003) — referenced for entities, value
  objects, and the domain model (a distinct body of work, cited where it overlaps).

## Deploying

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds with
`BASE_PATH=/<repo>/` and publishes `dist/` to GitHub Pages.

---

React 19 · Vite · TypeScript · React Router · Tailwind CSS v4 · marked · PrismJS ·
localStorage.
