# 21 — WCAG Accessibility

Keyboard navigation, focus management, screen reader support, and WCAG compliance testing.

Test page: `templates/tests/wcag.html`

---

## Skip Links

Three skip links are rendered (visually hidden, shown on focus):

- [ ] **Top skip link** — Press Tab from outside the viewer. Verify a "Skip after map element" link appears and is focusable.
- [ ] **Skip to main map link** — Tab to the "Skip to main content - Map" link. Press Enter. Verify focus moves to the map and crosshair mode activates.
- [ ] **Bottom skip link** — Tab past the footer bar. Verify a "Skip before map element" link appears. Press Enter. Verify focus returns above the map.

## WCAG Mode Dialog

When tabbing into GeoView for the first time, a dialog appears asking to enable keyboard navigation mode.

- [ ] **Dialog appears** — Tab into the GeoView viewer from outside. Verify the "Keyboard navigation" dialog appears.
- [ ] **Enable button** — Click "Enable". Verify focus is trapped within the viewer (WCAG mode active).
- [ ] **Skip button** — Click "Skip". Verify the dialog closes and focus continues past the viewer without trapping.
- [ ] **Dialog does not reappear** — After clicking "Enable" or "Skip", continue tabbing. Verify the dialog does not reappear on subsequent entries.

## Ctrl+Q Exit WCAG Mode

- [ ] **Exit from map** — With WCAG mode enabled and focus on the map, press `Ctrl+Q`. Verify focus trap is disabled and focus returns to the top skip link.
- [ ] **Exit from panel** — With focus inside a footer bar panel, press `Ctrl+Q`. Verify WCAG mode exits and focus escapes the viewer.
- [ ] **Exit from app bar** — With focus on an app bar button, press `Ctrl+Q`. Verify WCAG mode exits.
- [ ] **Re-enter after exit** — After Ctrl+Q, Tab back into the viewer. Verify the WCAG dialog appears again to re-enable.

## Map Focus & Crosshair

- [ ] **Ctrl+M activates crosshair** — Focus the map (via Tab or skip link), press `Ctrl+M`. Verify the crosshair graphic appears at the map center.
- [ ] **Ctrl+M deactivates** — Press `Ctrl+M` again. Verify the crosshair disappears.
- [ ] **First focus is "Skip to main map" link** — When entering the map area via Tab, verify the first focusable element is the skip-to-map link (not the map canvas directly).
- [ ] **Arrow keys pan** — With crosshair active, press arrow keys. Verify the map pans.
- [ ] **Shift+Arrow increases pan distance** — Press Shift + arrow keys. Verify larger pan increments.
- [ ] **Shift+Arrow decreases pan distance** — Press Shift + opposite arrow. Verify the step size adjusts (accumulates with repeated Shift presses).
- [ ] **Enter queries features** — Position crosshair over a feature. Press Enter. Verify the Details panel opens with feature info at that location.
- [ ] **Static map — no crosshair** — Load a static map (`interaction: 'static'`). Verify Ctrl+M does NOT activate crosshair.
- [ ] **Rotation-aware** — Rotate the map, then activate crosshair. Verify the crosshair rotates with the map.
- [ ] **Click deactivates** — With crosshair active, click the map with the mouse. Verify the crosshair deactivates.

## Tab Order

Natural tab order (without WCAG mode):

```
Host page → Top skip link → App Bar → Map → Nav Bar → Footer Bar → Bottom skip link → Host page continues
```

- [ ] **Full tab cycle** — Press Tab repeatedly through the viewer. Verify focus moves in the order above.
- [ ] **Shift+Tab reverses** — Press Shift+Tab. Verify focus moves in reverse order.
- [ ] **Static map skipped** — For a static map, verify the map container is not focusable (tabIndex=-1).

## Panel Focus Trapping (WCAG Mode)

When WCAG mode is enabled and a panel opens, focus should be trapped within it.

### Footer Bar Panels

- [ ] **Legend panel trap** — Open Legend panel. Verify Tab cycles only through elements inside the Legend panel.
- [ ] **Layers panel trap** — Open Layers panel. Verify focus is trapped within.
- [ ] **Data Table panel trap** — Open Data Table. Verify focus is trapped within.
- [ ] **Details panel trap** — Open Details. Verify focus is trapped within.
- [ ] **Time Slider panel trap** — Open Time Slider. Verify focus is trapped within.
- [ ] **Chart panel trap** — Open Chart. Verify focus is trapped within.
- [ ] **Exit button in footer** — With focus trapped in a footer panel, verify an "Exit" button appears. Click it. Verify focus returns to the tab selector.
- [ ] **Escape closes panel** — Press Escape inside a trapped panel. Verify focus returns to the tab selector or originating button.

### App Bar Panels

