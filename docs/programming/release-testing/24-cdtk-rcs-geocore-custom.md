# 24 — CDTK, RCS & Geocore Custom Configs

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.

Testing specialized service types: CDTK (Cloud Data Toolkit / QGIS), RCS (Remote Config Service), and Geocore with inline/VCS custom overrides.

## CDTK WMS Services

Config: `configs/navigator/layers/wms-cdtk-basic.json`

| Test                     | Description                  | Steps                                                                                    | Expected Result                                                                  | Auto |
| ------------------------ | ---------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---- |
| CDTK WMS basic load      | QGIS WMS layers load         | 1. Load the navigator with `wms-cdtk-basic.json`<br>2. Check layer panel                 | All layers load from `qgis-stage.cdtk.geogc.ca`                                  | M    |
| fetchVectorsOnWFS: false | Prevents WFS vector fetching | 1. With same config loaded<br>2. Click on a layer feature<br>3. Observe network requests | No WFS GetFeature requests are made; feature queries use WMS GetFeatureInfo only | M    |
| Layer renders            | Raster tiles display         | 1. With same config loaded<br>2. Observe the map                                         | Raster tiles render correctly (Airborne, Major Projects, etc.)                   | M    |

Config: `configs/navigator/layers/wms-cdtk.json`

| Test                      | Description             | Steps                                                                                                               | Expected Result                                        | Auto |
| ------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---- |
| CDTK WMS with Geocore     | Mixed source config     | 1. Load the navigator with `wms-cdtk.json`<br>2. Check layer panel                                                  | Both geocore and CDTK layers load and appear in legend | M    |
| Custom featureInfo config | nameField respected     | 1. Click on a feature in a layer with `nameField` config (e.g., "project_name_en")<br>2. Check details panel header | Feature name uses the configured `nameField` value     | M    |
| Out fields                | Limits displayed fields | 1. Click on a feature in a layer with `outfields` config<br>2. Check details panel / data table                     | Only the specified fields are displayed                | M    |

