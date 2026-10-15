---
name: sync-test-counts
description: "Use when asked to audit all test suites so getTestsTotalFinal, test-catalog.md and 00-automated-suite.md agree. Invoke with /sync-test-counts."
---

For each suite in `packages/geoview-test-suite/src/tests/suites/`, count the full-suite `testXXXX()`/`testErrorXXXX()` calls in `onLaunchTestSuite()` (exclude debug-only and commented-out). Compare with `getTestsTotalFinal()`, `docs/app/testing/test-catalog.md`, and `docs/programming/release-testing/00-automated-suite.md` (suite-layer listed twice; verify Totals). Report drift in a table, then fix it.
