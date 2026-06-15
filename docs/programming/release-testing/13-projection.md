# 13 — Projection

Projection switch interactions with geometry, tables, and north pole.

## Projection Switch

- [ ] **LCC → WM** — Switch from LCC (EPSG:3978) to WM (EPSG:3857). Verify the map re-renders correctly.
- [ ] **WM → LCC** — Switch back from WM to LCC. Verify correct re-rendering.
- [ ] **LCC → 3573** — Switch to North Pole LAEA. Verify correct rendering.
- [ ] **Layers survive switch** — Verify all loaded layers re-render after each projection switch.

## Geometry & Projection

- [ ] **Draw geometry** — Draw a geometry (point, line, polygon) on the map.
- [ ] **Reproject with geometry** — Switch projection. Verify the drawn geometry reprojects correctly and remains in the correct geographic location.
- [ ] **Geometry coordinates** — Verify the geometry coordinates transform properly (not just pixel position).

## Data Table & Projection

- [ ] **Create table, reproject** — Create a data table for a vector layer. Switch projection. Verify the table still works (columns, data intact).
- [ ] **Recreate table after reproject** — After projection switch, try to recreate the data table. Verify it recreates without errors.

## North Pole Flag on Projection Switch

- [ ] **WM → LCC north pole** — Start in WM. Switch to LCC. Zoom out. Verify the north pole flag appears.
- [ ] **Full flow** — LCC full extent (see north pole, no arrow) → Zoom in (see arrow, no pole) → Zoom out (pole) → Switch to WM (see arrow, no pole).

## Full Extent Override & Projection

Config: `configs/navigator/demos/05-max-extent-override.json`

- [ ] **Extent after switch** — Switch projection in the max extent override config. Verify the extent constraint still applies in the new projection.

---

## Issues Found

<!-- Record any issues below -->
