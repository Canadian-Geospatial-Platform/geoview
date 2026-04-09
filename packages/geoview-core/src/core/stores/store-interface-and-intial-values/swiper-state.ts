import { useStore } from 'zustand';

import { getGeoViewStore, useGeoViewStore } from '@/core/stores/stores-managers';
import type { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
import { PluginStateUninitializedError } from '@/core/exceptions/geoview-exceptions';
import { logger } from '@/core/utils/logger';

// #region INTERFACE DEFINITION

/**
 * Represents the Swiper Zustand store slice.
 *
 * Manages state for the swiper including layer paths and orientation.
 */
export interface ISwiperState {
  /** The list of layer paths currently participating in the swiper. */
  layerPaths: string[];

  /** The current orientation of the swiper divider. */
  orientation: SwipeOrientation;

  /** Actions to mutate the Swiper state. */
  actions: {
    /** Sets the full list of layer paths for the swiper. */
    setLayerPaths: (layerPaths: string[]) => void;

    /** Sets the swiper orientation. */
    setOrientation: (orientation: SwipeOrientation) => void;
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
    layerPaths: [],
    orientation: 'vertical',

    actions: {
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
 * Gets the swiper orientation from the store.
 *
 * @param mapId - The map id to read swiper layer paths from.
 * @returns The array of layer paths participating in the swiper.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export const getStoreSwiperOrientation = (mapId: string): SwipeOrientation => {
  // Return the layer paths from the state
  return getStoreSwiperState(mapId).orientation;
};

/** Hooks the swiper orientation from the store. */
export const useStoreSwiperOrientation = (): SwipeOrientation => useStore(useGeoViewStore(), (state) => state.swiperState.orientation);

// #endregion STATE GETTERS & HOOKS

// #region STATE ADAPTORS
// GV These methods should be called from a State Adaptor class listening on domain events triggered by controllers.

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

  // TODO: Also update the layer array in other store state to inform the later has a swiper attached to it?
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
export const addStoreSwiperLayerPath = (mapId: string, layerPath: string): void => {
  // Get the swiper state which is only initialized if the Swiper Plugin exists.
  const swiperState = getStoreSwiperState(mapId);

  // If no layer paths, return
  if (!swiperState.layerPaths) return;

  // If not already added
  if (!swiperState.layerPaths.includes(layerPath)) {
    // Add in the array
    const updatedArray = [...swiperState.layerPaths];
    updatedArray.push(layerPath);

    // Update the layer data array in the store
    swiperState.actions.setLayerPaths(updatedArray);

    // Log
    logger.logInfo('Added Swiper functionality for layer path:', layerPath);

    // TODO: Also update the layer array in other store state to inform the later has a swiper attached to it?
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

    // Log
    logger.logInfo('Removed Swiper functionality for layer path:', layerPath);

    // TODO: Also update the layer array in other store state to inform the later has a swiper attached to it?
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

  // Log
  logger.logInfo('Removed Swiper functionality for all layer paths', layerPaths);

  // TODO: Also update the layer array in other store state to inform the later has a swiper attached to it?
};

// #endregion STATE ADAPTORS

// GV This type is the core equivalent of the homonym in the geoview-swiper package.
export type SwipeOrientation = 'horizontal' | 'vertical';
