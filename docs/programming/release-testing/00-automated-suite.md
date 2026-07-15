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

## Suite Checklist

| #   | Suite                           | Tests    | Status   |
| --- | ------------------------------- | -------- | -------- |
| 1   | `suite-core`                    | 5        | [ ] Pass |
| 2   | `suite-config`                  | 33       | [ ] Pass |
| 3   | `suite-utilities`               | 52       | [ ] Pass |
| 4   | `suite-layer` (LCC — EPSG:3978) | 34       | [ ] Pass |
| 5   | `suite-layer` (WM — EPSG:3857)  | 34       | [ ] Pass |
| 6   | `suite-map-varia`               | 16       | [ ] Pass |
| 7   | `suite-map-config`              | 37       | [ ] Pass |
| 8   | `suite-ui`                      | 1        | [ ] Pass |
| 9   | `suite-details`                 | 6        | [ ] Pass |
| 10  | `suite-data-table`              | 12       | [ ] Pass |
| 11  | `suite-geochart`                | 3        | [ ] Pass |
| 12  | `suite-swiper`                  | 1        | [ ] Pass |
|     | **Total**                       | **~200** |          |

## What to Do if a Suite Fails

1. Expand the failed test in the test results UI
2. Read the step log to identify the failure point
3. Check if the failure is a **flaky test** (network timeout, service unavailable) vs. a **real regression**
4. Re-run the individual suite if the failure looks flaky
5. If the failure is a real regression, file an issue before continuing manual testing
