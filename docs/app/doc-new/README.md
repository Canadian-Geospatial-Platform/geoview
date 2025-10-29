# GeoView API Documentation

> **👥 Audience:** Developers using GeoView in their applications
>
> **For Core Contributors:** See [Programming Documentation](../../../programming/) for internal development guides

This folder contains the **official API documentation** for using GeoView in your applications.

> **🔍 TypeScript Reference:** For complete TypeScript API with all types, interfaces, and auto-generated documentation, see [TypeDoc API Documentation](https://canadian-geospatial-platform.github.io/geoview/public/docs/)

## Quick Start

1. **[Creating Maps](./create-map.md)** - Initialize and configure maps
2. **[API Reference](./api.md)** - Main API entry points
3. **[GeoView Layers](./layers.md)** - Layer concepts and configuration
4. **[Layer API](./layer-api.md)** - Add and manage layers
5. **[Event Processors](./event-processors.md)** - Perform actions and manage state

## Key Concepts

**Actions vs Events:**

- Use **Event Processors** to perform actions (change state): `MapEventProcessor.setView(mapId, center, zoom)`
- Use **MapViewer methods** to listen to events (react to changes): `mapViewer.onMapMoveEnd(callback)`

## Complete Documentation Index

### Core API

- **[API Reference](./api.md)** - cgpv.api methods (createMapFromConfig, getMapViewer, etc.)
- **[CGPV Global Object](./cgpv.md)** - Global cgpv object and initialization
- **[API Utilities](./api-utilities.md)** - Utility functions (core, geo, projection, date)

### Map & Layer Management

- **[Creating Maps](./create-map.md)** - Map creation and configuration
- **[MapViewer API](./map-viewer-api-doc.md)** - MapViewer instance methods
- **[MapViewer Functions](./map-viewer-api-functions.md)** - Additional MapViewer utilities
- **[GeoView Layers](./layers.md)** - Layer types, configuration, and concepts
- **[Layer API](./layer-api.md)** - Complete layer management reference

### State & Events

- **[Event Processors](./event-processors.md)** - Modern event handling and state management
- **[Event Creation](./event-creation.md)** - Creating custom events
- **[Event System](./event.md)** - Event system overview
- **[Map Events](./event-map.md)** - Map-specific events
- **[Layer Events](./event-layer.md)** - Layer-specific events
- **[LayerSet Events](./event-layerset.md)** - LayerSet event handling

### Plugins & Extensions

- **[Packages & Plugins](./packages.md)** - Plugin system and development guide

## Documentation by Use Case

### I want to...

#### ...create a map

→ [Creating Maps](./create-map.md) and [API Reference](./api.md#createMapFromConfig)

#### ...add layers

→ [Layer API - Adding Layers](./layer-api.md#adding-layers)

#### ...handle map events

→ [Event Processors](./event-processors.md#2-legendeventprocessor) - Use MapEventProcessor

#### ...work with layer visibility

→ [Layer API - Visibility](./layer-api.md#visibility)

#### ...create a plugin

→ [Packages & Plugins - Plugin Development](./packages.md#plugin-development)

#### ...use coordinate transformations

→ [API Utilities - Projection](./api-utilities.md#projection-utilities)

#### ...format dates for temporal layers

→ [API Utilities - Date Management](./api-utilities.md#date-management-utilities)

#### ...manage state in my plugin

→ [Event Processors](./event-processors.md) - Create a custom Event Processor

## Architecture Overview

```
cgpv (global object)
└── api
    ├── createMapFromConfig()    → Create maps
    ├── getMapViewer()            → Get MapViewer instance
    │   ├── layer                 → Layer API
    │   │   ├── addGeoviewLayer()
    │   │   ├── removeLayerUsingPath()
    │   │   └── ...50+ methods
    │   ├── map                   → OpenLayers Map instance
    │   └── ...
    ├── utilities
    │   ├── core                  → Core utilities
    │   ├── geo                   → Geographic utilities
    │   ├── projection            → Projection utilities
    │   └── date                  → Date utilities
    └── plugin
        └── register()            → Register plugins
```

## Related Documentation

### For Plugin/Extension Developers

- [Plugin Development (Monorepo)](../../packages-core.md) - Rush.js setup
- [Components vs Packages](../../components-packages.md) - Architecture

### For Core Contributors

- [Programming Best Practices](../../../programming/best-practices.md)
- [Using Zustand Store](../../../programming/using-store.md)
- [Event Processor Architecture](../../../programming/event-processor-architecture.md)
- [TypeScript Patterns](../../../programming/using-type.md)
- [Logging Standards](../../../programming/logging.md)

### Legacy Documentation

- [Internal Event System](../../event/README.md) - Internal implementation details (use Event Processors for API)
- [GeoView Layers](../../geoview-layer/README.md) - Layer configuration details

## TypeScript Support

All APIs are fully typed. Import types from geoview-core:

```typescript
import type {
  TypeMapConfig,
  TypeGeoviewLayerConfig,
  TypeViewSettings,
  MapViewer,
} from "geoview-core";
```

**For Complete Type Definitions:**

- 📚 [TypeDoc API Reference](https://canadian-geospatial-platform.github.io/geoview/public/docs/) - Complete TypeScript API with all interfaces, types, and classes
- 🔍 Browse all exported types, event payloads, and internal structures
- 💡 See JSDoc comments with parameter descriptions and examples

## Getting Help

- 📖 **Documentation Issues?** Check the [main docs README](../../../README.md)
- 🔍 **Need Type Definitions?** See [TypeDoc API Documentation](https://canadian-geospatial-platform.github.io/geoview/public/docs/)
- 🐛 **Found a Bug?** [Report an issue](https://github.com/Canadian-Geospatial-Platform/geoview/issues)
- 💬 **Questions?** See the examples in each documentation file

## Contributing to Documentation

When updating API documentation:

1. Keep examples working and tested
2. Include TypeScript signatures
3. Document all parameters and return types
4. Add "See Also" sections for related docs
5. Update this README if adding new files
