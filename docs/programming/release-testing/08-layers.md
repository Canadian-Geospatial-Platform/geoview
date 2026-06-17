# 08 — Layers Panel

The Layers panel has two areas: the **left layer list** (reorder, visibility, collapse) and the **right panel** (layer info, settings, shortcuts, actions).

---

## Left Panel — Layer List

### Reorder

- [ ] **Reorder layer** — Select a layer in the Layers panel. Use the reorder arrows (up/down) to move it. Verify:
  - The layer order updates in the Layers panel
  - The Legend panel reflects the new order
  - The Data Table layer list reflects the new order
  - The map draw order updates (top layer renders on top)
- [ ] **Reorder with groups** — Reorder layers that include groups, subgroups, and nested children. Verify the hierarchy is maintained.

### Show All / Collapse All

- [ ] **Collapse all** — Click "Collapse All". Verify all layer groups collapse.
- [ ] **Show all** — Click "Show All". Verify all layer groups expand.

### Loading Status

- [ ] **Green on loading** — While layers load, verify the status indicator shows green (loading).
- [ ] **Circular progress on loading** — Verify a circular progress indicator appears on each loading layer entry.
- [ ] **Status complete** — After loading, verify status changes to loaded and the circular progress disappears.

### Visibility

- [ ] **Toggle layer visibility** — Toggle a leaf layer off/on. Verify map and other panels update.
- [ ] **Toggle group visibility** — Toggle a group off. Verify children are hidden on map but show greyed out in the panel.
- [ ] **Toggle all visibility** — Use "Toggle All" on a group with sublayers. Verify all children toggle.
- [ ] **Toggle all with error sublayers** — Toggle all on a group that has some sublayers in error. Verify error sublayers are skipped (no crash), valid sublayers toggle correctly.

### Remove Layer

- [ ] **Remove layer in error** — A layer that failed to load (error status) should be removable from the left panel. Verify the layer is removed and no crash occurs.
- [ ] **Remove layer while loading** — Remove a layer while it is still loading (circular progress visible). Verify the layer is removed cleanly without errors or leftover state.

---

## Add Layer

Demo page: `templates/demos/add-layers.html`

### Add by URL

Test adding each supported layer type via URL:

- [ ] **Esri Dynamic** — Add an Esri Dynamic layer by URL. Verify it loads and renders.
- [ ] **Esri Feature (MapServer)** — Add an Esri Feature layer using a MapServer URL. Verify it loads.
- [ ] **Esri Feature (FeatureServer)** — Add an Esri Feature layer using a FeatureServer URL. Verify it loads.
- [ ] **Esri Image** — Add an Esri Image layer by URL. Verify it loads.
- [ ] **WMS** — Add a WMS layer by URL. Verify it loads.
- [ ] **WFS** — Add a WFS layer by URL. Verify it loads.
- [ ] **OGC Feature** — Add an OGC Feature API layer by URL. Verify it loads.
- [ ] **GeoJSON** — Add a GeoJSON layer by URL. Verify it loads.
- [ ] **CSV** — Add a CSV layer by URL. Verify it loads.
- [ ] **GeoPackage** — Add a GeoPackage layer by URL. Verify it loads.
- [ ] **KML** — Add a KML layer by URL. Verify it loads.
- [ ] **XYZ Tiles** — Add an XYZ Tiles layer by URL. Verify it loads.
- [ ] **Vector Tiles** — Add a Vector Tiles layer by URL (ArcGIS VectorTileServer). Verify it loads and Mapbox GL styles are applied.
- [ ] **WMTS** — Add a WMTS layer by URL (OGC GetCapabilities). Verify capabilities are parsed and tiles render.
- [ ] **Static Image** — Add a Static Image layer by URL with extent. Verify the image renders at the correct geographic location.
- [ ] **Shapefile (ZIP)** — Add a zipped Shapefile layer by URL. Verify it loads and renders.
- [ ] **WKB** — Add a WKB layer by URL. Verify it loads and renders.
- [ ] **GeoTIFF** — Add a GeoTIFF layer by URL. Verify it loads and renders as a tiled raster.

### Add by File Upload (Drag & Drop)

