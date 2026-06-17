---
name: 🧪 Release Testing
about: Track manual release testing progress for a specific version
title: "[RELEASE TEST] vX.Y.Z"
labels: ["testing", "release"]
---

# Release Testing — vX.Y.Z

**Release candidate**: <!-- link to RC branch or tag -->
**Test environment**: <!-- URL to deployed RC -->
**Date started**: <!-- YYYY-MM-DD -->
**Testers**: <!-- @mention assigned testers -->

---

## Instructions

1. Run the **automated test suite** first ([00-automated-suite.md](../docs/programming/release-testing/00-automated-suite.md))
2. Check off each section below as you complete it — click the checkbox to mark done
3. If a section has failures, add a comment below with the section name and link to the bug issue
4. Once all sections are checked, the release is approved for publishing

**Splitting work**: Assign sections to team members using the table below. Edit the "Assignee" column.

| Assignee | Sections | Est. Time |
| -------- | -------- | --------- |
| @tester1 | 01–06    | ~80 min   |
| @tester2 | 07–11    | ~110 min  |
| @tester3 | 12–18    | ~105 min  |
| @tester4 | 19–26    | ~130 min  |

> Adjust assignments based on team size. The split above is for 4 testers. For 2 testers, split at section 12.

---

## 00 — Automated Suite

- [ ] All automated test suites pass ([details](../docs/programming/release-testing/00-automated-suite.md))

## 01 — Global

