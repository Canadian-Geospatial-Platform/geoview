import { GeochartEventProcessor } from '@/api/event-processors/event-processor-children/geochart-event-processor';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { SwiperEventProcessor } from '@/api/event-processors/event-processor-children/swiper-event-processor';
import { TimeSliderEventProcessor } from '@/api/event-processors/event-processor-children/time-slider-event-processor';
import { GeoChartStoreByLayerPath, TypeGeochartResultSetEntry } from './store-interface-and-intial-values/geochart-state';
import { TypeOrderedLayerInfo } from './store-interface-and-intial-values/map-state';
import { TimeSliderLayerSet } from './store-interface-and-intial-values/time-slider-state';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { logger } from '@/core/utils/logger';
import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';

/**
 * API to manage states.
 */
export class StateApi {
  mapId: string;

  // Keep all callback delegates references
  #onLayersReorderedHandlers: LayersReorderedDelegate[] = [];

  /**
   * Instantiates an StateApi class.
   *
   * @param {string} mapId - The map id this AppBarApi belongs to
   */
  constructor(mapId: string) {
    this.mapId = mapId;
  }

  /**
   * Get a specific layer panel state.
   * @param {'highlightedLayer' | 'selectedLayerPath' | 'displayState' | 'layerDeleteInProgress'} state - The state to get
   * @returns {string | boolean | null | undefined} The requested state
   */
  getLayerPanelState(
    state: 'highlightedLayer' | 'selectedLayerPath' | 'displayState' | 'layerDeleteInProgress'
  ): string | boolean | null | undefined {
    return LegendEventProcessor.getLayerPanelState(this.mapId, state);
  }

  /**
   * Get a legend layer.
   * @param {string} layerPath - The path of the layer to get
   * @returns {TypeLegendLayer | undefined} The requested legend layer
   */
  getLegendLayerInfo(layerPath: string): TypeLegendLayer | undefined {
    return LegendEventProcessor.getLegendLayerInfo(this.mapId, layerPath);
  }

  /**
   * Get the collapsed state of layer's legend.
   * @param {string} layerPath - Path of the layer to get state for.
   * @returns {boolean} If the legend is collapsed.
   */
  getLegendCollapsedState(layerPath: string): boolean {
    // Redirect to event processor
    return MapEventProcessor.getMapLegendCollapsedFromOrderedLayerInfo(this.mapId, layerPath);
  }

  /**
   * Get a specific state from a plugin.
   * @param {'time-slider' | 'geochart' | 'swiper'} pluginId - The plugin to get state for.
   * @param {string} state - The state to get.
   * @returns {string | TypeGeochartResultSetEntry[] | GeoChartStoreByLayerPath | TypeTimeSliderValues | undefined} The requested state.
   */
  getPluginState(
    pluginId: 'geochart' | 'swiper' | 'time-slider',
    state: string
  ): string | TypeGeochartResultSetEntry[] | GeoChartStoreByLayerPath | TimeSliderLayerSet | string[] | undefined {
    if (pluginId === 'geochart') {
      if (['geochartChartsConfig', 'layerDataArray', 'layerDataArrayBatchLayerPathBypass', 'selectedLayerPath'].includes(state))
        return GeochartEventProcessor.getSingleGeochartState(
          this.mapId,
          state as 'geochartChartsConfig' | 'layerDataArray' | 'layerDataArrayBatchLayerPathBypass' | 'selectedLayerPath'
        );
      logger.logError(`${state} not available from geochart`);
    }
    if (pluginId === 'swiper') {
      if (state === 'layerPaths') return SwiperEventProcessor.getLayerPaths(this.mapId);
      logger.logError(`${state} not available from swiper`);
    }
    if (pluginId === 'time-slider') {
      if (state === 'timeSliderLayers') return TimeSliderEventProcessor.getTimeSliderLayers(this.mapId);
      logger.logError(`${state} not available from time slider`);
    }
    return undefined;
  }

  /**
   * Get the collapsed state of layer's legend.
   * @param {string} layerPath - Path of the layer to get state for.
   * @param {boolean} collapsed - The new state
   * @returns {boolean} If the legend is collapsed.
   */
  setLegendCollapsedState(layerPath: string, collapsed?: boolean): void {
    // Redirect to event processor
    MapEventProcessor.setMapLegendCollapsed(this.mapId, layerPath, collapsed);
  }

  /**
   * Set selected layer in layers tab.
   * @param {string} layerPath - The path of the layer to set
   */
  setSelectedLayersTabLayer(layerPath: string): void {
    LegendEventProcessor.setSelectedLayersTabLayer(this.mapId, layerPath);
  }

  reorderLayers(mapId: string, layerPath: string, move: number): void {
    // Apply some ordering logic
    const direction = move < 0 ? -1 : 1;
    let absoluteMoves = Math.abs(move);
    const orderedLayers = [...MapEventProcessor.getMapOrderedLayerInfo(this.mapId)];
    let startingIndex = -1;
    for (let i = 0; i < orderedLayers.length; i++) if (orderedLayers[i].layerPath === layerPath) startingIndex = i;
    const layerInfo = orderedLayers[startingIndex];
    const movedLayers = MapEventProcessor.findMapLayerAndChildrenFromOrderedInfo(mapId, layerPath, orderedLayers);
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
    MapEventProcessor.setMapOrderedLayerInfo(mapId, orderedLayers);

    // Reorder the legend layers, because the order layer info has changed
    LegendEventProcessor.reorderLegendLayers(mapId);

    // Emit event
    this.#emitLayersReordered({ orderedLayers });
  }

  /**
   * Emits layers reordered event.
   * @param {LayersReorderedEvent} event - The event to emit
   * @private
   */
  #emitLayersReordered(event: LayersReorderedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayersReorderedHandlers, event);
  }

  /**
   * Registers a layers reordered event handler.
   * @param {LayersReorderedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayersReordered(callback: LayersReorderedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayersReorderedHandlers, callback);
  }

  /**
   * Unregisters a layers reordered event handler.
   * @param {LayersReorderedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayersReordered(callback: LayersReorderedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayersReorderedHandlers, callback);
  }
}

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
