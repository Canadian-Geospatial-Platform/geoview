import type { ISwiperState, SwipeOrientation } from '@/core/stores/store-interface-and-intial-values/swiper-state';
import { PluginStateUninitializedError } from '@/core/exceptions/geoview-exceptions';
import { logger } from '@/core/utils/logger';

import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with UIEventProcessor vs UIState

/**
 * Event processor focusing on interacting with the swiper state in the store.
 */
export class SwiperEventProcessor extends AbstractEventProcessor {
  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  // GV Typescript MUST always use the defined store actions below to modify store - NEVER use setState!
  // GV Some action does state modifications AND map actions.
  // GV ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler

  /**
   * Checks whether the Swiper plugin is initialized and available for the specified map.
   * Attempts to retrieve the swiper state and returns true if successful, false if uninitialized.
   * Use this before calling other Swiper methods to avoid PluginStateUninitializedError.
   * @param {string} mapId - The map identifier
   * @return {boolean} True when the Swiper plugin is initialized and ready, false otherwise
   * @static
   */
  static isSwiperInitialized(mapId: string): boolean {
    try {
      // Get its state, this will throw PluginStateUninitializedError if uninitialized
      this.getSwiperState(mapId);
      return true;
    } catch {
      // Uninitialized
      return false;
    }
  }

  /**
   * Retrieves the swiper state slice from the store for the specified map.
   * Provides access to layer paths being swiped and swiper orientation settings.
   * Only available when the Swiper plugin is active for the map.
   * @param {string} mapId - The map identifier
   * @return {ISwiperState} The swiper state slice
   * @throws {PluginStateUninitializedError} When the Swiper plugin is not initialized for this map
   * @static
   * @protected
   */
  protected static getSwiperState(mapId: string): ISwiperState {
    // Get the swiper state
    const { swiperState } = super.getState(mapId);

    // If not found
    if (!swiperState) throw new PluginStateUninitializedError('Swiper', mapId);

    // Return it
    return swiperState;
  }

  /**
   * Retrieves the array of layer paths that currently have swiper functionality active.
   * Returns an array of layer path strings that are being affected by the swiper interaction.
   * @param {string} mapId - The map identifier
   * @return {string[]} Array of layer paths with active swiper functionality
   * @throws {PluginStateUninitializedError} When the Swiper plugin is not initialized for this map
   * @static
   */
  static getLayerPaths(mapId: string): string[] {
    // Get the swiper state which is only initialized if the Swiper Plugin exists.
    const swiperState = this.getSwiperState(mapId);

    // Return the layer paths
    return swiperState.layerPaths;
  }

  /**
   * Sets the complete array of layer paths that should have swiper functionality active.
   * Replaces the current swiper layer paths with the provided array.
   * Layers in this array will be affected by the swiper interaction (before/after comparison).
   * @param {string} mapId - The map identifier
   * @param {string[]} layerPaths - Array of layer paths to apply swiper functionality to
   * @return {void}
   * @throws {PluginStateUninitializedError} When the Swiper plugin is not initialized for this map
   * @static
   */
  static setLayerPaths(mapId: string, layerPaths: string[]): void {
    // Get the swiper state which is only initialized if the Swiper Plugin exists.
    const swiperState = this.getSwiperState(mapId);

    // set store layer paths
    swiperState.setterActions.setLayerPaths(layerPaths);

    // Log
    logger.logInfo('Added Swiper functionality for layer paths:', layerPaths);

    // TODO: Also update the layer array in other store state to inform the later has a swiper attached to it?
  }

