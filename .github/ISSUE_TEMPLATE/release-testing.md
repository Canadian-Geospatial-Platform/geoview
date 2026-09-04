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

- [ ] [Projections](../docs/programming/release-testing/02-map.md#projections) (3 tests)
- [ ] [North Pole & North Arrow](../docs/programming/release-testing/02-map.md#north-pole--north-arrow) (6 tests)
- [ ] [Map Rotation](../docs/programming/release-testing/02-map.md#map-rotation) (4 tests)
- [ ] [Map Interaction](../docs/programming/release-testing/02-map.md#map-interaction) (6 tests)
- [ ] [Static Map](../docs/programming/release-testing/02-map.md#static-map) (1 test)

## 03 — Config

- [ ] [Duplicate UUIDs](../docs/programming/release-testing/03-config.md#duplicate-uuids) (2 tests)
- [ ] [Duplicate Layer via Add Layer](../docs/programming/release-testing/03-config.md#duplicate-layer-via-add-layer) (1 test)
- [ ] [Bad Layer ID](../docs/programming/release-testing/03-config.md#bad-layer-id) (1 test)
- [ ] [Wrong Layer Type](../docs/programming/release-testing/03-config.md#wrong-layer-type) (1 test)
- [ ] [Error Layer Configs](../docs/programming/release-testing/03-config.md#error-layer-configs) (11 tests)
- [ ] [Notifications on Error](../docs/programming/release-testing/03-config.md#notifications-on-error) (1 test)
- [ ] [Default Config Behavior](../docs/programming/release-testing/03-config.md#default-config-behavior) (6 tests)

## 04 — Basemap

- [ ] [Basemap Selector](../docs/programming/release-testing/04-basemap.md#basemap-selector) (2 tests)
- [ ] [Labels & Shaded Relief](../docs/programming/release-testing/04-basemap.md#labels--shaded-relief) (5 tests)
- [ ] [Basemap with Projection Switch](../docs/programming/release-testing/04-basemap.md#basemap-with-projection-switch) (1 test)
- [ ] [useAsBasemap Layer Property](../docs/programming/release-testing/04-basemap.md#useasbasemap-layer-property) (1 test)

## 05 — Navbar

- [ ] [Zoom Controls](../docs/programming/release-testing/05-navbar.md#zoom-controls) (2 tests)
- [ ] [Rotation](../docs/programming/release-testing/05-navbar.md#rotation) (2 tests)
- [ ] [Home / Initial Extent](../docs/programming/release-testing/05-navbar.md#home--initial-extent) (1 test)
- [ ] [Geolocation](../docs/programming/release-testing/05-navbar.md#geolocation) (1 test)
- [ ] [Full Screen](../docs/programming/release-testing/05-navbar.md#full-screen) (1 test)
- [ ] [Basemap Select](../docs/programming/release-testing/05-navbar.md#basemap-select) (1 test)
- [ ] [Projection Switch](../docs/programming/release-testing/05-navbar.md#projection-switch) (1 test)
- [ ] [Measurement Tool](../docs/programming/release-testing/05-navbar.md#measurement-tool) (5 tests)
- [ ] [Drawer (Plugin)](../docs/programming/release-testing/05-navbar.md#drawer-plugin) (2 tests)
- [ ] [Navbar Visibility](../docs/programming/release-testing/05-navbar.md#navbar-visibility) (2 tests)

## 06 — Overview Map

- [ ] [Presence](../docs/programming/release-testing/06-overview-map.md#presence) (2 tests)
- [ ] [Hide on Zoom](../docs/programming/release-testing/06-overview-map.md#hide-on-zoom) (3 tests)
- [ ] [Projection Switch](../docs/programming/release-testing/06-overview-map.md#projection-switch) (2 tests)
- [ ] [Combined: Hide on Zoom + Projection Switch](../docs/programming/release-testing/06-overview-map.md#combined-hide-on-zoom--projection-switch) (1 test)

## 07 — Legend

- [ ] [Basic Display](../docs/programming/release-testing/07-legend.md#basic-display) (3 tests)
- [ ] [Loading Status](../docs/programming/release-testing/07-legend.md#loading-status) (3 tests)
- [ ] [Toggle All Controls](../docs/programming/release-testing/07-legend.md#toggle-all-controls) (7 tests)
- [ ] [Visibility Toggle](../docs/programming/release-testing/07-legend.md#visibility-toggle) (3 tests)
- [ ] [Full Screen & ESC](../docs/programming/release-testing/07-legend.md#full-screen--esc) (3 tests)
- [ ] [Shortcuts & Actions](../docs/programming/release-testing/07-legend.md#shortcuts--actions) (4 tests)
- [ ] [Style Classes Visibility](../docs/programming/release-testing/07-legend.md#style-classes-visibility) (6 tests)
- [ ] [WMS Legend Images](../docs/programming/release-testing/07-legend.md#wms-legend-images) (2 tests)

## 08 — Layers

- [ ] [Left Panel — Layer List](../docs/programming/release-testing/08-layers.md#left-panel--layer-list) (16 tests)
- [ ] [Add Layer](../docs/programming/release-testing/08-layers.md#add-layer) (37 tests)
- [ ] [Right Panel — Layer Info & Settings](../docs/programming/release-testing/08-layers.md#right-panel--layer-info--settings) (46 tests)
- [ ] [Layer Type Configs](../docs/programming/release-testing/08-layers.md#layer-type-configs) (27 tests)

## 09 — Styles

- [ ] [Polygon GeoJSON](../docs/programming/release-testing/09-styles.md#polygon-geojson) (1 test)
- [ ] [Visual Variables](../docs/programming/release-testing/09-styles.md#visual-variables) (4 tests)
- [ ] [Complex Classifications](../docs/programming/release-testing/09-styles.md#complex-classifications) (3 tests)
- [ ] [Symbol Shapes & Fill Patterns](../docs/programming/release-testing/09-styles.md#symbol-shapes--fill-patterns) (3 tests)
- [ ] [Feature Labels](../docs/programming/release-testing/09-styles.md#feature-labels) (4 tests)

## 10 — Details

- [ ] [Basic Queries](../docs/programming/release-testing/10-details.md#basic-queries) (3 tests)
- [ ] [Layer Query Status](../docs/programming/release-testing/10-details.md#layer-query-status) (2 tests)
- [ ] [Highlighting](../docs/programming/release-testing/10-details.md#highlighting) (3 tests)
- [ ] [Active Layer Selection](../docs/programming/release-testing/10-details.md#active-layer-selection) (2 tests)
- [ ] [Lightbox Images](../docs/programming/release-testing/10-details.md#lightbox-images) (2 tests)
- [ ] [Hover Tooltip](../docs/programming/release-testing/10-details.md#hover-tooltip) (4 tests)
- [ ] [Non-Queryable Layer](../docs/programming/release-testing/10-details.md#non-queryable-layer) (1 test)
- [ ] [Feature Navigation](../docs/programming/release-testing/10-details.md#feature-navigation) (3 tests)
- [ ] [Summary & Out Fields](../docs/programming/release-testing/10-details.md#summary--out-fields) (3 tests)

## 11 — Data Table

- [ ] [Basic Display](../docs/programming/release-testing/11-data-table.md#basic-display) (4 tests)
- [ ] [Filter by Map Extent](../docs/programming/release-testing/11-data-table.md#filter-by-map-extent) (5 tests)
- [ ] [Column Filtering](../docs/programming/release-testing/11-data-table.md#column-filtering) (6 tests)
- [ ] [Map Filtering from Table](../docs/programming/release-testing/11-data-table.md#map-filtering-from-table) (3 tests)
- [ ] [Global Search](../docs/programming/release-testing/11-data-table.md#global-search) (2 tests)
- [ ] [Table with Style Classes](../docs/programming/release-testing/11-data-table.md#table-with-style-classes) (1 test)
- [ ] [Export](../docs/programming/release-testing/11-data-table.md#export) (4 tests)
- [ ] [Column Visibility](../docs/programming/release-testing/11-data-table.md#column-visibility) (4 tests)
- [ ] [Density Toggle](../docs/programming/release-testing/11-data-table.md#density-toggle) (2 tests)
- [ ] [Row Actions](../docs/programming/release-testing/11-data-table.md#row-actions) (3 tests)
- [ ] [Data Table in App Bar](../docs/programming/release-testing/11-data-table.md#data-table-in-app-bar) (2 tests)
- [ ] [Column Management](../docs/programming/release-testing/11-data-table.md#column-management) (5 tests)

## 12 — View Settings

- [ ] [Restricted Zoom](../docs/programming/release-testing/12-view-settings.md#restricted-zoom) (4 tests)
- [ ] [Initial View — zoomAndCenter](../docs/programming/release-testing/12-view-settings.md#initial-view--zoomandcenter) (1 test)
- [ ] [Initial View — extent](../docs/programming/release-testing/12-view-settings.md#initial-view--extent) (1 test)
- [ ] [Max Extent](../docs/programming/release-testing/12-view-settings.md#max-extent) (3 tests)
- [ ] [Rotation & Home View](../docs/programming/release-testing/12-view-settings.md#rotation--home-view) (4 tests)
- [ ] [Initial Click Coordinate](../docs/programming/release-testing/12-view-settings.md#initial-click-coordinate) (1 test)
- [ ] [Rotation Disabled](../docs/programming/release-testing/12-view-settings.md#rotation-disabled) (2 tests)

## 13 — Projection

- [ ] [Geometry & Projection](../docs/programming/release-testing/13-projection.md#geometry--projection) (2 tests)
- [ ] [Data Table & Projection](../docs/programming/release-testing/13-projection.md#data-table--projection) (2 tests)
- [ ] [North Pole Flag on Projection Switch](../docs/programming/release-testing/13-projection.md#north-pole-flag-on-projection-switch) (2 tests)
- [ ] [Max Extent Override & Projection](../docs/programming/release-testing/13-projection.md#max-extent-override--projection) (3 tests)
- [ ] [Vector Tile on Projection Switch](../docs/programming/release-testing/13-projection.md#vector-tile-on-projection-switch) (1 test)

## 14 — Map Info

- [ ] [Scale](../docs/programming/release-testing/14-map-info.md#scale) (2 tests)
- [ ] [Mouse Position](../docs/programming/release-testing/14-map-info.md#mouse-position) (2 tests)
- [ ] [Expand Map Info](../docs/programming/release-testing/14-map-info.md#expand-map-info) (2 tests)
- [ ] [Attribution](../docs/programming/release-testing/14-map-info.md#attribution) (2 tests)
- [ ] [Rotation Indicator](../docs/programming/release-testing/14-map-info.md#rotation-indicator) (1 test)

## 15 — Export

- [ ] [Export Modal](../docs/programming/release-testing/15-export.md#export-modal) (7 tests)
- [ ] [Export Content Verification](../docs/programming/release-testing/15-export.md#export-content-verification) (2 tests)
- [ ] [Export with Large Legend](../docs/programming/release-testing/15-export.md#export-with-large-legend) (2 tests)
- [ ] [Export with Edge-Case Legend](../docs/programming/release-testing/15-export.md#export-with-edge-case-legend) (1 test)
- [ ] [Export by Layer Type](../docs/programming/release-testing/15-export.md#export-by-layer-type) (9 tests)
- [ ] [Export Formats](../docs/programming/release-testing/15-export.md#export-formats) (3 tests)
- [ ] [Export Edge Cases](../docs/programming/release-testing/15-export.md#export-edge-cases) (3 tests)

## 16 — Initial Settings

- [ ] [Selected Tab & Layer](../docs/programming/release-testing/16-initial-settings.md#selected-tab--layer) (3 tests)
- [ ] [Initial Controls](../docs/programming/release-testing/16-initial-settings.md#initial-controls) (6 tests)
- [ ] [Initial States](../docs/programming/release-testing/16-initial-settings.md#initial-states) (11 tests)
- [ ] [Cascading Behavior](../docs/programming/release-testing/16-initial-settings.md#cascading-behavior) (5 tests)
- [ ] [Opacity Cascading](../docs/programming/release-testing/16-initial-settings.md#opacity-cascading) (3 tests)
- [ ] [Initial Filters](../docs/programming/release-testing/16-initial-settings.md#initial-filters) (6 tests)
- [ ] [Filter Combination (Cross-Source)](../docs/programming/release-testing/16-initial-settings.md#filter-combination-cross-source) (10 tests)
- [ ] [Layer Entry Source Config](../docs/programming/release-testing/16-initial-settings.md#layer-entry-source-config) (5 tests)
- [ ] [Deep Nesting Cascading](../docs/programming/release-testing/16-initial-settings.md#deep-nesting-cascading-4-levels) (3 tests)

## 17a — Time Slider

- [ ] [Layer Types](../docs/programming/release-testing/17a-package-time-slider.md#layer-types) (4 tests)
- [ ] [Custom Time Slider](../docs/programming/release-testing/17a-package-time-slider.md#custom-time-slider) (2 tests)
- [ ] [Slider Controls](../docs/programming/release-testing/17a-package-time-slider.md#slider-controls) (9 tests)
- [ ] [Time Filtering](../docs/programming/release-testing/17a-package-time-slider.md#time-filtering) (4 tests)
- [ ] [Geocore Auto-Creation](../docs/programming/release-testing/17a-package-time-slider.md#geocore-auto-creation) (1 test)

## 17b — Geochart

- [ ] [Chart Types](../docs/programming/release-testing/17b-package-geochart.md#chart-types) (3 tests)
- [ ] [Interaction](../docs/programming/release-testing/17b-package-geochart.md#interaction) (5 tests)
- [ ] [Geochart with CDTK](../docs/programming/release-testing/17b-package-geochart.md#geochart-with-cdtk) (1 test)
- [ ] [Shortcut from Details](../docs/programming/release-testing/17b-package-geochart.md#shortcut-from-details) (1 test)
- [ ] [Geocore Auto-Creation](../docs/programming/release-testing/17b-package-geochart.md#geocore-auto-creation) (1 test)

## 17c — Swiper

- [ ] [Lifecycle](../docs/programming/release-testing/17c-package-swiper.md#lifecycle) (3 tests)
- [ ] [Layer Management](../docs/programming/release-testing/17c-package-swiper.md#layer-management) (4 tests)
- [ ] [Orientation](../docs/programming/release-testing/17c-package-swiper.md#orientation) (3 tests)
- [ ] [Map Rotation with Swiper](../docs/programming/release-testing/17c-package-swiper.md#map-rotation-with-swiper) (2 tests)
- [ ] [Swiper + Details Interaction](../docs/programming/release-testing/17c-package-swiper.md#swiper--details-interaction) (2 tests)

## 17d — Panels

- [ ] [About Panel](../docs/programming/release-testing/17d-package-panels.md#about-panel) (5 tests)
- [ ] [Area of Interest (AOI)](../docs/programming/release-testing/17d-package-panels.md#area-of-interest-aoi) (4 tests)
- [ ] [Custom Legend](../docs/programming/release-testing/17d-package-panels.md#custom-legend) (5 tests)
- [ ] [STAC Browser](../docs/programming/release-testing/17d-package-panels.md#stac-browser) (17 tests)

## 17e — Drawer

- [ ] [Drawing Geometries](../docs/programming/release-testing/17e-package-drawer.md#drawing-geometries) (9 tests)
- [ ] [Editing & Tools](../docs/programming/release-testing/17e-package-drawer.md#editing--tools) (5 tests)
- [ ] [Style](../docs/programming/release-testing/17e-package-drawer.md#style) (3 tests)
- [ ] [Export / Import](../docs/programming/release-testing/17e-package-drawer.md#export--import) (2 tests)
- [ ] [Config Options](../docs/programming/release-testing/17e-package-drawer.md#config-options) (3 tests)
- [ ] [Keyboard Shortcuts](../docs/programming/release-testing/17e-package-drawer.md#keyboard-shortcuts) (13 tests)
- [ ] [Projection Switch](../docs/programming/release-testing/17e-package-drawer.md#projection-switch) (3 tests)

## 18 — Global Settings

- [ ] [Coord Info Toggle](../docs/programming/release-testing/18-global-settings.md#coord-info-toggle) (4 tests)
- [ ] [Unsymbolized Features](../docs/programming/release-testing/18-global-settings.md#unsymbolized-features) (2 tests)
- [ ] [Sublayer Removal](../docs/programming/release-testing/18-global-settings.md#sublayer-removal) (2 tests)
- [ ] [Highlight Layer](../docs/programming/release-testing/18-global-settings.md#highlight-layer) (1 test)
- [ ] [Disabled Layer Types](../docs/programming/release-testing/18-global-settings.md#disabled-layer-types) (1 test)
- [ ] [Theme](../docs/programming/release-testing/18-global-settings.md#theme) (3 tests)
- [ ] [Highlight Color](../docs/programming/release-testing/18-global-settings.md#highlight-color) (2 tests)
- [ ] [Service URLs Override](../docs/programming/release-testing/18-global-settings.md#service-urls-override) (3 tests)
- [ ] [Date Display Mode](../docs/programming/release-testing/18-global-settings.md#date-display-mode) (3 tests)

## 19 — Integration Flows

- [ ] [Layer Config with Table Disabled](../docs/programming/release-testing/19-integration-flows.md#layer-config-with-table-disabled) (2 tests)
- [ ] [Zoom to Layer Extent](../docs/programming/release-testing/19-integration-flows.md#zoom-to-layer-extent) (2 tests)
- [ ] [Highlight & Opacity Restore](../docs/programming/release-testing/19-integration-flows.md#highlight--opacity-restore) (3 tests)
- [ ] [Style Classes + Toggle All](../docs/programming/release-testing/19-integration-flows.md#style-classes--toggle-all) (2 tests)
- [ ] [Dynamic Footer Tab Lifecycle](../docs/programming/release-testing/19-integration-flows.md#dynamic-footer-tab-lifecycle) (9 tests)

## 20 — Edge Cases

- [ ] [Custom Legend with Error Layers](../docs/programming/release-testing/20-edge-cases.md#custom-legend-with-error-layers) (1 test)
- [ ] [Metadata Edge Cases](../docs/programming/release-testing/20-edge-cases.md#metadata-edge-cases) (4 tests)
- [ ] [Circumpolar Config](../docs/programming/release-testing/20-edge-cases.md#circumpolar-config) (1 test)
- [ ] [Error Layer Reload](../docs/programming/release-testing/20-edge-cases.md#error-layer-reload) (2 tests)
- [ ] [Two-Map Page](../docs/programming/release-testing/20-edge-cases.md#two-map-page) (1 test)
- [ ] [Outlier Test Pages](../docs/programming/release-testing/20-edge-cases.md#outlier-test-pages) (8 tests)
- [ ] [Overlay Objects](../docs/programming/release-testing/20-edge-cases.md#overlay-objects) (3 tests)
- [ ] [Config Sandbox](../docs/programming/release-testing/20-edge-cases.md#config-sandbox) (3 tests)
- [ ] [Mobile / Responsive Layout](../docs/programming/release-testing/20-edge-cases.md#mobile--responsive-layout) (3 tests)

## 21 — WCAG Accessibility

- [ ] [Skip Links](../docs/programming/release-testing/21-wcag-accessibility.md#skip-links) (3 tests)
- [ ] [WCAG Mode Dialog](../docs/programming/release-testing/21-wcag-accessibility.md#wcag-mode-dialog) (4 tests)
- [ ] [Ctrl+Q Exit WCAG Mode](../docs/programming/release-testing/21-wcag-accessibility.md#ctrlq-exit-wcag-mode) (4 tests)
- [ ] [Map Focus & Crosshair](../docs/programming/release-testing/21-wcag-accessibility.md#map-focus--crosshair) (10 tests)
- [ ] [Tab Order](../docs/programming/release-testing/21-wcag-accessibility.md#tab-order) (3 tests)
- [ ] [Panel Focus Trapping (WCAG Mode)](../docs/programming/release-testing/21-wcag-accessibility.md#panel-focus-trapping-wcag-mode) (19 tests)
- [ ] [Panel Full Screen Mode Focus](../docs/programming/release-testing/21-wcag-accessibility.md#panel-full-screen-mode-focus) (7 tests)
- [ ] [Guide Panel Keyboard Navigation](../docs/programming/release-testing/21-wcag-accessibility.md#guide-panel-keyboard-navigation) (11 tests)
- [ ] [Screen Reader & ARIA](../docs/programming/release-testing/21-wcag-accessibility.md#screen-reader--aria) (8 tests)
- [ ] [Contrast & Visual Indicators](../docs/programming/release-testing/21-wcag-accessibility.md#contrast--visual-indicators) (3 tests)
- [ ] [Multi-Map WCAG](../docs/programming/release-testing/21-wcag-accessibility.md#multi-map-wcag) (2 tests)

## 22 — API / Programmatic

- [ ] [API Functions & Events](../docs/programming/release-testing/22-api-programmatic.md#api-functions--events) (4 tests)
- [ ] [Geometry API (Programmatic)](../docs/programming/release-testing/22-api-programmatic.md#geometry-api-programmatic) (8 tests)
- [ ] [Interactions API (Low-Level Draw)](../docs/programming/release-testing/22-api-programmatic.md#interactions-api-low-level-draw) (6 tests)
- [ ] [Bounding Box Selector](../docs/programming/release-testing/22-api-programmatic.md#bounding-box-selector) (5 tests)
- [ ] [Add Panels API](../docs/programming/release-testing/22-api-programmatic.md#add-panels-api) (5 tests)
- [ ] [API Loads (Geometry Endpoint)](../docs/programming/release-testing/22-api-programmatic.md#api-loads-geometry-endpoint) (3 tests)
- [ ] [PyGeoAPI Process Integration](../docs/programming/release-testing/22-api-programmatic.md#pygeoapi-process-integration) (2 tests)
- [ ] [GeoJSON Feature Injection](../docs/programming/release-testing/22-api-programmatic.md#geojson-feature-injection) (5 tests)
- [ ] [Events Demo](../docs/programming/release-testing/22-api-programmatic.md#events-demo) (3 tests)
- [ ] [Event Lifecycle](../docs/programming/release-testing/22-api-programmatic.md#event-lifecycle) (6 tests)
- [ ] [Controller Direct API](../docs/programming/release-testing/22-api-programmatic.md#controller-direct-api) (7 tests)

## 23 — Config Loading Methods

- [ ] [Default Config Loading (All Methods)](../docs/programming/release-testing/23-config-loading-methods.md#default-config-loading-all-methods) (4 tests)
- [ ] [Config from URL Parameters](../docs/programming/release-testing/23-config-loading-methods.md#config-from-url-parameters) (2 tests)
- [ ] [Config from Div Parameters](../docs/programming/release-testing/23-config-loading-methods.md#config-from-div-parameters) (3 tests)
- [ ] [Config from Function Call](../docs/programming/release-testing/23-config-loading-methods.md#config-from-function-call) (1 test)
- [ ] [Custom Footer Height](../docs/programming/release-testing/23-config-loading-methods.md#custom-footer-height) (3 tests)
- [ ] [Share Function & URL Parameters](../docs/programming/release-testing/23-config-loading-methods.md#share-function--url-parameters) (2 tests)
- [ ] [App Geo v2 (createMapFromConfigFast)](../docs/programming/release-testing/23-config-loading-methods.md#app-geo-v2-createmapfromconfigfast) (3 tests)
- [ ] [UI Components Demo](../docs/programming/release-testing/23-config-loading-methods.md#ui-components-demo) (3 tests)

## 24 — CDTK / RCS / Geocore Custom

- [ ] [CDTK WMS Services](../docs/programming/release-testing/24-cdtk-rcs-geocore-custom.md#cdtk-wms-services) (6 tests)
- [ ] [CDTK WFS Services](../docs/programming/release-testing/24-cdtk-rcs-geocore-custom.md#cdtk-wfs-services) (6 tests)
- [ ] [RCS](../docs/programming/release-testing/24-cdtk-rcs-geocore-custom.md#rcs-remote-config-service) (4 tests)
- [ ] [Geocore Custom](../docs/programming/release-testing/24-cdtk-rcs-geocore-custom.md#geocore-with-custom-inline-config) (8 tests)
- [ ] [Geocore WMS](../docs/programming/release-testing/24-cdtk-rcs-geocore-custom.md#geocore-wms) (3 tests)

## 25 — Developer Tools

- [ ] [ESRI Renderer Style Configuration Tool](../docs/programming/release-testing/25-developer-tools.md#esri-renderer-style-configuration-tool) (8 tests)
- [ ] [WFS Renderer Style Configuration Tool](../docs/programming/release-testing/25-developer-tools.md#wfs-renderer-style-configuration-tool) (8 tests)

## 26 — Production Configs

- [ ] [GeoDiscovery + Geochart](../docs/programming/release-testing/26-production-configs.md#geodiscovery--geochart) (5 tests)
- [ ] [OSDP](../docs/programming/release-testing/26-production-configs.md#osdp-open-science-data-platform) (7 tests)
- [ ] [Open Maps](../docs/programming/release-testing/26-production-configs.md#open-maps) (5 tests)
- [ ] [Arctic SDI](../docs/programming/release-testing/26-production-configs.md#arctic-sdi) (4 tests)
- [ ] [GSC](../docs/programming/release-testing/26-production-configs.md#gsc-geological-survey-of-canada) (3 tests)
- [ ] [CGDI Water Resources](../docs/programming/release-testing/26-production-configs.md#cgdi-water-resources) (3 tests)
- [ ] [World of Maps / NTS Search](../docs/programming/release-testing/26-production-configs.md#world-of-maps--nts-search) (3 tests)
- [ ] [Flood Demo (EGS)](../docs/programming/release-testing/26-production-configs.md#flood-demo-egs) (4 tests)

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
