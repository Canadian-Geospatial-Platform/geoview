# Layer API Reference

The `LayerApi` class provides comprehensive methods for managing map layers in GeoView. It handles layer creation, removal, configuration, visibility, and interaction with various layer types including WMS, ESRI services, GeoJSON, and more.

## Accessing the Layer API

The Layer API is available through the MapViewer instance:

```typescript
// Get the map viewer
const mapViewer = cgpv.api.getMapViewer("mapId");

// Access the layer API
const layerApi = mapViewer.layer;
```

## Layer Types Supported

- **Vector Layers:** GeoJSON, WFS, OGC Feature, ESRI Feature, CSV, KML, WKB
- **Raster Layers:** WMS, ESRI Dynamic, ESRI Image, XYZ Tiles, Vector Tiles, Image Static
- **Special:** GeoCore, GeoPackage, Shapefile, RCS

---

## Core Layer Management

### Adding Layers

#### addGeoviewLayer()

Adds a layer to the map using a layer configuration object.

```typescript
addGeoviewLayer(
  geoviewLayerConfig: TypeGeoviewLayerConfig,
  abortSignal?: AbortSignal
): GeoViewLayerAddedResult
```

**Parameters:**

- `geoviewLayerConfig` - Layer configuration object (see [Configuration Reference](app/config/configuration-reference.md))
- `abortSignal` - Optional AbortSignal to cancel the layer addition

**Returns:** `GeoViewLayerAddedResult` object containing:

- `layerConfig` - The configuration used
- `layer` - The created GeoView layer instance

**Example:**

```typescript
const result = mapViewer.layer.addGeoviewLayer({
  geoviewLayerId: "myLayer",
  geoviewLayerName: "My WMS Layer",
  geoviewLayerType: "ogcWms",
  metadataAccessPath: "https://example.com/wms",
  listOfLayerEntryConfig: [
    {
      layerId: "layer1",
      layerName: "Layer 1"
    },
  ],
});
```

#### addGeoviewLayerByGeoCoreUUID()

Adds a layer from the GeoCore catalog using its UUID.

```typescript
async addGeoviewLayerByGeoCoreUUID(
  uuid: string,
  layerEntryConfig?: string
): Promise<GeoViewLayerAddedResult | void>
```

**Parameters:**

- `uuid` - The GeoCore layer UUID
- `layerEntryConfig` - Optional layer entry configuration path

**Example:**

```typescript
await mapViewer.layer.addGeoviewLayerByGeoCoreUUID(
  "12345678-1234-1234-1234-123456789012"
);
```

#### loadListOfGeoviewLayer()

Loads multiple layers from the map configuration.

```typescript
async loadListOfGeoviewLayer(
  mapConfigLayerEntries: MapConfigLayerEntry[]
): Promise<void>
```

**Parameters:**

- `mapConfigLayerEntries` - Array of map configuration layer entries

---

### Removing Layers

#### removeLayerUsingPath()

Removes a layer and all its children using its layer path.

```typescript
removeLayerUsingPath(layerPath: string): void
```

**Parameters:**

- `layerPath` - The path of the layer to remove (e.g., 'layerId' or 'layerId/sublayerId')

**Example:**

```typescript
mapViewer.layer.removeLayerUsingPath("myLayer");
```

#### removeAllGeoviewLayers()

Removes all layers from the map.

```typescript
removeAllGeoviewLayers(): void
```

#### removeAllLayersInError()

Removes all layers that have an error status.

```typescript
removeAllLayersInError(): void
```

---

### Reloading Layers

#### reloadLayer()

Reloads a specific layer.

```typescript
reloadLayer(layerPath: string): void
```

**Parameters:**

- `layerPath` - The path of the layer to reload

**Example:**

```typescript
mapViewer.layer.reloadLayer("myLayer");
```

#### reloadGeocoreLayers()

Reloads all GeoCore layers on the map.

```typescript
reloadGeocoreLayers(): void
```

#### refreshLayers()

Refreshes all layers on the map.

```typescript
refreshLayers(): void
```

---

## Layer Information and Access

### Getting Layers

#### getGeoviewLayerIds()

Gets all GeoView layer IDs/UUIDs.

```typescript
getGeoviewLayerIds(): string[]
```

**Returns:** Array of layer IDs

#### getGeoviewLayerPaths()

Gets all GeoView layer paths.

```typescript
getGeoviewLayerPaths(): string[]
```

**Returns:** Array of layer paths

#### getGeoviewLayers()

