# 06 — Overview Map

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.

Overview map behavior, hide on zoom, and projection switch. The overview map is only available for LCC (EPSG:3978) and WM (EPSG:3857) — it is not created for EPSG:3573.

## Presence

Config with overview map (LCC): `configs/navigator/layers/all-layers.json` (`"components": ["overview-map"]`, `"overviewMap": { "hideOnZoom": 7 }`)

Config with overview map (WM): `configs/navigator/layers/esri-dynamic.json` (`"components": ["overview-map"]`, `"overviewMap": { "hideOnZoom": 7 }`)

Config without overview map: any config that omits `"overview-map"` from the `components` array (e.g., `configs/navigator/demos/19-global-settings.json`)

| Test                 | Description                    | Steps                                                     | Expected Result                               | Auto |
| -------------------- | ------------------------------ | --------------------------------------------------------- | --------------------------------------------- | ---- |
| Overview map visible | Appears when enabled in config | 1. Load a config with `"overview-map"` in `components`    | Overview map appears in the corner of the map | A    |
| Overview map absent  | Does not appear when omitted   | 1. Load a config without `"overview-map"` in `components` | No overview map is displayed                  | A    |

## Hide on Zoom

Config: `configs/navigator/layers/all-layers.json` or `configs/navigator/layers/esri-dynamic.json` (`hideOnZoom: 7`)

| Test                 | Description                         | Steps                                                                | Expected Result                                               | Auto |
| -------------------- | ----------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------- | ---- |
| Hide when zoomed out | Overview hides below threshold      | 1. Load config with `hideOnZoom: 7`<br>2. Zoom out past zoom level 7 | Overview map disappears                                       | A    |
| Show when zoomed in  | Overview reappears above threshold  | 1. Zoom back in above level 7                                        | Overview map reappears                                        | A    |
| Threshold boundary   | Correct behavior at exact threshold | 1. Run `cgpv.api.maps['mapWM'].setMapZoomLevel(7)` in console        | Overview map shows correct show/hide behavior at the boundary | A    |

## Projection Switch

Config: `configs/navigator/layers/esri-dynamic-projections.json` (WM with overview map and projection switch available)

| Test                          | Description                           | Steps                                             | Expected Result                                                        | Auto |
| ----------------------------- | ------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------- | ---- |
| Overview map switches basemap | Basemap updates on projection change  | 1. Switch projection (LCC → WM or WM → LCC)       | Overview map updates its basemap to match the new projection           | M    |
| Overview map extent           | Extent indicator correct after switch | 1. Switch projection<br>2. Check the overview map | Overview map shows the correct extent indicator for the new projection | M    |

## Combined: Hide on Zoom + Projection Switch

Config: `configs/navigator/layers/esri-dynamic-projections.json` (`hideOnZoom: 7`)

| Test      | Description                          | Steps                                                                                                                                                                                                                | Expected Result                                                                                 | Auto |
| --------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---- |
| Full flow | Hide/show persists across projection | 1. Start in LCC, zoom above level 7 (overview visible)<br>2. Switch to WM<br>3. Verify overview visible with correct basemap<br>4. Zoom out below level 7 in WM<br>5. Verify overview hides<br>6. Switch back to LCC | Overview map shows/hides correctly across projection switches, basemap updates match projection | M    |
