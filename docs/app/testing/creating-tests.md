# Creating Custom Tests

This guide explains how to add new test suites and testers to the GeoView Test Suite framework.

## Overview

Creating custom tests involves four steps:

1. **Create a Tester** — A class containing test methods
2. **Create a Test Suite** — A class that groups and orchestrates testers
3. **Register the Suite** — Wire it into the plugin's `onAdd()` method
4. **Configure** — Add the suite ID to the HTML test page

## Step 1: Create a Tester

Create a new file in `src/tests/testers/`:

```typescript
// my-feature-tester.ts
import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';

export class MyFeatureTester extends GVAbstractTester {
  override getName(): string {
    return 'MyFeatureTester';
  }

  testSomething(): Promise<Test<string>> {
    return this.test(
      'Test something works...',
      async (test) => {
        // EXECUTION: perform the action
        test.addStep('Doing something...');
        const result = await someOperation();
        return result;
      },
      (test, result) => {
        // ASSERTIONS: verify the result
        Test.assertIsDefined('result', result);
        Test.assertIsEqual(result, 'expected-value');
      },
      (test) => {
        // CLEANUP (optional): always runs
        cleanupResources();
      }
    );
  }
}
```

Declare any result `type` or `interface` a tester needs in a `// #region TYPES AND INTERFACES` block at the bottom of the file, after the class, each with a single-line JSDoc. This keeps the test methods at the top of the file.

### The `test()` Method

```typescript
this.test(message, callback, callbackAssert, callbackFinalize?)
```

| Parameter          | Signature                | Purpose                                     |
| ------------------ | ------------------------ | ------------------------------------------- |
| `message`          | `string`                 | Description shown in test output            |
| `callback`         | `(test) => Promise<T>`   | Execute test logic, return result           |
| `callbackAssert`   | `(test, result) => void` | Run assertions on the result (throw = fail) |
| `callbackFinalize` | `(test) => void`         | Cleanup (always runs, optional)             |

### The Three Callbacks Are Three Distinct Sections (enforced)

Every test is split into three sections, and **each section has exactly one job**:

| Callback           | Section       | Responsibility                                                                                     |
| ------------------ | ------------- | -------------------------------------------------------------------------------------------------- |
| `callback`         | **Execution** | Perform all the work, run the operation under test, and **return** its outcome as `result`         |
| `callbackAssert`   | **Assertion** | Receive `result` and **only verify it** with `Test.assert*` (read-only navigation getters allowed) |
| `callbackFinalize` | **Cleanup**   | Remove layers / reset state (always runs)                                                          |

**Rule:** The operation being tested — the "act" — must run in the **execution** callback and be **returned** as `result`. The **assertion** callback receives that `result` as its second parameter and verifies it. **Never execute the function under test inside the assertion callback.**

- If the subject of the test is a **function's return value**, call that function in the execution callback and `return` it, then assert on the `result` parameter — do not re-call it in the assertion callback.
- Read-only getters used purely to **navigate to a value** for an assertion may live in the assertion callback. The line is: navigating to a property is fine; executing the behavior under test is not.

```typescript
// ❌ Bad: the function under test runs in the ASSERTION callback
async (test) => {
  await this.helperStepAddLayerOnMap(test, gvConfig);
  return this.helperStepCheckLayerAtLayerPath(test, layerPath);
},
(test) => {
  // The "act" is happening in the wrong section
  const resolved = this.getMapViewer().layer.getGeoviewLayerByRootId(gvLayerId);
  Test.assertIsDefined("resolved", resolved);
},

// ✅ Good: the function under test runs in EXECUTION and flows through `result`
async (test) => {
  await this.helperStepAddLayerOnMap(test, gvConfig);
  await this.helperStepCheckLayerAtLayerPath(test, layerPath);

  test.addStep("Resolving the first layer under the root id...");
  return this.getMapViewer().layer.getGeoviewLayerByRootId(gvLayerId); // the "act"
},
(test, result) => {
  // Assertion only — verify the passed result
  Test.assertIsDefined("resolved", result);
  Test.assertIsEqual(result.getLayerPath(), layerPath);
},
```

Set the `Test<T>` generic to the type the execution callback returns (e.g. `Test<AbstractBaseGVLayer>` when it returns `getGeoviewLayerByRootId(...)`).