- [ ] **Geolocator panel trap** — Open Geolocator from app bar. Verify focus is trapped within the search panel.
- [ ] **About panel trap** — Open About panel. Verify focus is trapped.
- [ ] **AOI panel trap** — Open Area of Interest panel. Verify focus is trapped.
- [ ] **STAC Browser panel trap** — Open STAC Browser panel. Verify focus is trapped.
- [ ] **Custom Legend panel trap** — Open Custom Legend panel. Verify focus is trapped.
- [ ] **Legend panel trap (app bar)** — Open Legend from app bar. Verify focus is trapped.
- [ ] **Details panel trap (app bar)** — Open Details from app bar. Verify focus is trapped.
- [ ] **Layers panel trap (app bar)** — Open Layers from app bar. Verify focus is trapped.
- [ ] **Data Table panel trap (app bar)** — Open Data Table from app bar. Verify focus is trapped.
- [ ] **Escape closes app bar panel** — Press Escape. Verify focus returns to the app bar button that opened it.

## Panel Full Screen Mode Focus

- [ ] **Enter fullscreen** — Open Legend panel, click fullscreen button. Verify focus remains within the panel content.
- [ ] **Tab inside fullscreen** — Tab through elements in the fullscreen panel. Verify focus stays within the fullscreen dialog.
- [ ] **Exit fullscreen restores focus** — Exit fullscreen (click button or press Escape). Verify focus returns to the fullscreen button.
- [ ] **Footer panel fullscreen** — Open Data Table in fullscreen. Tab through columns, filters, rows. Verify focus stays within.
- [ ] **Layers panel fullscreen** — Open Layers in fullscreen. Verify all layer list items and right-panel controls are tabbable.

## Guide Panel Keyboard Navigation

Test the Guide panel with keyboard-only navigation:

- [ ] **Open Guide** — Use Tab to reach the Guide button/tab. Press Enter. Verify the Guide opens.
- [ ] **Search field focus** — Tab to the search field. Type a keyword. Verify results are announced (aria-live region).
- [ ] **Navigate search results** — Press Enter or ArrowDown in search field. Verify focus moves to the first matching section.
- [ ] **Expand/collapse sections** — Focus a section heading. Press Enter or Space. Verify it expands/collapses.
- [ ] **Previous/Next match** — Use Previous/Next buttons. Verify focus cycles through all matches.
- [ ] **Clear search** — Press the Clear button. Verify search resets and focus returns to the search input.
- [ ] **Guide in Legend** — Open Guide from Legend panel. Verify keyboard navigation works.
- [ ] **Guide in Layers** — Open Guide from Layers panel.
- [ ] **Guide in Data Table** — Open Guide from Data Table.
- [ ] **Guide in Details** — Open Guide from Details.
- [ ] **Guide in fullscreen** — Open a panel in fullscreen, then open Guide. Verify Guide is keyboard-navigable inside fullscreen.

## Screen Reader & ARIA

- [ ] **Aria-labels on icon buttons** — Spot-check all icon buttons (zoom, home, basemap, projection, fullscreen, export). Verify each has a meaningful `aria-label`.
- [ ] **Aria-live announcements** — Perform actions that trigger announcements (layer loaded, error, search results). With a screen reader enabled, verify announcements are spoken.
- [ ] **Role="toolbar"** — Verify the nav bar and app bar announce as toolbars to screen readers.
- [ ] **Role="dialog"** — Verify modals (export, WCAG dialog, version) announce as dialogs.
- [ ] **Role="status"** — Verify live regions (measurement results, search count) use `role="status"`.
- [ ] **Aria-expanded states** — Expand/collapse layer groups. Verify `aria-expanded` toggles between true/false.
- [ ] **Aria-pressed states** — Toggle visibility buttons. Verify `aria-pressed` reflects the state.
- [ ] **Aria-disabled on panel buttons** — Verify contextual buttons use `aria-disabled="true"` (not `disabled`) to remain focusable for keyboard users. Examples: reorder up/down buttons at list boundaries, prev/next buttons in Details when at first/last feature, zoom-to-layer button when layer has no extent.

## Contrast & Visual Indicators

- [ ] **Focus indicators visible** — Tab through all elements. Verify every focused element has a visible focus ring/outline.
- [ ] **Focus indicator in all themes** — Switch to dark theme. Tab through elements. Verify focus indicators are still visible (sufficient contrast).
- [ ] **Color is not sole indicator** — Verify status changes (loaded/error/loading) use icons or text in addition to color.

## Multi-Map WCAG

- [ ] **Only one map in WCAG mode** — With 2 maps on page, enable WCAG mode on the first map. Tab to the second map and enable WCAG. Verify the first map's WCAG mode deactivates (only one active at a time).
- [ ] **Ctrl+Q exits active map** — With WCAG active on one map, press Ctrl+Q. Verify WCAG mode exits and focus escapes the viewer. Tab to the other map. Verify the WCAG dialog appears to enable it there.