Gets all GeoView layer instances.

```typescript
getGeoviewLayers(): AbstractBaseLayer[]
```

**Returns:** Array of layer instances

#### getGeoviewLayer()

Gets a specific GeoView layer by path (throws error if not found).

```typescript
getGeoviewLayer(layerPath: string): AbstractBaseLayer
```

**Parameters:**

- `layerPath` - The path of the layer to retrieve

**Returns:** The layer instance

**Throws:** `LayerNotFoundError` if layer doesn't exist

#### getGeoviewLayerIfExists()

Gets a specific GeoView layer by path (returns undefined if not found).

```typescript
getGeoviewLayerIfExists(layerPath: string): AbstractBaseLayer | undefined
```

**Parameters:**

- `layerPath` - The path of the layer to retrieve

**Returns:** The layer instance or undefined

**Example:**

```typescript
const layer = mapViewer.layer.getGeoviewLayerIfExists("myLayer");
if (layer) {
  console.log("Layer found:", layer);
}
```

---

### Layer Configuration

#### getLayerEntryConfig()

Gets the configuration for a specific layer entry (throws error if not found).

```typescript
getLayerEntryConfig(layerPath: string): ConfigBaseClass | undefined
```

**Parameters:**

- `layerPath` - The path of the layer

**Returns:** The layer configuration object

#### getLayerEntryConfigIfExists()

Gets the configuration for a specific layer entry (returns undefined if not found).

```typescript
getLayerEntryConfigIfExists(layerPath: string): ConfigBaseClass | undefined
```

**Parameters:**

- `layerPath` - The path of the layer

**Returns:** The layer configuration object or undefined

#### getLayerEntryConfigs()

Gets all layer entry configurations.

```typescript
getLayerEntryConfigs(): ConfigBaseClass[]
```

**Returns:** Array of layer configuration objects

#### getLayerEntryConfigIds()

Gets all layer entry configuration IDs.

```typescript
getLayerEntryConfigIds(): string[]
```

**Returns:** Array of layer configuration IDs

#### isLayerEntryConfigRegistered()

Checks if a layer entry configuration is registered.

```typescript
isLayerEntryConfigRegistered(layerPath: string): boolean
```

**Parameters:**

- `layerPath` - The path of the layer to check

**Returns:** True if registered, false otherwise

---

### OpenLayers Integration

#### getOLLayer()

Gets the OpenLayers layer instance (throws error if not found).

```typescript
getOLLayer(layerPath: string): BaseLayer
```

**Parameters:**

- `layerPath` - The path of the layer

**Returns:** The OpenLayers layer instance

#### getOLLayerIfExists()

Gets the OpenLayers layer instance (returns undefined if not found).

```typescript
getOLLayerIfExists(layerPath: string): BaseLayer | undefined
```

**Parameters:**

- `layerPath` - The path of the layer

**Returns:** The OpenLayers layer instance or undefined

#### getOLLayerAsync()

Gets the OpenLayers layer instance asynchronously (waits for layer to be created).

```typescript
getOLLayerAsync(
  layerPath: string,
  timeout?: number,
  checkFrequency?: number
): Promise<BaseLayer>
```

**Parameters:**

- `layerPath` - The path of the layer
- `timeout` - Maximum wait time in milliseconds (default: 10000)
- `checkFrequency` - Check interval in milliseconds (default: 100)

**Returns:** Promise resolving to the OpenLayers layer instance

**Example:**

```typescript
const olLayer = await mapViewer.layer.getOLLayerAsync("myLayer", 5000);
```

---

## Layer Display and Interaction

### Visibility

#### setOrToggleLayerVisibility()

Sets or toggles the visibility of a layer.

```typescript
setOrToggleLayerVisibility(
  layerPath: string,
  newValue?: boolean
): boolean
```

**Parameters:**

- `layerPath` - The path of the layer
- `newValue` - Optional visibility value (true/false). If omitted, toggles current state

**Returns:** The new visibility state

**Example:**

```typescript
// Toggle visibility
mapViewer.layer.setOrToggleLayerVisibility("myLayer");

// Set explicit visibility
mapViewer.layer.setOrToggleLayerVisibility("myLayer", true);
```

#### setAllLayersVisibility()

Sets the visibility of all layers.

```typescript
setAllLayersVisibility(newValue: boolean): void
```

**Parameters:**

- `newValue` - The visibility state to apply to all layers

#### setItemVisibility()

Sets the visibility of a specific legend item within a layer.

