# 26 — Production Config Smoke Tests

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-26-production-configs.html](https://canadian-geospatial-platform.github.io/geoview/public/rt-26-production-configs.html) — Links to all production demo pages.

Smoke tests for production-like configurations. These are real-world configs used by partner organizations. The goal is to verify no regressions — layers load, panels open, and no crashes occur.

## GeoDiscovery + Geochart

Demo: `templates/demos-specific/demo-geodiscovery-geochart.html`

| Test                  | Description              | Steps                                                                                       | Expected Result                                                 | Auto |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---- |
| Config dropdown loads | Dropdown lists entries   | 1. Load `demo-geodiscovery-geochart.html`<br>2. Open the configuration dropdown             | All GeoDiscovery entries listed (EN/FR pairs)                   | M    |
| Load EN config        | English config renders   | 1. Select an English config (e.g., "Radionuclide Releases - Nuclear Processing Facilities") | Map loads with layers and geochart configured                   | M    |
| Load FR config        | French config renders    | 1. Select the French equivalent                                                             | Layers load with French names/labels                            | M    |
| Geochart interaction  | Chart from feature click | 1. Click a feature on the map<br>2. Check geochart panel                                    | Geochart panel shows chart data for the selected feature        | M    |
| Switch configs        | Clean reinitialization   | 1. Select a different config from dropdown without page reload                              | Map cleanly reinitializes with the new config (no stale layers) | M    |

## OSDP (Open Science Data Platform)

Demo pages: `templates/demos-specific/demo-osdp-*.html`

Spot-check a representative subset:

| Test                | Description            | Steps                                                          | Expected Result                                       | Auto |
| ------------------- | ---------------------- | -------------------------------------------------------------- | ----------------------------------------------------- | ---- |
| OSDP Air            | Air demo loads         | 1. Load `demo-osdp-air.html`<br>2. Check console               | Layers render, no console errors                      | M    |
| OSDP Water          | Water demo loads       | 1. Load `demo-osdp-water.html`<br>2. Check console             | Layers render, no console errors                      | M    |
| OSDP Climate        | Climate demo loads     | 1. Load `demo-osdp-climate.html`<br>2. Check console           | Layers render, no console errors                      | M    |
| OSDP Integration    | Multi-config page      | 1. Load `demo-osdp-integration.html`                           | Multiple OSDP configs load together without conflicts | M    |
| OSDP Non-curated    | Uncurated data sources | 1. Load `demo-osdp-non-currated.html`                          | Uncurated data sources load without crashes           | M    |
| Layer interactivity | Feature click on OSDP  | 1. On any OSDP page, click a feature<br>2. Check details panel | Details panel shows attributes                        | M    |
| Legend populated    | All layers in legend   | 1. Open legend panel on any OSDP page                          | All configured layers shown with correct names        | M    |

## Open Maps

Demo: `templates/demos-specific/demo-open-maps.html`

| Test               | Description        | Steps                                                     | Expected Result                                            | Auto |
| ------------------ | ------------------ | --------------------------------------------------------- | ---------------------------------------------------------- | ---- |
| Open Maps load     | Page renders       | 1. Load `demo-open-maps.html`<br>2. Observe map           | Open Maps configuration renders with all layers            | M    |
| Layer types        | Mixed sources load | 1. Check legend for different layer types                 | Mix of layer types (geocore, WMS, Esri) all load correctly | M    |
| Panel interactions | No crashes on use  | 1. Open legend<br>2. Click features<br>3. Open data table | No crashes during panel interactions                       | M    |

Demo: `templates/demos-specific/demo-open-maps-wet.html`

| Test               | Description          | Steps                                                               | Expected Result                                   | Auto |
| ------------------ | -------------------- | ------------------------------------------------------------------- | ------------------------------------------------- | ---- |
| WET integration    | Map renders in WET   | 1. Load `demo-open-maps-wet.html`<br>2. Observe map within WET page | GeoView map renders within the WET page framework | M    |
| No style conflicts | UI components intact | 1. Check buttons, panels, fonts in the GeoView map                  | WET CSS does not break GeoView UI components      | M    |

## Arctic SDI

Demo: `templates/demos-specific/demo-arctic-sdi.html`

| Test              | Description             | Steps                                                     | Expected Result                                                             | Auto |
| ----------------- | ----------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------- | ---- |
| Wetlands layer    | WFS polygons render     | 1. Load `demo-arctic-sdi.html`<br>2. Check wetlands layer | Arctic wetlands WFS layer loads and renders polygons                        | M    |
| Sea Ice Extent    | Historical layer loads  | 1. Check Sea Ice Extent layer in legend                   | Sea Ice Extent (1979-2016) layer loads                                      | M    |
| Arctic projection | High-latitude rendering | 1. Observe map projection and rendering                   | Map uses Arctic-appropriate projection, renders correctly at high latitudes | M    |
| Layer interaction | Feature query           | 1. Click features on the map<br>2. Check details panel    | Details panel shows attributes for Arctic layers                            | M    |

## GSC (Geological Survey of Canada)

Demo: `templates/demos-specific/demo-gsc.html`

| Test            | Description              | Steps                                              | Expected Result                                                           | Auto |
| --------------- | ------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------- | ---- |
| GSC layers load | Geological layers render | 1. Load `demo-gsc.html`<br>2. Observe map          | Geological Survey layers render on the map                                | M    |
| Initial view    | Configured zoom/center   | 1. Observe map extent on load                      | Map zooms to configured initial view (`zoomAndCenter: [10, [-87, 65.7]]`) | M    |
| Feature query   | Click GSC features       | 1. Click on GSC features<br>2. Check details panel | Attributes display in the details panel                                   | M    |

## CGDI Water Resources

Demo: `templates/demos-specific/demo-cgdi.html`

| Test             | Description            | Steps                                            | Expected Result                                                   | Auto |
| ---------------- | ---------------------- | ------------------------------------------------ | ----------------------------------------------------------------- | ---- |
| CGDI layers load | Water resources render | 1. Load `demo-cgdi.html`<br>2. Observe map       | Water resources layers render (mix of WMS/WFS services)           | M    |
| Multi-service    | Multiple endpoints     | 1. Check layers from different service endpoints | Layers from different service endpoints all render simultaneously | M    |
| Legend display   | All layers listed      | 1. Open legend panel                             | All layers appear with correct names                              | M    |

## World of Maps / NTS Search

Demo: `templates/demos-specific/demo-world-of-maps.html`

| Test              | Description           | Steps                                                  | Expected Result                                    | Auto |
| ----------------- | --------------------- | ------------------------------------------------------ | -------------------------------------------------- | ---- |
| Page loads        | Demo renders          | 1. Load `demo-world-of-maps.html`                      | Page renders without errors                        | M    |
| NTS grid          | Grid at zoom levels   | 1. If NTS grid layers are configured, zoom in/out      | NTS grid layers display at appropriate zoom levels | M    |
| Layer interaction | Feature info returned | 1. Click features on the map<br>2. Check details panel | Feature info is returned                           | M    |

## Flood Demo (EGS)

Demo: `templates/demos-specific/demo-flood.html`

| Test              | Description        | Steps                                                      | Expected Result                                                 | Auto |
| ----------------- | ------------------ | ---------------------------------------------------------- | --------------------------------------------------------------- | ---- |
| English map       | EN flood layers    | 1. Load `demo-flood.html`<br>2. Check map1 (English)       | English floods map loads and renders flood extent layers        | M    |
| French map        | FR flood layers    | 1. Check map2 (French)                                     | French floods map loads with French labels                      | M    |
| Layer types       | Mixed flood layers | 1. Observe layers on both maps                             | Mix of flood-related layers (imagery, vectors) render correctly | M    |
| No console errors | Clean load         | 1. Open browser console<br>2. Check for errors during load | No JavaScript errors in the console                             | M    |
