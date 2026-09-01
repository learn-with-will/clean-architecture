---
id: lesson-16
slug: testing-across-boundaries
title: "Testing Across Boundaries"
level: intermediate
order: 16
duration: 22
tags:
  - testing
  - test-doubles
  - testing-pyramid
  - testability
  - fragile-tests
summary: "Why a clean architecture is a testable one — testing use cases against in-memory doubles at their ports instead of through the UI or database, the testing pyramid, the kinds of test double and when to use each, and how to avoid fragile tests coupled to volatile details."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain why testability is a **consequence** of the architecture, and what "the tests are the outermost
  circle" means.
- Test **use cases** in isolation using **test doubles** at their ports.
- Place tests sensibly on the **testing pyramid**.
- Distinguish **stubs, fakes, and mocks**, and avoid the **fragile test** problem.

# Why It Matters

A design you can't test cheaply is a design you'll be afraid to change — which defeats the whole purpose
of architecture. The good news is that everything you've built so far (interfaces at boundaries, framework-
free interactors, humble views) makes fast, reliable tests almost free. This lesson shows how to cash in
that benefit and how to avoid the traps that make test suites slow and brittle.

# Concept Explanation

### Testability is a consequence, not the goal

Because business rules depend only on abstractions — never on a database, web server, or UI — you can run
them with lightweight stand-ins. **Testability falls out of the architecture for free.** Martin frames
tests as **"the outermost circle"**: they are the most detailed, most peripheral part of the system, they
depend inward on everything else, and **nothing depends on them.** A test is essentially another **driving
adapter** exercising a port.

Keep the framing straight from earlier lessons: testability is a *benefit* of keeping options open, not
the reason for the architecture. But it's a benefit worth a lot.

### Test through the boundary, not through the UI

To test a business rule, drive the **use case's port directly** with a request model and assert on the
response — no browser, no HTTP, no database. This is fast (milliseconds), deterministic, and focused on
the rule rather than the plumbing.

```typescript
test('rejects duplicate email', () => {
  const users = new InMemoryUserGateway();
  users.add(User.create('a@b.com', 'longenough12'));
  const output = new CapturingOutput();

  new RegisterUser(users, output).register({ email: 'a@b.com', password: 'longenough12' });

  expect(output.last).toEqual({ ok: false, error: 'Email already registered' });
});
```

The in-memory gateway and capturing output are stand-ins at the ports. The real Postgres and web layers
aren't involved, so the test can't fail for reasons unrelated to the rule it checks.

### The testing pyramid

Mike Cohn's **testing pyramid** is a guide to test *proportions*:

```text
        /\        few   End-to-end (through the real UI/DB) — slow, brittle, high-value smoke
       /  \
      /----\      some  Integration (adapters against real tech: a gateway hitting a test DB)
     /      \
    /--------\    many  Unit (use cases + entities against doubles) — fast, focused, plentiful
```

Clean Architecture makes the wide base easy: most of your value lives in use cases and entities, which are
pure and fast to test. Keep end-to-end tests **few** — a handful of critical-path checks — because they're
slow and fragile. Use integration tests to verify each **adapter** really talks to its technology.

### Kinds of test double

