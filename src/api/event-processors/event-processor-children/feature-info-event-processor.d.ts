import { EventType } from '@/geo/layer/layer-sets/abstract-layer-set';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { IFeatureInfoState, TypeFeatureInfoResultSetEntry } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { GeoviewStoreType } from '@/core/stores/geoview-store';
/**
 * Event processor focusing on interacting with the feature info state in the store (currently called detailsState).
 */
export declare class FeatureInfoEventProcessor extends AbstractEventProcessor {
    #private;
    /**
     * Overrides initialization of the GeoChart Event Processor
     * @param {GeoviewStoreType} store The store associated with the GeoChart Event Processor
     * @returns An array of the subscriptions callbacks which were created
     */
    protected onInitialize(store: GeoviewStoreType): Array<() => void> | void;
    /**
     * Shortcut to get the Feature Info state for a given map id
     * @param {string} mapId - The mapId
     * @returns {IFeatureInfoState} The Feature Info state
     */
    protected static getFeatureInfoState(mapId: string): IFeatureInfoState;
    /**
     * Get the selectedLayerPath value
     * @param {string} mapId - The map identifier
     * @returns {string}} the selected layer path
     */
    static getSelectedLayerPath(mapId: string): string;
    /**
     * Deletes the feature from a resultSet for a specific layerPath. At the same time it check for
     * removing the higlight and the click marker if selected layer path is the reset path
     * @param {string} mapId - The map identifier
     * @param {string} layerPath - The layer path to delete features from resultSet
     */
    static resetResultSet(mapId: string, layerPath: string): void;
    /**
     * Deletes the specified layer path from the layer sets in the store. The update of the array will also trigger an update in a batched manner.
     * @param {string} mapId - The map identifier
     * @param {string} layerPath - The layer path to delete
     * @returns {Promise<void>}
     */
    static deleteFeatureInfo(mapId: string, layerPath: string): void;
    /**
     * Propagates feature info layer sets to the store. The update of the array will also trigger an update in a batched manner.
     *
     * @param {string} mapId - The map identifier of the modified result set.
     * @param {string} layerPath - The layer path that has changed.
     * @param {EventType} eventType - The event type that triggered the layer set update.
     * @param {TypeFeatureInfoResultSetEntry} resultSetEntry - The result set entry being propagated.
     * @returns {Promise<void>}
     */
    static propagateFeatureInfoToStore(mapId: string, eventType: EventType, resultSetEntry: TypeFeatureInfoResultSetEntry): Promise<void>;
}
