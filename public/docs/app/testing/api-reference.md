# Test Suite API Reference

Complete API documentation for the GeoView Test Suite framework.

## Core Classes

### TestSuitePlugin

**Location**: `packages/geoview-test-suite/src/index.tsx`

Main plugin class that manages test suites.

#### Constructor

```typescript
constructor(
  config: TestSuiteConfig,
  api: API,
  mapViewer: MapViewer
)
```

**Parameters**:

- `config`: Plugin configuration with suite names
- `api`: GeoView API instance
- `mapViewer`: Map viewer instance

#### Methods

##### addTestSuite()

```typescript
addTestSuite(suite: AbstractTestSuite): void
```

Registers a test suite with the plugin.

**Parameters**:

- `suite`: Test suite instance to add

##### launchTestSuites()

```typescript
async launchTestSuites(): Promise<void>
```

Executes all registered test suites sequentially.

**Returns**: Promise that resolves when all suites complete

##### resetTestSuites()

```typescript
resetTestSuites(): void
```

Resets all test suites to initial state.

#### Event Methods

##### onTestStarted()

```typescript
onTestStarted(callback: (event: TestChangedEvent) => void): void
```

Registers callback for test started events.

**Parameters**:

- `callback`: Function called when test starts

**Event Payload**:

```typescript
{
  testId: string;
  testName: string;
  testerName: string;
  suiteName: string;
}
```

##### onTestUpdated()

```typescript
onTestUpdated(callback: (event: TestChangedEvent) => void): void
```

Registers callback for test step updates.

**Parameters**:

- `callback`: Function called when test adds step

**Event Payload**:

```typescript
{
  testId: string;
  step: string;
}
```

##### onSuccess()

```typescript
onSuccess(callback: (event: TestChangedEvent) => void): void
```

Registers callback for test success events.

**Parameters**:

- `callback`: Function called when test passes

**Event Payload**:

```typescript
{
  testId: string;
  testName: string;
  result: any;
}
```

##### onFailure()

```typescript
onFailure(callback: (event: TestChangedEvent) => void): void
```

Registers callback for test failure events.

**Parameters**:

- `callback`: Function called when test fails

**Event Payload**:

```typescript
{
  testId: string;
  testName: string;
  error: Error;
  steps: string[];
}
```

---

### AbstractTestSuite

**Location**: `packages/geoview-test-suite/src/tests/core/abstract-test-suite.ts`

Abstract base class for all test suites.

#### Constructor

```typescript
constructor(
  api: API,
  mapViewer: MapViewer
)
```

#### Abstract Methods (Must Implement)

##### getName()

```typescript
abstract getName(): string
```

Returns the name of the test suite.

##### getDescriptionAsHtml()

```typescript
abstract getDescriptionAsHtml(): string
```

Returns HTML description of the test suite.

##### onLaunchTestSuite()

```typescript
protected abstract onLaunchTestSuite(): Promise<unknown>
```

Executes the test suite's tests. Return a promise that resolves when all tests complete.

#### Methods

##### addTester()

```typescript
protected addTester(tester: AbstractTester): void
```

Adds a tester to the test suite.

##### getTesters()

```typescript
protected getTesters(): AbstractTester[]
```

Returns array of registered testers.

##### getTotalTests()

```typescript
getTotalTests(): number
```

Returns total number of tests across all testers.

##### getCompletedTests()

```typescript
getCompletedTests(): number
```

Returns number of completed tests.

##### getFailedTests()

```typescript
getFailedTests(): number
```

Returns number of failed tests.

##### getSuccessfulTests()

```typescript
getSuccessfulTests(): number
```

Returns number of successful tests.

##### launchTestSuite()

```typescript
async launchTestSuite(): Promise<unknown>
```

Launches the test suite. Calls `onLaunchTestSuite()`.

##### resetTestSuite()

```typescript
resetTestSuite(): void
```

Resets all testers to initial state.

---

### AbstractTester

**Location**: `packages/geoview-test-suite/src/tests/core/abstract-tester.ts`

Abstract base class for all testers.

#### Constructor

```typescript
constructor(
  api: API,
  mapViewer: MapViewer
)
```

#### Abstract Methods (Must Implement)

##### getName()

```typescript
abstract getName(): string
```

Returns the name of the tester.

#### Protected Methods

##### test()

```typescript
protected test<T>(
  message: string,
  callback: (test: Test<T>) => Promise<T>,
  callbackAssert?: (test: Test<T>) => T,
  callbackFinalize?: (test: Test<T>) => void
): Promise<Test<T>>
```

Executes a regular test (true positive).

**Parameters**:

- `message`: Test description shown to users
- `callback`: Async function that executes the test, returns result
- `callbackAssert`: Optional function to perform assertions on result
- `callbackFinalize`: Optional cleanup function (always runs)

**Returns**: Promise resolving to Test instance

**Example**:

