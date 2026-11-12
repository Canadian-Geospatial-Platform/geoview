# 00 — Automated Test Suite

Run the automated test suite before starting manual testing. All suites must pass.

## Run the Tests

Navigate to the deployed test page:

**https://canadian-geospatial-platform.github.io/geoview/public/tests.html**

Or run locally:

```bash
rush build
rush serve
# Navigate to http://localhost:8080/tests.html
```

## Related Documentation

- [Test Suite Guide](../../app/testing/README.md) — Overview of the test framework
- [Using the Test Suite](../../app/testing/using-test-suite.md) — How to run tests and read results
- [Creating Tests](../../app/testing/creating-tests.md) — How to add new tests
- [Test Templates](../../app/testing/test-templates.md) — Copy-paste templates for new tests
- [Test Catalog](../../app/testing/test-catalog.md) — Complete inventory of all existing tests
- [Test Architecture](../../app/testing/test-architecture.md) — Framework design and execution model
- [API Reference](../../app/testing/api-reference.md) — Assertion API and test lifecycle
- [Test Suite Package](../../../packages/geoview-test-suite/) — Source code for `geoview-test-suite`

The checklist has one row for each suite execution. `suite-layer` appears twice because it runs on both LCC (EPSG:3978) and Web Mercator (EPSG:3857).

## Suite Checklist

| Suite                                    | Status   |
| ---------------------------------------- | -------- |
| `suite-core`                             | [ ] Pass |
| `suite-config`                           | [ ] Pass |
| `suite-utilities`                        | [ ] Pass |
| `suite-layer` (LCC — EPSG:3978)          | [ ] Pass |
| `suite-layer` (WM — EPSG:3857)           | [ ] Pass |
| `suite-layer-functions` (WM — EPSG:3857) | [ ] Pass |
| `suite-map`                              | [ ] Pass |
| `suite-map-config`                       | [ ] Pass |
| `suite-details`                          | [ ] Pass |
| `suite-data-table`                       | [ ] Pass |
| `suite-geochart`                         | [ ] Pass |
| `suite-swiper`                           | [ ] Pass |
| `suite-time-slider`                      | [ ] Pass |

## What to Do if a Suite Fails

1. Expand the failed test in the test results UI
2. Read the step log to identify the failure point
3. Check if the failure is a **flaky test** (network timeout, service unavailable) vs. a **real regression**
4. Re-run the individual suite if the failure looks flaky
5. If the failure is a real regression, file an issue before continuing manual testing
