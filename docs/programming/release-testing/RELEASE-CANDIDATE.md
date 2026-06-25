# Release Candidate — v2.3.0

> **Instructions:** This file tracks changes, fixes, and breaking changes discovered during the release cycle.
>
> - Append entries as you work — each AI session, branch review, or test run should add its findings here.
> - Use the sections below to categorize entries.
> - At release time, use this file to generate the final release notes, then clear it for the next cycle.
> - This file is the source of truth for "what changed since the last release" — the git log is too noisy.
> - **BranchReview agent** appends commit-based entries (bug fix, feature, breaking change) in Phase 6.
> - **TestCreator agent** appends test plan changes (tests added/moved/removed, HTML maps) in Phase 6.

---

## Breaking Changes — User-Facing (Schema / API)

_(Config properties, public API methods, event names — affects external consumers and plugin authors)_

### MapViewer — Removed Methods

| Method                                       | Replacement                                                             | PR    |
| -------------------------------------------- | ----------------------------------------------------------------------- | ----- |
| `getPluginAsync(pluginId)`                   | No replacement                                                          | #3544 |
| `getCenter()`                                | Use `cgpv.api.getMapViewer().getView().getCenter()`                     | #3544 |
| `getMapSize()`                               | Use `cgpv.api.getMapViewer().map.getSize()`                             | #3544 |
| `getCoordinateFromPixel(pointXY, timeoutMs)` | No replacement                                                          | #3544 |
| `setExtent(extent)`                          | Use `zoomToExtent(extent)`                                              | #3544 |
| `setMaxExtent(extent)`                       | No replacement                                                          | #3544 |
| `waitAllLayersStatus(layerStatus)`           | Use `cgpv.api.getMapViewer().layer.waitForAllLayersStatus(layerStatus)` | #3544 |
| `waitForLayersLoaded()`                      | Use `cgpv.api.getMapViewer().layer.waitForLayersLoaded()`               | #3544 |

### MapViewer — Signature Changes

| Method                                 | Change                                                          | PR    |
| -------------------------------------- | --------------------------------------------------------------- | ----- |
| `setMapZoomLevel(zoom)`                | No longer returns a Promise                                     | #3544 |
| `getNorthArrowAngle()`                 | Returns `number` instead of `string`                            | #3544 |
| `zoomToExtent(extent, options?)`       | New signature: `zoomToExtent(extent, useAnimation, options)`    | #3544 |
| `onMapZoomEnd` / `offMapZoomEnd`       | Renamed to `onMapResolutionChanged` / `offMapResolutionChanged` | #3544 |
| `onMapChangeSize` / `offMapChangeSize` | Renamed to `onMapSizeChanged` / `offMapSizeChanged`             | #3544 |

### LayerApi — Removed Methods

| Method              | Replacement    | PR    |
| ------------------- | -------------- | ----- |
| `getOLLayerAsync()` | No replacement | #3544 |

### LayerApi — Signature Changes

| Method                                      | Change                                                                   | PR    |
| ------------------------------------------- | ------------------------------------------------------------------------ | ----- |
| `zoomToLayerExtent(layerPath, fitOptions?)` | New signature: `zoomToLayerExtent(layerPath, useAnimation, fitOptions?)` | #3544 |

### Controller — Renames

| Old                                 | New                                   | PR    |
| ----------------------------------- | ------------------------------------- | ----- |
| `mapController.setClickCoordinates` | `mapController.performMapClickAction` | #3544 |

### Type Changes

| Item                           | Change                                              | PR    |
| ------------------------------ | --------------------------------------------------- | ----- |
| `degreeRotation`               | Type changed from `string` to `number`              | #3544 |
| `whenThisThen` default timeout | Changed from 10 seconds to `undefined` (no timeout) | #3544 |
| `emitLayerFilterApplied`       | Privatized — no longer accessible externally        | #3544 |

## Breaking Changes — Developer-Only (Internal)

_(Internal code patterns, MUI props, build tooling — does NOT affect external consumers)_

