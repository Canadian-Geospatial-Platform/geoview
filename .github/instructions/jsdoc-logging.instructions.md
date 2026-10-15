---
description: JSDoc, comment and logger trace conventions
applyTo: 'packages/**/*.{ts,tsx}'
---

Canonical sections (search the named heading and read only that section):
[best-practices.md](../../docs/programming/best-practices.md) → **Documentation conventions**;
[logging.md](../../docs/programming/logging.md) → **Characteristics to know when using `logger`** and **Where to log — controllers, not store state files**.
Audit workflow: [jsdoc-logging.md](../ai/jsdoc-logging.md) → **JSDoc Audit Checklist**.

- Check every function/hook/property, not just exports; explicit return annotations and semantic JSDoc.
- Render trace at component entry, effect/memo trace first; `memoSxClasses` is the documented exception.
- Use logger, not console. Preserve TODO/NOTE/FIXME/WCAG/TO.DOCONT, `// GV` and eslint-disable notes.
