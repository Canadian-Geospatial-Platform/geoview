---
description: geoview-test-suite authoring rules
applyTo: 'packages/geoview-test-suite/**'
---

Canonical sections (search the named heading and read only that section):
[creating-tests.md](../../docs/app/testing/creating-tests.md) → **Step 1: Create a Tester** and **Step 2: Create a Test Suite**;
[test-templates.md](../../docs/app/testing/test-templates.md) → **Gotchas & Pitfalls**.
Task routing: [test-suite.md](../ai/test-suite.md) → **Enforcement reminders**.

- Custom in-browser framework, not Jest; do not change tests/core for ordinary feature tests.
- Execute/return the subject, assert only that result, finalize cleanup; use shared helpers/constants.
- Shared map changes run sequentially; prefer event registration waits and await controller zoom.
- Tester files keep every `type`/`interface` in a `// #region TYPES AND INTERFACES` at the bottom, after the class.
- Any test change requires all-suite count reconciliation and both catalog/release totals.
