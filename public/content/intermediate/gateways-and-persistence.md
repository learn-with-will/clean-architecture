---
id: lesson-14
slug: gateways-and-persistence
title: "Gateways and Persistence"
level: intermediate
order: 14
duration: 22
tags:
  - repository
  - gateways
  - persistence
  - database-detail
  - mapping
summary: "Treating the database as a replaceable detail — the repository (gateway) interface owned by the use-case layer and implemented by an outer adapter, mapping between domain objects and storage rows, why SQL and ORM code stay at the edge, and why the database schema must not be allowed to dictate the domain model."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Apply the **repository/gateway** pattern to keep persistence at the edge.
- Explain why *"the database is a detail"* and what that buys you.
- Map between **domain objects** and **storage rows** in the gateway.
- Avoid letting the **database schema** dictate your domain model.

# Why It Matters

The database feels central — it's where the data "really" is, and it's the first thing many designs are
built around. Clean Architecture deliberately flips that: the database is a **detail** on the outer ring,
chosen late and swappable. Getting persistence right is where the architecture most often succeeds or
quietly fails, because it's the most tempting place to let an outer detail leak inward.

# Concept Explanation

### The repository / gateway pattern

A **repository** (also called a **gateway** in Clean Architecture) is an **interface, owned by the use-
case layer**, that describes persistence in **domain terms** — "find an order by id," "save an account" —
with no hint of SQL. The concrete implementation lives in the outer Interface Adapters layer and does the
actual database work.

```typescript
// Inner layer owns the interface, in domain language.
interface OrderRepository {
  byId(id: OrderId): Order | null;
  save(order: Order): void;
}
```

```typescript
// Outer adapter implements it, and is the ONLY place SQL/ORM appears.
class PostgresOrderRepository implements OrderRepository {
  constructor(private readonly db: Db) {}
  byId(id: OrderId): Order | null {
    const row = this.db.query('SELECT * FROM orders WHERE id = $1', [id.value])[0];
    return row ? this.toDomain(row) : null;   // map row → entity
  }
  save(order: Order): void {
    const row = this.toRow(order);            // map entity → row
    this.db.exec('INSERT INTO orders ... ON CONFLICT ... UPDATE ...', row);
  }
  private toDomain(row: OrderRow): Order { /* build the entity */ }
  private toRow(order: Order): OrderRow { /* flatten the entity */ }
}
```

The use case depends on `OrderRepository`; `PostgresOrderRepository` depends inward on the same
interface. The database can be replaced without touching a use case.

### The database is a detail

Martin devotes a chapter to the claim *"the database is a detail."* His point: the database is a tool for
**storing and retrieving** data; it is not the heart of your system, and your business rules should not
know or care whether data lives in Postgres, MySQL, a document store, or flat files. Deciding the
database is like deciding the brand of screws in a building — important operationally, but not
architecturally central, and postponable.

Concretely, this means: no `SELECT` in a use case, no ORM model imported by an entity, no repository
method that returns a database-shaped object. All of that stays in the gateway.

### Mapping is the gateway's job

