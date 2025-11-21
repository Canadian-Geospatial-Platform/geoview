# Available Test Suites

This document describes the built-in test suites available in the GeoView Test Suite package.

## Overview

The GeoView Test Suite includes four comprehensive test suites:

1. **Config Test Suite** (`suite-config`) - Layer configuration validation
2. **Map Test Suite** (`suite-map`) - Map functionality testing
3. **Layer Test Suite** (`suite-layer`) - Layer operations testing
4. **Geochart Test Suite** (`suite-geochart`) - Geochart component testing

## suite-config: Config Test Suite

**Purpose**: Validates layer configuration creation and initialization for all supported layer types.

**Description**: Tests various layer config related functionality, ensuring that layer configurations are properly created, validated, and initialized.

### What It Tests

#### Esri Dynamic Layers

- ✓ Configuration with Historical Flood Events data
- ✓ Configuration with CESI (Canadian Environmental Sustainability Indicators)
- ✓ Error handling for invalid/unreachable URLs

#### Esri Feature Layers

- ✓ Configuration with Toronto Neighbourhoods data
- ✓ Configuration with Historical Flood Events
- ✓ Configuration with Forest Industry data
- ✓ Error handling for invalid URLs

#### Esri Image Layers

- ✓ Configuration with Elevation data
- ✓ Error handling for invalid URLs

#### WMS (Web Map Service) Layers

- ✓ Configuration with OWS Mundialis service
- ✓ Configuration with Datacube MSI service
- ✓ Error handling for invalid URLs
- ✓ Error handling for valid URL but no capabilities

#### WFS (Web Feature Service) Layers

- ✓ Configuration with Current Conditions data
- ✓ Error handling for invalid URLs
- ✓ Error handling for valid URL without capabilities

#### GeoJSON Layers

- ✓ Configuration with polygons
- ✓ Configuration with points
- ✓ Configuration with lines
- ✓ Error handling for invalid URLs

#### CSV Layers

- ✓ Configuration with COVID data
- ✓ Configuration with earthquake data
- ✓ Error handling for invalid URLs

#### OGC Feature Layers

- ✓ Configuration with airports data
- ✓ Error handling for invalid URLs

#### WKB (Well-Known Binary) Layers

- ✓ Configuration with WKB data
- ✓ Error handling for invalid URLs

#### KML (Keyhole Markup Language) Layers

- ✓ Configuration with seismic events
- ✓ Error handling for invalid URLs
- ✓ Skip behavior for bad URLs

### Example Tests

```
✓ Test an Esri Dynamic with Historical Flood Events
✓ Test an Esri Dynamic with CESI
✓ Test Adding Esri Dynamic with bad url (Expected Error)
✓ Test an Esri Feature with Toronto Neighbourhoods
✓ Test a WMS Layer with OWS Mundialis
✓ Test a GeoJSON Layer with polygons
✓ Test a CSV Layer with COVID data
```

### Typical Duration

Approximately 5-10 minutes (includes network requests to various services)

## suite-map: Map Test Suite

**Purpose**: Tests core map viewer functionality and state management.

**Description**: Validates map initialization, state changes, zoom operations, and projection handling.

### What It Tests

#### Map State

- ✓ Map initialization and ready state
- ✓ View settings configuration
- ✓ Interaction mode settings
- ✓ Projection configuration

#### Map Zoom

- ✓ Zoom level operations
- ✓ Zoom constraints (min/max)
- ✓ Zoom animation
- ✓ Programmatic zoom changes

#### Map View

- ✓ Center point changes
- ✓ Extent calculations
- ✓ Resolution settings
- ✓ Rotation operations

### Example Tests

```
✓ Test Map State initialization
✓ Test Map Zoom operations
✓ Test Map Center and Extent
✓ Test Map Rotation
```

### Typical Duration

Approximately 1-2 minutes

## suite-layer: Layer Test Suite

**Purpose**: Tests layer addition, removal, and runtime operations.

**Description**: Comprehensive testing of layer lifecycle operations including adding layers to the map, querying layer information, and proper cleanup.

### What It Tests

#### Layer Addition

For each supported layer type:

- ✓ Adding layer to map
- ✓ Layer initialization and ready state
- ✓ Layer visibility and opacity
- ✓ Layer metadata loading

#### Layer Types Tested

- **Esri Dynamic**: Historical Flood Events, CESI
- **Esri Feature**: Toronto Neighbourhoods, Forest Industry
- **Esri Image**: Elevation data
- **WMS**: OWS Mundialis, Datacube MSI
- **WFS**: Current Conditions
- **GeoJSON**: Polygons, points, lines
- **CSV**: COVID data, earthquake data
- **OGC Feature**: Airports
- **WKB**: Well-Known Binary data
- **KML**: Seismic events
- **XYZ Tiles**: Standard tile services
- **Vector Tiles**: Vector tile services
- **Image Static**: Static image overlays

#### Error Handling

- ✓ Invalid layer URLs
- ✓ Missing layer metadata
- ✓ Service unavailability
- ✓ Layer configuration errors

#### Layer Operations

- ✓ Layer removal and cleanup
- ✓ Layer visibility toggling
- ✓ Layer opacity changes
- ✓ Layer ordering

### Example Tests

```
✓ Test Adding Esri Dynamic Histo Flood Events on map
✓ Test Adding Esri Feature Toronto Neighbourhoods on map
✓ Test Adding WMS Layer on map
✓ Test Adding GeoJSON Layer on map
✓ Test Removing layer from map
✓ Test Adding Esri Dynamic with bad url (Expected Error)
```

### Typical Duration

Approximately 10-20 minutes (most comprehensive suite)

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
