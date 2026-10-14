---
description: TypeScript/React conventions for GeoView source (types, hooks, memo, errors, helpers)
applyTo: 'packages/**/*.{ts,tsx}'
---

Canonical: [types/returns/refs](../../docs/programming/best-practices.md#1--clearly-identify-the-types-of-data-you-are-using),
[React performance](../../docs/programming/best-practices.md#14--react-performance-patterns),
[class organization](../../docs/programming/best-practices.md#11--how-we-order-functions-in-classes),
[DOM scoping](../../docs/programming/best-practices.md#dom-access).
Helper/error routing: [TypeScript/React reference](../ai/typescript-react.md#source-navigation).

- No unexplained any; explicit returns include callbacks/memos. Respect DOM versus mutable refs.
- Memo values use memo prefix; dependencies reflect actual use; memoization needs concrete benefit.
- Use existing Fetch/timing/DOM helpers and narrow catches; do not duplicate shared logic.
- Method size/complexity thresholds are review signals, not hard caps or mandatory file splitting.
