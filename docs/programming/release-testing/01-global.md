# 01 — Global

Cross-cutting tests that apply to all panels and the viewer shell.

## Full Screen

- [ ] **Panel full screen** — Open each footer bar panel (Legend, Layers, Data Table, Details, Time Slider, Chart). Click the full screen button. Verify the panel expands to fill the viewer. Press ESC or click the button again to exit.
- [ ] **Viewer full screen** — Click the viewer full screen button. Verify the entire map + footer bar fills the browser window. Exit full screen with ESC.
- [ ] **Footer bar resizing** — Drag the footer bar resize handle up and down. Verify content reflows correctly in all panels.

## Panel Shortcuts

Test cross-panel navigation shortcuts. Config: `configs/navigator/layers/esri-dynamic.json`

- [ ] **Details → Chart** — Open Details panel, select a layer with geochart data. Click the chart shortcut icon. Verify the Geochart panel opens for that layer.
- [ ] **Legend → Layers** — In Legend panel, click the layer settings shortcut. Verify the Layers panel opens and the correct layer is selected.
- [ ] **Layers → Time Slider** — In Layers panel, click the time slider shortcut on a time-aware layer. Verify the Time Slider panel opens for that layer.
- [ ] **Layers → Data Table** — In Layers panel, click the data table shortcut. Verify the Data Table panel opens for that layer.
- [ ] **Disabled shortcuts** — Earthquake layer should have data table disabled via config. Verify the table shortcut is disabled / not shown.

## Navigation Focus Shortcuts

- [ ] **App bar → Map focus** — Press the app bar or map info bar. Verify keyboard focus moves to the map.
- [ ] **Footer bar → Footer focus** — Press the footer bar. Verify keyboard focus moves to the active footer panel.
- [ ] **Tab cycling** — Use keyboard Tab to cycle through interactive elements in each panel.

## Guide Access

- [ ] **Guide from Legend** — Open the Guide from the Legend panel. Verify it opens and content loads.
- [ ] **Guide from Layers** — Open the Guide from the Layers panel.
- [ ] **Guide from Data Table** — Open the Guide from the Data Table panel.
- [ ] **Guide from Details** — Open the Guide from the Details panel.
- [ ] **Guide persistence** — Open any panel, open Guide, switch to another panel. Verify the Guide stays open (or reopens consistently).

## Cross-Panel Layer Visibility

- [ ] **Visibility sync** — Turn off visibility of a layer in the Layers panel. Verify it is hidden in:
  - Legend panel (icon greyed out / removed)
  - Data Table (features not shown or table empty)
  - Details (features not queryable)
  - Map (layer not rendered)
- [ ] **Visibility on** — Turn the layer back on. Verify it reappears in all panels.

## All Global Settings

Config: `configs/navigator/demos/19-global-settings.json`

- [ ] **Load config** — Verify the map loads without errors with all global settings applied.
- [ ] **Verify each setting** — Walk through each global setting and confirm its effect on the map and panels.

## Two-Map Shortcuts

- [ ] **Correct map targeting** — With 2 maps on the page, use shortcuts (chart from details, time slider from layers, data table from layers). Verify the shortcut navigates to the correct map's panel, not the other map's.

---

## Issues Found

<!-- Record any issues below -->
