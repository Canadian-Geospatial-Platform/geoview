# Layer Sets

Layer Sets are a core feature of GeoView that automatically manage and organize layer-specific data across your map. They provide real-time access to legends, feature information, and layer data that updates automatically as layers are added, removed, or queried.

## Overview

A **Layer Set** is a dynamic collection of data organized by layer path. Think of it as a registry that tracks specific types of information (legends, features, etc.) for every layer on your map. Each Layer Set maintains a `resultSet` object where keys are layer paths and values contain layer-specific data.

**Key Characteristics:**

- **Automatic Synchronization:** Layer Sets update automatically when layers are added, removed, or modified
- **Event-Driven:** Emit events when data changes, allowing reactive UI updates
- **Type-Safe:** Full TypeScript support with comprehensive type definitions
- **Purpose-Specific:** Each Layer Set serves a distinct purpose (legends, features, hover info, etc.)

## Accessing Layer Sets

Layer Sets are accessible through the Layer API on `mapViewer.layer`:

```typescript
const mapViewer = cgpv.api.getMapViewer("mapId");

// Access the four built-in layer sets
const legendsLayerSet = mapViewer.layer.legendsLayerSet;
const featureInfoLayerSet = mapViewer.layer.featureInfoLayerSet;
const allFeatureInfoLayerSet = mapViewer.layer.allFeatureInfoLayerSet;
const hoverFeatureInfoLayerSet = mapViewer.layer.hoverFeatureInfoLayerSet;
```

They are also accessible via the `LayerSetController`:

```typescript
const layerSetController = mapViewer.controllers.layerSetController;
// layerSetController.legendsLayerSet, etc.
```

## The `onLayerSetUpdated` Event

All four layer sets inherit the `onLayerSetUpdated` / `offLayerSetUpdated` event from `AbstractLayerSet`. The event payload has this shape:

```typescript
type LayerSetUpdatedEvent = {
  layerPath: string; // The layer path that triggered the update
  resultSet: TypeResultSet; // The entire result set (all layers)
};
```

To get the entry for the updated layer, access `payload.resultSet[payload.layerPath]`:

```typescript
legendsLayerSet.onLayerSetUpdated((sender, payload) => {
  const { layerPath, resultSet } = payload;
  const entry = resultSet[layerPath];
  console.log(`Layer set updated for: ${layerPath}`, entry);
});
```

**Unregistering:**

```typescript
const handleUpdate = (sender, payload) => {
  /* ... */
};

// Register
legendsLayerSet.onLayerSetUpdated(handleUpdate);

// Later, unregister
legendsLayerSet.offLayerSetUpdated(handleUpdate);
```

## The Four Layer Sets

### 1. LegendsLayerSet

Tracks layer status progression and fetches legend/symbology information for all layers. Registers layers automatically (except basemap layers).

**Result Set Entry Structure** (`TypeLegendResultSetEntry`):

```typescript
{
  layerPath: string; // Layer path identifier
  layerStatus: TypeLayerStatus; // Layer lifecycle status
  legendQueryStatus: LegendQueryStatus; // 'init' | 'querying' | 'queried' | 'error'
  data: TypeLegend | undefined; // Legend data when loaded
}
```

Where `TypeLegend` is:

```typescript
{
  type: TypeGeoviewLayerType;                                    // The layer type
  legend: TypeVectorLayerStyles | HTMLCanvasElement | null;       // Legend content
  styleConfig?: TypeLayerStyleConfig;                            // Optional style configuration
}
```

**Basic Usage:**

```typescript
const legendsLayerSet = mapViewer.layer.legendsLayerSet;

// Access legend data for a specific layer
const layerPath = "myLayer/0";
if (layerPath in legendsLayerSet.resultSet) {
  const entry = legendsLayerSet.resultSet[layerPath];

  console.log("Layer status:", entry.layerStatus);
  console.log("Legend query status:", entry.legendQueryStatus);

  if (entry.legendQueryStatus === "queried" && entry.data) {
    console.log("Legend type:", entry.data.type);
    console.log("Legend content:", entry.data.legend);
  }
}
```

**Listening for Legend Updates:**

```typescript
legendsLayerSet.onLayerSetUpdated((sender, payload) => {
  const entry = payload.resultSet[payload.layerPath];

  if (entry.legendQueryStatus === "queried" && entry.data) {
    // Legend is ready — update the UI
    updateLegendUI(entry.data);
  }
});
```

---

### 2. FeatureInfoLayerSet

Manages feature information at specific map locations (typically from map clicks). Registers layers that are queryable.

**Result Set Entry Structure** (`TypeFeatureInfoResultSetEntry`):

```typescript
{
  layerPath: string;                        // Layer path identifier
  queryStatus: TypeQueryStatus;             // 'init' | 'processing' | 'processed' | 'error'
  features?: TypeFeatureInfoEntry[];        // Array of features returned by the query
  featuresHaveGeometry: boolean;            // Whether geometries are loaded
}
```

**Key Methods:**

