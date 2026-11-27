# 14 — Map Info Bar

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-14-map-info.html](https://canadian-geospatial-platform.github.io/geoview/public/rt-14-map-info.html) — Map 1 (dynamic with full map info bar), Map 2 (static with simplified bar).

Map info bar components: scale, mouse position coordinates, attribution, rotation indicator, and expand mode. The map info bar is always visible at the bottom of the map in `dynamic` interaction mode. In `static` mode, it is simplified (no expand, no mouse position, no rotation indicator).

## Scale

Config: `configs/navigator/layers/all-layers.json` (dynamic interaction, default map info bar)

| Test                | Description               | Steps                                                                            | Expected Result                                                                | Auto |
| ------------------- | ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---- |
| Scale bar displayed | Scale visible and updates | 1. Verify the scale bar is visible at the bottom of the map<br>2. Zoom in or out | Scale bar is displayed and updates on zoom                                     | M    |
| Scale click cycle   | Cycles through 3 formats  | 1. Click the scale value repeatedly (3 clicks to cycle)                          | Cycles through: metric bar → imperial bar → numeric text (no bar) → metric bar | M    |

## Mouse Position

Config: `configs/navigator/layers/all-layers.json`

| Test                    | Description              | Steps                                                        | Expected Result                                                                                                                             | Auto |
| ----------------------- | ------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Coordinates update      | Coordinates follow mouse | 1. Move the mouse across the map                             | Coordinate display updates in real time to reflect mouse position                                                                           | M    |
| Coordinates click cycle | Cycles through 3 formats | 1. Click the coordinate value repeatedly (3 clicks to cycle) | Cycles through: DMS (degrees/minutes/seconds with N/S/E/W) → decimal degrees (4 decimals with N/S/E/W) → projected coordinates (meters E/N) | M    |

## Expand Map Info

Config: `configs/navigator/layers/all-layers.json`

| Test                   | Description             | Steps                                                                | Expected Result                                                                                              | Auto |
| ---------------------- | ----------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---- |
| Expand bar             | All formats visible     | 1. Click the expand button on the map info bar                       | Bar expands to show radio groups for all three coordinate formats and all three scale formats simultaneously | M    |
| Select format directly | Direct format selection | 1. In expanded mode, click a specific coordinate format radio option | The selected format is applied immediately (no cycling needed)                                               | M    |

## Attribution

Config: `configs/navigator/layers/all-layers.json`

| Test                | Description               | Steps                                                                                                | Expected Result                                                                      | Auto |
| ------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---- |
| Attribution display | Attribution text shown    | 1. Click the copyright icon in the map info bar                                                      | Attribution popover opens showing attribution text for the active basemap and layers | M    |
| Attribution update  | Updates on basemap switch | 1. Switch the basemap via the basemap selector (select imagery)<br>2. Click the copyright icon again | Attribution text updates to reflect the new basemap source                           | M    |

## Rotation Indicator

Config: `configs/navigator/demos/27-view-settings-rotation-home.json` (rotation: 45°, enableRotation: true)

| Test             | Description            | Steps                                                                | Expected Result                                                      | Auto |
| ---------------- | ---------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------- | ---- |
| Rotation tooltip | Shows rotation degrees | 1. Hover over the north arrow rotation indicator in the map info bar | Tooltip shows "Rotation: 45°" (or includes projection angle for LCC) | M    |
