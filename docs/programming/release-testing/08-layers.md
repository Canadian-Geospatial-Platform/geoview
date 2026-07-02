# 08 — Layers Panel

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-08-layers.html](../../packages/geoview-core/public/templates/release-testing/rt-08-layers.html) — Map 1 (groups + uniqueValue/classBreaks layers, collapse/expand/visibility buttons, layers in footer bar), Map 2 (WMS + ESRI Image for settings tests), Maps 3–8 (layer type configs: Esri Dynamic groups, projections, Vector Tiles, WKB, Shapefile, GeoJSON Multi).
>
> **Add Layer tests**: Use the [Add Layers demo page](../../packages/geoview-core/public/templates/demos/add-layers.html).
>
> **Navigator configs** (for detailed/edge-case tests): `layers/all-layers.json`, `layers/esri-feature.json`, `layers/wms.json`, `layers/esri-image.json`, `demos/23b-initial-settings-states-controls.json`, `demos/24-configured-feature-labels.json`, `demos/07-layer-zoom-levels.json`, `demos/08-all-layer-zoom-levels.json`, `layers/esri-dynamic-group-of-groups.json`, `layers/esri-dynamic-projections.json`, `layers/vector-tile.json`, `layers/wkb.json`, `layers/shapefile.json`, `layers/geojson-multi.json`

The Layers panel has two areas: the **left layer list** (reorder, visibility, collapse, delete) and the **right panel** (layer info, settings, shortcuts, actions). Delete uses a timer-based undo pattern — clicking delete starts a countdown; clicking undo cancels it.

---

## Left Panel — Layer List

### Reorder

Reorder uses **up/down arrow buttons** in edit mode (not drag-and-drop). First layer disables up arrow; last disables down arrow.

| Test                | Description          | Steps                                                               | Expected Result                                                                                        | Auto |
| ------------------- | -------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---- |
| Reorder layer       | Move layer up/down   | 1. On Map 1, select a layer<br>2. Click the up or down arrow button | Layer order updates in Layers, Legend, Data Table panels, and map draw order                           | C    |
| Reorder with groups | Hierarchy maintained | 1. On Map 1, reorder layers that include groups/subgroups           | Group hierarchy is maintained during reorder; child paths remain under parent in store `orderedLayers` | C    |

### Toggle All Controls

The ToggleAll component at the top provides collapse/expand all and toggle all visibility.

| Test         | Description         | Steps                                                                                | Expected Result           | Auto |
| ------------ | ------------------- | ------------------------------------------------------------------------------------ | ------------------------- | ---- |
| Collapse all | All groups collapse | 1. On Map 1, click the "Collapse All" button (or collapse icon in the ToggleAll bar) | All layer groups collapse | C    |
| Expand all   | All groups expand   | 1. On Map 1, click the "Expand All" button (or collapse icon again)                  | All layer groups expand   | C    |

### Loading Status

| Test                         | Description             | Steps                                                                           | Expected Result                                                 | Auto |
| ---------------------------- | ----------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---- |
| Circular progress on loading | Shows while layer loads | 1. Hard-refresh the test page<br>2. Watch the layer list on Map 1 while loading | Circular progress indicator appears on each loading layer entry | M    |
| Status complete              | Hides after load        | 1. Wait for all layers on Map 1 to finish loading                               | Circular progress disappears and status changes to loaded       | M    |

### Visibility

| Test                            | Description             | Steps                                                                    | Expected Result                                                                   | Auto |
| ------------------------------- | ----------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ---- |
| Toggle layer visibility         | Single layer on/off     | 1. On Map 1, toggle a leaf layer off<br>2. Toggle it on                  | Map and other panels update accordingly                                           | C    |
| Toggle group visibility         | Group hides children    | 1. On Map 1, toggle a group off                                          | Children hidden on map but show greyed out in panel with own visibility preserved | M    |
| Toggle all on group             | All children toggle     | 1. On Map 1, use "Toggle All" on a group with sublayers                  | All children toggle visibility together                                           | C    |
| Toggle all with error sublayers | Error sublayers skipped | 1. Load a config where some sublayers fail<br>2. Toggle all on the group | Error sublayers are skipped (no crash); valid sublayers toggle correctly          | C    |