  /**
   * Adds swiper functionality to a single layer without affecting existing swiper layers.
   * Appends the layer path to the current swiper layer paths array if not already present.
   * If the layer is already in the swiper, logs info and takes no action.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The unique path identifying the layer to add swiper to
   * @return {void}
   * @throws {PluginStateUninitializedError} When the Swiper plugin is not initialized for this map
   * @static
   */
  static addLayerPath(mapId: string, layerPath: string): void {
    // Get the swiper state which is only initialized if the Swiper Plugin exists.
    const swiperState = this.getSwiperState(mapId);

    // If no layer paths, return
    if (!swiperState.layerPaths) return;

    // If not already added
    if (!swiperState.layerPaths.includes(layerPath)) {
      // Add in the array
      const updatedArray = [...swiperState.layerPaths];
      updatedArray.push(layerPath);

      // Update the layer data array in the store
      swiperState.setterActions.setLayerPaths(updatedArray);

      // Log
      logger.logInfo('Added Swiper functionality for layer path:', layerPath);

      // TODO: Also update the layer array in other store state to inform the later has a swiper attached to it?
    } else {
      // Log
      logger.logInfo('Swiper functionality already active for layer path:', layerPath);
    }
  }

  /**
   * Removes swiper functionality from a single layer without affecting other swiper layers.
   * Removes the layer path from the swiper layer paths array if present.
   * If the layer is not in the swiper, logs info and takes no action.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The unique path identifying the layer to remove swiper from
   * @return {void}
   * @throws {PluginStateUninitializedError} When the Swiper plugin is not initialized for this map
   * @static
   */
  static removeLayerPath(mapId: string, layerPath: string): void {
    // Get the swiper state which is only initialized if the Swiper Plugin exists.
    const swiperState = this.getSwiperState(mapId);

    // If no layer paths, return
    if (!swiperState.layerPaths) return;

    // Find the index with the layer path
    const layerIndex = swiperState.layerPaths.findIndex((layer) => layer === layerPath);

    // Config to remove
    if (layerIndex !== undefined && layerIndex >= 0) {
      // Remove from the array
      const updatedArray = [...swiperState.layerPaths];
      updatedArray.splice(layerIndex, 1);

      // Update the layer data array in the store
      swiperState.setterActions.setLayerPaths(updatedArray);

      // Log
      logger.logInfo('Removed Swiper functionality for layer path:', layerPath);

      // TODO: Also update the layer array in other store state to inform the later has a swiper attached to it?
    } else {
      // Log
      logger.logInfo('Swiper functionality already inactive for layer path:', layerPath);
    }
  }

  /**
   * Removes swiper functionality from all layers on the map.
   * Clears the entire swiper layer paths array, disabling the swiper for all layers.
   * @param {string} mapId - The map identifier
   * @return {void}
   * @throws {PluginStateUninitializedError} When the Swiper plugin is not initialized for this map
   * @static
   */
  static removeAll(mapId: string): void {
    // Get the swiper state which is only initialized if the Swiper Plugin exists.
    const swiperState = this.getSwiperState(mapId);

    // If no layer paths, return
    if (!swiperState.layerPaths) return;

    // Get all layer paths
    const { layerPaths } = swiperState;

    // Update the layer data array in the store
    swiperState.setterActions.setLayerPaths([]);

    // Log
    logger.logInfo('Removed Swiper functionality for all layer paths', layerPaths);

    // TODO: Also update the layer array in other store state to inform the later has a swiper attached to it?
  }

  /**
   * Sets the orientation (direction) of the swiper divider line.
   * Controls whether the swiper divides the map horizontally or vertically.
   * @param {string} mapId - The map identifier
   * @param {SwipeOrientation} orientation - The swiper orientation ('horizontal' or 'vertical')
   * @return {void}
   * @throws {PluginStateUninitializedError} When the Swiper plugin is not initialized for this map
   * @static
   */
  static setOrientation(mapId: string, orientation: SwipeOrientation): void {
    // Get the swiper state which is only initialized if the Swiper Plugin exists.
    const swiperState = this.getSwiperState(mapId);

    // set store orientation
    swiperState.setterActions.setOrientation(orientation);
  }

  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  // GV NEVER add a store action who does set state AND map action at a same time.
  // GV Review the action in store state to make sure
}
