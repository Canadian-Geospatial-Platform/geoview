# 04 — Basemap

Basemap selector and basemap options.

Both LCC (EPSG:3978) and WM (EPSG:3857) share the same set of basemap options (transport, simple, shaded, imagery, osm, nogeom) — they use different tile URLs per projection but the selector buttons are the same. EPSG:3573 has no default basemaps; the circumpolar demo uses a WMTS layer with `useAsBasemap: true` as a workaround.

## Basemap Selector

- [ ] **All basemap types (LCC)** — In LCC, open the basemap selector. Switch to each basemap (transport, simple, imagery, nogeom) and verify:
  - The basemap tiles load correctly
  - No blank/white tiles
  - Labels render (if applicable)
  - Attribution updates
- [ ] **All basemap types (WM)** — Switch to WM and repeat the same checks. Verify the same basemap options are available and render correctly.

## Labels & Shaded Relief

- [ ] **Labels toggle** — Toggle labels on/off in the basemap selector. Verify labels appear/disappear on the map.
- [ ] **Shaded relief toggle** — Toggle shaded relief on/off. Verify the terrain shading changes.
- [ ] **Combined toggles** — Toggle both labels and shaded simultaneously. Verify combined effect.

## Basemap with Projection Switch

- [ ] **Basemap persists** — Select a basemap in LCC, switch to WM. Verify the equivalent basemap loads in WM with the correct WM tile URLs.

## Basemap Options Demo

Config: `configs/navigator/demos/01-basemap-LCC-TLS.json` and `02-basemap-LCC-SL.json`

These demos show basemaps with specific label/shaded options pre-configured:

- [ ] **TLS config** — Load the Transport/Label/Shaded config. Verify the basemap loads with all three options enabled.
- [ ] **SL config** — Load the Shaded/Label config. Verify correct rendering.

## `useAsBasemap` Layer Property

Config: `configs/navigator/demos/22-circumpolar.json`

- [ ] **Custom basemap layer** — Load the circumpolar config. Verify the WMTS layer with `useAsBasemap: true` renders as the basemap (below all other layers, excluded from legend and feature queries).
