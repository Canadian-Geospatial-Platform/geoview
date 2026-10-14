---
name: add-display-theme
description: "Use when adding or renaming a GeoView display theme (palette, schema enum, selectors, docs, release-testing pages)."
---

# Add a display theme

Update every surface together:
1. `TypeDisplayTheme` and `VALID_DISPLAY_THEME` in `map-schema-types.ts`; `TypeDisplayTheme` enum in `schema.json`.
2. `getThemeOptions()` in `theme.tsx`; palette file `ui/style/<name>-theme.ts` spreading `defaultGeoViewColors` (optional theme font passed to `generateThemeOptions(colors, font)`).
3. `MapViewer` theme JSDoc, theme docs, sandbox help text, `demos-navigator.html` and `layers-navigator.html` selectors.
4. Release testing: add a dedicated map to `rt-18-global-settings.html` (renumber following maps' ids, headings and snippet targets) and update `18-global-settings.md`.
