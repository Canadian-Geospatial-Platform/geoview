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

> Tested in [07 — Legend Panel](07-legend.md#style-classes-visibility) and [08 — Layers Panel](08-layers.md#style-classes-visibility).

## WMS Legend Images

> Tested in [07 — Legend Panel](07-legend.md#wms-legend-images) (legend images and lightbox) and [08 — Layers Panel](08-layers.md#wms-layer-settings) (right panel images).

## Feature Labels

Config: `configs/navigator/demos/24-configured-feature-labels.json`

- [ ] **Labels render from config** — Load the feature labels config. Verify text labels appear on map features at appropriate positions.
- [ ] **Label field** — Verify the label displays the correct field value as configured (not a random field).
- [ ] **Label styling** — Verify label font size, color, and halo/outline are applied as configured.
- [ ] **Labels at zoom levels** — Zoom in/out. Verify labels remain readable and don't overlap excessively.
