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

Layer Sets are accessible through the Layer API:

```typescript
const mapViewer = cgpv.api.getMapViewer("mapId");

// Access the four built-in layer sets
const legendsLayerSet = mapViewer.layer.legendsLayerSet;
const featureInfoLayerSet = mapViewer.layer.featureInfoLayerSet;
const allFeatureInfoLayerSet = mapViewer.layer.allFeatureInfoLayerSet;
const hoverFeatureInfoLayerSet = mapViewer.layer.hoverFeatureInfoLayerSet;
```

## The Four Layer Sets

### 1. LegendsLayerSet

Manages legend and symbology information for all layers.

**Common Use Cases:**

- Building custom legend UI components
- Accessing layer symbology and style information
- Displaying legend items with icons and labels
- Tracking layer hierarchy (parent/child relationships)

**Basic Usage:**

```typescript
const legendsLayerSet = mapViewer.layer.legendsLayerSet;

// Access legend data for a specific layer
const layerPath = "myLayer";
if (layerPath in legendsLayerSet.resultSet) {
  const legendEntry = legendsLayerSet.resultSet[layerPath];

  console.log("Layer name:", legendEntry.layerName);
  console.log("Legend items:", legendEntry.items);

  // Iterate through legend items
  legendEntry.items?.forEach((item) => {
    console.log(`${item.label}: ${item.icon}`);
  });
}
```

**Listening for Legend Updates:**

```typescript
legendsLayerSet.onLayerSetUpdated((sender, payload) => {
  const entry = payload.resultSetEntry;
  console.log(`Legend updated for: ${entry.layerName}`);

  if (payload.type === "layer-registration") {
    // Layer is fully registered and legend is ready
    updateLegendUI(entry);
  }
});
```

**Legend Entry Structure:**

```typescript
{
  layerPath: string;              // Layer path identifier
  layerName: string;              // Display name
  layerStatus: 'processing' | 'processed' | 'error';
  items?: TypeLegendItem[];       // Legend symbols and labels
  children?: string[];            // Sublayer paths
  error?: unknown;                // Error if layerStatus is 'error'
}
```

---

### 2. FeatureInfoLayerSet

Manages feature information at specific map locations (typically from map clicks).

**Common Use Cases:**

- Implementing custom feature info panels/popups
- Handling map click interactions
- Displaying feature attributes when users click the map
- Building identify tools

**Basic Usage:**

```typescript
const featureInfoLayerSet = mapViewer.layer.featureInfoLayerSet;

// Query features at a location
mapViewer.onMapSingleClick((sender, payload) => {
  const clickedLocation = payload.lnglat;

  featureInfoLayerSet.queryLayers(clickedLocation).then(() => {
    // Iterate through results
    Object.values(featureInfoLayerSet.resultSet).forEach((entry) => {
      if (entry.featureInfo?.features) {
        console.log(
          `Found ${entry.featureInfo.features.length} features in ${entry.layerName}`
        );

        // Access feature properties
        entry.featureInfo.features.forEach((feature) => {
          console.log("Properties:", feature.properties);
        });
      }
    });
  });
});
```

**Event-Driven Approach:**

```typescript
// Listen for feature info updates
featureInfoLayerSet.onLayerSetUpdated((sender, payload) => {
  const entry = payload.resultSetEntry;

  if (entry.queryStatus === "processed" && entry.featureInfo?.features) {
    // Display features in popup
    displayFeaturePopup(entry.featureInfo);
  }
});

// Trigger query
mapViewer.onMapSingleClick((sender, payload) => {
  featureInfoLayerSet.queryLayers(payload.lnglat);
});
```

**Feature Info Entry Structure:**

```typescript
{
  layerPath: string;
  layerName: string;
  layerStatus: 'processing' | 'processed' | 'error';
  queryStatus: 'init' | 'processed' | 'error';
  featureInfo?: {
    queryType: 'at_pixel' | 'at_coordinate' | 'all' | 'using_a_bounding_box';
    features?: TypeFeatureInfoEntry[];     // Array of features
    queriedLocation?: TypeLocation;        // {lon, lat}
    extent?: Extent;                       // [minX, minY, maxX, maxY]
  };
  error?: unknown;
}
```

