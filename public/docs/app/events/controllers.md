# Controllers API

> **👥 Audience:** API users building applications with GeoView
>
> **For Core Developers:** See [Controller Architecture](programming/controller-architecture.md) for implementation details

Controllers are the single source of truth for business logic in GeoView. They manage state, validation, and side effects for maps, layers, UI, and plugin functionality. Each `MapViewer` instance has its own controller registry.

## Quick Start

```typescript
// Get the map viewer
const mapViewer = cgpv.api.getMapViewer("mapId");

// Use MapViewer methods (delegates to controllers internally)
mapViewer.setMapZoomLevel(10);
mapViewer.setProjection(3978);

// Use layer API for layer operations
mapViewer.layer.setOrToggleLayerVisibility("layerPath", true);
mapViewer.layer.setLayerOpacity("layerPath", 0.7);
```

## Core Concepts

### Actions vs Events

GeoView separates **performing actions** from **listening to events**:

| Purpose                                 | Use This                | Example                            |
| --------------------------------------- | ----------------------- | ---------------------------------- |
| **Perform an action** (change state)    | MapViewer / Layer API   | `mapViewer.setMapZoomLevel(10)`    |
| **Listen to events** (react to changes) | Delegate event handlers | `mapViewer.onMapMoveEnd(callback)` |

### When to Use Controllers

Controllers are accessed indirectly through the MapViewer and Layer APIs:

- Change map view (zoom, center, rotation) → `mapViewer.setMapZoomLevel()`, `mapViewer.setCenter()`
- Modify layer properties → `mapViewer.layer.setLayerOpacity()`, `mapViewer.layer.setOrToggleLayerVisibility()`
- Control UI elements → `mapViewer.uiController` (internal), or via store hooks in React
- Manage plugin state → Access plugins via `mapViewer.plugins` or plugin APIs

### Access Patterns

```typescript
// External API consumers — use MapViewer and Layer API
const mapViewer = cgpv.api.getMapViewer("mapId");
mapViewer.setMapZoomLevel(10);
mapViewer.layer.setLayerOpacity("layerPath", 0.5);

// React components — use controller hooks
import { useMapController } from "@/core/controllers/map-controller";
const mapController = useMapController();
mapController.zoomToExtent(extent);
```

## Controller Reference

### 1. MapController

**Purpose:** Manages map-level state and operations including zoom, center, projection, highlight, and filters.

**Location:** `packages/geoview-core/src/core/controllers/map-controller.ts`

**Key Responsibilities:**

- View settings (zoom, center, projection)
- Feature highlighting and filters
- Map interactions

**Accessed via MapViewer methods:**

```typescript
const mapViewer = cgpv.api.getMapViewer("mapId");

// View operations
mapViewer.setMapZoomLevel(10);
mapViewer.setCenter([-75.6972, 45.4215]);
await mapViewer.setProjection(3978);
await mapViewer.zoomToExtent(extent, { padding: [50, 50, 50, 50] });

// Language and theme
await mapViewer.setLanguage("fr");
mapViewer.setTheme("dark");
```

---

### 2. LayerController

**Purpose:** Manages layer visibility, opacity, settings, and item visibility.

**Location:** `packages/geoview-core/src/core/controllers/layer-controller.ts`

**Accessed via Layer API:**

```typescript
const mapViewer = cgpv.api.getMapViewer("mapId");

// Visibility
mapViewer.layer.setOrToggleLayerVisibility("layerPath", true);
mapViewer.layer.setAllLayersVisibility(false);

// Opacity
mapViewer.layer.setLayerOpacity("layerPath", 0.5);

// Highlighting
mapViewer.layer.highlightLayer("layerPath");
mapViewer.layer.removeHighlightLayer();
```

---

### 3. LayerCreatorController

**Purpose:** Handles layer creation and removal.

**Location:** `packages/geoview-core/src/core/controllers/layer-creator-controller.ts`

**Accessed via Layer API:**

```typescript
const mapViewer = cgpv.api.getMapViewer("mapId");

// Add layers
mapViewer.layer.addGeoviewLayer(config);
await mapViewer.layer.addGeoviewLayerByGeoCoreUUID(uuid);

// Remove layers
mapViewer.layer.removeLayerUsingPath("layerPath");
mapViewer.layer.removeAllGeoviewLayers();
```

---

### 4. LayerSetController

**Purpose:** Manages feature queries and layer set operations.

**Location:** `packages/geoview-core/src/core/controllers/layer-set-controller.ts`

**Accessed via Layer API (layer sets):**

