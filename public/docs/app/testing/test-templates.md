# Test Templates

This document provides copy-paste templates for every test category in the GeoView test framework. Each template follows the exact patterns used in the existing codebase.

For the general guide on creating tests (tester class, suite class, registration, HTML config), see [Creating Custom Tests](./creating-tests.md).

## Test Classification

Before writing a test, classify it into one of these groups:

### Group 1 — Core / Utility (no map interaction needed)

| Category                    | Tester Class                                | Suite Class                             | Execution Pattern                |
| --------------------------- | ------------------------------------------- | --------------------------------------- | -------------------------------- |
| **Utility / Pure Function** | `UtilitiesCoreTester` (new) or `CoreTester` | `suite-utilities` (new) or `suite-core` | `Promise.all()` (fully parallel) |
| **Config Validation**       | `ConfigTester`                              | `suite-config`                          | `Promise.all()` (fully parallel) |

### Group 2 — Layers (layer lifecycle, rendering, queries)

| Category            | Tester Class         | Suite Class          | Execution Pattern               |
| ------------------- | -------------------- | -------------------- | ------------------------------- |
| **Layer Lifecycle** | `LayerTester`        | `suite-layer`        | Mixed parallel + sequential     |
| **Layer Query**     | `LayerTester`        | `suite-layer`        | Sequential (changes zoom)       |
| **Legend**          | `LegendTester` (new) | `suite-legend` (new) | Guarded (`legend` tab required) |

### Group 3 — Map (state, projection, interaction)

| Category            | Tester Class      | Suite Class        | Execution Pattern  |
| ------------------- | ----------------- | ------------------ | ------------------ |
| **Map Interaction** | `MapTester`       | `suite-map-varia`  | Sequential `await` |
| **Map Config**      | `MapConfigTester` | `suite-map-config` | Sequential `await` |

### Group 4 — Component Panels (footer bar tabs, app bar features)

| Category          | Tester Class            | Suite Class              | Execution Pattern                   |
| ----------------- | ----------------------- | ------------------------ | ----------------------------------- |
| **Details Panel** | `DetailsTester`         | `suite-details`          | Guarded (`details` tab required)    |
| **Data Table**    | `DataTableTester` (new) | `suite-data-table` (new) | Guarded (`data-table` tab required) |
| **UI / DOM**      | `UITester`              | `suite-ui`               | `Promise.all()`                     |

### Group 5 — Plugins (external packages)

| Category        | Tester Class             | Suite Class               | Execution Pattern                       |
| --------------- | ------------------------ | ------------------------- | --------------------------------------- |
| **Geochart**    | `GeochartTester`         | `suite-geochart`          | Guarded (`geochart` plugin required)    |
| **Swiper**      | `SwiperTester` (new)     | `suite-swiper` (new)      | Guarded (`swiper` plugin required)      |
| **Time Slider** | `TimeSliderTester` (new) | `suite-time-slider` (new) | Guarded (`time-slider` plugin required) |
| **Drawer**      | `DrawerTester` (new)     | `suite-drawer` (new)      | Guarded (`drawer` plugin required)      |

> **Choosing the right group:** Pure function with no side effects → Group 1. Adds/removes/queries a layer → Group 2. Changes map zoom/projection/basemap → Group 3. Interacts with a footer bar tab or app bar panel → Group 4. Tests a plugin package → Group 5.

---

## Template A — Utility / Pure Function Test

**Group 1** — For testing standalone functions from `cgpv.api.utilities.core`, `.geo`, `.projection`, `.date`, or any exported utility.

```typescript
// In the tester file (e.g., utilities-core-tester.ts or core-tester.ts)

import { myFunction } from 'geoview-core/core/utils/utilities';

/**
 * Tests [functionName] with [scenario description].
 *
 * @returns A promise that resolves when the test completes
 */
testFunctionNameScenario(): Promise<Test<ResultType>> {
  return this.test(
    'Test functionName() with [scenario]...',
    (test) => {
      test.addStep('Calling functionName with [input description]...');
      const result = myFunction(input);
      return result;
    },
    (test, result) => {
      test.addStep('Verifying [expected outcome]...');
      Test.assertIsEqual(result, expectedValue);
    }
  );
}
```

### Key Rules

