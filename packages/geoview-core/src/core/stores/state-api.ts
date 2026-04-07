import {
  getStoreGeochartChartsConfig,
  getStoreGeochartLayerDataArray,
  getStoreGeochartLayerDataArrayBatchLayerPathBypass,
  getStoreGeochartSelectedLayerPath,
  type GeoChartStoreByLayerPath,
  type TypeGeochartResultSetEntry,
} from './store-interface-and-intial-values/geochart-state';
import {
  type TypeOrderedLayerInfo,
  getStoreMapLegendCollapsedByPath,
  getStoreMapOrderedLayerInfo,
  setStoreMapLegendCollapsed,
  utilFindMapLayerAndChildrenFromOrderedInfo,
} from './store-interface-and-intial-values/map-state';
import type { TimeSliderLayerSet } from './store-interface-and-intial-values/time-slider-state';
import { getStoreTimeSliderLayers } from './store-interface-and-intial-values/time-slider-state';
import { getStoreSwiperLayerPaths } from './store-interface-and-intial-values/swiper-state';
import { logger } from '@/core/utils/logger';
import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import { setStoreLayerSelectedLayersTabLayer, setStoreReorderLegendLayers } from './store-interface-and-intial-values/layer-state';
import type { MapController } from '../controllers/map-controller';

/**
 * API to manage states.
 */
export class StateApi {
  /** The map controller instance */
  #mapController: MapController;

  /** Keep all callback delegates references */
  #onLayersReorderedHandlers: LayersReorderedDelegate[] = [];

  /**
   * Instantiates an StateApi class.
   *
   * @param mapId - The map id this StateApi belongs to
   */
  constructor(mapController: MapController) {
    this.#mapController = mapController;
  }

  /**
   * Get the collapsed state of layer's legend.
   * @param layerPath - Path of the layer to get state for.
   * @returns If the legend is collapsed.
   */
  getLegendCollapsedState(layerPath: string): boolean {
    // Get from store
    return getStoreMapLegendCollapsedByPath(this.#mapController.getMapId(), layerPath);
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
          return getStoreGeochartChartsConfig(this.#mapController.getMapId());

        case 'selectedLayerPath':
          return getStoreGeochartSelectedLayerPath(this.#mapController.getMapId());

        case 'layerDataArray':
          return getStoreGeochartLayerDataArray(this.#mapController.getMapId());

        case 'layerDataArrayBatchLayerPathBypass':
          return getStoreGeochartLayerDataArrayBatchLayerPathBypass(this.#mapController.getMapId());

        default:
          logger.logError(`${state} not available from geochart`);
          return undefined;
      }
    }
    if (pluginId === 'swiper') {
      if (state === 'layerPaths') return getStoreSwiperLayerPaths(this.#mapController.getMapId());
      logger.logError(`${state} not available from swiper`);
    }
    if (pluginId === 'time-slider') {
      if (state === 'timeSliderLayers') return getStoreTimeSliderLayers(this.#mapController.getMapId());
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
    // Save to the store
    setStoreMapLegendCollapsed(this.#mapController.getMapId(), layerPath, collapsed);
  }

  /**
   * Set selected layer in layers tab.
   * @param layerPath - The path of the layer to set
   */
  setSelectedLayersTabLayer(layerPath: string): void {
    setStoreLayerSelectedLayersTabLayer(this.#mapController.getMapId(), layerPath);
  }

  reorderLayers(layerPath: string, move: number): void {
    // Apply some ordering logic
    const direction = move < 0 ? -1 : 1;
    let absoluteMoves = Math.abs(move);
    const orderedLayers = [...getStoreMapOrderedLayerInfo(this.#mapController.getMapId())];
    let startingIndex = -1;
    for (let i = 0; i < orderedLayers.length; i++) if (orderedLayers[i].layerPath === layerPath) startingIndex = i;

    // If layer not found, exit early
    if (startingIndex === -1) {
      logger.logError(`Layer ${layerPath} not found in ordered layers`);
      return;
    }

    const layerInfo = orderedLayers[startingIndex];
    const movedLayers = utilFindMapLayerAndChildrenFromOrderedInfo(layerPath, orderedLayers);
    orderedLayers.splice(startingIndex, movedLayers.length);
    let nextIndex = startingIndex;
    const pathLength = layerInfo.layerPath.split('/').length;
    while (absoluteMoves > 0) {
      nextIndex += direction;
      if (nextIndex === orderedLayers.length || nextIndex === 0) {
        absoluteMoves = 0;
      } else if (orderedLayers[nextIndex].layerPath.split('/').length === pathLength) absoluteMoves--;
    }
    orderedLayers.splice(nextIndex, 0, ...movedLayers);

    // Redirect
    this.#mapController.setMapOrderedLayerInfoDirectly(orderedLayers);

    // Reorder the legend layers, because the order layer info has changed
    setStoreReorderLegendLayers(this.#mapController.getMapId());

    // Emit event
    this.#emitLayersReordered({ orderedLayers });
  }

  // #region EVENTS

  /**
   * Emits layers reordered event.
   * @param event - The event to emit
   * @private
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
  // The layer path of the affected layer
  orderedLayers: TypeOrderedLayerInfo[];
};

// #endregion EVENTS & DELEGATES
