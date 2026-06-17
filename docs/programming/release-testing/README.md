# Release Testing Plan

This folder contains the **manual release testing checklist** for GeoView. It covers all features, interactions, and edge cases that must be validated before publishing a release.

## How to Use

1. **Run the automated test suite first** — see [Automated Test Suite](#automated-test-suite) below
2. Walk through each section in order — each file is a self-contained checklist
3. Mark items with `[x]` as you complete them
4. Record any issues found in each test, regroup them logically and use the agent IssueCreator to create GitHub issues. Make sure the failing test reference is linked in the issue

## Document Structure

| #   | File                                                           | Area                                                  | Est. Time |
| --- | -------------------------------------------------------------- | ----------------------------------------------------- | --------- |
| 0   | [00-automated-suite.md](00-automated-suite.md)                 | Automated test suite execution                        | 5 min     |
| 1   | [01-global.md](01-global.md)                                   | Full screen, shortcuts, search, share, notifications  | 25 min    |
| 2   | [02-map.md](02-map.md)                                         | Projections, north pole, north arrow, rotation        | 15 min    |
| 3   | [03-config.md](03-config.md)                                   | Config validation, duplicate UUIDs, error layers      | 15 min    |
| 4   | [04-basemap.md](04-basemap.md)                                 | Basemap selector, labels, shaded relief               | 5 min     |
| 5   | [05-navbar.md](05-navbar.md)                                   | Navigation bar, zoom, measurement, drawer             | 15 min    |
| 6   | [06-overview-map.md](06-overview-map.md)                       | Overview map, hide on zoom, projection switch         | 5 min     |
| 7   | [07-legend.md](07-legend.md)                                   | Legend panel, show/hide all, full screen              | 15 min    |
| 8   | [08-layers.md](08-layers.md)                                   | Layer panel, add (URL/file), all types, settings      | 50 min    |
| 9   | [09-styles.md](09-styles.md)                                   | Style rendering, visual variables, feature labels     | 10 min    |
| 10  | [10-details.md](10-details.md)                                 | Details panel, highlighting, navigation, summary      | 15 min    |
| 11  | [11-data-table.md](11-data-table.md)                           | Data table, filtering, columns, density, export       | 20 min    |
| 12  | [12-view-settings.md](12-view-settings.md)                     | Zoom constraints, extent override, zoom-to-layer      | 10 min    |
| 13  | [13-projection.md](13-projection.md)                           | Geometry, table, north pole on projection switch      | 10 min    |
| 14  | [14-map-info.md](14-map-info.md)                               | Map info bar, attribution, tooltips                   | 5 min     |
| 15  | [15-export.md](15-export.md)                                   | Export modal, options, all layer types, formats       | 15 min    |
| 16  | [16-initial-settings.md](16-initial-settings.md)               | Initial controls, states, selected tab/layer          | 15 min    |
| 17a | [17a-package-time-slider.md](17a-package-time-slider.md)       | Time slider, all layer types, custom slider           | 15 min    |
| 17b | [17b-package-geochart.md](17b-package-geochart.md)             | Geochart, all chart types, slider/stepper             | 10 min    |
| 17c | [17c-package-swiper.md](17c-package-swiper.md)                 | Swiper, add/remove layers, orientation, rotation      | 10 min    |
| 17d | [17d-package-panels.md](17d-package-panels.md)                 | About, AOI, Custom Legend, STAC Browser panels        | 15 min    |
| 17e | [17e-package-drawer.md](17e-package-drawer.md)                 | Drawing tools, edit, snap, export/import              | 25 min    |
| 18  | [18-global-settings.md](18-global-settings.md)                 | Coord info, theme, highlight color, service URLs      | 15 min    |
| 19  | [19-integration-flows.md](19-integration-flows.md)             | Multi-step workflows and cross-panel interactions     | 30 min    |
| 20  | [20-edge-cases.md](20-edge-cases.md)                           | Edge cases, overlays, sandbox, mobile, WCAG           | 25 min    |
| 21  | [21-wcag-accessibility.md](21-wcag-accessibility.md)           | WCAG, keyboard nav, focus trap, screen reader         | 30 min    |
| 22  | [22-api-programmatic.md](22-api-programmatic.md)               | API functions, events, geometry, panels, injection    | 20 min    |
| 23  | [23-config-loading-methods.md](23-config-loading-methods.md)   | Config loading (URL params, div attrs, function call) | 15 min    |
| 24  | [24-cdtk-rcs-geocore-custom.md](24-cdtk-rcs-geocore-custom.md) | CDTK, RCS, Geocore custom/VCS, vector tiles, WKB      | 25 min    |
| 25  | [25-developer-tools.md](25-developer-tools.md)                 | ESRI/WFS renderer tools, all-layer zoom levels        | 10 min    |
| 26  | [26-production-configs.md](26-production-configs.md)           | OSDP, Open Maps, Arctic SDI, GSC, CGDI smoke tests    | 20 min    |
| 27  | [27-automation-candidates.md](27-automation-candidates.md)     | Tests recommended for automation via TestCreator      | —         |

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
