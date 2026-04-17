# Using Zustand Store

> **Audience:** GeoView core developers

We use [Zustand](https://github.com/pmndrs/zustand) store for our state management. The store is split into slices (map, layer, UI, etc.) with three access patterns: **selector hooks** for React components, **getter/setter functions** for controllers, and **controller methods** for mutations.

## Dev tools

For access to store values from within the browser you should use React Developer Tools to inspect React components.
The `store` is active when (1) running in dev environment or (2) the local storage `GEOVIEW_DEVTOOLS` key is set.

## Characteristics to know when using the React and Zustand store

useStore hook for variable linked to UI and can be updated from another component.

useState hook for variable linked to UI and only referenced in your component.

useEffect hook

- Put all const that use new keyword or do something in your component in useEffect with empty bracket dependencies useEffect(..., []). This will allow to run the code only once when component is mounted.
- Put store subscribe in useEffect with empty bracket and unsubcribe on return when component is unmount.

## Three Function Types per Store Slice

Each store state file in `src/core/stores/store-interface-and-intial-values/` exports three types of functions:

### Selector Hooks (`useStore*`) — React components only

Fine-grained hooks that trigger re-renders when the selected state changes.

```ts
// Pattern: useStore[SliceName][PropertyName]
export const useStoreMapZoom = (): number =>
  useStore(useGeoViewStore(), (state) => state.mapState.zoom);

export const useStoreMapClickMarker = (): TypeClickMarker | undefined =>
  useStore(useGeoViewStore(), (state) => state.mapState.clickMarker);
```

### Getter Functions (`getStore*`) — controllers and non-React code

Point-in-time snapshots. Takes `mapId` as first parameter.

```ts
export const getStoreMapZoom = (mapId: string): number =>
  getStoreMapState(mapId).zoom;

export const getStoreMapOrderedLayerInfo = (
  mapId: string,
): TypeOrderedLayerInfo[] => getStoreMapState(mapId).orderedLayerInfo;
```

### Setter Functions (`setStore*`) — controllers only

Mutate state via internal actions. Takes `mapId` as first parameter. **Never call these from React components.**

```ts
export const setStoreMapZoom = (mapId: string, zoom: number): void => {
  getStoreMapState(mapId).actions.setZoom(zoom);
};

export const setStoreMapClickMarker = (
  mapId: string,
  marker: TypeClickMarker,
): void => {
  getStoreMapState(mapId).actions.showClickMarker(marker);
};
```

## Store Access Patterns

### React Components — read via hooks, mutate via controllers

Components read state through `useStore*` selector hooks and mutate through controller methods. **Never call `setStore*` functions directly from components.**

```ts
import { useStoreMapZoom, useStoreMapClickMarker } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useMapController } from '@/core/controllers/use-controllers';

export function MyComponent(): JSX.Element {
  // Read state — re-renders when values change
  const zoom = useStoreMapZoom();
  const clickMarker = useStoreMapClickMarker();

  // Get controller for mutations
  const mapController = useMapController();

  const handleZoom = useCallback((): void => {
    mapController.zoomToExtent(extent);
  }, [mapController]);

  return <Box onClick={handleZoom}>Zoom: {zoom}</Box>;
}
```

### Controllers — read via getters, mutate via setters

Controllers import `getStore*` and `setStore*` functions directly. They contain the validation and business logic.

```ts
import {
  getStoreMapZoom,
  setStoreMapZoom,
  setStoreMapProjection,
} from "@/core/stores/store-interface-and-intial-values/map-state";

export class MapController extends AbstractMapViewerController {
  zoomToLevel(zoom: number): void {
    const mapId = this.getMapId();
    const currentZoom = getStoreMapZoom(mapId);

    // Business logic / validation
    if (zoom !== currentZoom) {
      setStoreMapZoom(mapId, zoom);
    }
  }
}
```

### Cross-controller communication — via registry

Inside a controller, access other controllers through `this.getControllersRegistry()`:

```ts
// Inside a controller method
this.getControllersRegistry().mapController.applyLayerFilters(layerPath);
this.getControllersRegistry().uiController.setCircularProgress(true);
```

### Plugins and non-React classes — via `mapViewer.controllers`

```ts
// In a plugin
const layerPaths =
  this.mapViewer.controllers.layerController.getLayerEntryLayerPaths();
this.mapViewer.controllers.timeSliderController?.checkInitTimeSliderLayerAndApplyFilters(
  layer,
  config,
);
```

## Summary Table

| Context                      | Read State                        | Mutate State                                      |
| ---------------------------- | --------------------------------- | ------------------------------------------------- |
| **React component**          | `useStore*` hooks                 | Controller methods via `useMapController()`, etc. |
| **Inside controller**        | `getStore*` getters               | `setStore*` setters                               |
| **Plugin / non-React class** | `this.mapViewer.controllers.*`    | `this.mapViewer.controllers.*` methods            |
| **Test suite**               | `this.getControllersRegistry().*` | Controller methods                                |

**Key rule:** Components never call `setStore*` directly — mutations always go through controller methods.

## See Also

- **[Best Practices](programming/best-practices.md)** - Coding standards
- **[Event Helper](programming/event-helper.md)** - Delegate event system