- No `async` callback unless the function is async
- No `callbackFinalize` (no cleanup needed for pure functions)
- Import functions directly from geoview-core: `import { fn } from 'geoview-core/core/utils/utilities'`
- Constants for test data go as `static readonly` on the tester class (not on `GVAbstractTester` unless shared across testers)
- All tests run in parallel via `Promise.all()`

### Example — Testing `range()`

```typescript
testRange(): Promise<Test<number[]>> {
  return this.test(
    'Test range() generates correct sequences...',
    (test) => {
      test.addStep('Calling range(0, 5)...');
      return range(0, 5);
    },
    (test, result) => {
      Test.assertIsArrayEqual(result, [0, 1, 2, 3, 4]);
    }
  );
}
```

---

## Template B — Config Validation Test

**Group 1** — For testing that a layer config is correctly created and validated (without adding it to the map).

```typescript
/**
 * Tests [LayerType] config validation.
 *
 * @returns A promise that resolves when the test completes
 */
testMyLayerConfigValidation(): Promise<Test<TypeGeoviewLayerConfig>> {
  const gvLayerId = generateId();
  const layerUrl = GVAbstractTester.MY_LAYER_URL;
  const gvLayerName = 'My Layer Config Test';

  return this.test(
    'Test My Layer Config Validation...',
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
      Test.assertIsArrayLengthEqual(result.listOfLayerEntryConfig, 1);
    }
  );
}
```

### Key Rules

- Use `generateId()` for layer IDs
- Import layer classes directly (e.g., `EsriDynamic`, `WMS`, `GeoJSON`)
- No cleanup needed (config is not added to map)
- All tests run in parallel via `Promise.all()`

---

## Template C — Layer Lifecycle Test (Happy Path)

**Group 2** — For testing that a layer type loads correctly, validates legend/icons, and cleans up.

```typescript
/**
 * Tests adding [LayerType] layer to the map.
 *
 * @returns A promise that resolves when the test completes
 */
testAddMyLayer(): Promise<Test<AbstractGVLayer>> {
  const gvLayerId = generateId();
  const layerUrl = GVAbstractTester.MY_LAYER_URL;
  const layerPath = `${gvLayerId}/${GVAbstractTester.MY_LAYER_ID}`;
  const gvLayerName = 'My Layer';

  return this.test(
    'Test Adding My Layer on map...',
    async (test) => {
      test.addStep('Creating the GeoView Layer Configuration...');
      const gvConfig = MyLayerClass.createGeoviewLayerConfig(
        gvLayerId, gvLayerName, layerUrl, false,
        [{ id: GVAbstractTester.MY_LAYER_ID }]
      );
      await this.helperStepAddLayerOnMap(test, gvConfig);
      return this.helperStepCheckLayerAtLayerPath(test, layerPath);
    },
    (test) => {
      LayerTester.helperStepAssertLayerExists(
        test, this.getMapId(), layerPath, undefined,
        GVAbstractTester.MY_LAYER_ICON_LIST
      );
    },
    (test) => {
      this.helperFinalizeStepRemoveLayerAndAssert(test, layerPath);
    }
  );
}
```

### Key Rules

- Always use `generateId()` to avoid ID conflicts in parallel tests
- Always use `callbackFinalize` to remove the layer from the map
- Use `this.helperStepAddLayerOnMap()` and `this.helperStepCheckLayerAtLayerPath()`
- Use `LayerTester.helperStepAssertLayerExists()` for assertions

---

## Template D — Layer Lifecycle Test (Bad URL / True-Negative)

**Group 2** — For testing that a layer with an invalid URL fails with the expected error.

