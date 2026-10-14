# Release-testing (manual test plan) reference

TestCreator's on-demand review workflow. Public documentation is canonical for test definitions,
format and synchronization; automated authoring routes through [test-suite.md](test-suite.md#enforcement-reminders).

Read only the linked section of each doc: search for its heading and read to the next heading of the same level; expand only if needed (`AGENTS.md` → Reading linked docs).

| Topic                                                                                | Canonical section                                                                                                   |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Definition/template/index three-way synchronization, A/C/M count command, RC tracker | [Maintaining the plan](../../docs/programming/release-testing/README.md#maintaining-the-plan)                       |
| Tables, progress links, test maps and snippet IDs                                    | [Definition and test-page format](../../docs/programming/release-testing/README.md#definition-and-test-page-format) |
| Current files/time estimates/counts                                                  | [Document structure](../../docs/programming/release-testing/README.md#document-structure)                           |
| Issue assignment/results/sign-off                                                    | [Release process](../../docs/programming/release-testing/README.md#release-testing-process)                         |
| Automated suite counts (layer runs twice)                                            | [Suite count rules](../../docs/app/testing/creating-tests.md#step-2-create-a-test-suite)                            |
| Executing automated suites                                                           | [Automated checklist](../../docs/programming/release-testing/00-automated-suite.md)                                 |

## Sync rules after any test change

Apply the linked maintenance rules in the same edit session, not later.
Keep automated rows as `A` rather than deleting them. Recount definition rows, section checkboxes and
README totals; changing Auto flags also changes the A/C/M breakdown. Include the RC tracker and
affected public test catalog/architecture/helper docs. Do not treat "increment both" as proof of correctness.

## Mode 3 workflow — manual release-testing review

Retained entry point for TestCreator "review-manual".

1. **Scope:** full numbered plan, one file, feature area, or codebase delta. Use the requested scope;
   if interactive and unspecified, clarify before a full audit.
2. **Cross-reference:** read the plan and the corresponding actual components/controllers/stores,
   layer classes, plugin source and navigator/test-page configs. Trace behavior directly; delegate only
   if separately scoped research genuinely needs another context and delegation is permitted.
3. **Find gaps:** missing feature/config/behavior cases, stale removed/renamed behavior, bad map references,
   and deterministic automation candidates. Verify against source, not old build artifacts.
4. **Report:** use the format below; do not add tests on a review-only request.
5. **Apply requested/approved changes:** update definitions and matching HTML scenarios, then all
   maintenance surfaces linked above. Keep `27-automation-candidates.md` last.

### Manual Release-Testing Audit Report

Include scope and number of code files cross-referenced, then:

| Finding group            | Required evidence                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Missing Manual Tests     | Plan file/section, missing behavior, source symbol/path, proposed scenario         |
| Stale / Inaccurate Tests | Plan row, contradicted expectation, source/config evidence and correction          |
| Automation Candidates    | Plan row, deterministic assertion, target suite/tester, prerequisites and priority |

A plan row must name an existing configured map that can reproduce it.
Never imply tests were executed when this was a source/coverage audit.

## Source navigation

Definitions: `docs/programming/release-testing/`; template: `.github/ISSUE_TEMPLATE/release-testing.md`;
pages: `packages/geoview-core/public/templates/release-testing/`; demo/layer configs:
`packages/geoview-core/public/configs/navigator/`.
Use the public index instead of keeping a second AI file inventory.
