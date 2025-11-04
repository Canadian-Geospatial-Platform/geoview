# GeoView Documentation

Welcome to the GeoView documentation! This documentation is organized by audience and use case.

## 📖 For GeoView Users (API Documentation)

### API Reference

**Location:** [`app/api/`](./app/api/)

Complete API reference for interacting with GeoView:

- **[API Entry Points](app/api/api.md)** - Main API functions (createMapFromConfig, getMapViewer, etc.)
- **[CGPV Global Object](app/api/cgpv.md)** - Global cgpv object and initialization
- **[MapViewer API](app/api/map-viewer-api.md)** - MapViewer instance methods
- **[Layer API](app/api/layer-api.md)** - Layer management (add, remove, configure)
- **[Geometry API](app/api/geometry-api.md)** - Drawing and managing geometries
- **[API Utilities](app/api/utilities.md)** - Utility functions (core, geo, projection, date)

### Layers

**Location:** [`app/layers/`](./app/layers/)

Layer types, configuration, and management:

- **[Layers Overview](app/layers/layers.md)** - Layer types, configuration, and concepts
- **[Layer Sets](app/layers/layersets.md)** - Layer set architecture and management

### Events

**Location:** [`app/events/`](./app/events/)

Event system and event handling:

- **[Event System](app/events/event-system.md)** - Core event concepts and architecture
- **[Event Processors](app/events/event-processors.md)** - State management and event handling
- **[Map Events](app/events/map-events.md)** - Map-specific events
- **[Layer Events](app/events/layer-events.md)** - Layer-specific events
- **[Layer Set Events](app/events/layerset-events.md)** - Layer set events

### Configuration

**Location:** [`app/config/`](./app/config/)

Map creation and configuration:

- **[Creating Maps](app/config/create-map.md)** - Declarative (HTML) and programmatic approaches
- **[Configuration Reference](app/config/configuration-reference.md)** - Complete configuration schema and options

### Packages

**Location:** [`app/packages/`](./app/packages/)

Package system and development:

- **[Packages Overview](app/packages/)** - Package system introduction
- **[Core Packages](app/packages/geoview-core-packages.md)** - Built-in packages (time-slider, geochart, swiper, drawer, aoi-panel, custom-legend)

### Testing

- **[Test Suite Guide](app/testing/README.md)** - Overview of the GeoView Test Suite
- **[Using the Test Suite](app/testing/using-test-suite.md)** - How to configure and run tests
- **[Available Test Suites](app/testing/available-suites.md)** - Built-in test suites
- **[Understanding Results](app/testing/understanding-results.md)** - Interpreting test outcomes
- **[Creating Custom Tests](app/testing/creating-tests.md)** - Developer guide for custom tests

### TypeScript API Reference (TypeDoc)

