# 24 — CDTK, RCS & Geocore Custom Configs

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-24-cdtk-rcs-geocore-custom.html](../../packages/geoview-core/public/templates/release-testing/rt-24-cdtk-rcs-geocore-custom.html)

Testing specialized service types: CDTK (Cloud Data Toolkit / QGIS), RCS (Remote Config Service), and Geocore with inline/VCS custom overrides.

> Layer type configs (Esri Dynamic groups, Vector Tiles, WKB, Shapefile, GeoJSON Multi) moved to [08 — Layers](08-layers.md#layer-type-configs).

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

RCS is a geocore variant designed for VPN environments. It uses the same UUID resolution but through a different internal service endpoint.

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
