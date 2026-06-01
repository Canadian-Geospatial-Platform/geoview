# Test Architecture

This document explains the design of the GeoView Test Suite framework.

## Class Hierarchy

```
packages/geoview-test-suite/src/
├── index.tsx                            # Plugin entry — registers suites from config
└── tests/
    ├── core/                            # Framework base classes
    │   ├── abstract-test-suite.ts       # Base suite — addTester(), launchTestSuite()
    │   ├── abstract-tester.ts           # Base tester — test(), testError(), assertions
    │   ├── test.ts                      # Test<T> — lifecycle, static assertions
    │   ├── test-step.ts                 # TestStep — message, level, color
    │   └── exceptions.ts               # Assertion error types
    ├── suites/                          # GeoView-specific suites
    │   ├── abstract-gv-test-suite.ts    # GV base — holds API + MapViewer refs
    │   ├── suite-core.ts               # Date/utility tests
    │   ├── suite-config.ts             # Layer config validation
    │   ├── suite-layer.ts              # Layer add/remove/legend/query
    │   ├── suite-map-varia.ts          # Map zoom/projection/basemap
    │   ├── suite-map-config.ts         # Map config creation/destruction
    │   ├── suite-geochart.ts           # Geochart plugin tests
    │   ├── suite-details.ts            # Details panel tests
    │   └── suite-ui.ts                 # DOM-level UI tests
    └── testers/                         # GeoView-specific testers
        ├── abstract-gv-tester.ts        # GV base — constants, URLs, helpers
        ├── core-tester.ts
        ├── config-tester.ts
        ├── layer-tester.ts
        ├── map-tester.ts
        ├── map-config-tester.ts
        ├── geochart-tester.ts
        ├── details-tester.ts
        └── ui-tester.ts
```

## Test Lifecycle

Each test follows this lifecycle:

```
┌─────────┐
│   new   │  Test instance created
└────┬────┘
     │ test() called
     ▼
┌──────────┐
│ running  │  Executing callback (test logic)
└────┬─────┘
     │ callback returns result
     ▼
┌───────────┐
│ verifying │  Running callbackAssert (assertions)
└────┬──────┘
     │
     ├── assertions pass ──> ┌─────────┐
     │                       │ success │
     │                       └─────────┘
     │
     └── assertion fails ──> ┌────────┐
                              │ failed │
                              └────────┘
```

**callbackFinalize** (cleanup) always runs after assertions, regardless of success or failure.

## Execution Flow

```
1. Plugin reads config: "suites": ["suite-layer", "suite-config"]
2. Plugin creates suite instances via if/else-if chain in onAdd()
3. Each suite creates its testers in the constructor
4. Suite.onLaunchTestSuite() orchestrates test execution:
   ├── Independent tests → Promise.all([...])
   └── State-dependent tests → sequential await
5. Each tester.test() call:
   ├── Creates Test<T> instance
   ├── Executes callback (returns result)
   ├── Runs callbackAssert (throws on failure)
   ├── Runs callbackFinalize (cleanup)
   └── Emits success/failure event
```

## Event Propagation

Events bubble up through the hierarchy:

```
Test instance
  └─ emits TestChanged
       └─ AbstractTester listens, re-emits as:
            ├─ onTestStarted
            ├─ onTestUpdated
            ├─ onSuccess
            └─ onFailure
                 └─ AbstractTestSuite listens, aggregates counts, re-emits
                      └─ TestSuitePlugin listens, provides public API
```

## Execution Patterns

| Pattern                         | When to Use                        | Example                               |
| ------------------------------- | ---------------------------------- | ------------------------------------- |
| `Promise.all()` (parallel)      | Independent tests, no shared state | `suite-config`, `suite-ui`            |
| Mixed parallel + sequential     | Some tests modify map state        | `suite-layer`                         |
| Sequential `await`              | All tests modify shared state      | `suite-map-varia`, `suite-map-config` |
| `onCanExecuteTestSuite()` guard | Suite requires specific plugin     | `suite-geochart`, `suite-details`     |

## Key Design Decisions

- **In-browser execution**: Tests run in the actual viewer with real OpenLayers rendering — not in a headless test runner
- **Custom framework**: No dependency on Jest/Vitest/Mocha — the `Test` class provides its own assertion API
- **`generateId()` for layer IDs**: Prevents conflicts between parallel tests adding layers
- **Instance helpers vs static helpers**: Instance methods (e.g., `this.helperStepAddLayerOnMap()`) use `this.getMapViewer()` internally. Static methods (e.g., `LayerTester.helperStepAssertLayerExists()`) require explicit `mapId` parameter

## Test Execution Patterns

### Regular Test Pattern

