# Creating Custom Tests

This guide explains how to create custom test suites and testers for the GeoView Test Suite framework.

## Overview

Creating custom tests involves:

1. **Creating a Tester** - A class that contains test methods
2. **Creating a Test Suite** - A class that groups testers
3. **Registering the Suite** - Adding your suite to the plugin
4. **Configuration** - Making your suite available to users

## Quick Start

### Step 1: Create a Custom Tester

Create a new file in `src/tests/testers/` (e.g., `my-custom-tester.ts`):

```typescript
import { GVAbstractTester } from "./abstract-gv-tester";
import { Test } from "../core/test";

export class MyCustomTester extends GVAbstractTester {
  /**
   * Returns the name of the Tester.
   */
  override getName(): string {
    return "MyCustomTester";
  }

  /**
   * A simple test that verifies map is loaded.
   */
  testMapLoaded(): Promise<Test<boolean>> {
    return this.test(
      "Test if map is loaded",
      async (test) => {
        // Test execution logic
        test.addStep("Checking if map viewer exists...");
        const mapViewer = this.getMapViewer();

        test.addStep("Verifying map is initialized...");
        const isLoaded = mapViewer !== undefined;

        return isLoaded;
      },
      (test) => {
        // Assertions
        const result = test.getResult();
        Test.assertIsDefined(result);
        Test.assertIsEqual(result, true);
        return result!;
      }
    );
  }
}
```

### Step 2: Create a Custom Test Suite

Create a new file in `src/tests/suites/` (e.g., `suite-my-custom.ts`):

```typescript
import type { API } from "geoview-core/api/api";
import type { MapViewer } from "geoview-core/geo/map/map-viewer";
import { GVAbstractTestSuite } from "./abstract-gv-test-suite";
import { MyCustomTester } from "../testers/my-custom-tester";

export class GVTestSuiteMyCustom extends GVAbstractTestSuite {
  #myCustomTester: MyCustomTester;

  constructor(api: API, mapViewer: MapViewer) {
    super(api, mapViewer);

    // Create and add tester
    this.#myCustomTester = new MyCustomTester(api, mapViewer);
    this.addTester(this.#myCustomTester);
  }

  override getName(): string {
    return "My Custom Test Suite";
  }

  override getDescriptionAsHtml(): string {
    return "Test Suite for my custom functionality.";
  }

  protected override onLaunchTestSuite(): Promise<unknown> {
    // Run tests
    const pTest1 = this.#myCustomTester.testMapLoaded();

    // Return promise that resolves when all tests complete
    return Promise.all([pTest1]);
  }
}
```

### Step 3: Register Your Suite

Add your suite to `src/index.tsx`:

```typescript
import { GVTestSuiteMyCustom } from './tests/suites/suite-my-custom';

// In the TestSuitePlugin class:
#suites: { [key: string]: AbstractTestSuite } = {
  'suite-config': GVTestSuiteConfig,
  'suite-map': GVTestSuiteMapVaria,
  'suite-layer': GVTestSuiteLayer,
  'suite-geochart': GVTestSuiteGeochart,
  'suite-my-custom': GVTestSuiteMyCustom,  // Add your suite
};
```

### Step 4: Use Your Suite

Configure your suite in GeoView config:

```json
{
  "corePackages": ["test-suite"],
  "corePackagesConfig": [
    {
      "test-suite": {
        "suites": ["suite-my-custom"]
      }
    }
  ]
}
```

## Test Method Patterns

### Basic Test Pattern

```typescript
testSomething(): Promise<Test<ResultType>> {
  return this.test(
    'Test description shown to user',
    async (test) => {
      // Execution phase
      test.addStep('Describe what you are doing...');
      const result = await performAction();

      test.addStep('Another step...');
      const finalResult = processResult(result);

      return finalResult;
    },
    (test) => {
      // Assertion phase
      const result = test.getResult();
      Test.assertIsDefined(result);
      Test.assertIsEqual(result.someProperty, expectedValue);
      return result!;
    },
    (test) => {
      // Optional cleanup phase
      test.addStep('Cleaning up...');
      cleanupResources();
    }
  );
}
```

### Testing Expected Errors (True Negatives)

```typescript
testErrorHandling(): Promise<Test<MyErrorType>> {
  return this.testError(
    'Test that error is properly thrown',
    MyExpectedErrorClass,
    async (test) => {
      // Execution that should throw error
      test.addStep('Attempting invalid operation...');
      await operationThatShouldFail();
    },
    (test) => {
      // Assertions on the error
      const error = test.getError();
      Test.assertIsDefined(error);
      Test.assertIsInstanceOf(error, MyExpectedErrorClass);
      return error as MyExpectedErrorClass;
    }
  );
}
```

## Working with Steps

### Adding Steps

Steps provide granular progress feedback:

```typescript
test.addStep("Loading configuration...");
test.addStep("Validating data...");
test.addStep("Processing results...");
```

### Step Levels

Use different step levels for visual hierarchy:

```typescript
test.addStep("Major operation starting", "major", "blue");
test.addStep("Sub-step 1", "regular", "black");
test.addStep("Sub-step 2", "regular", "black");
test.addStep("Operation complete", "major", "green");
```

## Assertion Methods

### Value Assertions

```typescript
// Check if defined
Test.assertIsDefined(value);
Test.assertIsUndefined(value);

// Check equality
Test.assertIsEqual(actual, expected);
Test.assertIsNotEqual(actual, unexpected);

// Check instance type
Test.assertIsInstanceOf(object, ExpectedClass);
```

### Array Assertions

```typescript
// Check array length
Test.assertIsArrayLength(array, expectedLength);
Test.assertIsArrayLengthMinimal(array, minimumLength);

// Check array contents
Test.assertArrayIncludes(array, expectedValue);
Test.assertArrayExcludes(array, unexpectedValue);
```

