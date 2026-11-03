---
name: sync-test-counts
description: "Use when asked to audit all test suites so getTestsTotalFinal matches the full suite calls. Invoke with /sync-test-counts."
---

For each suite in `packages/geoview-test-suite/src/tests/suites/`, count the full-suite `testXXXX()`/`testErrorXXXX()` calls in `onLaunchTestSuite()` (include heavy-gated calls; exclude debug-only and commented-out calls). Compare the result with `getTestsTotalFinal()`. Report source-level drift in a table, then fix it. The catalog and release checklist intentionally contain no numeric test totals.
