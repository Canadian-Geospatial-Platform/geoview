# 20 — Edge Cases

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-20-edge-cases.html](../../packages/geoview-core/public/templates/release-testing/rt-20-edge-cases.html) — Links to referenced demo pages (outlier-metadata, circumpolar) and release testing pages.

Edge cases, metadata issues, outlier pages, overlays, sandbox, and responsive layout.

## Guide Panel Persistence

> Tested in [01 — Global](01-global.md#guide-access).

## Custom Legend with Error Layers

| Test                   | Description                       | Steps                                                                                                  | Expected Result                                  | Auto |
| ---------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------ | ---- |
| Group with error child | Toggle group with broken sublayer | 1. Load a group layer that has a sublayer in error (custom legend)<br>2. Toggle the group's visibility | No crash; valid sublayers still toggle correctly | M    |

## Metadata Edge Cases

Demo: `templates/tests/outlier-metadata.html`

| Test                         | Description                               | Steps                                                                        | Expected Result                                                               | Auto |
| ---------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---- |
| nameField = Date             | Layer name not confused with date parsing | 1. Load the layer with `nameField = Date`                                    | Layer name resolves correctly; feature info displays the Date field correctly | M    |
| Empty listOfLayerEntryConfig | Empty array handled gracefully            | 1. Load a GeoView layer config with `listOfLayerEntryConfig: []`             | No crash; handled gracefully                                                  | M    |
| WMS with space in layer ID   | Space in ID doesn't break loading         | 1. Load the WMS layer with a space in the ID (e.g., `nonna:NONNA 10`)        | Layer loads correctly                                                         | M    |
| WMS with slashes in layer ID | Slashes in ID don't break loading         | 1. Load the WMS layer with slashes in the ID (e.g., `photo/plot/with/slash`) | Layer loads correctly                                                         | M    |

## Summary & Out Fields

> Tested in [10 — Details](10-details.md#summary--out-fields).

## WCAG Accessibility

> Full WCAG and accessibility testing is in the dedicated [21 — WCAG Accessibility](21-wcag-accessibility.md) file.

## Circumpolar Config

Config: `configs/navigator/demos/22-circumpolar.json`

> North pole/arrow behavior tested in [02 — Map](02-map.md#north-pole--north-arrow) (EPSG:3573).

| Test                   | Description          | Steps                          | Expected Result                               | Auto |
| ---------------------- | -------------------- | ------------------------------ | --------------------------------------------- | ---- |
| Circumpolar projection | Renders in EPSG:3573 | 1. Load the circumpolar config | Map renders correctly in EPSG:3573 projection | M    |

## Error Layer Reload

| Test           | Description           | Steps                                                                              | Expected Result                                | Auto |
| -------------- | --------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------- | ---- |
| Reload bad URL | Reload stays in error | 1. Load a layer with a bad URL<br>2. After it shows as error, attempt to reload it | Stays in error state (no crash, no duplicates) | M    |
| Reload bad ID  | Reload stays in error | 1. Load a layer with a bad layer ID<br>2. After error, attempt reload              | Same error state (no crash)                    | M    |

## Two-Map Page

> Shortcut targeting tested in [01 — Global](01-global.md#two-map-shortcuts).

| Test              | Description                  | Steps                                                                                      | Expected Result                              | Auto |
| ----------------- | ---------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------- | ---- |
| Independent state | Maps maintain separate state | 1. Load a two-map page<br>2. Change zoom, projection, and layers independently on each map | Each map maintains its own independent state | M    |

## Outlier Test Pages

Spot-check the outlier test pages for regressions.

| Test                             | Description                  | Steps                                      | Expected Result                                                     | Auto |
| -------------------------------- | ---------------------------- | ------------------------------------------ | ------------------------------------------------------------------- | ---- |
| outliers.html                    | General outlier page         | 1. Load `outliers.html`                    | No crashes                                                          | M    |
| outlier-style.html               | Style edge cases             | 1. Load `outlier-style.html`               | Style edge cases render correctly                                   | M    |
| outlier-performance.html         | Performance stress test      | 1. Load `outlier-performance.html`         | No excessive lag or memory issues                                   | M    |
| outlier-many-groups.html         | Deeply nested groups         | 1. Load `outlier-many-groups.html`         | Deeply nested groups render correctly                               | M    |
| outlier-geometry.html            | Geometry edge cases          | 1. Load `outlier-geometry.html`            | Geometry edge cases render correctly                                | M    |
| outlier-elections-2019.html      | Election data                | 1. Load `outlier-elections-2019.html`      | Election data renders without errors                                | M    |
| outlier-ESRI-maxRecordCount.html | High record count pagination | 1. Load `outlier-ESRI-maxRecordCount.html` | Layers with high record counts load correctly (pagination/chunking) | M    |
| outlier-GeoAI.html               | GeoAI layer                  | 1. Load `outlier-GeoAI.html`               | GeoAI layer renders without errors                                  | M    |

## Overlay Objects

Config property: `map.overlayObjects.pointMarkers` — non-interactive markers on the map.

| Test                 | Description                         | Steps                                                | Expected Result                                       | Auto |
| -------------------- | ----------------------------------- | ---------------------------------------------------- | ----------------------------------------------------- | ---- |
| Markers render       | Point markers appear at coordinates | 1. Load a config with `overlayObjects` point markers | Colored dots appear at the configured coordinates     | M    |
| Non-interactive      | Clicking marker doesn't query       | 1. Click on an overlay marker                        | Does NOT trigger a feature query in the Details panel | M    |
| Custom color/opacity | Markers use configured style        | 1. Check the overlay markers visually                | Markers use their configured color and opacity        | M    |

## Config Sandbox

Page: `/config-sandbox.html`

| Test                  | Description            | Steps                                                                         | Expected Result                       | Auto |
| --------------------- | ---------------------- | ----------------------------------------------------------------------------- | ------------------------------------- | ---- |
| Edit and reload       | Config changes apply   | 1. Edit the JSON in the textarea (e.g., change projection)<br>2. Click Reload | Map reinitializes with the new config | M    |
| Invalid JSON          | Error shown gracefully | 1. Enter invalid JSON (syntax error)<br>2. Click Reload                       | Error is shown; viewer doesn't crash  | M    |
| Add layer via sandbox | New layer appears      | 1. Add a new layer entry in the JSON<br>2. Click Reload                       | New layer appears on the map          | M    |

## Mobile / Responsive Layout

| Test                 | Description                          | Steps                                                             | Expected Result                                              | Auto |
| -------------------- | ------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------ | ---- |
| Tabs become dropdown | Footer bar collapses at mobile width | 1. Resize the browser below 600px width (or use mobile emulation) | Footer bar tabs collapse into a dropdown/selector            | M    |
| Export button hidden | Export hidden at mobile breakpoint   | 1. Resize below `md` breakpoint (~960px)                          | Export button is hidden                                      | M    |
| Panels usable        | Panels work at mobile width          | 1. Open panels at mobile width                                    | Content is scrollable and interactive elements are reachable | M    |
