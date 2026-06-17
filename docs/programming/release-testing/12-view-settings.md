# 12 — View Settings

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.

Zoom constraints, extent overrides, initial view modes, home view, rotation, and initial click coordinate. The `viewSettings` config property controls the map's initial state (projection, zoom, center, extent, rotation) and constraints (min/max zoom, max extent).

## Restricted Zoom

Config: `configs/navigator/demos/04-restrict-zoom.json` (minZoom: 6, maxZoom: 8, projection: 3978)

| Test                    | Description            | Steps                                                                                            | Expected Result                                                        | Auto |
| ----------------------- | ---------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ---- |
| Min zoom enforced       | Cannot zoom below min  | 1. Try to zoom out below the configured min zoom (6) using scroll wheel or zoom button           | Map stops at zoom level 6 and does not zoom out further                | M    |
| Max zoom enforced       | Cannot zoom above max  | 1. Try to zoom in above the configured max zoom (8) using scroll wheel or zoom button            | Map stops at zoom level 8 and does not zoom in further                 | M    |
| Zoom API clamped to max | API respects max limit | 1. In browser console, run `cgpv.api.getMapViewer('map1').controllers.mapController.zoomMap(20)` | Map zoom clamps to the configured max (8) — OL enforces the constraint | A    |
| Zoom API clamped to min | API respects min limit | 1. In browser console, run `cgpv.api.getMapViewer('map1').controllers.mapController.zoomMap(1)`  | Map zoom clamps to the configured min (6) — OL enforces the constraint | A    |

## Initial View — layerIds

Config: `configs/navigator/demos/06-zoom-layer.json` (`initialView.layerIds` set to specific GeoJSON layer paths)

The `viewSettings.initialView` property determines the map's initial focus. Three modes are available: `layerIds`, `zoomAndCenter`, and `extent`.

| Test                             | Description                    | Steps                                                                       | Expected Result                                                                           | Auto |
| -------------------------------- | ------------------------------ | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---- |
| Zoom to specific layers          | Map fits layer extents on load | 1. Load the config                                                          | Map loads zoomed to the combined extent of the layers specified in `initialView.layerIds` | A    |
| Zoom to all layers (empty array) | Union of all layer extents     | 1. In config sandbox, set `initialView.layerIds: []` (empty array) and load | Map zooms to the union of all layer extents on load                                       | M    |

## Initial View — zoomAndCenter

Config: Use config sandbox to set `initialView.zoomAndCenter`

| Test            | Description                        | Steps                                                                          | Expected Result                                                                   | Auto |
| --------------- | ---------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ---- |
| Zoom and center | Map loads at specified zoom/center | 1. In config sandbox, set `initialView.zoomAndCenter: [4, [-75, 45]]` and load | Map loads at zoom level 4 centered on the given coordinates (approx. Ottawa area) | M    |

## Initial View — extent

Config: Use config sandbox to set `initialView.extent`

| Test           | Description                     | Steps                                                                        | Expected Result                                | Auto |
| -------------- | ------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------- | ---- |
| Initial extent | Map fits specified bounding box | 1. In config sandbox, set `initialView.extent: [-100, 40, -60, 60]` and load | Map loads fitted to the specified bounding box | M    |

## Max Extent

Config: `configs/navigator/demos/05-max-extent-override.json` (`maxExtent: [-180, -50, 180, 89]`, projection: 3857)

| Test               | Description           | Steps                                                                                      | Expected Result                                                                     | Auto |
| ------------------ | --------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | ---- |
| Extended extent    | Larger than default   | 1. Zoom out fully                                                                          | The map extent is larger than the default extent (world bounds minus some latitude) | M    |
| Max extent applied | Config extent used    | 1. Compare the visible extent with the configured `maxExtent` value `[-180, -50, 180, 89]` | The configured max extent is applied, not the default                               | M    |
| Pan constrained    | Cannot pan beyond max | 1. Pan the map in all directions                                                           | Cannot pan beyond the configured max extent boundaries                              | M    |

## Rotation & Home View

Config: `configs/navigator/demos/27-view-settings-rotation-home.json` (`initialView`: zoom 7 Ottawa `[-75.7, 45.4]`, `homeView`: zoom 4 Canada `[-95, 60]`, rotation: 45°, projection: 3857)

This config has separate `initialView` and `homeView`. By default Home equals the initial view, but `homeView` overrides it independently.

| Test                              | Description                        | Steps                                      | Expected Result                                                                                     | Auto |
| --------------------------------- | ---------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------- | ---- |
| Initial rotation                  | Map loads rotated                  | 1. Load the config                         | Map loads with 45° rotation applied                                                                 | M    |
| Initial view on load              | Loads at initialView, not homeView | 1. Check the zoom level and center on load | Map is at zoom 7, centered on Ottawa — NOT at homeView (zoom 4, Canada)                             | C    |
| Home button navigates to homeView | Home differs from initial          | 1. Click the Home button in the nav bar    | Map navigates to homeView: zoom 4, centered on Canada `[-95, 60]` — different from the initial view | C    |

## Initial Click Coordinate

Config: Use config sandbox to set `viewSettings.initialClickCoordinate` (no existing demo config uses this property)

| Test                 | Description                | Steps                                                                                        | Expected Result                                                                                                            | Auto |
| -------------------- | -------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---- |
| Initial click marker | Marker and details on load | 1. In config sandbox, add `initialClickCoordinate: [-75.7, 45.4]` to `viewSettings` and load | Map loads with a click marker at the specified coordinate and the Details panel opens with query results for that location | M    |
