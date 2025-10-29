# Event Processor Architecture

> **👥 Audience:** Core developers contributing to GeoView
>
> **For API Users:** See [Event Processors API](../app/doc-new/event-processors.md) for usage documentation

This document explains the internal architecture of Event Processors, how they integrate with the Zustand store, and how to create custom processors.

## Architecture Overview

### The Event Processor Paradigm

GeoView uses a modified Zustand pattern with Event Processors sitting between components and store actions:

```
UI Component ──> MapState.actions ──> EventProcessor ──> MapState.setterActions
Backend Code ──> EventProcessor ──> MapState.setterActions
MapViewer Events ──> EventProcessor ──> MapState.setterActions
```

### Design Principles

1. **UI components** should:

   - Read state values directly from `MapState` (or other state slices)
   - Call `MapState.actions` to modify state (which redirects to Event Processors)
   - Never import or call Event Processor static methods directly

2. **Backend code** should:

   - Use Event Processor static methods directly
   - These methods access state and call `setterActions`
   - Never access `MapState.actions`

3. **Event Processors** serve as the single source of truth for:
   - Complex state modifications
   - Actions that affect both store and map
   - Centralized business logic
   - State subscriptions and side effects

### Why This Pattern?

**Benefits:**

- ✅ Single source of truth for business logic
- ✅ Separation of UI concerns from state management
- ✅ Easier testing (mock Event Processors instead of store)
- ✅ Centralized side effects (logging, analytics, map updates)
- ✅ Type-safe state access

**Compared to Direct Store Access:**

```typescript
// ❌ Bad: Direct store manipulation (no validation, no side effects)
store.setState({ mapState: { zoom: 10 } });

// ✅ Good: Through Event Processor (validation, logging, map sync)
MapEventProcessor.setZoom("mapId", 10);
```

## Base Class: AbstractEventProcessor

All Event Processors extend `AbstractEventProcessor`, which provides core functionality:

### Class Structure

```typescript
export abstract class AbstractEventProcessor {
  // Store reference
  private static stores: Map<string, GeoviewStoreType> = new Map();

  // Subscription cleanup
  private static subscriptions: Map<string, Array<() => void>> = new Map();

  // Core lifecycle methods
  static initialize(mapId: string, store: GeoviewStoreType): void;
  static destroy(mapId: string): void;

  // Protected methods for subclasses
  protected static getState(mapId: string): IGeoviewState;
  protected static getStateAsync(mapId: string): Promise<IGeoviewState>;

  // Hooks for subclasses to override
  protected onInitialize?(store: GeoviewStoreType): Array<() => void>;
  protected onDestroy?(): void;
}
```

### Lifecycle Methods

#### `initialize(mapId: string, store: GeoviewStoreType)`

Called when a map is created. Stores the reference and calls `onInitialize()` hook.

```typescript
// Called automatically by GeoView on map creation
MapEventProcessor.initialize("mapId", store);
```

#### `destroy(mapId: string)`

Called when a map is destroyed. Cleans up subscriptions and calls `onDestroy()` hook.

```typescript
// Called automatically by GeoView on map destruction
MapEventProcessor.destroy("mapId");
```

### State Access Methods

#### `getState(mapId: string): IGeoviewState`

Synchronously get the complete state for a map. Throws error if store not found.

```typescript
protected static getMapState(mapId: string): TypeMapState {
  return super.getState(mapId).mapState;
}
```

#### `getStateAsync(mapId: string): Promise<IGeoviewState>`

Asynchronously wait for state to be available. Useful during initialization.

```typescript
const state = await super.getStateAsync(mapId);
```

## Creating Custom Event Processors

### Basic Template