"Test double" (Fowler's umbrella term) covers several stand-ins. The ones you'll use most:

- **Stub** — returns canned answers to whatever the code asks (e.g., a `Clock` that always returns a fixed
  time). Used to *provide* inputs.
- **Fake** — a working but simplified implementation (an **in-memory repository**). Great for driven ports.
- **Mock** — a double with **expectations**: it verifies it was *called* in a certain way. Used to assert
  *interactions*, not state.

A practical bias: prefer **state-based** testing with **fakes/stubs** (assert the resulting data) over
**interaction-based** testing with **mocks** (assert which methods were called). Over-using mocks ties
tests to *how* the code works, which brings us to the next point.

### The fragile test problem

A **fragile test** breaks when you change something unrelated to its intent. The usual cause: tests coupled
to **volatile details** — the exact SQL, the DOM structure, the precise sequence of internal calls. When
those change (as details do), hundreds of tests fail even though behavior is correct, and the team learns
to distrust or delete tests.

Two defenses, both architectural:

- **Test through stable boundaries** (use-case ports, response models) rather than through volatile UIs or
  private internals.
- **Don't over-specify interactions** with mocks; assert observable results where you can, so refactoring
  internals doesn't break tests.

This is sometimes called designing for the **Fragile Tests** problem — the architecture that isolates
volatile details from policy is the same architecture that keeps tests stable.

# Key Terminology

- **Test double** — any stand-in for a real collaborator in a test (umbrella term).
- **Stub / fake / mock** — a double that returns canned data / a simplified working implementation / a double that verifies expected calls.
- **Testing pyramid** — a guideline for having many fast unit tests, fewer integration tests, and few end-to-end tests.
- **The test boundary** — the idea that tests are the outermost circle: they depend inward, and nothing depends on them.
- **Fragile test** — a test that breaks due to changes unrelated to its intent, usually from coupling to volatile details.
- **State-based vs interaction-based testing** — asserting resulting data vs asserting which methods were called.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Testing a business rule | Through the UI end-to-end | Directly at the use-case port | Test at the port for speed and focus; reserve end-to-end for a few critical paths. |
| Driven port in a test | A real database | An in-memory fake | Fake for fast unit tests; use the real tech in a few integration tests of the gateway. |
| Verifying behavior | Assert method calls (mocks) | Assert resulting state (fakes/stubs) | Prefer state assertions; use mocks only when the interaction itself is the behavior. |

# Worked Example

Place three tests on the pyramid for a "transfer money" feature:

```text
Unit (many):        TransferMoney against an in-memory AccountRepository —
                    asserts balances and the overdraft rule. Milliseconds.
Integration (some): PostgresAccountRepository against a throwaway test database —
                    asserts rows are saved/loaded correctly. Seconds.
End-to-end (few):   One HTTP test: POST /transfer moves money and returns 200. Slowest.
```

The bulk of the confidence comes from the fast unit tests of the rule; the integration test proves the
adapter is wired to real SQL; the single e2e test proves the whole stack is connected.

# Real World Analogy

Testing across boundaries is like checking a **car**. You don't crash-test the whole car (end-to-end) to
verify the fuel gauge — that's slow and expensive, and you'd only do it occasionally. You test the **fuel
sensor on a bench** with a known input (a unit test with a stub), test that the **wiring harness** connects
sensor to dashboard (integration), and reserve full **road tests** for a few critical scenarios. Most
defects are cheapest to catch at the smallest boundary that can reveal them.

# Examples

## Example 1 — Basic: which double is this?

A test supplies a `Clock` that always returns `2026-01-01` so a "is it a weekday?" rule is deterministic.
Which double? Answer: a **stub** — it feeds canned input to the code under test.

**Why this works:** the clock provides a fixed answer rather than verifying calls, which is exactly a
stub's role.

## Example 2 — Real-world: fast suite, confident refactor

A team tests all pricing rules at the use-case port with in-memory fakes; the suite runs in under a second.
When they later swap ORMs and rewrite gateways, the pricing tests don't change at all and immediately prove
the rules still hold.

**Why this works:** testing through stable ports decoupled the rule tests from the volatile persistence
layer, so refactoring didn't touch them.

## Example 3 — Pitfall: the brittle mock forest

Another team mocks every collaborator and asserts exact call sequences. A harmless refactor that reorders
two internal calls breaks 200 tests though behavior is unchanged. The team starts deleting tests to make
builds pass.

**Why this bites:** interaction-heavy mocks couple tests to implementation details, producing fragile tests
that punish refactoring instead of protecting behavior.

# Common Mistakes

- **Testing business rules through the UI/HTTP,** producing slow, flaky suites.
- **Using a real database for unit tests,** trading speed and determinism for little gain.
- **Over-mocking interactions,** coupling tests to how code works rather than what it does.
- **Treating tests as second-class** and letting them depend on volatile internals.

# Best Practices

- Test **use cases and entities** heavily at their **ports** with fakes/stubs — the pyramid's wide base.
- Add a **few integration tests** that exercise each adapter against real technology.
- Keep **end-to-end tests few** and focused on critical paths.
- Prefer **state-based assertions**; reserve mocks for when the interaction *is* the behavior.

# Summary

- Testability is a **consequence** of depending on abstractions; **tests are the outermost circle** — they
  depend inward and nothing depends on them.
- Test business rules by **driving use-case ports** with **doubles**, not through the UI or a real database.
- The **testing pyramid**: many fast unit tests, some integration tests per adapter, few end-to-end tests.
- Avoid **fragile tests** by testing through **stable boundaries** and preferring **state** assertions over
  over-specified **mock** interactions.

# Flash Cards

Q: What does "the tests are the outermost circle" mean?
A: Tests are the most peripheral, most detailed part of the system: they depend inward on everything else, and nothing depends on them — like another driving adapter.

Q: How should you test a business rule quickly?
A: Drive the use case's port directly with a request model and in-memory doubles, asserting the response — no UI, HTTP, or real database.

Q: Describe the testing pyramid.
A: Many fast unit tests at the base (use cases/entities with doubles), fewer integration tests in the middle (adapters against real tech), and few slow end-to-end tests at the top.

Q: What is the difference between a stub, a fake, and a mock?
A: A stub returns canned answers; a fake is a working but simplified implementation (like an in-memory repository); a mock verifies that it was called in an expected way.

Q: What causes fragile tests, and how does the architecture help?
A: Coupling tests to volatile details (SQL, DOM, exact call sequences). Testing through stable boundaries and asserting state rather than interactions keeps tests robust to refactoring.

Q: Why prefer state-based assertions over interaction-based (mock) ones?
A: State assertions check observable results, so internal refactors don't break them; heavy mocking ties tests to how the code works, making them fragile.

# Exercises

### Easy
For a feature you know, list which tests would be **unit**, which **integration**, and which **end-to-end**.
Are your real tests shaped like the pyramid, or inverted?

### Medium
Write a unit test for a use case using an in-memory fake gateway and a capturing output. Assert on the
resulting state/response, not on which methods were called.

### Challenging
Find a slow or flaky test that goes through the UI or a real database to check a business rule. Rewrite it
to drive the use-case port with doubles, and explain what volatile detail it no longer depends on.

# Further Reading

- Robert C. Martin — *Clean Architecture* (2017), ch. 28 "The Test Boundary" and ch. 23 (Humble Object)
- Martin Fowler — *TestDouble*: <https://martinfowler.com/bliki/TestDouble.html> and *Mocks Aren't Stubs*: <https://martinfowler.com/articles/mocksArentStubs.html>
- Martin Fowler — *TestPyramid*: <https://martinfowler.com/bliki/TestPyramid.html>
- Mike Cohn — *Succeeding with Agile* (2009), the testing pyramid
