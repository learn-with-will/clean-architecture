---
id: lesson-15
slug: presenters-and-the-ui
title: "Presenters and the UI"
level: intermediate
order: 15
duration: 20
tags:
  - presenters
  - view-model
  - humble-object
  - ui-detail
  - mvc
summary: "Keeping the user interface at the edge — presenters that turn a use case's response into a logic-free view model, the Humble Object pattern that isolates the hard-to-test view from testable presentation logic, and why the UI (like the database) is a detail the core must not depend on."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain the **presenter's** job: turning a response model into a **view model**.
- Apply the **Humble Object** pattern to separate testable logic from an untestable view.
- Describe why the **UI is a detail** and how presenters keep it swappable.
- Recognize where **MVC/MVP** fits in the Interface Adapters layer.

# Why It Matters

The UI is the most visible, most frequently changed, and hardest-to-test part of most systems. If
presentation logic lives *inside* views (templates, components, widgets), it can't be tested without a
browser or a screen, and it drags business concerns into the framework. Presenters pull the logic out
into a plain, testable place and leave the view **humble** — a huge win for both testability and
swappability.

# Concept Explanation

### The presenter turns response models into view models

A use case produces a **response model** — raw data, in domain terms (`{ balanceCents: 10599, dueDate:
Date }`). A **presenter** converts that into a **view model** — display-ready fields the view can render
with no thinking (`{ balance: "$105.99", dueLabel: "Due in 3 days", overdue: false }`).

```typescript
interface AccountView { render(vm: AccountViewModel): void; } // the humble view (output)

type AccountViewModel = {
  balance: string;      // pre-formatted
  dueLabel: string;     // pre-computed text
  overdue: boolean;     // a flag the view just obeys
};

class AccountPresenter implements AccountOutputPort {
  constructor(private readonly view: AccountView) {}
  present(res: AccountResponse): void {
    this.view.render({
      balance: formatMoney(res.balanceCents),
      dueLabel: humanizeDue(res.dueDate),
      overdue: res.dueDate.getTime() < Date.now(),
    });
  }
}
```

All the decisions — formatting, wording, which flags are set — happen in the presenter. The view receives
a finished view model and just paints it.

### The Humble Object pattern

The **Humble Object** pattern (Martin devotes a chapter to it) splits behavior into two parts: one that is
**hard to test** (because it touches a device, screen, or framework) and one that is **easy to test**. You
make the hard-to-test part **humble** — reduce it to the thinnest possible shell with no logic — and move
all the logic into the testable part.

```text
              logic (testable)            humble (barely testable)
Presentation:  Presenter  ───────────────▶  View
               decides everything           renders a view model, no decisions
```

Because the view holds no logic, there's nothing in it worth unit-testing; because the presenter holds all
the logic and is a plain object, it's trivial to unit-test. You get the coverage where it matters without
fighting the UI framework.

### The UI is a detail

Just as the database is a detail, so is the UI. The same use case and response model should be able to
feed a web page, a mobile screen, a CLI, or a test — each with its own presenter and humble view. Because
the use case emits a domain response (not HTML, not a component tree), the delivery mechanism is a late,
replaceable choice.

That's why the arrow points inward here too: the presenter and view depend on the use case's output port
and response model; the use case depends on neither.

### Where MVC/MVP lives

The classic UI patterns — **MVC** (Model-View-Controller) and **MVP** (Model-View-Presenter) — live
entirely in the **Interface Adapters** layer. In Clean Architecture terms: the **controller** adapts input
into a request model, the **presenter** adapts the response model into a view model, and the **view** is
humble. The "Model" the view sees is the **view model**, not your entities. Keeping those roles in the
adapter ring means the UI pattern can change without disturbing use cases or entities.

# Key Terminology

- **Presenter** — an adapter that converts a use case's response model into a display-ready view model.
- **View model** — a passive, logic-free data structure containing exactly what the view should display.
- **Humble Object** — a pattern that makes hard-to-test boundary code (the view) trivial by moving all logic into a testable companion (the presenter).
- **Humble view** — a view with no decisions; it just renders a view model.
- **The UI is a detail** — the interface is an outer, replaceable concern the core must not depend on.
- **MVC / MVP** — UI patterns that sit in the Interface Adapters layer; their "model" is the view model.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Formatting a value | In the view/template | In the presenter → view model | Presenter, so the view stays humble and the formatting is unit-testable. |
| Returning data to the UI | Use case returns a view model | Use case returns a response model, presenter formats | Response model + presenter keeps the use case UI-agnostic across web/CLI/mobile. |
| View logic (show/hide, color) | `if` in the template | A boolean/enum flag in the view model | Precompute the flag in the presenter; let the view just obey it. |

# Worked Example

Give one use case two faces. The same `AccountResponse` drives a web presenter and a CLI presenter:

