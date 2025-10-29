# GeoView Packages and Plugins

GeoView is built as a monorepo with a core package and several plugin packages that extend functionality. This document covers all available packages and how to use them.

## Package Architecture

```
geoview/
├── packages/
│   ├── geoview-core/           # Core GeoView functionality
│   ├── geoview-time-slider/    # Time-enabled layer control
│   ├── geoview-geochart/       # Chart visualization
│   ├── geoview-swiper/         # Layer comparison tool
│   ├── geoview-drawer/         # Drawing tools
│   ├── geoview-aoi-panel/      # Area of interest selection
│   └── geoview-custom-legend/  # Custom legend configurations
```

All packages are managed using Rush.js and built with TypeScript.

---

## Core Package

### geoview-core

**Description:** The main GeoView package containing core mapping functionality, layer management, UI components, and state management.

**Version:** 2.0.x

**Key Features:**

- OpenLayers-based map rendering
- Multiple layer type support (WMS, ESRI, GeoJSON, etc.)
- React-based UI components
- Zustand state management
- Event processor architecture
- Multilingual support (English/French)
- Accessibility features

**Installation:**

```bash
npm install geoview-core
```

**Usage:**

```html
<!-- Include in HTML -->
<script src="https://cdn.example.com/geoview-core/cgpv.js"></script>
<link rel="stylesheet" href="https://cdn.example.com/geoview-core/cgpv.css" />

<!-- Create map container -->
<div
  id="mapId"
  class="geoview-map"
  data-lang="en"
  data-config-url="/config/map-config.json"
></div>

<!-- Initialize -->
<script>
  cgpv.init(() => {
    console.log("GeoView initialized");
  });
</script>
```

**Programmatic API:**

```typescript
import { cgpv } from "geoview-core";

// Create map programmatically
cgpv.api.createMapFromConfig("mapId", {
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
  components: ["north-arrow", "overview-map"],
  corePackages: ["basemap-panel"],
  surmountedComponents: [],
});
```

**See Also:** [API Reference](./api.md), [Map Viewer API](./map-viewer-api-doc.md)

---

## Plugin Packages

### 1. geoview-time-slider

**Description:** A plugin that provides temporal filtering for time-enabled layers through an interactive time slider control.

**Version:** 2.0.x

**Author:** Damon Ulmi

**Repository:** `packages/geoview-time-slider/`

**Features:**

- Time slider UI in footer panel
- Support for WMS and ESRI Image layers with time dimensions
- Single and range time selection
- Play/pause animation controls
- Time step configuration
- Temporal filtering synchronized across layers

**Dependencies:**

- `geoview-core`: ^2.0.0
- `react`: ^18.3.1
- `zustand`: ~5.0.0

#### Installation

The time slider is typically included in the GeoView build. To use it:

**Via Configuration:**

```json
{
  "plugins": ["time-slider-panel"]
}
```

**Programmatic:**

```typescript
// Access via MapViewer
const mapViewer = cgpv.api.getMapViewer("mapId");

// Check if time slider is available
if (TimeSliderEventProcessor.isTimeSliderInitialized("mapId")) {
  // Get time-enabled layers
  const timeLayers = TimeSliderEventProcessor.getTimeSliderLayers("mapId");

  // Get current filters
  const filters = TimeSliderEventProcessor.getTimeSliderFilters("mapId");
}
```

#### Configuration Example

```json
{
  "map": {
    "listOfGeoviewLayerConfig": [
      {
        "geoviewLayerId": "wmsTimeLayer",
        "geoviewLayerType": "ogcWms",
        "metadataAccessPath": {
          "en": "https://example.com/wms"
        },
        "listOfLayerEntryConfig": [
          {
            "layerId": "temperature",
            "layerName": { "en": "Temperature" },
            "source": {
              "featureInfo": {
                "queryable": true
              },
              "timeDimension": {
                "field": "time",
                "default": "2024-01-01",
                "range": ["2024-01-01", "2024-12-31"],
                "step": "P1D"
              }
            }
          }
        ]
      }
    ]
  },
  "plugins": ["time-slider-panel"]
}
```

#### API Methods

