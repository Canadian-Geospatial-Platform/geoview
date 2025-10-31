# Event Processors API

> **?? Audience:** API users building applications with GeoView
>
> **For Core Developers:** See [Event Processor Architecture](programming/event-processor-architecture.md) for implementation details

Event Processors provide static methods to perform actions and manage state in GeoView. Use them to control maps, layers, UI elements, and package functionality.

## Quick Start

```typescript
// Import the event processor you need
import { MapEventProcessor } from "geoview-core";

// Call static methods to perform actions
MapEventProcessor.setView("mapId", [45.4215, -75.6972], 10);
MapEventProcessor.setBasemap("mapId", "transport");

// Get current state
const mapState = MapEventProcessor.getMapState("mapId");
console.log("Current zoom:", mapState.zoom);
```

## Core Concepts

### Actions vs Events

GeoView separates **performing actions** from **listening to events**:

| Purpose                                 | Use This                       | Example                                          |
| --------------------------------------- | ------------------------------ | ------------------------------------------------ |
| **Perform an action** (change state)    | Event Processor static methods | `MapEventProcessor.setView(mapId, center, zoom)` |
| **Listen to events** (react to changes) | MapViewer event handlers       | `mapViewer.onMapMoveEnd(callback)`               |

### When to Use Event Processors

Use Event Processors when you need to:

- ? Change map view (zoom, center, rotation)
- ? Modify layer properties (opacity, visibility)
- ? Control UI elements (open panels, add buttons)
- ? Manage package state (time slider, geochart)
- ? Get current state values

### Import Paths

```typescript
// If using as external application
import { MapEventProcessor, LegendEventProcessor } from "geoview-core";

// If developing within the monorepo
import { MapEventProcessor } from "@/api/event-processors/event-processor-children/map-event-processor";
```

## Event Processor Reference

### 1. MapEventProcessor

**Purpose:** Manages map-level state and operations including view, projections, interactions, and map controls.

**Location:** `packages/geoview-core/src/api/event-processors/event-processor-children/map-event-processor.ts`

**Key Responsibilities:**

- Map initialization and controls
- View settings (zoom, center, rotation)
- Basemap management
- Map interactions (pan, zoom, keyboard controls)
- Overlays and markers
- Scale and projection information

**Common Methods:**

```typescript
// Get map viewer instance
static getMapViewer(mapId: string): MapViewer

// Map initialization
static async initMapControls(mapId: string): Promise<void>

// View operations
static zoomIn(mapId: string): void
static zoomOut(mapId: string): void
static setView(mapId: string, center: Coordinate, zoom: number): void
static setRotation(mapId: string, rotation: number): void

// Basemap
static setBasemap(mapId: string, basemapId: string): void

// Scale and size
static setMapSize(mapId: string, size: Size): void
static setMapScale(mapId: string, scale: TypeScaleInfo): void

// Interactions
static setInteraction(mapId: string, interaction: TypeInteraction): void

// State access
static getMapState(mapId: string): TypeMapState
static getMapViewSettings(mapId: string): TypeMapViewSettings
```

**Usage Example:**

```typescript
import { MapEventProcessor } from "geoview-core";

// Zoom to a location
MapEventProcessor.setView("mapId", [45.4215, -75.6972], 10);

// Change basemap
MapEventProcessor.setBasemap("mapId", "transport");

// Get current map state
const mapState = MapEventProcessor.getMapState("mapId");
console.log("Current zoom:", mapState.zoom);
```

---

### 2. LegendEventProcessor

**Purpose:** Manages legend layers, their state, and layer panel interactions.

**Location:** `packages/geoview-core/src/api/event-processors/event-processor-children/legend-event-processor.ts`

**Key Responsibilities:**

- Legend layer management
- Layer visibility and opacity
- Layer selection and highlighting
- Layer bounds calculation
- Layer filtering

**Common Methods:**

