# 25 — Developer Tools

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-25-developer-tools.html](https://canadian-geospatial-platform.github.io/geoview/public/rt-25-developer-tools.html) — Links to ESRI Renderer and WFS Renderer demo pages.

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

> All Layer Zoom Levels tests moved to [08 — Layers](08-layers.md#all-layer-zoom-levels-comprehensive).