```typescript
import { TimeSliderEventProcessor } from "@/api/event-processors/event-processor-children/time-slider-event-processor";

// Check initialization
const isInitialized = TimeSliderEventProcessor.isTimeSliderInitialized("mapId");

// Get time-enabled layers
const timeLayers = TimeSliderEventProcessor.getTimeSliderLayers("mapId");

// Get selected layer
const selectedLayer =
  TimeSliderEventProcessor.getTimeSliderSelectedLayer("mapId");

// Get all filters
const filters = TimeSliderEventProcessor.getTimeSliderFilters("mapId");

// Get time values
const timeValues = TimeSliderEventProcessor.getTimeSliderValues("mapId");
```

**See Also:** [TimeSliderEventProcessor](./event-processors.md#3-timeslidereventprocessor)

---

### 2. geoview-geochart

**Description:** A charting plugin that visualizes layer data in interactive charts using the geochart library.

**Version:** 2.0.x

**Author:** Alexandre Roy

**Repository:** `packages/geoview-geochart/`

**Features:**

- Line charts, bar charts, pie charts
- Interactive chart controls
- Data filtering and aggregation
- Chart export capabilities
- Synchronized with map selections
- Multiple chart instances per map

**Dependencies:**

- `geoview-core`: ^2.0.0
- `geochart`: github:Canadian-Geospatial-Platform/geochart#develop
- `react`: ^18.3.1
- `zustand`: ~5.0.0

#### Installation

**Via Configuration:**

```json
{
  "plugins": ["geochart"]
}
```

**Programmatic:**

```typescript
import { GeochartEventProcessor } from "@/api/event-processors/event-processor-children/geochart-event-processor";

// Check if geochart is initialized
if (GeochartEventProcessor.isGeochartInitialized("mapId")) {
  // Get chart configurations
  const charts = GeochartEventProcessor.getGeochartCharts("mapId");
}
```

#### Configuration Example

```json
{
  "map": {
    "listOfGeoviewLayerConfig": [
      {
        "geoviewLayerId": "populationLayer",
        "geoviewLayerType": "esriFeature",
        "metadataAccessPath": {
          "en": "https://example.com/FeatureServer/0"
        }
      }
    ]
  },
  "plugins": ["geochart"],
  "geochart": {
    "charts": [
      {
        "chartId": "populationChart",
        "chartType": "bar",
        "layerPath": "populationLayer",
        "xAxis": "city",
        "yAxis": "population",
        "title": {
          "en": "Population by City",
          "fr": "Population par ville"
        }
      }
    ]
  }
}
```

#### API Methods

```typescript
import { GeochartEventProcessor } from "@/api/event-processors/event-processor-children/geochart-event-processor";

// Check initialization
const isInitialized = GeochartEventProcessor.isGeochartInitialized("mapId");

// Get all charts
const charts = GeochartEventProcessor.getGeochartCharts("mapId");

// Propagate chart data
GeochartEventProcessor.propagateGeochartToStore("mapId", layerPath, chartData);
```

**See Also:** [GeochartEventProcessor](./event-processors.md#8-geocharteventprocessor)

---

### 3. geoview-swiper

**Description:** A layer comparison tool that allows users to swipe between layers to compare them side-by-side.

**Version:** 2.0.x

**Author:** Saleh Yassin

**Repository:** `packages/geoview-swiper/`

**Features:**

- Interactive swiper bar
- Layer visibility toggle on each side
- Draggable swiper control
- Vertical or horizontal orientation
- Synchronized map views

**Dependencies:**

- `geoview-core`: ^2.0.0
- `react-draggable`: ^4.4.6
- `lodash`: ^4.17.21
- `ol`: 10.5.0
- `react`: ^18.3.1
- `zustand`: ~5.0.0

**Based on:**

- https://viglino.github.io/ol-ext/examples/control/map.control.swipe.html
- https://openlayers.org/en/latest/examples/layer-swipe.html

#### Installation

**Via Configuration:**

```json
{
  "plugins": ["swiper"]
}
```

**Programmatic:**

```typescript
import { SwiperEventProcessor } from "@/api/event-processors/event-processor-children/swiper-event-processor";

// Check if swiper is initialized
if (SwiperEventProcessor.isSwiperInitialized("mapId")) {
  // Get swiper state
  const swiperState = SwiperEventProcessor.getSwiperState("mapId");
}
```

#### Configuration Example

```json
{
  "map": {
    "listOfGeoviewLayerConfig": [
      {
        "geoviewLayerId": "layer2020",
        "geoviewLayerName": { "en": "2020 Imagery" },
        "geoviewLayerType": "xyzTiles",
        "metadataAccessPath": {
          "en": "https://tiles.example.com/2020/{z}/{x}/{y}.png"
        }
      },
      {
        "geoviewLayerId": "layer2024",
        "geoviewLayerName": { "en": "2024 Imagery" },
        "geoviewLayerType": "xyzTiles",
        "metadataAccessPath": {
          "en": "https://tiles.example.com/2024/{z}/{x}/{y}.png"
        }
      }
    ]
  },
  "plugins": ["swiper"],
  "swiper": {
    "orientation": "vertical",
    "layers": {
      "left": ["layer2020"],
      "right": ["layer2024"]
    }
  }
}
```

#### API Methods

```typescript
import { SwiperEventProcessor } from "@/api/event-processors/event-processor-children/swiper-event-processor";

// Check initialization
const isInitialized = SwiperEventProcessor.isSwiperInitialized("mapId");

// Get swiper state
const swiperState = SwiperEventProcessor.getSwiperState("mapId");
```

**See Also:** [SwiperEventProcessor](./event-processors.md#9-swipereventprocessor)

---

### 4. geoview-drawer

**Description:** A drawing and geometry editing plugin that allows users to create, modify, and manage geometries on the map.

**Version:** 2.0.x

**Repository:** `packages/geoview-drawer/`

**Features:**

- Draw points, lines, polygons, circles, rectangles
- Edit and modify existing geometries
- Delete geometries
- Snap to features
- Measure distances and areas
- Export drawn geometries as GeoJSON
- Import geometries

**Dependencies:**

- `geoview-core`: ^2.0.0
- `react`: ^18.3.1
- `zustand`: ~5.0.0

#### Installation

**Via Configuration:**

```json
{
  "plugins": ["drawer"]
}
```

**Programmatic:**

```typescript
import { DrawerEventProcessor } from "@/api/event-processors/event-processor-children/drawer-event-processor";

// Check if drawer is initialized
if (DrawerEventProcessor.isDrawerInitialized("mapId")) {
  // Start drawing
  DrawerEventProcessor.startDrawing("mapId", "Polygon");
}
```

#### Configuration Example

```json
{
  "plugins": ["drawer"],
  "drawer": {
    "tools": ["point", "line", "polygon", "circle", "rectangle"],
    "measureEnabled": true,
    "snapToFeatures": true,
    "snapTolerance": 10
  }
}
```

#### API Methods

```typescript
import { DrawerEventProcessor } from "@/api/event-processors/event-processor-children/drawer-event-processor";

// Check initialization
const isInitialized = DrawerEventProcessor.isDrawerInitialized("mapId");

// Get drawer state
const drawerState = DrawerEventProcessor.getDrawerState("mapId");

// Start drawing
DrawerEventProcessor.startDrawing("mapId", "Polygon");

// Stop drawing
DrawerEventProcessor.stopDrawing("mapId");

// Clear all drawings
DrawerEventProcessor.clearDrawings("mapId");

// Export as GeoJSON
const geojson = DrawerEventProcessor.exportAsGeoJSON("mapId");
```

**See Also:** [DrawerEventProcessor](./event-processors.md#10-drawereventprocessor)

---

### 5. geoview-aoi-panel

**Description:** An Area of Interest (AOI) selection panel that allows users to define and manage areas of interest on the map.

**Version:** 2.0.x

**Repository:** `packages/geoview-aoi-panel/`

**Features:**

- Define AOI by drawing or selecting features
- Import AOI from file (GeoJSON, KML)
- Export AOI to various formats
- Multiple AOI management
- AOI-based filtering and analysis
- Saved AOI library

**Dependencies:**

- `geoview-core`: ^2.0.0
- `react`: ^18.3.1
- `zustand`: ~5.0.0

#### Installation

**Via Configuration:**

```json
{
  "plugins": ["aoi-panel"]
}
```

#### Configuration Example

```json
{
  "plugins": ["aoi-panel"],
  "aoi-panel": {
    "allowMultiple": true,
    "defaultName": "My Area",
    "enableImport": true,
    "enableExport": true,
    "storageKey": "geoview-aoi-library"
  }
}
```

---

### 6. geoview-custom-legend

**Description:** A plugin for creating custom legend configurations with advanced styling and filtering options.

**Version:** 2.0.x

**Repository:** `packages/geoview-custom-legend/`

**Features:**

- Custom legend item styling
- Advanced legend layouts
- Legend filtering and grouping
- Dynamic legend updates
- Export legend as image

**Dependencies:**

- `geoview-core`: ^2.0.0
- `react`: ^18.3.1
- `zustand`: ~5.0.0

#### Installation

**Via Configuration:**

```json
{
  "plugins": ["custom-legend"]
}
```

#### Configuration Example

```json
{
  "plugins": ["custom-legend"],
  "custom-legend": {
    "legendId": "myLegend",
    "title": { "en": "Custom Legend", "fr": "Légende personnalisée" },
    "layout": "vertical",
    "style": {
      "fontSize": "14px",
      "fontFamily": "Arial",
      "backgroundColor": "#ffffff"
    },
    "items": [
      {
        "label": { "en": "Category 1", "fr": "Catégorie 1" },
        "symbol": {
          "type": "circle",
          "color": "#ff0000",
          "size": 10
        }
      }
    ]
  }
}
```

---

## Plugin Development

### Creating a Custom Plugin

To create a custom GeoView plugin:

1. **Create Package Structure:**

```bash
packages/
└── geoview-my-plugin/
    ├── package.json
    ├── tsconfig.json
    ├── README.md
    ├── src/
    │   ├── index.tsx
    │   ├── my-plugin-panel.tsx
    │   └── my-plugin-event-processor.ts
    └── default-config-my-plugin.json
```

2. **package.json:**

```json
{
  "name": "geoview-my-plugin",
  "version": "1.0.0",
  "description": "My custom GeoView plugin",
  "main": "src/index.tsx",
  "peerDependencies": {
    "geoview-core": "workspace:^2.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "~5.0.0"
  },
  "devDependencies": {
    "geoview-core": "workspace:^2.0.0",
    "typescript": "^5.6.3"
  }
}
```

3. **Create Event Processor:**

```typescript
// my-plugin-event-processor.ts
import { AbstractEventProcessor } from "@/api/event-processors/abstract-event-processor";
import type { GeoviewStoreType } from "@/core/stores/geoview-store";

export class MyPluginEventProcessor extends AbstractEventProcessor {
  protected static getMyPluginState(mapId: string) {
    return super.getState(mapId).myPluginState;
  }

  static doSomething(mapId: string, value: string): void {
    this.getMyPluginState(mapId).setterActions.setSomething(value);
  }
}
```

4. **Create UI Component:**

```typescript
// my-plugin-panel.tsx
import { useEffect } from "react";
import { useGeoViewMapId } from "geoview-core";

export function MyPluginPanel() {
  const mapId = useGeoViewMapId();

  useEffect(() => {
    console.log("Plugin initialized for map:", mapId);
  }, [mapId]);

  return (
    <div className="my-plugin-panel">
      <h2>My Plugin</h2>
      {/* Plugin UI */}
    </div>
  );
}
```

5. **Export Plugin:**

```typescript
// index.tsx
export { MyPluginPanel } from "./my-plugin-panel";
export { MyPluginEventProcessor } from "./my-plugin-event-processor";
```

6. **Register with GeoView:**

In your main application:

```typescript
import { MyPluginPanel } from "geoview-my-plugin";

cgpv.api.plugin.register({
  pluginId: "my-plugin",
  component: MyPluginPanel,
  configSchema: myPluginSchema,
});
```

### Plugin Best Practices

1. **Use Event Processors:** All state management should go through event processors
2. **Type Safety:** Leverage TypeScript for all interfaces and types
3. **Accessibility:** Ensure plugin UI is accessible (WCAG 2.1 AA)
4. **Internationalization:** Support both English and French
5. **Error Handling:** Gracefully handle errors and provide user feedback
6. **Documentation:** Document all public APIs and configuration options
7. **Testing:** Write unit tests for event processors and integration tests for UI

---

## Package Management

### Building Packages

```bash
# Build all packages
rush build

# Build specific package
cd packages/geoview-time-slider
npm run build
```

### Installing Dependencies

```bash
# Install all dependencies
rush install

# Update dependencies
rush update
```

### Adding Dependencies

```bash
# Add to specific package
cd packages/geoview-my-plugin
rush add -p lodash --caret
```

---

## See Also

- [Event Processors](./event-processors.md) - State management for plugins
- [Configuration Reference](./configuration-reference.md) - Plugin configuration options
- [API Reference](./api.md) - Core API methods
- [State Management](./state-management.md) - Zustand store architecture
