# Controller Architecture

> **Audience:** Core developers contributing to GeoView
>
> **Note:** The controller pattern supersedes the former event processor architecture as the primary state coordination layer.

This document explains the internal architecture of Controllers, how they integrate with Domains and the Zustand store, and how to create custom controllers.

## Architecture Overview

### The Controller Paradigm

GeoView uses a layered architecture where **Controllers** sit between UI Components and backend code and Domain logic (business/map events). It also helps coordinate domain and Zustand store:

```
Controller --> Domain --> Store
MapViewer Events --> Controller --> Store (setterActions / store helper functions)
UI Components  --> Store Hooks  --> Read state directly from store
UI Components  --> Controllers  --> Trigger actions / domain operations
```

### Three-Layer System

```
┌─────────────────────────────────┐
│         UI Components           │  React — reads store via hooks, calls controllers for actions
├─────────────────────────────────┤
│          Controllers            │  Coordination — listens to domain/map events, updates store
├─────────────────────────────────┤
│       Domains / MapViewer       │  Business logic — layer management, UI domain, map events
├─────────────────────────────────┤
│         Zustand Store           │  State — single source of truth for UI rendering
└─────────────────────────────────┘
```

### Design Principles

1. **UI components** should:
   - Read state values directly from store hooks (`useMapZoom()`, `useLayerLegendLayers()`)
   - Access controllers via `useControllers()` hook to trigger actions
   - Never import Domains or store setter functions directly

2. **Controllers** should:
   - Subscribe to Domain events and MapViewer events in `onHook()`
   - Perform actions on the domain
   - Update the store via store helper functions (e.g., `setStoreActiveFooterBarTab()`) (at the moment the controllers also act as a store state adaptor)
   - Delegate to other controllers via `getControllersRegistry()`
   - Clean up subscriptions in `onUnhook()`

3. **Domains** should:
   - Own the business logic (layer registration, language management, etc.)
   - Emit events when state changes (e.g., `onLayerEntryConfigRegistered`, `onLayerOpacityChanged`)
   - Have no knowledge of the store or controllers

4. **Store state files** should:
   - Define the state interface (`IMapState`, `ILayerState`, etc.)
   - Export React hooks for component consumption (`useMapZoom()`)
   - Export store getter functions for non-component code (`getStoreMapZoom(mapId)`)
   - Define store adaptor functions to update the store via store actions
   - Define `actions` (setter functions that update state via `set()`)

### Why This Pattern?

**Compared to Event Processors:**

```typescript
// ❌ Old: Event Processor (static singleton, store reference in base class)
MapEventProcessor.setZoom("mapId", 10);

// ✅ New: Controller (instance with injected dependencies)
controllers.uiController.setActiveFooterBarTab("layers");

// ✅ New: Direct store update from within a controller
setStoreActiveFooterBarTab(this.getMapId(), tab);
```

## Base Classes

### AbstractController

The minimal base class providing the hook/unhook lifecycle:

```typescript
export class AbstractController {
  hook(): void {
    this.onHook();
  }

  unhook(): void {
    this.onUnhook();
  }

  protected onHook(): void {
    // Override in subclasses to attach subscriptions
  }

  protected onUnhook(): void {
    // Override in subclasses to clean up subscriptions
  }
}
```

### AbstractMapViewerController

Extends `AbstractController` with MapViewer access — the base class for all framework controllers:

```typescript
export class AbstractMapViewerController extends AbstractController {
  #mapViewer: MapViewer;

  constructor(mapViewer: MapViewer) {
    super();
    this.#mapViewer = mapViewer;
  }

  protected getMapViewer(): MapViewer {
    return this.#mapViewer;
  }

  protected getMapId(): string {
    return this.#mapViewer.mapId;
  }

  protected getControllersRegistry(): ControllerRegistry {
    return this.getMapViewer().controllers;
  }
}
```

**Key helpers:**

- `getMapViewer()` — access the map, emit events
- `getMapId()` — get the map identifier for store access
- `getControllersRegistry()` — access sibling controllers for cross-controller coordination

## Controller Registry

The `ControllerRegistry` instantiates, owns, and manages all controllers for a map instance:

