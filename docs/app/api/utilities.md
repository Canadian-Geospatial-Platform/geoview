# API Utilities

> **Full API Reference — TypeDoc:**
>
> - [GeoUtilities](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/GeoUtilities.html) — Geographic helpers (metadata fetching, WKT, DMS formatting, measurements)
> - [Projection](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/Projection.html) — Coordinate and extent transformations
> - [DateMgt](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/DateMgt.html) — ISO 8601 date formatting, conversion, and parsing
>
> Core utilities are standalone functions (not a class). See [TypeDoc index](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/) and search for individual function names.
>
> TypeDoc is auto-generated from source code and always reflects the current method signatures, parameters, and return types.

GeoView exposes four utility categories through `cgpv.api.utilities`. These are static/module-level helpers — no instance needed.

## Accessing Utilities

```typescript
const { core, geo, projection, date } = cgpv.api.utilities;
```

---

## Core Utilities

General-purpose functions for IDs, string manipulation, object handling, DOM operations, and sanitization.

```typescript
// Generate unique IDs
const id = cgpv.api.utilities.core.generateId(); // 36-char default
const shortId = cgpv.api.utilities.core.generateId(8);

// Validate UUID format
const isValid = cgpv.api.utilities.core.isValidUUID(someId);

// Deep merge configuration objects
const merged = cgpv.api.utilities.core.deepMergeObjects(defaults, overrides);

// Sanitize user-provided HTML
const safe = cgpv.api.utilities.core.sanitizeHtmlContent(untrustedHtml);

// Localized messages with parameter substitution
const msg = cgpv.api.utilities.core.getLocalizedMessage('en', 'layers.total', [42]);

// Add a React component to a DOM element
const root = cgpv.api.utilities.core.addUiComponent('my-div-id', <MyComponent />);

// Delay execution
await cgpv.api.utilities.core.delay(500);
```

---

## Geo Utilities

Geographic helpers for service metadata, WKT conversion, coordinate formatting, and measurements.

```typescript
// Fetch ESRI / WMS service metadata
const esriMeta = await cgpv.api.utilities.geo.getESRIServiceMetadata(esriUrl);
const wmsMeta = await cgpv.api.utilities.geo.getWMSServiceMetadata(
  wmsUrl,
  "layer1,layer2",
);

// Extract map server URL from a service URL
const serverUrl = cgpv.api.utilities.geo.getMapServerUrl(serviceUrl);

// WKT ↔ Geometry conversion
const wkt = cgpv.api.utilities.geo.geometryToWKT(geometry);
const geom = cgpv.api.utilities.geo.wktToGeometry(wktString);

// Format coordinates as DMS
const dms = cgpv.api.utilities.geo.coordFormatDMS(45.4215);

// Measurements
const area = cgpv.api.utilities.geo.getArea(polygonGeometry);
const length = cgpv.api.utilities.geo.getLength(lineGeometry);
const distance = cgpv.api.utilities.geo.calculateDistance(
  coords,
  "EPSG:4326",
  "EPSG:3978",
);
// → { total: number (km), sections: number[] }
```

---

## Projection Utilities

Coordinate and extent transformations between projections.

```typescript
// LonLat ↔ projected coordinates
const projected = cgpv.api.utilities.projection.transformFromLonLat(
  [-75.69, 45.42],
  projection,
);
const lonLat = cgpv.api.utilities.projection.transformToLonLat(
  projected,
  projection,
);

// Transform point arrays between projections
const transformed = cgpv.api.utilities.projection.transformPoints(
  points,
  "EPSG:4326",
  "EPSG:3978",
);

// Transform nested coordinate arrays (handles Coordinate, Coordinate[], Coordinate[][], Coordinate[][][])
const result = cgpv.api.utilities.projection.transformCoordinates(
  coords,
  "EPSG:4326",
  "EPSG:3857",
);

// Transform and densify extents (adds intermediate points for accuracy)
const densified = cgpv.api.utilities.projection.transformAndDensifyExtent(
  extent,
  source,
  dest,
  25,
);
```

---

## Date Utilities

ISO 8601 date formatting, UTC/local conversion, and millisecond helpers.

```typescript
// Format dates
const formatted = cgpv.api.utilities.date.formatDate(new Date(), "YYYY-MM-DD");
const iso = cgpv.api.utilities.date.formatDateToISO(new Date());
const pattern = cgpv.api.utilities.date.formatDatePattern(
  date,
  "year",
  "seconds",
);

// UTC ↔ Local conversion
const utc = cgpv.api.utilities.date.convertToUTC(localDate);
const local = cgpv.api.utilities.date.convertToLocal(utcDate);

// Milliseconds conversion
const ms = cgpv.api.utilities.date.convertToMilliseconds(date);
const dateStr = cgpv.api.utilities.date.convertMilisecondsToDate(ms);
```

---

## Best Practices

1. **Sanitize HTML** — Always use `sanitizeHtmlContent()` for user-provided HTML before rendering
2. **Use `generateId()`** — Prefer GeoView's ID generator over custom UUID logic for consistency
3. **Projection transforms** — Use `transformAndDensifyExtent()` for extents crossing projection boundaries (adds intermediate points for accuracy)
4. **Date formatting** — Use `DateMgt` constants (`ISO_DATE_FORMAT`, `ISO_TIME_FORMAT`) for standard formats