```typescript
/**
 * Tests adding [LayerType] layer with a bad URL.
 *
 * @returns A promise that resolves when the test completes
 */
testAddMyLayerBadUrl(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
  const gvLayerId = generateId();
  const layerUrl = GVAbstractTester.BAD_URL;
  const layerPath = `${gvLayerId}/${GVAbstractTester.MY_LAYER_ID}`;
  const gvLayerName = 'My Layer';

  return this.testError(
    'Test Adding My Layer with bad url...',
    LayerServiceMetadataUnableToFetchError,
    async (test) => {
      test.addStep('Creating the GeoView Layer Configuration...');
      const gvConfig = MyLayerClass.createGeoviewLayerConfig(
        gvLayerId, gvLayerName, layerUrl, false,
        [{ id: GVAbstractTester.MY_LAYER_ID }]
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

### Key Rules

- Use `this.testError()` instead of `this.test()`
- Pass the expected error class as the second argument
- Use `this.helperFinalizeStepRemoveLayerConfigAndAssert()` for cleanup (not `helperFinalizeStepRemoveLayerAndAssert` — the layer never loaded)

---

## Template E — Layer Query Test

**Group 2** — For testing that querying a layer's features returns correct results.

```typescript
/**
 * Tests querying features from [LayerType] layer.
 *
 * @returns A promise that resolves when the test completes
 */
testMyLayerQuery(): Promise<Test<TypeFeatureInfoResult>> {
  const gvLayerId = generateId();
  const layerUrl = GVAbstractTester.MY_LAYER_URL;
  const layerPath = `${gvLayerId}/${GVAbstractTester.MY_LAYER_ID}`;
  const gvLayerName = 'My Layer Query';

  return this.test(
    'Test My Layer query...',
    async (test) => {
      test.addStep('Creating the GeoView Layer Configuration...');
      const gvConfig = MyLayerClass.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
        { id: GVAbstractTester.MY_LAYER_ID },
      ]);

      await this.helperStepAddLayerOnMap(test, gvConfig);
      await this.helperStepCheckLayerAtLayerPath(test, layerPath);

      test.addStep('Waiting for allFeatureInfoLayerSet registration...');
      // prettier-ignore
      await whenThisThen(() => this.getMapViewer().layer.allFeatureInfoLayerSet.getRegisteredLayerPaths().includes(layerPath), GVAbstractTester.LAYER_REGISTRATION_TIMEOUT_MS);

      test.addStep('Setting zoom level...');
      await this.getMapViewer().setMapZoomLevel(REQUIRED_ZOOM);

      test.addStep('Triggering getAllFeatureInfo query...');
      return this.getControllersRegistry().layerSetController.triggerGetAllFeatureInfo(layerPath);
    },
    (test, result) => {
      test.addStep('Verifying query returned results...');
      Test.assertIsDefined('result', result);
      Test.assertIsArrayLengthMinimal(result.results, 1);
    },
    (test) => {
      this.helperFinalizeStepRemoveLayerAndAssert(test, layerPath);
    }
  );
}
```

### Key Rules

- Use `await this.getMapViewer().setMapZoomLevel()` for direct (non-animated) zoom, or `await this.getControllersRegistry().mapController.zoomMap()` for animated zoom
- Wait for `allFeatureInfoLayerSet` registration using `whenThisThen()` before querying
- Run sequentially AFTER parallel tests (they change zoom level)
- The layer must be visible and within its min/max zoom range for queries to return results

---

## Template F — Map Interaction Test

**Group 3** — For testing map state changes (zoom, projection, basemap, language, tabs).

### Architecture Note: Controllers vs MapViewer

**Controllers** are the preferred public API for map operations. They provide business logic, validation, animation support, and cross-controller coordination.

**MapViewer** provides low-level OpenLayers access. Some methods manipulate OL directly (e.g., `setMapZoomLevel`), while others delegate to controllers (e.g., `setExtent` → `mapController.zoomToExtent`). The delegation pattern is currently inconsistent — this is a **transitional architecture**. In the future, MapViewer will become an internal domain class and controllers will be the sole public API.

**In tests**, prefer controllers for map operations. Use MapViewer low-level methods only when you need immediate (non-animated) OL manipulation, such as setting zoom before a feature query.

| Operation            | Controller (preferred)                                                | MapViewer (low-level)                                       |
| -------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Zoom (animated)**  | `mapController.zoomMap(zoom, duration)` — animated, returns `Promise` |                                                             |
| **Zoom (immediate)** |                                                                       | `mapViewer.setMapZoomLevel(zoom)` — direct OL, no animation |
| **Zoom to extent**   | `mapController.zoomToExtent(extent)` — animated with validation       | `mapViewer.setExtent(extent)` — delegates to controller     |
| **Zoom to initial**  | `mapController.zoomToInitialExtent()`                                 | _(none)_                                                    |
| **Projection**       | `mapController.setProjection(code)` — returns `Promise`               | `mapViewer.setProjection(code)` — returns `boolean`         |
| **Basemap**          | `mapController.setBasemap(options)` — high-level                      | `mapViewer.basemap.createCoreBasemap()` — creation API      |
| **Rotation**         | `mapController.rotate(degree, animate)` — optional animation          | `mapViewer.rotate(degree)` — direct OL animate              |
| **Language**         | _(none)_                                                              | `mapViewer.setLanguage(lang)`                               |

### Template F1 — Controller Pattern (Preferred)

```typescript
/**
 * Tests [operation] via MapController.
 *
 * @returns A promise that resolves when the test completes
 */
