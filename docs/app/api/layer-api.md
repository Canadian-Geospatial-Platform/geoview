# Layer API

> **Full API Reference:** [LayerApi — TypeDoc](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/LayerApi.html)
>
> TypeDoc is auto-generated from source code and always reflects the current method signatures, parameters, return types, and thrown errors.

The `LayerApi` class provides methods for managing map layers in GeoView — adding, removing, querying, styling, and subscribing to layer events.

## Accessing the Layer API

```typescript
const mapViewer = cgpv.api.getMapViewer("mapId");
const layerApi = mapViewer.layer;
```

## Layer Types Supported

- **Vector:** GeoJSON, WFS, OGC Feature, ESRI Feature, CSV, KML, WKB
- **Raster:** WMS, ESRI Dynamic, ESRI Image, XYZ Tiles, Vector Tiles, Image Static
- **Special:** GeoCore, GeoPackage, Shapefile, RCS

---

## Common Usage Patterns

### Adding a Layer

```typescript
const result = mapViewer.layer.addGeoviewLayer({
  geoviewLayerId: "myLayer",
  geoviewLayerName: "My WMS Layer",
  geoviewLayerType: "ogcWms",
  metadataAccessPath: "https://example.com/wms",
  listOfLayerEntryConfig: [{ layerId: "layer1", layerName: "Layer 1" }],
});
```

### Adding a Layer from GeoCore UUID

```typescript
await mapViewer.layer.addGeoviewLayerByGeoCoreUUID(
  "12345678-1234-1234-1234-123456789012",
);
```

### Removing Layers

```typescript
mapViewer.layer.removeLayerUsingPath("myLayer");
mapViewer.layer.removeAllGeoviewLayers();
```

### Retrieving Layers

```typescript
// Safe retrieval (returns undefined if not found)
const layer = mapViewer.layer.getGeoviewLayerIfExists("myLayer");

// Throws if not found
const layer = mapViewer.layer.getGeoviewLayer("myLayer");

// All layers, filtered variants
const all = mapViewer.layer.getGeoviewLayers(); // AbstractBaseGVLayer[]
const regulars = mapViewer.layer.getGeoviewLayersRegulars(); // AbstractGVLayer[] (no groups)
const groups = mapViewer.layer.getGeoviewLayersGroups(); // GVGroupLayer[]
const roots = mapViewer.layer.getGeoviewLayersRoot(); // Root-level only
```

### Visibility

```typescript
// Toggle
mapViewer.layer.setOrToggleLayerVisibility("myLayer");

// Set explicitly
mapViewer.layer.setOrToggleLayerVisibility("myLayer", true);

// All layers
mapViewer.layer.setAllLayersVisibility(false);

// Individual legend items
await mapViewer.layer.setItemVisibility(layerPath, item, true, true);
```

### Opacity

```typescript
mapViewer.layer.setLayerOpacity("myLayer", 0.5);
```

### Highlighting

```typescript
mapViewer.layer.highlightLayer("myLayer");
mapViewer.layer.removeHighlightLayer();
mapViewer.layer.removeLayerHighlights("myLayer");
```

### Layer Properties

```typescript
mapViewer.layer.setLayerName("myLayer", "New Name");
mapViewer.layer.setLayerQueryable("myLayer", true);
mapViewer.layer.setLayerHoverable("myLayer", true);
```

### GeoJSON Source Update

```typescript
await mapViewer.layer.setGeojsonSource("myGeoJsonLayer", {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-75.6972, 45.4215] },
      properties: { name: "Ottawa" },
    },
  ],
});
```

### Zoom to Layer

```typescript
await mapViewer.layer.zoomToLayerExtent("myLayer", {
  padding: [50, 50, 50, 50],
  duration: 1000,
});
```

### Feature Field Customization

```typescript
mapViewer.layer.redefineFeatureFields(
  "myLayer",
  ["Population", "Area", "Density"],
  "alias",
);

mapViewer.layer.replaceFeatureOutfields(
  "myLayer",
  ["string", "number", "number"],
  ["name", "population", "area"],
  ["Name", "Population", "Area (km²)"],
);
```

### Layer Configuration Access

```typescript
const config = mapViewer.layer.getLayerEntryConfig("myLayer"); // throws if not found
const config = mapViewer.layer.getLayerEntryConfigIfExists("myLayer"); // returns undefined
const allConfigs = mapViewer.layer.getLayerEntryConfigs();
```

