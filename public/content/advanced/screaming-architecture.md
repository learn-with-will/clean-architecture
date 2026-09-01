---
id: lesson-17
slug: screaming-architecture
title: "Screaming Architecture"
level: advanced
order: 17
duration: 20
tags:
  - screaming-architecture
  - intent
  - packaging
  - use-case-centric
  - frameworks
summary: "The idea that a system's top-level structure should shout what it does — an accounting system, a health-care system — rather than which framework it uses, achieved by organizing code around use cases and the domain instead of technical layers, while remembering it does not mean avoiding frameworks."
---

# Learning Objectives

By the end of this lesson you will be able to:

- Explain **Screaming Architecture** and what a codebase's structure should "scream."
- Organize top-level code around **use cases / the domain** rather than the framework.
- Contrast **package-by-layer** with **package-by-feature**.
- Correct the misreading that Screaming Architecture means "no framework."

# Why It Matters

Open many projects and the first thing you see is `controllers/`, `models/`, `views/`, `config/` — a
structure that announces the *framework*, not the *purpose*. Robert C. Martin's **Screaming
Architecture** (2011) argues that this is backwards: the loudest thing about your code should be **what
the system is for**. Structure is documentation; make it document the domain.

# Concept Explanation

### What should your architecture scream?

Martin's analogy: the blueprints of a building **scream** their intent — you can glance at the plans for a
library and know it's a library (reading rooms, stacks, a circulation desk), not a supermarket. He asks:
when someone looks at your top-level source structure, does it scream **"Health Care System"** or does it
scream **"Rails"** / **"Spring"** / **"Express"**?

A framework is a **delivery mechanism** — a detail. If your structure is organized primarily around the
framework, you've made the least important thing the most visible, and you've coupled your mental model of
the system to a tool you're supposed to be able to replace.

### Organize around use cases and the domain

Screaming Architecture follows directly from the use-case-centric thinking you've learned. The top level
should read like a list of **what the application does**:

```text
Screams the domain (good)          Screams the framework (weak)
─────────────────────────          ───────────────────────────
src/                               src/
  billing/                           controllers/
    PlaceInvoice.ts                    InvoiceController.ts
    RefundInvoice.ts                   AccountController.ts
    InvoiceGateway.ts                controllers/... (all of them)
  accounts/                          models/
    OpenAccount.ts                     Invoice.ts
    CloseAccount.ts                    Account.ts
  patients/                          services/
    AdmitPatient.ts                    ... (everything else)
```

On the left, someone new can see the system is about **billing, accounts, and patients**, and can find
"refund an invoice" instantly. On the right, they learn only that you use some MVC framework, and the
concept "refund an invoice" is scattered across a controller, a model, and a service.

### Package-by-layer vs package-by-feature

- **Package-by-layer** groups by technical kind: all controllers together, all models together, all
  repositories together. It screams the framework and scatters each feature across every folder.
- **Package-by-feature** groups by domain capability: everything for "billing" together. It screams the
  domain and keeps a feature's parts close, raising cohesion.

Screaming Architecture pushes toward **package-by-feature** at the top level (you may still layer *within*
a feature). The Dependency Rule still governs the arrows; this lesson is about which grouping is most
*visible*.

### It does NOT mean "no framework"

A crucial correction: Screaming Architecture does **not** say avoid frameworks, nor that frameworks are
bad. It says **don't let the framework be the organizing principle** of your system, and don't marry the
framework so tightly that it can't be deferred or replaced. You still use the framework — you just keep it
in the outer ring, plugged into a structure that's organized around the domain.

The related pay-off Martin points out: a domain-organized structure keeps the framework decision **open**.
If your top level is your use cases and the web framework is a detail wired in at the edge, you could even
defer *choosing* the framework — the way an architect can design a library's spaces before deciding the
exact brand of shelving.

# Key Terminology

- **Screaming Architecture** — the principle that top-level structure should reveal the system's purpose/use cases, not its framework.
- **Delivery mechanism** — the framework/UI/transport used to deliver the app; a detail, not the architecture.
- **Package-by-layer** — grouping code by technical role (controllers, models, repos); screams the framework.
- **Package-by-feature** — grouping code by domain capability; screams the domain and raises cohesion.
- **Intent-revealing structure** — an arrangement where the folder/module layout documents what the system does.

# Options and Trade-offs

| Decision | Option A | Option B | How to choose |
| -------- | -------- | -------- | ------------- |
| Top-level grouping | By layer (controllers/models) | By feature/domain | Prefer by-feature so structure screams intent; by-layer only for tiny apps or within a feature. |
| Framework's place in the tree | Central, organizing everything | An outer detail wired at the edge | Keep it at the edge so the domain leads and the framework stays replaceable. |
| Where to layer | Across the whole app | Within each feature | Layer inside features to keep cohesion while honoring the Dependency Rule. |

# Worked Example

Refactor a framework-shouting tree into a domain-shouting one:

