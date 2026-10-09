# 19 — Integration Flows

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-19-integration-flows.html](https://canadian-geospatial-platform.github.io/geoview/public/rt-19-integration-flows.html) — Links to referenced test pages and navigator configs.

Multi-step workflows that test cross-panel and cross-feature interactions. These tests validate that state stays consistent across panels and operations.

## Cross-Referenced Flows

The following integration scenarios are fully covered in their domain-specific test files:

- **North Pole Lifecycle** → [13 — Projection](13-projection.md#north-pole-flag-on-projection-switch)
- **Unrestricted Zoom Extent** → [12 — View Settings](12-view-settings.md#max-extent)
- **Layers in Visible Range** → [08 — Layers](08-layers.md#layer-zoom-levels)
- **Data Table Filter by Extent** → [11 — Data Table](11-data-table.md#filter-by-map-extent)
- **Geocore Auto-Creation** → [17a — Time Slider](17a-package-time-slider.md#geocore-auto-creation) and [17b — Geochart](17b-package-geochart.md#geocore-auto-creation)
- **Time Slider Filter Store** → [19b — Store Verification](19b-store-verification.md#time-slider-state)
- **Data Table + Style Classes** → [11 — Data Table](11-data-table.md#table-with-style-classes)
- **Parent/Child Visibility** → [08 — Layers](08-layers.md#visibility) and [01 — Global](01-global.md#cross-panel-layer-visibility)
- **Wrong Layer Type Crash** → [03 — Config Validation](03-config.md#wrong-layer-type)

## Layer Config with Table Disabled

Config: Any layer config with `initialSettings.controls.table: false`.

| Test                 | Description                                 | Steps                                         | Expected Result                                                            | Auto |
| -------------------- | ------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------- | ---- |
| Shortcut disabled    | Data table shortcut reflects disabled state | 1. Open the Layers right panel for that layer | Data table shortcut icon has `aria-disabled` attribute and greyed-out icon | C    |
| Disabled click no-op | Clicking disabled shortcut does nothing     | 1. Click the disabled data table shortcut     | Nothing happens — no tab opens, no error in console                        | C    |

## Zoom to Layer Extent

Config: `configs/navigator/demos/06-zoom-layer.json`

> UI-level zoom-to-extent buttons also tested in [07 — Legend](07-legend.md#shortcuts--actions) and [08 — Layers](08-layers.md#actions).

| Test                   | Description                              | Steps                                                   | Expected Result                                     | Auto |
| ---------------------- | ---------------------------------------- | ------------------------------------------------------- | --------------------------------------------------- | ---- |
| Zoom to specific layer | Map zooms to a layer's geographic extent | 1. Trigger zoom to layer extent for a specific layer ID | Map zooms to that layer's bounding extent           | M    |
| Extent bounds check    | Resulting extent matches expected values | 1. After zoom, check the resulting map extent           | Extent matches expected bounds for the target layer | M    |

## Highlight & Opacity Restore

| Test                      | Description                                | Steps                                                                                        | Expected Result                                                   | Auto |
| ------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---- |
| Set multi-level opacity   | Opacity at group and leaf levels           | 1. Set opacity on main group to 80%<br>2. Set child group to 60%<br>3. Set leaf layer to 40% | Each level shows its assigned opacity                             | M    |
| Highlight boosts opacity  | Highlighting overrides opacity values      | 1. Trigger "Highlight Layer" on the leaf layer                                               | All layers display at highlight opacity (100% or highlight level) | M    |
| Remove highlight restores | Removing highlight restores original state | 1. Remove the highlight                                                                      | All layers return to original opacities (80%, 60%, 40%)           | M    |

## Style Classes + Toggle All

> Individual class toggles tested in [08 — Layers](08-layers.md#style-classes-visibility). Table reflecting class filter tested in [11 — Data Table](11-data-table.md#table-with-style-classes).

| Test                      | Description                              | Steps                                                                                      | Expected Result                                          | Auto |
| ------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------- | ---- |
| Toggle individual classes | Toggling classes updates layer rendering | 1. Open Layers panel for a layer with style classes<br>2. Toggle individual classes on/off | Layer rendering updates to show only visible classes     | M    |
| Toggle All consistency    | Toggle All switches all classes together | 1. Press "Toggle All"                                                                      | All classes toggle to the same state (all on or all off) | M    |

## Dynamic Footer Tab Lifecycle

### Chart & Time Slider Tabs

| Test                       | Description                                | Steps                                                             | Expected Result                                   | Auto |
| -------------------------- | ------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------- | ---- |
| No tabs initially          | Tabs absent when no matching layers        | 1. Load a config with no layers having geochart or time dimension | No Chart tab and no Time Slider tab in footer bar | C    |
| Chart tab appears          | Adding geochart layer creates tab          | 1. Add a layer that has a geochart config                         | Chart tab appears in the footer bar               | C    |
| Time Slider tab appears    | Adding time-aware layer creates tab        | 1. Add a layer that has a time dimension                          | Time Slider tab appears in the footer bar         | C    |
| Chart tab disappears       | Removing last geochart layer removes tab   | 1. Remove the geochart layer (no others have geochart)            | Chart tab disappears from the footer bar          | M    |
| Time Slider tab disappears | Removing last time-aware layer removes tab | 1. Remove the time-aware layer (no others have time dimension)    | Time Slider tab disappears from the footer bar    | M    |
| Both tabs reappear         | Re-adding layers restores tabs             | 1. Add both layers back                                           | Both Chart and Time Slider tabs reappear          | M    |

### Data Table Tab

| Test             | Description                           | Steps                           | Expected Result                               | Auto |
| ---------------- | ------------------------------------- | ------------------------------- | --------------------------------------------- | ---- |
| No tab initially | Data Table tab absent with no layers  | 1. Load a config with no layers | No Data Table tab in the footer bar           | C    |
| Tab appears      | Adding a layer creates Data Table tab | 1. Add a layer                  | Data Table tab appears in the footer bar      | C    |
| Tab disappears   | Removing last layer removes tab       | 1. Remove the layer             | Data Table tab disappears from the footer bar | M    |