> Core nameField/outfields behavior tested in [10 — Details](10-details.md#summary--out-fields). This section verifies the same feature works with CDTK service configs.

## CDTK WFS Services

Config: `configs/navigator/layers/wfs-cdtk-basic.json`

| Test                       | Description                 | Steps                                                                                               | Expected Result                                                 | Auto |
| -------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---- |
| CDTK WFS basic load        | QGIS WFS layers load        | 1. Load the navigator with `wfs-cdtk-basic.json`<br>2. Check layer panel                            | All WFS layers load from `qgis-stage.cdtk.geogc.ca`             | M    |
| fetchStylesOnWMS: false    | Prevents WMS style fetching | 1. With same config loaded<br>2. Observe network requests during load                               | No WMS GetMap/GetLegendGraphic style requests are made          | M    |
| Custom inline style        | UniqueValue style renders   | 1. Check the layer with `layerStyle` (uniqueValue on "project_cat_en")<br>2. Observe legend and map | Renders with correct symbols and colors per category            | M    |
| Multiple entries per layer | Multiple sublayer entries   | 1. Expand a layer with multiple `listOfLayerEntryConfig` entries<br>2. Check legend                 | All entries appear (e.g., "completed", "terminated", "pending") | M    |

Config: `configs/navigator/layers/wfs-cdtk.json`

| Test                      | Description                     | Steps                                                                  | Expected Result                                               | Auto |
| ------------------------- | ------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------- | ---- |
| CDTK WFS with featureInfo | nameField and outfields applied | 1. Load the navigator with `wfs-cdtk.json`<br>2. Click on a feature    | Details panel shows configured field names and limited fields | M    |
| Query features            | Feature details display         | 1. Click on different features across layers<br>2. Check details panel | Correct field names and values shown as per config            | M    |

## RCS (Remote Config Service)

Config: `configs/navigator/layers/rcs-gcgeo.json`

| Test            | Description                 | Steps                                                             | Expected Result                                                                     | Auto |
| --------------- | --------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---- |
| RCS layer type  | RCS resolves and renders    | 1. Load the navigator with `rcs-gcgeo.json`<br>2. Observe the map | Layer resolves from RCS service and renders on the map                              | M    |
| UUID resolution | RCS UUID lookup             | 1. With same config loaded<br>2. Observe network requests         | UUID `fe83a604-aa5a-4e46-903c-685f8b0cc33c` resolves to a valid layer configuration | M    |
| Legend display  | RCS layer in legend         | 1. Open legend panel                                              | RCS layer appears with correct name and icons                                       | M    |
| Feature query   | Click features on RCS layer | 1. Click on a feature<br>2. Check details panel                   | Feature information is displayed                                                    | M    |

## Geocore with Custom Inline Config

Config: `configs/navigator/layers/geocore-custom-inline-config.json`

| Test                        | Description               | Steps                                                                                                 | Expected Result                                                                                       | Auto |
| --------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---- |
| UUID with layer ID override | Custom sublayer selection | 1. Load the navigator with `geocore-custom-inline-config.json`<br>2. Check legend                     | Geocore UUID resolves but only custom `listOfLayerEntryConfig` sublayers appear (not the default set) | M    |
| Custom groups               | Group structure in legend | 1. Expand the layer tree in legend                                                                    | Custom group structure appears (e.g., "CESI - Water Quantity Group", "CESI - Water Quality Group")    | M    |
| Custom initial settings     | Sublayer starts hidden    | 1. Check sublayers with `initialSettings.states.visible: false`<br>2. Observe legend visibility icons | Those sublayers start with visibility off (eye icon crossed)                                          | M    |
| Custom layer styles         | Style override applied    | 1. If custom `layerStyle` is defined on sub-entries<br>2. Observe map rendering and legend icons      | Custom style overrides the default service style                                                      | M    |
| Custom layer names          | geoviewLayerName override | 1. Check the root layer name in legend                                                                | Displays "CESI" (custom name) instead of the geocore-resolved name                                    | M    |

## Geocore with VCS Custom Config

Config: `configs/navigator/layers/geocore-custom.json`

| Test                    | Description                | Steps                                                                                           | Expected Result                                                                         | Auto |
| ----------------------- | -------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---- |
| VCS override resolution | VCS customizations applied | 1. Load the navigator with `geocore-custom.json`<br>2. Check legend and plugins                 | Geocore UUIDs resolve with VCS-published customizations (time slider, geochart configs) | M    |
| Multiple geocore layers | Both UUIDs load            | 1. Check legend panel                                                                           | Both UUID entries load independently and appear in legend                               | M    |
| VCS package configs     | Plugin initialization      | 1. If VCS response includes time-slider or geochart configs<br>2. Check corresponding plugin UI | Plugins initialize for those layers (time slider bar, geochart icon)                    | M    |

## Geocore WMS

Config: `configs/navigator/layers/geocore-wms.json`

| Test                     | Description            | Steps                                                           | Expected Result                                               | Auto |
| ------------------------ | ---------------------- | --------------------------------------------------------------- | ------------------------------------------------------------- | ---- |
| Geocore resolving to WMS | UUID resolves as WMS   | 1. Load the navigator with `geocore-wms.json`<br>2. Observe map | Geocore UUID resolves to WMS layer type and renders correctly | M    |
| WMS legend image         | GetLegendGraphic shown | 1. Open legend panel<br>2. Expand the layer                     | Legend shows WMS GetLegendGraphic image                       | M    |
| WMS GetFeatureInfo       | Feature query via WMS  | 1. Click on the layer<br>2. Check details panel                 | Feature info returned via WMS GetFeatureInfo                  | M    |

## Esri Dynamic — Group of Groups

Config: `configs/navigator/layers/esri-dynamic-group-of-groups.json`

| Test                         | Description               | Steps                                                                                   | Expected Result                                                      | Auto |
| ---------------------------- | ------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---- |
| Deeply nested groups         | Multi-level hierarchy     | 1. Load the navigator with `esri-dynamic-group-of-groups.json`<br>2. Expand legend tree | Multi-level group hierarchy renders correctly (groups within groups) | M    |
| Expand/collapse nested       | Tree navigation           | 1. Click expand/collapse arrows on nested groups<br>2. Navigate the tree                | Tree structure is fully navigable at all levels                      | M    |
| Visibility per level         | Parent/child visibility   | 1. Toggle visibility at different nesting levels<br>2. Observe map and child icons      | Parent hide hides all descendants; children show greyed-out state    | M    |
| Feature query on nested leaf | Query deeply nested layer | 1. Click on a feature from a deeply nested layer<br>2. Check details panel              | Correct layer path and attributes displayed                          | M    |

## Esri Dynamic — Projections

Config: `configs/navigator/layers/esri-dynamic-projections.json`

| Test                       | Description                  | Steps                                                                            | Expected Result                                                       | Auto |
| -------------------------- | ---------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---- |
| Load in default projection | Initial render               | 1. Load the navigator with `esri-dynamic-projections.json`<br>2. Observe the map | Esri Dynamic layers render correctly in the configured projection     | M    |
| Switch projection          | Re-request in new projection | 1. Switch to a different projection via footer bar<br>2. Observe map tiles       | Layers re-request tiles in the new projection and render correctly    | M    |
| No artifacts               | Clean projection switch      | 1. After switching projection<br>2. Pan/zoom the map                             | No leftover tiles or rendering artifacts from the previous projection | M    |

## Vector Tiles

Config: `configs/navigator/layers/vector-tile.json`

> Basic layer type loading (add by URL) tested in [08 — Layers](08-layers.md#add-by-url).

| Test                        | Description               | Steps                                                               | Expected Result                                                 | Auto |
| --------------------------- | ------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------- | ---- |
| Vector tile load            | Layers render             | 1. Load the navigator with `vector-tile.json`<br>2. Observe the map | Vector tile layers (CBCT French, CBMT English) render correctly | M    |
| Style URL                   | Style applied from URL    | 1. Observe tile rendering (colors, line weights, labels)            | `styleUrl` is fetched and applied — correct visual appearance   | M    |
| Multiple vector tile layers | Independent toggle        | 1. Toggle each vector tile layer in legend                          | Both layers can be toggled independently                        | M    |
| Zoom interaction            | Level-of-detail rendering | 1. Zoom in and out<br>2. Observe tile detail                        | Vector tiles re-render at appropriate detail levels             | M    |

## WKB (Well-Known Binary)

Config: `configs/navigator/layers/wkb.json`

| Test                        | Description         | Steps                                                             | Expected Result                                                           | Auto |
| --------------------------- | ------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------- | ---- |
| WKB from metadataAccessPath | Hex string geometry | 1. Load the navigator with `wkb.json`<br>2. Check first WKB layer | Layer loads geometry from the hex string in `metadataAccessPath`          | M    |
| WKB from dataAccessPath     | Data path geometry  | 1. Check the second WKB layer                                     | Layer loads geometry from `source.dataAccessPath`                         | M    |
| Geometry display            | Polygons render     | 1. Observe the map                                                | Both WKB polygons (South Africa shapes) render correctly                  | M    |
| Initial view layerIds       | Map zooms to extent | 1. Observe map extent on initial load                             | Map zooms to the WKB layer extent (configured via `initialView.layerIds`) | M    |

## Shapefile (ZIP)

Config: `configs/navigator/layers/shapefile.json`

| Test                        | Description               | Steps                                                                                                  | Expected Result                                                  | Auto |
| --------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | ---- |
| Local shapefile ZIP         | Local ZIP loads           | 1. Load the navigator with `shapefile.json`<br>2. Check local shapefile layer                          | Crown Harvest Plans shapefile loads and renders polygons         | M    |
| Remote shapefile            | Remote fetch and render   | 1. Check the remote shapefile layer                                                                    | Wildfire HotSpots from `cwfis.cfs.nrcan.gc.ca` loads and renders | M    |
| Shapefile with custom style | UniqueValue style         | 1. Check the shapefile with `layerStyle` (uniqueValue on "SOURCE")<br>2. Compare legend icons with map | Renders with correct icon styles per source category             | M    |
| Multi-file shapefile        | Specific layerId from ZIP | 1. Check the shapefile with specific `layerId` entry (e.g., "sunchild_aquifer_py_tm")                  | Correct layer extracted from the multi-file ZIP                  | M    |

## GeoJSON Multi

Config: `configs/navigator/layers/geojson-multi.json`

| Test                    | Description                | Steps                                                                      | Expected Result                                   | Auto |
| ----------------------- | -------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------- | ---- |
| Multiple GeoJSON layers | All layers render          | 1. Load the navigator with `geojson-multi.json`<br>2. Check legend and map | All configured GeoJSON layers render              | M    |
| Mixed geometry types    | Point/line/polygon display | 1. Observe map for different geometry types                                | Points, lines, and polygons all display correctly | M    |
| Independent visibility  | Toggle each layer          | 1. Toggle each GeoJSON layer in legend<br>2. Observe map                   | Each layer toggles independently                  | M    |
