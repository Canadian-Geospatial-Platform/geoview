# TypeScript and React conventions

Public documentation is canonical.

Read only the linked section of each doc: search for its heading and read to the next heading of the same level; expand only if needed (`AGENTS.md` → Reading linked docs).

| Topic                                                                   | Canonical section                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strict types, optional values, explicit returns, React 19 refs, exports | [Best Practices §1](../../docs/programming/best-practices.md#1--clearly-identify-the-types-of-data-you-are-using)                                                                                                                                                                  |
| Naming and OpenLayers collisions                                        | [§2](../../docs/programming/best-practices.md#2--avoid-using-variable-names-that-are-too-short), [§3](../../docs/programming/best-practices.md#3--avoid-using-existing-names-in-third-party-libraries-to-declare-elements-of-the-geoview-code)                                     |
| Inheritance, type guards, deep copies                                   | [§4](../../docs/programming/best-practices.md#4--use-inheritance-whenever-possible), [§5](../../docs/programming/best-practices.md#5--use-the-spreading-operator-only-when-necessary)                                                                                              |
| Imports, component organization                                         | [§7](../../docs/programming/best-practices.md#7--how-we-order-the-import-statements), [§8](../../docs/programming/best-practices.md#8--how-we-order-code-at-the-beginning-of-a-component), [§10](../../docs/programming/best-practices.md#10--how-we-order-functions-in-component) |
| Class order, regions, size/complexity review                            | [§11](../../docs/programming/best-practices.md#11--how-we-order-functions-in-classes)                                                                                                                                                                                              |
| Hook dependencies, memoization, stable handlers                         | [React Performance](../../docs/programming/best-practices.md#14--react-performance-patterns)                                                                                                                                                                                       |
| Event waits versus polling                                              | [Async conditions](../../docs/programming/best-practices.md#15--prefer-waitfor-methods-for-awaiting-async-conditions)                                                                                                                                                              |
| DOM scoping                                                             | [Map-scoped DOM access](../../docs/programming/best-practices.md#dom-access)                                                                                                                                                                                                       |
| Shared helpers, Fetch/worker exception, timers, narrow catches          | [Shared helpers and errors](../../docs/programming/best-practices.md#shared-helpers-and-error-boundaries)                                                                                                                                                                          |
| Component/controller boundary                                           | [No MapViewer in components](../../docs/programming/best-practices.md#no-mapviewer-in-components)                                                                                                                                                                                  |

## Enforcement reminders

- Explicit return types include `useCallback`/`useMemo`; no unexplained `any`.
- Prefix memoized values `memo`; use DOM `null` refs versus mutable `undefined` refs deliberately.
- UI/Icons import from `@/ui`; components mutate through controllers, not store setters or MapViewer.
- Size/complexity thresholds trigger review, not mandatory splitting or a hard complexity cap.
- Preserve TODO/NOTE/FIXME/WCAG/TO.DOCONT and `// GV` implementation notes.

## Source navigation

Check `core/utils/{fetch-helper,fetch-worker-helper,dom-helper,utilities,constant,date-utilities}.ts`
and `geo/utils/{utilities,projection}.ts` before introducing helpers.
For plugin imports use `geoview-core/...`, not core's `@/` alias.
JSDoc/trace review routing lives in [jsdoc-logging.md](jsdoc-logging.md#jsdoc-audit-checklist).
