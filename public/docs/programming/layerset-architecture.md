# Layer Set Architecture

> ** Audience:** Core GeoView developers
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

  protected onRegisterLayerConfigCheck(layerConfig: ConfigBaseClass): boolean;
  protected abstract onPropagateToStore(
    resultSetEntry: TypeResultSetEntry,
    type: PropagationType,
  ): void;
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

Layer Sets use an event-driven system to track layer state changes and propagate updates:

**Inbound Events (Layer Sets listen to):**

- `onLayerStatusChanged` - Layer status progression (init → loading → loaded → error)
- `onLayerNameChanged` - Layer name/alias updates
- `onStyleChanged` - Layer style modifications (legends layer set)
- `onStyleApplied` - Vector layer style application (legends layer set)

**Outbound Events (Layer Sets emit):**

- `onLayerSetUpdated` - Emitted when layer set data changes, containing the updated result set entry
- Store propagation via `onPropagateToStore()` - Updates the Zustand store for React components

## Layer Set Implementations

### LegendsLayerSet

**Purpose:** Tracks layer status progression and fetches legend/symbology data for all layers.

**Store Connection:** Propagates to `layer-state` store via `LayerSetController`

**Registration Condition:**

```typescript
/**
 * Overrides the behavior to apply when checking for condition to register a layer in its set.
 *
 * @param layer - The layer
 * @returns True when the layer should be registered to this legends-layer-set
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
protected override onRegisterLayerCheck(layer: AbstractBaseGVLayer): boolean {
  // Always register layers for the legends-layer-set, because we want 'the box' in the UI to show the layer status progression
  return true;
}
```

**Key Features:**

- Registers ALL layers (regardless of type) to track their layer status in the UI
- Queries and fetches legend data when layer reaches 'processed' status or higher
- Tracks `legendQueryStatus` ('init' → 'querying' → 'queried') separate from layer status
- Listens to `onLayerStyleChanged` and `onStyleApplied` events to re-query legends when styles update
- Handles vector layers that need style application before querying legends
- Used by Legend Panel and layer list UI components to display symbology

**Event Flow:**

1. Layer config added → Register in resultSet with `legendQueryStatus: 'init'`
2. Layer created → Track layer status progression (init → loading → loaded → processed)
3. Layer reaches 'processed' status → Query legend via `layer.queryLegend()`
4. Legend query starts → Set `legendQueryStatus: 'querying'`
5. Legend data received → Store legend data, set `legendQueryStatus: 'queried'`, propagate to store
6. Style changes → Re-query legend automatically

#### Legend Data Flow: `styleConfig`, `icons`, and `items`

Every legend entry in the store ([`TypeLegendLayer`](../../packages/geoview-core/src/core/components/layers/types.ts)) carries **three** related-but-distinct fields that the UI uses to decide what to render. Confusing them leads to "empty legends", "icons but no labels", or duplicate WMS-image renders, so this section documents how they are produced and how the UI distinguishes the three legend modes.

##### The three fields

| Field         | Type                                                                                                    | Origin                                                                            | Purpose                                                                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `styleConfig` | [`TypeLayerStyleConfig`](../../packages/geoview-core/src/api/types/map-schema-types.ts) (per geometry)  | Returned by the layer's `getLegend()` (the rendering style — `simple`, `uniqueValue`, `classBreaks`) | Drives **map rendering** AND tells the UI that class-based items are available. Always present for vector / `ESRI_IMAGE` layers when the service exposes a classification.                                                          |
| `icons`       | [`TypeLegendLayerItem[]`](../../packages/geoview-core/src/core/components/layers/types.ts)              | Computed by `GeoUtilities.getLayerIconImage()` from the `TypeLegend` payload      | Per **geometry type** entry containing a primary `iconImage` (data URL or `'no data'`) plus an `iconList` of nested items. Holds the **WMS / WMTS / static-image legend graphic** when the service returns one. |
| `items`       | [`TypeLegendItem[]`](../../packages/geoview-core/src/core/components/layers/types.ts)                   | Flattened by `GeoUtilities.getLayerItemsFromIcons()` from `icons[*].iconList`     | Flat per-class entries (`{ name, icon, isVisible, geometryType }`) used to render the **clickable per-class legend list** under the layer.                                                                    |

The pipeline: `gv-layer.getLegend()` → `TypeLegend { type, styleConfig, legend }` → [`LegendsLayerSet.#propagateToStoreLegendQueryStatus()`](../../packages/geoview-core/src/geo/layer/layer-sets/legends-layer-set.ts) → `GeoUtilities.getLayerIconImage()` + `getLayerItemsFromIcons()` → store fields `styleConfig`, `icons`, `items`.

##### The three legend display modes

The UI ([`legend-layer-container.tsx`](../../packages/geoview-core/src/core/components/legend/legend-layer-container.tsx), [`legend-layer.tsx`](../../packages/geoview-core/src/core/components/legend/legend-layer.tsx), [`layer-details.tsx`](../../packages/geoview-core/src/core/components/layers/right-panel/layer-details.tsx)) uses **two predicates** (`layerHasClassItems`, `layerHasLegendImage` — both in [`types.ts`](../../packages/geoview-core/src/core/components/layers/types.ts)) to pick exactly one of these modes per layer:

