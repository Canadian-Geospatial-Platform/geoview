# GeoView Layers

> **👥 Audience:** Developers using GeoView in their applications
>
> **For Core Contributors:** See [Adding Layer Types](programming/adding-layer-types.md) for implementation details

GeoView Layers are the primary way to display spatial data on your map. This guide explains layer concepts, types, configuration, and usage.

## What is a GeoView Layer?

A **GeoView Layer** is an abstraction that wraps OpenLayers layers and provides a consistent API across different data sources. Each GeoView Layer:

- Has a unique identifier (`geoviewLayerId`)
- Can contain one or more sub-layers (layer hierarchy)
- Manages its own metadata, styling, and configuration
- Provides events for lifecycle management (loading, loaded, error)
- Supports temporal data and filtering

## Layer Categories

GeoView layers are divided into two main categories:

### Raster Layers

Raster layers display image-based data rendered on the server or as tiles.

**Supported Types:**

- `ogcWms` - OGC Web Map Service
- `esriDynamic` - ESRI Dynamic Map Service
- `esriImage` - ESRI Image Service
- `imageStatic` - Static image with geographic bounds
- `xyzTiles` - XYZ tile service (raster tiles)

**Characteristics:**

- Server-rendered images
- Good for large datasets
- Fixed styling (defined on server)
- Limited client-side interaction

### Vector Tile Layers

Vector tile layers display pre-tiled vector data for efficient rendering.

**Supported Types:**

- `vectorTiles` - Mapbox Vector Tiles (MVT) format

**Characteristics:**

- Pre-processed vector tiles
- Client-side styling control
- Efficient for large datasets
- Smooth zoom and rotation
- Smaller file sizes than raster tiles

### Vector Layers

Vector layers display geometry-based data rendered on the client.

**Supported Types:**

- `ogcFeature` - OGC API Features
- `ogcWfs` - OGC Web Feature Service (WFS)
- `esriFeature` - ESRI Feature Service
- `GeoJSON` - GeoJSON file or URL
- `CSV` - CSV file with coordinates
- `KML` - Keyhole Markup Language file
- `WKB` - Well-Known Binary format
- `GeoPackage` - GeoPackage file (converted to GeoJSON/WKB on load)
- `shapefile` - ESRI Shapefile (converted to GeoJSON on load)

**Characteristics:**

- Client-rendered geometries
- Flexible styling
- Rich interaction (selection, hover, filtering)
- Attribute access

> **Note:** `GeoPackage` and `shapefile` are input formats that are automatically converted to appropriate vector layer types (GeoJSON or WKB) during loading.

## Layer Hierarchy

GeoView layers support hierarchical structures:

```
GeoView Layer (geoviewLayerId: "myLayer")
+-- Layer Entry (layerPath: "myLayer/sublayer1")
    +-- Layer Entry (layerPath: "myLayer/sublayer1/feature1")
```

**Layer Path Format:** `geoviewLayerId/entryId/subEntryId/...`

The layer path uniquely identifies each node in the hierarchy and is used for:

- Controlling visibility
- Setting opacity
- Applying filters
- Querying features
- Event handling

## Adding Layers

### Method 1: Add with Configuration

```typescript
const mapViewer = cgpv.api.getMapViewer("mapId");

const result = mapViewer.layer.addGeoviewLayer({
  geoviewLayerId: "myWmsLayer",
  geoviewLayerName: "My WMS Layer",
  geoviewLayerType: "ogcWms",
  metadataAccessPath: "https://example.com/wms",
  listOfLayerEntryConfig: [
    {
      layerId: "layer1",
      layerName: "Layer 1",
    },
  ],
});

console.log("Layer added:", result.layer.getLayerPath());
```

### Method 2: Add from GeoCore UUID

```typescript
// Load layer from GeoCore catalog
await mapViewer.layer.addGeoviewLayerByGeoCoreUUID("uuid-from-geocore", "en");
```

### Method 3: Add from Configuration Array

