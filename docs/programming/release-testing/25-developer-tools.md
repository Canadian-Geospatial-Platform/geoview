# 25 — Developer Tools

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.

Testing the ESRI Renderer and WFS Renderer conversion tools that generate valid GeoView style configurations from external service metadata.

## ESRI Renderer Style Configuration Tool

Demo: `templates/demos/demo-esri-renderer.html`

| Test                     | Description             | Steps                                                                                                         | Expected Result                                                                                            | Auto |
| ------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---- |
| Page loads               | Editor renders          | 1. Load `demo-esri-renderer.html`                                                                             | CodeMirror editor and input fields render correctly                                                        | M    |
| Paste ESRI renderer JSON | Valid input accepted    | 1. Paste a valid ESRI renderer JSON (uniqueValue or classBreaks) into the input area                          | Input is accepted without errors                                                                           | M    |
| Generate GeoView style   | Conversion output       | 1. Click the generate/convert button                                                                          | Output produces a valid GeoView `layerStyle` JSON block                                                    | M    |
| UniqueValue renderer     | UniqueValue conversion  | 1. Paste an ESRI uniqueValue renderer<br>2. Generate output                                                   | Output contains `"type": "uniqueValue"` with correct `fields`, `info` entries (labels, values, visibility) | M    |
| ClassBreaks renderer     | ClassBreaks conversion  | 1. Paste an ESRI classBreaks renderer<br>2. Generate output                                                   | Output contains `"type": "classBreaks"` with correct `minValue`, `maxValue`, and class info entries        | M    |
| Simple renderer          | Simple conversion       | 1. Paste an ESRI simple renderer<br>2. Generate output                                                        | Output contains `"type": "simple"` with correct symbol configuration                                       | M    |
| Copy output              | Output usable in config | 1. Copy the generated output<br>2. Paste into a GeoView config `listOfLayerEntryConfig[].layerStyle` property | Valid JSON that works without modification                                                                 | M    |
| Invalid input            | Error handling          | 1. Paste invalid JSON or a non-renderer object<br>2. Observe the UI                                           | Error message is shown (no crash)                                                                          | M    |

## WFS Renderer Style Configuration Tool

Demo: `templates/demos/demo-wfs-renderer.html`

| Test                           | Description            | Steps                                                            | Expected Result                                                              | Auto |
| ------------------------------ | ---------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---- |
| Page loads                     | Editor renders         | 1. Load `demo-wfs-renderer.html`                                 | CodeMirror editor, service URL input, and controls render correctly          | M    |
| Fetch DescribeFeatureType      | XML response loaded    | 1. Enter a valid WFS service URL<br>2. Click fetch               | XML response is loaded into the editor                                       | M    |
| Parse feature type             | Fields listed          | 1. After fetching, observe the field list                        | Available feature type fields (string, numeric, etc.) are listed for styling | M    |
| Generate style from field      | Style JSON generated   | 1. Select a field and configure style rules<br>2. Click generate | Valid GeoView `layerStyle` JSON is generated                                 | M    |
| UniqueValue from string field  | String field styling   | 1. Select a string field<br>2. Generate a uniqueValue style      | Output has correct field reference and value entries                         | M    |
| ClassBreaks from numeric field | Numeric field styling  | 1. Select a numeric field<br>2. Generate a classBreaks style     | Output has correct min/max ranges                                            | M    |
| Invalid URL                    | Error on bad URL       | 1. Enter a bad URL<br>2. Click fetch                             | Error is shown without crashing                                              | M    |
| Non-WFS URL                    | Non-WFS error handling | 1. Enter a URL to a non-WFS service<br>2. Click fetch            | Appropriate error handling (no crash)                                        | M    |

## All Layer Zoom Levels (Comprehensive)

Config: `configs/navigator/demos/08-all-layer-zoom-levels.json`

This config tests zoom and scale constraints across ALL layer types simultaneously.

| Test                               | Description                   | Steps                                                                                        | Expected Result                                                                    | Auto |
| ---------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---- |
| All layers visible at default zoom | Layers in range               | 1. Load the navigator with `08-all-layer-zoom-levels.json`<br>2. Check legend                | All configured layers are visible at the default zoom level (within their range)   | M    |
| maxZoom cap (zoom level 8)         | Layers disappear past max     | 1. Zoom beyond level 8<br>2. Check legend for greyed-out layers                              | Layers with `maxZoom: 8` disappear (greyed out in legend, `inVisibleRange: false`) | M    |
| minScale threshold                 | Scale-based disappearance     | 1. Zoom in until scale denominator drops below 10,000,000<br>2. Check legend                 | Layers with `minScale: 10000000` disappear                                         | M    |
| Combined constraint                | Most restrictive wins         | 1. Test layers with both zoom and scale constraints<br>2. Observe which limit triggers first | Both constraints apply independently — the most restrictive one wins               | M    |
| Layer types tested                 | All types respect limits      | 1. Check each layer type in legend at various zooms                                          | GeoJSON, Esri Dynamic, Esri Feature, WMS, WFS all respect zoom/scale limits        | M    |
| Group with hidden child            | Visibility + zoom constraints | 1. Check group (`point-feature-group`) with a child that has `visible: false` + maxZoom      | Both visibility and zoom constraints are respected correctly                       | M    |
