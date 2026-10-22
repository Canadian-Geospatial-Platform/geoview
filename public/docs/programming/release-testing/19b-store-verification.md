# 19b — Store Verification

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.

Consolidated Zustand store state assertions. All tests in this file verify specific store property values via React DevTools and are **automation candidates** — they should eventually be fully covered by the automated test suite (`geoview-test-suite`).

## How to Inspect the Store

1. Set `GEOVIEW_DEVTOOLS = 1` in localStorage (Application → Local Storage)
2. Open browser DevTools → React DevTools → **Components** tab
3. Select the `getViewStore-'mapId'` component (e.g., `getViewStore-'mapWM'`)
4. Navigate to the store path listed in the "Store Path" column below

---

## Layer State

Config: `configs/navigator/layers/all-layers.json`

| Test                          | Description                               | Steps                                                                                      | Store Path                                | Expected Value                                                                                   | Auto |
| ----------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------ | ---- |
| controls.table disabled       | Table control propagates to store         | 1. Load layer with `initialSettings.controls.table: false`                                 | `layerState.[layerPath].controls.table`   | `false`                                                                                          | C    |
| inVisibleRange updates        | Zoom range reflected in store             | 1. Zoom outside a layer's visible range<br>2. Zoom back inside                             | `layerState.[layerPath].inVisibleRange`   | `false` when out of range, `true` when in range                                                  | C    |
| layerFilterClass after toggle | Class filter updates on visibility toggle | 1. Toggle style classes on/off in Legend or Layers panel                                   | `layerState.[layerPath].layerFilterClass` | SQL filter string matching visible classes (e.g., `"status" = 'active' OR "status" = 'pending'`) | C    |
| Opacity after highlight       | Opacity values restored post-highlight    | 1. Set opacity 80%/60%/40% on group/child/leaf<br>2. Highlight leaf<br>3. Remove highlight | `layerState.[layerPath].opacity`          | Returns to original values (0.8, 0.6, 0.4)                                                       | C    |

## Data Table State

Config: `configs/navigator/layers/all-layers.json`

| Test                           | Description                  | Steps                                                          | Store Path                                                            | Expected Value                                                      | Auto |
| ------------------------------ | ---------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------- | ---- |
| allFeaturesDataArray populated | Store has feature data       | 1. Open data table for a layer                                 | `dataTableState.allFeaturesDataArray`                                 | Array contains entries for each layer with feature data             | C    |
| rowsFilteredRecord count       | Filtered count matches UI    | 1. Apply a column filter in data table                         | `dataTableState.layersDataTableSetting[layerPath].rowsFilteredRecord` | Value matches the filtered row count displayed in the table toolbar | C    |
| mapFilteredRecord boolean      | Apply-to-map state stored    | 1. Toggle "Apply filter to map" ON                             | `dataTableState.layersDataTableSetting[layerPath].mapFilteredRecord`  | `true`                                                              | C    |
| tableFilters populated         | Map filter expression stored | 1. Apply a column filter<br>2. Toggle "Apply filter to map" ON | `dataTableState.tableFilters[layerPath]`                              | Contains the filter expression string for that layer path           | C    |

## Time Slider State

Config: `configs/navigator/demos/11-package-time-slider.json`

| Test                    | Description                | Steps                                          | Store Path                                            | Expected Value                                         | Auto |
| ----------------------- | -------------------------- | ---------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------ | ---- |
| sliderFilters populated | Filter string in store     | 1. Move the time slider to a specific time     | `timeSliderState.sliderFilters`                       | Contains the time filter string for the active layer   | C    |
| timeSliderLayers config | Layer time config in store | 1. Load a time-aware layer                     | `timeSliderState.timeSliderLayers`                    | Range, type, min/max, and current values are correct   | C    |
| Values update on drag   | Store updates with slider  | 1. Move the slider<br>2. Re-check store values | `timeSliderState.timeSliderLayers.[layerPath].values` | Store values update to reflect the new slider position | C    |

## UI State

Config: any config with dynamic footer bar tabs

| Test                        | Description                  | Steps                                      | Store Path                 | Expected Value                                       | Auto |
| --------------------------- | ---------------------------- | ------------------------------------------ | -------------------------- | ---------------------------------------------------- | ---- |
| Footer tabs after add layer | Tabs reflect loaded plugins  | 1. Add a geochart + time-aware layer       | `uiState.footerBarTabsApi` | Contains `geochart` and `time-slider` entries        | C    |
| Footer tabs after remove    | Tabs update on layer removal | 1. Remove all geochart + time-aware layers | `uiState.footerBarTabsApi` | Does not contain `geochart` or `time-slider` entries | C    |