---

### 3. AllFeatureInfoLayerSet

Manages all features from all layers, regardless of location.

**Common Use Cases:**

- Building data tables showing all layer features
- Implementing data export functionality (CSV, JSON, etc.)
- Creating feature lists or search interfaces
- Analyzing all data without spatial filters
- Generating reports

**Basic Usage:**

```typescript
const allFeatureInfoLayerSet = mapViewer.layer.allFeatureInfoLayerSet;

// Query all features from all layers
allFeatureInfoLayerSet.queryLayers().then(() => {
  Object.values(allFeatureInfoLayerSet.resultSet).forEach((entry) => {
    if (entry.featureInfo?.features) {
      console.log(
        `${entry.layerName}: ${entry.featureInfo.features.length} features`
      );
    }
  });
});
```

**Example: Building a Data Table:**

```typescript
async function buildDataTable() {
  await allFeatureInfoLayerSet.queryLayers();

  const tableData = [];

  Object.values(allFeatureInfoLayerSet.resultSet).forEach((entry) => {
    if (entry.featureInfo?.features) {
      entry.featureInfo.features.forEach((feature) => {
        tableData.push({
          layer: entry.layerName,
          ...feature.properties,
        });
      });
    }
  });

  // Render table with tableData
  renderTable(tableData);
}
```

---

### 4. HoverFeatureInfoLayerSet

Manages feature information for features under the mouse cursor.

**Common Use Cases:**

- Implementing hover tooltips
- Showing feature previews on mouseover
- Creating interactive highlight effects
- Displaying quick feature info without clicking
- Building dynamic cursors

**Basic Usage:**

```typescript
const hoverLayerSet = mapViewer.layer.hoverFeatureInfoLayerSet;

// Query on mouse move
mapViewer.onMapPointerMove((sender, payload) => {
  hoverLayerSet.queryLayers(payload.lnglat);
});

// Display hover tooltip
hoverLayerSet.onLayerSetUpdated((sender, payload) => {
  const entry = payload.resultSetEntry;

  if (entry.featureInfo?.features?.length > 0) {
    const feature = entry.featureInfo.features[0];
    showTooltip(feature.properties.name, entry.featureInfo.queriedLocation);
  } else {
    hideTooltip();
  }
});
```

**Example: Dynamic Cursor:**

```typescript
hoverFeatureInfoLayerSet.onLayerSetUpdated((sender, payload) => {
  const hasFeatures = Object.values(hoverFeatureInfoLayerSet.resultSet).some(
    (entry) => entry.featureInfo?.features?.length > 0
  );

  // Change cursor when hovering over features
  mapViewer.map.getTargetElement().style.cursor = hasFeatures
    ? "pointer"
    : "default";
});
```

---

## Common Patterns

### Pattern 1: Listening for Updates

All Layer Sets emit update events when their data changes:

```typescript
layerSet.onLayerSetUpdated((sender, payload) => {
  const { resultSetEntry, type } = payload;

  // Event types:
  // - 'config-registration': Layer config added
  // - 'layer-registration': Layer fully registered
  // - 'remove': Layer removed
  // - 'resultSet': Layer data updated (query completed)

  console.log(`${resultSetEntry.layerPath} updated: ${type}`);
  updateUI(resultSetEntry);
});
```

**Unregistering Event Handlers:**

```typescript
const handleUpdate = (sender, payload) => {
  console.log("Updated:", payload.resultSetEntry.layerPath);
};

// Register
legendsLayerSet.onLayerSetUpdated(handleUpdate);

// Later, unregister
legendsLayerSet.offLayerSetUpdated(handleUpdate);
```

### Pattern 2: Checking Status

Always check layer and query status before accessing data:

```typescript
const entry = featureInfoLayerSet.resultSet[layerPath];

// Check layer status
if (entry.layerStatus === "processed") {
  // Layer is ready

  // Check query status (for feature info layer sets)
  if (entry.queryStatus === "processed") {
    // Features are available
    const features = entry.featureInfo?.features || [];
    processFeatures(features);
  }
}

// Handle errors
if (entry.layerStatus === "error") {
  console.error("Layer error:", entry.error);
}

if (entry.queryStatus === "error") {
  console.error("Query error:", entry.error);
}
```

