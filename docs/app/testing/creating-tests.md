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
import { Test } from "../core/test";
import { GVAbstractTester } from "./abstract-gv-tester";

export class MyFeatureTester extends GVAbstractTester {
  override getName(): string {
    return "MyFeatureTester";
  }

  testSomething(): Promise<Test<string>> {
    return this.test(
      "Test something works...",
      async (test) => {
        // EXECUTION: perform the action
        test.addStep("Doing something...");
        const result = await someOperation();
        return result;
      },
      (test, result) => {
        // ASSERTIONS: verify the result
        Test.assertIsDefined("result", result);
        Test.assertIsEqual(result, "expected-value");
      },
      (test) => {
        // CLEANUP (optional): always runs
        cleanupResources();
      },
    );
  }
}
```

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
      this.helperFinalizeStepRemoveLayerConfigAndAssert(test, layerPath);
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

```typescript
this.helperStepAddLayerOnMap(test, gvConfig); // Add layer and wait
this.helperStepAddLayerOnMapFromUUID(test, uuid); // Add from GeoCore UUID
this.helperStepCheckLayerAtLayerPath(test, layerPath); // Wait for layer ready
this.helperFinalizeStepRemoveLayerAndAssert(test, layerPath); // Cleanup
```

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

  protected override onLaunchTestSuite(): Promise<unknown> {
    // Parallel: independent tests
    const p1 = this.#tester.testSomething();
    const p2 = this.#tester.testSomethingElse();
    return Promise.all([p1, p2]);
  }
}
```

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
  this.addTestSuite(new GVTestSuiteMyFeature(window.cgpv.api, this.mapViewer));
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
    return result;
    }

          Test.assertIsEqual(result, expectedValue);
          return result!;
        }

    );
    }

````

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
      Test.assert IsEqual(resourceWasUsed(), true);
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
````

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
test.addStep("Creating GeoView Layer Configuration...");
test.addStep("Adding layer to the map...");
test.addStep("Waiting for layer to be ready...");
test.addStep("Verifying layer exists at path...");
```

❌ **Bad**:

```typescript
test.addStep("Step 1");
test.addStep("Doing stuff");
test.addStep("Done");
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
  throw new Error("Not found");
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

- Review [Test Architecture](app/testing/test-architecture.md) for deeper understanding
- See [API Reference](app/testing/api-reference.md) for complete API documentation
- Study existing testers in `src/tests/testers/` for more examples
- Read about [Available Test Suites](app/testing/available-suites.md) for real-world examples
