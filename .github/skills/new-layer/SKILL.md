---
name: new-layer
description: "Use when asked to add a new layer type or layer test end to end. Invoke with /new-layer."
---

Goal: use the user's request (if missing, ask: Describe the layer type or layer test to add)

1. Read `.github/ai/layers.md`, `.github/ai/config-schema.md`, `docs/programming/adding-layer-types.md` and `.github/ai/code-map.md`.
2. Implement both tiers: config class in `geo/layer/geoview-layers/` and GV class in `geo/layer/gv-layers/`; update config/schema types and all three default sources if defaults change.
3. Add happy-path and bad-URL tests in `geoview-test-suite` (read `.github/ai/test-suite.md`): constants on `GVAbstractTester`, tests in `LayerTester`, register in `suite-layer.ts`.
4. Update `getTestsTotalFinal()`, `docs/app/testing/test-catalog.md` and `docs/programming/release-testing/00-automated-suite.md` consistently.
5. From `packages/`: `npm run format && npm run fix`, then `npm run check` (`rush build` fails on remaining issues).

For larger work, delegate to the `LayerExpert` custom agent.
