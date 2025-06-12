### Layer Events
```typescript
// Layer configuration added
mapViewer.layer.onLayerConfigAdded((sender, payload) => {
  console.log(`Layer added: ${payload.layer.geoviewLayerId}`);
});

// Layer configuration removed
mapViewer.layer.onLayerConfigRemoved((sender, payload) => {
  console.log(`Layer removed: ${payload.layerPath}`);
});

// Layer configuration error
mapViewer.layer.onLayerConfigError((sender, payload) => {
  console.error(`Layer error: ${payload.error}`);
});

// Layer created (after configuration is processed)
mapViewer.layer.onLayerCreated((sender, payload) => {
  console.log(`Layer created: ${payload.layer.getLayerPath()}`);
  
  // You can attach layer-specific events here
  const layer = payload.layer;
});
```

### Layer Status Events
```typescript
// Generic event for any layer status change
mapViewer.layer.onLayerStatusChanged((sender, payload) => {
  console.log(`Layer ${payload.config.layerPath} status: ${payload.status}`);
});

// Layer first loaded (fires only once per layer)
mapViewer.layer.onLayerFirstLoaded((sender, payload) => {
  console.log(`Layer ${payload.layer.getLayerPath()} loaded for the first time`);
});

// Layer loading (fires on every render cycle)
mapViewer.layer.onLayerLoading((sender, payload) => {
  console.log(`Layer ${payload.layer.getLayerPath()} is loading...`);
});

// Layer loaded (fires on every render cycle)
mapViewer.layer.onLayerLoaded((sender, payload) => {
  console.log(`Layer ${payload.layer.getLayerPath()} finished loading`);
});

// Layer error (fires when rendering fails)
mapViewer.layer.onLayerError((sender, payload) => {
  console.error(`Layer error: ${payload.error}`);
});

// All layers loaded (fires when all layers finish loading/error)
mapViewer.layer.onLayerAllLoaded((sender, payload) => {
  console.log('All layers have finished loading');
});
```

### Layer Specific Events

You can attach events to specific layers after they're created:

```typescript
// After a layer is created
mapViewer.layer.onLayerCreated((sender, payload) => {
  const layer = payload.layer;
  
  // Layer-specific first load event
  layer.onLayerFirstLoaded((sender, payload) => {
    console.log(`${layer.getLayerPath()} loaded for the first time`);
  });
  
  // Layer-specific loaded event
  layer.onLayerLoaded((sender, payload) => {
    console.log(`${layer.getLayerPath()} finished loading`);
  });
  
  // Layer-specific error event
  layer.onLayerError((sender, payload) => {
    console.error(`${layer.getLayerPath()} error: ${payload.error}`);
  });
  
  // Layer visibility changed
  layer.onVisibleChanged((sender, payload) => {
    console.log(`${layer.getLayerPath()} visibility: ${payload.visible}`);
  });
  
  // Layer opacity changed
  layer.onLayerOpacityChanged((sender, payload) => {
    console.log(`${layer.getLayerPath()} opacity: ${payload.opacity}`);
  });
});
```