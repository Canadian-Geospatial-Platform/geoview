# 04 — Basemap

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-04-basemap.html](../../packages/geoview-core/public/templates/release-testing/rt-04-basemap.html) — Map 1 (LCC with basemap buttons + labeled/shaded toggles), Map 2 (WM), Map 3 (Circumpolar with `useAsBasemap`).

Basemap selector and basemap options.

Both LCC (EPSG:3978) and WM (EPSG:3857) share the same set of basemap options (transport, simple, imagery, osm, nogeom) — they use different tile URLs per projection but the selector buttons are the same. EPSG:3573 has no default basemaps; the circumpolar demo uses a WMTS layer with `useAsBasemap: true` as a workaround.

## Basemap Selector

| Test                    | Description                           | Steps                                                                             | Expected Result                                                                                | Auto |
| ----------------------- | ------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---- |
| All basemap types (LCC) | Verify each basemap in LCC projection | 1. On Map 1, click each basemap button (Transport, Simple, Imagery, OSM, No Geom) | Tiles load correctly, no blank/white tiles, labels render (if applicable), attribution updates | M    |
| All basemap types (WM)  | Verify each basemap in WM projection  | 1. On Map 2, use the basemap selector in navbar<br>2. Switch to each basemap      | Same basemap options available, tiles load correctly, no blank/white tiles                     | M    |

## Labels & Shaded Relief

Use the toggle buttons above Map 1 to dynamically change `labeled` and `shaded` properties via the API.

| Test            | Description                         | Steps                                             | Expected Result                                 | Auto |
| --------------- | ----------------------------------- | ------------------------------------------------- | ----------------------------------------------- | ---- |
| Labels disabled | No labels when `labeled: false`     | 1. On Map 1, click "Labeled: ON" to toggle it OFF | Basemap renders without labels                  | C    |
| Labels enabled  | Labels appear when `labeled: true`  | 1. Click "Labeled: OFF" to toggle it back ON      | Basemap renders with labels                     | C    |
| Shaded disabled | No shading when `shaded: false`     | 1. On Map 1, click "Shaded: ON" to toggle it OFF  | Basemap renders without terrain shading         | C    |
| Shaded enabled  | Terrain shading when `shaded: true` | 1. Click "Shaded: OFF" to toggle it back ON       | Basemap renders with terrain shading and labels | C    |
| Both disabled   | Bare basemap tiles only             | 1. Toggle both Labeled and Shaded OFF             | Basemap renders without labels or shading       | C    |

## Basemap with Projection Switch

| Test                               | Description                           | Steps                                                                                            | Expected Result                                          | Auto |
| ---------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------- | ---- |
| Basemap persists across projection | Equivalent basemap loads after switch | 1. On Map 1, select a basemap (e.g., Imagery)<br>2. Use navbar projection button to switch to WM | Equivalent basemap loads in WM with correct WM tile URLs | C    |

## `useAsBasemap` Layer Property

| Test                 | Description                   | Steps                        | Expected Result                                                                                               | Auto |
| -------------------- | ----------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------- | ---- |
| Custom basemap layer | WMTS layer renders as basemap | 1. Check Map 3 (Circumpolar) | WMTS layer with `useAsBasemap: true` renders below all other layers, excluded from legend and feature queries | M    |
