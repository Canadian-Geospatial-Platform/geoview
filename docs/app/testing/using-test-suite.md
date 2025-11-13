# Using the Test Suite

The GeoView Test Suite allows you to run automated tests within your GeoView application to verify functionality and catch issues early.

## Configuration

### Adding the Test Suite Package

To enable the test suite in your GeoView map, add it to the `corePackages` array and configure which suites to run:

```json
{
  "map": {
    "interaction": "dynamic",
    "viewSettings": {
      "projection": 3978
    }
  },
  "corePackages": ["test-suite"],
  "corePackagesConfig": [
    {
      "test-suite": {
        "suites": ["suite-config", "suite-map"]
      }
    }
  ]
}
```

### Configuration Options

#### suites (Required)

An array of test suite identifiers to run. Available values:

- `"suite-config"`: Tests layer configuration validation
- `"suite-map"`: Tests map functionality (state, zoom, projection)
- `"suite-layer"`: Tests layer addition, removal, and behavior
- `"suite-geochart"`: Tests geochart component functionality

**Example - Running all available suites:**

```json
{
  "test-suite": {
    "suites": ["suite-config", "suite-map", "suite-layer", "suite-geochart"]
  }
}
```

**Example - Running only configuration tests:**

```json
{
  "test-suite": {
    "suites": ["suite-config"]
  }
}
```

## Running Tests

### Automatic Execution

When configured, the test suite will be available in your GeoView map. Tests can be triggered:

- Programmatically via the GeoView API
- Through the test suite UI component (if enabled)
- During map initialization (depending on configuration)

### Programmatic Execution

Access the test suite through the GeoView API:

```javascript
// Get the test suite plugin instance
const testSuitePlugin = cgpv.api.maps["mapId"].corePackages["test-suite"];

// Launch all configured test suites
await testSuitePlugin.launchTestSuites();

// Reset test suites to initial state
testSuitePlugin.resetTestSuites();
```

## Monitoring Test Progress

### Using Events

Subscribe to test events to monitor execution:

```javascript
const testSuitePlugin = cgpv.api.maps["mapId"].corePackages["test-suite"];

// Listen for test started
testSuitePlugin.onTestStarted((event) => {
  console.log("Test started:", event.testId, event.testName);
});

// Listen for test updates (steps)
testSuitePlugin.onTestUpdated((event) => {
  console.log("Test step:", event.step);
});

// Listen for test success
testSuitePlugin.onSuccess((event) => {
  console.log("Test passed:", event.testId);
});

// Listen for test failure
testSuitePlugin.onFailure((event) => {
  console.error("Test failed:", event.testId, event.error);
});
```

### Event Payload

#### onTestStarted

```typescript
{
  testId: string; // Unique test identifier
  testName: string; // Human-readable test name
  testerName: string; // Name of the tester running the test
  suiteName: string; // Name of the test suite
}
```

#### onTestUpdated

```typescript
{
  testId: string;
  step: string; // Description of the current step
}
```

#### onSuccess

```typescript
{
  testId: string;
  testName: string;
  result: any; // The assertion result (varies by test)
}
```

#### onFailure

```typescript
{
  testId: string;
  testName: string;
  error: Error;          // The error that caused failure
  steps: string[];       // All steps completed before failure
}
```

## Understanding Test Output

### Test Status

Each test can have one of the following statuses:

- **new**: Test created but not started
- **running**: Test is currently executing
- **passed**: Test completed successfully
- **failed**: Test failed with an error
- **skipped**: Test was skipped (e.g., due to precondition failure)

### Test Steps

Tests report granular steps during execution:

```
Test: Adding Esri Dynamic layer...
  ✓ Creating the GeoView Layer Configuration...
  ✓ Adding layer to the map...
  ✓ Waiting for layer to be ready...
  ✓ Verifying layer exists at path...
  ✓ Assertion passed
  ✓ Removing layer from map...
  ✓ Test completed successfully
```

### Test Types

#### Regular Tests (True Positives)

Tests that verify expected successful behavior:

```
Test Adding Esri Dynamic layer
  ✓ Result: Green checkmark
```

#### Error Tests (True Negatives)

Tests that verify expected failures:

```
Test Adding Esri Dynamic with bad URL (Expected error thrown)
  ✓ Result: Green checkmark
```

These tests verify that the system properly handles and reports error conditions.

## Best Practices

### Test Execution Order

Tests run sequentially in the order defined by each test suite. This ensures:

- Predictable test state
- No race conditions
- Proper cleanup between tests

### Performance Considerations

- Running all test suites can take several minutes
- Each suite includes multiple tests with network requests
- Consider running specific suites during development
- Run all suites in CI/CD pipelines for comprehensive validation

### Development Workflow

1. **During Development**: Run specific test suites related to your changes
2. **Before Commit**: Run all relevant test suites
3. **In CI/CD**: Run all test suites on every build

## Troubleshooting

### Tests Not Running

**Issue**: Tests don't execute after configuration

- Verify `corePackages` includes `"test-suite"`
- Check `corePackagesConfig` has correct suite names
- Ensure suite names are valid (see [Available Test Suites](app/testing/available-suites.md))

### Tests Failing Unexpectedly

**Issue**: Tests that previously passed are now failing

- Check network connectivity (many tests use external services)
- Verify service URLs are still accessible
- Review test output for specific error messages
- Check if layer services have changed (metadata, structure)

### Slow Test Execution

**Issue**: Tests take too long to complete

- Normal behavior - comprehensive tests involve network requests
- Consider running specific suites instead of all suites
- Check network speed and service response times

## Example Configurations

### Minimal Configuration

Run only config validation tests:

```json
{
  "corePackages": ["test-suite"],
  "corePackagesConfig": [
    {
      "test-suite": {
        "suites": ["suite-config"]
      }
    }
  ]
}
```

### Full Test Coverage

Run all available test suites:

```json
{
  "corePackages": ["test-suite"],
  "corePackagesConfig": [
    {
      "test-suite": {
        "suites": ["suite-config", "suite-map", "suite-layer", "suite-geochart"]
      }
    }
  ]
}
```

### With Other Packages

Combine test suite with other core packages:

```json
{
  "corePackages": ["test-suite", "swiper"],
  "corePackagesConfig": [
    {
      "test-suite": {
        "suites": ["suite-map", "suite-layer"]
      }
    }
  ]
}
```

## Next Steps

- Learn about [Available Test Suites](app/testing/available-suites.md)
- Understand [Test Results](app/testing/understanding-results.md)
- Create [Custom Tests](app/testing/creating-tests.md) for your use cases
