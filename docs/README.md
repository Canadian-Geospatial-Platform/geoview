# GeoView Documentation

Welcome to the GeoView documentation! This documentation is organized by audience and use case.

## 📘 For GeoView Users (API Documentation)

**Location:** [`app/doc-new/`](./app/doc-new/)

### Getting Started Guides

Complete API reference for using GeoView in your applications:

- **[API Reference](./app/doc-new/api.md)** - Main API entry points (createMapFromConfig, getMapViewer, etc.)
- **[MapViewer API](./app/doc-new/map-viewer-api-doc.md)** - MapViewer instance methods
- **[GeoView Layers](./app/doc-new/layers.md)** - Layer types, configuration, and concepts
- **[Layer API](./app/doc-new/layer-api.md)** - Layer management (add, remove, configure layers)
- **[Event Processors](./app/doc-new/event-processors.md)** - State management and event handling
- **[API Utilities](./app/doc-new/api-utilities.md)** - Utility functions (core, geo, projection, date)
- **[Packages & Plugins](./app/doc-new/packages.md)** - Plugin system and available packages
- **[Creating Maps](./app/doc-new/create-map.md)** - How to create and configure maps
- **[CGPV Global Object](./app/doc-new/cgpv.md)** - Global cgpv object reference

### TypeScript API Reference (TypeDoc)

