# 09 — Styles

Style rendering, visual variables, and classification.

## Polygon GeoJSON

- [ ] **Ontario polygons** — Load polygon GeoJSON. Verify there are still 2 polygon styles visible in Ontario (check legend and map).

## Visual Variables

Config: `configs/navigator/demos/25-feature-visual-variables.json`

- [ ] **Size variation** — Verify features vary in size based on attribute values.
- [ ] **Color variation** — Verify features vary in color based on attribute values.
- [ ] **Rotation variation** — Verify features rotate based on attribute values (if applicable).
- [ ] **Legend accuracy** — Verify the legend accurately represents the visual variable ranges.

## Complex Classifications

Config: `configs/navigator/demos/26-complex-classifications.json`

- [ ] **Unique value style** — Verify layers with unique value classification render distinct symbols per category.
- [ ] **Class breaks style** — Verify layers with class breaks render graduated symbols.
- [ ] **Simple style** — Verify layers with simple style render a single symbol for all features.

## Symbol Shapes & Fill Patterns

Config: `configs/navigator/demos/28-symbol-shapes-fill-patterns.json`

- [ ] **Shape symbols** — Verify different symbol shapes render (circle, square, diamond, triangle, cross, X).
- [ ] **Fill patterns** — Verify fill patterns render correctly on polygon features (hatching, dots, etc.).

## Style Item Visibility

- [ ] **Toggle style item** — In the legend, toggle visibility of individual style items (e.g., one category in unique value). Verify that category disappears from the map.
- [ ] **Toggle all style items off** — Turn off all style items. Verify no features render.
- [ ] **Toggle all style items on** — Turn all back on. Verify features reappear.

## WMS Legend Images

- [ ] **Legend images** — For WMS layers, verify legend images are displayed in the legend panel (collapsible section).
- [ ] **Right panel images** — Verify the same legend images appear in the Layers right panel.

---

## Issues Found

<!-- Record any issues below -->
