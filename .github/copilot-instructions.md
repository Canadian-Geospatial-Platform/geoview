# GeoView AI Coding Agent Instructions

## Project Overview

GeoView is a lightweight React+TypeScript geospatial viewer built on OpenLayers for the Canadian Geospatial Platform. This is a **Rush monorepo** with multiple packages under `packages/`:

- **geoview-core**: Main package - the webpack starter/loader that provides APIs, layers, UI, and map rendering
- **geoview-{aoi-panel,custom-legend,drawer,geochart,swiper,time-slider}**: Plugin packages that consume geoview-core APIs
- **geoview-test-suite**: Test engine package for creating and running tests

**Key Architecture**: Plugins import and use geoview-core APIs. Core is the foundation; plugins extend functionality.

**NEVER reference files from `packages/geoview-core/public/builds/`** — this folder contains old bundled build artifacts (`cgpv-main-*.js`) with stale, outdated code. Always use the actual source files under `packages/geoview-core/src/` as the source of truth.

## Critical Build & Dev Workflow

### Rush Commands (NOT npm/pnpm directly)

```bash
# Install dependencies (run after pulling changes)
rush update          # Standard install
rush update --full   # Clean reinstall

# Development
rush build          # Build all packages
rush serve          # Dev server → http://localhost:8080

# Formatting/Linting (run from packages/ directory)
npm run format      # Prettier formatting
npm run lint        # ESLint check
npm run fix         # ESLint auto-fix
```

**NEVER** run `npm install` directly - always use `rush update`. Rush manages the monorepo and ensures consistent versions.

**NEVER** run `npm audit fix` — it does not work in Rush/pnpm workspaces (no `package-lock.json` exists). It would corrupt the dependency tree.

### Prettier Configuration

The Prettier config lives at `packages/.prettierrc`:

```json
{
  "printWidth": 140,
  "tabWidth": 2,
  "singleQuote": true,
  "bracketSpacing": true,
  "semi": true,
  "arrowParens": "always",
  "trailingComma": "es5",
  "endOfLine": "lf"
}
```

Key rules: **140-char print width**, single quotes, always-parens on arrows, ES5 trailing commas, LF line endings.

### TypeScript Strict Mode

`packages/tsconfig.base.json` enables `strict: true` plus additional flags:

- `noUnusedLocals: true` — unused variables/imports are compile errors
- `noImplicitReturns: true` — all code paths must return a value
- `noImplicitOverride: true` — `override` keyword required
- `isolatedModules: true` — each file must be independently compilable

## Specialist Reference (read on demand, not always loaded)

For documentation edits, read [documentation.md](ai/documentation.md) for audience ownership and optional summary synchronization.

Read only the doc(s) relevant to the task, and only the linked **section** of each: search for the heading, read to the next heading of the same level, and expand only if that is insufficient (see `AGENTS.md` → Reading linked docs). Short scoped rules auto-load from `.github/instructions/`.

> **DOCUMENTATION OWNERSHIP:** Shared developer/user guidance is canonical in public docs; AI-only procedures stay in AI customization files. Link instead of copying; optional tagged AI summaries must stay synchronized with their source. Follow [documentation.md](ai/documentation.md) for ownership and summary rules.

| Topic                                                                   | Doc                                                       | Specialist agent           |
| ----------------------------------------------------------------------- | --------------------------------------------------------- | -------------------------- |
| Shared GeoView terminology                                              | [terminology.md](../docs/programming/terminology.md)      | All agents                 |
| Cross-package architecture, design decisions, API design                | [code-map.md](ai/code-map.md) and relevant subsystem docs | GeoViewArchitect           |
| Controllers, domains, store, events                                     | [controllers-store.md](ai/controllers-store.md)           | ControllerStoreExpert      |
| Map/geo runtime: viewer, projections, rotation, OL interactions, swiper | [map-architecture.md](ai/map-architecture.md)             | MapGeoExpert               |
| Package schema, lifecycle, translations, and specific runtime           | [packages.md](ai/packages.md)                             | Relevant domain specialist |
| Layers, proxy, opacity, visibility, filters, time                       | [layers.md](ai/layers.md)                                 | LayerExpert                |
| Config, schema defaults, GeoCore                                        | [config-schema.md](ai/config-schema.md)                   | LayerExpert                |
| TypeScript / React conventions                                          | [typescript-react.md](ai/typescript-react.md)             | BranchReview               |
| JSDoc, comments, logging                                                | [jsdoc-logging.md](ai/jsdoc-logging.md)                   | BranchReview               |
| Styling, UI library, a11y, i18n                                         | [ui-style-a11y-i18n.md](ai/ui-style-a11y-i18n.md)         | UIA11yReviewer             |
| Test suite authoring                                                    | [test-suite.md](ai/test-suite.md)                         | TestCreator                |
| Manual release-testing plan                                             | [release-testing.md](ai/release-testing.md)               | TestCreator                |
| Build, gh-pages, dependency audit                                       | [build-deploy.md](ai/build-deploy.md)                     | DepUpdate                  |