> **🔍 Complete API Reference:** For detailed TypeScript interfaces, types, classes, and functions, see our auto-generated [TypeDoc API Documentation](https://canadian-geospatial-platform.github.io/geoview/public/docs/)

**What's in TypeDoc:**

- 📦 All exported classes, interfaces, and types
- 🔧 Complete function signatures with parameter details
- 📝 JSDoc comments and usage examples
- 🔗 Cross-referenced type definitions
- 🎯 Event payload types and validation functions

**Use TypeDoc for:**

- Looking up exact type definitions
- Finding all available methods on a class
- Understanding event payload structures
- Exploring internal class hierarchies
- TypeScript type checking in your IDE

## 🔧 For GeoView Developers (Internal Development)

**Location:** [`programming/`](./programming/)

Best practices and patterns for contributing to GeoView core:

- **[Best Practices](./programming/best-practices.md)** - Coding standards and conventions
- **[Using TypeScript](./programming/using-type.md)** - TypeScript patterns and types
- **[Using Zustand Store](./programming/using-store.md)** - State management internals
- **[Event Processor Architecture](./programming/event-processor-architecture.md)** - Creating custom event processors
- **[Adding Layer Types](./programming/adding-layer-types.md)** - Implementing new layer types
- **[Logging](./programming/logging.md)** - Logging standards and practices
- **[Object-Oriented Patterns](./programming/object-oriented.md)** - OOP patterns in GeoView

## 🛠️ For Plugin & Extension Developers

**Location:** [`app/`](./app/)

Guides for extending GeoView functionality:

### Package Development

- **[Creating Packages](./app/packages.md)** - Overview of package types
- **[Core Packages (Rush.js)](./app/packages-core.md)** - Creating monorepo packages
- **[Components vs Packages](./app/components-packages.md)** - Architecture overview

### Layer Development

> **📘 Note:** Layer documentation has been consolidated into [doc-new](./app/doc-new/):
>
> - **For API Users:** See [GeoView Layers Guide](./app/doc-new/layers.md)
> - **For Core Developers:** See [Adding Layer Types](./programming/adding-layer-types.md)

> **📘 Note:** Event documentation has been consolidated into [doc-new](./app/doc-new/):
>
> - **For API Users:** See [Event System](./app/doc-new/event.md), [Map Events](./app/doc-new/event-map.md), and [Layer Events](./app/doc-new/event-layer.md)
> - **For Core Developers:** See [Event Processor Architecture](./programming/event-processor-architecture.md)

## 📚 Additional Resources

### UI & Theming

- **[Accessibility](./app/accessibility.md)** - WCAG compliance and accessibility features
- **[Theming](./app/ui/theming.md)** - UI themes and styling

### Configuration

- **[Loading Maps](./app/loading-maps.md)** - Map initialization methods
- **[Accessing Types](./app/accessing-types.md)** - TypeScript type definitions

## 🗺️ Documentation Quick Navigation

### Common Tasks

| Task            | Documentation                                            |
| --------------- | -------------------------------------------------------- |
| Create a map    | [Creating Maps](./app/doc-new/create-map.md)             |
| Add a layer     | [Layer API](./app/doc-new/layer-api.md#adding-layers)    |
| Create a plugin | [Packages](./app/doc-new/packages.md#plugin-development) |
| Handle events   | [Event Processors](./app/doc-new/event-processors.md)    |
| Use utilities   | [API Utilities](./app/doc-new/api-utilities.md)          |
| Contribute code | [Best Practices](./programming/best-practices.md)        |

## 📖 Documentation Structure

```
docs/
├── README.md (this file)
├── app/
│   ├── doc-new/          # API documentation for users (guides & examples)
│   ├── event/            # Internal event system implementation
│   ├── geoview-layer/    # Layer development guides (being deprecated)
│   ├── ui/               # UI and theming
│   └── *.md              # Extension development guides
└── programming/          # Internal development practices

TypeDoc (Auto-generated):
└── public/docs/          # Complete TypeScript API reference
    ├── modules.html      # All exported modules
    ├── classes/          # Class documentation
    ├── interfaces/       # Interface definitions
    ├── types/            # Type definitions
    └── functions/        # Function signatures
```

### Documentation Types Explained

| Type                  | Location            | Purpose                               | When to Use                           |
| --------------------- | ------------------- | ------------------------------------- | ------------------------------------- |
| **User Guides**       | `docs/app/doc-new/` | How to use GeoView APIs with examples | Learning how to build with GeoView    |
| **TypeDoc Reference** | `public/docs/`      | Complete TypeScript API definitions   | Looking up exact types and signatures |
| **Developer Guides**  | `docs/programming/` | Internal architecture and patterns    | Contributing to GeoView core          |
| **Extension Guides**  | `docs/app/`         | Creating plugins and packages         | Building GeoView extensions           |

## 🔄 Key Concepts

### Events vs Actions

GeoView uses a clear separation between **listening to events** and **performing actions**:

- **Events (Listening):** Use MapViewer/Layer event handlers
  - Example: `cgpv.api.getMapViewer('map1').onMapMoveEnd((payload) => { ... })`
- **Actions (Modifying State):** Use Event Processor static methods
  - Example: `MapEventProcessor.setView('map1', center, zoom)`

See [Event Processors Guide](./app/doc-new/event-processors.md) for details on the architecture.

### Package Development

Plugin development uses TypeScript and the monorepo structure. See the [Packages Guide](./app/doc-new/packages.md#plugin-development) for complete instructions.

## 🤝 Contributing to Documentation

When adding documentation:

1. **API docs** → Add to `app/doc-new/`
2. **Internal practices** → Add to `programming/`
3. **Extension guides** → Add to `app/`
4. Update this README with links
5. Add cross-references to related docs

## API ACCESS TO MAP DEPRECATED

The api.maps array is now private and only accessible from the api. The `cgpv.api.maps` is not available anymore. To access and interact with the maps, new functions have been added.

- How to get a list of maps available

```ts
/**
 * Gets the list of all map IDs currently in the collection.
 *
 * @returns {string[]} Array of map IDs
 */
getMapViewerIds(): string[]
```

- How to know if a map exist

```ts
/**
 * Return true if a map id is already registered.
 *
 * @param {string} mapId - The unique identifier of the map to retrieve
 * @returns {boolean} True if map exist
 */
hasMapViewer(mapId: string): boolean
```

- How to access a map by id

```ts
/**
 * Gets a map viewer instance by its ID.
 *
 * @param {string} mapId - The unique identifier of the map to retrieve
 * @returns {MapViewer} The map viewer instance if found
 * @throws {Error} If the map with the specified ID is not found
 */
getMapViewer(mapId: string): MapViewer
```

_Implementation_

```ts
const myMap = cgpv.api.getMapViewer("Map1");
myMap.layer.addGeoviewLayerByGeoCoreUUID(layer);
```

- How to delete a map instance

```ts
/**
 * Delete a map viewer instance by its ID.
 *
 * @param {string} mapId - The unique identifier of the map to delete
 * @param {boolean} deleteContainer - True if we want to delete div from the page
 * @returns {Promise<HTMLElement} The Promise containing the HTML element
 */
deleteMapViewer(mapId: string, deleteContainer: boolean): Promise<HTMLElement | void> {
```

_Implementation_

```ts
if (cgpv.api.hasMapViewer(map)) {
  cgpv.api.deleteMapViewer(map, false).then(() => {
    resolve();
  });
} else {
  resolve();
}
```
