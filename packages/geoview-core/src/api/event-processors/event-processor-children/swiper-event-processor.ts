import { GeoviewStoreType } from '@/core/stores';
import { ISwiperState } from '@/core/stores/store-interface-and-intial-values/swiper-state';
import { logger } from '@/core/utils/logger';

import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';

/**
 * Event processor focusing on interacting with the swiper state in the store.
 */
export class SwiperEventProcessor extends AbstractEventProcessor {
  /**
   * Overrides initialization of the Swiper Event Processor
   * @param {GeoviewStoreType} store The store associated with the Swiper Event Processor
   * @returns An array of the subscriptions callbacks which were created
   */
  protected onInitialize(store: GeoviewStoreType): Array<() => void> | void {
    // Checks for udpated layers in layer order
    const unsubLayerRemoved = store.subscribe(
      (state) => state.mapState.orderedLayerInfo,
      (cur, prev) => {
        // Log
        logger.logTraceCoreStoreSubscription('SWIPER EVENT PROCESSOR - orderedLayerInfo', cur);

        // Read the layer paths of each layer info
        const curOrderedLayerPaths = cur.map((layerInfo) => layerInfo.layerPath);
        const prevOrderedLayerPaths = prev.map((layerInfo) => layerInfo.layerPath);

        // Get all the layer paths to check in a distinct array for looping purposes
        const layerPathsToCheck = [...store.getState().swiperState.layerPaths];

        // For each layer paths the swiper is using
        layerPathsToCheck.forEach((layerPath) => {
          // If it was in the layerdata array and is not anymore
          if (prevOrderedLayerPaths.includes(layerPath) && !curOrderedLayerPaths.includes(layerPath)) {
            // Remove it
            SwiperEventProcessor.removeLayerPath(store.getState().mapId, layerPath);
          }
        });
      }
    );

    return [unsubLayerRemoved];
  }

  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  // GV Typescript MUST always use the defined store actions below to modify store - NEVER use setState!
  // GV Some action does state modifications AND map actions.
  // GV ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler

  /**
   * Shortcut to get the Swiper state for a given map id
   * @param {string} mapId The mapId
   * @returns {ISwiperState | undefined} The Swiper state. Forcing the return to also be 'undefined', because
   *                                       there will be no swiperState if the Swiper plugin isn't active.
   *                                       This helps the developers making sure the existence is checked.
   */
  protected static getSwiperState(mapId: string): ISwiperState | undefined {
    // Return the swiper state when it exists
    return super.getState(mapId).swiperState;
  }

  /**
   * Sets the layer paths on which the swiper should be activated.
   *
   * @param {string} mapId the map id
   * @param {string[]} layerPaths The array of layer paths
   */
  static setLayerPaths(mapId: string, layerPaths: string[]): void {
    // set store layer paths
    this.getSwiperState(mapId)?.actions.setLayerPaths(layerPaths);

    // Log
    logger.logInfo('Added Swiper functionality for layer paths:', layerPaths);

    // TODO: Also update the layer array in other store state to inform the later has a swiper attached to it?
  }

  /**
   * Adds a swiper functionality to the specified map id and layer path
   * @param {string} mapId The map ID
   * @param {string} layerPath The layer path
   */
  static addLayerPath(mapId: string, layerPath: string): void {
    // The processor needs an initialized layer paths store which is only initialized if the Swiper Plugin exists.
    // Therefore, we validate its existence first.
    if (!this.getSwiperState(mapId)) return;
    if (!this.getSwiperState(mapId)?.layerPaths) return;

    // If not already added
    if (!this.getSwiperState(mapId)!.layerPaths.includes(layerPath)) {
      // Add in the array
      const updatedArray = [...this.getSwiperState(mapId)!.layerPaths];
      updatedArray.push(layerPath);

      // Update the layer data array in the store
      this.getSwiperState(mapId)!.actions.setLayerPaths(updatedArray);

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
   * @param {string} mapId The map ID
   * @param {string} layerPath The layer path
   */
  static removeLayerPath(mapId: string, layerPath: string): void {
    // The processor needs an initialized layer paths store which is only initialized if the Swiper Plugin exists.
    // Therefore, we validate its existence first.
    if (!this.getSwiperState(mapId)) return;
    if (!this.getSwiperState(mapId)?.layerPaths) return;

    // Find the index with the layer path
    const layerIndex = this.getSwiperState(mapId)!.layerPaths.findIndex((layer) => layer === layerPath);

    // Config to remove
    if (layerIndex !== undefined && layerIndex >= 0) {
      // Remove from the array
      const updatedArray = [...this.getSwiperState(mapId)!.layerPaths];
      updatedArray.splice(layerIndex, 1);

      // Update the layer data array in the store
      this.getSwiperState(mapId)!.actions.setLayerPaths(updatedArray);

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
   * @param {string} mapId The map ID
   */
  static removeAll(mapId: string): void {
    // The processor needs an initialized layer paths store which is only initialized if the Swiper Plugin exists.
    // Therefore, we validate its existence first.
    if (!this.getSwiperState(mapId)) return;
    if (!this.getSwiperState(mapId)?.layerPaths) return;

    // Get all layer paths
    const { layerPaths } = this.getSwiperState(mapId)!;

    // Update the layer data array in the store
    this.getSwiperState(mapId)!.actions.setLayerPaths([]);

    // Log
    logger.logInfo('Removed Swiper functionality for all layer paths', layerPaths);

    // TODO: Also update the layer array in other store state to inform the later has a swiper attached to it?
  }

  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  // GV NEVER add a store action who does set state AND map action at a same time.
  // GV Review the action in store state to make sure
}