| Mode                       | Predicate                                                | Triggered when                                                                                                                                  | UI rendered                                          |
| -------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Class-based items**      | `layerHasClassItems(items, styleConfig, minItems?)`      | `items.length >= minItems` (default `1`) **and** `styleConfig` is set                                                                           | Per-class clickable list (`ItemsList` / `renderItems`) |
| **Service legend image**   | `layerHasLegendImage(schemaTag, items, icons, styleConfig)` | WMS/WMTS only; **no** class items; `icons[0].iconImage` exists **and is not the string `'no data'`**                                            | Single image (`WMSLegendImage` / `renderWMSImage`)   |
| **Nothing**                | Neither predicate matches                                | (no `icons`, no `items`, no `styleConfig`)                                                                                                      | Nothing rendered                                     |

> `layerHasClassItems` takes an optional `minItems` argument. `CollapsibleContent` uses `minItems = 2` so that a layer with a **single** class item collapses (no point in expanding a list of one), while the rest of the UI uses the default `1` to detect any presence of class data.

##### Mode selection — the key insight

The mode chosen depends on **which gv-layer produced the `TypeLegend`** and what its service returned:

- **Vector / ESRI Dynamic / ESRI Image / ESRI WMTS** → `TypeLegend { styleConfig, legend: TypeVectorLayerStyles }` → `GeoUtilities.getLayerIconImage()` walks `styleConfig` and renders each style class to a canvas → multi-item `icons[*].iconList` → flattened to `items` → **Mode 1**.
- **WMS / WMTS / static image / GeoTIFF** → `TypeLegend { legend: HTMLCanvasElement }` (no `styleConfig`) → `getLayerIconImage()` falls back to `iconImage = canvas.toDataURL()` (or `'no data'`) → single icon, **no** `iconList`, no `items` → **Mode 2** (for WMS/WMTS) or rendered via per-layer-type special cases in `getLayerItemsFromIcons()` (for `imageStatic` / `GeoTIFF`).

##### The `'no data'` sentinel

`GeoUtilities.getLayerIconImage()` writes the literal string `'no data'` into `iconImage` when a non-vector legend has no usable canvas. **All consumers that render a `<img>` for the legend must check for and exclude this sentinel** (`layerHasLegendImage` does this). Forgetting the check produces a broken-image icon in the UI and — because React 19 emits a `<link rel="preload" as="image" href="no data">` for every `<img>` it sees — can break downstream consumers like the PDF/PNG export pipeline (`createCanvasMapUrls`) by adding a zero-size element to the rendered HTML.

##### `styleConfig` is the rendering authority — not the legend

`styleConfig` is the **rendering** style. The `icons` and `items` are presentation artifacts derived from it. Two practical consequences:

1. **A vector layer always has a `styleConfig`** even if it has no classes (`simple` style → exactly one item). When you see "no class items", check `styleSettings.type` before assuming the data is missing.
2. **Toggling an `item`'s visibility** must propagate back to `styleConfig.info[*].visible` so the renderer hides the class on the map. The reverse is not true — modifying `styleConfig` does not automatically update `items`; the legend must be re-queried (or the store updated explicitly — see `setStoreLayerItemVisibility`).

##### WMTS-specific quirk

WMTS layers use `gv-wmts.ts#getLegendFromCapabilities()`. It first tries the standard `LegendURL` from the OGC capabilities. If that fails, it falls back to ArcGIS's `/legend?f=json` endpoint when the metadata URL looks like an ArcGIS-backed WMTS (`/MapServer/WMTS` or `/ImageServer/WMTS`). In that fallback, the returned `TypeLegend.type` is set to `ESRI_IMAGE` (not `WMTS`) so it flows through the same vector-style pipeline as ESRI Image / Dynamic. The legend appears as class-based items even though the layer is rendered as WMTS tiles. The store's `schemaTag` remains `WMTS` (from the config), but `legendSchemaTag` reflects what came back from the legend pipeline.

##### Common pitfalls

- **Checking `items.length > 0` without checking `styleConfig`** — yields false positives for layer-state in transition. Use `layerHasClassItems`.
- **Checking `icons.length > 0` to render a WMS image** — yields false positives for `'no data'` icons and for ESRI layers (which also populate `icons` from their style canvases). Use `layerHasLegendImage`.
- **Treating all three fields as independent** — they're produced atomically by `#propagateToStoreLegendQueryStatus`. If you find one populated and the others stale, you have a re-query bug, not a data shape bug.
- **Forgetting that the "Toggle All" checkbox is disabled for WMTS** — WMTS classes come from the legend endpoint and have no map-renderer equivalent (the tiles are pre-baked). `layer-details.tsx` disables visibility toggles when `schemaTag === WMTS`.

---

### FeatureInfoLayerSet

**Purpose:** Query and manage features at specific map locations.

