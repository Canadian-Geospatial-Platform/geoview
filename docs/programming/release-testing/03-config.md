# 03 — Config Validation

Config parsing, duplicate handling, and error layer behavior.

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-03-config.html](https://canadian-geospatial-platform.github.io/geoview/public/rt-03-config.html) — Map 1 (duplicate UUIDs), Map 2 (error layers: wrong type + bad URL + bad sublayer ID with partial loading), Map 3 (defaults — omits UI), Map 4 (empty arrays, no navBar)

## Duplicate UUIDs

UI
Config: `configs/navigator/layers/geocore-duplicates.json`

| Test                   | Description                       | Steps                                                                                                                               | Expected Result                                                                                                                       | Auto |
| ---------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Duplicate geocore UUID | Same UUID appears twice in config | 1. On Map 1, both layers load                                                                                                       | Both layers appear in legend; `orderedLayers` has `:suffix` on duplicate; non-geocore duplicate type only appears once (filtered out) | C    |
| Layer paths are unique | No duplicate paths in store       | 1. On Map 1, click "Show Layer Paths" (or run `cgpv.api.getMapViewer('map1').getMapLayerOrderPaths()` in console)<br>2. Check paths | All layer paths are unique (duplicate UUID has a `:suffix` appended)                                                                  | C    |

## Duplicate Layer via Add Layer

| Test                | Description           | Steps                                                                                              | Expected Result                                      | Auto |
| ------------------- | --------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ---- |
| Add same UUID twice | Prevent duplicate add | 1. On Map 1, use Layers panel "Add Layer" to add UUID `ccc75c12-5acc-4a6a-959f-ef6f621147b9`<br>2. | Is rejected (not allowed) because already on the map | M    |

## Bad Layer ID

| Test                  | Description                 | Steps                                                                                                  | Expected Result                                                                                                      | Auto |
| --------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ---- |
| Non-existing layer ID | Bad sublayer shows as error | 1. On Map 2, check the CESI layer (has sublayer ID 999 which doesn't exist alongside valid sublayer 0) | Bad sublayer shows as error in legend; group layer still loads (partial loading); valid sublayer 0 renders correctly | C    |

> Error layer reload tested in [20 — Edge Cases](20-edge-cases.md#error-layer-reload).

## Wrong Layer Type

| Test                     | Description                | Steps                                                                                      | Expected Result                                                                                                       | Auto |
| ------------------------ | -------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ---- |
| Invalid geoviewLayerType | Wrong type is filtered out | 1. On Map 2, check the layer with `'geoviewLayerType': 'geocore'` (lowercase — wrong type) | Viewer starts and renders basemap; invalid layer is reported as error and filtered out; other valid layers still load | C    |

## Error Layer Configs

Test each layer type's error config to verify graceful failure. Use the Layers Navigator to load each config.

| Test                   | Description                   | Steps                                                          | Expected Result                                         | Auto |
| ---------------------- | ----------------------------- | -------------------------------------------------------------- | ------------------------------------------------------- | ---- |
| Esri Dynamic errors    | Error config loads gracefully | 1. Load `configs/navigator/layers/esri-dynamic-errors.json`    | Viewer loads; error layers flagged; valid layers render | C    |
| Esri Feature errors    | Error config loads gracefully | 1. Load `configs/navigator/layers/esri-feature-errors.json`    | Viewer loads; error layers flagged; valid layers render | C    |
| Esri Image errors      | Error config loads gracefully | 1. Load `configs/navigator/layers/esri-image-errors.json`      | Viewer loads; error layers flagged; valid layers render | C    |
| WMS errors             | Error config loads gracefully | 1. Load `configs/navigator/layers/wms-errors.json`             | Viewer loads; error layers flagged; valid layers render | C    |
| WFS errors             | Error config loads gracefully | 1. Load `configs/navigator/layers/wfs-errors.json`             | Viewer loads; error layers flagged; valid layers render | C    |
| GeoJSON errors         | Error config loads gracefully | 1. Load `configs/navigator/layers/geojson-errors.json`         | Viewer loads; error layers flagged; valid layers render | C    |
| OGC Feature API errors | Error config loads gracefully | 1. Load `configs/navigator/layers/ogc-feature-api-errors.json` | Viewer loads; error layers flagged; valid layers render | C    |
| GeoTIFF errors         | Error config loads gracefully | 1. Load `configs/navigator/layers/geotiff-errors.json`         | Viewer loads; error layers flagged; valid layers render | C    |
| XYZ Tile errors        | Error config loads gracefully | 1. Load `configs/navigator/layers/xyz-tile-errors.json`        | Viewer loads; error layers flagged; valid layers render | C    |
| Static Image errors    | Error config loads gracefully | 1. Load `configs/navigator/layers/static-image-errors.json`    | Viewer loads; error layers flagged; valid layers render | C    |
| Geocore errors         | Error config loads gracefully | 1. Load `configs/navigator/layers/geocore-errors.json`         | Viewer loads; error layers flagged; valid layers render | C    |

## Layer Loading Status

> Tested from the Layers panel in [08 — Layers](08-layers.md#loading-status) and the Legend panel in [07 — Legend](07-legend.md#loading-status).

## Notifications on Error

| Test                       | Description                         | Steps                                                          | Expected Result                                                     | Auto |
| -------------------------- | ----------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------- | ---- |
| Error notification appears | Failed layers trigger notifications | 1. On Map 2 (has error layers), check notification badge/panel | Notification (snackbar + panel entry) appears for each failed layer | C    |

> Notification stacking (repeated errors) tested in [01 — Global](01-global.md#notifications-panel) using the notification buttons.

## Default Config Behavior

Test how the viewer handles missing or empty config properties.

### footerBar / appBar Defaults

| Test                  | Description                   | Steps                                                  | Expected Result                                                           | Auto |
| --------------------- | ----------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------- | ---- |
| No footerBar property | Defaults applied when omitted | 1. Check Map 3 (omits `footerBar`, `appBar`, `navBar`) | Viewer uses default footer bar tabs (layers, data-table)                  | A    |
| No appBar property    | Defaults applied when omitted | 1. Check Map 3                                         | Viewer uses default app bar tabs (geolocator, legend, details, export)    | A    |
| Empty footerBar tabs  | Empty array hides tabs        | 1. Check Map 4 (`footerBar.tabs.core: []`)             | No footer bar tabs appear (empty footer)                                  | A    |
| Empty appBar tabs     | Empty array hides tabs        | 1. Check Map 4 (`appBar.tabs.core: []`)                | No app bar tabs appear (empty app bar)                                    | A    |
| No navBar property    | Only default buttons shown    | 1. Check Map 3 (omits `navBar`)                        | Default buttons appear (zoom, rotation, fullscreen, home, basemap-select) | A    |
| Empty navBar array    | Empty array hides all buttons | 1. Check Map 4 (`navBar: []`)                          | No navbar buttons appear                                                  | A    |
