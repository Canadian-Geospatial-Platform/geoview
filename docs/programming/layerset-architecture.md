# Layer Set Architecture

> **👥 Audience:** Core GeoView developers
>
> **For API Users:** See [Layer Sets Guide](../../app/doc-new/layersets.md) for using Layer Sets in your applications

This document describes the internal architecture and implementation details of the Layer Set system in GeoView.

## Overview

Layer Sets are a core architectural pattern in GeoView that manage synchronized collections of layer-specific data. They provide a reactive, event-driven mechanism for tracking legends, feature queries, and layer state across the application.

## Architecture Principles

### 1. Abstract Base Pattern

All Layer Sets extend `AbstractLayerSet`, which provides:

- Registration/deregistration lifecycle management
- Result set synchronization with layer changes
- Event propagation to store
- Query coordination

```typescript
export abstract class AbstractLayerSet {
  protected resultSet: TypeResultSet = {};

  protected abstract onRegisterLayerConfigCheck(
    layerConfig: ConfigBaseClass
  ): boolean;
  protected abstract onPropagateToStore(
    resultSetEntry: TypeResultSetEntry,
    type: PropagationType
  ): void;
  protected abstract onGetDefaultResultSetEntry(
    layerConfig: ConfigBaseClass
  ): TypeResultSetEntry;
}
```

### 2. Result Set Structure

Each Layer Set maintains a `resultSet` object keyed by layer path:

```typescript
type TypeResultSet = {
  [layerPath: string]: TypeResultSetEntry;
};

interface TypeResultSetEntry {
  layerPath: string;
  layerName: string;
  layerStatus: "processing" | "processed" | "error";
  queryStatus?: "init" | "processed" | "error";
  featureInfo?: TypeFeatureInfo;
  items?: TypeLegendItem[];
  children?: string[];
  error?: unknown;
}
```

### 3. Event-Driven Synchronization

Layer Sets use a bi-directional event system:

**Inbound Events:**

- `LAYER_SET.LAYER_REGISTRATION` - New layer added to map
- `LAYER_SET.REQUEST_LAYER_INVENTORY` - Request all current layers
- Layer-specific events (config changes, style updates, etc.)

**Outbound Events:**

- `LAYER_SET.UPDATED` - Layer Set data changed
- Store updates via `onPropagateToStore()`

## Layer Set Implementations

### LegendsLayerSet

**Purpose:** Manages legend/symbology information for UI rendering.

**Store Connection:** `legendsLayerSet` slice in LayerEventProcessor

**Registration Condition:**

```typescript
protected onRegisterLayerConfigCheck(layerConfig: ConfigBaseClass): boolean {
  // Register all layer configs
  return true;
}
```

**Key Features:**

- Tracks parent-child relationships via `children` array
- Maintains legend items with icons and labels
- Updates on style changes
- Used by Legend Panel and layer list UI components

**Event Flow:**

1. Layer config added → Register in resultSet
2. Layer created → Update layerStatus to 'processing'
3. Style loaded → Populate items, set status to 'processed'
4. Style changed → Update items, emit update event

---

### FeatureInfoLayerSet

**Purpose:** Query and manage features at specific map locations.

**Store Connection:** `featureInfoLayerSet` slice in LayerEventProcessor

**Registration Condition:**

```typescript
protected onRegisterLayerConfigCheck(layerConfig: ConfigBaseClass): boolean {
  // Only queryable layers
  return layerConfig.geoviewLayerType !== 'esriDynamic' || layerConfig.layerEntries.length > 0;
}
```

**Query Method:**

```typescript
async queryLayers(location?: TypeLocation, extent?: Extent): Promise<void> {
  // For each registered layer:
  // 1. Call layer.queryAtCoordinate() or queryAtPixel()
  // 2. Update resultSet[layerPath].featureInfo
  // 3. Set queryStatus to 'processed' or 'error'
  // 4. Propagate to store
}
```

**Key Features:**

- Queries features at clicked location
- Supports pixel-based and coordinate-based queries
- Caches last query location
- Used by Details Panel and feature popups

---

### AllFeatureInfoLayerSet

**Purpose:** Query and manage ALL features from layers (no spatial filter).

**Store Connection:** `allFeatureInfoLayerSet` slice in LayerEventProcessor

**Registration Condition:**

```typescript
protected onRegisterLayerConfigCheck(layerConfig: ConfigBaseClass): boolean {
  // Only layers with feature data
  return layerConfig.geoviewLayerType === 'geoJSON' ||
         layerConfig.geoviewLayerType === 'esriFeature' ||
         // ... other vector types
}
```

