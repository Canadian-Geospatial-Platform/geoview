# geoview-stac-browser

A GeoView plugin that provides a STAC (SpatioTemporal Asset Catalog) browser panel. Allows users to browse, filter, and preview STAC collections and items on the map.

## Features

- Browse STAC API collections and items
- Filter by collection, temporal extent, spatial extent (map bbox), and keywords
- Preview item footprints and thumbnails on the map
- View item details including assets and metadata
- Display COGs and thumbnails as temporary map overlays (not legend layers)
- Zoom to item/collection extents
- Bilingual support (EN/FR)

While a search is pending, the filters remain visible with a circular loading indicator. Searches with no matches show "No results" on the filter page; only non-empty results open the results view. The results view always provides a Back to search button, including during pagination and on empty result pages, and preserves the entered filter values.

Item and collection zooms fit their extent in the map area beside the open STAC panel, using its rendered width, without a STAC-specific maximum zoom level (configured map limits still apply). When the panel covers the entire map, zoom uses normal padding instead. **Zoom to search** in the results toolbar restores the visible map extent saved when the search was submitted without adding a panel offset, even when spatial filtering was off. Pagination and item zoom do not replace that saved extent.

## Configuration

```json
{
  "stacUrl": "https://datacube.services.geo.ca/stac/api",
  "browseEnabled": true,
  "defaultMode": "browse",
  "filters": {
    "collections": true,
    "temporal": true,
    "spatial": true,
    "keyword": true,
    "sort": true,
    "properties": false
  },
  "defaults": {
    "collections": [],
    "useMapExtent": false,
    "containedInExtent": false,
    "limit": 20,
    "sortBy": [{ "field": "datetime", "direction": "desc" }]
  },
  "displayPreview": true,
  "isOpen": false
}
```

### Properties

| Property                     | Type               | Default    | Description                                                                                |
| ---------------------------- | ------------------ | ---------- | ------------------------------------------------------------------------------------------ |
| `stacUrl`                    | string             | (required) | Base URL of the STAC API                                                                   |
| `browseEnabled`              | boolean            | `true`     | Enable collection browsing; when false, only search mode is available                      |
| `defaultMode`                | string             | `"browse"` | Initial `browse` or `search` view; search is always used when browsing is disabled         |
| `searchDescription`          | string             | -          | Optional custom text displayed above the search filters                                    |
| `collections.include`        | string[]           | -          | Collection IDs to show (all when omitted)                                                  |
| `collections.exclude`        | string[]           | -          | Collection IDs to hide                                                                     |
| `collections.default`        | string             | -          | Collection opened at startup (opened automatically when only one collection is allowed)    |
| `filters.collections`        | boolean            | `true`     | Enable collection filter (shown when more than one collection is allowed)                  |
| `filters.temporal`           | boolean            | `true`     | Enable temporal extent filter                                                              |
| `filters.spatial`            | boolean            | `true`     | Enable spatial extent (bbox) filter                                                        |
| `filters.keyword`            | boolean            | `true`     | Enable keyword search (hidden when the server does not support free-text search)           |
| `filters.sort`               | boolean            | `true`     | Show interactive sort controls when the server supports sorting                            |
| `filters.properties`         | boolean / array    | unset      | Show CQL2 filters for all queryables (`true`) or an allowlist of field names/configs       |
| `defaults.collections`       | string[]           | `[]`       | Pre-selected collection IDs                                                                |
| `defaults.useMapExtent`      | boolean            | `false`    | Pre-select Use current map extent when spatial filtering is enabled                        |
| `defaults.containedInExtent` | boolean            | `false`    | Pre-select Fully contained in extent; applies only when Use current map extent is selected |
| `defaults.bbox`              | number[]           | -          | Default bbox [west, south, east, north], applied when the map extent is not used           |
| `defaults.datetime`          | string             | -          | Default ISO 8601 datetime interval (pre-fills the temporal filter)                         |
| `defaults.limit`             | number             | `20`       | Items per page                                                                             |
| `defaults.sortBy`            | object[]           | -          | Sort criteria `{ field, direction }`, applied only when the server supports sorting        |
| `itemView.titleField`        | string             | -          | Dot path of the item title field (defaults to `properties.title`, then `id`)               |
| `itemView.summaryFields`     | object[]           | -          | Fields shown on item cards: `{ field, label?, format? }` (defaults to the item date)       |
| `itemView.metadataFields`    | `"all"` / object[] | `"all"`    | Fields shown in the metadata view                                                          |
| `itemView.excludeFields`     | string[]           | -          | Dot paths never shown in the metadata view                                                 |
| `collectionOverrides`        | object             | -          | Per-collection `itemView`, `preview`, and `actions` overrides                              |
| `preview.mode`               | string             | `"auto"`   | `auto`, `cog`, `thumbnail` or `none`. Previews are map overlays, never added to the legend |
| `preview.assetPriority`      | string[]           | -          | Asset roles or keys used to pick the preview asset, in priority order                      |
| `preview.opacity`            | number             | `1`        | Opacity of the preview overlay                                                             |
| `footprintStyles.collection` | object             | blue / 0   | Color and fill opacity for the collection extent on the map                                |
| `footprintStyles.search`     | object             | orange / 0 | Color and fill opacity for search-result footprints on the map                             |
| `actions.*`                  | boolean            | `true`     | Toggle item actions: `zoom`, `showOnMap`, `download`, `copyUrl`                            |
| `displayPreview`             | boolean            | `true`     | Master switch for map previews                                                             |
| `isOpen`                     | boolean            | `false`    | Whether panel opens automatically                                                          |

