import { TypeFeatureInfoResultsSet, EventType } from '@/api/events/payloads/get-feature-info-payload';
import { IFeatureInfoState } from '@/core/stores';
import { AbstractEventProcessor } from '../abstract-event-processor';
/**
 * Event processor focusing on interacting with the feature info state in the store (currently called detailsState).
 */
export declare class FeatureInfoEventProcessor extends AbstractEventProcessor {
    private static batchedPropagationLayerDataArray;
    private static timeDelayBetweenPropagationsForBatch;
    /**
     * Shortcut to get the Feature Info state for a given map id
     * @param {string} mapId The mapId
     * @returns {IFeatureInfoState} The Feature Info state
     */
    protected static getFeatureInfoState(mapId: string): IFeatureInfoState;
    /**
     * Static method used to propagate feature info layer sets to the store
     *
     * @param {string} mapId The map identifier of the resul set modified.
     * @param {string} layerPath The layer path that has changed.
     * @param {EventType} eventType The event type that triggered the layer set update.
     * @param {TypeFeatureInfoResultsSet} resultsSet The resul sets associated to the map.
     */
    static propagateFeatureInfoToStore(mapId: string, layerPath: string, eventType: EventType, resultsSet: TypeFeatureInfoResultsSet): void;
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
