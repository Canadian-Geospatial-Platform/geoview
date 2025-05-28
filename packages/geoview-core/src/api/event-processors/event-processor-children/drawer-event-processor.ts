import { IDrawerState } from '@/core/stores/store-interface-and-intial-values/drawer-state';
import { logger } from '@/core/utils/logger';

import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with UIEventProcessor vs UIState

/**
 * Event processor focusing on interacting with the drawer state in the store.
 */
export class DrawerEventProcessor extends AbstractEventProcessor {
  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  // GV Typescript MUST always use the defined store actions below to modify store - NEVER use setState!
  // GV Some action does state modifications AND map actions.
  // GV ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler

  /**
   * Shortcut to get the Drawer state for a given map id
   * @param {string} mapId The mapId
   * @returns {IDrawerState | undefined} The Drawer state. Forcing the return to also be 'undefined', because
   *                                       there will be no drawerState if the Drawer plugin isn't active.
   *                                       This helps the developers making sure the existence is checked.
   */
  protected static getDrawerState(mapId: string): IDrawerState | undefined {
    // Return the drawer state when it exists
    return super.getState(mapId).drawerState;
  }

  /**
   * Sets the layer paths on which the drawer should be activated.
   *
   * @param {string} mapId -  The map id.
   * @returns {}
   */
  static getLayerPaths(mapId: string): string[] | undefined {
    return this.getDrawerState(mapId)?.layerPaths;
  }

  /**
   * Sets the layer paths on which the drawer should be activated.
   *
   * @param {string} mapId the map id
   * @param {string[]} layerPaths The array of layer paths
   */
  static setLayerPaths(mapId: string, layerPaths: string[]): void {
    // set store layer paths
    this.getDrawerState(mapId)?.setterActions.setLayerPaths(layerPaths);

    // Log
    logger.logInfo('Added Drawer functionality for layer paths:', layerPaths);

    // TODO: Also update the layer array in other store state to inform the later has a drawer attached to it?
  }

  /**
   * Adds a drawer functionality to the specified map id and layer path
   * @param {string} mapId The map ID
   * @param {string} layerPath The layer path
   */
  static addLayerPath(mapId: string, layerPath: string): void {
    // The processor needs an initialized layer paths store which is only initialized if the Drawer Plugin exists.
    // Therefore, we validate its existence first.
    if (!this.getDrawerState(mapId)) return;
    if (!this.getDrawerState(mapId)?.layerPaths) return;

    // If not already added
    if (!this.getDrawerState(mapId)!.layerPaths.includes(layerPath)) {
      // Add in the array
      const updatedArray = [...this.getDrawerState(mapId)!.layerPaths];
      updatedArray.push(layerPath);

      // Update the layer data array in the store
      this.getDrawerState(mapId)!.setterActions.setLayerPaths(updatedArray);

      // Log
      logger.logInfo('Added Drawer functionality for layer path:', layerPath);

      // TODO: Also update the layer array in other store state to inform the later has a drawer attached to it?
    } else {
      // Log
      logger.logInfo('Drawer functionality already active for layer path:', layerPath);
    }
  }

  /**
   * Removes a drawer functionality for the specified map id and layer path
   * @param {string} mapId The map ID
   * @param {string} layerPath The layer path
   */
  static removeLayerPath(mapId: string, layerPath: string): void {
    // The processor needs an initialized layer paths store which is only initialized if the Drawer Plugin exists.
    // Therefore, we validate its existence first.
    if (!this.getDrawerState(mapId)) return;
    if (!this.getDrawerState(mapId)?.layerPaths) return;

    // Find the index with the layer path
    const layerIndex = this.getDrawerState(mapId)!.layerPaths.findIndex((layer) => layer === layerPath);

    // Config to remove
    if (layerIndex !== undefined && layerIndex >= 0) {
      // Remove from the array
      const updatedArray = [...this.getDrawerState(mapId)!.layerPaths];
      updatedArray.splice(layerIndex, 1);

      // Update the layer data array in the store
      this.getDrawerState(mapId)!.setterActions.setLayerPaths(updatedArray);

      // Log
      logger.logInfo('Removed Drawer functionality for layer path:', layerPath);

      // TODO: Also update the layer array in other store state to inform the later has a Drawer attached to it?
    } else {
      // Log
      logger.logInfo('Drawer functionality already inactive for layer path:', layerPath);
    }
  }

  /**
   * Removes the drawer functionality for all layer paths
   * @param {string} mapId The map ID
   */
  static removeAll(mapId: string): void {
    // The processor needs an initialized layer paths store which is only initialized if the Drawer Plugin exists.
    // Therefore, we validate its existence first.
    if (!this.getDrawerState(mapId)) return;
    if (!this.getDrawerState(mapId)?.layerPaths) return;

    // Get all layer paths
    const { layerPaths } = this.getDrawerState(mapId)!;

    // Update the layer data array in the store
    this.getDrawerState(mapId)!.setterActions.setLayerPaths([]);

    // Log
    logger.logInfo('Removed Drawer functionality for all layer paths', layerPaths);

    // TODO: Also update the layer array in other store state to inform the later has a drawer attached to it?
  }

  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  // GV NEVER add a store action who does set state AND map action at a same time.
  // GV Review the action in store state to make sure
}
