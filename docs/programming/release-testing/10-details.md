# 10 — Details Panel

Details panel queries, highlighting, lightbox, and coordinate info.

## Basic Queries

- [ ] **Click query** — Click on a feature on the map. Verify the Details panel opens and shows feature info.
- [ ] **Coordinate info** — Verify the coordinate info is displayed for the clicked location.
- [ ] **Multiple features** — Click on an area with overlapping features. Verify all features are listed.

## Layer Query Status

- [ ] **Green on query** — While querying layers, verify the status indicator shows green (querying).
- [ ] **Query complete** — After query completes, verify status updates.

## Highlighting

- [ ] **Selected feature highlight** — Click a feature. Verify it is highlighted on the map.
- [ ] **Add multiple highlights** — Select additional features (if supported). Verify all selected features are highlighted.
- [ ] **Clear highlights** — Click "Clear" / deselect. Verify only the currently selected feature remains highlighted (or all highlights clear).
- [ ] **Clear all** — Clear all selections. Verify no features are highlighted.

## Active Layer Selection

- [ ] **Reselect last active layer** — Query features, select a layer that is **not** the first in the list. Query again at a new location. Verify the previously active layer is reselected (not the first) if it has features in the new results.
- [ ] **Fallback to first available** — Query features, select a layer. Query at a location where that layer has no features. Verify the first available layer with features is selected instead.

## Lightbox Images

- [ ] **Animated GIF** — Query the Historical Flood layer. Click on a feature that has an animated GIF. Verify the lightbox opens and the animation plays.
- [ ] **Multiple images** — Query the GeoJSON sample polygon layer. Click on a feature with multiple images. Verify the lightbox allows navigating between images (previous/next).

## Hover Tooltip

> Toggle hoverable/queryable from settings panel tested in [08 — Layers](08-layers.md#hoverable--queryable).

- [ ] **Hover on vector feature** — Hover over a vector feature (GeoJSON, CSV, Esri Feature, WFS, OGC Feature, etc.). Verify a tooltip appears with basic feature info.
- [ ] **Hover on Esri Dynamic feature** — Hover over an Esri Dynamic layer feature. Verify a tooltip appears.
- [ ] **Hover on WMS feature** — Hover over a WMS layer feature. Verify a tooltip appears.
- [ ] **Hover disabled** — Config: `configs/navigator/demos/23b-initial-settings-states-controls.json`. For a layer with `hover: false` or set to false from the settings panel, verify no tooltip appears on hover.

## Non-Queryable Layer

- [ ] **Not in details** — Config: `configs/navigator/demos/23b-initial-settings-states-controls.json`. For a layer with `queryable: false` or set to false from the settings panel, verify clicking on its features does not show them in the Details panel.

## Feature Navigation

- [ ] **Prev/Next arrows** — Query an area with multiple features on the same layer. Verify prev/next arrows appear to navigate between features.
- [ ] **Navigate between features** — Click next/prev. Verify the highlighted feature changes on the map and the details update.
- [ ] **Zoom to feature** — Click the zoom-to-feature button on a specific feature result. Verify the map zooms to that feature's extent.

## Summary & Out Fields

Config: `configs/navigator/demos/29-summary-outfields.json`

- [ ] **Summary flag hides fields** — Verify fields with `summary: false` are hidden from the details summary view (but available on expand/drill-down).
- [ ] **OutFields limit** — Verify only configured `outfields` are returned in the query results.
- [ ] **nameField as label** — Verify the configured `nameField` is used as the feature display label in the results list.

## Hover Tooltip Positioning

- [ ] **Near top edge** — Hover over a feature near the top of the map. Verify the tooltip repositions below the cursor (doesn't overflow).
- [ ] **Near right edge** — Hover near the right edge. Verify the tooltip doesn't overflow the map container.

## Details with Swiper

> Tested in [17c — Swiper](17c-package-swiper.md#swiper--details-interaction).
