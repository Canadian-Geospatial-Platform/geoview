# JSDoc, comments and logging standards

Public documentation is canonical; this file supplies review routing, not duplicate templates.

Read only the linked section of each doc: search for its heading and read to the next heading of the same level; expand only if needed (`AGENTS.md` → Reading linked docs).

| Topic                                                     | Canonical section                                                                                           |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Summaries, tags, properties, components and hook comments | [JSDoc conventions](../../docs/programming/best-practices.md#documentation-conventions)                     |
| Propagated errors                                         | [Propagating throws](../../docs/programming/best-practices.md#propagating-throws-from-called-functions)     |
| Trace levels, localStorage controls, render/hook naming   | [Logger conventions](../../docs/programming/logging.md#characteristics-to-know-when-using-logger)           |
| Business-flow logging ownership                           | [Where to log](../../docs/programming/logging.md#where-to-log--controllers-not-store-state-files)           |
| Explicit return types                                     | [Type safety](../../docs/programming/best-practices.md#1--clearly-identify-the-types-of-data-you-are-using) |
| Class regions                                             | [Class organization](../../docs/programming/best-practices.md#11--how-we-order-functions-in-classes)        |
| memo naming and justification                             | [React performance](../../docs/programming/best-practices.md#14--react-performance-patterns)                |
| Accurate test totals                                      | [Suite creation/count rules](../../docs/app/testing/creating-tests.md#step-2-create-a-test-suite)           |
| Component boundary                                        | [No MapViewer in components](../../docs/programming/best-practices.md#no-mapviewer-in-components)           |

## Comments, JSDoc & Logging Standards

For branch/file audits, apply every relevant canonical rule to the code in scope: by default the changed
declarations and their enclosing declarations, or the whole file when a full-file review is requested
(see the BranchReview review modes). Within that scope, do not stop after
checking exported functions: properties, constants, handlers and hook callbacks are frequent omissions.
Check render traces at component entry, hook traces as the first statement, explicit returns,
single-line member JSDoc, handler regions, non-handler callback tags, and memo justification.
`memoSxClasses` is the documented JSDoc/trace exception; business logs never belong in store slices.

## JSDoc Audit Checklist

1. Discover all target files and read them completely.
2. Style modules: check `getSxClasses` parameter/return documentation.
3. Types/interfaces/properties/constants: check specific single-line JSDoc.
4. Components: check summary, props/return semantics, and memo rationale.
5. Every callback/effect/memo: distinguish handler versus domain callback documentation; check naming,
   return annotations and trace placement against the linked rules.
6. Tags: check optional/Promise/undefined semantics, no repeated TS types, no void return tag,
   blank lines, punctuation and propagated error types.
7. Preservation: never remove TODO/NOTE/FIXME/WCAG/TO.DOCONT, `// GV` or eslint-disable notes during cleanup.

TypeDoc generation uses `npm run doc` in geoview-core. For public API docs, link generated references
and explain concepts/workflows rather than maintaining parallel exhaustive method inventories.
