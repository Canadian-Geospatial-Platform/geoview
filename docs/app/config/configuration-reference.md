# Configuration Reference

Complete reference for GeoView layer configuration objects. This guide covers all configuration options for creating and managing map layers.

> **Quick Start:** See [Creating Maps](app/config/create-map.md) for basic usage examples  
> **For Core Developers:** See [Adding Layer Types](programming/adding-layer-types.md) for implementation details

---

## Table of Contents

- [GeoView Layer Configuration](#geoview-layer-configuration)
- [Layer Entry Configuration](#layer-entry-configuration)
- [Initial Settings](#initial-settings)
- [Source Configuration](#source-configuration)
- [Layer Style Configuration](#layer-style-configuration)
- [Temporal Configuration](#temporal-configuration)
- [Layer Types](#layer-types)
- [Complete Examples](#complete-examples)

---

## GeoView Layer Configuration

The root configuration object for adding a layer to the map.

### TypeGeoviewLayerConfig

```typescript
interface TypeGeoviewLayerConfig {
  // Required
  geoviewLayerId: string;
  geoviewLayerType: TypeGeoviewLayerType;

  // Recommended
  geoviewLayerName?: string;
  metadataAccessPath?: string;

  // Optional
  initialSettings?: TypeLayerInitialSettings;
  listOfLayerEntryConfig?: TypeLayerEntryConfig[];

  // Temporal
  serviceDateFormat?: string;
  externalDateFormat?: string;
  isTimeAware?: boolean;

  // Scale constraints
  minScale?: number;
  maxScale?: number;
}
```

### Properties

#### geoviewLayerId (Required)

Unique identifier for the layer.

```typescript
geoviewLayerId: string;
```

**Example:**

```typescript
geoviewLayerId: "my-wms-layer";
```

**Rules:**

- Must be unique within the map
- Cannot be empty
- Recommended: Use lowercase with hyphens (kebab-case)

---

#### geoviewLayerType (Required)

The type of layer being added.

```typescript
geoviewLayerType: TypeGeoviewLayerType;
```

**Valid Values:**

| Type            | Description                |
| --------------- | -------------------------- |
| `'ogcWms'`      | OGC Web Map Service        |
| `'ogcWfs'`      | OGC Web Feature Service    |
| `'ogcFeature'`  | OGC API Features           |
| `'esriDynamic'` | ESRI Dynamic Map Service   |
| `'esriFeature'` | ESRI Feature Service       |
| `'esriImage'`   | ESRI Image Service         |
| `'GeoJSON'`     | GeoJSON data               |
| `'CSV'`         | CSV with coordinates       |
| `'KML'`         | Keyhole Markup Language    |
| `'WKB'`         | Well-Known Binary          |
| `'xyzTiles'`    | XYZ Raster Tiles           |
| `'vectorTiles'` | Mapbox Vector Tiles        |
| `'imageStatic'` | Static georeferenced image |

> **Note:** Additional input types `'geoCore'`, `'GeoPackage'`, `'shapefile'`, and `'rcs'` are also accepted during layer creation and will be automatically converted to one of the standard types above.

**Example:**

```typescript
geoviewLayerType: "ogcWms";
```

---

#### geoviewLayerName (Recommended)

Display name for the layer.

```typescript
geoviewLayerName?: string;
```

**Example:**

```typescript
geoviewLayerName: "Weather Data";
```

---

#### metadataAccessPath (Required for some types)

URL or path to the service/data.

```typescript
metadataAccessPath?: string;
```

**Required for:** WMS, WFS, OGC Feature, ESRI services  
**Optional for:** GeoJSON, CSV, KML (can use relative paths)

**Examples:**

```typescript
// WMS service
metadataAccessPath: "https://example.com/wms";

// GeoJSON file
metadataAccessPath: "/data/features.geojson";
```

---

#### initialSettings (Optional)

Initial display and behavior settings for the layer.

```typescript
initialSettings?: TypeLayerInitialSettings;
```

See [Initial Settings](#initial-settings) section for complete details.

---

#### listOfLayerEntryConfig (Optional)

Array of sublayer configurations (for services with multiple layers).

```typescript
listOfLayerEntryConfig?: TypeLayerEntryConfig[];
```

See [Layer Entry Configuration](#layer-entry-configuration) section.

**Example:**

```typescript
listOfLayerEntryConfig: [
  {
    layerId: "0",
    layerName: { en: "Temperature", fr: "Température" },
  },
  {
    layerId: "1",
    layerName: { en: "Precipitation", fr: "Précipitations" },
  },
];
```

---

#### serviceDateFormat (Optional)

Date format used by the service for temporal data.

```typescript
serviceDateFormat?: string;
```

**Format Tokens:**

- `YYYY` - 4-digit year
- `MM` - 2-digit month
- `DD` - 2-digit day
- `HH` - 2-digit hour
- `mm` - 2-digit minute
- `ss` - 2-digit second

**Examples:**

```typescript
serviceDateFormat: "YYYY-MM-DD";
serviceDateFormat: "YYYY-MM-DDTHH:mm:ss";
serviceDateFormat: "DD/MM/YYYY";
```

---

#### externalDateFormat (Optional)

Date format for user-facing display.

```typescript
externalDateFormat?: string;
```

Uses same tokens as `serviceDateFormat`.

**Example:**

```typescript
serviceDateFormat: "YYYY-MM-DD"; // Server format
externalDateFormat: "DD/MM/YYYY"; // Display format
```

---

#### isTimeAware (Optional)

Indicates if the layer supports temporal filtering.

```typescript
isTimeAware?: boolean;
```

**Default:** `false`

**Example:**

```typescript
isTimeAware: true;
serviceDateFormat: "YYYY-MM-DD";
```

---

#### layerFilter (Optional)

OGC CQL filter expression to filter features.

```typescript
layerFilter?: string;
```

**Examples:**

```typescript
// Simple filter
layerFilter: "population > 1000000";

// Complex filter
layerFilter: "temperature > 0 AND temperature < 30";

// Date filter
layerFilter: "date >= '2023-01-01' AND date <= '2023-12-31'";
```

---

## Layer Entry Configuration

Configuration for individual sublayers within a GeoView layer.

### TypeLayerEntryConfig

```typescript
interface TypeLayerEntryConfig {
  // Required
  layerId: string;

  // Optional
  layerName?: string;
  initialSettings?: TypeLayerInitialSettings;
  source?: TypeSourceConfig;
  layerStyle?: TypeLayerStyle;
  layerFilter?: string;

  // Scale constraints
  minScale?: number;
  maxScale?: number;

  // For groups
  isLayerGroup?: boolean;
  listOfLayerEntryConfig?: TypeLayerEntryConfig[];
}
```

### Properties

#### layerId (Required)

Unique identifier for the layer entry.

```typescript
layerId: string;
```

**Examples:**

```typescript
// For WMS layers (layer name from GetCapabilities)
layerId: "temperature";

// For ESRI services (numeric ID)
layerId: "0";

// For file-based layers (generated or filename)
layerId: "my-features";
```

---

#### layerName (Optional)

Display name for this specific layer entry.

```typescript
layerName?: string;
```

**Example:**

```typescript
layerName: "Temperature";
```

---

#### initialSettings (Optional)

Initial display settings (inherited from parent if not specified).

```typescript
initialSettings?: TypeLayerInitialSettings;
```

See [Initial Settings](#initial-settings) section.

---

#### source (Optional)

Source-specific configuration.

```typescript
source?: TypeSourceConfig;
```

See [Source Configuration](#source-configuration) section.

---

#### layerStyle (Optional)

Styling configuration for the layer.

```typescript
layerStyle?: TypeLayerStyle;
```

See [Layer Style Configuration](#layer-style-configuration) section.

---

#### layerFilter (Optional)

Filter expression for this specific layer entry.

```typescript
layerFilter?: string;
```

Overrides the GeoView layer filter for this entry.

---

#### listOfLayerEntryConfig (Optional)

For layer groups - array of child layer entries.

```typescript
listOfLayerEntryConfig?: TypeLayerEntryConfig[];
```

**Example:**

```typescript
{
  layerId: "weather-group",
  layerName: "Weather Data",
  listOfLayerEntryConfig: [
    { layerId: "temperature", layerName: "Temperature" },
    { layerId: "precipitation", layerName: "Precipitation" }
  ]
}
```

---

## Initial Settings

Display and behavior settings applied when the layer is created.

### TypeLayerInitialSettings

```typescript
interface TypeLayerInitialSettings {
  // Visibility
  visible?: boolean;

  // Zoom constraints
  extent?: Extent;
  bounds?: Extent;
  minZoom?: number;
  maxZoom?: number;

  // States
  states?: {
    opacity?: number;
    queryable?: boolean;
    hoverable?: boolean;
  };
}
```

### Properties

#### visible

Initial visibility of the layer.

```typescript
visible?: boolean;
```

**Default:** `true`

**Example:**

```typescript
initialSettings: {
  visible: false; // Layer starts hidden
}
```

---

#### extent

Geographic extent for the layer (in layer's projection).

```typescript
extent?: Extent; // [minX, minY, maxX, maxY]
```

**Example:**

```typescript
initialSettings: {
  extent: [-120, 40, -100, 50]; // [west, south, east, north]
}
```

---

#### bounds

Geographic bounds for the layer (in WGS84/lon-lat).

```typescript
bounds?: Extent; // [minLon, minLat, maxLon, maxLat]
```

**Example:**

```typescript
initialSettings: {
  bounds: [-75.9, 45.3, -75.5, 45.6]; // Ottawa area
}
```

**Note:** `extent` uses layer projection, `bounds` always uses WGS84.

---

#### minZoom / maxZoom

Zoom level constraints for layer visibility.

```typescript
minZoom?: number; // 0-23
maxZoom?: number; // 0-23
```

**Examples:**

```typescript
// Only visible at street level
initialSettings: {
  minZoom: 10,
  maxZoom: 18,
}

// Only visible at world/country level
initialSettings: {
  minZoom: 0,
  maxZoom: 6,
}
```

---

#### states.opacity

Layer opacity (transparency).

```typescript
states?: {
  opacity?: number; // 0.0 to 1.0
};
```

**Default:** `1.0` (fully opaque)

**Examples:**

```typescript
// Semi-transparent overlay
initialSettings: {
  states: {
    opacity: 0.5,
  },
}

// Very subtle background
initialSettings: {
  states: {
    opacity: 0.2,
  },
}
```

---

#### states.queryable

Whether the layer responds to feature info queries (clicks).

```typescript
states?: {
  queryable?: boolean;
};
```

**Default:** `true`

**Example:**

```typescript
// Disable feature info for basemap
initialSettings: {
  states: {
    queryable: false,
  },
}
```

---

#### states.hoverable

Whether the layer responds to hover interactions.

```typescript
states?: {
  hoverable?: boolean;
};
```

**Default:** `false`

**Example:**

```typescript
// Enable hover tooltips
initialSettings: {
  states: {
    hoverable: true,
  },
}
```

---

## Source Configuration

Source-specific settings for data access and processing.

### TypeSourceConfig

Configuration varies by layer type:

#### Vector Sources (GeoJSON, CSV, WFS, etc.)

```typescript
interface TypeSourceVectorInitialConfig {
  dataAccessPath?: string;
  format?: string;
  featureInfo?: {
    queryable?: boolean;
    nameField?: string;
    outfields?: string[];
  };
}
```

**Example:**

```typescript
source: {
  dataAccessPath: "/data/features.geojson",
  format: "GeoJSON",
  featureInfo: {
    queryable: true,
    nameField: "name",
    outfields: ["name", "population", "area"],
  },
}
```

---

#### Raster Sources (WMS, ESRI Image, XYZ)

```typescript
interface TypeSourceImageInitialConfig {
  format?: string;
  transparent?: boolean;
  featureInfo?: {
    queryable?: boolean;
  };
}
```

**Example:**

```typescript
source: {
  format: "image/png",
  transparent: true,
  featureInfo: {
    queryable: true,
  },
}
```

---

#### CSV Sources

```typescript
interface TypeSourceCSVInitialConfig {
  dataAccessPath: string;
  format: "CSV";
  latitudeField?: string;
  longitudeField?: string;
  delimiter?: string;
}
```

**Example:**

```typescript
source: {
  dataAccessPath: "/data/cities.csv",
  format: "CSV",
  latitudeField: "lat",
  longitudeField: "lon",
  delimiter: ",",
}
```

---

## Layer Style Configuration

Styling configuration for vector layers.

### TypeLayerStyle

```typescript
interface TypeLayerStyle {
  styleType?: "simple" | "uniqueValue" | "classBreaks";

  // Simple style
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  pointRadius?: number;

  // Symbol
  symbol?: {
    src?: string;
    width?: number;
    height?: number;
  };
}
```

### Examples

#### Simple Style

```typescript
layerStyle: {
  styleType: "simple",
  fillColor: "#FF000088", // Red with transparency
  strokeColor: "#000000",
  strokeWidth: 2,
}
```

#### Point Style

```typescript
layerStyle: {
  styleType: "simple",
  pointRadius: 8,
  fillColor: "#0000FF",
  strokeColor: "#FFFFFF",
  strokeWidth: 2,
}
```

#### Icon Style

```typescript
layerStyle: {
  symbol: {
    src: "/icons/marker.png",
    width: 32,
    height: 32,
  },
}
```

---

## Temporal Configuration

Configuration for time-aware layers.

### Properties

```typescript
{
  isTimeAware: boolean;
  serviceDateFormat: string;
  externalDateFormat: string;
}
```

### Example

```typescript
{
  geoviewLayerId: "weather-forecast",
  geoviewLayerType: "ogcWms",
  geoviewLayerName: "Weather Forecast",
  metadataAccessPath: "https://example.com/wms",
  isTimeAware: true,
  serviceDateFormat: "YYYY-MM-DDTHH:mm:ss",
  externalDateFormat: "YYYY-MM-DD HH:mm",
  listOfLayerEntryConfig: [
    {
      layerId: "temperature",
      layerName: "Temperature",
    },
  ],
}
```

**Time Slider Integration:**

Temporal layers automatically work with the Time Slider package. See [Packages](app/packages/geoview-core-packages.md#geoview-time-slider) for details.

---

## Layer Types

### WMS Layer

```typescript
{
  geoviewLayerId: "my-wms",
  geoviewLayerType: "ogcWms",
  geoviewLayerName: "WMS Layer",
  metadataAccessPath: "https://example.com/wms",
  listOfLayerEntryConfig: [
    {
      layerId: "layer-name",
      layerName: "Layer Name",
      initialSettings: {
        visible: true,
        states: { opacity: 0.8 },
      },
    },
  ],
}
```

---

### ESRI Feature Service

```typescript
{
  geoviewLayerId: "esri-features",
  geoviewLayerType: "esriFeature",
  geoviewLayerName: "ESRI Features",
  metadataAccessPath: "https://example.com/FeatureServer/0",
  listOfLayerEntryConfig: [
    {
      layerId: "0",
      layerName: "Features",
      source: {
        featureInfo: {
          queryable: true,
          outfields: ["*"],
        },
      },
    },
  ],
}
```

---

### GeoJSON Layer

```typescript
{
  geoviewLayerId: "geojson-data",
  geoviewLayerType: "GeoJSON",
  geoviewLayerName: "GeoJSON Layer",
  metadataAccessPath: "/data/features.geojson",
  listOfLayerEntryConfig: [
    {
      layerId: "features",
      layerName: "Features",
      layerStyle: {
        fillColor: "#FF0000",
        strokeColor: "#000000",
        strokeWidth: 2,
      },
    },
  ],
}
```

---

### CSV Layer

```typescript
{
  geoviewLayerId: "csv-points",
  geoviewLayerType: "CSV",
  geoviewLayerName: "CSV Points",
  metadataAccessPath: "/data/points.csv",
  listOfLayerEntryConfig: [
    {
      layerId: "points",
      layerName: "Points",
      source: {
        format: "CSV",
        latitudeField: "latitude",
        longitudeField: "longitude",
      },
    },
  ],
}
```

---

### XYZ Tiles Layer

```typescript
{
  geoviewLayerId: "xyz-tiles",
  geoviewLayerType: "xyzTiles",
  geoviewLayerName: "XYZ Tiles",
  metadataAccessPath: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  listOfLayerEntryConfig: [
    {
      layerId: "tiles",
      layerName: "Tiles",
    },
  ],
}
```

---

## Complete Examples

### Complex WMS Configuration

```typescript
{
  geoviewLayerId: "weather-layers",
  geoviewLayerType: "ogcWms",
  geoviewLayerName: "Weather Data",
  metadataAccessPath: "https://example.com/wms",
  initialSettings: {
    visible: true,
    bounds: [-140, 40, -50, 83], // Canada extent
    states: {
      opacity: 0.7,
      queryable: true,
    },
  },
  isTimeAware: true,
  serviceDateFormat: "YYYY-MM-DDTHH:mm:ss",
  externalDateFormat: "YYYY-MM-DD HH:mm",
  listOfLayerEntryConfig: [
    {
      layerId: "temperature",
      layerName: "Temperature",
      initialSettings: {
        visible: true,
        minZoom: 0,
        maxZoom: 10,
      },
    },
    {
      layerId: "precipitation",
      layerName: "Precipitation",
      initialSettings: {
        visible: false,
      },
    },
  ],
}
```

---

### Styled GeoJSON Layer

```typescript
{
  geoviewLayerId: "styled-features",
  geoviewLayerType: "GeoJSON",
  geoviewLayerName: "Styled Features",
  metadataAccessPath: "/data/features.geojson",
  initialSettings: {
    visible: true,
    states: {
      opacity: 0.8,
      queryable: true,
      hoverable: true,
    },
  },
  listOfLayerEntryConfig: [
    {
      layerId: "features",
      layerName: "Features",
      layerStyle: {
        styleType: "simple",
        fillColor: "#4CAF50",
        strokeColor: "#1B5E20",
        strokeWidth: 2,
      },
      source: {
        featureInfo: {
          queryable: true,
          nameField: "name",
          outfields: ["name", "description", "category"],
        },
      },
    },
  ],
}
```

---

### Multi-Layer ESRI Service

```typescript
{
  geoviewLayerId: "esri-service",
  geoviewLayerType: "esriDynamic",
  geoviewLayerName: "ESRI Service",
  metadataAccessPath: "https://example.com/MapServer",
  listOfLayerEntryConfig: [
    {
      layerId: "group-1",
      layerName: "Administrative",
      listOfLayerEntryConfig: [
        {
          layerId: "0",
          layerName: "Provinces",
          initialSettings: {
            minZoom: 0,
            maxZoom: 8,
          },
        },
        {
          layerId: "1",
          layerName: "Cities",
          initialSettings: {
            minZoom: 8,
            maxZoom: 18,
          },
        },
      ],
    },
    {
      layerId: "2",
      layerName: "Roads",
      initialSettings: {
        visible: false,
        minZoom: 10,
      },
    },
  ],
}
```

---

## Best Practices

### 1. Use Unique IDs

Always use unique, descriptive layer IDs:

```typescript
// ❌ Bad
geoviewLayerId: "layer1";

// ✅ Good
geoviewLayerId: "canada-weather-temperature";
```

### 2. Provide Descriptive Names

Use clear, descriptive names:

```typescript
geoviewLayerName: "Temperature Forecast";
```

### 3. Set Appropriate Zoom Constraints

Prevent performance issues with zoom constraints:

```typescript
initialSettings: {
  minZoom: 10, // Only show at street level
  maxZoom: 18,
}
```

### 4. Use Opacity for Overlays

Make overlay layers semi-transparent:

```typescript
initialSettings: {
  states: {
    opacity: 0.6, // Allow basemap to show through
  },
}
```

### 5. Configure Feature Info

Specify which fields to display:

```typescript
source: {
  featureInfo: {
    queryable: true,
    outfields: ["name", "population", "area"], // Only these fields
  },
}
```

### 6. Set Bounds for Better Performance

Limit the geographic extent:

```typescript
initialSettings: {
  bounds: [-75.9, 45.3, -75.5, 45.6], // Ottawa area only
}
```

---

## Validation

GeoView automatically validates configurations:

### Required Fields

- `geoviewLayerId` - Must be provided and unique
- `geoviewLayerType` - Must be a valid layer type
- `metadataAccessPath` - Required for most service-based layers

### Automatic Adjustments

- Invalid opacity values are clamped to 0.0-1.0
- Zoom levels are clamped to 0-23
- Child layers inherit parent initial settings

### Error Handling

```typescript
try {
  mapViewer.layer.addGeoviewLayer(config);
} catch (error) {
  if (error instanceof LayerMissingGeoviewLayerIdError) {
    console.error("Layer ID is required");
  }
}
```

---

## See Also

- **[Creating Maps](app/config/create-map.md)** - Map initialization and basic configuration
- **[GeoView Layers](app/layers/layers.md)** - Layer concepts and usage
- **[Layer API](app/api/layer-api.md)** - Adding and managing layers
- **[Packages](app/packages/geoview-core-packages.md)** - Geoview packages -specific configuration
- **[Event Processors](app/events/event-processors.md)** - State management
