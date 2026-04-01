import { useStore } from 'zustand';

import type { GeoViewGeoChartConfig } from '@/api/config/reader/uuid-config-reader';
import type { TypeFeatureInfoEntry, TypeQueryStatus, TypeResultSetEntry } from '@/api/types/map-schema-types';
import {
  getGeoViewStore,
  helperPropagateArrayStoreBatch,
  useGeoViewStore,
  type BatchedPropagationLayerDataArrayByMap,
  type SubscriptionDelegate,
} from '@/core/stores/stores-managers';
import type { GeoviewStoreType, TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';
import { PluginStateUninitializedError } from '@/core/exceptions/geoview-exceptions';

// #region INTERFACE DEFINITION

/**
 * Represents the geochart Zustand store slice.
 *
 * Manages state for geochart configurations, layer data arrays
 * (with optional batching for performance), and the currently
 * selected layer path.
 */
export interface IGeochartState {
  /** The geochart chart configurations keyed by layer path. */
  geochartChartsConfig: GeoChartStoreByLayerPath;

  /** The geochart result set entries for all layers. */
  layerDataArray: TypeGeochartResultSetEntry[];

  /** A batched copy of layerDataArray that updates less frequently to reduce re-renders. */
  layerDataArrayBatch: TypeGeochartResultSetEntry[];

  /** A layer path that bypasses the batch delay for immediate UI update. */
  layerDataArrayBatchLayerPathBypass: string;

  /** The layer path of the currently selected geochart layer. */
  selectedLayerPath: string;

  /** Store actions callable from adaptors. */
  actions: {
    setGeochartCharts: (charts: GeoChartStoreByLayerPath) => void;
    setLayerDataArray: (layerDataArray: TypeGeochartResultSetEntry[]) => void;
    setLayerDataArrayBatch: (layerDataArray: TypeGeochartResultSetEntry[]) => void;
    setLayerDataArrayBatchLayerPathBypass: (layerPath: string) => void;
    setSelectedLayerPath: (selectedLayerPath: string) => void;
  };
}

// #endregion INTERFACE DEFINITION

// #region STATE INITIALIZATION

/**
 * Initializes a Geochart state object.
 * @param set - The store set callback function
 * @param get - The store get callback function
 * @returns The Geochart state object
 */
export function initializeGeochartState(set: TypeSetStore, get: TypeGetStore): IGeochartState {
  const init = {
    geochartChartsConfig: {},
    layerDataArray: [],
    layerDataArrayBatch: [],
    layerDataArrayBatchLayerPathBypass: '',
    selectedLayerPath: '',

    actions: {
      /**
       * Sets the geochart chart configurations in the store.
       *
       * @param charts - The chart configurations keyed by layer path.
       */
      setGeochartCharts(charts: GeoChartStoreByLayerPath): void {
        set({
          geochartState: {
            ...get().geochartState,
            geochartChartsConfig: charts,
          },
        });
      },

      /**
       * Sets the geochart layer data array in the store.
       *
       * @param layerDataArray - The geochart result set entries to set.
       */
      setLayerDataArray(layerDataArray: TypeGeochartResultSetEntry[]) {
        set({
          geochartState: {
            ...get().geochartState,
            layerDataArray,
          },
        });
      },

      /**
       * Sets the batched geochart layer data array in the store.
       *
       * @param layerDataArrayBatch - The batched geochart result set entries to set.
       */
      setLayerDataArrayBatch(layerDataArrayBatch: TypeGeochartResultSetEntry[]) {
        set({
          geochartState: {
            ...get().geochartState,
            layerDataArrayBatch,
          },
        });
      },

      /**
       * Sets the layer path that bypasses the batch propagation delay.
       *
       * @param layerDataArrayBatchLayerPathBypass - The layer path to bypass.
       */
      setLayerDataArrayBatchLayerPathBypass(layerDataArrayBatchLayerPathBypass: string) {
        set({
          geochartState: {
            ...get().geochartState,
            layerDataArrayBatchLayerPathBypass,
          },
        });
      },

      /**
       * Sets the selected geochart layer path in the store.
       *
       * @param selectedLayerPath - The layer path to select.
       */
      setSelectedLayerPath(selectedLayerPath: string) {
        set({
          geochartState: {
            ...get().geochartState,
            selectedLayerPath,
          },
        });
      },
    },
  } as IGeochartState;

  return init;
}

// #endregion STATE INITIALIZATION

// #region STATE HOOKS
// GV To be used by React components

/**
 * Hook that returns the geochart chart configurations.
 *
 * Uses optional chaining because this hook may be called from components
 * outside the GeoChart plugin where the geochartState may be undefined.
 *
 * @returns The geochart configurations keyed by layer path, or undefined.
 */
export const useGeochartConfigs = (): GeoChartStoreByLayerPath | undefined => {
  // GV This hook is called from other components than the GeoChart so the '?' on the geochartState is mandatory
  return useStore(useGeoViewStore(), (state) => state.geochartState?.geochartChartsConfig);
};

/** Hook that returns the geochart layer data array. */
export const useGeochartLayerDataArray = (): TypeGeochartResultSetEntry[] =>
  useStore(useGeoViewStore(), (state) => state.geochartState.layerDataArray);

/**
 * Hook that returns the batched geochart layer data array.
 *
 * Uses optional chaining because this hook may be called from components
 * outside the GeoChart plugin where the geochartState may be undefined.
 *
 * @returns The batched geochart result set entries, or undefined.
 */
export const useGeochartLayerDataArrayBatch = (): TypeGeochartResultSetEntry[] | undefined => {
  // GV This hook is called from other components than the GeoChart so the '?' on the geochartState is mandatory
  return useStore(useGeoViewStore(), (state) => state.geochartState?.layerDataArrayBatch);
};

/** Hook that returns the currently selected geochart layer path. */
export const useGeochartSelectedLayerPath = (): string => useStore(useGeoViewStore(), (state) => state.geochartState.selectedLayerPath);

// #endregion STATE HOOKS

// #region STATE SELECTORS

/**
 * Returns the full geochart state slice for the given map.
 *
 * Internal-only selector - not exported to avoid direct store access from outside this module.
 *
 * @param mapId - The map id for the Geochart State to read
 * @returns The Geochart State
 * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
 */
// GV No export for the main state!
const getStoreGeochartState = (mapId: string): IGeochartState => {
  const state = getGeoViewStore(mapId).getState().geochartState;
  if (!state) throw new PluginStateUninitializedError('Geochart', mapId);
  return state;
};

/**
 * Checks whether the geochart plugin state has been initialized for the given map.
 *
 * @param mapId - The map identifier.
 * @returns True if the geochart state is initialized, false otherwise.
 */
export const isStoreGeochartInitialized = (mapId: string): boolean => {
  try {
    // Get its state, this will throw PluginStateUninitializedError if uninitialized
    getStoreGeochartState(mapId);
    return true;
  } catch {
    // Uninitialized
    return false;
  }
};

/**
 * Gets the selected geochart layer path for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The selected layer path.
 * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
 */
export const getStoreGeochartSelectedLayerPath = (mapId: string): string => getStoreGeochartState(mapId).selectedLayerPath;

/**
 * Gets the geochart chart configurations for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The chart configurations keyed by layer path.
 * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
 */
export const getStoreGeochartChartsConfig = (mapId: string): GeoChartStoreByLayerPath => getStoreGeochartState(mapId).geochartChartsConfig;

/**
 * Gets the geochart layer data array for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The geochart result set entries.
 * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
 */
export const getStoreGeochartLayerDataArray = (mapId: string): TypeGeochartResultSetEntry[] => getStoreGeochartState(mapId).layerDataArray;

/**
 * Gets the batch layer path bypass for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The layer path that bypasses the batch delay.
 * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
 */
export const getStoreGeochartLayerDataArrayBatchLayerPathBypass = (mapId: string): string =>
  getStoreGeochartState(mapId).layerDataArrayBatchLayerPathBypass;

// #endregion STATE SELECTORS

// #region STATE ADAPTORS
// GV These methods should be called from a State Adaptor class listening on domain events triggered by controllers.

/**
 * Sets the geochart chart configurations in the store.
 *
 * @param mapId - The map identifier.
 * @param charts - The chart configurations keyed by layer path.
 * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
 */
export const setStoreGeochartCharts = (mapId: string, charts: GeoChartStoreByLayerPath): void => {
  getStoreGeochartState(mapId).actions.setGeochartCharts(charts);
};

/**
 * Sets the geochart layer data array in the store.
 *
 * @param mapId - The map identifier.
 * @param layerDataArray - The geochart result set entries to set.
 * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
 */
export const setStoreGeochartLayerDataArray = (mapId: string, layerDataArray: TypeGeochartResultSetEntry[]): void => {
  getStoreGeochartState(mapId).actions.setLayerDataArray(layerDataArray);
};

/**
 * Sets the batched geochart layer data array in the store.
 *
 * @param mapId - The map identifier.
 * @param layerDataArrayBatch - The batched geochart result set entries to set.
 * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
 */
export const setStoreGeochartLayerDataArrayBatch = (mapId: string, layerDataArrayBatch: TypeGeochartResultSetEntry[]): void => {
  getStoreGeochartState(mapId).actions.setLayerDataArrayBatch(layerDataArrayBatch);
};

/**
 * Sets the batch layer path bypass in the geochart store.
 *
 * @param mapId - The map identifier.
 * @param layerDataArrayBatchLayerPathBypass - The layer path to bypass.
 * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
 */
export const setStoreGeochartLayerDataArrayBatchLayerPathBypass = (mapId: string, layerDataArrayBatchLayerPathBypass: string): void => {
  getStoreGeochartState(mapId).actions.setLayerDataArrayBatchLayerPathBypass(layerDataArrayBatchLayerPathBypass);
};

/**
 * Sets the selected geochart layer path in the store.
 *
 * @param mapId - The map identifier.
 * @param selectedLayerPath - The layer path to select.
 * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
 */
export const setStoreGeochartSelectedLayerPath = (mapId: string, selectedLayerPath: string): void => {
  getStoreGeochartState(mapId).actions.setSelectedLayerPath(selectedLayerPath);
};

/**
 * Initializes geochart chart configurations from an array of chart config objects.
 *
 * Maps each chart configuration to its associated layer paths and stores
 * the result in the geochart state.
 *
 * @param mapId - The map identifier.
 * @param charts - The array of GeoView geochart config objects.
 * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
 */
export const initStoreGeochartCharts = (mapId: string, charts: GeoViewGeoChartConfig[]): void => {
  // Get the geochart state which is only initialized if the Geochart Plugin exists.
  const geochartState = getStoreGeochartState(mapId);

  // The store object representation
  const chartData: GeoChartStoreByLayerPath = {};

  // Loop on the charts
  charts.forEach((chartInfo) => {
    // For each layer path
    chartInfo.layers.forEach((layer) => {
      // Get the layer path
      const layerPath = layer.layerId;
      chartData[layerPath] = chartInfo;
    });
  });

  // Set store charts config
  geochartState.actions.setGeochartCharts(chartData);
};

/**
 * Adds a single geochart chart configuration for a layer to the store.
 *
 * Merges the new configuration with existing configurations.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to associate the chart config with.
 * @param chartConfig - The GeoView geochart config to add.
 * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
 */
export const addStoreGeochartChart = (mapId: string, layerPath: string, chartConfig: GeoViewGeoChartConfig): void => {
  // Get the geochart state which is only initialized if the Geochart Plugin exists.
  const geochartState = getStoreGeochartState(mapId);

  // Config to add
  const toAdd: GeoChartStoreByLayerPath = {};
  toAdd[layerPath] = chartConfig;

  // Update the layer data array in the store
  geochartState.actions.setGeochartCharts({ ...geochartState.geochartChartsConfig, ...toAdd });
};

/**
 * Removes a geochart chart configuration for a layer from the store.
 *
 * If the removed layer was the last remaining geochart layer,
 * the provided callback is invoked to hide the geochart tab.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path whose chart config should be removed.
 * @param callbackWhenEmpty - Callback invoked when no chart configs remain.
 * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
 */
export const removeStoreGeochartChart = (mapId: string, layerPath: string, callbackWhenEmpty: () => void): void => {
  // Get the geochart state which is only initialized if the Geochart Plugin exists.
  const geochartState = getStoreGeochartState(mapId);

  // If no geochartChartsConfig, return
  if (!geochartState.geochartChartsConfig) return;

  // Config to remove
  if (Object.keys(geochartState.geochartChartsConfig).includes(layerPath)) {
    // Grab the config
    const chartConfigs = geochartState.geochartChartsConfig;

    // Delete the config
    delete chartConfigs[layerPath];

    // Update the layer data array in the store
    geochartState.actions.setGeochartCharts({ ...chartConfigs });

    // If there are no more geochart layers, hide tab
    if (!Object.keys(geochartState.geochartChartsConfig).length) {
      callbackWhenEmpty();
    }

    // Log
    logger.logInfo('Removed GeoChart configs for layer path:', layerPath);
  }
};

// #region STATE ADAPTORS - BATCH PROPAGATION

/** Holds the list of layer data arrays being buffered in the propagation process for the batch. */
const batchedPropagationLayerDataArray: BatchedPropagationLayerDataArrayByMap<TypeGeochartResultSetEntry> = {};

/**
 * The time delay (in ms) between propagations in the batch layer data array.
 *
 * The longer the delay, the more layers will have a chance to reach a loaded
 * state before the layerDataArray changes. The delay can be bypassed using
 * the layer path bypass method.
 */
const TIME_DELAY_BETWEEN_PROPAGATION_FOR_BATCH = 1000;

/**
 * Propagates feature info layer sets to the store in a batched manner, every 'timeDelayBetweenPropagationsForBatch' millisecond.
 * This is used to provide another 'layerDataArray', in the store, which updates less often so that we save a couple 'layerDataArray'
 * update triggers in the components that are listening to the store array.
 * The propagation can be bypassed using the store 'layerDataArrayBatchLayerPathBypass' state which tells the process to
 * immediately batch out the array in the store for faster triggering of the state, for faster updating of the UI.
 *
 * @param mapId - The map id
 * @param layerDataArray - The layer data array to batch on
 * @returns Promise upon completion
 * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
 */
export const propagateStoreGeochartFeatureInfoBatch = (mapId: string, layerDataArray: TypeGeochartResultSetEntry[]): Promise<void> => {
  // Get the geochart state which is only initialized if the Geochart Plugin exists.
  const geochartState = getStoreGeochartState(mapId);

  // Redirect to batch propagate
  return helperPropagateArrayStoreBatch(
    mapId,
    layerDataArray,
    batchedPropagationLayerDataArray,
    TIME_DELAY_BETWEEN_PROPAGATION_FOR_BATCH,
    geochartState.actions.setLayerDataArrayBatch,
    'geochart-processor',
    getStoreGeochartLayerDataArrayBatchLayerPathBypass(mapId),
    geochartState.actions.setLayerDataArrayBatchLayerPathBypass
  );
};

// #region STATE ADAPTORS - BATCH PROPAGATION

// #endregion STATE ADAPTORS

// #region STATE INITIALIZATION - SUBSCRIPTIONS

/** The list of active Zustand subscriptions for the geochart state. */
const subscriptions: Record<string, SubscriptionDelegate[]> = {};

/**
 * Initializes Zustand store subscriptions for the geochart state.
 *
 * Sets up watchers for changes in the details layerDataArray (to sync
 * geochart data) and the geochart layerDataArray (to propagate batches).
 *
 * @param store - The GeoView Zustand store instance.
 */
export function initGeochartStateSubscriptions(store: GeoviewStoreType): void {
  // Checks for updated layers in layer data array from the details state
  const layerDataArrayUpdate = store.subscribe(
    (state) => state.detailsState.layerDataArray as TypeGeochartResultSetEntry[],
    (cur: TypeGeochartResultSetEntry[]) => {
      // Log
      logger.logTraceCoreStoreSubscription('GEOCHART STATE - detailsState.layerDataArray', cur);

      // Also propagate in the geochart arrays
      setStoreGeochartLayerDataArray(store.getState().mapId, cur);
    }
  );

  // Checks for updated layers in geochart layer data array and update the batched array consequently
  const layerDataArrayUpdateBatch = store.subscribe(
    (state) => state.geochartState.layerDataArray,
    (cur: TypeGeochartResultSetEntry[]) => {
      // Log
      logger.logTraceCoreStoreSubscription('GEOCHART STATE - geochartState.layerDataArray', cur);

      // Also propagate in the batched array
      propagateStoreGeochartFeatureInfoBatch(store.getState().mapId, cur).catch((error: unknown) => {
        // Log
        logger.logPromiseFailed('propagateStoreGeochartFeatureInfoBatch in layerDataArrayUpdateBatch subscribe in geochart-state', error);
      });
    }
  );

  // Add subscriptions to the list of subscriptions to be used by the state
  subscriptions[store.getState().mapId] = [layerDataArrayUpdate, layerDataArrayUpdateBatch];
}

/**
 * Clears all active Zustand subscriptions for the geochart state.
 */
export function clearGeochartStateSubscriptions(mapId: string): void {
  subscriptions[mapId].forEach((unsubscribe) => unsubscribe());
  subscriptions[mapId].length = 0;
}

// #endregion STATE INITIALIZATION - SUBSCRIPTIONS

/**
 * Represents geochart result info for a single layer's query.
 */
export type GeoChartResultInfo = {
  /** The current query status for this geochart entry. */
  queryStatus: TypeQueryStatus;

  /** The feature info entries returned by the query, or undefined/null. */
  features: TypeFeatureInfoEntry[] | undefined | null;
};

/**
 * A record of GeoView geochart configurations keyed by layer path.
 */
export type GeoChartStoreByLayerPath = {
  [layerPath: string]: GeoViewGeoChartConfig;
};

/** A geochart result set entry combining result set metadata with geochart result info. */
export type TypeGeochartResultSetEntry = TypeResultSetEntry & GeoChartResultInfo;
