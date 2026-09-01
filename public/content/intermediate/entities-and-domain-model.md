---
id: lesson-12
slug: entities-and-domain-model
title: "Entities and the Domain Model"
level: intermediate
order: 12
duration: 22
tags:
  - entities
  - value-objects
  - invariants
  - domain-model
  - ddd
summary: "Designing the innermost layer well — entities that protect their own invariants, value objects defined by their attributes rather than identity, the difference between a rich and an anemic domain model, and how Clean Architecture's Entities layer relates to (but isn't the same vocabulary as) Domain-Driven Design."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Design **entities** that enforce their own **invariants**.
- Distinguish an **entity** (has identity) from a **value object** (defined by its attributes).
- Recognize the **anemic domain model** anti-pattern and prefer a rich one where it pays.
- Relate Clean Architecture's **Entities layer** to **Domain-Driven Design** terms without conflating
  them.

# Why It Matters

Everything else in the architecture protects the domain model — so a weak domain model wastes the whole
effort. If your entities are just bags of public fields with the real rules scattered across use cases
and controllers, you've built layers around a hollow center. This lesson is about making the center
worth protecting: objects that keep themselves valid and read like the business.

# Concept Explanation

### Entities protect their invariants

An **invariant** is a rule that must *always* hold for an object to be valid — "an account's balance
never drops below its overdraft limit," "an order always has at least one line item." A well-designed
entity **guarantees its own invariants**: it validates on creation and only allows changes through
methods that keep it consistent. Invalid states become **unrepresentable**.

```typescript
class Order {
  private constructor(private readonly lines: LineItem[]) {}

  static create(lines: LineItem[]): Order {
    if (lines.length === 0) throw new DomainError('An order needs at least one line item');
    return new Order(lines);
  }

  addLine(line: LineItem): void { this.lines.push(line); }        // stays valid
  removeLine(id: string): void {
    if (this.lines.length === 1) throw new DomainError('Cannot remove the last line item');
    // ...remove...
  }
}
```

Callers can't construct an empty `Order` or empty it out later — the entity refuses. That guarantee is
the point of putting logic *in* the entity.

### Entities vs value objects

Two kinds of domain object, with a crucial difference:

- An **entity** has an **identity** that persists over time even as its attributes change. Two customers
  named "Sam Lee" are different people; a customer keeps the same identity after changing their address.
  Entities are compared by **id**.
- A **value object** has **no identity** — it's defined entirely by its **attributes** and is usually
  **immutable**. `Money(5, 'USD')` equals any other `Money(5, 'USD')`; you don't track "which five
  dollars." Value objects are compared by **value**.

```typescript
// Value object: immutable, equal by attributes, no identity.
class Money {
  constructor(readonly amount: number, readonly currency: string) {}
  plus(o: Money): Money {
    if (o.currency !== this.currency) throw new DomainError('Currency mismatch');
    return new Money(this.amount + o.amount, this.currency);
  }
  equals(o: Money): boolean { return this.amount === o.amount && this.currency === o.currency; }
}
```

Value objects are where a surprising amount of good domain design happens: instead of passing raw
`number` and `string`, you pass `Money`, `EmailAddress`, `Quantity` — types that can't hold nonsense.

### Rich vs anemic domain models

A **rich domain model** puts data *and* the rules that govern it together in the same objects. An
**anemic domain model** (a term Martin Fowler describes as an anti-pattern) has objects that are just
getters and setters, with all the behavior sitting in separate "service" classes — so the objects can be
put into invalid states and the rules get duplicated.

Clean Architecture favors a **rich** model for real business rules: the entity is the natural, cohesive
home for the invariants about its data. That said, don't manufacture behavior that doesn't exist — a
simple lookup table object can legitimately be data-only. Rich where there are rules; plain where there
aren't.

### Relationship to Domain-Driven Design

**Domain-Driven Design (DDD)**, from Eric Evans (2003), is a *distinct* body of work with overlapping
vocabulary. It's worth keeping the words straight:

- DDD's **Entity** and **Value Object** are the precise definitions used above (identity vs attributes).
- Clean Architecture's **Entities *layer*** is broader: it means "enterprise business rules," which can
  include DDD entities, value objects, and even domain services — anything holding the most general
  rules.

So "an entity" (DDD) is a specific kind of object, while "the Entities layer" (Clean) is a *location* in
the architecture. They're compatible and often used together, but they are not the same term — cite DDD
when you use its concepts, and don't call every domain object "a Clean Architecture entity" loosely.

# Key Terminology

- **Invariant** — a rule that must always hold for an object to be valid.
- **Entity (DDD sense)** — a domain object with a persistent identity, compared by id.
- **Value object** — an immutable domain object defined by its attributes, compared by value.
- **Rich domain model** — data and its governing rules live together in the domain objects.
- **Anemic domain model** — domain objects are data-only (getters/setters) with rules pushed into separate services; an anti-pattern where real rules exist.
- **Domain-Driven Design (DDD)** — Eric Evans's approach to modeling complex domains; a distinct source with overlapping terms.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| A concept like money or email | Use raw `number`/`string` | A value object | Use a value object when validity rules or operations exist; raw is fine for truly trivial data. |
| Where a rule lives | In a service around the object | Inside the entity (rich model) | Put invariants in the entity; use services only for logic that spans multiple entities. |
| Identity | Compare by fields | Compare by id (entity) | If the thing has continuity over time, give it an id and compare by it; otherwise it's a value object. |

