# 20 — Global Settings

Global settings that affect all layers and panels.

Config: `configs/navigator/demos/19-global-settings.json`

## Coord Info Toggle

- [ ] **Coord info default true** — Verify coordinate info is shown by default when `default: true`.
- [ ] **Coord info toggle off** — Toggle coord info off. Verify coordinates stop appearing.
- [ ] **Coord info toggle on** — Toggle back on. Verify coordinates reappear.
- [ ] **Coord info default false** — Load a config with coord info default false. Verify it is hidden initially.

## Unsymbolized Features

- [ ] **Unsymbolized toggle** — Enable "show unsymbolized features". Verify features without explicit symbols appear on the map.
- [ ] **Compare feature count** — Compare the total feature count in the data table (with unsymbolized enabled) vs. the count with only symbolized features. Verify the unsymbolized total is higher (or equal if all features are symbolized).

## Sublayer Removal

- [ ] **Can remove sublayer** — Verify sublayers can be removed from the layer panel when allowed by global settings.
- [ ] **Cannot remove sublayer** — Set global setting to prevent sublayer removal. Verify the remove option is disabled or hidden.

## Highlight Layer

- [ ] **Highlight with no bbox** — Test highlighting a layer that has no bounding box. Verify the highlight works (no crash, visual feedback on the layer entry).

## Non-Supported Format

- [ ] **Add non-supported UUID** — Add a geocore UUID that resolves to a non-supported layer format (e.g., `aa698863-f689-4dd6-be12-1a9fa513f04b`). Verify:
  - The viewer does not crash
  - An appropriate error message is displayed
  - Other layers continue to work

## Disabled Layer Types

- [ ] **Disabled types setting** — If global settings disable certain layer types, verify those types cannot be added via Add Layer UI.

---

## Issues Found

<!-- Record any issues below -->
