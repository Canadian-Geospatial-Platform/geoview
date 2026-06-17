# 22 — Automation Candidates

Tests from this release plan that are good candidates to add to the automated `geoview-test-suite`. These are tests that can be verified programmatically without visual inspection.

Use the **TestCreator** agent to generate the actual test code.

## Priority Legend

| Priority | Meaning                                                           |
| -------- | ----------------------------------------------------------------- |
| **P1**   | High — deterministic, no visual check needed, catches regressions |
| **P2**   | Medium — some setup needed, but automatable                       |
| **P3**   | Low — possible to automate but complex or low regression risk     |

---

## Already Automated (No Action Needed)

These tests from the release plan are already covered by the existing test suite:

| Release Plan Item                  | Existing Test                                                          |
| ---------------------------------- | ---------------------------------------------------------------------- |
| North arrow rotation (LCC)         | `suite-map-varia` → `testNorthArrowRotationLCC`                        |
| Projection switch                  | `suite-map-varia` → `testSwitchProjectionAndExtent`                    |
| Map zoom                           | `suite-map-varia` → `testMapZoom`                                      |
| Zoom to extent                     | `suite-map-varia` → `testZoomToExtent`                                 |
| Basemap create/switch              | `suite-map-varia` → `testCreateAndSetBasemap`                          |
| Language switch                    | `suite-map-varia` → `testSetLanguage`                                  |
| Footer/app bar tabs                | `suite-map-varia` → `testFooterBarSelectTab`, `testAppBarSelectTab`    |
| Non-queryable layer not in details | `suite-map-varia` → `testNonQueryableLayerNotInDetails`                |
| Hoverable state                    | `suite-map-varia` → `testLayerHoverableState`                          |
| Overview map show/hide on zoom     | `suite-map-config` → `testOverviewMapHideOnZoom`                       |
| Overview map + projection          | `suite-map-config` → `testOverviewMapHideOnZoomWithReprojection`       |
| Overview map present/absent        | `suite-map-config` → `testOverviewMapPresent`, `testOverviewMapAbsent` |
| Initial settings states            | `suite-map-config` → `testInitialSettingsState*`                       |
| Initial settings controls          | `suite-map-config` → `testInitialSettingsControlsAllFalse`             |
| Opacity cascading                  | `suite-map-config` → `testInitialSettingsOpacityCascading*`            |
| View settings zoom constraints     | `suite-map-config` → `testViewSettingsZoomConstraints`                 |
| Initial view layerIds set extent   | `suite-map-config` → `testInitialViewLayerIdsSetExtent`                |
| Config defaults (footer/app/nav)   | `suite-map-config` → `testNoFooterBar*`, `testEmptyNavBar*`            |
| Data table appBar/footerBar tab    | `suite-map-config` → `testDataTableSelectedTab*`                       |
| Error layer configs (all types)    | `suite-config` → `test*BadUrl`                                         |
| Settings cascade to sublayers      | `suite-config` → `testSettingsCascadeToSublayers`                      |
| Swiper lifecycle                   | `suite-swiper` → `testSwiperLifecycle`                                 |
| All layer types load correctly     | `suite-layer` → 34 tests                                               |
| All utility functions              | `suite-utilities` → 52 tests                                           |

---

## Recommended New Automated Tests

### Map & Projection (suite-map-varia / suite-map-config)

| #   | Test                                                                                                                                 | Priority | Notes                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | -------- | ---------------------------------------------------------------- |
| 1   | **North pole visibility by projection** — Verify north pole is visible in EPSG:3978 (zoomed out), not in EPSG:3857, not in EPSG:3573 | P1       | Check via `getPixelFromCoordinate` for pole position in viewport |
| 2   | **North arrow direction after rotation** — Rotate map, verify arrow rotation value in store updates                                  | P1       | Store-based check after `mapController.rotate()`                 |
| 3   | **Zoom constraints enforcement** — Set zoom beyond min/max, verify clamping                                                          | P1       | Already partially covered; add explicit clamp verification       |
| 4   | **Max extent override** — Load unrestricted config, verify extent is larger than default                                             | P2       | Compare `mapViewer.getExtent()` with default                     |
| 5   | **Zoom to layer extent** — Trigger zoom-to-layer, verify resulting extent contains layer bounds                                      | P2       | `mapController.zoomToExtent()` + extent comparison               |
| 6   | **Static map no interaction** — Load static config, verify zoom/pan are disabled                                                     | P2       | Check OL interaction count or view constraints                   |