> **📚 Complete API Reference:** For detailed TypeScript interfaces, types, classes, and functions, see our auto-generated [TypeDoc API Documentation](https://canadian-geospatial-platform.github.io/geoview/docs/typedoc/)

**What's in TypeDoc:**

- ✓ All exported classes, interfaces, and types
- ✓ Complete function signatures with parameter details
- ✓ JSDoc comments and usage examples
- ✓ Cross-referenced type definitions
- ✓ Event payload types and validation functions

**Use TypeDoc for:**

- Looking up exact type definitions
- Finding all available methods on a class
- Understanding event payload structures
- Exploring internal class hierarchies
- TypeScript type checking in your IDE

## 🔧 For GeoView Developers (Internal Development)

**Location:** [`programming/`](./programming/)

Best practices and patterns for contributing to GeoView core:

- **[Best Practices](programming/best-practices.md)** - Coding standards and conventions
- **[Using TypeScript](programming/using-type.md)** - TypeScript patterns and types
- **[Using Zustand Store](programming/using-store.md)** - State management internals
- **[Event Processor Architecture](programming/event-processor-architecture.md)** - Creating custom event processors
- **[Layer Set Architecture](programming/layerset-architecture.md)** - Layer Set system internals
- **[Adding Layer Types](programming/adding-layer-types.md)** - Implementing new layer types
- **[Logging](programming/logging.md)** - Logging standards and practices
- **[Object-Oriented Patterns](programming/object-oriented.md)** - OOP patterns in GeoView

## 🔌 For Packages & Extension Developers

**Location:** [`app/`](./app/)

Guides for extending GeoView functionality:

### Package Development

- **[Packages](app/packages/)** - Overview, core packages, and development guides
- **[Core Package Reference](app/packages/geoview-core-packages.md)** - Complete package reference
- **[Core Package Development](app/packages/core-packages.md)** - Creating TypeScript packages (Rush.js)
- **[JavaScript Package Development](app/packages/javascript-packages.md)** - Creating vanilla JS packages
- **[Package Overview](app/packages/overview.md)** - Architecture and package types

### Documentation Organization

> **📂 Documentation Structure:**
>
> - **For API Users:** See [API Reference](app/api/), [Layers](app/layers/), and [Events](app/events/)
> - **For Core Developers:** See [Programming Guides](programming/)

## 📋 Additional Resources

### UI & Theming

- **[Accessibility](./app/accessibility.md)** - WCAG compliance and accessibility features
- **[Theming](./app/ui/theming.md)** - UI themes and styling

### Configuration

- **[Loading Maps](./app/loading-maps.md)** - Map initialization methods
- **[Accessing Types](./app/accessing-types.md)** - TypeScript type definitions

## 🗺️ Documentation Quick Navigation

### Common Tasks

| Task             | Documentation                                             |
| ---------------- | --------------------------------------------------------- |
| Create a map     | [Creating Maps](app/config/create-map.md)                 |
| Add a layer      | [Layer API](app/api/layer-api.md#adding-layers)           |
| Create a package | [Core Package Development](app/packages/core-packages.md) |
| Handle events    | [Event Processors](app/events/event-processors.md)        |
| Use utilities    | [API Utilities](app/api/utilities.md)                     |
| Draw geometry    | [Geometry API](app/api/geometry-api.md)                   |
| Run tests        | [Test Suite Guide](app/testing/using-test-suite.md)       |
| Contribute code  | [Best Practices](programming/best-practices.md)           |

## 📁 Documentation Structure

```
docs/
+-- README.md (this file)
+-- app/
    +-- api/              # API reference documentation
    +-- config/           # Map configuration and creation
    +-- layers/           # Layer types and configuration
    +-- events/           # Event system documentation
    +-- packages/         # Packages
    +-- testing/          # Test suite documentation
    +-- ui/               # UI and theming
    +-- *.md              # Extension development guides
+-- programming/          # Internal development practices

TypeDoc (Auto-generated):
+-- docs/typedoc/         # Complete TypeScript API reference
    +-- modules.html      # All exported modules
    +-- classes/          # Class documentation
    +-- interfaces/       # Interface definitions
    +-- types/            # Type definitions
    +-- functions/        # Function signatures
```

### Documentation Types Explained

| Type                  | Location             | Purpose                             | When to Use                             |
| --------------------- | -------------------- | ----------------------------------- | --------------------------------------- |
| **API Reference**     | `docs/app/api/`      | Complete API function reference     | Looking up API methods and parameters   |
| **Configuration**     | `docs/app/config/`   | Map creation and configuration      | Setting up maps and configuring GeoView |
| **TypeDoc Reference** | `docs/typedoc/`      | Complete TypeScript API definitions | Looking up exact types and signatures   |
| **Developer Guides**  | `docs/programming/`  | Internal architecture and patterns  | Contributing to GeoView core            |
| **Extension Guides**  | `docs/app/packages/` | Creating packages                   | Building GeoView extensions             |

## 💡 Key Concepts

### Events vs Actions

GeoView uses a clear separation between **listening to events** and **performing actions**:

- **Events (Listening):** Use MapViewer/Layer event handlers
  - Example: `cgpv.api.getMapViewer('map1').onMapMoveEnd((payload) => { ... })`
- **Actions (Modifying State):** Use Event Processor static methods
  - Example: `MapEventProcessor.setView('map1', center, zoom)`

See [Event Processors Guide](app/events/event-processors.md) for details on the architecture.

### Package Development

Package development uses TypeScript and the monorepo structure. See the [Core Package Development Guide](app/packages/core-packages.md) for complete instructions.

## ✍️ Contributing to Documentation

When adding documentation:

1. **API docs** → Add to `app/api/`
2. **Configuration docs** → Add to `app/config/`
3. **Layer docs** → Add to `app/layers/`
4. **Event docs** → Add to `app/events/`
5. **Package docs** → Add to `app/packages/`
6. **Internal practices** → Add to `programming/`
7. Update this README with links
8. Add cross-references to related docs

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