```typescript
export class ControllerRegistry {
  // Always-present controllers
  readonly uiController: UIController;
  readonly mapController: MapController;
  readonly layerController: LayerController;
  readonly layerCreatorController: LayerCreatorController;
  readonly layerSetController: LayerSetController;
  readonly pluginController: PluginController;
  readonly detailsController: DetailsController;
  readonly dataTableController: DataTableController;

  // Plugin-conditional controllers
  readonly swiperController?: SwiperController;
  readonly drawerController?: DrawerController;
  readonly timeSliderController?: TimeSliderController;
  readonly geoChartController?: GeoChartController;

  readonly allControllers: AbstractController[] = [];

  constructor(mapViewer: MapViewer, uiDomain: UIDomain, layerDomain: LayerDomain) {
    // Always-present controllers
    this.uiController = new UIController(mapViewer, this, uiDomain);
    this.mapController = new MapController(mapViewer, this);
    this.layerController = new LayerController(mapViewer, this, layerDomain);
    this.layerCreatorController = new LayerCreatorController(mapViewer, this, layerDomain);
    this.layerSetController = new LayerSetController(mapViewer, this, layerDomain);
    this.pluginController = new PluginController(mapViewer, this);
    this.detailsController = new DetailsController(mapViewer, this);
    this.dataTableController = new DataTableController(mapViewer, this);

    // Plugin-conditional controllers
    if (hasSwiperPlugin(getGeoViewStore(mapViewer.mapId))) {
      this.swiperController = new SwiperController(mapViewer, this);
    }
    if (hasDrawerPlugin(getGeoViewStore(mapViewer.mapId))) {
      this.drawerController = new DrawerController(mapViewer, this, uiDomain);
    }
    if (hasTimeSliderPlugin(getGeoViewStore(mapViewer.mapId))) {
      this.timeSliderController = new TimeSliderController(mapViewer, this);
    }
    if (hasGeoChartPlugin(getGeoViewStore(mapViewer.mapId))) {
      this.geoChartController = new GeoChartController(mapViewer, this);
    }

    // Register all for lifecycle management
    this.allControllers.push(
      this.uiController,
      this.mapController,
      this.detailsController,
      this.layerController,
      this.layerCreatorController,
      this.layerSetController,
      this.pluginController,
    );
    if (this.swiperController) this.allControllers.push(this.swiperController);
    if (this.drawerController) this.allControllers.push(this.drawerController);
    if (this.timeSliderController) this.allControllers.push(this.timeSliderController);
    if (this.geoChartController) this.allControllers.push(this.geoChartController);
  }

  hookControllers(): void {
    this.allControllers.forEach((controller) => controller.hook());
  }

  unhookControllers(): void {
    this.allControllers.forEach((controller) => controller.unhook());
  }
}
```

### Initialization Sequence

Controllers are created and hooked during `MapViewer` construction:

```typescript
// In MapViewer constructor
this.#uiDomain = new UIDomain(i18instance, displayLanguage);
this.#layerDomain = new LayerDomain();

// Create and hook all controllers
this.controllers = new ControllerRegistry(this, this.#uiDomain, this.#layerDomain);
this.controllers.hookControllers();
```

### Cleanup

On map destruction, `unhookControllers()` is called to detach all subscriptions:

```typescript
// In MapViewer cleanup
this.controllers.unhookControllers();
```

### React Access

Components access controllers through `ControllerContext` and individual hooks:

```typescript
// In controller-manager.ts
export const ControllerContext = createContext<ControllerRegistry | null>(null);

export function useControllers(): ControllerRegistry {
  const ctx = useContext(ControllerContext);
  if (!ctx)
    throw new Error(
      "useControllers must be used inside ControllerContext.Provider",
    );
  return ctx;
}
```

```typescript
// In use-controllers.ts — individual hooks for each controller
import { useControllers } from "@/core/controllers/base/controller-manager";

export function useMapController(): MapController {
  return useControllers().mapController;
}
export function useLayerController(): LayerController {
  return useControllers().layerController;
}
// ... one hook per controller
```

```typescript
import {
  useLayerController,
  useUIController,
} from "@/core/controllers/use-controllers";

// In a React component — prefer individual hooks
const layerController = useLayerController();
const uiController = useUIController();
uiController.setActiveFooterBarTab("layers");
```

