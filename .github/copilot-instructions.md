# GeoView AI Coding Agent Instructions

## Project Overview

GeoView is a lightweight React+TypeScript geospatial viewer built on OpenLayers for the Canadian Geospatial Platform. This is a **Rush monorepo** with multiple packages under `packages/`:

- **geoview-core**: Main package - the webpack starter/loader that provides APIs, layers, UI, and map rendering
- **geoview-{aoi-panel,custom-legend,drawer,geochart,swiper,time-slider}**: Plugin packages that consume geoview-core APIs
- **geoview-test-suite**: Test engine package for creating and running tests

**Key Architecture**: Plugins import and use geoview-core APIs. Core is the foundation; plugins extend functionality.

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

## Architecture Fundamentals

### Three-Layer System

```
UI Components (React) → Event Processors → Zustand Store
Backend/Map Events → Event Processors → Zustand Store
```

**Critical Rules:**

1. **UI components**: Read state from `MapState`/store slices, call `MapState.actions.*` (which redirect to Event Processors), NEVER import Event Processors directly
2. **TypeScript backend code**: Use Event Processor static methods directly (e.g., `MapEventProcessor.setZoom(mapId, 10)`)
3. **Event Processors**: Single source of truth for business logic, state validation, side effects
   - Extend `AbstractEventProcessor` from [event-processor-architecture.md](../docs/programming/event-processor-architecture.md)
   - Static methods for TS files, store actions for UI

### Layer Architecture

- **Two Categories**: Raster (`AbstractGeoViewRaster`) and Vector (`AbstractGeoViewVector`)
- **GV Layers**: OpenLayers wrapper layer classes (`GVEsriFeature`, `GVCSV`, etc.)
- **Layer Sets**: Reactive collections tracking legends/queries/state (see [layerset-architecture.md](../docs/programming/layerset-architecture.md))
  - `LegendsLayerSet`, `DetailsLayerSet` - extend `AbstractLayerSet`
  - Event-driven sync with layer changes via result sets

## TypeScript Conventions

### Type Safety (Strict Enforcement)

- **NEVER use `any`** without disabling ESLint + comment explaining why
- **Always define hook types**: `useState<TypeBasemapProps[]>([])` not `useState([])`
- **Avoid name collisions**: Use `GVLayer` not `Layer` when OpenLayers has a `Layer` class

### Code Organization (per [best-practices.md](../docs/programming/best-practices.md))

**Component order:**

1. Imports (grouped: react → react-dom → react-i18n → MUI → OpenLayers → project deps)
2. Props interface/type definitions
3. Component function
4. Translation/theme hooks
5. Store/API access
6. Internal state
7. Callback functions
8. Render logic

**Import grouping** (empty line between groups):

```typescript
import { useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";

import { useTranslation } from "react-i18next";

import { Card } from "@mui/material";

import { Layer } from "ol/layer";

import { MapEventProcessor } from "@/api/event-processors";
```

### Inheritance & Polymorphism

- Use inheritance to eliminate repetitive code (base classes for layer types)
- Downcast only after `instanceof` check or type guard function
- Avoid spreading objects with deep nesting - use `lodash.cloneDeep` instead

## State Management (Zustand Store)

**No Store Leakage in .ts Files** - pattern from [using-store.md](../docs/programming/using-store.md):

```typescript
// ✅ In TypeScript file
MapEventProcessor.clickMarkerIconHide(this.mapId);

// ✅ In Event Processor
static clickMarkerIconHide(mapId: string) {
  const store = getGeoViewStore(mapId);
  store.getState().mapState.actions.hideClickMarker();
}

// ✅ In store interface
export interface IMapState {
  clickMarker: TypeClickMarker | undefined;
  actions: { hideClickMarker: () => void };
}
```

## Logging & Debugging

Use the `logger` class ([logging.md](../docs/programming/logging.md)) - NOT `console.log`:

```typescript
logger.logTrace(); // Trace levels (1-10): use effects, renders, callbacks - disabled by default
logger.logDebug(); // Development only (won't show in production)
logger.logInfo(); // Core flow - always shown
logger.logWarning(); // Abnormal events - always shown
logger.logError(); // Exceptions - always shown
```

Control via localStorage:

- `GEOVIEW_LOG_ACTIVE`: Enable logging outside dev mode
- `GEOVIEW_LOG_LEVEL`: Set level (number or CSV like "4,6,10")

## Config & Schema Validation

- **Only geoview-core** has full schema validation (schema.json, schema-default-config.json)
- Config validation happens via `src/api` files in geoview-core
- Plugin packages have their own config schemas (default-config-\*.json) but rely on core's validation APIs
- Use `ConfigApi` and `ConfigValidation` classes from geoview-core for config operations

## Documentation Standards

**JSDoc format** (per [CONTRIBUTING.md](../CONTRIBUTING.md)):

```typescript
/**
 * Main function description.
 * @function functionName
 * @param {Array} keys - List of keys
 * @return {Promise} Promise of config nodes
 */
```

- Use `@function` outside class contexts
- For Promises, describe resolved type
- Use `@private` for non-exposed functions
- Generate TypeDoc: `npm run doc` in geoview-core

## Testing & Quality

- **Testing**: Use `geoview-test-suite` package to create and run tests (NOT Jest)
- **Never commit dead/commented code** - use Git history instead
- Run `npm run format && npm run fix` before committing (from packages/)
- Use descriptive variable names (`elementOfTheList` not `e`)
- React Dev Tools + store inspection when `GEOVIEW_DEVTOOLS` localStorage key is set

## Key Files to Reference

- [event-processor-architecture.md](../docs/programming/event-processor-architecture.md) - State management patterns
- [layerset-architecture.md](../docs/programming/layerset-architecture.md) - Layer data synchronization
- [adding-layer-types.md](../docs/programming/adding-layer-types.md) - Extending layer support
- [best-practices.md](../docs/programming/best-practices.md) - Code style & patterns
- [using-store.md](../docs/programming/using-store.md) - Zustand usage patterns
## File Structure Quick Reference

```
packages/geoview-core/src/
├── api/              # Public APIs & Event Processors (exported to plugins)
│   ├── event-processors/
│   ├── config/       # ConfigApi, ConfigValidation - schema validation
│   └── plugin/       # Plugin registration APIs
├── core/             # Core utilities, stores, workers
│   ├── stores/       # Zustand store slices
│   ├── components/   # Shared React components
│   └── workers/      # Web Workers
├── geo/              # OpenLayers layer management
│   ├── layer/        # GeoView & GV layer classes
│   ├── map/          # MapViewer
│   └── interaction/
└── ui/               # UI components & layout
```

**Webpack Path Aliases** (from tsconfig):

- `@/api` → `packages/geoview-core/src/api`
- `@/core` → `packages/geoview-core/src/core`
- `@/geo` → `packages/geoview-core/src/geo`
- `@/ui` → `packages/geoview-core/src/ui`
