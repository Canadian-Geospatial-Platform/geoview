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

| Method                                 | Change                                                                 | PR    |
| -------------------------------------- | ---------------------------------------------------------------------- | ----- |
| `setMapZoomLevel(zoom)`                | No longer returns a Promise                                            | #3544 |
| `getNorthArrowAngle()`                 | Returns `number` instead of `string`                                   | #3544 |
| `getScaleInfoFromDomElement(mapId)`    | Changed from static to instance method: `getScaleInfoFromDomElement()` | #3580 |
| `zoomToExtent(extent, options?)`       | New signature: `zoomToExtent(extent, useAnimation, options)`           | #3544 |
| `onMapZoomEnd` / `offMapZoomEnd`       | Renamed to `onMapResolutionChanged` / `offMapResolutionChanged`        | #3544 |
| `onMapChangeSize` / `offMapChangeSize` | Renamed to `onMapSizeChanged` / `offMapSizeChanged`                    | #3544 |

### MapViewer — New Methods

| Method                | Description                                                    | PR    |
| --------------------- | -------------------------------------------------------------- | ----- |
| `updateViewPadding()` | Updates OL View padding to account for the map-info bar height | #3562 |

### LayerApi — Removed / Deprecated Methods

| Method              | Status     | Replacement                                     | PR    |
| ------------------- | ---------- | ----------------------------------------------- | ----- |
| `getOLLayerAsync()` | Deprecated | Use GV layer types instead of OL types directly | #3562 |

### LayerApi — Signature Changes

| Method                                      | Change                                                                                | PR    |
| ------------------------------------------- | ------------------------------------------------------------------------------------- | ----- |
| `zoomToLayerExtent(layerPath, fitOptions?)` | New signature: `zoomToLayerExtent(layerPath, useAnimation, fitOptions?)`              | #3544 |
| `waitForLayerRegistered(layerPath)`         | New signature: `waitForLayerRegistered(layerPath, timeout?)` — added optional timeout | #3562 |
| `waitForAllLayersStatus(layerStatus)`       | Now `async` (was returning a raw promise chain)                                       | #3562 |

### Controller — Renames

| Old                                 | New                                   | PR    |
| ----------------------------------- | ------------------------------------- | ----- |
| `mapController.setClickCoordinates` | `mapController.performMapClickAction` | #3544 |

### Type Changes

