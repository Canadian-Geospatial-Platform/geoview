import { GeoviewStoreType } from '@/core/stores';
import { GeoChartStoreByLayerPath, IGeochartState } from '@/core/stores/store-interface-and-intial-values/geochart-state';
import { GeoChartConfig } from '@/core/utils/config/reader/uuid-config-reader';
import { logger } from '@/core/utils/logger';
import { TypeLayerData } from '@/geo/utils/layer-set';

import { AbstractEventProcessor, BatchedPropagationLayerDataArrayByMap } from '@/api/event-processors/abstract-event-processor';

/**
 * Event processor focusing on interacting with the geochart state in the store.
 */
export class GeochartEventProcessor extends AbstractEventProcessor {
  /**
   * Overrides initialization of the GeoChart Event Processor
   * @param {GeoviewStoreType} store The store associated with the GeoChart Event Processor
   * @returns An array of the subscriptions callbacks which were created
   */
  protected onInitialize(store: GeoviewStoreType): Array<() => void> | void {
    // Checks for udpated layers in layer order
    const unsubLayerRemoved = store.subscribe(
      (state) => state.mapState.orderedLayerInfo,
      (cur, prev) => {
        // Log
        logger.logTraceCoreStoreSubscription('GEOCHART EVENT PROCESSOR - orderedLayerInfo', cur);

        // For each chart config keys
        const curOrderedLayerPaths = cur.map((layerInfo) => layerInfo.layerPath);
        const prevOrderedLayerPaths = prev.map((layerInfo) => layerInfo.layerPath);
        Object.keys(store.getState().geochartState.geochartChartsConfig).forEach((layerPath: string) => {
          // If it was in the layerdata array and is not anymore
          if (prevOrderedLayerPaths.includes(layerPath) && !curOrderedLayerPaths.includes(layerPath)) {
            // Remove it
            GeochartEventProcessor.removeGeochartChart(store.getState().mapId, layerPath);
          }
        });
      }
    );

    // Checks for updated layers in layer data array
    const layerDataArrayUpdate = store.subscribe(
      (state) => state.detailsState.layerDataArray,
      (cur) => {
        // Log
        logger.logTraceCoreStoreSubscription('GEOCHART EVENT PROCESSOR - layerDataArray', cur);

        // Also propagate in the geochart arrays
        GeochartEventProcessor.propagateArrayDataToStore(store.getState().mapId, cur);
      }
    );

    return [unsubLayerRemoved, layerDataArrayUpdate];
  }

  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  // GV Typescript MUST always use the defined store actions below to modify store - NEVER use setState!
  // GV Some action does state modifications AND map actions.
  // GV ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler

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
  protected static getGeochartState(mapId: string): IGeochartState | undefined {
    // Return the geochart state when it exists
    return super.getState(mapId).geochartState;
  }

  /**
   * Sets the default layers from configuration.
   * In the store, the GeoChart configurations are stored in an object with layerPath as its property name
   * (to retrieve the configuration per layer faster).
   *
   * @param {string} mapId the map id
   * @param {GeoChartConfig[]} charts The array of JSON configuration for GeoChart
   */
  static setGeochartCharts(mapId: string, charts: GeoChartConfig[]): void {
    // The store object representation
    const chartData: GeoChartStoreByLayerPath = {};

    // Loop on the charts
    const layerPaths: string[] = [];
    charts.forEach((chartInfo) => {
      // For each layer path
      chartInfo.layers.forEach((layer) => {
        // Get the layer path
        const layerPath = layer.layerId;
        chartData[layerPath] = chartInfo;
        layerPaths.push(layerPath);
      });
    });

    // set store charts config
    this.getGeochartState(mapId)?.actions.setGeochartCharts(chartData);

    // Log
    logger.logInfo('Added GeoChart configs for layer paths:', layerPaths);

    // TODO: Also update the layer array in other store state to inform the later has a geochart attached to it (when code is done over there)?
  }

  /**
   * Adds a GeoChart Configuration to the specified map id and layer path
   * @param {string} mapId The map ID
   * @param {string} layerPath The layer path
   * @param {GeoChartConfig} chartConfig The Geochart Configuration
   */
  static addGeochartChart(mapId: string, layerPath: string, chartConfig: GeoChartConfig): void {
    // The processor needs an initialized chart store which is only initialized if the Geochart plugin exists.
    // Therefore, we validate its existence first.
    if (!this.getGeochartState(mapId)) return;

    // Config to add
    const toAdd: GeoChartStoreByLayerPath = {};
    toAdd[layerPath] = chartConfig;

    // Update the layer data array in the store
    this.getGeochartState(mapId)!.actions.setGeochartCharts({ ...this.getGeochartState(mapId)?.geochartChartsConfig, ...toAdd });

    // Log
    logger.logInfo('Added GeoChart configs for layer path:', layerPath);

    // TODO: Also update the layer array in other store state to inform the later has a geochart attached to it (when code is done over there)?
  }

  /**
   * Removes a GeoChart Configuration at the specified map id and layer path
   * @param {string} mapId The map ID
   * @param {string} layerPath The layer path
   */
  static removeGeochartChart(mapId: string, layerPath: string): void {
    // The processor needs an initialized chart store which is only initialized if the Geochart plugin exists.
    // Therefore, we validate its existence first.
    if (!this.getGeochartState(mapId)) return;
    if (!this.getGeochartState(mapId)?.geochartChartsConfig) return;

    // Config to remove
    if (Object.keys(this.getGeochartState(mapId)!.geochartChartsConfig).includes(layerPath)) {
      // Grab the config
      const chartConfigs = this.getGeochartState(mapId)!.geochartChartsConfig;

      // Delete the config
      delete chartConfigs[layerPath];

      // Update the layer data array in the store
      this.getGeochartState(mapId)!.actions.setGeochartCharts({ ...chartConfigs });

      // Log
      logger.logInfo('Removed GeoChart configs for layer path:', layerPath);

      // TODO: Also update the layer array in other store state to inform the later has a geochart attached to it (when code is done over there)?
    }
  }

  /**
   * Propagates feature info layer sets to the store and the also in a batched manner.
   * @param {string} mapId The map id
   * @param {string} layerDataArray The layer data array to propagate in the store
   */
  static propagateArrayDataToStore(mapId: string, layerDataArray: TypeLayerData[]): void {
    // To propagate in the store, the processor needs an initialized chart store which is only initialized if the Geochart plugin exists.
    // Therefore, we validate its existence first.
    if (!this.getGeochartState(mapId)) return;

    // Update the layer data array in the store
    this.getGeochartState(mapId)!.actions.setLayerDataArray(layerDataArray);

    // Also propagate in the batched array
    this.propagateFeatureInfoToStoreBatch(mapId, layerDataArray);
  }

  /**
   * Propagates feature info layer sets to the store in a batched manner, every 'timeDelayBetweenPropagationsForBatch' millisecond.
   * This is used to provide another 'layerDataArray', in the store, which updates less often so that we save a couple 'layerDataArray'
   * update triggers in the components that are listening to the store array.
   * The propagation can be bypassed using the store 'layerDataArrayBatchLayerPathBypass' state which tells the process to
   * immediately batch out the array in the store for faster triggering of the state, for faster updating of the UI.
   * @param {string} mapId The map id
   * @param {string} layerDataArray The layer data array to batch on
   * @returns {Promise<void>} Promise upon completion
   */
  private static propagateFeatureInfoToStoreBatch(mapId: string, layerDataArray: TypeLayerData[]): Promise<void> {
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
  // GV NEVER add a store action who does set state AND map action at a same time.
  // GV Review the action in store state to make sure
}
