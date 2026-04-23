import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import { Circle as CircleGeom, LineString } from 'ol/geom';
import type Geometry from 'ol/geom/Geometry';
import Point from 'ol/geom/Point';
import Polygon, { fromCircle } from 'ol/geom/Polygon';
import type SimpleGeometry from 'ol/geom/SimpleGeometry';
import type { DrawEvent, GeometryFunction, SketchCoordType } from 'ol/interaction/Draw';
import { createBox } from 'ol/interaction/Draw';
import Overlay from 'ol/Overlay';
import { getArea, getLength } from 'ol/sphere';
import { Text, Fill, Icon as OLIcon, Stroke, Style } from 'ol/style';
import type { StyleLike } from 'ol/style/Style';

import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import {
  DEFAULT_TEXT_VALUES,
  getStoreDrawerActiveGeom,
  getStoreDrawerHideMeasurements,
  getStoreDrawerIconSrc,
  getStoreDrawerIsDrawing,
  getStoreDrawerIsEditing,
  getStoreDrawerIsSnapping,
  getStoreDrawerStyle,
  isStoreDrawerInitialized,
  updateStoreStateStyle,
  setStoreActiveGeom,
  setStoreDrawerIconSize,
  setStoreDrawerIconSrc,
  setStoreFillColor,
  setStoreHideMeasurements,
  setStoreRedoDisabled,
  setStoreSelectedDrawingType,
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
  setStoreUndoDisabled,
  setStoreIsDrawing,
  setStoreIsEditing,
  setStoreIsSnapping,
  type StyleProps,
} from '@/core/stores/store-interface-and-intial-values/drawer-state';
import type { DomainLanguageChangedDelegate, DomainLanguageChangedEvent, UIDomain } from '@/core/domains/ui-domain';
import type { MapProjectionChangedDelegate, MapProjectionChangedEvent, MapViewer } from '@/geo/map/map-viewer';
import type {
  Transform,
  TransformDeleteFeatureEvent,
  TransformEvent,
  TransformSelectionEvent,
} from '@/geo/interaction/transform/transform';
import type { Draw } from '@/geo/interaction/draw';
import type { Snap } from '@/geo/interaction/snap';
import { formatArea, formatLength, generateId } from '@/core/utils/utilities';
import { GeoUtilities } from '@/geo/utils/utilities';
import { getStoreAppDisplayLanguage } from '@/core/stores/store-interface-and-intial-values/app-state';
import { logger } from '@/core/utils/logger';

/**
 * Controller responsible for drawer interactions, keyboard shortcuts, and
 * bridging the drawer state with the UI domain and map projection changes.
 */
export class DrawerController extends AbstractMapViewerController {
  /** The geometry group key used for all drawer features */
  static readonly DRAW_GROUP_KEY = 'draw-group';

  /** Maximum history size */
  static readonly MAX_HISTORY_SIZE = 50;

  /** Tolerance for comparing style values */
  static readonly STYLE_TOLERANCE = 0.1;

  /** Keyboard event handlers for each map keyed by map id. */
  #keyboardHandler?: (event: KeyboardEvent) => void;

  /** The current draw interaction instance */
  #drawInstance?: Draw;

  /** The current transform interaction instance */
  #transformInstance?: Transform;

  /** The current snap interaction instance */
  #snapInstance?: Snap;

  /** Keep track of the temporary transform instances for new text drawings */
  #tempTextTransformInstance?: Transform;