- [ ] [Full Screen](../docs/programming/release-testing/01-global.md#full-screen) (3 tests)
- [ ] [Panel Shortcuts](../docs/programming/release-testing/01-global.md#panel-shortcuts) (5 tests)
- [ ] [Navigation Focus Shortcuts](../docs/programming/release-testing/01-global.md#navigation-focus-shortcuts) (3 tests)
- [ ] [Guide Access](../docs/programming/release-testing/01-global.md#guide-access) (5 tests)
- [ ] [Cross-Panel Layer Visibility](../docs/programming/release-testing/01-global.md#cross-panel-layer-visibility) (2 tests)
- [ ] [All Global Settings](../docs/programming/release-testing/01-global.md#all-global-settings) (2 tests)
- [ ] [Geolocator / Search](../docs/programming/release-testing/01-global.md#geolocator--search) (11 tests)
- [ ] [Share URL](../docs/programming/release-testing/01-global.md#share-url) (7 tests)
- [ ] [Notifications Panel](../docs/programming/release-testing/01-global.md#notifications-panel) (7 tests)
- [ ] [Footer Bar Resize](../docs/programming/release-testing/01-global.md#footer-bar-resize-full-screen-mode-only) (5 tests)
- [ ] [Language Switching](../docs/programming/release-testing/01-global.md#language-switching) (4 tests)
- [ ] [Two-Map Shortcuts](../docs/programming/release-testing/01-global.md#two-map-shortcuts) (1 test)

## 02 — Map

- [ ] [Projections](../docs/programming/release-testing/02-map.md#projections)
- [ ] [North Pole](../docs/programming/release-testing/02-map.md#north-pole)
- [ ] [North Arrow](../docs/programming/release-testing/02-map.md#north-arrow)
- [ ] [Rotation](../docs/programming/release-testing/02-map.md#rotation)

## 03 — Config

- [ ] [Config Validation](../docs/programming/release-testing/03-config.md#config-validation)
- [ ] [Duplicate UUIDs](../docs/programming/release-testing/03-config.md#duplicate-uuids)
- [ ] [Error Layers](../docs/programming/release-testing/03-config.md#error-layers)

## 04 — Basemap

- [ ] [Basemap Selector](../docs/programming/release-testing/04-basemap.md#basemap-selector)

## 05 — Navbar

- [ ] [Navigation Bar Controls](../docs/programming/release-testing/05-navbar.md#navigation-bar-controls)
- [ ] [Zoom](../docs/programming/release-testing/05-navbar.md#zoom)
- [ ] [Measurement](../docs/programming/release-testing/05-navbar.md#measurement)

## 06 — Overview Map

- [ ] [Overview Map](../docs/programming/release-testing/06-overview-map.md#overview-map)

## 07 — Legend

- [ ] [Legend Panel](../docs/programming/release-testing/07-legend.md#legend-panel)
- [ ] [Show/Hide All](../docs/programming/release-testing/07-legend.md#showhide-all)

## 08 — Layers

- [ ] [Layer Panel](../docs/programming/release-testing/08-layers.md#layer-panel)
- [ ] [Add by URL](../docs/programming/release-testing/08-layers.md#add-by-url)
- [ ] [Add by File](../docs/programming/release-testing/08-layers.md#add-by-file)
- [ ] [Layer Types](../docs/programming/release-testing/08-layers.md#layer-types)
- [ ] [Layer Settings](../docs/programming/release-testing/08-layers.md#layer-settings)

## 09 — Styles

- [ ] [Style Rendering](../docs/programming/release-testing/09-styles.md#style-rendering)
- [ ] [Visual Variables](../docs/programming/release-testing/09-styles.md#visual-variables)
- [ ] [Feature Labels](../docs/programming/release-testing/09-styles.md#feature-labels)

## 10 — Details

- [ ] [Details Panel](../docs/programming/release-testing/10-details.md#details-panel)
- [ ] [Highlighting](../docs/programming/release-testing/10-details.md#highlighting)
- [ ] [Navigation](../docs/programming/release-testing/10-details.md#navigation)

## 11 — Data Table

- [ ] [Data Table](../docs/programming/release-testing/11-data-table.md#data-table)
- [ ] [Filtering](../docs/programming/release-testing/11-data-table.md#filtering)
- [ ] [Export](../docs/programming/release-testing/11-data-table.md#export)

## 12 — View Settings

- [ ] [Zoom Constraints](../docs/programming/release-testing/12-view-settings.md#zoom-constraints)
- [ ] [Extent Override](../docs/programming/release-testing/12-view-settings.md#extent-override)

## 13 — Projection

- [ ] [Projection Switch](../docs/programming/release-testing/13-projection.md#projection-switch)

## 14 — Map Info

- [ ] [Map Info Bar](../docs/programming/release-testing/14-map-info.md#map-info-bar)

## 15 — Export

- [ ] [Export Modal](../docs/programming/release-testing/15-export.md#export-modal)

## 16 — Initial Settings

- [ ] [Initial Controls](../docs/programming/release-testing/16-initial-settings.md#initial-controls)
- [ ] [Initial States](../docs/programming/release-testing/16-initial-settings.md#initial-states)

## 17a — Time Slider

- [ ] [Time Slider](../docs/programming/release-testing/17a-package-time-slider.md#time-slider)

## 17b — Geochart

- [ ] [Geochart](../docs/programming/release-testing/17b-package-geochart.md#geochart)

## 17c — Swiper

- [ ] [Swiper](../docs/programming/release-testing/17c-package-swiper.md#swiper)

## 17d — Panels

- [ ] [About Panel](../docs/programming/release-testing/17d-package-panels.md#about-panel)
- [ ] [AOI Panel](../docs/programming/release-testing/17d-package-panels.md#aoi-panel)
- [ ] [Custom Legend](../docs/programming/release-testing/17d-package-panels.md#custom-legend)
- [ ] [STAC Browser](../docs/programming/release-testing/17d-package-panels.md#stac-browser)

## 17e — Drawer

- [ ] [Drawing Tools](../docs/programming/release-testing/17e-package-drawer.md#drawing-tools)

## 18 — Global Settings

- [ ] [Global Settings](../docs/programming/release-testing/18-global-settings.md#global-settings)

## 19 — Integration Flows

- [ ] [Multi-Step Workflows](../docs/programming/release-testing/19-integration-flows.md#multi-step-workflows)

## 20 — Edge Cases

- [ ] [Edge Cases](../docs/programming/release-testing/20-edge-cases.md#edge-cases)

## 21 — WCAG Accessibility

- [ ] [WCAG](../docs/programming/release-testing/21-wcag-accessibility.md#wcag)

## 22 — API / Programmatic

- [ ] [API Functions & Events](../docs/programming/release-testing/22-api-programmatic.md#api-functions--events)

## 23 — Config Loading Methods

- [ ] [Config Loading](../docs/programming/release-testing/23-config-loading-methods.md#config-loading)

## 24 — CDTK / RCS / Geocore Custom

- [ ] [CDTK & Custom Configs](../docs/programming/release-testing/24-cdtk-rcs-geocore-custom.md#cdtk--custom-configs)

## 25 — Developer Tools

- [ ] [Developer Tools](../docs/programming/release-testing/25-developer-tools.md#developer-tools)

## 26 — Production Configs

- [ ] [Production Smoke Tests](../docs/programming/release-testing/26-production-configs.md#production-smoke-tests)

---

## Results Summary

| Section     | Pass | Fail | Blocked | Notes |
| ----------- | ---- | ---- | ------- | ----- |
| 01 — Global |      |      |         |       |
| 02 — Map    |      |      |         |       |
| 03 — Config |      |      |         |       |
| ...         |      |      |         |       |

## Issues Found

<!-- Link issues discovered during testing -->

- [ ] #XXXX — Description
- [ ] #XXXX — Description

## Sign-Off

- [ ] All sections tested
- [ ] All critical issues resolved or documented
- [ ] Release approved by: <!-- @approver -->
