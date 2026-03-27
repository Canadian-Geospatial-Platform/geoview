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

import { useTheme } from "@mui/material/styles";

import { Layer } from "ol/layer";

import { Box, Typography, IconButton } from "@/ui";
import { SettingsIcon, ArrowBackIcon } from "@/ui";
import { MapEventProcessor } from "@/api/event-processors";
```

**MUI import rules:**

- Import UI components (`Box`, `Typography`, `IconButton`, `Divider`, `Collapse`, `Fade`, etc.) from `@/ui` — NEVER directly from `@mui/material`
- Import icons from `@/ui` (barrel re-exports from `@/ui/icons/index.ts` with domain-specific aliases like `AccessTime` → `TimeSliderIcon`)
- MUI hooks/utilities (`useTheme`, `useMediaQuery`) import directly from `@mui/material` or `@mui/material/styles`
- MUI types (`SxProps`, `SelectChangeEvent`) import directly from `@mui/material`

### Component Export Patterns

- **Named exports** (not default exports): `export function MyComponent()` or `export const MyComponent = ...`
- **Explicit return types on components and functions**: Always declare the return type explicitly — do not rely on inference:

```typescript
// ❌ Bad: missing return type
export function MyComponent() {

// ✅ Good: explicit return type
export function MyComponent(): JSX.Element {

// ✅ Good: memo component with explicit return type
export const MyComponent = memo(function MyComponent(): JSX.Element {
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

**Naming pattern**: `use{SliceName}{PropertyName}`

```typescript
// Selector hooks — one per state property
export const useMapZoom = (): number =>
  useStore(useGeoViewStore(), (state) => state.mapState.zoom);

export const useLayerLegendLayers = (): TypeLegendLayer[] =>
  useStore(useGeoViewStore(), (state) => state.layerState.legendLayers);

// Actions hook — one per slice
export const useMapStoreActions = (): MapActions =>
  useStore(useGeoViewStore(), (state) => state.mapState.actions);

export const useLayerStoreActions = (): LayerActions =>
  useStore(useGeoViewStore(), (state) => state.layerState.actions);
```

### No Store Leakage in .ts Files

Pattern from [using-store.md](../docs/programming/using-store.md):

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

## Config & Schema Validation

- **Only geoview-core** has full schema validation (schema.json, schema-default-config.json)
- Config validation happens via `src/api` files in geoview-core
- Plugin packages have their own config schemas (default-config-\*.json) but rely on core's validation APIs
- Use `ConfigApi` and `ConfigValidation` classes from geoview-core for config operations

## Comments, JSDoc & Logging Standards

> **⚠️ IMPORTANT — Branch Review Checklist ⚠️**
>
> When asked to **review a branch** or **audit files**, check **every** rule in this section against every modified file. The most commonly missed items are:
>
> 1. Missing `logger.logTraceRender` at top of component body
> 2. Missing `logger.logTraceUseEffect` / `logger.logTraceUseMemo` as first line in hooks
> 3. Missing `/** */` JSDoc on handlers, `useEffect`, `useMemo`, `useCallback`
> 4. Missing explicit return types on `useCallback` / `useMemo` arrow functions
> 5. `useMemo` variables not prefixed with `memo` (e.g., `columns` → `memoColumns`)
> 6. `//` line comments on properties/constants instead of `/** */`
> 7. Multi-line `/** */` on interface properties instead of single-line
> 8. Missing `@param` / `@returns` on non-handler `useCallback` functions
> 9. `{Type}` annotations in `@param` / `@returns` (only `@throws` keeps braces)
> 10. Removed TODO/NOTE comments — **never delete** existing TODO/NOTE comments during cleanup
> 11. Missing `#region Handlers` / `#endregion` around handler groups
> 12. Missing `memo` justification in component JSDoc when `memo()` is used

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
 * It dispatches an event to the EventProcessor, which
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
│   │   └── store-interface-and-intial-values/  # Hook exports per slice
│   ├── components/   # Shared React components
│   │   └── layers/   # Layer panel, details, settings
│   │       └── right-panel/
│   │           └── layer-settings/  # Settings components + *-style.ts files
│   └── workers/      # Web Workers
├── geo/              # OpenLayers layer management
│   ├── layer/        # GeoView & GV layer classes
│   ├── map/          # MapViewer
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