testControllerZoom(): Promise<Test<number>> {
  return this.test(
    'Test MapController zoomMap with animation...',
    async (test) => {
      test.addStep('Zooming via controller with animation...');
      await this.getControllersRegistry().mapController.zoomMap(5, 500);

      test.addStep('Reading current zoom...');
      return this.getMapViewer().getView().getZoom()!;
    },
    (test, result) => {
      Test.assertIsEqual(result, 5);
    },
    async (test) => {
      await this.getControllersRegistry().mapController.zoomToInitialExtent();
    }
  );
}
```

### Template F2 — MapViewer Low-Level Pattern (When Needed)

Use MapViewer directly only when you need immediate OL manipulation without animation — for example, setting zoom before querying features:

```typescript
/**
 * Tests immediate zoom via MapViewer for feature query setup.
 *
 * @returns A promise that resolves when the test completes
 */
testMapViewerZoom(): Promise<Test<number>> {
  return this.test(
    'Test MapViewer setMapZoomLevel...',
    async (test) => {
      test.addStep('Setting zoom via MapViewer (immediate, no animation)...');
      await this.getMapViewer().setMapZoomLevel(8);

      test.addStep('Reading current zoom...');
      return this.getMapViewer().getView().getZoom()!;
    },
    (test, result) => {
      Test.assertIsEqual(result, 8);
    },
    async (test) => {
      await this.getControllersRegistry().mapController.zoomToInitialExtent();
    }
  );
}
```

### Key Rules

- Run sequentially via `await` (shared map state)
- Always reset state in `callbackFinalize`
- Tests that modify shared map state (zoom, projection) must not run in parallel with other map-state tests
- **Prefer controllers** — use MapViewer low-level access only when immediate (non-animated) OL manipulation is required

---

## Template G — Component Panel Test

**Group 4** — For testing footer bar tab components (Details, Data Table, Legend, Guide, etc.). These tests interact with the component via controllers, store getters, and DOM queries.

```typescript
/**
 * Tests [panel name] panel [behavior description].
 *
 * @returns A promise that resolves when the test completes
 */
testMyPanelBehavior(): Promise<Test<ResultType>> {
  return this.test(
    'Test [panel] panel [behavior]...',
    async (test) => {
      // Step 1: Activate the panel tab
      test.addStep('Selecting [panel] tab...');
      this.getControllersRegistry().uiController.setActiveFooterBarTab('panel-id');

      // Wait for UI to update
      await delay(500);

      // Step 2: Perform the interaction (query, filter, select, etc.)
      test.addStep('Performing [interaction]...');
      const result = await someInteraction();

      return result;
    },
    (test, result) => {
      // Step 3: Assert on store state or DOM
      test.addStep('Verifying [expected outcome]...');
      Test.assertIsDefined('result', result);

      // Verify active tab
      Test.assertIsEqual(getStoreUIActiveFooterBarTab(this.getMapId()).tabId, 'panel-id');
    },
    (test) => {
      // Cleanup: reset tab, remove layers, etc.
    }
  );
}
```

### Key Rules

- Use `onCanExecuteTestSuite()` guard to ensure the tab is configured in `footerBar.tabs.core`
- Use `this.getControllersRegistry().uiController.setActiveFooterBarTab()` to activate tabs
- Use `delay()` after tab switches to allow UI to update (minimum 500ms, some panels need 2000ms)
- Access store state via `getStore*` getters for assertions (e.g., `getStoreUIActiveFooterBarTab`, `getStoreDetailsFeatures`)
- Access DOM via `getStoreAppGeoviewHTMLElement(mapId).querySelector()` for DOM assertions

### Suite Guard Pattern

```typescript
protected override onCanExecuteTestSuite(): Promise<boolean> {
  const plugins = this.getMapViewer().mapFeaturesConfig.footerBar?.tabs?.core || [];
  if (!plugins.includes('details'))
    throw new TestSuiteCannotExecuteError(
      'To run this Test Suite, the details tab has to be loaded in the footerBar tabs core array.'
    );
  return Promise.resolve(true);
}
```

---

## Template H — Guarded Plugin Test

**Group 5** — For testing external plugin packages (Geochart, Swiper, Time Slider, Drawer). Each plugin suite guards execution so tests only run when the plugin is loaded.

### Suite Guard Pattern

```typescript
protected override onCanExecuteTestSuite(): Promise<boolean> {
  const plugins = this.getMapViewer().mapFeaturesConfig.corePackages || [];
  if (!plugins.includes('my-plugin'))
    throw new TestSuiteCannotExecuteError(
      'To run this Test Suite, the my-plugin package must be loaded.'
    );
  return Promise.resolve(true);
}
```

### Test Method Pattern

```typescript
/**
 * Tests [plugin] [behavior description].
 *
 * @returns A promise that resolves when the test completes
 */
