# AI code map (where things live)

Orientation for agents to cut exploratory searches. Source of truth: `packages/geoview-core/src/` (never `public/builds/`). Keep this short; update when folders move.

## geoview-core (`packages/geoview-core/src/`)

| Path                                  | Responsibility                                                                                                                                                                                                 |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api/api.ts`, `api/index.ts`          | Public `API` (`cgpv.api`), map creation/lookup                                                                                                                                                                 |
| `api/config/`                         | `ConfigApi`, `ConfigValidation`, readers (GeoCore UUID, GeoPackage)                                                                                                                                            |
| `api/types/map-schema-types.ts`       | Map config types + `DEFAULT_MAP_FEATURE_CONFIG` (runtime defaults)                                                                                                                                             |
| `api/types/layer-schema-types.ts`     | Layer entry config, source, style types                                                                                                                                                                        |
| `api/events/`                         | `EventHelper` delegate system                                                                                                                                                                                  |
| `api/plugin/`                         | Plugin registration APIs                                                                                                                                                                                       |
| `core/controllers/`                   | Business logic (`map`, `layer`, `layer-creator`, `layer-set`, `ui`, `data-table`, `details`, `plugin`, `drawer`, `swiper`, `time-slider`, `geochart`, `filter-panel`); `base/` has abstract classes + registry |
| `core/controllers/use-controllers.ts` | React hooks (`useMapController`, ...)                                                                                                                                                                          |
| `core/domains/`                       | `LayerDomain`, `UIDomain`: own GV layers, emit events                                                                                                                                                          |
| `core/stores/states/`                 | Zustand slices: getters, `useStore*` hooks, setters per slice                                                                                                                                                  |
| `core/components/`                    | React components by feature (layers, details, data-table, legend, ...)                                                                                                                                         |
| `core/utils/`                         | `Fetch`, `dom-helper`, `utilities` (`delay`, `whenThisThen`, `isValidUUID`), constants, date utilities                                                                                                         |
| `core/workers/`                       | Web workers (use `fetch-worker-helper`)                                                                                                                                                                        |
| `geo/layer/geoview-layers/`           | Config-tier layer classes (WMS, ESRI, GeoJSON, CSV, WKB, ...)                                                                                                                                                  |
| `geo/layer/gv-layers/`                | Runtime-tier GV layers (`GVWMS`, `GVEsriFeature`, `GVGroupLayer`, ...)                                                                                                                                         |
| `geo/layer/layer-sets/`               | Legends/details/all-feature-info layer sets                                                                                                                                                                    |
| `geo/layer/layer.ts`                  | Layer API facade                                                                                                                                                                                               |
| `geo/map/map-viewer.ts`               | `MapViewer` (transitional; components must not use it)                                                                                                                                                         |
| `geo/utils/`                          | `GeoUtilities`, `Projection`, renderers (`renderer/`)                                                                                                                                                          |
| `ui/`                                 | `@/ui` barrel: wrapped MUI components, icons, theme (`style/`)                                                                                                                                                 |

## Plugins and tests (`packages/`)

Outside `src`, `packages/geoview-core/public/locales/{en,fr}/translation.json` holds paired i18n strings;
`packages/geoview-core/{schema.json,schema-default-config.json}` holds schema/reference defaults.

`geoview-{aoi-panel,custom-legend,drawer,geochart,swiper,time-slider}` consume core APIs via `ControllerRegistry`. `geoview-test-suite/src/tests/{core,suites,testers}` holds the in-browser test engine.

For package integration, schema/defaults, lifecycle, translations, and package-specific runtime,
use the [package reference](packages.md#shared-integration).
The [JavaScript package overview](../../docs/app/packages/javascript-packages.md#overview) describes a legacy external-plugin approach.

## Typical entry points

- Add layer type: `geo/layer/geoview-layers/` + `gv-layers/` + config types; read the [creation pipeline](../../docs/programming/adding-layer-types.md#layer-creation-pipeline).
- New UI panel: component in `core/components/`, state in `core/stores/states/`, mutation in a controller.
- New default config value: `DEFAULT_MAP_FEATURE_CONFIG`, `schema.json`, `schema-default-config.json`.
- Docs for deeper context: `.github/ai/*.md`, `docs/programming/*.md`.
