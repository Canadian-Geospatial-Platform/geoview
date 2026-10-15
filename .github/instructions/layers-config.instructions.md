---
description: Layer classes, config validation, schema defaults and GeoCore rules
applyTo: 'packages/geoview-core/src/geo/layer/**,packages/geoview-core/src/api/config/**,packages/geoview-core/src/api/types/**,packages/geoview-core/schema*.json'
---

Canonical sections (search the named heading and read only that section):
[adding-layer-types.md](../../docs/programming/adding-layer-types.md) → **Runtime invariants**;
[configuration-reference.md](../../docs/app/config/configuration-reference.md) → **Schema Validation**, **Canonical Property Order**, and **Error Handling**.
Source routing: [layers.md](../ai/layers.md) → **Source navigation**;
[config-schema.md](../ai/config-schema.md) → **Source navigation and implementation gotchas**.

- Require both tiers, group entryType and cascaded display names; proxy remains per-instance.
- Sync all three defaults; report-and-skip bad root types; preserve UUID suffixes through resolved paths.
- Use full WMS paths, preserve partial success and distinguish own visibility from ancestor masking.
- Before changing inference/range behavior, inspect actual GeoPackage and resolution-gating source paths.