```typescript
// Load multiple layers at once
await mapViewer.layer.loadListOfGeoviewLayer([
  { geoviewLayerId: "layer1", geoviewLayerType: "ogcWms" /* ... */ },
  { geoviewLayerId: "layer2", geoviewLayerType: "esriFeature" /* ... */ },
]);
```

## Layer Configuration

A layer configuration object contains:

```typescript
interface TypeGeoviewLayerConfig {
  // Required
  geoviewLayerId: string; // Unique identifier
  geoviewLayerType: TypeGeoviewLayerType; // Layer type

  // Recommended
  geoviewLayerName?: string; // Display name
  metadataAccessPath?: string; // Service URL

  // Optional
  initialSettings?: {
    opacity?: number; // 0-1
    visible?: boolean; // true/false
    extent?: Extent; // [minX, minY, maxX, maxY]
  };

  // Layer entries (sublayers)
  listOfLayerEntryConfig?: TypeLayerEntryConfig[];

  // Temporal settings
  serviceDateFormat?: string; // Server date format
  externalDateFormat?: string; // User-facing date format

  // Filter
  layerFilter?: string; // OGC CQL filter
}
```

See [Configuration Reference](app/config/configuration-reference.md) for complete details.

## Working with Layers

### Get Layer Information

```typescript
// Get all layer IDs
const layerIds = mapViewer.layer.getGeoviewLayerIds();

// Get all layer paths (includes sublayers)
const layerPaths = mapViewer.layer.getGeoviewLayerPaths();

// Get layer by path
const layerPath = "myLayer/sublayer1";
const layer = mapViewer.layer.getGeoviewLayerByLayerPath(layerPath);

// Get layer configuration
const config = mapViewer.layer.getLayerConfig(layerPath);
```

### Control Visibility

```typescript
// Get visibility
const isVisible = mapViewer.layer.getVisible(layerPath);

// Set visibility
mapViewer.layer.setVisible(layerPath, true);
```

### Control Opacity

```typescript
// Get opacity
const opacity = mapViewer.layer.getOpacity(layerPath);

// Set opacity (0 = transparent, 1 = opaque)
mapViewer.layer.setOpacity(layerPath, 0.7);
```

### Remove Layers

```typescript
// Remove specific layer
mapViewer.layer.removeLayerUsingPath(layerPath);

// Remove all layers
mapViewer.layer.removeAllGeoviewLayers();
```

## Layer Events

Listen to layer lifecycle events:

```typescript
cgpv.onMapInit((mapViewer) => {
  // Layer configuration added
  mapViewer.layer.onLayerConfigAdded((sender, payload) => {
    console.log("Layer config added:", payload.layer.geoviewLayerId);
  });

  // Layer created (ready to use)
  mapViewer.layer.onLayerCreated((sender, payload) => {
    const layer = payload.layer;
    console.log("Layer created:", layer.getLayerPath());
  });

  // Layer first loaded
  mapViewer.layer.onLayerFirstLoaded((sender, payload) => {
    console.log("Layer loaded:", payload.layer.getLayerPath());
  });

  // Layer status changed
  mapViewer.layer.onLayerStatusChanged((sender, payload) => {
    console.log("Layer status:", payload.status);
  });

  // Layer error
  mapViewer.layer.onLayerError((sender, payload) => {
    console.error("Layer error:", payload.error);
  });
});
```

See [Layer Events](app/events/layer-events.md) for complete event reference.

## Temporal Layers

GeoView supports layers with temporal data (time-enabled layers).

### Date Handling

GeoView uses **ISO UTC format** internally for all dates:

- Numeric dates: Milliseconds since January 1, 1970 UTC
- String dates: ISO 8601 format (e.g., `2023-10-29T12:00:00Z`)

### Configuring Date Formats

If your service uses a different date format:

```typescript
{
  geoviewLayerId: 'temporalLayer',
  geoviewLayerType: 'esriDynamic',

  // Tell GeoView how the server formats dates
  serviceDateFormat: 'MM/DD/YYYY HH:mm:ss-05:00',

  // Tell GeoView how to display dates to users
  externalDateFormat: 'YYYY-MM-DD[THH:mm:ssZ]'
}
```

