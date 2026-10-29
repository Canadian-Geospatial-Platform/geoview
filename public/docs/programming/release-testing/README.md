# Release Testing Plan

This folder contains the **manual release testing checklist** for GeoView. It covers all features, interactions, and edge cases that must be validated before publishing a release.

## How to Use

1. **Run the automated test suite first** — see [Automated Test Suite](#automated-test-suite) below
2. **Open the Release Testing index page** at `templates/release-testing/release-testing.html` (served via `rush serve` at `http://localhost:8080/release-testing.html`)
3. Walk through each section — click **"Open Test Page"** to launch the dedicated test page with pre-configured maps
4. Follow the test steps from the corresponding markdown file (linked as "Test plan" on each page)
5. **Click the badge** (pending/done) on each card to toggle completion status — progress is saved to localStorage
6. Use the **Clear Progress** button to reset all badges when starting a new release cycle
7. Track pass/fail status using a **GitHub Issue** for team-wide visibility (see [Release Testing Process](#release-testing-process) below)
8. Record any issues found during testing and use the IssueCreator agent to create GitHub issues

> **Note:** Badge toggle state is stored in your browser's localStorage (`geoview-release-testing-done`). It persists across page reloads but is per-browser — use the GitHub Issue for shared team tracking.

## Release Testing Process

### Maintaining the plan

When contributing a test-plan change, update the test definitions, tracking-issue template, and this
index together. Each section needs one issue checkbox linked to its heading and labelled with the
actual number of test rows (`(1 test)` for a single row).

Renaming a section changes its heading link. Adding, removing, or renaming a file affects both the
index and template; changing a time estimate affects the index. Keep tests that move to automation
in the plan and change their Auto flag to `A`, so readers can still find the coverage. Record new
automation candidates in `27-automation-candidates.md`, which stays last in the plan.

Summarize completed test, page, configuration, and infrastructure changes in the release candidate
tracker. Update its count tables when the underlying totals change.

### Release candidate maintenance

[RELEASE-CANDIDATE.md](./RELEASE-CANDIDATE.md) is the cumulative record of completed changes for the
current release cycle. It provides the material for release notes and relevant PR descriptions.

Add concise, evidence-backed entries under the tracker's existing categories. Describe the impact
and reference the issue, PR, or commit. Record completed changes, not proposals or unresolved review
findings. For incompatible schema, API, or behavior changes, explain the old-to-new mapping and any
known migration steps.

Before adding an entry, check whether the same change is already recorded and update that entry
instead of duplicating it. Preserve unrelated entries and the current release version.

For AI-assisted updates, see [Using AI Assistants](../using-ai.md#skills-workflows). The agent-specific
review, approval, and reporting procedure lives in the repository's AI reference, not in this guide.

#### Using the tracker for PR notes

Use the relevant verified entries to draft PR notes, not necessarily the entire release-cycle history. Inspect and preserve the repository PR template, its headings and checklists, and include actual validation results; the tracker does not prove tests passed or changes were merged.

#### Starting a new release cycle

Archive and reset the tracker when the team starts a new release cycle, not during ordinary PR review:

1. Confirm the completed version, next version, and archive destination. A versioned file such as `RELEASE-CANDIDATE-v2.3.0.md` beside the active tracker is suitable; do not overwrite an existing archive.
2. Preserve the completed tracker in the archive before changing the active file.
3. Create a fresh `RELEASE-CANDIDATE.md` with the next version and the same reusable instructions/category structure, but no prior-cycle entries or stale counts.
4. Verify the archive retains the completed contents and the fresh tracker is ready for new entries. Link the archive from this guide so developers can find past release cycles.

### Maintaining automated coverage and counts

Automated changes also update the catalog and automated checklist; new suites/testers update
available-suites and architecture, while new helpers/assertions update authoring/API/templates.

Count A/C/M flags and compare with each index row and TOTAL; exclude the automated checklist and
candidate list from manual totals:

```powershell
Get-ChildItem 'docs\programming\release-testing\[0-2]*.md' |
  Where-Object { $_.Name -notin @('00-automated-suite.md', '27-automation-candidates.md') } |
  ForEach-Object {
    $a = (Select-String -Path $_.FullName -Pattern '\| A\s*\|?\s*$').Count
    $c = (Select-String -Path $_.FullName -Pattern '\| C\s*\|?\s*$').Count
    $m = (Select-String -Path $_.FullName -Pattern '\| M\s*\|?\s*$').Count
    "$($_.Name): A=$a C=$c M=$m Total=$($a+$c+$m)"
  }
```

### Definition and test-page format

Each `##` section uses a table with **Test | Description | Steps | Expected Result | Auto**.
Separate numbered steps with `<br>`; Auto is M (manual), C (candidate), or A (automated).
Do not add Status or Issues Found to definitions: pass/fail and issues belong in the tracking issue.
Use config references such as ``Config: `configs/navigator/demos/XX-name.json` `` and
section links for tests covered elsewhere.
Put a progress-tracking template link at the top of each plan; a dedicated `> **Test page**:` link
immediately follows it when available.

Every test row referencing a dedicated HTML page must have the needed map scenario on that page.
Steps name specific maps ("On Map 1..."), not generic sandbox/all-layers/load-a-config instructions.
Keep maps minimal, use inline `data-config` except for very large/shared navigator configs, and give
every map its corresponding collapsible configuration-snippet button and `mapNCS` pre element.
Add/renumber the map ID, heading, snippet target and matching markdown steps together.

Test definitions (this folder) are separated from pass/fail tracking (GitHub Issues). This keeps test cases clean and version-controlled, while providing interactive checkboxes and collaboration features for tracking.

### Starting a Release Test Cycle

1. **Create a new issue** from the [Release Testing template](../../../.github/ISSUE_TEMPLATE/release-testing.md)
2. **Fill in the header**: version number, RC branch/tag link, test environment URL, start date
3. **Assign testers**: Edit the assignee table to split sections across team members
4. **Test**: Each tester works through their assigned test definition files, checking off sections in the issue as they pass

### Splitting Work

The template includes a suggested 4-way split based on estimated time:

| Assignee | Sections                                                                                                    | Est. Time |
| -------- | ----------------------------------------------------------------------------------------------------------- | --------- |
| Tester 1 | 01–06 (Global, Map, Config, Basemap, Navbar, Overview)                                                      | ~80 min   |
| Tester 2 | 07–11 (Legend, Layers, Styles, Details, Data Table)                                                         | ~110 min  |
| Tester 3 | 12–18 (View Settings, Projection, Map Info, Export, Initial Settings, Packages, Global Settings)            | ~105 min  |
| Tester 4 | 19–26 (Integration, Store Verification, Edge Cases, WCAG, API, Config Loading, CDTK, Dev Tools, Production) | ~130 min  |

Adjust based on team size. For 2 testers, split at section 12.

### Tracking Results

- **Pass**: Check the section checkbox in the issue
- **Fail**: Leave unchecked, add a comment with the section name and link to the created bug issue
- **Blocked**: Add a comment explaining why (e.g., environment down, service unavailable)

GitHub shows a progress bar on the issue (e.g., "18/26 tasks completed"), giving visibility into overall release readiness.

### After Testing

1. Fill in the **Results Summary** table in the issue
2. Link all bug issues in the **Issues Found** section
3. Get **sign-off** from the release approver
4. Close the issue once the release is published

### History

Each release gets its own issue. Previous release test results are preserved as closed issues, providing an audit trail. Search issues with label `release` + `testing` to find past cycles.

## Document Structure

| #   | File                                                           | Area                                                                  | Est. Time    | Tests (A/C/M)        |
| --- | -------------------------------------------------------------- | --------------------------------------------------------------------- | ------------ | -------------------- |
| 0   | [00-automated-suite.md](00-automated-suite.md)                 | Automated test suite execution                                        | 5 min        | 315 executions       |
| 1   | [01-global.md](01-global.md)                                   | Full screen, shortcuts, search, share, notifications                  | 25 min       | 56 (0/15/41)         |
| 2   | [02-map.md](02-map.md)                                         | Projections, north pole, north arrow, rotation                        | 15 min       | 20 (2/7/11)          |
| 3   | [03-config.md](03-config.md)                                   | Config validation, duplicate UUIDs, error layers                      | 15 min       | 23 (6/16/1)          |
| 4   | [04-basemap.md](04-basemap.md)                                 | Basemap selector, labels, shaded relief                               | 5 min        | 9 (0/6/3)            |
| 5   | [05-navbar.md](05-navbar.md)                                   | Navigation bar, zoom, measurement, drawer                             | 15 min       | 20 (0/9/11)          |
| 6   | [06-overview-map.md](06-overview-map.md)                       | Overview map, hide on zoom, projection switch                         | 5 min        | 8 (5/0/3)            |
| 7   | [07-legend.md](07-legend.md)                                   | Legend panel, show/hide all, full screen                              | 15 min       | 31 (0/12/19)         |
| 8   | [08-layers.md](08-layers.md)                                   | Layer panel, add, settings, Available/Hidden lists                    | 55 min       | 133 (1/23/109)       |
| 9   | [09-styles.md](09-styles.md)                                   | Style rendering, visual variables, feature labels                     | 10 min       | 15 (0/0/15)          |
| 10  | [10-details.md](10-details.md)                                 | Details panel, highlighting, navigation, summary                      | 15 min       | 26 (7/0/19)          |
| 11  | [11-data-table.md](11-data-table.md)                           | Data table, filtering, columns, density, export                       | 20 min       | 41 (2/8/31)          |
| 12  | [12-view-settings.md](12-view-settings.md)                     | Zoom constraints, extent override, rotation disabled                  | 10 min       | 16 (4/2/10)          |
| 13  | [13-projection.md](13-projection.md)                           | Geometry, table, north pole on projection switch                      | 10 min       | 10 (1/0/9)           |
| 14  | [14-map-info.md](14-map-info.md)                               | Map info bar, attribution, tooltips                                   | 5 min        | 9 (0/0/9)            |
| 15  | [15-export.md](15-export.md)                                   | Export modal, options, edge cases, formats                            | 15 min       | 27 (0/0/27)          |
| 16  | [16-initial-settings.md](16-initial-settings.md)               | Initial controls, states, cascading, filters, combos                  | 20 min       | 52 (29/16/7)         |
| 17a | [17a-package-time-slider.md](17a-package-time-slider.md)       | Time slider, all layer types, custom slider                           | 15 min       | 20 (0/0/20)          |
| 17b | [17b-package-geochart.md](17b-package-geochart.md)             | Geochart, all chart types, slider/stepper                             | 10 min       | 11 (0/0/11)          |
| 17c | [17c-package-swiper.md](17c-package-swiper.md)                 | Swiper, add/remove layers, orientation, rotation, resize, interactive | 15 min       | 20 (3/7/10)          |
| 17d | [17d-package-panels.md](17d-package-panels.md)                 | About, AOI, Custom Legend, STAC Browser panels                        | 15 min       | 31 (0/4/27)          |
| 17e | [17e-package-drawer.md](17e-package-drawer.md)                 | Drawing tools, edit, snap, export/import                              | 25 min       | 38 (0/3/35)          |
| 18  | [18-global-settings.md](18-global-settings.md)                 | Coord info, theme, highlight color, date mode, URLs                   | 15 min       | 22 (0/8/14)          |
| 19  | [19-integration-flows.md](19-integration-flows.md)             | Multi-step workflows and cross-panel interactions                     | 25 min       | 18 (0/7/11)          |
| 19b | [19b-store-verification.md](19b-store-verification.md)         | Zustand store state assertions (automation candidates)                | 10 min       | 13 (0/13/0)          |
| 20  | [20-edge-cases.md](20-edge-cases.md)                           | Edge cases, outliers, overlays, sandbox, mobile                       | 25 min       | 27 (0/0/27)          |
| 21  | [21-wcag-accessibility.md](21-wcag-accessibility.md)           | WCAG, keyboard nav, focus trap, screen reader                         | 30 min       | 74 (0/0/74)          |
| 22  | [22-api-programmatic.md](22-api-programmatic.md)               | API functions, events, controllers, geometry, panels                  | 25 min       | 54 (0/13/41)         |
| 23  | [23-config-loading-methods.md](23-config-loading-methods.md)   | Config loading (URL params, div attrs, function call)                 | 15 min       | 21 (0/0/21)          |
| 24  | [24-cdtk-rcs-geocore-custom.md](24-cdtk-rcs-geocore-custom.md) | CDTK, RCS, Geocore custom/VCS configs                                 | 20 min       | 27 (0/0/27)          |
| 25  | [25-developer-tools.md](25-developer-tools.md)                 | ESRI/WFS renderer tools                                               | 10 min       | 16 (0/0/16)          |
| 26  | [26-production-configs.md](26-production-configs.md)           | OSDP, Open Maps, Arctic SDI, GSC, CGDI smoke tests                    | 20 min       | 34 (0/0/34)          |
| 27  | [27-automation-candidates.md](27-automation-candidates.md)     | Tests recommended for automation via TestCreator                      | —            | 112 candidates       |
|     | **TOTAL**                                                      |                                                                       | **~445 min** | **916 (60/169/687)** |

**Test breakdown:**

| Category          | Count   | Description                                                |
| ----------------- | ------- | ---------------------------------------------------------- |
| **A** — Automated | 60      | Covered by `geoview-test-suite` (no manual effort needed)  |
| **C** — Candidate | 169     | Candidate for automation (manual today, automatable later) |
| **M** — Manual    | 687     | Requires manual verification (UI, visual, interaction)     |
| **Total**         | **916** | All tests across all files                                 |

> **Keeping counts in sync**: When modifying any release-testing file (changing M→C, M→A, C→A, or adding/removing tests), also update the "Tests (A/C/M)" column for that file and recalculate the TOTAL row. Format: `total (A/C/M)`.

## Prerequisites

Before testing, ensure the following setup:

1. **Enable GeoView DevTools** — In the browser, open DevTools → Application → Local Storage and add key `GEOVIEW_DEVTOOLS` with value `1`. This enables the Zustand store inspector component.
2. **Install React DevTools** — Install the React DevTools browser extension. Store verification tests require navigating to the **Components** tab → selecting the `getViewStore-'mapId'` component to inspect Zustand state.
3. **Clear browser cache** — Ensure no stale service worker or cached assets interfere with testing.

## Automated Test Suite

Before starting manual testing, run the automated test suite.

The automated suite declares **229 tests** across 12 registered suites. The release checklist executes the layer suite for both EPSG:3978 and EPSG:3857, for **272 test executions** when all listed suites run. See [00-automated-suite.md](00-automated-suite.md) for the full checklist.

## Config Files Reference

All test configs are located in `packages/geoview-core/public/configs/navigator/`:

| Folder    | Contents                                                    |
| --------- | ----------------------------------------------------------- |
| `layers/` | Per-layer-type configs (esri-dynamic, wms, geojson, etc.)   |
| `demos/`  | Feature demo configs (basemaps, projections, plugins, etc.) |

## Test Pages Reference

| Page             | URL Path                 | Purpose                     |
| ---------------- | ------------------------ | --------------------------- |
| Tests            | `/tests.html`            | Automated test suite runner |
| Layers Navigator | `/layers-navigator.html` | Browse layer type configs   |
| Demos Navigator  | `/demos-navigator.html`  | Browse demo configs         |
| Config Sandbox   | `/config-sandbox.html`   | Edit configs live           |
