# 12 — View Settings

Zoom constraints, extent overrides, and zoom-to-layer.

## Restricted Zoom

Config: `configs/navigator/demos/04-restrict-zoom.json`

- [ ] **Min zoom enforced** — Try to zoom out below the configured min zoom. Verify the map stops at the minimum.
- [ ] **Max zoom enforced** — Try to zoom in above the configured max zoom. Verify the map stops at the maximum.
- [ ] **Zoom to 20** — Attempt to zoom to level 20 (programmatically or via scroll). Verify it clamps to the restricted max limit.
- [ ] **Zoom to 1** — Attempt to zoom to level 1. Verify it clamps to the restricted min limit.

## Max Extent Override (Unrestricted Extent)

Config: `configs/navigator/demos/05-max-extent-override.json`

- [ ] **Unrestricted pan** — Zoom out fully. Verify the map extent is larger than the default extent.
- [ ] **Compare extents** — Compare the visible extent with the default extent AND the one configured in the config. Verify the configured extent is applied.

## Zoom to Layer Extent

Config: `configs/navigator/demos/06-zoom-layer.json`

- [ ] **Zoom to specific layer** — Trigger "zoom to layer extent" on a layer with a specific extent. Verify the map zooms to that layer's extent.
- [ ] **Zoom with empty extent** — Trigger "zoom to layer extent" on a layer with no specific extent set. Verify fallback behavior (zoom to default or full extent).

## Layer Zoom Levels

Config: `configs/navigator/demos/07-layer-zoom-levels.json`

- [ ] **Layer appears at zoom** — Zoom to the configured visible range. Verify the layer appears.
- [ ] **Layer disappears** — Zoom outside the visible range. Verify the layer disappears.
- [ ] **`inVisibleRange` store check** — Open the store and verify `inVisibleRange` is `false` when zoomed out of range and `true` when in range.
- [ ] **OL layer visibility** — Check `getOLLayer().isVisible()` — should be `false` out of range, `true` in range.

## Rotation & Home View

Config: `configs/navigator/demos/27-view-settings-rotation-home.json`

- [ ] **Initial rotation** — Verify the map loads with the configured initial rotation.
- [ ] **Home view** — Click Home. Verify it returns to the configured home view (extent + rotation).

---

## Issues Found

<!-- Record any issues below -->