```typescript
setItemVisibility(
  layerPath: string,
  item: TypeLegendItem,
  visibility: boolean,
  updateLegendLayers?: boolean
): void
```

**Parameters:**

- `layerPath` - The path of the layer
- `item` - The legend item to modify
- `visibility` - The visibility state
- `updateLegendLayers` - Whether to update legend layers (default: true)

---

### Opacity

#### setLayerOpacity()

Sets the opacity of a layer.

```typescript
setLayerOpacity(
  layerPath: string,
  opacity: number,
  emitOpacityChange?: boolean
): void
```

**Parameters:**

- `layerPath` - The path of the layer
- `opacity` - Opacity value (0-1)
- `emitOpacityChange` - Whether to emit opacity change event (default: true)

**Example:**

```typescript
// Set layer to 50% opacity
mapViewer.layer.setLayerOpacity("myLayer", 0.5);
```

---

### Highlighting

#### highlightLayer()

Highlights a layer by reducing opacity of other layers.

```typescript
highlightLayer(layerPath: string): void
```

**Parameters:**

- `layerPath` - The path of the layer to highlight

**Example:**

```typescript
mapViewer.layer.highlightLayer("myLayer");
```

#### removeHighlightLayer()

Removes layer highlighting and restores original opacity.

```typescript
removeHighlightLayer(): void
```

#### removeLayerHighlights()

Removes all highlights from a specific layer.

```typescript
removeLayerHighlights(layerPath: string): void
```

**Parameters:**

- `layerPath` - The path of the layer

---

### Layer Properties

#### setLayerName()

Sets the name of a layer.

```typescript
setLayerName(layerPath: string, name: string): void
```

**Parameters:**

- `layerPath` - The path of the layer
- `name` - The new layer name

**Example:**

```typescript
mapViewer.layer.setLayerName("myLayer", "Updated Layer Name");
```

---

## Layer Data Manipulation

### GeoJSON

#### setGeojsonSource()

Updates the GeoJSON source data for a GeoJSON layer.

```typescript
setGeojsonSource(
  layerPath: string,
  geojson: GeoJSONObject | string
): void
```

**Parameters:**

- `layerPath` - The path of the GeoJSON layer
- `geojson` - GeoJSON object or string

**Throws:** `LayerNotGeoJsonError` if layer is not a GeoJSON layer

**Example:**

```typescript
const geojson = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-75.6972, 45.4215],
      },
      properties: {
        name: "Ottawa",
      },
    },
  ],
};

mapViewer.layer.setGeojsonSource("myGeoJsonLayer", geojson);
```

---

### Feature Fields

#### redefineFeatureFields()

Redefines feature field names or aliases.

```typescript
redefineFeatureFields(
  layerPath: string,
  fieldNames: string[],
  fields: 'alias' | 'name'
): void
```

**Parameters:**

- `layerPath` - The path of the layer
- `fieldNames` - Array of field names/aliases
- `fields` - Whether to redefine 'alias' or 'name'

**Throws:** `LayerDifferingFieldLengths` if array lengths don't match

**Example:**

```typescript
mapViewer.layer.redefineFeatureFields(
  "myLayer",
  ["Population", "Area", "Density"],
  "alias"
);
```

#### replaceFeatureOutfields()

Replaces the outfields configuration for a layer.

```typescript
replaceFeatureOutfields(
  layerPath: string,
  types: TypeOutfieldsType[],
  fieldNames: string[],
  fieldAliases?: string[]
): void
```

**Parameters:**

- `layerPath` - The path of the layer
- `types` - Array of field types (e.g., 'string', 'number', 'date')
- `fieldNames` - Array of field names
- `fieldAliases` - Optional array of field aliases

**Throws:** `LayerDifferingFieldLengths` if array lengths don't match

**Example:**

```typescript
mapViewer.layer.replaceFeatureOutfields(
  "myLayer",
  ["string", "number", "number"],
  ["name", "population", "area"],
  ["Name", "Population", "Area (km�)"]
);
```

---

## Spatial Operations

### Bounds

#### calculateBounds()

Calculates the bounds/extent of a layer.

```typescript
calculateBounds(layerPath: string): Extent | undefined
```

**Parameters:**

- `layerPath` - The path of the layer

**Returns:** The extent as `[minX, minY, maxX, maxY]` or undefined

**Example:**

