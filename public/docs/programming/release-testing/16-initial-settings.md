# 16 — Initial Settings

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-16-initial-settings.html](https://canadian-geospatial-platform.github.io/geoview/public/rt-16-initial-settings.html) — Map 1 (selected tab & layer), Map 2 (all controls disabled), Map 3 (default controls vs explicit controls query/hover toggle test).
>
> **Navigator configs** (for detailed tests with multiple layer types): `23-initial-settings.json`, `23a-...-filters.json`, `23b-...-states-controls.json`, `23c-...-cascading.json`, `23d-...-layer-config.json`

Initial controls, states, filters, cascading behavior, and layer-specific source config. The `initialSettings` property is available at both the GeoView layer level and individual layer entry level. It contains `controls` (8 UI controls) and `states` (5 initial states) plus bounds/zoom constraints.

## Selected Tab & Layer

> Ref config: `23-initial-settings.json`

| Test                    | Description               | Steps                                                          | Expected Result                                                 | Auto |
| ----------------------- | ------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------- | ---- |
| Footer bar selected tab | Configured tab active     | 1. On Map 1, check which footer bar tab is active              | The footer bar opens to the configured initial tab              | A    |
| App bar selected tab    | Configured tab active     | 1. On Map 1, check which app bar tab is active                 | The app bar opens the configured initial tab                    | A    |
| Selected layer          | Configured layer selected | 1. On Map 1, check which layer is selected in the layers panel | The configured initial layer is selected in the relevant panels | A    |

## Initial Controls

> Ref config: `23b-initial-settings-states-controls.json`

Controls: `highlight`, `hover`, `opacity`, `query`, `remove`, `table`, `visibility`, `zoom` (+ `visibleScale`)

| Test                        | Description             | Steps                                                              | Expected Result                                                                                                                                                               | Auto |
| --------------------------- | ----------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| All controls false          | All controls hidden     | 1. On Map 2, check the layer (all 8 controls set to `false`)       | All control buttons/sliders are not rendered for that layer: no highlight, no hover, no opacity slider, no query, no remove, no table shortcut, no visibility toggle, no zoom | A    |
| Remove enabled              | Remove button visible   | 1. Load `23b` in navigator, check esriFeature (`remove: true`)     | Remove/delete button is visible in the layer settings                                                                                                                         | C    |
| Highlight disabled          | No highlight button     | 1. Load `23b` in navigator, check esriFeature (`highlight: false`) | Highlight button is not rendered in the layer's details/settings                                                                                                              | A    |
| Opacity control disabled    | No opacity slider       | 1. Load `23b` in navigator, check WMS MSI (`opacity: false`)       | Opacity slider is not rendered in the layer settings panel                                                                                                                    | A    |
| Table control disabled      | Table shortcut disabled | 1. Load `23b` in navigator, check WMS MSI (`table: false`)         | Data Table shortcut button is present but has `aria-disabled` attribute (greyed out, not clickable)                                                                           | A    |
| Visibility control disabled | No visibility toggle    | 1. Load `23b` in navigator, check WMS MSI (`visibility: false`)    | Visibility toggle (eye icon) is not rendered for that layer                                                                                                                   | A    |

## Initial States

> Ref config: `23b-initial-settings-states-controls.json`

States: `visible`, `legendCollapsed`, `opacity`, `hoverable`, `queryable`

| Test                          | Description                       | Steps                                                                                                             | Expected Result                                                                                    | Auto |
| ----------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---- |
| Visible false                 | Layer hidden, legend greyed       | 1. Load `23b` in navigator, check esriFeature layer (configured with `visible: false`)                            | Layer is hidden on the map but appears in the legend (greyed out, visibility icon shows off state) | A    |
| Legend collapsed              | Legend entry collapsed            | 1. Load `23b` in navigator, check esriFeature layer (configured with `legendCollapsed: true`)                     | Legend entry is collapsed on load (children/items hidden)                                          | A    |
| Opacity applied               | Custom opacity on load            | 1. On Map 3, check the second layer "Historical Flood (controls on, states off)" (configured with `opacity: 0.5`) | Layer renders at 50% opacity on the map                                                            | A    |
| Queryable false               | Layer not queryable               | 1. On Map 3, click on a feature of the first layer (configured with `queryable: false`)                           | Feature does not appear in the Details panel                                                       | A    |
| Hoverable false               | No hover tooltip                  | 1. On Map 3, hover over a feature of the first layer (configured with `hoverable: false`)                         | No tooltip appears on hover                                                                        | A    |
| No controls = no toggles      | Settings panel has no query/hover | 1. On Map 3, open the layer settings panel for the first layer (no controls specified)                            | No query or hover toggles appear (controls.query/hover default to false)                           | M    |
| Custom opacity 0.7            | Precise opacity value             | 1. Load `23b` in navigator, check esriImage layer (`opacity: 0.7`)                                                | Layer renders at 70% opacity                                                                       | C    |
| Query control + not queryable | Control visible, state off        | 1. On Map 3, open second layer settings panel                                                                     | Query toggle is visible but OFF; clicking feature returns no details                               | A    |
| Hover control + not hoverable | Control visible, state off        | 1. On Map 3, check hover toggle in second layer settings panel                                                    | Hover toggle is visible but OFF; hovering over feature shows no tooltip                            | A    |
| Toggle query on               | Query works after toggle          | 1. On Map 3, toggle the query switch ON for second layer<br>2. Click on a feature                                 | Feature info now appears in Details panel                                                          | M    |
| Toggle hover on               | Hover works after toggle          | 1. On Map 3, toggle the hover switch ON for second layer<br>2. Hover over a feature                               | Hover tooltip now appears                                                                          | M    |

## Cascading Behavior

> Ref config: `23c-initial-settings-cascading.json` (3-level cascading: root → group → child, with override scenarios). Use Layers Navigator.

| Test                          | Description                        | Steps                                                                                   | Expected Result                                                                                                                                            | Auto |
| ----------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Parent visible false cascades | Children hidden but preserve state | 1. Load `23c` in navigator, check geojsonLYR1 root layer (`visible: false`)             | Parent and all children are hidden on the map; children appear greyed in legend but keep their own `visible: true` state internally                        | A    |
| Parent controls cascade       | Children inherit controls          | 1. Check children under geojsonLYR1 (root: `highlight: false, zoom: false`)             | Children inherit `highlight: false` and `zoom: false` — no highlight or zoom buttons visible in their settings                                             | A    |
| Child override                | Child overrides parent             | 1. Check icon_points.json under geojsonLYR1 (child has `remove: false` overriding root) | That specific child has `remove: false` applied while siblings inherit root settings                                                                       | A    |
| 3-level cascade               | Settings flow through 3 levels     | 1. Check geojsonLYR3: root → group → child settings                                     | Root `remove: false` cascades to group and children; child "lines.json" overrides with `highlight: false, zoom: false`                                     | A    |
| Group-level override          | Group overrides root               | 1. Check geojsonLYR2 groups (each group has different controls)                         | "line-polygon-group" has `highlight: false, zoom: false`; "point-feature-group" has `remove: false` — each group's children inherit their group's settings | A    |

## Opacity Cascading

> Ref config: `23c-initial-settings-cascading.json`. Use Layers Navigator.

| Test                   | Description                      | Steps                                                                                     | Expected Result                                                               | Auto |
| ---------------------- | -------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---- |
| Child capped by parent | Child cannot exceed parent       | 1. Load `23c` in navigator, set parent opacity to 50%, child to 100% (via settings panel) | Child renders at 50% (capped by parent via `Math.min(parent, child)`)         | A    |
| Child below parent     | Child uses own value             | 1. Set parent to 80%, child to 40%                                                        | Child renders at 40% (already below parent, no capping)                       | A    |
| Runtime parent change  | Child re-capped on parent change | 1. Change parent opacity at runtime via opacity slider                                    | Child opacity updates — re-capped to the new parent value if child exceeds it | A    |

## Initial Filters

> Ref config: `23a-initial-settings-filters.json`. Use Layers Navigator.

| Test                 | Description                | Steps                                                                         | Expected Result                                                                     | Auto |
| -------------------- | -------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---- |
| OGC Feature filter   | Named features only        | 1. Load `23a` in navigator, check Large Lakes layer (filter: `name in (...)`) | Only the 4 named lakes are visible on the map                                       | A    |
| WFS filter           | Single state only          | 1. Check US States layer (filter: `STATE_ABBR = 'NY'`)                        | Only New York state is visible on the map                                           | A    |
| Esri Dynamic filter  | Province filter            | 1. Check Water Quantity layer (filter: `E_Province = 'Manitoba'`)             | Only Manitoba features are visible                                                  | A    |
| Esri Feature filter  | Boolean filter             | 1. Check Historical Flood Events layer (filter: `death = 'yes'`)              | Only flood events with deaths are visible                                           | A    |
| GeoJSON filter       | Province filter            | 1. Check Polygons layer (filter: `Province = 'Quebec'`)                       | Only Quebec polygon is visible                                                      | A    |
| Filter in data table | Filtered features in table | 1. Open the data table for a filtered layer                                   | Data table shows only the filtered features (matching the `layerFilter` expression) | C    |

## Filter Combination (Cross-Source)

> Ref config: `23a-initial-settings-filters.json` (config filters) + time-slider layer via navigator. Use Layers Navigator.
>
> Four filter sources exist (`layerFilterClass`, `layerFilterTime`, `tableFilters`, `initialFilter`). The config `layerFilter` is applied on load; the other three are changed via UI (legend class toggles, time slider, data table column filters). All sources combine with AND logic. Changing one must update both map rendering and data table rows.

### Class Filter ↔ Data Table Sync

| Test                           | Description                          | Steps                                                                                                                            | Expected Result                                                                  | Auto |
| ------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---- |
| Toggle class off updates table | Class filter reflected in data table | 1. Load a uniqueValue-styled layer (e.g., CESI in `23a`)<br>2. In the legend, toggle a style class OFF<br>3. Open the data table | Data table row count decreases — rows matching the toggled-off class are removed | C    |
| Toggle class on restores table | Re-enabling class restores rows      | 1. Toggle the style class back ON<br>2. Check the data table                                                                     | Data table row count returns to previous value — previously hidden rows reappear | C    |
| Toggle all classes off         | Empty data table                     | 1. Toggle ALL style classes OFF for the layer                                                                                    | Data table shows zero rows; map shows no features for that layer                 | C    |

### Data Table Filter ↔ Map Sync

| Test                             | Description                       | Steps                                                                                                   | Expected Result                                      | Auto |
| -------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ---- |
| Column filter applied to map     | Data table filter updates map     | 1. Open data table for a vector layer<br>2. Apply a column filter<br>3. Toggle "Apply filter to map" ON | Map only renders features matching the column filter | C    |
| Clear column filter restores map | Removing filter restores features | 1. Clear the column filter or toggle "Apply filter to map" OFF                                          | Map renders all features again                       | C    |

### Combined: Config Filter + Data Table Filter

| Test                                  | Description                   | Steps                                                                                                                                                               | Expected Result                                                                                        | Auto |
| ------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---- |
| Config + data table AND logic         | Both filters applied together | 1. Load `23a` (Esri Feature layer with `layerFilter: "death = 'yes'"`)<br>2. Open data table — confirm only "yes" rows<br>3. Apply a column filter on another field | Data table shows only rows matching BOTH config filter AND column filter; map renders the intersection | C    |
| Remove data table filter keeps config | Config filter persists        | 1. Clear the column filter                                                                                                                                          | Data table returns to showing only config-filtered rows (config filter still active); map matches      | C    |

### Combined: Class Filter + Data Table Filter

| Test                                | Description                     | Steps                                                                                                                               | Expected Result                                                                                      | Auto |
| ----------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---- |
| Class off + column filter           | Both sources narrow results     | 1. Toggle a style class OFF for a uniqueValue layer<br>2. Apply a column filter in data table<br>3. Toggle "Apply filter to map" ON | Map shows only features matching both filters (AND logic); data table shows the intersection         | C    |
| Re-enable class keeps column filter | Restoring class expands results | 1. Toggle the style class back ON                                                                                                   | Data table shows more rows (class filter removed) but column filter still applied; map reflects both | C    |
| Clear all filters                   | Everything resets               | 1. Re-enable all style classes<br>2. Clear data table filters<br>3. Toggle "Apply filter to map" OFF                                | All features reappear on map and in data table                                                       | C    |

## Layer Entry Source Config

> Ref config: `23d-initial-settings-layer-config.json`. Use Layers Navigator.

For raster function and WMS style tests, see [08 — Layers — Esri Image Layer Settings](08-layers.md#esri-image-layer-settings) and [08 — Layers — WMS Layer Settings](08-layers.md#wms-layer-settings).

| Test                    | Description                | Steps                                                                                        | Expected Result                                                                                   | Auto |
| ----------------------- | -------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---- |
| Raster function applied | Esri Image raster function | 1. Load `23d` in navigator, check Dry Spell esriImage layer (`rasterFunction: "ds_30"`)      | The ds_30 raster function is applied to the rendered image                                        | M    |
| WMS style applied       | WMS style set              | 1. Check MSI WMS layer (`wmsStyle: "msi-binary"`)                                            | The msi-binary style is applied to the WMS rendering                                              | M    |
| Feature info nameField  | Custom label field         | 1. Click on a feature from U2 Tour Locations layer (`nameField: "Tour"`)                     | Feature label in the Details panel uses the "Tour" field value                                    | M    |
| Feature info outfields  | Limited fields returned    | 1. Check feature details for U2 Tour Locations (5 outfields: Venue, Event, Tour, City, Date) | Only the 5 configured outfields are shown in the feature details                                  | M    |
| Coded value domain      | Domain values displayed    | 1. Check the "Tour" field in U2 Tour Locations details                                       | Tour field shows translated domain names (e.g., "Zoo TV Tour Domain") instead of raw coded values | A    |

> Core nameField/outfields behavior tested in [10 — Details — Summary & Out Fields](10-details.md#summary--out-fields).

## Deep Nesting Cascading (4+ Levels)

Config: `configs/navigator/demos/23b-initial-settings-states-controls.json`

Tests `initialSettings` cascading through deeply nested group hierarchies.

| Test                           | Description                    | Steps                                                         | Expected Result                                                                | Auto |
| ------------------------------ | ------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---- |
| Parent visible=false cascades  | Children greyed out            | 1. On Map 4, check children of the parent group in the legend | Children show `visible: true` but greyed out (parent OL layer hides rendering) | C    |
| Child override wins            | Explicit child value preserved | 1. On Map 4, check child layer with explicit `opacity: 0.5`   | Child renders at 0.5 opacity (not overridden by parent)                        | C    |
| controls.remove=false cascades | Remove button hidden           | 1. On Map 4, check the parent group and its children          | Remove button is hidden at all descendant levels                               | C    |
