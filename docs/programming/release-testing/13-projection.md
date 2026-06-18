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

| Test                | Description                          | Steps                                                                                       | Expected Result                                                                                                           | Auto |
| ------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---- |
| Extent after switch | Constraint applies in new projection | 1. On Map 2, verify max extent is applied in WM<br>2. Switch to LCC using projection button | The extent constraint still applies in LCC — cannot pan beyond the configured max extent boundaries in the new projection | M    |

## Vector Tile on Projection Switch

| Test                    | Description                | Steps                                         | Expected Result                                                                            | Auto |
| ----------------------- | -------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------ | ---- |
| Incompatible VT warning | Warning notification shown | 1. On Map 3, switch projection from WM to LCC | Warning notification appears: "Vector tile [layerName] doesn't support the map projection" | C    |