```typescript
testSomething(): Promise<Test<ResultType>> {
  return this.test(
    'Test description',
    async (test) => {
      test.addStep('Doing something...');
      const result = await doSomething();
      return result;
    },
    (test) => {
      const result = test.getResult();
      Test.assertIsDefined(result);
      return result!;
    },
    (test) => {
      cleanup();
    }
  );
}
```

##### testError()

```typescript
protected testError<T extends Error>(
  message: string,
  errorClass: ClassType<T>,
  callback: (test: Test<T>) => Promise<void>,
  callbackAssert?: (test: Test<T>) => T,
  callbackFinalize?: (test: Test<T>) => void
): Promise<Test<T>>
```

Executes an error test (true negative). Test **passes** if expected error is thrown.

**Parameters**:

- `message`: Test description
- `errorClass`: Expected error class to be thrown
- `callback`: Function that should throw the error
- `callbackAssert`: Optional assertions on the error
- `callbackFinalize`: Optional cleanup function

**Returns**: Promise resolving to Test instance

**Example**:

```typescript
testError(): Promise<Test<MyError>> {
  return this.testError(
    'Test error handling',
    MyError,
    async (test) => {
      test.addStep('Attempting bad operation...');
      await operationThatShouldFail();
    },
    (test) => {
      const error = test.getError();
      Test.assertIsDefined(error);
      return error as MyError;
    }
  );
}
```

##### getAPI()

```typescript
protected getAPI(): API
```

Returns the GeoView API instance.

##### getMapViewer()

```typescript
protected getMapViewer(): MapViewer
```

Returns the map viewer instance.

#### Public Methods

##### getTotalTests()

```typescript
getTotalTests(): number
```

Returns total number of tests in this tester.

##### getCompletedTests()

```typescript
getCompletedTests(): number
```

Returns number of completed tests.

##### getFailedTests()

```typescript
getFailedTests(): number
```

Returns number of failed tests.

##### getSuccessfulTests()

```typescript
getSuccessfulTests(): number
```

Returns number of successful tests.

##### reset()

```typescript
reset(): void
```

Resets tester to initial state.

#### Event Methods

Same as TestSuitePlugin: `onTestStarted`, `onTestUpdated`, `onSuccess`, `onFailure`

---

### Test<T>

**Location**: `packages/geoview-test-suite/src/tests/core/test.ts`

Represents a single test instance.

#### Constructor

```typescript
constructor(title: string)
```

#### Properties

##### id

```typescript
readonly id: string
```

Unique test identifier (auto-generated).

#### Methods

##### getTitle()

```typescript
getTitle(): string
```

Returns the test title.

##### setTitle()

```typescript
setTitle(title: string): void
```

Sets the test title.

##### getType()

```typescript
getType(): TestType
```

Returns test type: `'regular'` or `'true-negative'`.

##### setType()

```typescript
setType(type: TestType): void
```

Sets the test type.

##### getStatus()

```typescript
getStatus(): TestStatus
```

Returns current status: `'new'` | `'running'` | `'passed'` | `'failed'` | `'skipped'`.

##### setStatus()

```typescript
setStatus(status: TestStatus): void
```

Sets the test status.

##### getSteps()

```typescript
getSteps(): TestStep[]
```

Returns array of test steps.

##### addStep()

```typescript
addStep(
  step: string,
  level?: TestStepLevel,
  color?: string
): void
```

Adds a step to the test.

**Parameters**:

- `step`: Step description
- `level`: `'major'` or `'regular'` (default: `'regular'`)
- `color`: CSS color for display (default: `'black'`)

##### getStepsAsHtml()

```typescript
getStepsAsHtml(): string
```

Returns steps formatted as HTML list.

##### getResult()

```typescript
getResult(): T | undefined
```

Returns the test result (set by callback return value).

##### setResult()

```typescript
setResult(result: T): void
```

Sets the test result.

##### getError()

```typescript
getError(): Error | undefined
```

Returns the error if test failed.

##### setError()

```typescript
setError(error: Error): void
```

Sets the test error.

#### Static Assertion Methods

##### assertIsDefined()

```typescript
static assertIsDefined(value: unknown): void
```

Asserts value is not undefined.

**Throws**: `AssertionUndefinedError`

##### assertIsUndefined()

```typescript
static assertIsUndefined(value: unknown): void
```

Asserts value is undefined.

**Throws**: `AssertionDefinedError`

##### assertIsEqual()

```typescript
static assertIsEqual(
  actual: unknown,
  expected: unknown
): void
```

Asserts values are strictly equal (===).

**Throws**: `AssertionValueError`

##### assertIsNotEqual()

```typescript
static assertIsNotEqual(
  actual: unknown,
  expected: unknown
): void
```

Asserts values are not strictly equal (!==).

**Throws**: `AssertionValueError`

##### assertIsInstanceOf()

```typescript
static assertIsInstanceOf(
  value: unknown,
  expectedClass: ClassType
): void
```

Asserts value is instance of expected class.