# Worked Example

Make an invalid state impossible with a value object:

```typescript
class EmailAddress {
  private constructor(readonly value: string) {}
  static of(raw: string): EmailAddress {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(raw)) throw new DomainError('Invalid email');
    return new EmailAddress(raw.toLowerCase());
  }
}
class User {
  constructor(readonly id: string, readonly email: EmailAddress) {} // can't hold a bad email
}
```

Once a `User` exists, its email is guaranteed valid and normalized — no use case or controller has to
re-check it, because the type itself carries the guarantee.

# Real World Analogy

A **passport** (entity) has an identity — a passport number — that stays the same even when your address
or photo changes; two passports are different even with identical details. A **banknote's value**, say
"$20," is a **value object**: any $20 note is interchangeable with any other; you don't track *which*
$20. A well-made passport office won't issue a passport with impossible data (an invariant) — just as a
well-made entity refuses to exist in an invalid state.

# Examples

## Example 1 — Basic: entity or value object?

Is a `Color(#3366FF)` an entity or a value object? Answer: a **value object** — it has no identity and is
defined by its attributes; two `#3366FF` colors are equal and interchangeable.

**Why this works:** there's nothing to track over time and no identity, so equality is by value — the
defining trait of a value object.

## Example 2 — Real-world: killing duplicated validation

A team keeps re-validating phone numbers in every controller and use case. They introduce a
`PhoneNumber` value object that validates once on creation. The scattered checks disappear, and an
invalid phone number can no longer reach the database.

**Why this works:** moving the invariant into a value object made it enforced in exactly one place and
guaranteed everywhere the type is used.

## Example 3 — Pitfall: the anemic model plus a fat service

Another team's `Account` is all public setters; a 900-line `AccountService` holds every rule. Two
different call sites forget to check the overdraft limit before calling `setBalance`, and the account
goes invalid. The bug is impossible to prevent because the object doesn't defend itself.

**Why this bites:** with an anemic model, invariants live outside the object, so any caller can bypass
them — exactly the failure a rich entity prevents.

# Common Mistakes

- **Public setters that let objects go invalid.** Change state only through methods that preserve
  invariants.
- **Primitive obsession** — passing `string`/`number` everywhere instead of value objects that can't hold
  nonsense.
- **Anemic entities + god services** where real rules exist, duplicating and scattering logic.
- **Conflating DDD's "Entity" with Clean's "Entities layer."** One is a kind of object; the other is a
  location — cite DDD for its terms.

# Best Practices

- Make **invalid states unrepresentable**: validate on creation, mutate only through safe methods.
- Introduce **value objects** for concepts with rules (money, email, quantity, date ranges).
- Keep entities **framework-free** — no ORM base classes, no persistence annotations, no serialization
  concerns.
- Put **cross-entity** logic in a domain service (still framework-free); keep single-object invariants in
  the entity.

# Summary

- Entities should **protect their own invariants**, making invalid states impossible.
- An **entity** has identity (compared by id); a **value object** is immutable and compared by its
  attributes.
- Prefer a **rich domain model** where real rules exist; the **anemic** model (data-only objects + fat
  services) is an anti-pattern in that case.
- Clean Architecture's **Entities layer** ("enterprise business rules") is broader than DDD's **Entity**;
  the two are compatible but use "entity" differently — attribute DDD when you borrow its terms.

# Flash Cards

Q: What is an invariant, and whose job is it to protect one?
A: A rule that must always hold for an object to be valid; the entity itself should protect its invariants by validating on creation and only allowing safe changes.

Q: How does an entity differ from a value object?
A: An entity has a persistent identity and is compared by id; a value object has no identity, is usually immutable, and is compared by its attributes.

Q: What is an anemic domain model, and why is it often an anti-pattern?
A: Domain objects that are just data (getters/setters) with all rules in separate services; it's an anti-pattern where real rules exist because objects can be put into invalid states and logic gets duplicated.

Q: Why introduce a value object like Money or EmailAddress instead of using number/string?
A: So validity rules live in one place and the type itself cannot hold nonsense, eliminating duplicated checks and invalid data.

Q: How does Clean Architecture's "Entities layer" relate to DDD's "Entity"?
A: DDD's Entity is a specific kind of object (with identity); Clean's Entities layer is a location holding all enterprise business rules, which may include DDD entities, value objects, and domain services. They overlap but aren't the same term.

Q: Should entities contain ORM annotations or serialization logic?
A: No — entities must stay framework-free so the innermost layer never depends on outer details.

# Exercises

### Easy
List three concepts in an app you know that are currently raw strings/numbers but have validity rules
(e.g., email, money, percentage). Pick one and describe the value object you'd make.

### Medium
Write an entity with at least one enforced invariant (reject invalid construction and block an unsafe
mutation). Show a caller failing to break it.

### Challenging
Find an "anemic" entity + fat service pair in real code. Move one invariant into the entity so it's
enforced there, and identify a bug that becomes impossible as a result. Note anything (like ORM
annotations) you had to push out of the entity.

# Further Reading

- Eric Evans — *Domain-Driven Design* (Addison-Wesley, 2003): entities, value objects, the domain model
- Martin Fowler — *AnemicDomainModel*: <https://martinfowler.com/bliki/AnemicDomainModel.html>
- Martin Fowler — *ValueObject*: <https://martinfowler.com/bliki/ValueObject.html>
- Robert C. Martin — *Clean Architecture* (2017), ch. 20 "Business Rules"
