# 22 — Edge Cases

Edge cases, metadata issues, WCAG, and weird behaviors.

## Guide Panel Persistence

- [ ] **Guide stays open** — Open Data Table, select a layer. Toggle the Guide. Verify the Guide stays open.
- [ ] **Guide across panels** — Repeat for every panel (Legend, Layers, Details, Time Slider, Chart). Verify the Guide stays open when toggled.

## Custom Legend with Error Layers

- [ ] **Group with error child** — Using custom legend, load a group layer that has a sublayer in error. Try to toggle the group's visibility. Verify no crash, valid sublayers still toggle correctly.

## Metadata Edge Cases

- [ ] **Layer with `nameField = Date`** — Load a layer where the name field is named "Date". Verify:
  - The layer name resolves correctly (not confused with date parsing)
  - Feature info displays the Date field correctly
- [ ] **Empty `listOfLayerEntryConfig`** — Load a GeoView layer config with an empty array `[]` for `listOfLayerEntryConfig`. Verify it doesn't crash and handles gracefully.
- [ ] **WMS with special characters in name** — Load a WMS layer with `/` and/or spaces in the layer name (e.g., `https%3A%2F%2Fnonna-geoserver.data.chs-shc.ca%2Fgeoserver`). Verify the layer loads correctly despite URL encoding.

## Summary & Out Fields

Config: `configs/navigator/demos/29-summary-outfields.json`

- [ ] **Summary fields** — Verify the configured summary/out fields display correctly in feature info.

## WCAG Accessibility

- [ ] **Hidden tabs visible** — Check the WCAG demo config. Verify time-slider and chart tabs are present in the footer bar (not hidden from assistive technology).
- [ ] **Keyboard navigation** — Tab through all interactive elements in the viewer. Verify focus indicators are visible and order is logical.
- [ ] **Screen reader** — With a screen reader enabled, verify all interactive elements have accessible labels.
- [ ] **Aria-labels on icon buttons** — Spot-check that all icon buttons have `aria-label` attributes.

## Circumpolar Config

Config: `configs/navigator/demos/22-circumpolar.json`

- [ ] **Circumpolar projection** — Load the circumpolar config. Verify it renders correctly in EPSG:3573.
- [ ] **No north pole/arrow** — Verify neither the north pole icon nor arrow is displayed.

## Error Layer Reload

- [ ] **Reload bad URL** — Load a layer with a bad URL. After it shows as error, attempt to reload it. Verify it stays in error (doesn't crash or create duplicates).
- [ ] **Reload bad ID** — Load a layer with a bad layer ID. After error, attempt reload. Verify same error state.

## Two-Map Page

- [ ] **Shortcuts target correct map** — With 2 maps on the page, verify shortcuts from layers/details go to the correct map's footer panel.
- [ ] **Independent state** — Verify each map maintains independent zoom, projection, and layer state.

## Drawer Plugin

Config: `configs/navigator/demos/15-package-drawer.json`

- [ ] **Drawer opens** — Verify the drawer plugin opens correctly.
- [ ] **Drawer content** — Verify drawer content renders.

## About Panel

Config: `configs/navigator/demos/18-package-about-panel.json`

- [ ] **About panel renders** — Verify the about panel opens with content.
- [ ] **Markdown rendering** — Verify markdown content renders correctly (headers, links, lists).

## AOI Panel

Config: `configs/navigator/demos/16-package-area-of-interest.json`

- [ ] **AOI panel renders** — Verify the area of interest panel opens correctly.

## Outlier Test Pages

Spot-check the outlier test pages for regressions:

- [ ] **`outliers.html`** — Load and verify no crashes.
- [ ] **`outlier-style.html`** — Verify style edge cases render correctly.
- [ ] **`outlier-performance.html`** — Verify no excessive lag or memory issues.
- [ ] **`outlier-metadata.html`** — Verify metadata edge cases are handled.
- [ ] **`outlier-many-groups.html`** — Verify deeply nested groups render correctly.
- [ ] **`outlier-geometry.html`** — Verify geometry edge cases render correctly.

---

## Issues Found

<!-- Record any issues below -->
