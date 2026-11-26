# 21 — WCAG Accessibility

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-21-wcag-accessibility.html](https://canadian-geospatial-platform.github.io/geoview/public/rt-21-wcag-accessibility.html) — Links to wcag.html test page and related release testing pages.

Keyboard navigation, focus management, screen reader support, and WCAG compliance testing.

Test page: `templates/tests/wcag.html`

Crosshair/Details regression rows use [tests.html](https://canadian-geospatial-platform.github.io/geoview/public/tests.html),
**Group 6 — A11Y and UX, map13**, which has app-bar Details/Layers, map popovers, a footer panel, and local polygon features.

> **Details configuration:** If a configuration lists Details in both bars, the footer copy is removed and only the app-bar Details panel is used.

Enable **Settings → Keyboard navigation** for manual checks. Rows marked `A` are covered by that suite;
the remaining rows still require manual verification.

---

## Skip Links

Dynamic maps render three skip links (visually hidden, shown on focus); static maps render two because they have no map-interaction link.

| Test                  | Description                       | Steps                                                             | Expected Result                                                                      | Auto |
| --------------------- | --------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---- |
| Top skip link         | First skip link appears on Tab    | 1. Press Tab from outside the viewer                              | A "Skip after map element" link appears and is focusable                             | M    |
| Skip to main map link | Skip link jumps to map            | 1. Tab to the "Skip to main content - Map" link<br>2. Press Enter | Focus moves to the map and crosshair mode activates                                  | M    |
| Bottom skip link      | Skip link returns focus above map | 1. Tab past the footer bar                                        | A "Skip before map element" link appears; pressing Enter returns focus above the map | M    |

## WCAG Mode Dialog

Tabbing inward from an outer skip link opens a dialog asking to enable keyboard navigation mode.

| Test                     | Description                      | Steps                                                  | Expected Result                                                 | Auto |
| ------------------------ | -------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------- | ---- |
| Dialog appears           | Inward Tab opens the dialog      | 1. Focus the top skip link<br>2. Press Tab             | "Keyboard navigation" dialog appears with focus on Enable       | M    |
| Enable button            | Enables WCAG focus trap          | 1. On MapEN (English) in `templates/tests/wcag.html`, Tab inward from the top skip link and activate "Enable"<br>2. Repeat on RT-02 Map 4 | Dynamic map: focus starts on the top "Skip to main content - Map" link without activating the crosshair; Enter focuses the map and activates the crosshair. Static map: focus moves to the viewer shell without activating the crosshair | M    |
| Skip button              | Bypasses viewer in either direction | 1. Open from the top link and activate Skip<br>2. Repeat from the bottom link | Forward Skip focuses that viewer's bottom link; reverse Skip focuses its top link | M |
| Dialog can reappear      | Boundary entry is repeatable     | 1. Dismiss the dialog<br>2. Tab inward from an outer skip link again | The same viewer's dialog reopens | M |

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
| Ctrl+M activates crosshair      | Focus map without toggling    | 1. On map13, focus a viewer control with no panel open<br>2. Press `Ctrl+M` twice | Map stays focused with the crosshair active; no feature query is triggered | A    |
| Crosshair graphic at map centre | Visual placement and rendering | 1. On map13, focus a viewer control<br>2. Press `Ctrl+M`<br>3. Inspect the map | Crosshair graphic is visible at the centre of the map viewport | M |
| Ctrl+M closes map controls      | Preserve footer, not triggers | 1. On map13, open app-bar Details with its feature sub-panel, a map popover, and a footer panel<br>2. Press `Ctrl+M`<br>3. Repeat with Layers and the other map popovers | Entire app-bar panel and popover close without reclaiming focus; footer stays open; map is focused and crosshair active | A |
| Ctrl+M respects modal dialogs   | Focus-owned modal stays open  | 1. Open Export on map13, then repeat with the layer data table modal and feature detail modal<br>2. Focus a modal control<br>3. Press `Ctrl+M` | Modal stays open and focused; crosshair stays inactive | M |
| Ctrl+M in Export dropdown       | Portaled menu stays focused   | 1. On map13, open Export and expand its format dropdown<br>2. Focus a format option<br>3. Press `Ctrl+M` | Export and its dropdown stay open; focus stays in the dropdown; crosshair stays inactive | A |
| Ctrl+M in Share                 | Preserve existing Share focus | 1. On map13, open Share<br>2. Press `Ctrl+M` | Share stays open and focused; crosshair stays inactive | A |
| First focus is skip-to-map link | Skip link before map canvas   | 1. Enter the map area via Tab                                     | First focusable element is the skip-to-map link (not the map canvas directly)       | M    |
| Arrow keys pan                  | Map pans with arrows          | 1. With crosshair active, press arrow keys                        | Map pans in the arrow direction (default 128px step)                                | M    |
| Shift+Up increases step         | Coarser movement              | 1. With crosshair active, press Shift+ArrowUp                     | Pan step increases by 10px (for faster large moves)                                 | M    |
| Shift+Down decreases step       | Finer movement                | 1. Press Shift+ArrowDown                                          | Pan step decreases by 10px (minimum 10px, for precise positioning over features)    | M    |
| Wheel zoom requires map focus   | Focus the map before wheel zoom | 1. On dynamic MapEN (English) in `templates/tests/wcag.html`, enable keyboard navigation and hover over the map without focusing it<br>2. Scroll the wheel<br>3. Click the map or Tab to focus it, then scroll again | The unfocused wheel scroll does not zoom the map; after the map receives focus, the wheel zooms it and keyboard navigation remains enabled | M |
| Enter queries features          | Main Close focus after loading | 1. On map13, use `Ctrl+M`, position the crosshair over a polygon, and press Enter<br>2. Wait for results and deferred focus<br>3. Press Esc once<br>4. Repeat over polygons, over empty space, and after closing the sub-panel at the same coordinates | Feature sub-panel (or guide for no features) opens; main Details Close stays focused, never sub-panel Close; one Esc closes Details and restores map focus with the crosshair active | A |
| Static map — no crosshair       | Crosshair disabled on static  | 1. Load a static map (`interaction: 'static'`)<br>2. Press Ctrl+M | Crosshair does NOT activate; map element has `tabIndex=-1` (not keyboard-focusable) | M    |
| Static map — viewer controls    | Viewer still accessible       | 1. On RT-02 Map 4, Tab through controls                       | Notifications, About, attribution, and scale are focusable; no Settings button is rendered      | M    |
| Rotation                        | Crosshair works with rotation | 1. Rotate the map<br>2. Use crosshair                             | Crosshair and panning work correctly with rotation applied                          | M    |
| Click with Details              | Details focus removes crosshair | 1. On RT-10 Details Map 1 (`templates/release-testing/rt-10-details.html`), enable keyboard navigation and press `Ctrl+M`<br>2. With the crosshair active, click a feature on the map with the mouse<br>3. Wait for Details to open | Details opens, focus moves into its panel, and the crosshair is removed | M |
| Click without Details           | Mouse click preserves crosshair | 1. On RT-02 Map 1 (`templates/release-testing/rt-02-map.html`), which has no Details in either bar, enable keyboard navigation and press `Ctrl+M`<br>2. With the crosshair active, click the map with the mouse | No Details panel opens; the crosshair stays active | M |
| Hover preserves crosshair       | Keyboard mode prevents hover focus changes | 1. On RT-10 Details Map 1, enable keyboard navigation and press `Ctrl+M` with the mouse outside the map<br>2. With the crosshair active, move the mouse onto and across the map without clicking<br>3. Repeat on RT-02 Map 1 | Map focus, keyboard navigation, and the crosshair stay active; hovering does not open Details. This is intended by the keyboard-mode hover guard | M |

## Tab Order

Use the two dynamic viewers in Group 6 of `tests.html` for the native entry and wrapping checks.

| Test                        | Description                              | Steps                                             | Expected Result                                                                                           | Auto |
| --------------------------- | ---------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---- |
| Forward entry               | Native Tab from the host page            | 1. Focus **Before the test viewers**<br>2. Press Tab twice | The first Tab focuses map13's top link; the second opens only map13's prompt | M |
| Reverse entry               | Native Shift+Tab from the host page      | 1. Focus **After the test viewers**<br>2. Press Shift+Tab twice | The first Shift+Tab focuses map14's bottom link; the second opens only map14's prompt | M |
| Forward wrap                | Native Tab stays in the enabled shell    | 1. Enable on map13 with no panels open<br>2. Press Tab past the last control inside the viewer | Focus wraps to map13's **Skip to main content - Map** link without leaving the viewer | M |
| Reverse wrap                | Native Shift+Tab stays in the enabled shell | 1. Enable on map14 with no panels open<br>2. From **Skip to main content - Map**, press Shift+Tab | Focus wraps to the last control inside map14 without leaving the viewer | M |
| Static map limited controls | Static map only exposes non-map controls | 1. On RT-02 Map 4, Tab through the viewer | Only the two skip links, Notifications, About, copyright, and scale controls are focusable; Settings is absent and Ctrl+M does not activate the crosshair | M |

## Panel Focus Trapping (WCAG Mode)

Keyboard-owned panels retain Tab/Shift+Tab boundaries. Non-modal panels permit deliberate pointer interaction outside them.

### Non-modal Panel Pointer Focus

| Test                         | Description                                      | Steps                                                                                                                           | Expected Result                                                                    | Auto |
| ---------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---- |
| Pointer focus outside panel  | Pointer moves focus without disabling the mode  | 1. On MapEN (English) in `templates/tests/wcag.html`, enable keyboard navigation and focus inside app-bar Legend (open it if necessary)<br>2. Click the Data Table footer tab | Focus stays on the clicked footer tab; keyboard navigation remains enabled and focus is not pulled back into Legend | M |

### Footer Bar Panels

| Test                    | Description                      | Steps                                                                            | Expected Result                                          | Auto |
| ----------------------- | -------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------- | ---- |
| Legend panel trap       | Focus trapped in Legend          | 1. Open Legend panel<br>2. Press Tab repeatedly                                  | Tab cycles only through elements inside the Legend panel | M    |
| Layers panel trap       | Focus trapped in Layers          | 1. Open Layers panel<br>2. Press Tab                                             | Focus is trapped within                                  | M    |
| Data Table panel trap   | Focus trapped in Data Table      | 1. Open Data Table<br>2. Press Tab                                               | Focus is trapped within                                  | M    |
| Details panel trap      | Focus trapped in Details         | 1. Open Details<br>2. Press Tab                                                  | Focus is trapped within                                  | M    |
| Time Slider panel trap  | Focus trapped in Time Slider     | 1. Open Time Slider<br>2. Press Tab                                              | Focus is trapped within                                  | M    |
| Chart panel trap        | Focus trapped in Chart           | 1. Open Chart<br>2. Press Tab                                                    | Focus is trapped within                                  | M    |
| Exit button in footer   | Exit returns focus to tabs and reopening restores Exit focus | 1. Open Data Table with the keyboard and verify focus enters its "Exit" button<br>2. Activate Exit and verify focus returns to the tab selector<br>3. Collapse and reopen Data Table with the keyboard | Focus returns to the tab selector after Exit; reopening places focus on the Exit button | A |
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
| Details panel trap (app bar)    | Focus trapped in app-bar-only Details   | 1. On RT-10 Details Map 1, open Details from the app bar<br>2. Press Tab | Focus is trapped within the app-bar Details panel | M |
| Layers panel trap (app bar)     | Focus trapped in Layers via app bar     | 1. Open Layers from app bar<br>2. Press Tab     | Focus is trapped                                   | M    |
| Data Table panel trap (app bar) | Focus trapped in Data Table via app bar | 1. Open Data Table from app bar<br>2. Press Tab | Focus is trapped                                   | M    |
| Escape closes app bar panel     | Ordinary dismissal returns to trigger   | 1. Open a panel without a crosshair query<br>2. Press Escape from its main level | Focus returns to the app-bar button that opened it | M |
| Notifications popover focus    | Explicit dismissal restores the bell; click-away preserves the target | 1. On MapEN (English) in `templates/tests/wcag.html`, open Notifications and press Escape; repeat with its Close button<br>2. Reopen Notifications and click the Data Table footer tab | Escape and Close return focus to the Notifications button; click-away closes the popover without stealing focus from the clicked tab | M |
| Details nested Escape           | Close the focused level first | 1. Query a polygon on map13 with the crosshair<br>2. Move focus into feature navigation and switch features<br>3. Press Esc<br>4. Press Esc again | First Esc closes only the feature sub-panel and focuses its layer item; second closes Details and restores map focus with the crosshair active | A |
| Details internal navigation     | Keep the crosshair return | 1. Query a polygon on map13<br>2. Navigate within Details using Tab/arrows and switch results<br>3. Move the mouse without clicking<br>4. Escape through the focused levels | Internal navigation and mouse movement preserve the main-panel Esc return to the crosshair | A |
| Details focus leaves            | Do not enforce inner focus | 1. Query a polygon on map13 and focus feature navigation<br>2. Move focus to the Layers app-bar button<br>3. Press Esc | Focus stays on Layers, is not pulled back into Details, and does not return to the crosshair | A |
| Details pointer cancellation    | A click inside cancels return | 1. Query a polygon on map13<br>2. Click Next feature inside Details<br>3. Escape through both levels | Sub-panel closes to its layer item; main-panel Esc does not return to the crosshair | A |
| Details ordinary closure        | Preserve Close and mouse opening | 1. Query with the crosshair and activate main Close<br>2. Open Details by clicking a polygon and dismiss it with Esc | Close retains its ordinary focus behavior; mouse-opened Details does not gain an Esc return to the crosshair | A |
| Details remembered sub-panel    | Reopen without a new query | 1. On map13, click a polygon and select a feature<br>2. Close/reopen Details using its app-bar button<br>3. Repeat after Ctrl+M dismissal | Same feature sub-panel, layer, and selected feature reopen | A |
| Details sub-panel Tab boundary  | Keep forward/reverse wrapping | 1. On map13, open the Details feature sub-panel<br>2. Tab past its last control<br>3. Shift+Tab before its first control | Tab and Shift+Tab wrap within the feature sub-panel as before | M |
| Details window blur             | Cancel return when window loses focus | 1. Query a polygon on map13<br>2. Switch to another window and back<br>3. Escape through the focused levels | Details closes normally without restoring the crosshair | M |

## Panel Full Screen Mode Focus

| Test                               | Description                        | Steps                                                                                                                   | Expected Result                                                  | Auto |
| ---------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---- |
| Enter fullscreen                   | Focus remains in panel             | 1. Open Legend panel<br>2. Click fullscreen button                                                                      | Focus remains within the panel content                           | M    |
| Tab inside fullscreen              | Focus stays within fullscreen      | 1. Tab through elements in the fullscreen panel                                                                         | Focus stays within the fullscreen dialog                         | M    |
| Escape from fullscreen right panel | First Esc exits fullscreen         | 1. With right panel in fullscreen and focus inside it<br>2. Press Escape                                                | Exits fullscreen; focus returns to the right panel (normal size) | M    |
| Escape to layer list               | Second Esc moves to layer list     | 1. After exiting fullscreen, press Escape again                                                                         | Focus moves to the left layer list                               | M    |
| Escape to tab                      | Third Esc exits panel              | 1. With focus on the layer list, press Escape again                                                                     | Focus returns to the footer bar tab                              | M    |
| Footer panel fullscreen            | Data Table focusable in fullscreen | 1. Open Data Table in fullscreen<br>2. Tab through columns, filters, rows                                               | Focus stays within                                               | M    |
| Layers panel fullscreen            | Layers controls tabbable           | 1. Open Layers in fullscreen<br>2. Tab through elements                                                                 | All layer list items and right-panel controls are tabbable       | M    |
| navBar exit: footer tab            | Preserve surviving focus           | 1. Enter navBar fullscreen<br>2. Open a footer panel and focus its tab<br>3. Press Esc                                  | Focus stays on that tab                                          | M    |
| navBar exit: Resize                | Restore lost focus                 | 1. Enter navBar fullscreen<br>2. Open a footer panel and Resize<br>3. Press Esc                                         | Focus lands on the fullscreen button                             | M    |
| Resize click-away                  | Preserve clicked focus             | 1. Enter navBar fullscreen<br>2. Open a footer panel and Resize<br>3. Click another visible control (e.g. a footer tab) | Resize closes; focus is not pulled back to Resize                | M    |

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
| Settings keyboard switch       | Switch name, role, state, and keyboard operation | 1. On dynamic MapEN (English) in `templates/tests/wcag.html`, open Settings and focus "Keyboard navigation"<br>2. Use Space to turn it on and off<br>3. Inspect with a screen reader | Announced as "Keyboard navigation", a switch, with on/off state; Space toggles it while Settings stays open and focused | M |
| Aria-labels on icon buttons    | All icon buttons labeled          | 1. Spot-check icon buttons (zoom, home, basemap, projection, fullscreen, export)                                 | Each has a meaningful `aria-label`                               | M    |
| Aria-live announcements        | Announcements spoken              | 1. Perform actions that trigger announcements (layer loaded, error, search results)<br>2. Enable a screen reader | Announcements are spoken                                         | M    |
| Role="toolbar"                 | Bars announce as toolbars         | 1. Focus the nav bar and app bar with screen reader                                                              | Announced as toolbars                                            | M    |
| Role="dialog"                  | Modals announce as dialogs        | 1. Open export modal, WCAG dialog, or version dialog                                                             | Announced as dialogs                                             | M    |
| Role="status"                  | Live regions use correct role     | 1. Trigger measurement results or search count                                                                   | Uses `role="status"`                                             | M    |
| Aria-expanded states           | Groups toggle aria-expanded       | 1. Expand/collapse layer groups                                                                                  | `aria-expanded` toggles between true/false                       | M    |
| Aria-pressed states            | Toggle buttons use aria-pressed   | 1. Toggle visibility buttons                                                                                     | `aria-pressed` reflects the state                                | M    |
| Aria-disabled on panel buttons | Disabled buttons remain focusable | 1. Check reorder up/down at boundaries, prev/next at first/last feature, zoom-to-layer with no extent            | Uses `aria-disabled="true"` (not `disabled`) to remain focusable | M    |

## Contrast & Visual Indicators

Verify using live keyboard navigation, computed styles and written observations; no screenshots
or visual snapshots are required. Allow focus transitions to settle before inspecting styles.
Existing app-bar/nav-bar ring suppression is a separately tracked accessibility/design exception,
not a passing result for the universal focus-indicator check.

| Test                          | Description                | Steps                                                | Expected Result                                          | Auto |
| ----------------------------- | -------------------------- | ---------------------------------------------------- | -------------------------------------------------------- | ---- |
| Focus indicators visible      | Focus ring on all elements | 1. Tab through all elements                          | Every focused element has a visible focus ring/outline   | M    |
| Focus indicator in all themes | Focus visible in all theme | 1. Switch to every theme<br>2. Tab through elements  | Focus indicators are still visible (sufficient contrast) | M    |
| Color is not sole indicator   | Status uses icons/text too | 1. Check layer status changes (loaded/error/loading) | Icons or text are used in addition to color              | M    |

## Multi-Map WCAG

| Test                      | Description                  | Steps                                                                                            | Expected Result                                                | Auto |
| ------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | ---- |
| Independent keyboard modes | Enabling a second viewer leaves the first enabled | 1. Enable on map13<br>2. Use map14's Settings to enable it<br>3. Inspect the Settings switch in each map | Both switches are on | M |
| Ctrl+Q exits the focused map | Exit only one viewer's mode | 1. Enable on both maps<br>2. Focus a control inside map14 and press Ctrl+Q | Focus moves to map14's top link; map14's mode turns off and map13's stays on | M |
