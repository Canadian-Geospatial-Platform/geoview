# GeoView AI Coding Agent Instructions

## Project Overview

GeoView is a lightweight React+TypeScript geospatial viewer built on OpenLayers for the Canadian Geospatial Platform. This is a **Rush monorepo** with multiple packages under `packages/`:

- **geoview-core**: Main package - the webpack starter/loader that provides APIs, layers, UI, and map rendering
- **geoview-aoi-panel**: Area of Interest panel plugin
- **geoview-custom-legend**: Custom legend plugin
- **geoview-drawer**: Drawer component plugin for side panels
- **geoview-geochart**: Geochart visualization plugin
- **geoview-swiper**: Layer swiper plugin for comparing layers
- **geoview-time-slider**: Time-based layer animation plugin
- **geoview-test-suite**: Test engine package for creating and running tests

**Key Architecture**: Plugins import and use geoview-core APIs. Core is the foundation; plugins extend functionality.

## Critical Build & Dev Workflow

**Requirements**: Node.js >= 20.11.0

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
- **GeoView Layers**: OpenLayers wrapper layer classes implementing specific data sources:
  - **Raster**: `EsriDynamic`, `EsriImage`, `GeoTIFF`, `ImageStatic`, `VectorTiles`, `WMS`, `XYZTiles`
  - **Vector**: `CSV`, `EsriFeature`, `GeoJSON`, `KML`, `OgcFeature`, `WFS`, `WKB`
  - **Note**: `GeoPackage` and `shapefile` are input formats auto-converted to vector types (typically GeoJSON/WKB)
- **Layer Sets**: Reactive collections tracking legends/queries/state (see [layerset-architecture.md](../docs/programming/layerset-architecture.md))
  - **Primary Layer Set**:
    - `LegendsLayerSet` - Tracks layer status and fetches legend/symbology data (used by Legend Panel)
  - **Feature Query Layer Sets**:
    - `FeatureInfoLayerSet` - Queries features at clicked map locations
    - `AllFeatureInfoLayerSet` - Queries all features from layers (used by Data Table, export features)
    - `HoverFeatureInfoLayerSet` - Queries features under mouse cursor for hover tooltips
  - Event-driven sync with layer changes via result sets

## TypeScript Conventions

### Type Safety (Strict Enforcement)

- **NEVER use `any`** without disabling ESLint + comment explaining why
- **Always define hook types**: `useState<TypeBasemapProps[]>([])` not `useState([])`
- **Avoid name collisions**: Use descriptive prefixes when OpenLayers has conflicting class names (e.g., `GeoViewLayer` vs OL's `Layer`)

### Code Organization (per [best-practices.md](../docs/programming/best-practices.md))

**Component order:**

1. Imports (grouped: react → react-dom → react-i18n → MUI → OpenLayers → project deps)
2. Props interface/type definitions
3. Component function
4. Context (mapId)
5. Translation/theme hooks
6. Store/API access
7. Internal state
8. Callback functions
9. Hooks section (useEffect, useCallback, useMemo)
10. Render logic

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
  store.getState().mapState.setterActions.hideClickMarker();
}

// ✅ In store interface
export interface IMapState {
  clickMarker: TypeClickMarker | undefined;
  actions: { hideClickMarker: () => void };
  setterActions: { hideClickMarker: () => void };
}
```

**Store Structure**: Each state slice has `actions` (redirects to Event Processors for UI) and `setterActions` (direct state updates used by Event Processors)

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

### Basic Template

```typescript
/**
 * Main function description.
 * @function functionName
 * @param {Array} keys - List of keys
 * @return {Promise} Promise of config nodes
 */
```

### JSDoc Requirements

**Required Tags:**

- **All parameters must be documented** - Every function parameter requires a `@param` tag
- **Optional parameters** - Use square brackets: `@param {string} [optionalParam]` or `@param {number} [height]`
- **Return values** - Use `@return` for all functions that return values; describe what the Promise resolves to for async functions
- **Thrown errors** - Use `@throws` to document error types: `@throws {MapViewerNotFoundError} When no map exists with the given ID`
- **Access modifiers** - Use `@private` for private methods/properties, `@protected` for protected members, `@static` for static methods, `@abstract` for absract methods, and other tags

**Tag Ordering:**

1. Description
2. `@param` tags (all parameters)
3. `@return`
4. `@throws` (if applicable)
5. **Modifiers LAST**: `@static`, `@protected`, `@private`, `@override`, `@constructor`, `@abstract`

**Function Descriptions:**

- Start with a clear, concise summary sentence
- For complex functions, use "This method:" or "This function does:" followed by a bulleted list of steps:
  ```typescript
  /**
   * Deletes a MapViewer instance and cleans up all associated resources.
   * This method:
   * - Calls the MapViewer's delete method to clean up OpenLayers resources
   * - Removes the MapViewer from the API's collection
   * - Unmounts the React component from the DOM
   * - Removes the Zustand store and event processors
   * - Optionally deletes the HTML container element
   * @param {string} mapId - The unique identifier of the map to delete
   * @param {boolean} deleteContainer - True to remove the div element
   * @return {Promise<void>} Promise that resolves when deletion is complete
   */
  ```
- **Enhance, don't replace** - When existing descriptions exist, add more information or rephrase for clarity, but don't remove helpful details

**Parameter Documentation:**

- Format: `@param {Type} paramName - Description of what the parameter does`
- Optional params: `@param {Type} [paramName] - Description` or `@param {Type} [paramName=defaultValue] - Description`
- Always include descriptions explaining purpose and valid values

**Context Tags:**

- Use `@function` outside class contexts (methods auto-detected in classes)
- For Promises, describe what the resolved value represents
- Use `@exports` for exported classes/functions

**Generate TypeDoc:** Run `npm run doc` in geoview-core package

## Testing & Quality

- **Testing**: Use `geoview-test-suite` package to create and run tests
  - **Do NOT use Jest** - it crashes due to too many dependencies in the monorepo (Jest config exists but is not functional)
- **Never commit dead/commented code** - use Git history instead
- Run `npm run format && npm run fix` before committing (from packages/)
- Use descriptive variable names (`elementOfTheList` not `e`)
- React Dev Tools + store inspection when `GEOVIEW_DEVTOOLS` localStorage key is set

## Performance Optimization

### React Component Optimization

- **Memoization**: Use `useMemo` for expensive calculations, `useCallback` for event handlers passed to child components
- **Avoid unnecessary re-renders**:
  - Use specific store selectors (e.g., `useMapZoom()`) instead of selecting entire state slices
  - Wrap child components in `React.memo()` when they receive stable props
- **Virtual scrolling**: Large lists (Data Table, layer lists) use Material React Table's virtualization
- **Debounce/throttle**: Heavy operations triggered by user input (e.g., hover queries, map interactions)

### Rush/Webpack Build Performance

- **Incremental builds**: `rush build` only rebuilds changed packages - don't use `rush rebuild` unless necessary
- **Parallel execution**: Rush builds packages in parallel based on dependency graph
- **Dev server**: `rush serve` uses webpack-dev-server with Hot Module Replacement (HMR) - avoid full page reloads
- **Build optimization**:
  - Webpack production build uses code splitting and tree shaking
  - Run `rush build` before committing to catch build errors early
  - Use `rush update --full` only when package-lock files are corrupted or after major dependency changes

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
