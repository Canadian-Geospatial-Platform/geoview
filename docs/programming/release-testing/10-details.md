# 10 — Details Panel

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-10-details.html](../../packages/geoview-core/public/templates/release-testing/rt-10-details.html) — Map 1 (multiple queryable layers, details in app bar, clear highlights button).

Details panel queries, feature highlighting, lightbox, coordinate info, and hover tooltips. The Details panel shows query results when the user clicks on the map, with feature navigation, highlighting, and coordinate display (lat/lon, UTM, NTS, elevation).

## Basic Queries

Config: `configs/navigator/layers/all-layers.json` (multiple queryable layer types)

| Test              | Description           | Steps                                                                                          | Expected Result                                                                                        | Auto |
| ----------------- | --------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---- |
| Click query       | Feature info shown    | 1. Click on a feature on the map                                                               | Details panel opens and shows feature info (field/value table)                                         | M    |
| Coordinate info   | Coordinates displayed | 1. Click on a location on the map<br>2. Check the coordinate info section in the details panel | Latitude/Longitude, UTM Zone/Easting/Northing, and NTS Mapsheet are displayed for the clicked location | M    |
| Multiple features | All features listed   | 1. Click on an area with overlapping features from multiple layers                             | All features from all queryable layers are listed in the details panel                                 | M    |

## Layer Query Status

Config: `configs/navigator/layers/all-layers.json`

| Test              | Description                     | Steps                                                       | Expected Result                                                      | Auto |
| ----------------- | ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------- | ---- |
| Query in progress | Status indicator while querying | 1. Click on the map<br>2. Watch the layer list during query | Status indicator shows querying state while layers are being queried | M    |
| Query complete    | Status updates after query      | 1. Wait for the query to complete                           | Status updates to show results or "no results"                       | M    |

## Highlighting

Config: `configs/navigator/layers/all-layers.json`

| Test                       | Description                     | Steps                                                                                  | Expected Result                                 | Auto |
| -------------------------- | ------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------- | ---- |
| Selected feature highlight | Feature highlighted on map      | 1. Click on a feature<br>2. Check the feature in the details panel                     | Selected feature is highlighted on the map      | M    |
| Check multiple features    | Additional features highlighted | 1. Query an area with multiple features<br>2. Check additional features in the results | Checked features are highlighted on the map     | M    |
| Clear highlights           | All highlights removed          | 1. Click the Clear Highlight button                                                    | All feature highlights are removed from the map | C    |

## Active Layer Selection

Config: `configs/navigator/layers/all-layers.json` (multiple layers that overlap geographically)

| Test                        | Description                  | Steps                                                                                                   | Expected Result                                                                                 | Auto |
| --------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---- |
| Reselect last active layer  | Remembers previous selection | 1. Query features, select a layer that is NOT the first in the list<br>2. Query again at a new location | The previously active layer is reselected (not the first) if it has features in the new results | M    |
| Fallback to first available | Falls back when no features  | 1. Query features, select a layer<br>2. Query at a location where that layer has no features            | The first available layer with features is selected instead                                     | M    |

## Lightbox Images

Config: `configs/navigator/layers/all-layers.json` (Historical Flood esriFeature layer has animated GIF data)

| Test            | Description              | Steps                                                                                   | Expected Result                                                  | Auto |
| --------------- | ------------------------ | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---- |
| Animated GIF    | Lightbox plays animation | 1. Query the Historical Flood layer<br>2. Click on a feature that has an animated GIF   | Lightbox opens and the animation plays                           | M    |
| Multiple images | Navigate between images  | 1. Query a layer with features containing multiple image URLs<br>2. Click on the images | Lightbox allows navigating between images (previous/next arrows) | M    |

## Hover Tooltip

> Toggle hoverable/queryable from settings panel tested in [08 — Layers](08-layers.md#hoverable--queryable).

Config: `configs/navigator/layers/all-layers.json` (vector and raster layers)

Config (hover disabled): `configs/navigator/demos/23b-initial-settings-states-controls.json` (layers with `hoverable: false`)

| Test                          | Description     | Steps                                                                                                             | Expected Result                           | Auto |
| ----------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ---- |
| Hover on vector feature       | Tooltip appears | 1. Hover over a vector feature (GeoJSON, CSV, Esri Feature, WFS, OGC Feature)                                     | A tooltip appears with basic feature info | M    |
| Hover on Esri Dynamic feature | Tooltip appears | 1. Hover over an Esri Dynamic layer feature                                                                       | A tooltip appears with feature info       | M    |
| Hover on WMS feature          | Tooltip appears | 1. Hover over a WMS layer feature                                                                                 | A tooltip appears with feature info       | M    |
| Hover disabled                | No tooltip      | 1. Load `23b-initial-settings-states-controls.json`<br>2. Hover over a feature on a layer with `hoverable: false` | No tooltip appears on hover               | M    |

## Non-Queryable Layer

Config: `configs/navigator/demos/23b-initial-settings-states-controls.json` (layers with `queryable: false`)

| Test           | Description                  | Steps                                                                           | Expected Result                                             | Auto |
| -------------- | ---------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---- |
| Not in details | Features excluded from query | 1. Load the config<br>2. Click on features from a layer with `queryable: false` | Features from that layer do not appear in the Details panel | A    |

## Feature Navigation

Config: `configs/navigator/layers/all-layers.json` (layers with multiple features in close proximity)

| Test                      | Description                  | Steps                                                            | Expected Result                                                              | Auto |
| ------------------------- | ---------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---- |
| Prev/Next arrows          | Navigation arrows appear     | 1. Query an area with multiple features on the same layer        | Prev/Next arrows appear to navigate between features                         | M    |
| Navigate between features | Highlight and details change | 1. Click next/prev arrows                                        | Highlighted feature changes on the map and details update to the new feature | M    |
| Zoom to feature           | Map zooms to feature extent  | 1. Click the zoom-to-feature button on a specific feature result | Map zooms to that feature's extent                                           | C    |

## Summary & Out Fields

Config: `configs/navigator/demos/29-summary-outfields.json` (multiple layer types with `summary: false` on specific fields — e.g., U2 esriFeature hides City/Date, NRCan esriDynamic hides Commodity Group/Longitude/Latitude)

| Test                      | Description                     | Steps                                                                                              | Expected Result                                                                                    | Auto |
| ------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---- |
| Summary flag hides fields | Fields hidden from summary      | 1. Load the summary/outfields config<br>2. Click on a feature<br>3. Check the details summary view | Fields with `summary: false` are hidden from the summary view (but available on expand/drill-down) | M    |
| OutFields limit           | Only configured fields returned | 1. Check the query results for a layer with `outfields` configured                                 | Only the configured outfields are returned in the query results                                    | M    |
| nameField as label        | Correct display label           | 1. Check the feature display label in the results list                                             | The configured `nameField` is used as the feature display label                                    | C    |

## Details with Swiper

> Tested in [17c — Swiper](17c-package-swiper.md#swiper--details-interaction).