```typescript
protected test<T>(
  message: string,
  callback: (test: Test<T>) => Promise<T>,
  callbackAssert?: (test: Test<T>) => T,
  callbackFinalize?: (test: Test<T>) => void
): Promise<Test<T>> {
  // 1. Create test instance
  const test = new Test<T>(message);
  test.setType('regular');

  // 2. Emit started event
  this.#emitTestStarted(test);

  // 3. Execute test
  test.setStatus('running');
  try {
    // Run callback
    const result = await callback(test);
    test.setResult(result);

    // Run assertions
    if (callbackAssert) {
      callbackAssert(test);
    }

    // Mark success
    test.setStatus('passed');
    this.#emitSuccess(test);
  } catch (error) {
    // Mark failure
    test.setError(error);
    test.setStatus('failed');
    this.#emitFailure(test);
  } finally {
    // Always run cleanup
    if (callbackFinalize) {
      callbackFinalize(test);
    }
  }

  return test;
}
```

### Error Test Pattern

```typescript
protected testError<T extends Error>(
  message: string,
  errorClass: ClassType<T>,
  callback: (test: Test<T>) => Promise<void>,
  callbackAssert?: (test: Test<T>) => T,
  callbackFinalize?: (test: Test<T>) => void
): Promise<Test<T>> {
  const test = new Test<T>(message);
  test.setType('true-negative');

  this.#emitTestStarted(test);

  test.setStatus('running');
  try {
    // Run callback (should throw error)
    await callback(test);

    // If we get here, no error was thrown (FAIL)
    throw new AssertionNoErrorThrownError(errorClass);
  } catch (error) {
    // Check if error is expected type
    if (!(error instanceof errorClass)) {
      // Wrong error type (FAIL)
      throw new AssertionWrongErrorInstanceError(error, errorClass);
    }

    // Correct error thrown (PASS)
    test.setError(error);

    // Run assertions on error
    if (callbackAssert) {
      callbackAssert(test);
    }

    test.setStatus('passed');
    this.#emitSuccess(test);
  } finally {
    if (callbackFinalize) {
      callbackFinalize(test);
    }
  }

  return test;
}
```

## Assertion Architecture

### Assertion Method Design

All assertion methods are **static** on the `Test` class:

```typescript
class Test<T> {
  static assertIsDefined(value: unknown): void {
    if (value === undefined) {
      throw new AssertionUndefinedError();
    }
  }

  static assertIsEqual(actual: unknown, expected: unknown): void {
    if (actual !== expected) {
      throw new AssertionValueError(actual, expected);
    }
  }

  // ... more assertions
}
```

**Why Static?**

- No test instance needed
- Can be called from any context
- Clear namespace (`Test.assert...`)
- Throws errors that tests catch

### Assertion Error Design

```typescript
class TestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

class AssertionValueError extends TestError {
  constructor(
    public actualValue: unknown,
    public expectedValue: unknown,
  ) {
    super(
      `Expected value to equal "${expectedValue}" but got "${actualValue}"`,
    );
  }
}
```

**Design Benefits**:

- Structured error information
- Type-safe error handling
- Clear error messages
- Easy to catch specific error types

## Helper Pattern

### Reusable Helper Methods

```typescript
class LayerTester extends GVAbstractTester {
  // Shared helper - used by multiple tests
  protected static async helperStepAddLayerOnMap(
    test: Test,
    mapViewer: MapViewer,
    config: TypeGeoviewLayerConfig,
  ): Promise<GeoViewLayerAddedResult> {
    test.addStep("Adding layer to the map...");

    // Wait for layer added event
    const addedPromise = new Promise<GeoViewLayerAddedResult>((resolve) => {
      mapViewer.layer.onLayerAdded((payload) => {
        resolve(payload);
      });
    });

    // Add the layer
    mapViewer.layer.addGeoviewLayer(config);

    // Wait for completion
    const result = await addedPromise;
    test.addStep(`Layer added: ${result.layerPath}`);

    return result;
  }
}
```

**Benefits**:

- Code reuse across tests
- Consistent behavior
- Centralized logic
- Easy to maintain

## Configuration System

### Configuration Schema

```typescript
interface TestSuiteConfig {
  suites: string[];
}
```

### Configuration Processing

```typescript
class TestSuitePlugin {
  #config: TestSuiteConfig;
  #suites: { [key: string]: typeof AbstractTestSuite };
  #testSuites: { [key: string]: AbstractTestSuite } = {};

  constructor(config: TestSuiteConfig) {
    this.#config = config;

    // Map suite names to classes
    this.#suites = {
      "suite-config": GVTestSuiteConfig,
      "suite-map": GVTestSuiteMapVaria,
      "suite-layer": GVTestSuiteLayer,
      "suite-geochart": GVTestSuiteGeochart,
    };

    // Instantiate configured suites
    this.#initializeSuites();
  }

  #initializeSuites(): void {
    for (const suiteName of this.#config.suites) {
      const SuiteClass = this.#suites[suiteName];
      if (SuiteClass) {
        const suite = new SuiteClass(this.api, this.mapViewer);
        this.#testSuites[suiteName] = suite;

        // Set up event forwarding
        this.#setupSuiteEvents(suite);
      }
    }
  }
}
```

