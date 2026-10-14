---
name: review-branch
description: "Use when asked to review the current branch against GeoView conventions. Invoke with /review-branch."
---

Review the changed files in the current branch against the scoped rules in `.github/instructions/`. Report only concrete violations with file and line, grouped by severity.

For larger work, delegate to the `BranchReview` custom agent.