### Remove Layer

The delete button uses a timer-based undo pattern — always visible, even for loading/processing/error layers.

| Test                  | Description             | Steps                                                                                                           | Expected Result                                   | Auto |
| --------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ---- |
| Remove layer in error | Error layer removable   | 1. On Map 1, if a layer fails to load, click delete on the error layer<br>2. Let the undo timer expire          | Layer is removed cleanly, no crash                | M    |
| Remove while loading  | Loading layer removable | 1. Hard-refresh the page, while a layer is still loading on Map 1, click delete<br>2. Let the undo timer expire | Layer is removed without errors or leftover state | M    |
| Undo remove           | Cancel deletion         | 1. On Map 1, click delete on a layer<br>2. Click undo before timer expires                                      | Layer is restored to its previous state           | M    |

---

## Add Layer

Demo page: `templates/demos/add-layers.html` (empty map in WM projection with projection selector)

### Add by URL

Test adding each supported layer type via URL:

| Test                         | Description | Steps                                                                          | Expected Result                                  | Auto |
| ---------------------------- | ----------- | ------------------------------------------------------------------------------ | ------------------------------------------------ | ---- |
| Esri Dynamic                 | Add by URL  | 1. Paste an Esri Dynamic MapServer URL<br>2. Select layer type<br>3. Click Add | Layer loads and renders on the map               | M    |
| Esri Feature (MapServer)     | Add by URL  | 1. Paste an Esri Feature MapServer URL                                         | Layer loads and renders                          | M    |
| Esri Feature (FeatureServer) | Add by URL  | 1. Paste an Esri Feature FeatureServer URL                                     | Layer loads and renders                          | M    |
| Esri Image                   | Add by URL  | 1. Paste an Esri Image URL                                                     | Layer loads and renders                          | M    |
| WMS                          | Add by URL  | 1. Paste a WMS GetCapabilities URL                                             | Layer loads and renders                          | M    |
| WFS                          | Add by URL  | 1. Paste a WFS URL                                                             | Layer loads and renders                          | M    |
| OGC Feature                  | Add by URL  | 1. Paste an OGC Feature API URL                                                | Layer loads and renders                          | M    |
| GeoJSON                      | Add by URL  | 1. Paste a GeoJSON URL                                                         | Layer loads and renders                          | M    |
| CSV                          | Add by URL  | 1. Paste a CSV URL                                                             | Layer loads and renders                          | M    |
| GeoPackage                   | Add by URL  | 1. Paste a GeoPackage URL                                                      | Layer loads and renders                          | M    |
| KML                          | Add by URL  | 1. Paste a KML URL                                                             | Layer loads and renders                          | M    |
| XYZ Tiles                    | Add by URL  | 1. Paste an XYZ Tiles URL                                                      | Layer loads and renders                          | M    |
| Vector Tiles                 | Add by URL  | 1. Paste a VectorTileServer URL                                                | Layer loads with Mapbox GL styles applied        | M    |
| WMTS                         | Add by URL  | 1. Paste a WMTS GetCapabilities URL                                            | Capabilities parsed and tiles render             | M    |
| Static Image                 | Add by URL  | 1. Paste a static image URL with extent                                        | Image renders at the correct geographic location | M    |
| Shapefile (ZIP)              | Add by URL  | 1. Paste a zipped shapefile URL                                                | Layer loads and renders                          | M    |
| WKB                          | Add by URL  | 1. Paste a WKB URL                                                             | Layer loads and renders                          | M    |
| GeoTIFF                      | Add by URL  | 1. Paste a GeoTIFF URL                                                         | Layer loads and renders as tiled raster          | M    |

### Add by File Upload (Drag & Drop)

Demo page: `templates/demos/add-layers.html`

