# 06 — Overview Map

Overview map behavior, hide on zoom, and projection switch. The overview map is only available for LCC (EPSG:3978) and WM (EPSG:3857) — it is not created for EPSG:3573.

## Presence

Config with overview map (LCC): `configs/navigator/layers/all-layers.json` (`"components": ["overview-map"]`, `"overviewMap": { "hideOnZoom": 7 }`)

Config with overview map (WM): `configs/navigator/layers/esri-dynamic.json` (`"components": ["overview-map"]`, `"overviewMap": { "hideOnZoom": 7 }`)

Config without overview map: any config that omits `"overview-map"` from the `components` array (e.g., `configs/navigator/demos/19-global-settings.json`)

- [ ] **Overview map visible** — Load a config with overview map enabled. Verify the overview map appears in the corner.
- [ ] **Overview map absent** — Load a config without `"overview-map"` in components. Verify it does not appear.

## Hide on Zoom

Config: `configs/navigator/layers/all-layers.json` or `configs/navigator/layers/esri-dynamic.json` (`hideOnZoom: 7`)

- [ ] **Hide when zoomed out** — Zoom out past zoom level 7. Verify the overview map disappears.
- [ ] **Show when zoomed in** — Zoom back in above level 7. Verify it reappears.
- [ ] **Threshold boundary** — Zoom to exactly level 7. Verify correct show/hide behavior.

## Projection Switch

Config: `configs/navigator/layers/esri-dynamic-projections.json` (WM with overview map and projection switch available)

- [ ] **Overview map switches basemap** — Switch projection (LCC → WM or WM → LCC). Verify the overview map updates its basemap to match the new projection.
- [ ] **Overview map extent** — After projection switch, verify the overview map shows the correct extent indicator.

## Combined: Hide on Zoom + Projection Switch

Config: `configs/navigator/layers/esri-dynamic-projections.json` (`hideOnZoom: 7`)

- [ ] **Full flow** — Start in LCC, zoom to a value above 7 where overview is visible. Switch to WM. Verify overview map is visible with correct basemap. Zoom out below level 7 in WM. Verify overview hides. Switch back to LCC. Verify correct behavior.
