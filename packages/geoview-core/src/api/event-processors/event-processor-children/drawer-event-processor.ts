import { Collection, Feature, Overlay } from 'ol';
import GeoJSON from 'ol/format/GeoJSON';
import type { Geometry, SimpleGeometry } from 'ol/geom';
import { LineString, Polygon, Point, Circle as CircleGeom } from 'ol/geom';
import { fromCircle } from 'ol/geom/Polygon';
import { getArea, getLength } from 'ol/sphere';
import { Text, Style, Stroke, Fill, Icon as OLIcon } from 'ol/style';
import type { StyleLike } from 'ol/style/Style';
import type { DrawEvent, GeometryFunction, SketchCoordType } from 'ol/interaction/Draw';
import { createBox } from 'ol/interaction/Draw';

import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import type { TypeDisplayLanguage, TypeValidMapProjectionCodes } from '@/api/types/map-schema-types';

import { Projection } from '@/geo/utils/projection';
import { GeoUtilities } from '@/geo/utils/utilities';
import type { Draw } from '@/geo/interaction/draw';
import type { Transform } from '@/geo/interaction/transform';
import type { TransformDeleteFeatureEvent, TransformEvent, TransformSelectionEvent } from '@/geo/interaction/transform/transform-events';
import type { StyleProps } from '@/core/stores/store-interface-and-intial-values/drawer-state';
import {
  getStoreActiveGeom,
  getStoreDrawInstance,
  getStoreHideMeasurements,
  getStoreIconSrc,
  getStoreIsDrawing,
  getStoreIsEditing,
  getStoreIsSnapping,
  getStoreSelectedDrawing,
  getStoreSnapInstance,
  getStoreStyle,
  getStoreTransformInstance,
  isStoreDrawerInitialized,
  removeStoreDrawInstance,
  removeStoreSnapInstance,
  removeStoreTransformInstance,
  setStoreActiveGeom,
  setStoreDrawerIconSize,
  setStoreDrawInstance,
  setStoreFillColor,
  setStoreHideMeasurements,
  setStoreRedoDisabled,
  setStoreSelectedDrawing,
  setStoreSnapInstance,
  setStoreStrokeColor,
  setStoreStrokeWidth,
  setStoreTextBold,
  setStoreTextColor,
  setStoreTextFont,
  setStoreTextHaloColor,
  setStoreTextHaloWidth,
  setStoreTextItalic,
  setStoreTextRotation,
  setStoreTextSize,
  setStoreTextValue,
  setStoreTransformInstance,
  setStoreUndoDisabled,
  updateStoreStateStyle,
} from '@/core/stores/store-interface-and-intial-values/drawer-state';
import { getStoreMapCurrentProjection } from '@/core/stores/store-interface-and-intial-values/map-state';
import { getStoreDisplayLanguage } from '@/core/stores/store-interface-and-intial-values/app-state';
import { generateId, formatLength, formatArea } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';

/**
 * Event processor focusing on interacting with the drawer state in the store.
 */
export abstract class DrawerEventProcessor extends AbstractEventProcessor {
  /** History stack for undo/redo functionality */
  static #drawerHistory: Map<string, DrawerHistoryAction[]> = new Map();

  /** Track features that were selected and their original geometries */
  // GV The Map was because the transform COULD select multiple features
  // GV It may not be necessary as I'm not sure we should support that
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

  /** Keep track of the temporary transform instances for new text drawings */
  static #tempTransformInstances = new Map<string, Transform>();

  /** The geometry group key used for all drawer features */
  static readonly DRAW_GROUP_KEY = 'draw-group';

  /** The default icon source as a base64-encoded SVG data URI */
  static readonly DEFAULT_ICON_SOURCE =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgMkM4LjEzIDIgNSA1LjEzIDUgOWMwIDUuMjUgNyAxMyA3IDEzczctNy43NSA3LTEzYzAtMy44Ny0zLjEzLTctNy03bTAgOS41Yy0xLjM4IDAtMi41LTEuMTItMi41LTIuNXMxLjEyLTIuNSAyLjUtMi41IDIuNSAxLjEyIDIuNSAyLjUtMS4xMiAyLjUtMi41IDIuNSIgZmlsbD0icmdiYSgyNTIsIDI0MSwgMCwgMC4zKSIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjEuMyIvPjwvc3ZnPg==';

  // #region STATIC METHODS

  /**
   * Sets the active geometry type and refreshes the interaction instances.
   *
   * @param mapId - The map ID
   * @param geomType - The geometry type to set as active
   */
  static setActiveGeom(mapId: string, geomType: string): void {
    // Save to the store
    setStoreActiveGeom(mapId, geomType);

    // Refresh
    this.refreshInteractionInstances(mapId);
  }

  /**
   * Refreshes the draw instance and updates the style of any transforming feature.
   *
   * @param mapId - The map ID
   */
  static updateFeatureStyle(mapId: string): void {
    // Refresh the draw instance with the new style
    if (getStoreDrawInstance(mapId) !== undefined) {
      this.startDrawing(mapId);
    }

    this.updateTransformingFeatureStyle(mapId, getStoreStyle(mapId));
  }

  /**
   * Sets the fill color in the store and updates the feature style.
   *
   * @param mapId - The map ID
   * @param fillColor - The fill color value
   */
  static setFillColor(mapId: string, fillColor: string): void {
    // Save to the store
    setStoreFillColor(mapId, fillColor);

    // Update the feature style at large
    this.updateFeatureStyle(mapId);
  }

