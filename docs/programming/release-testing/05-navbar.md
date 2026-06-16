# 05 — Navigation Bar

Navbar controls and buttons. The navbar supports 9 button types: `zoom`, `rotation`, `fullscreen`, `home`, `location`, `basemap-select`, `projection`, `measurement`, `drawer`.

Reference config with all buttons (except drawer): `sandbox.html` or `configs/navigator/layers/all-layers.json`

## Zoom Controls

- [ ] **Zoom in button** — Click zoom in. Verify map zooms in one level.
- [ ] **Zoom out button** — Click zoom out. Verify map zooms out one level.
- [ ] **Zoom limits** — Zoom to min/max limits. Verify buttons disable at boundaries.

## Rotation

Detailed rotation and north arrow tests are in [02-map.md](02-map.md#map-rotation).

- [ ] **Rotation control** — Verify the rotation control appears in the navbar and rotates the map.
- [ ] **Rotation value display** — Verify the rotation value is shown in the map info bar tooltip.

## Home / Initial Extent

- [ ] **Home button** — Pan/zoom away from the initial view. Click the Home button. Verify the map returns to the initial extent and zoom.

## Geolocation

- [ ] **Geolocation button** — If available, click the geolocation button. Verify a prompt appears (or the map centers on the user's location if permission is granted).

## Full Screen

- [ ] **Fullscreen toggle** — Click the fullscreen button. Verify the viewer goes fullscreen. Click again (or press ESC) to exit.

## Basemap Select

Detailed basemap tests are in [04-basemap.md](04-basemap.md).

- [ ] **Basemap selector opens** — Verify the basemap selector button opens the basemap panel in the navbar.

## Projection Switch

Detailed projection tests are in [02-map.md](02-map.md#projections) and [13-projection.md](13-projection.md).

- [ ] **Projection button** — Verify the projection button appears and switches between LCC and WM.

## Measurement Tool

- [ ] **Measurement button** — Verify the measurement button appears in the navbar.
- [ ] **Distance measurement** — Activate the measurement tool. Click points on the map to draw a line. Verify the distance is displayed.
- [ ] **Area measurement** — Switch to area mode. Draw a polygon. Verify the area is displayed.
- [ ] **Clear measurements** — Clear the measurements. Verify all measurement geometries are removed from the map.
- [ ] **Deactivate measurement** — Deactivate the tool. Verify clicking on the map no longer creates measurement points.

## Drawer (Plugin)

> Full drawer testing in [17e — Package Drawer](17e-package-drawer.md). Only verify the navbar button here:

- [ ] **Drawer button** — Verify the drawer button appears in the navbar when the drawer plugin is loaded.
- [ ] **Open drawer** — Click the drawer button. Verify the drawing toolbar opens.

## Navbar Visibility

- [ ] **Custom navbar** — Load a config with limited navbar controls (e.g., only zoom and rotation). Verify only those controls appear.
- [ ] **Empty navbar** — Load a config with an empty `navBar` array. Verify only zoom and rotation appear (defaults).
- [ ] **All buttons** — Load `sandbox.html` or `all-layers.json`. Verify all 8 core buttons render correctly.
