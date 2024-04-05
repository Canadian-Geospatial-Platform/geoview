import { api } from '@/app';
import { GeoviewStoreType } from '@/core/stores';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { EsriDynamic } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { TypeLayerEntryConfig } from '@/geo/map/map-schema-types';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { TypeFeatureInfoResultSet } from '@/geo/utils/feature-info-layer-set';
import { IDataTableState } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { logger } from '@/core/utils/logger';
import { TypeLayerData } from '@/geo/utils/layer-set';

export class DataTableEventProcessor extends AbstractEventProcessor {
  // TODO: refactor - we should centralize the propagation to store from where the remove layer happend... this code is repeated
  // TD.CONT: qhen we do this, clean other obejct at the same time... each processor has a clean function called from where the remove
  /**
   * Overrides initialization of the Feature Info Event Processor
   * @param {GeoviewStoreType} store - The store associated with the Feature Info Event Processor
   * @returns An array of the subscriptions callbacks which were created
   */
  protected onInitialize(store: GeoviewStoreType): Array<() => void> | void {
    // Checks for udpated layers in layer order
    const unsubLayerRemoved = store.subscribe(
      (state) => state.mapState.orderedLayerInfo,
      (cur, prev) => {
        // Log
        logger.logTraceCoreStoreSubscription('DATATABLE EVENT PROCESSOR - orderedLayerInfo', cur);

        // For each layer path in the layer data array
        const curOrderedLayerPaths = cur.map((layerInfo) => layerInfo.layerPath);
        const prevOrderedLayerPaths = prev.map((layerInfo) => layerInfo.layerPath);
        store
          .getState()
          .dataTableState.allFeaturesDataArray.map((layerInfo) => layerInfo.layerPath)
          .forEach((layerPath) => {
            // If it was in the layer data array and is not anymore
            if (prevOrderedLayerPaths.includes(layerPath) && !curOrderedLayerPaths.includes(layerPath)) {
              // Remove it from all features array
              DataTableEventProcessor.#deleteFeatureAllInfo(store.getState().mapId, layerPath);

              // Log
              logger.logInfo('Removed Feature Info in stores for layer path:', layerPath);
            }
          });
      }
    );

    return [unsubLayerRemoved];
  }

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
  static applyFilters(mapId: string, layerPath: string, filterStrings: string, isMapRecordExist: boolean) {
    const geoviewLayerInstance = api.maps[mapId].layer.geoviewLayer(layerPath);
    const filterLayerConfig = api.maps[mapId].layer.registeredLayers[layerPath] as TypeLayerEntryConfig;

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
    this.getDataTableState(mapId).actions.setInitiallayerDataTableSetting(layerPath);
  }

  /**
   * Shortcut to get the DataTable state for a given map id
   * @param {string} mapId - Id of the map.
   * @param {string} layerPath - Layer path to apply filter.
   */
  static triggerGetAllFeatureInfo(mapId: string, layerPath: string): void {
    // TODO: do not use api... pass layer object to data table event processor... or use api.... in processor
    api.maps[mapId].layer.allFeatureInfoLayerSet.queryLayer(layerPath, 'all');
  }

  /**
   * Propagates feature info layer sets to the store
   *
   * @param {string} mapId - The map identifier of the modified result set.
   * @param {string} layerPath - The layer path that has changed.
   * @param {TypeFeatureInfoResultSet} resultSet - The result set associated to the map.
   */
  static propagateFeatureInfoToStore(mapId: string, layerPath: string, resultSet: TypeFeatureInfoResultSet) {
    /**
     * Create a get all features info object for each layer which is then used to render layers
     */
    const allFeaturesDataArray = [...this.getDataTableState(mapId).allFeaturesDataArray];
    if (!allFeaturesDataArray.find((layerEntry) => layerEntry.layerPath === layerPath)) {
      allFeaturesDataArray.push((resultSet as TypeFeatureInfoResultSet)?.[layerPath]?.data);
    }

    // Update the layer data array in the store, all the time
    this.getDataTableState(mapId).actions.setAllFeaturesDataArray(allFeaturesDataArray);
  }

  /**
   * Deletes the specified layer path from the all features layers sets in the store
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path to delete
   * @private
   */
  static #deleteFeatureAllInfo(mapId: string, layerPath: string) {
    // Redirect to helper function
    this.#deleteFromArray(this.getDataTableState(mapId).allFeaturesDataArray, layerPath, (layerArrayResult) => {
      // Update the layer data array in the store
      this.getDataTableState(mapId).actions.setAllFeaturesDataArray(layerArrayResult);
    });
  }

  /**
   * Helper function to delete a layer information from an array when found
   * @param {TypeLayerData[]} layerArray - The layer array to work with
   * @param {string} layerPath - The layer path to delete
   * @param {(layerArray: TypeLayerData[]) => void} onDeleteCallback - The callback executed when the array is updated
   * @private
   */
  static #deleteFromArray<T extends TypeLayerData>(layerArray: T[], layerPath: string, onDeleteCallback: (layerArray: T[]) => void) {
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