```typescript
import { AbstractEventProcessor } from "@/api/event-processors/abstract-event-processor";
import type { GeoviewStoreType } from "@/core/stores/geoview-store";
import type { ICustomState } from "@/core/stores/store-interface-and-intial-values/custom-state";

export class CustomEventProcessor extends AbstractEventProcessor {
  // ============================================
  // #region PRIVATE/PROTECTED METHODS
  // ============================================

  /**
   * Protected method to get state slice
   * @param {string} mapId - The map identifier
   * @returns {ICustomState} The custom state slice
   * @private
   */
  protected static getCustomState(mapId: string): ICustomState {
    return super.getState(mapId).customState;
  }

  /**
   * Overrides when the event processor is initialized
   * @param {GeoviewStoreType} store - The store associated with the event processor init
   * @returns Array of subscriptions cleanup functions
   * @protected
   */
  protected override onInitialize(store: GeoviewStoreType): Array<() => void> {
    const subscriptions: Array<() => void> = [];

    // Example: Subscribe to state changes
    const unsub = store.subscribe(
      (state) => state.customState.someValue,
      (newValue, prevValue) => {
        // React to changes
        console.log("Value changed from", prevValue, "to", newValue);

        // Perform side effects
        this.handleValueChange(store.getState().mapId, newValue);
      }
    );

    subscriptions.push(unsub);
    return subscriptions;
  }

  /**
   * Overrides when the event processor is destroyed
   * @protected
   */
  protected override onDestroy(): void {
    // Custom cleanup logic
    console.log("CustomEventProcessor destroyed");

    // Don't forget to call parent
    super.onDestroy();
  }

  /**
   * Internal helper method
   * @param {string} mapId - Map identifier
   * @param {string} value - The new value
   * @private
   */
  private static handleValueChange(mapId: string, value: string): void {
    // Complex business logic here
  }

  // #endregion

  // ============================================
  // #region PUBLIC STATIC METHODS (API)
  // ============================================

  /**
   * Get some value from state
   * @param {string} mapId - The map identifier
   * @returns {string} The current value
   */
  static getSomeValue(mapId: string): string {
    return this.getCustomState(mapId).someValue;
  }

  /**
   * Set some value in state
   * @param {string} mapId - The map identifier
   * @param {string} value - The new value
   */
  static setSomeValue(mapId: string, value: string): void {
    // Validation
    if (!value) {
      throw new Error("Value cannot be empty");
    }

    // Call setter action
    this.getCustomState(mapId).setterActions.setSomeValue(value);

    // Log action
    logger.logInfo("Set some value:", value);
  }

  /**
   * Complex operation involving multiple state updates
   * @param {string} mapId - The map identifier
   * @param {CustomConfig} config - Configuration object
   */
  static performComplexOperation(mapId: string, config: CustomConfig): void {
    const state = this.getCustomState(mapId);

    // Multiple state updates in sequence
    state.setterActions.setSomeValue(config.value);
    state.setterActions.setOtherValue(config.otherValue);

    // Coordinate with other processors
    MapEventProcessor.setView(mapId, config.center, config.zoom);

    // Emit event
    const mapViewer = MapEventProcessor.getMapViewer(mapId);
    mapViewer.onCustomEvent.emit({ config });
  }

  // #endregion
}
```

### Advanced Patterns

#### Pattern 1: State Subscriptions with Side Effects

```typescript
protected override onInitialize(store: GeoviewStoreType): Array<() => void> {
  const subscriptions: Array<() => void> = [];
  const mapId = store.getState().mapId;

  // Subscribe to layer changes
  const unsubLayers = store.subscribe(
    (state) => state.legendState.legendLayers,
    (newLayers) => {
      // Update map when legend layers change
      this.syncMapWithLegend(mapId, newLayers);
    }
  );

  // Subscribe to multiple values
  const unsubMultiple = store.subscribe(
    (state) => [state.mapState.zoom, state.mapState.center],
    ([zoom, center]) => {
      // React to view changes
      this.handleViewChange(mapId, zoom, center);
    }
  );

  subscriptions.push(unsubLayers, unsubMultiple);
  return subscriptions;
}
```

#### Pattern 2: Coordinating Multiple State Slices

```typescript
static complexUpdate(mapId: string, config: ComplexConfig): void {
  // Get multiple state slices
  const mapState = this.getState(mapId).mapState;
  const legendState = this.getState(mapId).legendState;
  const uiState = this.getState(mapId).uiState;

  // Coordinate updates across slices
  mapState.setterActions.setZoom(config.zoom);
  legendState.setterActions.setSelectedLayer(config.layerPath);
  uiState.setterActions.openPanel('details');

  // Perform map operations
  const mapViewer = MapEventProcessor.getMapViewer(mapId);
  mapViewer.map.getView().animate({ zoom: config.zoom });
}
```

#### Pattern 3: Async Operations

```typescript
static async loadAndProcessData(mapId: string, url: string): Promise<void> {
  // Get state
  const state = this.getCustomState(mapId);

  // Set loading state
  state.setterActions.setLoading(true);

  try {
    // Fetch data
    const response = await fetch(url);
    const data = await response.json();

    // Process and update state
    state.setterActions.setData(data);
    state.setterActions.setError(null);

    // Log success
    logger.logInfo('Data loaded successfully');
  } catch (error) {
    // Handle error
    state.setterActions.setError(error.message);
    logger.logError('Failed to load data:', error);
  } finally {
    // Clear loading state
    state.setterActions.setLoading(false);
  }
}
```

#### Pattern 4: Batch Updates with Transaction

```typescript
static batchUpdate(mapId: string, updates: CustomUpdate[]): void {
  const state = this.getCustomState(mapId);

  // Use transaction to batch updates (if supported by state slice)
  state.setterActions.transaction(() => {
    updates.forEach((update) => {
      state.setterActions.updateItem(update.id, update.data);
    });
  });

  // Emit single event after batch
  const mapViewer = MapEventProcessor.getMapViewer(mapId);
  mapViewer.onBatchUpdate.emit({ count: updates.length });
}
```

