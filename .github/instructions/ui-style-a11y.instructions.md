---
description: Styling, UI library, accessibility and i18n rules
applyTo: 'packages/**/*.tsx,packages/**/*-style.ts,packages/**/ui/**,packages/**/locales/**'
---

Canonical sections (search the named heading and read only that section):
[styling-best-practices.md](../../docs/programming/styling-best-practices.md) → **1- Organizing component styles**, **2- Theme tokens and external-theme safety**, **3- UI wrappers and translated labels**, **4- Registering display themes**, **5- Spacing: `theme.spacing()` in style modules, no `sx` shorthand**, and **7- Border radius: named tokens on `theme.shape`** (read only the sections relevant to the edit);
[accessibility.md](../../docs/app/accessibility.md) → **008. Code Review Checklist — Common Accessibility Patterns**;
[notifications.md](../../docs/programming/notifications.md) → **The generic error message (last-resort failover)**.
Source/translation routing: [ui-style-a11y-i18n.md](../ai/ui-style-a11y-i18n.md) → **Source navigation and translation workflow**.
For accessibility work, select only the relevant reference:
[keyboard/panel focus](../ai/ui-style-a11y-i18n.md#keyboard-mode-and-panel-focus),
[focus indicators](../ai/ui-style-a11y-i18n.md#focus-indicator-maintenance),
[wrapper diagnostics](../ai/ui-style-a11y-i18n.md#wrapper-naming-and-diagnostics), or
[source-search checks](../ai/ui-style-a11y-i18n.md#accessibility-review-procedure).

- UI/icons from @/ui; reuse style/focus helpers and tokens; custom extensions in reusable UI need optional chaining.
- Use translated labels, en/fr parity and canonical toggle semantics; preserve WCAG exceptions.
- Snackbars must also notify; no transient interactive actions or new generic-error paths.
