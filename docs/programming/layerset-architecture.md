# Layer Set Architecture

> **?? Audience:** Core GeoView developers
>
> **For API Users:** See [Layer Sets Guide](app/layers/layersets.md) for using Layer Sets in your applications

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
/**
 * Overrides the behavior to apply when an all-feature-info-layer-set wants to check for condition to register a layer in its set.
 * @param {AbstractBaseLayer} layer - The layer
 * @param {string} layerPath - The layer path
 * @returns {boolean} True when the layer should be registered to this legends-layer-set
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
protected override onRegisterLayerCheck(layer: AbstractBaseLayer): boolean {
  // Always register layers for the legends-layer-set, because we want 'the box' in the UI to show the layer status progression
  return true;
}
```

**Key Features:**

- Tracks parent-child relationships via `children` array
- Maintains legend items with icons and labels
- Updates on style changes
- Used by Legend Panel and layer list UI components

**Event Flow:**

1. Layer config added ? Register in resultSet
2. Layer created ? Update layerStatus to 'processing'
3. Style loaded ? Populate items, set status to 'processed'
4. Style changed ? Update items, emit update event

---

### FeatureInfoLayerSet

**Purpose:** Query and manage features at specific map locations.

**Store Connection:** `featureInfoLayerSet` slice in LayerEventProcessor

**Registration Condition:**

```typescript
/**
 * Overrides the behavior to apply when a feature-info-layer-set wants to check for condition to register a layer in its set.
 * @param {AbstractBaseLayer} layer - The layer
 * @returns {boolean} True when the layer should be registered to this feature-info-layer-set.
 */
protected override onRegisterLayerCheck(layer: AbstractBaseLayer): boolean {
  // Return if the layer is of queryable type and source is queryable
  return super.onRegisterLayerCheck(layer) && AbstractLayerSet.isQueryableType(layer) && AbstractLayerSet.isSourceQueryable(layer);
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
/**
 * Overrides the behavior to apply when a feature-info-layer-set wants to check for condition to register a layer in its set.
 * @param {AbstractBaseLayer} layer - The layer
 * @returns {boolean} True when the layer should be registered to this all-feature-info-layer-set.
 */
protected override onRegisterLayerCheck(layer: AbstractBaseLayer): boolean {
  // Return if the layer is of queryable type and source is queryable
  return (
    super.onRegisterLayerCheck(layer) &&
    AbstractLayerSet.isQueryableType(layer) &&
    !(layer instanceof GVWMS) &&
    AbstractLayerSet.isSourceQueryable(layer)
  );
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
/**
 * Overrides the behavior to apply when a hover-feature-info-layer-set wants to check for condition to register a layer in its set.
 * @param {AbstractBaseLayer} layer - The layer
 * @returns {boolean} True when the layer should be registered to this hover-feature-info-layer-set.
 */
protected override onRegisterLayerCheck(layer: AbstractBaseLayer): boolean {
  // Return if the layer is of queryable type and source is queryable
  return (
    super.onRegisterLayerCheck(layer) &&
    AbstractLayerSet.isQueryableType(layer) &&
    !(layer instanceof GVWMS) &&
    AbstractLayerSet.isSourceQueryable(layer)
  );
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

Each Layer Set implements `onPropagateToStore()` to update the Zustand store (i.e. FeatureInfoLayerSet):

```typescript
  /**
   * Propagates the resultSetEntry to the store
   * @param {TypeFeatureInfoResultSetEntry} resultSetEntry - The result set entry to propagate to the store
   * @private
   */
  #propagateToStore(resultSetEntry: TypeFeatureInfoResultSetEntry, eventType: EventType = 'click'): void {
    // Propagate
    FeatureInfoEventProcessor.propagateFeatureInfoToStore(this.getMapId(), eventType, resultSetEntry).catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('FeatureInfoEventProcessor.propagateToStore in FeatureInfoLayerSet', error);
    });
  }
```

### Store Structure

Store slices mirror Layer Set resultSets:

```typescript
// In Layer State store slice
export interface ILayerState {
  highlightedLayer: string;
  selectedLayer: TypeLegendLayer;
  selectedLayerPath: string | undefined | null;
  legendLayers: TypeLegendLayer[];
  displayState: TypeLayersViewDisplayState;
  layerDeleteInProgress: string;
  selectedLayerSortingArrowId: string;
  layersAreLoading: boolean;
  setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;

  actions: {
   ...
  };

  setterActions: {
    ...
  };
}

```

### React Integration

React components subscribe to store slices:

```typescript
function LegendPanel() {
  const layersList = useLayerLegendLayers();
  return (
    <div>
      {Object.values(layersList).map((entry) => (
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
  ?
MapViewer.onMapSingleClick event
  ?
FeatureInfoLayerSet.queryLayers(location)
  ?
For each registered layer:
  ?
  Layer.queryAtCoordinate(location)
    ?
    OGC GetFeatureInfo / WFS GetFeature / Vector query
    ?
  Parse response ? TypeFeatureInfoEntry[]
  ?
Update resultSet[layerPath].featureInfo
  ?
Propagate to store
  ?
React components re-render with new features
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
  myCustomData: MyCustomType;
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
logger.logDebug(legendsLayerSet.resultSet);

// Check specific layer
logger.logDebug(legendsLayerSet.resultSet["myLayer"]);

// Listen to updates
legendsLayerSet.onLayerSetUpdated((sender, payload) => {
  logger.logDebug("Updated:", payload);
});
```

## See Also

**For API Users:**

- [Layer Sets Guide](app/layers/layersets.md) - Using Layer Sets in applications

**For Core Developers:**

- [Event Processor Architecture](programming/event-processor-architecture.md) - Store and event system
- [Adding Layer Types](programming/adding-layer-types.md) - Layer implementation details and adding new layer types
