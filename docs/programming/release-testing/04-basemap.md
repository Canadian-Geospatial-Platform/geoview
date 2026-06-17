# 04 — Basemap

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.

Basemap selector and basemap options.

Both LCC (EPSG:3978) and WM (EPSG:3857) share the same set of basemap options (transport, simple, shaded, imagery, osm, nogeom) — they use different tile URLs per projection but the selector buttons are the same. EPSG:3573 has no default basemaps; the circumpolar demo uses a WMTS layer with `useAsBasemap: true` as a workaround.

## Basemap Selector

| Test                    | Description                           | Steps                                                                                             | Expected Result                                                                                | Auto |
| ----------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---- |
| All basemap types (LCC) | Verify each basemap in LCC projection | 1. Open basemap selector in LCC<br>2. Switch to each basemap (transport, simple, imagery, nogeom) | Tiles load correctly, no blank/white tiles, labels render (if applicable), attribution updates | M    |
| All basemap types (WM)  | Verify each basemap in WM projection  | 1. Switch projection to WM<br>2. Open basemap selector<br>3. Switch to each basemap               | Same basemap options available, tiles load correctly, no blank/white tiles                     | M    |

## Labels & Shaded Relief

Basemap labels and shaded relief are controlled via config properties (`basemapOptions.labeled`, `basemapOptions.shaded`), not via UI toggles. Test by editing config values in the sandbox.

| Test            | Description                         | Steps                                                                                                                    | Expected Result                                 | Auto |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- | ---- |
| Labels disabled | No labels when `labeled: false`     | 1. In sandbox, set `"basemapOptions": { "basemapId": "transport", "shaded": true, "labeled": false }`<br>2. Load the map | Basemap renders without labels                  | C    |
| Labels enabled  | Labels appear when `labeled: true`  | 1. In sandbox, set `"labeled": true`<br>2. Load the map                                                                  | Basemap renders with labels                     | C    |
| Shaded disabled | No shading when `shaded: false`     | 1. In sandbox, set `"shaded": false, "labeled": true`<br>2. Load the map                                                 | Basemap renders without terrain shading         | C    |
| Shaded enabled  | Terrain shading when `shaded: true` | 1. In sandbox, set `"shaded": true, "labeled": true`<br>2. Load the map                                                  | Basemap renders with terrain shading and labels | C    |
| Both disabled   | Bare basemap tiles only             | 1. In sandbox, set `"shaded": false, "labeled": false`<br>2. Load the map                                                | Basemap renders without labels or shading       | C    |

## Basemap with Projection Switch

| Test                               | Description                           | Steps                                                    | Expected Result                                          | Auto |
| ---------------------------------- | ------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------- | ---- |
| Basemap persists across projection | Equivalent basemap loads after switch | 1. Select a basemap in LCC<br>2. Switch to WM projection | Equivalent basemap loads in WM with correct WM tile URLs | C    |

## Basemap Options Demo

Config: `configs/navigator/demos/01-basemap-LCC-TLS.json` and `02-basemap-LCC-SL.json`

| Test       | Description                           | Steps                                    | Expected Result                                                 | Auto |
| ---------- | ------------------------------------- | ---------------------------------------- | --------------------------------------------------------------- | ---- |
| TLS config | Transport/Label/Shaded pre-configured | 1. Load `01-basemap-LCC-TLS.json` config | Basemap loads with transport, labels, and shaded all enabled    | C    |
| SL config  | Shaded/Label pre-configured           | 1. Load `02-basemap-LCC-SL.json` config  | Basemap loads with shaded and labels enabled, correct rendering | C    |

## `useAsBasemap` Layer Property

Config: `configs/navigator/demos/22-circumpolar.json`

| Test                 | Description                   | Steps                                | Expected Result                                                                                               | Auto |
| -------------------- | ----------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ---- |
| Custom basemap layer | WMTS layer renders as basemap | 1. Load `22-circumpolar.json` config | WMTS layer with `useAsBasemap: true` renders below all other layers, excluded from legend and feature queries | M    |
