# geoview-test-suite authoring guide

GeoView uses a custom **in-browser** framework, not Jest/Vitest/Mocha. Public documentation is canonical.
Load the matching section rather than copying a stale AI template.

Read only the linked section of each doc: search for its heading and read to the next heading of the same level; expand only if needed (`AGENTS.md` → Reading linked docs).

| Task                                                   | Canonical section                                                                                                                                                                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hierarchy, file roles, lifecycle                       | [Class hierarchy](../../docs/app/testing/test-architecture.md#class-hierarchy), [Lifecycle](../../docs/app/testing/test-architecture.md#test-lifecycle)                                                            |
| Configure/run/interpret suites                         | [Configuration](../../docs/app/testing/using-test-suite.md#configuration), [Results](../../docs/app/testing/using-test-suite.md#understanding-results)                                                             |
| Tester creation and strict execution/assertion/cleanup | [Create a tester](../../docs/app/testing/creating-tests.md#step-1-create-a-tester)                                                                                                                                 |
| Helpers and constants                                  | [Helpers](../../docs/app/testing/creating-tests.md#helper-methods), [Constants](../../docs/app/testing/creating-tests.md#shared-constants)                                                                         |
| Suite creation, counts, conditional guards, sequencing | [Create a suite](../../docs/app/testing/creating-tests.md#step-2-create-a-test-suite)                                                                                                                              |
| Register suite + HTML map                              | [Registration](../../docs/app/testing/creating-tests.md#step-3-register-the-suite), [HTML](../../docs/app/testing/creating-tests.md#step-4-add-to-html-test-page)                                                  |
| Utility test                                           | [Template A](../../docs/app/testing/test-templates.md#template-a--utility--pure-function-test)                                                                                                                     |
| Config validation test                                 | [Template B](../../docs/app/testing/test-templates.md#template-b--config-validation-test)                                                                                                                          |
| Layer lifecycle and true-negative bad URL              | [Template C](../../docs/app/testing/test-templates.md#template-c--layer-lifecycle-test-happy-path), [Template D](../../docs/app/testing/test-templates.md#template-d--layer-lifecycle-test-bad-url--true-negative) |
| Layer query                                            | [Template E](../../docs/app/testing/test-templates.md#template-e--layer-query-test)                                                                                                                                |
| Map interaction                                        | [Template F](../../docs/app/testing/test-templates.md#template-f--map-interaction-test)                                                                                                                            |
| Map config recreation and cascading helpers            | [Test isolation](../../docs/app/testing/creating-tests.md#test-isolation)                                                                                                                                          |
| UI panels and guarded plugins                          | [Template G](../../docs/app/testing/test-templates.md#template-g--component-panel-test), [Template H](../../docs/app/testing/test-templates.md#template-h--guarded-plugin-test)                                    |
| Assertions                                             | [Assertion API](../../docs/app/testing/test-templates.md#assertion-api-quick-reference)                                                                                                                            |
| Manual plan synchronization                            | [Maintaining the plan](../../docs/programming/release-testing/README.md#maintaining-the-plan)                                                                                                                      |

## Enforcement reminders

- Keep execution/result, assertion-only verification and cleanup separate; `Test<T>` matches the returned subject.
- Use `test.addStep`, generated IDs, shared constants, instance helpers and `testError` for expected errors.
- Map-state-changing tests run sequentially after independent parallel tests.
- After any automated test change, audit **all suites** against actual full-pipeline calls and both count docs;
  include heavy-gated tests, exclude debug/commented calls, count suite-layer twice only in the release checklist.
- Do not modify framework `tests/core/` merely to implement a feature test.

### Gotchas & Pitfalls

Read the canonical [gotchas](../../docs/app/testing/test-templates.md#gotchas--pitfalls).
Source boundaries most likely to produce misleading tests:

- `setMapZoomLevel` returns void; await controller zoom when completion matters.
- Query visibility is parent visibility plus current OL resolution limits; a hidden/out-of-range result is empty, not an error.
- Prefer `waitForLayerToGetRegistered`; polling is fallback only when no event exists.
- Map recreation must reassign both viewer and controllers. Overrides use `null` to remove keys.
- Guard async result-set handlers when removal can delete the entry before settlement.
- Instance cleanup/helpers differ from LayerTester static assertions requiring mapId.

### Coverage Review — Mapping Changed Code to Tests

AI-specific workflow for TestCreator Mode 2. Classifications/templates are canonical in
[Test Classification](../../docs/app/testing/test-templates.md#test-classification).

| Changed source                                       | Review destination                                                                  |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Exported utilities / validation / API return values  | Group 1: CoreTester, Utilities*Tester, ConfigTester                                 |
| Layer class/config/rendering/legend/query/layer sets | Group 2: ConfigTester + LayerTester lifecycle/query/legend as applicable            |
| MapController / shared zoom/projection/center        | Group 3: MapTester (sequential)                                                     |
| Details/table/guide/app-bar/footer-bar/UIController  | Group 4: matching panel tester or UITester                                          |
| Geochart/swiper/time-slider/drawer/other plugin      | Group 5: guarded plugin tester; confirm an existing suite before inventing a tester |
| LayerController methods                              | Classify by behavior: lifecycle (2), map state (3), panel state (4)                 |
| Bug fix                                              | Reproduce the smallest failing behavior in its corresponding group                  |

Read changed source and existing tests before proposing coverage. Inspect observable state/DOM/controller
effects, not just new method names. Include happy path, boundary, failure and cleanup where meaningful.
Prefer deterministic utility/config coverage before service-dependent lifecycle tests; do not misclassify
all controller methods as map interactions.

Report **Missing Test Coverage Report** with branch/base and files analyzed. Group findings 1–5;
for each include source path/symbol, changed behavior, existing coverage gap, proposed tester/test cases,
and priority (determinism, risk, service/plugin prerequisites). Ask which proposals to implement when
the request is review-only; keep manual gaps in [release-testing.md](release-testing.md#mode-3-workflow--manual-release-testing-review).
