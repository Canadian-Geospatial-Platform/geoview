# GeoView API Documentation

> **📚 Complete TypeScript API:** For full type definitions, interfaces, and auto-generated documentation, see [TypeDoc API Reference](https://canadian-geospatial-platform.github.io/geoview/docs/typedoc/)

## Overview

The GeoView API provides a comprehensive interface for managing map viewers, handling events, and accessing various utilities within the GeoView application. This documentation covers the main API class and its functions.

## API Class

The `API` class is the main entry point for interacting with GeoView functionality. It provides methods for managing map viewers, handling events, and accessing utility functions.

```typescript
class API {
  config: ConfigApi;
  plugin: typeof Plugin;
  utilities: {
    core: typeof Utilities;
    geo: typeof GeoUtilities;
    projection: typeof Projection;
    date: typeof DateMgt;
  };
}
```

### Properties

| Property    | Type            | Description                                    |
| ----------- | --------------- | ---------------------------------------------- |
| `config`    | `ConfigApi`     | Access to configuration API (work in progress) |
| `plugin`    | `typeof Plugin` | Access to package functionality                |
| `utilities` | `Object`        | Collection of utility functions                |

**Important Note:** Internally we use the term plugins for api reference and but package when we use it as a working plugin.

## API Methods

### Map Management

#### createMapFromConfig()

Creates a new map viewer instance from a configuration object.

```typescript
createMapFromConfig(
  divId: string,
  mapConfig: TypeMapConfig,
  divHeight?: string
): MapViewer
```

**Parameters:**

- `divId` - The ID of the HTML div element to contain the map
- `mapConfig` - Map configuration object
- `divHeight` - Optional height for the map container (e.g., '600px', '100%')

**Returns:** `MapViewer` instance

**Example:**

```typescript
const mapViewer = cgpv.api.createMapFromConfig(
  "mapDiv",
  {
    map: {
      interaction: "dynamic",
      viewSettings: {
        zoom: 4,
        center: [-95, 55],
        projection: 3978,
      },
      basemapOptions: {
        basemapId: "transport",
        shaded: true,
      },
    },
    theme: "dark",
    language: "en",
  },
  "800px"
);
```

---

#### reload()

Reloads a map with a new configuration or refreshes the current configuration.

```typescript
reload(mapId: string, mapConfig?: TypeMapConfig): void
```

**Parameters:**

- `mapId` - The ID of the map to reload
- `mapConfig` - Optional new map configuration

---

#### deleteMapViewer()

Removes a map viewer instance and cleans up resources.

```typescript
deleteMapViewer(mapId: string, unmountDiv?: boolean): void
```

**Parameters:**

- `mapId` - The ID of the map to delete
- `unmountDiv` - Whether to unmount the React component from the div (default: true)

---

#### getMapViewer()

Gets an existing map viewer instance (throws error if not found).

```typescript
getMapViewer(mapId: string): MapViewer
```

**Parameters:**

- `mapId` - The ID of the map to retrieve

**Returns:** `MapViewer` instance

---

#### getMapViewerAsync()

Gets a map viewer instance asynchronously, waiting for it to be created if necessary.

```typescript
async getMapViewerAsync(mapId: string, timeout?: number): Promise<MapViewer>
```

**Parameters:**

- `mapId` - The ID of the map to retrieve
- `timeout` - Maximum wait time in milliseconds (default: 10000)

**Returns:** Promise resolving to `MapViewer` instance

---

## Utilities

The API provides access to various utility functions through the `utilities` property:

```typescript
utilities: {
  core: Utilities,      // Core utility functions
  geo: GeoUtilities,    // Geographic utility functions
  projection: Projection, // Projection utilities
  date: DateMgt,        // Date management utilities
}
```

For complete documentation of all utility functions, see [api-utilities.md](app/api/utilities.md)

---

## See Also

- [api-utilities.md](app/api/utilities.md) - Complete utilities documentation
- [map-viewer-api-doc.md](app/api/map-viewer-api.md) - MapViewer instance methods
- [layer-api.md](app/api/layer-api.md) - Layer management API
- [event-processors.md](app/events/event-processors.md) - Event processors documentation
- [cgpv.md](app/api/cgpv.md) - Global cgpv object documentation
- [packages.md](app/packages/geoview-core-packages.md) - Geoview core packages
