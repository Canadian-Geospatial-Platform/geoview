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

| Test                     | Description                              | Steps                                                                                                                                         | Expected Result                                                                                       | Auto |
| ------------------------ | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---- |
| Fullscreen toggle        | Enter and exit fullscreen                | 1. On Map 1, click the fullscreen button<br>2. Click again (or press ESC) to exit                                                             | Viewer goes fullscreen on first click, exits on second click or ESC                                   | M    |
| Fullscreen view restored | Same view after exit without interaction | 1. On Map 1, note the center and zoom<br>2. Enter fullscreen, do not touch the map, exit with the button<br>3. Repeat step 2 exiting with ESC | Center and zoom are exactly the same as before entering fullscreen, for both the button and ESC exits | M    |
| Fullscreen view kept     | User changes kept after exit             | 1. On Map 1, enter fullscreen<br>2. Pan and zoom the map<br>3. Exit fullscreen (button or ESC)                                                | The map keeps the center and zoom set in fullscreen (no zoom out to fit the fullscreen extent)        | M    |

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
| Measurement guidance   | On-map hint matches input mode | 1. Enable measurement<br>2. Verify the start hint appears<br>3. Add a point and switch keyboard navigation on/off | Visible translated instructions update for mouse or crosshair use without duplicating live-region announcements | M |
| Finish, cancel, undo   | Measurement gestures work  | 1. Draw a line and double-click to finish<br>2. Draw a polygon and click its first point to close<br>3. Start another sketch and press Esc<br>4. With a screen reader, add three points, press Ctrl+Z, then Backspace, add another point, and undo down to zero<br>5. Repeat for lines/polygons with mouse/crosshair in EN/FR<br>6. With the crosshair and the map focused, press Esc during a sketch, then Esc again; repeat with focus on another control and in fullscreen | Lines/polygons finish as documented; Esc cancels the sketch; each undo key removes only the last point; consecutive additions and successful undos announce the current point count, excluding cursor/closing coordinates; pointer movement does not announce a point; the first Esc keeps focus on the map, the second moves focus to the Measure button; Esc does not move focus from another control, and in fullscreen it only exits fullscreen | M |
| Clear measurements     | Geometries are removed     | 1. Clear the measurements                                                     | All measurement geometries are removed from the map      | M    |
| Deactivate measurement | Tool stops creating points | 1. Deactivate the measurement tool<br>2. Click on the map                     | Clicking on the map no longer creates measurement points | M    |
| Exclusive drawing tools | Measure and drawer do not compete | 1. Enable Measure, then drawer drawing<br>2. Enable Measure again<br>3. Repeat with drawer editing | The newly activated tool stops the previous tool; button/switch states and hints match the active tool; completed geometries remain | M |
| Keyboard measuring     | Crosshair shortcuts work in embedded/fullscreen | 1. Embed the viewer and enable keyboard navigation<br>2. Measure with Enter/Space and Shift+Enter<br>3. Repeat in fullscreen | Points use the visible crosshair; Enter/Space adds points and Shift+Enter finishes; in fullscreen Esc cancels and exits fullscreen | M |
| Fullscreen exit focus | Keyboard drawing and measuring continue | 1. Enable crosshair drawing or Measure<br>2. Enter fullscreen and focus the map<br>3. Exit using Esc, the fullscreen button, or the API<br>4. Press Enter without tabbing<br>5. Repeat with no tool active | Active keyboard drawing/measurement regains map focus and Enter adds a point; ordinary navigation does not force map focus | M |
| Ctrl+M while measuring | Map receives focus and panel closes | 1. Enable keyboard navigation<br>2. Use the keyboard to open the Measure panel and enable the tool<br>3. Press Ctrl+M, then immediately Enter<br>4. Repeat after reopening the panel, also waiting one second before Enter | The panel closes, actual focus stays on the map after focus-trap cleanup, and Enter adds a point instead of reopening the panel; measurement settings are preserved | M |
| Ctrl+M from app-bar popovers | About/Version and Notifications close | 1. Enable keyboard navigation<br>2. Open About/Version and press Ctrl+M<br>3. Repeat with Notifications<br>4. Press Enter immediately and after waiting one second | Each popover closes, focus stays on the map, and Enter does not reopen it; ordinary Escape closure still returns focus to its caller | M |
| Crosshair artwork alignment | Placed points match the visible crosshair center | 1. Measure with Enter and Space<br>2. Repeat with the map-info bar collapsed and expanded | Each placed vertex matches the intersection of the SVG crosshair lines, not merely the SVG element's bounding box | M |

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