### The `testError()` Method (True Negatives)

Use when the test should **throw** a specific error to pass:

```typescript
testBadUrlFails(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
  return this.testError(
    'Test with bad url should fail...',
    LayerServiceMetadataUnableToFetchError,
    async (test) => {
      test.addStep('Creating config with bad URL...');
      const config = MyLayer.createGeoviewLayerConfig(id, name, GVAbstractTester.BAD_URL, false, [...]);
      await this.helperStepAddLayerOnMap(test, config);
    },
    undefined,  // optional: additional assertion on the error
    (test) => {
      this.removeLayerConfigAndAssert(test, layerPath);
    }
  );
}
```

### Accessor Methods

Inside testers, access the map and controllers via inherited methods:

```typescript
this.getMapViewer(); // MapViewer instance
this.getMapId(); // Map ID string
this.getControllersRegistry(); // Controller registry
this.getGeometryApi(); // Geometry API
```

### Helper Methods

**Instance helpers** (inherited from `GVAbstractTester`):

Subclasses can use the protected `getViewportHost()` helper to access their suite's existing
map root. It throws `TestError` if the container is missing; reuse this root rather than
appending fixture maps to the runner page.

```typescript
this.addLayerOnMap(test, gvConfig); // Add layer and wait for creation
this.addLayerOnMapFromUUID(test, uuid); // Add from GeoCore UUID
this.waitLayerAtLayerPath(test, layerPath); // Wait for loading and legend resolution
this.removeLayerConfigAndAssert(test, layerPath); // Cleanup
```

For successful layer setup, use a fixture-specific `addLayer...` helper on `GVAbstractTester`,
such as `addLayerEsriDynamicHistoFloodEvents(test)` or `addLayerEsriFeatureForestIndustry(test)`.
Each helper immediately returns `{ layerPath, promiseLayer }`: capture `layerPath` synchronously,
then await `promiseLayer` for the selected layer after loading and legend resolution.

When writing a fixture helper, create its configuration with normal synchronous setup code and
chain addition and readiness with `then()`, rather than an async IIFE:

```typescript
addLayerEsriFeatureTopProjects<T>(test: Test<T>): GVLayerFixtureResult {
  const gvLayerId = generateId();
  const layerPath = `${gvLayerId}/${GVAbstractTester.TOP_PROJECTS_900A_LAYER_ID}`;
  test.addStep('Creating the Top Projects Esri Feature configuration...');
  const gvConfig = EsriFeature.createGeoviewLayerConfig(
    gvLayerId,
    GVAbstractTester.TOP_PROJECTS_900A_LAYER_NAME,
    GVAbstractTester.TOP_PROJECTS_900A_URL_MAP_SERVER,
    false,
    [{ id: GVAbstractTester.TOP_PROJECTS_900A_LAYER_ID }]
  );
  const promiseLayer = this.addLayerOnMap(test, gvConfig).then(
    (): Promise<AbstractGVLayer> => this.waitLayerAtLayerPath(test, layerPath)
  );
  return { layerPath, promiseLayer };
}
```

Synchronous setup exceptions propagate directly from the helper. Addition, loading, and readiness
failures reject `promiseLayer` without hiding the error, so callers can retain the returned cleanup
path before awaiting it. Start genuinely asynchronous setup (such as reading a GeoPackage) with its
own promise, then chain configuration selection, addition, and readiness. Chain required sibling
waits in order rather than running them concurrently.

Fixture helpers own ID generation. Use the resolved layer's `getLayerPath()` for assertions and
layer-specific operations. Retain the immediate `layerPath` for finalizer cleanup before awaiting
`promiseLayer`, so a rejected add/load still leaves a cleanup scope. For metadata-derived children
whose exact path is not known synchronously, or fixtures that add siblings, `layerPath` may be the
GeoView root ID; root-scope cleanup removes its configured entries. GeoCore fixtures use their
service UUID rather than a generated ID. For a test that returns query data or other observations,
return the fixture alongside those observations (for example, `{ gvLayer, data: queryResult }`).
Keep VPN/projection skip guards in the test before calling the helper. Tests expecting addition or
loading errors continue using the lower-level helpers inside `testError()`.

**Static helpers** on `LayerTester` (require explicit `mapId`):

