# Config, schema defaults, GeoCore, partial loading

Public documentation is canonical; the navigation notes below identify implementation boundaries.

Read only the linked section of each doc: search for its heading and read to the next heading of the same level; expand only if needed (`AGENTS.md` → Reading linked docs).

| Topic                                                                    | Canonical section                                                                                                                                                                     |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema ownership, plain-string names/URLs, three synchronized defaults   | [Schema validation](../../docs/app/config/configuration-reference.md#schema-validation)                                                                                               |
| Root/map property order; nested initialView/homeView                     | [Canonical order](../../docs/app/config/configuration-reference.md#canonical-property-order), [View settings](../../docs/app/config/configuration-reference.md#viewsettings-required) |
| Plugin loading, duplicate panels, structured swiper schema               | [Package loading](../../docs/app/config/configuration-reference.md#package-configuration-methods), [Swiper](../../docs/app/config/configuration-reference.md#swiper-package)          |
| Invalid root types; duplicate UUIDs and ordered paths                    | [Error handling](../../docs/app/config/configuration-reference.md#error-handling)                                                                                                     |
| GeoCore selection rewrite, custom precedence, VCS extraction/consumption | [Resolution behavior](../../docs/app/config/configuration-reference.md#error-handling)                                                                                                |
| Parent-child initialSettings merge/remove/visibility semantics           | [Initial settings](../../docs/app/config/configuration-reference.md#initial-settings)                                                                                                 |
| Partial layer success and error-child UI                                 | [Runtime invariants](../../docs/programming/adding-layer-types.md#runtime-invariants)                                                                                                 |
| Extension constants, URL probe fallback, query strings                   | [URL validation behavior](../../docs/app/config/configuration-reference.md#error-handling)                                                                                            |

## Enforcement reminders

- Update runtime defaults, schema annotations and starter template together.
- Reject invalid root types by reporting/skipping, not failing the whole map.
- Preserve GeoCore suffixes through both return branches and ordered paths; strip only for API/UUID validation.
- Rewrite configured bare-UUID selection at resolution, not map-ready runtime lookup.
- A working child makes a partially loaded group valid; don't disable all siblings for one error.

## Source navigation and implementation gotchas

| Investigation                       | Entry point / boundary to preserve                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Defaults                            | `api/types/map-schema-types.ts` → `MapFeatureConfig` constructor; schema is not runtime authority                                                      |
| Duplicated bar panels (#3648/#3221) | Config constructor corrects; `app.tsx` notifies after MapViewer exists                                                                                 |
| Duplicate UUIDs                     | `Config.prevalidateGeoviewLayersConfig` → `GeoCore.createLayerConfigFromUUID` → `generateOrderedLayerPaths` → LayerController placeholder registration |
| Preselected GeoCore                 | `LayerCreatorController.#resolveConfiguredSelectedLayersLayerPath`; `#readyMap` is too early for GV lookup                                             |
| Custom entries                      | UUID reader extracts separately; GeoCore alone chooses inline > GCS > RCS                                                                              |
| VCS packages                        | Package-specific UUID reader → GeoCore response → LayerCreatorController merge; include runtime add and Add Layer UI                                   |
| Slider dual init                    | `tryRegisterLayer` may precede plugin `onAdd`; live `mapFeaturesConfig` can be newer than store                                                        |
| Conversion failure                  | `handleStepLast` must end spinner even when `addGeoviewLayer` never began                                                                              |
| Cascading tests                     | Three levels distinguish merged intermediate state from source state mutated for grandchildren                                                         |
| Partial success                     | `createGeoViewLayers`, `ConfigBaseClass.#updateLayerStatusParentRec`, then layer-details error checkboxes/toggle-all                                   |

For malformed HTML, see [Shared HTML rendering and error boundaries](../../docs/programming/best-practices.md#shared-html-rendering-and-error-boundaries).