| Test                | Description       | Steps                                                          | Expected Result                                | Auto |
| ------------------- | ----------------- | -------------------------------------------------------------- | ---------------------------------------------- | ---- |
| Drag GeoJSON        | File upload       | 1. Drag a `.geojson` file onto the dropzone                    | File accepted and layer loads                  | M    |
| Drag CSV            | File upload       | 1. Drag a `.csv` file (with lat/lon columns) onto the dropzone | Layer loads                                    | M    |
| Drag KML            | File upload       | 1. Drag a `.kml` file onto the dropzone                        | Layer loads                                    | M    |
| Drag GeoPackage     | File upload       | 1. Drag a `.gpkg` file onto the dropzone                       | Layer loads                                    | M    |
| Drag GeoTIFF        | File upload       | 1. Drag a `.tif` file onto the dropzone                        | Layer loads                                    | M    |
| Drag Shapefile ZIP  | File upload       | 1. Drag a `.zip` shapefile onto the dropzone                   | Layer loads                                    | M    |
| Reject invalid file | Error on bad file | 1. Drag an unsupported file (e.g., `.pdf`, `.docx`)            | File rejected with error message               | M    |
| Browse button       | File picker opens | 1. Click "Choose a File" button                                | File picker opens filtered to valid extensions | M    |

### Add by Geocore UUID

