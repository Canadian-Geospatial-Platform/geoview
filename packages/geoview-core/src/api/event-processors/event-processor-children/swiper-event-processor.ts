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
   * Checks if the Swiper plugin is iniitialized for the given map.
   * @param {string} mapId - The map id
   * @returns {boolean} True when the Swiper plugin is initialized.
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
   * Shortcut to get the Swiper state for a given map id
   * @param {string} mapId - The mapId
   * @returns {ISwiperState} The Swiper state.
   * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
   * @static
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
   * Sets the layer paths on which the swiper should be activated.
   *
   * @param {string} mapId - The map id.
   * @returns {string[]} The layer paths
   * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
   * @static
   */
  static getLayerPaths(mapId: string): string[] {
    // Get the swiper state which is only initialized if the Swiper Plugin exists.
    const swiperState = this.getSwiperState(mapId);

    // Return the layer paths
    return swiperState.layerPaths;
  }

  /**
   * Sets the layer paths on which the swiper should be activated.
   *
   * @param {string} mapId - The map id
   * @param {string[]} layerPaths - The array of layer paths
   * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
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
   * Adds a swiper functionality to the specified map id and layer path
   * @param {string} mapId - The map ID
   * @param {string} layerPath - The layer path
   * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
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
   * Removes a swiper functionality for the specified map id and layer path
   * @param {string} mapId - The map ID
   * @param {string} layerPath - The layer path
   * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
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
   * Removes the swiper functionality for all layer paths
   * @param {string} mapId - The map ID
   * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
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
   * Sets the orientation of the swiper.
   * @param {string} mapId - The map IDh
   * @param {SwipeOrientation} orientation - The orientation to set
   * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
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