**Throws**: `AssertionWrongInstanceError`

##### assertIsArrayLength()

```typescript
static assertIsArrayLength(
  array: unknown[] | undefined,
  expectedLength: number
): void
```

Asserts array has exact length.

**Throws**: `AssertionArrayLengthError`

##### assertIsArrayLengthMinimal()

```typescript
static assertIsArrayLengthMinimal(
  array: unknown[] | undefined,
  expectedMinimumLength: number
): void
```

Asserts array has at least minimum length.

**Throws**: `AssertionArrayLengthMinimalError`

##### assertArrayIncludes()

```typescript
static assertArrayIncludes<T>(
  array: T[],
  expectedValue: T
): void
```

Asserts array includes expected value.

**Throws**: `AssertionArrayIncludingError`

##### assertArrayExcludes()

```typescript
static assertArrayExcludes<T>(
  array: T[],
  unexpectedValue: T
): void
```

Asserts array does not include unexpected value.

**Throws**: `AssertionArrayExcludingError`

##### assertJsonObject()

```typescript
static assertJsonObject(
  actualObject: unknown,
  expectedObject: unknown
): void
```

Asserts actual object contains at least all properties and values from expected object. Performs deep recursive comparison.

**Rules**:

- All properties in expected must exist in actual
- Values must match exactly
- Nested objects recursively validated
- Extra properties in actual are allowed

**Throws**: `AssertionJSONObjectError` with mismatch details

**Example**:

```typescript
const actual = {
  user: { name: "Alice", age: 30 },
  active: true,
};

const expected = {
  user: { name: "Alice" }, // age not required
  active: true,
};

Test.assertJsonObject(actual, expected); // Passes
```

---

### TestStep

**Location**: `packages/geoview-test-suite/src/tests/core/test-step.ts`

Represents a test step.

#### Constructor

```typescript
constructor(
  message: string,
  level: TestStepLevel = 'regular',
  color: string = 'black'
)
```

#### Properties

##### message

```typescript
readonly message: string
```

Step description.

##### level

```typescript
readonly level: TestStepLevel
```

Step level: `'major'` or `'regular'`.

##### color

```typescript
readonly color: string
```

CSS color for display.

---

## Helper Classes

### LayerTester Helpers

**Location**: `packages/geoview-test-suite/src/tests/testers/layer-tester.ts`

Static helper methods for layer testing.

#### helperStepAddLayerOnMap()

```typescript
static async helperStepAddLayerOnMap(
  test: Test,
  mapViewer: MapViewer,
  config: TypeGeoviewLayerConfig
): Promise<GeoViewLayerAddedResult>
```

Adds layer to map and waits for added event.

**Parameters**:

- `test`: Test instance for adding steps
- `mapViewer`: Map viewer instance
- `config`: Layer configuration

**Returns**: Promise resolving to layer added result

#### helperStepCheckLayerAtLayerPath()

```typescript
static async helperStepCheckLayerAtLayerPath(
  test: Test,
  mapViewer: MapViewer,
  layerPath: string
): Promise<AbstractGVLayer>
```

Checks if layer exists at path and waits until ready.

**Parameters**:

- `test`: Test instance
- `mapViewer`: Map viewer instance
- `layerPath`: Layer path (e.g., "layerId/0")

**Returns**: Promise resolving to layer instance

#### helperStepAssertLayerExists()

```typescript
static helperStepAssertLayerExists(
  test: Test,
  mapViewer: MapViewer,
  layerPath: string
): AbstractGVLayer
```

Asserts layer exists at path and returns it.

**Parameters**:

- `test`: Test instance
- `mapViewer`: Map viewer instance
- `layerPath`: Layer path

**Returns**: Layer instance

**Throws**: Assertion error if layer not found

#### helperFinalizeStepRemoveLayerAndAssert()

```typescript
static helperFinalizeStepRemoveLayerAndAssert(
  test: Test,
  mapViewer: MapViewer,
  layerPath: string
): void
```

Removes layer and asserts successful removal.

**Parameters**:

- `test`: Test instance
- `mapViewer`: Map viewer instance
- `layerPath`: Layer path

---

## Type Definitions

### TestType

```typescript
type TestType = "regular" | "true-negative";
```

### TestStatus

```typescript
type TestStatus = "new" | "running" | "passed" | "failed" | "skipped";
```

### TestStepLevel

```typescript
type TestStepLevel = "major" | "regular";
```

### ClassType

```typescript
type ClassType<T = unknown> = new (...args: any[]) => T;
```

### TestChangedEvent

```typescript
interface TestChangedEvent {
  test?: Test;
  testId?: string;
  testName?: string;
  testerName?: string;
  suiteName?: string;
  status?: TestStatus;
  step?: string;
  error?: Error;
}
```

### TestChangedDelegate

```typescript
type TestChangedDelegate = EventDelegateBase<
  AbstractTester,
  TestChangedEvent,
  void
>;
```

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
      }
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
