# 19 — Integration Flows

Multi-step workflows that test cross-panel and cross-feature interactions. These tests validate that state stays consistent across panels and operations.

## Flow 1: Layer Config with Table Disabled

1. [ ] Open a layer config with `table: false`
2. [ ] Check the store — verify the config has `table: false`
3. [ ] Open the Layers right panel — verify the data table shortcut has `aria-disabled`
4. [ ] Verify clicking the disabled shortcut does nothing

## Flow 2: North Pole Lifecycle

> Tested in [13 — Projection](13-projection.md#north-pole-flag-on-projection-switch) ("Full flow" test covers LCC → WM → LCC transition).

## Flow 3: Unrestricted Zoom Extent Comparison

> Tested in [12 — View Settings](12-view-settings.md#max-extent).

## Flow 4: Zoom to Layer Extent

Config: `configs/navigator/demos/06-zoom-layer.json`

> UI-level zoom-to-extent buttons tested in [07 — Legend](07-legend.md#shortcuts--actions) and [08 — Layers](08-layers.md#actions).

1. [ ] Trigger zoom to layer extent (with specific layer ID) — verify the map zooms to that layer's extent
2. [ ] Trigger zoom to layer extent (with empty/no ID) — verify fallback behavior
3. [ ] Check the resulting extent — verify it matches expected bounds

## Flow 5: Layers in Visible Range

> Tested in [08 — Layers](08-layers.md#layer-zoom-levels) (store check + OL visibility check at zoom boundaries).

## Flow 6: Data Table Filter by Extent

> Tested in [11 — Data Table](11-data-table.md#filter-by-map-extent) and [11 — Store Verification](11-data-table.md#store-verification).

## Flow 7: Geocore Auto-Creation

> Tested in [17a — Time Slider](17a-package-time-slider.md#geocore-auto-creation) and [17b — Geochart](17b-package-geochart.md#geocore-auto-creation).

## Flow 8: Time Slider Filter Store

> Tested in [17a — Time Slider](17a-package-time-slider.md#store-verification).

## Flow 9: Highlight & Opacity Restore

1. [ ] Set opacity on main group, child group, and leaf layer to different values (e.g., 80%, 60%, 40%)
2. [ ] Trigger "Highlight Layer" on the leaf — verify all layers go to 100% opacity (or highlight level)
3. [ ] Remove the highlight
4. [ ] Verify all layers return to their original opacities (80%, 60%, 40%)

## Flow 10: Data Table + Style Classes

> Tested in [11 — Data Table](11-data-table.md#table-with-style-classes).

## Flow 11: Parent/Child Visibility

> Tested in [08 — Layers](08-layers.md#visibility) ("Toggle group visibility") and [01 — Global](01-global.md#cross-panel-layer-visibility).

## Flow 12: Style Classes + Toggle All

> Individual class toggles tested in [08 — Layers](08-layers.md#style-classes-visibility). Table reflecting class filter tested in [11 — Data Table](11-data-table.md#table-with-style-classes).

1. [ ] Open Layers panel for a layer with style classes
2. [ ] Toggle individual classes on/off
3. [ ] Press "Toggle All" — verify all classes toggle consistently
4. [ ] Check the filter in the store — verify `layerFilterClass` is correct
5. [ ] Create a data table — verify it reflects the current class filter

## Flow 13: Wrong Layer Type Crash Prevention

> Tested in [03 — Config Validation](03-config.md#wrong-layer-type).

## Flow 14: Dynamic Footer Tab Lifecycle (Chart & Time Slider)

1. [ ] Load a config with no layers that have geochart or time slider — verify no Chart tab and no Time Slider tab in the footer bar
2. [ ] Add a layer that has a geochart config — verify the Chart tab appears in the footer bar
3. [ ] Add a layer that has a time dimension — verify the Time Slider tab appears in the footer bar
4. [ ] Remove the geochart layer — if no other layers have geochart, verify the Chart tab disappears
5. [ ] Remove the time-aware layer — if no other layers have time dimension, verify the Time Slider tab disappears
6. [ ] Add both layers back — verify both tabs reappear

## Flow 15: Dynamic Footer Tab Lifecycle (Data Table)

1. [ ] Load a config with no layers — verify no Data Table tab in the footer bar
2. [ ] Add a layer — verify the Data Table tab appears in the footer bar
3. [ ] Remove the layer — verify the Data Table tab disappears
