import {
  getStoreGeochartChartsConfig,
  getStoreGeochartLayerDataArray,
  getStoreGeochartLayerDataArrayBatchLayerPathBypass,
  getStoreGeochartSelectedLayerPath,
  type GeoChartStoreByLayerPath,
  type TypeGeochartResultSetEntry,
} from './store-interface-and-intial-values/geochart-state';
import type { TimeSliderLayerSet } from './store-interface-and-intial-values/time-slider-state';
import { getStoreTimeSliderLayers } from './store-interface-and-intial-values/time-slider-state';
import { getStoreSwiperLayerPaths } from './store-interface-and-intial-values/swiper-state';
import {
  getStoreLayerLegendCollapsed,
  getStoreLayerOrderedLayerPaths,
  setStoreReorderLegendLayers,
  utilFindLayerAndChildrenPaths,
} from './store-interface-and-intial-values/layer-state';
import { logger } from '@/core/utils/logger';
import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import type { LayerController } from '@/core/controllers/layer-controller';

/**
 * API to manage states.
 */
export class StateApi {
  /** The layer controller instance */
  #layerController: LayerController;

  /** Keep all callback delegates references */
  #onLayersReorderedHandlers: LayersReorderedDelegate[] = [];

  /**
   * Instantiates an StateApi class.
   *
   * @param layerController - The layer controller instance to interact with layer-related states.
   */
  constructor(layerController: LayerController) {
    this.#layerController = layerController;
  }

  /**
   * Get the collapsed state of layer's legend.
   * @param layerPath - Path of the layer to get state for.
   * @returns If the legend is collapsed.
   */
  getLegendCollapsedState(layerPath: string): boolean {
    // Get from store
    return getStoreLayerLegendCollapsed(this.#layerController.getMapId(), layerPath);
  }

  /**
   * Get a specific state from a plugin.
   * @param pluginId - The plugin to get state for.
   * @param state - The state to get.
   * @returns The requested state.
   */
  getPluginState(
    pluginId: 'geochart' | 'swiper' | 'time-slider',
    state: string
  ): string | TypeGeochartResultSetEntry[] | GeoChartStoreByLayerPath | TimeSliderLayerSet | string[] | undefined {
    if (pluginId === 'geochart') {
      // Depending on the state requested, call the corresponding getter
      switch (state) {
        case 'geochartChartsConfig':
          return getStoreGeochartChartsConfig(this.#layerController.getMapId());

        case 'selectedLayerPath':
          return getStoreGeochartSelectedLayerPath(this.#layerController.getMapId());

        case 'layerDataArray':
          return getStoreGeochartLayerDataArray(this.#layerController.getMapId());

        case 'layerDataArrayBatchLayerPathBypass':
          return getStoreGeochartLayerDataArrayBatchLayerPathBypass(this.#layerController.getMapId());

        default:
          logger.logError(`${state} not available from geochart`);
          return undefined;
      }
    }
    if (pluginId === 'swiper') {
      if (state === 'layerPaths') return getStoreSwiperLayerPaths(this.#layerController.getMapId());
      logger.logError(`${state} not available from swiper`);
    }
    if (pluginId === 'time-slider') {
      if (state === 'timeSliderLayers') return getStoreTimeSliderLayers(this.#layerController.getMapId());
      logger.logError(`${state} not available from time slider`);
    }
    return undefined;
  }

  /**
   * Set the collapsed state of layer's legend.
   * @param layerPath - Path of the layer to get state for.
   * @param collapsed - The new state
   * @returns If the legend is collapsed.
   */
  setLegendCollapsedState(layerPath: string, collapsed: boolean): void {
    // Redirect to controller
    this.#layerController.setLegendCollapsed(layerPath, collapsed);
  }

  /**
   * Set selected layer in layers tab.
   * @param layerPath - The path of the layer to set
   */
  setSelectedLayersTabLayer(layerPath: string): void {
    // Redirect to controller
    this.#layerController.setSelectedLayerPath(layerPath);
  }

  /**
   * Reorders a layer and its children within the ordered layers list by a given number of positions.
   *
   * The layer (along with any child paths) is extracted from its current position and re-inserted
   * at the target index, skipping only siblings at the same depth. Updates the store, reorders the
   * legend layers, and emits a layers reordered event.
   *
   * @param layerPath - The path of the layer to move
   * @param move - The number of sibling positions to move (negative = toward index 0, positive = toward end)
   */
  reorderLayers(layerPath: string, move: number): void {
    // Apply some ordering logic
    const direction = move < 0 ? -1 : 1;
    let absoluteMoves = Math.abs(move);
    const orderedLayers = [...getStoreLayerOrderedLayerPaths(this.#layerController.getMapId())];
    const startingIndex = orderedLayers.indexOf(layerPath);

    // If layer not found, exit early
    if (startingIndex === -1) {
      logger.logError(`Layer ${layerPath} not found in ordered layers`);
      return;
    }

    const movedLayers = utilFindLayerAndChildrenPaths(layerPath, orderedLayers);
    orderedLayers.splice(startingIndex, movedLayers.length);
    let nextIndex = startingIndex;
    const pathLength = layerPath.split('/').length;
    while (absoluteMoves > 0) {
      nextIndex += direction;
      if (nextIndex === orderedLayers.length || nextIndex === 0) {
        absoluteMoves = 0;
      } else if (orderedLayers[nextIndex].split('/').length === pathLength) absoluteMoves--;
    }
    orderedLayers.splice(nextIndex, 0, ...movedLayers);

    // Redirect
    this.#layerController.setMapOrderedLayersDirectly(orderedLayers);

    // Reorder the legend layers, because the ordered layers have changed
    setStoreReorderLegendLayers(this.#layerController.getMapId());

    // Emit event
    this.#emitLayersReordered({ orderedLayers });
  }

  // #region EVENTS

  /**
   * Emits layers reordered event.
   * @param event - The event to emit
   */
  #emitLayersReordered(event: LayersReorderedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayersReorderedHandlers, event);
  }

  /**
   * Registers a layers reordered event handler.
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayersReordered(callback: LayersReorderedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayersReorderedHandlers, callback);
  }

  /**
   * Unregisters a layers reordered event handler.
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayersReordered(callback: LayersReorderedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayersReorderedHandlers, callback);
  }

  // #endregion EVENTS
}

// #region EVENTS & DELEGATES

/**
 * Define a delegate for the event handler function signature
 */
type LayersReorderedDelegate = EventDelegateBase<StateApi, LayersReorderedEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayersReorderedEvent = {
  // The layer paths in the new order
  orderedLayers: string[];
};

// #endregion EVENTS & DELEGATES
