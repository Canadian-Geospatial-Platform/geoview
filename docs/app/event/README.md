# Events related documentation

> **📘 Note:** This folder contains technical documentation about the internal event system implementation.
>
> **For API Users:** See [Event Processors](../doc-new/event-processors.md) for how to use events and actions in your applications.

## Event System Documentation

- [Events API](./events-api.md) - Event system implementation details
- [Events and Payloads](./event-payloads.md) - Event data structures
- [LayerSet event managment](./LayerSet/LayerSet-event-managment.md)
  - [LayerSet class description](./LayerSet/LayerSet-event-managment.md#layerset-class)
  - [LayerSet state diagram](./LayerSet/LayerSet-event-managment.md#layerset-state-diagram)
- [LegendsLayerSet event managment](./LegendsLayerSet/LegendsLayerSet-event-managment.md)
  - [LegendsLayerSet class description](./LegendsLayerSet/LegendsLayerSet-event-managment.md#legendslayerset-class)
  - [LegendsLayerSet state diagram](./LegendsLayerSet/LegendsLayerSet-event-managment.md#legendslayerset-state-diagram)
- [FeatureInfoLayerSet event managment](./FeatureInfoLayerSet/FeatureInfoLayerSet-event-managment.md)
  - [FeatureInfoLayerSet class description](./FeatureInfoLayerSet/FeatureInfoLayerSet-event-managment.md#FeatureInfoLayerSet-class)
  - [FeatureInfoLayerSet state diagram](./FeatureInfoLayerSet/FeatureInfoLayerSet-event-managment.md#FeatureInfoLayerSet-state-diagram)

## Events vs Actions

GeoView separates **listening to events** from **performing actions**:

### Listening to Events

Use MapViewer and Layer event handlers:

```typescript
const mapViewer = cgpv.api.getMapViewer("mapId");

// Listen to map events
mapViewer.onMapMoveEnd((payload) => {
  console.log("Map moved to:", payload.lnglat);
});

// Listen to layer events
mapViewer.layer.onLayerLoaded((sender, event) => {
  console.log("Layer loaded:", event.layerPath);
});
```

### Performing Actions (Modifying State)

Use Event Processor static methods:

```typescript
import { MapEventProcessor } from "@/api/event-processors/event-processor-children/map-event-processor";

// Set map view
MapEventProcessor.setView("mapId", center, zoom);

// Set layer opacity
MapEventProcessor.setLayerOpacity("mapId", layerPath, 0.5);
```

## See Also

- [Event Processors](../doc-new/event-processors.md) - Complete event handling guide
- [MapViewer API](../doc-new/map-viewer-api-doc.md) - MapViewer event methods
- [Layer API](../doc-new/layer-api.md) - Layer event methods
- [State Management](../../programming/using-store.md) - Internal Zustand store usage
