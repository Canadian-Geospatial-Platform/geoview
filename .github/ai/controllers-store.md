# Controllers, store and events

Public documentation is canonical.

Read only the linked section of each doc: search for its heading and read to the next heading of the same level; expand only if needed (`AGENTS.md` → Reading linked docs).

| Topic                                                      | Canonical section                                                                                                                                                                                        |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI → controller → store; backend → domain → controller     | [Three-layer system](../../docs/programming/controller-architecture.md#three-layer-system)                                                                                                               |
| Base classes and hook/unhook lifecycle                     | [Base classes](../../docs/programming/controller-architecture.md#base-classes), [Custom controllers](../../docs/programming/controller-architecture.md#creating-custom-controllers)                      |
| Registry and React access                                  | [Controller registry](../../docs/programming/controller-architecture.md#controller-registry), [Cross-controller calls](../../docs/programming/controller-architecture.md#cross-controller-communication) |
| Controller responsibilities                                | [Existing controllers](../../docs/programming/controller-architecture.md#existing-controllers)                                                                                                           |
| Store naming, missing getters, matched regions             | [Three function types](../../docs/programming/using-store.md#three-function-types-per-store-slice)                                                                                                       |
| Context-specific reads/mutations and batch synchronization | [Store access patterns](../../docs/programming/using-store.md#store-access-patterns)                                                                                                                     |
| Events, subscriptions and delegate naming                  | [Event architecture](../../docs/programming/event-helper.md#architecture-rules), [Naming](../../docs/programming/event-helper.md#naming-conventions)                                                     |
| Event payload/interface and delegate/type declarations     | [Event declarations](../../docs/programming/best-practices.md#13--event-delegate-and-payload-type-declarations)                                                                                          |
| MapViewer prohibition                                      | [Component boundary](../../docs/programming/best-practices.md#no-mapviewer-in-components)                                                                                                                |
| Logging ownership                                          | [Where to log](../../docs/programming/logging.md#where-to-log--controllers-not-store-state-files)                                                                                                        |

## Enforcement reminders

- Components read hooks/getters and call controllers; setters are controller-only.
- Add a dedicated missing getter and move the matched pair out of OTHERS; never read a JSON snapshot as a workaround.
- Subscribe/unsubscribe symmetrically; EventHelper callbacks use `(sender, event)`, even when unused.
- Explicitly sync derived filters and item state after suppressed-event batches (#3447).

## Source navigation

Start in `core/controllers/base/` for lifecycle/registry, `core/controllers/use-controllers.ts` for React
hooks, `core/domains/` for ownership/events, and `core/stores/states/` for slice adaptors.
For batch visibility follow `LayerController`'s suppression flag through completion and verify both
domain and store state; a rendered map alone cannot prove data-table counts/filters are synchronized.
