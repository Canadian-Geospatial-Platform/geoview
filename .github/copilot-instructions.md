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

## Architecture Fundamentals

### Three-Layer System

```
UI Components (React) → Controllers → Zustand Store
Backend/Map Events → Domains → Controllers → Zustand Store
```

**Critical Rules:**

1. **UI components**: Read state from store hooks (`useStoreMapZoom`, `useStoreLayerSelectedLayerPath`, etc.), call controller methods via `useMapController()`, `useLayerController()`, etc.
2. **TypeScript backend code**: Access controllers via `this.getControllersRegistry()` (inside controllers) or `mapViewer.controllers` (from MapViewer)
3. **Controllers**: Single source of truth for business logic, state validation, side effects
   - Extend `AbstractMapViewerController` from `@/core/controllers/base/abstract-map-viewer-controller`
   - Instance methods (not static) — one controller registry per MapViewer
   - Lifecycle managed via `hook()` / `unhook()` template methods
4. **Domains** (`LayerDomain`, `UIDomain`): Own the GV layer instances and emit domain events. Controllers subscribe to domain events in `onHook()` and propagate changes to the store.

**Available Controllers:**

| Controller               | Responsibility                                                  |
| ------------------------ | --------------------------------------------------------------- |
| `MapController`          | Zoom, center, projection, bbox highlight, filters               |
| `LayerController`        | Visibility, opacity, layer highlight, settings, item visibility |
| `LayerCreatorController` | Layer creation and removal                                      |
| `LayerSetController`     | Feature queries, layer set management                           |
| `UIController`           | UI state, tabs, theme, language, notifications                  |
| `DataTableController`    | Data table filters                                              |
| `PluginController`       | Plugin loading and access                                       |
| `DrawerController`       | Drawing operations (conditional)                                |
| `TimeSliderController`   | Time slider state and filters (conditional)                     |

**Accessing controllers from React components:**

```typescript
import { useMapController } from "@/core/controllers/map-controller";
import { useLayerController } from "@/core/controllers/layer-controller";

const mapController = useMapController();
const layerController = useLayerController();
mapController.zoomToExtent(extent);
layerController.setLayerOpacity(layerPath, 0.5);
```

**Cross-controller communication (inside controllers):**

```typescript
this.getControllersRegistry().mapController.applyLayerFilters(layerPath);
this.getControllersRegistry().uiController.setCircularProgress(true);
```

### Map Initialization Sequence

The global `cgpv` object provides both an initialization function and event listeners:

```typescript
// 1. Register event listener BEFORE calling init
cgpv.onMapInit((mapViewer) => {
  // Fires when each map is initialized (map is ready, layers may still be loading)
  mapViewer.onMapMoveEnd((sender, event) => {
    console.log("Map moved to:", event.lonlat);
  });
});

cgpv.onMapReady((mapViewer) => {
  // Fires when map and UI are fully loaded
});

// 2. Call init to trigger map creation from HTML div configs
cgpv.init();
```

- **`cgpv.init()`** — Initializes all maps declared in the HTML (reads `data-config` / `data-config-url` attributes)
- **`cgpv.onMapInit(callback)`** — Event listener that fires after each map is initialized. Register BEFORE calling `cgpv.init()`
- **`cgpv.onMapReady(callback)`** — Event listener that fires when map and UI are fully loaded
- **`cgpv.api.getMapViewer(mapId)`** — Returns the `MapViewer` instance for a specific map
- **`cgpv.api.getMapViewerAsync(mapId)`** — Async version that waits for the map to be available

### Layer Architecture

**Two-tier system** — both tiers are mandatory for every layer:

1. **GeoView layers** (config tier): Handle configuration, metadata fetching, and validation. Created via `createGeoviewLayerConfig()`. Base classes: `AbstractGeoViewRaster`, `AbstractGeoViewVector` (both extend `AbstractGeoviewLayerConfig`).
2. **GV layers** (runtime tier): OpenLayers wrapper classes for rendering and interaction. Created by `createGVLayers()` on the GeoView layer. Base classes: `AbstractGVRaster`, `AbstractGVVector` (both extend `AbstractBaseGVLayer`). Examples: `GVEsriFeature`, `GVCSV`, `GVWMS`.

**Layer Sets**: Reactive collections tracking legends/queries/state (see [layerset-architecture.md](../docs/programming/layerset-architecture.md))

- `LegendsLayerSet`, `DetailsLayerSet` - extend `AbstractLayerSet`
- Event-driven sync with layer changes via result sets

**Layer Name Resolution** — `ConfigBaseClass` has two methods for getting a layer's name:

- **`getLayerName()`** — Returns only the entry-level `#layerName` field. Can be `undefined` for layers whose name is set at the GeoView layer config level (e.g., geocore/UUID layers).
- **`getLayerNameCascade()`** — Cascades through `#layerName` → `geoviewLayerName` → `geoviewLayerId` → `layerPath`. Always returns a non-empty string.

**Always use `getLayerNameCascade()` when you need a display name.** Use `getLayerName()` only when you specifically need to check if the entry has its own name set.

### Layer Opacity System

**Hierarchical capping** — `AbstractBaseGVLayer.onSetOpacity()` clamps each layer's opacity to `Math.min(parent.getOpacity(), opacity)`. A child can never exceed its parent's opacity. This means:

- To boost a deeply nested layer to 100%, ALL ancestor groups must also be set to 100% first
- Ancestors must be boosted top-down (root → leaf direction), otherwise the parent cap blocks children

**Group cascade** — `GVGroupLayer.onSetOpacity()` overrides the base method and calls `child.setOpacity(opacity)` on every direct child. This cascades recursively through nested groups. Consequences:

- Setting a group's opacity affects ALL descendants (not just the target child)
- When modifying a group's opacity temporarily (e.g., for highlight), sibling layers get their opacities changed as a side effect
- `getLayersAllLeafs()` returns only leaf layers (non-groups); `getLayersAll()` includes intermediate groups — use the latter when you need to store/restore opacities at every level

**Snapshot/restore pattern** — When temporarily modifying layer opacities (e.g., highlight), store the entire map's opacity state upfront using a `Map<string, number>` keyed by layer path, then restore all values on cleanup. This is safer than ratio-based arithmetic (multiply/divide) which accumulates floating-point drift over repeated operations.

### Event Delegate System

GeoView uses a lightweight typed delegate event system (see [event-helper.md](../docs/programming/event-helper.md)). Classes own private handler arrays (`#onXxxHandlers`) and expose `onXxx()`/`offXxx()` subscribe/unsubscribe methods. Events are emitted via `EventHelper.emitEvent()`. Controllers subscribe in `onHook()` and unsubscribe in `onUnhook()`.

## TypeScript Conventions

### Type Safety (Strict Enforcement)

- **NEVER use `any`** without disabling ESLint + comment explaining why
- **Always define hook types**: `useState<TypeBasemapProps[]>([])` not `useState([])`
- **Avoid name collisions**: Use `GVLayer` not `Layer` when OpenLayers has a `Layer` class

### String Concatenation

- **Always use template literals** instead of `+` for string concatenation:

```typescript
// ❌ Bad: String concatenation with +
const layerPath = gvLayerId + "/" + layerId;
const message = "Initializing config on url: " + url;

// ✅ Good: Template literals
const layerPath = `${gvLayerId}/${layerId}`;
const message = `Initializing config on url: ${url}`;
```

### HTTP Fetching (`Fetch` Helper Class)

- **NEVER use raw `fetch()`** — always use the `Fetch` class from `@/core/utils/fetch-helper`. It provides built-in abort controllers, timeout handling, signal merging, and typed error handling (`RequestTimeoutError`, `RequestAbortedError`, `ResponseError`, `NetworkError`).

| Need                             | Method                                            |
| -------------------------------- | ------------------------------------------------- |
| JSON response                    | `Fetch.fetchJson<T>(url)`                         |
| ESRI JSON (embedded error check) | `Fetch.fetchEsriJson<T>(url)`                     |
| Text response                    | `Fetch.fetchText(url)`                            |
| Text regardless of HTTP status   | `Fetch.fetchTextPermissive(url)`                  |
| Blob as base64 image             | `Fetch.fetchBlobImage(url)`                       |
| Raw blob                         | `Fetch.fetchBlob(url)`                            |
| Array buffer                     | `Fetch.fetchArrayBuffer(url)`                     |
| XML → JSON                       | `Fetch.fetchXMLToJson<T>(url)`                    |
| HEAD reachability check          | `Fetch.fetchHeadWithTimeout(url, timeoutMs)`      |
| GET probe (Range: bytes=0-0)     | `Fetch.fetchProbeUrl(url, timeoutMs)`             |
| JSON with timeout (legacy alias) | `Fetch.fetchWithTimeout<T>(url, init, timeoutMs)` |