Field paths use dot notation into the STAC item (`id`, `collection`, `properties.scale`, `assets.thumbnail.href`). Supported `format` values: `text`, `date`, `datetime`, `number`, `epsg`, `url`, `json`. A `label` can be plain text or a translation key.

### Initial view and spatial defaults

Set `browseEnabled: false` for search-only catalogs. This hides the mode selector and collection-browsing navigation, even if `defaultMode` is `"browse"`. With browsing enabled, `defaultMode: "search"` opens the search form without opening the default collection.

Set `searchDescription` to custom text shown at the top of the search form; omit it or use an empty string to hide it. The value is displayed as provided and is not treated as a translation key.

`defaults.useMapExtent` and `defaults.containedInExtent` pre-select the spatial checkboxes without submitting a search. The current map extent is read when the user searches, so moving the map before searching uses the new extent. Users can change either checkbox; Clear filters restores the configured defaults. When `filters.spatial` is false, the map extent is not selected.

Fully contained results are filtered in the browser. Each results page checks at most 10 API pages, so a page can show fewer items, or none, while **Next** keeps searching.

### Queryable property filters and sorting

When the STAC API advertises CQL2 JSON and `filters.properties` is enabled, the browser loads catalog `/queryables` or the selected collections' `/queryables` endpoints. It creates type-aware controls for scalar fields and sends them as a CQL2 JSON `filter` with `filter-lang: cql2-json`. With multiple collections selected, only fields shared by every selected collection are offered. Geometry queryables are omitted; use the map extent control for spatial searches.

`filters.properties: true` exposes every scalar queryable in server order. To limit the UI and set the display order, provide field names or labeled objects. Fields appear in the configured array order; unavailable and geometry fields are skipped:

```json
"filters": {
  "properties": [
    { "field": "scale", "label": "Scale" },
    { "field": "delivery_date", "label": "Delivery date" }
  ]
}
```

Sorting is available when `/conformance` advertises search sorting and `filters.sort` is not false. Users can choose a queryable field and direction. `defaults.sortBy` sets the initial sort, for example `[{ "field": "datetime", "direction": "desc" }]`.

### Collection-specific overrides

`collectionOverrides` is keyed by STAC collection ID. Each override merges over the package-level `itemView`, `preview`, `actions`, and `footprintStyles` settings, allowing collections with different metadata, asset, and footprint styles to share a browser:

```json
"collectionOverrides": {
  "NAPL": {
    "itemView": {
      "titleField": "properties.order_key",
      "summaryFields": [
        { "field": "properties.datetime", "label": "Date", "format": "date" },
        { "field": "properties.scale", "label": "Scale", "format": "number" }
      ],
      "metadataFields": "all"
    },
    "preview": { "mode": "thumbnail", "opacity": 0.8 }
  }
}
```

The STAC `datetime` parameter filters item acquisition time. A service field such as EODMS NAPL's `delivery_date` is separate and should be filtered through queryables/CQL2.

### Example - single collection (EODMS NAPL)

```json
{
  "stacUrl": "https://eodms-sgdot.nrcan-rncan.gc.ca/search",
  "browseEnabled": false,
  "defaultMode": "search",
  "searchDescription": "Use the geolocator to search within a predefined extent.",
  "collections": { "include": ["NAPL"], "default": "NAPL" },
  "filters": {
    "sort": true,
    "properties": ["scale", "altitude", "roll_number", "delivery_date"]
  },
  "defaults": {
    "useMapExtent": true,
    "containedInExtent": true,
    "limit": 50,
    "sortBy": [{ "field": "datetime", "direction": "desc" }]
  },
  "collectionOverrides": {
    "NAPL": {
      "itemView": {
        "titleField": "properties.order_key",
        "summaryFields": [
          { "field": "properties.datetime", "label": "Date", "format": "date" },
          { "field": "properties.scale", "label": "Scale", "format": "number" },
          { "field": "properties.nts_map", "label": "NTS map" }
        ],
        "metadataFields": "all"
      },
      "preview": { "mode": "thumbnail", "opacity": 0.8 }
    }
  },
  "isOpen": true
}
```