```typescript
LayerTester.helperStepAssertLayerExists(test, this.getMapId(), layerPath, iconImage?, iconsList?)
LayerTester.helperStepAssertStyleApplied(test, this.getMapId(), layerPath, iconImage?, iconsList?)
```

### Shared Constants

URLs, UUIDs, and expected icon lists are defined as `static readonly` on `GVAbstractTester`:

```typescript
GVAbstractTester.BAD_URL; // 'https://badurl/oops'
GVAbstractTester.QUEBEC_LONLAT; // [-71.356, 46.780]
GVAbstractTester.ONTARIO_CENTER_LONLAT; // [-87, 51]
GVAbstractTester.HISTORICAL_FLOOD_URL_MAP_SERVER;
// etc.
```

## Step 2: Create a Test Suite

Create a new file in `src/tests/suites/`:

```typescript
// suite-my-feature.ts
import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';
import { MyFeatureTester } from '../testers/my-feature-tester';

export class GVTestSuiteMyFeature extends GVAbstractTestSuite {
  #tester: MyFeatureTester;

  constructor(api: API, mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super(api, mapViewer, controllerRegistry);
    this.#tester = new MyFeatureTester(api, mapViewer, controllerRegistry);
    this.addTester(this.#tester);
  }

  override getName(): string {
    return 'My Feature Test Suite';
  }

  override getDescriptionAsHtml(): string {
    return 'Tests for My Feature.';
  }

  override getTestsTotalFinal(): number {
    return 2;
  }

  protected override onLaunchTestSuite(): Promise<unknown> {
    // Parallel: independent tests
    const p1 = this.#tester.testSomething();
    const p2 = this.#tester.testSomethingElse();
    return Promise.all([p1, p2]);
  }
}
```

`getTestsTotalFinal()` is required for every concrete suite. Keep it equal to the full
`onLaunchTestSuite()` call count, including heavy tests gated by `getIsRunningHeavyTests()` and
excluding debug-only or commented-out calls. The test catalog is an unnumbered inventory, and the
automated release checklist tracks pass status without test totals. Update catalog entries when test
methods are added, removed, or renamed; update checklist rows only when the suite list or execution
variants change. There are no documentation totals to reconcile.

### Conditional Execution

If the suite requires a specific plugin/feature, override `onCanExecuteTestSuite()`:

```typescript
protected override async onCanExecuteTestSuite(): Promise<boolean> {
  const config = this.getMapViewer().mapFeaturesConfig;
  return config.footerBar?.tabs?.core?.includes('my-feature') ?? false;
}
```

### Mixed Parallel + Sequential

When some tests modify shared map state (zoom, projection):

```typescript
protected override async onLaunchTestSuite(): Promise<unknown> {
  // Parallel tests first
  const p1 = this.#tester.testAddLayer();
  const p2 = this.#tester.testAddLayerBadUrl();
  await Promise.all([p1, p2]);

  // Sequential tests that change zoom (run after parallel)
  await this.#tester.testLayerQuery();
  return this.#tester.testAnotherLayerQuery();
}
```

## Step 3: Register the Suite

In `src/index.tsx`, import and add an `else if` branch in `onAdd()`:

```typescript
import { GVTestSuiteMyFeature } from './tests/suites/suite-my-feature';

// In onAdd():
} else if (suite === 'suite-my-feature') {
  this.addTestSuite(new GVTestSuiteMyFeature(window.cgpv.api, this.mapViewer, this.controllerRegistry));
}
```

## Step 4: Add to HTML Test Page

In `packages/geoview-core/public/templates/tests.html`, create a map div:

```html
<div
  id="mapMyFeature"
  class="geoviewMap"
  data-lang="en"
  data-config="{
    'map': { 'viewSettings': { 'projection': 3978 } },
    'corePackages': ['test-suite'],
    'corePackagesConfig': [{ 'test-suite': { 'suites': ['suite-my-feature'] } }]
  }"
></div>
```

## Key Rules

1.  **Always use `test.addStep()`** — logs progress in the test UI
2.  **Use static assertions** from `Test` class — never use `if/else` for checks
3.  **Always clean up** — remove layers, reset state in `callbackFinalize`
4.  **Use `generateId()`** for layer IDs — prevents conflicts between parallel tests
5.  **Add constants to `GVAbstractTester`** — URLs, expected icon lists go there
6.  **Import layer classes directly** — e.g., `EsriDynamic`, `WMS`, `GeoJSON` for `createGeoviewLayerConfig()`

