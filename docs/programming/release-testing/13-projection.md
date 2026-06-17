# 13 — Projection

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.

Cross-feature interactions between projection switches and other features (geometry, data tables, north pole, extent, vector tiles). GeoView supports EPSG:3978 (LCC), EPSG:3857 (Web Mercator), and EPSG:3573 (North Pole LAEA). For basic projection switch and layer re-rendering tests, see [02 — Map — Projections](02-map.md#projections).

## Geometry & Projection

Config: Use any config with `drawer` plugin loaded (e.g., `configs/navigator/demos/20-drawer.json` or add drawer via corePackages)

| Test                    | Description                   | Steps                                                                                                    | Expected Result                                                                                                                                         | Auto |
| ----------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Draw geometry           | Geometry created on map       | 1. Draw a point, line, or polygon on the map                                                             | Geometry appears on the map at the drawn location                                                                                                       | M    |
| Reproject with geometry | Geometry reprojects correctly | 1. Draw a geometry in one projection (e.g., LCC 3978)<br>2. Switch to another projection (e.g., WM 3857) | Drawn geometry reprojects correctly and remains at the same geographic location (DrawerController transforms all geometries via `geometry.transform()`) | M    |

## Data Table & Projection

Config: `configs/navigator/layers/all-layers.json` (footerBar includes `data-table`, vector layers)

| Test                           | Description              | Steps                                                             | Expected Result                                              | Auto |
| ------------------------------ | ------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------ | ---- |
| Table survives reproject       | Data intact after switch | 1. Open the data table for a vector layer<br>2. Switch projection | Table columns and data remain intact after projection switch | M    |
| Recreate table after reproject | No errors on recreate    | 1. After projection switch, close and reopen the data table       | Table recreates without errors in the new projection         | M    |

## North Pole Flag on Projection Switch

For standalone north pole / north arrow tests per projection, see [02 — Map — North Pole & North Arrow](02-map.md#north-pole--north-arrow).

| Test                | Description               | Steps                                                                                                                                                                                                    | Expected Result                                                            | Auto |
| ------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---- |
| WM → LCC north pole | Pole appears after switch | 1. Start in Web Mercator (3857)<br>2. Switch to LCC (3978)<br>3. Zoom out to full extent                                                                                                                 | North pole flag appears (LCC includes the pole; WM does not)               | M    |
| Full flow           | Complete visibility cycle | 1. LCC full extent — see north pole flag, no north arrow<br>2. Zoom in — see north arrow, no pole flag<br>3. Zoom out — pole flag returns<br>4. Switch to WM — see north arrow pointing up, no pole flag | Each transition shows the correct combination of pole flag and north arrow | M    |

## Max Extent Override & Projection

Config: `configs/navigator/demos/05-max-extent-override.json` (`maxExtent: [-180, -50, 180, 89]`, projection: 3857, navBar includes projection selector)

| Test                | Description                          | Steps                                                                   | Expected Result                                                                                                           | Auto |
| ------------------- | ------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---- |
| Extent after switch | Constraint applies in new projection | 1. Verify max extent is applied in WM (3857)<br>2. Switch to LCC (3978) | The extent constraint still applies in LCC — cannot pan beyond the configured max extent boundaries in the new projection | M    |

## Vector Tile on Projection Switch

Config: Any config with a vector tile layer loaded (e.g., via Add Layer panel or config with vector tiles)

| Test                    | Description                | Steps                                                                                    | Expected Result                                                                            | Auto |
| ----------------------- | -------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---- |
| Incompatible VT warning | Warning notification shown | 1. Load a vector tile layer<br>2. Switch to a projection the vector tile doesn't support | Warning notification appears: "Vector tile [layerName] doesn't support the map projection" | C    |
