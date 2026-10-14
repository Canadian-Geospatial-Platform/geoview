---
description: Layer classes, config validation, schema defaults and GeoCore rules
applyTo: 'packages/geoview-core/src/geo/layer/**,packages/geoview-core/src/api/config/**,packages/geoview-core/src/api/types/**,packages/geoview-core/schema*.json'
---

Canonical: [layer invariants](../../docs/programming/adding-layer-types.md#runtime-invariants),
[defaults/schema](../../docs/app/config/configuration-reference.md#schema-validation),
[config order](../../docs/app/config/configuration-reference.md#canonical-property-order),
[GeoCore/error handling](../../docs/app/config/configuration-reference.md#error-handling).
Source routing: [layers](../ai/layers.md#source-navigation), [config](../ai/config-schema.md#source-navigation-and-implementation-gotchas).

- Require both tiers, group entryType and cascaded display names; proxy remains per-instance.
- Sync all three defaults; report-and-skip bad root types; preserve UUID suffixes through resolved paths.
- Use full WMS paths, preserve partial success and distinguish own visibility from ancestor masking.
- Before changing inference/range behavior, inspect actual GeoPackage and resolution-gating source paths.
