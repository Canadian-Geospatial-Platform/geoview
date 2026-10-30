# 17e — Package Drawer

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-17e-drawer.html](https://canadian-geospatial-platform.github.io/geoview/public/rt-17e-drawer.html) — Map 1 (drawer plugin in navbar, drawing tools).
>
> **Navigator config:** `demos/15-package-drawer.json`

Drawing tools plugin for creating and editing geometries on the map.

Config: `configs/navigator/demos/15-package-drawer.json`

## Drawing Geometries

| Test            | Description                     | Steps                                                 | Expected Result                            | Auto |
| --------------- | ------------------------------- | ----------------------------------------------------- | ------------------------------------------ | ---- |
| Activate draw   | Draw mode activates from navbar | 1. Click the Draw button in the navbar                | Draw mode activates                        | M    |
| Drawing guidance | Every geometry has guidance | 1. Select each geometry type<br>2. Check mouse and keyboard hints in EN/FR<br>3. Place the first coordinate of Circle, Rectangle, and Star, then complete or cancel | Each type has appropriate instructions; two-step hints advance and reset on completion/cancellation; no measurement wording appears | M |
| Draw Point      | Point geometry created on click | 1. Select Point geometry type<br>2. Click the map     | A point is created on the map              | M    |
| Draw LineString | LineString renders correctly    | 1. Select LineString<br>2. Draw a line on the map     | Line renders correctly                     | M    |
| Draw Polygon    | Polygon closes and renders      | 1. Select Polygon<br>2. Draw a polygon on the map     | Polygon closes and renders correctly       | M    |
| Draw Rectangle  | Rectangle created on the map    | 1. Select Rectangle<br>2. Draw a rectangle on the map | Rectangle is created                       | M    |
| Draw Circle     | Circle created on the map       | 1. Select Circle<br>2. Draw a circle on the map       | Circle is created                          | M    |
| Draw Star       | Star shape created              | 1. Select Star geometry<br>2. Click the map           | A star shape is created                    | M    |
| Draw Text       | Text can be placed on map       | 1. Select Text<br>2. Click the map                    | Text can be placed at the clicked location | M    |
| Stop draw mode  | Drawing mode deactivates        | 1. Click Draw again to stop                           | Drawing mode deactivates                   | M    |

## Editing & Tools

| Test         | Description                                    | Steps                                                | Expected Result                                     | Auto |
| ------------ | ---------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------- | ---- |
| Edit mode    | Existing geometries become editable            | 1. Toggle Edit mode                                  | Existing geometries become editable (move, reshape) | M    |
| Details suppression | Drawing/editing clicks do not query layers | 1. Start drawing and switch geometry types<br>2. Switch to Edit and click the map<br>3. Stop editing and click a queryable layer | No Details query or click marker appears during drawing/editing; normal querying resumes after stopping | M |
| Editing guidance | Editing instructions follow the input mode | 1. Activate Edit<br>2. Switch between mouse and keyboard navigation in EN/FR<br>3. Stop editing or switch tools | A hint explains selection and handle editing; it clears or changes when editing stops | M |
| Snap         | Drawn geometries snap to nearby features       | 1. Toggle Snap<br>2. Draw near an existing feature   | Drawn geometries snap to nearby features/vertices   | M    |
| Undo / Redo  | Undo reverts, Redo restores                    | 1. Draw a geometry<br>2. Click Undo<br>3. Click Redo | Undo reverts the action; Redo restores it           | M    |
| Measurements | Length/area measurements display on geometries | 1. Toggle Measurements                               | Length/area measurements display on geometries      | M    |
| Clear all    | All drawings are removed                       | 1. Draw multiple geometries<br>2. Click Clear        | All drawings are removed                            | M    |

## Style

| Test         | Description                             | Steps                                                          | Expected Result                       | Auto |
| ------------ | --------------------------------------- | -------------------------------------------------------------- | ------------------------------------- | ---- |
| Fill color   | New geometries use updated fill color   | 1. Change fill color via the Style panel<br>2. Draw a geometry | New geometries use the updated fill   | M    |
| Stroke color | New geometries use updated stroke color | 1. Change stroke color<br>2. Draw a geometry                   | New geometries use the updated stroke | M    |
| Stroke width | Line thickness updates                  | 1. Change stroke width<br>2. Draw a geometry                   | Line thickness updates                | M    |

## Export / Import

| Test              | Description                        | Steps                                                 | Expected Result              | Auto |
| ----------------- | ---------------------------------- | ----------------------------------------------------- | ---------------------------- | ---- |
| Download drawings | GeoJSON file is saved              | 1. Draw geometries<br>2. Click Download               | A GeoJSON file is saved      | M    |
| Upload drawings   | Geometries from file appear on map | 1. Click Upload<br>2. Load a previously exported file | Geometries appear on the map | M    |

## Config Options

| Test             | Description                              | Steps                                                                    | Expected Result                                      | Auto |
| ---------------- | ---------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------- | ---- |
| Custom geomTypes | Only configured geometry types available | 1. Load a config with a subset of `geomTypes`                            | Only the configured geometry types are in the picker | C    |
| hideMeasurements | Measurements hidden by default           | 1. Load a config with `hideMeasurements: true`                           | Measurements are hidden by default                   | C    |
| Custom style     | Drawings use configured style            | 1. Load a config with custom `style` (fill/stroke)<br>2. Draw a geometry | Drawings use the configured style                    | C    |

## Keyboard Shortcuts

Shortcuts are toggled on/off with the `` ` `` (backtick) key or the Shortcuts toolbar button.

| Test                | Description                           | Steps                                                                 | Expected Result                              | Auto |
| ------------------- | ------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------- | ---- |
| Toggle shortcuts    | Shortcuts help activates              | 1. Press `` ` `` to enable optional shortcuts                         | Shortcuts help dialog or indicator activates | M    |
| D — Toggle Draw     | Draw mode toggles on/off              | 1. Press `D`                                                          | Draw mode toggles on/off                     | M    |
| E — Toggle Edit     | Edit mode toggles on/off              | 1. Press `E`                                                          | Edit mode toggles on/off                     | M    |
| G — Cycle Geometry  | Geometry type cycles forward/backward | 1. Press `G` to cycle forward<br>2. Press `Shift+G` to cycle backward | Geometry type cycles through available types | M    |
| S — Style Menu      | Style menu opens                      | 1. Press `S`                                                          | Style menu opens                             | M    |
| M — Measurements    | Measurements toggle on/off            | 1. Press `M`                                                          | Measurements toggle on/off                   | M    |
| N — Snapping        | Snapping toggles on/off               | 1. Press `N`                                                          | Snapping toggles on/off                      | M    |
| Ctrl+Z — Undo       | Last action is undone                 | 1. Add sketch points and press `Ctrl+Z`, then Backspace<br>2. Finish a drawing and undo it<br>3. Repeat with focus in text, number, and editable text controls | Sketch points are removed before completed drawing history; editable controls retain native undo and Backspace behavior | M    |
| Ctrl+Shift+Z — Redo | Undone action is restored             | 1. Press `Ctrl+Shift+Z`                                               | Undone action is restored                    | M    |
| Shift+S — Download  | Drawings are downloaded               | 1. Press `Shift+S`                                                    | Drawings are downloaded                      | M    |
| Shift+O — Upload    | Upload dialog opens                   | 1. Press `Shift+O`                                                    | Upload dialog opens                          | M    |
| Shift+C — Clear all | All drawings are cleared              | 1. Press `Shift+C`                                                    | All drawings are cleared                     | M    |
| Escape — Exit mode  | Exits current mode                    | 1. Press `Escape` while editing/transforming<br>2. Place the first coordinate of Circle, Rectangle, or Star and press Escape<br>3. Start another shape<br>4. Repeat while measuring<br>5. While drawing a Line or Circle with the crosshair, press Escape to cancel, then Escape again | Editing selection or pending coordinate is cleared; two-step guidance resets and the next shape starts normally; drawer does not intercept measurement cancellation; the first Escape keeps focus on the map and the second returns focus to the Toggle Drawing button | M    |

## Projection Switch

| Test                 | Description                                   | Steps                                                              | Expected Result                                                 | Auto |
| -------------------- | --------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------- | ---- |
| Switch with drawings | Drawings reproject correctly                  | 1. Draw geometries<br>2. Switch projection                         | All drawings reproject correctly and remain in correct location | M    |
| Switch while drawing | In-progress drawing handles switch gracefully | 1. Start drawing a geometry (mid-draw)<br>2. Switch projection     | No crash; geometry is either preserved or reset cleanly         | M    |
| Switch while editing | Edit state handles switch gracefully          | 1. Enter Edit mode on an existing geometry<br>2. Switch projection | Edit state handles the switch gracefully                        | M    |
