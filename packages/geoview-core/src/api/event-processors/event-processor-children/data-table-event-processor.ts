import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import type {
  IDataTableState,
  IDataTableSettings,
  TypeAllFeatureInfoResultSetEntry,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { logger } from '@/core/utils/logger';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import type { TypeFeatureInfoEntry, TypeLayerData, TypeResultSetEntry } from '@/api/types/map-schema-types';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with UIEventProcessor vs UIState

export class DataTableEventProcessor extends AbstractEventProcessor {
  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  // GV Typescript MUST always use the defined store actions below to modify store - NEVER use setState!
  // GV Some action does state modifications AND map actions.
  // GV ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************

  /**
   * Retrieves the data table state slice from the store for the specified map.
   * Provides access to feature data arrays, active layer data, table settings, and filters.
   * Used by other processors and data table UI components to access current table state.
   * @param {string} mapId - The map identifier
   * @returns {IDataTableState} The data table state slice containing all table-related data
   * @static
   * @protected
   */
  protected static getDataTableState(mapId: string): IDataTableState {
    // Return the DataTable state
    return super.getState(mapId).dataTableState;
  }

  /**
   * Retrieves a specific property from the data table state.
   * Provides type-safe access to feature arrays, layer data, settings, selected features, and filters.
   * Returns undefined if the state doesn't exist for the specified map.
   * @param {string} mapId - The map identifier
   * @param {'allFeaturesDataArray' | 'activeLayerData' | 'layersDataTableSetting' | 'selectedFeature' | 'selectedLayerPath' | 'tableFilters'} state - The state property key to retrieve
   * @returns {string | TypeAllFeatureInfoResultSetEntry[] | TypeLayerData[] | Record<string, IDataTableSettings> | TypeFeatureInfoEntry | Record<string, string> | undefined | null} The requested state property value
   * @static
   */
  static getSingleDataTableState(
    mapId: string,
    state: 'allFeaturesDataArray' | 'activeLayerData' | 'layersDataTableSetting' | 'selectedFeature' | 'selectedLayerPath' | 'tableFilters'
  ):
    | string
    | TypeAllFeatureInfoResultSetEntry[]
    | TypeLayerData[]
    | IDataTableSettings
    | Record<string, IDataTableSettings>
    | TypeFeatureInfoEntry
    | Record<string, string>
    | undefined
    | null {
    if (this.getDataTableState(mapId)) return this.getDataTableState(mapId)[state];
    return undefined;
  }

  /**
   * Retrieves the filter string applied to a specific layer in the data table.
   * Used to get the current filter expression for displaying filtered records.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The unique path identifying the layer
   * @returns {string | undefined} The filter string, or undefined if no filter is applied
   * @static
   */
  static getTableFilter(mapId: string, layerPath: string): string | undefined {
    return this.getDataTableState(mapId)?.tableFilters[layerPath];
  }

  /**
   * Updates map layer filters based on data table filter state.
   * Applies or removes filters on the map based on the mapFilteredRecord toggle.
   * When enabled, only features matching the filter criteria are displayed on the map.
   * Constructs filter string, updates table filter state, and triggers layer filtering via MapEventProcessor.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The unique path identifying the layer
   * @param {string} filterStrings - The filter expression to apply
   * @param {boolean} mapFilteredRecord - True to apply filter to map, false to remove filter
   * @returns {void}
   * @static
   */
  static updateFilters(mapId: string, layerPath: string, filterStrings: string, mapFilteredRecord: boolean): void {
    const filter = mapFilteredRecord ? filterStrings : '';
    this.addOrUpdateTableFilter(mapId, layerPath, filter);
    MapEventProcessor.applyLayerFilters(mapId, layerPath);
  }

  /**
   * Initializes the data table settings for a layer.
   * Sets up initial column configurations, sorting, and filtering settings.
   * Called when a layer is first added to the data table.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The unique path identifying the layer
   * @returns {void}
   * @static
   */
  static setInitialSettings(mapId: string, layerPath: string): void {
    this.getDataTableState(mapId).setterActions.setInitiallayerDataTableSetting(layerPath);
  }

  /**
   * Adds or updates the filter string for a layer in the data table state.
   * Stores the filter expression that will be applied when querying layer features.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The unique path identifying the layer
   * @param {string} filter - The filter expression to store
   * @returns {void}
   * @static
   */
  static addOrUpdateTableFilter(mapId: string, layerPath: string, filter: string): void {
    const curTableFilters = this.getDataTableState(mapId)?.tableFilters;
    this.getDataTableState(mapId)?.setterActions.setTableFilters({ ...curTableFilters, [layerPath]: filter });
  }

  /**
   * Triggers a query to retrieve all features for a layer.
   * Calls the AllFeatureInfoLayerSet to fetch complete feature data for the data table.
   * Returns a promise that resolves with the feature array when the query completes.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The unique path identifying the layer to query
   * @returns {Promise<TypeFeatureInfoEntry[] | void>} Promise that resolves with feature data or void
   * @static
   */
  static triggerGetAllFeatureInfo(mapId: string, layerPath: string): Promise<TypeFeatureInfoEntry[] | void> {
    return MapEventProcessor.getMapViewerLayerAPI(mapId).allFeatureInfoLayerSet.queryLayer(layerPath);
  }

  /**
   * Resets and clears all feature data for a layer in the data table.
   * Removes cached features from the AllFeatureInfoLayerSet and clears the selected layer.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The unique path identifying the layer to reset
   * @returns {void}
   * @static
   */
  static triggerResetFeatureInfo(mapId: string, layerPath: string): void {
    // Clear
    MapEventProcessor.getMapViewerLayerAPI(mapId).allFeatureInfoLayerSet.clearLayerFeatures(layerPath);

    // Update the layer data array in the store, all the time
    this.getDataTableState(mapId).setterActions.setSelectedLayerPath('');
  }

  /**
   * Propagates all feature info result set to the data table store.
   * Adds new layer feature data to the store if not already present.
   * Called by AllFeatureInfoLayerSet when feature queries complete.
   * @param {string} mapId - The map identifier
   * @param {TypeAllFeatureInfoResultSetEntry} resultSetEntry - The feature result set to propagate
   * @returns {void}
   * @static
   */
  static propagateFeatureInfoToStore(mapId: string, resultSetEntry: TypeAllFeatureInfoResultSetEntry): void {
    /**
     * Create a get all features info object for each layer which is then used to render layers
     */
    const allFeaturesDataArray = [...this.getDataTableState(mapId).allFeaturesDataArray];
    if (!allFeaturesDataArray.find((layerEntry) => layerEntry.layerPath === resultSetEntry.layerPath)) {
      allFeaturesDataArray.push(resultSetEntry);
    }

    // Update the layer data array in the store, all the time
    this.getDataTableState(mapId).setterActions.setAllFeaturesDataArray(allFeaturesDataArray);
  }

  /**
   * Deletes all feature data for a layer from the data table store.
   * Removes the layer's feature array from allFeaturesDataArray.
   * Called when a layer is removed from the map or data table.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The unique path identifying the layer to delete
   * @returns {void}
   * @static
   */
  static deleteFeatureAllInfo(mapId: string, layerPath: string): void {
    // Redirect to helper function
    this.#deleteFromArray(this.getDataTableState(mapId).allFeaturesDataArray, layerPath, (layerArrayResult) => {
      // Update the layer data array in the store
      this.getDataTableState(mapId).setterActions.setAllFeaturesDataArray(layerArrayResult);

      // Log
      logger.logInfo('Removed Data Table Info in stores for layer path:', layerPath);
    });
  }

  /**
   * Internal helper method to remove a layer's data from an array by layer path.
   * Searches for the layer in the array, removes it if found, and executes a callback with the updated array.
   * Used by delete operations to maintain consistency across different feature info arrays.
   * @param {T[]} layerArray - The array containing layer result set entries to search
   * @param {string} layerPath - The unique path identifying the layer to remove
   * @param {(layerArray: T[]) => void} onDeleteCallback - Callback function executed with the modified array after deletion
   * @returns {void}
   * @private
   * @static
   */
  static #deleteFromArray<T extends TypeResultSetEntry>(
    layerArray: T[],
    layerPath: string,
    onDeleteCallback: (layerArray: T[]) => void
  ): void {
    // TODO: Refactor - Move this function in Abstract class (along with other duplicate function in FeatureInfoEventProcessor)
    // Find the layer data info to delete from the array
    const layerDataInfoToDelIndex = layerArray.findIndex((layerInfo) => layerInfo.layerPath === layerPath);

    // If found
    if (layerDataInfoToDelIndex >= 0) {
      // Remove from the array
      layerArray.splice(layerDataInfoToDelIndex, 1);

      // Callback with updated array
      onDeleteCallback(layerArray);
    }
  }
}
