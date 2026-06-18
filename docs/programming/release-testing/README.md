# Release Testing Plan

This folder contains the **manual release testing checklist** for GeoView. It covers all features, interactions, and edge cases that must be validated before publishing a release.

## How to Use

1. **Run the automated test suite first** — see [Automated Test Suite](#automated-test-suite) below
2. Walk through each section in order — each file is a self-contained test definition
3. Track pass/fail status using a **GitHub Issue** (see [Release Testing Process](#release-testing-process) below)
4. Record any issues found during testing and use the IssueCreator agent to create GitHub issues

## Release Testing Process

Test definitions (this folder) are separated from pass/fail tracking (GitHub Issues). This keeps test cases clean and version-controlled, while providing interactive checkboxes and collaboration features for tracking.

### Starting a Release Test Cycle

1. **Create a new issue** from the [Release Testing template](../../.github/ISSUE_TEMPLATE/release-testing.md)
2. **Fill in the header**: version number, RC branch/tag link, test environment URL, start date
3. **Assign testers**: Edit the assignee table to split sections across team members
4. **Test**: Each tester works through their assigned test definition files, checking off sections in the issue as they pass

### Splitting Work

The template includes a suggested 4-way split based on estimated time:

| Assignee | Sections                                                                                         | Est. Time |
| -------- | ------------------------------------------------------------------------------------------------ | --------- |
| Tester 1 | 01–06 (Global, Map, Config, Basemap, Navbar, Overview)                                           | ~80 min   |
| Tester 2 | 07–11 (Legend, Layers, Styles, Details, Data Table)                                              | ~110 min  |
| Tester 3 | 12–18 (View Settings, Projection, Map Info, Export, Initial Settings, Packages, Global Settings) | ~105 min  |
| Tester 4 | 19–26 (Integration, Edge Cases, WCAG, API, Config Loading, CDTK, Dev Tools, Production)          | ~130 min  |

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

| #   | File                                                           | Area                                                  | Est. Time    | Tests (A/C/M)        |
| --- | -------------------------------------------------------------- | ----------------------------------------------------- | ------------ | -------------------- |
| 0   | [00-automated-suite.md](00-automated-suite.md)                 | Automated test suite execution                        | 5 min        | 204 automated        |
| 1   | [01-global.md](01-global.md)                                   | Full screen, shortcuts, search, share, notifications  | 25 min       | 55 (0/16/39)         |
| 2   | [02-map.md](02-map.md)                                         | Projections, north pole, north arrow, rotation        | 15 min       | 19 (2/7/10)          |
| 3   | [03-config.md](03-config.md)                                   | Config validation, duplicate UUIDs, error layers      | 15 min       | 27 (6/20/1)          |
| 4   | [04-basemap.md](04-basemap.md)                                 | Basemap selector, labels, shaded relief               | 5 min        | 11 (0/8/3)           |
| 5   | [05-navbar.md](05-navbar.md)                                   | Navigation bar, zoom, measurement, drawer             | 15 min       | 18 (0/9/9)           |
| 6   | [06-overview-map.md](06-overview-map.md)                       | Overview map, hide on zoom, projection switch         | 5 min        | 8 (5/0/3)            |
| 7   | [07-legend.md](07-legend.md)                                   | Legend panel, show/hide all, full screen              | 15 min       | 27 (0/12/15)         |
| 8   | [08-layers.md](08-layers.md)                                   | Layer panel, add (URL/file), all types, settings      | 50 min       | 90 (1/21/68)         |
| 9   | [09-styles.md](09-styles.md)                                   | Style rendering, visual variables, feature labels     | 10 min       | 15 (0/0/15)          |
| 10  | [10-details.md](10-details.md)                                 | Details panel, highlighting, navigation, summary      | 15 min       | 23 (1/3/19)          |
| 11  | [11-data-table.md](11-data-table.md)                           | Data table, filtering, columns, density, export       | 20 min       | 41 (2/10/29)         |
| 12  | [12-view-settings.md](12-view-settings.md)                     | Zoom constraints, extent override, zoom-to-layer      | 10 min       | 15 (3/2/10)          |
| 13  | [13-projection.md](13-projection.md)                           | Geometry, table, north pole on projection switch      | 10 min       | 8 (0/1/7)            |
| 14  | [14-map-info.md](14-map-info.md)                               | Map info bar, attribution, tooltips                   | 5 min        | 9 (0/0/9)            |
| 15  | [15-export.md](15-export.md)                                   | Export modal, options, all layer types, formats       | 15 min       | 24 (0/0/24)          |
| 16  | [16-initial-settings.md](16-initial-settings.md)               | Initial controls, states, selected tab/layer          | 15 min       | 36 (21/11/4)         |
| 17a | [17a-package-time-slider.md](17a-package-time-slider.md)       | Time slider, all layer types, custom slider           | 15 min       | 23 (0/3/20)          |
| 17b | [17b-package-geochart.md](17b-package-geochart.md)             | Geochart, all chart types, slider/stepper             | 10 min       | 11 (0/0/11)          |
| 17c | [17c-package-swiper.md](17c-package-swiper.md)                 | Swiper, add/remove layers, orientation, rotation      | 10 min       | 14 (3/7/4)           |
| 17d | [17d-package-panels.md](17d-package-panels.md)                 | About, AOI, Custom Legend, STAC Browser panels        | 15 min       | 27 (0/4/23)          |
| 17e | [17e-package-drawer.md](17e-package-drawer.md)                 | Drawing tools, edit, snap, export/import              | 25 min       | 35 (0/3/32)          |
| 18  | [18-global-settings.md](18-global-settings.md)                 | Coord info, theme, highlight color, service URLs      | 15 min       | — (not refactored)   |
| 19  | [19-integration-flows.md](19-integration-flows.md)             | Multi-step workflows and cross-panel interactions     | 30 min       | — (not refactored)   |
| 20  | [20-edge-cases.md](20-edge-cases.md)                           | Edge cases, overlays, sandbox, mobile, WCAG           | 25 min       | — (not refactored)   |
| 21  | [21-wcag-accessibility.md](21-wcag-accessibility.md)           | WCAG, keyboard nav, focus trap, screen reader         | 30 min       | — (not refactored)   |
| 22  | [22-api-programmatic.md](22-api-programmatic.md)               | API functions, events, geometry, panels, injection    | 20 min       | — (not refactored)   |
| 23  | [23-config-loading-methods.md](23-config-loading-methods.md)   | Config loading (URL params, div attrs, function call) | 15 min       | — (not refactored)   |
| 24  | [24-cdtk-rcs-geocore-custom.md](24-cdtk-rcs-geocore-custom.md) | CDTK, RCS, Geocore custom/VCS, vector tiles, WKB      | 25 min       | — (not refactored)   |
| 25  | [25-developer-tools.md](25-developer-tools.md)                 | ESRI/WFS renderer tools, all-layer zoom levels        | 10 min       | — (not refactored)   |
| 26  | [26-production-configs.md](26-production-configs.md)           | OSDP, Open Maps, Arctic SDI, GSC, CGDI smoke tests    | 20 min       | — (not refactored)   |
| 27  | [27-automation-candidates.md](27-automation-candidates.md)     | Tests recommended for automation via TestCreator      | —            | 112 candidates       |
|     | **TOTAL**                                                      |                                                       | **~425 min** | **536 (44/137/355)** |

> **Keeping counts in sync**: When modifying any release-testing file (changing M→C, M→A, C→A, or adding/removing tests), also update the "Tests (A/C/M)" column for that file and recalculate the TOTAL row. Format: `total (A/C/M)`.

## Prerequisites

Before testing, ensure the following setup:

1. **Enable GeoView DevTools** — In the browser, open DevTools → Application → Local Storage and add key `GEOVIEW_DEVTOOLS` with value `1`. This enables the Zustand store inspector component.
2. **Install React DevTools** — Install the React DevTools browser extension. Store verification tests require navigating to the **Components** tab → selecting the `getViewStore-'mapId'` component to inspect Zustand state.
3. **Clear browser cache** — Ensure no stale service worker or cached assets interfere with testing.

## Automated Test Suite

Before starting manual testing, run the automated test suite.

The automated suite covers **170 tests** across 11 suites. See [00-automated-suite.md](00-automated-suite.md) for the full checklist of suites and expected results.

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