## Best Practices

### Test Isolation

Each test should:

- Set up its own data
- Clean up after itself
- Not depend on other tests' state
- Not modify shared resources without cleanup

```typescript
testIsolated(): Promise<Test<void>> {
  let resourceId: string;

  return this.test(
    'Test with proper isolation',
    async (test) => {
      // Setup
      test.addStep('Creating test resource...');
      resourceId = await createResource();

      // Test
      test.addStep('Testing resource...');
      await useResource(resourceId);
    },
    (test) => {
      // Assertions
      Test.assertIsEqual(resourceWasUsed(), true);
    },
    (test) => {
      // Cleanup - always runs
      if (resourceId) {
        test.addStep('Cleaning up resource...');
        deleteResource(resourceId);
      }
    }
  );
}
```

Map configuration tests belong in `MapConfigTester` and run sequentially in `suite-map-config`.
`#helperCreateMapConfig(test, mapId, mapConfig)` deletes the previous viewer, creates a new one with
`createMapFromConfigFast`, reassigns the tester's viewer **and controllers** using
`assignMapViewerAndControllers`, and waits for layer loading.
Overrides are nested configuration objects deep-merged with the helper's base fixture.
The helper disables current-config inheritance in `replaceMap()` so previous tests' extent targets,
zoom constraints, and other settings cannot leak into the new map. Other `replaceMap()` callers
inherit the current configuration by default; pass `false` as its fifth argument for an isolated configuration.
Use `#helperCreateMapConfigWithInitialSettings` for a flat layer,
`#helperCreateMapConfigWithGroupInitialSettings` for parent/child states, and
`#helperCreateMapConfigWithNestedGroupInitialSettings` for full three-level settings.
Never retain controllers from the destroyed map.

Suites run sequentially but can share a map ID whose viewer is replaced by an earlier suite.
Before eligibility checks, each GeoView suite binds the current API-registered viewer and its controllers
to itself and all its testers. During execution, `replaceMap()` notifies the owning suite to update
those references together. Getters return the assigned references without refreshing them.
Use those getters after a replacement rather than keeping viewer or controller references from before it.
See the [test-suite maintenance reference](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/.github/ai/test-suite.md#gotchas--pitfalls).

### Descriptive Test Names

Use clear, descriptive test names:

✅ **Good**:

```typescript
testAddEsriDynamicLayerWithValidUrl();
testMapZoomOperationsWithinConstraints();
testGeoJSONLayerWithPolygonGeometry();
```

❌ **Bad**:

```typescript
test1();
testLayer();
testStuff();
```

### Meaningful Steps

Add steps that help users understand progress:

✅ **Good**:

```typescript
test.addStep('Creating GeoView Layer Configuration...');
test.addStep('Adding layer to the map...');
test.addStep('Waiting for layer to be ready...');
test.addStep('Verifying layer exists at path...');
```

❌ **Bad**:

```typescript
test.addStep('Step 1');
test.addStep('Doing stuff');
test.addStep('Done');
```

### Error Messages

Provide context in error messages:

✅ **Good**:

```typescript
if (!layer) {
  throw new Error(`Layer not found at path: ${layerPath}`);
}
```

❌ **Bad**:

```typescript
if (!layer) {
  throw new Error('Not found');
}
```

## Testing Best Practices Summary

1. **One test, one concern**: Each test should verify one specific behavior
2. **Arrange, Act, Assert**: Structure tests with clear setup, execution, and verification
3. **Independent tests**: Tests should not depend on each other
4. **Descriptive names**: Test names should clearly describe what is being tested
5. **Informative steps**: Add steps that explain what the test is doing
6. **Proper cleanup**: Always clean up resources in the finalize callback
7. **Appropriate assertions**: Use the right assertion method for each check
8. **Handle async properly**: Always await async operations
9. **Test both success and failure**: Include true negative tests
10. **Keep tests focused**: Don't try to test everything in one test

## Next Steps

- Review [Test Architecture](test-architecture.md#class-hierarchy) for deeper understanding
- See [API Reference](api-reference.md) for complete API documentation
- Study existing testers in `src/tests/testers/` for more examples
- Read about [Available Test Suites](available-suites.md) for real-world examples
