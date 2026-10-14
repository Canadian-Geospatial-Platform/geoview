---
description: Styling, UI library, accessibility and i18n rules
applyTo: 'packages/**/*.tsx,packages/**/*-style.ts,packages/**/ui/**,packages/**/locales/**'
---

Canonical: [styles/external themes](../../docs/programming/styling-best-practices.md#1--spacing-themespacing-in-style-modules-no-sx-shorthand),
[radius tokens](../../docs/programming/styling-best-practices.md#3--border-radius-named-tokens-on-themeshape),
[accessibility review](../../docs/app/accessibility.md#code-review-checklist),
[notification failover](../../docs/programming/notifications.md#the-generic-error-message-last-resort-failover).
Source/translation routing: [UI reference](../ai/ui-style-a11y-i18n.md#source-navigation-and-translation-workflow).

- UI/icons from @/ui; reuse style/focus helpers and tokens; custom extensions in reusable UI need optional chaining.
- Use translated labels, en/fr parity and canonical toggle semantics; preserve WCAG exceptions.
- Snackbars must also notify; no transient interactive actions or new generic-error paths.