**Supported Formats:**

- `YYYY-MM-DDTHH:MM:SS(timezone)`
- `MM-DD-YYYYTHH:MM:SS(timezone)`
- `DD-MM-YYYYTHH:MM:SS(timezone)`

**Separators:**

- Date separator: `-` or `/`
- Date/time separator: `T` or ` ` (space)
- Timezone: `Z`, `+HH:MM`, or `-HH:MM`

**Truncating Dates:**

Use square brackets to remove date/time components from display:

```typescript
// Show only date, hide time
externalDateFormat: "YYYY-MM-DD[THH:MM:SSZ]";

// Show only year
externalDateFormat: "YYYY[-MM-DDTHH:MM:SSZ]";

// Show month and year
externalDateFormat: "MM-YYYY[THH:MM:SSZ]";
```

### Temporal Filtering

Filter temporal layers by date range:

```typescript
// CQL filter syntax
const filter =
  "dateField >= date'2023-01-01T00:00:00Z' AND dateField <= date'2023-12-31T23:59:59Z'";
mapViewer.layer.applyViewFilter(layerPath, filter);
```

If using `externalDateFormat`, use that format in your filters:

```typescript
// If externalDateFormat is 'DD/MM/YYYY HH:mm:ss-05:00'
const filter = "dateField >= date'01/01/2023 00:00:00-05:00'";
```

## Filtering Layers

Apply attribute or spatial filters to layers:

```typescript
// Attribute filter
mapViewer.layer.applyViewFilter(
  layerPath,
  "population > 100000 AND name LIKE 'New%'"
);

// Temporal filter
mapViewer.layer.applyViewFilter(
  layerPath,
  "dateField >= date'2023-01-01T00:00:00Z'"
);

// Clear filter
mapViewer.layer.applyViewFilter(layerPath, "");
```

**CQL Filter Syntax:**

- Comparison: `=`, `<>`, `<`, `>`, `<=`, `>=`
- Logical: `AND`, `OR`, `NOT`
- Strings: `LIKE`, `IN`
- Dates: `date'YYYY-MM-DDTHH:MM:SSZ'`
- Spatial: `INTERSECTS`, `CONTAINS`, `WITHIN`

## Feature Information

Query features from layers:

```typescript
// Get features at a coordinate
const features = await mapViewer.layer.getFeatureInfo(
  [longitude, latitude],
  layerPath
);

features.forEach((feature) => {
  console.log("Feature properties:", feature.fieldInfo);
});
```

