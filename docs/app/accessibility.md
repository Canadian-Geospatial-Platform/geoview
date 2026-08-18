# Accessibility

Accessibility is a priority in GeoView's development. The application follows WCAG 2.1 Level AA guidelines whenever possible, and this section highlights the key features implemented for visual, keyboard, and screen reader users.

## 001. Accessibility Features Overview

### 1. For Keyboard Users

#### Keyboard Navigation Mode

On first tab into the map, users are prompted to enable keyboard navigation mode, which enables a focus trap within the map, and activates crosshair-based map interaction.

- Press Ctrl + Q to exit keyboard navigation mode
- Press Ctrl + M to focus on the crosshair within the map

#### Focus Traps for Enhanced Navigation

Opening a panel (e.g., Layers, Legend, Details) triggers a focus trap that confines keyboard navigation within that panel:

- Speeds up navigation by preventing focus from cycling through the entire map
- Close the panel by pressing **Esc** — focus automatically returns to the button that opened it
- A **Close** or **Exit** button is provided within each trapped panel for explicit closure

Sub-panels provide similar functionality.

#### Context-Aware Esc Key

The Esc key intelligently handles different scenarios:

- Closes the active panel and restores focus to the triggering button, or
- Closes modal dialogs (lightbox, export, etc.) and restores focus to the triggering button

### 2. For Screen Reader Users

#### Semantic Landmarks

Semantic landmarks are included for each important section of the app to enable quick navigation.

#### ARIA Live Regions

Real-time announcements for events such as:

- Map loading status ("Loading map" → "Map loaded")
- Processing completion ("Processing" → "Processing complete")
- Measurement results (distance/area values)

#### Descriptive Labels

All interactive elements include context-specific aria-label attributes:

- Icon buttons: "Zoom in", "Toggle visibility, Layer Name", "Close panel"
- Panels: "Layers panel", "Legend panel", "Details panel"
- Toggle states: Communicated via `aria-pressed` (stable labels, not dynamic text changes)

---

## 002. Intentional Interaction Patterns

### 1. Time Slider

**Esc key behaviour in normal mode:**

When the time slider panel is open and either animation is playing OR layers are loading, pressing Esc initiates a deferred close:

1. Animation stops immediately (if playing)
2. The Esc key press is blocked from propagating
3. The panel remains open until both conditions clear (animation stopped AND layers finished loading)
4. During this brief period, tabbing through the right panel remains possible
5. Once conditions stabilize, the panel auto-closes and focus returns to the layer button in the left panel

**Esc key behaviour in fullscreen mode:**

When the time slider is in fullscreen mode, Esc stops any active animation and immediately closes the fullscreen dialog. Focus management is handled by the dialog component.

**Rationale:**

This deferred-close pattern prevents focus trap corruption that occurs when the panel DOM is removed mid-animation or while layers are still loading.

### 2. Multi-Panel Auto-Open and Focus Priority

**Focus trap mutual exclusion when multiple panels open:**

When a map interaction (such as clicking a feature) triggers multiple panels to auto-open simultaneously (e.g., Details panel in the app-bar and Chart panel in the footer-bar), only one panel can receive the focus trap at a time.

Only focus-trapped panels display a close button. This means that only the panel receiving focus will display a close button.

**Behavior:**

1. **Priority order** — One panel will be prioritized to receive the focus trap, while other auto-opened panels remain accessible without focus trap
2. **Non-focused panels remain keyboard-accessible** — Users can Tab through auto-opened panels that aren't focus-trapped, but these panels won't display a close button until explicitly activated (by pressing on a layer in that panel, for example)
3. **Activating a non-focused panel** — Navigate to the panel with Tab, then press Enter or Space on a layer in the left panel list. This enables the focus trap and reveals the close button.

**Rationale:**

This mutual exclusion pattern balances WCAG requirements with multi-panel workflows:

- Prevents multiple simultaneous traps (which are disorienting for keyboard users)
- Maintains keyboard access to all auto-opened content (users can explore without being trapped)
- Requires explicit activation (Enter/Space on a layer) to enable panel-level focus management

This is intentional architectural behaviour, not a bug.

---

## 003. Best Practices

**Guidance for code review:**

These guidelines help catch common accessibility issues during branch review. They are **advisory, not blocking** — the goal is to assist developers in writing accessible code, not to prevent work-in-progress from merging.

**Priority levels:**

- 🔴 **HIGH PRIORITY** — WCAG violation, should be addressed before release
- 🟡 **MEDIUM PRIORITY** — Accessibility gap, worth fixing when feasible
- 🔵 **ENHANCEMENT** — Best practice, improves user experience

---

### 1. Use unique and valid element IDs (🔴 HIGH PRIORITY)

Every element id in the DOM must be unique. Duplicate IDs break label-input associations (htmlFor), invalidate ARIA relationships (aria-labelledby, aria-describedby), and cause screen readers to behave unpredictably.

- Ensure IDs are always unique across the entire map viewer
- Use kebab-case (as much as possible)
- **Layer paths can generate invalid IDs** because they may contain special characters (`/`, `.`, spaces) that are not valid in HTML id attributes

**ID naming patterns** (from least specific to most specific):

```typescript
// Pattern 1: Element in a container
`${mapId}-${containerType}-${elementName}`
// Example: "mapA-footer-zoom-button"

// Pattern 2: Element in a panel within a container
`${mapId}-${containerType}-${panelId}-${elementName}`
// Example: "mapA-footer-layers-panel-close-button"

// Pattern 3: When a truly unique ID is required
// Generate uniqueId using React's useId() or generateId(8)
`${mapId}-${containerType}-${elementName}-${uniqueId}`;
// Example: "mapA-footer-layer-item-k8j3n2m9"
```

**Sanitizing layer paths for IDs:**

```typescript
// ❌ Bad: using raw layer path
id={layerPath}  // Could be "group/sublayer.json" — invalid!

// ✅ Good: sanitized
id={`${mapId}-layer-${layerPath.replace(/[/.\s]/g, '-')}`}
```

### 2. Use Semantic Elements for Interactions (🔴 HIGH PRIORITY)

Clickable `<div>` and `<span>` elements are inaccessible by default — they receive no keyboard focus, emit no semantic role, and are invisible to assistive technologies. Native `<button>` and `<a>` elements come with built-in keyboard support, appropriate ARIA roles, and browser-managed focus behaviour at no extra cost. In MUI, use Button, IconButton, and Link components over attaching onClick handlers to arbitrary elements.

### 3. Use IconButton for buttons without labels (🔴 HIGH PRIORITY)

The IconButton component in GeoView has built-in accessibility support. Use IconButton instead of Button when a button does not have a text label.

### 4. Ensure WCAG 2.1 Level AA Compliance (🟡 MEDIUM PRIORITY)

**Critical checks during code review:**

- ✅ All interactive elements have accessible names (via `aria-label`, `aria-labelledby`, or visible text)
- ✅ Form inputs are associated with labels (via `<label>` or `aria-labelledby`)
- ✅ Color is not the only means of conveying information
- ✅ Focus indicators are visible and meet 3:1 contrast ratio
- ✅ Interactive elements have minimum 44×44px touch target (WCAG 2.2 AAA, but GeoView target)

**Testing tools (post-implementation):**

