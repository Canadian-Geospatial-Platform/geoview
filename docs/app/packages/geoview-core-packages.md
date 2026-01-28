# Core Packages Reference

This document provides comprehensive API reference and configuration details for all GeoView core packages.

## Table of Contents

1. [geoview-time-slider](#1-geoview-time-slider)
2. [geoview-geochart](#2-geoview-geochart)
3. [geoview-swiper](#3-geoview-swiper)
4. [geoview-drawer](#4-geoview-drawer)
5. [geoview-aoi-panel](#5-geoview-aoi-panel)
6. [geoview-custom-legend](#6-geoview-custom-legend)

---

## 1. geoview-time-slider

**Description:** A time slider package that provides temporal navigation and filtering capabilities for layers with time dimensions (WMS and ESRI Image layers).

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

### Installation

The time slider is typically included in the GeoView build. To use it:

**Via Configuration:**

```json
{
  "footerBar": {
    "tabs": {
      "core": ["time-slider"]
    },
    "selectedTab": "time-slider",
    "selectedTimeSliderLayerPath": "layerPath"
  }
}
```

```json
"corePackagesConfig": [
        {
            "time-slider": {
                "sliders": [
                    {
                      ...
                    }]
            }
        }]
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

### Configuration Example

```json
{
  "map": {
    "listOfGeoviewLayerConfig": [
      {
        "geoviewLayerId": "wmsTimeLayer",
        "geoviewLayerType": "ogcWms",
        "metadataAccessPath": "https://example.com/wms",
        "listOfLayerEntryConfig": [
          {
            "layerId": "temperature",
            "layerName": "Temperature",
            "source": {
              "featureInfo": {
                "queryable": true
              }
            }
          }
        ]
      }
    ]
  },
  "footerBar": {
    "tabs": {
      "core": ["time-slider"]
    },
    "selectedTab": "time-slider"
  },
  "corePackagesConfig": [
    {
      "time-slider": {
        "sliders": [
          {
            "layerPaths": ["wmsTimeLayer/temperature"],
            "timeDimension": {
              "field": "time",
              "default": ["2024-01-01"],
              "range": ["2024-01-01", "2024-12-31"],
              "step": "P1D"
            }
          }
        ]
      }
    }
  ]
}
```

### API Methods

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

**See Also:** [TimeSliderEventProcessor](app/events/event-processors.md#3-timeslidereventprocessor)

---

## 2. geoview-geochart

**Description:** A charting package that visualizes layer data in interactive charts using the geochart library.

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

### Installation

**Via Configuration:**

```json
{
  "footerBar": {
    "tabs": {
      "core": ["geochart"]
    }
  }
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

### Configuration Example

```json
{
  "footerBar": {
    "tabs": {
      "core": ["geochart"]
    },
    "selectedTab": "geochart"
  }
}
```

```json
"corePackagesConfig": [
        {
            "geochart": {
                "charts": [
                    {
                      ...
                    }]
            }
        }]
```

### API Methods

```typescript
import { GeochartEventProcessor } from "@/api/event-processors/event-processor-children/geochart-event-processor";

// Check initialization
const isInitialized = GeochartEventProcessor.isGeochartInitialized("mapId");

// Get all charts
const charts = GeochartEventProcessor.getGeochartCharts("mapId");

// Propagate chart data
GeochartEventProcessor.propagateGeochartToStore("mapId", layerPath, chartData);
```

**See Also:** [GeochartEventProcessor](app/events/event-processors.md#8-geocharteventprocessor)

---

## 3. geoview-swiper

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

### Installation

**Via Configuration:**

```json
{
  "corePackages": ["swiper"]
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

### Configuration Example

```json
{
  "map": {
    "listOfGeoviewLayerConfig": [
      {
        "geoviewLayerId": "layer2020",
        "geoviewLayerName": "2020 Imagery",
        "geoviewLayerType": "xyzTiles",
        "metadataAccessPath": "https://tiles.example.com/2020/{z}/{x}/{y}.png"
      },
      {
        "geoviewLayerId": "layer2024",
        "geoviewLayerName": "2024 Imagery",
        "geoviewLayerType": "xyzTiles",
        "metadataAccessPath": "https://tiles.example.com/2024/{z}/{x}/{y}.png"
      }
    ]
  },
  "corePackage": ["swiper"],
  "corePackagesConfig": [
    {
      "swiper": {
        "orientation": "horizontal",
        "keyboardOffset": 10,
        "layers": ["esriFeatureLYR4/0"]
      }
    }
  ]
}
```

### API Methods

```typescript
import { SwiperEventProcessor } from "@/api/event-processors/event-processor-children/swiper-event-processor";

// Check initialization
const isInitialized = SwiperEventProcessor.isSwiperInitialized("mapId");

// Get swiper state
const swiperState = SwiperEventProcessor.getSwiperState("mapId");
```

**See Also:** [SwiperEventProcessor](app/events/event-processors.md#9-swipereventprocessor)

---

## 4. geoview-drawer

**Description:** A drawing and geometry editing package that allows users to create, modify, and manage geometries on the map.

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

### Installation

**Via Configuration:**

```json
{
  "navBar": ["drawer"]
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

### Configuration Example

```json
{
  "navBar": ["drawer"],
  "corePackagesConfig": [
    {
      "drawer": {
        "style": {
          "fillColor": "rgba(252, 241, 0, 0.3)",
          "strokeColor": "#000000",
          "strokeWidth": 1.3
        },
        "activeGeom": "LineString",
        "geomTypes": [
          "Point",
          "Text",
          "LineString",
          "Polygon",
          "Rectangle",
          "Circle",
          "Star"
        ],
        "hideMeasurements": false
      }
    }
  ]
}
```

### API Methods

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

**See Also:** [DrawerEventProcessor](app/events/event-processors.md#10-drawereventprocessor)

---

## 5. geoview-aoi-panel

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

### Installation

**Via Configuration:**

```json
{
  "appBar": {
    "tabs": {
      "core": ["aoi-panel"]
    }
  }
}
```

### Configuration Example

```json
{
  "appBar": {
    "tabs": {
      "core": ["aoi-panel"]
    }
  },
  "corePackagesConfig": [
    {
      "aoi-panel": {
        "isOpen": true,
        "aoiList": [
          {
            "imageUrl": "https://encrypted-tbn1.gstatic.com/licensed-image?q=tbn:ANd9GcSbleN5tjC2Dilx77SCBJD9f3CxlnDEEGx5qY786BpVlu4JLzUd1ixjIOfO1WX5mJjUQLmSSg4JFuNWgqGZJZDV7LBH8y3QBz3KrjuHdg",
            "aoiTitle": "CN Tower",
            "extent": [-79.3881, 43.6416, -79.3861, 43.6436]
          },
          {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcTCSU8D4pV4fY9MfYa6NZvpcMrCDhxE-ySOSzbxqSCC67_loNeJ9WI-2Ki7zCfU36M0Iwt7-4aw0y3_Vg8t_8sxo86xS6HVewQdYjOOXA",
            "aoiTitle": "Parliament Hill",
            "extent": [-75.7019, 45.4226, -75.6999, 45.4246]
          }
        ],
        "version": "1.0"
      }
    }
  ]
}
```

---

## 6. geoview-custom-legend

**Description:** A customizable legend panel that allows users to create highly customized legend layouts with headers, groups, and standard layer legends organized in a specific order.

**Version:** 2.0.x

**Repository:** `packages/geoview-custom-legend/`

**Features:**

- Custom legend organization with headers and groups
- Collapsible group sections
- Layer legend integration from GeoView core
- Custom text descriptions for headers and groups
- Configurable typography (font size, weight)
- Nested group support
- Layer visibility control

**Dependencies:**

- `geoview-core`: ^2.0.0
- `react`: ^18.3.1
- `zustand`: ~5.0.0

### Installation

**Via Configuration:**

```json
{
  "appBar": {
    "tabs": {
      "core": ["custom-legend"]
    }
  }
}
```

### Configuration Schema

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
  description?: string;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
}

interface TypeGroupLayer {
  type: "group";
  text: string;
  description?: string;
  collapsed?: boolean;
  children: Array<TypeLegendItem>;
}
```

### Configuration Properties

**Root Configuration:**

- **isOpen** (boolean, default: false): Initial panel open state
- **title** (string): Custom title for the legend panel
- **legendList** (array): Ordered list of legend items to display
- **version** (string, default: "1.0"): Schema version

**Legend Item Types:**

1. **TypeLegendLayer** - Display a standard GeoView layer legend:
   - **type** (required): Must be `"layer"`
   - **layerPath** (required): Layer path identifying the layer (e.g., "layerId/sublayerId")

2. **TypeHeaderLayer** - Display a text header for organizing sections:
   - **type** (required): Must be `"header"`
   - **text** (required): Header text to display
   - **description** (optional): Descriptive text displayed below the header
   - **fontSize** (number, range: 8-32, default: 16): Font size in pixels
   - **fontWeight** (string, default: "bold"): Font weight ("normal" or "bold")

3. **TypeGroupLayer** - Display a collapsible group of legend items:
   - **type** (required): Must be `"group"`
   - **text** (required): Group title text
   - **description** (optional): Descriptive text displayed below the group title
   - **collapsed** (boolean, default: false): Initial collapsed state
   - **children** (required): Array of child legend items (minimum 1 item)

### Configuration Examples

**Basic Custom Legend:**

```json
{
  "appBar": {
    "tabs": {
      "core": ["custom-legend"]
    }
  },
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
  "appBar": {
    "tabs": {
      "core": ["custom-legend"]
    }
  },
  "corePackagesConfig": [
    {
      "custom-legend": {
        "isOpen": true,
        "title": "Environmental Data",
        "legendList": [
          {
            "type": "header",
            "text": "Weather Layers",
            "description": "Current weather conditions and forecasts",
            "fontSize": 18,
            "fontWeight": "bold"
          },
          {
            "type": "group",
            "text": "Temperature Data",
            "description": "Temperature forecasts and historical data",
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
  "appBar": {
    "tabs": {
      "core": ["custom-legend"]
    }
  },
  "corePackagesConfig": [
    {
      "custom-legend": {
        "title": "Advanced Legend",
        "legendList": [
          {
            "type": "group",
            "text": "Environmental",
            "collapsed": false,
            "children": [
              {
                "type": "group",
                "text": "Weather",
                "description": "Weather data layers",
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
                "description": "Air quality monitoring",
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

### Usage Notes

- **Layer Paths:** Must reference existing layers in your map configuration
- **Groups:** Can be nested within other groups for hierarchical organization
- **Headers:** Useful for visually separating sections of related layers
- **Descriptions:** Optional text that provides additional context for headers and groups
- **Order:** Legend items appear in the order specified in the `legendList` array

### Common Use Cases

**1. Organizing by Data Type:**

```json
{
  "legendList": [
    {
      "type": "header",
      "text": "Satellite Imagery"
    },
    {
      "type": "layer",
      "layerPath": "satellite/2024"
    },
    {
      "type": "layer",
      "layerPath": "satellite/2020"
    },
    {
      "type": "header",
      "text": "Reference Layers"
    },
    {
      "type": "layer",
      "layerPath": "boundaries/provinces"
    }
  ]
}
```

**2. Thematic Grouping:**

```json
{
  "legendList": [
    {
      "type": "group",
      "text": "Transportation",
      "children": [
        {
          "type": "layer",
          "layerPath": "transport/roads"
        },
        {
          "type": "layer",
          "layerPath": "transport/railways"
        },
        {
          "type": "layer",
          "layerPath": "transport/airports"
        }
      ]
    }
  ]
}
```

**3. Multi-Level Organization:**

```json
{
  "legendList": [
    {
      "type": "group",
      "text": "Base Maps",
      "collapsed": false,
      "children": [
        {
          "type": "group",
          "text": "Topographic",
          "children": [
            {
              "type": "layer",
              "layerPath": "basemap/topo-light"
            },
            {
              "type": "layer",
              "layerPath": "basemap/topo-dark"
            }
          ]
        },
        {
          "type": "group",
          "text": "Satellite",
          "children": [
            {
              "type": "layer",
              "layerPath": "basemap/satellite"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Package Development

### Creating a Custom Package

To create a custom GeoView package:

1. **Create Package Structure:**

```bash
packages/
+-- geoview-my-package/
    +-- package.json
    +-- tsconfig.json
    +-- README.md
    +-- src/
    │   +-- index.tsx
    │   +-- my-package-panel.tsx
    │   +-- my-package-event-processor.ts
    +-- default-config-my-package.json
```

2. **package.json:**

```json
{
  "name": "geoview-my-package",
  "version": "1.0.0",
  "description": "My custom GeoView package",
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
// my-package-event-processor.ts
import { AbstractEventProcessor } from "@/api/event-processors/abstract-event-processor";
import type { GeoviewStoreType } from "@/core/stores/geoview-store";

export class MyPackageEventProcessor extends AbstractEventProcessor {
  protected static getMyPackageState(mapId: string) {
    return super.getState(mapId).myPackageState;
  }

  static doSomething(mapId: string, value: string): void {
    this.getMyPackageState(mapId).setterActions.setSomething(value);
  }
}
```

4. **Create UI Component:**

```typescript
// my-package-panel.tsx
import { useEffect } from "react";
import { useGeoViewMapId } from "geoview-core";

export function MyPackagePanel() {
  const mapId = useGeoViewMapId();

  useEffect(() => {
    console.log("Package initialized for map:", mapId);
  }, [mapId]);

  return (
    <div className="my-package-panel">
      <h2>My Package</h2>
      {/* Package UI */}
    </div>
  );
}
```

5. **Export Package:**

```typescript
// index.tsx
export { MyPackagePanel } from "./my-package-panel";
export { MyPackageEventProcessor } from "./my-package-event-processor";
```

6. **Register with GeoView:**

In your main application:

```typescript
import { MyPackagePanel } from "geoview-my-package";

cgpv.api.package.register({
  packageId: "my-package",
  component: MyPackagePanel,
  configSchema: myPackageSchema,
});
```

### Package Best Practices

1. **Use Event Processors:** All state management should go through event processors
2. **Type Safety:** Leverage TypeScript for all interfaces and types
3. **Accessibility:** Ensure package UI is accessible (WCAG 2.1 AA)
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
cd packages/geoview-my-package
rush add -p lodash --caret
```

---

## See Also

- **[Event Processors](app/events/event-processors.md)** - State management for packages
- **[Configuration Reference](app/config/configuration-reference.md)** - Package configuration options
- **[API Reference](app/api/api.md)** - Core API methods
- **[Core Package Development](./core-packages.md)** - Creating custom packages (detailed guide)
- **[State Management](programming/using-store.md)** - Zustand store architecture
