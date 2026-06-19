# 13 — Projection

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-13-projection.html](../../packages/geoview-core/public/templates/release-testing/rt-13-projection.html) — Map 1 (LCC with drawer + vector layer + data table + projection), Map 2 (WM with max extent + projection), Map 3 (WM with vector tile layer).

Cross-feature interactions between projection switches and other features (geometry, data tables, north pole, extent, vector tiles). GeoView supports EPSG:3978 (LCC), EPSG:3857 (Web Mercator), and EPSG:3573 (North Pole LAEA). For basic projection switch and layer re-rendering tests, see [02 — Map — Projections](02-map.md#projections).

## Geometry & Projection

| Test                    | Description                   | Steps                                                                                            | Expected Result                                                                                                                                         | Auto |
| ----------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Draw geometry           | Geometry created on map       | 1. On Map 1, use the drawer to draw a point, line, or polygon                                    | Geometry appears on the map at the drawn location                                                                                                       | M    |
| Reproject with geometry | Geometry reprojects correctly | 1. On Map 1, draw a geometry in LCC (3978)<br>2. Switch to WM (3857) using the projection button | Drawn geometry reprojects correctly and remains at the same geographic location (DrawerController transforms all geometries via `geometry.transform()`) | M    |

## Data Table & Projection

| Test                           | Description              | Steps                                                                         | Expected Result                                              | Auto |
| ------------------------------ | ------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------ | ---- |
| Table survives reproject       | Data intact after switch | 1. On Map 1, open the data table for the vector layer<br>2. Switch projection | Table columns and data remain intact after projection switch | M    |
| Recreate table after reproject | No errors on recreate    | 1. On Map 1, after projection switch, close and reopen the data table         | Table recreates without errors in the new projection         | M    |

## North Pole Flag on Projection Switch

For standalone north pole / north arrow tests per projection, see [02 — Map — North Pole & North Arrow](02-map.md#north-pole--north-arrow).

| Test                | Description               | Steps                                                                                                                                                                                                              | Expected Result                                                            | Auto |
| ------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- | ---- |
| WM → LCC north pole | Pole appears after switch | 1. On Map 1, switch to WM first<br>2. Switch back to LCC (3978)<br>3. Zoom out to full extent                                                                                                                      | North pole flag appears (LCC includes the pole; WM does not)               | M    |
| Full flow           | Complete visibility cycle | 1. On Map 1 in LCC, zoom out fully — see north pole flag, no arrow<br>2. Zoom in — see north arrow, no pole flag<br>3. Zoom out — pole flag returns<br>4. Switch to WM — see north arrow pointing up, no pole flag | Each transition shows the correct combination of pole flag and north arrow | M    |

## Max Extent Override & Projection

> **Note:** The configured `maxExtent` is only applied when the map is in its configured projection. When switching to a different projection, the default extent for that projection is used instead. This is intentional — LCC and WM extents are fundamentally different and cannot be meaningfully transformed between projections.

| Test                          | Description                            | Steps                                                                          | Expected Result                                                                                         | Auto |
| ----------------------------- | -------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ---- |
| Extent applied in native proj | Custom extent constrains in WM         | 1. On Map 2 (WM, maxExtent: [-180, -50, 180, 89]), pan in all directions       | Cannot pan beyond the configured max extent boundaries                                                  | M    |
| Extent resets on switch       | Default extent used in non-native proj | 1. On Map 2, switch to LCC using projection button<br>2. Pan in all directions | Extent resets to LCC default (approx [-150, -10, -30, 90]) — the WM custom extent does NOT apply in LCC | M    |
| Extent restores on return     | Custom extent re-applied on return     | 1. Switch back to WM<br>2. Pan in all directions                               | The configured maxExtent [-180, -50, 180, 89] is re-applied — pan is constrained again                  | M    |

## Vector Tile on Projection Switch

> **Known issue:** The vector tile source should be reloaded automatically when the projection switches to a compatible one. Currently the user must manually reload the layer from the Layers panel after switching back.

Map 3 uses a vector tile layer in EPSG:3978 on a map initially in EPSG:3857. The layer will show an error on load (incompatible projection). Switch to LCC (3978) — the reload button appears in the Layers panel. Reload the layer, then switch back to WM to trigger the warning.

| Test                    | Description                | Steps                                                                                                                                           | Expected Result                                                                            | Auto |
| ----------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---- |
| Incompatible VT warning | Warning notification shown | 1. On Map 3, switch to LCC (3978)<br>2. In Layers panel, reload the vector tile layer<br>3. Layer renders in LCC<br>4. Switch back to WM (3857) | Warning notification appears: "Vector tile [layerName] doesn't support the map projection" | C    |
