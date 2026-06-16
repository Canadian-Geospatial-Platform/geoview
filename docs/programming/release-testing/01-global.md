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

## Geolocator / Search

The geolocator is an app bar tab providing place-name search with geocoding.

- [ ] **Search by name** — Type a city name (e.g., "Toronto"). Verify results appear in dropdown with province/country labels.
- [ ] **Search by postal code** — Type a Canadian postal code (e.g., "K1A 0B1"). Verify it normalizes and returns a result.
- [ ] **Search by coordinates** — Type decimal coordinates (e.g., "45.5,-73.5"). Verify a coordinate result is added to the list.
- [ ] **Click result zooms** — Click a search result. Verify the map pans and zooms to that location's bounding box.
- [ ] **Minimum characters** — Type fewer than 3 characters. Verify no search is triggered.
- [ ] **Loading indicator** — While searching, verify a loading spinner appears.
- [ ] **No results** — Search for gibberish. Verify a "no results" message is displayed.
- [ ] **Keyboard navigation** — Use arrow keys to navigate the result list. Press Enter to select. Verify selection zooms map.
- [ ] **Language switch** — Switch language while results are displayed. Verify results update to the new language.

## Share URL

The share button (app bar) encodes map state into a URL. Requires `data-shared="true"` on the map div.

- [ ] **Share button visible** — Verify the share button appears in the app bar when `data-shared="true"`.
- [ ] **Share dialog opens** — Click the share button. Verify a dialog opens with a readonly URL.
- [ ] **URL contains state** — Verify the URL includes `p=` (projection), `z=` (zoom), `c=` (center lon,lat), `b=` (basemap).
- [ ] **URL contains layers** — Verify `keys=` parameter includes valid geocore UUIDs from loaded layers.
- [ ] **Copy to clipboard** — Click the copy button. Verify the URL is copied to the clipboard.
- [ ] **Restore from URL** — Open the shared URL in a new tab. Verify the map loads with the correct projection, zoom, center, basemap, and layers.
- [ ] **Share without shared attribute** — Load a map without `data-shared="true"`. Verify the share button is hidden.

## Notifications Panel

The notifications panel (app bar icon with badge) shows persistent message history.

- [ ] **Badge count** — Generate errors (e.g., load a bad layer). Verify the notification badge shows a count.
- [ ] **Panel opens** — Click the notifications icon. Verify the panel opens with listed notifications.
- [ ] **Message types** — Verify correct icons display for each type (success=green, error=red, warning=orange, info=blue).
- [ ] **Stacking** — Generate the same error multiple times. Verify the notification shows a repetition count badge (not duplicate entries).
- [ ] **Remove individual** — Click the X on a notification. Verify it is removed and the count updates.
- [ ] **Remove all** — Click "Remove All". Verify the list clears and the button disables.
- [ ] **Persistence** — Close and reopen the panel. Verify notifications are still there (not lost on close).

## Footer Bar Resize (in full screen mode only)

- [ ] **Resize button** — Click the resize button (height icon) near the footer bar. Verify the resize popper opens.
- [ ] **Drag to 50%** — Drag the slider to 50%. Verify the footer panel takes approximately 50% of the viewer height.
- [ ] **Snap to marks** — Drag near 35%, 50%, or 100%. Verify the slider snaps to the exact mark.
- [ ] **Keyboard control** — Use arrow keys on the slider. Verify it snaps between marks (35, 50, 100).
- [ ] **Close popper** — Press Escape or click outside. Verify the popper closes.

## Language Switching

- [ ] **Switch EN → FR** — Switch language to French. Verify all UI text (buttons, labels, tabs, tooltips) updates to French.
- [ ] **Switch FR → EN** — Switch back to English. Verify all UI text updates to English.
- [ ] **Layer names update** — For GeoCore layers, verify layer names update to the new language after switching.
- [ ] **Date formats update** — Verify date displays in the time slider and details panel use the new locale format.

## Two-Map Shortcuts

- [ ] **Correct map targeting** — With 2 maps on the page, use shortcuts (chart from details, time slider from layers, data table from layers). Verify the shortcut navigates to the correct map's panel, not the other map's.
