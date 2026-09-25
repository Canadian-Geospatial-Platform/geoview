import { useStore } from 'zustand';

import { getGeoViewStore, useGeoViewStore } from '@/core/stores/stores-managers';
import type { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
import { PluginStateUninitializedError } from '@/core/exceptions/geoview-exceptions';
import { logger } from '@/core/utils/logger';

// #region INTERFACE DEFINITION
/** A single layer entry participating in the swiper, with its visible side. */
export type TypeSwiperLayerEntry = {
  /** The layer path participating in the swiper. */
  layerPath: string;
  /** The visible side of the swiper bar for this layer. */
  side: SwipeSide;
};

/**
 * Represents the Swiper Zustand store slice.
  setLayers(entries: TypeSwiperLayerEntry[]): void {
export const setStoreSwiperLayers = (mapId: string, entries: TypeSwiperLayerEntry[]): void => {
 *
 * Manages state for the swiper including layer paths and orientation.
 */
export interface ISwiperState {
  /** The position of the swiper divider, between 0 and 100. */
  swiperPosition: number;

  /** The list of layer paths currently participating in the swiper. */
  layerPaths: string[];

  /** The visible side of the swiper bar for each participating layer path. */
  layerSides: Record<string, SwipeSide>;

  /** The current orientation of the swiper divider. */
  orientation: SwipeOrientation;

  /** Whether the user can add/remove layers and set their side from the layer settings panel. */
  interactive: boolean;

  /** Actions to mutate the Swiper state. */
  actions: {
    /** Sets the swiper position. */
    setSwiperPosition: (position: number) => void;

    /** Sets the full list of layer paths for the swiper. */
    setLayerPaths: (layerPaths: string[]) => void;

    /** Sets the visible side for each participating layer path. */
    setLayerSides: (layerSides: Record<string, SwipeSide>) => void;

    /** Sets the swiper orientation. */
    setOrientation: (orientation: SwipeOrientation) => void;

    /** Sets whether the swiper is interactive (user can customize it). */
    setInteractive: (interactive: boolean) => void;
  };
}

// #endregion INTERFACE DEFINITION

// #region STATE INITIALIZATION

/**
 * Initializes a Swiper state object.
 *
 * @param set - The store set callback function
 * @param get - The store get callback function
 * @returns The Swiper state object
 */
export function initializeSwiperState(set: TypeSetStore, get: TypeGetStore): ISwiperState {
  const init = {
    swiperPosition: 50,
    layerPaths: [],
    layerSides: {},
    orientation: 'vertical',
    interactive: false,

    actions: {
      /**
       * Sets the swiper position in the store.
       *
       * @param position - The new swiper position, between 0 and 1.
       */
      setSwiperPosition(position: number) {
        set({
          swiperState: {
            ...get().swiperState,
            swiperPosition: position,
          },
        });
      },

      /**
       * Sets the layer paths for the swiper.
       *
       * @param layerPaths - The array of layer paths
       */
      setLayerPaths(layerPaths: string[]) {
        set({
          swiperState: {
            ...get().swiperState,
            layerPaths,
          },
        });
      },
      /**
       * Sets the visible side for each participating layer path.
       *
       * @param layerSides - The map of layer path to visible side
       */
      setLayerSides(layerSides: Record<string, SwipeSide>) {
        set({
          swiperState: {
            ...get().swiperState,
            layerSides,
          },
        });
      },
      /**
       * Sets the swiper orientation.
       *
       * @param orientation - The swipe orientation
       */
      setOrientation(orientation: SwipeOrientation) {
        set({
          swiperState: {
            ...get().swiperState,
            orientation,
          },
        });
      },
      /**
       * Sets whether the swiper is interactive.
       *
       * @param interactive - Whether the swiper can be customized by the user
       */
      setInteractive(interactive: boolean) {
        set({
          swiperState: {
            ...get().swiperState,
            interactive,
          },
        });
      },
    },
  } as ISwiperState;

  return init;
}

// #endregion STATE INITIALIZATION

// #region STATE GETTERS & HOOKS
// GV Getters should be used to get the values at a moment in time.
// GV Hooks should be used to attach to values and trigger UI components when they change.
// GV Typically they are listed in couples (getter + hook) for the same value.

/**
 * Returns the full swiper state slice for the given map.
 *
 * Internal-only selector - not exported to avoid direct store access from outside this module.
 *
 * @param mapId - The map identifier.
 * @returns The ISwiperState for the given map.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
// GV No export for the main state!
const getStoreSwiperState = (mapId: string): ISwiperState => {
  const state = getGeoViewStore(mapId).getState().swiperState;
  if (!state) throw new PluginStateUninitializedError('Swiper', mapId);
  return state;
};

/**
 * Checks whether the Swiper plugin state has been initialized for the given map.
 *
 * @param mapId - The map id to check.
 * @returns True if the Swiper state is initialized, false otherwise.
 */
export const isStoreSwiperInitialized = (mapId: string): boolean => {
  try {
    // Get its state, this will throw PluginStateUninitializedError if uninitialized
    getStoreSwiperState(mapId);
    return true;
  } catch {
    // Uninitialized
    return false;
  }
};

/**
 * Gets the swiper position from the store.
 *
 * @param mapId - The map id to read swiper position from.
 * @returns The swiper position as a number.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export const getStoreSwiperPosition = (mapId: string): number => {
  // Return the swiper position from the state
  return getStoreSwiperState(mapId).swiperPosition;
};

/**
 * Gets the swiper layer paths from the store.
 *
 * @param mapId - The map id to read swiper layer paths from.
 * @returns The array of layer paths participating in the swiper.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export const getStoreSwiperLayerPaths = (mapId: string): string[] => {
  // Return the layer paths from the state
  return getStoreSwiperState(mapId).layerPaths;
};

/** Hooks the swiper layer paths from the store. */
export const useStoreSwiperLayerPaths = (): string[] => useStore(useGeoViewStore(), (state) => state.swiperState.layerPaths);

/**
 * Gets the swiper visible sides per layer path from the store.
 *
 * @param mapId - The map id to read swiper layer sides from.
 * @returns The map of layer path to its visible side.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export const getStoreSwiperLayerSides = (mapId: string): Record<string, SwipeSide> => {
  // Return the layer sides from the state
  return getStoreSwiperState(mapId).layerSides;
};

/** Hooks the swiper visible sides per layer path from the store. */
export const useStoreSwiperLayerSides = (): Record<string, SwipeSide> =>
  useStore(useGeoViewStore(), (state) => state.swiperState.layerSides);

/**
 * Gets whether the swiper is interactive from the store.
 *
 * @param mapId - The map id to read the swiper interactive flag from.
 * @returns True when the user can customize the swiper.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export const getStoreSwiperInteractive = (mapId: string): boolean => {
  // Return the interactive flag from the state
  return getStoreSwiperState(mapId).interactive;
};

/** Hooks whether the swiper is interactive from the store. */
export const useStoreSwiperInteractive = (): boolean => useStore(useGeoViewStore(), (state) => state.swiperState.interactive);

/**
 * Hooks whether the swiper is interactive from the store, returning false when the Swiper plugin is not loaded.
 *
 * Safe to use in always-rendered components that may run without the Swiper plugin, because it does
 * not assume the swiper state slice is initialized.
 */
export const useStoreSwiperInteractiveIfExists = (): boolean =>
  useStore(useGeoViewStore(), (state) => state.swiperState?.interactive ?? false);

/**
 * Gets the swiper orientation from the store.
 *
 * @param mapId - The map id to read the swiper orientation from.
 * @returns The current swiper orientation.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export const getStoreSwiperOrientation = (mapId: string): SwipeOrientation => {
  // Return the orientation from the state
  return getStoreSwiperState(mapId).orientation;
};

/** Hooks the swiper orientation from the store. */
export const useStoreSwiperOrientation = (): SwipeOrientation => useStore(useGeoViewStore(), (state) => state.swiperState.orientation);

// #endregion STATE GETTERS & HOOKS

// #region STATE ADAPTORS
// GV These methods should be called from a State Adaptor class listening on domain events triggered by controllers.

/**
 * Sets the swiper position in the store.
 *
 * @param mapId - The map id.
 * @param position - The new swiper position, between 0 and 1.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export const setStoreSwiperPosition = (mapId: string, position: number): void => {
  // Get the swiper state which is only initialized if the Swiper Plugin exists.
  const swiperState = getStoreSwiperState(mapId);

  // set store position
  swiperState.actions.setSwiperPosition(position);
};

/**
 * Sets the swiper layer paths in the store.
 *
 * @param mapId - The map id.
 * @param layerPaths - The layer paths to set.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export const setStoreSwiperLayerPaths = (mapId: string, layerPaths: string[]): void => {
  // Get the swiper state which is only initialized if the Swiper Plugin exists.
  const swiperState = getStoreSwiperState(mapId);

  // set store layer paths
  swiperState.actions.setLayerPaths(layerPaths);

  // Log
  logger.logInfo('Added Swiper functionality for layer paths:', layerPaths);
};

/**
 * Sets the swiper layer entries (path and side) in the store, replacing the current selection.
 *
 * @param mapId - The map id.
 * @param entries - The layer entries to set, each with a layer path and its visible side.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export const setStoreSwiperLayers = (mapId: string, entries: { layerPath: string; side: SwipeSide }[]): void => {
  // Get the swiper state which is only initialized if the Swiper Plugin exists.
  const swiperState = getStoreSwiperState(mapId);

  // Split into paths and sides
  const layerPaths = entries.map((entry) => entry.layerPath);
  const layerSides: Record<string, SwipeSide> = {};
  entries.forEach((entry) => {
    layerSides[entry.layerPath] = entry.side;
  });

  // Set both in the store
  swiperState.actions.setLayerPaths(layerPaths);
  swiperState.actions.setLayerSides(layerSides);

  // Log
  logger.logInfo('Set Swiper layer entries:', entries);
};

/**
 * Sets the visible side for a single swiper layer path in the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path to set the side for.
 * @param side - The visible side of the swiper bar for this layer.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export const setStoreSwiperLayerSide = (mapId: string, layerPath: string, side: SwipeSide): void => {
  // Get the swiper state which is only initialized if the Swiper Plugin exists.
  const swiperState = getStoreSwiperState(mapId);

  // Update the side for the layer path
  swiperState.actions.setLayerSides({ ...swiperState.layerSides, [layerPath]: side });

  // Log
  logger.logInfo('Set Swiper visible side for layer path:', layerPath, side);
};

/**
 * Sets whether the swiper is interactive in the store.
 *
 * @param mapId - The map id.
 * @param interactive - Whether the user can customize the swiper.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export const setStoreSwiperInteractive = (mapId: string, interactive: boolean): void => {
  // Get the swiper state which is only initialized if the Swiper Plugin exists.
  const swiperState = getStoreSwiperState(mapId);

  // set store interactive flag
  swiperState.actions.setInteractive(interactive);
};

/**
 * Sets the swiper orientation in the store.
 *
 * @param mapId - The map id.
 * @param orientation - The new swiper orientation.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export const setStoreSwiperOrientation = (mapId: string, orientation: SwipeOrientation): void => {
  // Get the swiper state which is only initialized if the Swiper Plugin exists.
  const swiperState = getStoreSwiperState(mapId);

  // set store orientation
  swiperState.actions.setOrientation(orientation);
};

/**
 * Adds a single layer path to the swiper in the store, if not already present.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path to add.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export const addStoreSwiperLayerPath = (mapId: string, layerPath: string, side: SwipeSide): void => {
  // Get the swiper state which is only initialized if the Swiper Plugin exists.
  const swiperState = getStoreSwiperState(mapId);

  // If not already added
  if (!swiperState.layerPaths.includes(layerPath)) {
    // Add in the array
    const updatedArray = [...swiperState.layerPaths];
    updatedArray.push(layerPath);

    // Update the layer data array in the store
    swiperState.actions.setLayerPaths(updatedArray);

    // Store the visible side for this layer path
    swiperState.actions.setLayerSides({ ...swiperState.layerSides, [layerPath]: side });

    // Log
    logger.logInfo('Added Swiper functionality for layer path:', layerPath, side);
  } else {
    // Log
    logger.logInfo('Swiper functionality already active for layer path:', layerPath);
  }
};

/**
 * Removes a single layer path from the swiper in the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path to remove.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export const removeStoreSwiperLayerPath = (mapId: string, layerPath: string): void => {
  // Get the swiper state which is only initialized if the Swiper Plugin exists.
  const swiperState = getStoreSwiperState(mapId);

  // If no layer paths, return
  if (!swiperState.layerPaths) return;

  // Find the index with the layer path
  const layerIndex = swiperState.layerPaths.findIndex((layer) => layer === layerPath);

  // Config to remove
  if (layerIndex !== undefined && layerIndex >= 0) {
    // Remove from the array
    const updatedArray = [...swiperState.layerPaths];
    updatedArray.splice(layerIndex, 1);

    // Update the layer data array in the store
    swiperState.actions.setLayerPaths(updatedArray);

    // Remove the visible side entry for this layer path
    const updatedSides = { ...swiperState.layerSides };
    delete updatedSides[layerPath];
    swiperState.actions.setLayerSides(updatedSides);

    // Log
    logger.logInfo('Removed Swiper functionality for layer path:', layerPath);
  } else {
    // Log
    logger.logInfo('Swiper functionality already inactive for layer path:', layerPath);
  }
};

/**
 * Removes all layer paths from the swiper, effectively clearing the swiper.
 *
 * @param mapId - The map id.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export const removeAllStoreSwipers = (mapId: string): void => {
  // Get the swiper state which is only initialized if the Swiper Plugin exists.
  const swiperState = getStoreSwiperState(mapId);

  // If no layer paths, return
  if (!swiperState.layerPaths) return;

  // Get all layer paths
  const { layerPaths } = swiperState;

  // Update the layer data array in the store
  swiperState.actions.setLayerPaths([]);

  // Clear all visible sides
  swiperState.actions.setLayerSides({});

  // Log
  logger.logInfo('Removed Swiper functionality for all layer paths', layerPaths);
};

// #endregion STATE ADAPTORS

// GV This type is the core equivalent of the homonym in the geoview-swiper package.
export type SwipeOrientation = 'horizontal' | 'vertical';

// GV This type is the core equivalent of the homonym in the geoview-swiper package.
export type SwipeSide = 'left' | 'right' | 'up' | 'down';
