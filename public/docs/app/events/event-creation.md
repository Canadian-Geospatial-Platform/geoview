## How to Add a New Event to `LayerApi`

The `LayerApi` class uses a consistent pattern for event handling, based on:

- **Event types** (event payloads)
- **Delegate types** (callback signatures)
- **Private handler arrays** (to store callbacks)
- **Emit, on, and off methods** (to trigger and manage handlers)

### 1. Define the Event and Delegate Types

At the bottom of `layer.ts`, you'll find type definitions for each event.  
**Example:**

```typescript
/**
 * Define an event for the delegate
 */
export type LayerSomethingEvent = {
  // Add your event properties here
  layerPath: string;
  value: number;
};

/**
 * Define a delegate for the event handler function signature
 */
export type LayerSomethingDelegate = EventDelegateBase<
  LayerApi,
  LayerSomethingEvent,
  void
>;
```

### 2. Add a Private Handler Array

In the `LayerApi` class, add a private array to store the event's handlers:

```typescript
#onLayerSomethingHandlers: LayerSomethingDelegate[] = [];
```

### 3. Add Emit, on, and off Methods

Add three methods to `LayerApi` for your event:

- **Emit:** Calls all registered handlers.
- **on:** Registers a handler.
- **off:** Unregisters a handler.

```typescript
/**
 * Emits the LayerSomething event to all handlers.
 * @param {LayerSomethingEvent} event - The event to emit
 */
#emitLayerSomething(event: LayerSomethingEvent): void {
  EventHelper.emitEvent(this, this.#onLayerSomethingHandlers, event);
}

/**
 * Registers a LayerSomething event handler.
 * @param {LayerSomethingDelegate} callback - The callback to be executed whenever the event is emitted
 */
onLayerSomething(callback: LayerSomethingDelegate): void {
  EventHelper.onEvent(this.#onLayerSomethingHandlers, callback);
}

/**
 * Unregisters a LayerSomething event handler.
 * @param {LayerSomethingDelegate} callback - The callback to stop being called whenever the event is emitted
 */
offLayerSomething(callback: LayerSomethingDelegate): void {
  EventHelper.offEvent(this.#onLayerSomethingHandlers, callback);
}
```

### 4. Emit the Event Where Needed

Call `this.#emitLayerSomething({ ... })` at the appropriate place in your logic.

---

## Summary Table

| Step | What to Add/Do                        | Where                           |
| ---- | ------------------------------------- | ------------------------------- |
| 1    | Event & Delegate types                | Bottom of `layer.ts`            |
| 2    | Private handler array                 | As class property in `LayerApi` |
| 3    | `#emit...`, `on...`, `off...` methods | As class methods in `LayerApi`  |
| 4    | Call emit method                      | Where your event should fire    |

---

**Tip:**  
Look at existing events like `LayerConfigErrorEvent` and `LayerConfigErrorDelegate` for reference.

To respond to your new event, register a listener using the corresponding `on...` method on your `LayerApi` instance. For example, to listen for `LayerConfigErrorEvent`:

```typescript
// Assuming 'layerApi' is your LayerApi instance
layerApi.onLayerConfigError((sender, event) => {
  // Handle the error event here
  console.error("Layer config error:", event);
});
```

To remove the listener, use the corresponding `off...` method:

```typescript
const handler = (sender, event) => {
  /* ... */
};
layerApi.onLayerConfigError(handler);
// Later, to remove:
layerApi.offLayerConfigError(handler);
```

**Note:**  
Replace `onLayerConfigError` and `offLayerConfigError` with your event's specific methods (e.g., `onLayerSomething`, `offLayerSomething`) as needed.

---

This pattern ensures all events are strongly typed, discoverable, and managed consistently.
