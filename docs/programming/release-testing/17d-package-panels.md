# 17d — Panel Packages (About, AOI, Custom Legend, STAC Browser)

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-17d-panels.html](../../packages/geoview-core/public/templates/release-testing/rt-17d-panels.html) — Map 1 (About panel), Map 2 (AOI panel), Map 3 (Custom Legend panel).
>
> **Navigator configs:** `demos/18-package-about-panel.json`, `demos/16-package-area-of-interest.json`, `demos/17-package-custom-legend.json`

Panel-based plugin packages.

## About Panel

Config: `configs/navigator/demos/18-package-about-panel.json`

| Test              | Description                                     | Steps                                                                   | Expected Result                                                  | Auto |
| ----------------- | ----------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------- | ---- |
| Panel opens       | About panel opens from app bar                  | 1. Click the About button in the app bar                                | About panel opens                                                | M    |
| Content fields    | Title, logo, description, link display          | 1. Open the about panel                                                 | All configured content fields (title, logo, description) display | M    |
| External markdown | Panel renders external markdown file            | 1. Load `18-package-about-panel-md.json`<br>2. Open the about panel     | Panel renders content from the external markdown file            | M    |
| Inline markdown   | Panel renders inline markdown strings           | 1. Load `18-package-about-panel-md-strings.json`<br>2. Open about panel | Panel renders inline markdown strings correctly                  | M    |
| isOpen: true      | About panel opens automatically when configured | 1. Configure `isOpen: true`<br>2. Load the map                          | About panel opens automatically on load                          | C    |

## Area of Interest (AOI)

Config: `configs/navigator/demos/16-package-area-of-interest.json`

| Test         | Description                                   | Steps                                          | Expected Result                                                    | Auto |
| ------------ | --------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------ | ---- |
| Panel opens  | AOI panel opens from app bar                  | 1. Click the AOI button in the app bar         | AOI panel opens                                                    | M    |
| AOI list     | All configured areas listed                   | 1. Open the AOI panel                          | All configured areas of interest are listed with images and titles | M    |
| Click AOI    | Map zooms to AOI extent on click              | 1. Click an area of interest in the list       | Map zooms to the configured extent                                 | M    |
| isOpen: true | AOI panel opens automatically when configured | 1. Configure `isOpen: true`<br>2. Load the map | AOI panel opens automatically on load                              | C    |

## Custom Legend

Config: `configs/navigator/demos/17-package-custom-legend.json`

| Test         | Description                                       | Steps                                               | Expected Result                                             | Auto |
| ------------ | ------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------- | ---- |
| Panel opens  | Custom legend panel opens from app bar            | 1. Click the Custom Legend button in the app bar    | Custom legend panel opens                                   | M    |
| Layer items  | Layer-type items display with legend symbols      | 1. Open the custom legend panel                     | Layer-type items display with their legend symbols          | M    |
| Header items | Header-type items display with configured styling | 1. Open the custom legend panel                     | Header-type items display with configured text and styling  | M    |
| Group items  | Group-type items are collapsible with children    | 1. Open the custom legend panel<br>2. Click a group | Group-type items are collapsible and contain their children | M    |
| isOpen: true | Custom legend opens automatically when configured | 1. Configure `isOpen: true`<br>2. Load the map      | Custom legend panel opens automatically on load             | C    |

## STAC Browser

### Browse Mode

| Test              | Description                                | Steps                                                    | Expected Result                                                 | Auto |
| ----------------- | ------------------------------------------ | -------------------------------------------------------- | --------------------------------------------------------------- | ---- |
| Panel opens       | STAC browser opens from app bar            | 1. Click the STAC Browser button in the app bar          | STAC browser panel opens                                        | M    |
| Collections load  | Collections fetched and listed             | 1. Open the STAC browser panel                           | Collections are fetched and listed from the configured STAC API | M    |
| Collection detail | Detail view shows description and items    | 1. Click a collection                                    | Detail view shows description and items list                    | M    |
| Item detail       | Metadata, thumbnail, and assets display    | 1. Click an item within a collection                     | Metadata, thumbnail, and asset list display                     | M    |
| Footprint preview | Item geographic footprint shown on map     | 1. Select an item                                        | Item's geographic footprint displays on the map                 | M    |
| Zoom to item      | Map zooms to item bounding box             | 1. Click the zoom-to-extent control on an item           | Map zooms to the item's bounding box                            | M    |
| Add to map        | STAC item adds as a layer                  | 1. Select a STAC item<br>2. Click the add-to-map control | Item is added as a layer on the map                             | M    |
| Thumbnails        | Collection thumbnails display with preview | 1. Open STAC browser with `displayPreview: true`         | Collection thumbnails display                                   | M    |

### Search Mode

| Test                  | Description                                   | Steps                                                                     | Expected Result                                     | Auto |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------- | ---- |
| Switch to search      | Filter panel appears on mode toggle           | 1. Toggle from Browse to Search mode                                      | Filter panel appears                                | M    |
| Collection filter     | Results narrowed by collection selection      | 1. Select one or more collections in the filter                           | Search results are limited to selected collections  | M    |
| Temporal filter       | Results limited by date range                 | 1. Set a start and end date in the temporal filter                        | Results are limited to that time window             | M    |
| Spatial filter (bbox) | Map extent applied as spatial filter          | 1. Enable spatial filter<br>2. Click "Use current map extent"             | Map's bounding box is applied as spatial filter     | M    |
| Fully contained       | Only items fully within bbox appear           | 1. Toggle "Fully contained in extent"                                     | Only items fully within the bbox appear             | M    |
| Keyword search        | Results filtered by text                      | 1. Enter a keyword in the search field                                    | Results are filtered by the entered keyword         | M    |
| Pagination            | Next/Previous page controls work              | 1. Perform a search that returns multiple pages<br>2. Click Next/Previous | Page controls navigate through results              | M    |
| Results grouped       | Search results grouped by collection headings | 1. Perform a search                                                       | Results are grouped under their collection headings | M    |

### Config Options

| Test         | Description                                      | Steps                                          | Expected Result                                | Auto |
| ------------ | ------------------------------------------------ | ---------------------------------------------- | ---------------------------------------------- | ---- |
| isOpen: true | STAC browser opens automatically when configured | 1. Configure `isOpen: true`<br>2. Load the map | STAC browser panel opens automatically on load | C    |