### Object Assertions

```typescript
// Verify object structure and values
const actual = {
  user: { name: "Alice", roles: ["admin"] },
  active: true,
};

const expected = {
  user: { name: "Alice" }, // Partial check - only verifies name
  active: true,
};

Test.assertJsonObject(actual, expected); // Passes
```

The `assertJsonObject` method verifies that the actual object contains **at least** all properties and values from the expected object. Additional properties in actual are allowed.

## Layer Testing Patterns

### Adding and Testing Layers

```typescript
testMyLayer(): Promise<Test<AbstractGVLayer>> {
  const gvLayerId = generateId();
  const layerPath = `${gvLayerId}/0`;

  return this.test(
    'Test adding my custom layer',
    async (test) => {
      // Create layer config
      test.addStep('Creating layer configuration...');
      const config = MyLayer.createGeoviewLayerConfig(
        gvLayerId,
        'My Layer',
        'https://example.com/layer'
      );

      // Add to map
      await LayerTester.helperStepAddLayerOnMap(
        test,
        this.getMapViewer(),
        config
      );

      // Wait until ready
      return LayerTester.helperStepCheckLayerAtLayerPath(
        test,
        this.getMapViewer(),
        layerPath
      );
    },
    (test) => {
      // Assert layer exists
      return LayerTester.helperStepAssertLayerExists(
        test,
        this.getMapViewer(),
        layerPath
      );
    },
    (test) => {
      // Cleanup
      LayerTester.helperFinalizeStepRemoveLayerAndAssert(
        test,
        this.getMapViewer(),
        layerPath
      );
    }
  );
}
```

### Using Layer Helper Methods

The `LayerTester` class provides helper methods:

```typescript
// Add layer to map and wait for added event
await LayerTester.helperStepAddLayerOnMap(test, mapViewer, config);

// Check layer exists at path
const layer = await LayerTester.helperStepCheckLayerAtLayerPath(
  test,
  mapViewer,
  layerPath
);

// Assert layer exists
const layer = LayerTester.helperStepAssertLayerExists(
  test,
  mapViewer,
  layerPath
);

// Remove layer and assert removal
LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, mapViewer, layerPath);
```

## Configuration Testing Patterns

### Testing Layer Configurations

```typescript
testMyLayerConfig(): Promise<Test<TypeGeoviewLayerConfig>> {
  return this.test(
    'Test my layer configuration',
    async (test) => {
      test.addStep('Creating configuration object...');
      const config = {
        geoviewLayerId: 'myLayer',
        geoviewLayerName: 'My Test Layer',
        metadataAccessPath: 'https://example.com/metadata'
      };

      test.addStep('Initializing configuration...');
      const gvConfig = await MyLayer.createLayerConfig(config);

      return gvConfig;
    },
    (test) => {
      const config = test.getResult();

      // Verify config structure
      Test.assertJsonObject(config, {
        geoviewLayerId: 'myLayer',
        geoviewLayerType: 'myLayerType',
        listOfLayerEntryConfig: []
      });

      return config!;
    }
  );
}
```

## Event Handling in Tests

### Waiting for Events

```typescript
testWithEventWait(): Promise<Test<EventPayload>> {
  return this.test(
    'Test waiting for map event',
    async (test) => {
      test.addStep('Setting up event listener...');

      // Create promise that resolves on event
      const eventPromise = new Promise<EventPayload>((resolve) => {
        this.getMapViewer().onMapLoaded((payload) => {
          resolve(payload);
        });
      });

      test.addStep('Triggering action...');
      triggerSomeAction();

      test.addStep('Waiting for event...');
      const payload = await eventPromise;

      return payload;
    },
    (test) => {
      const payload = test.getResult();
      Test.assertIsDefined(payload);
      return payload!;
    }
  );
}
```

## Advanced Patterns

### Testing Asynchronous Operations

```typescript
testAsyncOperation(): Promise<Test<ResultType>> {
  return this.test(
    'Test async operation',
    async (test) => {
      test.addStep('Starting async operation...');

      // Wait for multiple async operations
      const [result1, result2] = await Promise.all([
        asyncOperation1(),
        asyncOperation2()
      ]);

      test.addStep('Processing results...');
      const finalResult = combineResults(result1, result2);

      return finalResult;
    },
    (test) => {
      const result = test.getResult();
      Test.assertIsDefined(result);
      Test.assertJsonObject(result, expectedStructure);
      return result!;
    }
  );
}
```

### Testing with Timeouts

```typescript
testWithTimeout(): Promise<Test<boolean>> {
  return this.test(
    'Test with timeout',
    async (test) => {
      test.addStep('Starting timed operation...');

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 5000);
      });

      const operationPromise = performLongOperation();

      // Race between operation and timeout
      const result = await Promise.race([
        operationPromise,
        timeoutPromise
      ]);

      return result;
    },
    (test) => {
      const result = test.getResult();
      Test.assertIsDefined(result);
      return result!;
    }
  );
}
```

### Conditional Testing

```typescript
testConditional(): Promise<Test<string>> {
  return this.test(
    'Test with conditional logic',
    async (test) => {
      test.addStep('Checking preconditions...');
      const canProceed = checkPreconditions();

      if (!canProceed) {
        test.addStep('Preconditions not met, skipping...', 'major', 'orange');
        test.setStatus('skipped');
        return 'skipped';
      }

      test.addStep('Preconditions met, proceeding...');
      const result = await performTest();

      return result;
    },
    (test) => {
      const result = test.getResult();
      if (result === 'skipped') {
        return result;
      }

      Test.assertIsEqual(result, expectedValue);
      return result!;
    }
  );
}
```

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
```

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
