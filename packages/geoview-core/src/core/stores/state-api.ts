import {
  getStoreGeochartChartsConfig,
  getStoreGeochartLayerDataArray,
  getStoreGeochartLayerDataArrayBatchLayerPathBypass,
  getStoreGeochartSelectedLayerPath,
  type GeoChartStoreByLayerPath,
  type TypeGeochartResultSetEntry,
} from './states/geochart-state';
import type { TimeSliderLayerSet } from './states/time-slider-state';
import { getStoreTimeSliderLayers } from './states/time-slider-state';
import { getStoreSwiperLayerPaths } from './states/swiper-state';
import {
  getStoreLayerLegendCollapsed,
  getStoreLayerLegendLayers,
  getStoreLayerOrderedLayerPaths,
  setStoreReorderLegendLayers,
  utilFindLayerAndChildrenPaths,
} from './states/layer-state';
import type { TypeLegendLayer } from '@/core/components/layers/types';
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
   * at the target index. Only layers that are siblings in the legend tree are considered valid swap
   * targets, so children can never escape their parent group.
   *
   * @param layerPath - The path of the layer to move
   * @param move - The number of sibling positions to move (negative = toward index 0, positive = toward end)
   */
  reorderLayers(layerPath: string, move: number): void {
    const direction = move < 0 ? -1 : 1;
    const mapId = this.#layerController.getMapId();
    const orderedLayers = [...getStoreLayerOrderedLayerPaths(mapId)];
    const startingIndex = orderedLayers.indexOf(layerPath);

    // If layer not found, exit early
    if (startingIndex === -1) {
      logger.logError(`Layer ${layerPath} not found in ordered layers`);
      return;
    }

    // Extract the layer block (layer + all descendants)
    const movedLayers = utilFindLayerAndChildrenPaths(layerPath, orderedLayers);
    orderedLayers.splice(startingIndex, movedLayers.length);

    // Find sibling paths from the legend tree (same source of truth as the UI)
    const legendLayers = getStoreLayerLegendLayers(mapId);
    const siblingPaths = StateApi.#findSiblingPaths(layerPath, legendLayers);

    // Collect indices of all siblings (excluding the moved layer) in the modified array
    const siblingIndices: number[] = [];
    for (let i = 0; i < orderedLayers.length; i++) {
      if (siblingPaths.includes(orderedLayers[i])) {
        siblingIndices.push(i);
      }
    }

    // Compute insertion index based on direction
    let insertionIndex = startingIndex;

    if (siblingIndices.length > 0) {
      if (direction === 1) {
        // Moving DOWN: find the first sibling at or after startingIndex, then advance past its subtree
        const nextSiblingPos = siblingIndices.findIndex((idx) => idx >= startingIndex);
        if (nextSiblingPos !== -1) {
          const targetPos = Math.min(nextSiblingPos + Math.abs(move) - 1, siblingIndices.length - 1);
          const targetSiblingIndex = siblingIndices[targetPos];
          const targetSiblingPath = orderedLayers[targetSiblingIndex];
          // Insert after the target sibling's subtree
          insertionIndex = targetSiblingIndex + 1;
          while (insertionIndex < orderedLayers.length && orderedLayers[insertionIndex].startsWith(`${targetSiblingPath}/`)) {
            insertionIndex++;
          }
        }
      } else {
        // Moving UP: find siblings before startingIndex, then insert at the target sibling's position
        const prevSiblings = siblingIndices.filter((idx) => idx < startingIndex);
        if (prevSiblings.length > 0) {
          const targetPos = Math.max(prevSiblings.length - Math.abs(move), 0);
          insertionIndex = siblingIndices[targetPos];
        }
      }
    }

    orderedLayers.splice(insertionIndex, 0, ...movedLayers);

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

  /**
   * Finds the sibling layer paths for a given layer by walking the legend tree.
   *
   * Top-level layers are siblings of each other regardless of their path prefix.
   * Children within a group are siblings of each other.
   *
   * @param layerPath - The layer path to find siblings for
   * @param legendLayers - The root legend layers array
   * @returns The sibling paths (excluding the layer itself)
   */
  static #findSiblingPaths(layerPath: string, legendLayers: TypeLegendLayer[]): string[] {
    // Check if it's a top-level layer
    if (legendLayers.some((layer) => layer.layerPath === layerPath)) {
      return legendLayers.map((layer) => layer.layerPath).filter((path) => path !== layerPath);
    }

    // Recursively search for the parent group containing this layer
    const findInChildren = (layers: TypeLegendLayer[]): string[] | undefined => {
      for (const layer of layers) {
        if (layer.children.some((child) => child.layerPath === layerPath)) {
          return layer.children.map((child) => child.layerPath).filter((path) => path !== layerPath);
        }
        const result = findInChildren(layer.children);
        if (result) return result;
      }
      return undefined;
    };

    return findInChildren(legendLayers) ?? [];
  }
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
