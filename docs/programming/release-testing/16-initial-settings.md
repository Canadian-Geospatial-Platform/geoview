# 16 — Initial Settings

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-16-initial-settings.html](../../packages/geoview-core/public/templates/release-testing/rt-16-initial-settings.html) — Map 1 (selected tab & layer), Map 2 (all controls disabled), Map 3 (initial states: hidden, 50% opacity, not queryable).

Initial controls, states, filters, cascading behavior, and layer-specific source config. The `initialSettings` property is available at both the GeoView layer level and individual layer entry level. It contains `controls` (8 UI controls) and `states` (5 initial states) plus bounds/zoom constraints.

## Selected Tab & Layer

Config: `configs/navigator/demos/23-initial-settings.json` (footerBar tabs: layers + data-table, appBar tabs: geolocator + legend + details + export)

| Test                    | Description               | Steps                                                         | Expected Result                                                 | Auto |
| ----------------------- | ------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------- | ---- |
| Footer bar selected tab | Configured tab active     | 1. Load the config<br>2. Check which footer bar tab is active | The footer bar opens to the configured initial tab              | A    |
| App bar selected tab    | Configured tab active     | 1. Check which app bar tab is active                          | The app bar opens the configured initial tab                    | A    |
| Selected layer          | Configured layer selected | 1. Check which layer is selected in the layers panel          | The configured initial layer is selected in the relevant panels | A    |

## Initial Controls

Config: `configs/navigator/demos/23b-initial-settings-states-controls.json` (8 control types tested across multiple layer types)

Controls: `highlight`, `hover`, `opacity`, `query`, `remove`, `table`, `visibility`, `zoom` (+ `visibleScale`)

| Test                        | Description           | Steps                                                               | Expected Result                                                                                                                                                               | Auto |
| --------------------------- | --------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| All controls false          | All controls hidden   | 1. Check the WFS layer (all 8 controls set to `false`)              | All control buttons/sliders are not rendered for that layer: no highlight, no hover, no opacity slider, no query, no remove, no table shortcut, no visibility toggle, no zoom | A    |
| Remove enabled              | Remove button visible | 1. Check the esriFeature layer (configured with `remove: true`)     | Remove/delete button is visible in the layer settings                                                                                                                         | C    |
| Highlight disabled          | No highlight button   | 1. Check the esriFeature layer (configured with `highlight: false`) | Highlight button is not rendered in the layer's details/settings                                                                                                              | A    |
| Opacity control disabled    | No opacity slider     | 1. Check the WMS MSI layer (configured with `opacity: false`)       | Opacity slider is not rendered in the layer settings panel                                                                                                                    | A    |
| Table control disabled      | Table shortcut hidden | 1. Check the WMS MSI layer (configured with `table: false`)         | Data Table shortcut button is not rendered (removed from DOM when control is `false`)                                                                                         | A    |
| Visibility control disabled | No visibility toggle  | 1. Check the WMS MSI layer (configured with `visibility: false`)    | Visibility toggle (eye icon) is not rendered for that layer                                                                                                                   | A    |

## Initial States

Config: `configs/navigator/demos/23b-initial-settings-states-controls.json`

States: `visible`, `legendCollapsed`, `opacity`, `hoverable`, `queryable`

| Test                          | Description                 | Steps                                                                                 | Expected Result                                                                                    | Auto |
| ----------------------------- | --------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---- |
| Visible false                 | Layer hidden, legend greyed | 1. Check the GeoJSON group layer (configured with `visible: false`)                   | Layer is hidden on the map but appears in the legend (greyed out, visibility icon shows off state) | A    |
| Legend collapsed              | Legend entry collapsed      | 1. Check the GeoJSON group layer (configured with `legendCollapsed: true`)            | Legend entry is collapsed on load (children/items hidden)                                          | C    |
| Opacity applied               | Custom opacity on load      | 1. Check the esriDynamic layer (configured with `opacity: 0.5`)                       | Layer renders at 50% opacity on the map                                                            | A    |
| Queryable false               | Layer not queryable         | 1. Click on a feature of the esriDynamic layer (configured with `queryable: false`)   | Feature does not appear in the Details panel                                                       | A    |
| Hoverable false               | No hover tooltip            | 1. Hover over a feature of the esriDynamic layer (configured with `hoverable: false`) | No tooltip appears on hover                                                                        | A    |
| Custom opacity 0.7            | Precise opacity value       | 1. Check the esriImage layer (configured with `opacity: 0.7`)                         | Layer renders at 70% opacity                                                                       | C    |
| Query control + not queryable | Control visible, state off  | 1. Set `controls.query: true` + `states.queryable: false`                             | Query toggle is visible in UI but layer is not queryable (click returns no details)                | A    |
| Hover control + not hoverable | Control visible, state off  | 1. Set `controls.hover: true` + `states.hoverable: false`                             | Hover toggle is visible in UI but layer does not show hover tooltip                                | A    |

## Cascading Behavior

Config: `configs/navigator/demos/23c-initial-settings-cascading.json` (3-level cascading: root → group → child, with override scenarios)

