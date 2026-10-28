# Controllers, store and events

Public documentation is canonical.

Read only the linked section of each doc: search for its heading and read to the next heading of the same level; expand only if needed (`AGENTS.md` → Reading linked docs).

| Topic                                                                                                      | Canonical section                                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI calls controllers; controllers operate on domains, subscribe to domain/map events, and update the store | [Controller relationships](../../docs/programming/controller-architecture.md#the-controller-paradigm)                                                                                                    |
| Base classes and hook/unhook lifecycle                                                                     | [Base classes](../../docs/programming/controller-architecture.md#base-classes), [Custom controllers](../../docs/programming/controller-architecture.md#creating-custom-controllers)                      |
| Registry and React access                                                                                  | [Controller registry](../../docs/programming/controller-architecture.md#controller-registry), [Cross-controller calls](../../docs/programming/controller-architecture.md#cross-controller-communication) |
| Controller responsibilities                                                                                | [Existing controllers](../../docs/programming/controller-architecture.md#existing-controllers)                                                                                                           |
| Visibility actions and state consumed by hidden-layer panels (#3635)                                       | [LayerController](../../docs/programming/controller-architecture.md#layercontroller), [Panel implementation](ui-style-a11y-i18n.md#hidden-layer-panel-implementation)                                    |
| Store naming, missing getters, matched regions                                                             | [Three function types](../../docs/programming/using-store.md#three-function-types-per-store-slice)                                                                                                       |
| Context-specific reads/mutations and batch synchronization                                                 | [Store access patterns](../../docs/programming/using-store.md#store-access-patterns)                                                                                                                     |
| Store file split and allowed import direction (no React tree in the store, #3711)                          | [Store module layout](../../docs/programming/using-store.md#store-module-layout-and-import-direction)                                                                                                    |
| Events, subscriptions and delegate naming                                                                  | [Event architecture](../../docs/programming/event-helper.md#architecture-rules), [Naming](../../docs/programming/event-helper.md#naming-conventions)                                                     |
| Event payload/interface and delegate/type declarations                                                     | [Event declarations](../../docs/programming/best-practices.md#13--event-delegate-and-payload-type-declarations)                                                                                          |
| MapViewer prohibition                                                                                      | [Component boundary](../../docs/programming/best-practices.md#no-mapviewer-in-components)                                                                                                                |
| Logging ownership                                                                                          | [Where to log](../../docs/programming/logging.md#where-to-log--controllers-not-store-state-files)                                                                                                        |

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

Hidden-layer panels: follow layer-state composite hidden/range selectors, LayerController visibility
actions, and panel selection effects. For list presentation and focus restoration, use the
[UI implementation reference](ui-style-a11y-i18n.md#hidden-layer-panel-implementation); the layer domain owns runtime visibility, not panel grouping or focus.
