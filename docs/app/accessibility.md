# Accessibility

_Work in progress_

The viewer needs to be accessible for keyboard and screen reader. It's should follow WCAG 2.1 requirements: https://www.w3.org/TR/WCAG21

React and accessibility documentation: https://reactjs.org/docs/accessibility.html

We need to trap the navigation inside the map element: https://mui.com/base-ui/react-focus-trap and add a skip link to go over

Manage focus (Modal Dialogs or any full-screen tasks): https://www.npmjs.com/package/react-focus-on

Further documentation: https://simplyaccessible.com/article/react-a11y/

Additional tools:
https://mn.gov/mnit/about-mnit/accessibility/maps/
https://microsoftedge.microsoft.com/addons/detail/axe-devtools-web-access/kcenlimkmjjkdfcaleembgmldmnnlfkn
https://accessibilityinsights.io/downloads/
https://github.com/dequelabs/axe-core

Reference:
https://www.w3.org/WAI/WCAG22/quickref/?currentsidebar=%23col_overview&versions=2.1&levels=aaa#consistent-navigation

## 001. Best Practices

_Work in progress_

### 1. Use unique and valid element IDs

Every element id in the DOM must be unique. Duplicate IDs break label-input associations (htmlFor), invalidate ARIA relationships (aria-labelledby, aria-describedby), and cause screen readers to behave unpredictably.

- ensure ids are always unique
- use kebab-case (as much as possible)
- layer paths can generate invalid ids

Suggested format (goes from least specific to most specific)

```typescript
// Start by prefixing ids with the following
${mapId}-${containerType}-[element]
${mapId}-${containerType}-${panelId}-[element]

// If a unique ID is required. uniqueId could be generated from:
// const uniqueId = useId();
// const uniqueId = generateId(8);
${mapId}-${containerType}-[element]-${uniqueId}
${mapId}-${containerType}-${panelId}-[element]-${uniqueId}
```

### 2. Use Semantic Elements for Interactions

Clickable `<div>` and `<span>` elements are inaccessible by default — they receive no keyboard focus, emit no semantic role, and are invisible to assistive technologies. Native `<button>` and `<a>` elements come with built-in keyboard support, appropriate ARIA roles, and browser-managed focus behaviour at no extra cost. In MUI, use Button, IconButton, and Link components over attaching onClick handlers to arbitrary elements.

### 3. Use IconButton for buttons without labels

The IconButton component in GeoView has built-in accessibility support. Use IconButton instead of Button when a button does not have a text label.

### 4. Validate HTML Output and WCAG level 2.1 AA

From the browsers's developer tools, copy a section of generated code from a map, or a map component, and validate it

- W3C.org validator
- AI tools

### 5. Focus management: Use aria-disabled instead of disabled on UI elements that toggle between enabled/disabled states

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

### 6. Focus management: Avoid removing buttons from the DOM

- Causes focus management issues
- Add example here

### 7. Focus management: Restore focus when removing elements from the DOM

- If removing elements from the DOM, ensure that focus is placed somewhere that is logical to keyboard users.

### 8. Handle esc key

- Use “handleEscapeKey”

### 9. Announce loading states and progress updates using ARIA live regions

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

### 10. Avoid Tooltips on Non-Interactive Elements

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

## 002. ARIA Best Practices

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

\*\*Pattern
The aria-live region and <ProgressBar> serve separate concerns — the live region handles screen reader announcements, while the progress bar provides visual feedback. Keep them decoupled:

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

## 003. Quick Testing Tips and Notes

### SC 1.4.4 - Resize text

- Set browser zoom level to 200%

### SC 1.4.5 - Images of Text

- This does not include text that is part of a picture that contains significant other visual content such as graphs, screenshots, and diagrams which visually convey important information through more than just text.
- [W3C - Understanding Success Criterion 1.4.5](https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-text-presentation.html#:~:text=1.4.5%20Images%20of%20Text,to%20the%20information%20being%20conveyed.)

### SC 1.4.10 - Reflow

- Resize browser window to 1280 pixels wide and set zoom to 400%

### SC 1.4.11 - Text Spacing

- [text spacing bookmarklet](https://www.html5accessibility.com/tests/tsbookmarklet.html)

## 004. Constraints and Limitations

GeoView is built to meet WCAG 2.1 Level AA. Where full conformance is not technically achievable — due to the nature of the app's content or its reliance on third-party data sources — the constraint is documented with a rationale. **These are not failures;** they are considered exceptions within the bounds of what the WCAG specification allows, and will be revisited as the app evolves.

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

This gap is a consequence of the **same issue described under SC 1.1.1.\*** Because symbology images cannot be programmatically described at this time, the relationship between a symbol's visual properties — such as colour, size, and shape — and the the map element it corresponds to cannot be conveyed to assistive technology (AT) users. Without a text alternative for what a symbol looks like, that relationship has no programmatic basis to be determined from.

**Impact** for users: AT users are not blocked from interacting with map symbology — they can show and hide map elements by name — but cannot independently interpret what the associated symbols look like. This is a partial gap rather than a complete barrier to use.

#### Examples:

- Layers panel
- Legend panel

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
