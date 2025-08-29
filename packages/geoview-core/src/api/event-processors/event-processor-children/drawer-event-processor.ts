import { Feature, Overlay } from 'ol';
import { Projection as OLProjection } from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';
import { LineString, Polygon, Point, Circle as CircleGeom, Geometry, SimpleGeometry } from 'ol/geom';
import { fromCircle } from 'ol/geom/Polygon';
import { getArea, getLength } from 'ol/sphere';
import { Text, Style, Stroke, Fill, Icon as OLIcon } from 'ol/style';
import { StyleLike } from 'ol/style/Style';
import { DrawEvent, GeometryFunction, SketchCoordType, createBox } from 'ol/interaction/Draw';

import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { IDrawerState, StyleProps } from '@/core/stores/store-interface-and-intial-values/drawer-state';
import { Draw } from '@/geo/interaction/draw';
import { AppEventProcessor } from './app-event-processor';
import { MapEventProcessor } from './map-event-processor';

import { doUntil, generateId } from '@/core/utils/utilities';
import { DEFAULT_PROJECTION } from '@/core/stores/store-interface-and-intial-values/map-state';
import { GeoviewStoreType } from '@/core/stores/geoview-store';
import { Projection } from '@/geo/utils/projection';
import { TransformDeleteFeatureEvent, TransformEvent, TransformSelectionEvent } from '@/geo/interaction/transform/transform-events';
import { MapProjectionChangedEvent, MapViewer } from '@/geo/map/map-viewer';
import { logger } from '@/core/utils/logger';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with UIEventProcessor vs UIState

export const DRAW_GROUP_KEY = 'draw-group';

interface DrawerHistoryAction {
  type: 'add' | 'delete' | 'modify' | 'clear';
  features: Feature[];
  originalGeometries?: Geometry[];
  modifiedGeometries?: Geometry[];
  originalStyles?: (StyleLike | undefined)[];
  modifiedStyles?: (StyleLike | undefined)[];
}

interface TypeGeoJSONStyleProps {
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
  iconSrc?: string;
  iconSize?: number;
  text?: string;
  textSize?: number;
  textFont?: string;
  textColor?: string;
  textHaloColor?: string;
  textHaloWidth?: number;
  textBold?: boolean;
  textItalic?: boolean;
  textRotation?: number;
}