Demo page: `templates/demos/add-layers.html`

- [ ] **Drag GeoJSON** — Drag a `.geojson` file onto the dropzone. Verify it is accepted and the layer loads.
- [ ] **Drag CSV** — Drag a `.csv` file (with lat/lon columns) onto the dropzone. Verify it loads.
- [ ] **Drag KML** — Drag a `.kml` file onto the dropzone. Verify it loads.
- [ ] **Drag GeoPackage** — Drag a `.gpkg` file onto the dropzone. Verify it loads.
- [ ] **Drag GeoTIFF** — Drag a `.tif` file onto the dropzone. Verify it loads.
- [ ] **Drag Shapefile ZIP** — Drag a `.zip` shapefile onto the dropzone. Verify it loads.
- [ ] **Reject invalid file** — Drag an unsupported file (e.g., `.pdf`, `.docx`). Verify it is rejected with an error message.
- [ ] **Browse button** — Click "Choose a File" button. Verify the file picker opens filtered to valid extensions.

### Add by Geocore UUID

> Time slider auto-creation behavior tested in [17a — Time Slider](17a-package-time-slider.md#geocore-auto-creation). Geochart auto-creation behavior tested in [17b — Geochart](17b-package-geochart.md#geocore-auto-creation).

- [ ] **Add geocore layer** — Add a layer via geocore UUID. Verify it loads.
- [ ] **Add geocore layer with geochart** — Add a geocore layer that has geochart config (e.g., Airborne). Verify the layer loads and the geochart shortcut becomes available.
- [ ] **Add geocore layer with time slider** — Add a geocore layer that has time slider config (e.g., Wireless Network). Verify the layer loads and the time slider shortcut becomes available.
- [ ] **Add duplicate UUID** — Try to add the same geocore UUID a second time. Verify it is rejected (not allowed).

### Add Layer in Different Projections

- [ ] **Add in LCC** — Switch to LCC (EPSG:3978) and add a layer. Verify it loads and renders correctly.
- [ ] **Add in WM** — Switch to WM (EPSG:3857) and add a layer. Verify it loads and renders correctly.

### Error Handling

- [ ] **Bad URL** — Enter an invalid or unreachable URL. Verify an error message is displayed and the viewer does not crash.
- [ ] **Unsupported format** — Try to add a URL that resolves to an unsupported format. Verify an appropriate error is shown.

### Add Layer Type Detection

- [ ] **Type dropdown** — Open Add Layer. Verify the layer type dropdown lists all 15+ supported types (CSV, esriDynamic, esriFeature, esriImage, GeoJSON, GeoTIFF, imageStatic, KML, xyzTiles, vectorTiles, ogcFeature, ogcWfs, WKB, ogcWms, ogcWmts).
- [ ] **Auto-detect from URL** — Paste a known service URL (e.g., MapServer). Verify the type is auto-detected.

---

## Right Panel — Layer Info & Settings

### Layer Info Panel

- [ ] **Open info** — Select a layer in the left list. Verify the right panel opens with the layer info (name, type, source URL, sublayer list).
- [ ] **Correct info** — Verify the displayed information matches the layer config (layer name, service URL, projection, etc.).

### Shortcuts

- [ ] **Data Table shortcut** — Click the data table shortcut. Verify the Data Table panel opens for that layer.
- [ ] **Data Table disabled** — Config: `configs/navigator/demos/23b-initial-settings-states-controls.json` (WMS layer `OGC WFS - All controls off` has `table: false`).
- [ ] **Geochart shortcut** — For a layer with geochart config, click the chart shortcut. Verify the Geochart panel opens for that layer.
- [ ] **Time Slider shortcut** — For a time-aware layer, click the time slider shortcut. Verify the Time Slider panel opens for that layer.

### Actions

- [ ] **Highlight layer** — Click the highlight button. Verify the layer is visually highlighted on the map (opacity boost). Click again to remove.
- [ ] **Zoom to layer extent** — Click the zoom-to-extent button. Verify the map zooms to that layer's extent.
- [ ] **Reload layer** — Click the reload button. Verify the layer reloads (progress indicator appears, then layer re-renders).
- [ ] **Remove layer** — Click the remove button (if available). Verify the layer is removed from the map and all panels.

### Opacity

- [ ] **Layer opacity slider** — Adjust a single layer's opacity. Verify the map rendering changes.
- [ ] **Group opacity** — Set opacity on a group layer. Verify all children are capped by the group's opacity.
- [ ] **Nested group opacity** — Set opacity on parent group, then set different opacity on child group. Verify the child is capped by the parent.
- [ ] **Opacity reset** — Set opacity back to 100%. Verify full opacity restored.

### Group Layer — Right Panel Visibility

- [ ] **Select group in left panel** — Select a group layer in the left panel. Verify the right panel shows group info with its child layers listed.
- [ ] **Toggle child visibility from right panel** — Toggle a child layer's visibility from the right panel. Verify the map and legend update accordingly.
- [ ] **Toggle group visibility from right panel** — Toggle the group's own visibility from the right panel. Verify all children are hidden on the map (greyed out in legend).

### Style Classes Visibility

- [ ] **Toggle style class** — In the right panel for a layer with unique value or class breaks style, toggle visibility of individual style classes. Verify that class disappears from the map.
- [ ] **Style class count** — Verify the legend shows the count of visible classes (e.g., "3 of 5 classes").
- [ ] **Toggle all classes off** — Turn off all style classes. Verify no features render for that layer.
- [ ] **Toggle all classes on** — Turn all back on. Verify features reappear.

### Settings Panel Navigation

- [ ] **Open settings** — Click the settings icon on a layer. Verify the right panel opens with settings.
- [ ] **Back button** — Click back to return to the layer info.

### Hoverable / Queryable

Config: `configs/navigator/demos/23b-initial-settings-states-controls.json`

- [ ] **Set hoverable off** — In layer settings, disable hoverable. Verify hover tooltip no longer appears for that layer.
- [ ] **Set queryable off** — Disable queryable. Verify clicking on the map does not query that layer in the Details panel.
- [ ] **Re-enable** — Turn hoverable/queryable back on. Verify they work again.

### Text Labelling

Config: `configs/navigator/demos/24-configured-feature-labels.json`

> Label rendering accuracy (field, styling, zoom) tested in [09 — Styles](09-styles.md#feature-labels).

- [ ] **Labels present** — Verify text labels appear on features on the map.
- [ ] **Toggle labels off** — Toggle text labelling off in layer settings. Verify labels disappear.
- [ ] **Toggle labels on** — Toggle back on. Verify labels reappear.

### WMS Layer Settings

Config: `configs/navigator/layers/wms.json`

- [ ] **WMS style selector** — Open settings for a WMS layer. Verify available WMS styles are listed as cards with legend preview images.
- [ ] **Switch WMS style** — Select a different WMS style. Verify the map re-renders with the new style.

### Esri Image Layer Settings

Config: `configs/navigator/layers/esri-image.json`

- [ ] **Raster function selector** — Open settings for an Esri Image layer. Verify raster functions are listed as cards with preview images.
- [ ] **Switch raster function** — Select a different raster function (e.g., NDVI, Vegetation Index). Verify the map re-renders with the new function.
- [ ] **Mosaic rule configurator** — Verify the mosaic rule settings are available (method dropdown, operation dropdown).
- [ ] **Change mosaic method** — Change the mosaic method (e.g., Center, Nadir, NorthWest). Verify the map updates.
- [ ] **Change mosaic operation** — Change the mosaic operation (e.g., First, Last, Min, Max, Mean). Verify the map updates.

### Layer Zoom Levels

Config: `configs/navigator/demos/07-layer-zoom-levels.json`

- [ ] **Layer appears at zoom** — Zoom to the configured visible range. Verify the layer appears.
- [ ] **Layer disappears** — Zoom outside the visible range. Verify the layer disappears.
- [ ] **`inVisibleRange` store check** — Open the store and verify `inVisibleRange` is `false` when zoomed out of range and `true` when in range.
- [ ] **OL layer visibility** — Check `getOLLayer().isVisible()` — should be `false` out of range, `true` in range.