See [Layer API Reference](app/api/layer-api.md#feature-queries) for more query methods.

## Layer Styling

### Vector Layer Styling

Vector layers can be styled using OpenLayers style configuration:

```typescript
{
  geoviewLayerId: 'vectorLayer',
  geoviewLayerType: 'GeoJSON',

  listOfLayerEntryConfig: [{
    layerId: 'features',
    source: {
      dataAccessPath: 'https://example.com/data.geojson'
    },
    style: {
      Point: {
        color: '#FF0000',
        size: 8
      },
      LineString: {
        color: '#0000FF',
        width: 2
      },
      Polygon: {
        fillColor: '#00FF00',
        fillOpacity: 0.5,
        strokeColor: '#000000',
        strokeWidth: 1
      }
    }
  }]
}
```

### Raster Layer Styling

Raster layers use server-defined styles. Check your service's capabilities for available styles:

```typescript
{
  geoviewLayerId: 'wmsLayer',
  geoviewLayerType: 'ogcWms',

  listOfLayerEntryConfig: [{
    layerId: 'layer1',
    style: 'custom_style_name'  // Must exist on server
  }]
}
```

## Best Practices

### ? DO

1. **Use unique layer IDs**

   ```typescript
   geoviewLayerId: "unique-layer-id-123";
   ```

2. **Provide localized names**

   ```typescript
   geoviewLayerName: "English Name";
   ```

3. **Set initial visibility and opacity**

   ```typescript
   initialSettings: { visible: true, opacity: 0.8 }
   ```

4. **Handle layer events**

   ```typescript
   mapViewer.layer.onLayerError((sender, payload) => {
     console.error("Failed to load layer:", payload.error);
   });
   ```

5. **Use layer paths for operations**
   ```typescript
   mapViewer.layer.setVisible("myLayer/sublayer1", true);
   ```

### ? DON'T

1. **Don't use duplicate layer IDs**

   ```typescript
   // BAD - will cause conflicts
   addGeoviewLayer({ geoviewLayerId: 'layer1', ... });
   addGeoviewLayer({ geoviewLayerId: 'layer1', ... });
   ```

2. **Don't modify OpenLayers layers directly**

   ```typescript
   // BAD - use GeoView API instead
   mapViewer.map.getLayers().forEach((layer) => layer.setOpacity(0.5));
   ```

3. **Don't forget error handling**

   ```typescript
   // BAD
   await mapViewer.layer.addGeoviewLayer(config);

   // GOOD
   try {
     await mapViewer.layer.addGeoviewLayer(config);
   } catch (error) {
     console.error("Failed to add layer:", error);
   }
   ```

## Layer Types Reference

### OGC WMS (ogcWms)

Web Map Service - server-rendered raster images.

```typescript
{
  geoviewLayerId: 'wmsLayer',
  geoviewLayerType: 'ogcWms',
  metadataAccessPath: 'https://example.com/wms',
  listOfLayerEntryConfig: [{
    layerId: 'layerName'
  }]
}
```

### ESRI Dynamic (esriDynamic)

ESRI Dynamic Map Service - server-rendered images.

```typescript
{
  geoviewLayerId: 'esriLayer',
  geoviewLayerType: 'esriDynamic',
  metadataAccessPath: 'https://example.com/MapServer',
  listOfLayerEntryConfig: [{
    layerId: '0'  // Layer index
  }]
}
```

### ESRI Feature (esriFeature)

ESRI Feature Service - vector features.

```typescript
{
  geoviewLayerId: 'featureLayer',
  geoviewLayerType: 'esriFeature',
  metadataAccessPath: 'https://example.com/FeatureServer/0'
}
```

### OGC WFS (ogcWfs)

Web Feature Service - vector features.

```typescript
{
  geoviewLayerId: 'wfsLayer',
  geoviewLayerType: 'ogcWfs',
  metadataAccessPath: 'https://example.com/wfs',
  listOfLayerEntryConfig: [{
    layerId: 'featureTypeName'
  }]
}
```

### GeoJSON

GeoJSON file or URL.

```typescript
{
  geoviewLayerId: 'geojsonLayer',
  geoviewLayerType: 'GeoJSON',
  listOfLayerEntryConfig: [{
    layerId: 'features',
    source: {
      dataAccessPath: 'https://example.com/data.geojson'
    }
  }]
}
```

### XYZ Tiles (xyzTiles)

Tile service using XYZ URL pattern (raster tiles).

```typescript
{
  geoviewLayerId: 'tileLayer',
  geoviewLayerType: 'xyzTiles',
  listOfLayerEntryConfig: [{
    layerId: 'tiles',
    source: {
      dataAccessPath: 'https://example.com/tiles/{z}/{x}/{y}.png'
    }
  }]
}
```

### CSV

CSV file with coordinate columns.

```typescript
{
  geoviewLayerId: 'csvLayer',
  geoviewLayerType: 'CSV',
  listOfLayerEntryConfig: [{
    layerId: 'data',
    source: {
      dataAccessPath: 'https://example.com/data.csv'
    },
    // Specify coordinate columns
    sourceOptions: {
      x: 'longitude',  // or 'lon', 'x'
      y: 'latitude'    // or 'lat', 'y'
    }
  }]
}
```

**CSV Requirements:**

- Must have coordinate columns (latitude/longitude or x/y)
- Coordinates should be in decimal degrees
- First row should contain column headers

### KML

Keyhole Markup Language file (Google Earth format).

```typescript
{
  geoviewLayerId: 'kmlLayer',
  geoviewLayerType: 'KML',
  listOfLayerEntryConfig: [{
    layerId: 'features',
    source: {
      dataAccessPath: 'https://example.com/data.kml'
    }
  }]
}
```

**KML Features:**

- Supports points, lines, polygons
- Preserves KML styling and icons
- Supports network links
- Handles extended data attributes

### WKB (Well-Known Binary)

Binary geometry format for efficient storage.

```typescript
{
  geoviewLayerId: 'wkbLayer',
  geoviewLayerType: 'WKB',
  listOfLayerEntryConfig: [{
    layerId: 'geometries',
    source: {
      dataAccessPath: 'https://example.com/data.wkb'
    }
  }]
}
```

**WKB Characteristics:**

- Compact binary format
- Faster parsing than text formats
- Commonly used in databases (PostGIS)

### Vector Tiles (vectorTiles)

Pre-tiled vector data in Mapbox Vector Tiles (MVT) format.

```typescript
{
  geoviewLayerId: 'vectorTileLayer',
  geoviewLayerType: 'vectorTiles',
  listOfLayerEntryConfig: [{
    layerId: 'tiles',
    source: {
      dataAccessPath: 'https://example.com/tiles/{z}/{x}/{y}.pbf'
    }
  }]
}
```

**Vector Tiles Features:**

- Client-side styling
- Smooth zoom and rotation
- Smaller file sizes than raster
- Interactive features

### GeoPackage

SQLite-based spatial database container (converted on load).

```typescript
{
  geoviewLayerId: 'geopackageLayer',
  geoviewLayerType: 'GeoPackage',
  listOfLayerEntryConfig: [{
    layerId: 'layer',
    source: {
      dataAccessPath: 'https://example.com/data.gpkg'
    }
  }]
}
```

**Note:** GeoPackage files are automatically converted to an appropriate vector format (GeoJSON or WKB) during loading.

### Shapefile

ESRI Shapefile format (converted on load).

```typescript
{
  geoviewLayerId: 'shapefileLayer',
  geoviewLayerType: 'shapefile',
  listOfLayerEntryConfig: [{
    layerId: 'features',
    source: {
      dataAccessPath: 'https://example.com/data.zip'  // ZIP containing .shp, .shx, .dbf, .prj
    }
  }]
}
```

**Shapefile Requirements:**

- Must be provided as ZIP file
- ZIP must contain: .shp, .shx, .dbf files (minimum)
- .prj file recommended for projection information
- Automatically converted to GeoJSON during loading

## Common Patterns

### Pattern 1: Load Layer and Zoom to Extent

```typescript
const result = mapViewer.layer.addGeoviewLayer(config);

mapViewer.layer.onLayerFirstLoaded((sender, payload) => {
  if (payload.layer.getLayerPath() === result.layerPath) {
    // Zoom to layer extent
    const extent = mapViewer.layer.getExtent(result.layerPath);
    if (extent) {
      mapViewer.map.getView().fit(extent);
    }
  }
});
```

### Pattern 2: Conditional Layer Loading

```typescript
async function loadLayersByCategory(category: string) {
  const layers = await fetchLayersFromAPI(category);

  for (const layerConfig of layers) {
    try {
      await mapViewer.layer.addGeoviewLayer(layerConfig);
    } catch (error) {
      console.warn(
        `Failed to load layer ${layerConfig.geoviewLayerId}:`,
        error
      );
    }
  }
}
```

### Pattern 3: Layer Synchronization

```typescript
// Keep two layers in sync
mapViewer.layer.onVisibilityChanged((sender, payload) => {
  if (payload.layerPath === "layer1") {
    mapViewer.layer.setVisible("layer2", payload.visible);
  }
});
```

## See Also

- **[Layer API Reference](app/api/layer-api.md)** - Complete API method reference
- **[Layer Events](app/events/layer-events.md)** - Layer event documentation
- **[Configuration Reference](app/config/configuration-reference.md)** - Configuration schema
- **[Creating Maps](app/config/create-map.md)** - Map initialization
- **[Event Processors](app/events/event-processors.md)** - State management

---

> **🔧 For Core Contributors:** See [Adding Layer Types](programming/adding-layer-types.md) for implementing new layer types
