# 26 — Developer Tools

Testing the ESRI Renderer and WFS Renderer conversion tools that generate valid GeoView style configurations from external service metadata.

## ESRI Renderer Style Configuration Tool

Demo: `templates/demos/demo-esri-renderer.html`

- [ ] **Page loads** — Load the page. Verify the CodeMirror editor and input fields render correctly.
- [ ] **Paste ESRI renderer JSON** — Paste a valid ESRI renderer JSON (uniqueValue or classBreaks) into the input area. Verify it is accepted without errors.
- [ ] **Generate GeoView style** — Click the generate/convert button. Verify the output produces a valid GeoView `layerStyle` JSON block.
- [ ] **UniqueValue renderer** — Paste an ESRI uniqueValue renderer. Verify the output contains `"type": "uniqueValue"` with correct `fields`, `info` entries (labels, values, visibility).
- [ ] **ClassBreaks renderer** — Paste an ESRI classBreaks renderer. Verify the output contains `"type": "classBreaks"` with correct `minValue`, `maxValue`, and class info entries.
- [ ] **Simple renderer** — Paste an ESRI simple renderer. Verify the output contains `"type": "simple"` with the correct symbol configuration.
- [ ] **Copy output** — Verify the generated output can be copied and pasted into a GeoView config `listOfLayerEntryConfig[].layerStyle` property without modification.
- [ ] **Invalid input** — Paste invalid JSON or a non-renderer object. Verify an error message is shown (no crash).

## WFS Renderer Style Configuration Tool

Demo: `templates/demos/demo-wfs-renderer.html`

- [ ] **Page loads** — Load the page. Verify the CodeMirror editor, service URL input, and controls render correctly.
- [ ] **Fetch DescribeFeatureType** — Enter a valid WFS service URL and click fetch. Verify the XML response is loaded into the editor.
- [ ] **Parse feature type** — After fetching, verify the tool lists available feature type fields (string, numeric, etc.) that can be used for styling.
- [ ] **Generate style from field** — Select a field and configure style rules. Verify a valid GeoView `layerStyle` JSON is generated.
- [ ] **UniqueValue from string field** — Select a string field and generate a uniqueValue style. Verify the output has correct field reference and value entries.
- [ ] **ClassBreaks from numeric field** — Select a numeric field and generate a classBreaks style. Verify the output has correct min/max ranges.
- [ ] **Invalid URL** — Enter a bad URL and click fetch. Verify an error is shown without crashing.
- [ ] **Non-WFS URL** — Enter a URL to a non-WFS service. Verify appropriate error handling.

## All Layer Zoom Levels (Comprehensive)

Config: `configs/navigator/demos/08-all-layer-zoom-levels.json`

This config tests zoom and scale constraints across ALL layer types simultaneously.

- [ ] **All layers visible at default zoom** — Load the config. Verify all configured layers are visible at the default zoom level (within their range).
- [ ] **maxZoom cap (zoom level 8)** — Zoom beyond level 8. Verify layers with `maxZoom: 8` disappear (greyed out in legend, `inVisibleRange: false`).
- [ ] **minScale threshold** — Zoom in until the map scale denominator drops below 10,000,000. Verify layers with `minScale: 10000000` disappear.
- [ ] **Combined constraint** — Verify that BOTH constraints apply independently — the most restrictive one wins (layer disappears when either limit is exceeded).
- [ ] **Layer types tested** — Verify the following layer types all respect zoom/scale limits: GeoJSON, Esri Dynamic, Esri Feature, WMS, WFS.
- [ ] **Group with hidden child** — Verify the group (`point-feature-group`) with a child that has `visible: false` + maxZoom correctly respects both visibility and zoom constraints.
