import { useStore } from 'zustand';

import { getGeoViewStore, useGeoViewStore } from '@/core/stores/stores-managers';
import type { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { getStoreMapConfigCorePackagesConfig } from '@/core/stores/states/map-state';
import { PluginStateUninitializedError } from '@/core/exceptions/geoview-exceptions';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';

// #region TYPE DEFINITIONS

// GV These types are the core equivalent of the homonyms in the geoview-filter-panel package.

/** Configuration for the filter panel plugin. */
export interface TypeFilterPanelConfig {
  /** Array of layer configurations for filtering. */
  layers?: TypeFilterLayerConfig[];
}

/** Appbar package configuration containing the filter panel config. */
type TypeAppBarPackageConfig = {
  /** The filter panel plugin configuration, if present. */
  'filter-panel'?: TypeFilterPanelConfig;
};

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

/** Domain value mapping for attribute values. */
export interface TypeDomainValue {
  /** The raw value from the layer. */
  value: string | number;
  /** The display label for this value. */
  label: string;
}

/** Attribute configuration for filtering. */
export interface TypeFilterAttribute {
  /** Field name in the layer. */
  fieldName: string;
  /** Display label for the filter. */
  displayLabel: string;
  /** Type of filter control. */
  filterType: TypeFilterType;
  /** Whether this attribute is enabled. */
  enabled: boolean;
  /** Default filter values. */
  defaultValues?: TypeFilterValue;
  /** Optional custom options (if not fetching from layer). */
  options?: (string | number)[];
  /** Optional domain mapping for value labels. Only applies to 'select' and 'multiselect' filter types. */
  domain?: TypeDomainValue[];
  /** If true, filter out values not in the domain. If false, show them with raw value. Only applies when domain is defined and filterType is 'select' or 'multiselect'. */
  filterMissingDomainValues?: boolean;
  /** Optional step interval for date filters. Only applies when filterType is 'date'. */
  dateStep?: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
  /** Optional step interval for range filters. Only applies when filterType is 'range'. */
  rangeStep?: number;
}

/** Filter type enumeration. */
export type TypeFilterType = 'select' | 'multiselect' | 'range' | 'date';

/** Filter value type - can be single value, array, or range object. */
export type TypeFilterValue = string | number | (string | number)[] | TypeRangeValue | TypeDateRangeValue;

/** Filter state for a single layer - maps field names to their current filter values. */
export type TypeLayerFilterState = Record<string, TypeFilterValue>;

/** Complete filter state for all layers - maps layer paths to their filter states. */
export type TypeFilterState = Record<string, TypeLayerFilterState>;

// #endregion TYPE DEFINITIONS

// #region INTERFACE DEFINITION

/** Layer configuration for filtering. */
export interface TypeFilterLayerConfig {
  /** Unique identifier for the layer (layer path). */
  layerPath: string;
  /** Display name for the layer. */
  layerName?: string;
  /** Whether filtering is enabled for this layer. */
  enabled: boolean;
  /** Whether layer sections are collapsible. */
  collapsible?: boolean;
  /** Default collapsed state for layer sections. */
  defaultCollapsed?: boolean;
  /** Array of filterable attributes. */
  attributes: TypeFilterAttribute[];
}

/**
 * Represents the Filter Panel Zustand store slice.
 *
 * Manages state for the filter panel including layer filter states.
 */
export interface IFilterPanelState {
  /** The current filter state for all layers (layerPath -> field filters). */
  filterState: TypeFilterState;

  /** Tracks collapsed state for each layer (layerPath -> isCollapsed). */
  collapsedLayers: Record<string, boolean>;

  /** Tracks the current filter expression values for the panel as a string */
  panelFilterExpressions: Record<string, string>;

  /** Sets default filter panel configuration values from the map features config. */
  setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;

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

    /** Sets the collapsed state for a specific layer. */
    setLayerCollapsed: (layerPath: string, collapsed: boolean) => void;

    /** Sets the panel filter value for a specific layer. */
    setPanelFilterExpression: (layerPath: string, filter: string) => void;
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
    collapsedLayers: {},
    panelFilterExpressions: {},

    setDefaultConfigValues(geoviewConfig: TypeMapFeaturesConfig) {
      const filterPanelPackageConfig = geoviewConfig.corePackagesConfig?.find((config) => Object.keys(config).includes('filter-panel')) as
        TypeAppBarPackageConfig | undefined;

      const filterPanelConfig = filterPanelPackageConfig?.['filter-panel'];

      if (!filterPanelConfig?.layers) return;

      const initialFilterState: TypeFilterState = {};

      // Initialize state only for enabled layers
      filterPanelConfig.layers.forEach((layer) => {
        if (!layer.enabled) return; // Skip disabled layers

        // Initialize with empty filter state (or default values from config)
        initialFilterState[layer.layerPath] = {};

        // If layer has default values configured, apply them
        layer.attributes?.forEach((attr) => {
          if (attr.enabled && attr.defaultValues !== undefined) {
            initialFilterState[layer.layerPath][attr.fieldName] = attr.defaultValues;
          }
        });
      });

      const initialCollapsedState: Record<string, boolean> = {};

      // Initialize collapsed state from defaultCollapsed config
      filterPanelConfig.layers.forEach((layer) => {
        if (!layer.enabled) return;

        // If not collapsible, must be open (false). Otherwise use defaultCollapsed.
        const collapsible = layer.collapsible ?? true;
        initialCollapsedState[layer.layerPath] = collapsible ? (layer.defaultCollapsed ?? false) : false;
      });

      set({
        filterPanelState: {
          ...get().filterPanelState,
          filterState: initialFilterState,
          collapsedLayers: initialCollapsedState,
        },
      });
    },

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

        const expressions = get().filterPanelState.panelFilterExpressions;
        const newExpressions = { ...expressions };
        newExpressions[layerPath] = '';

        set({
          filterPanelState: {
            ...get().filterPanelState,
            filterState: newState,
            panelFilterExpressions: newExpressions,
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

        const expressions = get().filterPanelState.panelFilterExpressions;
        const newExpressions: Record<string, string> = {};
        Object.keys(expressions).forEach((layerPath) => {
          newExpressions[layerPath] = '';
        });

        set({
          filterPanelState: {
            ...get().filterPanelState,
            filterState: clearedState,
            panelFilterExpressions: newExpressions,
          },
        });
      },

      /**
       * Sets the collapsed state for a specific layer.
       *
       * @param layerPath - The layer path
       * @param collapsed - The collapsed state
       */
      setLayerCollapsed(layerPath: string, collapsed: boolean) {
        const currentCollapsed = get().filterPanelState.collapsedLayers;

        set({
          filterPanelState: {
            ...get().filterPanelState,
            collapsedLayers: {
              ...currentCollapsed,
              [layerPath]: collapsed,
            },
          },
        });
      },

      /**
       * Sets the panel filter value for a specific layer.
       *
       * @param layerPath - The layer path
       * @param filter - The filter value as a string
       */
      setPanelFilterExpression(layerPath: string, filter: string) {
        const currentFilters = get().filterPanelState.panelFilterExpressions;

        set({
          filterPanelState: {
            ...get().filterPanelState,
            panelFilterExpressions: {
              ...currentFilters,
              [layerPath]: filter,
            },
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
 * Gets the filter panel configuration from the map config.
 *
 * @param mapId - The map id
 * @returns The filter panel configuration, or undefined if not found
 */
export const getStoreFilterPanelConfig = (mapId: string): { layers?: TypeFilterLayerConfig[] } | undefined => {
  const corePackagesConfig = getStoreMapConfigCorePackagesConfig(mapId);
  return corePackagesConfig?.find((config) => Object.keys(config).includes('filter-panel'))?.['filter-panel'] as
    { layers?: TypeFilterLayerConfig[] } | undefined;
};

/**
 * Gets the configuration for a specific layer from the filter panel config.
 *
 * @param mapId - The map id
 * @param layerPath - The layer path
 * @returns The layer configuration, or undefined if not found
 */
export const getStoreFilterPanelLayerConfig = (mapId: string, layerPath: string): TypeFilterLayerConfig | undefined => {
  const filterPanelConfig = getStoreFilterPanelConfig(mapId);
  return filterPanelConfig?.layers?.find((layer) => layer.layerPath === layerPath);
};

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
 * Gets the collapsed state for a specific layer from the store.
 *
 * @param mapId - The map id
 * @param layerPath - The layer path
 * @returns The collapsed state, or false if not found
 * @throws {PluginStateUninitializedError} When the Filter Panel plugin is uninitialized
 */
export const getStoreFilterPanelLayerCollapsed = (mapId: string, layerPath: string): boolean => {
  return getStoreFilterPanelState(mapId).collapsedLayers[layerPath] ?? false;
};

/** Hooks the collapsed state for a specific layer from the store. */
export const useStoreFilterPanelLayerCollapsed = (layerPath: string): boolean =>
  useStore(useGeoViewStore(), (state) => state.filterPanelState.collapsedLayers[layerPath] ?? false);

/** Gets the panel filter for a specific layer from the store. */
export const useStoreFilterPanelFilterExpression = (layerPath: string): string | undefined =>
  useStore(useGeoViewStore(), (state) => state.filterPanelState?.panelFilterExpressions[layerPath]);

/** Sets the panel filter for a specific layer in the store. */
export const setStoreFilterPanelFilterExpression = (mapId: string, layerPath: string, filter: string): void => {
  const state = getStoreFilterPanelState(mapId);
  state.actions.setPanelFilterExpression(layerPath, filter);
};

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
 * Sets the collapsed state for a specific layer in the store.
 *
 * @param mapId - The map id
 * @param layerPath - The layer path
 * @param collapsed - The collapsed state
 * @throws {PluginStateUninitializedError} When the Filter Panel plugin is uninitialized
 */
export const setStoreFilterPanelLayerCollapsed = (mapId: string, layerPath: string, collapsed: boolean): void => {
  const state = getStoreFilterPanelState(mapId);
  state.actions.setLayerCollapsed(layerPath, collapsed);
};

// #endregion STATE SETTERS
