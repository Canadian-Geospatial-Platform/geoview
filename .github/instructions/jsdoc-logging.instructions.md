---
description: JSDoc, comment and logger trace conventions
applyTo: 'packages/**/*.{ts,tsx}'
---

Canonical: [JSDoc conventions](../../docs/programming/best-practices.md#documentation-conventions),
[trace conventions](../../docs/programming/logging.md#characteristics-to-know-when-using-logger),
[logging ownership](../../docs/programming/logging.md#where-to-log--controllers-not-store-state-files).
Audit workflow: [JSDoc audit](../ai/jsdoc-logging.md#jsdoc-audit-checklist).

- Check every function/hook/property, not just exports; explicit return annotations and semantic JSDoc.
- Render trace at component entry, effect/memo trace first; `memoSxClasses` is the documented exception.
- Use logger, not console. Preserve TODO/NOTE/FIXME/WCAG/TO.DOCONT, `// GV` and eslint-disable notes.
