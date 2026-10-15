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
| Keyboard/focus-indicator architecture                                  | [Keyboard navigation](../../docs/app/accessibility.md#keyboard-navigation-mode)                                                                   |
| Hidden-layer panel grouping, eye toggles, selection, and focus (#3635) | [Panel behavior](../../docs/programming/best-practices.md#hidden-layer-panel-presentation), [Implementation](#hidden-layer-panel-implementation)  |
| Shared HTML conversion and render-error boundaries                     | [HTML rendering](../../docs/programming/best-practices.md#shared-html-rendering-and-error-boundaries)                                             |
| Semantic controls, labels, toggles, focus and tooltips                 | [Accessibility checklist](../../docs/app/accessibility.md#code-review-checklist), [ARIA](../../docs/app/accessibility.md#004-aria-best-practices) |
| Snackbar persistence and no interactive transient actions              | [Notifications](../../docs/programming/notifications.md#the-governing-wcag-rule)                                                                  |
| Typed actionable errors, not error.generic                             | [Generic-error failover](../../docs/programming/notifications.md#the-generic-error-message-last-resort-failover)                                  |

## Enforcement reminders

- Use translated labels and both en/fr keys. Follow canonical ARIA semantics: stable labels with
  `aria-pressed` for button toggles, or checkbox semantics for visibility controls.
- Do not invent focus outlines; reuse theme helpers. `@/ui` custom theme extension reads need `?.`.
- Use `@/ui` components/icons, not direct MUI UI imports. Standard MUI hooks/types are allowed.
- Components take mapId/ControllerRegistry, never MapViewer.
- Preserve WCAG notes and intentional interaction exceptions.

## Source navigation and translation workflow

`ui/index.ts` exports wrappers; `ui/icons/index.ts` maps domain aliases; custom SVGs live in `ui/svg/`.
IconButton requires `aria-label`, uses it as tooltip fallback and adds tooltip/ref/visibility behavior.
Verify wrapper props rather than assuming the MUI interface.

Hidden-layer panels: follow panel list builders and selection effects into LayerList/LayerListItem
for separate visible/hidden lists, eye controls, announcements, and focus restoration after remounts.
Use [Hidden-layer panel implementation](#hidden-layer-panel-implementation) for maintenance details
and the [controller/store reference](controllers-store.md#source-navigation) for visibility actions and hidden/range state.

Search `public/locales/{en,fr}/translation.json` before creating keys: namespaces are case-sensitive
(`appbar`, `mapctrl`, `dataTable` differ). Use `t('domain.key')` and i18next `{{name}}` interpolation;
keep key parity and meaningful French text. Do not copy hypothetical translation keys from examples.
The public translation convention is in [UI wrappers and translated labels](../../docs/programming/styling-best-practices.md#3--ui-wrappers-and-translated-labels).

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