```typescript
const bounds = mapViewer.layer.calculateBounds("myLayer");
if (bounds) {
  console.log("Layer bounds:", bounds);
  // Zoom to layer bounds
  mapViewer.map.getView().fit(bounds, { padding: [50, 50, 50, 50] });
}
```

#### recalculateBoundsAll()

Recalculates bounds for all layers.

```typescript
recalculateBoundsAll(): void
```

---

## Event Handling

The Layer API provides extensive event handling for layer lifecycle and interactions.

### Layer Configuration Events

#### onLayerConfigAdded()

Registers a callback for when a layer configuration is added.

```typescript
onLayerConfigAdded(callback: LayerBuilderDelegate): void
```

**Callback Signature:**

```typescript
type LayerBuilderDelegate = (
  sender: LayerApi,
  event: LayerBuilderEvent
) => void;

interface LayerBuilderEvent {
  layerConfig: ConfigBaseClass;
  layer: AbstractGeoViewLayer;
}
```

**Example:**

```typescript
mapViewer.layer.onLayerConfigAdded((sender, event) => {
  console.log("Layer config added:", event.layerConfig);
});
```

#### offLayerConfigAdded()

Unregisters a layer configuration added callback.

```typescript
offLayerConfigAdded(callback: LayerBuilderDelegate): void
```

#### onLayerConfigRemoved()

Registers a callback for when a layer configuration is removed.

```typescript
onLayerConfigRemoved(callback: LayerPathDelegate): void
```

**Callback Signature:**

```typescript
type LayerPathDelegate = (sender: LayerApi, event: LayerPathEvent) => void;

interface LayerPathEvent {
  layerPath: string;
}
```

#### offLayerConfigRemoved()

Unregisters a layer configuration removed callback.

```typescript
offLayerConfigRemoved(callback: LayerPathDelegate): void
```

#### onLayerConfigError()

Registers a callback for when a layer configuration error occurs.

```typescript
onLayerConfigError(callback: LayerConfigErrorDelegate): void
```

**Callback Signature:**

```typescript
type LayerConfigErrorDelegate = (
  sender: LayerApi,
  event: LayerConfigErrorEvent
) => void;

interface LayerConfigErrorEvent {
  layerPath: string;
  error: Error;
}
```

#### offLayerConfigError()

Unregisters a layer configuration error callback.

```typescript
offLayerConfigError(callback: LayerConfigErrorDelegate): void
```

---

### Layer Lifecycle Events

#### onLayerCreated()

Registers a callback for when a layer is created.

```typescript
onLayerCreated(callback: LayerDelegate): void
```

**Callback Signature:**

```typescript
type LayerDelegate = (sender: LayerApi, event: LayerEvent) => void;

interface LayerEvent {
  layerPath: string;
  layer: AbstractBaseLayer;
}
```

**Example:**

```typescript
mapViewer.layer.onLayerCreated((sender, event) => {
  console.log("Layer created:", event.layerPath);
});
```

#### offLayerCreated()

Unregisters a layer created callback.

```typescript
offLayerCreated(callback: LayerDelegate): void
```

#### onLayerFirstLoaded()

Registers a callback for when a layer loads for the first time.

```typescript
onLayerFirstLoaded(callback: LayerDelegate): void
```

#### offLayerFirstLoaded()

Unregisters a layer first loaded callback.

```typescript
offLayerFirstLoaded(callback: LayerDelegate): void
```

#### onLayerLoading()

Registers a callback for when a layer starts loading.

```typescript
onLayerLoading(callback: LayerDelegate): void
```

#### offLayerLoading()

Unregisters a layer loading callback.

```typescript
offLayerLoading(callback: LayerDelegate): void
```

#### onLayerLoaded()

Registers a callback for when a layer finishes loading.

```typescript
onLayerLoaded(callback: LayerDelegate): void
```

#### offLayerLoaded()

Unregisters a layer loaded callback.

```typescript
offLayerLoaded(callback: LayerDelegate): void
```

#### onLayerAllLoaded()

Registers a callback for when all configured layers have loaded.

```typescript
onLayerAllLoaded(callback: LayerConfigDelegate): void
```

**Callback Signature:**

```typescript
type LayerConfigDelegate = (sender: LayerApi, event: LayerConfigEvent) => void;

interface LayerConfigEvent {
  layerConfigs: ConfigBaseClass[];
}
```

#### offLayerAllLoaded()

Unregisters an all layers loaded callback.

```typescript
offLayerAllLoaded(callback: LayerConfigDelegate): void
```

#### onLayerError()

Registers a callback for when a layer error occurs.

