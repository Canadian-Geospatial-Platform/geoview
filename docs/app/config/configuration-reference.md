# Configuration Reference

Complete reference for GeoView configuration objects. This guide covers all configuration options for creating and managing maps, layers, and packages.

> **Quick Start:** See [Creating Maps](app/config/create-map.md) for basic usage examples  
> **For Core Developers:** See [Adding Layer Types](programming/adding-layer-types.md) for implementation details

> **⚠️ Schema Validation:** Always check the browser console for schema validation errors and discrepancies. The console will display detailed error messages including the schema path, affected property, and allowed values. Invalid configurations will be rejected with specific error messages indicating what needs to be corrected.

---

## Table of Contents

- [Schema Validation](#schema-validation)
- [Map Configuration](#map-configuration)
- [GeoView Layer Configuration](#geoview-layer-configuration)
- [Layer Entry Configuration](#layer-entry-configuration)
- [Initial Settings](#initial-settings)
- [Source Configuration](#source-configuration)
- [Layer Style Configuration](#layer-style-configuration)
- [Layer Text Configuration](#layer-text-configuration)
- [Temporal Configuration](#temporal-configuration)
- [Layer Types](#layer-types)
- [Package Configuration](#package-configuration)
- [Complete Examples](#complete-examples)

---

## Schema Validation

GeoView uses JSON Schema validation to ensure configuration objects are valid before creating maps and layers.

### Checking for Validation Errors

**Always check the browser console** for schema validation errors and discrepancies. The console will display detailed error messages when a configuration doesn't match the schema.

### Understanding Validation Errors

When a validation error occurs, you'll see a message in the console with the following information:

```
======================================================================
SchemaPath: https://cgpv/schema#/definitions/TypeMapFeaturesInstance
Schema error: {
  instancePath: '/map/viewSettings/projection',
  schemaPath: '#/definitions/TypeValidMapProjectionCodes/enum',
  keyword: 'enum',
  params: { allowedValues: [3978, 3857] },
  message: 'must be equal to one of the allowed values'
}
Object affected: 4326
```

**Key information:**

- **instancePath**: The location of the invalid property in your configuration
- **keyword**: The validation rule that failed (e.g., `enum`, `type`, `required`)
- **params**: Additional details, such as allowed values
- **message**: Human-readable description of the error
- **Object affected**: The invalid value you provided

### Common Validation Errors

1. **Invalid Enum Value**

   - **Error**: `must be equal to one of the allowed values`
   - **Solution**: Check the `params.allowedValues` in the error and use one of those values

2. **Missing Required Property**

   - **Error**: `must have required property 'propertyName'`
   - **Solution**: Add the missing required property to your configuration

3. **Wrong Type**

   - **Error**: `must be string/number/boolean/array/object`
   - **Solution**: Ensure the property value matches the expected type

4. **Additional Properties Not Allowed**
   - **Error**: `must NOT have additional properties`
   - **Solution**: Remove properties that aren't part of the schema

### Validation Tips

- Start with a minimal valid configuration and add properties incrementally
- Use the [Sandbox](./sandbox.html) page to test configurations interactively
- Refer to this documentation for valid property values
- Check the schema files in `packages/geoview-core/` for complete type definitions

---

## Map Configuration

Configuration for the map instance, including basemap, view settings, interactions, and initial layers.

### TypeMapFeaturesInstance

The root configuration object for initializing a GeoView map.

```typescript
interface TypeMapFeaturesInstance {
  // Required
  map: TypeMapConfig;

  // Optional
  theme?: TypeDisplayTheme;
  navBar?: TypeNavBarProps;
  footerBar?: TypeFooterBarProps;
  appBar?: TypeAppBarProps;
  overviewMap?: TypeOverviewMapProps;
  components?: TypeMapComponents;
  corePackages?: TypeMapCorePackages;
  corePackagesConfig?: TypeCorePackagesConfig;
  externalPackages?: TypeExternalPackages;
  serviceUrls?: TypeServiceUrls;
  globalSettings?: TypeGlobalSettings;
}
```

### TypeMapConfig

Main map configuration object.

```typescript
interface TypeMapConfig {
  // Required
  basemapOptions: TypeBasemapOptions;
  interaction: TypeInteraction;
  viewSettings: TypeViewSettings;

  // Optional
  listOfGeoviewLayerConfig?: TypeListOfGeoviewLayerConfig;
  highlightColor?: TypeHighlightColors;
  overlayObjects?: TypeOverlayObjects;
  extraOptions?: object; // OpenLayers map options
}
```

### Map Properties

#### basemapOptions (Required)

Configuration for the basemap.

```typescript
basemapOptions: {
  basemapId: TypeBasemapId;
  shaded: boolean;
  labeled: boolean;
  labelZIndex: number;
}
```

**Properties:**

- **basemapId** (Required): Basemap identifier

  - `"transport"` - Transportation basemap
  - `"simple"` - Simple basemap
  - `"shaded"` - Shaded relief basemap
  - `"osm"` - OpenStreetMap basemap
  - `"nogeom"` - No geometry/blank basemap
  - `"imagery"` - Imagery/satellite basemap
  - `"labeled"` - Labeled basemap

- **shaded** (Required): Enable or disable shaded basemap (if basemap id is set to shaded then this should be false)
- **labeled** (Required): Enable or disable basemap labels
- **labelZIndex** (Optional): Used to set the zIndex of the basemap's label layer. A value of 10 will put it under the very first layer, so if you have two layers, you will need to set it to 12 or higher for it to be above all layers. Setting it to an arbitrarily large number, like 999, will work to ensure that it ends up above all the layers in the map.

**Examples:**

```typescript
// Transport basemap with shading and labels
basemapOptions: {
  basemapId: "transport",
  shaded: true,
  labeled: true,
  labelZIndex: 20
}
```

---

#### interaction (Required)

Map interaction mode.

```typescript
interaction: "dynamic" | "static";
```

**Valid Values:**

- `"dynamic"` - Full map interaction (pan, zoom, click, etc.)
- `"static"` - Static map with no interaction

**Default:** `"dynamic"`

**Example:**

```typescript
interaction: "dynamic";
```

---

#### viewSettings (Required)

Initial view configuration for the map.

```typescript
viewSettings: {
  initialView?: TypeMapViewSettings;
  homeView?: TypeMapViewSettings;
  enableRotation?: boolean;
  rotation?: number;
  maxExtent?: Extent;
  minZoom?: number;
  maxZoom?: number;
  projection: TypeValidMapProjectionCodes;
}

TypeMapViewSettings: {
  zoomAndCenter?: [number, [number, number]];
  extent?: Extent;
  layerIds?: string[];
}
```

**Properties:**

- **projection** (Required): EPSG projection code (default: 3978)

  - `3978` - Canada Lambert Conformal Conic
  - `3857` - Web Mercator

  > **Note:** Only these two projections are currently supported. Using any other EPSG code will result in a schema validation error.

- **initialView** (Optional): Settings for the initial view for map
  - **zoomAndCenter**: [zoom, [longitude, latitude]] format. Longitude domain = [-160..160], Latitude domain = [-80..80]
  - **extent**: [minX, minY, maxX, maxY] extent coordinates
  - **layerIds**: Geoview layer ID(s) or layer path(s) to use as initial map focus. If empty, will use all layers
- **homeView** (Optional): Settings for the home nav bar button (same structure as initialView)

- **enableRotation** (Optional): Enable rotation. If false, a rotation constraint that always sets the rotation to zero is used (default: true)

- **rotation** (Optional): The initial rotation for the view in **degrees** (positive rotation clockwise, 0 means North). Will be converted to radians by the viewer. Domain = [0..360] (default: 0)

- **maxExtent** (Optional): The extent that constrains the view. Called with [minX, minY, maxX, maxY] extent coordinates (default: [-135, 25, -50, 89])

- **minZoom** (Optional): The minimum zoom level used to determine the resolution constraint. Domain = [0..20]. If not set, will use default from basemap (default: 0)

- **maxZoom** (Optional): The maximum zoom level used to determine the resolution constraint. Domain = [0..20]. If not set, will use default from basemap (default: 20)

**Examples:**

```typescript
// Basic view settings with zoomAndCenter
viewSettings: {
  projection: 3978,
  initialView: {
    zoomAndCenter: [12, [-75.7, 45.4]] // Ottawa
  }
}

// With Web Mercator projection, zoom constraints and rotation enabled (in degrees)
viewSettings: {
  projection: 3978,
  initialView: {
    zoomAndCenter: [14, [-73.6, 45.5]] // Montreal
  },
  enableRotation: true,
  rotation: 45 // 45 degrees clockwise
}

// Using extent instead of zoomAndCenter
viewSettings: {
  projection: 3978,
  initialView: {
    extent: [-76.0, 45.0, -75.0, 46.0]
  }
}

// Using layerIds to focus on specific layers
viewSettings: {
  projection: 3978,
  initialView: {
    layerIds: ["layer1", "layer2"]
  }
}
```

---

#### listOfGeoviewLayerConfig (Optional)

Array of layer configurations to add to the map.

```typescript
listOfGeoviewLayerConfig?: Array<TypeGeoviewLayerConfig>;
```

See [GeoView Layer Configuration](#geoview-layer-configuration) section for details.

**Example:**

```typescript
listOfGeoviewLayerConfig: [
  {
    geoviewLayerId: "wms-layer",
    geoviewLayerType: "ogcWms",
    metadataAccessPath: "https://example.com/wms",
  },
];
```

---

#### highlightColor (Optional)

Color to use for feature highlighting.

```typescript
highlightColor?: "black" | "white" | "red" | "green";
```

**Valid Values:**

- `"black"` - Black highlight color
- `"white"` - White highlight color
- `"red"` - Red highlight color
- `"green"` - Green highlight color

**Example:**

```typescript
highlightColor: "red";
```

---

#### overlayObjects (Optional)

Additional overlay objects to add to the map.

```typescript
overlayObjects?: Array<object>;
```

**Example:**

```typescript
overlayObjects: [
  // Custom OpenLayers overlay objects
];
```

---

#### extraOptions (Optional)

Additional OpenLayers map options.

```typescript
extraOptions?: object;
```

**Example:**

```typescript
extraOptions: {
  // OpenLayers Map constructor options
}
```

---

### Complete Map Configuration Example

```typescript
map: {
  basemapOptions: {
    basemapId: "transport",
    shaded: true,
    labeled: true
  },
  interaction: "dynamic",
  viewSettings: {
    projection: 3978,
    initialView: {
      zoomAndCenter: [12, [-106, 60]]
    },
    minZoom: 4,
    maxZoom: 18,
    enableRotation: false
  },
  listOfGeoviewLayerConfig: [
    {
      geoviewLayerId: "my-layer",
      geoviewLayerType: "ogcWms",
      metadataAccessPath: "https://example.com/wms",
      ...
    }
  ]
}
```

---

#### theme (Optional)

Visual theme for the map interface.

```typescript
theme?: "dark" | "light" | "geo.ca";
```

**Valid Values:**

- `"dark"` - Dark theme
- `"light"` - Light theme
- `"geo.ca"` - Default Geo.ca theme

**Default:** `"geo.ca"`

**Example:**

```typescript
theme: "dark";
```

---

#### navBar (Optional)

Controls available on the navigation bar.

```typescript
navBar?: Array<"zoom" | "fullscreen" | "home" | "location" | "basemap-select" | "projection" | "drawer">;
```

**Valid Values:**

- `"zoom"` - Zoom in/out controls
- `"fullscreen"` - Fullscreen toggle
- `"home"` - Return to initial extent
- `"location"` - Geolocator control
- `"basemap-select"` - Basemap selector
- `"projection"` - Projection selector
- `"drawer"` - **Drawer package** - Drawing tools

**Default:** `["zoom", "fullscreen", "home", "basemap-select"]`

**Example:**

```typescript
// Include drawer package in navbar
navBar: ["zoom", "fullscreen", "home", "drawer"];
```

> **Note:** The `"drawer"` option requires the **drawer package** to be configured. See [Drawer Package](#drawer-package) configuration.

---

#### footerBar (Optional)

Configuration for footer bar tabs.

```typescript
footerBar?: {
  tabs: {
    core: TypeValidFooterBarTabsCoreProps[];
    custom: TypeFooterBarTabsCustomProps[];
  };
  collapsed: boolean;
  selectedTab: TypeValidFooterBarTabsCoreProps;
  selectedLayersLayerPath: string;
  selectedDataTableLayerPath: string;
  selectedTimeSliderLayerPath: string;
};

TypeValidFooterBarTabsCoreProps = "legend" | "layers" | "details" | "data-table" | "time-slider" | "geochart" | "guide";

TypeFooterBarTabsCustomProps = {
  id: string;
  label: string;
  contentHTML: string;
};
```

**Properties:**

- **tabs** (Required): Tab configuration

  - **core** (Required): Array of core tab identifiers
    - `"legend"` - Layer legend display
    - `"layers"` - Layer list and management
    - `"details"` - Feature details viewer
    - `"data-table"` - Tabular data view
    - `"time-slider"` - **Time Slider package** - Temporal data controls
    - `"geochart"` - **GeoChart package** - Chart visualization
    - `"guide"` - User guide tab
  - **custom**: Array of custom tab definitions

- **collapsed**: Whether the footer bar is initially collapsed

- **selectedTab**: The initially selected tab

- **selectedLayersLayerPath**: Layer path for layers tab selection

- **selectedDataTableLayerPath**: Layer path for data table tab selection

- **selectedTimeSliderLayerPath**: Layer path for time slider tab selection

**Default:** `{ tabs: { core: ["legend", "layers", "details", "data-table"], custom: [] }, collapsed: false }`

**Example:**

```typescript
footerBar: {
  tabs: {
    core: ["layers", "legend", "details", "time-slider", "geochart"],
    custom: []
  },
  collapsed: false,
  selectedTab: "layers"
}
```

> **Note:** The `"time-slider"` and `"geochart"` tabs require their respective packages to be configured. See [Time Slider Package](#time-slider-package) and [GeoChart Package](#geochart-package) configuration.

---

#### appBar (Optional)

Configuration for app bar tabs.

```typescript
appBar?: {
  tabs: {
    core: TypeValidAppBarCoreProps[];
  };
  collapsed: boolean;
  selectedTab: TypeValidAppBarCoreProps;
  selectedLayersLayerPath: string;
  selectedDataTableLayerPath: string;
  selectedTimeSliderLayerPath: string;
};

TypeValidAppBarCoreProps = "geolocator" | "export" | "aoi-panel" | "custom-legend" | "guide" | "legend" | "details" | "data-table" | "layers";
```

**Properties:**

- **tabs** (Required): Tab configuration

  - **core** (Required): Array of core tab identifiers
    - `"geolocator"` - Location search and navigation
    - `"export"` - Map export functionality
    - `"aoi-panel"` - **AOI Panel package** - Area of interest selection
    - `"custom-legend"` - **Custom Legend package** - Custom legend display
    - `"guide"` - User guide tab
    - `"legend"` - Layer legend display
    - `"details"` - Feature details viewer
    - `"data-table"` - Tabular data view
    - `"layers"` - Layer list and management

- **collapsed**: Whether the app bar is initially collapsed

- **selectedTab**: The initially selected tab

- **selectedLayersLayerPath**: Layer path for layers tab selection

- **selectedDataTableLayerPath**: Layer path for data table tab selection

- **selectedTimeSliderLayerPath**: Layer path for time slider tab selection

**Default:** `{ tabs: { core: ["geolocator"] }, collapsed: false }`

**Example:**

```typescript
appBar: {
  tabs: {
    core: ["geolocator", "export", "aoi-panel", "custom-legend"]
  },
  collapsed: false,
  selectedTab: "geolocator"
}
```

> **Note:** The `"aoi-panel"` tab requires the **aoi-panel package** to be configured. See [Area of Interest Panel Package](#area-of-interest-aoi-panel-package) configuration.

---

#### overviewMap (Optional)

Configuration for the overview map.

```typescript
overviewMap?: {
  hideOnZoom?: boolean;
  collapsed?: boolean;
};
```

**Properties:**

- `hideOnZoom` - Hide overview map when zoomed in
- `collapsed` - Start with overview map collapsed

**Example:**

```typescript
overviewMap: {
  hideOnZoom: true,
  collapsed: false
}
```

---

#### corePackages (Optional)

List of core packages to load. Currently only contains the Swiper package.

```typescript
corePackages?: Array<"swiper">;
```

**Available Packages:**

- `"swiper"` - Layer swipe comparison tool

**Example:**

```typescript
corePackages: ["swiper"];
```

> **Note:** Other packages (GeoChart, Time Slider, AOI Panel, Drawer) are loaded through their respective tab configurations in `appBar`, `footerBar`, or `navBar`.

---

#### corePackagesConfig (Optional)

Configuration for all packages. Each array element is an object with the package name as the key.

```typescript
corePackagesConfig?: Array<{
  [packageName: string]: PackageConfig;
}>;
```

See package-specific sections ([Swiper](#swiper-package), [GeoChart](#geochart-package), [Time Slider](#time-slider-package)) for detailed configuration options.

**Examples:**

```typescript
// Swiper package configuration
corePackagesConfig: [
  {
    swiper: {
      orientation: "vertical",
      layers: ["layer1", "layer2"],
      keyboardOffset: 20,
    },
  },
];

// Time Slider package configuration
corePackagesConfig: [
  {
    "time-slider": {
      sliders: [
        {
          layerPaths: ["weather-layer/temperature"],
          title: "Weather Timeline",
          delay: 1000,
        },
      ],
    },
  },
];

// Multiple packages
corePackagesConfig: [
  {
    swiper: {
      orientation: "horizontal",
      layers: ["layer1/0"],
    },
  },
  {
    geochart: {
      charts: [
        {
          type: "bar",
          title: "Population Data",
        },
      ],
    },
  },
];
```

---

#### serviceUrls (Optional)

URLs for external services.

```typescript
serviceUrls?: {
  geocoreUrl?: string;
  rcsUrl?: string;
  proxyUrl?: string;
  geolocator?: string;
  utmZoneUrl?: string;
  ntsSheetUrl?: string;
  altitudeUrl?: string;
};
```

**Example:**

```typescript
serviceUrls: {
  geolocator: "https://geolocator.api.geo.ca?keys=geonames,nominatim",
  geocoreUrl: "https://geocore.api.geo.ca"
}
```

---

#### globalSettings (Optional)

Global settings for the map instance.

```typescript
globalSettings?: TypeGlobalSettings;

TypeGlobalSettings = {
  canRemoveSublayers?: boolean;
  disabledLayerTypes?: TypeGeoviewLayerType[];
  showUnsymbolizedFeatures?: boolean;
  coordinateInfoEnabled?: boolean;
  hideCoordinateInfoSwitch?: boolean;
};
```

**Properties:**

- **canRemoveSublayers** (Optional): Whether or not sublayers can be removed from layer groups

  - **Type:** `boolean`
  - **Default:** `true`

- **disabledLayerTypes** (Optional): Array of layer types that should be disabled

  - **Type:** `TypeGeoviewLayerType[]`
  - **Valid values:** `"esriDynamic"`, `"esriFeature"`, `"imageStatic"`, `"geoJSON"`, `"geoPackage"`, `"xyzTiles"`, `"vectorTiles"`, `"ogcFeature"`, `"ogcWms"`, `"ogcWfs"`, `"CSV"`

- **showUnsymbolizedFeatures** (Optional): Whether to display unsymbolized features in the datatable and other components

  - **Type:** `boolean`

- **coordinateInfoEnabled** (Optional): Whether the initial state of the coordinate info tool should be enabled

  - **Type:** `boolean`

- **hideCoordinateInfoSwitch** (Optional): Whether the coordinate info tool should be removed from the UI
  - **Type:** `boolean`

**Example:**

```typescript
globalSettings: {
  canRemoveSublayers: true,
  disabledLayerTypes: ["ogcWfs", "CSV"],
  showUnsymbolizedFeatures: false,
  coordinateInfoEnabled: true,
  hideCoordinateInfoSwitch: false
}
```

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
    layerName: "Temperature",
  },
  {
    layerId: "1",
    layerName: "Precipitation",
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
  layerText?: TypeLayerTextConfig;
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

#### layerText (Optional)

Text/label configuration for displaying feature labels on the map.

```typescript
layerText?: TypeLayerTextConfig;
```

See [Layer Text Configuration](#layer-text-configuration) section for complete details.

**Example:**
```typescript
layerText: {
  field: "name",
  fontSize: 12,
  fill: "#000000",
  offsetY: -10
}
```

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
  // Control settings
  controls?: TypeLayerControls;

  // Geographic constraints
  bounds?: Extent;
  extent?: Extent;
  minZoom?: number;
  maxZoom?: number;

  // CSS styling
  className?: string;

  // Layer states
  states?: TypeLayerStates;
}

interface TypeLayerControls {
  highlight?: boolean; // Is highlight control available. Default = true
  hover?: boolean; // Is hover control available. Default = true
  opacity?: boolean; // Is opacity control available. Default = true
  query?: boolean; // Is query control available. Default = true
  remove?: boolean; // Is remove control available. Default = false
  table?: boolean; // Is table available. Default = true
  visibility?: boolean; // Is visibility control available. Default = true
  zoom?: boolean; // Is zoom available. Default = true
}

interface TypeLayerStates {
  visible?: boolean; // Is layer initially visible. Default = true
  legendCollapsed?: boolean; // Is legend initially collapsed. Default = false
  opacity?: number; // Initial opacity [0..1]. Default = 1
  hoverable?: boolean; // Is layer hoverable initially. Default = true
  queryable?: boolean; // Is layer queryable initially. Default = false
}
```

### Properties

#### controls

Settings for availability of layer controls in the UI.

```typescript
controls?: TypeLayerControls;
```

**Example:**

```typescript
initialSettings: {
  controls: {
    highlight: true,    // Allow highlight control
    hover: true,        // Allow hover control
    opacity: true,      // Allow opacity slider
    query: true,        // Allow feature queries
    remove: false,      // Hide remove button
    table: true,        // Allow data table
    visibility: true,   // Allow visibility toggle
    zoom: true          // Allow zoom to layer
  }
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

---

#### extent

Geographic extent that constrains the view (in layer's projection).

```typescript
extent?: Extent; // [minX, minY, maxX, maxY]
```

**Example:**

```typescript
initialSettings: {
  extent: [-120, 40, -100, 50]; // [west, south, east, north]
}
```

**Note:** `extent` uses layer projection, `bounds` uses WGS84.

---

#### minZoom / maxZoom

Zoom level constraints for layer visibility.

```typescript
minZoom?: number; // Minimum zoom level (exclusive)
maxZoom?: number; // Maximum zoom level (inclusive)
```

**Examples:**

```typescript
// Only visible at street level
initialSettings: {
  minZoom: 10,
  maxZoom: 18
}

// Only visible at world/country level
initialSettings: {
  minZoom: 0,
  maxZoom: 6
}
```

---

#### className

CSS class name to set on the layer element.

```typescript
className?: string;
```

**Example:**

```typescript
initialSettings: {
  className: "my-custom-layer";
}
```

---

#### states

Initial state settings for the layer.

```typescript
states?: TypeLayerStates;
```

**Example:**

```typescript
initialSettings: {
  states: {
    visible: true,
    legendCollapsed: false,
    opacity: 1.0,
    hoverable: true,
    queryable: false
  }
}
```

---

#### states.visible

Initial visibility of the layer.

```typescript
states?: {
  visible?: boolean;
};
```

**Default:** `true`

**Example:**

```typescript
initialSettings: {
  states: {
    visible: false; // Layer starts hidden
  }
}
```

---

#### states.legendCollapsed

Whether the layer's legend is initially collapsed.

```typescript
states?: {
  legendCollapsed?: boolean;
};
```

**Default:** `false`

**Example:**

```typescript
initialSettings: {
  states: {
    legendCollapsed: true; // Start with legend collapsed
  }
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
    opacity: 0.5;
  }
}

// Very subtle background
initialSettings: {
  states: {
    opacity: 0.2;
  }
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

**Default:** `true`

**Example:**

```typescript
initialSettings: {
  states: {
    hoverable: false; // Disable hover tooltips
  }
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

**Default:** `false`

**Example:**

```typescript
// Enable feature info for basemap
initialSettings: {
  states: {
    queryable: true;
  }
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
  maxRecordCount?: number;
  layerFilter?: string;
  format?: TypeVectorSourceFormats;
  featureInfo?: TypeFeatureInfoLayerConfig;
  strategy?: VectorStrategy; // 'all' | 'bbox'
  dataProjection?: string;
  postSettings?: TypePostSettings;
  separator?: string; // For CSV files
  crossOrigin?: string;
  projection?: 3978 | 3857 | 4326;
}

interface TypeFeatureInfoLayerConfig {
  queryable: boolean;
  nameField?: string;
  outfields?: TypeOutfields[];
}

type TypeVectorSourceFormats =
  | "GeoJSON"
  | "EsriJSON"
  | "KML"
  | "WFS"
  | "featureAPI"
  | "CSV"
  | "MVT"
  | "WKB";

type VectorStrategy = "all" | "bbox";
```

**Example:**

```typescript
source: {
  dataAccessPath: "/data/features.geojson",
  format: "GeoJSON",
  maxRecordCount: 10000,
  strategy: "bbox",
  featureInfo: {
    queryable: true,
    nameField: "name",
    outfields: ["name", "population", "area"]
  }
}
```

---

#### Raster Sources (WMS, ESRI Image, XYZ)

```typescript
// Union type for different image sources
type TypeSourceImageInitialConfig =
  | TypeSourceImageWmsInitialConfig
  | TypeSourceImageEsriInitialConfig
  | TypeSourceImageStaticInitialConfig;

// WMS Image Source
interface TypeSourceImageWmsInitialConfig {
  serverType?: "mapserver" | "geoserver" | "qgis";
  wmsStyle?: string | string[];
  featureInfo?: TypeFeatureInfoLayerConfig;
  crossOrigin?: string;
  projection?: 3978 | 3857 | 4326;
}

// ESRI Image Source
interface TypeSourceImageEsriInitialConfig {
  format?: "PNG" | "PNG8" | "PNG24" | "PNG32" | "JPG" | "GIF" | "BMP";
  transparent?: boolean; // Default = true
  crossOrigin?: string;
  projection?: 3978 | 3857 | 4326;
}

// Static Image Source
interface TypeSourceImageStaticInitialConfig {
  extent: Extent; // Required for static images
  crossOrigin?: string;
  projection?: 3978 | 3857 | 4326;
  featureInfo?: { queryable: false }; // Must be false
}
```

**Examples:**

```typescript
// WMS source
source: {
  serverType: "mapserver",
  wmsStyle: "default",
  featureInfo: {
    queryable: true
  }
}

// ESRI Image source
source: {
  format: "PNG32",
  transparent: true
}

// Static Image source
source: {
  extent: [-180, -90, 180, 90]
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

## Layer Text Configuration

Configuration for displaying text labels on map features.

###TypeLayerTextConfig

```typescript
layerText: {
  // Content: field takes precedence
  field?: string;
  text?: string | string[];

  // Font styling
  fontSize?: number;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;

  // Positioning
  offsetX?: number;
  offsetY?: number;
  placement?: 'point' | 'line';
  textAlign?: 'left' | 'right' | 'center' | 'end' | 'start';
  justify?: 'left' | 'center' | 'right';
  textBaseline?: 'bottom' | 'top' | 'middle' | 'alphabetic' | 'hanging' | 'ideographic';

  // Appearance
  fill?: string;
  haloColor?: string;
  haloWidth?: number;
  backgroundFill?: string;
  backgroundStrokeColor?: string;
  backgroundStrokeWidth?: number;

  // Behavior
  overflow?: boolean;
  rotation?: number;
  rotateWithView?: boolean;
  keepUpright?: boolean;
  maxAngle?: number;
  repeat?: number;
  scale?: number | [number, number];

  // Layout
  padding?: [number, number, number, number];
  declutterMode?: 'declutter' | 'obstacle' | 'none'; **Not working at the moment**
  wrap?: boolean;
  wrapLines?: number
  wrapCount?: number;

  // Visibility
  minZoomLevel?: number;
  maxZoomLevel?: number;
}
```

### Properties

#### field

Feature field to use as label text.

```typescript
field?: string;
```

**Example:**

```typescript
layerText: {
  field: "name" // Use the 'name' field from features
}
```

---

#### text

Static text or template with field placeholders. Supports rich text arrays and date formatting. Documentation for the date formatting tags can be found here: [Day.js Format](https://day.js.org/docs/en/display/format)

```typescript
text?: string | string[];
```

**Examples:**

```typescript
// Static text
text: "Label"

// Template with field placeholders
text: "Name: {name} - Pop: {population}"

// Date formatting
text: "Date: {date:MM/DD/YYYY}"

// Rich text array (alternating text and font styles)
text: ["Name: ", "bold 12px Arial", "{name}", "10px Arial"]

// Rich text array with line break
text: ["Name: {name}", "bold 12px Arial", "\n", "", "Pop: {population}", "12px Arial"]
```

**Template Placeholders:**
- `{fieldName}` - Insert field value
- `{fieldName:format}` - Format field value (dates only)

**Date Formats:**
- `YYYY` - 4-digit year
- `MM` - 2-digit month  
- `DD` - 2-digit day

---

#### fontSize

Font size in pixels.

```typescript
fontSize?: number; // Default: 10
```

**Example:**

```typescript
layerText: {
  fontSize: 14
}
```

---

#### fontFamily

Font family name.

```typescript
fontFamily?: string; // Default: 'sans-serif'
```

**Example:**

```typescript
layerText: {
  fontFamily: "Arial"
}
```

---

#### bold / italic

Font weight and style.

```typescript
bold?: boolean; // Default: false
italic?: boolean; // Default: false
```

**Example:**

```typescript
layerText: {
  bold: true,
  italic: false
}
```

---

#### offsetX / offsetY

Text offset in pixels from feature position.

```typescript
offsetX?: number; // Horizontal offset
offsetY?: number; // Vertical offset
```

**Example:**

```typescript
layerText: {
  offsetX: 5,   // 5px right
  offsetY: -10  // 10px up
}
```

---

#### fill

Text color.

```typescript
fill?: string;
```

**Examples:**

```typescript
fill: "#000000"           // Black
fill: "rgba(255,0,0,0.8)" // Semi-transparent red
fill: "blue"              // Named color
```

---

#### haloColor / haloWidth

Text outline (halo) for better readability. The stroke property in OpenLayers.

```typescript
haloColor?: string;
haloWidth?: number;
```

**Example:**

```typescript
layerText: {
  fill: "#000000",
  haloColor: "#FFFFFF",
  haloWidth: 2
}
```

---

#### minZoomLevel / maxZoomLevel

Zoom-based visibility control.

```typescript
minZoomLevel?: number; // Show only above this zoom
maxZoomLevel?: number; // Show only below this zoom
```

**Example:**

```typescript
layerText: {
  minZoomLevel: 10, // Only show when zoomed in past level 10
  maxZoomLevel: 18  // Hide when zoomed in past level 18
}
```

---

#### wrap / wrapLines / wrapCount

Text wrapping configuration. WrapLines takes precedence over wrapCount, but the count will be honored if possible, otherwise the text will be limited to the number of lines and surpass the count limit.

```typescript
wrap?: boolean;
wrapLines?: number; // Number of lines to limit the wrapped text to
wrapCount?: number; // Characters per line (default: 16)
```

**Example:**

```typescript
layerText: {
  wrap: true,
  wrapLines: 3,
  wrapCount: 20 // Wrap at 20 characters per line
}
```

---

#### declutterMode

Label collision handling.

```typescript
declutterMode?: 'declutter' | 'obstacle' | 'none'; // Default: 'declutter'
```

- `'declutter'` - Hide overlapping labels
- `'obstacle'` - Show labels but treat as obstacles for other labels
- `'none'` - Show all labels regardless of overlap

**Example:**

```typescript
layerText: {
  declutterMode: "none" // Show all labels
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
  metadataAccessPath: "/data/features",
  listOfLayerEntryConfig: [
    {
      layerId: "polygons",
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
  metadataAccessPath: "/data/",
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
  geoviewLayerId: "xyzTilesLYR2",
  geoviewLayerName: "GNOSIS_Blue_Marble",
  metadataAccessPath: "https://maps.gnosis.earth/ogcapi/collections/blueMarble/map/tiles/WebMercatorQuad",
  geoviewLayerType: "xyzTiles",
  listOfLayerEntryConfig: [
    {
      layerId: "blueMarble",
      layerName: "GNOSIS Blue Marble",
      source: {
        dataAccessPath: "https://maps.gnosis.earth/ogcapi/collections/blueMarble/map/tiles/WebMercatorQuad/{z}/{y}/{x}.jpg"
      }
    }
}
```

---

## Package Configuration

Configuration schemas for GeoView packages. Packages are loaded and configured through different sections of the map configuration:

- **Swiper**: Configured in `corePackages` and `corePackagesConfig`
- **GeoChart**: Loaded via `footerBar.tabs.core: ["geochart"]`
- **Time Slider**: Loaded via `footerBar.tabs.core: ["time-slider"]`
- **AOI Panel**: Loaded via `appBar.tabs.core: ["aoi-panel"]`
- **Drawer**: Loaded via `navBar: ["drawer"]`

### Package Configuration Methods

#### Method 1: Core Packages (Swiper only)

```typescript
corePackages: ["swiper"],
corePackagesConfig: [
  {
    packageName: "swiper",
    configObj: {
      // Swiper-specific configuration
    }
  }
]
```

#### Method 2: Tab-based Loading (GeoChart, Time Slider, AOI Panel, Drawer)

These packages are automatically loaded when included in their respective UI sections and configured through their default config files or via the package-specific configuration mechanisms.

---

### GeoChart Package

Chart visualization package for displaying data charts based on layer features.

**Loading:** Include `"geochart"` in `footerBar.tabs.core` array to enable this package.

#### Schema

```typescript
interface GeochartConfig {
  charts: Array<ChartConfig>;
  version?: string;
}

interface ChartConfig {
  // Chart-specific properties defined in schema-chart.json
  type: "line" | "bar" | "pie" | "area" | "scatter";
  title?: string;
  data?: object;
  // Additional chart properties...
}
```

#### Example

```typescript
corePackagesConfig: [
  {
    geochart: {
      charts: [
        {
          type: "bar",
          title: "Population by City",
          layerPath: "population-layer",
          xAxis: "city",
          yAxis: "population",
        },
      ],
    },
  },
];
```

---

### Time Slider Package

Temporal data control package for filtering time-aware layers.

**Loading:** Include `"time-slider"` in `footerBar.tabs.core` array to enable this package.

#### Schema

```typescript
interface TimeSliderConfig {
  sliders: Array<SliderConfig>;
}

interface SliderConfig {
  // Required
  layerPaths: Array<string>;

  // Optional
  fields?: Array<string>;
  title?: string;
  description?: string;
  delay?: 500 | 750 | 1000 | 1500 | 2000 | 3000 | 5000;
  filtering?: boolean;
  locked?: boolean;
  reversed?: boolean;
  timeDimension?: {
    field?: string;
    default?: Array<string>;
    nearestValues?: 'discrete' | 'continuous';
    singleHandle?: boolean;
    displayPattern?: Array<{
      datePrecision?: "" | "year" | "month" | "day";
      timePrecision?: "" | "hour" | "minute" | "second";
    }>;
    rangeItems?: {
      type?: string;
      range: Array<string>;
    };
  };
}
```

#### Properties

- **layerPaths** (Required): Array of layer paths to control
- **fields**: Array of field names for filtering (one per layer path)
- **title**: Display title for the slider
- **description**: Description text
- **delay**: Animation delay in milliseconds (default: 1000)
- **filtering**: Enable/disable filtering (default: true)
- **locked**: Lock slider handles (default: false)
- **reversed**: Reverse animation direction (default: false)
- **timeDimension**: Temporal dimension configuration
  - **field**: Field name for temporal filtering
  - **default**: Default date value(s) to display
  - **nearestValues**: Slider behavior mode
    - `'discrete'` - Slider snaps only to values in the range array (default)
    - `'continuous'` - Slider allows any value between min/max, uses step for filtering
  - **singleHandle**: Use single handle (true) or range handles (false)
  - **displayPattern**: Date/time display format configuration
  - **rangeItems**: Temporal range definition
    - **type**: Range type ('discrete', 'relative', or 'continuous')
    - **range**: Array of date strings defining available time points

#### Temporal Modes

**Discrete Mode** (`nearestValues: 'discrete'`):
- Slider handle snaps only to values defined in the `range` array
- Best for data with distinct time points (e.g., yearly data, specific dates)
- Step selector is hidden (not applicable)
- Filter uses exact range values: `Year >= '2015-01-01' AND Year < '2016-01-01'`

**Continuous Mode** (`nearestValues: 'continuous'`):
- Slider allows free movement between min and max values
- Best for data with dense temporal coverage (e.g., hourly, daily)
- Step selector visible to control filter range
- Filter uses step-based ranges: `Year >= '2015-06-15T14:30:00Z' AND Year < '2015-06-15T15:30:00Z'`

#### Example

```typescript
corePackagesConfig: [
  {
    "time-slider": {
      sliders: [
        {
          // Discrete mode example (yearly data)
          layerPaths: ["yearly-data-layer"],
          title: "Yearly Temperature Data",
          description: "Annual temperature measurements from 2010-2020",
          filtering: true,
          timeDimension: {
            field: "Year",
            nearestValues: "discrete",
            singleHandle: true,
            rangeItems: {
              type: "discrete",
              range: [
                "2010-01-01T00:00:00Z",
                "2011-01-01T00:00:00Z",
                "2012-01-01T00:00:00Z",
                "2013-01-01T00:00:00Z",
                "2014-01-01T00:00:00Z",
                "2015-01-01T00:00:00Z",
                "2016-01-01T00:00:00Z",
                "2017-01-01T00:00:00Z",
                "2018-01-01T00:00:00Z",
                "2019-01-01T00:00:00Z",
                "2020-01-01T00:00:00Z"
              ]
            }
          }
        },
        {
          // Continuous mode example (hourly data)
          layerPaths: ["weather-layer/temperature"],
          fields: ["timestamp"],
          title: "Hourly Weather Data",
          description: "Real-time temperature measurements",
          delay: 1000,
          filtering: true,
          locked: false,
          reversed: false,
          timeDimension: {
            field: "timestamp",
            nearestValues: "continuous",
            singleHandle: true,
            rangeItems: {
              type: "continuous",
              range: [
                "2024-01-01T00:00:00Z",
                "2024-01-31T23:59:59Z"
              ]
            }
          }
        },
        {
          // Multi-layer example with range handles
          layerPaths: [
            "weather-layer/temperature",
            "weather-layer/precipitation"
          ],
          fields: ["timestamp", "date"],
          title: "Weather Data Timeline",
          description: "Filter multiple weather layers by time range",
          delay: 1500,
          filtering: true,
          locked: false,
          reversed: false,
          timeDimension: {
            nearestValues: "discrete",
            singleHandle: false,
            displayPattern: [
              { datePrecision: "day" },
              { timePrecision: "hour" }
            ]
          }
        }
      ]
    }
  }
];
```

#### Configuration Tips

**When to use Discrete Mode:**
- Yearly, quarterly, or monthly data
- Data with specific collection dates (satellite imagery dates)
- When you want users to select from predefined time points
- When step-based filtering doesn't make sense for your data

**When to use Continuous Mode:**
- Hourly, daily data with dense temporal coverage
- Streaming or real-time data
- When you want flexible time range selection
- When step-based filtering is appropriate (e.g., "show last 6 hours")

**Display Pattern:**
- Use `datePrecision` alone for date-only data (`"year"`, `"month"`, `"day"`)
- Add `timePrecision` for time-of-day display (`"hour"`, `"minute"`, `"second"`)
- Leave both undefined for automatic detection based on data

**Performance:**
- Discrete mode with many time points (>50) may require optimization
- Continuous mode works well for any range size
- Consider using `delay` to control animation speed based on data density

---

### Swiper Package

Layer comparison package using a swipe control.

**Loading:** Include `"swiper"` in `corePackages` array and provide configuration in `corePackagesConfig`.

#### Schema

```typescript
interface SwiperConfig {
  // Required
  orientation: "vertical" | "horizontal";
  layers: Array<string>;

  // Optional
  keyboardOffset?: number;
  version?: string;
}
```

#### Properties

- **orientation** (Required): Swiper bar orientation
  - `"vertical"` - Vertical swipe bar
  - `"horizontal"` - Horizontal swipe bar
- **layers** (Required): Array of layer IDs to include in swiper
- **keyboardOffset**: Pixel offset when using keyboard (default: 10, range: 10-100)
- **version**: Schema version (default: "1.0")

#### Example

```typescript
corePackagesConfig: [
  {
    swiper: {
      orientation: "vertical",
      layers: ["satellite-imagery", "street-map"],
      keyboardOffset: 20,
    },
  },
];
```

---

### Area of Interest (AOI) Panel Package

Panel for selecting predefined areas of interest.

**Loading:** Include `"aoi-panel"` in `appBar.tabs.core` array to enable this package.

#### Schema

```typescript
interface AoiPanelConfig {
  isOpen?: boolean;
  aoiList?: Array<AoiItem>;
}

interface AoiItem {
  imageUrl?: string;
  aoiTitle?: string;
  extent: [number, number, number, number]; // [minX, minY, maxX, maxY]
}
```

#### Properties

- **isOpen**: Initial panel state (default: false)
- **aoiList**: Array of area of interest definitions
  - **imageUrl**: Preview image URL
  - **aoiTitle**: Display name
  - **extent**: Geographic extent [minLon, minLat, maxLon, maxLat]

#### Example

```typescript
corePackagesConfig: [
  {
    "aoi-panel": {
      isOpen: false,
      aoiList: [
        {
          imageUrl: "/images/ottawa.png",
          aoiTitle: "Ottawa",
          extent: [-76.0, 45.2, -75.5, 45.6],
        },
        {
          imageUrl: "/images/toronto.png",
          aoiTitle: "Toronto",
          extent: [-79.7, 43.5, -79.0, 43.9],
        },
      ],
    },
  },
];
```

---

### Custom Legend Package

Custom legend panel for displaying a customized legend with headers, groups, and layer legends.

**Loading:** Include `"custom-legend"` in `appBar.tabs.core` array to enable this package.

#### Schema

```typescript
interface CustomLegendConfig {
  // Optional
  isOpen?: boolean;
  title?: string;
  legendList?: Array<TypeLegendItem>;
  version?: string;
}

type TypeLegendItem = TypeLegendLayer | TypeHeaderLayer | TypeGroupLayer;

interface TypeLegendLayer {
  type: "layer";
  layerPath: string;
}

interface TypeHeaderLayer {
  type: "header";
  text: string;
  description?: TypeDescription;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
}

interface TypeGroupLayer {
  type: "group";
  text: string;
  description?: TypeDescription;
  collapsed?: boolean;
  children: Array<TypeLegendItem>;
}

interface TypeDescription {
  text: string;
  collapsed?: boolean;
}
```

#### Properties

- **isOpen**: Initial panel state (default: false)
- **title**: Custom title text for the legend panel
- **legendList**: Ordered array of legend items to display
- **version**: Schema version (default: "1.0")

#### Legend Item Types

**TypeLegendLayer** - Display a standard legend from a GeoView layer:

- **type** (Required): Must be `"layer"`
- **layerPath** (Required): Layer path identifying the layer

**TypeHeaderLayer** - Display a text header for organizing sections:

- **type** (Required): Must be `"header"`
- **text** (Required): Header text to display
- **description**: Optional description object with:
  - **text** (Required): Descriptive text to display below header
  - **collapsed** (Optional): Whether description starts collapsed (default: false)
- **fontSize**: Font size in pixels (range: 8-32, default: 16)
- **fontWeight**: Font weight (`"normal"` or `"bold"`, default: "bold")

**TypeGroupLayer** - Display a collapsible group of legend items:

- **type** (Required): Must be `"group"`
- **text** (Required): Group title text
- **description**: Optional description object with:
  - **text** (Required): Descriptive text to display below group title
  - **collapsed** (Optional): Whether description starts collapsed (default: false)
- **collapsed**: Initial collapsed state of the group itself (default: false)
- **children** (Required): Array of child legend items (must have at least 1)

#### Examples

**Basic Custom Legend:**

```json
{
  "corePackagesConfig": [
    {
      "custom-legend": {
        "isOpen": false,
        "title": "Map Layers",
        "legendList": [
          {
            "type": "layer",
            "layerPath": "weather-layer/temperature"
          },
          {
            "type": "layer",
            "layerPath": "weather-layer/precipitation"
          }
        ]
      }
    }
  ]
}
```

**With Headers and Groups:**

```json
{
  "corePackagesConfig": [
    {
      "custom-legend": {
        "isOpen": true,
        "title": "Environmental Data",
        "legendList": [
          {
            "type": "header",
            "text": "Weather Layers",
            "description": {
              "text": "Current weather conditions and forecasts",
              "collapsed": false
            },
            "fontSize": 18,
            "fontWeight": "bold"
          },
          {
            "type": "group",
            "text": "Temperature Data",
            "description": {
              "text": "Temperature forecasts and historical data",
              "collapsed": true
            },
            "collapsed": false,
            "children": [
              {
                "type": "layer",
                "layerPath": "weather/current-temp"
              },
              {
                "type": "layer",
                "layerPath": "weather/forecast-temp"
              }
            ]
          },
          {
            "type": "header",
            "text": "Administrative Boundaries",
            "fontSize": 16
          },
          {
            "type": "layer",
            "layerPath": "boundaries/provinces"
          }
        ]
      }
    }
  ]
}
```

**Nested Groups:**

```json
{
  "corePackagesConfig": [
    {
      "custom-legend": {
        "legendList": [
          {
            "type": "group",
            "text": "Environmental",
            "collapsed": false,
            "children": [
              {
                "type": "group",
                "text": "Weather",
                "description": {
                  "text": "Real-time weather data and forecasts",
                  "collapsed": false
                },
                "collapsed": true,
                "children": [
                  {
                    "type": "layer",
                    "layerPath": "weather/temperature"
                  },
                  {
                    "type": "layer",
                    "layerPath": "weather/precipitation"
                  }
                ]
              },
              {
                "type": "group",
                "text": "Air Quality",
                "description": {
                  "text": "Air quality monitoring stations and measurements",
                  "collapsed": true
                },
                "collapsed": true,
                "children": [
                  {
                    "type": "layer",
                    "layerPath": "air-quality/pm25"
                  },
                  {
                    "type": "layer",
                    "layerPath": "air-quality/ozone"
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  ]
}
```

#### Notes

- Layer paths must reference existing layers in your map configuration
- Groups can be nested within other groups
- Headers and groups support optional descriptions with collapsible state
- Description text provides additional context and can be toggled by users
- The legend list order determines display order in the panel

---

### Drawer Package

Side drawer panel for additional content.

**Loading:** Include `"drawer"` in `navBar` array to enable this package.

#### Schema

```typescript
interface DrawerConfig {
  // Drawer configuration properties
  version?: string;
}
```

#### Example

```typescript
corePackagesConfig: [
  {
    drawer: {
      version: "1.0",
    },
  },
];
```

---

### Complete Package Configuration Example

```typescript
{
  map: {
    basemapOptions: {
      basemapId: "transport",
      shaded: true,
      labeled: true
    },
    interaction: "dynamic",
    viewSettings: {
      projection: 3978,
      initialView: {
        zoomAndCenter: [10, [-75.7, 45.4]]
      }
    },
    listOfGeoviewLayerConfig: [
      {
        geoviewLayerId: "weather-data",
        geoviewLayerType: "ogcWms",
        metadataAccessPath: "https://example.com/wms"
      },
      {
        geoviewLayerId: "satellite-layer",
        geoviewLayerType: "esriImage",
        metadataAccessPath: "https://example.com/arcgis/rest/services/satellite"
      }
    ]
  },
  theme: "geo.ca",
  navBar: ["zoom", "fullscreen", "home", "drawer"],
  appBar: {
    tabs: {
      core: ["geolocator", "aoi-panel"]
    }
  },
  footerBar: {
    tabs: {
      core: ["legend", "layers", "details", "time-slider"]
    }
  },
  // Swiper is the only package in corePackages
  corePackages: ["swiper"],
  corePackagesConfig: [
    {
      swiper: {
        orientation: "vertical",
        layers: ["weather-data", "satellite-layer"],
        keyboardOffset: 20
      }
    }
  ]
}
```

> **Note:** In the example above:
>
> - **Swiper** is configured via `corePackages` and `corePackagesConfig`
> - **Drawer** is enabled by including it in `navBar`
> - **AOI Panel** is enabled by including it in `appBar.tabs.core`
> - **Time Slider** and **GeoChart** are enabled by including them in `footerBar.tabs.core`
> - Each package uses its default configuration file or can be configured through package-specific mechanisms

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