**Query Method:**

```typescript
async queryLayers(location?: undefined, extent?: Extent): Promise<void> {
  // For each registered layer:
  // 1. Call layer.getAllFeatures() or queryInExtent()
  // 2. Update resultSet[layerPath].featureInfo.features (all features)
  // 3. Set queryStatus to 'processed'
  // 4. Propagate to store
}
```

**Key Features:**

- Queries all features regardless of viewport
- Optionally supports extent-based filtering
- Large result handling (pagination, streaming)
- Used by Data Table, export features, analysis tools

**Performance Considerations:**

- Can return large datasets
- May need pagination or streaming for WFS/large GeoJSON
- Query button disabling to prevent concurrent queries

---

### HoverFeatureInfoLayerSet

**Purpose:** Query features under mouse cursor for hover tooltips.

**Store Connection:** `hoverFeatureInfoLayerSet` slice in LayerEventProcessor

**Registration Condition:**

```typescript
protected onRegisterLayerConfigCheck(layerConfig: ConfigBaseClass): boolean {
  // Only hoverable layers
  return layerConfig.geoviewLayerType !== 'ogcWms'; // Example
}
```

**Query Method:**

```typescript
async queryLayers(location: TypeLocation): Promise<void> {
  // Debounced query at hover location
  // Similar to FeatureInfoLayerSet but optimized for hover
}
```

**Key Features:**

- Optimized for frequent queries (mouse move)
- Internal debouncing to reduce query load
- Clears results when mouse leaves features
- Used for hover tooltips, cursor changes

**Optimization:**

- Query debouncing (100-200ms typical)
- Limit feature count (e.g., first 5 features)
- Cancel in-flight queries on new hover

## Layer Set Lifecycle

### 1. Creation

Layer Sets are instantiated when LayerApi is created:

```typescript
// In LayerApi constructor
this.legendsLayerSet = new LegendsLayerSet(this);
this.featureInfoLayerSet = new FeatureInfoLayerSet(this);
this.allFeatureInfoLayerSet = new AllFeatureInfoLayerSet(this);
this.hoverFeatureInfoLayerSet = new HoverFeatureInfoLayerSet(this);
```

### 2. Layer Registration

When a layer config is added:

```typescript
// AbstractLayerSet
protected registerLayerConfig(layerConfig: ConfigBaseClass): void {
  if (this.onRegisterLayerConfigCheck(layerConfig) && !(layerConfig.layerPath in this.resultSet)) {
    // Create default entry
    this.resultSet[layerConfig.layerPath] = this.onGetDefaultResultSetEntry(layerConfig);

    // Propagate to store
    this.onPropagateToStore(this.resultSet[layerConfig.layerPath], 'config-registration');

    // Emit event
    this.#emitLayerSetUpdated(this.resultSet[layerConfig.layerPath], 'config-registration');
  }
}
```

### 3. Layer Creation

When actual layer is created (OpenLayers layer instantiated):

```typescript
protected registerLayer(layer: AbstractBaseLayer): void {
  const layerPath = layer.getLayerPath();

  if (layerPath in this.resultSet) {
    // Update status
    this.resultSet[layerPath].layerStatus = 'processing';

    // Layer-specific initialization
    this.onRegisterLayer(layer);

    // Propagate
    this.onPropagateToStore(this.resultSet[layerPath], 'layer-registration');
    this.#emitLayerSetUpdated(this.resultSet[layerPath], 'layer-registration');
  }
}
```

### 4. Data Updates

When layer data changes (style loaded, features queried, etc.):

```typescript
protected updateResultSetEntry(layerPath: string, updates: Partial<TypeResultSetEntry>): void {
  if (layerPath in this.resultSet) {
    Object.assign(this.resultSet[layerPath], updates);

    // Propagate
    this.onPropagateToStore(this.resultSet[layerPath], 'resultSet');
    this.#emitLayerSetUpdated(this.resultSet[layerPath], 'resultSet');
  }
}
```

### 5. Layer Removal

When a layer is removed:

```typescript
protected unregisterLayer(layerPath: string): void {
  if (layerPath in this.resultSet) {
    const entry = this.resultSet[layerPath];

    // Clean up
    delete this.resultSet[layerPath];

    // Propagate removal
    this.onPropagateToStore(entry, 'remove');
    this.#emitLayerSetUpdated(entry, 'remove');
  }
}
```

## Store Integration

### Propagation Pattern

Each Layer Set implements `onPropagateToStore()` to update the Zustand store:

