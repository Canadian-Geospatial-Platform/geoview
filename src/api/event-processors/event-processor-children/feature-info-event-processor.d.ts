import type { TypeMapMouseInfo } from '@/geo/map/map-viewer';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import type { TypeFeatureInfoEntry } from '@/api/types/map-schema-types';
import type { IFeatureInfoState, TypeFeatureInfoResultSetEntry } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import type { GeoviewStoreType } from '@/core/stores/geoview-store';
/**
 * Event processor focusing on interacting with the feature info state in the store (currently called detailsState).
 */
export declare class FeatureInfoEventProcessor extends AbstractEventProcessor {
    #private;
    static TIME_DELAY_BETWEEN_PROPAGATION_FOR_BATCH: number;
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
     * Gets the selectedLayerPath value
     * @param {string} mapId - The map identifier
     * @returns {string} the selected layer path
     */
    static getSelectedLayerPath(mapId: string): string;
    /**
     * Sets the selectedLayerPath value
     * @param {string} mapId - The map identifier
     * @param {string} layerPath - The layer path to select
     */
    static setSelectedLayerPath(mapId: string, layerPath: string): void;
    /**
     * Gets the layer data array for one layer.
     * @param {string} mapId - The map id.
     * @param {string} layerPath - The path of the layer to get.
     * @returns {TypeOrderedLayerInfo | undefined} The ordered layer info.
     */
    static findLayerDataFromLayerDataArray(mapId: string, layerPath: string, layerDataArray?: TypeFeatureInfoResultSetEntry[]): TypeFeatureInfoResultSetEntry | undefined;
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
     * @returns {void}
     */
    static deleteFeatureInfo(mapId: string, layerPath: string): void;
    /**
     * Repeats the last feature info query if any.
     * @param {string} mapId - The map identifier
     * @returns {void}
     * @static
     */
    static repeatLastQuery(mapId: string): void;
    /**
     * Switch the open panel to details when a map click occurs, if it is not already geochart or details.
     * @param {string} mapId - The map identifier of the modified result set.
     */
    static openDetailsPanelOnMapClick(mapId: string): void;
    /**
     * Propagates feature info layer sets to the store. The update of the array will also trigger an update in a batched manner.
     * @param {string} mapId - The map identifier of the modified result set.
     * @param {TypeFeatureInfoResultSetEntry} resultSetEntry - The result set entry being propagated.
     */
    static propagateFeatureInfoToStore(mapId: string, resultSetEntry: TypeFeatureInfoResultSetEntry): void;
    static createCoordinateInfoLayer(mapId: string, features?: TypeFeatureInfoEntry[]): void;
    /**
     * Queries coordinate information from endpoints
     * @param {string} mapId - The map ID
     * @param {[number, number]} coordinates - The lng/lat coordinates
     * @returns {Promise<TypeCoordinateInfo>} Promise of coordinate information
     */
    static getCoordinateInfo(mapId: string, coordinates: TypeMapMouseInfo): void;
}
//# sourceMappingURL=feature-info-event-processor.d.ts.map