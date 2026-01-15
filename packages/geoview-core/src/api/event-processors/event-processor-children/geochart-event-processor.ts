import type { GeoviewStoreType } from '@/core/stores';
import type {
  GeoChartStoreByLayerPath,
  IGeochartState,
  TypeGeochartResultSetEntry,
} from '@/core/stores/store-interface-and-intial-values/geochart-state';
import type { GeoViewGeoChartConfig } from '@/api/config/reader/uuid-config-reader';
import { PluginStateUninitializedError } from '@/core/exceptions/geoview-exceptions';
import { logger } from '@/core/utils/logger';

import type { BatchedPropagationLayerDataArrayByMap } from '@/api/event-processors/abstract-event-processor';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { UIEventProcessor } from './ui-event-processor';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with UIEventProcessor vs UIState

/**
 * Event processor focusing on interacting with the geochart state in the store.
 */
export class GeochartEventProcessor extends AbstractEventProcessor {
  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  // GV Typescript MUST always use the defined store actions below to modify store - NEVER use setState!
  // GV Some action does state modifications AND map actions.
  // GV ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler

  // Holds the list of layer data arrays being buffered in the propagation process for the batch
  static #batchedPropagationLayerDataArray: BatchedPropagationLayerDataArrayByMap<TypeGeochartResultSetEntry> = {};

  // The time delay between propagations in the batch layer data array.
  // The longer the delay, the more the layers will have a chance to get in a loaded state before changing the layerDataArray.
  // The longer the delay, the longer it'll take to update the UI. The delay can be bypassed using the layer path bypass method.
  static TIME_DELAY_BETWEEN_PROPAGATION_FOR_BATCH = 1000;

  // #region OVERRIDES

  /**
   * Initializes the GeoChart Event Processor and sets up store subscriptions.
   * Subscribes to layer data array changes from details state and geochart state to propagate updates.
   * @param {GeoviewStoreType} store - The store associated with the GeoChart Event Processor
   * @return {Array<() => void> | void} Array of unsubscribe functions for cleanup
   * @protected
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

  // #endregion OVERRIDES

  // #region STATIC METHODS

  /**
   * Checks if the Geochart plugin is initialized for the given map.
   * Attempts to get the geochart state; returns false if PluginStateUninitializedError is thrown.
   * @param {string} mapId - The map identifier
   * @return {boolean} True when the Geochart plugin is initialized, false otherwise
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
   * Gets the geochart state slice from the store for the specified map.
   * This method is protected as it's only used internally by the GeoChart Event Processor.
   * @param {string} mapId - The map identifier
   * @return {IGeochartState} The geochart state slice
   * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized
   * @static
   * @protected
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
   * Gets a specific geochart state property by its key.
   * Provides type-safe access to geochart configuration, layer data, and selection state.
   * @param {string} mapId - The map identifier
   * @param {'geochartChartsConfig' | 'layerDataArray' | 'layerDataArrayBatchLayerPathBypass' | 'selectedLayerPath'} state - The state property key to retrieve
   * @return {string | TypeGeochartResultSetEntry[] | GeoChartStoreByLayerPath} The requested state property value
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
   * Sets the selected layer path for the geochart in the store.
   * Updates which layer's chart data is currently selected in the geochart panel.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The path of the layer to set as selected
   * @return {void}
   * @static
   */
  static setSelectedGeochartLayerPath(mapId: string, layerPath: string): void {
    // Set the selected layer path
    this.getGeochartState(mapId).setterActions.setSelectedLayerPath(layerPath);
  }

  /**
   * Sets geochart configurations from an array of chart definitions.
   * Converts chart array into store object format indexed by layer path for efficient lookup.
   * Automatically shows the geochart tab if charts are configured.
   * @param {string} mapId - The map identifier
   * @param {GeoViewGeoChartConfig[]} charts - The array of geochart configurations to set
   * @return {void}
   * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized
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
   * Adds a geochart configuration for a specific layer path.
   * Merges the new configuration with existing charts and ensures the geochart tab is visible.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path to add chart configuration for
   * @param {GeoViewGeoChartConfig} chartConfig - The geochart configuration to add
   * @return {void}
   * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized
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
   * Removes the geochart configuration for a specific layer path.
   * Automatically hides the geochart tab if no chart configurations remain after removal.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path to remove chart configuration from
   * @return {void}
   * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized
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
   * Propagates layer data array changes to the geochart store immediately.
   * This triggers the batched propagation process for UI updates.
   * @param {string} mapId - The map identifier
   * @param {TypeGeochartResultSetEntry[]} layerDataArray - The layer data array to propagate to the store
   * @return {void}
   * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized
   * @static
   * @private
   */
  static #propagateArrayDataToStore(mapId: string, layerDataArray: TypeGeochartResultSetEntry[]): void {
    // Get the geochart state which is only initialized if the Geochart Plugin exists.
    const geochartState = this.getGeochartState(mapId);

    // Update the layer data array in the store
    geochartState.setterActions.setLayerDataArray(layerDataArray);
  }

  /**
   * Propagates layer data to the store in a batched manner with time delay between updates.
   * Reduces UI update frequency by batching multiple rapid changes into fewer store updates.
   * Supports bypass mechanism via layerDataArrayBatchLayerPathBypass for immediate propagation when needed.
   * @param {string} mapId - The map identifier
   * @param {TypeGeochartResultSetEntry[]} layerDataArray - The layer data array to batch
   * @return {Promise<void>} Promise that resolves when batch propagation completes
   * @throws {PluginStateUninitializedError} When the Geochart plugin is uninitialized
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
      this.TIME_DELAY_BETWEEN_PROPAGATION_FOR_BATCH,
      geochartState.setterActions.setLayerDataArrayBatch,
      'geochart-processor',
      geochartState.layerDataArrayBatchLayerPathBypass,
      geochartState.setterActions.setLayerDataArrayBatchLayerPathBypass
    );
  }

  // #endregion STATIC METHODS

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  // GV NEVER add a store action who does set state AND map action at a same time.
  // GV Review the action in store state to make sure
}