```typescript
protected onPropagateToStore(resultSetEntry: TypeResultSetEntry, type: PropagationType): void {
  const { layerPath } = resultSetEntry;

  switch (type) {
    case 'config-registration':
      // Add placeholder to store
      this.#setLegendsLayerSetEntry(layerPath, resultSetEntry);
      break;

    case 'layer-registration':
      // Layer ready, update store with initial data
      this.#setLegendsLayerSetEntry(layerPath, resultSetEntry);
      break;

    case 'resultSet':
      // Data updated, sync to store
      this.#setLegendsLayerSetEntry(layerPath, resultSetEntry);
      break;

    case 'remove':
      // Remove from store
      this.#deleteLegendsLayerSetEntry(layerPath);
      break;
  }
}
```

### Store Structure

Store slices mirror Layer Set resultSets:

```typescript
// In LayerEventProcessor store slice
interface LayerState {
  legendsLayerSet: TypeResultSet;
  featureInfoLayerSet: TypeResultSet;
  allFeatureInfoLayerSet: TypeResultSet;
  hoverFeatureInfoLayerSet: TypeResultSet;
}
```

### React Integration

React components subscribe to store slices:

```typescript
function LegendPanel() {
  const legendsLayerSet = useLayerStoreState((state) => state.legendsLayerSet);

  return (
    <div>
      {Object.values(legendsLayerSet).map((entry) => (
        <LegendLayer key={entry.layerPath} entry={entry} />
      ))}
    </div>
  );
}
```

## Query Coordination

### Feature Info Query Flow

```
User Click
  ↓
MapViewer.onMapSingleClick event
  ↓
FeatureInfoLayerSet.queryLayers(location)
  ↓
For each registered layer:
  ↓
  Layer.queryAtCoordinate(location)
    ↓
    OGC GetFeatureInfo / WFS GetFeature / Vector query
    ↓
  Parse response → TypeFeatureInfoEntry[]
  ↓
Update resultSet[layerPath].featureInfo
  ↓
Propagate to store
  ↓
React components re-render with new features
```

### Concurrent Query Prevention

```typescript
// In AllFeatureInfoLayerSet
private isQuerying = false;

async queryLayers(): Promise<void> {
  if (this.isQuerying) {
    console.warn('Query already in progress');
    return;
  }

  this.isQuerying = true;

  try {
    // Perform queries
    await Promise.all(/* ... */);
  } finally {
    this.isQuerying = false;
  }
}
```

## Event Management

### Layer Set Events

Layer Sets emit events through `EventHelper`:

```typescript
class AbstractLayerSet {
  #layerSetUpdatedEmitter = new EventHelper<LayerSetUpdatedDelegate>();

  onLayerSetUpdated(callback: LayerSetUpdatedDelegate): void {
    this.#layerSetUpdatedEmitter.register(callback);
  }

  offLayerSetUpdated(callback: LayerSetUpdatedDelegate): void {
    this.#layerSetUpdatedEmitter.unregister(callback);
  }

  #emitLayerSetUpdated(
    resultSetEntry: TypeResultSetEntry,
    type: PropagationType
  ): void {
    this.#layerSetUpdatedEmitter.emit({
      resultSetEntry,
      type,
    });
  }
}
```

### Event Types

```typescript
type PropagationType =
  | "config-registration" // Layer config added
  | "layer-registration" // Layer created
  | "resultSet" // Data updated
  | "remove"; // Layer removed

type LayerSetUpdatedDelegate = (
  sender: AbstractLayerSet,
  payload: {
    resultSetEntry: TypeResultSetEntry;
    type: PropagationType;
  }
) => void;
```

## Best Practices for Core Developers

### 1. Extending Layer Sets

When creating a new Layer Set:

```typescript
export class MyCustomLayerSet extends AbstractLayerSet {
  // Registration condition
  protected onRegisterLayerConfigCheck(layerConfig: ConfigBaseClass): boolean {
    // Return true to register this layer type
    return layerConfig.geoviewLayerType === "myCustomType";
  }

  // Default entry structure
  protected onGetDefaultResultSetEntry(
    layerConfig: ConfigBaseClass
  ): TypeResultSetEntry {
    return {
      layerPath: layerConfig.layerPath,
      layerName: layerConfig.geoviewLayerName.en,
      layerStatus: "processing",
      // Custom properties
      myCustomData: null,
    };
  }

  // Store propagation
  protected onPropagateToStore(
    resultSetEntry: TypeResultSetEntry,
    type: PropagationType
  ): void {
    // Update store slice
    this.#setMyCustomLayerSetEntry(resultSetEntry.layerPath, resultSetEntry);
  }
}
```

