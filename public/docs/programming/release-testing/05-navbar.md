# 05 — Navigation Bar

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-05-navbar.html](https://canadian-geospatial-platform.github.io/geoview/public/rt-05-navbar.html) — Map 1 has all 9 navbar buttons, Map 2 has only zoom + rotation.

Navbar controls and buttons. The navbar supports 9 button types: `zoom`, `rotation`, `fullscreen`, `home`, `location`, `basemap-select`, `projection`, `measurement`, `drawer`.

Default navbar (when `navBar` is omitted from config): `["zoom", "rotation", "fullscreen", "home", "basemap-select"]`.

## Zoom Controls

| Test            | Description             | Steps                                  | Expected Result         | Auto |
| --------------- | ----------------------- | -------------------------------------- | ----------------------- | ---- |
| Zoom in button  | Map zooms in one level  | 1. On Map 1, click the zoom in button  | Map zooms in one level  | C    |
| Zoom out button | Map zooms out one level | 1. On Map 1, click the zoom out button | Map zooms out one level | C    |

## Rotation

> Detailed rotation and north arrow tests are in [02 — Map](02-map.md#map-rotation).

| Test                   | Description                      | Steps                                                                              | Expected Result                                                         | Auto |
| ---------------------- | -------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---- |
| Rotation control       | Rotation control rotates the map | 1. On Map 1, verify rotation control appears<br>2. Drag the rotation slider slowly | Map rotates continuously as the slider is dragged (not only on release) | C    |
| Rotation value display | Rotation shown in map info bar   | 1. Rotate Map 1                                                                    | Rotation value is shown in the map info bar tooltip                     | M    |

## Home / Initial Extent

| Test        | Description             | Steps                                                                        | Expected Result                                  | Auto |
| ----------- | ----------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------ | ---- |
| Home button | Returns to initial view | 1. On Map 1, pan and zoom away from initial view<br>2. Click the Home button | Map returns to the initial extent and zoom level | C    |

## Geolocation

| Test               | Description                  | Steps                                     | Expected Result                                                                          | Auto |
| ------------------ | ---------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------- | ---- |
| Geolocation button | Centers map on user location | 1. On Map 1, click the geolocation button | Browser prompt appears (or map centers on user's location if permission already granted) | M    |

## Full Screen

| Test              | Description               | Steps                                                                             | Expected Result                                                     | Auto |
| ----------------- | ------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---- |
| Fullscreen toggle | Enter and exit fullscreen | 1. On Map 1, click the fullscreen button<br>2. Click again (or press ESC) to exit | Viewer goes fullscreen on first click, exits on second click or ESC | M    |

## Basemap Select

> Detailed basemap tests are in [04 — Basemap](04-basemap.md).

| Test                   | Description                | Steps                                                        | Expected Result                   | Auto |
| ---------------------- | -------------------------- | ------------------------------------------------------------ | --------------------------------- | ---- |
| Basemap selector opens | Button opens basemap panel | 1. On Map 1, click the basemap selector button in the navbar | Basemap panel opens in the navbar | M    |

## Projection Switch

> Detailed projection tests are in [02 — Map](02-map.md#projections) and [13 — Projection](13-projection.md).

| Test              | Description                 | Steps                                                                              | Expected Result                                                | Auto |
| ----------------- | --------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---- |
| Projection button | Switches between LCC and WM | 1. On Map 1, verify the projection button appears<br>2. Click to switch projection | Projection switches between LCC (EPSG:3978) and WM (EPSG:3857) | C    |

## Measurement Tool

| Test                   | Description                | Steps                                                                         | Expected Result                                          | Auto |
| ---------------------- | -------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------- | ---- |
| Measurement button     | Button appears in navbar   | 1. On Map 1, verify measurement button appears                                | Measurement button appears in the navbar                 | C    |
| Distance measurement   | Line distance is displayed | 1. Activate the measurement tool<br>2. Click points on the map to draw a line | Distance is displayed along the line                     | M    |
| Area measurement       | Polygon area is displayed  | 1. Switch to area mode<br>2. Draw a polygon on the map                        | Area is displayed for the polygon                        | M    |
| Clear measurements     | Geometries are removed     | 1. Clear the measurements                                                     | All measurement geometries are removed from the map      | M    |
| Deactivate measurement | Tool stops creating points | 1. Deactivate the measurement tool<br>2. Click on the map                     | Clicking on the map no longer creates measurement points | M    |

## Drawer (Plugin)

> Full drawer testing in [17e — Package Drawer](17e-package-drawer.md). Only verify the navbar button here.

| Test          | Description                       | Steps                                     | Expected Result                     | Auto |
| ------------- | --------------------------------- | ----------------------------------------- | ----------------------------------- | ---- |
| Drawer button | Button appears when plugin loaded | 1. On Map 1, verify drawer button appears | Drawer button appears in the navbar | C    |
| Open drawer   | Drawing toolbar opens             | 1. Click the drawer button                | Drawing toolbar opens               | M    |

## Navbar Visibility

| Test          | Description                    | Steps                                                             | Expected Result                                      | Auto |
| ------------- | ------------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------- | ---- |
| Custom navbar | Only specified controls appear | 1. Check Map 2 (configured with `"navBar": ["zoom", "rotation"]`) | Only zoom and rotation controls appear in the navbar | C    |
| All buttons   | All core buttons render        | 1. Check Map 1 (configured with all 9 buttons)                    | All configured navbar buttons render correctly       | C    |
