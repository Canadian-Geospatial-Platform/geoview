import type { GeoviewStoreType } from './geoview-store';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import type { TypeResultSetEntry } from '@/api/types/map-schema-types';
import { type TypeFeatureInfoResultSetEntry, type TypeHoverResultSetEntry } from './store-interface-and-intial-values/feature-info-state';
import type { TypeAllFeatureInfoResultSetEntry } from './store-interface-and-intial-values/data-table-state';
import { type TypeGeochartResultSetEntry } from './store-interface-and-intial-values/geochart-state';
export interface StoresManagerState {
    stores: Record<string, GeoviewStoreType>;
}
export declare const useStoresManager: import("zustand").StoreApi<StoresManagerState>;
export declare const getGeoViewStore: (id: string) => GeoviewStoreType;
export declare const getGeoViewStoreAsync: (id: string) => Promise<GeoviewStoreType>;
export declare function hasTimeSliderPlugin(store: GeoviewStoreType): boolean;
export declare function hasGeochartPlugin(store: GeoviewStoreType): boolean;
export declare function hasSwiperPlugin(store: GeoviewStoreType): boolean;
export declare function hasDrawerPlugin(store: GeoviewStoreType): boolean;
export declare const addGeoViewStore: (config: TypeMapFeaturesConfig) => void;
export declare const removeGeoviewStore: (id: string) => void;
/**
 * Hook to access the GeoView store from the context.
 *
 * @returns The GeoView store instance from the context.
 * @throws {Error} When used outside of a StoreContext.Provider.
 */
export declare const useGeoViewStore: () => GeoviewStoreType;
/**
 * Helper function to delete a layer information from an array when found.
 *
 * @param layerArray - The layer array to work with
 * @param layerPath - The layer path to delete
 * @param onDeleteCallback - The callback executed when the array is updated
 */
export declare const helperDeleteFromArray: <T extends TypeResultSetEntry>(layerArray: T[], layerPath: string, onDeleteCallback: (layerArray: T[]) => void) => void;
/**
 * Helper method to propagate in the layerDataArray in a batched manner.
 * The propagation can be bypassed using 'layerPathBypass' parameter which tells the process to
 * immediately batch out the array in the store for faster triggering of the state, for faster updating of the UI.
 *
 * @param mapId - The map id
 * @param layerDataArray - The layer data array to hold in buffer during the batch
 * @param batchPropagationObject - A reference to the BatchedPropagationLayerDataArrayByMap object used to hold all the layer data arrays in the buffer
 * @param timeDelayBetweenPropagations - The delay between actual propagations in the store
 * @param onSetStoreLayerDataArray - The store action callback used to store the layerDataArray in the actual store
 * @param traceProcessorIndication? - Simple parameter for logging purposes
 * @param layerPathBypass? - Indicates a layer path which, when processed, should bypass the buffer period and immediately trigger an update to the store
 * @param onResetBypass? - The store action callback used to reset the layerPathBypass value in the store.
 *                                                     This is used so that when the bypass occurred once, it's not occuring again for all subsequent checks in the period of batch propagations.
 *                                                     It's up to the components to re-initialize the layerPathBypass at a certain time.
 *                                                     When no onResetBypass is specified, once the bypass occurs, all subsequent propagations happen immediately.
 * @returns Promise upon completion
 */
export declare const helperPropagateArrayStoreBatch: <T extends TypeFeatureInfoResultSetEntry | TypeAllFeatureInfoResultSetEntry | TypeHoverResultSetEntry | TypeGeochartResultSetEntry>(mapId: string, layerDataArray: T[], batchPropagationObject: BatchedPropagationLayerDataArrayByMap<T>, timeDelayBetweenPropagations: number, onSetStoreLayerDataArray: (layerDataArray: T[]) => void, traceProcessorIndication?: string, layerPathBypass?: string, onResetBypass?: (layerPath: string) => void) => Promise<void>;
/**
 * Holds the buffer, on a map basis, for the propagation in batch in the layer data array store
 */
export type BatchedPropagationLayerDataArrayByMap<T extends TypeResultSetEntry> = {
    [mapId: string]: T[][];
};
/**
 * Represents a subscription delegate
 */
export type SubscriptionDelegate = () => void;
//# sourceMappingURL=stores-managers.d.ts.map