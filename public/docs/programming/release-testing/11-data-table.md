# 11 — Data Table

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-11-data-table.html](https://canadian-geospatial-platform.github.io/geoview/public/rt-11-data-table.html) — Map 1 (multiple layers, data table in footer bar).

Data table display, column/global filtering, map filter sync, export, and row actions. The data table uses Material React Table (MRT) with a custom toolbar for map-specific features. Two display modes exist: interactive panel (footer bar or app bar tab) and read-only modal (opened via layer shortcut when no `data-table` tab configured).

## Basic Display

Config: `configs/navigator/layers/all-layers.json` (footerBar includes `data-table`, multiple queryable layers)

| Test                  | Description                        | Steps                                                                              | Expected Result                                                 | Auto |
| --------------------- | ---------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---- |
| Table loads           | Table populated for selected layer | 1. Open the Data Table footer bar tab<br>2. Select a layer from the layer selector | Table loads with columns and rows matching the layer's features | M    |
| Column headers        | Headers match field aliases        | 1. Check the column headers in the loaded table                                    | Column headers match the layer's field names/aliases            | M    |
| Row count             | Correct feature count              | 1. Check the row count displayed in the toolbar                                    | Row count matches the total number of features for that layer   | C    |
| Default hidden column | geoviewID hidden                   | 1. Open column visibility menu<br>2. Check the geoviewID column                    | The `geoviewID` column is hidden by default (toggle is off)     | C    |

## Filter by Map Extent

Config: `configs/navigator/layers/all-layers.json` (vector layers — NOT Esri Dynamic which lacks geometry in responses)

| Test                           | Description                  | Steps                                                                               | Expected Result                                                                                 | Auto |
| ------------------------------ | ---------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---- |
| Enable filter                  | Only viewport features shown | 1. Open the data table for a vector layer<br>2. Toggle "Filter by extent" switch ON | Only features within the current map viewport are shown in the table                            | M    |
| Pan map                        | Table updates on pan         | 1. With filter active, pan the map to a new area                                    | Table updates to show features in the new extent                                                | M    |
| Zoom map                       | Table updates on zoom        | 1. With filter active, zoom in or out                                               | Table updates — zooming in shows fewer features, zooming out shows more                         | M    |
| Disable filter                 | All features return          | 1. Toggle "Filter by extent" OFF                                                    | All features reappear in the table regardless of map extent                                     | M    |
| Not available for Esri Dynamic | Toggle absent or disabled    | 1. Select an Esri Dynamic layer in the data table                                   | The "Filter by extent" toggle is not available (Esri Dynamic responses do not include geometry) | C    |

## Column Filtering

Config: `configs/navigator/layers/all-layers.json`

| Test                     | Description            | Steps                                                                         | Expected Result                                         | Auto |
| ------------------------ | ---------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------- | ---- |
| Show filter row          | Filter inputs appear   | 1. Click the "Show/Hide Filters" button in the toolbar                        | A filter input row appears below the column headers     | M    |
| Text filter (contains)   | Matching rows only     | 1. Type a search term in a string column's filter input                       | Only rows where that column contains the text are shown | M    |
| Numeric filter (between) | Rows within range      | 1. Set a numeric range filter (e.g., between 100 and 500) on a numeric column | Only rows within the range appear                       | M    |
| Date filter              | Rows within date range | 1. Set a date range filter on a date column                                   | Only rows within the date range appear                  | M    |
| Multiple column filters  | AND logic applied      | 1. Apply filters on two or more columns simultaneously                        | Only rows matching ALL filters appear (AND logic)       | M    |
| Clear filters            | All rows return        | 1. Click the "Clear Filters" button in the toolbar                            | All column filters are removed and all rows reappear    | C    |

## Map Filtering from Table

Config: `configs/navigator/layers/all-layers.json`

| Test                          | Description            | Steps                                                                                 | Expected Result                                                 | Auto |
| ----------------------------- | ---------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---- |
| Apply filter to map           | Map features filtered  | 1. Apply a column filter to reduce visible rows<br>2. Toggle "Apply filter to map" ON | The map only renders features matching the table filter         | M    |
| Remove map filter             | Map shows all features | 1. Toggle "Apply filter to map" OFF or clear the column filter                        | Map renders all features again                                  | M    |
| Disabled during global search | Toggle greyed out      | 1. Type text in the global search box<br>2. Check the "Apply filter to map" toggle    | Toggle is disabled (cannot apply global search as a map filter) | C    |

## Global Search

Config: `configs/navigator/layers/all-layers.json`

| Test         | Description                      | Steps                                                 | Expected Result                                                 | Auto |
| ------------ | -------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------- | ---- |
| Search text  | Rows filtered across all columns | 1. Type a search term in the global search text field | Table shows only rows containing the term in any visible column | M    |
| Search clear | All rows return                  | 1. Clear the global search text field                 | All rows reappear in the table                                  | M    |

## Table with Style Classes

Config: `configs/navigator/layers/esri-feature.json` (layer with uniqueValue or classBreaks style)

| Test                   | Description                        | Steps                                                                                                                                              | Expected Result                                                                            | Auto |
| ---------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---- |
| Class filter reflected | Hidden classes excluded from table | 1. Open data table for a layer with style classes<br>2. Go to Legend/Layers panel and toggle OFF some style classes<br>3. Return to the data table | Table excludes rows belonging to the hidden style classes (filtered by `layerFilterClass`) | M    |

## Export

Config: `configs/navigator/layers/all-layers.json`

| Test                       | Description                 | Steps                                                                                                    | Expected Result                                                                                           | Auto |
| -------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---- |
| Export to CSV              | CSV file downloaded         | 1. Click the CSV export button in the toolbar                                                            | A CSV file is downloaded with filename `table-{layerName}.csv` containing correct column headers and data | M    |
| Export to GeoJSON          | GeoJSON file downloaded     | 1. Click the GeoJSON export button in the toolbar                                                        | A GeoJSON file is downloaded with features including geometry                                             | M    |
| Export filtered            | Only filtered rows exported | 1. Apply a column filter<br>2. Export to CSV                                                             | Only the filtered rows are included in the exported file                                                  | M    |
| Re-import exported GeoJSON | Round-trip data integrity   | 1. Export table to GeoJSON<br>2. Add the exported GeoJSON as a new GeoJSON layer via the Add Layer panel | New layer loads with features matching the original data                                                  | M    |

## Column Visibility

Config: `configs/navigator/layers/all-layers.json`

| Test                    | Description                | Steps                                                  | Expected Result                                                       | Auto |
| ----------------------- | -------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------- | ---- |
| Show/hide columns menu  | Column toggle list appears | 1. Click the "Show/Hide Columns" button in the toolbar | A menu appears listing all columns with toggle switches               | M    |
| Hide a column           | Column removed from table  | 1. Toggle a column OFF in the menu                     | That column disappears from the table                                 | M    |
| Show a column           | Column restored            | 1. Toggle the column back ON                           | Column reappears in the table                                         | M    |
| Multiple columns hidden | All hidden columns removed | 1. Hide multiple columns                               | All toggled-off columns are removed; remaining columns fill the space | M    |

## Density Toggle

Config: `configs/navigator/layers/all-layers.json`

| Test           | Description        | Steps                                                | Expected Result                                                                   | Auto |
| -------------- | ------------------ | ---------------------------------------------------- | --------------------------------------------------------------------------------- | ---- |
| Density button | Options appear     | 1. Click the density toggle button in the toolbar    | Three density options are shown: compact, comfortable, spacious                   | M    |
| Switch density | Row height changes | 1. Switch between compact, comfortable, and spacious | Row height/padding changes accordingly (compact is smallest, spacious is largest) | M    |

## Row Actions

Config: `configs/navigator/layers/all-layers.json`

| Test                  | Description                 | Steps                                                   | Expected Result                                                         | Auto |
| --------------------- | --------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------- | ---- |
| Icon column           | Feature symbology shown     | 1. Check the first column of each row                   | Feature style icon is displayed representing the layer's symbology      | M    |
| Zoom to feature       | Map zooms to feature        | 1. Click the zoom icon (`ZoomInSearchIcon`) on a row    | Map zooms to that feature's extent and highlights it                    | M    |
| Open details from row | Details panel shows feature | 1. Click the details icon (`InfoOutlinedIcon`) on a row | Details panel/modal opens showing full feature information for that row | M    |

## Data Table in App Bar

Config: `configs/navigator/demos/10-basic-appbar-data-table-tab.json` (data table as appBar tab, footerBar disabled)

| Test                  | Description                  | Steps                                                             | Expected Result                                                            | Auto |
| --------------------- | ---------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------- | ---- |
| AppBar data table tab | Table opens in app bar panel | 1. Load the config<br>2. Click the data table icon in the app bar | Data table opens as an app bar panel (not footer bar)                      | A    |
| Pre-selected layer    | Layer auto-selected on open  | 1. Check which layer is selected when the table opens             | The layer specified by `appBar.selectedDataTableLayerPath` is pre-selected | A    |

## Column Management

| Test                      | Description       | Steps                                                    | Expected Result                                | Auto |
| ------------------------- | ----------------- | -------------------------------------------------------- | ---------------------------------------------- | ---- |
| Column sort ascending     | Sort by column    | 1. Click a column header to sort ascending               | Rows reorder by that column in ascending order | C    |
| Column sort descending    | Reverse sort      | 1. Click the same column header again                    | Rows reorder in descending order               | C    |
| Column sort reset         | Remove sort       | 1. Click the column header a third time                  | Sort is cleared, rows return to original order | C    |
| Column visibility         | Hide a column     | 1. Open column visibility menu<br>2. Toggle a column off | Column disappears from the table               | M    |
| Column visibility restore | Show column again | 1. Toggle the column back on                             | Column reappears in its original position      | M    |
