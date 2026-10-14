---
description: Controller, domain, store and event rules
applyTo: 'packages/**/controllers/**,packages/**/stores/**,packages/**/domains/**,packages/**/api/events/**'
---

Canonical: [controller lifecycle/architecture](../../docs/programming/controller-architecture.md#creating-custom-controllers),
[store access and batches](../../docs/programming/using-store.md#store-access-patterns),
[getter/hook regions](../../docs/programming/using-store.md#three-function-types-per-store-slice),
[event naming](../../docs/programming/event-helper.md#naming-conventions).
Source routing: [controllers-store](../ai/controllers-store.md#source-navigation).

- Components call controllers, never store setters/MapViewer. Non-React code uses getters/registry.
- Add missing getters beside hooks; after suppressed-event batches explicitly sync derived store state.
- Pair hook/unhook subscriptions; EventHelper parameters are `(sender, event)`. No business logs in slices.