## Creating Custom Controllers

### Pattern 1: Domain-Driven Controller

For controllers that react to domain events and propagate changes to the store.

```typescript
import { AbstractMapViewerController } from "@/core/controllers/base/abstract-map-viewer-controller";
import type { MapViewer } from "@/geo/map/map-viewer";
import type {
  CustomDomain,
  DomainValueChangedDelegate,
} from "@/domain/custom-domain";

export class CustomController extends AbstractMapViewerController {
  /** The custom domain instance associated with this controller */
  #customDomain: CustomDomain;

  /** The bounded reference to the handle value changed */
  #boundedHandleValueChanged: DomainValueChangedDelegate;

  constructor(mapViewer: MapViewer, customDomain: CustomDomain) {
    super(mapViewer);
    this.#customDomain = customDomain;

    // Create bounded references in constructor for proper unhooking
    this.#boundedHandleValueChanged = this.#handleValueChanged.bind(this);
  }

  // #region OVERRIDES

  protected override onHook(): void {
    // Subscribe to domain events
    this.#customDomain.onValueChanged(this.#boundedHandleValueChanged);
  }

  protected override onUnhook(): void {
    // Unsubscribe in reverse order
    this.#customDomain.offValueChanged(this.#boundedHandleValueChanged);
  }

  // #endregion OVERRIDES

  // #region PUBLIC METHODS

  /**
   * Gets the current value from the domain.
   *
   * @returns The current value
   */
  getValue(): string {
    return this.#customDomain.getValue();
  }

  // #endregion PUBLIC METHODS

  // #region ACTION HANDLERS

  /**
   * Handles when the domain value changes — propagates to the store.
   */
  #handleValueChanged(newValue: string): void {
    setStoreCustomValue(this.getMapId(), newValue);
  }

  // #endregion ACTION HANDLERS
}
```

**Key points:**

- Store the domain as a private field
- Create **bounded references** (`.bind(this)`) in the constructor for each event handler
- Subscribe in `onHook()`, unsubscribe in `onUnhook()` using the same bounded reference
- Handler methods update the store via store helper functions

### Pattern 2: MapViewer Event-Driven Controller

For controllers that react to map events (clicks, pointer moves, etc.).

```typescript
export class MapInteractionController extends AbstractMapViewerController {
  constructor(mapViewer: MapViewer) {
    super(mapViewer);
  }

  protected override onHook(): void {
    this.getMapViewer().onMapSingleClick(this.#handleMapClicked.bind(this));
    this.getMapViewer().onMapPointerMove(this.#handlePointerMoved.bind(this));
  }

  #handleMapClicked(mapViewer: MapViewer, event: MapSingleClickEvent): void {
    // Query layers, update store, etc.
    this.getControllersRegistry().layerSetController.queryAtLonLat(
      event.longlat,
    );
  }

  #handlePointerMoved(mapViewer: MapViewer, event: MapPointerMoveEvent): void {
    // Update hover state in store
    setStorePointerPosition(this.getMapId(), event.coordinate);
  }
}
```

### Pattern 3: Method-Driven Controller (No Subscriptions)

For controllers that expose actions without subscribing to any events.

```typescript
export class TimeSliderController extends AbstractMapViewerController {
  constructor(mapViewer: MapViewer) {
    super(mapViewer);
  }

  // No onHook()/onUnhook() overrides needed

  /**
   * Checks if a layer has time slider values and initializes them.
   *
   * @param layer - The layer to check
   * @param config - Optional time slider configuration
   */
  checkInitTimeSliderLayerAndApplyFilters(
    layer: AbstractGVLayer,
    config?: TypeTimeSliderProps,
  ): void {
    const timeDimension = layer.getTimeDimension();
    if (!timeDimension?.isValid) return;

    const values = TimeSliderController.#getInitialTimeSliderValues(
      layer.getLayerConfig(),
      timeDimension,
      config,
    );
    if (values) {
      addStoreTimeSliderLayer(this.getMapId(), layer.getLayerPath(), values);
      this.getControllersRegistry().uiController.showTabButton("time-slider");
    }
  }

  /**
   * Updates the time slider values for a layer.
   *
   * @param layerPath - The layer path
   * @param values - The new time slider values
   */
  updateTimeSliderValues(layerPath: string, values: number[]): void {
    // Read current state, compute, update store
    const timeSliderValues = getStoreTimeSliderLayer(
      this.getMapId(),
      layerPath,
    )!;
    setStoreTimeSliderValues(this.getMapId(), layerPath, {
      ...timeSliderValues,
      values,
    });
  }
}
```

