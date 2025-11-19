# Using Zustand Store

> ** Audience:** GeoView core developers
>
> **For API Users:** See [Event Processors](app/events/event-processors.md) for the public API approach to state management.

We use [Zustand](https://github.com/pmndrs/zustand) store for our state management. We define a list of functions and concept to follow....
For this reason we have put together some explanations here to help you use store functionnalities when programming.

## Dev tools

For access to store values from within the browser you should use React Developer Tools to inspect React components.
The `store` is active when (1) running in dev environment or (2) the local storage `GEOVIEW_DEVTOOLS` key is set.

## Characteristics to know when using the React and Zustand store

useStore hook for variable linked to UI and can be updated from another component.

useState hook for variable linked to UI and only referenced in your component.

useEffect hook

- Put all const that use new keyword or do something in your component in useEffect with empty bracket dependencies useEffect(..., []). This will allow to run the code only once when component is mounted.
- Put store subscribe in useEffect with empty bracket and unsubcribe on return when component is unmount.

## Store and ts files

No store leakage in ts file, always use the static method in the needed event processor
**ts file**

```ts
  /**
   * Hide a click marker from the map
   */
  clickMarkerIconHide(): void {
    MapEventProcessor.clickMarkerIconHide(this.mapId);
  }

  /**
   * Show a marker on the map
   * @param {TypeClickMarker} marker the marker to add
   */
  clickMarkerIconShow(marker: TypeClickMarker): void {
    MapEventProcessor.clickMarkerIconShow(this.mapId, marker);
  }
```

**event processor file**

```ts
  // **********************************************************
  // Static functions for Typescript files to set store values
  // **********************************************************
  static clickMarkerIconHide(mapId: string) {
    const store = getGeoViewStore(mapId);
    store.getState().mapState.actions.hideClickMarker();
  }

  static clickMarkerIconShow(mapId: string, marker: TypeClickMarker) {
    const store = getGeoViewStore(mapId);
    store.getState().mapState.actions.showClickMarker(marker);
  }
  ...
```

**store interface file**

```ts
export interface IMapState {
  ...
  clickMarker: TypeClickMarker | undefined;
  ...

  actions: {
    hideClickMarker: () => void;
    ...
    showClickMarker: (marker: TypeClickMarker) => void;
    ...
  };
}

export function initializeMapState(set: TypeSetStore, get: TypeGetStore) {
  const init = {
    ...
    clickMarker: undefined,
    ...

    actions: {
      hideClickMarker: () => {
        set({
          mapState: { ...get().mapState, clickMarker: undefined },
        });
      },
      ...
      showClickMarker: (marker: TypeClickMarker) => {
        set({
          mapState: { ...get().mapState, clickMarker: marker },
        });
      },
      ...
    }
  }
}

// **********************************************************
// Map state selectors
// **********************************************************
...
export const useMapClickMarker = () => useStore(useGeoViewStore(), (state) => state.mapState.clickMarker);
...

export const useMapStoreActions = () => useStore(useGeoViewStore(), (state) => state.mapState.actions);
```

**component file**

```ts
// get values and actions from the store
const clickMarker = useMapClickMarker();
const { hideClickMarker, showClickMarker } = useMapStoreActions();
```

## Store and components

TO COME

## See Also

- **[Event Processors](app/events/event-processors.md)** - Public API for state management
- **[Best Practices](programming/best-practices.md)** - Coding standards
- **[Using TypeScript](programming/using-type.md)** - TypeScript patterns