### Pattern 3: Iterating Safely

Always check for existence before accessing layer set entries:

```typescript
// Check if layer exists in result set
if (layerPath in legendsLayerSet.resultSet) {
  const entry = legendsLayerSet.resultSet[layerPath];
  // Safe to use entry
}

// Iterate all layers
Object.entries(legendsLayerSet.resultSet).forEach(([layerPath, entry]) => {
  console.log(`${entry.layerName} (${layerPath})`);

  if (entry.items) {
    entry.items.forEach((item) => {
      console.log(`  - ${item.label}`);
    });
  }
});
```

### Pattern 4: Filtering Results

```typescript
// Get only successfully processed layers
const processedLayers = Object.entries(allFeatureInfoLayerSet.resultSet)
  .filter(
    ([_, entry]) =>
      entry.layerStatus === "processed" && entry.queryStatus === "processed"
  )
  .map(([layerPath, entry]) => ({
    path: layerPath,
    name: entry.layerName,
    featureCount: entry.featureInfo?.features?.length || 0,
  }));

console.log("Processed layers:", processedLayers);
```

---

## Advanced Usage

### Working with Sublayers

Layer Sets track parent-child relationships for complex layers:

```typescript
const parentPath = "parentLayer";
const parentEntry = legendsLayerSet.resultSet[parentPath];

if (parentEntry.children) {
  console.log(
    `${parentEntry.layerName} has ${parentEntry.children.length} sublayers:`
  );

  parentEntry.children.forEach((childPath) => {
    const childEntry = legendsLayerSet.resultSet[childPath];
    console.log(`  - ${childEntry.layerName}`);
  });
}
```

### Async/Await Pattern

```typescript
async function getFeatureInfo(location: TypeLocation) {
  try {
    await featureInfoLayerSet.queryLayers(location);

    const allFeatures = [];
    Object.values(featureInfoLayerSet.resultSet).forEach((entry) => {
      if (entry.featureInfo?.features) {
        allFeatures.push(...entry.featureInfo.features);
      }
    });

    return allFeatures;
  } catch (error) {
    console.error("Failed to query features:", error);
    return [];
  }
}
```

---

## Complete Examples

### Example 1: Feature Info Popup

```typescript
const mapViewer = cgpv.api.getMapViewer("mapId");
const featureInfoLayerSet = mapViewer.layer.featureInfoLayerSet;

// Create popup element
const popup = document.createElement("div");
popup.className = "feature-popup";
popup.style.display = "none";
document.body.appendChild(popup);

// Query features on click
mapViewer.onMapSingleClick((sender, payload) => {
  popup.innerHTML = '<div class="loading">Loading...</div>';
  popup.style.display = "block";

  featureInfoLayerSet.queryLayers(payload.lnglat).then(() => {
    let html = '<div class="popup-content">';
    let featureCount = 0;

    Object.values(featureInfoLayerSet.resultSet).forEach((entry) => {
      if (entry.featureInfo?.features?.length > 0) {
        html += `<h3>${entry.layerName}</h3>`;

        entry.featureInfo.features.forEach((feature) => {
          featureCount++;
          html += '<div class="feature">';

          Object.entries(feature.properties).forEach(([key, value]) => {
            html += `<div><strong>${key}:</strong> ${value}</div>`;
          });

          html += "</div>";
        });
      }
    });

    if (featureCount === 0) {
      html = "<div>No features found</div>";
    }

    html += "</div>";
    popup.innerHTML = html;
  });
});

// Close on outside click
document.addEventListener("click", (e) => {
  if (!popup.contains(e.target as Node)) {
    popup.style.display = "none";
  }
});
```

### Example 2: Hover Tooltip