### Registering a New Controller

Add the new controller to `ControllerRegistry`:

```typescript
// In controller-registry.ts
export class ControllerRegistry {
  readonly customController: CustomController; // Add typed property

  constructor(
    mapViewer: MapViewer,
    uiDomain: UIDomain,
    layerDomain: LayerDomain,
    geometryApi: GeometryApi,
  ) {
    // ... existing controllers ...
    this.customController = new CustomController(mapViewer, customDomain);
    this.allControllers.push(this.customController);
  }
}
```

For plugin-conditional controllers, wrap in a store check:

```typescript
readonly customController?: CustomController;

// In constructor
if (hasCustomPlugin(getGeoViewStore(mapViewer.mapId))) {
  this.customController = new CustomController(mapViewer);
  this.allControllers.push(this.customController);
}
```

## Integration with the Zustand Store

### Store Structure

Each state slice follows this pattern:

```typescript
// In store-interface-and-initial-values/custom-state.ts
export interface ICustomState {
  someValue: string;
  items: CustomItem[];

  actions: {
    setSomeValue: (value: string) => void;
    addItem: (item: CustomItem) => void;
  };
}
```

### Store Hooks (React Components)

Components read state through selector hooks — one per state property:

```typescript
// Naming pattern: use{SliceName}{PropertyName}
export const useCustomSomeValue = (): string =>
  useStore(useGeoViewStore(), (state) => state.customState.someValue);

export const useCustomItems = (): CustomItem[] =>
  useStore(useGeoViewStore(), (state) => state.customState.items);
```

### Store Getter Functions (Non-Component Code)

Controllers and other TypeScript code access the store through getter functions:

```typescript
// Naming pattern: getStore{SliceName}{PropertyName}
const getStoreCustomState = (mapId: string): ICustomState =>
  getGeoViewStore(mapId).getState().customState;

export const getStoreCustomSomeValue = (mapId: string): string =>
  getStoreCustomState(mapId).someValue;

export const getStoreCustomItems = (mapId: string): CustomItem[] =>
  getStoreCustomState(mapId).items;
```

### Store Setter Functions (State Updates)

Controllers update the store through exported setter functions or `actions`:

```typescript
// Naming pattern: setStore{SliceName}{PropertyName} or addStore{SliceName}{PropertyName}
export const setStoreCustomSomeValue = (mapId: string, value: string): void => {
  getStoreCustomState(mapId).actions.setSomeValue(value);
};

export const addStoreCustomItem = (mapId: string, item: CustomItem): void => {
  getStoreCustomState(mapId).actions.addItem(item);
};
```

### Data Flow Summary

```
Controller performs an action on the domain
  ↓
Domain fires event (e.g., layer registered)
  ↓
Controller handler receives event
  ↓
Controller calls store setter function (e.g., addStoreLayerEntry(mapId, layer))
  ↓
Store updates state via actions
  ↓
React hook (e.g., useLayerLegendLayers()) re-renders component
```

For UI-initiated actions:

```
User clicks button in React component
  ↓
Component calls controller method (e.g., uiController.setActiveFooterBarTab('layers'))
  ↓
Controller calls store setter function
  ↓
Store updates state
  ↓
UI re-renders via store hooks
```

## Cross-Controller Communication

Controllers access each other through the shared `ControllerRegistry`:

```typescript
// Inside TimeSliderController
checkInitTimeSliderLayerAndApplyFilters(layer: AbstractGVLayer): void {
  // ... compute values ...
  if (timeSliderValues) {
    addStoreTimeSliderLayer(this.getMapId(), layer.getLayerPath(), timeSliderValues);
    // Access sibling controller
    this.getControllersRegistry().uiController.showTabButton('time-slider');
  }
}
```

