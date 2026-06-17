# 17b — Geochart

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.

Geochart plugin for chart visualizations. The geochart is a core package plugin (`geoview-geochart`) that appears in the footer bar and renders Chart.js charts linked to map features.

## Chart Types

Config: `configs/navigator/demos/13-package-geochart.json`

| Test       | Description                  | Steps                                                         | Expected Result                                | Auto |
| ---------- | ---------------------------- | ------------------------------------------------------------- | ---------------------------------------------- | ---- |
| Line chart | Line chart renders correctly | 1. Load the config<br>2. Click a feature with line chart data | Line chart renders with data points and axes   | M    |
| Bar chart  | Bar chart renders correctly  | 1. Click a feature with bar chart data                        | Bar chart renders with correct bars and labels | M    |
| Pie chart  | Pie chart renders correctly  | 1. Click a feature with pie chart data (if applicable)        | Pie chart renders with correct segments        | M    |

## Interaction

Config: `configs/navigator/demos/13-package-geochart.json`

| Test           | Description                      | Steps                                                                                            | Expected Result                                                                   | Auto |
| -------------- | -------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ---- |
| Click feature  | Chart updates on map click       | 1. Click on a feature on the map                                                                 | Geochart updates to show data for that feature                                    | M    |
| Slider         | Chart updates on slider drag     | 1. If the chart has a time/data slider, drag it                                                  | Chart updates to reflect the slider position                                      | M    |
| Stepper        | Chart updates on step            | 1. If the chart has a stepper control, step through values                                       | Chart updates for each step                                                       | M    |
| Download chart | Chart exported as image          | 1. Click the download button                                                                     | Chart is exported as an image file                                                | M    |
| Lock chart     | Chart stays fixed on one feature | 1. Click the lock button<br>2. Click another feature on the map<br>3. Unlock and click a feature | Chart stays fixed while locked; resumes updating on feature click after unlocking | M    |

## Geochart with CDTK

Config: `configs/navigator/demos/13-package-geochart-cdtk.json`

| Test          | Description                 | Steps                            | Expected Result                       | Auto |
| ------------- | --------------------------- | -------------------------------- | ------------------------------------- | ---- |
| CDTK geochart | CDTK-style geochart renders | 1. Load the CDTK geochart config | CDTK-style geochart renders correctly | M    |

## Shortcut from Details

Config: `configs/navigator/demos/13-package-geochart.json` (with details panel available)

| Test                     | Description                    | Steps                                                                            | Expected Result                                         | Auto |
| ------------------------ | ------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------- | ---- |
| Details → Chart shortcut | Chart opens from details panel | 1. Open Details panel<br>2. Click the chart shortcut on a geochart-enabled layer | Geochart panel opens with data for the selected feature | M    |

## Geocore Auto-Creation

Demo page: `templates/demos/add-layers.html`

| Test                  | Description                        | Steps                                                                                                             | Expected Result                                                 | Auto |
| --------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---- |
| Geocore with geochart | Geochart auto-creates from geocore | 1. Open `add-layers.html` demo page<br>2. Add a geocore UUID with geochart metadata (e.g., Airborne geocore UUID) | Geochart auto-creates for the layer based on VCS package config | M    |
