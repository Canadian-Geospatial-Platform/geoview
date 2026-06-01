# GeoView API Documentation

> **Full API Reference:** [API — TypeDoc](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/API.html)
>
> TypeDoc is auto-generated from source code and always reflects the current method signatures, parameters, return types, and thrown errors.

## Overview

The `API` class is the main entry point for interacting with GeoView functionality. It provides methods for creating, reloading, and deleting map viewers, and gives access to layer management, plugins, and utility functions.

## Properties

| Property    | Type               | Description                                    |
| ----------- | ------------------ | ---------------------------------------------- |
| `config`    | `typeof ConfigApi` | Access to configuration API (work in progress) |
| `layer`     | `typeof LayerApi`  | Access to layer management static API          |
| `plugin`    | `typeof Plugin`    | Access to package functionality                |
| `utilities` | `Object`           | Collection of utility functions                |

**Important Note:** Internally we use the term plugins for api reference but package when we use it as a working plugin.

---

## Common Usage Patterns

### Creating a Map

```typescript
const mapViewer = await cgpv.api.createMapFromConfig(
  "mapDiv",
  JSON.stringify({
    map: {
      interaction: "dynamic",
      viewSettings: { zoom: 4, center: [-95, 55], projection: 3978 },
      basemapOptions: { basemapId: "transport", shaded: true },
    },
    theme: "dark",
    language: "en",
  }),
  800,
);
```

Use `createMapFromConfigFast()` to return immediately without waiting for the map to be ready.

### Reloading a Map

```typescript
// Reload with a new config
await cgpv.api.reload("mapId", newConfig);

// Reload using current state (e.g., after language change)
await cgpv.api.reloadWithCurrentState("mapId");
```

### Deleting a Map

```typescript
await cgpv.api.deleteMapViewer("mapId", true); // true = also remove the div
```

### Accessing a Map Viewer

```typescript
// Synchronous — throws if not found
const mapViewer = cgpv.api.getMapViewer("mapId");

// Asynchronous — waits for the map to be created
const mapViewer = await cgpv.api.getMapViewerAsync("mapId");

// Check existence
if (cgpv.api.hasMapViewer("mapId")) { ... }

// List all map IDs
const ids = cgpv.api.getMapViewerIds();
```

### Utilities

```typescript
cgpv.api.utilities.core; // Core utility functions
cgpv.api.utilities.geo; // Geographic utility functions
cgpv.api.utilities.projection; // Projection utilities
cgpv.api.utilities.date; // Date management utilities
```

---

## See Also

- **[API — TypeDoc](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/API.html)** — Complete method reference
- [cgpv.md](cgpv.md) — Global cgpv object documentation
- [map-viewer-api.md](map-viewer-api.md) — MapViewer instance methods
- [layer-api.md](layer-api.md) — Layer management API
- [controllers.md](app/events/controllers.md) — Controllers API documentation
- [api-utilities.md](utilities.md) — Utilities documentation
