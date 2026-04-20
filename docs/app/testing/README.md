# GeoView Test Suite

GeoView uses its own custom test framework (NOT Jest/Vitest/Mocha). The `geoview-test-suite` package is a GeoView plugin that runs in-browser tests against a live map instance with real OpenLayers rendering.

## Documentation

- **[Using the Test Suite](./using-test-suite.md)** — How to configure, run tests, and interpret results
- **[Test Architecture](./test-architecture.md)** — Framework design and execution model
- **[Creating Custom Tests](./creating-tests.md)** — Developer guide for adding new test suites and testers
- **[API Reference](./api-reference.md)** — Assertion methods and helper utilities

## Quick Start

Add `test-suite` to your map configuration:

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
        "suites": ["suite-layer", "suite-config"]
      }
    }
  ]
}
```

## Available Suites

| Suite ID           | Description                         |
| ------------------ | ----------------------------------- |
| `suite-core`       | Date/utility function tests         |
| `suite-config`     | Layer configuration validation      |
| `suite-map`        | Map zoom, projection, basemap, UI   |
| `suite-layer`      | Layer add/remove, legend, queries   |
| `suite-map-config` | Map config creation/destruction     |
| `suite-geochart`   | Geochart plugin (requires geochart) |
| `suite-details`    | Details panel (requires details)    |
| `suite-ui`         | DOM-level UI tests                  |

## Architecture Overview

```
TestSuitePlugin (AbstractPlugin)
  └── GVAbstractTestSuite (extends AbstractTestSuite)
        └── *Tester (extends GVAbstractTester → AbstractTester)
              └── Test<T> — individual test with lifecycle and assertions
                    └── TestStep — sub-step logging within a test
```

- **Plugin** — Manages multiple test suites, aggregates events
- **Suite** — Groups related testers, orchestrates execution order
- **Tester** — Contains test methods and shared helper methods
- **Test** — Single test with lifecycle: `new` → `running` → `verifying` → `success`/`failed`
- **Step** — Granular progress indicator within a test

## Test Types

- **Regular tests** (`this.test(...)`) — Verify expected behavior (true positives)
- **Error tests** (`this.testError(...)`) — Verify expected failures (true negatives). Test passes when the expected error is thrown

## Execution Patterns

Suites control whether their tests run in parallel or sequentially:

- **Parallel**: Independent tests grouped in `Promise.all()` (e.g., config validation, layer add)
- **Sequential**: Tests that modify shared map state (zoom, projection) run with `await`
- **Mixed**: Parallel first, then sequential for state-dependent tests
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