### Config Validation (suite-config)

| #   | Test                                                                                                       | Priority | Notes                                                            |
| --- | ---------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------- |
| 7   | **Duplicate geocore UUID** — Load config with duplicate UUID, verify `orderedLayers` has suffix            | P1       | Check store `orderedLayers` for `:suffix` pattern                |
| 8   | **Invalid `geoviewLayerType`** — Load config with wrong type, verify error reported, basemap still renders | P1       | Check `LayerInvalidGeoviewLayerTypeError` is emitted, map exists |
| 9   | **Partial layer loading** — Load config with bad sublayer, verify valid sublayers load                     | P1       | Check group status is `loaded`, child status is `error`          |
| 10  | **Empty `listOfLayerEntryConfig`** — Load config with empty array, verify no crash                         | P2       | Config creation + validation                                     |
| 11  | **Non-supported geocore format** — Add UUID that resolves to unsupported format, verify error              | P2       | Error handling check                                             |

### Layers (suite-layer)

| #   | Test                                                                                                     | Priority | Notes                                  |
| --- | -------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------- |
| 12  | **Layer reorder** — Reorder layers, verify `orderedLayers` store updates                                 | P1       | Call reorder API, check store          |
| 13  | **Group opacity cascading** — Set group to 50%, verify children capped                                   | P1       | `setOpacity()` + `getOpacity()` checks |
| 14  | **Toggle all visibility with error sublayers** — Toggle all on group with error child, verify no crash   | P1       | Catch errors during toggle             |
| 15  | **Parent visible false, child visible true** — Verify child `getVisibleIncludingParents()` returns false | P1       | Direct API check                       |
| 16  | **Style class filter after toggle** — Toggle style items, verify `layerFilterClass` in store             | P1       | Store check after visibility toggle    |
| 17  | **Layer `inVisibleRange` at zoom boundaries** — Zoom in/out of range, verify flag                        | P2       | Check `isInVisibleRange()` after zoom  |
| 18  | **Add duplicate layer rejected** — Add same UUID twice, verify rejection                                 | P2       | Check for error/rejection response     |
| 19  | **Layer name resolution** — Verify `getLayerNameCascade()` returns non-empty for all layers              | P2       | Iterate loaded layers, check name      |

### Data Table (suite-map-varia or new suite)

| #   | Test                                                                                         | Priority | Notes                                  |
| --- | -------------------------------------------------------------------------------------------- | -------- | -------------------------------------- |
| 20  | **Data table filter by map extent** — Enable map filter, verify store `tableFilters` updates | P2       | Store-based verification               |
| 21  | **Data table column filter** — Apply filter, verify `rowsFilteredRecord` count               | P2       | Apply filter via API, check store      |
| 22  | **Table reflects class filter** — Toggle classes, verify table row count changes             | P2       | Combine layer visibility + table check |

### Time Slider (suite-map-varia or new suite)

| #   | Test                                                                                                | Priority | Notes                             |
| --- | --------------------------------------------------------------------------------------------------- | -------- | --------------------------------- |
| 23  | **Time slider auto-creation from geocore** — Load geocore with time metadata, verify slider creates | P1       | Check `timeSliderLayers` in store |
| 24  | **Time filter store update** — Move slider, verify `sliderFilters` in store updates                 | P2       | Programmatic slider value change  |

### Highlight & Opacity (suite-map-varia)

| #   | Test                                                                                            | Priority | Notes                               |
| --- | ----------------------------------------------------------------------------------------------- | -------- | ----------------------------------- |
| 25  | **Highlight + opacity restore** — Set opacities, highlight, unhighlight, verify restored values | P1       | Snapshot/restore pattern validation |

### Error Recovery (suite-layer)

| #   | Test                                                                                     | Priority | Notes                             |
| --- | ---------------------------------------------------------------------------------------- | -------- | --------------------------------- |
| 26  | **Reload error layer stays in error** — Load bad URL, attempt reload, verify still error | P2       | Status check after reload attempt |

### New Layer Types (suite-layer)