testMyPluginBehavior(): Promise<Test<ResultType>> {
  return this.test(
    'Test [plugin] [behavior]...',
    async (test) => {
      test.addStep('Setting up [plugin] state...');
      // Access plugin via controller registry or plugin API
      const pluginController = this.getControllersRegistry().pluginController;
      // Interact with the plugin...
      return result;
    },
    (test, result) => {
      Test.assertIsDefined('result', result);
    }
  );
}
```

### Key Rules

- Always use `onCanExecuteTestSuite()` guard — check `corePackages` or `footerBar.tabs.core`
- Access plugins via `this.getControllersRegistry().pluginController`
- Plugin config goes in `corePackagesConfig` in the HTML map div
- Each plugin gets its own HTML map div with the plugin loaded

---

## Gotchas & Pitfalls

### Controllers vs MapViewer for Zoom

Controllers are the preferred path for map operations. MapViewer provides low-level OL access for cases where immediate (non-animated) manipulation is needed:

- **`await this.getControllersRegistry().mapController.zoomMap(zoom, duration)`** — Preferred. Animated zoom with validation. Returns a Promise that resolves when the animation completes
- **`await this.getMapViewer().setMapZoomLevel(zoom)`** — Low-level. Sets the OL view zoom directly (no animation). Returns a Promise that resolves on `rendercomplete`

Use `setMapZoomLevel()` only when you need an immediate zoom without animation (e.g., before querying features that have visibility range constraints).

### `queryLayerFeatures()` Visibility Guards

Before querying, `queryLayerFeatures()` checks:

1. `geoviewLayer.getVisibleIncludingParents()` — layer and all parents must be visible
2. `geoviewLayer.getInVisibleRange(currentZoom)` — current zoom must be within layer's min/max zoom

If either check fails, it returns `{ results: [] }` silently (no error thrown). **Set the zoom to a level within the layer's visible range** before calling `triggerGetAllFeatureInfo()`.

### `whenThisThen()` for Async Conditions

```typescript
import { whenThisThen } from "geoview-core/core/utils/utilities";

// Wait for a layer to be registered before querying
// prettier-ignore
await whenThisThen(
  () => this.getMapViewer().layer.allFeatureInfoLayerSet.getRegisteredLayerPaths().includes(layerPath),
  GVAbstractTester.LAYER_REGISTRATION_TIMEOUT_MS
);
```

### Sequential vs Parallel Execution

- Tests that modify shared map state (zoom, projection, center) → run **sequentially** via `await`
- Pure function tests and config validation → run in **parallel** via `Promise.all()`
- Query tests → run **after** all parallel tests (they change zoom)

### Race Conditions with Layer Removal

When a layer is removed while an async operation (like `queryLayer()`) is still running, handlers may try to access deleted state. Always add guard checks in `.then()`, `.catch()`, and `.finally()` handlers.

---

## Assertion API Quick Reference

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
