# 13 — Projection

Cross-feature interactions between projection switches and other features (geometry, data tables, north pole, extent).

For basic projection switch and layer re-rendering tests, see [02-map.md — Projections](02-map.md#projections).

## Geometry & Projection

- [ ] **Draw geometry** — Draw a geometry (point, line, polygon) on the map.
- [ ] **Reproject with geometry** — Switch projection. Verify the drawn geometry reprojects correctly and remains in the correct geographic location.
- [ ] **Geometry coordinates** — Verify the geometry coordinates transform properly (not just pixel position).

## Data Table & Projection

- [ ] **Create table, reproject** — Create a data table for a vector layer. Switch projection. Verify the table still works (columns, data intact).
- [ ] **Recreate table after reproject** — After projection switch, try to recreate the data table. Verify it recreates without errors.

## North Pole Flag on Projection Switch

For standalone north pole / north arrow tests per projection, see [02-map.md — North Pole & North Arrow](02-map.md#north-pole--north-arrow).

- [ ] **WM → LCC north pole** — Start in WM. Switch to LCC. Zoom out. Verify the north pole flag appears.
- [ ] **Full flow** — LCC full extent (see north pole, no arrow) → Zoom in (see arrow, no pole) → Zoom out (pole) → Switch to WM (see arrow, no pole).

## Full Extent Override & Projection

Config: `configs/navigator/demos/05-max-extent-override.json`

- [ ] **Extent after switch** — Switch projection in the max extent override config. Verify the extent constraint still applies in the new projection.
