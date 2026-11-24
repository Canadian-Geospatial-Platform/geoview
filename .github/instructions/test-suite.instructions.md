---
description: geoview-test-suite authoring rules
applyTo: 'packages/geoview-test-suite/**'
---

Canonical sections (search the named heading and read only that section):
[creating-tests.md](../../docs/app/testing/creating-tests.md) → **Step 1: Create a Tester** and **Step 2: Create a Test Suite**;
[test-templates.md](../../docs/app/testing/test-templates.md) → **Gotchas & Pitfalls**.
Task routing: [test-suite.md](../ai/test-suite.md) → **Enforcement reminders**.

- Custom in-browser framework, not Jest; do not change tests/core for ordinary feature tests.
- Execute the subject in `callback` (return observations for `test()`, throw the expected error for `testError()`); put `Test.assert*` calls in `callbackAssert`, never in `callback`.
- Use `callbackFinalize` for cleanup and use shared helpers/constants.
- Never replace or monkey-patch shared methods, module singletons, prototypes, or globals just to observe test behavior. Prefer existing read-only instrumentation or observable behavior; if a patch is genuinely unavoidable, document why, isolate it from concurrent tests, and restore the original in `callbackFinalize`.
- Shared map changes run sequentially; prefer event registration waits and await controller zoom.
- Tester files keep every `type`/`interface` in a `// #region TYPES AND INTERFACES` at the bottom, after the class.
- Any test change requires all-suite count reconciliation and both catalog/release totals.
- Keep `getTestsTotalFinal()` aligned with calls in the changed suite. Update the unnumbered catalog inventory when test methods change; the automated checklist has no test totals and only needs edits when suite execution rows change.
