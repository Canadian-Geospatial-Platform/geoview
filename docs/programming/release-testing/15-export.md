# 15 — Export

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-15-export.html](../../packages/geoview-core/public/templates/release-testing/rt-15-export.html) — Map 1 (export button in app bar, multiple layers for legend).
>
> **Navigator config** (for large legend): `demos/20-export-map-large-legend.json`

Map export functionality. The export modal renders the current map canvas with auto-included elements (legend, north arrow, scale bar, attribution, disclaimer). User-configurable options are: title text, format (PNG/JPEG/PDF), DPI (96/150/300 for raster), and JPEG quality (50–100%). There are NO toggles to disable legend, north arrow, or scale bar — they are always included.

## Export Modal

Config: `configs/navigator/layers/all-layers.json` (app bar visible, layers loaded)

| Test                    | Description                       | Steps                                                                                | Expected Result                                                            | Auto |
| ----------------------- | --------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- | ---- |
| Modal opens             | Export dialog appears             | 1. Click the export button in the app bar (top-right)                                | Export modal opens with a map preview showing all auto-included elements   | M    |
| Disabled during loading | Button disabled while layers load | 1. Reload the page<br>2. Before layers finish loading, check the export button state | Export button is disabled (greyed out) until all layers finish loading     | M    |
| Title input             | Custom title in preview           | 1. Enter a custom title in the title text field                                      | Title appears at the top of the export preview                             | M    |
| Format selector         | Three formats available           | 1. Open the format dropdown                                                          | Three options available: PNG, JPEG, PDF                                    | M    |
| DPI selector (PNG/JPEG) | Resolution options available      | 1. Select PNG or JPEG format<br>2. Open the DPI dropdown                             | Three options: 96, 150, 300 DPI — changing DPI updates the preview quality | M    |
| DPI locked for PDF      | No DPI selector for PDF           | 1. Select PDF format                                                                 | DPI selector is hidden or locked (PDF always exports at 300 DPI)           | M    |
| JPEG quality slider     | Quality adjustable                | 1. Select JPEG format<br>2. Adjust the quality slider                                | Quality slider appears (50–100%, default 90%) — only visible for JPEG      | M    |

## Export Content Verification

Config: `configs/navigator/layers/all-layers.json`

| Test                 | Description                    | Steps                                                         | Expected Result                                                                                  | Auto |
| -------------------- | ------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---- |
| Map rendered         | Map visible in export          | 1. Export the map (any format)<br>2. Open the downloaded file | File contains the map tiles and rendered layers                                                  | M    |
| All elements present | Auto-included elements visible | 1. Check the exported file                                    | Export includes: map, legend (multi-column), north arrow, scale bar, attribution, and disclaimer | M    |

## Export with Large Legend

Config: `configs/navigator/demos/20-export-map-large-legend.json` (4 layer groups with many legend items — tests column distribution algorithm)

| Test                  | Description             | Steps                     | Expected Result                                                                    | Auto |
| --------------------- | ----------------------- | ------------------------- | ---------------------------------------------------------------------------------- | ---- |
| Large legend layout   | Legend columns balanced | 1. Open the export dialog | Preview shows the legend distributed across multiple columns with balanced heights | M    |
| Download large legend | File saved correctly    | 1. Export and download    | Image/PDF saved correctly with all legend items visible in column layout           | M    |

## Export with Edge-Case Legend

Config: `configs/navigator/demos/21-export-map-bad-legend.json` (10 mixed layers including GeoCore UUIDs with unpredictable metadata — tests handling of problematic legend data)

| Test             | Description              | Steps                     | Expected Result                                                                             | Auto |
| ---------------- | ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- | ---- |
| Edge-case legend | No crash on bad metadata | 1. Open the export dialog | Export handles unusual/problematic legend metadata gracefully — no crash, reasonable output | M    |

## Export by Layer Type

Export uses html2canvas to capture the live map canvas, so all layer types render identically. Test with each type to verify no rendering gaps:

Config: Use the per-layer-type configs in `configs/navigator/layers/` (e.g., `esri-dynamic.json`, `wms.json`, `geojson.json`, etc.)

| Test                | Description              | Steps                                          | Expected Result                                      | Auto |
| ------------------- | ------------------------ | ---------------------------------------------- | ---------------------------------------------------- | ---- |
| Esri Dynamic layers | Export renders correctly | 1. Load Esri Dynamic layer config<br>2. Export | Esri Dynamic layers appear in the exported image     | M    |
| Esri Feature layers | Export renders correctly | 1. Load Esri Feature layer config<br>2. Export | Esri Feature layers appear in the exported image     | M    |
| WMS layers          | Export renders correctly | 1. Load WMS layer config<br>2. Export          | WMS layers appear in the exported image              | M    |
| GeoJSON layers      | Export renders correctly | 1. Load GeoJSON layer config<br>2. Export      | GeoJSON vector features appear in the exported image | M    |
| CSV layers          | Export renders correctly | 1. Load CSV layer config<br>2. Export          | CSV point features appear in the exported image      | M    |
| WFS layers          | Export renders correctly | 1. Load WFS layer config<br>2. Export          | WFS features appear in the exported image            | M    |
| GeoTIFF layers      | Export renders correctly | 1. Load GeoTIFF layer config<br>2. Export      | GeoTIFF raster data appears in the exported image    | M    |
| XYZ Tile layers     | Export renders correctly | 1. Load XYZ tile layer config<br>2. Export     | XYZ tiles appear in the exported image               | M    |
| Vector Tile layers  | Export renders correctly | 1. Load vector tile layer config<br>2. Export  | Vector tile features appear in the exported image    | M    |

## Export Formats

Config: `configs/navigator/layers/all-layers.json`

| Test           | Description     | Steps                                    | Expected Result                                           | Auto |
| -------------- | --------------- | ---------------------------------------- | --------------------------------------------------------- | ---- |
| Export as PNG  | PNG file valid  | 1. Select PNG format<br>2. Click export  | PNG file downloads and opens correctly in an image viewer | M    |
| Export as JPEG | JPEG file valid | 1. Select JPEG format<br>2. Click export | JPEG file downloads and opens correctly                   | M    |
| Export as PDF  | PDF file valid  | 1. Select PDF format<br>2. Click export  | PDF file downloads and opens correctly in a PDF reader    | M    |
