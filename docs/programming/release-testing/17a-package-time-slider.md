# 17a — Time Slider

Time slider plugin for time-aware layers.

## Layer Types

Config: `configs/navigator/demos/11-package-time-slider.json`

- [ ] **WMS time-aware layer** — Verify the time slider loads for WMS layers with time dimension.
- [ ] **Esri Dynamic time-aware layer** — Verify the time slider loads for Esri Dynamic layers with time info.
- [ ] **Esri Feature time-aware layer** — Verify time slider for Esri Feature layers.
- [ ] **Esri Image time-aware layer** — Verify time slider for Esri Image layers.

## Custom Time Slider

Config: `configs/navigator/demos/12-package-time-slider-custom.json`

- [ ] **Custom slider config** — Verify custom time slider settings (custom range, default values) apply correctly.
- [ ] **Custom description** — Verify custom description text appears.

## Slider Controls

- [ ] **Drag slider thumb** — Drag the slider thumb(s). Verify the map updates to show features at the selected time.
- [ ] **Single handle** — For layers with a single time value, verify one thumb appears.
- [ ] **Dual handles (range)** — For layers with time ranges, verify two thumbs appear for start/end.
- [ ] **Play button** — Click play. Verify the slider animates through time steps.
- [ ] **Pause button** — Click pause during animation. Verify it stops.
- [ ] **Step forward/backward** — Use step buttons to move one time step. Verify correct increment.
- [ ] **Reverse direction** — Toggle reverse direction. Verify the animation plays backward through time steps.
- [ ] **Lock handles** — For dual-handle sliders, lock both handles together. Verify dragging one moves both in sync (maintaining the range width).
- [ ] **Speed control** — If available, change animation speed. Verify the animation rate changes.

## Time Filtering

- [ ] **Filter applied to map** — Move the slider. Verify the map only shows features within the selected time range.
- [ ] **Filter applied to table** — Open the data table while time slider is active. Verify the table shows only time-filtered features.
- [ ] **Filtering toggle off** — Toggle the filter switch off. Verify the time filter is cleared and all features display regardless of the slider position.
- [ ] **Filtering toggle on** — Toggle the filter switch back on. Verify the time filter re-applies based on the current slider position.

## Loading Status

- [ ] **Green on loading** — Verify the layer shows green loading status while time-aware data loads.

## Store Verification

- [ ] **`sliderFilters`** — Check the store for `sliderFilters`. Verify it contains the time filter.
- [ ] **`timeSliderLayers`** — Check `timeSliderLayers` in the store. Verify range, type, min/max, and current values are correct.
- [ ] **Modify values, re-check** — Move the slider, then re-check store values. Verify they update.

## Geocore Auto-Creation

- [ ] **Geocore with time slider** — Load a geocore UUID config that includes time slider metadata. Verify the time slider auto-creates for the layer.
