# 25 — CDTK, RCS & Geocore Custom Configs

Testing specialized service types: CDTK (Cloud Data Toolkit / QGIS), RCS (Remote Config Service), and Geocore with inline/VCS custom overrides.

## CDTK WMS Services

Config: `configs/navigator/layers/wms-cdtk-basic.json`

- [ ] **CDTK WMS basic load** — Load the CDTK WMS basic config (QGIS services). Verify all layers load from `qgis-stage.cdtk.geogc.ca`.
- [ ] **fetchVectorsOnWFS: false** — Verify the `fetchVectorsOnWFS: false` flag prevents WFS vector fetching for these WMS layers (no feature queries via WFS).
- [ ] **Layer renders** — Verify raster tiles render correctly on the map (Airborne, Major Projects, etc.).

Config: `configs/navigator/layers/wms-cdtk.json`

- [ ] **CDTK WMS with Geocore** — Load the full CDTK WMS config (includes a geocore layer alongside QGIS layers). Verify both geocore and CDTK layers load.
- [ ] **Custom featureInfo config** — Verify `source.featureInfo.nameField` is respected for layers that define it (e.g., "project_name_en").
- [ ] **Out fields** — Verify layers with `outfields` only display the specified fields in the details/data table.

> Core nameField/outfields behavior tested in [10 — Details](10-details.md#summary--out-fields). This section verifies the same feature works with CDTK service configs.

## CDTK WFS Services

Config: `configs/navigator/layers/wfs-cdtk-basic.json`

- [ ] **CDTK WFS basic load** — Load the CDTK WFS basic config. Verify all WFS layers load from `qgis-stage.cdtk.geogc.ca`.
- [ ] **fetchStylesOnWMS: false** — Verify the `fetchStylesOnWMS: false` flag prevents WMS style fetching for these WFS layers.
- [ ] **Custom inline style** — Verify the layer with custom `layerStyle` (e.g., uniqueValue on "project_cat_en") renders with the correct symbols and colors.
- [ ] **Multiple entries per layer** — Verify layers with multiple `listOfLayerEntryConfig` entries (e.g., "completed", "terminated", "pending") all appear.

Config: `configs/navigator/layers/wfs-cdtk.json`

- [ ] **CDTK WFS with featureInfo** — Load the full CDTK WFS config. Verify `nameField` and `outfields` configurations are applied correctly.
- [ ] **Query features** — Click on features. Verify the details panel shows the correct field names and values as configured.

## RCS (Remote Config Service)

Config: `configs/navigator/layers/rcs-gcgeo.json`

- [ ] **RCS layer type** — Load the config with `geoviewLayerType: "rcs"`. Verify the layer resolves and renders on the map.
- [ ] **UUID resolution** — Verify the RCS UUID (`fe83a604-aa5a-4e46-903c-685f8b0cc33c`) resolves to a valid layer configuration from the RCS service.
- [ ] **Legend display** — Verify the RCS layer appears in the legend with correct name and icons.
- [ ] **Feature query** — Click on features. Verify the details panel shows feature information.

## Geocore with Custom Inline Config

Config: `configs/navigator/layers/geocore-custom-inline-config.json`

- [ ] **UUID with layer ID override** — Load the config. Verify the geocore UUID resolves but uses the custom `listOfLayerEntryConfig` to select specific sublayers instead of the default set.
- [ ] **Custom groups** — Verify the custom group structure (e.g., "CESI - Water Quantity Group", "CESI - Water Quality Group") is reflected in the legend tree.
- [ ] **Custom initial settings on sublayers** — Verify sublayers with `initialSettings.states.visible: false` start hidden.
- [ ] **Custom layer styles** — If custom `layerStyle` is defined on sub-entries, verify it overrides the default service style.
- [ ] **Custom layer names** — Verify `geoviewLayerName` override ("CESI") takes precedence over the geocore-resolved name.

## Geocore with VCS Custom Config

Config: `configs/navigator/layers/geocore-custom.json`

- [ ] **VCS override resolution** — Load the config. Verify the geocore UUIDs resolve and that VCS-published customizations are applied (time slider configs, geochart configs, etc.).
- [ ] **Multiple geocore layers** — Verify both UUID entries load independently and appear in the legend.
- [ ] **VCS package configs** — If the VCS response includes time-slider or geochart package configs, verify the corresponding plugins initialize for those layers.

## Geocore WMS

Config: `configs/navigator/layers/geocore-wms.json`

- [ ] **Geocore resolving to WMS** — Load the config. Verify the geocore UUID resolves to a WMS layer type and renders correctly.
- [ ] **WMS legend image** — Verify the legend panel shows the WMS GetLegendGraphic image for the resolved layer.
- [ ] **WMS GetFeatureInfo** — Click on the layer. Verify feature info is returned via WMS GetFeatureInfo.

## Esri Dynamic — Group of Groups

Config: `configs/navigator/layers/esri-dynamic-group-of-groups.json`

- [ ] **Deeply nested groups** — Load the config. Verify the multi-level group hierarchy renders correctly in the legend (groups within groups).
- [ ] **Expand/collapse nested** — Expand and collapse nested groups. Verify the tree structure is navigable.
- [ ] **Visibility per level** — Toggle visibility at different nesting levels. Verify parent/child visibility rules apply correctly (parent hide hides all descendants).
- [ ] **Feature query on nested leaf** — Click on a feature from a deeply nested layer. Verify the details panel shows the correct layer path and attributes.

## Esri Dynamic — Projections

Config: `configs/navigator/layers/esri-dynamic-projections.json`

- [ ] **Load in default projection** — Load the config. Verify Esri Dynamic layers render correctly in the configured projection.
- [ ] **Switch projection** — Switch to a different projection. Verify Esri Dynamic layers re-request tiles in the new projection and render correctly.
- [ ] **No artifacts** — After projection switch, verify no leftover tiles or rendering artifacts from the previous projection.

## Vector Tiles

Config: `configs/navigator/layers/vector-tile.json`

> Basic layer type loading (add by URL) tested in [08 — Layers](08-layers.md#add-by-url).

- [ ] **Vector tile load** — Load the config. Verify vector tile layers (CBCT French Basemap, CBMT English Basemap) render correctly.
- [ ] **Style URL** — Verify the `styleUrl` is fetched and applied to the vector tiles (correct colors, line weights, labels).
- [ ] **Multiple vector tile layers** — Verify both configured vector tile layers can be toggled independently in the legend.
- [ ] **Zoom interaction** — Zoom in/out. Verify vector tiles re-render at appropriate detail levels.

## WKB (Well-Known Binary)

Config: `configs/navigator/layers/wkb.json`

- [ ] **WKB from metadataAccessPath** — Verify the first WKB layer loads geometry from the hex string in `metadataAccessPath`.
- [ ] **WKB from dataAccessPath** — Verify the second WKB layer loads geometry from `source.dataAccessPath`.
- [ ] **Geometry display** — Verify both WKB polygons (South Africa shapes) render correctly on the map.
- [ ] **Initial view layerIds** — Verify the map zooms to the WKB layer extent on load (configured via `initialView.layerIds`).

## Shapefile (ZIP)

Config: `configs/navigator/layers/shapefile.json`

- [ ] **Local shapefile ZIP** — Verify the local shapefile ZIP (Crown Harvest Plans) loads and renders polygons.
- [ ] **Remote shapefile** — Verify the remote shapefile (Wildfire HotSpots from `cwfis.cfs.nrcan.gc.ca`) loads.
- [ ] **Shapefile with custom style** — Verify the shapefile with `layerStyle` (uniqueValue on "SOURCE") renders with correct icon styles.
- [ ] **Multi-file shapefile** — Verify shapefiles with specific `layerId` entries (e.g., "sunchild_aquifer_py_tm") extract the correct layer from the ZIP.

## GeoJSON Multi

Config: `configs/navigator/layers/geojson-multi.json`

- [ ] **Multiple GeoJSON layers** — Load the config. Verify all configured GeoJSON layers render.
- [ ] **Mixed geometry types** — Verify layers with different geometry types (points, lines, polygons) all display correctly.
- [ ] **Independent visibility** — Toggle each GeoJSON layer independently in the legend.
