import type { DrawEvent } from 'ol/interaction/Draw';
import GeoJSON from 'ol/format/GeoJSON';
import { createBox, type GeometryFunction, type SketchCoordType } from 'ol/interaction/Draw';
import type SimpleGeometry from 'ol/geom/SimpleGeometry';
import Polygon, { fromCircle } from 'ol/geom/Polygon';
import { Text, Fill, Icon as OLIcon, Stroke, Style } from 'ol/style';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import type Geometry from 'ol/geom/Geometry';
import type { StyleLike } from 'ol/style/Style';
import { Circle as CircleGeom, LineString } from 'ol/geom';
import Overlay from 'ol/Overlay';

import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import { useControllers } from '@/core/controllers/base/controller-manager';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import {
  DEFAULT_TEXT_VALUES,
  isStoreDrawerInitialized,
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
  type StyleProps,
} from '@/core/stores/store-interface-and-intial-values/drawer-state';
import type { DomainLanguageChangedDelegate, DomainLanguageChangedEvent, UIDomain } from '@/core/domains/ui-domain';
import type { MapViewer } from '@/geo/map/map-viewer';
import type {
  Transform,
  TransformDeleteFeatureEvent,
  TransformEvent,
  TransformSelectionEvent,
} from '@/geo/interaction/transform/transform';
import type { Draw } from '@/geo/interaction/draw';
import { formatArea, formatLength, generateId } from '@/core/utils/utilities';
import { GeoUtilities } from '@/geo/utils/utilities';
import type { TypeDisplayLanguage, TypeValidMapProjectionCodes } from '@/api/types/map-schema-types';
import { getStoreDisplayLanguage } from '@/core/stores/store-interface-and-intial-values/app-state';
import Collection from 'ol/Collection';
import { Projection } from '@/geo/utils/projection';
import { getArea, getLength } from 'ol/sphere';
import { getStoreMapCurrentProjection } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import type { GeometryApi } from '@/geo/layer/geometry/geometry';

/**
 * Controller responsible for drawer interactions, keyboard shortcuts, and
 * bridging the drawer state with the UI domain and map projection changes.
 */
export class DrawerController extends AbstractMapViewerController {
  /** The geometry group key used for all drawer features */
  static readonly DRAW_GROUP_KEY = 'draw-group';

  /** Maximum history size */
  static readonly MAX_HISTORY_SIZE = 50;

  /** Keyboard event handlers for each map keyed by map id. */
  static #keyboardHandlers: Map<string, (event: KeyboardEvent) => void> = new Map();

  /** Keep track of the temporary transform instances for new text drawings */
  static #tempTransformInstances = new Map<string, Transform>();

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

  /** History stack for undo/redo functionality */
  static #drawerHistory: Map<string, DrawerHistoryAction[]> = new Map();

  /** Current position in history stack for each map */
  static #historyIndex: Map<string, number> = new Map();

  /** The default icon source as a base64-encoded SVG data URI */
  static readonly DEFAULT_ICON_SOURCE =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgMkM4LjEzIDIgNSA1LjEzIDUgOWMwIDUuMjUgNyAxMyA3IDEzczctNy43NSA3LTEzYzAtMy44Ny0zLjEzLTctNy03bTAgOS41Yy0xLjM4IDAtMi41LTEuMTItMi41LTIuNXMxLjEyLTIuNSAyLjUtMi41IDIuNSAxLjEyIDIuNSAyLjUtMS4xMiAyLjUtMi41IDIuNSIgZmlsbD0icmdiYSgyNTIsIDI0MSwgMCwgMC4zKSIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjEuMyIvPjwvc3ZnPg==';

  /** The UI Domain instance associated with this controller. */
  #uiDomain: UIDomain;

  /** The Geometry Api used by this controller. */
  #geometryApi: GeometryApi;

  /** The language changed event hook. */
  #hookLanguageChanged?: DomainLanguageChangedDelegate;

  /** The store subscription callback to unsubscribe from projection changes. */
  #hookProjectionSubscription?: () => void;

  /**
   * Creates an instance of DrawerController.
   *
   * @param mapViewer - The map viewer instance to associate with this controller
   * @param uiDomain - The UI domain instance to associate with this controller
   * @param geometryApi - The geometry API instance to associate with this controller
   */
  constructor(mapViewer: MapViewer, uiDomain: UIDomain, geometryApi: GeometryApi) {
    super(mapViewer);

    // Keep a reference on the UI domain
    this.#uiDomain = uiDomain;

    // Keep a reference on the geometry api
    this.#geometryApi = geometryApi;
  }

  // #region OVERRIDES

