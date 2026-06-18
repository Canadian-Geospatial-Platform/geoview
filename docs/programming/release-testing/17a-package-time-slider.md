# 17a — Time Slider

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.

Time slider plugin for time-aware layers. The time slider is a core package plugin (`geoview-time-slider`) that appears in the footer bar for layers with time dimension metadata.

## Layer Types

Config: `configs/navigator/demos/11-package-time-slider.json`

| Test                    | Description                      | Steps                                                          | Expected Result                                  | Auto |
| ----------------------- | -------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ | ---- |
| WMS time-aware layer    | Time slider loads for WMS        | 1. Load the config<br>2. Check a WMS layer with time dimension | Time slider appears in footer bar for that layer | M    |
| Esri Dynamic time-aware | Time slider loads for Esri Dyn   | 1. Check an Esri Dynamic layer with time info                  | Time slider appears and shows correct time range | M    |
| Esri Feature time-aware | Time slider loads for Esri Feat  | 1. Check an Esri Feature layer with time info                  | Time slider appears and shows correct time range | M    |
| Esri Image time-aware   | Time slider loads for Esri Image | 1. Check an Esri Image layer with time info                    | Time slider appears and shows correct time range | M    |

## Custom Time Slider

Config: `configs/navigator/demos/12-package-time-slider-custom.json`

| Test                 | Description                 | Steps                                                 | Expected Result                                                    | Auto |
| -------------------- | --------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------ | ---- |
| Custom slider config | Custom range/defaults apply | 1. Load the custom time slider config                 | Custom time range and default values apply correctly to the slider | M    |
| Custom description   | Custom text appears         | 1. Check the time slider panel for custom description | Custom description text appears below or above the slider          | M    |

## Slider Controls

Config: `configs/navigator/demos/11-package-time-slider.json`

| Test                  | Description                     | Steps                                                                        | Expected Result                                              | Auto |
| --------------------- | ------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------ | ---- |
| Drag slider thumb     | Map updates on drag             | 1. Drag the slider thumb(s)                                                  | Map updates to show features at the selected time            | M    |
| Single handle         | One thumb for single time value | 1. Check a layer with a single time value (WMS with `default` attribute)     | One thumb appears on the slider                              | M    |
| Dual handles (range)  | Two thumbs for time range       | 1. Check a layer with time range (Esri layers or WMS without `default`)      | Two thumbs appear for start/end time selection               | M    |
| Play button           | Animation plays forward         | 1. Click play                                                                | Slider animates through time steps; map updates at each step | M    |
| Pause button          | Animation stops                 | 1. Click pause during animation                                              | Animation stops at the current position                      | M    |
| Step forward/backward | Single time step increment      | 1. Use step buttons to move one time step                                    | Slider moves exactly one time step; map updates              | M    |
| Reverse direction     | Animation plays backward        | 1. Toggle reverse direction<br>2. Click play                                 | Animation plays backward through time steps                  | M    |
| Lock handles          | Handles move in sync            | 1. For dual-handle sliders, lock both handles together<br>2. Drag one handle | Both handles move in sync maintaining the range width        | M    |
| Speed control         | Animation rate changes          | 1. Change animation speed                                                    | Animation rate changes accordingly                           | M    |

## Time Filtering

Config: `configs/navigator/demos/11-package-time-slider.json`

| Test                    | Description                   | Steps                                        | Expected Result                                                            | Auto |
| ----------------------- | ----------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- | ---- |
| Filter applied to map   | Map shows time-filtered data  | 1. Move the slider to a specific time        | Map only shows features within the selected time range                     | M    |
| Filter applied to table | Table shows filtered features | 1. Move the slider<br>2. Open the data table | Data table shows only time-filtered features                               | M    |
| Filtering toggle off    | Filter cleared                | 1. Toggle the filter switch off              | Time filter is cleared; all features display regardless of slider position | M    |
| Filtering toggle on     | Filter re-applies             | 1. Toggle the filter switch back on          | Time filter re-applies based on the current slider position                | M    |

## Geocore Auto-Creation

Demo page: `templates/demos/add-layers.html`

| Test                     | Description                           | Steps                                                                                                                        | Expected Result                                                    | Auto |
| ------------------------ | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---- |
| Geocore with time slider | Time slider auto-creates from geocore | 1. Open `add-layers.html` demo page<br>2. Add a geocore UUID with time slider metadata (e.g., Wireless Network geocore UUID) | Time slider auto-creates for the layer based on VCS package config | M    |
