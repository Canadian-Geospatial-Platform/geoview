import { TypeArrayOfLayerData, TypeJsonObject } from '@/core/types/global-types';
import { IGeochartState } from '@/core/stores/store-interface-and-intial-values/geochart-state';
import { AbstractEventProcessor, BatchedPropagationLayerDataArrayByMap } from '../abstract-event-processor';
/**
 * Event processor focusing on interacting with the geochart state in the store.
 */
export declare class GeochartEventProcessor extends AbstractEventProcessor {
    static batchedPropagationLayerDataArray: BatchedPropagationLayerDataArrayByMap;
    static timeDelayBetweenPropagationsForBatch: number;
    /**
     * Shortcut to get the Geochart state for a given map id
     * @param {string} mapId The mapId
     * @returns {IGeochartState | undefined} The Geochart state. Forcing the return to also be 'undefined', because
     *                                       there will be no geochartState if the Geochart plugin isn't active.
     *                                       This helps the developers making sure the existence is checked.
     */
    protected static getGeochartState(mapId: string): IGeochartState | undefined;
    /**
     * Set the default layers from configuration.
     * In the store, the GeoChart configurations are stored in an object with layerPath as its property name
     * (to retrieve the configuration per layer faster).
     *
     * @param {string} mapId the map id
     * @param {TypeJsonObject} charts The array of JSON configuration for geochart
     */
    static setGeochartCharts(mapId: string, charts: TypeJsonObject[]): void;
    /**
     * Propagate feature info layer sets to the store and the also in a batched manner.
     * @param {string} mapId The map id
     * @param {string} layerDataArray The layer data array to propagate in the store
     */
    static propagateArrayDataToStore(mapId: string, layerDataArray: TypeArrayOfLayerData): void;
    /**
     * Propagate feature info layer sets to the store in a batched manner, every 'timeDelayBetweenPropagationsForBatch' millisecond.
     * This is used to provide another 'layerDataArray', in the store, which updates less often so that we save a couple 'layerDataArray'
     * update triggers in the components that are listening to the store array.
     * The propagation can be bypassed using the store 'layerDataArrayBatchLayerPathBypass' state which tells the process to
     * immediately batch out the array in the store for faster triggering of the state, for faster updating of the UI.
     * @param {string} mapId The map id
     * @param {string} layerDataArray The layer data array to batch on
     * @returns {Promise<void>} Promise upon completion
     */
    private static propagateFeatureInfoToStoreBatch;
}