  /**
   * Hooks the controller into action.
   */
  protected override onHook(): void {
    // Setup the keyboard handlers for undo/redo
    this.#hookKeyboardHandlers();

    // Listens when the language is changed in the UI domain and process actions accordingly
    this.#hookLanguageChanged = this.#uiDomain.onLanguageChanged(this.#handleDisplayLanguageChanged.bind(this));

    // Subscribe to projection changes
    // TODO: REFACTOR - Change this to listen on the domain event instead of the store state, because we are doing application-domain work with this subscribe.
    this.#hookProjectionSubscription = getGeoViewStore(this.getMapId()).subscribe(
      (state) => state.mapState.currentProjection,
      (currentProjection, previousProjection) => {
        this.#handleMapReprojection(currentProjection, previousProjection, this.getMapViewer().getDisplayLanguage());
      }
    );
  }

  /**
   * Unhooks the controller from the action.
   */
  protected override onUnhook(): void {
    // Unsubscribe from language changes
    if (this.#hookLanguageChanged) {
      this.#uiDomain.offLanguageChanged(this.#hookLanguageChanged);
      this.#hookLanguageChanged = undefined;
    }

    // Unsubscribe from projection changes
    if (this.#hookProjectionSubscription) {
      this.#hookProjectionSubscription();
      this.#hookProjectionSubscription = undefined;
    }

    // Remove keyboard handler
    const handler = DrawerController.#keyboardHandlers.get(this.getMapId());
    if (handler) {
      document.removeEventListener('keydown', handler);
      DrawerController.#keyboardHandlers.delete(this.getMapId());
    }
  }

  // #endregion OVERRIDES

  // #region PUBLIC METHODS - DRAWING

  /**
   * Starts a drawing operation with the specified geometry type.
   *
   * @param geomType - Optional geometry type to draw (uses current state if not provided)
   * @param styleInput - Optional style properties to use
   */
  startDrawing(geomType?: string, styleInput?: StyleProps): void {
    // Get the map id
    const mapId = this.getMapId();

    // Quickly clean up the temp transform if present
    this.#cleanupTempTransform();

    if (!isStoreDrawerInitialized(mapId)) return;

    // Get the map viewer instance and stop map pointer events if not already stopped
    const viewer = this.getMapViewer();
    if (!getStoreIsEditing(mapId)) {
      viewer.unregisterMapPointerHandlers(viewer.map);
    }

    // If editing already, stop it
    // GV Moved the stop editing up so the rotation is set properly for any active text drawing
    if (getStoreIsEditing(mapId)) {
      this.stopEditing();
    }

    // Get current state values if not provided
    const currentGeomType = geomType || getStoreActiveGeom(mapId);
    const currentStyle = styleInput || getStoreStyle(mapId);

    // Make new text horizontal, regardless of what the state rotation was
    // GV If a style input is added for the rotation, then this can be removed
    currentStyle.textRotation = 0;

    // If drawing already, stop and restart as it's likely a style change
    if (getStoreDrawInstance(mapId)) {
      this.stopDrawing();
    }

    // Record of GeometryFunctions for creating custom geometries
    const customGeometries: Record<string, GeometryFunction> = {
      Star: (coordinates: SketchCoordType, geometry: SimpleGeometry): Polygon => {
        const svgPath =
          'm 7.61,20.13 8.22,7.04 -2.51,10.53 9.24,-5.64 9.24,5.64 L29.29,27.17 37.51,20.13 26.72,19.27 22.56,9.27 18.4,19.27 Z';
        return DrawerController.#svgPathToGeometry(svgPath, coordinates, geometry as Polygon);
      },
      Rectangle: createBox(),
    };

    // Initialize drawing interaction
    let draw: Draw;
    if (currentGeomType === 'Text') {
      draw = viewer.initDrawInteractions(DrawerController.DRAW_GROUP_KEY, 'Point', currentStyle);
    } else if (currentGeomType in customGeometries) {
      draw = viewer.initDrawInteractions(DrawerController.DRAW_GROUP_KEY, 'Circle', currentStyle, customGeometries[currentGeomType]);
    } else {
      draw = viewer.initDrawInteractions(DrawerController.DRAW_GROUP_KEY, currentGeomType, currentStyle);
    }

    // Set up draw end event handler
    draw.onDrawEnd(this.#handleDrawEnd());

    // Update state
    setStoreDrawInstance(mapId, draw);
    if (geomType) {
      this.setActiveGeom(geomType);
    }

    if (getStoreIsSnapping(mapId)) {
      this.refreshSnappingInstance();
    }
  }

  /**
   * Stops the current drawing operation.
   */
  stopDrawing(): void {
    // Get the map id
    const mapId = this.getMapId();

    // Cleanup temp transforms
    this.#cleanupTempTransform();

    if (!isStoreDrawerInitialized(mapId)) return;

    // Restart Map Pointer handlers that place the details icon when clicking on the map
    if (!getStoreIsEditing(mapId)) {
      const viewer = this.getMapViewer();
      viewer.registerMapPointerHandlers(viewer.map);
    }

    getStoreDrawInstance(mapId)?.stopInteraction();

    // Update state
    removeStoreDrawInstance(mapId);
  }

  /**
   * Toggles the drawing state.
   */
  toggleDrawing(): void {
    // Get the map id
    const mapId = this.getMapId();

    if (!isStoreDrawerInitialized(mapId)) return;

    if (getStoreIsDrawing(mapId)) {
      this.stopDrawing();
    } else {
      this.startDrawing();
    }

    this.#updateUndoRedoState();
  }

  /**
   * Initiates editing interactions.
   */
  startEditing(): void {
    // Get the map id
    const mapId = this.getMapId();

    // Quickly clean up the temp transform if present
    this.#cleanupTempTransform();

    if (!isStoreDrawerInitialized(mapId)) return;

    // Get the map viewer instance and stop map pointer events
    const viewer = this.getMapViewer();

    // Get the geometry api
    const geometryApi = this.getGeometryApi();

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
    if (geometryApi.hasGeometryGroup(DrawerController.DRAW_GROUP_KEY)) {
      const transformInstance = viewer.initTransformInteractions({ geometryGroupKey: DrawerController.DRAW_GROUP_KEY, hitTolerance: 5 });

      // Handle Transform Events (A feature was edited, the feature is still being edited)
      transformInstance.onTransformEnd(this.#handleTransformEnd());

      // Handle Delete Events
      transformInstance.onDeleteFeature(this.#handleTransformDeleteFeature());

      // Handle Selection Events (new selection, removed selection, or both)
      transformInstance.onSelectionChange(this.#handleTransformSelectionChange());

      setStoreTransformInstance(mapId, transformInstance);
    } else {
      this.startDrawing();
      return;
    }

    // If we have an active drawing instance, stop it
    const drawInstance = getStoreDrawInstance(mapId);
    if (drawInstance) {
      this.stopDrawing();
    }

    if (getStoreIsSnapping(mapId)) {
      this.refreshSnappingInstance();
    }
  }

  /**
   * Stops the editing interaction for all groups.
   */
  stopEditing(): void {
    // Get the map id
    const mapId = this.getMapId();

    if (!isStoreDrawerInitialized(mapId)) return;

    if (!getStoreIsDrawing(mapId)) {
      const viewer = this.getMapViewer();
      viewer.registerMapPointerHandlers(viewer.map);
    }

    const transformInstance = getStoreTransformInstance(mapId);

    if (!transformInstance) return;
    transformInstance.stopInteraction();
    removeStoreTransformInstance(mapId);
  }

  /**
   * Toggles the editing state.
   */
  toggleEditing(): void {
    // Get the map id
    const mapId = this.getMapId();

    if (!isStoreDrawerInitialized(mapId)) return;

    const isEditing = getStoreIsEditing(mapId);
    if (isEditing) {
      this.stopEditing();
    } else {
      this.startEditing();
    }

    this.#updateUndoRedoState();
  }

  /**
   * Starts snapping interactions.
   */
  startSnapping(): void {
    // Get the map id
    const mapId = this.getMapId();

    if (!isStoreDrawerInitialized(mapId)) return;

    const viewer = this.getMapViewer();
    const snapInstance = viewer.initSnapInteractions(DrawerController.DRAW_GROUP_KEY);
    snapInstance.startInteraction();

    setStoreSnapInstance(mapId, snapInstance);
  }

  /**
   * Stops snapping interactions.
   */
  stopSnapping(): void {
    // Get the map id
    const mapId = this.getMapId();

    if (!isStoreDrawerInitialized(mapId)) return;

    const snapInstance = getStoreSnapInstance(mapId);
    snapInstance?.stopInteraction();

    removeStoreSnapInstance(mapId);
  }

  /**
   * Toggles the snapping state.
   */
  toggleSnapping(): void {
    // Get the map id
    const mapId = this.getMapId();
    if (!isStoreDrawerInitialized(mapId)) return;

    const isSnapping = getStoreIsSnapping(mapId);
    if (isSnapping) {
      this.stopSnapping();
    } else {
      this.startSnapping();
    }
  }

  /**
   * Deletes a single drawing feature from the map.
   *
   * @param featureId - The ID of the feature to be deleted
   */
  deleteSingleDrawing(featureId: string): void {
    const feature = this.#getFeatureById(featureId);
    if (!feature) return;

    const measureTooltip = feature.get('measureTooltip');
    measureTooltip?.getElement()?.remove();

    const geometryGroup = feature.get('geometryGroup');
    this.getGeometryApi().deleteGeometryFromGroup(featureId, geometryGroup);
  }

  /**
   * Clears all drawings from the map.
   *
   */
  clearDrawings(saveHistory: boolean = true): void {
    // Get the map id
    const mapId = this.getMapId();

    if (!isStoreDrawerInitialized(mapId)) return;

    // Get all geometries for each type
    const features = this.#getDrawingFeatures();

    // Set the history, only if this isn't from a redo
    if (saveHistory && features.length > 0) {
      this.#saveToHistory({
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
    this.getGeometryApi().deleteGeometriesFromGroup(DrawerController.DRAW_GROUP_KEY);

    if (getStoreIsEditing(mapId)) {
      this.stopEditing();
    }
  }

  /**
   * Refreshes the interaction instances.
   *
   */
  refreshInteractionInstances(): void {
    // Get the map id
    const mapId = this.getMapId();

    if (!isStoreDrawerInitialized(mapId)) return;

    // If drawing, restart drawing to set the style
    if (getStoreIsDrawing(mapId)) {
      this.startDrawing();
    }

    // If editing, restart editing
    // Do this after the start drawing so the group is created if missing
    if (getStoreIsEditing(mapId)) {
      this.stopEditing();
      this.startEditing();
    }
  }

  /**
   * Refreshes the snapping instance by stopping and restarting it.
   *
   */
  refreshSnappingInstance(): void {
    // Get the map id
    const mapId = this.getMapId();

    if (!isStoreDrawerInitialized(mapId)) return;

    if (getStoreIsSnapping(mapId)) {
      this.stopSnapping();
      this.startSnapping();
    }
  }

  /**
   * Toggles the measurement overlays on the map.
   *
   */
  toggleHideMeasurements(): void {
    // Get the map id
    const mapId = this.getMapId();

    if (!isStoreDrawerInitialized(mapId)) return;

    const hideMeasurements = getStoreHideMeasurements(mapId);
    const selectedDrawingId = getStoreSelectedDrawing(mapId)?.getId();

    // Get all overlays, ignoring currently selected features
    const features = this.#getDrawingFeatures();
    const measureOverlays = features
      .filter((feature) => feature.getId() !== selectedDrawingId)
      .map((feature) => feature.get('measureTooltip'));

    // Toggle the visibility of the measure tooltips
    measureOverlays.forEach((overlay) => {
      if (!overlay) return;
      const elem = overlay.getElement();
      if (elem) elem.hidden = !hideMeasurements;
    });

    // Save to the store
    setStoreHideMeasurements(mapId, !hideMeasurements);
  }

  /**
   * Sets the active geometry type and refreshes the interaction instances.
   *
   * @param geomType - The geometry type to set as active
   */
  setActiveGeom(geomType: string): void {
    // Get the map id
    const mapId = this.getMapId();

    // Save to the store
    setStoreActiveGeom(mapId, geomType);

    // Refresh
    this.refreshInteractionInstances();
  }

  /**
   * Sets the fill color in the store and updates the feature style.
   *
   * @param fillColor - The fill color value
   */
  setFillColor(fillColor: string): void {
    // Get the map id
    const mapId = this.getMapId();

    // Save to the store
    setStoreFillColor(mapId, fillColor);

    // Update the feature style at large
    this.updateFeatureStyle();
  }

  /**
   * Sets the stroke color in the store and updates the feature style.
   *
   * @param strokeColor - The stroke color value
   */
  setStrokeColor(strokeColor: string): void {
    // Get the map id
    const mapId = this.getMapId();

    // Save to the store
    setStoreStrokeColor(mapId, strokeColor);

    // Update the feature style at large
    this.updateFeatureStyle();
  }

  /**
   * Sets the stroke width in the store and updates the feature style.
   *
   * @param strokeWidth - The stroke width value
   */
  setStrokeWidth(strokeWidth: number): void {
    // Get the map id
    const mapId = this.getMapId();

    // Save to the store
    setStoreStrokeWidth(mapId, strokeWidth);

    // Update the feature style at large
    this.updateFeatureStyle();
  }

  /**
   * Sets the icon size in the store and updates the feature style.
   *
   * @param iconSize - The icon size value
   */
  setDrawerIconSize(iconSize: number): void {
    // Get the map id
    const mapId = this.getMapId();

    // Save to the store
    setStoreDrawerIconSize(mapId, iconSize);

    // Update the feature style at large
    this.updateFeatureStyle();
  }

  /**
   * Sets the text value in the store and updates the feature style.
   *
   * @param text - The text content
   */
  setTextValue(text: string): void {
    // Get the map id
    const mapId = this.getMapId();

    // Save to the store
    setStoreTextValue(mapId, text);

    // Update the feature style at large
    this.updateFeatureStyle();
  }

  /**
   * Sets the text size in the store and updates the feature style.
   *
   * @param size - The text size in pixels
   */
  setTextSize(size: number): void {
    // Get the map id
    const mapId = this.getMapId();

    // Save to the store
    setStoreTextSize(mapId, size);

    // Update the feature style at large
    this.updateFeatureStyle();
  }

  /**
   * Sets the text font in the store and updates the feature style.
   *
   * @param font - The font family name
   */
  setTextFont(font: string): void {
    // Get the map id
    const mapId = this.getMapId();

    // Save to the store
    setStoreTextFont(mapId, font);

    // Update the feature style at large
    this.updateFeatureStyle();
  }

  /**
   * Sets the text color in the store and updates the feature style.
   *
   * @param color - The text color value
   */
  setTextColor(color: string): void {
    // Get the map id
    const mapId = this.getMapId();

    // Save to the store
    setStoreTextColor(mapId, color);

    // Update the feature style at large
    this.updateFeatureStyle();
  }

  /**
   * Sets the text halo color in the store and updates the feature style.
   *
   * @param color - The halo color value
   */
  setTextHaloColor(color: string): void {
    // Get the map id
    const mapId = this.getMapId();

    // Save to the store
    setStoreTextHaloColor(mapId, color);

    // Update the feature style at large
    this.updateFeatureStyle();
  }

  /**
   * Sets the text halo width in the store and updates the feature style.
   *
   * @param width - The halo width value
   */
  setTextHaloWidth(width: number): void {
    // Get the map id
    const mapId = this.getMapId();

    // Save to the store
    setStoreTextHaloWidth(mapId, width);

    // Update the feature style at large
    this.updateFeatureStyle();
  }

  /**
   * Sets the text bold state in the store and updates the feature style.
   *
   * @param bold - Whether the text should be bold
   */
  setTextBold(bold: boolean): void {
    // Get the map id
    const mapId = this.getMapId();

    // Save to the store
    setStoreTextBold(mapId, bold);

    // Update the feature style at large
    this.updateFeatureStyle();
  }

  /**
   * Sets the text italic state in the store and updates the feature style.
   *
   * @param italic - Whether the text should be italic
   */
  setTextItalic(italic: boolean): void {
    // Get the map id
    const mapId = this.getMapId();

    // Save to the store
    setStoreTextItalic(mapId, italic);

    // Update the feature style at large
    this.updateFeatureStyle();
  }

  /**
   * Sets the text rotation in the store and updates the feature style.
   *
   * @param rotation - The rotation angle
   */
  setTextRotation(rotation: number): void {
    // Get the map id
    const mapId = this.getMapId();

    // Save to the store
    setStoreTextRotation(mapId, rotation);

    // Update the feature style at large
    this.updateFeatureStyle();
  }

  /**
   * Refreshes the draw instance and updates the style of any transforming feature.
   */
  updateFeatureStyle(): void {
    // Get the map id
    const mapId = this.getMapId();

    // Refresh the draw instance with the new style
    if (getStoreDrawInstance(mapId) !== undefined) {
      this.startDrawing();
    }

    this.updateTransformingFeatureStyle(getStoreStyle(mapId));
  }

  /**
   * Updates the style of any currently transforming features.
   *
   * @param newStyle - The new style to apply
   */
  updateTransformingFeatureStyle(newStyle: StyleProps): void {
    // Get the map id
    const mapId = this.getMapId();

    if (!isStoreDrawerInitialized(mapId)) return;

    const transformInstance = getStoreTransformInstance(mapId);
    if (!transformInstance) return;

    const selectedFeature = transformInstance.getSelectedFeature();
    if (!selectedFeature) return;

    // Get the current state for this feature
    const stateKey = `${mapId}-${selectedFeature.getId()}`;
    const savedState = DrawerController.#selectedFeatureState.get(stateKey);

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
      DrawerController.#setFeatureProperties(selectedFeature, geomType, newStyle, getStoreIconSrc(mapId));
      selectedFeature.setStyle(featureStyle);
    }
  }

  // #endregion PUBLIC METHODS - DRAWING

  // #region PUBLIC METHODS - HISTORY

  /**
   * Undoes the last drawer action.
   *
   * @returns Whether the action was successful
   */
  undo(): boolean {
    // Get the map id
    const mapId = this.getMapId();

    if (!isStoreDrawerInitialized(mapId)) return false;

    // If editing, undo the transform instance
    const transformInstance = getStoreTransformInstance(mapId);
    if (transformInstance && transformInstance.getSelectedFeature()) {
      if (transformInstance.canUndo()) {
        return transformInstance.undo(() => {
          this.#updateUndoRedoState();
        });
      }
    }

    const history = DrawerController.#drawerHistory.get(mapId);
    const currentIndex = DrawerController.#historyIndex.get(mapId);

    if (!history || currentIndex === undefined || currentIndex < 0) return false;

    const action = history[currentIndex];
    const viewer = this.getMapViewer();
    if (!viewer) return false;

    // Reverse the action
    switch (action.type) {
      case 'add':
        // Remove the added features
        this.#deleteFeaturesAction(action);
        break;

      case 'delete':
      case 'clear':
        // Re-add the deleted features
        this.#addFeaturesAction(action);
        break;

      case 'modify':
        // Restore original geometries
        this.#undoModifyAction(action);
        break;

      default:
        return false;
    }

    DrawerController.#historyIndex.set(mapId, currentIndex - 1);
    this.#updateUndoRedoState();
    return true;
  }

  /**
   * Redoes the next drawer action.
   *
   * @returns Whether the action was successful
   */
  redo(): boolean {
    // Get the map id
    const mapId = this.getMapId();

    if (!isStoreDrawerInitialized(mapId)) return false;

    // If editing, redo the transform instance
    const transformInstance = getStoreTransformInstance(mapId);
    if (transformInstance && transformInstance.getSelectedFeature()) {
      if (transformInstance.canRedo()) {
        return transformInstance.redo(() => {
          this.#updateUndoRedoState();
        });
      }
    }

    const history = DrawerController.#drawerHistory.get(mapId);
    const currentIndex = DrawerController.#historyIndex.get(mapId);

    if (!history || currentIndex === undefined || currentIndex >= history.length - 1) return false;

    const nextIndex = currentIndex + 1;
    const action = history[nextIndex];

    // Re-apply the action
    switch (action.type) {
      case 'add':
        this.#addFeaturesAction(action);
        break;

      case 'delete':
        // Re-delete the features
        this.#deleteFeaturesAction(action);
        break;

      case 'modify':
        this.#redoModifyAction(action);
        break;

      case 'clear':
        // Re-clear all features
        this.clearDrawings(false);
        break;

      case 'select':
        // Re-select the features
        this.#selectFeaturesAction(action);

        // Remove the select action from history since it's been consumed
        history.splice(nextIndex, 1);
        break;

      default:
        return false;
    }

    // Don't increase the index for 'select' actions
    if (action.type !== 'select') {
      DrawerController.#historyIndex.set(mapId, nextIndex);
    }
    this.#updateUndoRedoState();
    return true;
  }

  /**
   * Cleans up resources for a map.
   */
  cleanup(): void {
    // Get the map id
    const mapId = this.getMapId();

    // Clear history
    DrawerController.#drawerHistory.delete(mapId);
    DrawerController.#historyIndex.delete(mapId);

    // Clean up selected feature states for this map
    const keysToDelete = Array.from(DrawerController.#selectedFeatureState.keys()).filter((key) => key.startsWith(`${mapId}-`));
    keysToDelete.forEach((key) => DrawerController.#selectedFeatureState.delete(key));
  }

  // #endregion PUBLIC METHODS - HISTORY

  // #region PUBLIC METHODS - DOWNLOAD

  /**
   * Downloads drawings as GeoJSON with embedded styles.
   *
   */
  downloadDrawings(): void {
    // Get the map id
    const mapId = this.getMapId();

    const features = this.#getDrawingFeatures();
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
   * @param file - The GeoJSON file
   */
  uploadDrawings(file: File): void {
    // Get the map id
    const mapId = this.getMapId();

    if (!isStoreDrawerInitialized(mapId)) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const geojson = JSON.parse(e.target?.result as string);
        const viewer = this.getMapViewer();

        // Get current map projection
        const mapProjection = Projection.PROJECTIONS[getStoreMapCurrentProjection(mapId)];

        const newFeatures: Feature[] = [];
        geojson.features.forEach((geoFeature: GeoJsonFeature) => {
          const olGeometry = new GeoJSON().readGeometry(geoFeature.geometry);
          olGeometry.transform('EPSG:4326', mapProjection);

          const feature = new Feature({ geometry: olGeometry });

          // Apply style from properties
          const styleProps = (geoFeature.properties.style as unknown as TypeGeoJSONStyleProps) || undefined;
          const iconSrc = styleProps?.iconSrc || DrawerController.DEFAULT_ICON_SOURCE;
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
            DrawerController.#setFeatureProperties(feature, 'Text', styleProps as StyleProps, undefined, featureId);
          } else {
            DrawerController.#setFeatureProperties(feature, 'Point', {} as StyleProps, iconSrc, featureId);
          }

          // Add overlays to non-point features
          if (!(olGeometry instanceof Point)) {
            // GV hideMeasurements has to be here, otherwise the value can be stale, unlike style and geomType which restart the interaction
            const hideMeasurements = getStoreHideMeasurements(mapId);
            const newOverlay = DrawerController.#createMeasureTooltip(feature, hideMeasurements, getStoreDisplayLanguage(mapId));
            if (newOverlay) {
              viewer.map.addOverlay(newOverlay);
            }
          }

          // Add to map
          this.getGeometryApi().geometries.push(feature);
          this.getGeometryApi().addToGeometryGroup(feature, DrawerController.DRAW_GROUP_KEY);

          newFeatures.push(feature);
        });

        // Save action history
        this.#saveToHistory({
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

  // #endregion PUBLIC METHODS - DOWNLOAD

  // #region PRIVATE METHODS - DRAWING

  /**
   * Cleans up the temporary text transform interaction.
   */
  #cleanupTempTransform(): void {
    // Get the map id
    const mapId = this.getMapId();

    const tempTransform = DrawerController.#tempTransformInstances.get(mapId);
    if (tempTransform) {
      tempTransform.clearSelection();
      tempTransform.stopInteraction();
      DrawerController.#tempTransformInstances.delete(mapId);
    }
  }

  /**
   * Gets a feature by its ID.
   *
   * @param featureId - Feature ID to search for
   * @returns The found feature, or undefined if not found
   */
  #getFeatureById(featureId: string): Feature | undefined {
    const allDrawingFeatures = this.#getDrawingFeatures();

    const foundFeature = allDrawingFeatures.find((feature) => feature.getId() === featureId);

    return foundFeature;
  }

  /**
   * Updates all measurement tooltips for a map with the current language.
   *
   * @param displayLanguage - The display language
   */
  #updateMeasurementTooltips(displayLanguage: TypeDisplayLanguage): void {
    const features = this.#getDrawingFeatures();

    features.forEach((feature) => {
      const geom = feature.getGeometry();
      if (!geom) return;
      const overlay = feature.get('measureTooltip');
      if (overlay) {
        const { output, tooltipCoord } = DrawerController.#getFeatureMeasurements(geom, displayLanguage);
        overlay.element.children[0].innerHTML = output;
        overlay.setPosition(tooltipCoord);
      }
    });
  }

  /**
   * Gets all drawing features for a map.
   *
   * @returns Array of features
   * @throws {InvaliGeometryGroupIdError} When the provided geometry group id does not exist
   */
  #getDrawingFeatures(): Feature[] {
    // Get the map id
    const mapId = this.getMapId();

    // Check if state exist and if draw instance is enable, solve error when switch lang and no draw instance
    if (!isStoreDrawerInitialized(mapId)) return [];
    if (!getStoreDrawInstance(mapId)) return [];

    // Get features from drawing group
    const geometryGroup = this.#geometryApi.getGeometryGroup(DrawerController.DRAW_GROUP_KEY);
    const features = geometryGroup?.vectorSource.getFeatures();
    if (!features) {
      return [];
    }
    return features;
  }

  // #endregion PRIVATE METHODS - DRAWING

  // #region PRIVATE METHODS - HISTORY

  /**
   * Saves an action to the drawer history.
   *
   * @param action - The action to save
   * @param insertAtCurrentIndex - Whether to create the action as the next action / as a redo
   */
  #saveToHistory(action: DrawerHistoryAction, insertAtCurrentIndex: boolean = false): void {
    // Get the map id
    const mapId = this.getMapId();

    if (!DrawerController.#drawerHistory.has(mapId)) {
      DrawerController.#drawerHistory.set(mapId, []);
      DrawerController.#historyIndex.set(mapId, -1);
    }

    const history = DrawerController.#drawerHistory.get(mapId)!;
    const currentIndex = DrawerController.#historyIndex.get(mapId)!;

    if (insertAtCurrentIndex) {
      // Insert right after current index for redo capability
      history.splice(currentIndex + 1, 0, action);
      // Don't update the index - stay at current position
    } else {
      // Remove any history after current index
      history.splice(currentIndex + 1);

      // Add new action
      history.push(action);
      DrawerController.#historyIndex.set(mapId, history.length - 1);
    }

    // Update undo/redo state
    this.#updateUndoRedoState();

    // Limit history size
    if (history.length > DrawerController.MAX_HISTORY_SIZE) {
      history.shift();
      if (!insertAtCurrentIndex) {
        DrawerController.#historyIndex.set(mapId, DrawerController.#historyIndex.get(mapId)! - 1);
      }
    }
  }

  /**
   * Re-adds features from a history action.
   *
   * @param action - The action that will be re-performed
   */
  #addFeaturesAction(action: DrawerHistoryAction): void {
    // Get the map id
    const mapId = this.getMapId();

    const viewer = this.getMapViewer();
    if (!viewer) return;

    // Re-add the features
    action.features.forEach((feature) => {
      feature.setId(feature.get('featureId'));
      this.getGeometryApi().geometries.push(feature);
      this.getGeometryApi().addToGeometryGroup(feature, DrawerController.DRAW_GROUP_KEY);

      // Add to transform instance if editing is active
      const transformInstance = getStoreTransformInstance(mapId);
      if (transformInstance) {
        transformInstance.addFeature(feature);
      }

      // Recreate measurement overlay
      const geom = feature.getGeometry();
      if (geom && !(geom instanceof Point)) {
        const overlay = DrawerController.#createMeasureTooltip(feature, false, getStoreDisplayLanguage(mapId));
        if (overlay) viewer.map.addOverlay(overlay);
      }
    });
  }

  /**
   * Re-deletes features from a history action.
   *
   * @param action - The action that will be re-performed
   * @throws {InvaliGeometryGroupIdError} When the provided geometry group id does not exist
   */
  #deleteFeaturesAction(action: DrawerHistoryAction): void {
    action.features.forEach((feature) => {
      const featureId = feature.get('featureId');

      // GV Can't just use this.deleteSingleDrawing because between actions it will cause the
      // GV geometry to no longer be '===', which will prevent it from being removed by the
      // GV deleteGeometryFromGroup function in core > geo > layer > geometry > geometry.ts
      // Remove from geometries array
      const geometryIndex = this.getGeometryApi().geometries.findIndex((f) => {
        return f.get('featureId') === featureId && f.get('geometryGroup') === DrawerController.DRAW_GROUP_KEY;
      });
      if (geometryIndex !== -1) {
        this.getGeometryApi().geometries.splice(geometryIndex, 1);
      }

      // Remove from vector source directly
      const geometryGroup = this.getGeometryApi().getGeometryGroup(DrawerController.DRAW_GROUP_KEY);
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
   * @param action - The action to be redone
   */
  #redoModifyAction(action: DrawerHistoryAction): void {
    // Get the map id
    const mapId = this.getMapId();

    const viewer = this.getMapViewer();
    if (!viewer) return;

    action.features.forEach((feature, index) => {
      const currentFeature = this.#getFeatureById(feature.getId() as string);
      if (currentFeature) {
        // Restore modified geometry if it exists
        if (action.modifiedGeometries && action.modifiedGeometries[index]) {
          currentFeature.setGeometry(action.modifiedGeometries[index].clone());

          // Recreate measurement overlay only if geometry changed
          const geom = currentFeature.getGeometry();
          if (geom && !(geom instanceof Point)) {
            const overlay = DrawerController.#createMeasureTooltip(currentFeature, false, getStoreDisplayLanguage(mapId));
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
   * @param action - The action to be undone
   */
  #undoModifyAction(action: DrawerHistoryAction): void {
    // Get the map id
    const mapId = this.getMapId();

    const viewer = this.getMapViewer();
    if (!viewer) return;

    action.features.forEach((feature, index) => {
      const currentFeature = this.#getFeatureById(feature.getId() as string);
      if (currentFeature) {
        if (action.originalGeometries && action.originalGeometries[index]) {
          // Restore geometry
          currentFeature.setGeometry(action.originalGeometries[index].clone());

          // Recreate overlay
          const geom = currentFeature.getGeometry();
          if (geom && !(geom instanceof Point)) {
            const overlay = DrawerController.#createMeasureTooltip(currentFeature, false, getStoreDisplayLanguage(mapId));
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
   * @param action - The select action to be applied
   */
  #selectFeaturesAction(action: DrawerHistoryAction): void {
    // Get the map id
    const mapId = this.getMapId();

    if (!isStoreDrawerInitialized(mapId)) return;

    const transformInstance = getStoreTransformInstance(mapId);
    if (transformInstance) {
      transformInstance.selectFeature(action.features[0], false);
    }
  }

  /**
   * Refreshes the undo/redo states depending on whether a feature is currently being edited,
   * since there is undo/redo functionality for both drawer-controller and transform-base.
   */
  #updateUndoRedoState(): void {
    // Get the map id
    const mapId = this.getMapId();

    if (!isStoreDrawerInitialized(mapId)) return;

    const transformInstance = getStoreTransformInstance(mapId);
    if (transformInstance && getStoreSelectedDrawing(mapId)) {
      const undoDisabled = !transformInstance.canUndo();
      const redoDisabled = !transformInstance.canRedo();

      setStoreUndoDisabled(mapId, undoDisabled);
      setStoreRedoDisabled(mapId, redoDisabled);
      return;
    }

    const history = DrawerController.#drawerHistory.get(mapId) || [];
    const currentIndex = DrawerController.#historyIndex.get(mapId) ?? -1;

    // Can't undo if no history or at the beginning
    const undoDisabled = history.length === 0 || currentIndex < 0;

    // Can't redo if no history or at the end
    const redoDisabled = history.length === 0 || currentIndex >= history.length - 1;

    setStoreUndoDisabled(mapId, undoDisabled);
    setStoreRedoDisabled(mapId, redoDisabled);
  }

  // #endregion PRIVATE METHDOS - HISTORY

  // #region DOMAIN HANDLERS
  // GV Eventually, these should be moved to a store adaptor or similar construct that directly connects the domain to the store without going through the controller
  // GV.CONT but for now this allows us to keep domain-store interactions in one place and call application-level processes as needed during migration.

  /**
   * Handles display language changes to update measurement tooltips and default text values.
   *
   * @param sender - The domain that sent the event
   * @param event - The language change event containing the new language
   */
  #handleDisplayLanguageChanged(sender: UIDomain, event: DomainLanguageChangedEvent): void {
    // Update all measurement tooltips when language changes
    this.#updateMeasurementTooltips(event.language);

    // Update Default Text when language changes
    this.setTextValue(DEFAULT_TEXT_VALUES[event.language]);
  }

  /**
   * Handles map projection changes to reproject the drawings.
   *
   * @param currentProjection - The current projection code
   * @param previousProjection - The previous projection code
   * @param displayLanguage - The current display language for updating measurement tooltips after reprojection
   */
  #handleMapReprojection(
    currentProjection: TypeValidMapProjectionCodes,
    previousProjection: TypeValidMapProjectionCodes,
    displayLanguage: TypeDisplayLanguage
  ): void {
    if (previousProjection) {
      const features = this.#getDrawingFeatures();
      features.forEach((feature) => {
        const geometry = feature.getGeometry();
        if (!geometry) return;

        geometry.transform(Projection.PROJECTIONS[previousProjection], Projection.PROJECTIONS[currentProjection]);
        this.#updateMeasurementTooltips(displayLanguage);
      });
    }
  }

  // #region DRAWING HANDLERS

  /**
   * Creates a handler for draw end events.
   */
  #handleDrawEnd() {
    // Get the map id
    const mapId = this.getMapId();

    return (_sender: unknown, event: DrawEvent): void => {
      if (!isStoreDrawerInitialized(mapId)) return;

      const currentGeomType = getStoreActiveGeom(mapId);
      const currentStyle = getStoreStyle(mapId);

      const viewer = this.getMapViewer();
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
      DrawerController.#setFeatureProperties(feature, currentGeomType, currentStyle, getStoreIconSrc(mapId));

      // Add overlays to non-point features
      if (!(geom instanceof Point)) {
        // GV hideMeasurements has to be here, otherwise the value can be stale, unlike style and geomType which restart the interaction
        const hideMeasurements = getStoreHideMeasurements(mapId);
        const newOverlay = DrawerController.#createMeasureTooltip(feature, hideMeasurements, getStoreDisplayLanguage(mapId));
        if (newOverlay) {
          viewer.map.addOverlay(newOverlay);
        }
      }

      this.getGeometryApi().geometries.push(feature);
      this.getGeometryApi().addToGeometryGroup(feature, DrawerController.DRAW_GROUP_KEY);

      this.#saveToHistory({
        type: 'add',
        features: [feature],
      });

      // For text features, create a temporary transform for immediate editing
      if (currentGeomType === 'Text') {
        const drawInstance = getStoreDrawInstance(mapId);
        drawInstance?.stopInteraction();

        const featureCollection = new Collection([feature]); // Only select this specific feature
        const tempTransform = viewer.initTransformInteractions({
          geometryGroupKey: DrawerController.DRAW_GROUP_KEY,
          features: featureCollection,
        });

        // Keep track of this temp transform instance for cleanup
        DrawerController.#tempTransformInstances.set(mapId, tempTransform);

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
            this.#cleanupTempTransform();

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
   * Creates a handler for transform end events.
   *
   * The current transform action has ended and the new geometry and style are applied to the feature.
   */
  #handleTransformEnd() {
    // Get the map id
    const mapId = this.getMapId();

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

        this.setTextValue(textValue);
        this.setTextSize(finalSize);
        this.setTextBold(isBold);
        this.setTextItalic(isItalic);
        this.setTextRotation(rotation);
      }

      const geom = feature.getGeometry();
      if (!geom) return;
      if (geom instanceof Point) return;

      // Update the overlay with new values
      DrawerController.#createMeasureTooltip(feature, true, getStoreDisplayLanguage(mapId));

      // Update the undo redo state
      this.#updateUndoRedoState();
    };
  }

  /**
   * Creates a handler for transform delete feature events.
   *
   */
  #handleTransformDeleteFeature() {
    // Get the map id
    const mapId = this.getMapId();

    return (_sender: unknown, event: TransformDeleteFeatureEvent) => {
      const { feature } = event;

      // Save the delete state
      this.#saveToHistory({
        type: 'delete',
        features: [feature],
      });

      const featureId = feature.getId();
      if (featureId) {
        this.deleteSingleDrawing(featureId as string);
      }

      setStoreSelectedDrawing(mapId, undefined);
      this.#updateUndoRedoState();
    };
  }

  /**
   * Creates a handler for transform selection change events.
   */
  #handleTransformSelectionChange() {
    // Get the map id
    const mapId = this.getMapId();

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
            {
              type: 'select',
              features: [previousFeature],
            },
            true
          );
        } else {
          const stateKey = `${mapId}-${previousFeature.getId()}`;
          const savedState = DrawerController.#selectedFeatureState.get(stateKey);

          if (savedState) {
            const currentGeometry = previousFeature.getGeometry();

            // Check for changes
            const geometryChanged = currentGeometry && !GeoUtilities.geometriesAreEqual(savedState.originalGeometry, currentGeometry);
            const styleChanged =
              savedState.originalStyleStored && savedState.originalStyle && savedState.originalStyle !== previousFeature.getStyle();

            if (geometryChanged || styleChanged) {
              // Save modify action - include geometry and style only if it was changed
              this.#saveToHistory({
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
          DrawerController.#selectedFeatureState.set(stateKey, {
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

        const featureProperties = DrawerController.#getFeatureProperties(newFeature, getStoreStyle(mapId));
        updateStoreStateStyle(mapId, featureProperties);
      }

      setStoreSelectedDrawing(mapId, newFeature);

      // Update the undo redo state
      this.#updateUndoRedoState();
    };
  }

  /**
   * Sets up keyboard event handling for undo (Ctrl+Z) and redo (Ctrl+Shift+Z / Ctrl+Y).
   */
  #hookKeyboardHandlers(): void {
    // Get the map id
    const mapId = this.getMapId();

    if (DrawerController.#keyboardHandlers.has(mapId)) return;

    const handler = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'z':
            if (event.shiftKey) {
              if (this.redo()) event.preventDefault();
            } else if (this.undo()) {
              event.preventDefault();
            }
            break;
          case 'y':
            if (this.redo()) event.preventDefault();
            break;
          default:
            break;
        }
      }
    };

    DrawerController.#keyboardHandlers.set(mapId, handler);
    document.addEventListener('keydown', handler);
  }

  // #endregion DOMAIN HANDLERS

  // #region STATIC METHODS

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

  // #endregion STATIC METHODS
}

/**
 * Hook to access the DrawerController from the controller context.
 *
 * @returns The drawer controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider.
 * @throws {Error} When the Drawer plugin is not configured.
 */
export function useDrawerController(): DrawerController {
  const controller = useControllers().drawerController;
  if (!controller) throw new Error('useDrawerController must be used with an initialized drawer plugin state');
  return controller;
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
