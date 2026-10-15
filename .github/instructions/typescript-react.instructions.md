---
description: TypeScript/React conventions for GeoView source (types, hooks, memo, errors, helpers)
applyTo: 'packages/**/*.{ts,tsx}'
---

Canonical sections in [best-practices.md](../../docs/programming/best-practices.md) (search the named heading and read only that section):
**1- Clearly identify the types of data you are using.**, **14- React Performance Patterns**,
**11- How we order functions in classes**, and **18- Map-scoped DOM access (no direct `document.*`)**.
Helper/error routing: [typescript-react.md](../ai/typescript-react.md) → **Source navigation**.

- No unexplained any; explicit returns include callbacks/memos. Respect DOM versus mutable refs.
- Memo values use memo prefix; dependencies reflect actual use; memoization needs concrete benefit.
- Use existing Fetch/timing/DOM helpers and narrow catches; do not duplicate shared logic.
- Method size/complexity thresholds are review signals, not hard caps or mandatory file splitting.