```typescript
// Layer selection
static setSelectedLayersTabLayer(mapId: string, layerPath: string): void

// Reorder layers
static reorderLegendLayers(mapId: string): void

// Get legend info
static getLegendLayerInfo(mapId: string, layerPath: string): TypeLegendLayer | undefined
static getLegendLayers(mapId: string): TypeLegendLayer[]

// Layer bounds
static getLayerBounds(mapId: string, layerPath: string): Extent | undefined

// Layer filters
static getLayerEntryConfigDefaultFilter(mapId: string, layerPath: string): string | undefined

// Panel state
static getLayerPanelState(
  mapId: string,
  state: 'highlightedLayer' | 'selectedLayerPath' | 'displayState' | 'layerDeleteInProgress'
): string | boolean | null | undefined
```

**Usage Example:**

```typescript
import { LegendEventProcessor } from "@/api/event-processors/event-processor-children/legend-event-processor";

// Get all legend layers
const layers = LegendEventProcessor.getLegendLayers("mapId");

// Select a layer
LegendEventProcessor.setSelectedLayersTabLayer("mapId", "layerPath");

// Get layer bounds
const bounds = LegendEventProcessor.getLayerBounds("mapId", "layerPath");
```

---

### 3. TimeSliderEventProcessor

**Purpose:** Manages time-enabled layers and temporal filtering.

**Location:** `packages/geoview-core/src/api/event-processors/event-processor-children/time-slider-event-processor.ts`

**Key Responsibilities:**

- Time slider initialization
- Temporal layer management
- Time filtering
- Time dimension handling

**Common Methods:**

```typescript
// Initialization check
static isTimeSliderInitialized(mapId: string): boolean

// Layer management
static getTimeSliderLayers(mapId: string): TimeSliderLayerSet
static getTimeSliderSelectedLayer(mapId: string): string

// Filters
static getTimeSliderFilters(mapId: string): Record<string, string>

// Time values
static getTimeSliderValues(mapId: string): TypeTimeSliderValues
```

**Usage Example:**

```typescript
import { TimeSliderEventProcessor } from "@/api/event-processors/event-processor-children/time-slider-event-processor";

// Check if time slider is available
if (TimeSliderEventProcessor.isTimeSliderInitialized("mapId")) {
  // Get time-enabled layers
  const timeLayers = TimeSliderEventProcessor.getTimeSliderLayers("mapId");

  // Get active filters
  const filters = TimeSliderEventProcessor.getTimeSliderFilters("mapId");
}
```

---

### 4. AppEventProcessor

**Purpose:** Manages application-level settings like language, theme, and notifications.

**Location:** `packages/geoview-core/src/api/event-processors/event-processor-children/app-event-processor.ts`

**Key Responsibilities:**

- Display language management
- Theme management
- Notification/snackbar messages
- Crosshairs and guides
- Feature visibility settings

**Common Methods:**

```typescript
// Language and theme
static getDisplayLanguage(mapId: string): TypeDisplayLanguage
static getDisplayTheme(mapId: string): TypeDisplayTheme

// HTML element access
static getGeoviewHTMLElement(mapId: string): HTMLElement

// Feature settings
static getShowUnsymbolizedFeatures(mapId: string): boolean

// Notifications
static addMessage(
  mapId: string,
  type: 'info' | 'success' | 'warning' | 'error',
  messageKey: string,
  param?: string[],
  notification?: boolean
): void

// Guides and crosshairs
static setCrosshairsActive(mapId: string, active: boolean): void
static setAppBarGuide(mapId: string, guide: NotificationDetailsType): void
```

**Usage Example:**

```typescript
import { AppEventProcessor } from "@/api/event-processors/event-processor-children/app-event-processor";

// Get current language
const lang = AppEventProcessor.getDisplayLanguage("mapId");

// Show a notification
AppEventProcessor.addMessage(
  "mapId",
  "success",
  "layers.layerAdded",
  ["Layer Name"],
  true
);

// Enable crosshairs
AppEventProcessor.setCrosshairsActive("mapId", true);
```

