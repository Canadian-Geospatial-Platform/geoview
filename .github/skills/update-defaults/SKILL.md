---
name: update-defaults
description: "Use when asked to update config defaults in all three sources. Invoke with /update-defaults."
---

Change: use the user's request (if missing, ask: Describe the default value change)

Update consistently: `DEFAULT_MAP_FEATURE_CONFIG` in `packages/geoview-core/src/api/types/map-schema-types.ts` (runtime authority), `schema.json` `"default"` annotations, and `schema-default-config.json`. Keep canonical property order and bump the schema version if the shape changes. Update affected demo configs and docs.

For larger work, delegate to the `LayerExpert` custom agent.