| Method                          | Description                                                |
| ------------------------------- | ---------------------------------------------------------- |
| `queryLayers(lonLatCoordinate)` | Queries features at a coordinate for all registered layers |
| `repeatLastQuery()`             | Re-runs the last query at the same coordinate              |
| `clearResults(layerPath)`       | Clears results for a specific layer                        |
| `onQueryEnded(callback)`        | Subscribes to query completion events                      |

**Basic Usage:**

```typescript
const featureInfoLayerSet = mapViewer.layer.featureInfoLayerSet;

// Query features at a location
mapViewer.onMapSingleClick((sender, payload) => {
  featureInfoLayerSet.queryLayers(payload.lonlat).then((resultSet) => {
    // Iterate through results
    Object.entries(resultSet).forEach(([layerPath, entry]) => {
      if (entry.queryStatus === "processed" && entry.features?.length) {
        console.log(`Found ${entry.features.length} features at ${layerPath}`);

        // Access feature field info
        entry.features.forEach((feature) => {
          console.log("Field info:", feature.fieldInfo);
        });
      }
    });
  });
});
```

**Using the `onQueryEnded` Event:**

The `FeatureInfoLayerSet` has an additional event specific to when all queries complete:

```typescript
type QueryEndedEvent = {
  coordinate: Coordinate; // The lon/lat that was queried
  resultSet: TypeResultSet; // The complete result set
};

featureInfoLayerSet.onQueryEnded((sender, payload) => {
  console.log("All queries finished at:", payload.coordinate);
  console.log("Results:", payload.resultSet);
});
```

**`TypeFeatureInfoEntry` Structure:**

Each feature in the `features` array has:

```typescript
{
  featureKey: number;
  geoviewLayerType: TypeGeoviewLayerType;
  supportZoomTo: boolean;
  extent: Extent | undefined;
  featureIcon?: string;
  fieldInfo: Partial<Record<string, TypeFieldEntry>>;  // Field name → field entry
  nameField?: string;
  geometry?: Geometry;        // OpenLayers Geometry (when loaded)
}
```

---

### 3. AllFeatureInfoLayerSet

Manages all features for a **single layer at a time** (used by the data table). Unlike `FeatureInfoLayerSet`, this queries **all records** in a layer rather than at a specific coordinate.

> **Important:** The method is `queryLayer(layerPath)` (singular) — it queries one layer, not all layers at once.

**Result Set Entry Structure** (`TypeAllFeatureInfoResultSetEntry`):

```typescript
{
  layerPath: string;                        // Layer path identifier
  queryStatus: TypeQueryStatus;             // 'init' | 'processing' | 'processed' | 'error'
  features?: TypeFeatureInfoEntry[];        // All features in the layer
  isDisabled?: boolean;                     // True while a query is running (prevents concurrent queries)
}
```

**Key Methods:**

| Method                          | Description                             |
| ------------------------------- | --------------------------------------- |
| `queryLayer(layerPath)`         | Queries all features for a single layer |
| `clearLayerFeatures(layerPath)` | Clears stored features for a layer      |

**Basic Usage:**

```typescript
const allFeatureInfoLayerSet = mapViewer.layer.allFeatureInfoLayerSet;

// Query all features for a specific layer
const layerPath = "myLayer/0";
const result = await allFeatureInfoLayerSet.queryLayer(layerPath);

console.log(`Found ${result.results.length} features`);
result.results.forEach((feature) => {
  console.log("Fields:", feature.fieldInfo);
});
```

**Checking the Result Set After Query:**

```typescript
// After the query, the resultSet is also updated
const entry = allFeatureInfoLayerSet.resultSet[layerPath];
if (entry.queryStatus === "processed" && entry.features) {
  console.log(`${entry.features.length} features loaded`);
}
```

**Using via the `LayerSetController`:**

The `LayerSetController` provides convenience methods:

```typescript
const layerSetController = mapViewer.controllers.layerSetController;

// Query all features (delegates to allFeatureInfoLayerSet.queryLayer)
const result = await layerSetController.triggerGetAllFeatureInfo(layerPath);

// Reset/clear features
layerSetController.triggerResetFeatureInfo(layerPath);
```

---

### 4. HoverFeatureInfoLayerSet

Manages feature information for the feature under the mouse cursor. Returns a **single feature** (the topmost one by layer order), not an array.

**Result Set Entry Structure** (`TypeHoverResultSetEntry`):

```typescript
{
  layerPath: string; // Layer path identifier
  queryStatus: TypeQueryStatus; // 'init' | 'processing' | 'processed' | 'error'
  feature: TypeHoverFeatureInfo; // Single hover feature (or undefined/null)
}
```

Where `TypeHoverFeatureInfo` is:

```typescript
{
  layerPath: string;
  geoviewLayerType: TypeGeoviewLayerType;
  featureIcon?: string;
  fieldInfo?: TypeFieldEntry;       // Single field entry for tooltip display
  nameField?: string;               // Field name used as tooltip label
} | undefined | null
```

**Key Methods:**

| Method                    | Description                                                 |
| ------------------------- | ----------------------------------------------------------- |
| `queryLayers(coordinate)` | Queries the topmost hoverable feature at a pixel coordinate |
| `clearResults(layerPath)` | Clears the hover result for a layer                         |

