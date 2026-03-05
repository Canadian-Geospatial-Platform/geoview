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

## Best Practices

_Work in progress_

### 1- Use unique and valid element IDs

[update this once/if there's a helper function in place]

Every element id in the DOM must be unique. Duplicate IDs break label-input associations (htmlFor), invalidate ARIA relationships (aria-labelledby, aria-describedby), and cause screen readers to behave unpredictably.

- ensure ids are always unique
- use kebab-case (as much as possible)
- layer paths can generate invalid ids

Suggested format (goes from least specific to most specific)

```typescript
// Start by prefixing ids with the following
${mapId}-${containerType}-[element]
${mapId}-${containerType}-${panelId}-[element]

// If a unique ID is required
// uniqueId could be generated from:
// const id = useId();
// const id = generateId(8);
${mapId}-${containerType}-[element]-${uniqueId}
${mapId}-${containerType}-${panelId}-[element]-${uniqueId}

```

### 2- Use descriptive ARIA labels

ARIA labels should clearly describe an element's purpose, not just its type or location. Generic labels like "button" or "link" are redundant since screen readers already announce the element's role — and repeating the same label across multiple elements (e.g., several "Learn more" buttons) leaves keyboard and screen reader users with no way to distinguish between them. Each label should convey enough context to make sense in isolation.

```typescript

// bad
aria-label="Toggle visibility"

// better
aria-label="Toggle visibility - Confederation to 1914"
```

### 3- Use Semantic Elements for Interactions

Clickable `<div>` and `<span>` elements are inaccessible by default — they receive no keyboard focus, emit no semantic role, and are invisible to assistive technologies. Native `<button>` and `<a>` elements come with built-in keyboard support, appropriate ARIA roles, and browser-managed focus behaviour at no extra cost. In MUI, use Button, IconButton, and Link components over attaching onClick handlers to arbitrary elements.

### 4- Use IconButton for buttons without labels

The IconButton component in GeoView has built-in accessibility support through its implementation at ui/icon-button/icon-button.tsx:

### 5- Validate HTML Output and WCAG level 2.1 AA

From the browsers's developer tools, copy a section of generated code from a map, or a map component, and validate it

- W3C.org validator
- AI tool

### 6- ARIA best practices

- aria-pressed: Use aria-pressed rather than changing labels dynamically (can be confusing to screen readers
- aria-controls:
- ...

### 7- Focus management: Use aria-disabled instead of disabled on UI elements that toggle between enabled/disabled states

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

### 8- Focus management: Avoid removing buttons from the DOM

- Causes focus management issues
- Add example here

### 9- Focus management: Restore focus when removing elements from the DOM

- If removing elements from the DOM, ensure that focus is placed somewhere that is logical to keyboard users.

### 10- Handle esc key

- Use “handleEscapeKey”

### 11- Announce loading states and progress updates using ARIA live regions

```typescript
{/* WCAG - ARIA live region for screen reader announcements */}
<Box sx={sxClasses.visuallyHidden} role="status" aria-live="polite" aria-atomic="true">
  {statusMessage}
</Box>

{isLoading && (
  <Box sx={sxClasses.progressBar}>
    <ProgressBar aria-label={t('geolocator.loadingResults') || undefined} />
  </Box>
)}
```

## Quick Testing Tips and Notes

_Work in progress_

### WCAG SC 1.4.4 - Resize text

- Set browser zoom to 200%

### WCAG SC 1.4.5 - Images of Text

This does not include text that is part of a picture that contains significant other visual content. Examples of such pictures include graphs, screenshots, and diagrams which visually convey important information through more than just text.

[Reference](https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-text-presentation.html#:~:text=1.4.5%20Images%20of%20Text,to%20the%20information%20being%20conveyed.)

### WCAG SC 1.4.10 - Reflow

- Resize browser window to 1280 pixels wide and set zoom to 400%

## Limitations

_Work in progress_

### 1 - Global

English layer names embedded in French UI may lack lang="en" (and vice versa). This is often defensible:

- Content owner's responsibility
- Some technical data may not always have a translation and It wouldn't be feasible to detect the language or origin

[Reference 1](https://laws.justice.gc.ca/eng/regulations/SOR-2021-241/nifnev.html)

[Reference 2](https://www.canada.ca/en/employment-social-development/programs/accessible-canada/regulations-summary-act/amendment.html)

### 2 - Legend Panel

#### WCAG SC 1.1.1 Non-text Content — Known limitation

Images that appear in the legend panel (and their corresponding light boxes) do not have descriptive text available for them. Therefore, they have been made to use empty alt attributes.

The legend symbol images cannot be programmatically described at this time. See SC 1.3.1 — Known limitation. Fixing that issue would resolve this limitation as well.

#### WCAG SC 1.3.1 Info and Relationships — Known limitation

The legend symbol images cannot be programmatically described at this time. The visual relationship between each symbol's appearance and its map class (e.g. colour, size, shape encoding magnitude) is not available to AT users.

**What this means for users in practice** — AT users are not blocked from operating the legend (they can show/hide classes by name), but they cannot independently interpret what the map symbols look like. This is a partial conformance gap rather than a complete barrier to use.

**What would unblock the fix** — if the symbology data driving each legend image is available in the layer configuration (e.g. colour hex, symbol type, size range), those values could be used to auto-generate sr-only descriptions programmatically without manual authoring per symbol. That might be worth investigating as a future enhancement.
