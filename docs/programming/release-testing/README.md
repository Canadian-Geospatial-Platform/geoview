# Release Testing Plan

This folder contains the **manual release testing checklist** for GeoView. It covers all features, interactions, and edge cases that must be validated before publishing a release.

## How to Use

1. **Run the automated test suite first** — see [Automated Test Suite](#automated-test-suite) below
2. Walk through each section in order — each file is a self-contained checklist
3. Mark items with `[x]` as you complete them
4. Record any issues found in a scratch section at the bottom of each file

## Document Structure

| # | File | Area | Est. Time |
|---|------|------|-----------|
| 0 | [00-automated-suite.md](00-automated-suite.md) | Automated test suite execution | 5 min |
| 1 | [01-global.md](01-global.md) | Full screen, shortcuts, navigation, guide | 15 min |
| 2 | [02-map.md](02-map.md) | Projections, north pole, north arrow, rotation | 10 min |
| 3 | [03-config.md](03-config.md) | Config validation, duplicate UUIDs, error layers | 10 min |
| 4 | [04-basemap.md](04-basemap.md) | Basemap selector, labels, shaded relief | 5 min |
| 5 | [05-navbar.md](05-navbar.md) | Navigation bar, rotation, zoom controls | 5 min |
| 6 | [06-overview-map.md](06-overview-map.md) | Overview map, hide on zoom, projection switch | 5 min |
| 7 | [07-legend.md](07-legend.md) | Legend panel, show/hide all, full screen | 5 min |
| 8 | [08-layers.md](08-layers.md) | Layer panel, reorder, opacity, visibility, settings | 15 min |
| 9 | [09-styles.md](09-styles.md) | Style rendering, visual variables, classification | 10 min |
| 10 | [10-details.md](10-details.md) | Details panel, highlighting, lightbox, coordinates | 10 min |
| 11 | [11-data-table.md](11-data-table.md) | Data table, filtering, global search, export | 10 min |
| 12 | [12-view-settings.md](12-view-settings.md) | Zoom constraints, extent override, zoom-to-layer | 5 min |
| 13 | [13-projection.md](13-projection.md) | Projection switch, geometry, table, north pole | 10 min |
| 14 | [14-map-info.md](14-map-info.md) | Map info bar, attribution, tooltips | 5 min |
| 15 | [15-export.md](15-export.md) | Export map, all layer types | 10 min |
| 16 | [16-time-slider.md](16-time-slider.md) | Time slider, all layer types, custom slider | 10 min |
| 17 | [17-geochart.md](17-geochart.md) | Geochart, all chart types, slider/stepper | 10 min |
| 18 | [18-swiper.md](18-swiper.md) | Swiper, add/remove layers, orientation, rotation | 5 min |
| 19 | [19-initial-settings.md](19-initial-settings.md) | Initial controls, states, selected tab/layer | 10 min |
| 20 | [20-global-settings.md](20-global-settings.md) | Coord info, unsymbolized, sublayer removal | 10 min |
| 21 | [21-integration-flows.md](21-integration-flows.md) | Multi-step workflows and cross-panel interactions | 20 min |
| 22 | [22-edge-cases.md](22-edge-cases.md) | Edge cases, metadata, WCAG, weird behaviours | 15 min |
| 23 | [23-automation-candidates.md](23-automation-candidates.md) | Tests recommended for automation via TestCreator | — |

## Automated Test Suite

Before starting manual testing, run the automated test suite:

```bash
rush build
rush serve
# Navigate to http://localhost:8080/tests.html
```

The automated suite covers **170 tests** across 11 suites. See [00-automated-suite.md](00-automated-suite.md) for the full checklist of suites and expected results.

## Config Files Reference

All test configs are located in `packages/geoview-core/public/configs/navigator/`:

| Folder | Contents |
|--------|----------|
| `layers/` | Per-layer-type configs (esri-dynamic, wms, geojson, etc.) |
| `demos/` | Feature demo configs (basemaps, projections, plugins, etc.) |

## Test Pages Reference

| Page | URL Path | Purpose |
|------|----------|---------|
| Tests | `/tests.html` | Automated test suite runner |
| Layers Navigator | `/layers-navigator.html` | Browse layer type configs |
| Demos Navigator | `/demos-navigator.html` | Browse demo configs |
| Release Navigator | `/release-navigator.html` | Release testing page |
| Config Sandbox | `/config-sandbox.html` | Edit configs live |
