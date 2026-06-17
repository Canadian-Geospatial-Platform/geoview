# 03 — Config Validation

Config parsing, duplicate handling, and error layer behavior.

## Duplicate UUIDs

Config: `configs/navigator/layers/geocore-duplicates.json`

- [ ] **Duplicate geocore UUID** — Load a config with the same geocore UUID twice. Verify:
  - Both layers appear in the legend
  - The `orderedLayers` array has a `:suffix` on the duplicate geocore entry
  - The non-geocore duplicate type only appears once (filtered out)
- [ ] **Layer paths are unique** — Open the store and verify all layer paths are unique.

## Duplicate Layer via Add Layer

- [ ] **Add same UUID twice** — Use the Add Layer UI to add a geocore UUID. Then try to add the same UUID again. Verify the second add is rejected (not allowed).

## Bad Layer ID

Config: `configs/navigator/layers/esri-dynamic-errors.json` or CESI layer in scale settings config

- [ ] **Non-existing layer ID** — Load a config with a bad `layerId` (one that doesn't exist on the service). Verify:
  - The bad sublayer shows as error in the legend
  - The group layer still loads (partial loading)
  - Other valid sublayers in the group render correctly

> Error layer reload tested in [20 — Edge Cases](20-edge-cases.md#error-layer-reload).

## Wrong Layer Type

- [ ] **Invalid `geoviewLayerType`** — Load a config with `'geoviewLayerType': 'geocore'` (wrong type). Verify:
  - The viewer still starts and renders the basemap
  - The invalid layer is reported as an error and filtered out
  - Other valid layers in the config still load

## Error Layer Configs

Test each layer type's error config to verify graceful failure:

- [ ] `configs/navigator/layers/esri-dynamic-errors.json`
- [ ] `configs/navigator/layers/esri-feature-errors.json`
- [ ] `configs/navigator/layers/esri-image-errors.json`
- [ ] `configs/navigator/layers/wms-errors.json`
- [ ] `configs/navigator/layers/wfs-errors.json`
- [ ] `configs/navigator/layers/geojson-errors.json`
- [ ] `configs/navigator/layers/ogc-feature-api-errors.json`
- [ ] `configs/navigator/layers/geotiff-errors.json`
- [ ] `configs/navigator/layers/xyz-tile-errors.json`
- [ ] `configs/navigator/layers/static-image-errors.json`
- [ ] `configs/navigator/layers/geocore-errors.json`

For each: verify the viewer loads, error layers are flagged, valid layers still render.

## Layer Loading Status

> Also tested from the Layers panel in [08 — Layers](08-layers.md#loading-status) and the Legend panel in [07 — Legend](07-legend.md#loading-status).

- [ ] **Green status** — When layers are loading, verify the status indicator shows green (loading) in the Layers panel.
- [ ] **Loaded status** — Once loaded, verify status changes to loaded.
- [ ] **Error status** — For error layers, verify status shows error.

## Notifications on Error

- [ ] **Error notification appears** — Load a config with error layers. Verify a notification (snackbar + notification panel entry) appears for each failed layer.
- [ ] **No duplicate notifications** — Reload the same error layer. Verify the notification count increments (stacks) rather than creating duplicate entries.

## Default Config Behavior

Test how the viewer handles missing or empty config properties.

### footerBar / appBar Defaults

- [ ] **No `footerBar` property** — Load a config that omits `footerBar` entirely. Verify the viewer uses default footer bar tabs (legend, layers, details, data-table).
- [ ] **No `appBar` property** — Load a config that omits `appBar` entirely. Verify the viewer uses default app bar tabs (geolocator, export, etc.).
- [ ] **Empty `footerBar.tabs.core` array** — Load a config with `"footerBar": { "tabs": { "core": [] } }`. Verify no footer bar tabs appear (empty footer).
- [ ] **Empty `appBar.tabs.core` array** — Load a config with `"appBar": { "tabs": { "core": [] } }`. Verify no app bar tabs appear (empty app bar).
- [ ] **No `navBar` property** — Load a config that omits `navBar` entirely. Verify only the default buttons appear (zoom, rotation).
