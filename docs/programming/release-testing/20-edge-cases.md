# 20 — Edge Cases

Edge cases, metadata issues, WCAG, and weird behaviors.

## Guide Panel Persistence

> Tested in [01 — Global](01-global.md#guide-access).

## Custom Legend with Error Layers

- [ ] **Group with error child** — Using custom legend, load a group layer that has a sublayer in error. Try to toggle the group's visibility. Verify no crash, valid sublayers still toggle correctly.

## Metadata Edge Cases

Demo: `templates/tests/outlier-metadata.html`

- [ ] **Layer with `nameField = Date`** — Verify the layer name resolves correctly (not confused with date parsing) and feature info displays the Date field correctly.
- [ ] **Empty `listOfLayerEntryConfig`** — Load a GeoView layer config with an empty array `[]` for `listOfLayerEntryConfig`. Verify it doesn't crash and handles gracefully.
- [ ] **WMS with space in layer ID** — Load the WMS layer with a space in the ID (e.g., `nonna:NONNA 10`). Verify the layer loads correctly.
- [ ] **WMS with slashes in layer ID** — Load the WMS layer with slashes in the ID (e.g., `photo/plot/with/slash`). Verify the layer loads correctly.

## Summary & Out Fields

> Tested in [10 — Details](10-details.md#summary--out-fields).

## WCAG Accessibility

> Full WCAG and accessibility testing is in the dedicated [21 — WCAG Accessibility](21-wcag-accessibility.md) file.

## Circumpolar Config

Config: `configs/navigator/demos/22-circumpolar.json`

- [ ] **Circumpolar projection** — Load the circumpolar config. Verify it renders correctly in EPSG:3573.

> North pole/arrow behavior tested in [02 — Map](02-map.md#north-pole--north-arrow) (EPSG:3573).

## Error Layer Reload

- [ ] **Reload bad URL** — Load a layer with a bad URL. After it shows as error, attempt to reload it. Verify it stays in error (doesn't crash or create duplicates).
- [ ] **Reload bad ID** — Load a layer with a bad layer ID. After error, attempt reload. Verify same error state.

## Two-Map Page

> Shortcut targeting tested in [01 — Global](01-global.md#two-map-shortcuts).

- [ ] **Independent state** — Verify each map maintains independent zoom, projection, and layer state.

## Outlier Test Pages

Spot-check the outlier test pages for regressions:

- [ ] **`outliers.html`** — Load and verify no crashes.
- [ ] **`outlier-style.html`** — Verify style edge cases render correctly.
- [ ] **`outlier-performance.html`** — Verify no excessive lag or memory issues.
- [ ] **`outlier-many-groups.html`** — Verify deeply nested groups render correctly.
- [ ] **`outlier-geometry.html`** — Verify geometry edge cases render correctly.
- [ ] **`outlier-elections-2019.html`** — Load and verify election data renders without errors.
- [ ] **`outlier-ESRI-maxRecordCount.html`** — Verify layers with high record counts load correctly (pagination/chunking).
- [ ] **`outlier-GeoAI.html`** — Load and verify GeoAI layer renders without errors.

## Overlay Objects

Config property: `map.overlayObjects.pointMarkers` — non-interactive markers on the map.

- [ ] **Markers render** — Load a config with `overlayObjects` point markers. Verify colored dots appear at the configured coordinates.
- [ ] **Non-interactive** — Click on an overlay marker. Verify it does NOT trigger a feature query in the Details panel.
- [ ] **Custom color/opacity** — Verify markers use their configured color and opacity.

## Config Sandbox

Page: `/config-sandbox.html`

- [ ] **Edit and reload** — Edit the JSON in the textarea (e.g., change projection). Click Reload. Verify the map reinitializes with the new config.
- [ ] **Invalid JSON** — Enter invalid JSON (syntax error). Click Reload. Verify an error is shown and the viewer doesn't crash.
- [ ] **Add layer via sandbox** — Add a new layer entry in the JSON. Click Reload. Verify the new layer appears.

## Mobile / Responsive Layout

- [ ] **Tabs become dropdown** — Resize the browser below 600px width (or use mobile emulation). Verify footer bar tabs collapse into a dropdown/selector.
- [ ] **Export button hidden** — At mobile width (below `md` breakpoint ~960px), verify the export button is hidden.
- [ ] **Panels usable** — Open panels at mobile width. Verify content is scrollable and interactive elements are reachable.
