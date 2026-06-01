# Layer Events

> **Full API Reference:** [LayerApi — TypeDoc](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/LayerApi.html)
>
> TypeDoc is auto-generated from source code and always reflects the current event signatures, payload types, and delegate definitions.

Layer events are available on `mapViewer.layer` (LayerApi) and on individual GV layer instances.

## LayerApi Events

Register on `mapViewer.layer` to watch all layers:

```typescript
cgpv.onMapInit((mapViewer) => {
  // Layer lifecycle
  mapViewer.layer.onLayerConfigAdded((sender, event) => {
    console.log("Config added:", event.layer.geoviewLayerId);
  });

  mapViewer.layer.onLayerCreated((sender, event) => {
    console.log("Layer created:", event.layer.getLayerPath());
  });

  mapViewer.layer.onLayerConfigRemoved((sender, event) => {
    console.log("Layer removed:", event.layerPath);
  });

  mapViewer.layer.onLayerConfigError((sender, event) => {
    console.error("Config error:", event.layerPath, event.error);
  });

  // Layer loading status
  mapViewer.layer.onLayerStatusChanged((sender, event) => {
    console.log(`${event.config.layerPath} status: ${event.status}`);
  });

  mapViewer.layer.onLayerFirstLoaded((sender, event) => {
    console.log("First load:", event.layer.getLayerPath());
  });

  mapViewer.layer.onLayerLoaded((sender, event) => {
    console.log("Loaded:", event.layer.getLayerPath());
  });

  mapViewer.layer.onLayerLoading((sender, event) => {
    console.log("Loading:", event.layer.getLayerPath());
  });

  mapViewer.layer.onLayerError((sender, event) => {
    console.error("Layer error:", event.layer.getLayerPath(), event.error);
  });

  // All layers finished loading
  mapViewer.layer.onLayerAllLoaded((sender, event) => {
    console.log("All layers loaded");
  });
});
```

## GV Layer Instance Events

Register on individual layer instances for layer-specific events:

```typescript
mapViewer.layer.onLayerCreated((sender, event) => {
  const layer = event.layer;

  layer.onLayerVisibleChanged((sender, event) => {
    console.log(`${layer.getLayerPath()} visibility: ${event.visible}`);
  });

  layer.onLayerOpacityChanged((sender, event) => {
    console.log(`${layer.getLayerPath()} opacity: ${event.opacity}`);
  });

  layer.onLayerNameChanged((sender, event) => {
    console.log(`${layer.getLayerPath()} renamed: ${event.layerName}`);
  });

  layer.onLayerFirstLoaded((sender, event) => {
    console.log(`${layer.getLayerPath()} first load complete`);
  });

  layer.onLayerLoaded((sender, event) => {
    console.log(`${layer.getLayerPath()} loaded`);
  });

  layer.onLayerError((sender, event) => {
    console.error(`${layer.getLayerPath()} error:`, event.error);
  });
});
```

## See Also

- **[Map Events](./map-events.md)** — Map viewer events (zoom, move, click, etc.)
- **[Event System Overview](./event-system.md)** — How the delegate event pattern works
- **[Creating Events](./event-creation.md)** — How to add new events
