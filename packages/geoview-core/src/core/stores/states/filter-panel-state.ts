import { useStore } from 'zustand';

import { getGeoViewStore, useGeoViewStore } from '@/core/stores/stores-managers';
import type { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { PluginStateUninitializedError } from '@/core/exceptions/geoview-exceptions';
import { logger } from '@/core/utils/logger';

// #region TYPE DEFINITIONS

// GV These types are the core equivalent of the homonyms in the geoview-filter-panel package.

/** Range value for numeric filters. */
export interface TypeRangeValue {
  /** Minimum value. */
  min: number | null;
  /** Maximum value. */
  max: number | null;
}

/** Date range value for date filters. */
export interface TypeDateRangeValue {
  /** Start date. */
  start: string | null;
  /** End date. */
  end: string | null;
}

/** Filter value type - can be single value, array, or range object. */
export type TypeFilterValue = string | number | null | (string | number)[] | TypeRangeValue | TypeDateRangeValue;

/** Filter state for a single layer - maps field names to their current filter values. */
export type TypeLayerFilterState = Record<string, TypeFilterValue>;

/** Complete filter state for all layers - maps layer paths to their filter states. */
export type TypeFilterState = Record<string, TypeLayerFilterState>;

// #endregion TYPE DEFINITIONS

// #region INTERFACE DEFINITION

/**
 * Represents the Filter Panel Zustand store slice.
 *
 * Manages state for the filter panel including layer filter states.
 */
export interface IFilterPanelState {
  /** The current filter state for all layers (layerPath -> field filters). */
  filterState: TypeFilterState;

  /** Tracks which layers have filters applied to the map. */
  activeLayerFilters: Set<string>;

  /** Actions to mutate the Filter Panel state. */
  actions: {
    /** Sets the complete filter state for all layers. */
    setFilterState: (filterState: TypeFilterState) => void;

    /** Updates filter state for a specific layer and field. */
    updateLayerFieldFilter: (layerPath: string, fieldName: string, value: TypeFilterValue) => void;

    /** Clears all filters for a specific layer. */
    clearLayerFilters: (layerPath: string) => void;

    /** Clears all filters for all layers. */
    clearAllFilters: () => void;

    /** Marks a layer as having active filters on the map. */
    addActiveLayerFilter: (layerPath: string) => void;

    /** Removes a layer from the active filters set. */
    removeActiveLayerFilter: (layerPath: string) => void;

    /** Clears all active layer filters. */
    clearActiveLayerFilters: () => void;
  };
}

// #endregion INTERFACE DEFINITION

// #region STATE INITIALIZATION

/**
 * Initializes a Filter Panel state object.
 *
 * @param set - The store set callback function
 * @param get - The store get callback function
 * @returns The Filter Panel state object
 */
export function initializeFilterPanelState(set: TypeSetStore, get: TypeGetStore): IFilterPanelState {
  const init = {
    filterState: {},
    activeLayerFilters: new Set<string>(),

    actions: {
      /**
       * Sets the complete filter state in the store.
       *
       * @param filterState - The new filter state
       */
      setFilterState(filterState: TypeFilterState) {
        set({
          filterPanelState: {
            ...get().filterPanelState,
            filterState,
          },
        });
      },

      /**
       * Updates filter state for a specific layer and field.
       *
       * @param layerPath - The layer path
       * @param fieldName - The field name
       * @param value - The filter value
       */
      updateLayerFieldFilter(layerPath: string, fieldName: string, value: TypeFilterValue) {
        const currentState = get().filterPanelState.filterState;
        const layerState = currentState[layerPath] || {};

        set({
          filterPanelState: {
            ...get().filterPanelState,
            filterState: {
              ...currentState,
              [layerPath]: {
                ...layerState,
                [fieldName]: value,
              },
            },
          },
        });
      },

      /**
       * Clears all filters for a specific layer.
       *
       * @param layerPath - The layer path
       */
      clearLayerFilters(layerPath: string) {
        const currentState = get().filterPanelState.filterState;
        const newState = { ...currentState };
        newState[layerPath] = {};

        set({
          filterPanelState: {
            ...get().filterPanelState,
            filterState: newState,
          },
        });
      },

      /**
       * Clears all filters for all layers.
       */
      clearAllFilters() {
        const currentState = get().filterPanelState.filterState;
        const clearedState: TypeFilterState = {};

        // Reset each layer to empty object
        Object.keys(currentState).forEach((layerPath) => {
          clearedState[layerPath] = {};
        });

        set({
          filterPanelState: {
            ...get().filterPanelState,
            filterState: clearedState,
          },
        });
      },

      /**
       * Marks a layer as having active filters on the map.
       *
       * @param layerPath - The layer path
       */
      addActiveLayerFilter(layerPath: string) {
        const currentSet = new Set(get().filterPanelState.activeLayerFilters);
        currentSet.add(layerPath);

        set({
          filterPanelState: {
            ...get().filterPanelState,
            activeLayerFilters: currentSet,
          },
        });
      },

      /**
       * Removes a layer from the active filters set.
       *
       * @param layerPath - The layer path
       */
      removeActiveLayerFilter(layerPath: string) {
        const currentSet = new Set(get().filterPanelState.activeLayerFilters);
        currentSet.delete(layerPath);

        set({
          filterPanelState: {
            ...get().filterPanelState,
            activeLayerFilters: currentSet,
          },
        });
      },

      /**
       * Clears all active layer filters.
       */
      clearActiveLayerFilters() {
        set({
          filterPanelState: {
            ...get().filterPanelState,
            activeLayerFilters: new Set<string>(),
          },
        });
      },
    },
  };

  return init;
}

// #endregion STATE INITIALIZATION

// #region STATE GETTERS & HOOKS

/**
 * Returns the full filter panel state slice for the given map.
 *
 * Internal-only selector - not exported to avoid direct store access from outside this module.
 *
 * @param mapId - The map identifier
 * @returns The IFilterPanelState for the given map
 * @throws {PluginStateUninitializedError} When the Filter Panel plugin is uninitialized
 */
// GV No export for the main state!
const getStoreFilterPanelState = (mapId: string): IFilterPanelState => {
  const state = getGeoViewStore(mapId).getState().filterPanelState;
  if (!state) throw new PluginStateUninitializedError('FilterPanel', mapId);
  return state;
};

/**
 * Checks whether the Filter Panel plugin state has been initialized for the given map.
 *
 * @param mapId - The map id to check
 * @returns True if the Filter Panel state is initialized, false otherwise
 */
export const isStoreFilterPanelInitialized = (mapId: string): boolean => {
  try {
    getStoreFilterPanelState(mapId);
    return true;
  } catch {
    return false;
  }
};

/**
 * Gets the complete filter state from the store.
 *
 * @param mapId - The map id to read filter state from
 * @returns The filter state for all layers
 * @throws {PluginStateUninitializedError} When the Filter Panel plugin is uninitialized
 */
export const getStoreFilterPanelFilterState = (mapId: string): TypeFilterState => {
  return getStoreFilterPanelState(mapId).filterState;
};

/** Hooks the complete filter state from the store. */
export const useStoreFilterPanelFilterState = (): TypeFilterState =>
  useStore(useGeoViewStore(), (state) => state.filterPanelState.filterState);

/**
 * Gets the filter state for a specific layer from the store.
 *
 * @param mapId - The map id
 * @param layerId - The layer id
 * @returns The filter state for the layer or an empty object if not found
 * @throws {PluginStateUninitializedError} When the Filter Panel plugin is uninitialized
 */
export const getStoreFilterPanelLayerFilterState = (mapId: string, layerId: string): TypeLayerFilterState => {
  return getStoreFilterPanelState(mapId).filterState[layerId] || {};
};

/** Hooks the filter state for a specific layer from the store. */
export const useStoreFilterPanelLayerFilterState = (layerId: string): TypeLayerFilterState =>
  useStore(useGeoViewStore(), (state) => state.filterPanelState.filterState[layerId] || {});

/**
 * Gets the active layer filters set from the store.
 *
 * @param mapId - The map id
 * @returns The set of layer IDs with active filters
 * @throws {PluginStateUninitializedError} When the Filter Panel plugin is uninitialized
 */
export const getStoreFilterPanelActiveLayerFilters = (mapId: string): Set<string> => {
  return getStoreFilterPanelState(mapId).activeLayerFilters;
};

/** Hooks the active layer filters set from the store. */
export const useStoreFilterPanelActiveLayerFilters = (): Set<string> =>
  useStore(useGeoViewStore(), (state) => state.filterPanelState.activeLayerFilters);

// #endregion STATE GETTERS & HOOKS

// #region STATE SETTERS

/**
 * Sets the complete filter state in the store.
 *
 * @param mapId - The map id
 * @param filterState - The new filter state
 * @throws {PluginStateUninitializedError} When the Filter Panel plugin is uninitialized
 */
export const setStoreFilterPanelFilterState = (mapId: string, filterState: TypeFilterState): void => {
  const state = getStoreFilterPanelState(mapId);
  state.actions.setFilterState(filterState);
};

/**
 * Updates filter state for a specific layer and field in the store.
 *
 * @param mapId - The map id
 * @param layerId - The layer id
 * @param fieldName - The field name
 * @param value - The filter value
 * @throws {PluginStateUninitializedError} When the Filter Panel plugin is uninitialized
 */
export const setStoreFilterPanelLayerFieldFilter = (mapId: string, layerId: string, fieldName: string, value: TypeFilterValue): void => {
  const state = getStoreFilterPanelState(mapId);
  state.actions.updateLayerFieldFilter(layerId, fieldName, value);
};

/**
 * Clears all filters for a specific layer in the store.
 *
 * @param mapId - The map id
 * @param layerId - The layer id
 * @throws {PluginStateUninitializedError} When the Filter Panel plugin is uninitialized
 */
export const clearStoreFilterPanelLayerFilters = (mapId: string, layerId: string): void => {
  const state = getStoreFilterPanelState(mapId);
  state.actions.clearLayerFilters(layerId);
};

/**
 * Clears all filters for all layers in the store.
 *
 * @param mapId - The map id
 * @throws {PluginStateUninitializedError} When the Filter Panel plugin is uninitialized
 */
export const clearStoreFilterPanelAllFilters = (mapId: string): void => {
  const state = getStoreFilterPanelState(mapId);
  state.actions.clearAllFilters();
};

/**
 * Marks a layer as having active filters on the map.
 *
 * @param mapId - The map id
 * @param layerId - The layer id
 * @throws {PluginStateUninitializedError} When the Filter Panel plugin is uninitialized
 */
export const addStoreFilterPanelActiveLayerFilter = (mapId: string, layerId: string): void => {
  const state = getStoreFilterPanelState(mapId);
  state.actions.addActiveLayerFilter(layerId);
  logger.logInfo('Added active filter for layer:', layerId);
};

/**
 * Removes a layer from the active filters set.
 *
 * @param mapId - The map id
 * @param layerId - The layer id
 * @throws {PluginStateUninitializedError} When the Filter Panel plugin is uninitialized
 */
export const removeStoreFilterPanelActiveLayerFilter = (mapId: string, layerId: string): void => {
  const state = getStoreFilterPanelState(mapId);
  state.actions.removeActiveLayerFilter(layerId);
  logger.logInfo('Removed active filter for layer:', layerId);
};

/**
 * Clears all active layer filters.
 *
 * @param mapId - The map id
 * @throws {PluginStateUninitializedError} When the Filter Panel plugin is uninitialized
 */
export const clearStoreFilterPanelActiveLayerFilters = (mapId: string): void => {
  const state = getStoreFilterPanelState(mapId);
  state.actions.clearActiveLayerFilters();
  logger.logInfo('Cleared all active filters');
};

// #endregion STATE SETTERS
