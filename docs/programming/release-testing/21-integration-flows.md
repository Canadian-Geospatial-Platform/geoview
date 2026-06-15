# 21 — Integration Flows

Multi-step workflows that test cross-panel and cross-feature interactions. These tests validate that state stays consistent across panels and operations.

## Flow 1: Layer Config with Table Disabled

1. [ ] Open a layer config with `table: false`
2. [ ] Check the store — verify the config has `table: false`
3. [ ] Open the Layers right panel — verify the data table shortcut has `aria-disabled`
4. [ ] Verify clicking the disabled shortcut does nothing

## Flow 2: North Pole Lifecycle

1. [ ] Start in LCC full extent — verify north pole icon is visible (no arrow)
2. [ ] Zoom in until pole is outside viewport — verify arrow appears (no pole)
3. [ ] Zoom out — verify pole reappears
4. [ ] Switch to WM — verify arrow is visible (no pole — WM can't show the pole)
5. [ ] Switch back to LCC — verify correct state at current zoom

## Flow 3: Unrestricted Zoom Extent Comparison

Config: `configs/navigator/demos/05-max-extent-override.json`

1. [ ] Load the unrestricted extent config
2. [ ] Zoom out to the maximum
3. [ ] Compare the visible extent with the **default extent** — verify the unrestricted extent is larger
4. [ ] Compare with the **configured extent** — verify it matches the config

## Flow 4: Zoom to Layer Extent

Config: `configs/navigator/demos/06-zoom-layer.json`

1. [ ] Trigger zoom to layer extent (with specific layer ID) — verify the map zooms to that layer's extent
2. [ ] Trigger zoom to layer extent (with empty/no ID) — verify fallback behavior
3. [ ] Check the resulting extent — verify it matches expected bounds

## Flow 5: Layers in Visible Range

1. [ ] Zoom to a level where a layer is out of visible range
2. [ ] Check the store — verify `inVisibleRange: false`
3. [ ] Check `getOLLayer().isVisible()` — verify `false`
4. [ ] Zoom to a level within the visible range
5. [ ] Check the store — verify `inVisibleRange: true`
6. [ ] Check `getOLLayer().isVisible()` — verify `true`

## Flow 6: Data Table Filter by Extent

1. [ ] Open Data Table, select a layer
2. [ ] Enable "Filter by extent/map"
3. [ ] Check store value for the filter
4. [ ] Check `allFeaturesDataArray` — verify table is populated
5. [ ] Apply a column filter
6. [ ] Check `tableFilters` in the store — verify filter is present
7. [ ] Check `rowsFilteredRecord` — verify filtered count matches

## Flow 7: Geocore Auto-Creation

1. [ ] Load a config with geocore UUID that has time slider and geochart metadata
2. [ ] Verify the time slider auto-creates for the layer
3. [ ] Verify the geochart auto-creates for the layer
4. [ ] Verify the layer loads and renders on the map

## Flow 8: Time Slider Filter Store

1. [ ] Open time slider for a time-aware layer
2. [ ] Check store for `sliderFilters` — verify present
3. [ ] Check `timeSliderLayers` — verify range, type, min/max, current value
4. [ ] Move the slider to a new position
5. [ ] Re-check store values — verify they updated

## Flow 9: Highlight & Opacity Restore

1. [ ] Set opacity on main group, child group, and leaf layer to different values (e.g., 80%, 60%, 40%)
2. [ ] Trigger "Highlight Layer" on the leaf — verify all layers go to 100% opacity (or highlight level)
3. [ ] Remove the highlight
4. [ ] Verify all layers return to their original opacities (80%, 60%, 40%)

## Flow 10: Data Table + Style Classes

1. [ ] Create a data table for a vector layer
2. [ ] Go to the Layers panel
3. [ ] Toggle some visibility style classes off
4. [ ] Recreate the data table
5. [ ] Verify the table reflects the class filter — rows for hidden classes should be filtered out

## Flow 11: Parent/Child Visibility

1. [ ] Set a child layer to visible and its parent group to not visible
2. [ ] Verify the child layer is NOT visible on the map (parent hides it)
3. [ ] Verify the child's visibility icon still shows "visible" in the legend (greyed out)
4. [ ] Set the parent back to visible — verify the child appears on the map

## Flow 12: Style Classes + Toggle All

1. [ ] Open Layers panel for a layer with style classes
2. [ ] Toggle individual classes on/off
3. [ ] Press "Toggle All" — verify all classes toggle consistently
4. [ ] Check the filter in the store — verify `layerFilterClass` is correct
5. [ ] Create a data table — verify it reflects the current class filter

## Flow 13: Wrong Layer Type Crash Prevention

1. [ ] Load a config with `'geoviewLayerType': 'geocore'` (wrong type for a non-geocore layer)
2. [ ] Verify the viewer starts — basemap and UI should render
3. [ ] Verify the error layer is reported but does not crash the viewer

---

## Issues Found

<!-- Record any issues below -->
