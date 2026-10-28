---
description: Styling, UI library, accessibility and i18n rules
applyTo: "packages/**/*.tsx,packages/**/*-style.ts,packages/**/ui/**,packages/**/locales/**"
---

Canonical sections (search the named heading and read only that section):
[styling-best-practices.md](../../docs/programming/styling-best-practices.md) → **1- Organizing component styles**, **2- Theme tokens and external-theme safety**, **3- UI wrappers and translated labels**, **4- Registering display themes**, **5- Spacing: `theme.spacing()` in style modules, no `sx` shorthand**, and **7- Border radius: named tokens on `theme.shape`** (read only the sections relevant to the edit);
[accessibility.md](../../docs/app/accessibility.md) → **008. Code Review Checklist — Common Accessibility Patterns**;
[notifications.md](../../docs/programming/notifications.md) → **The generic error message (last-resort failover)**.
Source/translation routing: [ui-style-a11y-i18n.md](../ai/ui-style-a11y-i18n.md) → **Source navigation and translation workflow**.
For accessibility work, select only the relevant section of [ui-style-a11y-i18n.md](../ai/ui-style-a11y-i18n.md):
**Keyboard mode and panel focus**, **Focus-indicator maintenance**, **Wrapper naming and diagnostics**, or
**Accessibility review procedure** (source-search checks).

- UI/icons from their direct `@/ui/...` module (never the `@/ui` barrel or MUI); reuse style/focus helpers and tokens; custom extensions in reusable UI need optional chaining.
- Use translated labels, en/fr parity and canonical toggle semantics; preserve WCAG exceptions.
- Snackbars must also notify; no transient interactive actions or new generic-error paths.
- Scrollbar colours are global via `GlobalStyles` (`primary.main` thumb, `surface.low` track): never set `scrollbar-color` or `::-webkit-scrollbar-*` in components. Use `scrollbarWidth: 'thin'` only when a narrower scrollbar is wanted; mixing standard properties with WebKit rules makes Chrome silently ignore the WebKit colours.
- Use `surface.low`/`surface.high` for chrome planes, `inverseContent` for deliberately contrast-reversed surfaces, and `layerVisibility` for checked/unchecked legend markers; MUI's background roles cannot express these project-specific uses.
- Reserve `geoViewColor` and its 20-step ramps for map rendering and OpenLayers; UI uses MUI roles and the four palette slots to keep application chrome semantic.
- Use `common.white` only when colour must stay theme-invariant, such as layer symbology backings; on a primary background use `primary.contrastText`, which adapts in the dark theme.
- Focus outline and halo colours belong to `theme.focusVisible` and the helpers in `themeOptionsGenerator.ts`, not components; ordinary background and text colours in focus states remain component-owned.