| Test                          | Description                        | Steps                                                                                      | Expected Result                                                                                                                                            | Auto |
| ----------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Parent visible false cascades | Children hidden but preserve state | 1. Check the geojsonLYR1 root layer (configured with `visible: false`)                     | Parent and all children are hidden on the map; children appear greyed in legend but keep their own `visible: true` state internally                        | A    |
| Parent controls cascade       | Children inherit controls          | 1. Check children under geojsonLYR1 (configured with root `highlight: false, zoom: false`) | Children inherit `highlight: false` and `zoom: false` — no highlight or zoom buttons visible in their settings                                             | C    |
| Child override                | Child overrides parent             | 1. Check icon_points.json under geojsonLYR1 (child has `remove: false` overriding root)    | That specific child has `remove: false` applied while siblings inherit root settings                                                                       | A    |
| 3-level cascade               | Settings flow through 3 levels     | 1. Check geojsonLYR3: root → group → child settings                                        | Root `remove: false` cascades to group and children; child "lines.json" overrides with `highlight: false, zoom: false`                                     | A    |
| Group-level override          | Group overrides root               | 1. Check geojsonLYR2 groups (each group has different controls)                            | "line-polygon-group" has `highlight: false, zoom: false`; "point-feature-group" has `remove: false` — each group's children inherit their group's settings | C    |

## Opacity Cascading

Config: `configs/navigator/demos/23c-initial-settings-cascading.json` (or use config sandbox to set group/child opacities)

| Test                   | Description                      | Steps                                                                      | Expected Result                                                               | Auto |
| ---------------------- | -------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---- |
| Child capped by parent | Child cannot exceed parent       | 1. Set parent opacity to 50%, child to 100% (via settings panel or config) | Child renders at 50% (capped by parent via `Math.min(parent, child)`)         | A    |
| Child below parent     | Child uses own value             | 1. Set parent to 80%, child to 40%                                         | Child renders at 40% (already below parent, no capping)                       | A    |
| Runtime parent change  | Child re-capped on parent change | 1. Change parent opacity at runtime via opacity slider                     | Child opacity updates — re-capped to the new parent value if child exceeds it | A    |

## Initial Filters

Config: `configs/navigator/demos/23a-initial-settings-filters.json` (6 layers with `layerFilter` across different layer types)

| Test                 | Description                | Steps                                                                     | Expected Result                                                                     | Auto |
| -------------------- | -------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---- |
| OGC Feature filter   | Named features only        | 1. Check the Large Lakes layer (filter: `name in ('Lake Victoria', ...)`) | Only the 4 named lakes are visible on the map                                       | C    |
| WFS filter           | Single state only          | 1. Check the US States layer (filter: `STATE_ABBR = 'NY'`)                | Only New York state is visible on the map                                           | C    |
| Esri Dynamic filter  | Province filter            | 1. Check the Water Quantity layer (filter: `E_Province = 'Manitoba'`)     | Only Manitoba features are visible                                                  | C    |
| Esri Feature filter  | Boolean filter             | 1. Check the Historical Flood Events layer (filter: `death = 'yes'`)      | Only flood events with deaths are visible                                           | C    |
| GeoJSON filter       | Province filter            | 1. Check the Polygons layer (filter: `Province = 'Quebec'`)               | Only Quebec polygon is visible                                                      | C    |
| Filter in data table | Filtered features in table | 1. Open the data table for a filtered layer                               | Data table shows only the filtered features (matching the `layerFilter` expression) | C    |

## Layer Entry Source Config

Config: `configs/navigator/demos/23d-initial-settings-layer-config.json` (rasterFunction, wmsStyle, featureInfo, codedValue domain)

For raster function and WMS style tests, see [08 — Layers — Esri Image Layer Settings](08-layers.md#esri-image-layer-settings) and [08 — Layers — WMS Layer Settings](08-layers.md#wms-layer-settings).

| Test                    | Description                | Steps                                                                                                            | Expected Result                                                                                   | Auto |
| ----------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---- |
| Raster function applied | Esri Image raster function | 1. Check the Dry Spell esriImage layer (configured with `rasterFunction: "ds_30"`)                               | The ds_30 raster function is applied to the rendered image                                        | M    |
| WMS style applied       | WMS style set              | 1. Check the MSI WMS layer (configured with `wmsStyle: "msi-binary"`)                                            | The msi-binary style is applied to the WMS rendering                                              | M    |
| Feature info nameField  | Custom label field         | 1. Click on a feature from the U2 Tour Locations layer (configured with `nameField: "Tour"`)                     | Feature label in the Details panel uses the "Tour" field value                                    | M    |
| Feature info outfields  | Limited fields returned    | 1. Check the feature details for U2 Tour Locations (configured with 5 outfields: Venue, Event, Tour, City, Date) | Only the 5 configured outfields are shown in the feature details                                  | M    |
| Coded value domain      | Domain values displayed    | 1. Check the "Tour" field in the U2 Tour Locations details                                                       | Tour field shows translated domain names (e.g., "Zoo TV Tour Domain") instead of raw coded values | A    |

> Core nameField/outfields behavior tested in [10 — Details — Summary & Out Fields](10-details.md#summary--out-fields).
