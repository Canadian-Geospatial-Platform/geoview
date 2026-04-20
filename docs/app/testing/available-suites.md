# Available Test Suites

This content has been consolidated into the [Test Suite README](./README.md#available-suites).

See also:

- [Using the Test Suite](./using-test-suite.md) — Configuration and running tests
- [Creating Custom Tests](./creating-tests.md) — Adding new suites and testers

## suite-geochart: Geochart Test Suite

**Purpose**: Tests the geochart component functionality.

**Description**: Validates geochart creation, data binding, chart operations, and interaction with map layers.

### What It Tests

#### Chart Creation

- ✓ Creating geochart instances
- ✓ Binding data to charts
- ✓ Chart type configuration

#### Chart Operations

- ✓ Data updates
- ✓ Chart interactions
- ✓ Chart state management
- ✓ Chart visibility

#### Layer Integration

- ✓ Linking charts to map layers
- ✓ Feature selection synchronization
- ✓ Data filtering coordination

### Example Tests

```
✓ Test Creating geochart
✓ Test Geochart data binding
✓ Test Geochart layer interaction
✓ Test Geochart updates
```

### Typical Duration

Approximately 2-3 minutes

## Choosing Test Suites

### For Quick Validation

Run map and config suites only:

```json
{
  "test-suite": {
    "suites": ["suite-map", "suite-config"]
  }
}
```

### For Layer Development

Run layer and config suites:

```json
{
  "test-suite": {
    "suites": ["suite-config", "suite-layer"]
  }
}
```

### For Component Development

Run specific component suites:

```json
{
  "test-suite": {
    "suites": ["suite-geochart"]
  }
}
```

### For Comprehensive Testing

Run all suites (recommended for CI/CD):

```json
{
  "test-suite": {
    "suites": ["suite-config", "suite-map", "suite-layer", "suite-geochart"]
  }
}
```

## Test Output Examples

### Successful Test

```
Test Adding Esri Dynamic Histo Flood Events on map
  ✓ Result: Green checkmark
  Steps:
  • Creating the GeoView Layer Configuration...
  • Adding layer to the map...
  • Waiting for layer to be ready...
  • Layer is ready
  • Performing assertions...
  • Assertion passed: Layer exists at expected path
  • Removing layer from map...
  • Cleanup completed
```

### Expected Error Test (True Negative)

```
Test Adding Esri Dynamic with bad url (Expected Error)
  ✓ Result: Green checkmark
  Steps:
  • Creating the GeoView Layer Configuration...
  • Adding layer to the map...
  • Waiting for expected error...
  • Expected error thrown: LayerServiceMetadataUnableToFetchError
  • Assertion passed: Correct error type
```

### Failed Test

```
Test Adding Custom Layer
  ✗ Result: Red X
  Steps:
  • Creating the GeoView Layer Configuration...
  • Adding layer to the map...
  • Error occurred: Layer configuration invalid

  Error Details:
    AssertionError: Expected layer to be defined but got undefined
      at layerPath: customLayer/0
```

## Suite Dependencies

### External Services

Many tests depend on external services being available:

- Esri ArcGIS services
- OGC WMS/WFS services
- Public GeoJSON/CSV data sources

**Note**: Tests may fail if external services are unavailable or have changed.

### Network Requirements

- Active internet connection required
- Firewall must allow outbound HTTPS requests
- Some services may have rate limiting

## Next Steps

- Learn how to [use the test suite](app/testing/using-test-suite.md)
- Understand [test results](app/testing/understanding-results.md)
- Create [custom test suites](app/testing/creating-tests.md) for your needs
