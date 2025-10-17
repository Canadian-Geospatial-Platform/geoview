import type { GeoviewStoreType, IGeoviewState } from '@/core/stores/geoview-store';
import type { TypeAllFeatureInfoResultSetEntry } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import type { TypeFeatureInfoResultSetEntry, TypeHoverResultSetEntry } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import type { TypeGeochartResultSetEntry } from '@/core/stores/store-interface-and-intial-values/geochart-state';
import type { TypeResultSetEntry } from '@/api/types/map-schema-types';
/**
 * Holds the buffer, on a map basis, for the propagation in batch in the layer data array store
 */
export type BatchedPropagationLayerDataArrayByMap<T extends TypeResultSetEntry> = {
    [mapId: string]: T[][];
};
export declare abstract class AbstractEventProcessor {
    #private;
    /**
     * Shortcut to get the store state for a given map id
     *
     * @param {string} mapId the map id to retreive the state for
     * @returns {IGeoviewState} the store state
     */
    protected static getState(mapId: string): IGeoviewState;
    /**
     * Shortcut to get the store state for a given map id
     *
     * @param {string} mapId the map id to retreive the state for
     * @returns {IGeoviewState} the store state
     */
    protected static getStateAsync(mapId: string): Promise<IGeoviewState>;
    /**
     * Initializes the processor
     * @param {GeoviewStoreType} store the store to initialize the processor with
     */
    initialize(store: GeoviewStoreType): void;
    protected onInitialize(store: GeoviewStoreType): Array<() => void> | void;
    /**
     * Destroys the processor
     * @param {GeoviewStoreType} store the store to initialize the processor with
     */
    destroy(): void;
    protected onDestroy(): void;
    /**
     * Helper method to propagate in the layerDataArray in a batched manner.
     * The propagation can be bypassed using 'layerPathBypass' parameter which tells the process to
     * immediately batch out the array in the store for faster triggering of the state, for faster updating of the UI.
     * @param {string} mapId The map id
     * @param {T[]} layerDataArray The layer data array to hold in buffer during the batch
     * @param {BatchedPropagationLayerDataArrayByMap<T>} batchPropagationObject A reference to the BatchedPropagationLayerDataArrayByMap object used to hold all the layer data arrays in the buffer
     * @param {number} timeDelayBetweenPropagations The delay between actual propagations in the store
     * @param {(layerDataArray: T[]) => void} onSetLayerDataArray The store action callback used to store the layerDataArray in the actual store
     * @param {string} traceProcessorIndication? Simple parameter for logging purposes
     * @param {string} layerPathBypass? Indicates a layer path which, when processed, should bypass the buffer period and immediately trigger an update to the store
     * @param {(layerPath: string) => void} onResetBypass? The store action callback used to reset the layerPathBypass value in the store.
     *                                                     This is used so that when the bypass occurred once, it's not occuring again for all subsequent checks in the period of batch propagations.
     *                                                     It's up to the components to re-initialize the layerPathBypass at a certain time.
     *                                                     When no onResetBypass is specified, once the bypass occurs, all subsequent propagations happen immediately.
     * @returns {Promise<void>} Promise upon completion
     */
    protected static helperPropagateArrayStoreBatch<T extends TypeFeatureInfoResultSetEntry | TypeAllFeatureInfoResultSetEntry | TypeHoverResultSetEntry | TypeGeochartResultSetEntry>(mapId: string, layerDataArray: T[], batchPropagationObject: BatchedPropagationLayerDataArrayByMap<T>, timeDelayBetweenPropagations: number, onSetLayerDataArray: (layerDataArray: T[]) => void, traceProcessorIndication?: string, layerPathBypass?: string, onResetBypass?: (layerPath: string) => void): Promise<void>;
}
//# sourceMappingURL=abstract-event-processor.d.ts.map