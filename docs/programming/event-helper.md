# Event Helper — Delegate Event System

> **Audience:** GeoView core developers

GeoView uses a lightweight, fully typed delegate event system built on `EventHelper` static methods. There are no external event libraries — events are simple typed callback arrays managed by each class that owns them.

## Core Concepts

### EventDelegateBase

All delegate types extend this base generic:

```ts
export type EventDelegateBase<T, U, Z> = (sender: T, event: U) => Z;
```

- `T` — Sender class (the object emitting the event)
- `U` — Event payload type (`undefined` for events with no data)
- `Z` — Return type (typically `void`)

### EventHelper Static Methods

`EventHelper` (in `packages/geoview-core/src/api/events/event-helper.ts`) provides three static methods:

```ts
// Register a callback for an event
EventHelper.onEvent(handlersList, callback);

// Unregister a callback
EventHelper.offEvent(handlersList, callback);

// Emit an event to all registered handlers
EventHelper.emitEvent(sender, handlersList, event);
```

## How to Add Events to a Class

### Step 1 — Define delegate types

Define typed delegate aliases at the bottom of your file (or in a shared types file):

```ts
export type LayerNameChangedDelegate = EventDelegateBase<
  AbstractBaseGVLayer,
  LayerNameChangedEvent,
  void
>;
export type LayerVisibleChangedDelegate = EventDelegateBase<
  AbstractBaseGVLayer,
  LayerVisibleChangedEvent,
  void
>;
```

### Step 2 — Define event payload types

```ts
export type LayerNameChangedEvent = {
  layerPath: string;
  layerName: string;
};

export type LayerVisibleChangedEvent = {
  layerPath: string;
  visible: boolean;
};
```

### Step 3 — Add private handler arrays and emit methods

```ts
export class MyLayer extends AbstractBaseGVLayer {
  /** Callback delegates for the layer name changed event. */
  #onLayerNameChangedHandlers: LayerNameChangedDelegate[] = [];

  /** Callback delegates for the visible changed event. */
  #onLayerVisibleChangedHandlers: LayerVisibleChangedDelegate[] = [];

  /**
   * Emits a layer name changed event to all handlers.
   */
  #emitLayerNameChanged(event: LayerNameChangedEvent): void {
    EventHelper.emitEvent(this, this.#onLayerNameChangedHandlers, event);
  }

  /**
   * Emits a layer visible changed event to all handlers.
   */
  #emitLayerVisibleChanged(event: LayerVisibleChangedEvent): void {
    EventHelper.emitEvent(this, this.#onLayerVisibleChangedHandlers, event);
  }
}
```

### Step 4 — Expose public on/off methods

```ts
  /**
   * Registers a callback for the layer name changed event.
   */
  onLayerNameChanged(callback: LayerNameChangedDelegate): void {
    EventHelper.onEvent(this.#onLayerNameChangedHandlers, callback);
  }

  /**
   * Unregisters a callback from the layer name changed event.
   */
  offLayerNameChanged(callback: LayerNameChangedDelegate): void {
    EventHelper.offEvent(this.#onLayerNameChangedHandlers, callback);
  }
```

### Step 5 — Emit when state changes

```ts
  setLayerName(name: string): void {
    this.#layerName = name;
    this.#emitLayerNameChanged({ layerPath: this.getLayerPath(), layerName: name });
  }
```

## Real-World Examples

### MapViewer Events

`MapViewer` defines map-level events (`packages/geoview-core/src/geo/map/map-viewer.ts`):

```ts
// Delegate types
export type MapInitDelegate = EventDelegateBase<MapViewer, undefined, void>;
export type MapMoveEndDelegate = EventDelegateBase<MapViewer, MapMoveEndEvent, void>;
export type MapZoomEndDelegate = EventDelegateBase<MapViewer, MapZoomEndEvent, void>;

// Private arrays
#onMapInitHandlers: MapInitDelegate[] = [];
#onMapMoveEndHandlers: MapMoveEndDelegate[] = [];

// Public subscribe/unsubscribe
onMapInit(callback: MapInitDelegate): void {
  EventHelper.onEvent(this.#onMapInitHandlers, callback);
}
offMapInit(callback: MapInitDelegate): void {
  EventHelper.offEvent(this.#onMapInitHandlers, callback);
}

// Private emit
#emitMapInit(): void {
  EventHelper.emitEvent(this, this.#onMapInitHandlers, undefined);
}
```

### Subscribing from a Controller

Controllers subscribe to events in their `onHook()` lifecycle method and unsubscribe in `onUnhook()`:

```ts
override onHook(): void {
  // Subscribe to layer events
  this.getMapViewer().onMapMoveEnd(this.#boundedHandleMapMoveEnd);
}

override onUnhook(): void {
  // Unsubscribe to prevent memory leaks
  this.getMapViewer().offMapMoveEnd(this.#boundedHandleMapMoveEnd);
}
```

### Subscribing from a React Component

```ts
useEffect(() => {
  logger.logTraceUseEffect("COMPONENT - subscribe to map move end");

  const handleMoveEnd = (sender: MapViewer, event: MapMoveEndEvent): void => {
    setCenter(event.center);
  };

  mapViewer.onMapMoveEnd(handleMoveEnd);

  return () => {
    mapViewer.offMapMoveEnd(handleMoveEnd);
  };
}, [mapViewer]);
```

## Architecture Rules

1. **Only the owning class can emit events** — emit methods are always `#private`
2. **on/off methods are public** — any consumer can subscribe/unsubscribe
3. **Handler arrays are private** — stored as `#onXxxHandlers` to prevent external manipulation
4. **Always unsubscribe** — use `offEvent` in cleanup (`onUnhook()`, `useEffect` return) to prevent memory leaks
5. **Store callback references** — keep a reference to the bound callback so you can pass the same reference to `offEvent`
6. **Type safety** — delegate types enforce correct sender, payload, and return types at compile time

## Naming Conventions

| Element            | Pattern                  | Example                 |
| ------------------ | ------------------------ | ----------------------- |
| Delegate type      | `{EventName}Delegate`    | `MapMoveEndDelegate`    |
| Event payload type | `{EventName}Event`       | `MapMoveEndEvent`       |
| Handler array      | `#on{EventName}Handlers` | `#onMapMoveEndHandlers` |
| Subscribe method   | `on{EventName}`          | `onMapMoveEnd()`        |
| Unsubscribe method | `off{EventName}`         | `offMapMoveEnd()`       |
| Emit method        | `#emit{EventName}`       | `#emitMapMoveEnd()`     |

## See Also

- **[Using Zustand Store](programming/using-store.md)** — Store access patterns
- **[Layer Set Architecture](programming/layerset-architecture.md)** — Layer sets use this event system
- **[Best Practices](programming/best-practices.md)** — Coding standards