  /**
   * Sets the stroke color in the store and updates the feature style.
   *
   * @param mapId - The map ID
   * @param strokeColor - The stroke color value
   */
  static setStrokeColor(mapId: string, strokeColor: string): void {
    // Save to the store
    setStoreStrokeColor(mapId, strokeColor);

    // Update the feature style at large
    this.updateFeatureStyle(mapId);
  }

  /**
   * Sets the stroke width in the store and updates the feature style.
   *
   * @param mapId - The map ID
   * @param strokeWidth - The stroke width value
   */
  static setStrokeWidth(mapId: string, strokeWidth: number): void {
    // Save to the store
    setStoreStrokeWidth(mapId, strokeWidth);

    // Update the feature style at large
    this.updateFeatureStyle(mapId);
  }

  /**
   * Sets the icon size in the store and updates the feature style.
   *
   * @param mapId - The map ID
   * @param iconSize - The icon size value
   */
  static setDrawerIconSize(mapId: string, iconSize: number): void {
    // Save to the store
    setStoreDrawerIconSize(mapId, iconSize);

    // Update the feature style at large
    this.updateFeatureStyle(mapId);
  }

  /**
   * Sets the text value in the store and updates the feature style.
   *
   * @param mapId - The map ID
   * @param text - The text content
   */
  static setTextValue(mapId: string, text: string): void {
    // Save to the store
    setStoreTextValue(mapId, text);

    // Update the feature style at large
    this.updateFeatureStyle(mapId);
  }

  /**
   * Sets the text size in the store and updates the feature style.
   *
   * @param mapId - The map ID
   * @param size - The text size in pixels
   */
  static setTextSize(mapId: string, size: number): void {
    // Save to the store
    setStoreTextSize(mapId, size);

    // Update the feature style at large
    this.updateFeatureStyle(mapId);
  }

  /**
   * Sets the text font in the store and updates the feature style.
   *
   * @param mapId - The map ID
   * @param font - The font family name
   */
  static setTextFont(mapId: string, font: string): void {
    // Save to the store
    setStoreTextFont(mapId, font);

    // Update the feature style at large
    this.updateFeatureStyle(mapId);
  }

  /**
   * Sets the text color in the store and updates the feature style.
   *
   * @param mapId - The map ID
   * @param color - The text color value
   */
  static setTextColor(mapId: string, color: string): void {
    // Save to the store
    setStoreTextColor(mapId, color);

    // Update the feature style at large
    this.updateFeatureStyle(mapId);
  }

  /**
   * Sets the text halo color in the store and updates the feature style.
   *
   * @param mapId - The map ID
   * @param color - The halo color value
   */
  static setTextHaloColor(mapId: string, color: string): void {
    // Save to the store
    setStoreTextHaloColor(mapId, color);

    // Update the feature style at large
    this.updateFeatureStyle(mapId);
  }

  /**
   * Sets the text halo width in the store and updates the feature style.
   *
   * @param mapId - The map ID
   * @param width - The halo width value
   */
  static setTextHaloWidth(mapId: string, width: number): void {
    // Save to the store
    setStoreTextHaloWidth(mapId, width);

    // Update the feature style at large
    this.updateFeatureStyle(mapId);
  }

  /**
   * Sets the text bold state in the store and updates the feature style.
   *
   * @param mapId - The map ID
   * @param bold - Whether the text should be bold
   */
  static setTextBold(mapId: string, bold: boolean): void {
    // Save to the store
    setStoreTextBold(mapId, bold);

    // Update the feature style at large
    this.updateFeatureStyle(mapId);
  }

  /**
   * Sets the text italic state in the store and updates the feature style.
   *
   * @param mapId - The map ID
   * @param italic - Whether the text should be italic
   */
  static setTextItalic(mapId: string, italic: boolean): void {
    // Save to the store
    setStoreTextItalic(mapId, italic);

    // Update the feature style at large
    this.updateFeatureStyle(mapId);
  }

  /**
   * Sets the text rotation in the store and updates the feature style.
   *
   * @param mapId - The map ID
   * @param rotation - The rotation angle
   */
  static setTextRotation(mapId: string, rotation: number): void {
    // Save to the store
    setStoreTextRotation(mapId, rotation);

    // Update the feature style at large
    this.updateFeatureStyle(mapId);
  }

  /**
   * Handles map projection changes to reproject the drawings.
   *
   * @param mapId - The map ID
   * @param currentProjection - The current projection code
   * @param previousProjection - The previous projection code
   * @param displayLanguage - The current display language for updating measurement tooltips after reprojection
   */
  static handleMapReprojection(
    mapId: string,
    currentProjection: TypeValidMapProjectionCodes,
    previousProjection: TypeValidMapProjectionCodes,
    displayLanguage: TypeDisplayLanguage
  ): void {
    if (previousProjection) {
      const features = this.#getDrawingFeatures(mapId);
      features.forEach((feature) => {
        const geometry = feature.getGeometry();
        if (!geometry) return;

        geometry.transform(Projection.PROJECTIONS[previousProjection], Projection.PROJECTIONS[currentProjection]);
        this.updateMeasurementTooltips(mapId, displayLanguage);
      });
    }
  }

  /**
   * Gets all drawing features for a map.
   *
   * @param mapId - The map ID
   * @returns Array of features
   * @throws {InvaliGeometryGroupIdError} When the provided geometry group id does not exist
   */
  static #getDrawingFeatures(mapId: string): Feature[] {
    // Check if state exist and if draw instance is enable, solve error when switch lang and no draw instance
    if (!isStoreDrawerInitialized(mapId)) return [];
    if (!getStoreDrawInstance(mapId)) return [];

