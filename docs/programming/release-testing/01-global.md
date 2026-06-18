# 01 — Global

Cross-cutting tests that apply to all panels and the viewer shell.

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-01-global.html](../../packages/geoview-core/public/templates/release-testing/rt-01-global.html) — Map 1 (EN, shared, all panels, includes a bad layer for notifications), Map 2 (FR, no share, for two-map and language tests).

## Full Screen

| Test                | Description                             | Steps                                                                                                                                                          | Expected Result                                         | Auto |
| ------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ---- |
| Panel full screen   | Footer bar panel expands to fill viewer | 1. On Map 1, open each footer bar panel (Legend, Layers, Data Table, Details, Guide)<br>2. Click the full screen button<br>3. Press ESC or click again to exit | Panel expands to fill the viewer; ESC exits full screen | C    |
| Viewer full screen  | Entire map fills browser window         | 1. On Map 1, click the viewer full screen button (in navbar)<br>2. Exit with ESC                                                                               | Map + footer bar fills the browser window               | C    |
| Footer bar resizing | Resize handle reflows content           | 1. On Map 1, drag the footer bar resize handle up and down                                                                                                     | Content reflows correctly in all panels                 | M    |

> Fullscreen navbar button also tested in [05 — Navbar](05-navbar.md#full-screen).

## Panel Shortcuts

| Test                 | Description                            | Steps                                                                                                       | Expected Result                                | Auto |
| -------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---- |
| Details → Chart      | Cross-panel shortcut to Geochart       | 1. On Map 1, open Details panel<br>2. Select a layer with geochart data<br>3. Click the chart shortcut icon | Geochart panel opens for that layer            | M    |
| Legend → Layers      | Shortcut from legend to layer settings | 1. On Map 1, in Legend panel, click the layer settings shortcut                                             | Layers panel opens with correct layer selected | M    |
| Layers → Time Slider | Shortcut to time slider                | 1. On Map 1, in Layers panel, click the time slider shortcut on a time-aware layer                          | Time Slider panel opens for that layer         | M    |
| Layers → Data Table  | Shortcut to data table                 | 1. On Map 1, in Layers panel, click the data table shortcut                                                 | Data Table panel opens for that layer          | M    |
| Disabled shortcuts   | Config-disabled shortcuts hidden       | 1. On Map 1, check a layer with data table disabled via config                                              | Table shortcut is disabled / not shown         | C    |

## Navigation Focus Shortcuts

| Test                      | Description                         | Steps                                                                             | Expected Result                                 | Auto |
| ------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------- | ---- |
| App bar → Map focus       | Focus moves to map from app bar     | 1. On Map 1, press the app bar or map info bar                                    | Keyboard focus moves to the map                 | M    |
| Footer bar → Footer focus | Focus moves to footer panel         | 1. On Map 1, press the footer bar                                                 | Keyboard focus moves to the active footer panel | M    |
| Tab cycling               | Keyboard Tab navigates all elements | 1. On Map 1, use keyboard Tab to cycle through interactive elements in each panel | All interactive elements receive focus in order | M    |

## Guide Access

| Test                  | Description                            | Steps                                                                      | Expected Result                            | Auto |
| --------------------- | -------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------ | ---- |
| Guide from Legend     | Guide opens from Legend panel          | 1. On Map 1, open the Guide from the Legend panel                          | Guide opens and content loads              | M    |
| Guide from Layers     | Guide opens from Layers panel          | 1. On Map 1, open the Guide from the Layers panel                          | Guide opens and content loads              | M    |
| Guide from Data Table | Guide opens from Data Table panel      | 1. On Map 1, open the Guide from the Data Table panel                      | Guide opens and content loads              | M    |
| Guide from Details    | Guide opens from Details panel         | 1. On Map 1, open the Guide from the Details panel                         | Guide opens and content loads              | M    |
| Guide persistence     | Guide stays open across panel switches | 1. On Map 1, open any panel<br>2. Open Guide<br>3. Switch to another panel | Guide stays open (or reopens consistently) | M    |

## Cross-Panel Layer Visibility

| Test            | Description                            | Steps                                                                                                            | Expected Result                                                                   | Auto |
| --------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---- |
| Visibility sync | Hiding layer propagates to all panels  | 1. On Map 1, turn off visibility of a layer in the Layers panel<br>2. Check Legend, Data Table, Details, and Map | Legend icon greyed out; Data Table empty; Details not queryable; Map layer hidden | C    |
| Visibility on   | Showing layer propagates to all panels | 1. Turn the layer back on<br>2. Check all panels                                                                 | Layer reappears in Legend, Data Table, Details, and Map                           | C    |

## All Global Settings

> Tested in [18 — Global Settings](18-global-settings.md). That file covers individual global settings (coord info, unsymbolized features, sublayer removal, disabled types, theme, highlight color, service URLs) against `configs/navigator/demos/19-global-settings.json`.

## Geolocator / Search

The geolocator is an app bar tab providing place-name search with geocoding.

| Test                  | Description                     | Steps                                                                         | Expected Result                                                                  | Auto |
| --------------------- | ------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---- |
| Search by name        | Geocoding by city name          | 1. On Map 1, open the Geolocator tab<br>2. Type a city name (e.g., "Toronto") | Results appear in dropdown with province/country labels                          | M    |
| Search by postal code | Geocoding by postal code        | 1. Type a Canadian postal code (e.g., "K1A 0B1")                              | Normalizes input and returns a result                                            | M    |
| Search by coordinates | Geocoding by lat/lon            | 1. Type decimal coordinates (e.g., "45.5,-73.5")                              | Coordinate result is added to the list                                           | M    |
| Click result zooms    | Result selection zooms map      | 1. Click a search result                                                      | Map pans and zooms to the location's bounding box                                | M    |
| Minimum characters    | No search under 3 chars         | 1. Type fewer than 3 characters                                               | No search is triggered                                                           | C    |
| Loading indicator     | Spinner during search           | 1. Trigger a search and observe                                               | Loading spinner appears while searching                                          | M    |
| No results            | Graceful empty state            | 1. Search for gibberish text                                                  | "No results" message is displayed                                                | M    |
| Keyboard navigation   | Arrow keys navigate results     | 1. Use arrow keys to navigate result list<br>2. Press Enter to select         | Selection zooms map                                                              | M    |
| Filter by province    | Province filter narrows results | 1. Type a search term<br>2. Select a province filter from the dropdown        | Results are filtered to only show matches within the selected province           | M    |
| Filter by type        | Type filter narrows results     | 1. Type a search term<br>2. Select a type filter (e.g., city, lake, river)    | Results are filtered to only show matches of the selected type                   | M    |
| Language switch       | Results update on lang change   | 1. Switch language while results are displayed                                | Results update to the new language; filter values (provinces, types) also update | M    |

## Share URL

The share button (app bar) encodes map state into a URL. Requires `data-shared` attribute on the map div.

| Test                    | Description                      | Steps                                                           | Expected Result                                                  | Auto |
| ----------------------- | -------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------- | ---- |
| Share button visible    | Button shown when shared enabled | 1. On Map 1 (has `data-shared`), verify share button in app bar | Share button appears in the app bar                              | C    |
| Share dialog opens      | Dialog with URL appears          | 1. Click the share button                                       | Dialog opens with a readonly URL                                 | M    |
| URL contains state      | URL encodes map state params     | 1. Click share<br>2. Inspect the URL                            | URL includes `p=`, `z=`, `c=`, `b=` parameters                   | C    |
| URL contains layers     | URL includes geocore UUIDs       | 1. Click share<br>2. Inspect `keys=` param                      | `keys=` includes valid geocore UUIDs from loaded layers          | C    |
| Copy to clipboard       | Copy button works                | 1. Click the copy button                                        | URL is copied to the clipboard                                   | M    |
| Restore from URL        | Shared URL restores state        | 1. Open the shared URL in a new tab                             | Map loads with correct projection, zoom, center, basemap, layers | C    |
| Share without attribute | Button hidden when not shared    | 1. On Map 2 (no `data-shared`), check for share button          | Share button is hidden                                           | C    |

## Notifications Panel

The notifications panel (app bar icon with badge) shows persistent message history. Two API paths exist:

- **Message** (`show*`) → snackbar popup + notification panel entry
- **Notification** (`addNotification*`) → notification panel entry only (no snackbar)

Use the buttons above Map 1 to test both paths.

| Test               | Description                   | Steps                                                                                                     | Expected Result                                                    | Auto |
| ------------------ | ----------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---- |
| Badge count        | Badge shows error count       | 1. On Map 1, check notification badge (bad layer generates error on load)                                 | Notification badge shows a count                                   | C    |
| Panel opens        | Click icon opens panel        | 1. Click the notifications icon in the app bar                                                            | Panel opens with listed notifications                              | M    |
| Message types      | Correct icons per type        | 1. Click each "Message" button (Success, Info, Warning, Error)<br>2. Open the notifications panel         | Correct icons: success=green, error=red, warning=orange, info=blue | M    |
| Snackbar appears   | Transient popup shown         | 1. Click a "Message" button                                                                               | Snackbar popup appears at the bottom and auto-dismisses            | M    |
| Notification only  | No snackbar for silent notif  | 1. Click a "Notification only" button<br>2. Verify no snackbar appears<br>3. Open the notifications panel | No snackbar shown; entry appears in notifications panel            | M    |
| Stacking           | Repeated messages stack       | 1. Click the same button multiple times                                                                   | Repetition count badge shown (no duplicates)                       | C    |
| Remove individual  | Single notification removable | 1. Click the X on a notification                                                                          | Notification removed, count updates                                | M    |
| Remove all         | Bulk removal works            | 1. Click "Remove All"                                                                                     | List clears and button disables                                    | M    |
| Persistence        | Notifications survive close   | 1. Close and reopen the panel                                                                             | Notifications are still listed                                     | C    |
| Multi-map snackbar | Snackbar shows on correct map | 1. On this page (Map 1 + Map 2), trigger a snackbar on Map 1<br>2. Trigger a snackbar on Map 2            | Each snackbar appears on its own map, not on the other             | M    |

## Footer Bar Resize (full screen mode only)

| Test             | Description                | Steps                                                                  | Expected Result                              | Auto |
| ---------------- | -------------------------- | ---------------------------------------------------------------------- | -------------------------------------------- | ---- |
| Resize button    | Resize popper opens        | 1. On Map 1, click the resize button (height icon) near the footer bar | Resize popper opens                          | M    |
| Drag to 50%      | Slider sets footer height  | 1. Drag the slider to 50%                                              | Footer panel takes ~50% of the viewer height | M    |
| Snap to marks    | Slider snaps to positions  | 1. Drag near 35%, 50%, or 100%                                         | Slider snaps to the exact mark               | M    |
| Keyboard control | Arrow keys control slider  | 1. Use arrow keys on the slider                                        | Slider snaps between marks (35, 50, 100)     | M    |
| Close popper     | Popper dismisses correctly | 1. Press Escape or click outside                                       | Popper closes                                | M    |

## Language Switching

| Test                | Description                   | Steps                                                                     | Expected Result                                                 | Auto |
| ------------------- | ----------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------- | ---- |
| Switch EN → FR      | UI updates to French          | 1. On Map 1, switch language to French                                    | All UI text (buttons, labels, tabs, tooltips) updates to French | M    |
| Switch FR → EN      | UI updates to English         | 1. Switch back to English                                                 | All UI text updates to English                                  | M    |
| Layer names update  | GeoCore names follow language | 1. Switch language with GeoCore layers loaded (Map 1 has a GeoCore layer) | Layer names update to the new language                          | C    |
| Date formats update | Dates follow locale           | 1. Switch language<br>2. Check time slider and details panel              | Date displays use the new locale format                         | M    |

## Two-Map Shortcuts

| Test                  | Description                  | Steps                                                                                                   | Expected Result                                              | Auto |
| --------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ---- |
| Correct map targeting | Shortcuts target correct map | 1. On this page (has Map 1 + Map 2)<br>2. Use shortcuts (data table, layers) from each map's footer bar | Shortcut navigates to the correct map's panel, not the other | M    |