```typescript
class CliAccountPresenter implements AccountOutputPort {
  present(res: AccountResponse) {
    const overdue = res.dueDate.getTime() < Date.now();
    process.stdout.write(`Balance ${formatMoney(res.balanceCents)}${overdue ? '  [OVERDUE]' : ''}\n`);
  }
}
```

The web presenter builds an HTML-friendly view model; the CLI presenter writes a line. The use case,
response model, and entities are identical for both — the UI is genuinely a swappable detail.

# Real World Analogy

A presenter is a **TV producer**; the view is the **screen**. The producer decides what text appears, how
numbers are formatted, when the "LIVE" badge lights up — every editorial decision. The screen is humble:
it displays exactly the finished feed it's given, making no choices of its own. Put the same broadcast on
a phone, a billboard, or a radio (audio-only), and you swap the producer's output format; the underlying
event (the use case) is unchanged. You'd never build the editorial decisions into the glass of the
screen.

# Examples

## Example 1 — Basic: where does date formatting go?

A response has a raw `Date`; the screen should show "Due in 3 days." Where is that computed? Answer: in
the **presenter**, which puts a finished `dueLabel: "Due in 3 days"` string into the view model.

**Why this works:** formatting is presentation logic; doing it in the presenter keeps the view humble and
the logic testable.

## Example 2 — Real-world: testing presentation without a browser

A team unit-tests that overdue accounts show a red "OVERDUE" flag by asserting the **view model** the
presenter builds (`overdue === true`) — no browser, no DOM, no screenshots. The humble view is trusted to
render whatever flag it's handed.

**Why this works:** the Humble Object pattern moved the decision into a plain object, so it's testable
with a simple assertion.

## Example 3 — Pitfall: logic trapped in the template

Another team writes currency formatting, timezone math, and "should we show the banner?" conditionals
directly in their view templates. None of it is unit-tested, the same logic is copy-pasted across
screens, and porting to mobile means rewriting all of it.

**Why this bites:** logic living in the humble layer can't be tested or reused, defeating the separation
presenters exist to provide.

# Common Mistakes

- **Formatting and branching inside views/templates** instead of in the presenter.
- **Returning entities to the view,** coupling the UI to domain internals.
- **Making the use case emit HTML or components,** binding it to one UI.
- **A "smart" view** full of logic that can't be unit-tested.

# Best Practices

- Have presenters emit **complete view models**: pre-formatted strings and pre-computed flags.
- Keep views **humble** — rendering only, no decisions.
- Let use cases return **response models**, not UI shapes, so multiple UIs can share them.
- **Unit-test presenters** by asserting the view model they build.

# Summary

- A **presenter** converts a use case's **response model** into a logic-free **view model** the view can
  render directly.
- The **Humble Object** pattern moves all presentation logic into the testable presenter and leaves the
  **view** humble.
- The **UI is a detail**: the same response model can drive web, mobile, CLI, or tests via different
  presenters.
- **MVC/MVP** live in the Interface Adapters layer; the "model" the view sees is the **view model**, never
  your entities.

# Flash Cards

Q: What does a presenter produce, and from what?
A: A presenter produces a view model — a display-ready, logic-free data structure — from a use case's response model.

Q: What is the Humble Object pattern?
A: A pattern that isolates hard-to-test boundary code (like a view) by reducing it to a logic-free shell and moving all decisions into a testable companion object (the presenter).

Q: Why is a "humble view" easy to work with?
A: It contains no logic — it just renders the view model it's given — so there's nothing in it worth unit-testing, while the presenter holds all the testable logic.

Q: What does "the UI is a detail" imply for a use case's output?
A: The use case emits a domain response model, not HTML or UI components, so different UIs (web, mobile, CLI, tests) can each present it with their own presenter.

Q: Where do MVC and MVP live in Clean Architecture, and what is the view's "model"?
A: In the Interface Adapters layer; the view's model is the view model produced by the presenter, not the domain entities.

Q: Where should you compute a show/hide or color flag for the UI?
A: In the presenter, as a boolean/enum field on the view model; the humble view just obeys the flag.

# Exercises

### Easy
Take a screen you know and list three pieces of formatting or conditional display it does. For each, write
the finished view-model field a presenter would supply instead.

### Medium
Write a presenter that turns a response model (`{ amountCents, createdAt, status }`) into a view model
with a formatted amount, a relative-time string, and a boolean like `canCancel`. Then write one assertion
that tests it with no UI.

### Challenging
Find a template/component containing real logic (formatting, timezone math, conditionals). Move that logic
into a presenter producing a view model, leave the view humble, and describe how you'd now unit-test the
behavior and reuse it on a second UI.

# Further Reading

- Robert C. Martin — *Clean Architecture* (2017), ch. 23 "Presenters and Humble Objects"
- Martin Fowler — *Humble Object* / *GUI Architectures*: <https://martinfowler.com/eaaDev/uiArchs.html>
- Martin Fowler — *Presentation Model*: <https://martinfowler.com/eaaDev/PresentationModel.html>
- Robert C. Martin — *The Clean Architecture* (2012): <https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html>
