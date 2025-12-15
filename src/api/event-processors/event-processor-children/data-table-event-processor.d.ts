import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import type { IDataTableState, IDataTableSettings, TypeAllFeatureInfoResultSetEntry } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import type { TypeFeatureInfoEntry, TypeLayerData } from '@/api/types/map-schema-types';
export declare class DataTableEventProcessor extends AbstractEventProcessor {
    #private;
    /**
     * Shortcut to get the DataTable state for a given map id
     * @param {string} mapId - The mapId
     * @returns {IDataTableState} The DataTable state
     */
    protected static getDataTableState(mapId: string): IDataTableState;
    /**
     * Get a specific state.
     * @param {string} mapId - The mapId
     * @param {'allFeaturesDataArray' | 'activeLayerData' | 'layersDataTableSetting' | 'selectedFeature' | 'selectedLayerPath' | 'tableFilters'} state - The state to get
     * @returns {string | TypeAllFeatureInfoResultSetEntry[] | TypeLayerData[] | Record<string, IDataTableSettings> | TypeFeatureInfoEntry | Record<string, string> | undefined | null} The requested state
     */
    static getSingleDataTableState(mapId: string, state: 'allFeaturesDataArray' | 'activeLayerData' | 'layersDataTableSetting' | 'selectedFeature' | 'selectedLayerPath' | 'tableFilters'): string | TypeAllFeatureInfoResultSetEntry[] | TypeLayerData[] | IDataTableSettings | Record<string, IDataTableSettings> | TypeFeatureInfoEntry | Record<string, string> | undefined | null;
    /**
     * Gets filter(s) for a layer.
     * @param {string} mapId - The map id of the state to act on
     * @param {string} layerPath - The path of the layer
     * @returns {string | undefined} The data table filter(s) for the layer
     */
    static getTableFilter(mapId: string, layerPath: string): string | undefined;
    /**
     * Filter the map based on filters set on date table.
     * @param {string} mapId - Id of the map.
     * @param {string} layerPath - Path of the layer
     * @param {string} filterStrings - Filters set on the data table
     * @param {boolean} mapFilteredRecord - Filtered Map switch is on/off.
     */
    static updateFilters(mapId: string, layerPath: string, filterStrings: string, mapFilteredRecord: boolean): void;
    /**
     * Initialize columns filter information for a layer.
     * @param {string} mapId - Id of the map.
     * @param {string} layerPath - Path of the layer
     */
    static setInitialSettings(mapId: string, layerPath: string): void;
    /**
     * Sets the filter for the layer path
     * @param {string} mapId - The map id of the state to act on
     * @param {string} layerPath - The layer path to use
     * @param {string} filter - The filter
     */
    static addOrUpdateTableFilter(mapId: string, layerPath: string, filter: string): void;
    /**
     * Shortcut to get the DataTable state for a given map id and layer path
     * @param {string} mapId - Id of the map.
     * @param {string} layerPath - Layer path to query the features.
     * @returns {Promise<TypeFeatureInfoEntry[] | void>}
     */
    static triggerGetAllFeatureInfo(mapId: string, layerPath: string): Promise<TypeFeatureInfoEntry[] | void>;
    /**
     * Shortcut to reset the DataTable features given map id and layer path
     * @param {string} mapId - Id of the map.
     * @param {string} layerPath - Layer path to reset the features.
     */
    static triggerResetFeatureInfo(mapId: string, layerPath: string): void;
    /**
     * Propagates feature info layer sets to the store.
     * The propagation actually happens only if it wasn't already there. Otherwise, no update is propagated.
     * @param {string} mapId - The map identifier of the modified result set.
     * @param {TypeAllFeatureInfoResultSetEntry} resultSetEntry - The result set associated to the map.
     */
    static propagateFeatureInfoToStore(mapId: string, resultSetEntry: TypeAllFeatureInfoResultSetEntry): void;
    /**
     * Deletes the specified layer path from the all features layers sets in the store
     * @param {string} mapId - The map identifier
     * @param {string} layerPath - The layer path to delete
     */
    static deleteFeatureAllInfo(mapId: string, layerPath: string): void;
}
//# sourceMappingURL=data-table-event-processor.d.ts.map