```text
Before (by layer)              After (by feature)
─────────────────              ──────────────────
controllers/                   shipping/
  ShippingController.ts          QuoteShipment.ts        (use case)
  TrackingController.ts          TrackShipment.ts        (use case)
models/                          Shipment.ts             (entity)
  Shipment.ts                    ShipmentGateway.ts      (port)
  Carrier.ts                     web/ShippingController.ts (adapter)
repositories/                  carriers/
  ShipmentRepo.ts                Carrier.ts
  CarrierRepo.ts                 CarrierGateway.ts
```

After the move, "quote a shipment" lives in one place with its entity, port, and adapter nearby. The tree
now says *this is a shipping system*, and the web controller is visibly a detail inside the feature.

# Real World Analogy

Walk into a **hospital** and the layout screams "hospital": an emergency department, wards, operating
theatres, a pharmacy. You immediately know what happens here. Now imagine a building organized instead by
*construction trade* — all the plumbing in one wing, all the electrical in another, all the drywall in a
third. It might be built efficiently, but no one could tell what the building is *for*, and finding "the
operating theatre" would mean visiting every wing. Screaming Architecture is designing the hospital so its
purpose is obvious from the floor plan.

# Examples

## Example 1 — Basic: what does this scream?

A repo's top level is `pages/`, `components/`, `hooks/`, `api/`. What does it scream? Answer: the
**framework** (a particular front-end/JS stack) — not the domain. You can't tell if it's a bank or a blog.

**Why this works:** the organizing principle is technical role, so the structure documents the tool, not
the purpose.

## Example 2 — Real-world: onboarding speed

A team reorganizes from by-layer to by-feature. New hires now find and change "cancel subscription" in one
folder instead of hopping across `controllers`, `services`, `models`, and `repositories`. Time-to-first-
change drops noticeably.

**Why this works:** intent-revealing, cohesive structure made the domain navigable, turning the layout into
useful documentation.

## Example 3 — Pitfall: mistaking the slogan for "delete the framework"

A team reads "Screaming Architecture" and rips out their web framework, hand-rolling routing and
serialization. They spend weeks rebuilding what the framework gave them for free, with more bugs — and
their structure still wasn't organized around the domain.

**Why this bites:** the principle is about *organizing around intent and keeping the framework at the
edge*, not about avoiding frameworks; discarding the tool missed the point and added cost.

# Common Mistakes

- **Letting the framework's folders be the top-level structure,** hiding the domain.
- **Scattering a feature across layer folders,** so no place expresses the capability.
- **Reading Screaming Architecture as "no frameworks."** It means don't let them *organize* the system.
- **Layering so rigidly** that even tiny features must touch four technical folders.

# Best Practices

- Make the **top level a list of the system's capabilities/use cases**.
- Prefer **package-by-feature**; layer *within* a feature as needed.
- Keep the **framework an outer detail** wired at the edge of each feature.
- Treat the source tree as **documentation** — optimize it for "what does this system do?"

# Summary

- **Screaming Architecture**: your top-level structure should shout **what the system does**, not which
  framework it uses.
- Achieve it by organizing around **use cases and the domain** — **package-by-feature** over
  **package-by-layer**.
- The framework is a **delivery mechanism/detail**; keep it at the edge so it stays replaceable and even
  deferrable.
- It does **not** mean avoiding frameworks — it means not letting them be the organizing principle.

# Flash Cards

Q: What should a system's top-level structure "scream," according to Screaming Architecture?
A: What the system is for — its use cases and domain (e.g., "accounting system," "health-care system") — not which framework or delivery mechanism it uses.

Q: What is the difference between package-by-layer and package-by-feature?
A: Package-by-layer groups by technical role (controllers, models, repos) and screams the framework; package-by-feature groups by domain capability and screams the domain, keeping a feature's parts cohesive.

Q: Does Screaming Architecture mean you should avoid frameworks?
A: No. It means don't let the framework be the organizing principle and don't marry it; you still use frameworks, kept as an outer, replaceable detail.

Q: Why is an intent-revealing structure valuable beyond aesthetics?
A: The source tree acts as documentation: developers can find and change a capability quickly, and the framework decision stays visibly at the edge and replaceable.

Q: Where does layering happen in a package-by-feature structure?
A: Within each feature — you still honor the Dependency Rule, but the top level is organized by capability rather than by technical layer.

Q: Who introduced Screaming Architecture and when?
A: Robert C. Martin, in a 2011 blog post.

# Exercises

### Easy
Look at the top-level folders of a project you know. Write down whether they scream the **domain** or the
**framework**, and what a newcomer could infer about the system's purpose.

### Medium
Take a feature scattered across `controllers/`, `services/`, and `models/`. Sketch a package-by-feature
folder that gathers its use cases, entity, port, and adapter together.

### Challenging
Design a top-level structure for an app you know so it "screams" its domain. Show where the web framework
and database live in that structure, and argue how the layout keeps them as replaceable details.

# Further Reading

- Robert C. Martin — *Screaming Architecture* (2011): <https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html>
- Robert C. Martin — *Clean Architecture* (2017), ch. 21 "Screaming Architecture"
- Simon Brown — *Package by component and architecturally-aligned testing*: <https://www.codingthearchitecture.com/2015/03/08/package_by_component_and_architecturally_aligned_testing.html>
- Martin Fowler — *PresentationDomainDataLayering*: <https://martinfowler.com/bliki/PresentationDomainDataLayering.html>
