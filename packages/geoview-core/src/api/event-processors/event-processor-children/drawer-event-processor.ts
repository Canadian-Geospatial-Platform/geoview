import { Feature, Overlay } from 'ol';
import { LineString, Polygon, Point, Circle as CircleGeom, Geometry } from 'ol/geom';
import { Style, Stroke, Fill, Circle } from 'ol/style';
import { getArea, getLength } from 'ol/sphere';
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

  static #createMeasureTooltip(feature: Feature<Geometry>, hideMeasurements: boolean): Overlay | undefined {
    // Get the measureTooltip for the feature if one alrady exists
    let measureTooltip = (feature.get('measureTooltip') as Overlay) || undefined;
    if (measureTooltip) {
      measureTooltip.getElement()?.remove();
    }
    const geom = feature.getGeometry();

    let output: string | undefined;
    let tooltipCoord: number[] | undefined;

    // Add measurement element (display: None)
    if (geom instanceof LineString) {
      const length = getLength(geom);
      if (length > 100) {
        output = `${Math.round((length / 1000) * 100) / 100} km`;
      } else {
        output = `${Math.round(length * 100) / 100} m`;
      }

      tooltipCoord = geom.getLastCoordinate();
    }

    if (geom instanceof Polygon) {
      const area = getArea(geom);
      if (area > 10000) {
        output = `${Math.round((area / 1000000) * 100) / 100} km<sup>2</sup>`;
      } else {
        output = `${Math.round(area * 100) / 100} m<sup>2</sup>`;
      }

      tooltipCoord = geom.getInteriorPoint().getCoordinates();
      tooltipCoord.pop();
    }

    if (geom instanceof CircleGeom) {
      // For Circle geometries, calculate area using π*r²
      const radius = geom.getRadius();
      const area = Math.PI * radius * radius;
      if (area > 10000) {
        output = `${Math.round((area / 1000000) * 100) / 100} km<sup>2</sup>`;
      } else {
        output = `${Math.round(area * 100) / 100} m<sup>2</sup>`;
      }
      tooltipCoord = geom.getCenter();
    }
    if (!output || !tooltipCoord) return undefined;

    const measureTooltipElement = document.createElement('div');
    measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';

    measureTooltipElement.innerHTML = output;
    measureTooltipElement.hidden = hideMeasurements;

    // If no measure tooltip, create a new one
    if (!measureTooltip) {
      measureTooltip = new Overlay({
        offset: [0, -15],
        positioning: 'bottom-center',
        stopEvent: false,
        insertFirst: false,
      });
    }
    measureTooltip.setElement(measureTooltipElement);
    measureTooltip.setPosition(tooltipCoord);

    // Set the tooltip on the feature so it can be replaced later if modified
    feature.set('measureTooltip', measureTooltip);
    return measureTooltip;
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
    const { hideMeasurements } = state;

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

      const geom = feature.getGeometry();
      if (!geom) return;
      if (geom instanceof Point) return;

      const newOverlay = this.#createMeasureTooltip(feature, hideMeasurements);
      if (newOverlay) {
        state.actions.addMeasureOverlay(newOverlay);
        viewer.map.addOverlay(newOverlay);
      }
    });

    // Update state
    state.actions.setDrawInstance(draw);
    if (geomType) {
      state.actions.setGeomType(geomType);
    }

    // If editing already, but the edit group doesn't exist, create it
    const groupKey = `draw-${geomType}`;
    if (state.isEditing && !(groupKey in state.editInstances)) {
      const editInstance = viewer.initModifyInteractions(groupKey);
      state.actions.setEditInstance(groupKey, editInstance);
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
   * Initiates editing interactions
   * @param mapId The map ID
   * @param geomTypes Array of geometry types to start editing
   */
  public static startEditing(mapId: string, geomTypes?: string[]): void {
    const state = this.getDrawerState(mapId);
    if (!state) return;

    // Get the map viewer instance
    const viewer = MapEventProcessor.getMapViewer(mapId);
    if (!viewer) return;

    const typesToEdit = geomTypes || ['Point', 'LineString', 'Polygon', 'Circle'];
    const { hideMeasurements } = state;

    // If editing already, stop and restart as it's likely a style change
    if (Object.keys(state.editInstances).length > 0) {
      Object.keys(state.editInstances).forEach((type) => {
        state.editInstances[type]?.stopInteraction();
        state.actions.setEditInstance(type, undefined);
      });
    }

    typesToEdit.forEach((type) => {
      const groupKey = `draw-${type}`;
      // Only start editing if the drawing group exists
      if (viewer.layer.geometry.geometryGroups.find((group) => group.geometryGroupId === groupKey) !== undefined) {
        const editInstance = viewer.initModifyInteractions(groupKey);

        // Event handler for updating measrement tool
        editInstance.onModifyEnded((_sender, event) => {
          const feature = event.features.item(0);
          if (!feature) return;

          const geom = feature.getGeometry();
          if (!geom) return;
          if (geom instanceof Point) return;

          this.#createMeasureTooltip(feature, hideMeasurements);
        });

        state.actions.setEditInstance(groupKey, editInstance);
      }
    });

    // If we have an active drawing instance, make sure it stay active
    // when editing is enabled
    if (state.drawInstance) {
      state.drawInstance.startInteraction();
    }
  }

  /**
   * Stops the editing interatction for all groups
   * @param mapId The map ID
   * @param geomTypes Array of geometry types to stop editing
   */
  public static stopEditing(mapId: string, geomTypes?: string[]): void {
    const state = this.getDrawerState(mapId);
    if (!state) return;

    // Get the map viewer instance
    const viewer = MapEventProcessor.getMapViewer(mapId);
    if (!viewer) return;

    const typesToEdit = geomTypes || ['Point', 'LineString', 'Polygon', 'Circle'];

    // Edit geometries for each type
    typesToEdit.forEach((type) => {
      const groupKey = `draw-${type}`;

      if (!(groupKey in state.editInstances) || state.editInstances[groupKey] === undefined) return;
      state.editInstances[groupKey].stopInteraction();
      state.actions.removeEditInstance(groupKey);
    });
  }

  /**
   * Function to toggle editing state
   * @param mapId The map ID
   * @param geomTypes Array of geometry types to toggle editing
   */
  public static toggleEditing(mapId: string, geomTypes?: string[]): void {
    const state = this.getDrawerState(mapId);
    if (!state) return;

    const isEditing = state.actions.getIsEditing();
    if (isEditing) {
      this.stopEditing(mapId, geomTypes);
    } else {
      this.startEditing(mapId, geomTypes);
    }
    state.actions.setIsEditing(!isEditing);
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

    // Clear geometries for each type
    typesToClear.forEach((type) => {
      const groupKey = `draw-${type}`;
      const geometryGroup = viewer.layer.geometry.geometryGroups.find((group) => group.geometryGroupId === groupKey);
      if (geometryGroup !== undefined) {
        // Clear measurements
        geometryGroup.vectorSource.getFeatures().forEach((feature) => {
          const measureTooltip = feature.get('measureTooltip');
          measureTooltip?.getElement()?.remove();
          state.actions.removeMeasureOverlay(measureTooltip);
        });

        // Clear Geometries
        viewer.layer.geometry.deleteGeometriesFromGroup(groupKey);
      }
    });
  }

  /**
   * Changes the geometry type of the drawing tool
   * @param mapId The map ID
   */
  public static changeGeomType(mapId: string): void {
    const state = this.getDrawerState(mapId);
    if (!state) return;

    // If drawing, restart drawing to set the style
    if (state.actions.getIsDrawing()) {
      this.startDrawing(mapId);
    }

    // If editing, restart editing
    // Do this after the start drawing so the group is created if missing
    if (state.isEditing) {
      this.stopEditing(mapId);
      this.startEditing(mapId);
    }
  }

  /**
   * Toggles the measurement overlays on the map
   * @param mapId The map ID
   */
  public static toggleHideMeasurements(mapId: string): void {
    const state = this.getDrawerState(mapId);
    if (!state) return;

    // Get the map viewer instance
    const viewer = MapEventProcessor.getMapViewer(mapId);
    if (!viewer) return;

    const { hideMeasurements, measureOverlays } = state;

    // Toggle the visibility of the measure tooltips
    measureOverlays.forEach((overlay) => {
      const elem = overlay.getElement();
      if (elem) elem.hidden = !hideMeasurements;
    });
    state.actions.setHideMeasurements(!hideMeasurements);
  }

  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  // GV NEVER add a store action who does set state AND map action at a same time.
  // GV Review the action in store state to make sure
}