```typescript
const mapViewer = cgpv.api.getMapViewer("mapId");

// Access layer sets for queries
mapViewer.layer.featureInfoLayerSet;
mapViewer.layer.allFeatureInfoLayerSet;
mapViewer.layer.legendsLayerSet;
```

---

### 5. UIController

**Purpose:** Manages UI state including tabs, theme, language, and notifications.

**Location:** `packages/geoview-core/src/core/controllers/ui-controller.ts`

---

### 6. DataTableController

**Purpose:** Manages data table filters.

**Location:** `packages/geoview-core/src/core/controllers/data-table-controller.ts`

---

### 7. TimeSliderController (conditional)

**Purpose:** Manages time slider state and temporal layer filtering. Only available when the time-slider package is loaded.

**Location:** `packages/geoview-core/src/core/controllers/time-slider-controller.ts`

---

### 8. DrawerController (conditional)

**Purpose:** Manages drawing operations including geometry creation, editing, snapping, and styling. Only available when the drawer package is loaded.

**Location:** `packages/geoview-core/src/core/controllers/drawer-controller.ts`

**Key Methods:**

```typescript
// Drawing operations (accessed internally by the drawer plugin)
drawerController.startDrawing("Polygon");
drawerController.stopDrawing();
drawerController.toggleDrawing();

// Editing
drawerController.startEditing();
drawerController.stopEditing();

// History
drawerController.undo();
drawerController.redo();
drawerController.clearDrawings();

// Export
drawerController.downloadDrawings(); // GeoJSON with embedded styles
```

---

### 9. PluginController

**Purpose:** Manages plugin loading, access, and lifecycle.

**Location:** `packages/geoview-core/src/core/controllers/plugin-controller.ts`

## Plugin APIs

For package-specific functionality, access plugins directly through the MapViewer:

### Swiper Plugin

```typescript
const mapViewer = cgpv.api.getMapViewer("mapId");
const swiperPlugin = mapViewer.plugins["swiper"];

if (swiperPlugin) {
  swiperPlugin.activateForLayer("layerPath");
  swiperPlugin.deActivateForLayer("layerPath");
  swiperPlugin.setOrientation("vertical");
}
```

### Geochart Plugin

```typescript
const mapViewer = cgpv.api.getMapViewer("mapId");
const geochartPlugin = mapViewer.plugins["geochart"];

if (geochartPlugin) {
  // Geochart state is managed via Zustand store hooks
  // Configure via corePackagesConfig in map config
}
```

## Best Practices

### 1. Wait for Map Initialization

```typescript
cgpv.onMapInit((mapViewer) => {
  // Map viewer is ready — layers may not be registered yet
  mapViewer.setMapZoomLevel(10);
});

cgpv.onMapReady((mapViewer) => {
  // Map and UI fully loaded
  mapViewer.layer.setOrToggleLayerVisibility("layerPath", true);
});
```

### 2. Handle Errors Gracefully

```typescript
try {
  const mapViewer = cgpv.api.getMapViewer("mapId");
  mapViewer.layer.setLayerOpacity("layerPath", 0.5);
} catch (error) {
  logger.logError("Failed to access map viewer:", error);
}
```

### 3. Use Async Methods When Needed

```typescript
// Wait for map viewer if it might not be ready yet
const mapViewer = await cgpv.api.getMapViewerAsync("mapId");
```

## Common Patterns

### Pattern 1: Conditional Actions Based on State

```typescript
const mapViewer = cgpv.api.getMapViewer("mapId");

// Zoom to location and listen for completion
await mapViewer.zoomToExtent(extent);

// Toggle layer visibility
mapViewer.layer.setOrToggleLayerVisibility("layerPath");
```

### Pattern 2: Coordinating Actions with Events

```typescript
const mapViewer = cgpv.api.getMapViewer("mapId");

// Listen for map move end, then query features
mapViewer.onMapMoveEnd((sender, event) => {
  console.log("Map moved to:", event.lonlat);
});
```

### Pattern 3: Plugin Interaction

```typescript
const mapViewer = cgpv.api.getMapViewer("mapId");

// Check if a plugin is loaded before using it
const swiperPlugin = mapViewer.plugins["swiper"];
if (swiperPlugin) {
  swiperPlugin.activateForLayer("layerPath");
}
```

## See Also

- **[MapViewer API](app/api/map-viewer-api.md)** — MapViewer methods
- **[Layer API](app/api/layer-api.md)** — Layer management methods
- **[API Reference](app/api/api.md)** — Main API entry points
- **[Packages](app/packages/geoview-core-packages.md)** — Package development

---

> **🔧 For Core Developers:** See [Controller Architecture](programming/controller-architecture.md) for implementation details and internal patterns.
