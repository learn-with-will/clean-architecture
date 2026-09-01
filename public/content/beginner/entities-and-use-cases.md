---
id: lesson-07
slug: entities-and-use-cases
title: "Entities and Use Cases"
level: beginner
order: 7
duration: 20
tags:
  - entities
  - use-cases
  - business-rules
  - interactors
  - layers
summary: "The two innermost layers — Entities holding enterprise business rules that would exist even without the application, and Use Cases (interactors) holding application-specific rules that orchestrate entities to fulfill a user's goal — and how to tell which of the two a given rule belongs to."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Define **Entities** as *enterprise* business rules and **Use Cases** as *application* business rules.
- Decide whether a given rule belongs in an entity or a use case.
- Explain what use cases may and may not know about.
- Recognize why entities are the most stable code in the system.

# Why It Matters

The two inner circles are where your software's **value** lives — the reason the program is worth
writing at all. Get their responsibilities right and the outer layers become straightforward plumbing.
Blur them, and either your core rules leak application details or your workflows swell into unmaintainable
"god" objects. The distinction is subtle, so this lesson makes it concrete.

# Concept Explanation

### Entities: enterprise business rules

An **Entity** holds **Enterprise Business Rules** — the most general, highest-level rules and the
critical data they operate on. The test: *would this rule exist even if the application were never
built* — done on paper, in a spreadsheet, or by another program in the company? If yes, it's an entity.

For a bank, "an account balance may not go below its overdraft limit" is true regardless of any app —
it's an entity rule. Entities are plain objects (or functions plus data structures) with **no
dependencies** on frameworks, databases, or the UI. They are the **least likely to change** when
something external — a screen, a database, a framework — changes.

```typescript
// Entity: an enterprise rule that would hold with or without this app.
class Account {
  constructor(private balance: Money, private readonly overdraftLimit: Money) {}
  withdraw(amount: Money): void {
    if (this.balance.minus(amount).isLessThan(this.overdraftLimit.negated())) {
      throw new Error('Withdrawal would exceed overdraft limit');
    }
    this.balance = this.balance.minus(amount);
  }
}
```

Notice: no SQL, no HTTP, no framework. Just a rule and the data it guards.

### Use Cases: application business rules

A **Use Case** (also called an **interactor**) holds **Application Business Rules** — logic that is
specific to *this application* and describes **how** it is used to achieve a goal. A use case
**orchestrates** entities: it fetches the needed entities, invokes their rules, and arranges results,
following the steps of one user-facing operation.

"When a customer transfers money: load both accounts, apply the withdrawal and deposit rules, record the
transaction, and return a confirmation" — that ordered *story* is a use case. The individual rules
("can't overdraw") are entity rules; the *choreography* is the use case.

```typescript
// Use case: application-specific orchestration of entities.
class TransferMoney {
  constructor(private readonly accounts: AccountRepository) {} // interface it owns
  run(req: { fromId: string; toId: string; amount: Money }): void {
    const from = this.accounts.byId(req.fromId);
    const to = this.accounts.byId(req.toId);
    from.withdraw(req.amount);   // entity rule
    to.deposit(req.amount);      // entity rule
    this.accounts.save(from);
    this.accounts.save(to);
  }
}
```

### What a use case may and may not know