| #   | Test                                                                                         | Priority | Notes                                               |
| --- | -------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------- |
| 27  | **Vector Tiles layer load** — Add vector tile layer, verify renders with Mapbox GL style     | P1       | Production layer type, zero test coverage currently |
| 28  | **WMTS layer load** — Add WMTS layer, verify GetCapabilities parsed and tiles render         | P1       | Standard OGC type, known issues with blank tiles    |
| 29  | **GeoPackage layer load** — Add GeoPackage layer, verify features render with nested groups  | P2       | Local file format, nested group testing             |
| 30  | **Static Image layer load** — Add static image layer, verify image renders at correct extent | P2       | Simple layer, easy to automate                      |
| 31  | **XYZ Tiles layer load (success)** — Add XYZ tile layer, verify tiles render                 | P2       | Only error config tested currently                  |
| 32  | **Shapefile layer load** — Add zipped shapefile, verify features render                      | P2       | ZIP-based unique load path                          |

### Share & Notifications (suite-map-varia or new suite)

| #   | Test                                                                                                     | Priority | Notes                                |
| --- | -------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------ |
| 33  | **Share URL encode/decode** — Generate share URL, verify parameters (p, z, c, b, keys) are correct       | P1       | State preservation critical          |
| 34  | **Notification stacking** — Generate same error multiple times, verify count increments (not duplicated) | P2       | Store-based, easy assertions         |
| 35  | **Data table column visibility toggle** — Hide/show columns, verify store `columnVisibility` updates     | P2       | Store-based check                    |
| 36  | **Geolocator search + zoom** — Search for location, verify map zooms to result extent                    | P2       | API integration, requires service up |

### Fullscreen & DOM State (suite-ui or suite-map-config)

| #   | Test                                                                                                | Priority | Notes                                                          |
| --- | --------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------- |
| 37  | **Panel fullscreen DOM** — Open panel, trigger fullscreen, check DOM element dimensions vs viewport | P2       | DOM size check: `element.offsetHeight` vs `window.innerHeight` |
| 38  | **Viewer fullscreen DOM** — Trigger viewer fullscreen, check `document.fullscreenElement` is set    | P2       | Browser fullscreen API check                                   |

### Basemap Store State (suite-map-config)

| #   | Test                                                                                                                  | Priority | Notes                                              |
| --- | --------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------- |
| 39  | **Basemap labeled/shaded config** — Create map with `labeled: false`, verify store basemap state has `labeled: false` | P1       | Store check via `getStoreMapBasemapOptions(mapId)` |
| 40  | **Basemap persists across projection** — Switch projection, verify store `basemapId` unchanged                        | P1       | Store check after `mapController.setProjection()`  |
| 41  | **TLS/SL config basemap state** — Load TLS/SL configs, verify store has correct labeled/shaded values                 | P1       | `createMapFromConfigFast` + store assertion        |

### Navbar DOM Checks (suite-map-config or suite-ui)

| #   | Test                                                                                                    | Priority | Notes                                                              |
| --- | ------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------ |
| 42  | **Navbar button presence** — Load config, check DOM for each expected button element                    | P1       | Query `document.querySelector` for button class/id per button type |
| 43  | **Zoom via API** — Call `mapController.zoomMap()`, verify store zoom changes                            | P1       | Already partially covered; explicit pre/post store check           |
| 44  | **Home button zoom/center** — Pan/zoom away, call `zoomToInitialExtent()`, verify store matches initial | P1       | Store zoom + center comparison                                     |
| 45  | **Rotation via API** — Call `mapController.rotate(45)`, verify store rotation = 45                      | P1       | Store-based check                                                  |
| 46  | **Projection via API** — Call `mapController.setProjection(3857)`, verify store projection = 3857       | P1       | Already covered in suite-map-varia; confirm store value            |

### Projection & Rotation Store Checks (suite-map-varia)

| #   | Test                                                                                               | Priority | Notes                                           |
| --- | -------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------- |
| 47  | **3 projections load** — Create maps in 3978, 3857, 3573, verify store projection matches for each | P1       | `createMapFromConfigFast` × 3, store check each |
| 48  | **Rotation reset to 0** — Rotate, reset, verify store rotation = 0                                 | P1       | `rotate(45)` → `rotate(0)` → store check        |

### Legend Controls (suite-map-varia or new suite)

