import { api } from '@/app';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { EsriDynamic } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { TypeLayerEntryConfig } from '@/geo/map/map-schema-types';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { TypeFeatureInfoResultSet } from '@/geo/utils/feature-info-layer-set';
import { IDataTableState } from '@/core/stores/store-interface-and-intial-values/data-table-state';

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
   * Filter the map based on filters set on date table.
   * @param {string} mapId  id of the map.
   * @param {string} layerPath  path of the layer
   * @param {string} filterStrings filters set on the data table
   * @param {boolean} isMapRecordExist filtered Map switch is on off.
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
   * Shortcut to get the DataTable state for a given map id
   * @param {string} mapId - The mapId
   * @returns {IDataTableState} The DataTable state
   */
  protected static getDataTableState(mapId: string): IDataTableState {
    // Return the DataTable state
    return super.getState(mapId).dataTableState;
  }

  static setInitialSettings(mapId: string, layerPath: string): void {
    this.getDataTableState(mapId).actions.setInitiallayerDataTableSetting(layerPath);
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

  //   /**
  //  * Overrides initialization of the Feature Info Event Processor
  //  * @param {GeoviewStoreType} store - The store associated with the Feature Info Event Processor
  //  * @returns An array of the subscriptions callbacks which were created
  //  */
  //   protected onInitialize(store: GeoviewStoreType): Array<() => void> | void {
  //     // Checks for udpated layers in layer order
  //     const unsubLayerRemoved = store.subscribe(
  //       (state) => state.mapState.orderedLayerInfo,
  //       (cur, prev) => {
  //         // Log
  //         logger.logTraceCoreStoreSubscription('FEATUREINFO EVENT PROCESSOR - orderedLayerInfo', cur);

  //         // For each layer path in the layer data array
  //         const curOrderedLayerPaths = cur.map((layerInfo) => layerInfo.layerPath);
  //         const prevOrderedLayerPaths = prev.map((layerInfo) => layerInfo.layerPath);
  //         store
  //           .getState()
  //           .detailsState.layerDataArray.map((layerInfo) => layerInfo.layerPath)
  //           .forEach((layerPath) => {
  //             // If it was in the layer data array and is not anymore
  //             if (prevOrderedLayerPaths.includes(layerPath) && !curOrderedLayerPaths.includes(layerPath)) {
  //               // Remove it from feature info array
  //               FeatureInfoEventProcessor.#deleteFeatureInfo(store.getState().mapId, layerPath);

  //               // Remove it from all features array
  //               FeatureInfoEventProcessor.#deleteFeatureAllInfo(store.getState().mapId, layerPath);

  //               // Log
  //               logger.logInfo('Removed Feature Info in stores for layer path:', layerPath);
  //             }
  //           });
  //       }
  //     );

  //     return [unsubLayerRemoved];
  //   }

  // /**
  //  * Deletes the specified layer path from the all features layers sets in the store
  //  * @param {string} mapId - The map identifier
  //  * @param {string} layerPath - The layer path to delete
  //  * @private
  //  */
  // static #deleteFeatureAllInfo(mapId: string, layerPath: string) {
  //   // The feature info state
  //   const featureInfoState = this.getFeatureInfoState(mapId);

  //   // Redirect to helper function
  //   this.#deleteFromArray(featureInfoState.allFeaturesDataArray, layerPath, (layerArrayResult) => {
  //     // Update the layer data array in the store
  //     featureInfoState.actions.setAllFeaturesDataArray(layerArrayResult);
  //   });
  // }
}
