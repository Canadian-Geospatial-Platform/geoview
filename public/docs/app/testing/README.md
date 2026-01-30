# GeoView Test Suite

The GeoView Test Suite is a comprehensive testing framework built as a core package that allows you to run automated tests within the GeoView viewer. It provides both user-facing test execution capabilities and a developer framework for creating custom tests.

## Overview

The Test Suite plugin enables:

- **Automated Testing**: Run predefined tests to verify map, layer, configuration, and component functionality
- **Visual Feedback**: Real-time test progress and results displayed in the viewer
- **Event-Driven Architecture**: Monitor test execution through event handlers
- **Extensible Framework**: Create custom test suites and testers for specific use cases

## Documentation

### For Test Users

- [Using the Test Suite](app/testing/using-test-suite.md) - How to configure and run tests
- [Available Test Suites](app/testing/available-suites.md) - Built-in test suites and what they test
- [Understanding Results](app/testing/understanding-results.md) - Interpreting test outcomes

### For Test Developers

- [Creating Custom Tests](app/testing/creating-tests.md) - Developer guide for building custom test suites
- [Test Architecture](app/testing/test-architecture.md) - Understanding the test framework design
- [API Reference](app/testing/api-reference.md) - Complete API documentation

## Quick Start

### Basic Configuration

Add the test-suite package to your GeoView configuration:

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

### Running All Available Suites

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

## Architecture Overview

The Test Suite follows a hierarchical architecture:

```
TestSuitePlugin
  ├── Test Suite 1 (e.g., Config Test Suite)
  │   ├── Tester A (e.g., ConfigTester)
  │   │   ├── Test 1
  │   │   │   ├── Step 1
  │   │   │   ├── Step 2
  │   │   │   └── Step 3
  │   │   └── Test 2
  │   └── Tester B
  └── Test Suite 2 (e.g., Map Test Suite)
      └── Tester C (e.g., MapTester)
          └── Tests...
```

- **Plugin**: Manages multiple test suites
- **Test Suite**: Groups related testers (e.g., all config-related tests)
- **Tester**: Contains individual test methods
- **Test**: Single test case with steps and assertions
- **Step**: Granular progress indicator within a test

## Key Features

### Sequential Execution

Tests run sequentially (not in parallel) to ensure predictable state and avoid conflicts between tests.

### Event-Based Reporting

The test suite emits events at every stage:

- `onTestStarted`: When a test begins
- `onTestUpdated`: When test steps are added
- `onSuccess`: When a test passes
- `onFailure`: When a test fails

### Test Types

- **Regular Tests**: Verify expected behavior (true positives)
- **Error Tests**: Verify expected failures (true negatives)

### Comprehensive Assertions

Built-in assertion methods for:

- Value equality
- Object structure validation
- Array operations
- Type checking
- Error validation

## Test Lifecycle

1. **Configuration**: Define which suites to run in config
2. **Initialization**: Plugin creates and registers test suites
3. **Launch**: User triggers test execution
4. **Execution**: Each suite runs its testers sequentially
5. **Reporting**: Results displayed in viewer with visual feedback
6. **Cleanup**: Tests clean up resources (remove layers, reset state)

## Author

Created by Alexandre Roy for the GeoView project.

## Next Steps

- **Users**: Start with [Using the Test Suite](app/testing/using-test-suite.md)
- **Developers**: Read [Creating Custom Tests](app/testing/creating-tests.md)