```typescript
onLayerError(callback: LayerErrorDelegate): void
```

**Callback Signature:**

```typescript
type LayerErrorDelegate = (sender: LayerApi, event: LayerErrorEvent) => void;

interface LayerErrorEvent {
  layerPath: string;
  error: Error;
}
```

**Example:**

```typescript
mapViewer.layer.onLayerError((sender, event) => {
  console.error("Layer error:", event.layerPath, event.error);
});
```

#### offLayerError()

Unregisters a layer error callback.

```typescript
offLayerError(callback: LayerErrorDelegate): void
```

---

### Layer Status Events

#### onLayerStatusChanged()

Registers a callback for when a layer's status changes.

```typescript
onLayerStatusChanged(callback: LayerStatusChangedDelegate): void
```

**Callback Signature:**

```typescript
type LayerStatusChangedDelegate = (
  sender: LayerApi,
  event: LayerStatusChangedEvent
) => void;

interface LayerStatusChangedEvent {
  layerPath: string;
  status: TypeLayerStatus; // 'registered', 'loading', 'loaded', 'error', etc.
}
```

**Example:**

```typescript
mapViewer.layer.onLayerStatusChanged((sender, event) => {
  console.log(`Layer ${event.layerPath} status: ${event.status}`);
});
```

#### offLayerStatusChanged()

Unregisters a layer status changed callback.

```typescript
offLayerStatusChanged(callback: LayerStatusChangedDelegate): void
```

---

### Layer Visibility Events

#### onLayerVisibilityToggled()

Registers a callback for when a layer's visibility is toggled.

```typescript
onLayerVisibilityToggled(callback: LayerVisibilityToggledDelegate): void
```

**Callback Signature:**

```typescript
type LayerVisibilityToggledDelegate = (
  sender: LayerApi,
  event: LayerVisibilityToggledEvent
) => void;

interface LayerVisibilityToggledEvent {
  layerPath: string;
  visible: boolean;
}
```

**Example:**

```typescript
mapViewer.layer.onLayerVisibilityToggled((sender, event) => {
  console.log(`Layer ${event.layerPath} visibility: ${event.visible}`);
});
```

#### offLayerVisibilityToggled()

Unregisters a layer visibility toggled callback.

```typescript
offLayerVisibilityToggled(callback: LayerVisibilityToggledDelegate): void
```

#### onLayerItemVisibilityToggled()

Registers a callback for when a layer item's visibility is toggled.

```typescript
onLayerItemVisibilityToggled(callback: LayerItemVisibilityToggledDelegate): void
```

**Callback Signature:**

```typescript
type LayerItemVisibilityToggledDelegate = (
  sender: LayerApi,
  event: LayerItemVisibilityToggledEvent
) => void;

interface LayerItemVisibilityToggledEvent {
  layerPath: string;
  item: TypeLegendItem;
  visible: boolean;
}
```

#### offLayerItemVisibilityToggled()

Unregisters a layer item visibility toggled callback.

```typescript
offLayerItemVisibilityToggled(callback: LayerItemVisibilityToggledDelegate): void
```

---

## Advanced Features

### Layer Sets

The Layer API maintains several specialized layer sets for different purposes:

#### legendsLayerSet

Manages layer legend information.

```typescript
mapViewer.layer.legendsLayerSet;
```

#### featureInfoLayerSet

Manages feature information from map clicks.

```typescript
mapViewer.layer.featureInfoLayerSet;
```

#### hoverFeatureInfoLayerSet

Manages feature information from hover interactions.

```typescript
mapViewer.layer.hoverFeatureInfoLayerSet;
```

#### allFeatureInfoLayerSet

Manages all feature information (click + hover).

```typescript
mapViewer.layer.allFeatureInfoLayerSet;
```

---

### Geometry API

Access geometry manipulation functions:

```typescript
mapViewer.layer.geometry;
```

See [Geometry API Documentation](./geometry-api.md) for details.

---

### Feature Highlighting

Access feature and bbox highlighting:

```typescript
mapViewer.layer.featureHighlight;
```

**Methods:**

- `highlightFeatures(features, style)` - Highlight specific features
- `clearHighlights()` - Clear all feature highlights

---

## Error Handling

The Layer API can throw various errors:

```typescript
import {
  LayerNotFoundError,
  LayerNotGeoJsonError,
  LayerNotQueryableError,
  LayerWrongTypeError,
  LayerDifferingFieldLengths,
  LayerCreatedTwiceError,
} from "@/core/exceptions/layer-exceptions";

try {
  const layer = mapViewer.layer.getGeoviewLayer("nonexistent");
} catch (error) {
  if (error instanceof LayerNotFoundError) {
    console.error("Layer not found");
  }
}
```

