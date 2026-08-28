# Clean Architecture — Learning-Portal course (to be built)

This repository will host the **Clean Architecture** course for the
[Learning Portal](https://thachthanhthien.github.io/LearningPortal/) family of self-paced, static course micro-apps.

It is currently seeded with a single build prompt. To create the course, open a Claude Code session
connected to this repo and hand it [`prompts/new-course-prompt.md`](prompts/new-course-prompt.md):
that prompt derives every detail from the topic and builds the full 24-lesson course end-to-end
(React 19 + Vite + TypeScript shell, Markdown lessons, JSON quizzes), then publishes it to GitHub Pages
at `https://learn-with-will.github.io/clean-architecture/`.

> Scope: Designing maintainable systems with Clean Architecture — the Dependency Rule; entities, use cases, interface adapters, and frameworks/drivers layers; ports & adapters (hexagonal architecture); boundaries and dependency inversion; and keeping business logic independent of UI, database, and frameworks.
