import { Style, Stroke, Fill, Circle } from 'ol/style';
import { DrawEvent } from 'ol/interaction/Draw';
import { IDrawerState, StyleProps } from '@/core/stores/store-interface-and-intial-values/drawer-state';
// import { logger } from '@/core/utils/logger';

import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { MapEventProcessor } from './map-event-processor';

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
   * Starts a drawing operation with the specified geometry type
   * @param {string} mapId The map ID
   * @param {string} geomType The geometry type to draw (optional, uses current state if not provided)
   * @param {StyleProps} styleInput Optional style properties to use
   */
  public static startDrawing(mapId: string, geomType?: string, styleInput?: StyleProps): void {
    const state = this.getDrawerState(mapId);
    if (!state) return;

    // Get the map viewer instance
    const viewer = MapEventProcessor.getMapViewer(mapId);
    if (!viewer) return;

    // Get current state values if not provided
    const currentGeomType = geomType || state.geomType;
    const currentStyle = styleInput || state.style;

    // If drawing already, stop and restart as it's likely a style change
    if (this.getDrawerState(mapId)?.drawInstance) {
      this.stopDrawing(mapId);
    }

    // Initialize drawing interaction
    const draw = viewer.initDrawInteractions(`draw-${currentGeomType}`, currentGeomType, currentStyle);

    // Set up draw end event handler
    draw.onDrawEnd((_sender: unknown, event: DrawEvent): void => {
      const { feature } = event;

      // Create a style based on current color settings
      let featureStyle;

      if (currentGeomType === 'Point') {
        // For points, use a circle style
        featureStyle = new Style({
          image: new Circle({
            radius: currentStyle.strokeWidth * 3 || 6,
            fill: new Fill({
              color: currentStyle.fillColor,
            }),
            stroke: new Stroke({
              color: currentStyle.strokeColor,
              width: currentStyle.strokeWidth || 1.3,
            }),
          }),
        });
      } else {
        // For other geometry types
        featureStyle = new Style({
          stroke: new Stroke({
            color: currentStyle.strokeColor,
            width: currentStyle.strokeWidth || 1.3,
          }),
          fill: new Fill({
            color: currentStyle.fillColor,
          }),
        });
      }

      // Apply the style to the feature
      feature.setStyle(featureStyle);
    });

    // Update state
    state.actions.setDrawInstance(draw);
    if (geomType) {
      state.actions.setGeomType(geomType);
    }
  }

  /**
   * Stops the current drawing operation
   * @param {string} mapId The map ID
   */
  public static stopDrawing(mapId: string): void {
    const state = this.getDrawerState(mapId);
    if (!state) return;

    // Update state
    state.drawInstance?.stopInteraction();
    state.actions.removeDrawInstance();
  }

  /**
   * Toggles the drawing state
   * @param {string} mapId The map ID
   */
  public static toggleDrawing(mapId: string): void {
    const state = this.getDrawerState(mapId);
    if (!state) return;

    if (state.actions.getIsDrawing()) {
      this.stopDrawing(mapId);
    } else {
      this.startDrawing(mapId);
    }
  }

  /**
   * Clears all drawings from the map
   * @param {string} mapId The map ID
   * @param {string[]} geomTypes Array of geometry types to clear
   */
  public static clearDrawings(mapId: string, geomTypes?: string[]): void {
    const state = this.getDrawerState(mapId);
    if (!state) return;

    // Get the map viewer instance
    const viewer = MapEventProcessor.getMapViewer(mapId);
    if (!viewer) return;

    const typesToClear = geomTypes || ['Point', 'LineString', 'Polygon', 'Circle'];

    // TODO Need to only clear groups that exist
    // Clear geometries for each type
    typesToClear.forEach((type) => {
      const groupKey = `draw-${type}`;
      viewer.layer.geometry.deleteGeometriesFromGroup(groupKey);
    });
  }

  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  // GV NEVER add a store action who does set state AND map action at a same time.
  // GV Review the action in store state to make sure
}