```typescript
const hoverLayerSet = mapViewer.layer.hoverFeatureInfoLayerSet;

// Create tooltip element
const tooltip = document.createElement("div");
tooltip.className = "map-tooltip";
tooltip.style.display = "none";
document.body.appendChild(tooltip);

let hoverTimeout;

// Query on hover
mapViewer.onMapPointerMove((sender, payload) => {
  clearTimeout(hoverTimeout);

  hoverTimeout = setTimeout(() => {
    hoverLayerSet.queryLayers(payload.lnglat);

    // Position tooltip
    tooltip.style.left = payload.pixel[0] + "px";
    tooltip.style.top = payload.pixel[1] + "px";
  }, 100);
});

// Update tooltip content
hoverLayerSet.onLayerSetUpdated((sender, payload) => {
  const hasFeatures = Object.values(hoverLayerSet.resultSet).some(
    (entry) => entry.featureInfo?.features?.length > 0
  );

  if (hasFeatures) {
    let html = "";

    Object.values(hoverLayerSet.resultSet).forEach((entry) => {
      if (entry.featureInfo?.features?.length > 0) {
        const feature = entry.featureInfo.features[0];
        html += `<strong>${entry.layerName}</strong><br>`;
        html += `${feature.properties.name || "Feature"}<br>`;
      }
    });

    tooltip.innerHTML = html;
    tooltip.style.display = "block";
  } else {
    tooltip.style.display = "none";
  }
});

// Hide tooltip on mouse leave
mapViewer.onMapPointerLeave(() => {
  tooltip.style.display = "none";
});
```

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

if (entry.layerStatus === "error") {
  console.error(`Layer error: ${entry.error}`);
  showErrorMessage(`Failed to load layer: ${entry.layerName}`);
}

if (entry.queryStatus === "error") {
  console.error(`Query error: ${entry.error}`);
  showErrorMessage(`Failed to query features from: ${entry.layerName}`);
}
```

### 3. Debounce Frequent Queries

```typescript
// For hover or frequent updates
let queryTimeout;

function debouncedQuery(location) {
  clearTimeout(queryTimeout);
  queryTimeout = setTimeout(() => {
    hoverFeatureInfoLayerSet.queryLayers(location);
  }, 150); // Adjust delay as needed
}
```

### 4. Clean Up Event Listeners

```typescript
// Store references to handlers
const handlers = {
  legendUpdate: (sender, payload) => updateLegend(payload),
  featureUpdate: (sender, payload) => updateFeatures(payload),
};

// Register
legendsLayerSet.onLayerSetUpdated(handlers.legendUpdate);
featureInfoLayerSet.onLayerSetUpdated(handlers.featureUpdate);

// Clean up when component unmounts
function cleanup() {
  legendsLayerSet.offLayerSetUpdated(handlers.legendUpdate);
  featureInfoLayerSet.offLayerSetUpdated(handlers.featureUpdate);
}
```

### 5. Use TypeScript for Safety

```typescript
import type { TypeResultSetEntry, TypeFeatureInfoEntry } from "geoview-core";

function processFeatures(entry: TypeResultSetEntry) {
  if (entry.queryStatus === "processed" && entry.featureInfo?.features) {
    entry.featureInfo.features.forEach((feature: TypeFeatureInfoEntry) => {
      // TypeScript ensures type safety
      console.log(feature.properties);
    });
  }
}
```

---

## TypeScript Support

Layer Sets are fully typed for TypeScript projects. For complete type definitions, see the [TypeDoc Reference](../../../public/typeDocAPI/).

**Key Types:**

- `TypeResultSet` - The complete resultSet object structure
- `TypeResultSetEntry` - Individual layer entry in a result set
- `TypeFeatureInfoEntry` - Feature information structure
- `TypeLegendItem` - Legend item structure
- `TypeLocation` - Geographic location `{ lon: number, lat: number }`
- `Extent` - Bounding box `[minX, minY, maxX, maxY]`
- `QueryType` - Type of query performed

**Import Types:**

```typescript
import type {
  TypeResultSet,
  TypeResultSetEntry,
  TypeFeatureInfoEntry,
  TypeLegendItem,
  TypeLocation,
} from "geoview-core";
```

---

## See Also

- [Layer API](app/doc-new/layer-api.md) - Complete Layer API reference with all methods
- [Event Processors](app/doc-new/event-processors.md) - State management and event handling patterns
- [API Reference](app/doc-new/api.md) - Main GeoView API entry points
- [TypeDoc Reference](../../../public/typeDocAPI/) - Auto-generated API documentation

**For Core Developers:**

- [Layer Set Architecture](../../programming/layerset-architecture.md) - Technical implementation details and internal event system
