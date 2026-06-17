# 16 — Initial Settings

Initial controls, states, selected tabs, and cascading behavior.

## Selected Tab & Layer

Config: `configs/navigator/demos/23-initial-settings.json`

- [ ] **Footer bar selected tab** — Verify the footer bar opens to the configured initial tab.
- [ ] **App bar selected tab** — Verify the app bar highlights the configured initial tab.
- [ ] **Selected layer** — Verify the configured initial layer is selected in the relevant panels.

## Initial Controls

Config: `configs/navigator/demos/23b-initial-settings-states-controls.json`

- [ ] **Controls applied** — Verify initial controls (remove, snapping, etc.) are applied at load time.
- [ ] **All controls false** — Load a config with all controls set to `false`. Verify all controls are disabled.

## Initial States

Config: `configs/navigator/demos/23b-initial-settings-states-controls.json`

- [ ] **Visible false** — Verify layers with `visible: false` are hidden on load but appear in the legend (greyed out).
- [ ] **Opacity** — Verify layers with custom opacity render at the configured opacity level.
- [ ] **Queryable false** — Verify layers with `queryable: false` are not queryable on click.
- [ ] **Hoverable false** — Verify layers with `hoverable: false` do not show hover tooltips.

## Cascading Behavior

Config: `configs/navigator/demos/23c-initial-settings-cascading.json`

- [ ] **Parent visible false cascades** — Verify that when a parent group has `visible: false`, children are hidden on the map but preserve their own visibility state (greyed in legend).
- [ ] **Parent controls cascade** — Verify that when a parent has `controls.remove: false`, children inherit the setting (remove button hidden) unless they explicitly override.
- [ ] **3-level cascade** — Verify settings cascade correctly through group → subgroup → child levels.

## Opacity Cascading

- [ ] **Child capped by parent** — Set parent opacity to 50%, child to 100%. Verify child renders at 50% (capped by parent).
- [ ] **Child below parent** — Set parent to 80%, child to 40%. Verify child renders at 40% (not capped, already below).
- [ ] **Runtime parent change** — Change parent opacity at runtime. Verify child opacity updates (re-capped).

## Initial Filters

Config: `configs/navigator/demos/23a-initial-settings-filters.json`

- [ ] **Filter applied on load** — Verify the configured initial filter is applied to the layer on load.
- [ ] **Filtered features** — Verify only features matching the filter are visible on the map and in the data table.

## Layer Entry Source Config

Config: `configs/navigator/demos/23d-initial-settings-layer-config.json`

For raster function and WMS style tests, see [08-layers.md — Esri Image Layer Settings](08-layers.md#esri-image-layer-settings) and [08-layers.md — WMS Layer Settings](08-layers.md#wms-layer-settings).

- [ ] **Feature info field config** — Verify configured `featureInfo` field aliases and formatting are applied correctly in the details panel.
- [ ] **nameField / outfields** — Verify the configured `nameField` is used as the feature label and `outfields` limits which fields are returned.

> Core nameField/outfields behavior tested in [10 — Details](10-details.md#summary--out-fields).
