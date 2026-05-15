import type { GeoViewGeoChartConfig } from '@/api/config/reader/uuid-config-reader';
import type { TypeFeatureInfoEntry, TypeQueryStatus, TypeResultSetEntry } from '@/api/types/map-schema-types';
import type { GeoviewStoreType, TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
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
/**
 * Initializes a Geochart state object.
 * @param set - The store set callback function
 * @param get - The store get callback function
 * @returns The Geochart state object
 */
export declare function initializeGeochartState(set: TypeSetStore, get: TypeGetStore): IGeochartState;
/**
 * Checks whether the geochart plugin state has been initialized for the given map.
 *
 * @param mapId - The map identifier.
 * @returns True if the geochart state is initialized, false otherwise.
 */
export declare const isStoreGeochartInitialized: (mapId: string) => boolean;
/**
 * Gets the selected geochart layer path for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The selected layer path.
 * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
 */
export declare const getStoreGeochartSelectedLayerPath: (mapId: string) => string;
/** Hook that returns the currently selected geochart layer path. */
export declare const useStoreGeochartSelectedLayerPath: () => string;
/**
 * Gets the geochart chart configurations for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The chart configurations keyed by layer path.
 * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
 */
export declare const getStoreGeochartChartsConfig: (mapId: string) => GeoChartStoreByLayerPath;
/**
 * Hook that returns the geochart chart configurations.
 *
 * Uses optional chaining because this hook may be called from components
 * outside the GeoChart plugin where the geochartState may be undefined.
 *
 * @returns The geochart configurations keyed by layer path, or undefined.
 */
export declare const useStoreGeochartChartsConfig: () => GeoChartStoreByLayerPath | undefined;
/**
 * Gets the geochart layer data array for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The geochart result set entries.
 * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
 */
export declare const getStoreGeochartLayerDataArray: (mapId: string) => TypeGeochartResultSetEntry[];
/**
 * Gets the batch layer path bypass for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The layer path that bypasses the batch delay.
 * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
 */
export declare const getStoreGeochartLayerDataArrayBatchLayerPathBypass: (mapId: string) => string;
/**
 * Hook that returns the batched geochart layer data array.
 *
 * Uses optional chaining because this hook may be called from components
 * outside the GeoChart plugin where the geochartState may be undefined.
 *
 * @returns The batched geochart result set entries, or undefined.
 */
export declare const useStoreGeochartLayerDataArrayBatch: () => TypeGeochartResultSetEntry[] | undefined;
/**
 * Sets the geochart chart configurations in the store.
 *
 * @param mapId - The map identifier.
 * @param charts - The chart configurations keyed by layer path.
 * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
 */
export declare const setStoreGeochartCharts: (mapId: string, charts: GeoChartStoreByLayerPath) => void;
/**
 * Sets the geochart layer data array in the store.
 *
 * @param mapId - The map identifier.
 * @param layerDataArray - The geochart result set entries to set.
 * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
 */
export declare const setStoreGeochartLayerDataArray: (mapId: string, layerDataArray: TypeGeochartResultSetEntry[]) => void;
/**
 * Sets the batched geochart layer data array in the store.
 *
 * @param mapId - The map identifier.
 * @param layerDataArrayBatch - The batched geochart result set entries to set.
 * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
 */
export declare const setStoreGeochartLayerDataArrayBatch: (mapId: string, layerDataArrayBatch: TypeGeochartResultSetEntry[]) => void;
/**
 * Sets the batch layer path bypass in the geochart store.
 *
 * @param mapId - The map identifier.
 * @param layerDataArrayBatchLayerPathBypass - The layer path to bypass.
 * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
 */
export declare const setStoreGeochartLayerDataArrayBatchLayerPathBypass: (mapId: string, layerDataArrayBatchLayerPathBypass: string) => void;
/**
 * Sets the selected geochart layer path in the store.
 *
 * @param mapId - The map identifier.
 * @param selectedLayerPath - The layer path to select.
 * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
 */
export declare const setStoreGeochartSelectedLayerPath: (mapId: string, selectedLayerPath: string) => void;
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
export declare const initStoreGeochartCharts: (mapId: string, charts: GeoViewGeoChartConfig[]) => void;
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
export declare const addStoreGeochartChart: (mapId: string, layerPath: string, chartConfig: GeoViewGeoChartConfig) => void;
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
export declare const removeStoreGeochartChart: (mapId: string, layerPath: string, callbackWhenEmpty: () => void) => void;
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
export declare const propagateStoreGeochartFeatureInfoBatch: (mapId: string, layerDataArray: TypeGeochartResultSetEntry[]) => Promise<void>;
/**
 * Initializes Zustand store subscriptions for the geochart state.
 *
 * Sets up watchers for changes in the details layerDataArray (to sync
 * geochart data) and the geochart layerDataArray (to propagate batches).
 *
 * @param store - The GeoView Zustand store instance.
 */
export declare function initGeochartStateSubscriptions(store: GeoviewStoreType): void;
/**
 * Clears all active Zustand subscriptions for the geochart state.
 */
export declare function clearGeochartStateSubscriptions(mapId: string): void;
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
//# sourceMappingURL=geochart-state.d.ts.map