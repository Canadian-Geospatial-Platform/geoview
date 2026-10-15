---
name: add-geoview-test
description: "Use when adding a test to geoview-test-suite (layer, config, map, utility, query). Guides the three-callback pattern, suite registration and count syncing."
---

# Add a geoview-test-suite test

1. Read `.github/ai/test-suite.md` for the matching algorithm (layer, utility, query, config, map, map-config, new suite).
2. Add constants to `GVAbstractTester`; write the test in the right tester with three separated callbacks (execute and return result / assert only / cleanup).
3. Register the call in the suite's `onLaunchTestSuite()` (parallel unless it changes zoom/projection/center, then sequential at the end).
4. Update `getTestsTotalFinal()`, `docs/app/testing/test-catalog.md`, and `docs/programming/release-testing/00-automated-suite.md` (suite-layer counted twice; recompute Total).
5. Run the `/sync-test-counts` skill to re-audit all suites.