  /** Track features that were selected and their original geometries */
  // GV The Map was because the transform COULD select multiple features
  // GV It may not be necessary as I'm not sure we should support that
  #selectedFeatureState?: {
    feature: Feature;
    originalGeometry: Geometry;
    originalStyle?: StyleLike | undefined;
    originalStyleStored?: boolean;
  };

  /** History stack for undo/redo functionality */
  #drawerHistory: DrawerHistoryAction[] = [];

  /** Current position in history stack for each map */
  #historyIndex: number = -1;

  /** The default icon source as a base64-encoded SVG data URI */
  static readonly DEFAULT_ICON_SOURCE =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgMkM4LjEzIDIgNSA1LjEzIDUgOWMwIDUuMjUgNyAxMyA3IDEzczctNy43NSA3LTEzYzAtMy44Ny0zLjEzLTctNy03bTAgOS41Yy0xLjM4IDAtMi41LTEuMTItMi41LTIuNXMxLjEyLTIuNSAyLjUtMi41IDIuNSAxLjEyIDIuNSAyLjUtMS4xMiAyLjUtMi41IDIuNSIgZmlsbD0icmdiYSgyNTIsIDI0MSwgMCwgMC4zKSIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjEuMyIvPjwvc3ZnPg==';

  /** The UI Domain instance associated with this controller. */
  #uiDomain: UIDomain;

  /** The language changed event hook. */
  #hookLanguageChanged?: DomainLanguageChangedDelegate;

  /** The map projection changed event subscription reference. */
  #hookMapProjectionChanged?: MapProjectionChangedDelegate;

  /**
   * Creates an instance of DrawerController.
   *
   * @param mapViewer - The map viewer instance to associate with this controller
   * @param controllerRegistry - The controller registry for accessing sibling controllers
   * @param uiDomain - The UI domain instance to associate with this controller
   */
  constructor(mapViewer: MapViewer, controllerRegistry: ControllerRegistry, uiDomain: UIDomain) {
    super(mapViewer, controllerRegistry);

    // Keep a reference on the UI domain
    this.#uiDomain = uiDomain;
  }

  // #region OVERRIDES

  /**
   * Hooks the controller into action.
   */
  protected override onHook(): void {
    // Setup the keyboard handlers for undo/redo
    this.#hookKeyboardHandlers();

    // Listen when the language is changed in the UI domain
    this.#hookLanguageChanged = this.#uiDomain.onLanguageChanged(this.#handleDisplayLanguageChanged.bind(this));

    // Listen when the map projection changes on the MapViewer
    this.#hookMapProjectionChanged = this.getMapViewer().onMapProjectionChanged(this.#handleMapReprojection.bind(this));
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
    if (this.#hookMapProjectionChanged) {
      this.getMapViewer().offMapProjectionChanged(this.#hookMapProjectionChanged);
      this.#hookMapProjectionChanged = undefined;
    }

    // Remove keyboard handler
    const handler = this.#keyboardHandler;
    if (handler) {
      document.removeEventListener('keydown', handler);
      this.#keyboardHandler = undefined;
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
    if (!getStoreDrawerIsEditing(mapId)) {
      viewer.unregisterMapPointerHandlers(viewer.map);
    }

    // If editing already, stop it
    // GV Moved the stop editing up so the rotation is set properly for any active text drawing
    if (getStoreDrawerIsEditing(mapId)) {
      this.stopEditing();
    }

    // Get current state values if not provided
    const currentGeomType = geomType || getStoreDrawerActiveGeom(mapId);
    const currentStyle = styleInput || getStoreDrawerStyle(mapId);

    // Make new text horizontal, regardless of what the state rotation was
    // GV If a style input is added for the rotation, then this can be removed
    currentStyle.textRotation = 0;

    // If drawing already, stop and restart as it's likely a style change
    if (this.#drawInstance) {
      this.stopDrawing();
    }

    // Record of GeometryFunctions for creating custom geometries
    const customGeometries: Record<string, GeometryFunction> = {
      Star: (coordinates: SketchCoordType, geometry: SimpleGeometry): Polygon => {
        const svgPath =
          'm 7.61,20.13 8.22,7.04 -2.51,10.53 9.24,-5.64 9.24,5.64 L29.29,27.17 37.51,20.13 26.72,19.27 22.56,9.27 18.4,19.27 Z';
        return DrawerController.#svgPathToGeometry(svgPath, coordinates, geometry);
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
    this.#setDrawInstance(draw);
    if (geomType) {
      this.setActiveGeom(geomType);
    }

    if (getStoreDrawerIsSnapping(mapId)) {
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
    if (!getStoreDrawerIsEditing(mapId)) {
      const viewer = this.getMapViewer();
      viewer.registerMapPointerHandlers(viewer.map);
    }

    this.#drawInstance?.stopInteraction();

    // Update state
    this.#setDrawInstance(undefined);
  }

  /**
   * Toggles the drawing state.
   */
  toggleDrawing(): void {
    // Get the map id
    const mapId = this.getMapId();

    if (!isStoreDrawerInitialized(mapId)) return;

    if (getStoreDrawerIsDrawing(mapId)) {
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

    if (!getStoreDrawerIsDrawing(mapId)) {
      viewer.unregisterMapPointerHandlers(viewer.map);
    }

    const oldTransformInstance = this.#transformInstance;

    // If editing already, stop and restart as it's likely a style change
    if (oldTransformInstance) {
      oldTransformInstance.stopInteraction();
      this.#setTransformInstance(undefined);
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

      this.#setTransformInstance(transformInstance);
    } else {
      this.startDrawing();
      return;
    }

    // If we have an active drawing instance, stop it
    const drawInstance = this.#drawInstance;
    if (drawInstance) {
      this.stopDrawing();
    }

    if (getStoreDrawerIsSnapping(mapId)) {
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

    if (!getStoreDrawerIsDrawing(mapId)) {
      const viewer = this.getMapViewer();
      viewer.registerMapPointerHandlers(viewer.map);
    }

    const transformInstance = this.#transformInstance;

    if (!transformInstance) return;
    transformInstance.stopInteraction();
    this.#setTransformInstance(undefined);
  }

  /**
   * Toggles the editing state.
   */
  toggleEditing(): void {
    // Get the map id
    const mapId = this.getMapId();

    if (!isStoreDrawerInitialized(mapId)) return;

    const isEditing = getStoreDrawerIsEditing(mapId);
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

    this.#setSnapInstance(snapInstance);
  }

  /**
   * Stops snapping interactions.
   */
  stopSnapping(): void {
    // Get the map id
    const mapId = this.getMapId();

    if (!isStoreDrawerInitialized(mapId)) return;

    const snapInstance = this.#snapInstance;
    snapInstance?.stopInteraction();

    this.#setSnapInstance(undefined);
  }

  /**
   * Toggles the snapping state.
   */
  toggleSnapping(): void {
    // Get the map id
    const mapId = this.getMapId();
    if (!isStoreDrawerInitialized(mapId)) return;

    const isSnapping = getStoreDrawerIsSnapping(mapId);
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
   * @param saveHistory - Optional flag to determine whether to save this action to history (default: true)
   */
  clearDrawings(saveHistory: boolean = true): void {
    // Get the map id
    const mapId = this.getMapId();

    if (!isStoreDrawerInitialized(mapId)) return;

    this.#stopAllInteractions();

    // Get all geometries for each type
    const features = this.#getDrawingFeatures();

    // Set the history, only if this isn't from a redo
    if (saveHistory && features.length > 0) {
      this.#saveToHistory({
        type: 'clear',
        features: features,
      });
    }

    // Remove all tooltips
    features.forEach((feature) => {
      const measureTooltip = feature.get('measureTooltip');
      measureTooltip?.getElement()?.remove();
    });

    // Delete all geometries from the group
    this.getGeometryApi().deleteGeometriesFromGroup(DrawerController.DRAW_GROUP_KEY);

    if (getStoreDrawerIsEditing(mapId)) {
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
    if (getStoreDrawerIsDrawing(mapId)) {
      this.startDrawing();
    }

    // If editing, restart editing
    // Do this after the start drawing so the group is created if missing
    if (getStoreDrawerIsEditing(mapId)) {
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

    if (getStoreDrawerIsSnapping(mapId)) {
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

    const hideMeasurements = getStoreDrawerHideMeasurements(mapId);
    const selectedFeature = this.#selectedFeatureState?.feature;
    if (!selectedFeature) return;

    const selectedDrawingId = selectedFeature?.get('featureId');

    // Get all overlays, ignoring currently selected features
    const features = this.#getDrawingFeatures();
    const measureOverlays = features
      .filter((feature) => feature.get('featureId') !== selectedDrawingId)
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
    // Save to the store
    setStoreActiveGeom(this.getMapId(), geomType);

    // Refresh
    this.refreshInteractionInstances();
  }

  /**
   * Sets the fill color in the store and updates the feature style.
   *
   * @param fillColor - The fill color value
   */
  setFillColor(fillColor: string): void {
    // Save to the store
    setStoreFillColor(this.getMapId(), fillColor);

    // Update the feature style at large
    this.updateFeatureStyle();
  }

  /**
   * Sets the stroke color in the store and updates the feature style.
   *
   * @param strokeColor - The stroke color value
   */
  setStrokeColor(strokeColor: string): void {
    // Save to the store
    setStoreStrokeColor(this.getMapId(), strokeColor);

    // Update the feature style at large
    this.updateFeatureStyle();
  }

  /**
   * Sets the stroke width in the store and updates the feature style.
   *
   * @param strokeWidth - The stroke width value
   */
  setStrokeWidth(strokeWidth: number): void {
    // Save to the store
    setStoreStrokeWidth(this.getMapId(), strokeWidth);

    // Update the feature style at large
    this.updateFeatureStyle();
  }

  /**
   * Sets the drawer icon source in the store.
   *
   * @param iconSrc - The icon source value
   */
  setDrawerIconSrc(iconSrc: string): void {
    // Save to the store
    setStoreDrawerIconSrc(this.getMapId(), iconSrc);

    // TODO: DRAWER - Drawing icon issue when you click on a different point icon, it will have it's style overwritten by the current style

    // Update the feature style at large
    this.updateFeatureStyle();
  }

  /**
   * Sets the icon size in the store and updates the feature style.
   *
   * @param iconSize - The icon size value
   */
  setDrawerIconSize(iconSize: number): void {
    // Save to the store
    setStoreDrawerIconSize(this.getMapId(), iconSize);

    // Update the feature style at large
    this.updateFeatureStyle();
  }

  /**
   * Sets the text value in the store and updates the feature style.
   *
   * @param text - The text content
   */
  setTextValue(text: string | string[]): void {
    // Save to the store
    setStoreTextValue(this.getMapId(), text);

    // Update the feature style at large
    this.updateFeatureStyle();
  }

  /**
   * Sets the text size in the store and updates the feature style.
   *
   * @param size - The text size in pixels
   */
  setTextSize(size: number): void {
    // Save to the store
    setStoreTextSize(this.getMapId(), size);

    // Update the feature style at large
    this.updateFeatureStyle();
  }

  /**
   * Sets the text font in the store and updates the feature style.
   *
   * @param font - The font family name
   */
  setTextFont(font: string): void {
    // Save to the store
    setStoreTextFont(this.getMapId(), font);

    // Update the feature style at large
    this.updateFeatureStyle();
  }

  /**
   * Sets the text color in the store and updates the feature style.
   *
   * @param color - The text color value
   */
  setTextColor(color: string): void {
    // Save to the store
    setStoreTextColor(this.getMapId(), color);

    // Update the feature style at large
    this.updateFeatureStyle();
  }

  /**
   * Sets the text halo color in the store and updates the feature style.
   *
   * @param color - The halo color value
   */
  setTextHaloColor(color: string): void {
    // Save to the store
    setStoreTextHaloColor(this.getMapId(), color);

    // Update the feature style at large
    this.updateFeatureStyle();
  }

  /**
   * Sets the text halo width in the store and updates the feature style.
   *
   * @param width - The halo width value
   */
  setTextHaloWidth(width: number): void {
    // Save to the store
    setStoreTextHaloWidth(this.getMapId(), width);

    // Update the feature style at large
    this.updateFeatureStyle();
  }

  /**
   * Sets the text bold state in the store and updates the feature style.
   *
   * @param bold - Whether the text should be bold
   */
  setTextBold(bold: boolean): void {
    // Save to the store
    setStoreTextBold(this.getMapId(), bold);

    // Update the feature style at large
    this.updateFeatureStyle();
  }

  /**
   * Sets the text italic state in the store and updates the feature style.
   *
   * @param italic - Whether the text should be italic
   */
  setTextItalic(italic: boolean): void {
    // Save to the store
    setStoreTextItalic(this.getMapId(), italic);

    // Update the feature style at large
    this.updateFeatureStyle();
  }

  /**
   * Sets the text rotation in the store and updates the feature style.
   *
   * @param rotation - The rotation angle
   */
  setTextRotation(rotation: number): void {
    // Save to the store
    setStoreTextRotation(this.getMapId(), rotation);

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
    if (this.#drawInstance !== undefined && !this.#tempTextTransformInstance) {
      this.startDrawing();
    }

    this.updateTransformingFeatureStyle(getStoreDrawerStyle(mapId));
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

    // Check both the main transform and the temp text transform
    const transformInstance = this.#transformInstance || this.#tempTextTransformInstance;
    if (!transformInstance) return;

    const selectedFeature = transformInstance.getSelectedFeature();
    if (!selectedFeature) return;

    // Store original style if not already stored
    if (this.#selectedFeatureState) {
      if (!this.#selectedFeatureState.originalStyleStored) {
        this.#selectedFeatureState.originalStyle = selectedFeature.getStyle();
        this.#selectedFeatureState.originalStyleStored = true;
      }

      // Apply the new style
      let featureStyle;
      let geomType: string;
      const isTextFeature = selectedFeature.get('text') !== undefined;

      if (selectedFeature.getGeometry() instanceof Point && !isTextFeature) {
        geomType = 'Point';
        featureStyle = new Style({
          image: new OLIcon({
            src: getStoreDrawerIconSrc(mapId),
            anchor: [0.5, 1],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            scale: (newStyle.iconSize || 24) / 24,
          }),
        });
      } else if (isTextFeature) {
        geomType = 'Text';

        // New style values from the store
        let currentTextSize = newStyle.textSize;
        let currentRotation = newStyle.textRotation;

        // Styles from the feature properties
        const featureSize = selectedFeature.get('textSize') as number;
        const featureRotation = selectedFeature.get('textRotation') as number;

        // Size is different from store, so the handles were used. Update the style and properties
        if (newStyle.textSize && Math.abs(newStyle.textSize - featureSize) < DrawerController.STYLE_TOLERANCE) {
          currentTextSize = featureSize;
        }

        // Rotation is different from the store, so the handle was used. Update the style and properties
        // GV Currently the only way to change the rotation is with the handle, but if a UI element is added, then this will be needed
        if (newStyle.textRotation && Math.abs(newStyle.textRotation - featureRotation) < DrawerController.STYLE_TOLERANCE) {
          currentRotation = featureRotation;
        }

        featureStyle = new Style({
          text: new Text({
            text: newStyle.text || selectedFeature.get('text'),
            fill: new Fill({ color: newStyle.textColor }),
            stroke: new Stroke({ color: newStyle.textHaloColor, width: newStyle.textHaloWidth }),
            font: `${newStyle.textItalic ? 'italic ' : ''}${newStyle.textBold ? 'bold ' : ''}${currentTextSize}px ${newStyle.textFont}`,
            rotation: currentRotation,
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

      // Update properties for point and other geometries
      DrawerController.#setFeatureProperties(selectedFeature, geomType, newStyle, getStoreDrawerIconSrc(mapId));

      // Set the new feature properties and style
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

    // If drawing, use it's undo if possible
    const drawInstance = this.#drawInstance;
    if (drawInstance) {
      const undoResult = drawInstance.undo();
      if (undoResult) {
        return true;
      }

      // If undo not possible, stop drawing
      drawInstance.stopInteraction();
      this.#setDrawInstance(undefined);
      return true;
    }

    // If editing, undo the transform instance
    const transformInstance = this.#transformInstance;
    if (transformInstance && transformInstance.getSelectedFeature()) {
      if (transformInstance.canUndo()) {
        return transformInstance.undo(() => {
          this.#updateUndoRedoState();
        });
      }
    }

    const history = this.#drawerHistory;
    const currentIndex = this.#historyIndex;

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

    this.#historyIndex = currentIndex - 1;
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
    const transformInstance = this.#transformInstance;
    if (transformInstance && transformInstance.getSelectedFeature()) {
      if (transformInstance.canRedo()) {
        return transformInstance.redo(() => {
          this.#updateUndoRedoState();
        });
      }
    }

    const history = this.#drawerHistory;
    const currentIndex = this.#historyIndex;

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
      this.#historyIndex = nextIndex;
    }
    this.#updateUndoRedoState();
    return true;
  }

  /**
   * Cleans up resources for a map.
   */
  cleanup(): void {
    // Clear history
    this.#drawerHistory = [];
    this.#historyIndex = -1;

    // Clean up selected feature states for this map
    this.#selectedFeatureState = undefined;
  }

  // #endregion PUBLIC METHODS - HISTORY

  // #region PUBLIC METHODS - DOWNLOAD

  /**
   * Downloads drawings as GeoJSON with embedded styles.
   *
   */
  downloadDrawings(): void {
    const features = this.#getDrawingFeatures();
    if (features.length === 0) return;

    // Get current map projection
    const mapProjection = this.getMapViewer().getProjection();

    // Convert to GeoJSON with style properties
    const geojson = {
      type: 'FeatureCollection',
      features: features
        .map((feature) => {
          const olStyle = feature.getStyle() as Style;
          const geometry = feature.getGeometry();

          // Extract style properties from feature style
          const styleProps: TypeGeoJSONStyleProps = olStyle && geometry ? DrawerController.#getStyleProperties(olStyle) : {};

          if (!geometry) return undefined;

          // Clone geometry and transform to WGS84
          const clonedGeometry = geometry.clone();
          clonedGeometry.transform(mapProjection, 'EPSG:4326');

          return {
            type: 'Feature',
            geometry: new GeoJSON().writeGeometryObject(clonedGeometry),
            properties: {
              id: feature.get('featureId'),
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
        const mapProjection = this.getMapViewer().getProjection();

        const newFeatures: Feature[] = [];
        geojson.features.forEach((geoFeature: GeoJsonFeature) => {
          const olGeometry = new GeoJSON().readGeometry(geoFeature.geometry);
          olGeometry.transform('EPSG:4326', mapProjection);

          const feature = new Feature({ geometry: olGeometry });

          // Apply style from properties
          const styleProps = geoFeature.properties.style || undefined;
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
            const hideMeasurements = getStoreDrawerHideMeasurements(mapId);
            const newOverlay = DrawerController.#createMeasureTooltip(feature, hideMeasurements, getStoreAppDisplayLanguage(mapId));
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
    const tempTransform = this.#tempTextTransformInstance;
    if (tempTransform) {
      tempTransform.clearSelection();
      tempTransform.stopInteraction();
      this.#tempTextTransformInstance = undefined;
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

    const foundFeature = allDrawingFeatures.find((feature) => feature.get('featureId') === featureId);

    return foundFeature;
  }

  /**
   * Updates all measurement tooltips for a map with the current language.
   *
   * @param displayLanguage - The display language
   */
  #updateMeasurementTooltips(displayLanguage: TypeDisplayLanguage): void {
    // TODO: Update measurements to use styles, similar to the measurement navbar tool, since overlays aren't exported
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

    // Get features from drawing group
    const geometryGroup = this.getGeometryApi().getGeometryGroup(DrawerController.DRAW_GROUP_KEY);
    const features = geometryGroup?.vectorSource.getFeatures();
    if (!features) {
      return [];
    }
    return features;
  }

  /**
   * Stops all active interactions (drawing, editing)
   */
  #stopAllInteractions(): void {
    const drawInstance = this.#drawInstance;
    if (drawInstance) {
      drawInstance.finishDrawing();
      this.stopDrawing();
    }

    // End any active transform instance
    const transformInstance = this.#transformInstance;
    if (transformInstance) {
      this.stopEditing();
    }
  }

  // #endregion PRIVATE METHODS - DRAWING

  // #region PRIVATE METHODS - HISTORY

  /**
   * Sets the draw instance for the drawer controller and updates the flag in the store
   *
   * @param drawInstance - The draw instance to set
   */
  #setDrawInstance(drawInstance: Draw | undefined): void {
    const mapId = this.getMapId();

    this.#drawInstance = drawInstance;
    setStoreIsDrawing(mapId, !!drawInstance);
  }

  /**
   * Sets the transform instance for the drawer controller and updates the flag in the store
   *
   * @param transformInstance - The transform instance to set
   */
  #setTransformInstance(transformInstance: Transform | undefined): void {
    const mapId = this.getMapId();

    this.#transformInstance = transformInstance;
    setStoreIsEditing(mapId, !!transformInstance);
  }

  /**
   * Sets the snap instance for the drawer controller and updates the flag in the store
   *
   * @param snapInstance - The snap instance to set
   */
  #setSnapInstance(snapInstance: Snap | undefined): void {
    const mapId = this.getMapId();

    this.#snapInstance = snapInstance;
    setStoreIsSnapping(mapId, !!snapInstance);
  }

  /**
   * Saves an action to the drawer history.
   *
   * @param action - The action to save
   * @param insertAtCurrentIndex - Whether to create the action as the next action / as a redo
   */
  #saveToHistory(action: DrawerHistoryAction, insertAtCurrentIndex: boolean = false): void {
    const history = this.#drawerHistory;
    const currentIndex = this.#historyIndex;

    // Clone all features to prevent shared references with map features
    const clonedAction: DrawerHistoryAction = {
      ...action,
      features: action.features.map((feature) => feature.clone()),
    };

    if (insertAtCurrentIndex) {
      // Insert right after current index for redo capability
      history.splice(currentIndex + 1, 0, clonedAction);
      // Don't update the index - stay at current position
    } else {
      // Remove any history after current index
      history.splice(currentIndex + 1);

      // Add new action
      history.push(clonedAction);
      this.#historyIndex = history.length - 1;
    }

    // Update undo/redo state
    this.#updateUndoRedoState();

    // Limit history size
    if (history.length > DrawerController.MAX_HISTORY_SIZE) {
      history.shift();
      if (!insertAtCurrentIndex) {
        this.#historyIndex -= 1;
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
      const clonedFeature = feature.clone();
      clonedFeature.setId(feature.get('featureId'));
      this.getGeometryApi().geometries.push(clonedFeature);
      this.getGeometryApi().addToGeometryGroup(clonedFeature, DrawerController.DRAW_GROUP_KEY);

      // Add to transform instance if editing is active
      const transformInstance = this.#transformInstance;
      if (transformInstance) {
        transformInstance.addFeature(clonedFeature);
      }

      // Recreate measurement overlay
      const geom = clonedFeature.getGeometry();
      if (geom && !(geom instanceof Point)) {
        const overlay = DrawerController.#createMeasureTooltip(clonedFeature, false, getStoreAppDisplayLanguage(mapId));
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
      const currentFeature = this.#getFeatureById(feature.get('featureId'));
      if (currentFeature) {
        // Restore modified geometry if it exists
        if (action.modifiedGeometries && action.modifiedGeometries[index]) {
          currentFeature.setGeometry(action.modifiedGeometries[index].clone());

          // Recreate measurement overlay only if geometry changed
          const geom = currentFeature.getGeometry();
          if (geom && !(geom instanceof Point)) {
            const overlay = DrawerController.#createMeasureTooltip(currentFeature, false, getStoreAppDisplayLanguage(mapId));
            if (overlay) viewer.map.addOverlay(overlay);
          }
        }

        // Restore modified style if it exists
        if (action.modifiedStyles && action.modifiedStyles[index]) {
          const modifiedStyle = action.modifiedStyles[index];
          if (modifiedStyle && modifiedStyle instanceof Style) {
            currentFeature.setStyle(modifiedStyle);
          }
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
      const currentFeature = this.#getFeatureById(feature.get('featureId'));
      if (currentFeature) {
        if (action.originalGeometries && action.originalGeometries[index]) {
          // Restore geometry
          currentFeature.setGeometry(action.originalGeometries[index].clone());

          // Recreate overlay
          const geom = currentFeature.getGeometry();
          if (geom && !(geom instanceof Point)) {
            const overlay = DrawerController.#createMeasureTooltip(currentFeature, false, getStoreAppDisplayLanguage(mapId));
            if (overlay) viewer.map.addOverlay(overlay);
          }
        }

        // Restore style
        if (action.originalStyles && action.originalStyles[index]) {
          const originalStyle = action.originalStyles[index];
          if (originalStyle && originalStyle instanceof Style) {
            currentFeature.setStyle(originalStyle);
          }
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

    const transformInstance = this.#transformInstance;
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

    const transformInstance = this.#transformInstance;
    if (transformInstance && transformInstance.getSelectedFeature()) {
      const undoDisabled = !transformInstance.canUndo();
      const redoDisabled = !transformInstance.canRedo();

      setStoreUndoDisabled(mapId, undoDisabled);
      setStoreRedoDisabled(mapId, redoDisabled);
      return;
    }

    const history = this.#drawerHistory;
    const currentIndex = this.#historyIndex;

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
   * @param sender - The map viewer that sent the event
   * @param event - The map projection change event containing the previous and current projections
   */
  #handleMapReprojection(sender: MapViewer, event: MapProjectionChangedEvent): void {
    if (event.previousProjection) {
      this.#stopAllInteractions();

      const features = this.#getDrawingFeatures();
      features.forEach((feature) => {
        const geometry = feature.getGeometry();
        if (!geometry) return;

        geometry.transform(event.previousProjection, event.projection);
      });

      // Update tooltips once
      this.#updateMeasurementTooltips(sender.getDisplayLanguage());

      // Reproject all geometries in the history
      if (this.#drawerHistory) {
        this.#drawerHistory.forEach((action) => {
          // Reproject feature geometries
          action.features.forEach((feature) => {
            const geometry = feature.getGeometry();
            if (geometry) {
              geometry.transform(event.previousProjection, event.projection);
            }
          });

          // Reproject original geometries (for modify actions)
          action.originalGeometries?.forEach((geometry) => {
            geometry.transform(event.previousProjection, event.projection);
          });

          // Reproject modified geometries (for modify actions)
          action.modifiedGeometries?.forEach((geometry) => {
            geometry.transform(event.previousProjection, event.projection);
          });
        });
      }
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

      const currentGeomType = getStoreDrawerActiveGeom(mapId);
      const currentStyle = getStoreDrawerStyle(mapId);

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
            src: getStoreDrawerIconSrc(mapId),
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
      DrawerController.#setFeatureProperties(feature, currentGeomType, currentStyle, getStoreDrawerIconSrc(mapId));

      // Add overlays to non-point features
      if (!(geom instanceof Point)) {
        // GV hideMeasurements has to be here, otherwise the value can be stale, unlike style and geomType which restart the interaction
        const hideMeasurements = getStoreDrawerHideMeasurements(mapId);
        const newOverlay = DrawerController.#createMeasureTooltip(feature, hideMeasurements, getStoreAppDisplayLanguage(mapId));
        if (newOverlay) {
          viewer.map.addOverlay(newOverlay);
        }
      }

      this.getGeometryApi().geometries.push(feature);
      this.getGeometryApi().addToGeometryGroup(feature, DrawerController.DRAW_GROUP_KEY);

      // For non-text features, save to history immediately
      if (currentGeomType !== 'Text') {
        this.#saveToHistory({
          type: 'add',
          features: [feature],
        });
      }

      // For text features, create a temporary transform for immediate editing
      if (currentGeomType === 'Text') {
        const drawInstance = this.#drawInstance;
        drawInstance?.stopInteraction();

        const featureCollection = new Collection([feature]); // Only select this specific feature
        const tempTransform = viewer.initTransformInteractions({
          geometryGroupKey: DrawerController.DRAW_GROUP_KEY,
          features: featureCollection,
        });

        // Keep track of this temp transform instance for cleanup
        this.#tempTextTransformInstance = tempTransform;

        // Set the selected drawing type to Text so the style panel shows the correct options
        setStoreSelectedDrawingType(mapId, 'Text');

        // Initialize the selected feature state for the temp transform
        const currentGeometry = feature.getGeometry();
        if (currentGeometry) {
          this.#selectedFeatureState = {
            feature,
            originalGeometry: currentGeometry.clone(),
            originalStyleStored: false,
          };
        }

        let isDeselected = false;

        // Handle when the temporary editing is done
        tempTransform.onSelectionChange((_textSender, textEvent) => {
          const { previousFeature, newFeature } = textEvent;
          if (!newFeature && previousFeature && !isDeselected) {
            isDeselected = true;

            // Save text to history
            this.#saveToHistory({
              type: 'add',
              features: [previousFeature],
            });

            // Cleanup the temporary transform
            this.#cleanupTempTransform();

            // Reset the selected drawing type
            setStoreSelectedDrawingType(mapId, getStoreDrawerActiveGeom(mapId));

            // Resume drawing
            if (drawInstance) {
              drawInstance.startInteraction();
            }

            // Reset text rotation to 0. Can be removed in the future if added to UI
            this.setTextRotation(0);
          }
        });

        tempTransform.onTransformEnd(this.#handleTransformEnd());
        tempTransform.onDeleteFeature(this.#handleTransformDeleteFeature());

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
        const currentStyle = feature.getStyle();
        if (currentStyle instanceof Style && isStoreDrawerInitialized(mapId)) {
          const styleProps = DrawerController.#getStyleProperties(currentStyle);

          // Update store
          setStoreTextSize(mapId, styleProps.textSize || 18);
          setStoreTextRotation(mapId, styleProps.textRotation || 0);
          setStoreTextValue(mapId, styleProps.text || '');
          setStoreTextBold(mapId, styleProps.textBold || false);
          setStoreTextItalic(mapId, styleProps.textItalic || false);
        }
      }

      const geom = feature.getGeometry();
      if (!geom) return;
      if (geom instanceof Point) return;

      // Update the overlay with new values
      DrawerController.#createMeasureTooltip(feature, true, getStoreAppDisplayLanguage(mapId));

      // Update the undo redo state
      this.#updateUndoRedoState();
    };
  }

  /**
   * Creates a handler for transform delete feature events.
   *
   */
  #handleTransformDeleteFeature() {
    return (_sender: unknown, event: TransformDeleteFeatureEvent) => {
      const { feature } = event;

      // Save the delete state
      this.#saveToHistory({
        type: 'delete',
        features: [feature],
      });

      const featureId = feature.get('featureId');
      if (featureId) {
        this.deleteSingleDrawing(featureId as string);
      }

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
        hideMeasurements = getStoreDrawerHideMeasurements(mapId);
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
          const savedState = this.#selectedFeatureState;

          if (savedState) {
            const currentGeometry = previousFeature.getGeometry();

            // Check for changes
            const geometryChanged = currentGeometry && !GeoUtilities.geometriesAreEqual(savedState.originalGeometry, currentGeometry);
            const styleChanged =
              savedState.originalStyleStored &&
              savedState.originalStyle &&
              DrawerController.#stylesAreDifferent(savedState.originalStyle, previousFeature.getStyle());

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
        const currentGeometry = newFeature.getGeometry();

        if (currentGeometry) {
          this.#selectedFeatureState = {
            feature: newFeature,
            originalGeometry: currentGeometry.clone(),
            originalStyle: newFeature.getStyle(),
            originalStyleStored: true,
          };
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

        const featureProperties = DrawerController.#getFeatureStyleProperties(newFeature);
        updateStoreStateStyle(mapId, featureProperties);
      }

      const geomType = newFeature?.get('text') ? 'Text' : newFeature?.getGeometry()?.getType() || undefined;
      setStoreSelectedDrawingType(mapId, geomType);

      // Update the undo redo state
      this.#updateUndoRedoState();
    };
  }

  /**
   * Sets up keyboard event handling for undo (Ctrl+Z) and redo (Ctrl+Shift+Z / Ctrl+Y).
   */
  #hookKeyboardHandlers(): void {
    if (this.#keyboardHandler) return;

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

    this.#keyboardHandler = handler;
    document.addEventListener('keydown', handler);
  }

  // #endregion DOMAIN HANDLERS

  // #region STATIC METHODS

  /**
   * Extracts style properties from a feature.
   *
   * @param feature - The feature to extract properties from
   * @returns The extracted style properties
   */
  static #getFeatureStyleProperties(feature: Feature): StyleProps {
    return this.#getStyleProperties(feature.getStyle() as Style);
  }

  /**
   * Extracts style properties from a style object.
   *
   * @param style - The style object to extract properties from
   * @returns The extracted style properties
   */
  static #getStyleProperties(style: Style): StyleProps {
    const styleProps: StyleProps = {} as StyleProps;

    // Extract stroke/fill properties from the feature's style
    if (style) {
      const stroke = style.getStroke();
      const fill = style.getFill();
      const text = style.getText();
      const image = style.getImage();

      if (stroke) {
        styleProps.strokeColor = stroke.getColor() as string;
        styleProps.strokeWidth = stroke.getWidth() || 1.3;
      }

      if (fill) {
        styleProps.fillColor = fill.getColor() as string;
      }

      // Extract text properties from the Text style
      if (text) {
        styleProps.text = text.getText();
        styleProps.textColor = text.getFill()?.getColor() as string;
        styleProps.textHaloColor = text.getStroke()?.getColor() as string;
        styleProps.textHaloWidth = text.getStroke()?.getWidth() || 0;
        styleProps.textRotation = text.getRotation() || 0;

        const font = text.getFont();
        if (font) {
          const fontParts = font.split(' ');
          const sizeStr = fontParts.find((part) => part.endsWith('px'));
          if (sizeStr) {
            styleProps.textSize = parseFloat(sizeStr);
          }

          // Extract font family which comes after the size
          const sizeIndex = fontParts.findIndex((part) => part.endsWith('px'));
          if (sizeIndex !== -1 && sizeIndex < fontParts.length - 1) {
            styleProps.textFont = fontParts.slice(sizeIndex + 1).join(' ');
          }

          styleProps.textBold = fontParts.includes('bold');
          styleProps.textItalic = fontParts.includes('italic');
        }
      }

      // Extract icon properties from the Image style
      if (image instanceof OLIcon) {
        styleProps.iconSrc = image.getSrc();
        const scale = image.getScale();
        if (scale !== undefined) {
          // In our situation, it should always be a single number
          if (typeof scale === 'number') {
            styleProps.iconSize = scale * 24;
          } else {
            styleProps.iconSize = scale[0] * 24;
          }
        }
      }
    }

    return styleProps;
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
    // Get the measureTooltip for the feature if one already exists
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

  /**
   * Compares two styles by their properties rather than reference equality.
   *
   * @param style1 - First style to compare
   * @param style2 - Second style to compare
   * @returns Whether the styles have different properties
   */
  static #stylesAreDifferent(style1: StyleLike | undefined, style2: StyleLike | undefined): boolean {
    // If references are the same, styles are identical
    if (style1 === style2) return false;

    // If one is undefined/null and the other isn't, they're different
    if (!style1 || !style2) return true;

    // If either isn't a Style instance, can't compare
    if (!(style1 instanceof Style) || !(style2 instanceof Style)) return true;

    // Compare extracted properties
    const props1 = this.#getStyleProperties(style1);
    const props2 = this.#getStyleProperties(style2);

    return JSON.stringify(props1) !== JSON.stringify(props2);
  }

  // #endregion STATIC METHODS
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
  text?: string | string[];

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
