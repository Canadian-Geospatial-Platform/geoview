# 17d — Panel Packages (About, AOI, Custom Legend, STAC Browser)

Panel-based plugin packages.

## About Panel

Config: `configs/navigator/demos/18-package-about-panel.json`

- [ ] **Panel opens** — Verify the about panel opens from the app bar.
- [ ] **Title, logo, description, link** — Verify all configured content fields display correctly.
- [ ] **External markdown** — Load `18-package-about-panel-md.json`. Verify the panel renders content from the external markdown file.
- [ ] **Inline markdown** — Load `18-package-about-panel-md-strings.json`. Verify the panel renders inline markdown strings.
- [ ] **`isOpen: true`** — Configure `isOpen: true`. Verify the about panel opens automatically on load.

## Area of Interest (AOI)

Config: `configs/navigator/demos/16-package-area-of-interest.json`

- [ ] **Panel opens** — Verify the AOI panel opens from the app bar.
- [ ] **AOI list** — Verify all configured areas of interest are listed with their images and titles.
- [ ] **Click AOI** — Click an area of interest. Verify the map zooms to the configured extent.
- [ ] **`isOpen: true`** — Configure `isOpen: true`. Verify the AOI panel opens automatically on load.

## Custom Legend

Config: `configs/navigator/demos/17-package-custom-legend.json`

- [ ] **Panel opens** — Verify the custom legend panel opens from the app bar.
- [ ] **Layer items** — Verify layer-type items display with their legend symbols.
- [ ] **Header items** — Verify header-type items display with configured text and styling.
- [ ] **Group items** — Verify group-type items are collapsible and contain their children.
- [ ] **`isOpen: true`** — Configure `isOpen: true`. Verify the custom legend panel opens automatically on load.

## STAC Browser

### Browse Mode

- [ ] **Panel opens** — Verify the STAC browser panel opens from the app bar.
- [ ] **Collections load** — Verify collections are fetched and listed from the configured STAC API URL.
- [ ] **Collection detail** — Click a collection. Verify the detail view shows description and items list.
- [ ] **Item detail** — Click an item. Verify metadata, thumbnail, and asset list display.
- [ ] **Item footprint preview** — Verify the item's geographic footprint displays on the map.
- [ ] **Zoom to item** — Click the zoom-to-extent control. Verify the map zooms to the item's bounding box.
- [ ] **Add to map** — Select a STAC item. Verify it adds as a layer on the map.
- [ ] **Preview thumbnails** — Verify collection thumbnails display when `displayPreview: true`.

### Search Mode

- [ ] **Switch to search mode** — Toggle from Browse to Search mode. Verify the filter panel appears.
- [ ] **Collection filter** — Select one or more collections to narrow the search.
- [ ] **Temporal filter** — Set a date range (start/end). Verify results are limited to that time window.
- [ ] **Spatial filter (bbox)** — Enable spatial filter. Verify "Use current map extent" applies the map's bounding box.
- [ ] **Spatial filter (fully contained)** — Toggle "Fully contained in extent". Verify only items fully within the bbox appear.
- [ ] **Keyword search** — Enter a keyword. Verify results are filtered by text.
- [ ] **Pagination** — If results exceed one page, verify Next/Previous page controls work.
- [ ] **Results grouped by collection** — Verify search results are grouped under their collection headings.

### Config Options

- [ ] **`isOpen: true`** — Configure `isOpen: true`. Verify the STAC browser panel opens automatically on load.