---

### 5. UIEventProcessor

**Purpose:** Manages UI component states like panels, modals, and footerbar tabs.

**Location:** `packages/geoview-core/src/api/event-processors/event-processor-children/ui-event-processor.ts`

**Key Responsibilities:**

- Panel open/close states
- Modal management
- Footer bar tab management
- App bar management

**Common Methods:**

```typescript
// Panel management
static openPanel(mapId: string, panelId: string): void
static closePanel(mapId: string, panelId: string): void
static togglePanel(mapId: string, panelId: string): void

// Modal management
static openModal(mapId: string, modalId: string): void
static closeModal(mapId: string, modalId: string): void

// Footer bar tabs
static addFooterBarTab(mapId: string, tabId: string, config: TypeValidFooterBarTabsCoreProps): void
static removeFooterBarTab(mapId: string, tabId: string): void
static setActiveFooterBarTab(mapId: string, tabId: string): void

// App bar
static addAppBarButton(mapId: string, buttonId: string, config: TypeValidAppBarCoreProps): void
static removeAppBarButton(mapId: string, buttonId: string): void
```

**Usage Example:**

```typescript
import { UIEventProcessor } from "geoview-core";

// Open a panel
UIEventProcessor.openPanel("mapId", "legend");

// Add a footer bar tab
UIEventProcessor.addFooterBarTab("mapId", "custom-tab", {
  label: "My Tab",
  icon: "<i>??</i>",
  content: "<div>Tab content</div>",
});

// Set active tab
UIEventProcessor.setActiveFooterBarTab("mapId", "custom-tab");
```

---

### 6. FeatureInfoEventProcessor

**Purpose:** Manages feature information from map clicks and hover interactions.

**Location:** `packages/geoview-core/src/api/event-processors/event-processor-children/feature-info-event-processor.ts`

**Key Responsibilities:**

- Feature click information
- Hover feature information
- Feature info propagation
- Feature highlight management

**Common Methods:**

```typescript
// Get feature info
static getFeatureInfo(mapId: string): TypeFeatureInfoEntry[]
static getHoverFeatureInfo(mapId: string): TypeHoverFeatureInfo

// Batch propagation
static propagateFeatureInfoToStore(mapId: string, layerPath: string, entries: TypeFeatureInfoEntry[]): void
static propagateHoverFeatureInfoToStore(mapId: string, entries: TypeHoverFeatureInfo): void
```

**Usage Example:**

```typescript
import { FeatureInfoEventProcessor } from "geoview-core";

// Get current feature info
const featureInfo = FeatureInfoEventProcessor.getFeatureInfo("mapId");

// Get hover info
const hoverInfo = FeatureInfoEventProcessor.getHoverFeatureInfo("mapId");
```

---

### 7. DataTableEventProcessor

**Purpose:** Manages data table state for displaying feature attributes.

**Location:** `packages/geoview-core/src/api/event-processors/event-processor-children/data-table-event-processor.ts`

**Key Responsibilities:**

- Data table layer management
- Feature data propagation
- Table state management

**Common Methods:**

```typescript
// Get data table info
static getDataTableLayers(mapId: string): TypeAllFeatureInfoResultSetEntry[]

// Propagate data
static propagateDataTableToStore(mapId: string, layerPath: string, data: TypeAllFeatureInfoResultSetEntry[]): void
```

---

### 8. GeochartEventProcessor

**Purpose:** Manages geochart (charting) functionality for layers.

**Location:** `packages/geoview-core/src/api/event-processors/event-processor-children/geochart-event-processor.ts`

**Key Responsibilities:**

- Chart data management
- Chart configuration
- Chart result set handling

**Common Methods:**

```typescript
// Check initialization
static isGeochartInitialized(mapId: string): boolean

// Get chart info
static getGeochartCharts(mapId: string): TypeGeochartResultSetEntry[]

// Propagate chart data
static propagateGeochartToStore(mapId: string, layerPath: string, data: TypeGeochartResultSetEntry[]): void
```

