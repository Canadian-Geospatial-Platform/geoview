# GeoView Events Documentation

## Overview

GeoView provides a comprehensive event system that allows you to respond to various map interactions and state changes. This document explains how to use the event system effectively.

## Event Structure

All GeoView events follow a consistent pattern:

```javascript
// Register an event handler
object.onEventName((sender, payload) => {
  // Handle the event
  console.log(`Event triggered by ${sender} with data:`, payload);
});
```

Where:
- object is the object that emits the event (e.g., mapViewer, mapViewer.layer)
- onEventName is the event name (e.g., onMapZoomEnd, onLayerLoaded)
- sender is the object that triggered the event
- payload contains event-specific data

## Common Events

### Map Initialization
```javascript
// Register a handler when the map is initialized
cgpv.onMapInit((mapViewer) => {
  // This callback is executed when map is init. The layers have NOT been registered yet at this time.
  // Note: Layers have NOT been registered yet at this time. If you really want to make sure to track ALL
  // status changes for ANY particular layer, you can use a hook such as:
  // `mapViewer.layer.onLayerStatusChanged()`
  console.log('Map initialized:', mapViewer.id);

  // Listen to ANY/ALL layer status at ANY time (generic event catcher)
  mapViewer.layer.onLayerStatusChanged((sender, payload) => {
    console.log(`LayerApi: ${payload.config.layerPath} (generic event) status changed to ${payload.status}`);
  });
});

// Register a handler when the map is ready (map and UI are fully loaded)
cgpv.onMapReady((mapViewer) => {
  // This callback is executed when map is ready / ALL layers have at least been registered.
  // NOTE: some layers can be further along in their individual status at the time this event is triggered(!).
  console.log('Map ready for interaction:', mapViewer.id);
});

// Register a handler when all layer configurations are processed
cgpv.onLayersProcessed((mapViewer) => {
  // This callback executes when all layer configurations have been processed
  // Note: Layers may still be loading at this point
  console.log('All layer configurations processed for map:', mapViewer.id);
});

// Register a handler when all layers are loaded
cgpv.onLayersLoaded((mapViewer) => {
  // This callback executes when all layers have finished loading
  // This is different from onLayersProcessed - this fires when layers are actually rendered
  console.log('All layers loaded for map:', mapViewer.id);
});
```
These events are important for proper initialization sequencing:
- onMapInit - Fires when the map object is first initialized, but before layers are processed
- onLayersProcessed - Fires when all layer configurations have been processed (layers may still be loading)
- onLayersLoaded - Fires when all layers have finished loading and rendering
- onMapReady - Fires when the map and UI are fully loaded and ready for interaction

Using these events helps you properly sequence your application's initialization logic.

_The onLayersLoaded event is particularly useful when you need to perform actions that depend on all layers being fully rendered, not just processed. This is different from mapViewer.layer.onLayerAllLoaded() as it's a top-level event on the cgpv object itself._

### CGPV Api Events
```javascript
// Map added to DOM
cgpv.api.onMapAddedToDiv((sender, payload) => {
  console.log(`Map ${payload.mapId} added to DOM`);
});

// DEPRECATED??????
// Map viewer ready
cgpv.api.onMapViewerReady((sender, payload) => {
  console.log(`Map viewer ${payload.mapId} is ready for interaction`);
  
  // Access the map viewer instance
  const mapViewer = payload.mapViewer;
  
  // You can now safely interact with the map viewer and its components
  // This event ensures that the map viewer is fully initialized and ready
});
```

### Map Events
See map event section


### Layer Events
```javascript
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
```javascript
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

```javascript
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

## Best Practices
- Register map events after initialization: Always register your event handlers inside the onMapInit callback.
- Layer-specific events: For layer-specific events, register them after the layer is created using the onLayerCreated event.
- Error handling: Always include error handling in your event callbacks to prevent uncaught exceptions.
- Event cleanup: If your application dynamically creates and destroys maps, make sure to remove event listeners when they're no longer needed.
- Performance: Be mindful of performance when handling events that fire frequently (like onLayerLoading or onMapMoveEnd).

### Example: Complete Event Registration
```javascript
cgpv.onMapInit((mapViewer) => {
  // Map events
  mapViewer.onMapMoveEnd((sender, payload) => {
    console.log(`Map moved to: ${payload.lonlat[0]}, ${payload.lonlat[1]}`);
  });
  
  // Layer events
  mapViewer.layer.onLayerCreated((sender, payload) => {
    const layer = payload.layer;
    console.log(`Layer created: ${layer.getLayerPath()}`);
    
    // Register layer-specific events
    if (layer.getLayerPath() === 'mySpecialLayer') {
      layer.onVisibleChanged((sender, payload) => {
        console.log(`Special layer visibility: ${payload.visible}`);
      });
    }
  });
  
  // All layers loaded event
  mapViewer.layer.onLayerAllLoaded((sender, payload) => {
    console.log('All layers loaded, map is ready for interaction');
  });
});

cgpv.init();
```