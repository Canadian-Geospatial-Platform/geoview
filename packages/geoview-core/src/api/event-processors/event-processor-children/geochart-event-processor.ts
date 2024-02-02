import { GeoviewStoreType } from '@/core/stores/geoview-store';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { TypeArrayOfLayerData, TypeJsonObject } from '@/core/types/global-types';
import { GeoChartStoreByLayerPath } from '@/core/stores/store-interface-and-intial-values/geochart-state';

import { AbstractEventProcessor } from '../abstract-event-processor';
import { FeatureInfoEventProcessor, BatchedPropagationLayerDataArrayByMap } from './feature-info-event-processor';

export class GeochartEventProcessor extends AbstractEventProcessor {
  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  //! Typescript MUST always use store action to modify store - NEVER use setState!
  //! Some action does state modifications AND map actions.
  //! ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler

  // The array of layer data array being batched
  static batchedPropagationLayerDataArray: BatchedPropagationLayerDataArrayByMap = {};

  // The time delay between propagations in the batch layer data array.
  // The longer the delay, the more the layers will have a chance to get in a loaded state before changing the layerDataArray.
  // The longer the delay, the longer it'll take to update the UI.
  static timeDelayBetweenPropagationsForBatch = 2000;

  onInitialize(store: GeoviewStoreType) {
    store.getState();

    // add to arr of subscriptions so it can be destroyed later
    this.subscriptionArr.push();
  }

  // #region

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
    getGeoViewStore(mapId).getState().geochartState.actions.setGeochartCharts(chartData);
  }

  /**
   * Propagate feature info layer sets to the store and the also in a batched manner.
   */
  static propagateArrayDataToStore(mapId: string, layerDataArray: TypeArrayOfLayerData): void {
    // The store
    const store = getGeoViewStore(mapId);

    // To propagate in the store, the processor needs an initialized chart store which is only initialized if the Geochart plugin exists.
    // Therefore, we validate its existence first.
    if (!store.getState().geochartState) return;

    // Update the layer data array in the store
    store.getState().geochartState.actions.setLayerDataArray(layerDataArray);

    // Also propagate in the batched array
    this.propagateFeatureInfoToStoreBatch(mapId, layerDataArray);
  }

  /**
   * Propagate feature info layer sets to the store in a batched manner, every 'timeDelayBetweenPropagationsForBatch' millisecond.
   * This is used to provide another 'layerDataArray', in the store, which updates less often so that we save a couple 'layerDataArray'
   * update triggers in the components that are listening to the store array.
   * The propagation can be bypassed using the store 'layerDataArrayBatchLayerPathBypass' state which tells the process to
   * immediately batch out the array in the store for faster triggering of the state, for faster updating of the UI.
   */
  static propagateFeatureInfoToStoreBatch(mapId: string, layerDataArray: TypeArrayOfLayerData): Promise<void> {
    // The store
    const store = getGeoViewStore(mapId);

    // To propagate in the store, the processor needs an initialized chart store which is only initialized if the Geochart plugin exists.
    // Therefore, we validate its existence first.
    if (!store.getState().geochartState) return Promise.resolve();

    // Redirect to batch propagate
    return FeatureInfoEventProcessor.helperPropagateArrayStoreBatch(
      mapId,
      layerDataArray,
      this.batchedPropagationLayerDataArray,
      this.timeDelayBetweenPropagationsForBatch,
      store.getState().geochartState.actions.setLayerDataArrayBatch,
      'geochart-processor',
      store.getState().geochartState.layerDataArrayBatchLayerPathBypass,
      store.getState().geochartState.actions.setLayerDataArrayBatchLayerPathBypass
    );
  }

  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  //! NEVER add a store action who does set state AND map action at a same time.
  //! Review the action in store state to make sure
}
