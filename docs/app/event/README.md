# ⚠️ DEPRECATED - Event System Documentation

> **📘 This folder is being deprecated.** Content has been migrated to the new documentation structure.

## 🔄 Migration Guide

**For API Users (using GeoView in your applications):**

- 📘 **Using Events & Actions** → See [Event Processors Guide](../doc-new/event-processors.md)
- 🎯 **Layer Sets (Legends, Features)** → See [Layer Sets Guide](../doc-new/layersets.md)
- 📚 **Event API Reference** → See [Event System](../doc-new/event.md), [Map Events](../doc-new/event-map.md), [Layer Events](../doc-new/event-layer.md)

**For Core Developers (contributing to GeoView):**

- 🏗️ **Event Processor Architecture** → See [Event Processor Architecture](../../programming/event-processor-architecture.md)
- 🔧 **Layer Set Architecture** → See [Layer Set Architecture](../../programming/layerset-architecture.md)
- 🛠️ **Creating Custom Processors** → See [Event Processor Architecture - Custom Processors](../../programming/event-processor-architecture.md#creating-custom-event-processors)

## 📚 Complete Documentation

Visit the new documentation structure:

- [API Documentation](../doc-new/) - For GeoView users
- [Programming Guide](../../programming/) - For GeoView developers

---

## Old Content (Deprecated)

<details>
<summary>Click to view old documentation structure (contains draw.io diagrams - not maintained)</summary>

### Event System Documentation

- [Events API](./events-api.md) - ⚠️ See [Event Processors](../doc-new/event-processors.md) instead
- [Events and Payloads](./event-payloads.md) - ⚠️ See [TypeDoc API](../../../public/typeDocAPI/) for type definitions
- [LayerSet event managment](./LayerSet/LayerSet-event-managment.md) - ⚠️ See [Layer Set Architecture](../../programming/layerset-architecture.md)
- [LegendsLayerSet event managment](./LegendsLayerSet/LegendsLayerSet-event-managment.md) - ⚠️ See [Layer Sets Guide](../doc-new/layersets.md)
- [FeatureInfoLayerSet event managment](./FeatureInfoLayerSet/FeatureInfoLayerSet-event-managment.md) - ⚠️ See [Layer Sets Guide](../doc-new/layersets.md)

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
