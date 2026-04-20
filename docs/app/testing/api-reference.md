# Test Suite API Reference

Quick reference for the assertion API and helper methods.

## Assertion Methods (Static on `Test`)

All assertions throw on failure. Use inside `callbackAssert`.

### Value Assertions

```typescript
Test.assertIsDefined("propertyName", value); // Throws if undefined
Test.assertIsUndefined("propertyName", value); // Throws if defined
Test.assertIsEqual(actual, expected); // Strict equality (===)
Test.assertIsNotEqual(actual, expected); // Strict inequality (!==)
Test.assertIsInstance(value, ExpectedClass); // instanceof check
Test.assertIsErrorInstance(error, ExpectedClass); // Error type check
Test.assertFail("reason"); // Force failure
```

### Array Assertions

```typescript
Test.assertIsArray(value); // Checks Array.isArray()
Test.assertIsArrayLengthEqual(array, expectedLen); // Exact length
Test.assertIsArrayLengthMinimal(array, minLen); // Minimum length
Test.assertArrayIncludes(array, expectedValue); // Contains value
Test.assertArrayExcludes(array, excludedValue); // Does not contain value
Test.assertIsArrayEqual(actual, expected); // Element-wise equality
Test.assertIsArrayEqualJsons(actual, expected); // Deep JSON comparison
```

### Object Assertions

```typescript
Test.assertJsonObject(actual, expected);
```

Verifies `actual` contains **at least** all properties and values from `expected`. Extra properties in `actual` are allowed. Deep recursive comparison.

## Test Instance Methods

```typescript
test.addStep(message, level?, color?)   // Log progress ('regular'|'major', CSS color)
test.getResult(): T | undefined         // Get test result (set by callback return)
test.getError(): Error | undefined      // Get error if test failed
test.getStatus(): TestStatus            // 'new'|'running'|'verifying'|'success'|'failed'
test.getTitle(): string                 // Test description
test.getSteps(): TestStep[]             // All logged steps
```

## Instance Helper Methods (on `this`)

Inherited from `GVAbstractTester`. These use `this.getMapViewer()` internally — no need to pass map references.

```typescript
// Add layer to map and wait for it to load
await this.helperStepAddLayerOnMap(test, gvConfig);

// Add layer from GeoCore UUID
await this.helperStepAddLayerOnMapFromUUID(test, uuid);

// Wait for layer to be ready at a path
await this.helperStepCheckLayerAtLayerPath(test, layerPath);

// Remove layer and assert removal (cleanup)
this.helperFinalizeStepRemoveLayerAndAssert(test, layerPath);
```

## Static Helper Methods (on `LayerTester`)

These require explicit `mapId` because they don't have access to `this`.

```typescript
// Assert layer exists with optional icon checks
LayerTester.helperStepAssertLayerExists(test, mapId, layerPath, iconImage?, iconsList?)

// Assert style was applied
LayerTester.helperStepAssertStyleApplied(test, mapId, layerPath, iconImage?, iconsList?)
```

## Accessor Methods (on `this`)

```typescript
this.getMapViewer(); // MapViewer instance
this.getMapId(); // Map ID string
this.getControllersRegistry(); // Access controllers
this.getGeometryApi(); // Geometry API
```

## Type Definitions

```typescript
type TestStatus = "new" | "running" | "verifying" | "success" | "failed";
type TestType = "regular" | "true-negative";
type TestStepLevel = "major" | "regular";
```

## Plugin Event Methods

The `TestSuitePlugin` emits events through the delegate pattern:

```typescript
plugin.onTestStarted(callback); // Test begins execution
plugin.onTestUpdated(callback); // Test adds a step
plugin.onSuccess(callback); // Test passes
plugin.onFailure(callback); // Test fails
```

status?: TestStatus;
step?: string;
error?: Error;
}

````

### TestChangedDelegate

```typescript
type TestChangedDelegate = EventDelegateBase<
  AbstractTester,
  TestChangedEvent,
  void
>;
````

---

## Error Classes

All error classes extend `TestError` which extends `Error`.

### TestError

Base class for all test errors.

### AssertionUndefinedError

Thrown when value should be defined but is undefined.

### AssertionDefinedError

Thrown when value should be undefined but is defined.

### AssertionValueError

Thrown when value doesn't match expected.

**Properties**:

- `actualValue: unknown`
- `expectedValue: unknown`

### AssertionWrongInstanceError

Thrown when value is not instance of expected class.

### AssertionArrayLengthError

Thrown when array length doesn't match expected.

### AssertionArrayLengthMinimalError

Thrown when array length is less than minimum.

### AssertionArrayIncludingError

Thrown when array doesn't include expected value.

### AssertionArrayExcludingError

Thrown when array includes unexpected value.

### AssertionJSONObjectError

Thrown when object structure doesn't match expected.

**Properties**:

- `mismatches: string[]` - Array of mismatch descriptions

### AssertionWrongErrorInstanceError

Thrown when caught error is not expected type.

### AssertionNoErrorThrownError

Thrown when error test doesn't throw expected error.

---

## Configuration Types

### TestSuiteConfig

```typescript
interface TestSuiteConfig {
  suites: string[]; // Array of suite names to execute
}
```

**Example**:

```json
{
  "test-suite": {
    "suites": ["suite-config", "suite-map", "suite-layer"]
  }
}
```

---

## Usage Examples

### Creating a Custom Tester

```typescript
import { GVAbstractTester } from "./abstract-gv-tester";
import { Test } from "../core/test";

export class MyTester extends GVAbstractTester {
  override getName(): string {
    return "MyTester";
  }

  testFeature(): Promise<Test<boolean>> {
    return this.test(
      "Test my feature",
      async (test) => {
        test.addStep("Step 1...");
        const result = await doSomething();
        test.addStep("Step 2...");
        return result;
      },
      (test) => {
        const result = test.getResult();
        Test.assertIsDefined(result);
        Test.assertIsEqual(result, true);
        return result!;
      },
    );
  }
}
```

### Creating a Custom Test Suite

```typescript
import { GVAbstractTestSuite } from "./abstract-gv-test-suite";
import { MyTester } from "../testers/my-tester";

export class MyTestSuite extends GVAbstractTestSuite {
  #myTester: MyTester;

  constructor(api: API, mapViewer: MapViewer) {
    super(api, mapViewer);
    this.#myTester = new MyTester(api, mapViewer);
    this.addTester(this.#myTester);
  }

  override getName(): string {
    return "My Test Suite";
  }

  override getDescriptionAsHtml(): string {
    return "Tests for my custom functionality.";
  }

  protected override onLaunchTestSuite(): Promise<unknown> {
    return Promise.all([this.#myTester.testFeature()]);
  }
}
```

### Using Events

```typescript
const plugin = cgpv.api.maps["mapId"].corePackages["test-suite"];

plugin.onTestStarted((event) => {
  console.log(`Started: ${event.testName}`);
});

plugin.onSuccess((event) => {
  console.log(`Passed: ${event.testName}`);
});

plugin.onFailure((event) => {
  console.error(`Failed: ${event.testName}`, event.error);
});

await plugin.launchTestSuites();
```

---

## Related Documentation

- [Creating Custom Tests](app/testing/creating-tests.md) - Development guide
- [Test Architecture](app/testing/test-architecture.md) - Architecture overview
- [Using the Test Suite](app/testing/using-test-suite.md) - User guide