> Time slider auto-creation behavior tested in [17a — Time Slider](17a-package-time-slider.md#geocore-auto-creation). Geochart auto-creation behavior tested in [17b — Geochart](17b-package-geochart.md#geocore-auto-creation).

| Test                     | Description             | Steps                                                                   | Expected Result                                        | Auto |
| ------------------------ | ----------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------ | ---- |
| Add geocore layer        | UUID resolves           | 1. Enter a geocore UUID<br>2. Click Add                                 | Layer loads and renders                                | M    |
| Geocore with geochart    | Chart shortcut appears  | 1. Add a geocore layer with geochart config (e.g., Airborne)            | Layer loads and geochart shortcut becomes available    | M    |
| Geocore with time slider | Slider shortcut appears | 1. Add a geocore layer with time slider config (e.g., Wireless Network) | Layer loads and time slider shortcut becomes available | M    |
| Add duplicate UUID       | Rejected                | 1. Add the same geocore UUID a second time                              | Second add is rejected (not allowed)                   | C    |

### Add Layer in Different Projections

Demo page: `templates/demos/add-layers.html` (has projection selector dropdown)

| Test       | Description    | Steps                                          | Expected Result                   | Auto |
| ---------- | -------------- | ---------------------------------------------- | --------------------------------- | ---- |
| Add in LCC | Renders in LCC | 1. Switch to LCC (EPSG:3978)<br>2. Add a layer | Layer loads and renders correctly | M    |
| Add in WM  | Renders in WM  | 1. Switch to WM (EPSG:3857)<br>2. Add a layer  | Layer loads and renders correctly | M    |

### Error Handling

| Test               | Description | Steps                                                  | Expected Result                                | Auto |
| ------------------ | ----------- | ------------------------------------------------------ | ---------------------------------------------- | ---- |
| Bad URL            | Error shown | 1. Enter an invalid or unreachable URL<br>2. Click Add | Error message displayed; viewer does not crash | M    |
| Unsupported format | Error shown | 1. Enter a URL that resolves to unsupported format     | Appropriate error is shown                     | M    |

### Add Layer Type Detection

| Test                 | Description        | Steps                                                | Expected Result                                                                                                                                                                                            | Auto |
| -------------------- | ------------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Type dropdown        | All types listed   | 1. Open Add Layer<br>2. Open the layer type dropdown | All 16+ supported types listed (CSV, esriDynamic, esriFeature, esriImage, GeoJSON, GeoPackage, GeoTIFF, KML, OGC WMS, OGC WMTS, OGC WFS, WKB, OGC Feature, XYZ Tiles, Vector Tiles, Static Image, GeoCore) | C    |
| Auto-detect from URL | Type auto-selected | 1. Paste a known service URL (e.g., MapServer)       | Layer type is auto-detected in the dropdown                                                                                                                                                                | M    |

---

## Right Panel — Layer Info & Settings

### Layer Info Panel

| Test         | Description            | Steps                                           | Expected Result                                                           | Auto |
| ------------ | ---------------------- | ----------------------------------------------- | ------------------------------------------------------------------------- | ---- |
| Open info    | Right panel shows info | 1. On Map 1, select a layer in the left list    | Right panel opens with layer info (name, type, source URL, sublayer list) | M    |
| Correct info | Info matches config    | 1. Compare displayed info with the layer config | Layer name, service URL, projection match the config                      | M    |

### Shortcuts

Config: `configs/navigator/layers/all-layers.json` (has data-table tab)

Config (table disabled): `configs/navigator/demos/23b-initial-settings-states-controls.json` (`controls.table: false`)

| Test                             | Description                  | Steps                                                                                                                                  | Expected Result                                                                       | Auto |
| -------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---- |
| Data Table shortcut (footer tab) | Navigates to data-table tab  | 1. Load a config with `data-table` in footerBar<br>2. Click the data table shortcut on a layer                                         | Footer bar switches to the data-table tab for that layer                              | C    |
| Data Table shortcut (modal)      | Opens lightweight modal      | 1. Load a config WITHOUT `data-table` in footerBar<br>2. Click the data table shortcut on a layer                                      | A lightweight data table opens as a modal/dialog for that layer                       | M    |
| Data Table disabled              | Shortcut not rendered        | 1. Load `23b-initial-settings-states-controls.json`<br>2. Check the WFS layer with `table: false` (vector layer with table forced off) | Data Table shortcut button is not rendered (removed from DOM when control is `false`) | A    |
| Geochart shortcut                | Navigates to geochart tab    | 1. Load a config with geochart plugin and a layer with geochart config<br>2. Click the chart shortcut on that layer                    | Footer bar switches to the geochart tab with that layer selected                      | M    |
| Time Slider shortcut             | Navigates to time-slider tab | 1. Load a config with time-slider plugin and a time-aware layer<br>2. Click the time slider shortcut on that layer                     | Footer bar switches to the time-slider tab with that layer selected                   | M    |

### Actions

| Test                 | Description          | Steps                                                                | Expected Result                                                                     | Auto |
| -------------------- | -------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---- |
| Highlight layer      | Opacity boost on map | 1. On Map 1, click the highlight button<br>2. Click again to remove  | Layer is visually highlighted (opacity boost); clicking again removes the highlight | M    |
| Zoom to layer extent | Map zooms to bounds  | 1. On Map 1, click the zoom-to-extent button                         | Map zooms to that layer's geographic extent                                         | C    |
| Reload layer         | Layer re-renders     | 1. On Map 1, click the reload button                                 | Progress indicator appears, layer re-renders after reload                           | M    |
| Remove layer         | Layer removed        | 1. On Map 1, click the remove button<br>2. Let the undo timer expire | Layer removed from map and all panels                                               | C    |

### Opacity

| Test                 | Description            | Steps                                                                               | Expected Result                                | Auto |
| -------------------- | ---------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------- | ---- |
| Layer opacity slider | Opacity changes on map | 1. On Map 1, adjust a single layer's opacity slider                                 | Map rendering changes opacity accordingly      | M    |
| Group opacity        | Children capped        | 1. On Map 1, set opacity on a group layer                                           | All children are capped by the group's opacity | C    |
| Nested group opacity | Child capped by parent | 1. On Map 1, set opacity on parent group<br>2. Set different opacity on child group | Child opacity is capped by parent opacity      | C    |
| Opacity reset        | Full opacity restored  | 1. On Map 1, set opacity back to 100%                                               | Full opacity restored on map                   | M    |

### Group Layer — Right Panel

| Test                    | Description            | Steps                                                               | Expected Result                                       | Auto |
| ----------------------- | ---------------------- | ------------------------------------------------------------------- | ----------------------------------------------------- | ---- |
| Select group info       | Group info shown       | 1. On Map 1, select a group layer in the left panel                 | Right panel shows group info with child layers listed | M    |
| Toggle child from right | Child toggles          | 1. On Map 1, toggle a child layer's visibility from the right panel | Map and legend update accordingly                     | C    |
| Toggle group from right | Group toggles children | 1. On Map 1, toggle the group's own visibility from the right panel | All children hidden on map (greyed out in legend)     | M    |

### Style Classes Visibility

| Test                   | Description           | Steps                                                                                         | Expected Result                                 | Auto |
| ---------------------- | --------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------- | ---- |
| Toggle style class     | Class hides on map    | 1. On Map 1, in the right panel, toggle a style class off for a uniqueValue/classBreaks layer | That class disappears from the map              | C    |
| Style class count      | Shows "y of x"        | 1. On Map 1, check the style class count display                                              | Shows "y of x classes" reflecting visible count | C    |
| Toggle all classes off | No features render    | 1. On Map 1, turn off all style classes                                                       | No features render for that layer               | C    |
| Toggle all classes on  | All features reappear | 1. On Map 1, turn all back on                                                                 | All features reappear                           | C    |

### Settings Panel Navigation

| Test          | Description           | Steps                                 | Expected Result                       | Auto |
| ------------- | --------------------- | ------------------------------------- | ------------------------------------- | ---- |
| Open settings | Settings panel opens  | 1. Click the settings icon on a layer | Right panel opens with layer settings | M    |
| Back button   | Returns to layer info | 1. Click back button                  | Returns to the layer info view        | M    |

### Hoverable / Queryable

Config: `configs/navigator/demos/23b-initial-settings-states-controls.json` (layers with `hoverable: false`, `queryable: false`)

| Test              | Description      | Steps                                  | Expected Result                                            | Auto |
| ----------------- | ---------------- | -------------------------------------- | ---------------------------------------------------------- | ---- |
| Set hoverable off | No hover tooltip | 1. Disable hoverable in layer settings | Hover tooltip no longer appears for that layer             | M    |
| Set queryable off | No click query   | 1. Disable queryable in layer settings | Clicking on map does not query that layer in Details panel | M    |
| Re-enable both    | Restored         | 1. Turn hoverable/queryable back on    | Hover tooltip and click query work again                   | M    |

### Text Labelling

Config: `configs/navigator/demos/24-configured-feature-labels.json` (ESRI Feature with `layerText` config: Arial 12pt bold italic, halo, declutter)

> Label rendering accuracy (field, styling, zoom) tested in [09 — Styles](09-styles.md#feature-labels).

| Test              | Description             | Steps                                          | Expected Result                           | Auto |
| ----------------- | ----------------------- | ---------------------------------------------- | ----------------------------------------- | ---- |
| Labels present    | Text labels on features | 1. Load the label config                       | Text labels appear on features on the map | M    |
| Toggle labels off | Labels disappear        | 1. Toggle text labelling off in layer settings | Labels disappear from the map             | M    |
| Toggle labels on  | Labels reappear         | 1. Toggle back on                              | Labels reappear on the map                | M    |

### WMS Layer Settings

| Test               | Description            | Steps                                                        | Expected Result                                                 | Auto |
| ------------------ | ---------------------- | ------------------------------------------------------------ | --------------------------------------------------------------- | ---- |
| WMS style selector | Styles listed as cards | 1. On Map 2, open settings for a WMS layer in the layers tab | Available WMS styles listed as cards with legend preview images | M    |
| Switch WMS style   | Map re-renders         | 1. On Map 2, select a different WMS style                    | Map re-renders with the new style                               | M    |

### Esri Image Layer Settings

| Test                     | Description               | Steps                                                                        | Expected Result                                                      | Auto |
| ------------------------ | ------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---- |
| Raster function selector | Functions listed as cards | 1. On Map 2, open settings for the ESRI Image layer in the layers tab        | Raster functions listed as cards with preview images                 | M    |
| Switch raster function   | Map re-renders            | 1. On Map 2, select a different raster function (e.g., NDVI)                 | Map re-renders with the new function                                 | M    |
| Mosaic rule configurator | Settings available        | 1. On Map 2, check the mosaic rule settings                                  | Mosaic rule settings available (method dropdown, operation dropdown) | M    |
| Change mosaic method     | Map updates               | 1. On Map 2, change the mosaic method (e.g., Center, Nadir, NorthWest)       | Map updates with the new mosaic method                               | M    |
| Change mosaic operation  | Map updates               | 1. On Map 2, change the mosaic operation (e.g., First, Last, Min, Max, Mean) | Map updates with the new operation                                   | M    |

### Layer Zoom Levels

Config: `configs/navigator/demos/07-layer-zoom-levels.json` (ESRI Dynamic with `minScale: 10000000`, group with `minZoom: 5`, child with `minZoom: 7, maxZoom: 10`)

| Test                  | Description         | Steps                                   | Expected Result               | Auto |
| --------------------- | ------------------- | --------------------------------------- | ----------------------------- | ---- |
| Layer appears at zoom | Visible in range    | 1. Zoom to the configured visible range | Layer appears on the map      | M    |
| Layer disappears      | Hidden out of range | 1. Zoom outside the visible range       | Layer disappears from the map | M    |

### All Layer Zoom Levels (Comprehensive)

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

### Layer Type Edge Cases

| Test                           | Description                  | Steps                                                          | Expected Result                                                                  | Auto |
| ------------------------------ | ---------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---- |
| Vector tile projection warning | Warning on projection switch | 1. Load a map with a vector tile layer<br>2. Switch projection | A notification warns that vector tile layers do not support projection switching | C    |

---

## Layer Type Configs

These tests validate specific layer types using dedicated navigator configs. For "Add by URL" tests with empty maps, see [Add by URL](#add-by-url) above.

### Esri Dynamic — Group of Groups

Config: `configs/navigator/layers/esri-dynamic-group-of-groups.json`

| Test                         | Description               | Steps                                                                                   | Expected Result                                                      | Auto |
| ---------------------------- | ------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---- |
| Deeply nested groups         | Multi-level hierarchy     | 1. Load the navigator with `esri-dynamic-group-of-groups.json`<br>2. Expand legend tree | Multi-level group hierarchy renders correctly (groups within groups) | M    |
| Expand/collapse nested       | Tree navigation           | 1. Click expand/collapse arrows on nested groups<br>2. Navigate the tree                | Tree structure is fully navigable at all levels                      | M    |
| Visibility per level         | Parent/child visibility   | 1. Toggle visibility at different nesting levels<br>2. Observe map and child icons      | Parent hide hides all descendants; children show greyed-out state    | M    |
| Feature query on nested leaf | Query deeply nested layer | 1. Click on a feature from a deeply nested layer<br>2. Check details panel              | Correct layer path and attributes displayed                          | M    |

### Esri Dynamic — Projections

Config: `configs/navigator/layers/esri-dynamic-projections.json`

| Test                       | Description                  | Steps                                                                            | Expected Result                                                       | Auto |
| -------------------------- | ---------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---- |
| Load in default projection | Initial render               | 1. Load the navigator with `esri-dynamic-projections.json`<br>2. Observe the map | Esri Dynamic layers render correctly in the configured projection     | M    |
| Switch projection          | Re-request in new projection | 1. Switch to a different projection via footer bar<br>2. Observe map tiles       | Layers re-request tiles in the new projection and render correctly    | M    |
| No artifacts               | Clean projection switch      | 1. After switching projection<br>2. Pan/zoom the map                             | No leftover tiles or rendering artifacts from the previous projection | M    |

### Vector Tiles

Config: `configs/navigator/layers/vector-tile.json`

| Test                        | Description               | Steps                                                               | Expected Result                                                 | Auto |
| --------------------------- | ------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------- | ---- |
| Vector tile load            | Layers render             | 1. Load the navigator with `vector-tile.json`<br>2. Observe the map | Vector tile layers (CBCT French, CBMT English) render correctly | M    |
| Style URL                   | Style applied from URL    | 1. Observe tile rendering (colors, line weights, labels)            | `styleUrl` is fetched and applied — correct visual appearance   | M    |
| Multiple vector tile layers | Independent toggle        | 1. Toggle each vector tile layer in legend                          | Both layers can be toggled independently                        | M    |
| Zoom interaction            | Level-of-detail rendering | 1. Zoom in and out<br>2. Observe tile detail                        | Vector tiles re-render at appropriate detail levels             | M    |

### WKB (Well-Known Binary)

Config: `configs/navigator/layers/wkb.json`

| Test                        | Description         | Steps                                                             | Expected Result                                                           | Auto |
| --------------------------- | ------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------- | ---- |
| WKB from metadataAccessPath | Hex string geometry | 1. Load the navigator with `wkb.json`<br>2. Check first WKB layer | Layer loads geometry from the hex string in `metadataAccessPath`          | M    |
| WKB from dataAccessPath     | Data path geometry  | 1. Check the second WKB layer                                     | Layer loads geometry from `source.dataAccessPath`                         | M    |
| Geometry display            | Polygons render     | 1. Observe the map                                                | Both WKB polygons (South Africa shapes) render correctly                  | M    |
| Initial view layerIds       | Map zooms to extent | 1. Observe map extent on initial load                             | Map zooms to the WKB layer extent (configured via `initialView.layerIds`) | M    |

### Shapefile (ZIP)

Config: `configs/navigator/layers/shapefile.json`

| Test                        | Description               | Steps                                                                                                  | Expected Result                                                  | Auto |
| --------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | ---- |
| Local shapefile ZIP         | Local ZIP loads           | 1. Load the navigator with `shapefile.json`<br>2. Check local shapefile layer                          | Crown Harvest Plans shapefile loads and renders polygons         | M    |
| Remote shapefile            | Remote fetch and render   | 1. Check the remote shapefile layer                                                                    | Wildfire HotSpots from `cwfis.cfs.nrcan.gc.ca` loads and renders | M    |
| Shapefile with custom style | UniqueValue style         | 1. Check the shapefile with `layerStyle` (uniqueValue on "SOURCE")<br>2. Compare legend icons with map | Renders with correct icon styles per source category             | M    |
| Multi-file shapefile        | Specific layerId from ZIP | 1. Check the shapefile with specific `layerId` entry (e.g., "sunchild_aquifer_py_tm")                  | Correct layer extracted from the multi-file ZIP                  | M    |

### GeoJSON Multi

Config: `configs/navigator/layers/geojson-multi.json`

| Test                    | Description                | Steps                                                                      | Expected Result                                   | Auto |
| ----------------------- | -------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------- | ---- |
| Multiple GeoJSON layers | All layers render          | 1. Load the navigator with `geojson-multi.json`<br>2. Check legend and map | All configured GeoJSON layers render              | M    |
| Mixed geometry types    | Point/line/polygon display | 1. Observe map for different geometry types                                | Points, lines, and polygons all display correctly | M    |
| Independent visibility  | Toggle each layer          | 1. Toggle each GeoJSON layer in legend<br>2. Observe map                   | Each layer toggles independently                  | M    |

### Layer Filter Combination

Tests the four-source filter system (class + time + data + config) combined with AND logic.

| Test                          | Description                     | Steps                                                                                                           | Expected Result                                                                     | Auto |
| ----------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---- |
| Style class filter            | Toggle class filters data table | 1. On Map 1, toggle a style class off for a uniqueValue layer<br>2. Open data table for that layer              | Data table rows filtered to exclude the toggled-off class                           | C    |
| Combined class + data filter  | Both filters apply              | 1. Toggle a style class off<br>2. Apply a column filter in data table<br>3. Check map rendering                 | Map shows only features matching both filters (AND logic)                           | C    |
| Clear all filters             | Filters reset                   | 1. Re-enable all style classes<br>2. Clear data table filters                                                   | All features reappear on map and in data table                                      | C    |

### Opacity Hierarchical Capping

| Test                              | Description                    | Steps                                                                                               | Expected Result                                                           | Auto |
| --------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---- |
| Parent caps child opacity         | Child limited by parent        | 1. On Map 1, set a group to 50% opacity<br>2. Set a child layer to 100%                            | Child renders at 50% (capped by parent)                                   | C    |
| Restore after parent reset        | Full opacity restored          | 1. Set parent group back to 100%<br>2. Check child opacity                                          | Child renders at its own opacity value (100%)                             | C    |
| Highlight opacity snapshot        | Opacity preserved after highlight | 1. Highlight a layer<br>2. Remove highlight<br>3. Check all sibling layer opacities                | All layers return to their pre-highlight opacity values                    | C    |
