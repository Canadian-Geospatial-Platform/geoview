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

## Previous Selection Order

- [ ] **Selection history** — Select multiple features in sequence. Verify the Details panel shows them in the order they were selected (most recent first, or as designed).

## Lightbox Images

- [ ] **Animated GIF** — Query a flood layer feature that has an animated GIF. Verify the lightbox opens and the animation plays.
- [ ] **Multiple images** — Query a polygon feature with multiple images. Verify the lightbox allows navigating between images (previous/next).

## Hover Tooltip

- [ ] **Hover on feature** — Hover over a feature. Verify a tooltip appears with basic feature info.
- [ ] **Hover disabled** — For a layer with hoverable set to false, verify no tooltip appears on hover.

## Non-Queryable Layer

- [ ] **Not in details** — For a layer with `queryable: false`, verify clicking on its features does not show them in the Details panel.

## Details with Swiper

- [ ] **Swiper hidden features** — With the swiper active, verify that features hidden by the swiper are not queryable and do not appear on hover.

---

## Issues Found

<!-- Record any issues below -->