Also: `AGENTS.md` (delegation policy), `.github/memories/repo/` (gotchas), `docs/programming/*.md` (deep docs).

**Knowledge upkeep**: record verified shared knowledge in the matching public doc and link its section from the AI reference; keep AI-only workflows in AI files and short gotchas in memory — see `AGENTS.md` → Knowledge upkeep.

**Non-negotiables**: components go through controllers (never `MapViewer`); no `any`, explicit return types, `undefined` over `null`; `Fetch`, `delay()`, dom-helper wrappers, `logger`; UI and icons from `@/ui`; strings via `t()` in `en` and `fr`; never delete TODO/NOTE/FIXME/WCAG comments.

## Key Files to Reference

- [layerset-architecture.md](../docs/programming/layerset-architecture.md) — Layer data synchronization
- [adding-layer-types.md](../docs/programming/adding-layer-types.md) — Extending layer support
- [best-practices.md](../docs/programming/best-practices.md) — Code style and architecture patterns
- [styling-best-practices.md](../docs/programming/styling-best-practices.md) — Styling, spacing, and theming
- [using-store.md](../docs/programming/using-store.md) — Zustand usage
- [event-helper.md](../docs/programming/event-helper.md) — Delegate event system
- [controller-architecture.md](../docs/programming/controller-architecture.md) — Controller and domain design
- [time-dimension.md](../docs/programming/time-dimension.md) — Time dimension parsing and time slider
- [layer-filters.md](../docs/programming/layer-filters.md) — Layer filter architecture
- [troubleshooting.md](../docs/programming/troubleshooting.md) — Service-specific fixes and known issues

## File Structure Quick Reference

```
packages/geoview-core/src/
├── api/              # Public APIs (exported to plugins)
│   ├── config/       # ConfigApi, ConfigValidation - schema validation
│   ├── events/       # EventHelper, event delegate types
│   └── plugin/       # Plugin registration APIs
├── core/             # Core utilities, stores, controllers, workers
│   ├── controllers/  # Business logic controllers (one per domain)
│   │   ├── base/     # AbstractController, AbstractMapViewerController, ControllerRegistry, ControllerManager
│   │   ├── map-controller.ts
│   │   ├── layer-controller.ts
│   │   ├── layer-creator-controller.ts
│   │   ├── layer-set-controller.ts
│   │   ├── ui-controller.ts
│   │   ├── data-table-controller.ts
│   │   ├── plugin-controller.ts
│   │   ├── drawer-controller.ts
│   │   └── time-slider-controller.ts
│   ├── domains/      # Domain models (LayerDomain, UIDomain) - own GV layer instances, emit events
│   ├── stores/       # Zustand store slices
│   │   └── states/  # Hook exports per slice
│   ├── components/   # Shared React components
│   │   └── layers/   # Layer panel, details, settings
│   │       └── right-panel/
│   │           └── layer-settings/  # Settings components + *-style.ts files
│   └── workers/      # Web Workers
├── geo/              # OpenLayers layer management
│   ├── layer/        # GeoView & GV layer classes
│   ├── map/          # MapViewer
│   ├── utils/        # Geo utilities
│   │   ├── renderer/ # Layer styling processors (EsriRenderer, WfsRenderer, GeoviewRenderer)
│   │   └── projection.ts
│   └── interaction/
└── ui/               # UI components & layout
    ├── icons/        # Icon barrel (index.ts) re-exporting @mui/icons-material
    ├── style/        # Theme, types (SxStyles), default tokens
    └── [component]/  # One folder per wrapped MUI component
```

Other packages live under `packages/`: `geoview-core` is the foundation, plugins consume its APIs, and `geoview-test-suite` contains the custom in-browser test engine.

**Webpack/TypeScript path aliases** (see `packages/tsconfig.base.json`):

- `@/api` → `packages/geoview-core/src/api`
- `@/core` → `packages/geoview-core/src/core`
- `@/geo` → `packages/geoview-core/src/geo`
- `@/ui` → `packages/geoview-core/src/ui`

## TypeDoc-First API Documentation

When writing or updating API documentation in `docs/app/api/` or `docs/app/events/`, link to the [TypeDoc reference](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/) for full method details. Focus Markdown on concepts, access patterns, and usage examples rather than duplicating signatures that can drift from source.

Key TypeDoc pages: [API](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/API.html), [LayerApi](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/LayerApi.html), [GeometryApi](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/GeometryApi.html), [MapViewer](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/MapViewer.html).
