# Styling & CSS Best Practices

This document collects GeoView-specific conventions for styling, CSS, and theming. See [best-practices.md](./best-practices.md) for general coding conventions.

## 1- Spacing: `theme.spacing()` in style modules, no `sx` shorthand

GeoView uses MUI's default 8px spacing scale: `theme.spacing(n) = n × 8px`. There is no custom spacing scale override today; if this ever changes, update the conversion table in Section 2 accordingly, since the tie-break rules there are derived from the 8px assumption.

**In-scope properties:** `padding`/`margin` and all directional variants (`paddingTop`, `mx`, etc.), `gap`, `rowGap`, `columnGap`.

**Rule:**

- **Inside `*-style.ts` files** (`getSxClasses(theme)`, MUI `styleOverrides`, `styled()`): always use explicit `theme.spacing()` with the full CSS property name. Never use `sx` shorthand aliases (`p`, `m`, `gap`, `pt`, `mx`, etc.) in these files.

```ts
// ✅ Good
padding: theme.spacing(2),
gap: theme.spacing(1),
margin: theme.spacing(0.5, 1, 0.25, 0.75),
```

```ts
// ❌ Bad — shorthand inside a *-style.ts file
p: 2,
gap: 1,
```

**No bare-zero exception.** Even a zero value must go through `theme.spacing(0)` rather than a bare `0`/`'0px'`. The rendered result is identical either way, but this keeps `theme.spacing(` a complete, unambiguous grep target for every spacing declaration in the codebase — no exceptions to remember.

```ts
// ✅ Good
margin: theme.spacing(0),

// ❌ Bad — bare zero breaks the "always theme.spacing()" invariant
margin: 0,
margin: '0px',
```

- **Exception — inline `sx` props in JSX:** shorthand is acceptable there, but per [best-practices.md](./best-practices.md) inline styles should generally be minimized — prefer moving styles into a `*-style.ts` module using explicit `theme.spacing()` instead of reaching for inline `sx`.

**Why:**

- **Searchability:** `theme.spacing(` is a single, unambiguous grep target for every spacing value in the codebase. Shorthand aliases require matching against a fixed list of MUI spacing-aware keys (`p`, `m`, `px`, `py`, `pt`, `pr`, `pb`, `pl`, `mx`, `my`, `mt`, `mr`, `mb`, `ml`, `gap`, `rowGap`, `columnGap`), which is easy to get wrong and harder to mass find/replace later.
- **Multi-value declarations:** the `sx` shorthand has no way to express a single declaration with distinct top/right/bottom/left values (CSS's 2/3/4-value shorthand). Only the full property name with `theme.spacing(t, r, b, l)` supports this — e.g. `padding: theme.spacing(0.5, 1, 0.25, 0.75)`.

**Out of scope (leave as-is, not part of the spacing scale):** `border-radius`, `border-width`, fixed control `width`/`height`, icon/graphic sizing, focus-indicator metrics, map-canvas/OpenLayers overlay position offsets (`top`/`left`/`right`/`bottom` used for absolute positioning).

**`rem`/`em`-based spacing should be converted too.** Treat an existing `rem`/`em` value on an in-scope property (`padding`, `margin`, `gap`, etc.) as a legacy inconsistency, not an intentional exception — convert it to `theme.spacing()` like any other value, using the px-equivalent at the default root font size (16px) to pick the nearest factor. Only keep a value in `rem`/`em` when it's deliberately coupled to font-size (e.g. spacing meant to scale with adjacent text for WCAG text-resize behavior), and mark that case with a one-line comment explaining why it's exempt.

## 2- Handling legacy values that don't land on the 8px grid

**Always prefer a standard scale factor.** New and edited code should use values that land exactly on the 8px grid — `0.25`(2px), `0.5`(4px), `0.75`(6px), `1`(8px), `1.25`(10px), `1.5`(12px), `1.75`(14px), `2`(16px), `2.25`(18px), `2.5`(20px), `2.75`(22px), `3`(24px), `3.75`(30px), `4`(32px), etc. Any value expressible in exact 2px increments (a `0.25` factor step) converts exactly and requires no judgment call (e.g. `10px` → `theme.spacing(1.25)`, `20px` → `theme.spacing(2.5)`).

**Whole, half, and quarter factors:** factors that are multiples of `1` or `0.5` (e.g. `1`, `1.5`, `2`, `3`) are called "whole" or "half" factors; factors that only land on a multiple of `0.25` (e.g. `1.25`, `1.75`, `3.25`) are called "quarter" factors. This distinction matters for the tie-break rule below.

**Off-scale values are the exception, not the default.** They should only occur when converting a pre-existing legacy value that doesn't divide evenly by 2px — never introduce a new off-scale value by choice. When snapping a legacy off-scale value (e.g. `5px`, `15px`, `25px`) onto the scale:

- Snap to the **nearest** standard factor.
- On an exact tie between two neighboring factors, **prefer the whole or half factor over a quarter factor** — e.g. `15px` is equidistant between `theme.spacing(1.75)` (14px) and `theme.spacing(2)` (16px); snap to `theme.spacing(2)`. Similarly `25px` → `theme.spacing(3)` (24px), not `theme.spacing(3.25)` (26px).
- Mark every snapped value with an inline comment noting the original value, for traceability and easy reversal:

```ts
// ✅ Good — snapped value documented
marginTop: theme.spacing(2), // snapped from 15px
```

**Do not silently guess on a tie.** If a snap decision affects a value used in more than one place (a recurring rhythm — for example, the same `15px` legacy value appearing in both a card header and a panel header), confirm the direction once and apply it consistently across the affected files rather than deciding file-by-file.
