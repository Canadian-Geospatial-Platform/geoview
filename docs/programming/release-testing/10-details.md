# 10 — Details Panel

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-10-details.html](https://canadian-geospatial-platform.github.io/geoview/public/rt-10-details.html) — Map 1 (multiple queryable layers, details in app bar, clear highlights button), Map 2 (summary/outfields config).
>
> **Navigator configs** (for edge-case tests): `layers/all-layers.json`, `demos/23b-initial-settings-states-controls.json`, `demos/29-summary-outfields.json`

Details panel queries, feature highlighting, lightbox, coordinate info, and hover tooltips. The Details panel shows query results when the user clicks on the map, with feature navigation, highlighting, and coordinate display (lat/lon, UTM, NTS, elevation).

## Basic Queries

| Test              | Description           | Steps                                                                                         | Expected Result                                                                                        | Auto |
| ----------------- | --------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---- |
| Click query       | Feature info shown    | 1. On Map 1, click on a feature on the map                                                    | Details panel opens and shows feature info (field/value table)                                         | M    |
| Coordinate info   | Coordinates displayed | 1. On Map 1, click on a location<br>2. Check the coordinate info section in the details panel | Latitude/Longitude, UTM Zone/Easting/Northing, and NTS Mapsheet are displayed for the clicked location | M    |
| Multiple features | All features listed   | 1. On Map 1, click on an area with overlapping features from multiple layers                  | All features from all queryable layers are listed in the details panel                                 | M    |

## Layer Query Status

| Test              | Description                     | Steps                                                                 | Expected Result                                                      | Auto |
| ----------------- | ------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------- | ---- |
| Query in progress | Status indicator while querying | 1. On Map 1, click on the map<br>2. Watch the layer list during query | Status indicator shows querying state while layers are being queried | M    |
| Query complete    | Status updates after query      | 1. On Map 1, wait for the query to complete                           | Status updates to show results or "no results"                       | M    |

## Highlighting

| Test                       | Description                     | Steps                                                                                        | Expected Result                                 | Auto |
| -------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------- | ---- |
| Selected feature highlight | Feature highlighted on map      | 1. On Map 1, click on a feature<br>2. Check the feature in the details panel                 | Selected feature is highlighted on the map      | M    |
| Check multiple features    | Additional features highlighted | 1. On Map 1, query an area with multiple features<br>2. Check additional features in results | Checked features are highlighted on the map     | M    |
| Clear highlights           | All highlights removed          | 1. On Map 1, click the Clear Highlight button                                                | All feature highlights are removed from the map | C    |

## Active Layer Selection

| Test                        | Description                  | Steps                                                                                                             | Expected Result                                                                                 | Auto |
| --------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---- |
| Reselect last active layer  | Remembers previous selection | 1. On Map 1, query features, select a layer that is NOT the first in the list<br>2. Query again at a new location | The previously active layer is reselected (not the first) if it has features in the new results | M    |
| Fallback to first available | Falls back when no features  | 1. On Map 1, query features, select a layer<br>2. Query at a location where that layer has no features            | The first available layer with features is selected instead                                     | M    |

## Lightbox Images

| Test            | Description              | Steps                                                                                             | Expected Result                                                  | Auto |
| --------------- | ------------------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---- |
| Animated GIF    | Lightbox plays animation | 1. On Map 1, query a layer with animated GIF data<br>2. Click on a feature with an animated GIF   | Lightbox opens and the animation plays                           | M    |
| Multiple images | Navigate between images  | 1. On Map 1, query a layer with features containing multiple image URLs<br>2. Click on the images | Lightbox allows navigating between images (previous/next arrows) | M    |

## Hover Tooltip

> Toggle hoverable/queryable from settings panel tested in [08 — Layers](08-layers.md#hoverable--queryable).

| Test                          | Description     | Steps                                                                           | Expected Result                           | Auto |
| ----------------------------- | --------------- | ------------------------------------------------------------------------------- | ----------------------------------------- | ---- |
| Hover on vector feature       | Tooltip appears | 1. On Map 1, hover over a vector feature (ESRI Feature or GeoCore vector layer) | A tooltip appears with basic feature info | M    |
| Hover on Esri Dynamic feature | Tooltip appears | 1. On Map 1, hover over an Esri Dynamic layer feature                           | A tooltip appears with feature info       | M    |
| Hover on WMS feature          | Tooltip appears | 1. On Map 1, hover over a WMS layer feature                                     | A tooltip appears with feature info       | M    |
| Hover disabled                | No tooltip      | 1. On Map 1, if a layer has `hoverable: false`, hover over its features         | No tooltip appears on hover               | M    |

## Non-Queryable Layer

| Test           | Description                  | Steps                                                                 | Expected Result                                             | Auto |
| -------------- | ---------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------- | ---- |
| Not in details | Features excluded from query | 1. On Map 1, if a layer has `queryable: false`, click on its features | Features from that layer do not appear in the Details panel | A    |

## Feature Navigation

| Test                      | Description                  | Steps                                                                      | Expected Result                                                              | Auto |
| ------------------------- | ---------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---- |
| Prev/Next arrows          | Navigation arrows appear     | 1. On Map 1, query an area with multiple features on the same layer        | Prev/Next arrows appear to navigate between features                         | M    |
| Navigate between features | Highlight and details change | 1. On Map 1, click next/prev arrows                                        | Highlighted feature changes on the map and details update to the new feature | M    |
| Zoom to feature           | Map zooms to feature extent  | 1. On Map 1, click the zoom-to-feature button on a specific feature result | Map zooms to that feature's extent                                           | C    |

## Summary & Out Fields

| Test                      | Description                     | Steps                                                                        | Expected Result                                                                                    | Auto |
| ------------------------- | ------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---- |
| Summary flag hides fields | Fields hidden from summary      | 1. On Map 2, click on a feature<br>2. Check the details summary view         | Fields with `summary: false` are hidden from the summary view (but available on expand/drill-down) | M    |
| OutFields limit           | Only configured fields returned | 1. On Map 2, check the query results for a layer with `outfields` configured | Only the configured outfields are returned in the query results                                    | M    |
| nameField as label        | Correct display label           | 1. On Map 2, check the feature display label in the results list             | The configured `nameField` is used as the feature display label                                    | C    |

## Details with Swiper

> Tested in [17c — Swiper](17c-package-swiper.md#swiper--details-interaction).