---

## Best Practices

### 1. Check Layer Existence

```typescript
// Use safe methods when unsure if layer exists
const layer = mapViewer.layer.getGeoviewLayerIfExists("myLayer");
if (layer) {
  // Work with layer
}
```

### 2. Wait for Layers to Load

```typescript
mapViewer.layer.onLayerAllLoaded((sender, event) => {
  console.log("All layers loaded");
  // Perform operations that require all layers
});
```

### 3. Handle Layer Errors

```typescript
mapViewer.layer.onLayerError((sender, event) => {
  // Show user-friendly error message
  console.error(`Failed to load layer: ${event.layerPath}`);
});
```

### 4. Clean Up Event Listeners

```typescript
const handleLayerLoaded = (sender, event) => {
  console.log("Layer loaded:", event.layerPath);
};

// Register
mapViewer.layer.onLayerLoaded(handleLayerLoaded);

// Later, clean up
mapViewer.layer.offLayerLoaded(handleLayerLoaded);
```

### 5. Use Async Methods for Dynamic Layers

```typescript
// When adding layers dynamically, wait for them
const result = mapViewer.layer.addGeoviewLayer(config);
const olLayer = await mapViewer.layer.getOLLayerAsync(
  result.layerConfig.layerPath
);
```

---

## Common Use Cases

### Adding a WMS Layer

```typescript
mapViewer.layer.addGeoviewLayer({
  geoviewLayerId: "wmsLayer",
  geoviewLayerName: "WMS Layer",
  geoviewLayerType: "ogcWms",
  metadataAccessPath: "https://example.com/wms",
  listOfLayerEntryConfig: [
    {
      layerId: "layer1",
      layerName: "Layer 1"
    },
  ],
});
```

### Toggling Layer Visibility

```typescript
const button = document.getElementById("toggle-layer");
button.addEventListener("click", () => {
  mapViewer.layer.setOrToggleLayerVisibility("myLayer");
});
```

### Highlighting a Layer on Hover

```typescript
const layerList = document.getElementById("layer-list");
layerList.addEventListener("mouseenter", (e) => {
  const layerPath = e.target.dataset.layerPath;
  mapViewer.layer.highlightLayer(layerPath);
});

layerList.addEventListener("mouseleave", () => {
  mapViewer.layer.removeHighlightLayer();
});
```

### Updating GeoJSON Data

```typescript
// Fetch new data
const response = await fetch("/api/updated-data");
const geojson = await response.json();

// Update layer
mapViewer.layer.setGeojsonSource("myGeoJsonLayer", geojson);
```

---

## Layer Sets

The Layer API provides access to four **Layer Sets** that automatically manage layer-specific data:

- **`legendsLayerSet`** - Legend and symbology information for all layers
- **`featureInfoLayerSet`** - Feature information at specific locations (for map clicks)
- **`allFeatureInfoLayerSet`** - All features from all layers (for data tables, exports)
- **`hoverFeatureInfoLayerSet`** - Feature information under mouse cursor (for tooltips)

**Quick Example:**

```typescript
// Access legend data
const legendsLayerSet = mapViewer.layer.legendsLayerSet;
Object.values(legendsLayerSet.resultSet).forEach((entry) => {
  console.log(`Legend for ${entry.layerName}:`, entry.items);
});

// Query features on click
mapViewer.onMapSingleClick((sender, payload) => {
  mapViewer.layer.featureInfoLayerSet.queryLayers(payload.lnglat).then(() => {
    // Access queried features
    Object.values(mapViewer.layer.featureInfoLayerSet.resultSet).forEach(
      (entry) => {
        console.log(
          `Features in ${entry.layerName}:`,
          entry.featureInfo?.features
        );
      }
    );
  });
});
```

**For complete Layer Sets documentation, examples, and patterns, see:**

? **[Layer Sets Guide](./layersets.md)**

---

## See Also

- **[Layer Sets](./layersets.md)** - Working with layer sets for legends, features, and hover info
- [Event Processors](./event-processors.md) - State management and event handling
- [Configuration Reference](app/config/configuration-reference.md) - Layer configuration options
- [API Reference](./api.md) - Main API entry points
- [Map Viewer API](./map-viewer-api-doc.md) - MapViewer instance methods