const DEFAULT_ICON_SOURCE =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgMkM4LjEzIDIgNSA1LjEzIDUgOWMwIDUuMjUgNyAxMyA3IDEzczctNy43NSA3LTEzYzAtMy44Ny0zLjEzLTctNy03bTAgOS41Yy0xLjM4IDAtMi41LTEuMTItMi41LTIuNXMxLjEyLTIuNSAyLjUtMi41IDIuNSAxLjEyIDIuNSAyLjUtMS4xMiAyLjUtMi41IDIuNSIgZmlsbD0icmdiYSgyNTIsIDI0MSwgMCwgMC4zKSIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjEuMyIvPjwvc3ZnPg==';

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
   * @param {string} mapId - The mapId
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
   * @param {GeoviewStoreType} store - The store to initialize with
   * @returns {Array<() => void>} Array of unsubscribe functions
   */
  override onInitialize(store: GeoviewStoreType): Array<() => void> {
    const { mapId, mapConfig } = store.getState();

    // Set up keyboard handler
    DrawerEventProcessor.#setupKeyboardHandler(mapId);

    // Set up map projection change handler
    DrawerEventProcessor.#setupReprojectDrawingsHandler(mapId);

    // Set initial projection value for the mapId
    const initialProjection = mapConfig?.map.viewSettings.projection || DEFAULT_PROJECTION;
    DrawerEventProcessor.#currentProjections.set(mapId, Projection.PROJECTIONS[initialProjection]);

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

  /** History stack for undo/redo functionality */
  static #drawerHistory: Map<string, DrawerHistoryAction[]> = new Map();

  /** Track features that were selected and their original geometries */
  static #selectedFeatureState: Map<
    string,
    {
      feature: Feature;
      originalGeometry: Geometry;
      originalStyle?: StyleLike | undefined;
      originalStyleStored?: boolean;
    }
  > = new Map();

  /** Current position in history stack for each map */
  static #historyIndex: Map<string, number> = new Map();

  /** Maximum history size */
  static #maxHistorySize = 50;

  /** Keyboard event handlers for each map */
  static #keyboardHandlers: Map<string, (event: KeyboardEvent) => void> = new Map();

  /** Current Projection per mapId */
  static #currentProjections: Map<string, OLProjection> = new Map();

  // #region Helpers

  static #setupReprojectDrawingsHandler(mapId: string): void {
    const handler = (sender: MapViewer, event: MapProjectionChangedEvent): void => {
      const features = this.#getDrawingFeatures(mapId);
      const currentProjection = this.#currentProjections.get(mapId);

      features.forEach((feature) => {
        const geometry = feature.getGeometry();
        if (geometry && currentProjection) {
          geometry.transform(currentProjection.getCode(), event.projection.getCode());
        }
      });

      this.#currentProjections.set(mapId, event.projection);
    };

    // Subscribe to projection change event
    doUntil(() => {
      try {
        MapEventProcessor.getMapViewer(mapId).onMapProjectionChanged(handler);
        return true;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error: unknown) {
        return false;
      }
    }, 3000);
  }

  /**
   * Gets all drawing features for a map
   * @param {string} mapId - The map ID
   * @returns {Feature[]} Array of features
   */
  static #getDrawingFeatures(mapId: string): Feature[] {
    const state = this.getDrawerState(mapId);
    if (!state) return [];

    // Get the map viewer instance
    const viewer = MapEventProcessor.getMapViewer(mapId);

    // Get features from drawing group
    const geometryGroup = viewer.layer.geometry.geometryGroups.find((group) => group.geometryGroupId === DRAW_GROUP_KEY);
    const features = geometryGroup?.vectorSource.getFeatures();
    if (!features) {
      return [];
    }
    return features;
  }

  /**
   * Gets a feature by it's id
   * @param {string} mapId - The map ID
   * @param {string} featureId - Feature ID we are looking for
   * @returns {Feature | undefined} The found feature
   */
  static #getFeatureById(mapId: string, featureId: string): Feature | undefined {
    const allDrawingFeatures = this.#getDrawingFeatures(mapId);

    const foundFeature = allDrawingFeatures.find((feature) => feature.getId() === featureId);

    return foundFeature;
  }

  /**
   * Updates all measurement tooltips for a map with the current language
   * @param {string} mapId - The map ID
   */
  static #updateMeasurementTooltips(mapId: string): void {
    const displayLanguage = AppEventProcessor.getDisplayLanguage(mapId);
    const features = this.#getDrawingFeatures(mapId);

    features.forEach((feature) => {
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
   * @param {number} value - The value to format
   * @param {string} displayLanguage - The display language ('en' or 'fr')
   * @returns {string} The formatted value
   */
  static #formatValue(value: number, displayLanguage: string): string {
    return displayLanguage === 'fr'
      ? value.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /**
   * Takes a length and converts it to a string to be used in the overlays
   * @param {number} length - The length to be converted
   * @param {string} displayLanguage - The display language
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
   * @param {number} area - The area to be converted
   * @param {string} displayLanguage - The display language
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
   * @param {Geometry} geom - The geometry to measure
   * @param {string} displayLanguage - The display language
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
   * @param {Feature<Geometry>} feature - The feature to create a tooltip for
   * @param {boolean} hideMeasurements - Whether to hide the measurement tooltip
   * @param {string} mapId - The map ID
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
   * @param {string} pathData - SVG path string
   * @param {number[]} center - Center coordinates
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
   * @param {string} svgPath - SVG path string
   * @param {SketchCoordType} coordinates - Circle coordinate (center and out edge)
   * @param {SimpleGeometry} geometry - The intermediate geometry for display while expanding
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
   * Sets up a feature with ID, geometry group, and type-specific properties
   * @param {Feature} feature - The feature to set up
   * @param {string} geomType - The geometry type
   * @param {StyleProps} style - The style properties
   * @param {string} iconSrc - The icon source for point features
   * @param {string} featureId - Optional feature ID (generates one if not provided)
   */
  static #setFeatureProperties(feature: Feature, geomType: string, style: StyleProps, iconSrc?: string, featureId?: string): void {
    // Set up basic feature properties
    if (feature.get('featureId') === undefined) {
      const id = featureId || generateId();
      feature.setId(id);
      feature.set('featureId', id);
      feature.set('geometryGroup', DRAW_GROUP_KEY);
    }

    // Set type-specific properties
    if (geomType === 'Point' && iconSrc) {
      feature.set('iconSrc', iconSrc);
      feature.set('iconSize', style.iconSize);
    } else if (geomType === 'Text') {
      feature.set('text', style.text);
      feature.set('textSize', style.textSize);
      feature.set('textFont', style.textFont);
      feature.set('textColor', style.textColor);
      feature.set('textHaloColor', style.textHaloColor);
      feature.set('textHaloWidth', style.textHaloWidth);
      feature.set('textBold', style.textBold);
      feature.set('textItalic', style.textItalic);
      feature.set('textRotation', style.textRotation);
    }
  }

  /**
   * Extracts style properties from a feature
   * @param {Feature} feature - The feature to extract properties from
   * @param {StyleProps} currentStyle - The current style properties to update
   * @returns {StyleProps} The extracted style properties
   */
  static #getFeatureProperties(feature: Feature, currentStyle: StyleProps): StyleProps {
    const style: StyleProps = currentStyle;

    // Extract text properties if they exist
    if (feature.get('text') !== undefined) {
      style.text = feature.get('text');
      style.textSize = feature.get('textSize');
      style.textFont = feature.get('textFont');
      style.textColor = feature.get('textColor');
      style.textHaloColor = feature.get('textHaloColor');
      style.textHaloWidth = feature.get('textHaloWidth');
      style.textBold = feature.get('textBold');
      style.textItalic = feature.get('textItalic');
      style.textRotation = feature.get('textRotation');
    }

    // Extract stroke/fill properties from the feature's style
    const featureStyle = feature.getStyle();
    if (featureStyle instanceof Style) {
      const stroke = featureStyle.getStroke();
      const fill = featureStyle.getFill();

      if (stroke) {
        style.strokeColor = stroke.getColor() as string;
        style.strokeWidth = stroke.getWidth() || 1.3;
      }

      if (fill) {
        style.fillColor = fill.getColor() as string;
      }
    }

    return style;
  }

  // #endregion

  // #region Drawing Actions

  /**
   * Starts a drawing operation with the specified geometry type
   * @param {string} mapId - The map ID
   * @param {string} geomType - The geometry type to draw (optional, uses current state if not provided)
   * @param {StyleProps} styleInput - Optional style properties to use
   */
  public static startDrawing(mapId: string, geomType?: string, styleInput?: StyleProps): void {
    const state = this.getDrawerState(mapId);
    if (!state) return;

    // Get the map viewer instance and stop map pointer events if not already stopped
    const viewer = MapEventProcessor.getMapViewer(mapId);
    if (!state.actions.getIsEditing()) {
      viewer.unregisterMapPointerHandlers(viewer.map);
    }

    // If editing already, stop it
    // GV Moved the stop editing up so the rotation is set properly for any active text drawing
    if (state.actions.getIsEditing()) {
      this.stopEditing(mapId);
    }

    // Get current state values if not provided
    const currentGeomType = geomType || state.actions.getActiveGeom();
    const currentStyle = styleInput || state.actions.getStyle();

    // Make new text horizontal, regardless of what the state rotation was
    // GV If a style input is added for the rotation, then this can be removed
    currentStyle.textRotation = 0;

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
    if (currentGeomType === 'Text') {
      draw = viewer.initDrawInteractions(DRAW_GROUP_KEY, 'Point', currentStyle);
    } else if (currentGeomType in customGeometries) {
      draw = viewer.initDrawInteractions(DRAW_GROUP_KEY, 'Circle', currentStyle, customGeometries[currentGeomType]);
    } else {
      draw = viewer.initDrawInteractions(DRAW_GROUP_KEY, currentGeomType, currentStyle);
    }

    // Set up draw end event handler
    draw.onDrawEnd(this.#handleDrawEnd(mapId));

    // Update state
    state.actions.setDrawInstance(draw);
    if (geomType) {
      state.actions.setActiveGeom(geomType);
    }

    if (state.actions.getIsSnapping()) {
      this.refreshSnappingInstance(mapId);
    }
  }

  /**
   * The handler for Draw End events
   * @param {string} mapId - The map ID
   */
  static #handleDrawEnd(mapId: string) {
    return (_sender: unknown, event: DrawEvent): void => {
      const state = this.getDrawerState(mapId);
      if (!state) return;

      const currentGeomType = state.actions.getActiveGeom();
      const currentStyle = state.actions.getStyle();

      const viewer = MapEventProcessor.getMapViewer(mapId);
      const { feature } = event;

      const geom = feature.getGeometry();
      if (!geom) return;

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
            scale: (currentStyle.iconSize || 24) / 24,
          }),
        });
      } else if (currentGeomType === 'Text') {
        featureStyle = new Style({
          text: new Text({
            text: currentStyle.text,
            fill: new Fill({ color: currentStyle.textColor }),
            stroke: new Stroke({ color: currentStyle.textHaloColor, width: currentStyle.textHaloWidth }),
            font: `${currentStyle.textItalic ? 'italic ' : ''}${currentStyle.textBold ? 'bold ' : ''}${currentStyle.textSize}px ${currentStyle.textFont}`,
            rotation: 0,
          }),
        });
      } else {
        // Convert Circle to a Polygon because geojson can't handle circles (for download / upload)
        if (currentGeomType === 'Circle') {
          // Default sides is 32, doubling makes it smoother
          feature.setGeometry(fromCircle(geom as CircleGeom, 64));
        }

        // Set the styles for lines / polygons
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

      // Set the feature properties for proper download / upload
      this.#setFeatureProperties(feature, currentGeomType, currentStyle, state.actions.getIconSrc());

      // Add overlays to non-point features
      if (!(geom instanceof Point)) {
        // GV hideMeasurements has to be here, otherwise the value can be stale, unlike style and geomType which restart the interaction
        const hideMeasurements = state.actions.getHideMeasurements();
        const newOverlay = this.#createMeasureTooltip(feature, hideMeasurements, mapId);
        if (newOverlay) {
          viewer.map.addOverlay(newOverlay);
        }
      }

      viewer.layer.geometry.geometries.push(feature);
      viewer.layer.geometry.addToGeometryGroup(feature, DRAW_GROUP_KEY);

      this.#saveToHistory(mapId, {
        type: 'add',
        features: [feature.clone()],
      });
    };
  }

  /**
   * Stops the current drawing operation
   * @param {string} mapId - The map ID
   */
  public static stopDrawing(mapId: string): void {
    const state = this.getDrawerState(mapId);
    if (!state) return;

    if (!state.actions.getIsEditing()) {
      const viewer = MapEventProcessor.getMapViewer(mapId);
      viewer.registerMapPointerHandlers(viewer.map);
    }

    // Update state
    state.actions.getDrawInstance()?.stopInteraction();
    state.actions.removeDrawInstance();
  }

  /**
   * Toggles the drawing state
   * @param {string} mapId - The map ID
   */
  public static toggleDrawing(mapId: string): void {
    const state = this.getDrawerState(mapId);
    if (!state) return;

    if (state.actions.getIsDrawing()) {
      this.stopDrawing(mapId);
    } else {
      this.startDrawing(mapId);
    }

    this.#updateUndoRedoState(mapId);
  }

  /**
   * Initiates editing interactions
   * @param {string} mapId - The map ID
   */
  public static startEditing(mapId: string): void {
    const state = this.getDrawerState(mapId);
    if (!state) return;

    // Get the map viewer instance and stop map pointer events
    const viewer = MapEventProcessor.getMapViewer(mapId);
    if (!state.actions.getIsDrawing()) {
      viewer.unregisterMapPointerHandlers(viewer.map);
    }

    const oldTransformInstance = state.actions.getTransformInstance();

    // If editing already, stop and restart as it's likely a style change
    if (oldTransformInstance) {
      oldTransformInstance.stopInteraction();
      state.actions.removeTransformInstance();
    }

    // Only start editing if the drawing group exists
    if (viewer.layer.geometry.geometryGroups.find((group) => group.geometryGroupId === DRAW_GROUP_KEY) !== undefined) {
      const transformInstance = viewer.initTransformInteractions({ geometryGroupKey: DRAW_GROUP_KEY });

      // Handle Transform Events (A feature was edited, the feature is still being edited)
      transformInstance.onTransformEnd(this.#handleTransformEnd(mapId));

      // Handle Delete Events
      transformInstance.onDeleteFeature(this.#handleTransformDeleteFeature(mapId));

      // Handle Selection Events (new selection, removed selection, or both)
      transformInstance.onSelectionChange(this.#handleTransformSelectionChange(mapId));

      state.actions.setTransformInstance(transformInstance);
    } else {
      this.startDrawing(mapId);
      return;
    }

    // If we have an active drawing instance, stop it
    const drawInstance = state.actions.getDrawInstance();
    if (drawInstance) {
      this.stopDrawing(mapId);
    }

    if (state.actions.getIsSnapping()) {
      this.refreshSnappingInstance(mapId);
    }
  }

  /**
   * Handler for Transform End events
   * The current transform action has ended and the new geometry and style are applied to the feature
   * @param {string} mapId - The map ID
   */
  static #handleTransformEnd(mapId: string) {
    return (_sender: unknown, event: TransformEvent): void => {
      const { feature } = event;
      if (!feature) return;

      const isTextFeature = feature.get('text') !== undefined;
      // Update Text Styles
      if (isTextFeature) {
        const textValue = feature.get('text');
        const finalSize = feature.get('textSize') as number;
        const isBold = feature.get('textBold') as boolean;
        const isItalic = feature.get('textItalic') as boolean;
        const rotation = feature.get('textRotation') as number;

        const state = this.getDrawerState(mapId);
        if (!state) return;
        state.actions.setTextValue(textValue);
        state.actions.setTextSize(finalSize);
        state.actions.setTextBold(isBold);
        state.actions.setTextItalic(isItalic);
        state.actions.setTextRotation(rotation);
      }

      const geom = feature.getGeometry();
      if (!geom) return;
      if (geom instanceof Point) return;

      // Update the overlay with new values
      this.#createMeasureTooltip(feature, true, mapId);

      // Update the undo redo state
      this.#updateUndoRedoState(mapId);
    };
  }

  /**
   * Handler of transform delete feature events
   * @param {string} mapId - The map ID
   */
  static #handleTransformDeleteFeature(mapId: string) {
    return (_sender: unknown, event: TransformDeleteFeatureEvent) => {
      const { feature } = event;

      // Save the delete state
      this.#saveToHistory(mapId, {
        type: 'delete',
        features: [feature.clone()],
      });

      const featureId = feature.getId();
      if (featureId) {
        this.deleteSingleDrawing(mapId, featureId as string);
      }

      this.getDrawerState(mapId)?.actions.setSelectedDrawing(undefined);
      this.#updateUndoRedoState(mapId);
    };
  }

  /**
   * The handler for transform selection change events
   * @param {string} mapId - The map Id
   */
  static #handleTransformSelectionChange(mapId: string) {
    return (_sender: unknown, event: TransformSelectionEvent) => {
      // GV Get hideMeasurements here so the value is not stale
      const hideMeasurements = this.getDrawerState(mapId)?.hideMeasurements;
      const { previousFeature, newFeature } = event;

      // If we had a previous feature selected, check if it was modified
      if (previousFeature) {
        const stateKey = `${mapId}-${previousFeature.getId()}`;
        const savedState = this.#selectedFeatureState.get(stateKey);

        if (savedState) {
          const currentGeometry = previousFeature.getGeometry();

          // Check for changes
          const geometryChanged = currentGeometry && savedState.originalGeometry.getRevision() !== currentGeometry.getRevision();
          const styleChanged =
            savedState.originalStyleStored && savedState.originalStyle && savedState.originalStyle !== previousFeature.getStyle();

          if (geometryChanged || styleChanged) {
            // Save modify action - include geometry and style only if it was changed
            this.#saveToHistory(mapId, {
              type: 'modify',
              features: [previousFeature],
              ...(geometryChanged && {
                originalGeometries: [savedState.originalGeometry.clone()],
                modifiedGeometries: [currentGeometry.clone()],
              }),
              ...(styleChanged && {
                originalStyles: [savedState.originalStyle],
                modifiedStyles: [previousFeature.getStyle()],
              }),
            });
          }
        }
      }

      // If we have a new feature selected, save its current state
      if (newFeature) {
        const stateKey = `${mapId}-${newFeature.getId()}`;
        const currentGeometry = newFeature.getGeometry();

        if (currentGeometry) {
          this.#selectedFeatureState.set(stateKey, {
            feature: newFeature,
            originalGeometry: currentGeometry.clone(),
            originalStyleStored: false,
          });
        }
      }

      // Only show the tooltip again if not hiding measurements
      if (previousFeature && !hideMeasurements) {
        const prevTooltip = previousFeature.get('measureTooltip');
        if (prevTooltip) {
          prevTooltip.getElement().hidden = false;
        }
      }

      if (newFeature) {
        const newTooltip = newFeature.get('measureTooltip');
        if (newTooltip) {
          newTooltip.getElement().hidden = true;
        }
        const state = this.getDrawerState(mapId);
        if (!state) return;

        const featureProperties = this.#getFeatureProperties(newFeature, state.actions.getStyle());
        state.actions.updateStateStyle(featureProperties);
      }

      this.getDrawerState(mapId)?.actions.setSelectedDrawing(newFeature);

      // Update the undo redo state
      this.#updateUndoRedoState(mapId);
    };
  }

  /**
   * Stops the editing interaction for all groups
   * @param {string} mapId - The map ID
   */
  public static stopEditing(mapId: string): void {
    const state = this.getDrawerState(mapId);
    if (!state) return;

    if (!state.actions.getIsDrawing()) {
      const viewer = MapEventProcessor.getMapViewer(mapId);
      viewer.registerMapPointerHandlers(viewer.map);
    }

    const transformInstance = state.actions.getTransformInstance();

    if (transformInstance === undefined) return;
    transformInstance.stopInteraction();
    state.actions.removeTransformInstance();
  }

  /**
   * Function to toggle editing state
   * @param {string} mapId - The map ID
   */
  public static toggleEditing(mapId: string): void {
    const state = this.getDrawerState(mapId);
    if (!state) return;

    const isEditing = state.actions.getIsEditing();
    if (isEditing) {
      this.stopEditing(mapId);
    } else {
      this.startEditing(mapId);
    }

    this.#updateUndoRedoState(mapId);
  }

  /**
   * Starts snapping interactions
   * @param {string} mapId - The map ID
   */
  public static startSnapping(mapId: string): void {
    const state = this.getDrawerState(mapId);
    if (!state) return;

    const viewer = MapEventProcessor.getMapViewer(mapId);
    const snapInstance = viewer.initSnapInteractions(DRAW_GROUP_KEY);
    snapInstance.startInteraction();

    state.actions.setSnapInstance(snapInstance);
  }

  /**
   * Stops snapping interactions
   * @param mapId - The map ID
   */
  public static stopSnapping(mapId: string): void {
    const state = this.getDrawerState(mapId);
    if (!state) return;

    const snapInstance = state.actions.getSnapInstance();
    snapInstance?.stopInteraction();

    state.actions.removeSnapInstance();
  }

  /**
   * Toggles snapping state
   * @param {string} mapId - The map ID
   */
  public static toggleSnapping(mapId: string): void {
    const state = this.getDrawerState(mapId);
    if (!state) return;

    const isSnapping = state.actions.getIsSnapping();
    if (isSnapping) {
      this.stopSnapping(mapId);
    } else {
      this.startSnapping(mapId);
    }
  }

  /**
   * Updates the style of any currently transforming features
   * @param {string} mapId - The map ID
   * @param {StyleProps} newStyle - The new style to apply
   */
  public static updateTransformingFeatureStyle(mapId: string, newStyle: StyleProps): void {
    const state = this.getDrawerState(mapId);
    if (!state) return;

    const transformInstance = state.actions.getTransformInstance();
    if (!transformInstance) return;

    const selectedFeature = transformInstance.getSelectedFeature();
    if (!selectedFeature) return;

    // Get the current state for this feature
    const stateKey = `${mapId}-${selectedFeature.getId()}`;
    const savedState = this.#selectedFeatureState.get(stateKey);

    // Store original style if not already stored
    if (savedState) {
      if (!savedState.originalStyleStored) {
        savedState.originalStyle = selectedFeature.getStyle();
        savedState.originalStyleStored = true;
      }

      // Apply the new style
      let featureStyle;
      let geomType: string;
      const isTextFeature = selectedFeature.get('text') !== undefined;

      if (selectedFeature.getGeometry() instanceof Point && !isTextFeature) {
        geomType = 'Point';
        featureStyle = new Style({
          image: new OLIcon({
            src: state.actions.getIconSrc(),
            anchor: [0.5, 1],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            scale: (newStyle.iconSize || 24) / 24,
          }),
        });
      } else if (isTextFeature) {
        geomType = 'Text';
        featureStyle = new Style({
          text: new Text({
            text: newStyle.text,
            fill: new Fill({ color: newStyle.textColor }),
            stroke: new Stroke({ color: newStyle.textHaloColor, width: newStyle.textHaloWidth }),
            font: `${newStyle.textItalic ? 'italic ' : ''}${newStyle.textBold ? 'bold ' : ''}${newStyle.textSize}px ${newStyle.textFont}`,
            rotation: newStyle.textRotation,
          }),
        });
      } else {
        geomType = 'Other'; // Just something to differentiate from Point & Text. It will be skipped
        featureStyle = new Style({
          stroke: new Stroke({
            color: newStyle.strokeColor,
            width: newStyle.strokeWidth,
          }),
          fill: new Fill({
            color: newStyle.fillColor,
          }),
        });
      }

      // Set the new feature properties and style
      this.#setFeatureProperties(selectedFeature, geomType, newStyle, state.actions.getIconSrc());
      selectedFeature.setStyle(featureStyle);
    }
  }

  /**
   * Delete a single drawing feature from the map
   * @param {string} mapId - The map ID
   * @param {string} featureId - The ID of the feature to be deleted
   */
  public static deleteSingleDrawing(mapId: string, featureId: string): void {
    const feature = this.#getFeatureById(mapId, featureId);
    if (!feature) return;

    const viewer = MapEventProcessor.getMapViewer(mapId);

    const measureTooltip = feature.get('measureTooltip');
    measureTooltip?.getElement()?.remove();

    const geometryGroup = feature.get('geometryGroup');
    viewer.layer.geometry.deleteGeometryFromGroup(featureId, geometryGroup);
  }

  /**
   * Clears all drawings from the map
   * @param {string} mapId - The map ID
   */
  public static clearDrawings(mapId: string, saveHistory: boolean = true): void {
    const state = this.getDrawerState(mapId);
    if (!state) return;

    // Get the map viewer instance
    const viewer = MapEventProcessor.getMapViewer(mapId);

    // Get all geometries for each type
    const features = this.#getDrawingFeatures(mapId);

    // Set the history, only if this isn't from a redo
    if (saveHistory && features.length > 0) {
      this.#saveToHistory(mapId, {
        type: 'clear',
        features: features.map((ftr) => ftr.clone()),
      });
    }

    // Remove all tooltips
    features.forEach((feature) => {
      const measureTooltip = feature.get('measureTooltip');
      measureTooltip?.getElement()?.remove();
    });

    // Delete all geometries from the group
    viewer.layer.geometry.deleteGeometriesFromGroup(DRAW_GROUP_KEY);

    if (state.actions.getIsEditing()) {
      this.stopEditing(mapId);
    }
  }

  /**
   * Refreshes the interaction instances
   * @param {string} mapId - The map ID
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

  public static refreshSnappingInstance(mapId: string): void {
    const state = this.getDrawerState(mapId);
    if (!state) return;

    if (state.actions.getIsSnapping()) {
      this.stopSnapping(mapId);
      this.startSnapping(mapId);
    }
  }

  /**
   * Toggles the measurement overlays on the map
   * @param {string} mapId - The map ID
   */
  public static toggleHideMeasurements(mapId: string): void {
    const state = this.getDrawerState(mapId);
    if (!state) return;

    const hideMeasurements = state.actions.getHideMeasurements();
    const selectedDrawingId = state.actions.getSelectedDrawing()?.getId();

    // Get all overlays, ignoring currently selected features
    const features = this.#getDrawingFeatures(mapId);
    const measureOverlays = features
      .filter((feature) => feature.getId() !== selectedDrawingId)
      .map((feature) => feature.get('measureTooltip'));

    // Toggle the visibility of the measure tooltips
    measureOverlays.forEach((overlay) => {
      if (!overlay) return;
      const elem = overlay.getElement();
      if (elem) elem.hidden = !hideMeasurements;
    });
    state.actions.setHideMeasurements(!hideMeasurements);
  }

  // #endregion

  // #region Download / Upload

  /**
   * Downloads drawings as GeoJSON with embedded styles
   * @param {string} mapId - The map ID
   */
  static downloadDrawings(mapId: string): void {
    const features = this.#getDrawingFeatures(mapId);
    if (features.length === 0) return;

    // Get current map projection
    const mapProjection = Projection.PROJECTIONS[MapEventProcessor.getMapState(mapId).currentProjection];

    // Convert to GeoJSON with style properties
    const geojson = {
      type: 'FeatureCollection',
      features: features
        .map((feature) => {
          const olStyle = feature.getStyle() as Style;
          const geometry = feature.getGeometry();

          // Extract style properties
          let styleProps: TypeGeoJSONStyleProps = {};
          if (olStyle && geometry) {
            if (geometry instanceof Point) {
              const isTextFeature = feature.get('text') !== undefined;
              if (isTextFeature) {
                styleProps = {
                  text: feature.get('text'),
                  textSize: feature.get('textSize'),
                  textFont: feature.get('textFont'),
                  textColor: feature.get('textColor'),
                  textHaloColor: feature.get('textHaloColor'),
                  textHaloWidth: feature.get('textHaloWidth'),
                  textBold: feature.get('textBold'),
                  textItalic: feature.get('textItalic'),
                  textRotation: feature.get('textRotation'),
                };
              } else {
                // point style icon
                styleProps.iconSrc = feature.get('iconSrc');
                styleProps.iconSize = feature.get('iconSize');
              }
            } else {
              // Handle polygon/line styles
              const stroke = olStyle.getStroke?.();
              const fill = olStyle.getFill?.();
              styleProps = {
                strokeColor: stroke?.getColor() as string,
                strokeWidth: stroke?.getWidth() as number,
                fillColor: fill?.getColor() as string,
              };
            }
          }

          if (!geometry) return undefined;

          // Clone geometry and transform to WGS84
          const clonedGeometry = geometry.clone();
          clonedGeometry.transform(mapProjection, 'EPSG:4326');

          return {
            type: 'Feature',
            geometry: new GeoJSON().writeGeometryObject(clonedGeometry),
            properties: {
              id: feature.getId(),
              geometryGroup: feature.get('geometryGroup'),
              style: styleProps,
            },
          };
        })
        .filter((ftr) => ftr !== undefined),
    };

    // Download file
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'drawings.geojson';
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Uploads and loads drawings from GeoJSON file
   * @param {string} mapId - The map ID
   * @param {File} file - The GeoJSON file
   */
  static uploadDrawings(mapId: string, file: File): void {
    const state = this.getDrawerState(mapId);
    if (!state) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const geojson = JSON.parse(e.target?.result as string);
        const viewer = MapEventProcessor.getMapViewer(mapId);

        // Get current map projection
        const mapProjection = Projection.PROJECTIONS[MapEventProcessor.getMapState(mapId).currentProjection];

        const newFeatures: Feature[] = [];
        geojson.features.forEach((geoFeature: GeoJsonFeature) => {
          const olGeometry = new GeoJSON().readGeometry(geoFeature.geometry);
          olGeometry.transform('EPSG:4326', mapProjection);

          const feature = new Feature({ geometry: olGeometry });

          // Apply style from properties
          const styleProps = (geoFeature.properties.style as unknown as TypeGeoJSONStyleProps) || undefined;
          const iconSrc = styleProps?.iconSrc || DEFAULT_ICON_SOURCE;
          let featureStyle;
          if (olGeometry instanceof Point) {
            if (styleProps?.text !== undefined) {
              // Handle text styling
              featureStyle = new Style({
                text: new Text({
                  text: styleProps.text,
                  fill: new Fill({ color: styleProps.textColor }),
                  stroke: new Stroke({
                    color: styleProps.textHaloColor,
                    width: styleProps.textHaloWidth,
                  }),
                  font: `${styleProps.textItalic ? 'italic ' : ''}${styleProps.textBold ? 'bold ' : ''}${styleProps.textSize}px ${styleProps.textFont}`,
                  rotation: styleProps.textRotation,
                }),
              });
            } else {
              // Handle points with icons
              featureStyle = new Style({
                image: new OLIcon({
                  src: iconSrc,
                  anchor: [0.5, 1],
                  anchorXUnits: 'fraction',
                  anchorYUnits: 'fraction',
                  scale: (styleProps.iconSize || 24) / 24,
                }),
              });
            }
          } else {
            // handle lines / polygons
            featureStyle = new Style({
              stroke: new Stroke({
                color: styleProps?.strokeColor,
                width: styleProps?.strokeWidth,
              }),
              fill: new Fill({
                color: styleProps?.fillColor,
              }),
            });
          }

          // Set feature properties
          const featureId = geoFeature.properties.id || generateId();
          feature.setStyle(featureStyle);

          if (styleProps?.text !== undefined) {
            this.#setFeatureProperties(feature, 'Text', styleProps as StyleProps, undefined, featureId);
          } else {
            this.#setFeatureProperties(feature, 'Point', {} as StyleProps, iconSrc, featureId);
          }

          // Add overlays to non-point features
          if (!(olGeometry instanceof Point)) {
            // GV hideMeasurements has to be here, otherwise the value can be stale, unlike style and geomType which restart the interaction
            const hideMeasurements = state.actions.getHideMeasurements();
            const newOverlay = this.#createMeasureTooltip(feature, hideMeasurements, mapId);
            if (newOverlay) {
              viewer.map.addOverlay(newOverlay);
            }
          }

          // Add to map
          viewer.layer.geometry.geometries.push(feature);
          viewer.layer.geometry.addToGeometryGroup(feature, DRAW_GROUP_KEY);

          newFeatures.push(feature);
        });

        // Save action history
        this.#saveToHistory(mapId, {
          type: 'add',
          features: newFeatures.map((ftr) => ftr.clone()),
        });
      } catch (error) {
        logger.logError('Error loading GeoJSON:', error);
      }
    };
    if (file.name.toLowerCase().endsWith('.geojson')) {
      reader.readAsText(file);
    }
  }

  // #endregion

  // #region History

  /**
   * Saves an action to the drawer history.
   * @param {string} mapId - The map ID
   * @param {DrawerHistoryAction} action - The action to save
   */
  static #saveToHistory(mapId: string, action: DrawerHistoryAction): void {
    if (!this.#drawerHistory.has(mapId)) {
      this.#drawerHistory.set(mapId, []);
      this.#historyIndex.set(mapId, -1);
    }

    const history = this.#drawerHistory.get(mapId)!;
    const currentIndex = this.#historyIndex.get(mapId)!;

    // Remove any history after current index
    history.splice(currentIndex + 1);

    // Add new action
    history.push(action);
    this.#historyIndex.set(mapId, history.length - 1);

    // Update undo/redo state
    this.#updateUndoRedoState(mapId);

    // Limit history size
    if (history.length > this.#maxHistorySize) {
      history.shift();
      this.#historyIndex.set(mapId, this.#historyIndex.get(mapId)! - 1);
    }
  }

  /**
   * Sets up keyboard event handling for undo/redo.
   * @param {string} mapId - The map ID
   */
  static #setupKeyboardHandler(mapId: string): void {
    if (this.#keyboardHandlers.has(mapId)) return;

    const handler = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'z':
            if (event.shiftKey) {
              if (this.redo(mapId)) event.preventDefault();
            } else if (this.undo(mapId)) {
              event.preventDefault();
            }
            break;
          case 'y':
            if (this.redo(mapId)) event.preventDefault();
            break;
          default:
            break;
        }
      }
    };

    this.#keyboardHandlers.set(mapId, handler);
    document.addEventListener('keydown', handler);
  }

  /**
   * Undoes the last drawer action.
   * @param {string} mapId - The map ID
   * @returns {boolean} If the action was successful
   */
  static undo(mapId: string): boolean {
    const state = this.getDrawerState(mapId);
    if (!state) return false;

    // If editing, undo the transform instance and not the drawer-event-processor
    const transformInstance = state.actions.getTransformInstance();
    if (transformInstance && transformInstance.getSelectedFeature()) {
      return transformInstance.undo(() => {
        this.#updateUndoRedoState(mapId);
      });
    }

    const history = this.#drawerHistory.get(mapId);
    const currentIndex = this.#historyIndex.get(mapId);

    if (!history || currentIndex === undefined || currentIndex < 0) return false;

    const action = history[currentIndex];
    const viewer = MapEventProcessor.getMapViewer(mapId);
    if (!viewer) return false;

    // Reverse the action
    switch (action.type) {
      case 'add':
        // Remove the added features
        this.#deleteFeaturesAction(mapId, action);
        break;

      case 'delete':
      case 'clear':
        // Re-add the deleted features
        this.#addFeaturesAction(mapId, action);
        break;

      case 'modify':
        // Restore original geometries
        this.#undoModifyAction(mapId, action);
        break;

      default:
        return false;
    }

    this.#historyIndex.set(mapId, currentIndex - 1);
    this.#updateUndoRedoState(mapId);
    return true;
  }

  /**
   * Redoes the next drawer action.
   * @param {string} mapId - The map ID
   * @returns {boolean} If the action was successful
   */
  static redo(mapId: string): boolean {
    const state = this.getDrawerState(mapId);
    if (!state) return false;

    // If editing, redo the transform instance and not the drawer-event-processor
    const transformInstance = state.actions.getTransformInstance();
    if (transformInstance && transformInstance.getSelectedFeature()) {
      return transformInstance.redo(() => {
        this.#updateUndoRedoState(mapId);
      });
    }

    const history = this.#drawerHistory.get(mapId);
    const currentIndex = this.#historyIndex.get(mapId);

    if (!history || currentIndex === undefined || currentIndex >= history.length - 1) return false;

    const nextIndex = currentIndex + 1;
    const action = history[nextIndex];

    // Re-apply the action
    switch (action.type) {
      case 'add':
        this.#addFeaturesAction(mapId, action);
        break;

      case 'delete':
        // Re-delete the features
        this.#deleteFeaturesAction(mapId, action);
        break;

      case 'modify':
        this.#redoModifyAction(mapId, action);
        break;

      case 'clear':
        // Re-clear all features
        this.clearDrawings(mapId, false);
        break;

      default:
        return false;
    }

    this.#historyIndex.set(mapId, nextIndex);
    this.#updateUndoRedoState(mapId);
    return true;
  }

  /**
   * Re-add new features
   * @param {string} mapId - The map ID
   * @param {DrawerHistoryAction} action - The action that will be re-performed
   */
  static #addFeaturesAction(mapId: string, action: DrawerHistoryAction): void {
    const viewer = MapEventProcessor.getMapViewer(mapId);
    if (!viewer) return;
    // Re-add the features
    action.features.forEach((historyFeature) => {
      const feature = historyFeature.clone(); // Clone to prevent modifying the state feature

      feature.setId(feature.get('featureId'));
      viewer.layer.geometry.geometries.push(feature);
      viewer.layer.geometry.addToGeometryGroup(feature, DRAW_GROUP_KEY);

      // Add to transform instance if editing is active
      const state = this.getDrawerState(mapId);
      const transformInstance = state?.actions.getTransformInstance();
      if (transformInstance) {
        transformInstance.addFeature(feature);
      }

      // Recreate measurement overlay
      const geom = feature.getGeometry();
      if (geom && !(geom instanceof Point)) {
        const overlay = this.#createMeasureTooltip(feature, false, mapId);
        if (overlay) viewer.map.addOverlay(overlay);
      }
    });
  }

  /**
   * Re-delete deleted features
   * @param {string} mapId - The map ID
   * @param {DrawerHistoryAction} action - The action that will be re-performed
   */
  static #deleteFeaturesAction(mapId: string, action: DrawerHistoryAction): void {
    const viewer = MapEventProcessor.getMapViewer(mapId);

    action.features.forEach((historyFeature) => {
      const feature = historyFeature.clone(); // Clone to prevent modifying the state feature
      const featureId = feature.get('featureId');

      // GV Can't just use this.deleteSingleDrawing because between actions it will cause the
      // GV geometry to no longer be '===', which will prevent it from being removed by the
      // GV deleteGeometryFromGroup function in core > geo > layer > geometry > geometry.ts
      // Remove from geometries array
      const geometryIndex = viewer.layer.geometry.geometries.findIndex((f) => {
        return f.get('featureId') === featureId && f.get('geometryGroup') === DRAW_GROUP_KEY;
      });
      if (geometryIndex !== -1) {
        viewer.layer.geometry.geometries.splice(geometryIndex, 1);
      }

      // Remove from vector source directly
      const geometryGroup = viewer.layer.geometry.getGeometryGroup(DRAW_GROUP_KEY);
      if (geometryGroup) {
        const vectorSource = geometryGroup.vectorLayer.getSource();
        const layerFeatures = vectorSource?.getFeatures() || [];

        layerFeatures.forEach((layerFeature) => {
          if (layerFeature.get('featureId') === featureId) {
            const measureTooltip = layerFeature.get('measureTooltip');
            measureTooltip?.getElement()?.remove();

            vectorSource?.removeFeature(layerFeature);
          }
        });

        geometryGroup.vectorLayer.changed();
      }
    });
  }

  /**
   * Function that redoes a modify action
   * @param {string} mapId - The map ID
   * @param {DrawerHistoryAction} action - The action to be redone
   */
  static #redoModifyAction(mapId: string, action: DrawerHistoryAction): void {
    const viewer = MapEventProcessor.getMapViewer(mapId);
    if (!viewer) return;

    action.features.forEach((feature, index) => {
      const currentFeature = this.#getFeatureById(mapId, feature.getId() as string);
      if (currentFeature) {
        // Restore modified geometry if it exists
        if (action.modifiedGeometries && action.modifiedGeometries[index]) {
          currentFeature.setGeometry(action.modifiedGeometries[index].clone());

          // Recreate measurement overlay only if geometry changed
          const geom = currentFeature.getGeometry();
          if (geom && !(geom instanceof Point)) {
            const overlay = this.#createMeasureTooltip(currentFeature, false, mapId);
            if (overlay) viewer.map.addOverlay(overlay);
          }
        }

        // Restore modified style if it exists
        if (action.modifiedStyles && action.modifiedStyles[index]) {
          currentFeature.setStyle(action.modifiedStyles[index]);
        }
      }
    });
  }

  /**
   * Function that undoes a modify action
   * @param {string} mapId - The map ID
   * @param {DrawerHistoryAction} action - The action to be undone
   */
  static #undoModifyAction(mapId: string, action: DrawerHistoryAction): void {
    const viewer = MapEventProcessor.getMapViewer(mapId);
    if (!viewer) return;

    action.features.forEach((feature, index) => {
      const currentFeature = this.#getFeatureById(mapId, feature.getId() as string);
      if (currentFeature) {
        if (action.originalGeometries && action.originalGeometries[index]) {
          // Restore geometry
          currentFeature.setGeometry(action.originalGeometries[index].clone());

          // Recreate overlay
          const geom = currentFeature.getGeometry();
          if (geom && !(geom instanceof Point)) {
            const overlay = this.#createMeasureTooltip(currentFeature, false, mapId);
            if (overlay) viewer.map.addOverlay(overlay);
          }
        }

        // Restore style
        if (action.originalStyles && action.originalStyles[index]) {
          currentFeature.setStyle(action.originalStyles[index]);
        }
      }
    });
  }

  /**
   * Refreshes the undo / redo states depending on if we are currently editing
   * a feature since there is undo / redo functionality for both
   * drawer-event-processor and transform-base
   * @param mapId - The map ID
   */
  static #updateUndoRedoState(mapId: string): void {
    const state = this.getDrawerState(mapId);
    if (!state) return;

    const transformInstance = state.actions.getTransformInstance();
    if (transformInstance && state.selectedDrawing) {
      const undoDisabled = !transformInstance.canUndo();
      const redoDisabled = !transformInstance.canRedo();

      state.actions.setUndoDisabled(undoDisabled);
      state.actions.setRedoDisabled(redoDisabled);
      return;
    }

    const history = this.#drawerHistory.get(mapId) || [];
    const currentIndex = this.#historyIndex.get(mapId) ?? -1;

    // Can't undo if no history or at the beginning
    const undoDisabled = history.length === 0 || currentIndex < 0;

    // Can't redo if no history or at the end
    const redoDisabled = history.length === 0 || currentIndex >= history.length - 1;

    state.actions.setUndoDisabled(undoDisabled);
    state.actions.setRedoDisabled(redoDisabled);
  }

  /**
   * Clean up resources for a map
   * @param {string} mapId - The map ID
   */
  static cleanup(mapId: string): void {
    // Remove keyboard handler
    const handler = this.#keyboardHandlers.get(mapId);
    if (handler) {
      document.removeEventListener('keydown', handler);
      this.#keyboardHandlers.delete(mapId);
    }

    // Clear history
    this.#drawerHistory.delete(mapId);
    this.#historyIndex.delete(mapId);

    // Clean up selected feature states for this map
    const keysToDelete = Array.from(this.#selectedFeatureState.keys()).filter((key) => key.startsWith(`${mapId}-`));
    keysToDelete.forEach((key) => this.#selectedFeatureState.delete(key));
  }

  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  // GV NEVER add a store action who does set state AND map action at a same time.
  // GV Review the action in store state to make sure
}

type GeoJsonFeature = {
  geometry: unknown;
  properties: GeoJsonFeatureProps;
};

type GeoJsonFeatureProps = {
  id: string;
  style: TypeGeoJSONStyleProps;
};
