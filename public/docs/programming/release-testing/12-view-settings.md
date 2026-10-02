# 12 — View Settings

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-12-view-settings.html](https://canadian-geospatial-platform.github.io/geoview/public/rt-12-view-settings.html) — Map 1 (restricted zoom 6–8), Map 2 (max extent override), Map 3 (rotation + homeView ≠ initialView), Map 4 (initial extent), Map 5 (initial click coordinate), Map 6 (enableRotation: false).

Zoom constraints, extent overrides, initial view modes, home view, rotation, and initial click coordinate. The `viewSettings` config property controls the map's initial state (projection, zoom, center, extent, rotation) and constraints (min/max zoom, max extent).

## Restricted Zoom

| Test                    | Description            | Steps                                                                                                                                       | Expected Result                                                        | Auto |
| ----------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---- |
| Min zoom enforced       | Cannot zoom below min  | 1. On Map 1, try to zoom out below min zoom (6) using scroll wheel or zoom button                                                           | Map stops at zoom level 6 and does not zoom out further                | M    |
| Max zoom enforced       | Cannot zoom above max  | 1. On Map 1, try to zoom in above max zoom (8) using scroll wheel or zoom button                                                            | Map stops at zoom level 8 and does not zoom in further                 | M    |
| Zoom API clamped to max | API respects max limit | 1. Use the "Set zoom" input above Map 1 to enter 20 and click Apply (or run `cgpv.api.getMapViewer('map1').setMapZoomLevel(20)` in console) | Map zoom clamps to the configured max (8) — OL enforces the constraint | A    |
| Zoom API clamped to min | API respects min limit | 1. Use the "Set zoom" input to enter 1 and click Apply (or run `cgpv.api.getMapViewer('map1').setMapZoomLevel(1)` in console)               | Map zoom clamps to the configured min (6) — OL enforces the constraint | A    |

## Initial View — zoomAndCenter

| Test            | Description                        | Steps                  | Expected Result                                                                  | Auto |
| --------------- | ---------------------------------- | ---------------------- | -------------------------------------------------------------------------------- | ---- |
| Zoom and center | Map loads at specified zoom/center | 1. Check Map 3 on load | Map loads at zoom 7 centered on Ottawa `[-75.7, 45.4]` with 45° rotation applied | M    |

## Initial View — extent

> **Note:** OpenLayers' `fit()` adjusts the extent to match the viewport's aspect ratio. The configured extent may not fit perfectly in both dimensions — OL calculates a zoom level that contains the entire extent while maintaining the viewport's width/height ratio. The resulting view may be slightly wider or taller than the specified extent.

| Test           | Description                     | Steps                  | Expected Result                                                                                                 | Auto |
| -------------- | ------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------- | ---- |
| Initial extent | Map fits specified bounding box | 1. Check Map 4 on load | Map loads fitted to the bounding box `[-100, 40, -60, 60]` (may be slightly adjusted for viewport aspect ratio) | M    |

## Max Extent

| Test               | Description           | Steps                                                                                                | Expected Result                                                                     | Auto |
| ------------------ | --------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---- |
| Extended extent    | Larger than default   | 1. On Map 2, zoom out fully                                                                          | The map extent is larger than the default extent (world bounds minus some latitude) | M    |
| Max extent applied | Config extent used    | 1. On Map 2, compare the visible extent with the configured `maxExtent` value `[-180, -50, 180, 85]` | The configured max extent is applied, not the default                               | M    |
| Pan constrained    | Cannot pan beyond max | 1. On Map 2, pan the map in all directions                                                           | Cannot pan beyond the configured max extent boundaries                              | M    |

## Rotation & Home View

| Test                              | Description                        | Steps                                                                                                                                                        | Expected Result                                                                                     | Auto |
| --------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ---- |
| Initial rotation                  | Map loads rotated                  | 1. Check Map 3 on load                                                                                                                                       | Map loads with 45° rotation applied                                                                 | M    |
| Initial view on load              | Loads at initialView, not homeView | 1. Check Map 3 zoom level and center on load                                                                                                                 | Map is at zoom 7, centered on Ottawa — NOT at homeView (zoom 4, Canada)                             | A    |
| Home button navigates to homeView | Home differs from initial          | 1. On Map 3, click the Home button in the navbar                                                                                                             | Map navigates to homeView: zoom 4, centered on Canada `[-95, 60]` — different from the initial view | A    |
| setHomeView programmatic          | Runtime home view change           | 1. On Map 3, run in console: `cgpv.api.getMapViewer('map3').setHomeButtonView({ zoomAndCenter: [10, [-75, 45]] })`<br>2. Click the Home button in the navbar | Map navigates to the new home view: zoom 10, centered on `[-75, 45]` (not the original homeView)    | C    |

## Initial Click Coordinate

> **Known issue:** `initialClickCoordinate` does not trigger on initial load with GeoCore layers (race condition — layers not yet registered in featureInfoLayerSet when the query fires). Works on page refresh with saved state.

| Test                 | Description                | Steps                  | Expected Result                                                                                                            | Auto |
| -------------------- | -------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---- |
| Initial click marker | Marker and details on load | 1. Check Map 5 on load | Map loads with a click marker at the specified coordinate and the Details panel opens with query results for that location | M    |

## Rotation Disabled

| Test                   | Description              | Steps                                     | Expected Result                                          | Auto |
| ---------------------- | ------------------------ | ----------------------------------------- | -------------------------------------------------------- | ---- |
| enableRotation false   | Rotation control hidden  | 1. On Map 6, check navBar                 | Rotation button is not rendered even if listed in navBar | C    |
| Shift+Alt+drag blocked | Cannot rotate by gesture | 1. On Map 6, try Shift+Alt+drag to rotate | Map does not rotate                                      | M    |
