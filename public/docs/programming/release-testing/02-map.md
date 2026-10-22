# 02 — Map

Map rendering, projections, north pole, and north arrow.

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-02-map.html](https://canadian-geospatial-platform.github.io/geoview/public/rt-02-map.html) — Map 1 (LCC with projection switch + rotation + layer), Map 2 (WM), Map 3 (Circumpolar EPSG:3573), Map 4 (Static).

## Projections

| Test                         | Description                          | Steps                                                                | Expected Result                                                                                                   | Auto |
| ---------------------------- | ------------------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---- |
| 3 projections supported      | Each projection renders correctly    | 1. Check Map 1 (LCC), Map 2 (WM), Map 3 (LAEA)                       | Map renders correctly in all three projections                                                                    | C    |
| Projection switch            | Switching projections re-renders map | 1. On Map 1, switch between LCC and WM using the projection selector | Map re-renders correctly; EPSG:3573 has no default basemap so switch is not available for it                      | A    |
| Layer rendering after switch | Layers survive projection switch     | 1. On Map 1, switch projection                                       | Layer re-renders correctly; see also [08 — Layers](08-layers.md#layer-type-edge-cases) for type-specific behavior | M    |

## North Pole & North Arrow

| Test                            | Description                            | Steps                                                             | Expected Result                                      | Auto |
| ------------------------------- | -------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- | ---- |
| 3978 — North pole visible       | Pole icon shown when visible           | 1. On Map 1, zoom out fully                                       | North pole icon is visible (not the arrow)           | M    |
| 3978 — Arrow on zoom in         | Arrow appears when pole exits viewport | 1. On Map 1, zoom in until the north pole is outside the viewport | North arrow appears pointing toward the pole         | M    |
| 3978 — Pole returns on zoom out | Pole icon reappears                    | 1. Zoom back out on Map 1                                         | North pole icon reappears; arrow disappears          | M    |
| 3857 — No north pole            | WM cannot display pole                 | 1. Check Map 2                                                    | North pole is never shown                            | C    |
| 3857 — Arrow always up          | Arrow points up without rotation       | 1. On Map 2, check north arrow without rotation                   | Arrow points up (or is hidden if north is always up) | C    |
| 3573 — No north pole or arrow   | Pole is center of projection           | 1. Check Map 3                                                    | Neither north pole icon nor arrow is displayed       | C    |

## Map Rotation

| Test                 | Description                  | Steps                                                  | Expected Result                                                                                                     | Auto |
| -------------------- | ---------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ---- |
| LCC rotation         | North arrow follows rotation | 1. On Map 1, rotate the map                            | North arrow updates direction correctly                                                                             | A    |
| WM rotation          | North arrow follows rotation | 1. On Map 2, rotate the map                            | North arrow updates direction correctly                                                                             | C    |
| Rotation reset       | Reset returns to default     | 1. On Map 1, rotate the map<br>2. Reset rotation to 0° | Map returns to its default orientation                                                                              | C    |
| Fix North (LCC only) | Fix North adjusts rotation   | 1. On Map 1, rotate the map<br>2. Click "Fix North"    | Map adjusts rotation so north is up in the current view (not necessarily 0° — depends on map center and projection) | M    |

## Map Interaction

| Test                   | Description                    | Steps                                                                   | Expected Result                                                              | Auto |
| ---------------------- | ------------------------------ | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---- |
| Pan                    | Click-drag panning             | 1. On Map 1, click and drag                                             | Smooth panning                                                               | M    |
| Zoom with scroll       | Scroll wheel zoom              | 1. On Map 1, use scroll wheel to zoom in/out                            | Smooth zoom transitions                                                      | M    |
| Zoom with buttons      | Navbar zoom buttons            | 1. On Map 1, use the zoom +/- buttons in the navbar                     | Map zooms in/out                                                             | M    |
| Pinch zoom             | Touch device zoom              | 1. (Touch devices) Pinch to zoom on Map 1                               | Correct zoom behavior                                                        | M    |
| Double-click zoom      | Double-click centers and zooms | 1. Double-click on Map 1                                                | Map zooms in centered at the click point                                     | M    |
| Click marker alignment | Marker at pointer location     | 1. On Map 1, click on a feature<br>2. Observe the click marker position | Click marker icon appears exactly at the pointer click location (not offset) | M    |

## Static Map

| Test           | Description             | Steps                                         | Expected Result                   | Auto |
| -------------- | ----------------------- | --------------------------------------------- | --------------------------------- | ---- |
| No interaction | Static map blocks input | 1. On Map 4 (static), try panning and zooming | No panning or zooming is possible | C    |
