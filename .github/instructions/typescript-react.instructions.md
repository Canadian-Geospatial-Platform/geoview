---
description: TypeScript/React conventions for GeoView source (types, hooks, memo, errors, helpers)
applyTo: "packages/**/*.{ts,tsx}"
---

Canonical sections in [best-practices.md](../../docs/programming/best-practices.md) (search the named heading and read only that section):
**1- Clearly identify the types of data you are using.**, **14- React Performance Patterns**,
**11- How we order functions in classes**, and **18- Map-scoped DOM access (no direct `document.*`)**.
Helper/error routing: [typescript-react.md](../ai/typescript-react.md) → **Source navigation**.

- No unexplained any; explicit returns include callbacks/memos. Respect DOM versus mutable refs.
- Memo values use memo prefix; dependencies reflect actual use; memoization needs concrete benefit.
- Use existing Fetch/timing helpers and narrow catches; do not duplicate shared logic. Keep DOM access at the UI/browser-integration boundary: prefer existing refs/context (such as `useShellContainer()` for the shell), use `DomHelper` for required map-scoped root/descendant lookups, and have controllers request semantic UI actions or values instead. Follow [map-scoped DOM access](../../docs/programming/best-practices.md#dom-access).
- For fire-and-forget promise chains, attach a terminal rejection-handling `.catch()`; `void` is not a substitute. If the catch handler can reject, handle that rejection too. Follow [best-practices.md](../../docs/programming/best-practices.md#shared-helpers-and-error-boundaries).
- Alias imports whose name matches or closely resembles a local member (e.g. `loadImage as loadImageFromUtils`).
- Method size/complexity thresholds are review signals, not hard caps or mandatory file splitting.