```typescript
// Inside LayerSetController
#handleMapClicked(mapViewer: MapViewer, event: MapSingleClickEvent): void {
  this.queryAtLonLat(event.longlat).catch((error: unknown) => {
    logger.logPromiseFailed('performQueryAtLonLat in #handleMapClicked', error);
  });
}
```

## Best Practices

### DO ✅

1. **Use bounded references for domain event handlers**

   ```typescript
   // In constructor
   this.#boundedHandler = this.#handleEvent.bind(this);

   // In onHook()
   this.#domain.onEvent(this.#boundedHandler);

   // In onUnhook()
   this.#domain.offEvent(this.#boundedHandler);
   ```

2. **Keep domains private — expose only what components need**

   ```typescript
   #layerDomain: LayerDomain;  // ✅ Private

   getGeoviewLayerIds(): string[] {
     return this.#layerDomain.getGeoviewLayerIds();  // ✅ Controlled access
   }
   ```

3. **Use store helper functions for state updates**

   ```typescript
   setStoreActiveFooterBarTab(this.getMapId(), tab); // ✅ Clear intent
   ```

4. **Access sibling controllers through the registry**

   ```typescript
   this.getControllersRegistry().uiController.showTabButton("time-slider"); // ✅
   ```

5. **Unsubscribe in reverse order of subscription**

   ```typescript
   protected override onHook(): void {
     this.#domain.onEventA(this.#boundedA);
     this.#domain.onEventB(this.#boundedB);
   }

   protected override onUnhook(): void {
     this.#domain.offEventB(this.#boundedB);  // Reverse order
     this.#domain.offEventA(this.#boundedA);
   }
   ```

### DON'T ❌

1. **Don't expose the domain directly**

   ```typescript
   getDomain(): CustomDomain { return this.#domain; }  // ❌ Leaks domain to UI
   ```

2. **Don't import store setters in React components**

   ```typescript
   // ❌ Bad: component directly calls store setter
   import { setStoreMapZoom } from "@/core/stores/...";
   setStoreMapZoom(mapId, 10);

   // ✅ Good: component uses controller
   const { uiController } = useControllers();
   uiController.setActiveFooterBarTab("time-slider");
   ```

3. **Don't create circular dependencies between controllers**

   ```typescript
   // ❌ Bad: Controller A calls B which calls A
   // ✅ Good: Use the store as the shared state, let hooks react
   ```

4. **When creating a new controller, don't forget to add the controller to `allControllers` in the registry**

   ```typescript
   // ❌ Bad: controller created but never hooked
   this.customController = new CustomController(mapViewer);

   // ✅ Good: added to the list for lifecycle management
   this.customController = new CustomController(mapViewer);
   this.allControllers.push(this.customController);
   ```

5. **Don't subscribe to events outside of `onHook()`**

   ```typescript
   // ❌ Bad: subscribing in constructor (no cleanup guarantee)
   constructor(mapViewer: MapViewer) {
     super(mapViewer);
     this.#domain.onEvent(this.#handler);
   }

   // ✅ Good: subscribing in onHook()
   protected override onHook(): void {
     this.#domain.onEvent(this.#boundedHandler);
   }
   ```

## Existing Controllers

The following table summarizes all controllers, their purpose, dependencies, and whether they subscribe to domain events:

| Controller               | Purpose                                                                                         | Domain/Dependencies       | Subscribes in `onHook()`                         | Plugin-Conditional |
| ------------------------ | ----------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------ | ------------------ |
| `UIController`           | Language, theme, panels, focus traps, notifications                                             | `UIDomain`                | Yes (language changed)                           | No                 |
| `MapController`          | Zoom, projection, click markers, basemap, coordinate info                                       | `FeatureHighlight`        | No                                               | No                 |
| `LayerController`        | Layer lifecycle, config/GV layer access, layer property changes, layer highlighting, layer zoom | `LayerDomain`             | Yes (15+ events)                                 | No                 |
| `LayerCreatorController` | Layer creation, removal, reload, GeoCore UUID resolution                                        | `LayerDomain`             | No (subscribes to GeoViewLayer events per-layer) | No                 |
| `LayerSetController`     | Feature info queries, legends, layer sets                                                       | `LayerDomain`             | Yes (map click/pointer)                          | No                 |
| `PluginController`       | Plugin loading, adding, removing                                                                | —                         | No                                               | No                 |
| `DataTableController`    | Data table filter operations                                                                    | —                         | No                                               | No                 |
| `DrawerController`       | Drawing tools, transforms, undo/redo, styles                                                    | `UIDomain`, `GeometryApi` | Yes (language, projection)                       | Yes (drawer)       |
| `TimeSliderController`   | Temporal filtering, time slider values                                                          | —                         | No                                               | Yes (time-slider)  |