### OpenLayers Layer Access

```typescript
const olLayer = await mapViewer.layer.getOLLayerAsync("myLayer", 5000);
```

> **⚠️ Prefer GeoView layers over raw OpenLayers layers.**
>
> Always use `getGeoviewLayer()` / `getGeoviewLayerIfExists()` to interact with layers. GeoView layers are fully integrated with the UI, store, events, and controllers — changes made through them (visibility, opacity, filters, etc.) propagate correctly to the legend, layer panel, and other components.
>
> Accessing the OpenLayers layer directly via `getOLLayerAsync()` bypasses this integration. Changes made on the OL layer (e.g., `olLayer.setVisible(false)`) will **not** update the store or UI, which can cause the map and the layer panel to fall out of sync. Use direct OL access only when you need low-level OpenLayers functionality that GeoView does not expose, and be aware of potential side effects.

## Event Handling

The Layer API exposes events via the [EventHelper delegate pattern](programming/event-helper.md). Each event has an `onXxx()` to subscribe and `offXxx()` to unsubscribe.

### Layer Lifecycle Events

```typescript
// Layer created
mapViewer.layer.onLayerCreated((sender, event) => {
  console.log("Layer created:", event.layerPath);
});

// First load
mapViewer.layer.onLayerFirstLoaded((sender, event) => { ... });

// Loading / Loaded
mapViewer.layer.onLayerLoading((sender, event) => { ... });
mapViewer.layer.onLayerLoaded((sender, event) => { ... });

// All layers finished loading
mapViewer.layer.onLayerAllLoaded((sender, event) => {
  console.log("All layers loaded");
});

// Error
mapViewer.layer.onLayerError((sender, event) => {
  console.error("Layer error:", event.layerPath, event.error);
});
```

### Status and Visibility Events

```typescript
mapViewer.layer.onLayerStatusChanged((sender, event) => {
  console.log(`Layer ${event.layerPath} status: ${event.status}`);
});

mapViewer.layer.onLayerVisibilityToggled((sender, event) => {
  console.log(`Layer ${event.layerPath} visible: ${event.visible}`);
});

mapViewer.layer.onLayerItemVisibilityToggled((sender, event) => { ... });
```

### Configuration Events

```typescript
mapViewer.layer.onLayerConfigAdded((sender, event) => { ... });
mapViewer.layer.onLayerConfigRemoved((sender, event) => { ... });
mapViewer.layer.onLayerConfigError((sender, event) => { ... });
```

### Cleaning Up Listeners

```typescript
const handler = (sender, event) => { ... };
mapViewer.layer.onLayerLoaded(handler);
// Later:
mapViewer.layer.offLayerLoaded(handler);
```

---

## Layer Sets

The Layer API maintains specialized layer sets for different query purposes:

| Layer Set                  | Purpose                              |
| -------------------------- | ------------------------------------ |
| `legendsLayerSet`          | Legend/symbology data                |
| `featureInfoLayerSet`      | Feature info from map clicks         |
| `allFeatureInfoLayerSet`   | All features (data tables, exports)  |
| `hoverFeatureInfoLayerSet` | Feature info under cursor (tooltips) |

```typescript
const legendsLayerSet = mapViewer.layer.legendsLayerSet;
```

For details, see the [Layer Sets Guide](./layersets.md).

---

## Error Handling

Methods that require a layer to exist throw typed errors. Use `*IfExists()` variants for safe access.

```typescript
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

1. **Use safe methods** (`getGeoviewLayerIfExists`, `getLayerEntryConfigIfExists`) when the layer may not exist
2. **Wait for layers to load** via `onLayerAllLoaded()` before performing operations that depend on all layers
3. **Handle errors** via `onLayerError()` for user-friendly error messages
4. **Clean up listeners** with `offXxx()` to prevent memory leaks
5. **Use async methods** (`getOLLayerAsync`) when accessing OpenLayers layers that may not be created yet

---

## See Also

- **[LayerApi — TypeDoc](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/LayerApi.html)** — Complete method reference
- [Layer Sets Guide](./layersets.md) — Working with layer sets
- [Controllers API](app/events/controllers.md) — Controllers for performing actions
- [Configuration Reference](app/config/configuration-reference.md) — Layer configuration options
- [API Reference](api.md) — Main API entry points
- [Map Viewer API](map-viewer-api.md) — MapViewer instance methods
