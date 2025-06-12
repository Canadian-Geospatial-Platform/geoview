# GeoView Events Documentation

## Overview

GeoView provides a comprehensive event system that allows you to respond to various map interactions and state changes. This document explains how to use the event system effectively.

## Event Structure

All GeoView events follow a consistent pattern:

```typescript
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

- [Map Events](./event-map.md)
- [Layer Events](./event-layer.md)


## Best Practices
- Register map events after initialization: Always register your event handlers inside the onMapInit callback.
- Layer-specific events: For layer-specific events, register them after the layer is created using the onLayerCreated event.
- Error handling: Always include error handling in your event callbacks to prevent uncaught exceptions.
- Event cleanup: If your application dynamically creates and destroys maps, make sure to remove event listeners when they're no longer needed (if you use proper map creation and deletion, thais is done automatically).
- Performance: Be mindful of performance when handling events that fire frequently (like onLayerLoading or onMapMoveEnd).

### Example: Complete Event Registration
```typescript
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