# 11 — Data Table

Data table display, filtering, global search, and export.

## Basic Display

- [ ] **Table loads** — Open the Data Table panel and select a layer. Verify the table loads with correct columns and rows.
- [ ] **Column headers** — Verify column headers match the layer's field names / aliases.
- [ ] **Row count** — Verify the row count matches the expected number of features.

## Filter by Map Extent

- [ ] **Filter map toggle** — Enable "Filter by map extent". Verify only features visible in the current viewport are shown in the table.
- [ ] **Pan map** — Pan the map while filter is active. Verify the table updates to show features in the new extent.
- [ ] **Zoom map** — Zoom in/out while filter is active. Verify the table updates accordingly.
- [ ] **Disable filter** — Turn off "Filter by map extent". Verify all features reappear.

## Column Filtering

- [ ] **Text filter** — Apply a text filter on a string column. Verify only matching rows appear.
- [ ] **Numeric filter** — Apply a numeric range filter. Verify only rows within range appear.
- [ ] **Multiple column filters** — Apply filters on multiple columns simultaneously. Verify AND logic applies.
- [ ] **Clear filters** — Clear all column filters. Verify all rows reappear.

## Map Filtering from Table

- [ ] **Apply filter to map** — Apply a table filter and enable "Apply to map". Verify the map only shows features matching the filter.
- [ ] **Remove map filter** — Remove the table filter. Verify the map shows all features again.

## Global Search

- [ ] **Search text** — Type a search term in the global search box. Verify the table filters rows that contain the term in any column.
- [ ] **Search clear** — Clear the search. Verify all rows reappear.

## Table with Style Classes

- [ ] **Create table, toggle classes** — Create a data table for a layer. Go to Layers panel, toggle some visibility style classes off. Recreate the table. Verify the table reflects the class filter (rows for hidden classes are filtered).

## Store Verification

Open browser DevTools and check the Zustand store:

- [ ] **`allFeaturesDataArray`** — Verify the table is populated with the correct data.
- [ ] **Apply filter, check `tableFilters`** — After applying a filter, verify `tableFilters` in the store contains the filter.
- [ ] **Check `rowsFilteredRecord`** — Verify the filtered row count matches what the table shows.

## Export

- [ ] **Export to CSV** — Export the table data. Verify the downloaded CSV contains correct data.
- [ ] **Export filtered** — Apply a filter, then export. Verify only filtered rows are exported.
- [ ] **Re-import exported CSV** — Add the exported CSV file as a new CSV layer. Verify it loads and the features match the original data.

## Column Visibility

- [ ] **Show/hide columns button** — Click the column visibility button in the toolbar. Verify a list of columns with toggles appears.
- [ ] **Hide a column** — Toggle a column off. Verify it disappears from the table.
- [ ] **Show a column** — Toggle it back on. Verify it reappears.
- [ ] **Multiple columns hidden** — Hide multiple columns. Verify all hidden columns are removed and remaining columns fill the space.

## Density Toggle

- [ ] **Density button** — Click the density toggle in the toolbar. Verify options appear (compact, comfortable, spacious).
- [ ] **Switch density** — Switch between densities. Verify row height changes accordingly.

## Feature Highlight Sync

- [ ] **Zoom to feature from table** — Click the zoom icon on a row. Verify the map zooms to that feature's extent.
- [ ] **Open details from row** — Click the details icon on a row. Verify the Details panel opens showing the full feature information for that row.