| #   | Test                                                                                                              | Priority | Notes                                                          |
| --- | ----------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------- |
| 49  | **Collapse all legend entries** — Call `layerController.setAllLayerCollapsed(true)`, verify store collapsed state | P1       | Store check via `getStoreLayerLegendCollapsedSet(mapId)`       |
| 50  | **Expand all legend entries** — Call `layerController.setAllLayerCollapsed(false)`, verify store collapsed state  | P1       | Store check via `getStoreLayerLegendCollapsedSet(mapId)`       |
| 51  | **Toggle all layer visibility off** — Toggle all visibility off, verify store visibility for each layer is false  | P1       | Store check per layer path                                     |
| 52  | **Toggle all layer visibility on** — Toggle all visibility on, verify store visibility for each layer is true     | P1       | Store check per layer path                                     |
| 53  | **Toggle single layer visibility** — Call `layerController.setLayerVisibility()`, verify store updates            | P1       | Store check for single layer path                              |
| 54  | **Zoom to layer extent from legend** — Call `mapController.zoomToExtent()` with layer bounds, verify map extent   | P2       | Overlaps with #5; legend-specific entry point                  |
| 55  | **Class count DOM text** — Load layer with style classes, verify DOM text shows "y of x classes"                  | P1       | DOM `textContent` check on subtitle element                    |
| 56  | **Toggle style class off updates filter** — Toggle one class off, verify `layerFilterClass` store updates         | P1       | Overlaps with #16; call `toggleItemVisibility()` + store check |
| 57  | **Toggle all style classes off** — Toggle all classes off, verify filter excludes all and count shows "0 of x"    | P1       | Store filter check + DOM count text                            |
| 58  | **Toggle all style classes on** — Toggle all back on, verify filter is cleared and count shows "x of x"           | P1       | Store filter check + DOM count text                            |

### Layers Panel (suite-layer or suite-map-varia)

| #   | Test                                                                                                                           | Priority | Notes                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------- |
| 59  | **Reorder layer store check** — Call `layerController.reorderLayer()`, verify store `orderedLayers` updates                    | P1       | Store check pre/post reorder                                                    |
| 60  | **Reorder with groups** — Reorder a group layer, verify child paths remain under parent in `orderedLayers`                     | P1       | Store `orderedLayers` hierarchy check                                           |
| 61  | **Collapse/Expand all layers panel** — Call `setAllLayerCollapsed()`, verify store collapsed state                             | P1       | Same API as legend #49-50; layers panel shares ToggleAll                        |
| 62  | **Toggle layer visibility** — Call `layerController.setLayerVisibility()`, verify store visibility updates                     | P1       | Overlaps with legend #53; layers panel entry point                              |
| 63  | **Toggle all on group** — Toggle all children visibility on a group, verify store per child                                    | P1       | Store visibility check per child path                                           |
| 64  | **Toggle all with error sublayers** — Toggle all on group with error child, verify no crash, valid children toggle             | P1       | Error child skipped, valid children store check                                 |
| 65  | **Add duplicate geocore UUID** — Call `addGeoviewLayerByGeoCoreUUID()` twice with same UUID, verify rejection                  | P1       | Overlaps with config #7; add-layer entry point                                  |
| 66  | **Type dropdown count** — Check DOM for layer type dropdown options, verify 16+ types listed                                   | P1       | DOM option count check                                                          |
| 67  | **Data Table shortcut (footer tab)** — Click shortcut with `data-table` in footerBar, verify active tab switches to data-table | P1       | Store check: `activeFooterBarTab` changes to `data-table`                       |
| 78  | **Data Table shortcut button presence** — Verify button DOM exists for layer registered in `datatableSettings` store           | P1       | DOM `getElementById(mapId-footerBar-table-details)` + store `datatableSettings` |
| 68  | **Zoom to layer extent** — Call `mapController.zoomToExtent()` for a layer, verify store extent                                | P2       | Overlaps with #5 and legend #54                                                 |
| 69  | **Remove layer** — Call `layerController.deleteLayer()`, verify layer path removed from store                                  | P1       | Store `orderedLayers` no longer contains path                                   |
| 70  | **Group opacity capping** — Set group opacity to 50%, verify children `getOpacity()` ≤ 0.5                                     | P1       | Overlaps with #13; `setOpacity()` + `getOpacity()` check per child              |
| 71  | **Nested group opacity** — Set parent 50%, child group 80%, verify child effective = 50%                                       | P1       | `Math.min(parent, child)` capping verification                                  |
| 72  | **Toggle child visibility from right panel** — Call `layerController.setLayerVisibility()` on child, verify store              | P1       | Store visibility check for child path                                           |
| 73  | **Toggle style class from layers panel** — Toggle style item, verify `layerFilterClass` store                                  | P1       | Overlaps with legend #56; layers panel entry point                              |
| 74  | **Style class count from layers panel** — Verify DOM subtitle shows "y of x classes"                                           | P1       | Overlaps with legend #55; layers panel DOM check                                |
| 75  | **inVisibleRange store check** — Zoom in/out of layer's range, verify `isInVisibleRange()` returns correct boolean             | P1       | `setMapZoomLevel()` + `isInVisibleRange()` check                                |
| 76  | **Vector tile projection warning** — Switch projection with vector tile layer loaded, verify notification emitted              | P1       | Notification store check after `setProjection()`                                |