**Store Connection:** Propagates to `feature-info-state` store via `propagateStoreFeatureInfoDetails()`

**Registration Condition:**

```typescript
/**
 * Overrides the behavior to apply when a feature-info-layer-set wants to check for condition to register a layer in its set.
 *
 * @param layer - The layer
 * @returns True when the layer should be registered to this feature-info-layer-set
 */
protected override onRegisterLayerCheck(layer: AbstractBaseGVLayer): boolean {
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

**Visibility and Scale Gating:**

- `AbstractLayerSet.queryLayerFeatures()` short-circuits with empty results when `getVisibleIncludingParents()` is `false`.
- It also short-circuits when the layer is outside visible range using:
  - current view resolution,
  - current map scale from `MapViewer.getMapScaleFromZoom()`,
  - effective scales from `MapViewer.computeEffectiveLayerScales(...)`.
- The visible-range check is performed through `AbstractBaseGVLayer.isInVisibleRange(currentResolution, currentScale, effectiveScales)`.

This keeps feature-query behavior aligned with rendering visibility, including min/max scale constraints and near-threshold tolerance bands.

**Key Features:**

- Queries features at clicked location
- Supports pixel-based and coordinate-based queries
- Caches last query location
- Used by Details Panel and feature popups

---

### AllFeatureInfoLayerSet

**Purpose:** Query and manage ALL features from layers (no spatial filter).

**Store Connection:** Propagates to `feature-info-state` store via `propagateFeatureInfoDataTableToStore()`

**Registration Condition:**

```typescript
/**
 * Overrides the behavior to apply when a feature-info-layer-set wants to check for condition to register a layer in its set.
 *
 * @param layer - The layer
 * @returns True when the layer should be registered to this all-feature-info-layer-set
 */
protected override onRegisterLayerCheck(layer: AbstractBaseGVLayer): boolean {
  // Exclude raster image layers that don't support tabular feature queries
  if (layer instanceof GVEsriImage) return false;

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

**Store Connection:** Propagates to `feature-info-state` store via `setStoreMapHoverFeatureInfo()`

**Registration Condition:**

```typescript
/**
 * Overrides the behavior to apply when a hover-feature-info-layer-set wants to check for condition to register a layer in its set.
 *
 * @param layer - The layer
 * @returns True when the layer should be registered to this hover-feature-info-layer-set
 */
protected override onRegisterLayerCheck(layer: AbstractBaseGVLayer): boolean {
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
    this.resultSet[layerConfig.layerPath] = { layerPath: layerConfig.layerPath, layerStatus: 'processing' };

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
protected registerLayer(layer: AbstractBaseGVLayer): void {
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

Each Layer Set implements `onPropagateToStore()` to update the Zustand store. Each concrete layer set has a private `#propagateToStore()` method that calls the appropriate store propagation function directly:

```typescript
  /**
   * Propagates the resultSetEntry to the store.
   *
   * @param resultSetEntry - The result set entry to propagate to the store
   */
  #propagateToStore(resultSetEntry: TypeFeatureInfoResultSetEntry): void {
    // Propagate
    propagateStoreFeatureInfoDetails(this.getMapId(), resultSetEntry);
  }
```

Propagation functions are exported from the store state files (e.g., `propagateStoreFeatureInfoDetails` from `feature-info-state.ts`, `propagateFeatureInfoDataTableToStore` from the same file) and are called by both layer sets and `LayerSetController`.

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

Layer Sets emit events through `EventHelper` static methods:

```typescript
class AbstractLayerSet {
  /** Callback delegates for the layer set updated event. */
  #onLayerSetUpdatedHandlers: LayerSetUpdatedDelegate[] = [];

  /**
   * Registers a callback to be executed whenever the layer set is updated.
   */
  onLayerSetUpdated(callback: LayerSetUpdatedDelegate): void {
    EventHelper.onEvent(this.#onLayerSetUpdatedHandlers, callback);
  }

  /**
   * Unregisters a callback from being called whenever the layer set is updated.
   */
  offLayerSetUpdated(callback: LayerSetUpdatedDelegate): void {
    EventHelper.offEvent(this.#onLayerSetUpdatedHandlers, callback);
  }

  /**
   * Emits an event to all registered handlers.
   */
  #emitLayerSetUpdated(event: LayerSetUpdatedEvent): void {
    EventHelper.emitEvent(this, this.#onLayerSetUpdatedHandlers, event);
  }

  /**
   * Called to emit layer set updated event with layerPath and resultSet.
   */
  protected onLayerSetUpdatedProcess(layerPath: string): void {
    this.#emitLayerSetUpdated({ layerPath, resultSet: this.resultSet });
  }
}

// Event type definition
type LayerSetUpdatedEvent = {
  layerPath: string;
  resultSet: TypeResultSet;
};
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

  // Store propagation
  protected onPropagateToStore(
    resultSetEntry: TypeResultSetEntry,
    type: PropagationType,
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

- [Using Zustand Store](programming/using-store.md) - Store access patterns and controllers
- [Adding Layer Types](programming/adding-layer-types.md) - Layer implementation details and adding new layer types
