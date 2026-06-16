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

| Release Plan Item                  | Existing Test                                                       |
| ---------------------------------- | ------------------------------------------------------------------- |
| North arrow rotation (LCC)         | `suite-map-varia` → `testNorthArrowRotationLCC`                     |
| Projection switch                  | `suite-map-varia` → `testSwitchProjectionAndExtent`                 |
| Map zoom                           | `suite-map-varia` → `testMapZoom`                                   |
| Zoom to extent                     | `suite-map-varia` → `testZoomToExtent`                              |
| Basemap create/switch              | `suite-map-varia` → `testCreateAndSetBasemap`                       |
| Language switch                    | `suite-map-varia` → `testSetLanguage`                               |
| Footer/app bar tabs                | `suite-map-varia` → `testFooterBarSelectTab`, `testAppBarSelectTab` |
| Non-queryable layer not in details | `suite-map-varia` → `testNonQueryableLayerNotInDetails`             |
| Hoverable state                    | `suite-map-varia` → `testLayerHoverableState`                       |
| Overview map show/hide on zoom     | `suite-map-config` → `testOverviewMapHideOnZoom`                    |
| Overview map + projection          | `suite-map-config` → `testOverviewMapHideOnZoomWithReprojection`    |
| Initial settings states            | `suite-map-config` → `testInitialSettingsState*`                    |
| Initial settings controls          | `suite-map-config` → `testInitialSettingsControlsAllFalse`          |
| Opacity cascading                  | `suite-map-config` → `testInitialSettingsOpacityCascading*`         |
| View settings zoom constraints     | `suite-map-config` → `testViewSettingsZoomConstraints`              |
| Error layer configs (all types)    | `suite-config` → `test*BadUrl`                                      |
| Settings cascade to sublayers      | `suite-config` → `testSettingsCascadeToSublayers`                   |
| Swiper lifecycle                   | `suite-swiper` → `testSwiperLifecycle`                              |
| All layer types load correctly     | `suite-layer` → 34 tests                                            |
| All utility functions              | `suite-utilities` → 52 tests                                        |

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
@TestCreator Review the automation candidates in docs/programming/release-testing/22-automation-candidates.md
and create P1 tests for suite-config
```

Refer to [creating-tests.md](../../app/testing/creating-tests.md) for the framework patterns and [test-catalog.md](../../app/testing/test-catalog.md) for the existing test inventory.
