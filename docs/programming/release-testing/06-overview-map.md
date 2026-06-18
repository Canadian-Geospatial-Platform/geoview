# 06 — Overview Map

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-06-overview-map.html](../../packages/geoview-core/public/templates/release-testing/rt-06-overview-map.html) — Map 1 (LCC with overview map, hideOnZoom: 7, projection switch), Map 2 (no overview map).

Overview map behavior, hide on zoom, and projection switch. The overview map is only available for LCC (EPSG:3978) and WM (EPSG:3857) — it is not created for EPSG:3573.

## Presence

| Test                 | Description                    | Steps                                                 | Expected Result                               | Auto |
| -------------------- | ------------------------------ | ----------------------------------------------------- | --------------------------------------------- | ---- |
| Overview map visible | Appears when enabled in config | 1. Check Map 1 (has `overview-map` in `components`)   | Overview map appears in the corner of the map | A    |
| Overview map absent  | Does not appear when omitted   | 1. Check Map 2 (omits `overview-map` from components) | No overview map is displayed                  | A    |

## Hide on Zoom

| Test                 | Description                         | Steps                                                   | Expected Result                                               | Auto |
| -------------------- | ----------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------- | ---- |
| Hide when zoomed out | Overview hides below threshold      | 1. On Map 1, zoom out past zoom level 7                 | Overview map disappears                                       | A    |
| Show when zoomed in  | Overview reappears above threshold  | 1. Zoom back in above level 7                           | Overview map reappears                                        | A    |
| Threshold boundary   | Correct behavior at exact threshold | 1. On Map 1, zoom to exactly level 7 using zoom buttons | Overview map shows correct show/hide behavior at the boundary | A    |

## Projection Switch

| Test                          | Description                           | Steps                                                        | Expected Result                                                        | Auto |
| ----------------------------- | ------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------- | ---- |
| Overview map switches basemap | Basemap updates on projection change  | 1. On Map 1, switch projection (LCC → WM)                    | Overview map updates its basemap to match the new projection           | M    |
| Overview map extent           | Extent indicator correct after switch | 1. After switching projection, check the overview map extent | Overview map shows the correct extent indicator for the new projection | M    |

## Combined: Hide on Zoom + Projection Switch

| Test      | Description                          | Steps                                                                                                                                                                                                                 | Expected Result                                                                                 | Auto |
| --------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---- |
| Full flow | Hide/show persists across projection | 1. On Map 1, start zoomed in above 7 (overview visible)<br>2. Switch to WM<br>3. Verify overview visible with correct basemap<br>4. Zoom out below level 7 in WM<br>5. Verify overview hides<br>6. Switch back to LCC | Overview map shows/hides correctly across projection switches, basemap updates match projection | M    |