## Integration with Store

### Store Structure

Event Processors work with this store structure:

```typescript
interface IGeoviewState {
  mapState: {
    actions: MapActions; // Redirects to MapEventProcessor
    setterActions: MapSetters; // Direct state setters
    // ... state values
  };
  legendState: {
    actions: LegendActions;
    setterActions: LegendSetters;
    // ... state values
  };
  // ... other slices
}
```

### Action Redirects

UI components call `actions`, which redirect to Event Processors:

```typescript
// In map-state.ts
const mapState = {
  actions: {
    setZoom: (zoom: number) => {
      MapEventProcessor.setZoom(store.getState().mapId, zoom);
    },
    setCenter: (center: Coordinate) => {
      MapEventProcessor.setCenter(store.getState().mapId, center);
    },
  },
  setterActions: {
    setZoom: (zoom: number) => set({ zoom }),
    setCenter: (center: Coordinate) => set({ center }),
  },
};
```

### Why Two Sets of Actions?

1. **`actions`** - Public API for UI components

   - Goes through Event Processor
   - Includes validation and business logic
   - Triggers side effects
   - Centralized logging

2. **`setterActions`** - Internal state updates
   - Direct store modifications
   - No side effects
   - Used by Event Processors only
   - Fast and predictable

## Best Practices

### DO ✅

1. **Keep Event Processors static**

   ```typescript
   static getSomeValue(mapId: string) { }  // ✅ Good
   ```

2. **Use protected methods for state access**

   ```typescript
   protected static getCustomState(mapId: string) { }  // ✅ Good
   ```

3. **Validate inputs**

   ```typescript
   static setValue(mapId: string, value: string): void {
     if (!value) throw new Error('Value required');
     // ...
   }
   ```

4. **Log important actions**

   ```typescript
   static performAction(mapId: string): void {
     logger.logInfo('Performing action on map:', mapId);
     // ...
   }
   ```

5. **Handle errors gracefully**
   ```typescript
   static riskyOperation(mapId: string): void {
     try {
       // operation
     } catch (error) {
       logger.logError('Operation failed:', error);
       throw error; // Re-throw after logging
     }
   }
   ```

### DON'T ❌

1. **Don't create instance methods**

   ```typescript
   getSomeValue() { }  // ❌ Bad - should be static
   ```

2. **Don't expose state directly**

   ```typescript
   static getState(mapId: string) {
     return super.getState(mapId);  // ❌ Bad - too much access
   }
   ```

3. **Don't create circular dependencies**

   ```typescript
   // ❌ Bad
   MapEventProcessor -> LegendEventProcessor -> MapEventProcessor
   ```

4. **Don't forget cleanup**

   ```typescript
   protected override onDestroy(): void {
     // ❌ Bad - forgot to call super
     // Custom cleanup only
   }

   protected override onDestroy(): void {
     // ✅ Good
     super.onDestroy(); // Always call parent
   }
   ```

## Testing Event Processors

### Unit Testing

```typescript
import { MapEventProcessor } from "@/api/event-processors/event-processor-children/map-event-processor";
import { createMockStore } from "@/test-utils/mock-store";

describe("MapEventProcessor", () => {
  let store: GeoviewStoreType;
  const mapId = "test-map";

  beforeEach(() => {
    store = createMockStore();
    MapEventProcessor.initialize(mapId, store);
  });

  afterEach(() => {
    MapEventProcessor.destroy(mapId);
  });

  it("should set zoom level", () => {
    MapEventProcessor.setZoom(mapId, 10);
    const state = MapEventProcessor.getMapState(mapId);
    expect(state.zoom).toBe(10);
  });

  it("should validate zoom level", () => {
    expect(() => {
      MapEventProcessor.setZoom(mapId, -1);
    }).toThrow("Invalid zoom level");
  });
});
```

### Integration Testing

```typescript
describe("MapEventProcessor Integration", () => {
  it("should coordinate map and legend updates", () => {
    const mapId = "test-map";

    // Perform action
    MapEventProcessor.setLayerOpacity(mapId, "layer-path", 0.5);

    // Verify map state updated
    const mapState = MapEventProcessor.getMapState(mapId);
    expect(mapState.layers["layer-path"].opacity).toBe(0.5);

    // Verify legend state updated
    const legendState = LegendEventProcessor.getLegendLayerInfo(
      mapId,
      "layer-path"
    );
    expect(legendState.opacity).toBe(0.5);
  });
});
```

## See Also

- **[Event Processors API](../app/doc-new/event-processors.md)** - Public API documentation
- **[Using Zustand Store](./using-store.md)** - Store patterns and practices
- **[Best Practices](./best-practices.md)** - General coding standards
- **[TypeScript Patterns](./using-type.md)** - TypeScript conventions
