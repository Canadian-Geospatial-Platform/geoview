# geoview-stac-browser

A GeoView plugin that provides a STAC (SpatioTemporal Asset Catalog) browser panel. Allows users to browse, filter, and preview STAC collections and items on the map.

## Features

- Browse STAC API collections and items
- Filter by collection, temporal extent, spatial extent (map bbox), and keywords
- Preview item footprints and thumbnails on the map
- View item details including assets and metadata
- Add STAC items to the map as ol-stac layers
- Zoom to item/collection extents
- Bilingual support (EN/FR)

## Configuration

```json
{
  "stacUrl": "https://datacube.services.geo.ca/stac/api",
  "filters": {
    "collections": true,
    "temporal": true,
    "spatial": true,
    "keyword": true
  },
  "defaults": {
    "collections": [],
    "limit": 20
  },
  "displayPreview": true,
  "isOpen": false
}
```

### Properties

| Property               | Type     | Default    | Description                             |
| ---------------------- | -------- | ---------- | --------------------------------------- |
| `stacUrl`              | string   | (required) | Base URL of the STAC API                |
| `filters.collections`  | boolean  | `true`     | Enable collection filter                |
| `filters.temporal`     | boolean  | `true`     | Enable temporal extent filter           |
| `filters.spatial`      | boolean  | `true`     | Enable spatial extent (bbox) filter     |
| `filters.keyword`      | boolean  | `true`     | Enable keyword search                   |
| `defaults.collections` | string[] | `[]`       | Pre-selected collection IDs             |
| `defaults.bbox`        | number[] | -          | Default bbox [west, south, east, north] |
| `defaults.datetime`    | string   | -          | Default ISO 8601 datetime interval      |
| `defaults.limit`       | number   | `20`       | Items per page                          |
| `displayPreview`       | boolean  | `true`     | Show preview thumbnails on map          |
| `isOpen`               | boolean  | `false`    | Whether panel opens automatically       |
