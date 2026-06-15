# 15 — Export

Map export functionality.

## Export Configs

Test with both export configs:

Config: `configs/navigator/demos/20-export-map-large-legend.json`

- [ ] **Export with large legend** — Open the export dialog. Verify the preview shows the map, legend, title, and other elements correctly.
- [ ] **Download** — Click export/download. Verify the image is saved correctly with all elements.

Config: `configs/navigator/demos/21-export-map-bad-legend.json`

- [ ] **Export with bad legend** — Open the export dialog. Verify it handles the bad legend gracefully (no crash, reasonable output).

## Export Content Verification

- [ ] **Map rendered** — Verify the exported image contains the map tiles and layers.
- [ ] **Legend included** — Verify the legend is included in the export.
- [ ] **Title** — Verify the map title is included (if configured).
- [ ] **North arrow** — Verify the north arrow is included in the export.
- [ ] **Scale bar** — Verify the scale bar is included.

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

---

## Issues Found

<!-- Record any issues below -->