---

### 9. SwiperEventProcessor

**Purpose:** Manages the swiper package for layer comparison.

**Location:** `packages/geoview-core/src/api/event-processors/event-processor-children/swiper-event-processor.ts`

**Key Responsibilities:**

- Swiper initialization
- Layer comparison management
- Swiper state handling

**Common Methods:**

```typescript
// Check initialization
static isSwiperInitialized(mapId: string): boolean

// Get swiper state
static getSwiperState(mapId: string): ISwiperState
```

---

### 10. DrawerEventProcessor

**Purpose:** Manages the drawer package for geometry drawing and editing.

**Location:** `packages/geoview-core/src/api/event-processors/event-processor-children/drawer-event-processor.ts`

**Key Responsibilities:**

- Drawing tool initialization
- Geometry management
- Draw mode control

**Common Methods:**

```typescript
// Check initialization
static isDrawerInitialized(mapId: string): boolean

// Get drawer state
static getDrawerState(mapId: string): IDrawerState

// Drawing operations
static startDrawing(mapId: string, geometryType: string): void
static stopDrawing(mapId: string): void
```

## Best Practices for Packages Event Processors

### 1. Check Packages Initialization

Package Event Processors may not be initialized if the package isn't loaded:

```typescript
import { TimeSliderEventProcessor } from "geoview-core";

// Always check package initialization
if (TimeSliderEventProcessor.isTimeSliderInitialized("mapId")) {
  const timeLayers = TimeSliderEventProcessor.getTimeSliderLayers("mapId");
} else {
  logger.logWarning("Time Slider package not initialized");
}
```

### 2. Handle Errors Gracefully

```typescript
try {
  const state = MapEventProcessor.getMapState("mapId");
  logger.logInfo("Zoom level:", state.zoom);
} catch (error) {
  logger.logError("Failed to get map state:", error);
}
```

### 3. Use Async Methods When Needed

If the map might not be ready yet, use async methods:

```typescript
// Wait for state to be available
const state = await MapEventProcessor.getStateAsync("mapId");
```

## Common Patterns

### Pattern 1: Conditional Actions Based on State

```typescript
import { MapEventProcessor, LegendEventProcessor } from "geoview-core";

// Check current state before taking action
const mapState = MapEventProcessor.getMapState("mapId");
if (mapState.zoom < 10) {
  MapEventProcessor.zoomIn("mapId");
}

// Toggle layer visibility
const layerInfo = LegendEventProcessor.getLegendLayerInfo(
  "mapId",
  "layer-path"
);
if (layerInfo && layerInfo.visible) {
  MapEventProcessor.setLayerOpacity("mapId", "layer-path", 1);
}
```

### Pattern 2: Coordinating Multiple Actions

```typescript
import { MapEventProcessor, UIEventProcessor } from "geoview-core";

// Zoom to location and open related panel
MapEventProcessor.setView("mapId", [45.4215, -75.6972], 12);
UIEventProcessor.openPanel("mapId", "details");
```

### Pattern 3: Querying Package State

```typescript
import { TimeSliderEventProcessor, GeochartEventProcessor } from "geoview-core";

// Check multiple package states
const hasTimeSlider = TimeSliderEventProcessor.isTimeSliderInitialized("mapId");

if (hasTimeSlider) {
  const timeLayers = TimeSliderEventProcessor.getTimeSliderLayers("mapId");
}
```

## See Also

- **[MapViewer API](app/api/map-viewer-api.md)** - For listening to events
- **[Layer API](app/api/layer-api.md)** - For layer management methods
- **[API Reference](app/api/api.md)** - Main API entry points
- **[Packages](app/packages/geoview-core-packages.md)** - Package development

---

> **?? For Core Developers:** See [Event Processor Architecture](programming/event-processor-architecture.md) for implementation details, creating custom processors, and internal patterns.