**Basic Usage:**

```typescript
const hoverLayerSet = mapViewer.layer.hoverFeatureInfoLayerSet;

// The hover queries are handled automatically by the LayerSetController
// when the map pointer moves. You can listen for results:
hoverLayerSet.onLayerSetUpdated((sender, payload) => {
  const entry = payload.resultSet[payload.layerPath];

  if (entry.queryStatus === "processed" && entry.feature) {
    console.log("Hovering over:", entry.feature.nameField);
    console.log("Field info:", entry.feature.fieldInfo);
    console.log("Icon:", entry.feature.featureIcon);
  }
});
```

> **Note:** Hover queries are typically managed automatically by the `LayerSetController`, which listens to `onMapPointerMove` and `onMapPointerStop` events internally. You usually only need to subscribe to `onLayerSetUpdated` to react to hover results.

---

## Common Patterns

### Pattern 1: Checking Status Before Accessing Data

Always check `queryStatus` before accessing features:

```typescript
const entry = featureInfoLayerSet.resultSet[layerPath];

if (entry.queryStatus === "processed") {
  // Features are available
  const features = entry.features || [];
  processFeatures(features);
}

if (entry.queryStatus === "error") {
  console.error("Query failed for:", layerPath);
}
```

### Pattern 2: Iterating Safely

Always check for existence before accessing layer set entries:

```typescript
// Check if layer exists in result set
if (layerPath in legendsLayerSet.resultSet) {
  const entry = legendsLayerSet.resultSet[layerPath];
  // Safe to use entry
}

// Iterate all layers
Object.entries(legendsLayerSet.resultSet).forEach(([layerPath, entry]) => {
  if (entry.legendQueryStatus === "queried" && entry.data) {
    console.log(`${layerPath}: legend loaded`);
  }
});
```

### Pattern 3: Filtering Processed Layers

```typescript
// Get only layers with successfully loaded features
const processedLayers = Object.entries(featureInfoLayerSet.resultSet)
  .filter(
    ([_, entry]) => entry.queryStatus === "processed" && entry.features?.length,
  )
  .map(([layerPath, entry]) => ({
    path: layerPath,
    featureCount: entry.features!.length,
  }));

console.log("Layers with features:", processedLayers);
```

### Pattern 4: Using the LayerSetController for Queries

For common operations, the `LayerSetController` provides higher-level methods:

```typescript
const layerSetController = mapViewer.controllers.layerSetController;

// Query features at a coordinate (opens details panel automatically)
const resultSet = await layerSetController.queryAtLonLat([lonlat]);

// Repeat the last query (e.g., after layer visibility change)
const resultSet = await layerSetController.repeatLastQuery();

// Query all features for data table
const result = await layerSetController.triggerGetAllFeatureInfo(layerPath);

// Reset feature info
layerSetController.triggerResetFeatureInfo(layerPath);

// Clear feature info results
layerSetController.clearFeatureInfoLayerResults(layerPath);
```

---

## Registered Layer Paths

You can check which layers are registered in a layer set:

```typescript
// Get all registered layer paths
const registeredPaths = legendsLayerSet.getRegisteredLayerPaths();
console.log("Registered layers:", registeredPaths);

// Check if a specific layer is registered
if (registeredPaths.includes(layerPath)) {
  console.log("Layer is tracked by the legend layer set");
}
```

Not all layers are registered in all layer sets. Each layer set has its own registration criteria:

- **LegendsLayerSet**: All layers except basemaps
- **FeatureInfoLayerSet**: Layers that are queryable
- **AllFeatureInfoLayerSet**: Queryable layers (excluding ESRI Image layers; WMS layers need an associated WFS config)
- **HoverFeatureInfoLayerSet**: Layers that are queryable

---

## Best Practices

### 1. Always Check for Existence

```typescript
// Before accessing result set entries
if (layerPath in featureInfoLayerSet.resultSet) {
  const entry = featureInfoLayerSet.resultSet[layerPath];
  // Safe to use
}
```

### 2. Handle Errors Gracefully

```typescript
const entry = featureInfoLayerSet.resultSet[layerPath];

if (entry.queryStatus === "error") {
  console.error(`Query error for layer: ${layerPath}`);
}
```

### 3. Clean Up Event Listeners

```typescript
// Store references to handlers for cleanup
const handleLegendUpdate = (sender, payload) => {
  updateLegend(payload);
};

// Register
legendsLayerSet.onLayerSetUpdated(handleLegendUpdate);

// Clean up when done
legendsLayerSet.offLayerSetUpdated(handleLegendUpdate);
```

---

## See Also

- [Layer API](app/api/layer-api.md) - Complete Layer API reference
- [Controllers API](app/events/controllers.md) - Controllers for performing actions
- [API Reference](app/api/api.md) - Main GeoView API entry points
- [Layers](app/layers/layers.md) - Layer concepts and configuration

**For Core Developers:**

- [Layer Set Architecture](programming/layerset-architecture.md) - Technical implementation details and internal event system