### UIController

Subscribes to `UIDomain.onLanguageChanged()`. Provides a large public API for managing UI state: panels, footer/app bar tabs, focus traps, language, theme, notifications, crosshairs, fullscreen, etc.

### MapController

No domain subscriptions. Provides zoom operations (`zoomToExtent`, `zoomToInitialExtent`, `zoomToMyLocation`, `zoomToGeoLocatorLocation`, etc.), feature highlighting (`addHighlightedFeature`, `highlightBBox`, `removeHighlightedFeature`, etc.), projection switching (`setProjection`), basemap management (`setBasemap`, `resetBasemap`), click markers, and coordinate info.

### LayerController

The most heavily-connected controller. Subscribes to 15+ `LayerDomain` events in `onHook()`:

- `onLayerEntryConfigRegistered` / `onLayerEntryConfigUnregistered`
- `onLayerStatusChanged`, `onLayerNameChanged`, `onLayerVisibleChanged`, `onLayerOpacityChanged`
- `onLayerLoading`, `onLayerFirstLoaded`, `onLayerLoaded`
- `onLayerError`, `onLayerMessage`
- `onLayerHoverableChanged`, `onLayerQueryableChanged`
- `onLayerGroupLayerAdded`, `onLayerGroupLayerRemoved`
- `onLayerWMSImageLoadRescue`

Exposes domain getters (config access, GV layer access) and orchestration methods (layer deletion, querying, filtering, layer highlighting via `highlightLayer`/`removeHighlightLayer`, and layer zoom via `zoomToLayerExtent`/`zoomToLayerVisibleScale`).

### LayerCreatorController

No domain subscriptions in `onHook()`. Instead, subscribes to individual `AbstractGeoViewLayer` events per-layer as they are created (e.g., `onLayerEntryRegisterInit`, `onLayerGVCreated`, `onLayerGroupCreated`, `onLayerMessage`). Provides the full layer lifecycle API:

- `loadListOfGeoviewLayer()` — batch-loads layers from map config
- `addGeoviewLayerByGeoCoreUUID()` — resolves a GeoCore UUID and adds the layer
- `addGeoviewLayer()` — adds a single layer from a `TypeGeoviewLayerConfig`
- `reloadGeocoreLayers()` / `reloadLayer()` — reloads GeoCore or individual layers
- `removeLayerUsingPath()` / `removeAllGeoviewLayers()` — removes layers and cleans up store entries (time slider, geochart, swiper, feature info)

Also emits its own events: `onLayerConfigAdded`, `onLayerConfigError`, `onLayerConfigRemoved`, `onLayerCreated`. Static helpers include `createLayerConfigFromType()` and `convertMapConfigsToGeoviewLayerConfig()`.

### LayerSetController

Subscribes to `MapViewer` events (`onMapSingleClick`, `onMapPointerMove`, `onMapPointerStop`) in `onHook()`. Owns four reactive layer set instances:

- `legendsLayerSet` — legend data
- `hoverFeatureInfoLayerSet` — hover queries
- `featureInfoLayerSet` — click queries
- `allFeatureInfoLayerSet` — all-features queries

Also provides `propagateLegendToStore()` to push legend results into the Zustand store.

### PluginController

No domain subscriptions. Manages plugin lifecycle: `loadAndAddPlugin()`, `addPlugin()`, `removePlugin()`, `removePlugins()`. Also exposes a static `loadScript()` for dynamically loading plugin modules.

### DrawerController

