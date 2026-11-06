# Styling, UI library, accessibility, i18n

Public documentation owns shared concepts and behavioral contracts; internal maintenance notes live here.

Read only the linked section of each doc: search for its heading and read to the next heading of the same level; expand only if needed (`AGENTS.md` → Reading linked docs).

| Topic                                                                  | Canonical section                                                                                                                                 |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| getSxClasses, memoSxClasses and combining sx                           | [Style modules](../../docs/programming/styling-best-practices.md#1--organizing-component-styles)                                                  |
| Theme tokens and reusable UI under external themes                     | [Theme safety](../../docs/programming/styling-best-practices.md#2--theme-tokens-and-external-theme-safety)                                        |
| Radius tokens and numeric sx multiplier pitfall                        | [Border radius](../../docs/programming/styling-best-practices.md#7--border-radius-named-tokens-on-themeshape)                                     |
| Display theme registration and demo numbering                          | [Theme registration](../../docs/programming/styling-best-practices.md#4--registering-display-themes)                                              |
| UI/icon imports                                                        | [Import order](../../docs/programming/best-practices.md#7--how-we-order-the-import-statements)                                                    |
| Keyboard behavior and focus implementation                             | [Keyboard navigation](../../docs/app/accessibility.md#keyboard-navigation-mode), [Implementation](#keyboard-mode-and-panel-focus)                 |
| Focus-indicator configuration and exceptions                           | [Focus behavior](../../docs/app/accessibility.md#keyboard-focus-indicators), [Implementation](#focus-indicator-maintenance)                       |
| Hidden-layer panel grouping, eye toggles, selection, and focus (#3635) | [Panel behavior](../../docs/programming/best-practices.md#hidden-layer-panel-presentation), [Implementation](#hidden-layer-panel-implementation)  |
| Shared HTML conversion and render-error boundaries                     | [HTML rendering](../../docs/programming/best-practices.md#shared-html-rendering-and-error-boundaries)                                             |
| Semantic controls, labels, toggles, focus and tooltips                 | [Accessibility checklist](../../docs/app/accessibility.md#code-review-checklist), [ARIA](../../docs/app/accessibility.md#004-aria-best-practices) |
| Accessibility source searches and enforcement                          | [Review procedure](#accessibility-review-procedure), [Wrapper naming](#wrapper-naming-and-diagnostics)                                            |
| Snackbar persistence and no interactive transient actions              | [Notifications](../../docs/programming/notifications.md#the-governing-wcag-rule)                                                                  |
| Typed actionable errors, not error.generic                             | [Generic-error failover](../../docs/programming/notifications.md#the-generic-error-message-last-resort-failover)                                  |

## Enforcement reminders

- Use translated labels and both en/fr keys. Follow canonical ARIA semantics: stable labels with
  `aria-pressed` for button toggles, or checkbox semantics for visibility controls.
- Do not invent focus outlines; reuse theme helpers. `@/ui` custom theme extension reads need `?.`.
- Use `@/ui` components/icons, not direct MUI UI imports. Standard MUI hooks/types are allowed.
- Components take mapId/ControllerRegistry, never MapViewer.
- Preserve WCAG notes and intentional interaction exceptions.
- For repeated-action status messages, check consecutive updates rather than only the first one;
  follow the [live-region content-change contract](../../docs/app/accessibility.md#aria-live).
- Measurement point counts exclude OpenLayers' cursor coordinate and polygon closing coordinate.
  Update the tracked count on decreases too, so adding a point after undo produces feedback.
- On-map drawing hints (`DrawingHint`): mouse wording ("Click") by default; keyboard wording when keyboard navigation
  (`activeTrapGeoView`) or the crosshair is active, prefixed with `drawingHint.focusMap` (Ctrl+M) until the crosshair
  is active. Never mix the two wordings in one message. Pointer use does not end keyboard navigation mode; test
  pointer actions while it is active and crosshair-only use while it is inactive.
  The hint is a `role="status"` live region (not `aria-hidden`): a screen reader hears the same text, no extra strings.
- Pointer Enter/Space: `Crosshair` also handles Enter/Space at the mouse pointer while measuring or drawing (not
  editing). Pointer handlers are suspended then, so it tracks the pointer itself and focuses the map on pointer down.

## Source navigation and translation workflow

`ui/index.ts` exports wrappers; `ui/icons/index.ts` maps domain aliases; custom SVGs live in `ui/svg/`.
IconButton requires `aria-label`, uses it as tooltip fallback and adds tooltip/ref/visibility behavior.
Verify wrapper props rather than assuming the MUI interface.

Snackbar shares its close callback with the nested Alert. Keep `reason` optional for Alert close-button
events, and accept MUI's `null` timeout event in both the wrapper and the shell callback. This external
callback contract is an exception to preferring `undefined` over `null`.

Hidden-layer panels: follow panel list builders and selection effects into LayerList/LayerListItem
for separate visible/hidden lists, eye controls, announcements, and focus restoration after remounts.
Use [Hidden-layer panel implementation](#hidden-layer-panel-implementation) for maintenance details
and the [controller/store reference](controllers-store.md#source-navigation) for visibility actions and hidden/range state.

Search `public/locales/{en,fr}/translation.json` before creating keys: namespaces are case-sensitive
(`appbar`, `mapctrl`, `dataTable` differ). Use `t('domain.key')` and i18next `{{name}}` interpolation;
keep key parity and meaningful French text. Do not copy hypothetical translation keys from examples.
The public translation convention is in [UI wrappers and translated labels](../../docs/programming/styling-best-practices.md#3--ui-wrappers-and-translated-labels).

## Typography lint maintenance

Public contract: [Typography](../../docs/programming/styling-best-practices.md#typography).
The shared [ESLint config](../../packages/eslint.config.js) adds typography selectors to
`no-restricted-syntax`, retaining existing restrictions and their warning severity.
Run `npm run lint` from `packages/`; do not replace the rule array in package configs.

Weight checks flag numeric/numeric-string and `bold`, `bolder`, `lighter`, `normal`, or `semibold`
literals in style/sx values, responsive and conditional branches, JSX props, DOM
`style.fontWeight` assignments, and static `font-weight` declarations in tagged templates. Theme
weight-token references, `'inherit'`, and configuration-driven values remain allowed. When changing
these selectors, verify both flagged literals and allowed values through shared and plugin-local
ESLint configs.

[`transform-base.ts`](../../packages/geoview-core/src/geo/interaction/transform/transform-base.ts)
controls bold formatting in the selected text editor overlay. Its line-level disable explicitly
identifies it as the user's map-text formatting, not UI typography.

Keep exemptions narrow: theme definitions and declarations own tokens/types; export `layout-styles.ts`
owns PDF/canvas artwork; the measurement button and map text-format toggle have line-level OpenLayers
text exemptions.
Drawer TS/TSX UI is checked too; picker headers use their owning StylePanel's paper ref.
Measurement labels: keep Drawer `measurement-styles.css` and Measure `measurement-label-style.ts`
aligned with the [public styling contract](../../docs/programming/styling-best-practices.md#typography).
Maintenance safeguards:

- Measure: draw the backing/pointer in one fill (`lineTo`/`arcTo`, not `roundRect`) to avoid opacity seams;
  give backing/text ascending z-indices because custom renderers otherwise paint after native text.
  Translate the render-pixel anchor, scale CSS dimensions by `pixelRatio`, counter-rotate by the render
  state's rotation, then apply `offsetY` so the backing and offset stay screen-aligned with native text.
- Cache only the latest text/offset per feature in a WeakMap; update its shared Point when the anchor moves.
  Measure width once with the supplied context, not internal `ol/render/canvas` helpers.
  OL 10.9 browser text spacing comes from the full font string: `14px/1.5` matches the 21px backing line-height.
- Preserve tool-specific anchors, segment styles and area superscripts (Drawer HTML, Measure Unicode).
  Measure totals export; Drawer overlays do not. Theme migration remains deferred.
- Keep Drawer CSS independent of navbar mounting: no typography setup in the Draw button
  (absent on static maps) or measurement-specific synchronization in the core `Map`.

The OpenLayers renderer's destructuring font default is not a style value and needs no disable.
Console-format strings and numeric legend conversion are not style-object literals, so need no disable.
Do not exempt export modal UI, whole geo folders, or whole custom-legend files.

## Spacing lint maintenance

Public contract: [Spacing](../../docs/programming/styling-best-practices.md#5--spacing-themespacing-in-style-modules-no-sx-shorthand).
`SPACING_RESTRICTIONS` in the shared [ESLint config](../../packages/eslint.config.js) are
`no-restricted-syntax` selectors merged into `BASE_SYNTAX_RESTRICTIONS`, beside the border-radius checks,
so they apply wherever the base restrictions do. They flag spacing strings with or without units, bare
numbers outside inline JSX `sx` props, unit-suffixed template literals, and `margin`/`padding`/`gap`
declarations in tagged CSS templates. Popper `modifiers` options are excluded because their `padding` is
not CSS. Export `layout-styles.ts` and `utilities.ts` (PDF/canvas artwork) get base restrictions without
the spacing selectors.
Selectors match property names, not types, so a non-CSS option named `padding` or `p` in another object
may need a line-level `// eslint-disable-next-line no-restricted-syntax -- <reason>`. When changing the
selectors, run `npm run lint` from `packages/` and check both flagged literals and allowed `sx` numbers.
Size selectors follow value containers (responsive objects/arrays, conditional branches and JSX
expressions), not helper-call arguments, lookup keys or condition tests. Preserve both positive and
negative cases when changing these selectors.
## Shell scrolling

The behavioural contract (offset, oversized alignment, map-info buttons) lives in the
[delegated-listener section](../../docs/app/accessibility.md#2-use-semantic-elements-for-interactions--high-priority).
Implementation notes:

- `Shell.handleScrollShellIntoView` measures `mapShellContainerRef`, not a positional shell child:
  status wrappers precede the map section (#3708). The gap is the shared `MAP_SECTION_SCROLL_GAP_PX`
  (`core/utils/constant.ts`), also read by the UI tests. Oversized sections skip scrolling within 1px of
  the gap. Leave the shared `scrollIfNotVisible` footer offset unchanged.
- `UITester.testMapSectionScroll` mutates page scroll, so the UI suite waits for page exclusivity
  (see [Sequential vs Parallel Execution](../../docs/app/testing/test-templates.md#sequential-vs-parallel-execution))
  and runs its scenarios sequentially.
  Footer assertions must start from bounds that trigger `scrollIfNotVisible`. Close app-bar panels only
  while the toggle is visible: focus restoration otherwise re-centres the off-screen toggle. Map-info
  scroll tests click the `{mapId}-mapInfo` bar, not its buttons.
- Real Enter/Space, focus, reduced-motion and fullscreen checks stay in the
  [global release plan](../../docs/programming/release-testing/01-global.md#map-section-scrolling).

## Theme and scrollbar maintenance

Public contracts: [Theme tokens and external-theme safety](../../docs/programming/styling-best-practices.md#2--theme-tokens-and-external-theme-safety)
and [Accessing GeoViewColors](../../docs/app/ui/theming.md#accessing-geoviewcolors-in-the-application).

- [theme.tsx](../../packages/geoview-core/src/ui/style/theme.tsx) passes an explicit MUI palette mode when generating each display theme; [themeOptionsGenerator.ts](../../packages/geoview-core/src/ui/style/themeOptionsGenerator.ts) defines the semantic roles and custom `surface`, `inverseContent`, and `layerVisibility` palette entries.
- [AppStart](../../packages/geoview-core/src/core/app-start.tsx) scopes inherited scrollbar colors to the map-specific shell ID using `CSS.escape`, with `primary.main` for the thumb and `surface.low` (or `background.default` for a standard external theme) for the track. Keep this selector map-scoped; never style `html`, `body`, or a shared shell class.
- Scrollbars inherit these colors only within the shell. When changing portal containers, verify whether the portal is mounted inside that shell; content outside it needs a separate map-ownership strategy rather than an unqualified global selector.

## Accessibility implementation

Public behavior and shared developer guidance remain in the [accessibility guide](../../docs/app/accessibility.md).
The following sections own source-specific maintenance details, not additional user instructions.
When changing a behavior described there, update the public explanation and these notes together.

### Keyboard mode and panel focus

Contracts: [Keyboard navigation](../../docs/app/accessibility.md#keyboard-navigation-mode) and
[intentional interaction patterns](../../docs/app/accessibility.md#002-intentional-interaction-patterns).

- The `.geoview-map` wrapper contains the shell and focusable controls; `#{mapId}-mapTargetElement`
  is the OpenLayers canvas container. [Map](../../packages/geoview-core/src/core/components/map/map.tsx)
  assigns `tabIndex=0` for dynamic maps and `-1` for static maps. Its Ctrl/Cmd+M handler requires
  focus inside that viewer and non-static interaction; it activates rather than toggles the crosshair.
  Flush map-control popover closure (navbar, About/Version, Notifications) before focusing the map
  so MUI focus restoration cannot reclaim focus; clear the registered focus item without restoring caller focus.
  Derive panel openness from the close-request version during render; closing through a passive
  effect schedules a second render whose focus-trap cleanup can run after map focus. New map-control
  popovers use the `useMapPopover` hook, which owns that derivation, rather than re-implementing it.
  Keep the animated Popper wrapper at module scope: creating it during render remounts its focus trap.
  Crosshair coordinate checks must measure the SVG artwork center, not just its element box;
  off-center artwork can leave a visible offset even when viewport coordinates are correct.
  Compare tolerances in the unit being measured: layout snaps to 1/64 px, which is meters at low zoom,
  so assert the keyboard position against the viewport-center coordinate, not the SVG's pixel.
  Escape with nothing left to cancel returns focus to the tool button (`UIController.focusToolButton`, ids from
  `GV_DOM_SUFFIX`) only while the map has focus and outside fullscreen. Decide "nothing left" from state read
  before the Draw interaction aborts its sketch: measurement uses a capture-phase listener, and the drawer's
  handler is registered in `onHook`, ahead of any Draw instance. Reordering either makes one Escape do both.
  Editing follows the same rule through `DrawerController.handleEditingEscape()`: a grab or selection is cleared first.
- [Map](../../packages/geoview-core/src/core/components/map/map.tsx) updates crosshair state on Tab release
  for focus within its own root. It activates only when the map target itself is focused and does not
  manage focus-indicator CSS. Do not restore JS-managed `.keyboard-focused`.
- [MapViewer](../../packages/geoview-core/src/geo/map/map-viewer.ts) must not let mouseenter or
  mouseleave move focus while `activeTrapGeoView` is enabled. Keep OpenLayers interactions configured
  with `defaultInteractions({ onFocusOnly: false })` so wheel and drag input still works when another
  control owns focus. A real map blur releases crosshair interactions only; it must not disable the mode.
- [Shell](../../packages/geoview-core/src/core/containers/shell.tsx) uses `activeTrapGeoView` to switch
  `.geoview-keyboard-active`/`.geoview-keyboard-inactive` and keep its viewer-level Tab boundary.
  The dynamic-map Settings switch and entry prompt must invoke the same mode lifecycle through the
  Shell callback; never add a config flag or a separate mode state. Settings stays mounted in the app bar
  below Notifications on dynamic maps only. After Enable closes the prompt, focus
  `DomHelper.getMainMap(mapId)`: the main-content skip link for dynamic maps, or the static map container.
  Do not focus the OpenLayers target or activate the crosshair on entry; the skip link owns that action.
  The inactive entry prompt may be dismissed by real pointer movement outside the prompt, but movement
  must not disable an already-enabled mode. Ignore zero movement and cancel any pending focus job when
  dismissing the prompt.
  Fullscreen exit restores map focus for active crosshair drawing/measurement on the next animation
  frame, after browser focus restoration. Cancel pending restoration on controller unhook or fullscreen re-entry.
- [FocusTrapContainer](../../packages/geoview-core/src/core/components/common/focus-trap-container.tsx)
  coordinates a single active inner focus owner; close-button visibility is not equivalent to ownership.
  Use `focusOnEntry: false` when temporarily taking ownership for Settings so it does not jump to Exit.
  Restore the previous owner after an Escape/Close dismissal, but do not steal focus after pointer
  click-away or supersede focus after a genuine modal opens. Non-modal shell, panel, and Popper traps
  may disable enforcement while retaining their Tab boundaries; never relax containment for actual
  modal dialogs. Remove `aria-modal` from non-modal panels.
  App-bar panel Escape dismissal must use the same close handler as the header Close button:
  Details returns focus to the map while the crosshair is active, not to the Details toolbar button.
  Cancel delayed focus work when its owner closes or changes, and guard against restoring focus over
  a newer modal or panel.
  About, Notifications, and navbar popovers read the current store owner in their coordination effects.
  If a different active owner exists, close without restoring focus; acquire ownership only when unowned.
  Keep the opening handler's pre-close snapshot for ordinary dismissal, but discard it when yielding.
  Use [useMapPopover](../../packages/geoview-core/src/core/components/common/hooks/use-map-popover.ts)
  for app-bar map popovers so Ctrl/Cmd+M closure is derived before map focus and cannot reclaim focus
  in a passive effect.
  [ResponsiveGridLayout](../../packages/geoview-core/src/core/components/common/responsive-grid-layout.tsx)
  also checks toggle/mobile mode, content, and right-panel visibility.
- Right-panel scrolling belongs to `.panel-content-container`, not its outer wrapper. It takes the
  remaining flex height below the panel controls. Preserve its keyboard focusability and vertical scroll
  containment (#3697).
- Size full-height panel children with flex (flex-column Paper, shrinkable scroller), not a fixed
  toolbar-height subtraction: that clips the horizontal scrollbar when toolbar controls wrap. Do not
  compensate with scrollbar padding (#3697).
- In keyboard mode, reserve space for Exit so full-height content does not extend beyond the focus
  trap's clipping boundary. Test final-content visibility with Exit shown, and scroll chaining with
  the page away from its scroll limits.
- Follow [Layout](../../packages/geoview-core/src/core/components/common/layout.tsx) for selected-layer
  focus restoration. Guide/lightbox handlers must take precedence over enclosing panel dismissal.
  [FullScreenDialog](../../packages/geoview-core/src/core/components/common/full-screen-dialog.tsx)
  relies on MUI `onClose` for Escape and the surrounding layout for restoration after exit.
- [TimeSlider](../../packages/geoview-time-slider/src/time-slider.tsx) defers normal-mode Escape closing
  only when `onRequestClose` exists and playback or layer loading is active. It stops playback,
  suppresses the event, and sets `pendingCloseRef`; the effect closes when both conditions clear.
  Without the callback, Escape stops playback and bubbles. Fullscreen Escape also bubbles to the
  dialog. Preserve transition cleanup of playback and pending-close state: removing the panel
  during playback/loading can disrupt focus-trap state.
- [handleEscapeKey](../../packages/geoview-core/src/core/utils/utilities.ts) takes a key string, not
  an event, and cannot stop propagation. [Popper](../../packages/geoview-core/src/ui/popper/popper.tsx)
  adapts its `handleKeyDown` prop to `(key, closeCallback)`, so the helper can be passed directly.
  Custom event boundaries must suppress propagation when closing nested content must leave its parent open.

### Focus-indicator maintenance

Contracts: [Focus behavior](../../docs/app/accessibility.md#keyboard-focus-indicators) and
[authoring conventions](../../docs/programming/styling-best-practices.md#4--keyboard-focus-indicators).
Start at [themeOptionsGenerator.ts](../../packages/geoview-core/src/ui/style/themeOptionsGenerator.ts).

- MUI's theme-level `focusVisible` owns native Material indicators. GeoView configures a 3px outline,
  2px outward offset, and 6px halo: black/white in light themes, white/translucent black in dark.
  `getFocusIndicatorStyles` covers custom/composite controls and external-theme fallbacks;
  `getFormControlFocusIndicatorStyles` drops the halo for border/underline inputs.
- InputBase-derived form roots retain `.geoview-keyboard-active &:has(:focus-visible)`.
  Do not replace this keyboard-mode scope with MUI's option or mouse-triggered focus styling.
- Native placement: Tabs use inset indicators; Checkbox/Radio follow the first SVG icon; dense
  MenuItems use a fully inset outline without halo. Other clip-prone controls use native inset placement.
  Custom Checkbox/Radio icons must render SVG for native indicator coverage.
- The option removes focus-only backgrounds/overlays from menu/list items, Chip, AccordionSummary,
  CardActionArea, Autocomplete options, and Slider; independent hover, selected, and active styles remain.
  Slider hover styles must not replace keyboard indicators.
- [Tabs](../../packages/geoview-core/src/ui/tabs/tabs-style.ts) and
  [Slider](../../packages/geoview-core/src/ui/slider/slider-style.ts) retain fallback indicators when
  external themes do not enable the option. Re-pass raw `focusVisible` configuration when recomposing
  palette changes; do not reuse previously resolved colors.
- [Switch](../../packages/geoview-core/src/ui/switch/switch-style.ts) indicates focus around the full
  label and suppresses the redundant track ring. Layer-settings cards retain zero-offset/no-halo
  treatment; layer rows retain no halo and selected background with native inset offset when enabled.
  [Custom Legend](../../packages/geoview-custom-legend/src/custom-legend-style.ts) description buttons
  use the native indicator instead of the former 2px text-colored outline; preserve external-theme fallbacks.
- Table, Guide, and compact panel controls keep local inset/no-halo exceptions rather than a second
  universal ring. App-bar/nav-bar ring suppression remains a separate accessibility/design review item.
  Verify clipping in paint-contained tables, adjacent button groups, portals, and fullscreen.
  Scale/mouse-position groups, OpenLayers controls, AOI cards, media, and vendor overlays need separate checks.
- Keep a real outline for forced-colors mode. Browser emulation is not Windows High Contrast sign-off;
  SVG Checkbox/Radio indicators need platform verification. Use the
  [visual-indicator release tests](../../docs/programming/release-testing/21-wcag-accessibility.md#contrast--visual-indicators)
  plus the contexts above before removing exceptions.

### Wrapper naming and diagnostics

Contract: [Select naming](../../docs/app/accessibility.md#select-naming) and
[icon-button guidance](../../docs/app/accessibility.md#icon-buttons).

- [IconButtonPropsExtend](../../packages/geoview-core/src/ui/icon-button/icon-button.tsx) uses
  `Omit<IconButtonProps, 'aria-label'>` plus required `'aria-label': string`.
  This catches missing props, not empty/meaningless labels. The wrapper forwards `aria-disabled`
  without blocking `onClick`; callers must return early in activation handlers.
- [Switch](../../packages/geoview-core/src/ui/switch/switch.tsx) must use a caller-supplied `id`
  consistently for both the input and `FormControlLabel.htmlFor`; otherwise the visible label may
  not become the switch's accessible name. Verify custom-ID switches with a role/name accessibility query.
- [Select](../../packages/geoview-core/src/ui/select/select.tsx) uses an exclusive label/aria-label
  union, but TypeScript accepts empty strings. Runtime checks log missing, conflicting, empty, or
  whitespace-only naming props through `logger.logError` without interrupting rendering.
  Diagnostics apply in development and production subject to logging level, with no in-app notification.
  Logging does not repair the accessible name.
- Visible labels use a generated `useId` value unless `labelId` is supplied. `inputLabel` customizations
  cannot override its `id`. The visible `label` also goes to Material Select for the outlined notch.
  With `aria-label`, no InputLabel is rendered and no `labelId` is connected.

### Accessibility review procedure

Use the public [review checklist](../../docs/app/accessibility.md#code-review-checklist) for expected
outcomes. Search only the changed scope; useful source-search candidates are:

- `onClick`/`onMouseDown`/`onPointerDown` or `role="button"` on div/span/Box/Card/Typography/ListItem/img
- Ternary `aria-label`, repeated label values, and state-dependent `disabled={...}`
- Dialog/Modal/Drawer close handlers, including `onClose`, `onKeyDown`, and `disableEscapeKeyDown`
- `<img` and `component="img"`, Tooltip wrappers, `aria-live`, and `role="status"`
- IDs generated in loops or from layer paths, and control width/height below 44px

[ESLint](../../packages/eslint.config.js) enforces `jsx-a11y/no-static-element-interactions`,
`click-events-have-key-events`, and `interactive-supports-focus`. Fully hand-rolled button semantics
can pass these checks; `no-restricted-syntax` warns on `role="button"`, so manual review is still needed.
For legitimate delegated container listeners, keep clicks on empty space harmless and justify any
`// eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events`
with the delegation purpose rather than adding fake button semantics.
When replacing a styled Box with ButtonBase, neutralize button defaults as needed
(`width: '100%'`, `justifyContent: 'flex-start'`, `textAlign: 'left'`, `font: 'inherit'`, `color: 'inherit'`)
and use `disableRipple` where appropriate without removing the theme's focus outline.
Shared semantic and ARIA guidance stays public; do not duplicate its examples here.

## Hidden-layer panel implementation

Behavioral contract: [Hidden-layer panel presentation](../../docs/programming/best-practices.md#hidden-layer-panel-presentation).
These maintenance notes describe the current implementation (#3635), not additional user instructions.
Start at [layer-state.ts](../../packages/geoview-core/src/core/stores/states/layer-state.ts),
[layer-controller.ts](../../packages/geoview-core/src/core/controllers/layer-controller.ts), and the panel list builders,
then follow their imports into LayerList/LayerListItem and the plugin panels. Verify current source
before applying a note; update this reference and the linked public contract together when affected.

- `useStoreLayerIsHiddenOnMapSet` combines parent hiding, scale and own visibility.
  Pair it with `useStoreLayerInVisibleRangeSet`; visibility-hidden means
  `layerHiddenSet[path] && inVisibleRangeSet[path] !== false`.
- Use LayerController's `setLayerVisibleIncludingParents` to re-enable a layer masked by hidden
  ancestors; see [controller responsibilities](../../docs/programming/controller-architecture.md#layercontroller).
- Multi-layer entries use `relatedLayerPaths` for all backing layers and
  `every((p) => layerHiddenSet[p] !== false)` for hidden state (untracked entries count as hidden).
- Clear selection when visibility-hidden, not when only out of range. Details/data-table need an effect
  keyed on `layerHiddenSet`; geochart/time-slider can use their existing selection effect's `entry.isHidden`.
- Render two native lists with heading IDs from `useId`, `aria-labelledby`, and a polite `role="status"`
  announcement of moves (skip initial render). Keep `ul`/`li`, not `role="group"`.
- Moving between lists remounts items: restore focus via stable IDs with `getGVElementByFullId`,
  not a stale element ref.
- Non-interactive hidden rows use `tabIndex={-1}`, no click/keyboard handlers, `disableRipple`,
  and cursor/hover reset; do not use MUI disabled (it washes out text, suppresses tooltip and changes noWrap).
  Keep the eye button interactive; title style is grey[700]/italic.
- In details collapsed app-bar `toggleMode`/`compact`, suppress hidden entries in both the main builder and
  out-of-range-with-features merge, headings and empty instructions. Thread compact through Layout/LayerList.
  `userDismissedGuideRef` prevents the auto-guide from reopening after dismissal; set on right-panel close
  and reset when the panel closes or features reappear. Show the close button whenever the right panel is open.
- The eye selects entries with `numOffeatures !== 0` and follows Layout's right-panel focus;
  undefined feature count is content, while zero leaves the guide visible.

These rules do not apply to Legend/Layers, which remain visibility controls.

## Interactive browser UI checking

Agent execution procedure for UIA11yReviewer browser mode. User invocation and capabilities are
described in [using-ai.md](../../docs/programming/using-ai.md#interactive-browser-ui-checking).

1. **Choose a focused scenario.** Confirm the page/configuration and expected behavior from the request and relevant source. Ask only for missing details that prevent a reliable check. Respect static/dynamic mode, optional plugins, and intentional accessibility exceptions.
2. **Reuse or start the viewer.** Prefer an existing reachable development viewer, normally `http://localhost:8080`, and reuse a suitable shared browser tab. Verify that the viewer serves the current source; do not claim a deployed preview validates local edits. If no suitable server is running, inspect VS Code tasks and run the appropriate dev-server task, or use `rush serve` from the repository root. Keep it attached, verify startup output and HTTP responsiveness, and open the actual requested page. Do not install dependencies, launch a production build, deploy, or kill a server to free a port; report startup failures and request guidance when needed.
3. **Check interactions.** Use browser snapshots to locate elements and browser controls for clicks, typing, Tab/Shift+Tab, and relevant Enter/Space/arrow/escape shortcuts. Verify resulting UI state, accessible labels, keyboard reachability, focus movement/restoration, and visible focus indicators. Check mouse behavior too when relevant. Cover EN/FR text and applicable themes only as needed for the scenario; do not silently expand into every page.
4. **Collect evidence.** Record the URL, scenario, actions, expected and observed results, and pass/fail/blocked status. Use screenshots for visual states, not as a substitute for interaction or accessibility snapshots. Browser checks support accessibility review but do not certify WCAG compliance or screen-reader behavior. If browser tools are unavailable in the client, report runtime validation as blocked and provide manual reproduction steps; do not claim it passed.
5. **Clean up and report.** Restore temporary UI state where practical and stop only the dev-server task/process started for this check, using its exact task/session/PID. Leave pre-existing servers and user tabs intact. Report startup/validation commands and results, findings with relevant source locations, and any untested cases. If fixes were requested, run targeted static validation and repeat the affected browser scenario.