- MUI v7→v9: `inputProps` replaced by `slotProps.input` on Radio, TextField, Checkbox, Input, NativeSelect (#3545)
- MUI v7→v9: `PopperProps` replaced by `slotProps.popper` in MuiTooltip theme config (#3545)
- MUI v7→v9: Inline system props (padding, direction, fontSize, visibility) moved to `sx={{}}` (#3545)
- MUI v7→v9: 3 icon renames (`*Outline` → `*Outlined` suffix), Tabs `ScrollButtonComponent` removed (#3545)

## New Features

_(User-facing features added or enabled)_

- Release testing mechanism: HTML test pages with map navigation, config modals, localStorage progress tracking
- Release candidate tracking: RELEASE-CANDIDATE.md file for accumulating release notes during the cycle
- `zoomToExtent` and `zoomMap` now support instantaneous zooming without animation (#3544)
- New `api.onceMapViewerSet` event + `api.waitForMapViewer` promise for waiting until MapViewer is available (#3544)
- New `onceLayerStatusChanged` event in ConfigBaseClass — auto-unhooks after first trigger (#3544)
- New `EventHelper.onceEventPromise` helper for creating one-shot event listeners with filter support (#3544)
- `select` and `onSelect` functions moved from footer-plugin to abstract-plugin — app-bar plugins can now use them (#3544)
- New `ConfigValidation.isListOfLayerEntryConfigValidated` to prevent double-validation in `addGeoviewLayer()` (#3544)

## Bug Fixes

_(Fixes discovered or applied during this cycle)_

- Fixed group layers visible despite metadata setting `visible: false` (#3544)
- Fixed map waiting for ALL layers before zooming to `layerIds` extent — now zooms as soon as bounds are ready (#3544)
- Fixed custom time-slider `field` property applied to layers that don't have that field — now uses layer's own metadata date field as fallback (#3544)
- Fixed Swiper `process` environment variable causing failure when moving the slider (#3544)
- Fixed `onBasemapError` handler not being unhooked from MapViewer (persisting across lifecycle) (#3544)
- Fixed test suite buttons enabled before map ready — now disabled until map is initialized (#3544)
- Fixed malformed HTML handling in the KML data table path to prevent render crashes during cell content conversion (#3551)
- Fixed Add Layer wizard infinite spinner when selected layer type does not match the provided source/extension (#3550)
- Fixed group layers with all child layers in error state not being surfaced correctly as errored in layer status propagation (#3549)

## Build & Dependencies

_(Dependency updates, build config changes)_

- **MUI v7 → v9 upgrade**: @mui/material 7.3.2→9.1.2, @mui/icons-material 7.3.2→9.1.1, @mui/lab 7.0.0-beta.17→9.0.0-beta.5, @mui/system→9.1.2, @mui/x-date-pickers 7.20.0→9.7.0, @mui/x-tree-view 7.17.0→9.7.0, mui-color-input 7.0.0→9.0.0 (#3545)
- Removed 4 duplicate MUI packages from devDependencies (#3545)
- Webpack: Added `fullySpecified: false` for .mjs ESM resolution (#3545)

## Architecture & Performance

_(Optimizations, refactors, structural changes)_

- Decoupled 8 store setters (`setStoreMapDisplayed`, `setStoreMapInteraction`, `setStoreMapIsMouseInsideMap`, `setStoreMapLoaded`, `setStoreMapMoveEnd`, `setStoreMapPointerPosition`, `setStoreMapRotation`, `setStoreMapZoom`, `setStoreMapScale`) from MapViewer to map-controller — store updates now go through controller events (#3544)
- Created map move handlers in map-controller and layer-controller (#3544)
- Centralized map control logic in `mapController.#updateMapControls` (#3544)
- Added theme, displayDateMode, displayTimezone to UI Domain for controller-based store updates (#3544)
- Reviewed and replaced 30+ `onEvent/offEvent` patterns with new `onceEvent` pattern (#3544)
- Changed map click pattern for WCAG mode vs regular mode (#3544)
- Fixed time-slider-state action setters to be immutable and focused on individual layerPath values (#3544)

## Accessibility (WCAG)

_(WCAG fixes and improvements)_

- Fixed reflow issues (geolocator, legend, layers, details panels) at 400% zoom level (1280px viewport) (#3560)

## Documentation & Cleanup

_(Doc updates, demo cleanup, code organization)_

- Standardized 30+ component `memo` utilizations to use arrow function syntax (#3544)
- Categorized many TODOs for better organization (#3544)
- Branch review follow-up cleanup and hardening edits across data table and add-layer flows (6694b74ab, aee29d274)

## Test Plan Changes

_(Tests added, moved, removed, or reorganized)_

- New automated test case for group layer with `defaultVisibility: false` (#3544)

## Config Schema Changes

_(Properties added, renamed, or with changed defaults)_

## Updated Counts

| Metric        | Before | After |
| ------------- | ------ | ----- |
| Total tests   | —      | —     |
| Automated (A) | —      | —     |
| Candidate (C) | —      | —     |
| Manual (M)    | —      | —     |

## Notes for Release Notes Author

_(Anything the release note author should highlight)_
