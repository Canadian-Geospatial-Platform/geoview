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

**JSDoc Guidelines** (per [best-practices.md](../docs/programming/best-practices.md)):

**Golden Rule of JSDoc in TypeScript Projects:**

JSDoc should:

- Explain **why** something works the way it does
- Explain **behavior** and side effects
- Explain **non-obvious constraints**

JSDoc should NOT:

- Repeat type information already in the signature
- Replace TypeScript visibility keywords (`private`, `protected`, `public`)
- Duplicate what the compiler already guarantees

**Recommended Tags:**

- `@param` - Parameter descriptions
- `@returns` - Return value descriptions
- `@throws` - Document thrown exceptions (@throws {TheErrorType} (description)  e.g. @throws {LayerNotGeoJsonError} When ...)
- `@example` - Usage examples
- `@deprecated` - Mark deprecated APIs
- `@see` - Reference related code

**Tags to Avoid in TypeScript** (use TS keywords instead):

- `@private`, `@protected`, `@public` - Use TS visibility modifiers
- `@readonly` - Use TS `readonly` keyword
- `@override` - Use TS `override` keyword
- `@static` - Use TS `static` keyword

**Format Structure:**

1. Short description (one sentence)
2. Blank line
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
 * @param geoviewLayerId - UUID of the GeoView layer.
 * @param signal - Optional abort signal for request cancellation.
 * @returns Parsed layer metadata object.
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
 * @param layerPath - Target layer path.
 * @param visible - New visibility state.
 */
function setLayerVisibility(layerPath: string, visible: boolean): void {}
```

**TypeDoc Generation:** Run `npm run doc` in geoview-core to generate API documentation.

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
    await helperStepAddLayerOnMap(test, mapViewer, config);
  },
  undefined,  // optional additional assertion on the error
  (test) => {
    // Cleanup
    helperFinalizeStepRemoveLayerConfigAndAssert(test, mapViewer, layerPath);
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

### Static Helper Methods (on `LayerTester`)

```typescript
// Add layer to map and wait
LayerTester.helperStepAddLayerOnMap(test, mapViewer, gvConfig)
LayerTester.helperStepAddLayerOnMapFromUUID(test, mapViewer, uuid)

// Check layer loaded
LayerTester.helperStepCheckLayerAtLayerPath(test, mapViewer, layerPath, timeout?, waitStyle?)

// Assert layer exists with optional icon checks
LayerTester.helperStepAssertLayerExists(test, mapViewer, layerPath, iconImage?, iconsList?)
LayerTester.helperStepAssertStyleApplied(test, mapViewer, layerPath, iconImage?, iconsList?)

// Cleanup
LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, mapViewer, layerPath)
LayerTester.helperFinalizeStepRemoveLayerConfigAndAssert(test, mapViewer, gvLayerId)
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
      await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);
      return LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPath);
    },
    (test) => {
      LayerTester.helperStepAssertLayerExists(
        test, this.getMapViewer(), layerPath, undefined,
        GVAbstractTester.MY_NEW_LAYER_ICON_LIST
      );
    },
    (test) => {
      LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPath);
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
      await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);
    },
    undefined,
    (test) => {
      LayerTester.helperFinalizeStepRemoveLayerConfigAndAssert(test, this.getMapViewer(), layerPath);
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

      await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);
      await LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPath);

      // Wait for registration in allFeatureInfoLayerSet (required before querying)
      test.addStep('Waiting for allFeatureInfoLayerSet registration...');
      // prettier-ignore
      await whenThisThen(() => this.getMapViewer().layer.allFeatureInfoLayerSet.getRegisteredLayerPaths().includes(layerPath), 30000);

      // Set zoom to layer's visible range (required — query returns empty if out of range)
      test.addStep('Setting zoom level...');
      await this.getMapViewer().setMapZoomLevel(REQUIRED_ZOOM);

      // Query all features
      test.addStep('Triggering getAllFeatureInfo query...');
      return DataTableEventProcessor.triggerGetAllFeatureInfo(this.getMapId(), layerPath);
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
      LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPath);
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
5. **Reuse existing helpers** — `LayerTester.helperStep*` methods handle common patterns
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
