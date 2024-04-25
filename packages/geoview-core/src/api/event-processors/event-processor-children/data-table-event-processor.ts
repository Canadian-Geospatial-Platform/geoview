import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { EsriDynamic } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { TypeLayerEntryConfig } from '@/geo/map/map-schema-types';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { TypeFeatureInfoResultSet } from '@/geo/layer/layer-sets/feature-info-layer-set';
import { IDataTableState } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { logger } from '@/core/utils/logger';
import { TypeLayerData } from '@/geo/layer/layer-sets/layer-set';
import { TypeAllFeatureInfoResultSet } from '@/geo/layer/layer-sets/all-feature-info-layer-set';
import { MapEventProcessor } from './map-event-processor';

// GV The paradigm when working with DataTableEventProcessor vs DataTableState goes like this:
// GV DataTableState provides: 'state values', 'actions' and 'setterActions'.
// GV Whereas Zustand would suggest having 'state values' and 'actions', in GeoView, we have a 'DataTableEventProcessor' in the middle.
// GV This is because we wanted to have centralized code between UI actions and backend actions via a DataTableEventProcessor.
// GV In summary:
// GV The UI components should use DataTableState's 'state values' to read and 'actions' to set states (which simply redirect to DataTableEventProcessor).
// GV The back-end code should use DataTableEventProcessor which uses 'state values' and 'setterActions'
// GV Essentially 3 main call-stacks:
// GV   - DataTableEventProcessor ---calls---> DataTableState.setterActions
// GV   - UI Component ---calls---> DataTableState.actions ---calls---> DataTableEventProcessor ---calls---> DataTableState.setterActions
// GV   - DataTableEventProcessor ---triggers---> DataTableViewer events ---calls---> DataTableState.setterActions
// GV The reason for this pattern is so that UI components and processes performing back-end code
// GV both end up running code in DataTableEventProcessor (UI: via 'actions' and back-end code via 'DataTableEventProcessor')

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
   * Filter the map based on filters set on date table.
   * @param {string} mapId - Id of the map.
   * @param {string} layerPath - Path of the layer
   * @param {string} filterStrings - Filters set on the data table
   * @param {boolean} isMapRecordExist - Filtered Map switch is on off.
   */
  static applyFilters(mapId: string, layerPath: string, filterStrings: string, isMapRecordExist: boolean): void {
    const geoviewLayerInstance = MapEventProcessor.getMapViewerLayerAPI(mapId).geoviewLayer(layerPath);
    const filterLayerConfig = MapEventProcessor.getMapViewerLayerAPI(mapId).registeredLayers[layerPath] as TypeLayerEntryConfig;

    if (isMapRecordExist && geoviewLayerInstance !== undefined && filterLayerConfig !== undefined && filterStrings.length) {
      (geoviewLayerInstance as AbstractGeoViewVector | EsriDynamic)?.applyViewFilter(layerPath, filterStrings);
    } else {
      (geoviewLayerInstance as AbstractGeoViewVector | EsriDynamic)?.applyViewFilter(layerPath, '');
    }
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
   * Shortcut to get the DataTable state for a given map id
   * @param {string} mapId - Id of the map.
   * @param {string} layerPath - Layer path to apply filter.
   * @returns {Promise<TypeAllFeatureInfoResultSet | void>}
   */
  static triggerGetAllFeatureInfo(mapId: string, layerPath: string): Promise<TypeAllFeatureInfoResultSet | void> {
    return MapEventProcessor.getMapViewerLayerAPI(mapId).allFeatureInfoLayerSet.queryLayer(layerPath, 'all');
  }

  /**
   * Propagates feature info layer sets to the store
   *
   * @param {string} mapId - The map identifier of the modified result set.
   * @param {string} layerPath - The layer path that has changed.
   * @param {TypeFeatureInfoResultSet} resultSet - The result set associated to the map.
   */
  static propagateFeatureInfoToStore(mapId: string, layerPath: string, resultSet: TypeFeatureInfoResultSet): void {
    /**
     * Create a get all features info object for each layer which is then used to render layers
     */
    const allFeaturesDataArray = [...this.getDataTableState(mapId).allFeaturesDataArray];
    if (!allFeaturesDataArray.find((layerEntry) => layerEntry.layerPath === layerPath)) {
      allFeaturesDataArray.push((resultSet as TypeFeatureInfoResultSet)?.[layerPath]?.data);
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
   * @param {TypeLayerData[]} layerArray - The layer array to work with
   * @param {string} layerPath - The layer path to delete
   * @param {(layerArray: TypeLayerData[]) => void} onDeleteCallback - The callback executed when the array is updated
   * @private
   */
  static #deleteFromArray<T extends TypeLayerData>(layerArray: T[], layerPath: string, onDeleteCallback: (layerArray: T[]) => void): void {
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