A use case **may** know about **entities** (it imports and uses them — that's inward). A use case **may**
define and depend on **interfaces it owns** (like `AccountRepository`) to reach the outside world.

A use case **may not** know:

- **who triggered it** — a web request? a CLI? a scheduled job? It can't tell and doesn't care.
- **where data is stored** — it talks to a repository interface, not to SQL.
- **how results are shown** — it hands data to an output port; it doesn't format HTML.

This ignorance is a feature: it's exactly what lets the same use case run behind a web app, a mobile
app, a test, or a batch job unchanged.

### Why entities are the most stable

Entities sit at the center because they change **least** in response to external forces. A new UI
framework, a database migration, or a new delivery channel should not touch them. Use cases change a bit
more often (when the *application's* behavior changes) but still far less than controllers and
frameworks. Stability increases as you move inward — which is exactly why dependencies must point that
way.

# Key Terminology

- **Entity** — an object holding enterprise business rules and critical data; would exist with or without this application.
- **Enterprise business rules** — the most general business rules, true across the whole organization, independent of any one app.
- **Use case / interactor** — application-specific logic that orchestrates entities to accomplish one user goal.
- **Application business rules** — logic about how *this* application is used, as opposed to general enterprise rules.
- **Orchestration** — coordinating the steps and entities involved in a single operation.
- **Repository interface** — an abstraction, owned by the use-case layer, for loading and saving entities.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Where a rule lives | In the entity | In the use case | If it holds regardless of this app, it's an entity rule; if it's about this app's workflow, it's a use case. |
| Entity shape | Rich object with methods | Data + separate functions | Either works; keep it framework-free. Rich objects suit OO; functions suit FP. |
| Use case size | One big "service" for everything | One class per user goal | Prefer one interactor per goal for cohesion; merge only truly trivial ones. |

# Worked Example

Sort these rules into **Entity** or **Use Case** for an e-commerce system:

```text
a. "An order's total is the sum of its line items minus discounts."     → Entity (always true)
b. "Placing an order: validate cart, reserve stock, charge, confirm."   → Use Case (app workflow)
c. "A coupon can't be applied twice to the same order."                 → Entity (a rule about orders)
d. "On checkout, email a receipt and enqueue a fulfillment job."        → Use Case (this app's flow)
```

The entity rules (a, c) would hold even if orders were processed by hand; the use cases (b, d) describe
how *this application* strings those rules together.

# Real World Analogy

Think of a **recipe** versus the **laws of cooking**. "Proteins denature when heated" is a fact true in
every kitchen — that's an **entity** rule. "For *this* dish: sear the steak two minutes a side, rest it,
then plate" is a **use case** — a specific procedure that *uses* the general facts to reach one result.
The chef (use case) orchestrates ingredients according to unchanging culinary rules (entities), and
doesn't care whether the order came from a waiter, a phone, or an app.

# Examples

## Example 1 — Basic: entity or use case?

"A user's password must be at least 12 characters." Entity or use case? Answer: an **entity** rule about
the `User` (or a `Password` value object) — it's a general rule about valid users, independent of any
screen or endpoint.

**Why this works:** the rule constrains the domain data itself, so it belongs with the entity that owns
that data.

## Example 2 — Real-world: reusing a use case across channels

A `RegisterUser` interactor is written once. It's driven by a web controller today; next quarter a CLI
admin tool and an automated import both drive the *same* interactor. No business logic is duplicated
because the use case never knew who called it.

**Why this works:** the use case's ignorance of its caller made it reusable across delivery mechanisms.

## Example 3 — Pitfall: the framework in the entity

A team adds an ORM base class and validation annotations directly to their `Account` entity "to save
time." Now the entity can't be instantiated or unit-tested without the ORM, and an ORM upgrade forces
changes to core rules.

**Why this bites:** an outer detail (the ORM) invaded the innermost layer, coupling stable rules to a
volatile framework and violating the Dependency Rule.

# Common Mistakes

- **Putting application-flow logic in entities.** Orchestration belongs in use cases; entities hold
  general rules.
- **Putting general business rules in use cases** (or in controllers), where they get duplicated across
  workflows.
- **Letting frameworks/ORMs/annotations into entities.** Keep the core dependency-free.
- **Making use cases aware of the UI or database.** They talk to ports, not to screens or SQL.

# Best Practices

- Ask *"would this rule exist without the app?"* to place it: yes → entity, no → use case.
- Keep **one interactor per user goal** for cohesion and testability.
- Keep entities and use cases **free of framework, DB, and UI imports**.
- Have use cases reach outward only through **interfaces they own**.

# Summary

- **Entities** hold **enterprise business rules** — general, app-independent rules and critical data;
  they change least and depend on nothing external.
- **Use cases (interactors)** hold **application business rules** — the app-specific orchestration of
  entities to fulfill one user goal.
- A use case knows **entities** and its **own interfaces**, but not who triggered it, where data lives,
  or how results are shown.
- Stability increases toward the center, which is why the Dependency Rule points inward.

# Flash Cards

Q: What distinguishes an Entity from a Use Case?
A: An entity holds enterprise business rules that would exist even without this application; a use case holds application-specific rules that orchestrate entities to achieve one user goal.

Q: What is a quick test for whether a rule belongs in an entity?
A: Ask whether the rule would still be true if the application were never built (done on paper or by another system). If yes, it's an enterprise rule and belongs in an entity.

Q: Name three things a use case must NOT know about.
A: Who or what triggered it (web/CLI/job), where its data is stored (the database/ORM), and how its results are presented (the UI/format).

Q: Another common name for a use case is ____.
A: An interactor.

Q: Why are entities the most stable part of the system?
A: They encode general rules unaffected by external changes (UI, database, frameworks), so they change least — which is why everything depends inward toward them.

Q: Why must entities be free of ORM/framework code?
A: Because that would make the innermost layer depend on an outer detail, violating the Dependency Rule and coupling stable rules to volatile tools.

# Exercises

### Easy
List five rules from an app you know and label each **entity** (enterprise) or **use case**
(application). Justify one that was hard to decide.

### Medium
Write a small entity (in pseudocode or TypeScript) with one enforced rule, and a use case that
orchestrates two of them. Make sure the use case only touches the entities and a repository interface.

### Challenging
Take a "service" class from a real project that mixes general rules and app workflow. Split it into (1)
entity rules and (2) a use case that orchestrates them, and identify any framework/DB references you had
to push outward to do it.

# Further Reading

- Robert C. Martin — *Clean Architecture* (2017), ch. 20 "Business Rules" (Entities & Use Cases)
- Robert C. Martin — *The Clean Architecture* (2012): <https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html>
- Ivar Jacobson — *Object-Oriented Software Engineering* (1992), the origin of "use cases"
- Eric Evans — *Domain-Driven Design* (2003), on entities and the domain model