### 2. Query Implementation

Implement queries with error handling and status updates:

```typescript
async queryLayers(location?: TypeLocation): Promise<void> {
  for (const [layerPath, entry] of Object.entries(this.resultSet)) {
    try {
      // Set querying status
      this.updateResultSetEntry(layerPath, { queryStatus: 'init' });

      // Get layer
      const layer = this.layerApi.getGeoviewLayerIfExists(layerPath);
      if (!layer) continue;

      // Perform query
      const features = await layer.queryAtCoordinate(location);

      // Update result
      this.updateResultSetEntry(layerPath, {
        queryStatus: 'processed',
        featureInfo: {
          queryType: 'at_coordinate',
          features,
          queriedLocation: location
        }
      });
    } catch (error) {
      // Handle error
      this.updateResultSetEntry(layerPath, {
        queryStatus: 'error',
        error
      });
    }
  }
}
```

### 3. Performance Optimization

- **Debounce frequent updates** (e.g., hover queries)
- **Batch store updates** when updating multiple layers
- **Lazy load** large datasets (pagination)
- **Cancel in-flight queries** when outdated

### 4. Type Safety

Use TypeScript strictly:

```typescript
interface MyCustomResultSetEntry extends TypeResultSetEntry {
  myCustomData: MyCustomType | null;
}

export class MyCustomLayerSet extends AbstractLayerSet {
  // Override with specific type
  resultSet: { [layerPath: string]: MyCustomResultSetEntry } = {};
}
```

## Debugging Layer Sets

### Console Inspection

```typescript
// In browser console
const mapViewer = cgpv.api.getMapViewer("mapId");
const legendsLayerSet = mapViewer.layer.legendsLayerSet;

// Inspect result set
console.log(legendsLayerSet.resultSet);

// Check specific layer
console.log(legendsLayerSet.resultSet["myLayer"]);

// Listen to updates
legendsLayerSet.onLayerSetUpdated((sender, payload) => {
  console.log("Updated:", payload);
});
```

### Event Tracing

Enable event tracing in development:

```typescript
class AbstractLayerSet {
  #emitLayerSetUpdated(
    resultSetEntry: TypeResultSetEntry,
    type: PropagationType
  ): void {
    if (process.env.NODE_ENV === "development") {
      console.log(`[LayerSet] ${this.constructor.name} updated:`, {
        layerPath: resultSetEntry.layerPath,
        type,
        entry: resultSetEntry,
      });
    }

    this.#layerSetUpdatedEmitter.emit({ resultSetEntry, type });
  }
}
```

## Testing Layer Sets

### Unit Tests

```typescript
describe("FeatureInfoLayerSet", () => {
  let layerApi: LayerApi;
  let featureInfoLayerSet: FeatureInfoLayerSet;

  beforeEach(() => {
    // Setup
    layerApi = createMockLayerApi();
    featureInfoLayerSet = new FeatureInfoLayerSet(layerApi);
  });

  it("should register queryable layers", () => {
    const config = createMockConfig({ geoviewLayerType: "geoJSON" });
    featureInfoLayerSet.registerLayerConfig(config);

    expect(config.layerPath in featureInfoLayerSet.resultSet).toBe(true);
  });

  it("should query features at location", async () => {
    const location = { lon: -75.6972, lat: 45.4215 };
    await featureInfoLayerSet.queryLayers(location);

    const entry = featureInfoLayerSet.resultSet["testLayer"];
    expect(entry.queryStatus).toBe("processed");
    expect(entry.featureInfo?.queriedLocation).toEqual(location);
  });
});
```

### Integration Tests

```typescript
describe("Layer Set Store Integration", () => {
  it("should sync to store on update", () => {
    const { mapViewer, store } = setupTestMap();
    const legendsLayerSet = mapViewer.layer.legendsLayerSet;

    // Add layer
    mapViewer.layer.addGeoviewLayer(testConfig);

    // Check store
    const storeEntry =
      store.getState().layerState.legendsLayerSet[testConfig.layerPath];
    expect(storeEntry).toBeDefined();
    expect(storeEntry.layerPath).toBe(testConfig.layerPath);
  });
});
```

## See Also

**For API Users:**

- [Layer Sets Guide](../../app/doc-new/layersets.md) - Using Layer Sets in applications

**For Core Developers:**

- [Event Processor Architecture](./event-processor-architecture.md) - Store and event system
- [Layer Architecture](./layer-architecture.md) - Layer implementation details
- [Adding Layer Types](./adding-layer-types.md) - Implementing new layer types