Between the domain object and the stored row there is almost always a **mapping** — the shapes differ, and
they *should* be allowed to differ. The domain model is designed for **rules**; the schema is designed
for **storage and queries**. The gateway translates between them (a **Data Mapper**, in Fowler's terms).
Writing that mapping is not wasted work — it's the seam that lets the two evolve independently.

### Don't let the schema drive the domain

A common failure: the team designs tables first, then generates classes from them, so the "domain model"
is really the database schema wearing a costume. Now foreign keys, nullable columns, and join tables
dictate the business objects, and the rules bend around storage concerns.

Invert it: design the **domain model from the business rules**, design the **schema for storage**, and let
the gateway map between them. When they disagree, the domain model wins for rules and the schema wins for
storage — the mapping absorbs the difference.

### A note on ORMs and Active Record

An **ORM** (Object-Relational Mapper) is a fine tool — *in the gateway*. The trap is the **Active Record**
pattern, where a class is simultaneously a domain object *and* its own database row (with `.save()` on
it). That fuses the domain with the database, so the entity can't exist without the ORM — a direct
Dependency Rule violation. Clean Architecture favors the **Data Mapper** style, where domain objects are
persistence-ignorant and a separate mapper handles storage.

# Key Terminology

- **Repository / gateway** — an interface, owned by the use-case layer, describing persistence in domain terms.
- **Data Mapper** — a component that moves data between domain objects and the database, keeping them independent.
- **Active Record** — a pattern where a class is both a domain object and its own database row; couples the domain to the DB.
- **Mapping** — translating between a domain object's shape and a storage row's shape.
- **"The database is a detail"** — Martin's stance that storage is an outer, replaceable concern, not the core.
- **Persistence-ignorant** — a domain object that has no knowledge of how (or whether) it is stored.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Domain vs storage shape | Force them identical | Let them differ, map in the gateway | Let them differ so rules and storage evolve independently; identical only when truly trivial. |
| Persistence pattern | Active Record (object = row) | Data Mapper (separate mapper) | Prefer Data Mapper for Clean Architecture; Active Record is fine only for simple CRUD apps without a rich domain. |
| Repository shape | Generic `Repository<T>` with CRUD | Domain-specific methods | Domain-specific methods express intent and hide queries; a generic base can back them if it stays hidden. |

# Worked Example

Swap the store without touching the use case. Given `OrderRepository`, provide two implementations:

```typescript
class InMemoryOrderRepository implements OrderRepository {
  private map = new Map<string, Order>();
  byId(id: OrderId) { return this.map.get(id.value) ?? null; }
  save(o: Order) { this.map.set(o.id.value, o); }
}
```

The use case that depends on `OrderRepository` runs identically against `InMemoryOrderRepository` (for
tests) and `PostgresOrderRepository` (in production). The composition root picks which — the persistence
choice is a one-line wiring decision.

# Real World Analogy

A repository is a **librarian**. You ask, "bring me the book *Clean Architecture*" (a domain request); you
don't know or care whether the librarian fetches it from shelf 3, an off-site archive, or an inter-library
loan (the storage detail). If the library reorganizes its shelves or moves to a new building, your request
is unchanged — the librarian absorbs the difference. Asking for books by title is the **interface**;
knowing the shelving system is the **gateway's** private business.

# Examples

## Example 1 — Basic: where does this SQL go?

A use case needs the count of pending invoices. Where does the `SELECT COUNT(*)` live? Answer: in a
**gateway method** like `countPending()`, behind the repository interface — never inline in the use case.

**Why this works:** the query is a storage detail; exposing it as a domain-phrased method keeps the use
case database-free.

## Example 2 — Real-world: evolving the schema safely

A product splits its `users` table into `users` and `user_profiles` for performance. Because a
`UserRepository` maps rows to the `User` domain object, only the gateway's mapping changes; every use case
and entity is untouched.

**Why this works:** the mapping seam absorbed a storage change, so the schema evolved without disturbing
the domain.

## Example 3 — Pitfall: schema-first domain

A team generates entities directly from tables. Their `Order` now exposes `customer_id: number` and a
nullable `discount_code: string | null` because that's how the columns are, and business logic everywhere
must null-check and re-join. Changing the schema breaks the domain across the codebase.

**Why this bites:** the database schema became the domain model, so storage decisions leaked into business
rules — the opposite of "the database is a detail."

# Common Mistakes

- **SQL or ORM queries inside use cases or entities.** Keep them in the gateway.
- **Returning database-shaped objects** from repositories instead of domain objects.
- **Active Record on a rich domain,** fusing entities to the database.
- **Designing the domain from the schema,** letting storage dictate the rules.

# Best Practices

- Define **repository interfaces in the use-case layer**, phrased in domain terms.
- Keep **all SQL/ORM in the gateway** and **map** rows ↔ domain objects there.
- Design the **domain model from the rules** and the **schema for storage**; let the mapping reconcile
  them.
- Provide an **in-memory repository** for fast tests, satisfying the same interface.

# Summary

- A **repository/gateway** is an interface owned by the use-case layer; its concrete implementation is the
  only place SQL/ORM lives.
- **"The database is a detail"**: storage is an outer, replaceable concern, not the architectural core.
- The gateway **maps** between the domain model (built for rules) and the storage schema (built for
  storage), letting each evolve independently.
- Don't let the **schema drive the domain**, and avoid **Active Record** on a rich domain — prefer **Data
  Mapper**.

# Flash Cards

Q: Who owns the repository interface, and who implements it?
A: The use-case (inner) layer owns the repository interface in domain terms; an outer adapter (gateway) in the Interface Adapters layer implements it with the actual database code.

Q: What does "the database is a detail" mean?
A: The database is an outer, replaceable tool for storing and retrieving data; business rules should not depend on it, and the choice of database can be deferred and changed.

Q: Why map between domain objects and storage rows instead of using one shape?
A: Because the domain model is designed for rules and the schema for storage; letting them differ and mapping in the gateway lets each evolve independently.

Q: How does Active Record conflict with Clean Architecture?
A: Active Record makes a class both a domain object and its own database row, fusing the domain to the database so the entity can't exist without the ORM — a Dependency Rule violation. Data Mapper is preferred.

Q: What goes wrong when the database schema drives the domain model?
A: Storage concerns (foreign keys, nullable columns, join tables) dictate business objects, so rules bend around storage and schema changes ripple through the domain.

Q: Where should a `SELECT COUNT(*)` needed by a use case live?
A: Behind a domain-phrased gateway method (e.g., countPending()), in the repository implementation — never inline in the use case.

# Exercises

### Easy
For an entity you know, write a repository interface in domain language (no SQL) with the two or three
methods your use cases actually need.

### Medium
Implement two versions of that repository: an in-memory one for tests and a sketch of a SQL-backed one
with explicit `toDomain`/`toRow` mapping. Confirm a use case can't tell them apart.

### Challenging
Find code where a use case or entity contains SQL or imports an ORM model. Extract a repository interface,
move the query and mapping into a gateway, and describe a schema change you could now make without
touching any business rule.

# Further Reading

- Robert C. Martin — *Clean Architecture* (2017), ch. 30 "The Database Is a Detail"
- Martin Fowler — *Repository*: <https://martinfowler.com/eaaCatalog/repository.html> and *Data Mapper*: <https://martinfowler.com/eaaCatalog/dataMapper.html>
- Martin Fowler — *Active Record*: <https://martinfowler.com/eaaCatalog/activeRecord.html>
- Eric Evans — *Domain-Driven Design* (2003), ch. 6 on Repositories
