# 27 — Production Config Smoke Tests

Smoke tests for production-like configurations. These are real-world configs used by partner organizations. The goal is to verify no regressions — layers load, panels open, and no crashes occur.

## GeoDiscovery + Geochart

Demo: `templates/demos-specific/demo-geodiscovery-geochart.html`

- [ ] **Config dropdown loads** — Load the page. Verify the configuration dropdown lists all GeoDiscovery entries (EN/FR pairs).
- [ ] **Load EN config** — Select an English config (e.g., "Radionuclide Releases - Nuclear Processing Facilities"). Verify the map loads with layers and geochart configured.
- [ ] **Load FR config** — Select the French equivalent. Verify layers load with French names/labels.
- [ ] **Geochart interaction** — Click a feature. Verify the geochart panel shows chart data for the selected feature.
- [ ] **Switch configs** — Select a different config from the dropdown without reloading the page. Verify the map cleanly reinitializes with the new config.

## OSDP (Open Science Data Platform)

Demo pages: `templates/demos-specific/demo-osdp-*.html`

Spot-check a representative subset:

- [ ] **OSDP Air** (`demo-osdp-air.html`) — Load and verify layers render, no console errors.
- [ ] **OSDP Water** (`demo-osdp-water.html`) — Load and verify layers render, no console errors.
- [ ] **OSDP Climate** (`demo-osdp-climate.html`) — Load and verify layers render, no console errors.
- [ ] **OSDP Integration** (`demo-osdp-integration.html`) — Load and verify multiple OSDP configs load together.
- [ ] **OSDP Non-curated** (`demo-osdp-non-currated.html`) — Load and verify uncurated data sources load without crashes.
- [ ] **Layer interactivity** — On any OSDP page, click a feature. Verify details panel shows attributes.
- [ ] **Legend populated** — Verify the legend shows all configured layers with correct names.

## Open Maps

Demo: `templates/demos-specific/demo-open-maps.html`

- [ ] **Open Maps load** — Load the page. Verify the Open Maps configuration renders with all layers.
- [ ] **Layer types** — Verify the mix of layer types (geocore, WMS, Esri) all load correctly.
- [ ] **Panel interactions** — Open legend, click features, open data table. Verify no crashes.

Demo: `templates/demos-specific/demo-open-maps-wet.html`

- [ ] **WET integration** — Load the WET (Web Experience Toolkit) variant. Verify the GeoView map renders within the WET page framework.
- [ ] **No style conflicts** — Verify WET CSS does not break GeoView UI components (buttons, panels, fonts).

## Arctic SDI

Demo: `templates/demos-specific/demo-arctic-sdi.html`

- [ ] **Wetlands layer** — Verify the Arctic wetlands WFS layer loads and renders polygons.
- [ ] **Sea Ice Extent** — Verify the Sea Ice Extent (1979-2016) layer loads.
- [ ] **Arctic projection** — Verify the map uses an Arctic-appropriate projection and renders correctly at high latitudes.
- [ ] **Layer interaction** — Click features. Verify details panel shows attributes for Arctic layers.

## GSC (Geological Survey of Canada)

Demo: `templates/demos-specific/demo-gsc.html`

- [ ] **GSC layers load** — Load the page. Verify Geological Survey layers render on the map.
- [ ] **Initial view** — Verify the map zooms to the configured initial view (`zoomAndCenter: [10, [-87, 65.7]]`).
- [ ] **Feature query** — Click on GSC features. Verify attributes display in the details panel.

## CGDI Water Resources

Demo: `templates/demos-specific/demo-cgdi.html`

- [ ] **CGDI layers load** — Load the page. Verify water resources layers render (mix of WMS/WFS services).
- [ ] **Multi-service** — Verify layers from different service endpoints all render simultaneously.
- [ ] **Legend display** — Verify all layers appear in the legend with correct names.

## World of Maps / NTS Search

Demo: `templates/demos-specific/demo-world-of-maps.html`

- [ ] **Page loads** — Verify the World of Maps / NTS Search demo renders without errors.
- [ ] **NTS grid** — If NTS grid layers are configured, verify they display at appropriate zoom levels.
- [ ] **Layer interaction** — Click features on the map. Verify feature info is returned.

## Flood Demo (EGS)

Demo: `templates/demos-specific/demo-flood.html`

- [ ] **English map** — Verify the English floods map loads and renders flood extent layers.
- [ ] **French map** — Verify the French floods map loads with French labels.
- [ ] **Layer types** — Verify the mix of flood-related layers (imagery, vectors) render correctly.
- [ ] **No console errors** — Verify no JavaScript errors in the console during load.

## Function Event with Swiper

Config: `configs/OSDP/function-event-swiper.json`

- [ ] **Swiper with OSDP layers** — Load the config. Verify the swiper initializes with the configured layers.
- [ ] **Swiper interaction** — Drag the swiper divider. Verify layers compare correctly on each side.
- [ ] **Combined with events** — If the page has event monitoring, verify events fire correctly during swiper interaction.
