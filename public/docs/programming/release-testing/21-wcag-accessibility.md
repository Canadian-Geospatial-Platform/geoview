# 21 — WCAG Accessibility

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-21-wcag-accessibility.html](https://canadian-geospatial-platform.github.io/geoview/public/rt-21-wcag-accessibility.html) — Links to wcag.html test page and related release testing pages.

Keyboard navigation, focus management, screen reader support, and WCAG compliance testing.

Test page: `templates/tests/wcag.html`

---

## Skip Links

Three skip links are rendered (visually hidden, shown on focus).

| Test                  | Description                       | Steps                                                             | Expected Result                                                                      | Auto |
| --------------------- | --------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---- |
| Top skip link         | First skip link appears on Tab    | 1. Press Tab from outside the viewer                              | A "Skip after map element" link appears and is focusable                             | M    |
| Skip to main map link | Skip link jumps to map            | 1. Tab to the "Skip to main content - Map" link<br>2. Press Enter | Focus moves to the map and crosshair mode activates                                  | M    |
| Bottom skip link      | Skip link returns focus above map | 1. Tab past the footer bar                                        | A "Skip before map element" link appears; pressing Enter returns focus above the map | M    |

## WCAG Mode Dialog

When tabbing into GeoView for the first time, a dialog appears asking to enable keyboard navigation mode.

| Test                     | Description                      | Steps                                                  | Expected Result                                                 | Auto |
| ------------------------ | -------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------- | ---- |
| Dialog appears           | WCAG dialog shown on first entry | 1. Tab into the GeoView viewer from outside            | "Keyboard navigation" dialog appears                            | M    |
| Enable button            | Enables WCAG focus trap          | 1. Click "Enable"                                      | Focus is trapped within the viewer (WCAG mode active)           | M    |
| Skip button              | Bypasses viewer                  | 1. Click "Skip"                                        | Dialog closes; focus continues past the viewer without trapping | M    |
| Dialog does not reappear | One-time per session             | 1. After clicking "Enable" or "Skip", continue tabbing | Dialog does not reappear on subsequent entries                  | M    |

## Ctrl+Q Exit WCAG Mode

| Test                | Description                      | Steps                                                          | Expected Result                                         | Auto |
| ------------------- | -------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------- | ---- |
| Exit from map       | Ctrl+Q exits when focused on map | 1. With WCAG mode enabled and focus on the map, press `Ctrl+Q` | Focus trap disabled; focus returns to the top skip link | M    |
| Exit from panel     | Ctrl+Q exits from footer panel   | 1. With focus inside a footer bar panel, press `Ctrl+Q`        | WCAG mode exits; focus escapes the viewer               | M    |
| Exit from app bar   | Ctrl+Q exits from app bar        | 1. With focus on an app bar button, press `Ctrl+Q`             | WCAG mode exits                                         | M    |
| Re-enter after exit | Dialog reappears after Ctrl+Q    | 1. After Ctrl+Q, Tab back into the viewer                      | WCAG dialog appears again to re-enable                  | M    |

## Map Focus & Crosshair

| Test                            | Description                   | Steps                                                             | Expected Result                                                                     | Auto |
| ------------------------------- | ----------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---- |
| Ctrl+M activates crosshair      | Crosshair shown at center     | 1. Focus the map (via Tab or skip link)<br>2. Press `Ctrl+M`      | Crosshair graphic appears at the map center                                         | M    |
| First focus is skip-to-map link | Skip link before map canvas   | 1. Enter the map area via Tab                                     | First focusable element is the skip-to-map link (not the map canvas directly)       | M    |
| Arrow keys pan                  | Map pans with arrows          | 1. With crosshair active, press arrow keys                        | Map pans in the arrow direction (default 128px step)                                | M    |
| Shift+Up increases step         | Coarser movement              | 1. With crosshair active, press Shift+ArrowUp                     | Pan step increases by 10px (for faster large moves)                                 | M    |
| Shift+Down decreases step       | Finer movement                | 1. Press Shift+ArrowDown                                          | Pan step decreases by 10px (minimum 10px, for precise positioning over features)    | M    |
| Enter queries features          | Feature info at crosshair     | 1. Position crosshair over a feature<br>2. Press Enter            | Details panel opens with feature info at that location                              | M    |
| Static map — no crosshair       | Crosshair disabled on static  | 1. Load a static map (`interaction: 'static'`)<br>2. Press Ctrl+M | Crosshair does NOT activate; map element has `tabIndex=-1` (not keyboard-focusable) | M    |
| Static map — viewer controls    | Viewer still accessible       | 1. On same static map, Tab through controls                       | App bar (notifications, about) and map info (attribution, scale) are focusable      | M    |
| Rotation                        | Crosshair works with rotation | 1. Rotate the map<br>2. Use crosshair                             | Crosshair and panning work correctly with rotation applied                          | M    |
| Click deactivates               | Mouse click removes crosshair | 1. With crosshair active, click the map with the mouse            | Crosshair deactivates                                                               | M    |

## Tab Order

Natural tab order (with WCAG mode):

```
Host page → Top skip link → App Bar → Map → Nav Bar → Footer Bar → Bottom skip link → Host page continues
```

| Test                        | Description                              | Steps                                             | Expected Result                                                                                           | Auto |
| --------------------------- | ---------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---- |
| Full tab cycle              | Forward tab order correct                | 1. Press Tab repeatedly through the viewer        | Focus moves in the documented order above                                                                 | M    |
| Shift+Tab reverses          | Reverse tab order correct                | 1. Press Shift+Tab                                | Focus moves in reverse order                                                                              | M    |
| Static map limited controls | Static map only exposes non-map controls | 1. Load a static map<br>2. Tab through the viewer | Only notification, about, copyright, and scale controls are focusable; Ctrl+M does not activate crosshair | M    |

## Panel Focus Trapping (WCAG Mode)

When WCAG mode is enabled and a panel opens, focus should be trapped within it.

### Footer Bar Panels

| Test                    | Description                      | Steps                                                                            | Expected Result                                          | Auto |
| ----------------------- | -------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------- | ---- |
| Legend panel trap       | Focus trapped in Legend          | 1. Open Legend panel<br>2. Press Tab repeatedly                                  | Tab cycles only through elements inside the Legend panel | M    |
| Layers panel trap       | Focus trapped in Layers          | 1. Open Layers panel<br>2. Press Tab                                             | Focus is trapped within                                  | M    |
| Data Table panel trap   | Focus trapped in Data Table      | 1. Open Data Table<br>2. Press Tab                                               | Focus is trapped within                                  | M    |
| Details panel trap      | Focus trapped in Details         | 1. Open Details<br>2. Press Tab                                                  | Focus is trapped within                                  | M    |
| Time Slider panel trap  | Focus trapped in Time Slider     | 1. Open Time Slider<br>2. Press Tab                                              | Focus is trapped within                                  | M    |
| Chart panel trap        | Focus trapped in Chart           | 1. Open Chart<br>2. Press Tab                                                    | Focus is trapped within                                  | M    |
| Exit button in footer   | Exit returns focus to tabs       | 1. With focus trapped in a footer panel, locate the "Exit" button<br>2. Click it | Focus returns to the tab selector                        | M    |
| Escape from right panel | First Esc exits right panel trap | 1. With focus in the right panel (layer details/settings)<br>2. Press Escape     | Focus moves to the left layer list                       | M    |
| Escape from layer list  | Second Esc exits panel           | 1. With focus on the left layer list<br>2. Press Escape                          | Focus returns to the footer bar tab                      | M    |

### App Bar Panels

| Test                            | Description                             | Steps                                           | Expected Result                                    | Auto |
| ------------------------------- | --------------------------------------- | ----------------------------------------------- | -------------------------------------------------- | ---- |
| Geolocator panel trap           | Focus trapped in Geolocator             | 1. Open Geolocator from app bar<br>2. Press Tab | Focus is trapped within the search panel           | M    |
| About panel trap                | Focus trapped in About                  | 1. Open About panel<br>2. Press Tab             | Focus is trapped                                   | M    |
| AOI panel trap                  | Focus trapped in AOI                    | 1. Open Area of Interest panel<br>2. Press Tab  | Focus is trapped                                   | M    |
| STAC Browser panel trap         | Focus trapped in STAC                   | 1. Open STAC Browser panel<br>2. Press Tab      | Focus is trapped                                   | M    |
| Custom Legend panel trap        | Focus trapped in Custom Legend          | 1. Open Custom Legend panel<br>2. Press Tab     | Focus is trapped                                   | M    |
| Legend panel trap (app bar)     | Focus trapped in Legend via app bar     | 1. Open Legend from app bar<br>2. Press Tab     | Focus is trapped                                   | M    |
| Details panel trap (app bar)    | Focus trapped in Details via app bar    | 1. Open Details from app bar<br>2. Press Tab    | Focus is trapped                                   | M    |
| Layers panel trap (app bar)     | Focus trapped in Layers via app bar     | 1. Open Layers from app bar<br>2. Press Tab     | Focus is trapped                                   | M    |
| Data Table panel trap (app bar) | Focus trapped in Data Table via app bar | 1. Open Data Table from app bar<br>2. Press Tab | Focus is trapped                                   | M    |
| Escape closes app bar panel     | Escape returns to app bar button        | 1. Press Escape                                 | Focus returns to the app bar button that opened it | M    |

## Panel Full Screen Mode Focus

| Test                               | Description                        | Steps                                                                     | Expected Result                                                  | Auto |
| ---------------------------------- | ---------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---- |
| Enter fullscreen                   | Focus remains in panel             | 1. Open Legend panel<br>2. Click fullscreen button                        | Focus remains within the panel content                           | M    |
| Tab inside fullscreen              | Focus stays within fullscreen      | 1. Tab through elements in the fullscreen panel                           | Focus stays within the fullscreen dialog                         | M    |
| Escape from fullscreen right panel | First Esc exits fullscreen         | 1. With right panel in fullscreen and focus inside it<br>2. Press Escape  | Exits fullscreen; focus returns to the right panel (normal size) | M    |
| Escape to layer list               | Second Esc moves to layer list     | 1. After exiting fullscreen, press Escape again                           | Focus moves to the left layer list                               | M    |
| Escape to tab                      | Third Esc exits panel              | 1. With focus on the layer list, press Escape again                       | Focus returns to the footer bar tab                              | M    |
| Footer panel fullscreen            | Data Table focusable in fullscreen | 1. Open Data Table in fullscreen<br>2. Tab through columns, filters, rows | Focus stays within                                               | M    |
| Layers panel fullscreen            | Layers controls tabbable           | 1. Open Layers in fullscreen<br>2. Tab through elements                   | All layer list items and right-panel controls are tabbable       | M    |

## Guide Panel Keyboard Navigation

| Test                     | Description                  | Steps                                                      | Expected Result                                     | Auto |
| ------------------------ | ---------------------------- | ---------------------------------------------------------- | --------------------------------------------------- | ---- |
| Open Guide               | Guide opens via keyboard     | 1. Use Tab to reach the Guide button/tab<br>2. Press Enter | Guide opens                                         | M    |
| Search field focus       | Search input accessible      | 1. Tab to the search field<br>2. Type a keyword            | Results are announced (aria-live region)            | M    |
| Navigate search results  | Focus moves to result        | 1. Press Enter or ArrowDown in search field                | Focus moves to the first matching section           | M    |
| Expand/collapse sections | Sections toggle via keyboard | 1. Focus a section heading<br>2. Press Enter or Space      | Section expands/collapses                           | M    |
| Previous/Next match      | Cycle through matches        | 1. Use Previous/Next buttons                               | Focus cycles through all matches                    | M    |
| Clear search             | Reset returns to input       | 1. Press the Clear button                                  | Search resets and focus returns to the search input | M    |
| Guide in Legend          | Guide works from Legend      | 1. Open Guide from Legend panel                            | Keyboard navigation works                           | M    |
| Guide in Layers          | Guide works from Layers      | 1. Open Guide from Layers panel                            | Keyboard navigation works                           | M    |
| Guide in Data Table      | Guide works from Data Table  | 1. Open Guide from Data Table                              | Keyboard navigation works                           | M    |
| Guide in Details         | Guide works from Details     | 1. Open Guide from Details                                 | Keyboard navigation works                           | M    |
| Guide in fullscreen      | Guide works in fullscreen    | 1. Open a panel in fullscreen<br>2. Open Guide             | Guide is keyboard-navigable inside fullscreen       | M    |

## Screen Reader & ARIA

| Test                           | Description                       | Steps                                                                                                            | Expected Result                                                  | Auto |
| ------------------------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---- |
| Aria-labels on icon buttons    | All icon buttons labeled          | 1. Spot-check icon buttons (zoom, home, basemap, projection, fullscreen, export)                                 | Each has a meaningful `aria-label`                               | M    |
| Aria-live announcements        | Announcements spoken              | 1. Perform actions that trigger announcements (layer loaded, error, search results)<br>2. Enable a screen reader | Announcements are spoken                                         | M    |
| Role="toolbar"                 | Bars announce as toolbars         | 1. Focus the nav bar and app bar with screen reader                                                              | Announced as toolbars                                            | M    |
| Role="dialog"                  | Modals announce as dialogs        | 1. Open export modal, WCAG dialog, or version dialog                                                             | Announced as dialogs                                             | M    |
| Role="status"                  | Live regions use correct role     | 1. Trigger measurement results or search count                                                                   | Uses `role="status"`                                             | M    |
| Aria-expanded states           | Groups toggle aria-expanded       | 1. Expand/collapse layer groups                                                                                  | `aria-expanded` toggles between true/false                       | M    |
| Aria-pressed states            | Toggle buttons use aria-pressed   | 1. Toggle visibility buttons                                                                                     | `aria-pressed` reflects the state                                | M    |
| Aria-disabled on panel buttons | Disabled buttons remain focusable | 1. Check reorder up/down at boundaries, prev/next at first/last feature, zoom-to-layer with no extent            | Uses `aria-disabled="true"` (not `disabled`) to remain focusable | M    |

## Contrast & Visual Indicators

| Test                          | Description                | Steps                                                  | Expected Result                                          | Auto |
| ----------------------------- | -------------------------- | ------------------------------------------------------ | -------------------------------------------------------- | ---- |
| Focus indicators visible      | Focus ring on all elements | 1. Tab through all elements                            | Every focused element has a visible focus ring/outline   | M    |
| Focus indicator in all themes | Focus visible in all theme | 1. Switch to to every theme<br>2. Tab through elements | Focus indicators are still visible (sufficient contrast) | M    |
| Color is not sole indicator   | Status uses icons/text too | 1. Check layer status changes (loaded/error/loading)   | Icons or text are used in addition to color              | M    |

## Multi-Map WCAG

| Test                      | Description                  | Steps                                                                                            | Expected Result                                                | Auto |
| ------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | ---- |
| Only one map in WCAG mode | Second map deactivates first | 1. With 2 maps on page, enable WCAG on the first map<br>2. Tab to the second map and enable WCAG | First map's WCAG mode deactivates (only one active at a time)  | M    |
| Ctrl+Q exits active map   | Exit and switch maps         | 1. With WCAG active on one map, press Ctrl+Q<br>2. Tab to the other map                          | WCAG exits; dialog appears on the other map to enable it there | M    |
