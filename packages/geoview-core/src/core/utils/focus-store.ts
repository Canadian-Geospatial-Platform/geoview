import { useSyncExternalStore } from 'react';

/**
 * Listener function type for focus store subscriptions.
 *
 * Matches the EventHelper pattern of notifying listeners via callback iteration.
 */
export type FocusStoreListener = () => void;

/**
 * Focus store instance for tracking which single ID among many siblings is currently active.
 *
 * Consumers subscribe via `useSyncExternalStore` and only re-render when the specific ID
 * they're tracking changes state (not on every focus change in the parent container).
 */
export type FocusStore<TId = string> = {
  /** Sets the currently active ID, or null to clear. */
  setActive: (id: TId | null) => void;
  /** Subscribes a listener to active state changes. Returns an unsubscribe function. */
  subscribe: (listener: FocusStoreListener) => () => void;
  /** Checks if a given ID is currently active. */
  isActive: (id: TId) => boolean;
};

/**
 * Creates a minimal external store for tracking "which single ID among many siblings is currently active."
 *
 * This pattern enables surgical re-renders via `useSyncExternalStore` — only the one sibling
 * whose active state changed re-renders, not all siblings. Useful for focus tracking, hover state,
 * active selection, or any scenario where one item among many is "current."
 *
 * The listener notification pattern matches EventHelper's approach: when state changes, iterate
 * through the listener set and call each one. React's `useSyncExternalStore` automatically calls
 * `getSnapshot()` (in this case, `isActive(id)`) after notification to read the new state.
 *
 * @returns FocusStore object with setActive, subscribe, and isActive methods
 *
 * @example
 * // Create store instance (typically in a ref or module-level const)
 * const focusStore = createFocusStore<string>();
 *
 * // In React component — subscribe to a specific ID's active state
 * const isFocused = useIsActive(focusStore, 'cell-123');
 *
 * // Set active state (e.g., on focus event)
 * focusStore.setActive('cell-123');
 *
 * // Clear active state
 * focusStore.setActive(null);
 *
 * @example
 * // Generic ID type for numeric IDs
 * const markerStore = createFocusStore<number>();
 * markerStore.setActive(42);
 * const isMarkerActive = useIsActive(markerStore, 42); // true
 */
export function createFocusStore<TId = string>(): FocusStore<TId> {
  let current: TId | null = null;
  const listeners = new Set<FocusStoreListener>();

  return {
    setActive(id: TId | null): void {
      if (id === current) return;
      current = id;
      // Notify all listeners (matches EventHelper iteration pattern)
      listeners.forEach((listener) => listener());
    },
    subscribe(listener: FocusStoreListener): () => void {
      listeners.add(listener);
      // Return unsubscribe function (required by useSyncExternalStore contract)
      return () => listeners.delete(listener);
    },
    isActive(id: TId): boolean {
      return current === id;
    },
  };
}

/**
 * Subscribes to whether a specific ID is currently active in the focus store.
 *
 * Only triggers a re-render when this particular ID's active state flips (becomes active
 * or stops being active). Other IDs' state changes do not trigger re-renders for this hook.
 *
 * @param store - The focus store instance to subscribe to
 * @param id - The ID to track (cell ID, header ID, marker ID, etc.)
 * @returns Whether the given ID is currently active
 *
 * @example
 * // In a table cell component
 * function TableCell({ cellId, content }: Props): JSX.Element {
 *   const isFocused = useIsActive(focusStore, cellId);
 *   return <td className={isFocused ? 'focused' : ''}>{content}</td>;
 * }
 */
export function useIsActive<TId = string>(store: FocusStore<TId>, id: TId): boolean {
  return useSyncExternalStore(store.subscribe, () => store.isActive(id));
}
