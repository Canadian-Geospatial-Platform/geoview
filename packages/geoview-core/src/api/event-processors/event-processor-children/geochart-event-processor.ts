import { TypeArrayOfLayerData, TypeJsonObject } from '@/core/types/global-types';
import { GeoChartStoreByLayerPath, IGeochartState } from '@/core/stores/store-interface-and-intial-values/geochart-state';

import { AbstractEventProcessor, BatchedPropagationLayerDataArrayByMap } from '../abstract-event-processor';

/**
 * Event processor focusing on interacting with the geochart state in the store.
 */
export class GeochartEventProcessor extends AbstractEventProcessor {
  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  //! Typescript MUST always use the defined store actions below to modify store - NEVER use setState!
  //! Some action does state modifications AND map actions.
  //! ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler

  // #region
  // Holds the list of layer data arrays being buffered in the propagation process for the batch
  static batchedPropagationLayerDataArray: BatchedPropagationLayerDataArrayByMap = {};

  // The time delay between propagations in the batch layer data array.
  // The longer the delay, the more the layers will have a chance to get in a loaded state before changing the layerDataArray.
  // The longer the delay, the longer it'll take to update the UI. The delay can be bypassed using the layer path bypass method.
  static timeDelayBetweenPropagationsForBatch = 2000;

  /**
   * Shortcut to get the Geochart state for a given map id
   * @param {string} mapId The mapId
   * @returns {IGeochartState | undefined} The Geochart state. Forcing the return to also be 'undefined', because
   *                                       there will be no geochartState if the Geochart plugin isn't active.
   *                                       This helps the developers making sure the existence is checked.
   */
  public static getGeochartState(mapId: string): IGeochartState | undefined {
    // Return the geochart state when it exists
    return super.getState(mapId).geochartState;
  }

  /**
   * Set the default layers from configuration.
   * In the store, the GeoChart configurations are stored in an object with layerPath as its property name
   * (to retrieve the configuration per layer faster).
   *
   * @param {string} mapId the map id
   * @param {TypeJsonObject} charts The array of JSON configuration for geochart
   */
  static setGeochartCharts(mapId: string, charts: TypeJsonObject[]): void {
    // The store object representation
    const chartData: GeoChartStoreByLayerPath = {};

    // Loop on the charts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    charts.forEach((chartInfo: any) => {
      // For each layer path
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chartInfo.layers.forEach((layer: any) => {
        // Get the layer path
        const layerPath = layer.layerId;
        chartData[layerPath] = chartInfo;
      });
    });

    // set store charts config
    this.getGeochartState(mapId)?.actions.setGeochartCharts(chartData);
  }

  /**
   * Propagate feature info layer sets to the store and the also in a batched manner.
   * @param {string} mapId The map id
   * @param {string} layerDataArray The layer data array to propagate in the store
   */
  static propagateArrayDataToStore(mapId: string, layerDataArray: TypeArrayOfLayerData): void {
    // To propagate in the store, the processor needs an initialized chart store which is only initialized if the Geochart plugin exists.
    // Therefore, we validate its existence first.
    if (!this.getGeochartState(mapId)) return;

    // Update the layer data array in the store
    this.getGeochartState(mapId)!.actions.setLayerDataArray(layerDataArray);

    // Also propagate in the batched array
    this.propagateFeatureInfoToStoreBatch(mapId, layerDataArray);
  }

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
  private static propagateFeatureInfoToStoreBatch(mapId: string, layerDataArray: TypeArrayOfLayerData): Promise<void> {
    // To propagate in the store, the processor needs an initialized chart store which is only initialized if the Geochart plugin exists.
    // Therefore, we validate its existence first.
    if (!this.getGeochartState(mapId)) return Promise.resolve();

    // The geochart state as validated
    const geochartState = this.getGeochartState(mapId)!;

    // Redirect to batch propagate
    return this.helperPropagateArrayStoreBatch(
      mapId,
      layerDataArray,
      this.batchedPropagationLayerDataArray,
      this.timeDelayBetweenPropagationsForBatch,
      geochartState.actions.setLayerDataArrayBatch,
      'geochart-processor',
      geochartState.layerDataArrayBatchLayerPathBypass,
      geochartState.actions.setLayerDataArrayBatchLayerPathBypass
    );
  }

  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  //! NEVER add a store action who does set state AND map action at a same time.
  //! Review the action in store state to make sure
}
