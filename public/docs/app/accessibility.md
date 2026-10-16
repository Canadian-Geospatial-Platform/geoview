# Accessibility

Accessibility is a priority in GeoView's development. The application follows WCAG 2.1 Level AA guidelines whenever possible, and this section highlights the key features implemented for visual, keyboard, and screen reader users.

For viewer users, start with the [features overview](#001-accessibility-features-overview), [interaction patterns](#002-intentional-interaction-patterns), and [known limitations](#006-constraints-and-limitations). For developers and reviewers, see the [best practices](#003-best-practices), [ARIA guidance](#004-aria-best-practices), and [review checklist](#code-review-checklist).

## 001. Accessibility Features Overview

### 1. For Keyboard Users

#### Keyboard Navigation Mode

Dynamic maps support keyboard focus and crosshair-based map interaction. Static maps do not offer
these interactions or the layer, legend, details, table, and navigation controls, but retain
about/notification controls and attribution/scale.

With focus inside a dynamic viewer, Ctrl+M (or Cmd+M on macOS) focuses the map element
and **activates**, not toggles, the crosshair. Ctrl+Q exits keyboard navigation mode and
deactivates the crosshair. Tabbing to another control within the viewer also deactivates it.
Escape is not a general crosshair-exit shortcut; drawer editing can use it to cancel a grabbed transform.
Arrow keys pan by 128px by default. Shift+ArrowUp increases the step by 10px;
Shift+ArrowDown decreases it by 10px (minimum 10px).

On first tab into the viewer, users are prompted to enable keyboard navigation mode or skip the viewer. This mode enables a focus trap within the viewer; focusing the map activates crosshair-based interaction.

- Press Ctrl + Q to exit keyboard navigation mode
- Press Ctrl + M (or Cmd + M on macOS) with focus inside a dynamic viewer to focus the map and activate the crosshair

#### Keyboard Focus Indicators

Keyboard focus is shown with a contrasting outline, usually with an additional halo. Placement
varies by control so the indicator fits its shape and available space. Form inputs use an
outline without the halo in keyboard navigation mode.

Some app-bar/nav-bar controls still suppress the standard ring; this remains an accessibility/design
review item. See the [contrast and visual-indicator release tests](../programming/release-testing/21-wcag-accessibility.md#contrast--visual-indicators)
for verification, and [styling best practices](../programming/styling-best-practices.md#4--keyboard-focus-indicators)
for developer guidance.

#### Focus Traps for Enhanced Navigation

In keyboard navigation mode, activating a panel (e.g., Layers, Legend, Details) enables a focus trap that confines keyboard navigation within that panel. Auto-opened panels may remain outside the active trap.

- This speeds up navigation by preventing focus from cycling through the entire map
- Close the active panel or selection by pressing **Esc** — focus returns to the associated button
- A **Close** or **Exit** button is provided within each trapped panel for explicit closure

Sub-panels provide similar functionality.

#### Context-Aware Esc Key

The Esc key intelligently handles different scenarios:

- Closes the active panel and restores focus to the triggering button, or
- Closes modal dialogs (lightbox, export, etc.) and restores focus to the triggering button

Nested content, time-slider deferred closing, and browser fullscreen can affect which action happens first. See [intentional interaction patterns](#002-intentional-interaction-patterns) and [fullscreen constraints](#fullscreen-api-and-esc-key-priority).

### 2. For Screen Reader Users

#### Semantic Landmarks

Semantic landmarks and named regions, including the map region, support quick navigation with a screen reader.

#### ARIA Live Regions

Real-time announcements for events such as:

- Map loading status ("Loading map" → "Map loaded")
- Processing completion ("Processing" → "Processing complete")
- Measurement results (distance/area values)

#### Descriptive Labels

Interactive elements use context-specific accessible names through visible text, `aria-labelledby`, or `aria-label`:

- Icon buttons: "Zoom in", "Toggle visibility, Layer Name", "Close panel"
- Panels: "Layers panel", "Legend panel", "Details panel"
- Button toggle states: Communicated via `aria-pressed` with stable labels; checkbox controls use checkbox semantics

---

## 002. Intentional Interaction Patterns

### 1. Time Slider

**Esc key behaviour in normal mode:**

When the time slider panel is open and either animation is playing OR layers are loading, pressing Esc initiates a deferred close:

1. Animation stops immediately (if playing)
2. The same Esc press does not also close an enclosing panel
3. The panel remains open until both conditions clear (animation stopped AND layers finished loading)
4. During this period, tabbing through the right panel remains possible
5. Once conditions stabilize, the panel auto-closes and focus returns to the layer button in the left panel

**Esc key behaviour in fullscreen mode:**

When the time slider is in a panel fullscreen view, Esc stops any active animation and closes the fullscreen dialog. Focus returns to the surrounding panel after closing. This differs from [browser fullscreen](#fullscreen-api-and-esc-key-priority), which can consume Escape first.

**Rationale:**

Waiting for playback and loading to finish keeps keyboard focus stable while the panel closes.

### 2. Multi-Panel Auto-Open and Focus Priority

**Focus trap mutual exclusion when multiple panels open:**

When a map interaction (such as clicking a feature) triggers multiple panels to auto-open simultaneously (e.g., Details panel in the app-bar and Chart panel in the footer-bar), only one panel can receive the focus trap at a time.

Close buttons depend on the layout and content, not just the active focus trap. App-bar toggle layouts and mobile layouts can show a close button even when the panel is not focus-trapped.

**Behavior:**

1. **Focus priority** — One panel receives the focus trap, while other auto-opened panels remain open without it
2. **Other panels** — An active trap restricts Tab navigation to its own content. Other open panels are not necessarily reachable by Tab until that trap is exited
3. **Changing panels** — Use the current panel's Close or Exit control to return to its associated control, then navigate to another panel. Activating a layer entry can move focus into that panel's content

**Rationale:**

This mutual exclusion pattern supports multi-panel workflows:

- Prevents multiple simultaneous traps (which are disorienting for keyboard users)
- Provides exit controls so users can return to the surrounding viewer navigation
- Supports explicit activation (Enter/Space on a layer) to enter panel content

### 3. Mouse Movement Can Disrupt WCAG Mode

**Behavior:**

Moving the mouse over the viewer after entering the keyboard-navigation flow exits keyboard mode and dismisses the entry prompt if it is still open. Pointer placement alone does not trigger this transition.

To stay in keyboard navigation mode:

- Move the pointer away from the viewer before entering keyboard mode
- Avoid moving the mouse while navigating with the keyboard

**Rationale:**

Mouse movement is treated as a return to mouse interaction, so the viewer releases its keyboard focus trap. This explains the mode change; unresponsive buttons or broken focus traps are not intended behavior.

---

## 003. Best Practices

These sections explain shared developer conventions. Source-specific maintenance notes cover
[keyboard/panel focus](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/.github/ai/ui-style-a11y-i18n.md#keyboard-mode-and-panel-focus),
[focus indicators](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/.github/ai/ui-style-a11y-i18n.md#focus-indicator-maintenance), and
[wrapper diagnostics](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/.github/ai/ui-style-a11y-i18n.md#wrapper-naming-and-diagnostics).

**Guidance for code review:**

These guidelines help catch common accessibility issues during branch review. They are **advisory, not blocking** — the goal is to assist developers in writing accessible code, not to prevent work-in-progress from merging.

**Priority levels:**

- 🔴 **HIGH PRIORITY** — Accessibility issue, should be addressed before release
- 🟡 **MEDIUM PRIORITY** — Accessibility gap, worth fixing when feasible
- 🔵 **ENHANCEMENT** — Best practice, improves user experience

---

<a id="unique-element-ids"></a>

### 1. Use unique and valid element IDs (🔴 HIGH PRIORITY)

Every element id in the DOM must be unique. Duplicate IDs break label-input associations (htmlFor), invalidate ARIA relationships (aria-labelledby, aria-describedby), and cause screen readers to behave unpredictably.

- Ensure IDs are unique across the whole page, including multiple viewer instances
- Use kebab-case (as much as possible)
- IDs must be non-empty and contain no ASCII whitespace. `/` and `.` are valid in HTML IDs, but require escaping when used in CSS selectors

**ID naming patterns** (from least specific to most specific):

```typescript
// Pattern 1: Element in a container
`${mapId}-${containerType}-${elementName}`
// Example: "mapA-footer-zoom-button"

// Pattern 2: Element in a panel within a container
`${mapId}-${containerType}-${panelId}-${elementName}`
// Example: "mapA-footer-layers-panel-close-button"

// Pattern 3: When a truly unique ID is required
// Prefer React's useId() for stable label/control associations
`${mapId}-${containerType}-${elementName}-${uniqueId}`;
// Example: "mapA-footer-layer-item-k8j3n2m9"
```

**Layer paths and generated IDs:**

Replacing punctuation can create duplicate IDs: `group/a.b` and `group/a/b` both become `group-a-b`. Use map and component-instance identifiers to keep IDs unique, and use the same ID in the associated label and ARIA references. If an ID contains special characters, escape it before using it in a CSS selector.

<a id="semantic-controls"></a>

### 2. Use Semantic Elements for Interactions (🔴 HIGH PRIORITY)

Clickable `<div>` and `<span>` elements do not provide button semantics, keyboard focus, or Enter/Space activation by default. Native `<button>` and `<a href>` elements come with built-in keyboard support, appropriate semantics, and browser-managed focus behaviour. Use Button, IconButton, and Link from `@/ui` over attaching onClick handlers to arbitrary elements.

Pick the primitive by what the element does:

| Need                                      | Use                        | Notes                                                                                                                                  |
| ----------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Action with a text label                  | `Button`                   | Default MUI button styling                                                                                                             |
| Icon-only action                          | `IconButton` (from `@/ui`) | `aria-label` is required and is the fallback tooltip text when no `tooltip` prop is given                                              |
| Card, tile or row that triggers an action | `ButtonBase`               | No padding/typography; keeps the existing card layout. Render children as `component="span"` (button content must be phrasing content) |
| Clickable row in a `List`                 | `ListItemButton`           | Put other controls in `ListItem secondaryAction` so they are not nested in the button                                                  |
| Navigation to a URL                       | `Link` / `<a href>`        | Prefer a real link over a button that calls `window.open` (some existing download buttons still do; migrate when touched)              |

**Do not** hand-roll `role="button"` + `tabIndex={0}` + `onKeyDown` on a `Box`/`div`/`Card` — `ButtonBase` provides focus, Enter/Space activation, disabled semantics and the theme focus-visible indicator.

```typescript
<ButtonBase onClick={handleClick} disableRipple sx={sxClasses.card}>
  <Typography component="span">{title}</Typography>
</ButtonBase>
```

Preserve the keyboard focus indicator when adapting the control's appearance to an existing layout.

**Delegated listeners** — An `onClick` on a container that reacts to clicks bubbling from real child controls (e.g. scrolling the viewer into view) does not make the container a control. Clicking its empty space must remain harmless.

<a id="icon-buttons"></a>

### 3. Use IconButton for buttons without labels (🔴 HIGH PRIORITY)

The IconButton component in GeoView has built-in accessibility support. Use IconButton instead of Button when a button does not have a text label.

Its `aria-label` prop is required by TypeScript. The compiler catches a missing prop, but reviewers
should still check that the value is non-empty, translated, and describes the action and target.

```typescript
<IconButton aria-label={t('general.close')} onClick={handleClose}>
  <CloseIcon />
</IconButton>
```

<a id="wcag-checks"></a>

### 4. Ensure WCAG 2.1 Level AA Compliance (🟡 MEDIUM PRIORITY)

**Critical checks during code review:**

- ✅ All interactive elements have accessible names (via `aria-label`, `aria-labelledby`, or visible text)
- ✅ Form inputs are associated with labels (via `<label>` or `aria-labelledby`)
- ✅ Color is not the only means of conveying information
- ✅ Focus indicators are visible and meet 3:1 contrast ratio
- ✅ Aim for at least 44×44 CSS pixel touch targets (SC 2.5.5, WCAG 2.1 AAA; an enhanced GeoView design goal rather than an AA requirement)

Measure the clickable area, not just the icon. Small targets are difficult for users with motor
impairments or touch screen users.

**Testing tools (post-implementation):**

- [W3C Markup Validator](https://validator.w3.org/)
- [axe DevTools](https://www.deque.com/axe/devtools/) browser extension
- Lighthouse accessibility audit in Chrome DevTools

<a id="disabled-states"></a>

### 5. Focus management: Use aria-disabled instead of disabled on UI elements that toggle between enabled/disabled states (🟡 MEDIUM PRIORITY)

When a focused button becomes natively disabled, focus behavior can vary by browser and the button is removed from sequential keyboard navigation. For transient states where users need to retain their position, consider `aria-disabled` instead.

- Native `disabled` remains appropriate when a control should not be operable or in the Tab sequence
- `aria-disabled` communicates unavailability but does not prevent focus or activation
- Style the unavailable state
- Add an early return in each activation handler to prevent the action while `aria-disabled` is true. The attribute communicates unavailability but does not block activation itself

```typescript
const handleClick = (e) => {
  if (isDisabled) return;
  // real logic
};

<button
  aria-disabled={isDisabled}
  onClick={handleClick}
>
  Submit
</button>
```

<a id="removed-controls"></a>

### 6. Focus management: Avoid removing buttons from the DOM (🟡 MEDIUM PRIORITY)

- After a button is pressed, if it is removed from the DOM it causes focus management issues.
- From a UI perspective, often the most predictable thing to do is to leave the element in the DOM and keep focus on it after it's been pressed. See section 5 above
- If removing elements from the DOM, ensure that focus is placed somewhere that is logical to keyboard users.

<a id="escape-dismissal"></a>

### 7. Handle Esc key for dismissible UI elements (🔴 HIGH PRIORITY)

Dismissible modal dialogs, panels, and popups should respond to Esc. MUI Dialog provides Escape handling through `onClose`; custom components may need their own handler. Nested content handles Escape first, and the time slider can defer closing as described above.

**Pattern 1: GeoView Popper component (simplest)**

The GeoView `Popper` component from `@/ui` accepts `handleEscapeKey` directly:

```typescript
import { handleEscapeKey } from '@/core/utils/utilities';

<Popper
  open={isOpen}
  anchorEl={anchorEl}
  onClose={handleClose}
  handleKeyDown={handleEscapeKey}  // ← Pass directly
>
  {/* content */}
</Popper>
```

**Pattern 2: MUI Dialog dismissal**

MUI Dialog handles Escape and calls `onClose` with the `escapeKeyDown` reason unless Escape dismissal is disabled. GeoView's fullscreen dialog uses this behavior; an explicit `onKeyDown` is not required:

```typescript
<Dialog open={isOpen} onClose={handleClose}>
  {/* content */}
</Dialog>
```

**Pattern 3: Custom keyboard dismissal**

For custom content that owns dismissal and must keep a parent panel open, handle propagation at the event boundary:

```typescript
import { handleEscapeKey } from '@/core/utils/utilities';

<Box
  onKeyDown={(event) => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    handleEscapeKey(event.key, handleClose);
  }}
>
  {/* content */}
</Box>
```

**Critical detail:** `handleEscapeKey` expects a **key string** (`event.key`), not the event object itself. It does not stop propagation. If closing nested content must leave its parent open, call `event.stopPropagation()` in the nested handler.

**What to check in code review:**

- ❌ **ISSUE**: Dismissible content with no effective keyboard dismissal path
- ❌ **ISSUE**: A single Escape unintentionally closes both nested content and its parent
- ❌ **VIOLATION**: Passing entire event object to `handleEscapeKey` instead of `event.key`
- ✅ **CORRECT**: Built-in or custom Escape handling closes the intended content and restores focus

### 8. Announce loading states and progress updates using ARIA live regions (🟡 MEDIUM PRIORITY)

Avoid "loader fatigue" by not announcing every incremental progress update. Keep the named ProgressBar available to assistive technology and use a separate status message for meaningful milestones, completion, or errors when needed.

See [aria-live](#aria-live) for announcement rules, atomic messages, and the shared implementation example.

<a id="keyboard-tooltips"></a>

### 9. Avoid Tooltips on Non-Interactive Elements (🟡 MEDIUM PRIORITY)

Tooltips on non-focusable elements like ListItem are not available through keyboard focus. For an action, attach the tooltip to an interactive control such as ListItemButton. For static content, provide essential information as visible text rather than a hover-only tooltip.

```typescript
// Bad
<Tooltip title="Select layer xyz on the map">
  <ListItem>Layer xyz</ListItem>
</Tooltip>

// Good
<Tooltip title="Select layer xyz on the map">
  <ListItemButton>layer xyz</ListItemButton>
</Tooltip>
```

### 10. Provide Text Alternatives for Images (🟡 MEDIUM PRIORITY)

Informative images need a meaningful text alternative. Decorative images, or images whose
information is already conveyed by adjacent text, use `alt=""` so screen readers can ignore them.
Use translated descriptions for images authored by the application.

```typescript
// Decorative or redundant with adjacent text
<img src={imageUrl} alt="" />

// Informative
<img src={imageUrl} alt={imageDescription} />
```

Some legend and map imagery lacks descriptive source metadata; see the
[non-text content limitations](#sc-111-non-text-content).

---

## 004. ARIA Best Practices

### aria-current

Indicates that this element represents the current item within a container or set of related elements. This is a good choice for buttons that select layers.

### aria-label

ARIA labels should clearly describe an element's purpose, not just its type or location.

- Generic labels like "button" or "link" are redundant since screen readers already announce the element's role.
- Each label should pass the out-of-context test — it should make sense when read in isolation, as screen reader users often navigate by tabbing through interactive elements without surrounding context.
- Avoid repeating the same label across multiple elements. Several "Learn more" buttons, for example, leave keyboard and screen reader users with no way to distinguish between them.

```typescript
// Bad — role is repeated in the label, and label lacks context
<Button aria-label="Toggle visibility button" />

// Good — role is omitted, action and target are clear
<Button aria-label="Toggle visibility - Confederation to 1914" />
```

```typescript
// Bad — identical labels across multiple elements
<Button aria-label="Learn more" />
<Button aria-label="Learn more" />
<Button aria-label="Learn more" />

// Good — each label is distinguishable
<Button aria-label="Learn more about the Confederation era" />
<Button aria-label="Learn more about WWI" />
<Button aria-label="Learn more about Industrialisation" />
```

#### Select Naming

GeoView's `Select` wrapper requires exactly one naming prop: a non-empty visible `label` or
`aria-label`. Use translated text, or the configured attribute display label for filter controls.
The wrapper connects visible labels automatically; provide `labelId` only when an integration
needs a specific label ID.

```typescript
<Select label={fieldLabel} value={value} onChange={handleChange} menuItems={menuItems} />

<Select aria-label={fieldLabel} value={value} onChange={handleChange} menuItems={menuItems} />
```

### aria-live

Announce loading states and progress updates using ARIA live regions

**When to use aria-live**

Use aria-live to announce state changes that a screen reader user might otherwise miss — such as a background process completing, an error appearing off-screen, or an asynchronous result arriving.
Avoid duplicate or excessively frequent announcements:

- When focus moves to updated content or a control already announces its changed state/value, an extra live announcement may be unnecessary. A user action can still need a status announcement, such as the number of search results
- When content updates frequently (e.g. a progress bar advancing during a layer load), announce meaningful milestones or the final outcome rather than every update. Users can also inspect the named progress bar

**aria-atomic**

- aria-atomic="true": the entire region is read as a single unit when any part of it changes. Use this for self-contained messages like "3 of 10 layers loaded" or "Search complete — 5 results found".
- aria-atomic="false": only the changed node is announced. Use this when the region contains multiple independent pieces of information that update separately.
- `role="status"` already implies `aria-live="polite"` and `aria-atomic="true"`, so these attributes do not need to be repeated.

**Pattern**

The aria-live region and progress bar serve separate concerns — the live region handles screen reader announcements, while the progress bar provides visual feedback. Keep them decoupled:

```typescript
// Visually hidden live region — announces final outcome to screen readers.
// Not updated during incremental progress, only on completion or error.
<Box sx={sxClasses.visuallyHidden} role="status" aria-live="polite" aria-atomic="true">
  {statusMessage}
</Box>

// Progress bar provides visual feedback during loading.
// Not announced via aria-live — user can discover via navigation.
{isLoading && (
  <Box sx={sxClasses.progressBar}>
    <ProgressBar aria-label={t('geolocator.loadingResults')} />
  </Box>
)}
```

### aria-pressed

See the Legend panel for an implementation example.

The aria-pressed attribute is only relevant for toggle buttons. Use aria-pressed to communicate toggle state rather than changing the button label dynamically.

- When a label changes on toggle, screen readers announce the entire new label on every state change — users hear "Hide Layer Name button" / "Show Layer Name button" instead of a clean state update.
- aria-pressed provides a dedicated semantic state (pressed / not pressed) that is announced separately from the label, which is more predictable and easier to maintain.

GeoView uses stable labels with `aria-pressed` for button toggles. A changing action label without `aria-pressed` is a different valid pattern, but is not the convention used here. Checkbox controls use checked state instead. See the [WAI-ARIA button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/).

```typescript
// Bad — label changes on toggle, causing verbose and repetitive announcements
<IconButton
  aria-label={isPressed ? 'Hide Layer Name' : 'Show Layer Name'}
/>

// Good — label stays stable, aria-pressed communicates state change
<IconButton
  aria-label="Toggle visibility, Layer Name"
  aria-pressed={isPressed}
/>
```

**Note:** The comma in "Toggle visibility, Layer Name" creates a natural spoken pause between the action and the target, improving clarity for screen reader users.

---

## 005. Quick Testing Tips and Notes

These are quick checks for human testers. The [accessibility release tests](../programming/release-testing/21-wcag-accessibility.md)
cover keyboard navigation, focus traps, screen-reader behavior, and visual indicators.

### SC 1.4.4 - Resize text

- Set browser zoom to 200%. Verify that text remains readable and that no content or functionality is lost.

### SC 1.4.5 - Images of Text

- This does not include text that is part of a picture that contains significant other visual content such as graphs, screenshots, and diagrams which visually convey important information through more than just text.
- [W3C - Understanding Success Criterion 1.4.5](https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-text-presentation.html#:~:text=1.4.5%20Images%20of%20Text,to%20the%20information%20being%20conveyed.)

### SC 1.4.10 - Reflow

- Set the browser's content area to 1280 CSS pixels wide, then zoom to 400%. Verify that content fits the resulting 320 CSS pixel width without loss of content or functionality
- The map itself can require two-dimensional scrolling; surrounding controls, text, and panels should still reflow

### SC 1.4.12 - Text Spacing

- [Text spacing bookmarklet](https://www.html5accessibility.com/tests/tsbookmarklet.html)
- Verify no loss of content or functionality with line height at 1.5 times font size, paragraph spacing at 2 times font size, letter spacing at 0.12 times font size, and word spacing at 0.16 times font size

---

## 006. Constraints and Limitations

GeoView is built to meet WCAG 2.1 Level AA. Some requirements are limited by the nature of map content, missing descriptions from external data providers, or browser behavior. This section explains those limitations, their impact, and how the relevant WCAG criteria have been interpreted. Where a limitation remains an accessibility gap rather than a permitted exception, it is identified below.

### Fullscreen API and ESC Key Priority

When the Fullscreen API is active, browsers commonly use Esc to exit fullscreen before the application receives the key. GeoView cannot override the browser's exit mechanism.

**Implication for UI design:** If browser fullscreen and a panel are both open, users may need two Esc presses: one to exit browser fullscreen and another to close the panel. The exact behavior depends on the browser and operating system.

**Note:** This constraint applies only to browser fullscreen via the Fullscreen API, not panel "fullscreen views".

### SC 1.1.1 Non-text Content

Providing meaningful alternative text is not always possible for all image types within GeoView:

- **Decorative imagery:** Images that convey no information, or whose information is already provided in adjacent text, use empty alternative text (`alt=""`) so assistive technology can ignore them. This follows [technique H67](https://www.w3.org/WAI/WCAG22/Techniques/html/H67)
- **Dynamic or generated content:** Map tiles and rendered layers may contain complex visual information that GeoView cannot reliably describe at runtime
- **Provider-supplied imagery:** Images uploaded or linked by external data providers may arrive without descriptive metadata. In these cases, the missing description is a source-data limitation, not information GeoView has discarded. A meaningful alternative may require additional information from the provider

Empty alt text does not describe informative imagery. Where information is unavailable in text, this remains an accessibility limitation rather than an H67 exception.

#### Examples:

- Some legend-item and layer-detail symbol images use `alt=""` because no visual description is available. Adjacent names identify the items, but do not describe their colour, shape, or other visual properties
- WMS legend images and their lightboxes use a translated legend label and the title when available. This identifies the image, but does not describe the symbols within it

#### References:

- [WCAG - Understanding Success Criterion 1.1.1: Non-text Content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html)

### SC 1.3.1 Info and Relationships

#### Symbology Images

This limitation is related to the **missing symbol descriptions discussed under SC 1.1.1 above.** Where a legend relies on colour, size, or shape to connect a symbol to a map feature, users of assistive technology may not have an equivalent text description of that relationship.

**Impact** for users: Users can show and hide map elements by name, but may be unable to independently interpret the associated symbols. Named controls preserve access to visibility actions; they do not resolve the missing descriptions.

##### Examples:

- Layers panel
- Legend panel

#### Select Components

Non-native MUI Select controls use ARIA labelling rather than a native `<label for>` association. GeoView's wrapper connects a visible label through `labelId`, or accepts an `aria-label` when no visible label is provided.

If an automated validator reports an orphaned label, check the rendered control's accessible name and label references. A warning can be documented as a false positive when the association works correctly, including with a screen reader; do not suppress it solely because the control uses MUI.

#### References:

- [Understanding Success Criterion 1.3.1: Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html)

### SC 3.1.2 Language of Parts

Some content within the GeoView app may not include a lang attribute to identify passages in a language other than the page default. This is a known limitation with the following rationale:

- Third-party content: External providers may not supply language metadata for their content, so GeoView cannot reliably tag it without additional information. Untagged natural-language passages remain a limitation
- Technical data without a defined language: Coordinates, codes, and identifiers may not belong to a natural language. SC 3.1.2 allows exceptions for proper names, technical terms, words of indeterminate language, and words or phrases that have become part of the surrounding vernacular

#### Examples:

- Geolocator place names can fall under the proper-name exception
- Layer names and descriptions may contain passages in another language without provider-supplied language metadata

#### References:

- [WCAG - Understanding Success Criterion 3.1.2: Language of Parts](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html)
- [GC - Accessible Canada Regulations](https://laws.justice.gc.ca/eng/regulations/SOR-2021-241/nifnev.html)

---

## 007. Tools and Resources

### Resources

- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/TR/WCAG21/)
- [How to Meet WCAG (Quick Reference)](https://www.w3.org/WAI/WCAG22/quickref/?currentsidebar=%23col_overview&versions=2.1&levels=aaa#consistent-navigation)
- [Accessibility – React (no longer updated)](https://legacy.reactjs.org/docs/accessibility.html)
- [React Focus Trap component - MUI Base](https://mui.com/base-ui/react-focus-trap)
- [Map Accessibility / Minnesota IT Services](https://mn.gov/mnit/about-mnit/accessibility/maps/)

### Tools and Browser Extensions:

- [Accessibility Insights Downloads](https://accessibilityinsights.io/downloads/)
- [axe DevTools](https://chromewebstore.google.com/detail/lhdoppojpmngadmnindnejefpokejbdd)
- [axe Core](https://github.com/dequelabs/axe-core)
- [Stark Accessibility Checker](https://chromewebstore.google.com/detail/stark-accessibility-check/fkfaapnmfippddbeemjjbclenphooipm)
- [taba11y - Tab order accessibility testing](https://chromewebstore.google.com/detail/taba11y-tab-order-accessi/aocppmckdocdjkphmofnklcjhdidgmga)
- [Text spacing bookmarklet](https://www.html5accessibility.com/tests/tsbookmarklet.html)
- [WAVE Evaluation Tool](https://chromewebstore.google.com/detail/wave-evaluation-tool/jbbplnpkjmmeebjpijfedlgcdilocofh)
- [WCAG Color contrast checker](https://chromewebstore.google.com/detail/wcag-color-contrast-check/plnahcmalebffmaghcpcmpaciebdhgdf)

---

## <a id="code-review-checklist"></a>008. Code Review Checklist — Common Accessibility Patterns

This section helps branch reviewers spot common accessibility issues. Some checks are supported by TypeScript or ESLint; others require human judgment and runtime testing. See the related [best practices](../programming/best-practices.md#accessibility).

**Purpose:** Assist developers during branch review by flagging patterns that commonly lead to accessibility issues. These are **not merge blockers** — they help catch mistakes early, but WIP and incremental improvements are welcome.

The explanations and examples are maintained once in [Best Practices](#003-best-practices) and
[ARIA Best Practices](#004-aria-best-practices). Use this checklist as a review aid:

| Check              | What to verify                                                                               | Guidance                                           |
| ------------------ | -------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Icon buttons       | The required label is non-empty, translated, and meaningful                                  | [Use IconButton](#icon-buttons)                    |
| Semantic controls  | Actions use buttons and navigation uses links; no hand-rolled buttons                        | [Semantic controls](#semantic-controls)            |
| Toggle state       | Button toggles have stable labels and `aria-pressed`; checkboxes use checked state           | [aria-pressed](#aria-pressed)                      |
| Disabled states    | Temporary unavailability preserves focus where appropriate; activation handlers return early | [Disabled states](#disabled-states)                |
| Removed controls   | Focus moves to a logical target when an element is removed                                   | [Removed controls](#removed-controls)              |
| Escape dismissal   | Built-in or custom handlers close the intended content and restore focus                     | [Escape dismissal](#escape-dismissal)              |
| Image alternatives | Informative images have descriptions; decorative images use empty alt text                   | [Non-text content](#sc-111-non-text-content)       |
| Tooltips           | Essential information is available to keyboard users                                         | [Keyboard-accessible tooltips](#keyboard-tooltips) |
| Live announcements | Necessary results are announced without duplicating focus or control feedback                | [aria-live](#aria-live)                            |
| IDs                | IDs and label references remain unique across loops and viewer instances                     | [Unique element IDs](#unique-element-ids)          |
| Contextual names   | Labels distinguish the action and its target                                                 | [aria-label](#aria-label)                          |
| Atomic messages    | Announcements include enough context; account for the implicit behavior of `role="status"`   | [aria-live](#aria-live)                            |
| Touch targets      | Measure the clickable area against the 44×44 CSS pixel design goal                           | [WCAG checks](#wcag-checks)                        |

For source-search patterns and enforcement details, see the
[accessibility review procedure](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/.github/ai/ui-style-a11y-i18n.md#accessibility-review-procedure).
