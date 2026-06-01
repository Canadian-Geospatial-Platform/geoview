# Using the Test Suite

## Configuration

Add the test-suite package to your GeoView map configuration:

```json
{
  "map": {
    "interaction": "dynamic",
    "viewSettings": { "projection": 3978 }
  },
  "corePackages": ["test-suite"],
  "corePackagesConfig": [
    {
      "test-suite": {
        "suites": ["suite-config", "suite-layer"]
      }
    }
  ]
}
```

### Available Suites

| Suite ID           | Description                                       |
| ------------------ | ------------------------------------------------- |
| `suite-core`       | Date/utility function tests                       |
| `suite-config`     | Layer configuration validation                    |
| `suite-map`        | Map zoom, projection, basemap, UI                 |
| `suite-layer`      | Layer add/remove, legend, queries                 |
| `suite-map-config` | Map config creation/destruction                   |
| `suite-geochart`   | Geochart plugin (requires geochart in footer bar) |
| `suite-details`    | Details panel (requires details in footer bar)    |
| `suite-ui`         | DOM-level UI tests                                |

### HTML Configuration

Tests are triggered from HTML pages. Each map div specifies which suites to run:

```html
<div
  id="mapTest"
  class="geoviewMap"
  data-lang="en"
  data-config="{
    'map': { 'viewSettings': { 'projection': 3978 } },
    'corePackages': ['test-suite'],
    'corePackagesConfig': [{ 'test-suite': { 'suites': ['suite-layer'] } }]
  }"
></div>
```

## Understanding Results

### Test Status

Each test transitions through these statuses:

| Status      | Meaning                                 |
| ----------- | --------------------------------------- |
| `new`       | Test created but not yet started        |
| `running`   | Test callback is executing              |
| `verifying` | Assertions are running                  |
| `success`   | All assertions passed                   |
| `failed`    | An error was thrown or assertion failed |

### Test Output

Tests log granular steps during execution:

```
Test Adding Esri Dynamic layer on map...
  ✓ Creating the GeoView Layer Configuration...
  ✓ Adding layer to the map...
  ✓ Waiting for layer to be ready...
  ✓ Verifying layer exists at path...
  ✓ Removing layer from map...
  ✓ Test completed successfully
```

### Regular Tests vs Error Tests

**Regular tests** (true positives) verify expected behavior:

```
Test Adding Esri Dynamic layer  →  ✓ success
```

**Error tests** (true negatives) verify that errors are properly thrown:

```
Test Adding Esri Dynamic with bad url  →  ✓ success (expected error was thrown)
```

An error test **fails** if the expected error is NOT thrown — meaning the system failed to detect an invalid state.

### Common Assertion Errors

| Error Type                    | Meaning                                   |
| ----------------------------- | ----------------------------------------- |
| `AssertionValueError`         | Actual value doesn't match expected       |
| `AssertionUndefinedError`     | Expected a value but got `undefined`      |
| `AssertionWrongInstanceError` | Object is wrong type/class                |
| `AssertionJSONObjectError`    | Object structure mismatch                 |
| `AssertionNoErrorThrownError` | Error test: expected error was not thrown |

## Monitoring with Events

The plugin emits events you can subscribe to:

```javascript
// Events: onTestStarted, onTestUpdated, onSuccess, onFailure
testSuitePlugin.onSuccess((sender, event) => {
  console.log("Test passed:", event.test.getTitle());
});

testSuitePlugin.onFailure((sender, event) => {
  console.error("Test failed:", event.test.getTitle(), event.test.getError());
});
```

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
