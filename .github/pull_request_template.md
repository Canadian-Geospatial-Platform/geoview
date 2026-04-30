# Description

Please include a summary of the change and which issue is fixed. Please also include relevant motivation and context. List any dependencies that are required for this change.

Fixes # (issue)

## Type of change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] This change requires a documentation update

# How Has This Been Tested?

Please describe the tests that you ran to verify your changes. Provide instructions so we can reproduce.

**Add the URL for your deploy!**

# Checklist:

- [ ] I have run the **Test Suite** and **No errors have been introduced**
- [ ] I have run `@BranchReview` agent in VS Code Chat and addressed all violations
- [ ] I have run `@DocUpdate` agent in VS Code Chat and documentation is in sync with code changes
- [ ] I have run `@IssueReview` agent in VS Code Chat and the implementation aligns with the linked issue
- [ ] I have build **(rush build)** and deploy **(rush host)** my PR
- [ ] I have connected the issues(s) to this PR
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings
- [ ] I have created new issue(s) related to the outcome of this PR is needed
- ~~I have added tests that prove my fix is effective or that my feature works~~
- ~~New and existing unit tests pass locally with my changes~~

# Pre-PR Copilot Agent Checks

Before creating your PR, run the following two Copilot agents in VS Code Chat to catch common issues automatically.

## Branch Review (`@BranchReview`)

Audits all changed `.ts`/`.tsx` files against the GeoView coding standards (JSDoc, logging, return types, naming, accessibility, imports, performance patterns).

**How to run:**

1. Open VS Code Chat (Ctrl+Shift+I)
2. Select the **BranchReview** agent from the agent picker (or type `@BranchReview`)
3. Type the target branch name (defaults to `develop`):
   ```
   @BranchReview  against upstream/develop
   ```
4. Review the violation report and fix flagged items (the agent can auto-fix most issues on approval)

- [ ] `@BranchReview` has been run and all violations have been addressed

## Documentation Update (`@DocUpdate`)

Checks that documentation in `docs/` is still consistent with the code you changed. Catches stale references, missing docs for new features, and incorrect code examples.

**How to run:**

1. Open VS Code Chat (Ctrl+Shift+I)
2. Select the **DocUpdate** agent from the agent picker (or type `@DocUpdate`)
3. Run a full audit or target a specific section:
   ```
   @DocUpdate full audit of docs/programming/
   @DocUpdate check docs/app/layers/
   ```
4. Review the audit summary and approve any proposed documentation updates

- [ ] `@DocUpdate` has been run and documentation is in sync with code changes

## Issue Review (`@IssueReview`)

Compares your branch changes against the linked GitHub issue's proposed fix. Checks whether the implementation aligns with what was proposed, catches gaps, and provides feedback to improve future issue drafts.

**How to run:**

1. Open VS Code Chat (Ctrl+Shift+I)
2. Select the **IssueReview** agent from the agent picker (or type `@IssueReview`)
3. Provide the issue number:
   ```
   @IssueReview #1234
   ```
4. Review the alignment report — it will flag items that were proposed but not implemented, unexpected changes, and root cause accuracy

- [ ] `@IssueReview` has been run and the alignment report has been reviewed