Subscribes to `UIDomain.onLanguageChanged()` and subscribes to store projection changes in `onHook()`. Also sets up keyboard event listeners for undo/redo. Provides a comprehensive drawing API (start/stop drawing, editing, style management, transforms, etc.).

### TimeSliderController

No domain subscriptions. Called directly by other controllers or components. Provides `checkInitTimeSliderLayerAndApplyFilters()`, `updateTimeSliderValues()`, and `updateTimeSliderFiltering()`.

## Domains

Domains own business logic and emit events. They have no knowledge of controllers or the Zustand store.

### UIDomain

Manages internationalization (i18n) and display language.

- **State**: i18n instance, current display language
- **Events**: `onLanguageChanged` / `offLanguageChanged`
- **Methods**: `getLanguage()`, `setLanguage()`, `addLocalizeRessourceBundle()`

### LayerDomain

Manages layer registrations, lifecycle, and property change events. Owns three registries:

- `#layerEntryConfigs` — layer configurations by path
- `#gvLayers` — GeoView layer wrappers by path
- `#olLayers` — OpenLayers layers by path

When a layer is registered via `registerGVLayer()`, the domain subscribes to the layer's own events (name changed, visibility changed, opacity changed, queryable changed, etc.) and re-emits them as domain-level events. Controllers then subscribe to these domain events.

**Event flow example:**

```
GVLayer emits onLayerVisibleChanged
  ↓
LayerDomain.#handleLayerVisibleChanged receives it
  ↓
LayerDomain.#emitLayerVisibleChanged re-emits as domain event
  ↓
LayerController.#handleLayerVisibleChanged receives it
  ↓
LayerController updates the store via setStoreLayerVisibility()
  ↓
React component re-renders via useLayerVisible() hook
```

## File Structure

```
packages/geoview-core/src/
├── core/
│   ├── controllers/
│   │   ├── base/
│   │   │   ├── abstract-controller.ts          # Minimal hook/unhook lifecycle
│   │   │   ├── abstract-map-viewer-controller.ts # + MapViewer access
│   │   │   ├── controller-registry.ts          # Creates, owns, hooks all controllers
│   │   │   └── controller-manager.ts           # React context & useControllers() hook
│   │   ├── map-controller.ts                   # Zoom, projection, click markers, basemap
│   │   ├── ui-controller.ts                    # UI domain → store (language, panels, etc.)
│   │   ├── layer-controller.ts                 # Layer domain → store (15+ events, highlighting, zoom)
│   │   ├── layer-creator-controller.ts         # Layer creation, removal, reload, GeoCore
│   │   ├── layer-set-controller.ts             # Map events → feature info queries & legends
│   │   ├── plugin-controller.ts                # Plugin loading & lifecycle
│   │   ├── data-table-controller.ts            # Data table filter operations
│   │   ├── drawer-controller.ts                # Drawing tools (conditional — drawer plugin)
│   │   ├── time-slider-controller.ts           # Temporal filtering (conditional — time-slider plugin)
│   │   └── use-controllers.ts                  # Individual React hooks (useMapController, etc.)
│   ├── domains/
│   │   ├── ui-domain.ts                        # Language/i18n management & events
│   │   └── layer-domain.ts                     # Layer lifecycle, registries & events
│   └── stores/
│       ├── geoview-store.ts                    # Store composition (all slices)
│       ├── stores-managers.ts                  # Store registry (getGeoViewStore)
│       └── store-interface-and-intial-values/  # State slices
│           ├── map-state.ts                    # useMapZoom(), getStoreMapZoom(), etc.
│           ├── layer-state.ts                  # useLayerLegendLayers(), etc.
│           ├── ui-state.ts                     # useUIActiveFooterBarTab(), etc.
│           ├── feature-info-state.ts
│           ├── data-table-state.ts
│           ├── time-slider-state.ts            # Plugin state
│           └── ...
└── geo/
    └── map/
        └── map-viewer.ts                       # Creates ControllerRegistry, calls hookControllers()
```

## See Also

- **[Using Zustand Store](using-store.md)** — Store patterns and practices
- **[Layer Set Architecture](layerset-architecture.md)** — Layer data synchronization via layer sets
- **[Best Practices](best-practices.md)** — General coding standards
- **[Event Helper](event-helper.md)** — Delegate event system