### Details Panel (suite-details or suite-map-varia)

| #   | Test                                                                                                             | Priority | Notes                                                                 |
| --- | ---------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------- |
| 79  | **Clear all highlights** — Call `clearHighlightsUnchecked()`, verify no highlighted features remain on the map   | P1       | Store/API check: no highlighted features after clear                  |
| 80  | **Non-queryable layer excluded** — Load config with `queryable: false`, query map, verify layer not in results   | P1       | Already in suite-map-varia (`testNonQueryableLayerNotInDetails`)      |
| 81  | **Zoom to feature** — Trigger zoom-to-feature on a query result, verify map extent changes                       | P2       | Store extent check after zoom                                         |
| 82  | **nameField as label** — Query a layer with configured `nameField`, verify feature label matches the field value | P2       | `createMapFromConfigFast` with 29-summary config + query result check |

### Data Table (suite-data-table or suite-map-varia)

| #   | Test                                                                                                                               | Priority | Notes                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| 83  | **Row count matches store** — Open data table, verify displayed row count matches `allFeaturesDataArray` length for that layer     | P1       | Store `allFeaturesDataArray` count check                               |
| 84  | **geoviewID column hidden by default** — Check store `columnVisibilityRecord.geoviewID === false`                                  | P1       | Store default state check                                              |
| 85  | **Filter by extent unavailable for Esri Dynamic** — Select Esri Dynamic layer, verify filter toggle absent/disabled                | P1       | DOM/store check: `filterDataToExtent` not available for dynamic layers |
| 86  | **Clear filters resets state** — Apply column filter, click Clear, verify store `columnFiltersRecord` is empty                     | P1       | Store check pre/post clear                                             |
| 87  | **tableFilters store on apply** — Apply filter to map, verify `tableFilters[layerPath]` store contains filter string               | P1       | Store check after `applyMapFilters()`                                  |
| 88  | **Apply-to-map disabled during global search** — Set global search text, verify `mapFilteredRecord` toggle disabled                | P1       | Store/DOM check: toggle disabled when `globalFilterRecord` non-empty   |
| 89  | **layerFilterClass reflected in table** — Toggle style classes off, verify store `layerFilterClass` affects table                  | P1       | Overlaps with legend #56; table perspective                            |
| 90  | **allFeaturesDataArray populated** — Open data table, verify store array has entries                                               | P1       | Store basic population check                                           |
| 91  | **rowsFilteredRecord count** — Apply filter, verify `layersDataTableSetting[layerPath].rowsFilteredRecord` matches displayed count | P1       | Store value vs DOM count comparison                                    |
| 92  | **mapFilteredRecord boolean** — Toggle "Apply filter to map" ON, verify store `mapFilteredRecord === true`                         | P1       | Store boolean check                                                    |

### View Settings (suite-map-config)

| #   | Test                                                                                                                                                            | Priority | Notes                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| 94  | **Initial view vs home view** — Load 27-view-settings config, verify initial zoom = 7 (Ottawa), call `zoomToInitialExtent()`, verify zoom changes to 4 (Canada) | P1       | `createMapFromConfigFast` + store zoom/center comparison pre/post Home |
| 95  | **Home button navigates to homeView** — After `zoomToInitialExtent()`, verify store center ≈ `[-95, 60]` (homeView coordinates)                                 | P1       | Store center check with tolerance                                      |

### Projection Interactions (suite-map-varia)

| #   | Test                                                                                                                       | Priority | Notes                                                                      |
| --- | -------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------- |
| 98  | **Vector tile projection warning** — Switch projection with VT layer loaded, verify notification emitted and layer removed | P1       | Overlaps with layers #76; notification store check after `setProjection()` |

### Initial Settings (suite-map-config)

