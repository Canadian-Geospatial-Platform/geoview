---
description: Controller, domain, store and event rules
applyTo: 'packages/**/controllers/**,packages/**/stores/**,packages/**/domains/**,packages/**/api/events/**'
---

Canonical sections (search the named heading and read only that section):
[controller-architecture.md](../../docs/programming/controller-architecture.md) → **Creating Custom Controllers**;
[using-store.md](../../docs/programming/using-store.md) → **Store Access Patterns** and **Three Function Types per Store Slice**;
[event-helper.md](../../docs/programming/event-helper.md) → **Naming Conventions**.
Source routing: [controllers-store.md](../ai/controllers-store.md) → **Source navigation**.

- Components call controllers, never store setters/MapViewer. Non-React code uses getters/registry.
- Add missing getters beside hooks; after suppressed-event batches explicitly sync derived store state.
- Pair hook/unhook subscriptions; EventHelper parameters are `(sender, event)`. No business logs in slices.