- [W3C Markup Validator](https://validator.w3.org/)
- [axe DevTools](https://www.deque.com/axe/devtools/) browser extension
- Lighthouse accessibility audit in Chrome DevTools

### 5. Focus management: Use aria-disabled instead of disabled on UI elements that toggle between enabled/disabled states (🟡 MEDIUM PRIORITY)

When a button has keyboard focus and becomes disabled on press, focus is lost and jumps unpredictably to another element, disorienting keyboard users who lose track of their position in the interface.

- Use aria-disabled instead of disabled
- Style the aria-disabled element to look like it would if disabled
- Add early return in event handler to prevent action when aria-disabled is true

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

### 6. Focus management: Avoid removing buttons from the DOM (🟡 MEDIUM PRIORITY)

- After a button is pressed, if it is removed from the DOM it causes focus management issues.
- From a UI perspective, often the most predictable thing to do is to leave the element in the DOM and keep focus on it after it's been pressed. See section 5 above
- If removing elements from the DOM, ensure that focus is placed somewhere that is logical to keyboard users.

### 7. Handle Esc key for dismissible UI elements (🔴 HIGH PRIORITY)

All modal dialogs, panels, and popups that can be closed must respond to the Esc key.

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

**Pattern 2: Other components (Panel, Dialog, native elements)**

For components with `onKeyDown` props or native event listeners, extract `event.key`:

```typescript
import { handleEscapeKey } from '@/core/utils/utilities';

// Inline usage (simplest)
<Panel
  onKeyDown={(event: KeyboardEvent) => {
    handleEscapeKey(event.key, () => {
      onClose();
    });
  }}
>
  {/* content */}
</Panel>

// Or with useCallback (if reused or in dependency arrays)
const handleKeyDown = useCallback((event: KeyboardEvent): void => {
  handleEscapeKey(event.key, onClose);
}, [onClose]);

<Dialog onKeyDown={handleKeyDown}>
  {/* content */}
</Dialog>
```

**Critical detail:** `handleEscapeKey` expects a **key string** (`event.key`), not the event object itself.

**What to check in code review:**

- ❌ **VIOLATION**: Modal/panel/popup with no keyboard handler
- ❌ **VIOLATION**: Custom Esc key handling that doesn't prevent propagation
- ❌ **VIOLATION**: Passing entire event object to `handleEscapeKey` instead of `event.key`
- ✅ **CORRECT**: Using `handleEscapeKey` utility from `@/core/utils/utilities` with `event.key`

### 8. Announce loading states and progress updates using ARIA live regions (🟡 MEDIUM PRIORITY)

Avoid "Loader Fatigue" by not using aria-live or role="status" when using <ProgressBar>s while layers are loading. Let the user discover them via navigation.

Do not use aria-live for content changes that are the direct and expected result of a user-initiated action on a clearly labelled control. For example, when pressing a layer button updates a panel's content.

Otherwise, use as follows:

- aria-atomic="true" is appropriate for short updates. Use false if updates are longer.

```typescript
{/* WCAG - ARIA live region for screen reader announcements */}
<Box sx={sxClasses.visuallyHidden} role="status" aria-live="polite" aria-atomic="true">
  {statusMessage}
</Box>

{isLoading && (
  <Box sx={sxClasses.progressBar}>
    <ProgressBar aria-label={t('geolocator.loadingResults')} />
  </Box>
)}
```

### 9. Avoid Tooltips on Non-Interactive Elements (🟡 MEDIUM PRIORITY)

Tooltips should not be placed on non-interactive elements like ListItem because assistive technologies such as screen readers cannot focus on them, making the tooltip content completely inaccessible to keyboard-only users and those using screen readers.

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

### aria-live

Announce loading states and progress updates using ARIA live regions

**When to use aria-live**

Use aria-live to announce state changes that a screen reader user would otherwise have no way of knowing about — such as a background process completing, an error appearing off-screen, or an asynchronous result arriving.
Do not use aria-live when:

- The change is the direct and expected result of a user action on a clearly labelled control. For example, pressing a layer button that visibly updates a panel — the user initiated the action and expects a response, so no announcement is needed.
- Content is updating incrementally and frequently (e.g. a progress bar advancing during a layer load). Announcing every update creates a noisy, disruptive experience. Instead, let the user discover the progress bar via navigation, and use aria-live only to announce the final outcome (e.g. "14 layers loaded").

**aria-atomic**

- aria-atomic="true": the entire region is read as a single unit when any part of it changes. Use this for self-contained messages like "3 of 10 layers loaded" or "Search complete — 5 results found".
- aria-atomic="false": only the changed node is announced. Use this when the region contains multiple independent pieces of information that update separately.

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

### SC 1.4.4 - Resize text

- Set browser zoom level to 200%

### SC 1.4.5 - Images of Text

- This does not include text that is part of a picture that contains significant other visual content such as graphs, screenshots, and diagrams which visually convey important information through more than just text.
- [W3C - Understanding Success Criterion 1.4.5](https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-text-presentation.html#:~:text=1.4.5%20Images%20of%20Text,to%20the%20information%20being%20conveyed.)

### SC 1.4.10 - Reflow

- Resize browser window to 1280 pixels wide and set zoom level to 400%

### SC 1.4.11 - Text Spacing

- [Text spacing bookmarklet](https://www.html5accessibility.com/tests/tsbookmarklet.html)

---

## 006. Constraints and Limitations

GeoView is built to meet WCAG 2.1 Level AA. Where full conformance is not technically achievable — due to the nature of the app's content or its reliance on third-party data sources — the constraint is documented with a rationale. **These are not failures;** they are considered exceptions within the bounds of what the WCAG specification allows, and will be revisited as the app evolves.

### Fullscreen API and ESC Key Priority

**ESC exits browser fullscreen first, closes panels second — one press at a time, no exceptions.** When the Fullscreen API is active (entire browser window in fullscreen), the browser intercepts ESC as a user-safety mechanism before any application JavaScript runs. This is a security feature of the Fullscreen API spec, not something GeoView controls. It's not something to design around; it's something to design _with_.

**Implication for UI design:** If a user has both browser fullscreen active AND a panel open, they'll need two ESC presses: one to exit browser fullscreen, another to close the panel. This two-step sequence cannot be collapsed into one.

**Note:** This constraint applies only to browser fullscreen via the Fullscreen API, not panel "fullscreen views".

### SC 1.1.1 Non-text Content

Providing programmatically determinable alt text is not always possible for all image types within GeoView. In these cases, the app uses an empty alt attribute (alt=""), in accordance with WCAG sufficient technique H67, which applies to the following content categories:

- **Decorative imagery:** Images that are purely presentational and convey no information relevant to the page content.
- **Dynamic or generated content:** Map tiles, rendered layers, and other programmatically generated visuals whose content cannot be reliably described at runtime.
- **User-supplied imagery:** Images uploaded or linked by external data providers, where the originating source has not supplied descriptive metadata.

Empty alt is not used as a substitute for informative images where a meaningful text alternative could reasonably be authored.

#### Examples:

- The legend symbol images cannot be programmatically described at this time.
- Images that appear in the legend panel (and their corresponding light boxes) do not have descriptive text available for them. Therefore, they have been made to use empty alt attributes.

#### References:

- [WCAG - Understanding Success Criterion 1.1.1: Non-text Content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html)

### SC 1.3.1 Info and Relationships

#### Symbology Images

This gap is a consequence of the **same issue described under SC 1.1.1 above.** Because symbology images cannot be programmatically described at this time, the relationship between a symbol's visual properties — such as colour, size, and shape — and the map element it corresponds to cannot be conveyed to assistive technology (AT) users. Without a text alternative for what a symbol looks like, that relationship has no programmatic basis to be determined from.

**Impact** for users: AT users are not blocked from interacting with map symbology — they can show and hide map elements by name — but cannot independently interpret what the associated symbols look like. This is a partial gap rather than a complete barrier to use.

##### Examples:

- Layers panel
- Legend panel

#### Select Components

MUI Select components may be flagged by automated WCAG validators (such as axe or Lighthouse) as having orphaned form labels, even when the component is correctly implemented. This occurs because some scanners expect a `<label>`'s `for` attribute to target a native HTML form element (`<input>`, `<select>`, etc.), and do not recognize a `<div role="combobox">` as a valid target.

In practice, MUI's rendered output correctly pairs the label's `for` attribute with the combobox `id`, and sets `aria-labelledby` on the interactive element — meaning screen readers will announce the label as expected.

These validator warnings can be treated as false positives and suppressed or documented as known exceptions in your accessibility audit, provided the `FormControl`, `InputLabel`, and `Select` components are composed together as intended by MUI.

#### References:

- [Understanding Success Criterion 1.3.1: Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html)

### SC 3.1.2 Language of Parts

Some content within the GeoView app may not include a lang attribute to identify passages in a language other than the page default. This is a known limitation with the following rationale:

- Third-party content: Some data displayed in the app is sourced from external providers. Language tagging of that content is outside the app's direct control and is the responsibility of the originating data owner.
- Technical data without a defined language: Certain scientific, geospatial, or domain-specific values (coordinates, codes, identifiers) do not belong to a natural language and cannot be reliably tagged.

#### Examples:

- Geolocator search results
- Layer names

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

This section helps branch reviewers spot common accessibility issues. Like other [best practices](programming/best-practices.md) in GeoView, these guidelines **rely on the goodwill of our programmers** and are not enforced automatically.

**Purpose:** Assist developers during branch review by flagging patterns that commonly lead to accessibility issues. These are **not merge blockers** — they help catch mistakes early, but WIP and incremental improvements are welcome.

**For concise code review patterns, see [best-practices.md Section 17](programming/best-practices.md#accessibility).**

**TypeScript Enforcement:** Some accessibility rules are enforced at compile time by TypeScript and **do not need manual review**. These are marked with ✅ **TypeScript-enforced**.

**Manual review patterns** that benefit from human/AI review are marked with ⚠️ **Manual check helpful**.

### Summary: What to Check in Code Review

| Pattern                             | TypeScript-enforced? | Review Recommendation                  |
| ----------------------------------- | -------------------- | -------------------------------------- |
| IconButton missing `aria-label`     | ✅ Yes               | **Skip** — compiler prevents this      |
| onClick on non-semantic element     | ❌ No                | **Check** — common accessibility issue |
| Dynamic aria-label on toggles       | ❌ No                | **Check** — common accessibility issue |
| `disabled` prop causing focus loss  | ❌ No                | **Check** — common accessibility issue |
| Modal without Esc key handler       | ❌ No                | **Check** — common accessibility issue |
| Missing `alt` attribute             | ❌ No                | **Check** — common accessibility issue |
| Tooltip on non-interactive element  | ❌ No                | **Check** — common accessibility issue |
| aria-live on user-initiated updates | ❌ No                | **Consider** — may be unnecessary      |
| Duplicate element IDs               | ❌ No                | **Check** — common accessibility issue |
| Generic aria-labels                 | ❌ No                | **Consider** — enhancement             |
| Missing aria-atomic                 | ❌ No                | **Consider** — enhancement             |
| Small touch targets                 | ❌ No                | **Consider** — enhancement             |

---

### **HIGH PRIORITY PATTERNS** (Common issues worth addressing)

#### ✅ IconButton missing `aria-label` — **TypeScript-enforced** (no review needed)

**Status:** This is automatically caught by TypeScript at compile time. The code will not compile without an `aria-label` prop on `IconButton`.

```typescript
// ❌ Will NOT compile — TypeScript error
<IconButton onClick={handleClick}>
  <CloseIcon />
</IconButton>
// Error: Property 'aria-label' is missing in type '...'

// ✅ CORRECT — required by TypeScript
<IconButton aria-label={t('general.close')} onClick={handleClick}>
  <CloseIcon />
</IconButton>
```

**Implementation detail:** GeoView's `IconButton` component extends MUI's `IconButtonProps` with `Omit<IconButtonProps, 'aria-label'>` and adds `'aria-label': string` (not optional), making it a required prop enforced by the type system.

**For code reviewers:** You do not need to check for missing `aria-label` on `IconButton` — TypeScript already prevents this violation.

---

#### ⚠️ onClick on non-semantic element without accessibility support — **Manual check helpful**

```typescript
// VIOLATION — clickable div with no keyboard support
<div onClick={handleClick}>Click me</div>
<span onClick={handleClick}>Click me</span>

// CORRECT — use Button or add full keyboard support
<Button onClick={handleClick}>Click me</Button>

// OR (if Box is required for styling)
<Box
  onClick={handleClick}
  onKeyDown={handleKeyDown}  // Must handle Enter/Space
  role="button"
  tabIndex={0}
>
  Click me
</Box>
```

**Search pattern:** `onClick` on `<div>`, `<span>`, `<Box>` without `role="button"` and `tabIndex`

**Why this matters:** Keyboard users cannot activate clickable divs/spans — they are not focusable and do not respond to Enter/Space keys.

---

#### ⚠️ Dynamic aria-label on toggle buttons — **Manual check helpful**

```typescript
// VIOLATION — label changes on every toggle
<IconButton
  aria-label={isVisible ? 'Hide layer' : 'Show layer'}
/>

// CORRECT — stable label + aria-pressed
<IconButton
  aria-label="Toggle visibility, Layer Name"
  aria-pressed={isVisible}
/>
```

**Search pattern:** `aria-label=` with ternary operator (`? :`) on buttons that toggle state

**Why this matters:** Changing labels create verbose announcements ("Hide layer button" / "Show layer button") instead of clean state updates.

---

#### ⚠️ `disabled` prop causing focus loss — **Manual check helpful**

```typescript
// VIOLATION — button becomes disabled on click, loses focus
<Button disabled={isProcessing} onClick={handleClick}>
  Submit
</Button>

// CORRECT — aria-disabled keeps focus
<Button
  aria-disabled={isProcessing}
  onClick={(e) => {
    if (isProcessing) return;
    handleClick(e);
  }}
  sx={{
    // Style to look disabled when aria-disabled is true
    opacity: isProcessing ? 0.5 : 1,
    cursor: isProcessing ? 'not-allowed' : 'pointer',
  }}
>
  Submit
</Button>
```

**Search pattern:** `disabled={` on buttons that toggle between enabled/disabled based on state

**Why this matters:** When a button becomes disabled while focused, focus jumps unpredictably to another element, disorienting keyboard users.

---

#### ⚠️ Modal/panel without Esc key handler — **Manual check helpful**

```typescript
// VIOLATION — no keyboard close
<Dialog open={isOpen}>
  <Button onClick={onClose}>Close</Button>
</Dialog>

// CORRECT — responds to Esc key (inline)
import { handleEscapeKey } from '@/core/utils/utilities';

<Dialog
  open={isOpen}
  onKeyDown={(event) => handleEscapeKey(event.key, onClose)}
>
  <Button onClick={onClose}>Close</Button>
</Dialog>

// CORRECT — responds to Esc key (useCallback)
import { handleEscapeKey } from '@/core/utils/utilities';

const handleKeyDown = useCallback((event: KeyboardEvent): void => {
  handleEscapeKey(event.key, onClose);
}, [onClose]);

<Dialog open={isOpen} onKeyDown={handleKeyDown}>
  <Button onClick={onClose}>Close</Button>
</Dialog>
```

**Search pattern:** `<Dialog`, `<Modal`, `<Drawer`, panel components without `onKeyDown` handler

**Why this matters:** Keyboard users expect Esc to close modal content — without it, they may be trapped.

---

### **MEDIUM PRIORITY PATTERNS** (Worth reviewing when feasible)

#### ⚠️ Missing alt attribute on images — **Manual check helpful**

```typescript
// CHECK — is this image decorative or informative?
<img src={imageUrl} />

// If decorative (per SC 1.1.1 exceptions):
<img src={imageUrl} alt="" />

// If informative:
<img src={imageUrl} alt={t('layer.symbolDescription')} />
```

**Search pattern:** `<img` without `alt=` attribute

**Why this matters:** Screen readers announce "image" with no context. Decorative images should use `alt=""`, informative images need descriptive text.

**Known exceptions:** Legend symbol images, map tiles (see section 006).

---

#### ⚠️ Tooltip on non-interactive element — **Manual check helpful**

```typescript
// VIOLATION
<Tooltip title="Layer info">
  <ListItem>Layer name</ListItem>
</Tooltip>

// CORRECT
<Tooltip title="Layer info">
  <ListItemButton>Layer name</ListItemButton>
</Tooltip>
```

**Search pattern:** `<Tooltip>` wrapping non-interactive elements like `ListItem`, `Box`, `Typography`

**Why this matters:** Tooltips require focus/hover — non-interactive elements cannot receive focus, making tooltips inaccessible to keyboard users.

---

#### ⚠️ aria-live on user-initiated content updates — **Manual check helpful**

```typescript
// UNNECESSARY — user clicked the button, expects content to update
<Button onClick={() => setContent('new')}>Update</Button>
<Box role="status" aria-live="polite">{content}</Box>

// aria-live should only announce unexpected/background changes
```

**Search pattern:** `aria-live` on content that updates as the direct result of a user action

**Why this matters:** Announcing expected results creates noise. Reserve `aria-live` for background/async changes users wouldn't otherwise know about.

---

#### ⚠️ Duplicate element IDs — **Manual check helpful**

```typescript
// VIOLATION — same ID used in a loop
{layers.map(layer => (
  <Box key={layer.id} id="layer-item">  {/* All items get same ID! */}
    {layer.name}
  </Box>
))}

// CORRECT — unique IDs
{layers.map(layer => (
  <Box key={layer.id} id={`${mapId}-layer-${layer.id}`}>
    {layer.name}
  </Box>
))}
```

**Search pattern:** IDs generated in loops without unique suffixes

**Why this matters:** Duplicate IDs break ARIA relationships, label associations, and cause unpredictable screen reader behavior.

---

### **ENHANCEMENTS** (Nice-to-have improvements)

#### ℹ️ Generic aria-label lacking context — **Manual check helpful**

```typescript
// IMPROVEMENT OPPORTUNITY
<Button aria-label="Learn more">...</Button>
<Button aria-label="Learn more">...</Button>  {/* Same label! */}

// BETTER — each label is unique and contextual
<Button aria-label="Learn more about layer filtering">...</Button>
<Button aria-label="Learn more about time slider">...</Button>
```

**Search pattern:** Multiple elements with identical `aria-label` values

**Why this matters:** Generic labels don't distinguish between elements when users navigate by button list in screen readers.

---

#### ℹ️ Missing aria-atomic on aria-live region — **Manual check helpful**

```typescript
// INCOMPLETE — missing aria-atomic
<Box role="status" aria-live="polite">
  {statusMessage}
</Box>

// COMPLETE — specifies announcement behavior
<Box role="status" aria-live="polite" aria-atomic="true">
  {statusMessage}
</Box>
```

**Search pattern:** `aria-live` without `aria-atomic`

**Why this matters:** Without `aria-atomic`, screen reader behavior is undefined — some may announce only changed nodes, some may announce the entire region.

---

#### ℹ️ Interactive element with insufficient touch target size — **Manual check helpful**

```typescript
// SUBOPTIMAL — small touch target
<IconButton sx={{ width: '20px', height: '20px' }}>
  <CloseIcon />
</IconButton>

// BETTER — meets 44×44px target
<IconButton sx={{ minWidth: '44px', minHeight: '44px' }}>
  <CloseIcon />
</IconButton>
```

**Search pattern:** Interactive elements with `width`/`height` < 44px

**Why this matters:** Small targets are difficult for users with motor impairments or touch screen users.

---
