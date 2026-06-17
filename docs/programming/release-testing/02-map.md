# 02 — Map

Map rendering, projections, north pole, and north arrow.

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.

## Projections

| Test                         | Description                          | Steps                                                                                                                         | Expected Result                                                                                                                           | Auto |
| ---------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 3 projections supported      | Each projection renders correctly    | 1. Load a map in EPSG:3978 (LCC)<br>2. Load a map in EPSG:3857 (Web Mercator)<br>3. Load a map in EPSG:3573 (North Pole LAEA) | Map renders correctly in all three projections                                                                                            | M    |
| Projection switch            | Switching projections re-renders map | 1. Switch between LCC (3978) and WM (3857) using the projection selector                                                      | Map re-renders correctly each time; note: EPSG:3573 has no default basemap so switch is not available for it                              | M    |
| Layer rendering after switch | Layers survive projection switch     | 1. Load layers<br>2. Switch projection                                                                                        | All loaded layers re-render correctly after switch; see also [08 — Layers](08-layers.md#layer-type-edge-cases) for type-specific behavior | M    |

## North Pole & North Arrow

| Test                            | Description                            | Steps                                                           | Expected Result                                      | Auto |
| ------------------------------- | -------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------- | ---- |
| 3978 — North pole visible       | Pole icon shown when visible           | 1. In LCC, zoom out fully                                       | North pole icon is visible (not the arrow)           | M    |
| 3978 — Arrow on zoom in         | Arrow appears when pole exits viewport | 1. In LCC, zoom in until the north pole is outside the viewport | North arrow appears pointing toward the pole         | M    |
| 3978 — Pole returns on zoom out | Pole icon reappears                    | 1. Zoom back out in LCC                                         | North pole icon reappears; arrow disappears          | M    |
| 3857 — No north pole            | WM cannot display pole                 | 1. Load map in Web Mercator                                     | North pole is never shown                            | C    |
| 3857 — Arrow always up          | Arrow points up without rotation       | 1. In WM without rotation, check north arrow                    | Arrow points up (or is hidden if north is always up) | C    |
| 3573 — No north pole or arrow   | Pole is center of projection           | 1. Load map in North Pole LAEA                                  | Neither north pole icon nor arrow is displayed       | C    |

## Map Rotation

| Test                 | Description                  | Steps                                             | Expected Result                                                                                                     | Auto |
| -------------------- | ---------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---- |
| LCC rotation         | North arrow follows rotation | 1. Rotate the map in LCC                          | North arrow updates direction correctly                                                                             | M    |
| WM rotation          | North arrow follows rotation | 1. Rotate the map in WM                           | North arrow updates direction correctly                                                                             | M    |
| Rotation reset       | Reset returns to default     | 1. Rotate the map<br>2. Reset rotation to 0°      | Map returns to its default orientation                                                                              | M    |
| Fix North (LCC only) | Fix North adjusts rotation   | 1. In LCC, rotate the map<br>2. Click "Fix North" | Map adjusts rotation so north is up in the current view (not necessarily 0° — depends on map center and projection) | M    |

## Map Interaction

| Test              | Description                    | Steps                                     | Expected Result                          | Auto |
| ----------------- | ------------------------------ | ----------------------------------------- | ---------------------------------------- | ---- |
| Pan               | Click-drag panning             | 1. Click and drag the map                 | Smooth panning                           | M    |
| Zoom with scroll  | Scroll wheel zoom              | 1. Use scroll wheel to zoom in/out        | Smooth zoom transitions                  | M    |
| Zoom with buttons | Navbar zoom buttons            | 1. Use the zoom +/- buttons in the navbar | Map zooms in/out                         | M    |
| Pinch zoom        | Touch device zoom              | 1. (Touch devices) Pinch to zoom          | Correct zoom behavior                    | M    |
| Double-click zoom | Double-click centers and zooms | 1. Double-click on the map                | Map zooms in centered at the click point | M    |

## Static Map

| Test           | Description             | Steps                                                                               | Expected Result                   | Auto |
| -------------- | ----------------------- | ----------------------------------------------------------------------------------- | --------------------------------- | ---- |
| No interaction | Static map blocks input | 1. Load a static map config (`interaction: 'static'`)<br>2. Try panning and zooming | No panning or zooming is possible | C    |
