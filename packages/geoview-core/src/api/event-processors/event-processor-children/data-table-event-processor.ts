import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import {
  IDataTableState,
  IDataTableSettings,
  TypeAllFeatureInfoResultSetEntry,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { logger } from '@/core/utils/logger';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { TypeFeatureInfoEntry, TypeLayerData, TypeResultSetEntry } from '@/api/config/types/map-schema-types';

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
   * Shortcut to get the DataTable state for a given map id
   * @param {string} mapId - The mapId
   * @returns {IDataTableState} The DataTable state
   */
  protected static getDataTableState(mapId: string): IDataTableState {
    // Return the DataTable state
    return super.getState(mapId).dataTableState;
  }

  /**
   * Get a specific state.
   * @param {string} mapId - The mapId
   * @param {'allFeaturesDataArray' | 'activeLayerData' | 'layersDataTableSetting' | 'selectedFeature' | 'selectedLayerPath' | 'tableFilters'} state - The state to get
   * @returns {string | TypeAllFeatureInfoResultSetEntry[] | TypeLayerData[] | Record<string, IDataTableSettings> | TypeFeatureInfoEntry | Record<string, string> | undefined | null} The requested state
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
   * Gets filter(s) for a layer.
   * @param {string} mapId - The map id of the state to act on
   * @param {string} layerPath - The path of the layer
   * @returns {string | undefined} The data table filter(s) for the layer
   */
  static getTableFilter(mapId: string, layerPath: string): string | undefined {
    return this.getDataTableState(mapId)?.tableFilters[layerPath];
  }

  /**
   * Filter the map based on filters set on date table.
   * @param {string} mapId - Id of the map.
   * @param {string} layerPath - Path of the layer
   * @param {string} filterStrings - Filters set on the data table
   * @param {boolean} mapFilteredRecord - Filtered Map switch is on/off.
   */
  static updateFilters(mapId: string, layerPath: string, filterStrings: string, mapFilteredRecord: boolean): void {
    const filter = mapFilteredRecord ? filterStrings : '';
    this.addOrUpdateTableFilter(mapId, layerPath, filter);
    MapEventProcessor.applyLayerFilters(mapId, layerPath);
  }

  /**
   * Initialize columns filter information for a layer.
   * @param {string} mapId - Id of the map.
   * @param {string} layerPath - Path of the layer
   */
  static setInitialSettings(mapId: string, layerPath: string): void {
    this.getDataTableState(mapId).setterActions.setInitiallayerDataTableSetting(layerPath);
  }

  /**
   * Sets the filter for the layer path
   * @param {string} mapId - The map id of the state to act on
   * @param {string} layerPath - The layer path to use
   * @param {string} filter - The filter
   */
  static addOrUpdateTableFilter(mapId: string, layerPath: string, filter: string): void {
    const curTableFilters = this.getDataTableState(mapId)?.tableFilters;
    this.getDataTableState(mapId)?.setterActions.setTableFilters({ ...curTableFilters, [layerPath]: filter });
  }

  /**
   * Shortcut to get the DataTable state for a given map id
   * @param {string} mapId - Id of the map.
   * @param {string} layerPath - Layer path to apply filter.
   * @returns {Promise<TypeFeatureInfoEntry[] | void>}
   */
  static triggerGetAllFeatureInfo(mapId: string, layerPath: string): Promise<TypeFeatureInfoEntry[] | void> {
    return MapEventProcessor.getMapViewerLayerAPI(mapId).allFeatureInfoLayerSet.queryLayer(layerPath, 'all');
  }

  /**
   * Propagates feature info layer sets to the store.
   * The propagation actually happens only if it wasn't already there. Otherwise, no update is propagated.
   * @param {string} mapId - The map identifier of the modified result set.
   * @param {TypeAllFeatureInfoResultSetEntry} resultSetEntry - The result set associated to the map.
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
   * Deletes the specified layer path from the all features layers sets in the store
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path to delete
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
   * Helper function to delete a layer information from an array when found
   * @param {T[]} layerArray - The layer array to work with
   * @param {string} layerPath - The layer path to delete
   * @param {(layerArray: T[]) => void} onDeleteCallback - The callback executed when the array is updated
   * @private
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