```typescript
// ❌ Bad: Raw fetch — no timeout, no abort, no typed errors
const response = await fetch(url);
const data = await response.json();

// ✅ Good: Fetch helper with built-in timeout and error handling
const data = await Fetch.fetchJson<MyType>(url);

// ✅ Good: Permissive text fetch (doesn't throw on non-2xx — for OGC probing)
const text = await Fetch.fetchTextPermissive(url);
```

**Exception — Web Workers**: Worker scripts cannot import the `Fetch` class (it breaks the build). Use `fetchWithTimeout` from `@/core/utils/fetch-worker-helper` instead — a lightweight worker-safe equivalent.

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

import { useTheme } from "@mui/material/styles";

import { Layer } from "ol/layer";

import { Box, Typography, IconButton } from "@/ui";
import { SettingsIcon, ArrowBackIcon } from "@/ui";
import { useMapController } from "@/core/controllers/map-controller";
```

**MUI import rules:**

- Import UI components (`Box`, `Typography`, `IconButton`, `Divider`, `Collapse`, `Fade`, etc.) from `@/ui` — NEVER directly from `@mui/material`
- Import icons from `@/ui` (barrel re-exports from `@/ui/icons/index.ts` with domain-specific aliases like `AccessTime` → `TimeSliderIcon`)
- MUI hooks/utilities (`useTheme`, `useMediaQuery`) import directly from `@mui/material` or `@mui/material/styles`
- MUI types (`SxProps`, `SelectChangeEvent`) import directly from `@mui/material`

### Component Export Patterns

- **Named exports** (not default exports): `export function MyComponent()` or `export const MyComponent = ...`
- **Explicit return types on all functions**: Every function and method must declare its return type explicitly — do not rely on inference. Use `: void` for functions that do not return a value:

```typescript
// ❌ Bad: missing return type
export function MyComponent() {
function processLayer(layerPath: string) {

// ✅ Good: explicit return type
export function MyComponent(): JSX.Element {
function processLayer(layerPath: string): void {

// ✅ Good: memo component with explicit return type
export const MyComponent = memo(function MyComponent(): JSX.Element {

// ✅ Good: class methods with explicit return type
override onHook(): void {
private processConfig(config: TypeMapConfig): TypeMapConfig {
async fetchMetadata(id: string): Promise<void> {
```

- **Explicit return types on `useCallback` and `useMemo`**: Arrow functions inside `useCallback` and `useMemo` must also have explicit return type annotations:

```typescript
// ❌ Bad: missing return type on useCallback
const handleClick = useCallback(() => {
const renderItem = useCallback(() => {

// ✅ Good: explicit return type on useCallback
const handleClick = useCallback((): void => {
const renderItem = useCallback((): JSX.Element => {

// ✅ Good: with parameters
const handleChange = useCallback(
  (event: React.ChangeEvent<HTMLInputElement>): void => {
```

### Inheritance & Polymorphism

- Use inheritance to eliminate repetitive code (base classes for layer types)
- Downcast only after `instanceof` check or type guard function
- Avoid spreading objects with deep nesting - use `lodash.cloneDeep` instead

### React Performance Patterns

**Avoid inline arrow functions in event handlers** - they create new function references on every render:

```typescript
// ❌ Bad: Creates new functions on each render
<IconButton onClick={(e) => handleClick(e, -1)} />
<IconButton onClick={(e) => handleClick(e, 1)} />

// ✅ Good: Create wrapper with stable reference
const handleClickWrapper = useCallback(
  (event: React.MouseEvent<HTMLButtonElement>) => {
    // Determine parameter from element id/data attribute
    const direction = event.currentTarget.id.includes('up') ? -1 : 1;
    handleClick(event, direction);
  },
  [handleClick]
);

<IconButton id="btn-up" onClick={handleClickWrapper} />
<IconButton id="btn-down" onClick={handleClickWrapper} />
```

**Key principles:**

- Use `useCallback` with minimal dependencies for stable function references
- Derive parameters from event target (id, data attributes) instead of closure
- Apply to both `onClick`, `onKeyDown`, and other event handlers
- Reduces unnecessary re-renders of memoized child components
- Module-level constants (`const FADE_DURATION = 200`) belong **outside** the component function to avoid re-creation on every render

**Dependency Array Hygiene:**

**Remove any variable from a `useEffect`/`useCallback`/`useMemo` dependency array that is not actually used inside the hook body.** Do this proactively — do not wait to be asked. This includes:
- Stable `useCallback(fn, [])` references listed out of habit
- `useState` setters (always stable, never needed as deps)
- Ref objects (`useRef` — always stable)

The one legitimate exception is a "trigger token" — a value whose identity change drives re-execution even though its value isn't consumed inside the body. In that case, add an explicit comment explaining why.

**useMemo Naming Convention:**

When using `useMemo`, prefix the variable name with `memo` followed by camelCase:

```typescript
// ❌ Bad: Generic variable name doesn't indicate memoization
const filteredList = useMemo(() => {
  return items.filter((item) => item.active);
}, [items]);

// ✅ Good: Prefix with 'memo' to indicate memoized value
const memoFilteredList = useMemo(() => {
  return items.filter((item) => item.active);
}, [items]);

// ✅ Good: Even for computed objects
const memoSortedUsers = useMemo(() => {
  return users.sort((a, b) => a.name.localeCompare(b.name));
}, [users]);

const memoFormattedDate = useMemo(() => {
  return new Date(timestamp).toLocaleDateString();
}, [timestamp]);
```

**Key principles for useMemo:**

- Prefix with `memo` to indicate the variable is memoized
- Use camelCase for the rest of the name
- Only memoize expensive computations (filtering, sorting, complex calculations)
- Be cautious: `useMemo` has a cost—use only when profiling shows performance issues

**`memo` Guidelines:**

Use `memo` only when it provides a measurable benefit. Common pitfalls:

- **Do NOT use `memo`** on components that receive `children: ReactNode` — inline JSX creates new references on every parent render, so shallow comparison always fails and `memo` adds overhead with no benefit
- **Do NOT use `memo`** on components whose props change on every interaction (e.g., `selectedLayerPath` changes on every click) — `memo` just adds comparison cost
- **DO use `memo`** on list items rendered in `.map()` loops — when only one item's props change (e.g., `isSelected`), the other N-1 items skip re-rendering

```typescript
// ❌ Bad: children prop defeats memo
export const Wrapper = memo(function Wrapper({ children }: Props): JSX.Element {
  return <Box>{children}</Box>;
});

// ❌ Bad: props change on every interaction
export const LayerList = memo(function LayerList({ selectedLayerPath, layerList }: Props): JSX.Element {

// ✅ Good: list item — only re-renders when its own props change
export const LayerListItem = memo(function LayerListItem({ isSelected, layer }: Props): JSX.Element {
```

When `memo` is used, document **why** in the JSDoc detail section:

```typescript
/**
 * Renders a single layer list item.
 *
 * Memoized to avoid re-rendering all items when only the selected layer changes.
 */
```

### Function Order in Components

Per [best-practices.md](../docs/programming/best-practices.md), order functions within components as:

1. Core reusable functions (no dependencies)
2. Event handler functions (state changes, callbacks)
3. Hooks section (`useEffect`, `useCallback` grouped together — order matters)
4. Rendering helper methods (JSX rendering)

### Function Order in Classes

1. Class name → 2. Abstracts → 3. Overrides → 4. Public → 5. Private → 6. Event emits/hooks → 7. Static public → 8. Static private → 9. Event types

## Styling System

### getSxClasses Pattern

Every component with non-trivial styles has a companion `*-style.ts` file exporting a `getSxClasses` function:

```typescript
// my-component-style.ts
import type { Theme } from "@mui/material/styles";
import type { SxStyles } from "@/ui/style/types";

export const getSxClasses = (theme: Theme): SxStyles => ({
  container: {
    display: "flex",
    gap: "8px",
    padding: theme.spacing(1),
  },
  title: {
    fontWeight: 600,
    fontSize: theme.palette.geoViewFontSize.lg,
    color: theme.palette.geoViewColor.textColor.main,
  },
});
```

**`SxStyles`** is defined in `@/ui/style/types` as `Record<string, SxProps<Theme> | SxProps>`.

**Usage in component:**

```typescript
const theme = useTheme();
const sxClasses = getSxClasses(theme);
// ...
<Box sx={sxClasses.container}>
```

### Theme Tokens

Use theme tokens instead of hard-coded colors/sizes:

- **Colors**: `theme.palette.geoViewColor.primary.main`, `.primary.dark[200]`, `.primary.light[100]`, `.bgColor.dark[100]`, `.textColor.main`, `.textColor.light[200]`, `.white`
- **Font sizes**: `theme.palette.geoViewFontSize.sm`, `.default`, `.lg`
- **Spacing**: `theme.spacing(1)` for standard MUI spacing

### Combining sx Styles

When combining multiple sx style objects (e.g., for conditional styling), use the array syntax with `SxProps` cast:

```typescript
import type { SxProps } from '@mui/material';

<Box sx={[sxClasses.card, isSelected && sxClasses.cardSelected] as SxProps} />
```

## UI Component Library (`@/ui`)

### Barrel Exports

All UI components are exported from `@/ui` (`packages/geoview-core/src/ui/index.ts`). This barrel re-exports custom wrappers around MUI components.

**Custom wrappers add GeoView-specific behavior.** For example, `IconButton`:

- Makes `aria-label` **required** (not optional like MUI's)
- Auto-wraps with `<Tooltip>` using aria-label as fallback tooltip text
- Adds `tooltip`, `tooltipPlacement`, `iconRef`, `visible` props
- Uses `logTraceRenderDetailed` internally

### Icons

Icons are re-exported from `@/ui/icons/index.ts` which maps MUI Material Icons to **domain-specific aliases**:

```typescript
// In @/ui/icons/index.ts
export { AccessTime as TimeSliderIcon } from "@mui/icons-material";
export { DynamicFeed as LayerGroupIcon } from "@mui/icons-material";
export { Functions as FunctionsIcon } from "@mui/icons-material";
```

One MUI icon can have multiple aliases. Custom SVG icons (`LegendIcon`, `ClearHighlightIcon`) come from `@/ui/svg/svg-icon`.

**Always import icons from `@/ui`**, never directly from `@mui/icons-material`.

## State Management (Zustand Store)

### Store Hook Naming Convention

Store hooks live in `packages/geoview-core/src/core/stores/store-interface-and-intial-values/` with files per slice: `map-state.ts`, `layer-state.ts`, `ui-state.ts`, `data-table-state.ts`, etc.

Each slice exports three types of functions with consistent naming:

| Type                 | Pattern                                           | Context                             |
| -------------------- | ------------------------------------------------- | ----------------------------------- |
| **Selector hooks**   | `useStore{SliceName}{PropertyName}`               | React components only               |
| **Getter functions** | `getStore{SliceName}{PropertyName}(mapId)`        | Controllers and non-React code      |
| **Setter functions** | `setStore{SliceName}{PropertyName}(mapId, value)` | Controllers only — never from React |

```typescript
// Selector hooks — React components only (re-render on change)
export const useStoreMapZoom = (): number =>
  useStore(useGeoViewStore(), (state) => state.mapState.zoom);

export const useStoreLayerSelectedLayerPath = (): string | undefined | null =>
  useStore(useGeoViewStore(), (state) => state.layerState.selectedLayerPath);

export const useStoreUIActiveFooterBarTab = (): string =>
  useStore(useGeoViewStore(), (state) => state.uiState.activeFooterBarTab);

// Getter functions — point-in-time snapshots for controllers AND react components (no re-render)
export const getStoreMapZoom = (mapId: string): number =>
  getStoreMapState(mapId).zoom;

// Setter functions — mutate state from controllers
export const setStoreMapClickMarker = (
  mapId: string,
  marker: TypeClickMarker,
): void => {
  getStoreMapState(mapId).actions.showClickMarker(marker);
};
```

### Store Access Patterns

**React components** read state via `useStore*` hooks (render), via `getStore*` getters (point-in-time snapshot), call controllers for mutations:

```typescript
// ✅ In React component — read from store hook
const zoom = useStoreMapZoom();
const selectedLayerPath = useStoreLayerSelectedLayerPath();

// ✅ In React component — mutate via controller
const mapController = useMapController();
mapController.zoomToExtent(extent);
```

**Controllers** read via `getStore*` getters, mutate via `setStore*` setters:

```typescript
// ✅ In a controller method
import {
  getStoreMapZoom,
  setStoreMapClickMarker,
} from "@/core/stores/store-interface-and-intial-values/map-state";

const currentZoom = getStoreMapZoom(this.getMapId());
setStoreMapClickMarker(this.getMapId(), projectedCoords[0]);
```

**Non-React .ts files** access controllers via the registry (never import store hooks):

```typescript
// ✅ Inside another controller
this.getControllersRegistry().mapController.applyLayerFilters(layerPath);
```

## Config & Schema Validation

- **Only geoview-core** has full schema validation (schema.json, schema-default-config.json)
- Config validation happens via `src/api` files in geoview-core
- Plugin packages have their own config schemas (default-config-\*.json) but rely on core's validation APIs
- Use `ConfigApi` and `ConfigValidation` classes from geoview-core for config operations

### URL Validation & File Extension Constants

- **`validateAndPingUrl()`** (`core/utils/utilities.ts`) validates URL syntax and server reachability using a multi-step fallback strategy: HEAD → OGC GetCapabilities (WMS/WFS/WMTS) → file extension probe (GET with `Range: bytes=0-0`). Both the direct and CORS-proxy paths include file extension fallback.
- **`VALID_FILE_EXTENSIONS`**, **`VALID_FILE_EXTENSIONS_REGEX`**, and **`VALID_FILE_EXTENSIONS_ACCEPT`** in `core/utils/constant.ts` are the single source of truth for recognized file extensions (`.json`, `.geojson`, `.csv`, `.kml`, `.gpkg`, `.tif`, `.tiff`, `.zip`, `.shp`, `.wkb`). Always use these constants instead of hardcoding extension lists.
- **`guessLayerType()`** in `config-api.ts` maps file extensions to layer types. Its regex patterns must support query parameters (use `(?:$|\?)` anchors, not `endsWith`).

## Comments, JSDoc & Logging Standards

> **⚠️ IMPORTANT — Branch Review Checklist ⚠️**
>
> When asked to **review a branch** or **audit files**, check **every** rule in this section against every modified file. The most commonly missed items are:
>
> 1. Missing `logger.logTraceRender` at top of component body
> 2. Missing `logger.logTraceUseEffect` / `logger.logTraceUseMemo` as first line in hooks
> 3. Missing `/** */` JSDoc on handlers, `useEffect`, `useMemo`, `useCallback`
> 4. Missing explicit return types on `useCallback` / `useMemo` arrow functions
> 5. Missing explicit return types on functions/methods (including `: void` for non-returning functions)
> 6. `useMemo` variables not prefixed with `memo` (e.g., `columns` → `memoColumns`)
> 7. `//` line comments on properties/constants instead of `/** */`
> 8. Multi-line `/** */` on interface properties instead of single-line
> 9. Missing `@param` / `@returns` on non-handler `useCallback` functions
> 10. `{Type}` annotations in `@param` / `@returns` (only `@throws` keeps braces)
> 11. Removed TODO/NOTE comments — **never delete** existing TODO/NOTE comments during cleanup
> 12. Missing `#region Handlers` / `#endregion` around handler groups
> 13. Missing `memo` justification in component JSDoc when `memo()` is used

### Logging

Use the `logger` class ([logging.md](../docs/programming/logging.md)) — **NEVER** `console.log`:

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

### Logger Trace Conventions

**Every component must call `logTraceRender` at the top of the function body:**

```typescript
// Business components — path relative to src/ using components/ prefix
logger.logTraceRender("components/layers/right-panel/layer-details");

// Sub-components within a file — append ' > SubName'
logger.logTraceRender(
  "components/layers/right-panel/layer-settings/raster-function-selector > RasterFunctionItem",
);

// UI wrapper components — use logTraceRenderDetailed with ui/ prefix
logger.logTraceRenderDetailed("ui/icon-button/icon-button");

// Plugin components — use package-relative paths
logger.logTraceRender("geoview-time-slider/time-slider");
```

**Hook trace calls (must be the FIRST line inside the hook):**

```typescript
// useEffect hooks — CAPITALIZED description + watched dependencies
logger.logTraceUseEffect(
  "RASTER FUNCTION PANEL - Layer Raster Function Infos sync",
  rasterFunctionInfos,
);

// useMemo hooks — CAPITALIZED description + watched dependencies
logger.logTraceUseMemo("DATA-TABLE - memoColumns", density);
```

### Property & Constant Comments

All class properties (public, private, static, readonly), interface/type properties, and module-level constants must use **single-line** JSDoc-style `/** ... */` comments — never `//` line comments, never multi-line blocks for simple descriptions:

```typescript
// ❌ Bad: line comment on class property
// the id of the map
mapId: string;

// ✅ Good: JSDoc single-line comment
/** The id of the map. */
mapId: string;

// ❌ Bad: multi-line JSDoc on interface property
interface LayerConfig {
  /**
   * The path for the current layer.
   */
  layerPath: string;
}

// ✅ Good: single-line JSDoc on interface property
interface LayerConfig {
  /** The path for the current layer. */
  layerPath: string;
}

// ❌ Bad: line comment on module-level constant
// Padding values for zoom operations
const ZOOM_PADDING = [5, 5, 5, 5];

// ✅ Good: JSDoc single-line comment on module-level constant
/** Padding values for zoom operations. */
const ZOOM_PADDING = [5, 5, 5, 5];
```

Each comment must be **specific** to the property it describes. Avoid generic/repeated descriptions:

```typescript
// ❌ Bad: generic, repeated across all handler arrays
/** Keep all callback delegates references */
#onMapInitHandlers: MapInitDelegate[] = [];
/** Keep all callback delegates references */
#onMapReadyHandlers: MapReadyDelegate[] = [];

// ✅ Good: specific to each property
/** Callback delegates for the map init event. */
#onMapInitHandlers: MapInitDelegate[] = [];
/** Callback delegates for the map ready event. */
#onMapReadyHandlers: MapReadyDelegate[] = [];
```

### JSDoc Guidelines

(per [best-practices.md](../docs/programming/best-practices.md))

**Golden Rule of JSDoc in TypeScript Projects:**

JSDoc should:

- Explain **why** something works the way it does
- Explain **behavior** and side effects
- Explain **non-obvious constraints**

JSDoc should NOT:

- Repeat type information already in the signature
- Replace TypeScript visibility keywords (`private`, `protected`, `public`)
- Duplicate what the compiler already guarantees

### JSDoc Format Structure

1. Short description (one sentence, **must end with a period**, use **third-person singular**: "Creates", "Handles", "Checks" — not "Create", "Handle", "Check")
2. Blank line (**always required** before tags, even without a detailed description)
3. Detailed behavior explanation (if needed)
4. Blank line (if detailed explanation)
5. `@param` list (parameter - description, Add Optional for optional parameter)
6. `@returns` (if applicable)
7. `@throws` (if applicable)

**Examples:**

```typescript
/**
 * Fetches layer metadata from GeoCore.
 *
 * @param geoviewLayerId - UUID of the GeoView layer
 * @param signal - Optional abort signal for request cancellation
 * @returns A promise that resolves with the parsed layer metadata object
 */
async function fetchMetadata(
  geoviewLayerId: string,
  signal?: AbortSignal,
): Promise<LayerMetadata> {}

/**
 * Updates layer visibility state.
 *
 * This method does not directly manipulate the map.
 * It delegates to the layer controller, which
 * will trigger the appropriate GeoView API call.
 *
 * @param layerPath - Target layer path
 * @param visible - New visibility state
 */
function setLayerVisibility(layerPath: string, visible: boolean): void {}
```

### JSDoc Tag Rules

**Recommended Tags:**

- `@param` — Add **Optional** for optional parameters (e.g., `@param signal - Optional abort signal`)
- `@returns` — For `Promise`: must start with **"A promise that resolves..."**; when return includes `| undefined`, mention it
- `@throws` — Must start with **"When"**; propagated errors append `(propagated from \`methodName()\`)`
- `@example`, `@deprecated`, `@see` — Use as needed

**Tags to Avoid** (use TS keywords or omit entirely):

`@private`, `@protected`, `@public`, `@readonly`, `@override`, `@static`, `@exports`, `@class`, `@abstract`, `@async`, `@description`, `@fires`, `@extends`, `@return` (use `@returns`)

**`@param` / `@returns` Formatting:**

- **No `{Type}` annotations** — TypeScript already provides types. Exception: `@throws` keeps `{ErrorType}` braces
- **No trailing periods** on `@param`, `@returns`, and `@throws` descriptions
- **No `@returns` for void methods** — omit the tag entirely
- **`@returns` for Promise** → "A promise that resolves..." (lowercase "promise")
- **`@returns` describes semantics**, not mirrors the type
- **`@param abortController`** → use `{@link AbortController}` in the description

```typescript
// ❌ Bad: duplicates TypeScript types
/** @param {string} layerPath - Target layer path */
/** @returns {Promise<void>} A promise that resolves when done */

// ✅ Good: omit types, TypeScript already has them
/** @param layerPath - Target layer path */
/** @returns A promise that resolves when done */

// ✅ Good: @throws keeps {ErrorType}
/** @throws {LayerNotFoundError} When the layer is not found */
```

**`@param` Best Practices:**

- **Library wrappers:** Reference the interface — don't explode individual props
- **Custom domain interfaces:** Explode props when behavior is non-obvious
- **Single parameters:** Describe individually
- **Override methods:** Document ALL parameters, even if parent already documents them

### Component JSDoc Pattern

React components that receive props must include `@param` and `@returns`:

```typescript
// ✅ Good: component with props
/**
 * Creates the feature info panel component.
 *
 * @param props - Properties defined in FeatureInfoProps interface
 * @returns The feature info panel component
 */
export function FeatureInfo(props: FeatureInfoProps): JSX.Element {

// ✅ Good: component without props
/**
 * Creates the export modal component.
 *
 * @returns The export modal component
 */
export function ExportModal(): JSX.Element {

// ✅ Good: component returning null
/**
 * Creates the feature info component.
 *
 * @param props - Properties defined in FeatureInfoProps interface
 * @returns The feature info component, or null if no feature
 */
export function FeatureInfo(props: FeatureInfoProps): JSX.Element | null {
```

**Rules:**

- Summary uses third-person singular: "Creates the X component." (not "Create" or "The X component")
- `@param props - Properties defined in [InterfaceName] interface` — always reference the interface name
- `@returns The [component description]` — brief semantic description, no `{JSX.Element}`
- If return type includes `| null`, mention it: "or null if [condition]"

### Single-line JSDoc for Types and Interfaces

When a type or interface export has only a simple description (no tags), use single-line format:

```typescript
// ❌ Bad: multi-line for simple description
/**
 * Represents the layer configuration options.
 */
type LayerConfig = { ... };

// ✅ Good: single-line for simple type/interface
/** Represents the layer configuration options. */
type LayerConfig = { ... };
```

### Handler Comment Pattern

Event handlers use JSDoc-style comments with a single concise description. No `@param`/`@returns` tags — handler parameters are self-documenting via event object property names.

Use `#region Handlers` / `#endregion` to group related handlers:

```typescript
// #region Handlers

/**
 * Handles when the user clicks on the element.
 */
const handleClick = useCallback((): void => {
  // Implementation
}, [dependencies]);

/**
 * Handles keyboard events on the element.
 */
const handleKeyDown = useCallback(
  (event: React.KeyboardEvent): void => {
    // Implementation
  },
  [dependencies],
);

// #endregion
```

### useEffect Comment Pattern

`useEffect` hooks use a `/** */` JSDoc block with a single sentence describing the effect. `logTraceUseEffect` must be the first line inside:

```typescript
/**
 * Registers the overlay ref on mount.
 */
useEffect(() => {
  // Log
  logger.logTraceUseEffect("COMPONENT - description");

  // Implementation
}, [dependencies]);
```

### useMemo Comment Pattern

`useMemo` hooks use a `/** */` JSDoc block with a single sentence. `logTraceUseMemo` must be the first line inside. Variable names must be prefixed with `memo`:

```typescript
/**
 * Builds material react data table column definitions.
 */
const memoColumns = useMemo<MRTColumnDef<ColumnsType>[]>(() => {
  // Log
  logger.logTraceUseMemo("COMPONENT - memoColumns", density);

  // Implementation
}, [dependencies]);
```

### useCallback Comment Pattern

Non-handler `useCallback` functions (domain logic with specific parameters) need full JSDoc with `@param` / `@returns` tags:

```typescript
/**
 * Checks if a column has numerical filters.
 *
 * @param columnId - The column ID to check
 * @returns Whether the column uses numerical filters
 */
const isColumnFilterNumeric = useCallback(
  (columnId: string): boolean => {
    // Implementation
  },
  [columns],
);
```

Handler `useCallback` functions follow the Handler Comment Pattern (no `@param`/`@returns`).

### Preserving Existing Comments

**Never delete** existing `TODO`, `NOTE`, `TO.DOCONT`, `WCAG`, or `FIXME` comments during JSDoc cleanup. These track known issues, workarounds, and future work. Only remove them when the issue they describe has been resolved.

**Do NOT convert `// GV` comment blocks to JSDoc** — these are internal implementation notes, not API documentation.

**TypeDoc Generation:** Run `npm run doc` in geoview-core to generate API documentation.

### JSDoc Audit Checklist

When asked to **audit JSDoc comments for a folder or file**, follow these steps in order:

#### Step 1 — Discover & Read

- List all files in the target folder
- Read each file fully to understand its structure

#### Step 2 — Style Files (`*-style.ts`)

- [ ] `getSxClasses` has `/** */` with `@param theme` and `@returns` (no `{Type}`)

#### Step 3 — Types, Interfaces & Exports

- [ ] Every `type` / `interface` declaration has `/** */` (single-line for simple descriptions)
- [ ] ALL properties inside interfaces/types have single-line `/** */` comments
- [ ] No multi-line `/** */` on properties that need only a one-liner

#### Step 4 — Module-level Constants

- [ ] Every `const` outside a function has `/** */` (not `//`)

#### Step 5 — Component Functions

- [ ] Summary: third-person singular, ends with period ("Creates the X component.")
- [ ] Components with props: `@param props - Properties defined in [InterfaceName] interface`
- [ ] `@returns` present (no `{JSX.Element}`)
- [ ] `memo()` wrapped components: memo justification in JSDoc detail paragraph

#### Step 6 — `useCallback` Functions

- [ ] ALL `useCallback` have `/** */` JSDoc above them
- [ ] **Handlers**: single sentence description, no `@param` / `@returns`
- [ ] **Non-handlers** (domain logic): full JSDoc with `@param` / `@returns`

#### Step 7 — `useMemo` Variables

- [ ] ALL `useMemo` have `/** */` JSDoc (single sentence)
- [ ] Variable names prefixed with `memo` (e.g., `memoFilteredList`)

#### Step 8 — `useEffect` Hooks

- [ ] ALL `useEffect` have `/** */` JSDoc (single sentence)

#### Step 9 — JSDoc Tag Quality (all functions/methods)

- [ ] No `{Type}` in `@param` / `@returns` (only `@throws` keeps `{ErrorType}`)
- [ ] No trailing periods on `@param` / `@returns` / `@throws`
- [ ] No `@returns` for void methods
- [ ] Summaries end with a period
- [ ] Blank line before `@param` tags (even without detailed description)
- [ ] `@returns` for Promise → "A promise that resolves with..."

#### Step 10 — Preservation Check

- [ ] `TODO` / `NOTE` / `WCAG` / `TO.DOCONT` / `FIXME` comments NOT deleted
- [ ] `// GV` comment blocks NOT converted to JSDoc
- [ ] `// eslint-disable` comments NOT removed or altered

## Accessibility

### Required Patterns

- **`aria-label` is required on `<IconButton>`** — enforced by the type system (custom wrapper makes it non-optional)
- **Labels must use translated strings** from `t()`, never hardcoded English:

```typescript
aria-label={t('layers.settings.title')}
aria-label={t('general.close')}

// Dynamic labels with interpolation:
aria-label={layerVisible
  ? t('layers.hideLayer', { name: layer.layerName })
  : t('layers.showLayer', { name: layer.layerName })}
```

- **`role="button"` on non-button interactive elements** must always be paired with `tabIndex={0}` and a keyboard handler for Enter/Space:

```typescript
const handleToggle = useCallback((): void => {
  setExpanded((prev) => !prev);
}, []);

const handleToggleKeyDown = useCallback(
  (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  },
  [handleToggle]
);

<Box onClick={handleToggle} onKeyDown={handleToggleKeyDown} role="button" tabIndex={0}>
```

- `role="checkbox"` with `aria-checked` for toggle-visibility buttons
- `role="search"` on `<form>` elements containing search inputs

## Internationalization (i18n)

### Translation Key Structure

Keys use **dot-separated namespaces** (2-3 levels deep):

| Domain      | Examples                                                                           |
| ----------- | ---------------------------------------------------------------------------------- |
| `layers`    | `t('layers.dropzone')`, `t('layers.settings.title')`, `t('layers.settings.back')`  |
| `legend`    | `t('legend.title')`, `t('legend.highlightLayer')`, `t('legend.subLayersCount')`    |
| `general`   | `t('general.close')`, `t('general.cancel')`, `t('general.overview')`               |
| `appbar`    | `t('appbar.share')`, `t('appbar.navLabel')`                                        |
| `mapctrl`   | `t('mapctrl.attribution.tooltip')`, `t('mapctrl.crosshair')`                       |
| `dataTable` | `t('dataTable.zoom')`, `t('dataTable.details')`, `t('dataTable.searchInputLabel')` |

**Interpolation**: Uses i18next `{{ }}` syntax — `t('layers.hideLayer', { name: layer.layerName })`.

## Testing & Quality

- **Never commit dead/commented code** - use Git history instead
- Run `npm run format && npm run fix` before committing (from packages/)
- Use descriptive variable names (`elementOfTheList` not `e`)
- React Dev Tools + store inspection when `GEOVIEW_DEVTOOLS` localStorage key is set

## GeoView Test Suite (`geoview-test-suite`)

GeoView uses its own **custom test framework** (NOT Jest/Vitest/Mocha). The `geoview-test-suite` package is a GeoView plugin that runs in-browser tests against a live map instance. Tests run inside actual map HTML pages with real OpenLayers rendering.

### Architecture Overview

```
TestSuitePlugin (index.tsx) — AbstractPlugin that manages all Test Suites
   └── GVAbstractTestSuite (extends AbstractTestSuite)
         └── *Tester (extends GVAbstractTester → AbstractTester)
               └── Test<T> — individual test with lifecycle, steps, assertions
                     └── TestStep — sub-step logging within a test
```

**Three-layer hierarchy:**

1. **Suite** — groups related Testers and orchestrates their execution order
2. **Tester** — contains individual test methods and shared helper methods
3. **Test** — single test instance with lifecycle (running → verifying → success/failed)

### File Structure

```
packages/geoview-test-suite/src/
├── index.tsx                            # Plugin entry — registers suites from config
└── tests/
    ├── core/                            # Framework base classes (DO NOT MODIFY)
    │   ├── abstract-test-suite.ts       # Base suite — addTester(), launchTestSuite()
    │   ├── abstract-tester.ts           # Base tester — test(), testError(), assertions
    │   ├── test.ts                      # Test<T> class — lifecycle, static assertions
    │   ├── test-step.ts                 # TestStep class
    │   └── exceptions.ts                # All assertion/test error types
    ├── suites/                          # GeoView-specific suites
    │   ├── abstract-gv-test-suite.ts    # GV base — holds API + MapViewer refs
    │   ├── suite-core.ts                # Date/utility tests
    │   ├── suite-config.ts              # Layer config validation tests
    │   ├── suite-layer.ts               # Layer add/remove/legend tests
    │   ├── suite-map-varia.ts           # Map zoom/projection/basemap/UI tests
    │   ├── suite-map-config.ts          # Map config creation/destruction tests
    │   ├── suite-geochart.ts            # Geochart plugin tests
    │   ├── suite-details.ts             # Details panel tests
    │   └── suite-ui.ts                  # UI/DOM tests
    └── testers/                         # GeoView-specific testers
        ├── abstract-gv-tester.ts        # GV base — constants, URLs, helper methods
        ├── core-tester.ts               # Date parsing tests
        ├── config-tester.ts             # Config validation tests
        ├── layer-tester.ts              # Layer lifecycle tests + static helpers
        ├── map-tester.ts                # Map state/interaction tests
        ├── map-config-tester.ts         # Map config override tests
        ├── geochart-tester.ts           # Geochart tests
        ├── details-tester.ts            # Details panel tests
        └── ui-tester.ts                 # DOM-level UI tests
```

### How Tests Run

Tests are triggered from HTML pages in `packages/geoview-core/public/templates/tests.html`. Each map div specifies which suites to run via the plugin config:

```json
{
  "corePackages": ["test-suite"],
  "corePackagesConfig": [{ "test-suite": { "suites": ["suite-layer"] } }]
}
```

Suite names: `suite-core`, `suite-config`, `suite-layer`, `suite-map`, `suite-geochart`, `suite-map-config`, `suite-ui`, `suite-details`

### Test Lifecycle (in AbstractTester)

Each test follows this lifecycle:

```
1. onCreatingTest(message)        → Creates Test<T> instance
2. onPerformingTest(test)         → Sets status='running', emits started
3. await callback(test)           → Executes test logic, returns result
4. test.setResult(result)         → Stores result
5. onPerformingTestAssertions()   → Sets status='verifying'
6. await callbackAssert(test, result) → Runs assertions (throw = fail)
7. onPerformingTestSuccess()      → Sets status='success'
   — OR onPerformingTestFailure() → Sets status='failed'
8. await callbackFinalize?()      → Cleanup (remove layers, etc.)
9. onPerformingTestDone()         → Moves test to done list
```

### Assertion API (static methods on `Test`)

```typescript
// Primitives
Test.assertIsEqual(actual, expected, roundToPrecision?)
Test.assertIsNotEqual(actual, expected, roundToPrecision?)
Test.assertIsDefined('propertyName', value)
Test.assertIsUndefined('propertyName', value)
Test.assertIsInstance(value, ExpectedClass)
Test.assertIsErrorInstance(error, ExpectedErrorClass)
Test.assertFail('reason')

// Arrays
Test.assertIsArray(value)
Test.assertIsArrayLengthEqual(array, expectedLength)
Test.assertIsArrayLengthMinimal(array, minLength)
Test.assertArrayIncludes(array, expectedValue)
Test.assertArrayExcludes(array, excludedValue)
Test.assertIsArrayEqual(actual, expected, roundToPrecision?)
Test.assertIsArrayEqualJsons(actual, expected)

// Objects
Test.assertJsonObject(actual, expected)
```

### Two Test Methods

**`this.test(message, callback, callbackAssert, callbackFinalize?)`** — Standard test

```typescript
this.test(
  "Test description...",
  async (test) => {
    // STEP 1: Setup & execute
    test.addStep("Doing something...");
    const result = await someOperation();
    return result;
  },
  (test, result) => {
    // STEP 2: Assert on result
    Test.assertIsDefined("result", result);
    Test.assertIsEqual(result.status, "loaded");
  },
  (test) => {
    // STEP 3: Cleanup (optional)
    cleanup();
  },
);
```

**`this.testError(message, ErrorClass, callback, callbackAssert?, callbackFinalize?)`** — True-negative test (expects error)

```typescript
this.testError(
  'Test with bad url should fail...',
  LayerServiceMetadataUnableToFetchError,
  async (test) => {
    // This should throw the expected error
    test.addStep('Creating config with bad URL...');
    const config = SomeLayer.createGeoviewLayerConfig(id, name, BAD_URL, false, [...]);
    await this.helperStepAddLayerOnMap(test, config);
  },
  undefined,  // optional additional assertion on the error
  (test) => {
    // Cleanup
    this.helperFinalizeStepRemoveLayerConfigAndAssert(test, layerPath);
  }
);
```

### Shared Constants (on `GVAbstractTester`)

All test URLs, UUIDs, coordinates, and expected icon lists are defined as `static readonly` constants on `GVAbstractTester`. Reuse these rather than hardcoding:

```typescript
GVAbstractTester.BAD_URL; // 'https://badurl/oops'
GVAbstractTester.QUEBEC_LONLAT; // [-71.356, 46.780]
GVAbstractTester.ONTARIO_CENTER_LONLAT; // [-87, 51]
GVAbstractTester.HISTORICAL_FLOOD_URL_MAP_SERVER;
GVAbstractTester.FOREST_INDUSTRY_MAP_SERVER;
// ... etc.
```

### Helper Methods

Helper methods are **instance methods** on the tester classes. They access the map via `this.getMapViewer()`, `this.getMapId()`, and `this.getControllersRegistry()` internally — no need to pass `mapViewer` or `mapId` as parameters.

**Instance helpers (on `this` — inherited from `GVAbstractTester` or defined on `LayerTester`):**

```typescript
// Add layer to map and wait (instance, async)
this.helperStepAddLayerOnMap(test, gvConfig);
this.helperStepAddLayerOnMapFromUUID(test, uuid);

// Check layer loaded (instance, async)
this.helperStepCheckLayerAtLayerPath(test, layerPath);

// Cleanup (instance — defined on GVAbstractTester)
this.helperFinalizeStepRemoveLayerAndAssert(test, layerPath);

// Cleanup layer config (instance — defined on LayerTester)
this.helperFinalizeStepRemoveLayerConfigAndAssert(test, gvLayerId);
```

**Static helpers (assertion-only — require explicit `mapId`):**

```typescript
// Assert layer exists with optional icon checks
LayerTester.helperStepAssertLayerExists(test, this.getMapId(), layerPath, iconImage?, iconsList?)
LayerTester.helperStepAssertStyleApplied(test, this.getMapId(), layerPath, iconImage?, iconsList?)
```

**Accessor methods (on `this` — inherited from `GVAbstractTester`):**

```typescript
this.getMapViewer(); // Returns MapViewer instance
this.getMapId(); // Returns mapId string
this.getControllersRegistry(); // Returns ControllerRegistry
this.getGeometryApi(); // Returns GeometryApi
```

---

### Algorithm: Creating a New Layer Test

**When to use:** Testing that a new layer type loads correctly, validates legend/icons, and cleans up.

**Steps:**

1. **Add constants** to `GVAbstractTester` (URL, layer ID, icon list)
2. **Add test method** to `LayerTester`
3. **Register in Suite** (`suite-layer.ts` → `onLaunchTestSuite` → `Promise.all`)

**Template — Happy-path layer test:**

```typescript
// In layer-tester.ts
testAddMyNewLayer(): Promise<Test<AbstractGVLayer>> {
  const gvLayerId = generateId();
  const layerUrl = GVAbstractTester.MY_NEW_LAYER_URL;
  const layerPath = `${gvLayerId}/${GVAbstractTester.MY_NEW_LAYER_ID}`;
  const gvLayerName = 'My New Layer';

  return this.test(
    `Test Adding My New Layer on map...`,
    async (test) => {
      test.addStep('Creating the GeoView Layer Configuration...');
      const gvConfig = MyLayerClass.createGeoviewLayerConfig(
        gvLayerId, gvLayerName, layerUrl, false,
        [{ id: GVAbstractTester.MY_NEW_LAYER_ID }]
      );
      await this.helperStepAddLayerOnMap(test, gvConfig);
      return this.helperStepCheckLayerAtLayerPath(test, layerPath);
    },
    (test) => {
      LayerTester.helperStepAssertLayerExists(
        test, this.getMapId(), layerPath, undefined,
        GVAbstractTester.MY_NEW_LAYER_ICON_LIST
      );
    },
    (test) => {
      this.helperFinalizeStepRemoveLayerAndAssert(test, layerPath);
    }
  );
}
```

**Template — Bad-URL layer test (true-negative):**

```typescript
testAddMyNewLayerBadUrl(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
  const gvLayerId = generateId();
  const layerUrl = GVAbstractTester.BAD_URL;
  const layerPath = `${gvLayerId}/${GVAbstractTester.MY_NEW_LAYER_ID}`;
  const gvLayerName = 'My New Layer';

  return this.testError(
    `Test Adding My New Layer with bad url...`,
    LayerServiceMetadataUnableToFetchError,
    async (test) => {
      test.addStep('Creating the GeoView Layer Configuration...');
      const gvConfig = MyLayerClass.createGeoviewLayerConfig(
        gvLayerId, gvLayerName, layerUrl, false,
        [{ id: GVAbstractTester.MY_NEW_LAYER_ID }]
      );
      await this.helperStepAddLayerOnMap(test, gvConfig);
    },
    undefined,
    (test) => {
      this.helperFinalizeStepRemoveLayerConfigAndAssert(test, layerPath);
    }
  );
}
```

**Wiring into the suite (in `suite-layer.ts`):**

```typescript
protected override onLaunchTestSuite(): Promise<unknown> {
  // ... existing tests ...
  const pMyNewLayer = this.#layerTester.testAddMyNewLayer();
  const pMyNewLayerBadUrl = this.#layerTester.testAddMyNewLayerBadUrl();

  return Promise.all([
    // ... existing promises ...
    pMyNewLayer,
    pMyNewLayerBadUrl,
  ]);
}
```

---

### Algorithm: Creating a Core/Utility Function Test

**When to use:** Testing standalone utility functions (e.g., URL validation, date parsing) that don't require a map layer.

**Steps:**

1. **Add test method** to `CoreTester`
2. **Import the function** directly from geoview-core
3. **Register in Suite** (`suite-core.ts` → `onLaunchTestSuite` → `Promise.all`)

**Key pattern:** No layer setup/teardown needed. Directly call the utility function and assert results. Reuse existing constants from `GVAbstractTester` for URLs.

**Template:**

```typescript
// In core-tester.ts
import { myUtilityFunction } from 'geoview-core/core/utils/utilities';

testMyUtilityFunction(): Promise<Test<MyResultType>> {
  return this.test(
    `Test myUtilityFunction with valid input...`,
    async (test) => {
      const input = GVAbstractTester.SOME_CONSTANT;
      test.addStep(`Calling myUtilityFunction with: ${input}...`);
      const result = await myUtilityFunction(input);
      return result;
    },
    (test, result) => {
      test.addStep('Verifying expected property...');
      Test.assertIsEqual(result.someProperty, expectedValue);
    }
  );
}
```

**Wiring (in `suite-core.ts`):**

```typescript
protected override onLaunchTestSuite(): Promise<unknown> {
  const p1 = this.#coreTester.testMyUtilityFunction();
  return Promise.all([p1]);
}
```

---

### Algorithm: Creating a Layer Query Test (getAllFeatureInfo)

**When to use:** Testing that querying a layer's features returns correct results (e.g., domain field value translation, field content validation).

**Steps:**

1. **Add constants** to `GVAbstractTester` (URL, layer ID, field names)
2. **Add test method** to `LayerTester`
3. **Register in Suite** — run **sequentially after** parallel tests because query tests change zoom level

**Critical requirements:**

- **Wait for `allFeatureInfoLayerSet` registration** using `whenThisThen()` before querying
- **Set zoom level** using `await this.getMapViewer().setMapZoomLevel(zoom)` — NOT `MapEventProcessor.setZoom()` (see Gotchas)
- **Run sequentially** at the end of the suite to avoid zoom conflicts with other tests

**Template:**

```typescript
// In layer-tester.ts
testMyLayerQuery(): Promise<Test<TypeFeatureInfoResult>> {
  const gvLayerId = generateId();
  const layerUrl = GVAbstractTester.MY_LAYER_URL;
  const layerPath = `${gvLayerId}/${GVAbstractTester.MY_LAYER_ID}`;
  const gvLayerName = 'My Layer Query';

  return this.test(
    `Test My Layer query...`,
    async (test) => {
      test.addStep('Creating the GeoView Layer Configuration...');
      const gvConfig = EsriDynamic.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
        { id: GVAbstractTester.MY_LAYER_ID },
      ]);

      await this.helperStepAddLayerOnMap(test, gvConfig);
      await this.helperStepCheckLayerAtLayerPath(test, layerPath);

      // Wait for registration in allFeatureInfoLayerSet (required before querying)
      test.addStep('Waiting for allFeatureInfoLayerSet registration...');
      // prettier-ignore
      await whenThisThen(() => this.getMapViewer().layer.allFeatureInfoLayerSet.getRegisteredLayerPaths().includes(layerPath), GVAbstractTester.LAYER_REGISTRATION_TIMEOUT_MS);

      // Set zoom to layer's visible range (required — query returns empty if out of range)
      test.addStep('Setting zoom level...');
      await this.getMapViewer().setMapZoomLevel(REQUIRED_ZOOM);

      // Query all features
      test.addStep('Triggering getAllFeatureInfo query...');
      return this.getControllersRegistry().layerSetController.triggerGetAllFeatureInfo(layerPath);
    },
    (test, result) => {
      test.addStep('Verifying query returned results...');
      Test.assertIsDefined('result', result);
      Test.assertIsArrayLengthMinimal(result.results, 1);

      // Assert on feature field values
      const firstFeature = result.results[0];
      Test.assertIsDefined('firstFeature.fieldInfo', firstFeature.fieldInfo);
      // ... additional assertions on field values
    },
    (test) => {
      this.helperFinalizeStepRemoveLayerAndAssert(test, layerPath);
    }
  );
}
```

**Wiring (mixed parallel + sequential in suite):**

```typescript
protected override async onLaunchTestSuite(): Promise<unknown> {
  // Parallel tests first
  const pLayer1 = this.#layerTester.testAddSomeLayer();
  const pLayer2 = this.#layerTester.testAddAnotherLayer();

  await Promise.all([pLayer1, pLayer2]);

  // Sequential query tests at the end — they change zoom level
  await this.#layerTester.testMyLayerQuery();
  return this.#layerTester.testMyOtherLayerQuery();
}
```

---

### Algorithm: Creating a New Config Validation Test

**When to use:** Testing that a layer config is correctly created and validated (without adding it to the map).

**Steps:**

1. **Add test method** to `ConfigTester`
2. **Register in Suite** (`suite-config.ts` → `onLaunchTestSuite` → `Promise.all`)

**Template:**

```typescript
// In config-tester.ts
testMyLayerConfigValidation(): Promise<Test<TypeGeoviewLayerConfig>> {
  const gvLayerId = generateId();
  const layerUrl = GVAbstractTester.MY_LAYER_URL;
  const gvLayerName = 'My Layer Config Test';

  return this.test(
    `Test My Layer Config Validation...`,
    (test) => {
      test.addStep('Creating the GeoView Layer Configuration...');
      const gvConfig = MyLayerClass.createGeoviewLayerConfig(
        gvLayerId, gvLayerName, layerUrl, false,
        [{ id: GVAbstractTester.MY_LAYER_ID }]
      );
      return gvConfig;
    },
    (test, result) => {
      test.addStep('Verifying config properties...');
      Test.assertIsDefined('geoviewLayerConfig', result);
      Test.assertIsEqual(result.geoviewLayerId, gvLayerId);
      Test.assertIsEqual(result.geoviewLayerName!.en, gvLayerName);
      Test.assertIsEqual(result.geoviewLayerType, 'myLayerType');
      // Assert nested list
      Test.assertIsArrayLengthEqual(result.listOfLayerEntryConfig, 1);
    }
  );
}
```

---

### Algorithm: Creating a New Map Interaction Test

**When to use:** Testing map state changes (zoom, projection, basemap, UI tabs).

**Steps:**

1. **Add test method** to `MapTester`
2. **Register in Suite** (`suite-map-varia.ts` → `onLaunchTestSuite` — use **sequential `await`** if test depends on map state)

**Key pattern:** Tests that modify shared map state (zoom, projection) must run **sequentially** via `await`. Independent tests can be grouped in `Promise.all()`.

**Template:**

```typescript
// In map-tester.ts
testMyMapInteraction(): Promise<Test<SomeResultType>> {
  return this.test(
    `Test my map interaction...`,
    async (test) => {
      test.addStep('Setting up map state...');
      MapEventProcessor.setZoom(this.getMapId(), 5);
      await someWaitCondition();
      return getResult();
    },
    (test, result) => {
      Test.assertIsEqual(result.zoom, 5);
    },
    (test) => {
      // Cleanup: reset to initial state
      MapEventProcessor.zoomToInitialExtent(this.getMapId());
    }
  );
}
```

**Wiring (sequential in suite-map-varia.ts):**

```typescript
protected override async onLaunchTestSuite(): Promise<unknown> {
  // Sequential — modifies map state
  const pZoom = await this.#mapTester.testMapZoom();
  const pMyInteraction = await this.#mapTester.testMyMapInteraction();

  return Promise.all([pZoom, pMyInteraction]);
}
```

---

### Algorithm: Creating a New Map Config Test

**When to use:** Testing different map configuration scenarios (footer bar, nav bar, view settings). Each test creates a fresh map instance with specific config overrides.

**Steps:**

1. **Add test method** to `MapConfigTester`
2. **Register in Suite** (`suite-map-config.ts` → `onLaunchTestSuite` — always **sequential `await`**)

**Key pattern:** Each test uses `#helperCreateMapConfig(test, mapId, configOverrides)` to create a **new map instance**, runs assertions, then destroys it. This ensures config-level isolation.

**Template:**

```typescript
// In map-config-tester.ts
testMyConfigScenario(): Promise<Test<TypeMapFeaturesInstance>> {
  return this.test(
    `Test my config scenario...`,
    async (test) => {
      test.addStep('Creating map with custom config...');
      return this.#helperCreateMapConfig(test, 'test-map-id', {
        footerBar: { tabs: { core: ['legend'] } },
        navBar: { zoom: true },
      });
    },
    (test, result) => {
      Test.assertIsDefined('map config', result);
      // Assert config was applied
      Test.assertIsEqual(result.footerBar?.tabs?.core?.length, 1);
    },
    (test) => {
      // Map destruction happens automatically in the helper
    }
  );
}
```

---

### Algorithm: Creating a New Test Suite & Tester (Full Stack)

**When to use:** Adding an entirely new category of tests (e.g., for a new plugin or a new feature domain).

**Steps:**

1. **Create the Tester** — `tests/testers/my-feature-tester.ts`

```typescript
import { Test } from "../core/test";
import { GVAbstractTester } from "./abstract-gv-tester";

export class MyFeatureTester extends GVAbstractTester {
  override getName(): string {
    return "MyFeatureTester";
  }

  testSomething(): Promise<Test<SomeType>> {
    return this.test(
      "Test something...",
      async (test) => {
        /* execute */
      },
      (test, result) => {
        /* assert */
      },
      (test) => {
        /* cleanup */
      },
    );
  }
}
```

2. **Create the Suite** — `tests/suites/suite-my-feature.ts`

```typescript
import type { API } from "geoview-core/api/api";
import type { MapViewer } from "geoview-core/geo/map/map-viewer";
import { GVAbstractTestSuite } from "./abstract-gv-test-suite";
import { MyFeatureTester } from "../testers/my-feature-tester";

export class GVTestSuiteMyFeature extends GVAbstractTestSuite {
  #tester: MyFeatureTester;

  constructor(api: API, mapViewer: MapViewer) {
    super(api, mapViewer);
    this.#tester = new MyFeatureTester(api, mapViewer);
    this.addTester(this.#tester);
  }

  override getName(): string {
    return "My Feature Test Suite";
  }
  override getDescriptionAsHtml(): string {
    return "Tests for My Feature.";
  }

  // Optional: Guard — only run if the feature is enabled
  // protected override async onCanExecuteTestSuite(): Promise<boolean> {
  //   const config = this.getMapViewer().mapFeaturesConfig;
  //   return config.footerBar?.tabs?.core?.includes('my-feature') ?? false;
  // }

  protected override onLaunchTestSuite(): Promise<unknown> {
    const p1 = this.#tester.testSomething();
    return Promise.all([p1]);
  }
}
```

3. **Register in `index.tsx`** — Add import + else-if branch

```typescript
import { GVTestSuiteMyFeature } from './tests/suites/suite-my-feature';

// In onAdd():
} else if (suite === 'suite-my-feature') {
  this.addTestSuite(new GVTestSuiteMyFeature(window.cgpv.api, this.mapViewer));
}
```

4. **Add HTML test page entry** (in `tests.html`) — Create a map div with the suite config

```html
<div
  id="mapMyFeature"
  class="geoviewMap"
  data-lang="en"
  data-config="{
    'map': { 'viewSettings': { 'projection': 3978 }, ... },
    'corePackages': ['test-suite'],
    'corePackagesConfig': [{ 'test-suite': { 'suites': ['suite-my-feature'] } }]
  }"
></div>
```

---

### Key Rules for Writing Tests

1. **Always use `test.addStep()`** to log progress — this creates visibility in the test UI
2. **Use static assertions** from `Test` class — never use `if/else` to check results
3. **Always clean up** in the `callbackFinalize` — remove layers, reset map state
4. **Use `generateId()`** for layer IDs — prevents conflicts between parallel tests
5. **Reuse existing helpers** — instance helpers via `this.helperStep*` and static assertion helpers via `LayerTester.helperStepAssert*`
6. **Add constants to `GVAbstractTester`** — URLs, UUIDs, expected icon lists go there
7. **True negative tests** use `testError()` with an expected error class
8. **Import layer classes directly** — e.g., `EsriDynamic`, `WMS`, `GeoJSON` for `createGeoviewLayerConfig()`

### Gotchas & Pitfalls

**`MapEventProcessor.setZoom()` vs `mapViewer.setMapZoomLevel()`:**

- `MapEventProcessor.setZoom(mapId, zoom)` only updates the **Zustand store** — it does NOT change the actual OpenLayers map view zoom. The map will not visually zoom and `getView().getZoom()` will return the old value.
- `await this.getMapViewer().setMapZoomLevel(zoom)` sets the **actual OL view zoom** via `getView().setZoom()` and returns a Promise that resolves on `rendercomplete`.
- **Always use `setMapZoomLevel()`** in tests when you need the map to actually change zoom (e.g., before querying features that have visibility range constraints).

**`queryLayerFeatures()` visibility guards:**

- Before querying, `queryLayerFeatures()` in `abstract-layer-set.ts` checks two conditions:
  1. `geoviewLayer.getVisibleIncludingParents()` — layer and all parents must be visible
  2. `geoviewLayer.getInVisibleRange(currentZoom)` — current zoom must be within layer's min/max zoom
- If either check fails, it returns `{ results: [] }` silently (no error thrown)
- **You must set the zoom to a level within the layer's visible range** before calling `triggerGetAllFeatureInfo()`

**`whenThisThen()` for async conditions:**

- Use `whenThisThen(() => condition, timeout)` from `geoview-core/core/utils/utilities` to wait for async conditions
- Common use case: waiting for a layer to be registered in `allFeatureInfoLayerSet` before querying
- Import: `import { whenThisThen } from 'geoview-core/core/utils/utilities'`
- Add `// prettier-ignore` before long single-line calls to prevent Prettier from breaking them

**Sequential tests that change map state:**

- Tests that modify shared map state (zoom, projection, center) must run **sequentially** using `await`
- Run them **after** all parallel tests complete via `await Promise.all([...])`
- The last sequential test should use `return` (not `await`) to satisfy the `Promise<unknown>` return type

**Race conditions with layer removal during async operations:**

- When a layer is removed while an async operation (like `queryLayer()`) is still running, handlers may try to access `this.resultSet[layerPath]` after it's been deleted
- Always add guard checks like `if (this.resultSet[layerPath])` in `.then()`, `.catch()`, and `.finally()` handlers of async layer operations

### Test Execution Patterns Reference

| Pattern                                                       | When to Use                              | Example Suite                         |
| ------------------------------------------------------------- | ---------------------------------------- | ------------------------------------- |
| `Promise.all()` (fully parallel)                              | Independent tests, no shared state       | `suite-config`, `suite-ui`            |
| Mixed: parallel `await Promise.all()` then sequential `await` | Some tests modify map state (zoom, etc.) | `suite-layer`                         |
| Sequential `await` + final `Promise.all()`                    | All tests modify shared map state        | `suite-map-varia`, `suite-map-config` |
| `onCanExecuteTestSuite()` guard                               | Suite requires specific plugin/feature   | `suite-geochart`, `suite-details`     |

## Key Files to Reference

- [layerset-architecture.md](../docs/programming/layerset-architecture.md) - Layer data synchronization
- [adding-layer-types.md](../docs/programming/adding-layer-types.md) - Extending layer support
- [best-practices.md](../docs/programming/best-practices.md) - Code style & patterns
- [using-store.md](../docs/programming/using-store.md) - Zustand usage patterns
- [event-helper.md](../docs/programming/event-helper.md) - Delegate event system
- [controller-architecture.md](../docs/programming/controller-architecture.md) - Controller design & domain integration
- [troubleshooting.md](../docs/programming/troubleshooting.md) - Service-specific fixes & known issues

## TypeDoc-First API Documentation Policy

**Favor linking to TypeDoc over repeating method signatures in markdown docs.**

The TypeDoc reference at `https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/` is auto-generated from source code JSDoc and is always in sync. When writing or updating API documentation in `docs/app/api/` or `docs/app/events/`:

1. **Link to TypeDoc** at the top of each file for the full method reference
2. **Focus on concepts, access patterns, and usage examples** — things TypeDoc does not convey well
3. **Do NOT exhaustively list every method signature, parameter, and return type** — that information lives in TypeDoc and goes stale when duplicated
4. **Show common code patterns** with inline examples that demonstrate real workflows

Key TypeDoc pages:

- [TypeDoc Index](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/)
- [API class](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/API.html)
- [LayerApi class](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/LayerApi.html)
- [GeometryApi class](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/GeometryApi.html)
- [MapViewer class](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/MapViewer.html)

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
│   │   └── store-interface-and-intial-values/  # Hook exports per slice
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

**Webpack Path Aliases** (from tsconfig):

- `@/api` → `packages/geoview-core/src/api`
- `@/core` → `packages/geoview-core/src/core`
- `@/geo` → `packages/geoview-core/src/geo`
- `@/ui` → `packages/geoview-core/src/ui`
