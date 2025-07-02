import { Feature, Overlay } from 'ol';
import { LineString, Polygon, Point, Circle as CircleGeom, Geometry, SimpleGeometry } from 'ol/geom';
import { Style, Stroke, Fill, Icon as OLIcon } from 'ol/style';
import { getArea, getLength } from 'ol/sphere';
import { DrawEvent, GeometryFunction, SketchCoordType, createBox } from 'ol/interaction/Draw';
import { IDrawerState, StyleProps } from '@/core/stores/store-interface-and-intial-values/drawer-state';
// import { logger } from '@/core/utils/logger';

import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { AppEventProcessor } from './app-event-processor';
import { MapEventProcessor } from './map-event-processor';
import { MapViewerNotFoundError } from '@/core/exceptions/geoview-exceptions';
import { Draw, GeoviewStoreType } from '@/app';

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
   * Initializes the event processor and sets up subscriptions
   * @param {GeoviewStoreType} store The store to initialize with
   * @returns {Array<() => void>} Array of unsubscribe functions
   */
  override onInitialize(store: GeoviewStoreType): Array<() => void> {
    const { mapId } = store.getState();

    // Subscribe to language changes
    const unsubscribe = store.subscribe(
      (state) => state.appState.displayLanguage,
      () => {
        // Update all measurement tooltips when language changes
        DrawerEventProcessor.#updateMeasurementTooltips(mapId);
      }
    );

    // Return the unsubscribe function to be added to the subscription array
    return [unsubscribe];
  }

  /**
   * Gets all drawing features for a map
   * @param {string} mapId The map ID
   * @param {string[]} geomTypes Optional array of geometry types to filter by
   * @returns {Object} Object with geometry group keys and arrays of features
   */
  static #getGroupedDrawingFeatures(mapId: string, geomTypes?: string[]): { [key: string]: Feature[] } {
    const state = this.getDrawerState(mapId);
    if (!state) return {};

    // Get the map viewer instance
    const viewer = MapEventProcessor.getMapViewer(mapId);
    if (!viewer) throw new MapViewerNotFoundError(mapId);

    const features: { [key: string]: Feature[] } = {};

    // Clear geometries for each type
    (geomTypes || state.actions.getGeomTypes()).forEach((type) => {
      const groupKey = `draw-${type}`;
      const geometryGroup = viewer.layer.geometry.geometryGroups.find((group) => group.geometryGroupId === groupKey);
      if (geometryGroup !== undefined) {
        const newFeatures = geometryGroup.vectorSource.getFeatures();
        features[groupKey] = newFeatures;
      }
    });
    return features;
  }

  /**
   * Updates all measurement tooltips for a map with the current language
   * @param {string} mapId The map ID
   */
  static #updateMeasurementTooltips(mapId: string): void {
    const displayLanguage = AppEventProcessor.getDisplayLanguage(mapId);
    const features = this.#getGroupedDrawingFeatures(mapId);
    const allFeatures: Feature[] = Object.keys(features).reduce((acc: Feature<Geometry>[], curr: string) => {
      return [...acc, ...features[curr]];
    }, []);

    allFeatures.forEach((feature) => {
      const geom = feature.getGeometry();
      if (!geom) return;
      const overlay = feature.get('measureTooltip');
      if (overlay) {
        const { output, tooltipCoord } = this.#getFeatureMeasurements(geom, displayLanguage);
        overlay.element.children[0].innerHTML = output;
        overlay.setPosition(tooltipCoord);
      }
    });
  }

  /**
   * Formats a numeric value according to the display language
   * @param {number} value The value to format
   * @param {string} displayLanguage The display language ('en' or 'fr')
   * @returns {string} The formatted value
   */
  static #formatValue(value: number, displayLanguage: string): string {
    return displayLanguage === 'fr'
      ? value.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /**
   * Takes a length and converts it to a string to be used in the overlays
   * @param {number} length The length to be converted
   * @param {string} displayLanguage The display language
   * @returns {string} The string of text describing the length
   */
  static #getLengthText(length: number, displayLanguage: string): string {
    if (length > 100) {
      const value = Math.round((length / 1000) * 100) / 100;
      return `${this.#formatValue(value, displayLanguage)} km`;
    }
    const value = Math.round(length * 100) / 100;
    return `${this.#formatValue(value, displayLanguage)} m`;
  }

  /**
   * Takes an area and converts it to a string to be used in the overlays
   * @param {number} area The area to be converted
   * @param {string} displayLanguage The display language
   * @returns {string} The string of text describing the area
   */
  static #getAreaText(area: number, displayLanguage: string): string {
    if (area > 10000) {
      const value = Math.round((area / 1000000) * 100) / 100;
      return `${this.#formatValue(value, displayLanguage)} km<sup>2</sup>`;
    }
    const value = Math.round(area * 100) / 100;
    return `${this.#formatValue(value, displayLanguage)} m<sup>2</sup>`;
  }

  /**
   * Calculates measurements for a geometry feature
   * @param {Geometry} geom The geometry to measure
   * @param {string} displayLanguage The display language
   * @returns {Object} Object containing the formatted output text and tooltip coordinates
   */
  static #getFeatureMeasurements(
    geom: Geometry,
    displayLanguage: string
  ): { output: string | undefined; tooltipCoord: number[] | undefined } {
    let output: string | undefined;
    let tooltipCoord: number[] | undefined;

    if (geom instanceof LineString) {
      const length = getLength(geom);
      output = this.#getLengthText(length, displayLanguage);

      tooltipCoord = geom.getLastCoordinate();
    }

    if (geom instanceof Polygon) {
      const length = getLength(geom);
      output = this.#getLengthText(length, displayLanguage);

      const area = getArea(geom);
      output += `<br>${this.#getAreaText(area, displayLanguage)}`;

      tooltipCoord = geom.getInteriorPoint().getCoordinates();
      tooltipCoord.pop();
    }

    if (geom instanceof CircleGeom) {
      // For Circle geometries, calculate area using π*r²
      const radius = geom.getRadius();
      const length = 2 * Math.PI * radius;
      output = this.#getLengthText(length, displayLanguage);

      const area = Math.PI * radius * radius;
      output += `<br>${this.#getAreaText(area, displayLanguage)}`;

      tooltipCoord = geom.getCenter();
    }
    return { output, tooltipCoord };
  }

  /**
   * Creates or updates a measurement tooltip for a feature
   * @param {Feature<Geometry>} feature The feature to create a tooltip for
   * @param {boolean} hideMeasurements Whether to hide the measurement tooltip
   * @param {string} mapId The map ID
   * @returns {Overlay | undefined} The created or updated overlay, or undefined if creation failed
   */
  static #createMeasureTooltip(feature: Feature<Geometry>, hideMeasurements: boolean, mapId: string): Overlay | undefined {
    // Get current display language
    const displayLanguage = AppEventProcessor.getDisplayLanguage(mapId);

    // Get the measureTooltip for the feature if one alrady exists
    let measureTooltip = (feature.get('measureTooltip') as Overlay) || undefined;
    if (measureTooltip) {
      measureTooltip.getElement()?.remove();
    }
    const geom = feature.getGeometry();
    if (geom === undefined) return undefined;

    const { output, tooltipCoord } = this.#getFeatureMeasurements(geom, displayLanguage);

    if (!output || !tooltipCoord) return undefined;

    const measureTooltipElement = document.createElement('div');
    measureTooltipElement.className = 'drawer-tooltip drawer-tooltip-measure';
    measureTooltipElement.style.textAlign = 'center';

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
   * Utility to convert SVG path to coordinates
   * @param {string} pathData SVG path string
   * @param {number[]} center Center coordinates
   * @returns {number[][]} Array of coordinates
   */
  static #svgPathToCoordinates = (pathData: string, center: number[]): number[][] => {
    const commands = pathData.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];
    const coords: number[][] = [];
    let currentPoint = [0, 0];

    commands.forEach((cmd) => {
      const type = cmd[0];
      const values = cmd
        .slice(1)
        .trim()
        .split(/[\s,]+/)
        .map(Number)
        .filter((n) => !Number.isNaN(n));

      if (type === 'M') {
        // Absolute move
        for (let i = 0; i < values.length; i += 2) {
          currentPoint = [values[i], values[i + 1]];
          coords.push([...currentPoint]);
        }
      } else if (type === 'm') {
        // Relative move
        for (let i = 0; i < values.length; i += 2) {
          currentPoint = [currentPoint[0] + values[i], currentPoint[1] + values[i + 1]];
          coords.push([...currentPoint]);
        }
      } else if (type === 'L') {
        // Absolute line
        for (let i = 0; i < values.length; i += 2) {
          currentPoint = [values[i], values[i + 1]];
          coords.push([...currentPoint]);
        }
      } else if (type === 'l') {
        // Relative line
        for (let i = 0; i < values.length; i += 2) {
          currentPoint = [currentPoint[0] + values[i], currentPoint[1] + values[i + 1]];
          coords.push([...currentPoint]);
        }
      } else if (type === 'Z' || type === 'z') {
        // Close path - add first point again
        if (coords.length > 0) {
          coords.push([...coords[0]]);
        }
      }
    });

    // Apply center offset after all coordinates are calculated
    return coords.map((point) => [point[0] + center[0], point[1] + center[1]]);
  };

  /**
   * Utility to convert SVG path to coordinates with auto-centering
   * @param {strgin} svgPath SVG path string
   * @param {SketchCoordType} coordinates Circle coordinate (center and out edge)
   * @param {SimpleGeometry} geometry The intermediate geometry for display while expanding
   * @returns {Polygon} The result polygon
   */
  static #svgPathToGeometry = (svgPath: string, coordinates: SketchCoordType, geometry?: SimpleGeometry): Polygon => {
    const center = coordinates[0] as number[];
    const last = coordinates[1] as number[];
    const radius = Math.sqrt((last[0] - center[0]) ** 2 + (last[1] - center[1]) ** 2);
    const angle = Math.atan2(last[1] - center[1], last[0] - center[0]);

    // Parse the SVG path to get coordinates
    const coords = this.#svgPathToCoordinates(svgPath, [0, 0]);

    // Find the bounding box to calculate center
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    coords.forEach((point) => {
      minX = Math.min(minX, point[0]);
      minY = Math.min(minY, point[1]);
      maxX = Math.max(maxX, point[0]);
      maxY = Math.max(maxY, point[1]);
    });

    // Calculate center of the SVG path
    const svgCenterX = (minX + maxX) / 2;
    const svgCenterY = (minY + maxY) / 2;

    // Calculate the size of the SVG path
    const svgWidth = maxX - minX;
    const svgHeight = maxY - minY;
    const svgSize = Math.max(svgWidth, svgHeight);

    // Calculate scale factor to fit the shape within the radius
    const scaleFactor = (radius * 2) / svgSize;

    // Center, scale, and rotate the coordinates
    const finalCoords = coords.map((point) => {
      // Center the point
      const centeredX = point[0] - svgCenterX;
      const centeredY = point[1] - svgCenterY;

      // Scale to fit within radius
      const scaledX = centeredX * scaleFactor;
      const scaledY = centeredY * scaleFactor;

      // Rotate point
      const x = scaledX * Math.cos(angle) - scaledY * Math.sin(angle);
      const y = scaledX * Math.sin(angle) + scaledY * Math.cos(angle);

      // Translate to target center
      return [x + center[0], y + center[1]];
    });

    // Create or update geometry
    if (!geometry) {
      // eslint-disable-next-line no-param-reassign
      geometry = new Polygon([finalCoords]);
    } else {
      geometry.setCoordinates([finalCoords]);
    }

    return geometry as Polygon;
  };

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
    if (!viewer) throw new MapViewerNotFoundError(mapId);

    // Get current state values if not provided
    const currentGeomType = geomType || state.actions.getActiveGeom();
    const currentStyle = styleInput || state.actions.getStyle();
    const { hideMeasurements } = state;

    // If drawing already, stop and restart as it's likely a style change
    if (this.getDrawerState(mapId)?.drawInstance) {
      this.stopDrawing(mapId);
    }

    // Record of GeometryFunctions for creating custom geometries
    const customGeometries: Record<string, GeometryFunction> = {
      Star: (coordinates: SketchCoordType, geometry: SimpleGeometry): Polygon => {
        const svgPath =
          'm 7.61,20.13 8.22,7.04 -2.51,10.53 9.24,-5.64 9.24,5.64 L29.29,27.17 37.51,20.13 26.72,19.27 22.56,9.27 18.4,19.27 Z';
        return this.#svgPathToGeometry(svgPath, coordinates, geometry as Polygon);
      },
      Rectangle: createBox(),
    };

    // Initialize drawing interaction
    let draw: Draw;
    if (currentGeomType in customGeometries) {
      draw = viewer.initDrawInteractions(`draw-${currentGeomType}`, 'Circle', currentStyle, customGeometries[currentGeomType]);
    } else {
      draw = viewer.initDrawInteractions(`draw-${currentGeomType}`, currentGeomType, currentStyle);
    }

    // Set up draw end event handler
    draw.onDrawEnd((_sender: unknown, event: DrawEvent): void => {
      const { feature } = event;

      // Create a style based on current color settings
      let featureStyle;

      if (currentGeomType === 'Point') {
        // For points, use a circle style
        featureStyle = new Style({
          image: new OLIcon({
            src: state.actions.getIconSrc(),
            anchor: [0.5, 1], // 50% of X = Middle, 100% Y = Bottom
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
          }),
        });
      } else {
        // For other geometry types
        featureStyle = new Style({
          stroke: new Stroke({
            color: currentStyle.strokeColor,
            width: currentStyle.strokeWidth,
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

      const newOverlay = this.#createMeasureTooltip(feature, hideMeasurements, mapId);
      if (newOverlay) {
        viewer.map.addOverlay(newOverlay);
      }
    });

    // Update state
    state.actions.setDrawInstance(draw);
    if (geomType) {
      state.actions.setActiveGeom(geomType);
    }

    // If editing already, but the edit group doesn't exist, create it
    const groupKey = `draw-${geomType}`;
    if (state.actions.getIsEditing() && !(groupKey in state.actions.getEditInstances())) {
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
    state.actions.getDrawInstance()?.stopInteraction();
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
    if (!viewer) throw new MapViewerNotFoundError(mapId);

    const typesToEdit = geomTypes || state.actions.getGeomTypes();
    const { hideMeasurements } = state;

    const editInstances = state.actions.getEditInstances();

    // If editing already, stop and restart as it's likely a style change
    if (Object.keys(editInstances).length > 0) {
      Object.keys(editInstances).forEach((type) => {
        editInstances[type]?.stopInteraction();
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

          this.#createMeasureTooltip(feature, hideMeasurements, mapId);
        });

        state.actions.setEditInstance(groupKey, editInstance);
      }
    });

    // If we have an active drawing instance, make sure it stay active
    // when editing is enabled
    const drawInstance = state.actions.getDrawInstance();
    if (drawInstance) {
      drawInstance.startInteraction();
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
    if (!viewer) throw new MapViewerNotFoundError(mapId);

    const typesToEdit = geomTypes || state.actions.getGeomTypes();

    // Edit geometries for each type
    typesToEdit.forEach((type) => {
      const groupKey = `draw-${type}`;
      const editInstances = state.actions.getEditInstances();

      if (editInstances === undefined || !(groupKey in editInstances) || editInstances[groupKey] === undefined) return;
      editInstances[groupKey].stopInteraction();
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
    if (!viewer) throw new MapViewerNotFoundError(mapId);

    const typesToClear = geomTypes || state.actions.getGeomTypes();

    // Get all geometries for each type
    const groupedFeatures = this.#getGroupedDrawingFeatures(mapId, typesToClear);

    // Iterate over each feature group
    Object.keys(groupedFeatures).forEach((groupKey) => {
      // Remove all overlays
      groupedFeatures[groupKey].forEach((feature) => {
        const measureTooltip = feature.get('measureTooltip');
        measureTooltip?.getElement()?.remove();
      });
      // Delete all geometries from the group
      viewer.layer.geometry.deleteGeometriesFromGroup(groupKey);
    });
  }

  /**
   * Refreshes the interaction instances
   * @param mapId The map ID
   */
  public static refreshInteractionInstances(mapId: string): void {
    const state = this.getDrawerState(mapId);
    if (!state) return;

    // If drawing, restart drawing to set the style
    if (state.actions.getIsDrawing()) {
      this.startDrawing(mapId);
    }

    // If editing, restart editing
    // Do this after the start drawing so the group is created if missing
    if (state.actions.getIsEditing()) {
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
    if (!viewer) throw new MapViewerNotFoundError(mapId);

    const { hideMeasurements } = state;

    // Get all overlays
    const groupedFeatures = this.#getGroupedDrawingFeatures(mapId);
    const measureOverlays = Object.keys(groupedFeatures).reduce((acc: Overlay[], cur) => {
      return [...acc, ...groupedFeatures[cur].map((feature) => feature.get('measureTooltip'))];
    }, []);

    // Toggle the visibility of the measure tooltips
    measureOverlays.forEach((overlay) => {
      if (!overlay) return;
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
