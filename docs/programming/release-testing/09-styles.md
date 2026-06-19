# 09 — Styles

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-09-styles.html](../../packages/geoview-core/public/templates/release-testing/rt-09-styles.html) — Map 1 (GeoJSON polygons + classBreaks + simple layer).
>
> **Navigator configs** (for detailed visual tests): `layers/geojson.json`, `demos/25-feature-visual-variables.json`, `demos/26-complex-classifications.json`, `demos/28-symbol-shapes-fill-patterns.json`, `demos/24-configured-feature-labels.json`

Style rendering, visual variables, classification, symbol shapes, fill patterns, and feature labels.

## Polygon GeoJSON

Config: `configs/navigator/layers/geojson.json` (GeoJSON polygons layer `polygons.json` in EPSG:3978)

| Test             | Description            | Steps                                        | Expected Result                                            | Auto |
| ---------------- | ---------------------- | -------------------------------------------- | ---------------------------------------------------------- | ---- |
| Ontario polygons | Polygon styles visible | 1. Load `geojson.json`<br>2. Zoom to Ontario | 2 polygon styles visible in Ontario (check legend and map) | M    |

## Visual Variables

Config: `configs/navigator/demos/25-feature-visual-variables.json` (esriFeature layers: WindDirection NOAA METAR, historical-flood with `colorInfo`, `sizeInfo`, `opacityInfo` mapped to `OBJECTID`)

| Test              | Description                     | Steps                                                                      | Expected Result                                              | Auto |
| ----------------- | ------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------ | ---- |
| Size variation    | Features vary by attribute      | 1. Load the visual variables config<br>2. Check the historical-flood layer | Features vary in size based on `OBJECTID` (8 to 16)          | M    |
| Color variation   | Color gradient applied          | 1. Check the historical-flood layer                                        | Features vary in color from red to blue based on `OBJECTID`  | M    |
| Opacity variation | Opacity gradient applied        | 1. Check the historical-flood layer                                        | Features vary in opacity from 0.5 to 1.0 based on `OBJECTID` | M    |
| Legend accuracy   | Legend matches visual variables | 1. Open the legend panel                                                   | Legend accurately represents the visual variable ranges      | M    |

## Complex Classifications

Config: `configs/navigator/demos/26-complex-classifications.json` (WMS/WFS function styles, esriDynamic/esriFeature valueExpression, uniqueValue by decade: 1600s–2000s)

| Test                     | Description                     | Steps                                                                         | Expected Result                                                                         | Auto |
| ------------------------ | ------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---- |
| Unique value style       | Distinct symbols per category   | 1. Load the complex classifications config<br>2. Check the ESRI Feature layer | Layers with uniqueValue classification render distinct symbols per category (by decade) | M    |
| Value expression         | Expression-based classification | 1. Check the ESRI Dynamic layer                                               | Layer with valueExpression classification renders correctly                             | M    |
| Function style (WMS/WFS) | Filter functions applied        | 1. Check the WMS and WFS layers                                               | Layers with function-style filters render correctly                                     | M    |

## Symbol Shapes & Fill Patterns

Config: `configs/navigator/demos/28-symbol-shapes-fill-patterns.json` (classBreaks by `Red` field: Circle, Diamond, Square, Triangle, Star, Plus, X; 8 polygon fill patterns: solid, backwardDiagonal, cross, diagonalCross, forwardDiagonal, horizontal, vertical, null)

| Test          | Description           | Steps                                                         | Expected Result                                                                                                                   | Auto |
| ------------- | --------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Shape symbols | All shapes render     | 1. Load the symbol shapes config<br>2. Check each point layer | All symbol shapes render correctly (circle, diamond, square, triangle, star, plus, X)                                             | M    |
| Icon symbols  | Custom markers render | 1. Check the icon symbol layer                                | Custom icon markers render from `icon_points.json`                                                                                | M    |
| Fill patterns | Polygon fills render  | 1. Check each polygon layer                                   | All 8 fill patterns render correctly (solid, backwardDiagonal, cross, diagonalCross, forwardDiagonal, horizontal, vertical, null) | M    |

## Style Item Visibility

> Tested in [07 — Legend](07-legend.md#style-classes-visibility) and [08 — Layers](08-layers.md#style-classes-visibility).

## WMS Legend Images

> Tested in [07 — Legend](07-legend.md#wms-legend-images) (legend images and lightbox) and [08 — Layers](08-layers.md#wms-layer-settings) (right panel images).

## Feature Labels

Config: `configs/navigator/demos/24-configured-feature-labels.json` (ESRI Feature with `layerText` config: field `AREA_NA7`, Arial 12pt bold italic, white halo 2px, declutter, zoom range 5–19)

> Label toggle on/off tested in [08 — Layers](08-layers.md#text-labelling).

| Test                      | Description             | Steps                                                 | Expected Result                                                          | Auto |
| ------------------------- | ----------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------ | ---- |
| Labels render from config | Text labels on features | 1. Load the feature labels config                     | Text labels appear on map features at appropriate positions              | M    |
| Label field               | Correct field displayed | 1. Compare label text with the `AREA_NA7` field value | Label displays the correct field value (Toronto neighbourhood area name) | M    |
| Label styling             | Font/halo/color applied | 1. Inspect label appearance                           | Font size (12px), bold italic, white halo outline match the config       | M    |
| Labels at zoom levels     | Readable across zooms   | 1. Zoom in/out                                        | Labels remain readable, declutter prevents excessive overlap             | M    |