| Item                                                                       | Change                                                                                                      | PR    |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----- |
| `degreeRotation`                                                           | Type changed from `string` to `number`                                                                      | #3544 |
| `whenThisThen` default timeout                                             | Changed from 10 seconds to `undefined` (no timeout)                                                         | #3544 |
| `emitLayerFilterApplied`                                                   | Privatized — no longer accessible externally                                                                | #3544 |
| `createGeoviewLayerConfig` / `processGeoviewLayerConfig`                   | All layer types now accept `TypeLayerEntryShell[]` instead of `layerIds[]`, giving callers more flexibility | #3562 |
| `ConfigApi.processLayerFromType`                                           | Parameter renamed from `layerIds` to `layerEntries` (`TypeLayerEntryShell[]`)                               | #3562 |
| `onceEventPromise`                                                         | Now accepts an optional `timeout` parameter (replaces short-lived `onceEventPromiseWithTimeout`)            | #3562 |
| `CallbackNewMetadataDelegate`                                              | Removed — replaced by `FetchWithProxyResult<T>` return wrapper in `GeoUtilities`                            | #3562 |
| `GeoUtilities.fetchWMSMetadata` / `fetchWFSMetadata` / `fetchWMTSMetadata` | Now return `FetchWithProxyResult<T>` instead of raw data + callback                                         | #3562 |
| `OVERVIEW_MAP_MIN_CONTAINER_WIDTH`                                         | Changed from `900` to `700` px                                                                              | #3562 |

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
- Map configuration `map.interaction` is no longer mandatory in schema; when omitted, runtime defaults to `dynamic` (#3584)
- New `waitForLayerConfigRegistered` in layer-domain and enhanced `waitForLayerRegistered` with optional timeout (#3562)
- New `getRendererContainer` function on `AbstractBaseGVLayer` (#3562)
- New `waitForDomElement`, `waitForDomContent`, and `waitForDomChange` test utilities for explicit React UI tracking (#3562)
- Map view now uses `viewOptions.padding` to account for the map-info bar height (#3562)
- New `MapViewer.updateViewPadding()` and `mapController.updateViewPadding()` for dynamic map-info bar padding (#3562)
- New `waitForLayerQueryToFinish` timeout parameter on `AllFeatureInfoLayerSet` (#3562)

## Bug Fixes

_(Fixes discovered or applied during this cycle)_

- Fixed WMS layer querying through WFS to also consider filtering when layer has style but feature is not symbolized (Cities query) without breaking behavior when no symbologies could be read for WFS (Major Projects query) (#3555)
- Improved projection information reading from metadata for all layer types — now stored in store for layer-info panel (#3555)
- Greatly improved `Projection` class flexibility in function parameters and stability (#3555)
- Fixed layer min/max scale inherited from parent: layer still turns visible/invisible at those scales, so zoomToVisibleScale button is now shown (#3555)
- Added stability for badly formatted date values like `'Null'` as a string in data reading (#3555)
- Added stability in data-table component for undefined dates in a `'date'` field (#3555)
- Simplified zoom-to-visible-scale check and function, adding precision for services like Illinois Water Network (#3555)
- Clamping zoom-to-extent for a particular layer to its min/max scale visible range when any (#3555)
- Fixed group layers visible despite metadata setting `visible: false` (#3544)
- Fixed map waiting for ALL layers before zooming to `layerIds` extent — now zooms as soon as bounds are ready (#3544)
- Fixed custom time-slider `field` property applied to layers that don't have that field — now uses layer's own metadata date field as fallback (#3544)
- Fixed Swiper `process` environment variable causing failure when moving the slider (#3544)
- Fixed `onBasemapError` handler not being unhooked from MapViewer (persisting across lifecycle) (#3544)
- Fixed test suite buttons enabled before map ready — now disabled until map is initialized (#3544)
- Fixed malformed HTML handling in the KML data table path to prevent render crashes during cell content conversion (#3551)
- Fixed Add Layer wizard infinite spinner when selected layer type does not match the provided source/extension (#3550)
- Fixed group layers with all child layers in error state not being surfaced correctly as errored in layer status propagation (#3549)
- Fixed GeoCore custom config precedence so inline `listOfLayerEntryConfig` overrides are applied ahead of GCS custom configs, while legacy GCS `layers` payloads are still adapted for backward compatibility (#3548)
- Added proxy configuration resolution for WFS/WMTS/EsriFeature/EsriDynamic/OGCFeatureAPI paired-proxy usage in anticipation of new proxy (#3564)
- Fixed OGC URL validation and probing by splitting generic URL checks from OGC-specific GetCapabilities validation paths (#3564)
- Fixed tile-load status handling to avoid false error states for partially reachable services while still surfacing fully broken tile services (#3564)
- Fixed app bar layout/CSS regressions with targeted cleanup and alignment updates (#3585)
- Fixed `zoomToExtent` completion behavior so same-extent zoom operations still resolve reliably (#3580)
- Fixed WMTS metadata handling and style typing (including `LegendURL`) to prevent metadata parsing issues (#3580)
- Fixed WFS feature query handling to support additional response formats beyond `application/json` and blank defaults (#3580)
- Fixed scale control accessibility labeling by correcting the aria-label translation key wiring for map info scale output (#3581)
- Fixed overview-map visible on load when `hideOnZoom` threshold should hide it (e.g., outlier-elections-2019.html) (#3562)
- Fixed Swiper layer opacity handling by rewriting clip logic for features based on slider position (#3562)
- Fixed abort controller in add-new-layer component when clicking 'back' then completing steps to add a layer (#3562)
- Fixed WMS CRS override when layers are behind a proxy — was re-encoding the entire string instead of only adjusting CRS and BBOX properties (#3562)
- Fixed zoom-to-feature-geometry working even when the geometry field is not included in the outFields configuration (#3562)
- Fixed initial extent being slightly off vertically vs the home view extent, causing the home view button to shift the map (#3562)
- Fixed CESI layer in outlier-style.html template to point to a valid layer id (#3562)
- Fixed Permafrost by Ecoprovince in outlier-metadata template to point to a valid layer URL (#3562)
- Fixed broken layer in performance.json template demo (#3562)
- Fixed creationDate field type in metadata (#3562)
- Added precision slack on zoom-to-extent to compensate for minor floating-point precision issues (#3562)

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
- Improved zoom-to-extent implementation by centralizing fit-option handling (including percent-based padding + map-info bar compensation) for more consistent map framing behavior (#3580)
- Refactored data-table keyboard focus tracking into a dedicated focus-store utility and removed per-cell overhead that caused navigation lag (#3574)
- Refactored overview-map visibility and sizing flow into centralized store-driven logic (`overviewMapVisible`) with unified controller/event handling and atomic selector usage (#3581)
- Optimized proxy support with a second pass using `FetchWithProxyResult` return wrapper instead of `CallbackNewMetadataDelegate` callbacks (#3562)
- Simplified `processGeoviewLayerConfig` and `createGeoviewLayerConfig` in all layer types to accept `TypeLayerEntryShell[]` instead of `layerIds[]` (#3562)
- Consolidated `onceEventPromiseWithTimeout` into `onceEventPromise` with an optional timeout parameter (#3562)
- Deprecated `getOLLayerAsync` from layer-controller to centralize code logic around GV types instead of OL types (#3562)
- Improved Swiper component implementation with enhanced lifecycle functions and code cleanup (~221 lines changed) (#3562)
- Lowered min width threshold to show the overview-map from 900px to 700px (#3562)
- Map-info bar height now managed via OL View padding instead of manual fit-option compensation (#3562)
- `ConfigApi.fetchStyleFromWMS` now uses `FetchWithProxyResult` internally (#3562)
- New `onceEventPromise` timeout parameter for creating one-shot event listeners that auto-reject after a deadline (#3562)
- New `RUN_DEBUG_ONLY` flag in test-suite package for isolating individual test execution during development (#3562)
- Enforced type safety in style files: replaced `theme: any` with `theme: Theme`, replaced return type `: any` with `: SxStyles`, removed `@typescript-eslint/no-explicit-any` suppressions across all packages (geoview-core, about-panel, aoi-panel, custom-legend, filter-panel, stac-browser, swiper, time-slider)

## Accessibility (WCAG)

_(WCAG fixes and improvements)_

- Fixed reflow issues (geolocator, legend, layers, details panels) at 400% zoom level (1280px viewport) (#3560)
- Fixed app bar reflow by restructuring app-bar controls into a single list and adding overflow navigation arrows at high zoom / low-height viewports (#3579)
- Fixed data-table WCAG issues: keyboard focus flow, empty spacer-cell accessibility semantics, and cell scroll-into-view behavior (#3574)
- Added global long-word wrapping and centralized text-ellipsis patterns to reduce clipping/truncation issues in high-zoom/reflow scenarios (#3574)
- Fixed nav bar reflow at high zoom and constrained viewport sizes with scrollable overflow behavior, improved expand/collapse affordance, and map-info overlap fixes (#3581)
- Fixed map info bar reflow with horizontal overflow handling and improved expand/collapse state management for constrained layouts (#3581)
- Improved responsive popper behavior for version, attribution, notifications, and nav bar panel components with enhanced focus management and keyboard handling (#3558)
- Fixed guide anchor links with unique ID prefixes to prevent duplicate anchor conflicts, enabling proper scroll navigation within guide sections (#3524)
- Updated footer bar interaction to use declarative React pattern for tab selection (#3418)
- Fixed details panel scrolling issue when navigating between features with prev/next buttons — focus now stays on the button without viewport scroll (#3567)
- Fixed critical WCAG bug where entering fullscreen mode deactivated WCAG mode due to zero-movement mousemove events during browser resize animation — now only real mouse movement (movementX/Y !== 0) exits WCAG mode (#3591)
- Improved legend panel styling: moved inline CSS to legend-styles, added spacing between subtitle and icon buttons, improved button divider spacing, added ARIA to layer icon groups
- Fixed export panel reflow issues: removed breakpoint hiding export icon button in appBar, updated layout for usability at smaller viewports and 400% zoom level (#3594)
- Fixed time-slider reflow issues: panel header "time filtering" label now wraps for legibility at high zoom, simplified CSS consolidation (#3595)
- Updated A11Y documentation: documented ESC key behavior in fullscreen mode and focus trap behavior when multiple panels auto-open simultaneously (#3490)
- Improved about panel styling: replaced hard-coded values with theme tokens, consolidated CSS into about-panel-style.ts (#3477)

## Documentation & Cleanup

_(Doc updates, demo cleanup, code organization)_

- Standardized 30+ component `memo` utilizations to use arrow function syntax (#3544)
- Categorized many TODOs for better organization (#3544)
- Branch review follow-up cleanup and hardening edits across data table and add-layer flows (6694b74ab, aee29d274)
- Updated copilot-instructions.md: store region organization rule (getter-then-hook pairs), zoomToExtent/promiseQueryBatched patterns, no-guess/no-remove-assertion rules
- Updated TestCreator agent: store region rule, zoomToExtent no-await rule, DOM fallback for UI state verification, no-guess field names constraint
- Updated 27-automation-candidates.md: marked data table tests #83-92 as Done, added filter-by-extent and showUnsymbolizedFeatures tests
- Fixed broken test page links in tests.html navigation
- Updated dependency documentation (release-testing docs)
- Added missing proxy configurations in templates (#3562)
- Improved add-new-layer component to resolve ESLint warning about `react/no-unstable-nested-components` (#3562)
- Clearer static-image-errors.json template (#3562)
- Improved HTML descriptions of all test suites (#3562)

## Test Plan Changes

_(Tests added, moved, removed, or reorganized)_

- New automated test case for group layer with `defaultVisibility: false` (#3544)
- New `suite-data-table` test suite (13 tests): allFeaturesDataArray populated, row count, geoviewID hidden, mapFilteredRecord, global filter + DOM disabled check, column filters set/clear, tableFilters on apply, column visibility toggle, rowsFilteredRecord, filter-by-extent absent for esriDynamic, filter-by-extent on GeoJSON, showUnsymbolizedFeatures pre-filter
- New `suite-details` tests (6 total): details panel query, clear all highlights, zoom to feature, nameField as label, summary false hides field, field alias renames field
- Added `getStoreDataTableLayerSettings` getter to `data-table-state.ts` (moved paired hook from OTHERS region to main region)
- Added `getStoreMapClickMarker` and `getStoreMapNorthArrow` getters to `map-state.ts` (moved from OTHERS to main region)
- Map 11 test page added for `suite-data-table` (GeoJSON + Commemorative Map + Esri Dynamic + Permafrost layers)
- Updated test-catalog.md: total 196 tests, 00-automated-suite.md: ~200, README: 901 (60/169/672)
- Added WMTS, VectorTiles, and XYZTiles layer types to automated functional testing (#3562)
- Moved `testAddGeocoreWithGroupDefaultVisibilityFalse` to end of suite to reduce resource contention with other tests (#3562)
- Fixed automated tests for new `viewSettings` padding behavior (#3562)
- Massive improvements and cleanup to data-table-tester: replaced many `delay` calls with explicit `waitForDomElement`/`waitForDomContent`/`waitForDomChange` utilities (#3562)
- Cleanup in layer test-suite (#3562)
- Improvements to details panel and highlights tests with explicit React render waiting (#3562)
- Fixed test-suite rendering for maps in hidden tabs to prevent odd behavior when running all tests concurrently (#3562)
- Updated test for JSON behind CORS (URL blocked by NRCan) (#3562)
- Configured new proxy in test-suite for upcoming proxy features (#3562)
- New `RUN_DEBUG_ONLY` flag for isolating test execution during development (#3562)

## Config Schema Changes

_(Properties added, renamed, or with changed defaults)_

## Updated Counts

| Metric        | Before | After |
| ------------- | ------ | ----- |
| Total tests   | 900    | 901   |
| Automated (A) | 59     | 60    |
| Candidate (C) | 169    | 169   |
| Manual (M)    | 672    | 672   |

## Notes for Release Notes Author

_(Anything the release note author should highlight)_
