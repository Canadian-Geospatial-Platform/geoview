# 17e — Package Drawer

Drawing tools plugin for creating and editing geometries on the map.

Config: `configs/navigator/demos/15-package-drawer.json`

## Drawing Geometries

- [ ] **Activate draw mode** — Click the Draw button in the navbar. Verify draw mode activates.
- [ ] **Draw Point** — Select Point geometry type. Click the map. Verify a point is created.
- [ ] **Draw LineString** — Select LineString. Draw a line on the map. Verify it renders correctly.
- [ ] **Draw Polygon** — Select Polygon. Draw a polygon. Verify it closes and renders correctly.
- [ ] **Draw Rectangle** — Select Rectangle. Draw a rectangle on the map.
- [ ] **Draw Circle** — Select Circle. Draw a circle on the map.
- [ ] **Draw Star** — Select Star geometry. Verify a star shape is created.
- [ ] **Draw Text** — Select Text. Click the map. Verify text can be placed.
- [ ] **Stop draw mode** — Click Draw again to stop. Verify drawing mode deactivates.

## Editing & Tools

- [ ] **Edit mode** — Toggle Edit mode. Verify existing geometries become editable (move, reshape).
- [ ] **Snap** — Toggle Snap. Verify drawn geometries snap to nearby features/vertices.
- [ ] **Undo / Redo** — Draw a geometry, click Undo. Verify it reverts. Click Redo. Verify it restores.
- [ ] **Measurements** — Toggle Measurements. Verify length/area measurements display on geometries.
- [ ] **Clear all** — Draw multiple geometries. Click Clear. Verify all drawings are removed.

## Style

- [ ] **Fill color** — Change fill color via the Style panel. Verify new geometries use the updated fill.
- [ ] **Stroke color** — Change stroke color. Verify new geometries use the updated stroke.
- [ ] **Stroke width** — Change stroke width. Verify line thickness updates.

## Export / Import

- [ ] **Download drawings** — Draw geometries, click Download. Verify a file is saved (GeoJSON).
- [ ] **Upload drawings** — Click Upload and load a previously exported file. Verify geometries appear on the map.

## Config Options

- [ ] **Custom geomTypes** — Load a config with a subset of `geomTypes`. Verify only the configured geometry types are available in the picker.
- [ ] **hideMeasurements** — Load a config with `hideMeasurements: true`. Verify measurements are hidden by default.
- [ ] **Custom style** — Load a config with custom `style` (fill/stroke). Verify drawings use the configured style.

## Keyboard Shortcuts

Shortcuts are toggled on/off with the `` ` `` (backtick) key or the Shortcuts toolbar button.

- [ ] **Toggle shortcuts** — Press `` ` `` to enable optional shortcuts. Verify the shortcuts help dialog or indicator activates.
- [ ] **`D` — Toggle Draw** — Press `D`. Verify draw mode toggles on/off.
- [ ] **`E` — Toggle Edit** — Press `E`. Verify edit mode toggles on/off.
- [ ] **`G` — Cycle Geometry** — Press `G` to cycle geometry type forward, `Shift+G` to cycle backward.
- [ ] **`S` — Style Menu** — Press `S`. Verify the style menu opens.
- [ ] **`M` — Measurements** — Press `M`. Verify measurements toggle on/off.
- [ ] **`N` — Snapping** — Press `N`. Verify snapping toggles on/off.
- [ ] **`Ctrl+Z` — Undo** — Press `Ctrl+Z`. Verify the last action is undone.
- [ ] **`Ctrl+Shift+Z` — Redo** — Press `Ctrl+Shift+Z`. Verify the undone action is restored.
- [ ] **`Shift+S` — Download** — Press `Shift+S`. Verify drawings are downloaded.
- [ ] **`Shift+O` — Upload** — Press `Shift+O`. Verify the upload dialog opens.
- [ ] **`Shift+C` — Clear all** — Press `Shift+C`. Verify all drawings are cleared.
- [ ] **`Escape` — Exit mode** — Press `Escape` while editing/transforming. Verify it exits the current mode.

## Projection Switch

- [ ] **Switch projection with drawings** — Draw geometries, then switch projection. Verify all drawings reproject correctly and remain in the correct geographic location.
- [ ] **Switch projection while drawing** — Start drawing a geometry (mid-draw), switch projection. Verify the in-progress drawing handles the switch gracefully (no crash, geometry is either preserved or reset cleanly).
- [ ] **Switch projection while editing** — Enter Edit mode on an existing geometry, then switch projection. Verify the edit state handles the switch gracefully.
