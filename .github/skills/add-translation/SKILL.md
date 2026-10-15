---
name: add-translation
description: "Use when asked to add or change UI text with en/fr translations. Invoke with /add-translation."
---

Text to add or change: use the user's request (if missing, ask: Describe the string(s) and where they are used)

Add the key (2-3 level dot namespace) to both `packages/geoview-core/public/locales/en/translation.json` and `fr/translation.json`, use `t('...')` in the component (never hardcoded text, including `aria-label`), and keep both files' key order consistent. Verify no other key is missing in either language.

For larger work, delegate to the `UIA11yReviewer` custom agent.