| #   | Test                                                                                                                                        | Priority | Notes                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------- |
| 99  | **Remove control enabled** — Load 23b config, verify esriFeature layer has `controls.remove === true` in store                              | P1       | Store check: `getStoreLayerControls()` for that layer path        |
| 100 | **Legend collapsed initial state** — Load 23b config, verify GeoJSON group store `legendCollapsed === true`                                 | P1       | Store check: `getStoreLayerLegendCollapsed()` for that layer path |
| 101 | **Custom opacity 0.7** — Load 23b config, verify esriImage layer `getOpacity() === 0.7`                                                     | P1       | Same pattern as existing 0.5 test; OL layer opacity check         |
| 102 | **Parent controls cascade to children** — Load 23c config, verify children of geojsonLYR1 inherit `highlight: false, zoom: false` from root | P1       | Store `getStoreLayerControls()` per child path                    |
| 103 | **Group-level override** — Load 23c config, verify each geojsonLYR2 group has different controls inherited by children                      | P1       | Store `getStoreLayerControls()` per group path                    |
| 104 | **OGC Feature initial filter** — Load 23a config, verify `layerFilter` store contains correct filter string for OGC Feature layer           | P1       | Store `getStoreLayerFilter()` or `getInitialFilter()` check       |
| 105 | **WFS initial filter** — Load 23a config, verify WFS layer filter = `STATE_ABBR = 'NY'` in store                                            | P1       | Store filter string comparison                                    |
| 106 | **Esri Dynamic initial filter** — Load 23a config, verify filter = `E_Province = 'Manitoba'` in store                                       | P1       | Store filter string comparison                                    |
| 107 | **Esri Feature initial filter** — Load 23a config, verify filter = `death = 'yes'` in store                                                 | P1       | Store filter string comparison                                    |
| 108 | **GeoJSON initial filter** — Load 23a config, verify filter = `Province = 'Quebec'` in store                                                | P1       | Store filter string comparison                                    |
| 109 | **Filter reflected in data table** — Load 23a config, open data table, verify row count matches filtered feature count                      | P1       | Store `allFeaturesDataArray` count check against expected         |

### Swiper Plugin (suite-swiper)

| #   | Test                                                                                                                           | Priority | Notes                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | -------- | ---------------------------------- |
| 110 | **Add layer to swiper** — Call `activateForLayer`, verify store `swiperLayerPaths` contains the layer path                     | P1       | Store array check after activate   |
| 111 | **Remove layer from swiper** — Call `deActivateForLayer`, verify store `swiperLayerPaths` no longer contains path              | P1       | Store array check after deactivate |
| 112 | **Remove all swiper layers** — Call `deActivateAll`, verify store `swiperLayerPaths` is empty                                  | P1       | Store array length = 0             |
| 113 | **Add layer after remove all** — Call `deActivateAll` then `activateForLayer`, verify store has new path                       | P1       | Store recovery check               |
| 114 | **Set vertical orientation** — Call `setOrientation('vertical')`, verify store `swiperOrientation === 'vertical'`              | P1       | Store string check                 |
| 115 | **Set horizontal orientation** — Call `setOrientation('horizontal')`, verify store `swiperOrientation === 'horizontal'`        | P1       | Store string check                 |
| 116 | **Switch orientation** — Call `setOrientation('vertical')` then `setOrientation('horizontal')`, verify store updates each time | P1       | Sequential store checks            |

---

## Not Recommended for Automation

These tests require visual inspection, user interaction, or external services that make automation unreliable:

| Test                           | Reason                                                |
| ------------------------------ | ----------------------------------------------------- |
| Full screen panel visual check | Requires visual/DOM size verification                 |
| Guide content search           | Text search in rendered HTML, fragile                 |
| Basemap tile rendering         | Visual check — tiles loaded but appearance subjective |
| Map export image content       | Requires image comparison (pixel-level)               |
| Lightbox images (animated GIF) | Requires visual animation verification                |
| Keyboard navigation / WCAG     | Requires focus tracking and screen reader interaction |
| Attribution scroll behavior    | CSS scroll behavior, hard to assert programmatically  |
| Drag-and-drop reorder (UI)     | Requires simulating DnD events, fragile               |
| Geochart rendering             | Canvas/SVG chart rendering, visual check              |
| Swiper drag position           | Pixel-level clip verification                         |

---

## How to Create These Tests

Use the **TestCreator** agent:

```
@TestCreator Create test #7 from the automation candidates list:
"Duplicate geocore UUID — Load config with duplicate UUID, verify orderedLayers has suffix"
```

Or for batch creation:

```
@TestCreator Review the automation candidates in docs/programming/release-testing/27-automation-candidates.md
and create P1 tests for suite-config
```

Refer to [creating-tests.md](../../app/testing/creating-tests.md) for the framework patterns and [test-catalog.md](../../app/testing/test-catalog.md) for the existing test inventory.