    // Get features from drawing group
    const geometryGroup = this.getMapViewerLayerAPI(mapId).geometry.getGeometryGroup(this.DRAW_GROUP_KEY);
    const features = geometryGroup?.vectorSource.getFeatures();
    if (!features) {
      return [];
    }
    return features;
  }

  /**
   * Gets a feature by its ID.
   *
   * @param mapId - The map ID
   * @param featureId - Feature ID to search for
   * @returns The found feature, or undefined if not found
   */
  static #getFeatureById(mapId: string, featureId: string): Feature | undefined {
    const allDrawingFeatures = this.#getDrawingFeatures(mapId);

    const foundFeature = allDrawingFeatures.find((feature) => feature.getId() === featureId);

    return foundFeature;
  }

  /**
   * Updates all measurement tooltips for a map with the current language.
   *
   * @param mapId - The map ID
   * @param displayLanguage - The display language
   */
  static updateMeasurementTooltips(mapId: string, displayLanguage: TypeDisplayLanguage): void {
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
   * Calculates measurements for a geometry feature.
   *
   * @param geom - The geometry to measure
   * @param displayLanguage - The display language
   * @returns Object containing the formatted output text and tooltip coordinates
   */
  static #getFeatureMeasurements(
    geom: Geometry,
    displayLanguage: TypeDisplayLanguage
  ): { output: string | undefined; tooltipCoord: number[] | undefined } {
    let output: string | undefined;
    let tooltipCoord: number[] | undefined;

    if (geom instanceof LineString) {
      const length = getLength(geom);
      output = formatLength(length, displayLanguage);

      tooltipCoord = geom.getLastCoordinate();
    } else if (geom instanceof Polygon) {
      const length = getLength(geom);
      output = formatLength(length, displayLanguage);

      const area = getArea(geom);
      output += `<br>${formatArea(area, displayLanguage)}`;

      tooltipCoord = geom.getInteriorPoint().getCoordinates();
      tooltipCoord.pop();
    } else if (geom instanceof CircleGeom) {
      // For Circle geometries, calculate area using π*r²
      const radius = geom.getRadius();
      const length = 2 * Math.PI * radius;
      output = formatLength(length, displayLanguage);

      const area = Math.PI * radius * radius;
      output += `<br>${formatArea(area, displayLanguage)}`;

      tooltipCoord = geom.getCenter();
    }
    return { output, tooltipCoord };
  }

  /**
   * Creates or updates a measurement tooltip for a feature.
   *
   * @param feature - The feature to create a tooltip for
   * @param hideMeasurements - Whether to hide the measurement tooltip
   * @param displayLanguage - The display language
   * @returns The created or updated overlay, or undefined if creation failed
   */
  static #createMeasureTooltip(
    feature: Feature<Geometry>,
    hideMeasurements: boolean,
    displayLanguage: TypeDisplayLanguage
  ): Overlay | undefined {
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
   * Converts an SVG path string to an array of coordinates.
   *
   * @param pathData - SVG path string
   * @param center - Center coordinates
   * @returns Array of coordinates
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
   * Converts an SVG path string to a polygon geometry with auto-centering.
   *
   * @param svgPath - SVG path string
   * @param coordinates - Circle coordinate (center and outer edge)
   * @param geometry - Optional intermediate geometry for display while expanding
   * @returns The resulting polygon
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
   * Sets up a feature with ID, geometry group, and type-specific properties.
   *
   * @param feature - The feature to set up
   * @param geomType - The geometry type
   * @param style - The style properties
   * @param iconSrc - Optional icon source for point features
   * @param featureId - Optional feature ID (generates one if not provided)
   */
  static #setFeatureProperties(feature: Feature, geomType: string, style: StyleProps, iconSrc?: string, featureId?: string): void {
    // Set up basic feature properties
    if (feature.get('featureId') === undefined) {
      const id = featureId || generateId();
      feature.setId(id);
      feature.set('featureId', id);
      feature.set('geometryGroup', this.DRAW_GROUP_KEY);
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
   * Extracts style properties from a feature.
   *
   * @param feature - The feature to extract properties from
   * @param currentStyle - The current style properties to update
   * @returns The extracted style properties
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

  /**
   * Cleans up the temporary text transform interaction.
   *
   * @param mapId - The map ID
   */
  static #cleanupTempTransform(mapId: string): void {
    const tempTransform = this.#tempTransformInstances.get(mapId);
    if (tempTransform) {
      tempTransform.clearSelection();
      tempTransform.stopInteraction();
      this.#tempTransformInstances.delete(mapId);
    }
  }

  // #endregion STATIC METHODS

  // #region Drawing Actions

  /**
   * Starts a drawing operation with the specified geometry type.
   *
   * @param mapId - The map ID
   * @param geomType - Optional geometry type to draw (uses current state if not provided)
   * @param styleInput - Optional style properties to use
   */
  static startDrawing(mapId: string, geomType?: string, styleInput?: StyleProps): void {
    // Quickly clean up the temp transform if present
    this.#cleanupTempTransform(mapId);

    if (!isStoreDrawerInitialized(mapId)) return;

    // Get the map viewer instance and stop map pointer events if not already stopped
    const viewer = this.getMapViewer(mapId);
    if (!getStoreIsEditing(mapId)) {
      viewer.unregisterMapPointerHandlers(viewer.map);
    }

    // If editing already, stop it
    // GV Moved the stop editing up so the rotation is set properly for any active text drawing
    if (getStoreIsEditing(mapId)) {
      this.stopEditing(mapId);
    }

    // Get current state values if not provided
    const currentGeomType = geomType || getStoreActiveGeom(mapId);
    const currentStyle = styleInput || getStoreStyle(mapId);

    // Make new text horizontal, regardless of what the state rotation was
    // GV If a style input is added for the rotation, then this can be removed
    currentStyle.textRotation = 0;

    // If drawing already, stop and restart as it's likely a style change
    if (getStoreDrawInstance(mapId)) {
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
      draw = viewer.initDrawInteractions(this.DRAW_GROUP_KEY, 'Point', currentStyle);
    } else if (currentGeomType in customGeometries) {
      draw = viewer.initDrawInteractions(this.DRAW_GROUP_KEY, 'Circle', currentStyle, customGeometries[currentGeomType]);
    } else {
      draw = viewer.initDrawInteractions(this.DRAW_GROUP_KEY, currentGeomType, currentStyle);
    }

    // Set up draw end event handler
    draw.onDrawEnd(this.#handleDrawEnd(mapId));

    // Update state
    setStoreDrawInstance(mapId, draw);
    if (geomType) {
      this.setActiveGeom(mapId, geomType);
    }

    if (getStoreIsSnapping(mapId)) {
      this.refreshSnappingInstance(mapId);
    }
  }

  /**
   * Creates a handler for draw end events.
   *
   * @param mapId - The map ID
   */
  static #handleDrawEnd(mapId: string) {
    return (_sender: unknown, event: DrawEvent): void => {
      if (!isStoreDrawerInitialized(mapId)) return;

      const currentGeomType = getStoreActiveGeom(mapId);
      const currentStyle = getStoreStyle(mapId);

      const viewer = this.getMapViewer(mapId);
      const { feature } = event;

      const geom = feature.getGeometry();
      if (!geom) return;

      // Create a style based on current color settings
      let featureStyle;

      if (currentGeomType === 'Point') {
        // For points, use a circle style
        featureStyle = new Style({
          image: new OLIcon({
            src: getStoreIconSrc(mapId),
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
      this.#setFeatureProperties(feature, currentGeomType, currentStyle, getStoreIconSrc(mapId));

      // Add overlays to non-point features
      if (!(geom instanceof Point)) {
        // GV hideMeasurements has to be here, otherwise the value can be stale, unlike style and geomType which restart the interaction
        const hideMeasurements = getStoreHideMeasurements(mapId);
        const newOverlay = this.#createMeasureTooltip(feature, hideMeasurements, getStoreDisplayLanguage(mapId));
        if (newOverlay) {
          viewer.map.addOverlay(newOverlay);
        }
      }

      viewer.layer.geometry.geometries.push(feature);
      viewer.layer.geometry.addToGeometryGroup(feature, this.DRAW_GROUP_KEY);

      this.#saveToHistory(mapId, {
        type: 'add',
        features: [feature],
      });

      // For text features, create a temporary transform for immediate editing
      if (currentGeomType === 'Text') {
        const drawInstance = getStoreDrawInstance(mapId);
        drawInstance?.stopInteraction();

        const featureCollection = new Collection([feature]); // Only select this specific feature
        const tempTransform = viewer.initTransformInteractions({
          geometryGroupKey: this.DRAW_GROUP_KEY,
          features: featureCollection,
        });

        // Keep track of this temp transform instance for cleanup
        this.#tempTransformInstances.set(mapId, tempTransform);

        let isDeselected = false;
        // Handle when the temporary editing is done

        tempTransform.onSelectionChange((_textSender, textEvent) => {
          const { previousFeature, newFeature } = textEvent;
          if (!newFeature && previousFeature && !isDeselected) {
            isDeselected = true;
            // User deselected - Set the style
            const finalStyle = new Style({
              text: new Text({
                text: previousFeature.get('text'),
                fill: new Fill({ color: previousFeature.get('textColor') || '#000000' }),
                stroke: new Stroke({
                  color: previousFeature.get('textHaloColor') || 'rgba(255,255,255,0.7)',
                  width: previousFeature.get('textHaloWidth') || 3,
                }),
                font: `${previousFeature.get('textItalic') ? 'italic ' : ''}${previousFeature.get('textBold') ? 'bold ' : ''}${previousFeature.get('textSize')}px ${previousFeature.get('textFont') || 'Arial'}`,
                rotation: previousFeature.get('textRotation') || 0, // <-- Make sure this is included
              }),
            });

            previousFeature.setStyle(finalStyle);

            // Cleanup the temporary transform
            this.#cleanupTempTransform(mapId);

            // Resume drawing
            if (drawInstance) {
              drawInstance.startInteraction();
            }
          }
        });

        // Immediately select the new text feature
        tempTransform.selectFeature(feature);
        tempTransform.showTextEditor();
      }
    };
  }

  /**
   * Stops the current drawing operation.
   *
   * @param mapId - The map ID
   */
  static stopDrawing(mapId: string): void {
    // Cleanup temp transforms
    this.#cleanupTempTransform(mapId);

    if (!isStoreDrawerInitialized(mapId)) return;

    // Restart Map Pointer handlers that place the details icon when clicking on the map
    if (!getStoreIsEditing(mapId)) {
      const viewer = this.getMapViewer(mapId);
      viewer.registerMapPointerHandlers(viewer.map);
    }

    getStoreDrawInstance(mapId)?.stopInteraction();

    // Update state
    removeStoreDrawInstance(mapId);
  }

  /**
   * Toggles the drawing state.
   *
   * @param mapId - The map ID
   */
  static toggleDrawing(mapId: string): void {
    if (!isStoreDrawerInitialized(mapId)) return;

    if (getStoreIsDrawing(mapId)) {
      this.stopDrawing(mapId);
    } else {
      this.startDrawing(mapId);
    }

    this.#updateUndoRedoState(mapId);
  }

  /**
   * Initiates editing interactions.
   *
   * @param mapId - The map ID
   */
  static startEditing(mapId: string): void {
    // Quickly clean up the temp transform if present
    this.#cleanupTempTransform(mapId);

    if (!isStoreDrawerInitialized(mapId)) return;

    // Get the map viewer instance and stop map pointer events
    const viewer = this.getMapViewer(mapId);
    if (!getStoreIsDrawing(mapId)) {
      viewer.unregisterMapPointerHandlers(viewer.map);
    }

    const oldTransformInstance = getStoreTransformInstance(mapId);

    // If editing already, stop and restart as it's likely a style change
    if (oldTransformInstance) {
      oldTransformInstance.stopInteraction();
      removeStoreTransformInstance(mapId);
    }

    // Only start editing if the drawing group exists
    if (viewer.layer.geometry.hasGeometryGroup(this.DRAW_GROUP_KEY)) {
      const transformInstance = viewer.initTransformInteractions({ geometryGroupKey: this.DRAW_GROUP_KEY, hitTolerance: 5 });

      // Handle Transform Events (A feature was edited, the feature is still being edited)
      transformInstance.onTransformEnd(this.#handleTransformEnd(mapId));

      // Handle Delete Events
      transformInstance.onDeleteFeature(this.#handleTransformDeleteFeature(mapId));

      // Handle Selection Events (new selection, removed selection, or both)
      transformInstance.onSelectionChange(this.#handleTransformSelectionChange(mapId));

      setStoreTransformInstance(mapId, transformInstance);
    } else {
      this.startDrawing(mapId);
      return;
    }

    // If we have an active drawing instance, stop it
    const drawInstance = getStoreDrawInstance(mapId);
    if (drawInstance) {
      this.stopDrawing(mapId);
    }

    if (getStoreIsSnapping(mapId)) {
      this.refreshSnappingInstance(mapId);
    }
  }

  /**
   * Creates a handler for transform end events.
   *
   * The current transform action has ended and the new geometry and style are applied to the feature.
   *
   * @param mapId - The map ID
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

        if (!isStoreDrawerInitialized(mapId)) return;

        this.setTextValue(mapId, textValue);
        this.setTextSize(mapId, finalSize);
        this.setTextBold(mapId, isBold);
        this.setTextItalic(mapId, isItalic);
        this.setTextRotation(mapId, rotation);
      }

      const geom = feature.getGeometry();
      if (!geom) return;
      if (geom instanceof Point) return;

      // Update the overlay with new values
      this.#createMeasureTooltip(feature, true, getStoreDisplayLanguage(mapId));

      // Update the undo redo state
      this.#updateUndoRedoState(mapId);
    };
  }

  /**
   * Creates a handler for transform delete feature events.
   *
   * @param mapId - The map ID
   */
  static #handleTransformDeleteFeature(mapId: string) {
    return (_sender: unknown, event: TransformDeleteFeatureEvent) => {
      const { feature } = event;

      // Save the delete state
      this.#saveToHistory(mapId, {
        type: 'delete',
        features: [feature],
      });

      const featureId = feature.getId();
      if (featureId) {
        this.deleteSingleDrawing(mapId, featureId as string);
      }

      setStoreSelectedDrawing(mapId, undefined);
      this.#updateUndoRedoState(mapId);
    };
  }

  /**
   * Creates a handler for transform selection change events.
   *
   * @param mapId - The map ID
   */
  static #handleTransformSelectionChange(mapId: string) {
    return (_sender: unknown, event: TransformSelectionEvent) => {
      // GV Get hideMeasurements here so the value is not stale
      let hideMeasurements = false;
      if (isStoreDrawerInitialized(mapId)) {
        hideMeasurements = getStoreHideMeasurements(mapId);
      }

      const { previousFeature, newFeature, createSelectAction } = event;

      // If we had a previous feature selected, check if it was modified
      if (previousFeature) {
        if (createSelectAction) {
          this.#saveToHistory(
            mapId,
            {
              type: 'select',
              features: [previousFeature],
            },
            true
          );
        } else {
          const stateKey = `${mapId}-${previousFeature.getId()}`;
          const savedState = this.#selectedFeatureState.get(stateKey);

          if (savedState) {
            const currentGeometry = previousFeature.getGeometry();

            // Check for changes
            const geometryChanged = currentGeometry && !GeoUtilities.geometriesAreEqual(savedState.originalGeometry, currentGeometry);
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

        if (!isStoreDrawerInitialized(mapId)) return;

        const featureProperties = this.#getFeatureProperties(newFeature, getStoreStyle(mapId));
        updateStoreStateStyle(mapId, featureProperties);
      }

      setStoreSelectedDrawing(mapId, newFeature);

      // Update the undo redo state
      this.#updateUndoRedoState(mapId);
    };
  }

  /**
   * Stops the editing interaction for all groups.
   *
   * @param mapId - The map ID
   */
  static stopEditing(mapId: string): void {
    if (!isStoreDrawerInitialized(mapId)) return;

    if (!getStoreIsDrawing(mapId)) {
      const viewer = this.getMapViewer(mapId);
      viewer.registerMapPointerHandlers(viewer.map);
    }

    const transformInstance = getStoreTransformInstance(mapId);

    if (!transformInstance) return;
    transformInstance.stopInteraction();
    removeStoreTransformInstance(mapId);
  }

  /**
   * Toggles the editing state.
   *
   * @param mapId - The map ID
   */
  static toggleEditing(mapId: string): void {
    if (!isStoreDrawerInitialized(mapId)) return;

    const isEditing = getStoreIsEditing(mapId);
    if (isEditing) {
      this.stopEditing(mapId);
    } else {
      this.startEditing(mapId);
    }

    this.#updateUndoRedoState(mapId);
  }

  /**
   * Starts snapping interactions.
   *
   * @param mapId - The map ID
   */
  static startSnapping(mapId: string): void {
    if (!isStoreDrawerInitialized(mapId)) return;

    const viewer = this.getMapViewer(mapId);
    const snapInstance = viewer.initSnapInteractions(this.DRAW_GROUP_KEY);
    snapInstance.startInteraction();

    setStoreSnapInstance(mapId, snapInstance);
  }

  /**
   * Stops snapping interactions.
   *
   * @param mapId - The map ID
   */
  static stopSnapping(mapId: string): void {
    if (!isStoreDrawerInitialized(mapId)) return;

    const snapInstance = getStoreSnapInstance(mapId);
    snapInstance?.stopInteraction();

    removeStoreSnapInstance(mapId);
  }

  /**
   * Toggles the snapping state.
   *
   * @param mapId - The map ID
   */
  static toggleSnapping(mapId: string): void {
    if (!isStoreDrawerInitialized(mapId)) return;

    const isSnapping = getStoreIsSnapping(mapId);
    if (isSnapping) {
      this.stopSnapping(mapId);
    } else {
      this.startSnapping(mapId);
    }
  }

  /**
   * Updates the style of any currently transforming features.
   *
   * @param mapId - The map ID
   * @param newStyle - The new style to apply
   */
  static updateTransformingFeatureStyle(mapId: string, newStyle: StyleProps): void {
    if (!isStoreDrawerInitialized(mapId)) return;

    const transformInstance = getStoreTransformInstance(mapId);
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
            src: getStoreIconSrc(mapId),
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
      this.#setFeatureProperties(selectedFeature, geomType, newStyle, getStoreIconSrc(mapId));
      selectedFeature.setStyle(featureStyle);
    }
  }

  /**
   * Deletes a single drawing feature from the map.
   *
   * @param mapId - The map ID
   * @param featureId - The ID of the feature to be deleted
   */
  static deleteSingleDrawing(mapId: string, featureId: string): void {
    const feature = this.#getFeatureById(mapId, featureId);
    if (!feature) return;

    const viewer = this.getMapViewer(mapId);

    const measureTooltip = feature.get('measureTooltip');
    measureTooltip?.getElement()?.remove();

    const geometryGroup = feature.get('geometryGroup');
    viewer.layer.geometry.deleteGeometryFromGroup(featureId, geometryGroup);
  }

  /**
   * Clears all drawings from the map.
   *
   * @param mapId - The map ID
   */
  static clearDrawings(mapId: string, saveHistory: boolean = true): void {
    if (!isStoreDrawerInitialized(mapId)) return;

    // Get the map viewer instance
    const viewer = this.getMapViewer(mapId);

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
    viewer.layer.geometry.deleteGeometriesFromGroup(this.DRAW_GROUP_KEY);

    if (getStoreIsEditing(mapId)) {
      this.stopEditing(mapId);
    }
  }

  /**
   * Refreshes the interaction instances.
   *
   * @param mapId - The map ID
   */
  static refreshInteractionInstances(mapId: string): void {
    if (!isStoreDrawerInitialized(mapId)) return;

    // If drawing, restart drawing to set the style
    if (getStoreIsDrawing(mapId)) {
      this.startDrawing(mapId);
    }

    // If editing, restart editing
    // Do this after the start drawing so the group is created if missing
    if (getStoreIsEditing(mapId)) {
      this.stopEditing(mapId);
      this.startEditing(mapId);
    }
  }

  /**
   * Refreshes the snapping instance by stopping and restarting it.
   *
   * @param mapId - The map ID
   */
  static refreshSnappingInstance(mapId: string): void {
    if (!isStoreDrawerInitialized(mapId)) return;

    if (getStoreIsSnapping(mapId)) {
      this.stopSnapping(mapId);
      this.startSnapping(mapId);
    }
  }

  /**
   * Toggles the measurement overlays on the map.
   *
   * @param mapId - The map ID
   */
  static toggleHideMeasurements(mapId: string): void {
    if (!isStoreDrawerInitialized(mapId)) return;

    const hideMeasurements = getStoreHideMeasurements(mapId);
    const selectedDrawingId = getStoreSelectedDrawing(mapId)?.getId();

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
    setStoreHideMeasurements(mapId, !hideMeasurements);
  }

  // #endregion

  // #region Download / Upload

  /**
   * Downloads drawings as GeoJSON with embedded styles.
   *
   * @param mapId - The map ID
   */
  static downloadDrawings(mapId: string): void {
    const features = this.#getDrawingFeatures(mapId);
    if (features.length === 0) return;

    // Get current map projection
    const mapProjection = Projection.PROJECTIONS[getStoreMapCurrentProjection(mapId)];

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
   * Uploads and loads drawings from a GeoJSON file.
   *
   * @param mapId - The map ID
   * @param file - The GeoJSON file
   */
  static uploadDrawings(mapId: string, file: File): void {
    if (!isStoreDrawerInitialized(mapId)) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const geojson = JSON.parse(e.target?.result as string);
        const viewer = this.getMapViewer(mapId);

        // Get current map projection
        const mapProjection = Projection.PROJECTIONS[getStoreMapCurrentProjection(mapId)];

        const newFeatures: Feature[] = [];
        geojson.features.forEach((geoFeature: GeoJsonFeature) => {
          const olGeometry = new GeoJSON().readGeometry(geoFeature.geometry);
          olGeometry.transform('EPSG:4326', mapProjection);

          const feature = new Feature({ geometry: olGeometry });

          // Apply style from properties
          const styleProps = (geoFeature.properties.style as unknown as TypeGeoJSONStyleProps) || undefined;
          const iconSrc = styleProps?.iconSrc || this.DEFAULT_ICON_SOURCE;
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
            const hideMeasurements = getStoreHideMeasurements(mapId);
            const newOverlay = this.#createMeasureTooltip(feature, hideMeasurements, getStoreDisplayLanguage(mapId));
            if (newOverlay) {
              viewer.map.addOverlay(newOverlay);
            }
          }

          // Add to map
          viewer.layer.geometry.geometries.push(feature);
          viewer.layer.geometry.addToGeometryGroup(feature, this.DRAW_GROUP_KEY);

          newFeatures.push(feature);
        });

        // Save action history
        this.#saveToHistory(mapId, {
          type: 'add',
          features: newFeatures,
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
   *
   * @param mapId - The map ID
   * @param action - The action to save
   * @param insertAtCurrentIndex - Whether to create the action as the next action / as a redo
   */
  static #saveToHistory(mapId: string, action: DrawerHistoryAction, insertAtCurrentIndex: boolean = false): void {
    if (!this.#drawerHistory.has(mapId)) {
      this.#drawerHistory.set(mapId, []);
      this.#historyIndex.set(mapId, -1);
    }

    const history = this.#drawerHistory.get(mapId)!;
    const currentIndex = this.#historyIndex.get(mapId)!;

    if (insertAtCurrentIndex) {
      // Insert right after current index for redo capability
      history.splice(currentIndex + 1, 0, action);
      // Don't update the index - stay at current position
    } else {
      // Remove any history after current index
      history.splice(currentIndex + 1);

      // Add new action
      history.push(action);
      this.#historyIndex.set(mapId, history.length - 1);
    }

    // Update undo/redo state
    this.#updateUndoRedoState(mapId);

    // Limit history size
    if (history.length > this.#maxHistorySize) {
      history.shift();
      if (!insertAtCurrentIndex) {
        this.#historyIndex.set(mapId, this.#historyIndex.get(mapId)! - 1);
      }
    }
  }

  /**
   * Undoes the last drawer action.
   *
   * @param mapId - The map ID
   * @returns Whether the action was successful
   */
  static undo(mapId: string): boolean {
    if (!isStoreDrawerInitialized(mapId)) return false;

    // If editing, undo the transform instance and not the drawer-event-processor
    const transformInstance = getStoreTransformInstance(mapId);
    if (transformInstance && transformInstance.getSelectedFeature()) {
      if (transformInstance.canUndo()) {
        return transformInstance.undo(() => {
          this.#updateUndoRedoState(mapId);
        });
      }
    }

    const history = this.#drawerHistory.get(mapId);
    const currentIndex = this.#historyIndex.get(mapId);

    if (!history || currentIndex === undefined || currentIndex < 0) return false;

    const action = history[currentIndex];
    const viewer = this.getMapViewer(mapId);
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
   *
   * @param mapId - The map ID
   * @returns Whether the action was successful
   */
  static redo(mapId: string): boolean {
    if (!isStoreDrawerInitialized(mapId)) return false;

    // If editing, redo the transform instance and not the drawer-event-processor
    const transformInstance = getStoreTransformInstance(mapId);
    if (transformInstance && transformInstance.getSelectedFeature()) {
      if (transformInstance.canRedo()) {
        return transformInstance.redo(() => {
          this.#updateUndoRedoState(mapId);
        });
      }
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

      case 'select':
        // Re-select the features
        this.#selectFeaturesAction(mapId, action);

        // Remove the select action from history since it's been consumed
        history.splice(nextIndex, 1);
        break;

      default:
        return false;
    }

    // Don't increase the index for 'select' actions
    if (action.type !== 'select') {
      this.#historyIndex.set(mapId, nextIndex);
    }
    this.#updateUndoRedoState(mapId);
    return true;
  }

  /**
   * Re-adds features from a history action.
   *
   * @param mapId - The map ID
   * @param action - The action that will be re-performed
   */
  static #addFeaturesAction(mapId: string, action: DrawerHistoryAction): void {
    const viewer = this.getMapViewer(mapId);
    if (!viewer) return;

    // Re-add the features
    action.features.forEach((feature) => {
      feature.setId(feature.get('featureId'));
      viewer.layer.geometry.geometries.push(feature);
      viewer.layer.geometry.addToGeometryGroup(feature, this.DRAW_GROUP_KEY);

      // Add to transform instance if editing is active
      const transformInstance = getStoreTransformInstance(mapId);
      if (transformInstance) {
        transformInstance.addFeature(feature);
      }

      // Recreate measurement overlay
      const geom = feature.getGeometry();
      if (geom && !(geom instanceof Point)) {
        const overlay = this.#createMeasureTooltip(feature, false, getStoreDisplayLanguage(mapId));
        if (overlay) viewer.map.addOverlay(overlay);
      }
    });
  }

  /**
   * Re-deletes features from a history action.
   *
   * @param mapId - The map ID
   * @param action - The action that will be re-performed
   * @throws {InvaliGeometryGroupIdError} When the provided geometry group id does not exist
   */
  static #deleteFeaturesAction(mapId: string, action: DrawerHistoryAction): void {
    const viewer = this.getMapViewer(mapId);

    action.features.forEach((feature) => {
      const featureId = feature.get('featureId');

      // GV Can't just use this.deleteSingleDrawing because between actions it will cause the
      // GV geometry to no longer be '===', which will prevent it from being removed by the
      // GV deleteGeometryFromGroup function in core > geo > layer > geometry > geometry.ts
      // Remove from geometries array
      const geometryIndex = viewer.layer.geometry.geometries.findIndex((f) => {
        return f.get('featureId') === featureId && f.get('geometryGroup') === this.DRAW_GROUP_KEY;
      });
      if (geometryIndex !== -1) {
        viewer.layer.geometry.geometries.splice(geometryIndex, 1);
      }

      // Remove from vector source directly
      const geometryGroup = viewer.layer.geometry.getGeometryGroup(this.DRAW_GROUP_KEY);
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
    });
  }

  /**
   * Redoes a modify action by restoring modified geometries and styles.
   *
   * @param mapId - The map ID
   * @param action - The action to be redone
   */
  static #redoModifyAction(mapId: string, action: DrawerHistoryAction): void {
    const viewer = this.getMapViewer(mapId);
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
            const overlay = this.#createMeasureTooltip(currentFeature, false, getStoreDisplayLanguage(mapId));
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
   * Undoes a modify action by restoring original geometries and styles.
   *
   * @param mapId - The map ID
   * @param action - The action to be undone
   */
  static #undoModifyAction(mapId: string, action: DrawerHistoryAction): void {
    const viewer = this.getMapViewer(mapId);
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
            const overlay = this.#createMeasureTooltip(currentFeature, false, getStoreDisplayLanguage(mapId));
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
   * Re-performs a select action.
   *
   * Deselect happens inside the transform-base undo.
   *
   * @param mapId - The map ID
   * @param action - The select action to be applied
   */
  static #selectFeaturesAction(mapId: string, action: DrawerHistoryAction): void {
    if (!isStoreDrawerInitialized(mapId)) return;

    const transformInstance = getStoreTransformInstance(mapId);
    if (transformInstance) {
      transformInstance.selectFeature(action.features[0], false);
    }
  }

  /**
   * Refreshes the undo/redo states depending on whether a feature is currently being edited,
   * since there is undo/redo functionality for both drawer-event-processor and transform-base.
   *
   * @param mapId - The map ID
   */
  static #updateUndoRedoState(mapId: string): void {
    if (!isStoreDrawerInitialized(mapId)) return;

    const transformInstance = getStoreTransformInstance(mapId);
    if (transformInstance && getStoreSelectedDrawing(mapId)) {
      const undoDisabled = !transformInstance.canUndo();
      const redoDisabled = !transformInstance.canRedo();

      setStoreUndoDisabled(mapId, undoDisabled);
      setStoreRedoDisabled(mapId, redoDisabled);
      return;
    }

    const history = this.#drawerHistory.get(mapId) || [];
    const currentIndex = this.#historyIndex.get(mapId) ?? -1;

    // Can't undo if no history or at the beginning
    const undoDisabled = history.length === 0 || currentIndex < 0;

    // Can't redo if no history or at the end
    const redoDisabled = history.length === 0 || currentIndex >= history.length - 1;

    setStoreUndoDisabled(mapId, undoDisabled);
    setStoreRedoDisabled(mapId, redoDisabled);
  }

  /**
   * Cleans up resources for a map.
   *
   * @param mapId - The map ID
   */
  static cleanup(mapId: string): void {
    // Clear history
    this.#drawerHistory.delete(mapId);
    this.#historyIndex.delete(mapId);

    // Clean up selected feature states for this map
    const keysToDelete = Array.from(this.#selectedFeatureState.keys()).filter((key) => key.startsWith(`${mapId}-`));
    keysToDelete.forEach((key) => this.#selectedFeatureState.delete(key));
  }

  // #endregion
}

/** Represents a GeoJSON feature with geometry and style properties */
type GeoJsonFeature = {
  /** The GeoJSON geometry object */
  geometry: unknown;

  /** The feature properties including ID and style */
  properties: GeoJsonFeatureProps;
};

/** Properties attached to a GeoJSON feature */
type GeoJsonFeatureProps = {
  /** The feature identifier */
  id: string;

  /** The style properties for the feature */
  style: TypeGeoJSONStyleProps;
};

/** Represents a single action in the drawer undo/redo history */
interface DrawerHistoryAction {
  /** The type of action that was performed */
  type: 'add' | 'delete' | 'modify' | 'clear' | 'select';

  /** The features involved in the action */
  features: Feature[];

  /** Optional original geometries before modification */
  originalGeometries?: Geometry[];

  /** Optional modified geometries after modification */
  modifiedGeometries?: Geometry[];

  /** Optional original styles before modification */
  originalStyles?: (StyleLike | undefined)[];

  /** Optional modified styles after modification */
  modifiedStyles?: (StyleLike | undefined)[];
}

/** Style properties for GeoJSON feature serialization/deserialization */
interface TypeGeoJSONStyleProps {
  /** The stroke color */
  strokeColor?: string;

  /** The stroke width */
  strokeWidth?: number;

  /** The fill color */
  fillColor?: string;

  /** The icon source URL or data URI */
  iconSrc?: string;

  /** The icon size in pixels */
  iconSize?: number;

  /** The text content */
  text?: string;

  /** The text size in pixels */
  textSize?: number;

  /** The text font family */
  textFont?: string;

  /** The text color */
  textColor?: string;

  /** The text halo color */
  textHaloColor?: string;

  /** The text halo width */
  textHaloWidth?: number;

  /** Whether the text is bold */
  textBold?: boolean;

  /** Whether the text is italic */
  textItalic?: boolean;

  /** The text rotation angle */
  textRotation?: number;
}
