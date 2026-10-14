---
description: geoview-test-suite authoring rules
applyTo: 'packages/geoview-test-suite/**'
---

Canonical: [tester callbacks/helpers](../../docs/app/testing/creating-tests.md#step-1-create-a-tester),
[suite counts/sequencing](../../docs/app/testing/creating-tests.md#step-2-create-a-test-suite),
[query/zoom gotchas](../../docs/app/testing/test-templates.md#gotchas--pitfalls).
Task routing: [test-suite](../ai/test-suite.md#enforcement-reminders).

- Custom in-browser framework, not Jest; do not change tests/core for ordinary feature tests.
- Execute/return the subject, assert only that result, finalize cleanup; use shared helpers/constants.
- Shared map changes run sequentially; prefer event registration waits and await controller zoom.
- Any test change requires all-suite count reconciliation and both catalog/release totals.
