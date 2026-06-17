# 04 — Basemap

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.

Basemap selector and basemap options.

Both LCC (EPSG:3978) and WM (EPSG:3857) share the same set of basemap options (transport, simple, shaded, imagery, osm, nogeom) — they use different tile URLs per projection but the selector buttons are the same. EPSG:3573 has no default basemaps; the circumpolar demo uses a WMTS layer with `useAsBasemap: true` as a workaround.

## Basemap Selector

| Test | Description | Steps | Expected Result | Auto |
|---|---|---|---|---|
| All basemap types (LCC) | Verify each basemap in LCC projection | 1. Open basemap selector in LCC<br>2. Switch to each basemap (transport, simple, imagery, nogeom) | Tiles load correctly, no blank/white tiles, labels render (if applicable), attribution updates | M |
| All basemap types (WM) | Verify each basemap in WM projection | 1. Switch projection to WM<br>2. Open basemap selector<br>3. Switch to each basemap | Same basemap options available, tiles load correctly, no blank/white tiles | M |

## Labels & Shaded Relief

| Test | Description | Steps | Expected Result | Auto |
|---|---|---|---|---|
| Labels toggle | Labels appear/disappear on toggle | 1. Open basemap selector<br>2. Toggle labels off<br>3. Toggle labels on | Labels disappear when off, reappear when on | M |
| Shaded relief toggle | Terrain shading changes on toggle | 1. Open basemap selector<br>2. Toggle shaded relief off<br>3. Toggle shaded relief on | Terrain shading disappears when off, reappears when on | M |
| Combined toggles | Both options work together | 1. Toggle both labels and shaded simultaneously | Combined effect renders correctly (labels over shaded terrain) | M |

## Basemap with Projection Switch

| Test | Description | Steps | Expected Result | Auto |
|---|---|---|---|---|
| Basemap persists across projection | Equivalent basemap loads after switch | 1. Select a basemap in LCC<br>2. Switch to WM projection | Equivalent basemap loads in WM with correct WM tile URLs | M |

## Basemap Options Demo

Config: `configs/navigator/demos/01-basemap-LCC-TLS.json` and `02-basemap-LCC-SL.json`

| Test | Description | Steps | Expected Result | Auto |
|---|---|---|---|---|
| TLS config | Transport/Label/Shaded pre-configured | 1. Load `01-basemap-LCC-TLS.json` config | Basemap loads with transport, labels, and shaded all enabled | M |
| SL config | Shaded/Label pre-configured | 1. Load `02-basemap-LCC-SL.json` config | Basemap loads with shaded and labels enabled, correct rendering | M |

## `useAsBasemap` Layer Property

Config: `configs/navigator/demos/22-circumpolar.json`

| Test | Description | Steps | Expected Result | Auto |
|---|---|---|---|---|
| Custom basemap layer | WMTS layer renders as basemap | 1. Load `22-circumpolar.json` config | WMTS layer with `useAsBasemap: true` renders below all other layers, excluded from legend and feature queries | M |
