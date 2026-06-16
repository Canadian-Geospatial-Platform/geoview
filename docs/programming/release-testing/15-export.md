# 15 — Export

Map export functionality.

## Export Configs

Test with both export configs:

Config: `configs/navigator/demos/20-export-map-large-legend.json`

- [ ] **Export with large legend** — Open the export dialog. Verify the preview shows the map, legend, title, and other elements correctly.
- [ ] **Download** — Click export/download. Verify the image is saved correctly with all elements.

Config: `configs/navigator/demos/21-export-map-bad-legend.json`

- [ ] **Export with bad legend** — Open the export dialog. Verify it handles the bad legend gracefully (no crash, reasonable output).

## Export Modal Options

- [ ] **Modal opens** — Click the export button in the app bar. Verify the export modal dialog opens with a map preview.
- [ ] **Title input** — Enter a custom title. Verify it appears in the export preview.
- [ ] **Format selector** — Verify format options are available (PNG, JPEG, PDF).
- [ ] **Resolution selector** — Verify resolution options are available and changing resolution updates the preview.
- [ ] **North arrow toggle** — Toggle north arrow inclusion. Verify it appears/disappears in the preview.
- [ ] **Scale bar toggle** — Toggle scale bar. Verify it appears/disappears in the preview.
- [ ] **Legend toggle** — Toggle legend inclusion. Verify it appears/disappears in the preview.
- [ ] **Disabled during loading** — While layers are still loading, verify the export button is disabled.

## Export Content Verification

- [ ] **Map rendered** — Export the map and open the downloaded file. Verify it contains the map tiles and layers.
- [ ] **All elements present** — With all toggles enabled, verify the exported image includes the title, legend, north arrow, and scale bar.

## Export by Layer Type

Test export with each layer type loaded:

- [ ] **Esri Dynamic layers** — Export a map with Esri Dynamic layers.
- [ ] **Esri Feature layers** — Export with Esri Feature layers.
- [ ] **WMS layers** — Export with WMS layers.
- [ ] **GeoJSON layers** — Export with GeoJSON layers.
- [ ] **CSV layers** — Export with CSV layers.
- [ ] **WFS layers** — Export with WFS layers.
- [ ] **GeoTIFF layers** — Export with GeoTIFF raster layers.
- [ ] **KML layers** — Export with KML layers.
- [ ] **XYZ Tile layers** — Export with XYZ tile layers.
- [ ] **Vector Tile layers** — Export with vector tile layers.

## Export Formats

- [ ] **Export as PNG** — Export the map as PNG. Verify the file downloads and opens correctly.
- [ ] **Export as JPEG** — Export the map as JPEG. Verify the file downloads and opens correctly.
- [ ] **Export as PDF** — Export the map as PDF. Verify the file downloads and opens correctly.
