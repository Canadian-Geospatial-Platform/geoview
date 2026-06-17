# 03 — Config Validation

Config parsing, duplicate handling, and error layer behavior.

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.

## Duplicate UUIDs

Config: `configs/navigator/layers/geocore-duplicates.json`

| Test                   | Description                       | Steps                                               | Expected Result                                                                                                                       | Auto |
| ---------------------- | --------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Duplicate geocore UUID | Same UUID appears twice in config | 1. Load the config with the same geocore UUID twice | Both layers appear in legend; `orderedLayers` has `:suffix` on duplicate; non-geocore duplicate type only appears once (filtered out) | C    |
| Layer paths are unique | No duplicate paths in store       | 1. Open the store after loading                     | All layer paths are unique                                                                                                            | C    |

## Duplicate Layer via Add Layer

| Test                | Description           | Steps                                                                          | Expected Result                      | Auto |
| ------------------- | --------------------- | ------------------------------------------------------------------------------ | ------------------------------------ | ---- |
| Add same UUID twice | Prevent duplicate add | 1. Use Add Layer UI to add a geocore UUID<br>2. Try to add the same UUID again | Second add is rejected (not allowed) | M    |

## Bad Layer ID

Config: `configs/navigator/layers/esri-dynamic-errors.json` or CESI layer in scale settings config

| Test                  | Description                 | Steps                                                                         | Expected Result                                                                                                          | Auto |
| --------------------- | --------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---- |
| Non-existing layer ID | Bad sublayer shows as error | 1. Load a config with a bad `layerId` (one that doesn't exist on the service) | Bad sublayer shows as error in legend; group layer still loads (partial loading); other valid sublayers render correctly | C    |

> Error layer reload tested in [20 — Edge Cases](20-edge-cases.md#error-layer-reload).

## Wrong Layer Type

| Test                     | Description                | Steps                                                              | Expected Result                                                                                                       | Auto |
| ------------------------ | -------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ---- |
| Invalid geoviewLayerType | Wrong type is filtered out | 1. Load a config with `'geoviewLayerType': 'geocore'` (wrong type) | Viewer starts and renders basemap; invalid layer is reported as error and filtered out; other valid layers still load | C    |

## Error Layer Configs

Test each layer type's error config to verify graceful failure.

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

> Also tested from the Layers panel in [08 — Layers](08-layers.md#loading-status) and the Legend panel in [07 — Legend](07-legend.md#loading-status).

| Test          | Description                         | Steps                                | Expected Result                        | Auto |
| ------------- | ----------------------------------- | ------------------------------------ | -------------------------------------- | ---- |
| Green status  | Loading indicator while layers load | 1. Observe Layers panel during load  | Status indicator shows green (loading) | C    |
| Loaded status | Status changes after load           | 1. Wait for layers to finish loading | Status changes to loaded               | C    |
| Error status  | Error layers show error status      | 1. Load config with error layers     | Error layers show error status         | C    |

## Notifications on Error

| Test                       | Description                         | Steps                              | Expected Result                                                        | Auto |
| -------------------------- | ----------------------------------- | ---------------------------------- | ---------------------------------------------------------------------- | ---- |
| Error notification appears | Failed layers trigger notifications | 1. Load a config with error layers | Notification (snackbar + panel entry) appears for each failed layer    | C    |
| No duplicate notifications | Repeated errors stack               | 1. Reload the same error layer     | Notification count increments (stacks) rather than creating duplicates | C    |

## Default Config Behavior

Test how the viewer handles missing or empty config properties.

### footerBar / appBar Defaults

| Test                  | Description                   | Steps                                                           | Expected Result                                                           | Auto |
| --------------------- | ----------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------- | ---- |
| No footerBar property | Defaults applied when omitted | 1. Load a config that omits `footerBar` entirely                | Viewer uses default footer bar tabs (layers, data-table)                  | A    |
| No appBar property    | Defaults applied when omitted | 1. Load a config that omits `appBar` entirely                   | Viewer uses default app bar tabs (geolocator, legend, details, export)    | A    |
| Empty footerBar tabs  | Empty array hides tabs        | 1. Load a config with `"footerBar": { "tabs": { "core": [] } }` | No footer bar tabs appear (empty footer)                                  | A    |
| Empty appBar tabs     | Empty array hides tabs        | 1. Load a config with `"appBar": { "tabs": { "core": [] } }`    | No app bar tabs appear (empty app bar)                                    | A    |
| No navBar property    | Only default buttons shown    | 1. Load a config that omits `navBar` entirely                   | Default buttons appear (zoom, rotation, fullscreen, home, basemap-select) | A    |
| Empty navBar array    | Empty array hides all buttons | 1. Load a config with `"navBar": []`                            | No navbar buttons appear                                                  | A    |