## Extension Points

### Creating Custom Suites

```typescript
// 1. Create Tester
class MyTester extends GVAbstractTester {
  override getName() { return 'MyTester'; }

  testMyFeature(): Promise<Test<Result>> {
    return this.test(...);
  }
}

// 2. Create Suite
class MySuite extends GVAbstractTestSuite {
  #myTester: MyTester;

  constructor(api: API, mapViewer: MapViewer) {
    super(api, mapViewer);
    this.#myTester = new MyTester(api, mapViewer);
    this.addTester(this.#myTester);
  }

  override getName() { return 'My Suite'; }
  override getDescriptionAsHtml() { return 'My custom suite'; }

  protected override onLaunchTestSuite() {
    return Promise.all([
      this.#myTester.testMyFeature()
    ]);
  }
}

// 3. Register
// In index.tsx:
#suites = {
  // ... existing suites
  'suite-my-custom': MySuite
};
```

### Custom Assertions

```typescript
// Extend Test class with custom assertion
class Test {
  // ... existing assertions

  static assertIsValidUrl(url: string): void {
    try {
      new URL(url);
    } catch {
      throw new TestError(`Invalid URL: ${url}`);
    }
  }

  static assertArrayNotEmpty<T>(array: T[]): void {
    if (array.length === 0) {
      throw new TestError("Array is empty");
    }
  }
}
```

## Performance Considerations

### Sequential vs Parallel

**Current Design: Sequential**

```typescript
async launchTestSuites() {
  for (const suite of suites) {
    await suite.launchTestSuite();  // Wait for each
  }
}
```

**Why Not Parallel?**

- Tests may modify shared map state
- Layer operations can conflict
- Harder to debug concurrent failures
- Clearer progress tracking

**Trade-off**: Longer execution time for predictability

### Memory Management

Tests clean up resources:

```typescript
testMyLayer() {
  let layerId: string;

  return this.test(
    'Test',
    async (test) => {
      layerId = createLayer();
      // ... test logic
    },
    (test) => {
      // assertions
    },
    (test) => {
      // Always runs, even on failure
      if (layerId) {
        removeLayer(layerId);
      }
    }
  );
}
```

## Debugging Architecture

### Debug Mode Pattern

```typescript
protected override onLaunchTestSuite() {
  // Uncomment for debugging
  // return Promise.all([
  //   this.#tester.testSpecificIssue()
  // ]);

  // Full test suite
  return Promise.all([
    this.#tester.test1(),
    this.#tester.test2(),
    // ... all tests
  ]);
}
```

### Console API

```typescript
// Access from browser console
const plugin = cgpv.api.maps["mapId"].corePackages["test-suite"];
const suite = plugin.getTestSuite("suite-config");

console.log("Total:", suite.getTotalTests());
console.log("Failed:", suite.getFailedTests());
```

## Design Patterns Used

### 1. Template Method Pattern

`AbstractTestSuite` defines skeleton:

```typescript
async launchTestSuite() {
  this.#beforeLaunch();
  await this.onLaunchTestSuite();  // Subclass implements
  this.#afterLaunch();
}
```

### 2. Observer Pattern

Event system for state changes:

```typescript
test.onStatusChanged((event) => {
  // React to status changes
});
```

### 3. Strategy Pattern

Different test execution strategies:

- `test()` - Regular test
- `testError()` - Error test

### 4. Factory Pattern

Test creation:

```typescript
test<T>(...): Promise<Test<T>> {
  const test = new Test<T>(message);
  // Configure and return
}
```

## Architecture Benefits

### 1. Maintainability

- Clear component boundaries
- Single responsibility per class
- Easy to locate functionality

### 2. Extensibility

- New suites easy to add
- Custom assertions straightforward
- Plugin architecture supports growth

### 3. Testability

- Components independently testable
- Mock-friendly design
- Clear dependencies

### 4. Debuggability

- Sequential execution
- Detailed step tracking
- Comprehensive events

### 5. Reusability

- Helper methods shared across tests
- Abstract base classes provide common logic
- Consistent patterns across codebase

## Related Documentation

- [Creating Custom Tests](app/testing/creating-tests.md) - Practical development guide
- [API Reference](app/testing/api-reference.md) - Complete API documentation
- [Using the Test Suite](app/testing/using-test-suite.md) - User guide
