import { GeoviewStoreType } from '@/core/stores';
import {
  GeoChartStoreByLayerPath,
  IGeochartState,
  TypeGeochartResultSetEntry,
} from '@/core/stores/store-interface-and-intial-values/geochart-state';
import { GeoViewGeoChartConfig } from '@/api/config/reader/uuid-config-reader';
import { PluginStateUninitializedError } from '@/core/exceptions/geoview-exceptions';
import { logger } from '@/core/utils/logger';

import { AbstractEventProcessor, BatchedPropagationLayerDataArrayByMap } from '@/api/event-processors/abstract-event-processor';
import { UIEventProcessor } from './ui-event-processor';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with UIEventProcessor vs UIState

/**
 * Event processor focusing on interacting with the geochart state in the store.
 */
export class GeochartEventProcessor extends AbstractEventProcessor {
  /**
   * Overrides initialization of the GeoChart Event Processor
   * @param {GeoviewStoreType} store The store associated with the GeoChart Event Processor
   * @returns An array of the subscriptions callbacks which were created
   */
  protected override onInitialize(store: GeoviewStoreType): Array<() => void> | void {
    // Checks for updated layers in layer data array from the details state
    const layerDataArrayUpdate = store.subscribe(
      (state) => state.detailsState.layerDataArray,
      (cur: TypeGeochartResultSetEntry[]) => {
        // Log
        logger.logTraceCoreStoreSubscription('GEOCHART EVENT PROCESSOR - detailsState.layerDataArray', cur);

        // Also propagate in the geochart arrays
        GeochartEventProcessor.#propagateArrayDataToStore(store.getState().mapId, cur);
      }
    );

    // Checks for updated layers in geochart layer data array and update the batched array consequently
    const layerDataArrayUpdateBatch = store.subscribe(
      (state) => state.geochartState.layerDataArray,
      (cur: TypeGeochartResultSetEntry[]) => {
        // Log
        logger.logTraceCoreStoreSubscription('GEOCHART EVENT PROCESSOR - geochartState.layerDataArray', cur);

        // Also propagate in the batched array
        GeochartEventProcessor.#propagateFeatureInfoToStoreBatch(store.getState().mapId, cur).catch((error: unknown) => {
          // Log
          logger.logPromiseFailed(
            'propagateFeatureInfoToStoreBatch in layerDataArrayUpdateBatch subscribe in geochart-event-processor',
            error
          );
        });
      }
    );

    return [layerDataArrayUpdate, layerDataArrayUpdateBatch];
  }

  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  // GV Typescript MUST always use the defined store actions below to modify store - NEVER use setState!
  // GV Some action does state modifications AND map actions.
  // GV ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler

  // #region

  // Holds the list of layer data arrays being buffered in the propagation process for the batch
  static #batchedPropagationLayerDataArray: BatchedPropagationLayerDataArrayByMap<TypeGeochartResultSetEntry> = {};

  // The time delay between propagations in the batch layer data array.
  // The longer the delay, the more the layers will have a chance to get in a loaded state before changing the layerDataArray.
  // The longer the delay, the longer it'll take to update the UI. The delay can be bypassed using the layer path bypass method.
  static #timeDelayBetweenPropagationsForBatch = 2000;

  /**
   * Checks if the Geochart plugin is iniitialized for the given map.
   * @param {string} mapId - The map id
   * @returns {boolean} True when the Geochart plugin is initialized.
   * @static
   */
  static isGeochartInitialized(mapId: string): boolean {
    try {
      // Get its state, this will throw PluginStateUninitializedError if uninitialized
      this.getGeochartState(mapId);
      return true;
    } catch {
      // Uninitialized
      return false;
    }
  }

  /**
   * Shortcut to get the Geochart state for a given map id
   * @param {string} mapId - The mapId
   * @returns {IGeochartState} The Geochart state.
   * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
   * @static
   */
  protected static getGeochartState(mapId: string): IGeochartState {
    // Get the geochart state
    const { geochartState } = super.getState(mapId);

    // If not found
    if (!geochartState) throw new PluginStateUninitializedError('Geochart', mapId);

    // Return it
    return geochartState;
  }

  /**
   * Get a specific state.
   * @param {string} mapId - The mapId
   * @param {'geochartChartsConfig' | 'layerDataArray' | 'layerDataArrayBatchLayerPathBypass' | 'selectedLayerPath'} state - The state to get
   * @returns {string | TypeGeochartResultSetEntry[] | GeoChartStoreByLayerPath} The requested state
   * @static
   */
  static getSingleGeochartState(
    mapId: string,
    state: 'geochartChartsConfig' | 'layerDataArray' | 'layerDataArrayBatchLayerPathBypass' | 'selectedLayerPath'
  ): string | TypeGeochartResultSetEntry[] | GeoChartStoreByLayerPath {
    // Get the geochart state which is only initialized if the Geochart Plugin exists.
    const geochartState = this.getGeochartState(mapId);

    // Return the state
    return geochartState[state];
  }

  /**
   * Sets the default layers from configuration.
   * In the store, the GeoChart configurations are stored in an object with layerPath as its property name
   * (to retrieve the configuration per layer faster).
   *
   * @param {string} mapId the map id
   * @param {GeoViewGeoChartConfig[]} charts The array of JSON configuration for GeoChart
   * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
   * @static
   */
  static setGeochartCharts(mapId: string, charts: GeoViewGeoChartConfig[]): void {
    // Get the geochart state which is only initialized if the Geochart Plugin exists.
    const geochartState = this.getGeochartState(mapId);

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

    // Set store charts config
    geochartState.setterActions.setGeochartCharts(chartData);

    // If there is chart data, tab should not be hidden
    if (Object.keys(chartData).length) UIEventProcessor.showTab(mapId, 'geochart');

    // Log
    logger.logInfo('Added GeoChart configs for layer paths:', layerPaths);
  }

  /**
   * Adds a GeoChart Configuration to the specified map id and layer path
   * @param {string} mapId The map ID
   * @param {string} layerPath The layer path
   * @param {GeoViewGeoChartConfig} chartConfig The Geochart Configuration
   * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
   * @static
   */
  static addGeochartChart(mapId: string, layerPath: string, chartConfig: GeoViewGeoChartConfig): void {
    // Get the geochart state which is only initialized if the Geochart Plugin exists.
    const geochartState = this.getGeochartState(mapId);

    // Config to add
    const toAdd: GeoChartStoreByLayerPath = {};
    toAdd[layerPath] = chartConfig;

    // Update the layer data array in the store
    geochartState.setterActions.setGeochartCharts({ ...geochartState.geochartChartsConfig, ...toAdd });

    // Make sure tab is not hidden
    UIEventProcessor.showTab(mapId, 'geochart');

    // Log
    logger.logInfo('Added GeoChart configs for layer path:', layerPath);
  }

  /**
   * Removes a GeoChart Configuration at the specified map id and layer path
   * @param {string} mapId The map ID
   * @param {string} layerPath The layer path
   * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
   * @static
   */
  static removeGeochartChart(mapId: string, layerPath: string): void {
    // Get the geochart state which is only initialized if the Geochart Plugin exists.
    const geochartState = this.getGeochartState(mapId);

    // If no geochartChartsConfig, return
    if (!geochartState.geochartChartsConfig) return;

    // Config to remove
    if (Object.keys(geochartState.geochartChartsConfig).includes(layerPath)) {
      // Grab the config
      const chartConfigs = geochartState.geochartChartsConfig;

      // Delete the config
      delete chartConfigs[layerPath];

      // Update the layer data array in the store
      geochartState.setterActions.setGeochartCharts({ ...chartConfigs });

      // If there are no more geochart layers, hide tab
      if (!Object.keys(geochartState.geochartChartsConfig).length) UIEventProcessor.hideTab(mapId, 'geochart');

      // Log
      logger.logInfo('Removed GeoChart configs for layer path:', layerPath);
    }
  }

  /**
   * Propagates feature info layer sets to the store. The update of the array will also trigger an update in a batched manner.
   * @param {string} mapId The map id
   * @param {TypeGeochartResultSetEntry[]} layerDataArray The layer data array to propagate in the store
   * @returns {Promise<void>}
   * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
   * @static
   * @private
   */
  static #propagateArrayDataToStore(mapId: string, layerDataArray: TypeGeochartResultSetEntry[]): void {
    // TODO: Performance - Take a look at how the propagation to the array like that retriggers every component listening on the layerDataArray for all layer paths.
    // TO.DOCONT: For example the GeoChart loads the records twice in the Chart for each map click, even if it was another layerPath result that triggered the layerDataArray hook?

    // Get the geochart state which is only initialized if the Geochart Plugin exists.
    const geochartState = this.getGeochartState(mapId);

    // Update the layer data array in the store
    geochartState.setterActions.setLayerDataArray(layerDataArray);
  }

  /**
   * Propagates feature info layer sets to the store in a batched manner, every 'timeDelayBetweenPropagationsForBatch' millisecond.
   * This is used to provide another 'layerDataArray', in the store, which updates less often so that we save a couple 'layerDataArray'
   * update triggers in the components that are listening to the store array.
   * The propagation can be bypassed using the store 'layerDataArrayBatchLayerPathBypass' state which tells the process to
   * immediately batch out the array in the store for faster triggering of the state, for faster updating of the UI.
   * @param {string} mapId - The map id
   * @param {TypeGeochartResultSetEntry[]} layerDataArray - The layer data array to batch on
   * @returns {Promise<void>} Promise upon completion
   * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized.
   * @static
   * @private
   */
  static #propagateFeatureInfoToStoreBatch(mapId: string, layerDataArray: TypeGeochartResultSetEntry[]): Promise<void> {
    // Get the geochart state which is only initialized if the Geochart Plugin exists.
    const geochartState = this.getGeochartState(mapId);

    // Redirect to batch propagate
    return this.helperPropagateArrayStoreBatch(
      mapId,
      layerDataArray,
      this.#batchedPropagationLayerDataArray,
      this.#timeDelayBetweenPropagationsForBatch,
      geochartState.setterActions.setLayerDataArrayBatch,
      'geochart-processor',
      geochartState.layerDataArrayBatchLayerPathBypass,
      geochartState.setterActions.setLayerDataArrayBatchLayerPathBypass
    );
  }

  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  // GV NEVER add a store action who does set state AND map action at a same time.
  // GV Review the action in store state to make sure
}
