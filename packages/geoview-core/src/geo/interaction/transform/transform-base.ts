import OLMap from 'ol/Map';
import { Overlay, MapBrowserEvent } from 'ol';
import { Pointer as OLPointer } from 'ol/interaction';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import { Geometry, Point, Polygon, LineString, Circle } from 'ol/geom';
import { Style, Fill, Stroke, Circle as CircleStyle, Text, RegularShape } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Coordinate } from 'ol/coordinate';
import { Extent, getCenter } from 'ol/extent';

import { TransformEvent, TransformSelectionEvent, TransformDeleteFeatureEvent } from './transform-events';
import { MapViewer } from '@/app';

// #region Constants

// Handle style constants
const ROTATE_STYLE = new Style({
  text: new Text({
    text: '↻',
    fill: new Fill({
      color: 'rgba(100, 100, 100, 0.95)',
    }),
    font: 'bold 20px sans-serif',
  }),
});

const DELETE_STYLE = new Style({
  image: new RegularShape({
    points: 50,
    radius: 10,
    fill: new Fill({
      color: 'rgba(244, 67, 54, 0.95)',
    }),
    stroke: new Stroke({
      color: '#333',
      width: 1,
    }),
  }),
  text: new Text({
    text: '✕',
    fill: new Fill({
      color: '#fff',
    }),
    font: 'bold 14px sans-serif',
    offsetY: 1,
  }),
});

const SCALE_STYLE = new Style({
  image: new RegularShape({
    points: 50,
    radius: 8,
    fill: new Fill({
      color: 'rgba(160, 160, 160, 0.8)',
    }),
    stroke: new Stroke({
      color: '#333',
      width: 1,
    }),
  }),
});

const STRETCH_STYLE = new Style({
  image: new RegularShape({
    points: 4,
    radius: 8,
    angle: Math.PI / 4, // 45 degrees to make it a square
    fill: new Fill({
      color: 'rgba(160, 160, 160, 0.8)',
    }),
    stroke: new Stroke({
      color: '#333',
      width: 1,
    }),
  }),
});

const TRANSLATE_STYLE = new Style({
  image: new CircleStyle({
    radius: 8,
    fill: new Fill({
      color: 'rgba(0, 0, 0, 0.8)',
    }),
    stroke: new Stroke({
      color: '#333',
      width: 1,
    }),
  }),
});

const VERTEX_STYLE = new Style({
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({ color: 'rgba(255, 255, 255, 0.9)' }),
    stroke: new Stroke({ color: '#333', width: 2 }),
  }),
});

const EDGE_MIDPOINT_STYLE = new Style({
  image: new CircleStyle({
    radius: 4,
    fill: new Fill({ color: 'rgba(0, 255, 255, 0.7)' }),
    stroke: new Stroke({ color: '#333', width: 1 }),
  }),
});

const EXTENT_BOUNDARY_STYLE = new Style({
  stroke: new Stroke({
    color: 'rgba(100, 100, 100, 0.5)',
    width: 1,
    lineDash: [5, 5],
  }),
});

const ROTATE_LINE_STYLE = new Style({
  stroke: new Stroke({
    color: 'rgba(100, 100, 100, 0.5)',
    width: 1,
    lineDash: [5, 5],
  }),
});

/**
 * Handle types for the transform interaction
 */
export enum HandleType {
  BOUNDARY = 'boundary',
  ROTATE = 'rotate',
  ROTATE_LINE = 'rotate-line',
  SCALE = 'scale',
  TRANSLATE = 'translate',
  TRANSLATE_CENTER = 'translate-center',
  STRETCH_N = 'stretch-n',
  STRETCH_E = 'stretch-e',
  STRETCH_S = 'stretch-s',
  STRETCH_W = 'stretch-w',
  SCALE_NE = 'scale-ne',
  SCALE_SE = 'scale-se',
  SCALE_SW = 'scale-sw',
  SCALE_NW = 'scale-nw',
  DELETE = 'delete',
  VERTEX = 'vertex',
  EDGE_MIDPOINT = 'edge-midpoint',
}

/**
 * Options for the transform interaction
 */
export interface TransformBaseOptions {
  features?: Collection<Feature>;
  source?: VectorSource;
  translate?: boolean;
  scale?: boolean;
  rotate?: boolean;
  stretch?: boolean;
  keepAspectRatio?: boolean;
  hitTolerance?: number;
  enableDelete?: boolean;
  mapViewer?: MapViewer; // MapViewer type
}

export interface CreateHandleProps {
  vertexIndex?: number;
  isCircleCenter?: boolean;
  isCircleEdge?: boolean;
}

// #region Class Start

/**
 * OpenLayers Transform interaction
 * @class OLTransform
 * @extends {OLPointer}
 */
export class OLTransform extends OLPointer {
  /** The collection of features to transform */
  features: Collection<Feature>;

  /** The layer used to display handles */
  handleLayer: VectorLayer<VectorSource>;

  /** The source for the handle layer */
  handleSource: VectorSource;

  /** The currently selected feature */
  selectedFeature?: Feature;

  /** The current handle being dragged */
  currentHandle?: Feature;

  /** Options for the transform interaction */
  options: TransformBaseOptions;

  /** The start coordinates when dragging */
  startCoordinate?: Coordinate;

  /** The start geometry when transforming */
  startGeometry?: Geometry;

  /** The center of the feature being transformed */
  center?: Coordinate;

  /** The angle for rotation */
  angle = 0;

  /** The map viewer */
  mapViewer?: MapViewer;

  /** Flag to prevent recursion */
  #inHandleDownEvent = false;

  #inHandleDragEvent = false;

  #inHandleUpEvent = false;

  #inHandleMoveEvent = false;

  /** Flag to track if we're currently transforming */
  #isTransforming = false;

  /** The type of transformation being performed */
  #transformType?: HandleType;

  /** Flag to track if a vertex was already added during this drag operation */
  #vertexAdded = false;

  /** Text editing overlay for text features */
  #textEditOverlay?: Overlay;

  /** Flag to track if text editor is active */
  #isTextEditing = false;

  /** Text editor element reference */
  #textEditorElement?: HTMLDivElement;

  /** Original feature style (to restore after editing) */
  #originalTextStyle?: Style;

  /** Original text extent when scaling starts */
  #originalTextExtent?: Extent;

  /** Original text size when scaling starts */
  #originalTextSize?: number;

  /** Original text rotation when rotation starts */
  #originalTextRotation?: number;

  /** History stack for undo/redo functionality */
  #geometryHistory: Geometry[] = [];

  /** Current position in history stack */
  #historyIndex = -1;

  /** Maximum history size */
  #maxHistorySize = 50;

  /** Callback functions for events */
  onTransformstart?: (event: TransformEvent) => void;

  onTransforming?: (event: TransformEvent) => void;

  onTransformend?: (event: TransformEvent) => void;

  onDeletefeature?: (event: TransformDeleteFeatureEvent) => void;

  onSelectionChange?: (event: TransformSelectionEvent) => void;

  // #region Constructor

  /**
   * Initializes a OLTransform component.
   * @param {TransformBaseOptions} options - Object to configure the initialization.
   */
  constructor(options: TransformBaseOptions = {}) {
    super();

    this.options = {
      translate: true,
      scale: true,
      rotate: true,
      stretch: true,
      keepAspectRatio: false,
      hitTolerance: 5,
      enableDelete: true,
      ...options,
    };

    this.mapViewer = options.mapViewer;

    // Set up features collection
    if (options.features) {
      this.features = options.features;
    } else if (options.source) {
      this.features = new Collection(options.source.getFeatures());
    } else {
      this.features = new Collection<Feature>();
    }

    // Create a vector source and layer for the handles
    this.handleSource = new VectorSource();
    this.handleLayer = new VectorLayer({
      source: this.handleSource,
      zIndex: 1000,
    });

    // Set up feature collection change handlers
    this.features.on('remove', this.onFeatureRemove.bind(this));
  }

  // #region Methods

  /**
   * Handles when a feature is removed from the collection.
   * @param {Event} event - The event.
   */
  onFeatureRemove(event: { element: Feature }): void {
    const feature = event.element;

    // If this was the selected feature, clear the selection
    if (this.selectedFeature === feature) {
      this.clearSelection();
    }
  }

  /**
   * Selects a feature for transformation.
   * @param {Feature<Geometry>} feature - The feature to select.
   */
  selectFeature(feature: Feature<Geometry>): void {
    const previousFeature = this.selectedFeature;

    // Hide any existing text editor
    this.#hideTextEditor();

    // Clear history when changing selection
    this.#clearHistory();

    // Clear any existing selection
    this.clearHandles();

    // Set the selected feature
    this.selectedFeature = feature;

    // Set angle to actual rotation value for text features
    if (this.#isTextFeature(feature)) {
      this.angle = feature.get('textRotation') || 0;
    } else {
      this.angle = 0;
    }

    // Emit selection change event
    if (this.onSelectionChange) {
      this.onSelectionChange(new TransformSelectionEvent('selectionchange', previousFeature, feature));
    }

    this.createHandles();
  }

  /**
   * Checks if a feature is currently being transformed.
   * @param {Feature} feature - The feature to check.
   * @returns {boolean} True if the feature is being transformed.
   */
  isFeatureBeingTransformed(feature: Feature): boolean {
    return this.#isTransforming && this.selectedFeature === feature;
  }

  /**
   * Gets the currently selected/transforming feature.
   * @returns {Feature | undefined} The selected feature or undefined.
   */
  getSelectedFeature(): Feature | undefined {
    return this.selectedFeature;
  }

  /**
   * Checks if any transformation is currently active.
   * @returns {boolean} True if transformation is active.
   */
  isTransforming(): boolean {
    return this.#isTransforming;
  }

  /**
   * Clears the current selection.
   */
  clearSelection(): void {
    if (this.onSelectionChange) {
      this.onSelectionChange(new TransformSelectionEvent('selectionchange', this.selectedFeature, undefined));
    }

    this.#hideTextEditor();
    this.#clearHistory();
    this.clearHandles();
    this.selectedFeature = undefined;
  }

  /**
   * Gets padding based on map resolution for consistent visual spacing.
   * @returns {number} Padding in map units.
   */
  #getMapBasedPadding(): number {
    if (!this.mapViewer?.map) return 0; // fallback

    const view = this.mapViewer.map.getView();
    const resolution = view.getResolution() || 1;

    // 30 pixels converted to map units
    return resolution * 15;
  }

  // #region Helpers

  // ? TODO Could these two coordinate functions be moved to a utility file?
  /**
   * Rotates a coordinate around a center point by an angle.
   * @param {Coordinate} coordinate - The coordinate to rotate.
   * @param {Coordinate} center - The center point.
   * @param {number} angle - The angle in radians.
   * @returns {Coordinate} The rotated coordinate.
   */
  static rotateCoordinate(coordinate: Coordinate, center: Coordinate, angle: number): Coordinate {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = coordinate[0] - center[0];
    const dy = coordinate[1] - center[1];

    return [center[0] + dx * cos - dy * sin, center[1] + dx * sin + dy * cos];
  }

  /**
   * Scales a coordinate relative to a fixed point
   * @param {Coordinate} coordinate - The coordinate to scale.
   * @param {Coordinate} fixedPoint - The fixed point.
   * @param {number} scaleX - The X scale factor.
   * @param {number} scaleY - The Y scale factor.
   * @returns {Coordinate} The scaled coordinate.
   */
  static scaleCoordinate(coordinate: Coordinate, fixedPoint: Coordinate, scaleX: number, scaleY: number): Coordinate {
    const dx = coordinate[0] - fixedPoint[0];
    const dy = coordinate[1] - fixedPoint[1];

    return [fixedPoint[0] + dx * scaleX, fixedPoint[1] + dy * scaleY];
  }

  /**
   * Deletes a vertex from the geometry.
   * @param {Feature} vertexHandle - The vertex handle to delete.
   */
  #deleteVertex(vertexHandle: Feature): void {
    if (!this.selectedFeature) return;

    const vertexIndex = vertexHandle.get('vertexIndex');
    const geometry = this.selectedFeature.getGeometry();

    if (geometry instanceof LineString) {
      const coords = geometry.getCoordinates();
      // Don't allow deletion if it would leave less than 2 points
      if (coords.length <= 2) return;
      coords.splice(vertexIndex, 1);
      geometry.setCoordinates(coords);
    } else if (geometry instanceof Polygon) {
      const coords = geometry.getCoordinates();
      // Don't allow deletion if it would leave less than 4 points (including closing point)
      if (coords[0].length <= 4) return;
      coords[0].splice(vertexIndex, 1);

      // If we deleted the first vertex, update the last vertex to be the same as the new first
      // to properly close the polygon
      if (vertexIndex === 0) {
        coords[0][coords[0].length - 1] = coords[0][0];
      }

      geometry.setCoordinates(coords);
    }

    // Update handles after deletion
    this.updateHandles();
  }

  /**
   * Gets the handle feature at the specified coordinate.
   * @param {Coordinate} coordinate - The coordinate to check.
   * @param {OLMap} map - The map instance.
   * @returns {Feature | undefined} The handle feature if found.
   */
  #getHandleAtCoordinate(coordinate: Coordinate, map: OLMap): Feature | undefined {
    const pixel = map.getPixelFromCoordinate(coordinate);
    const hitTolerance = this.options.hitTolerance || 5;

    const features = map.getFeaturesAtPixel(pixel, {
      layerFilter: (layer) => layer === this.handleLayer,
      hitTolerance,
    });

    return features && features.length > 0 ? (features[0] as Feature) : undefined;
  }

  /** Context menu event handler to prevent context menu when removing vertices */
  contextMenuHandler = (e: MouseEvent): void => {
    if (this.selectedFeature) {
      e.preventDefault();
    }
  };

  /**
   * Cleans up the interaction.
   * @override
   */
  override dispose(): void {
    this.clearSelection();
  }

  // #region Handle Creation

  /**
   * Creates handles for the selected feature.
   */
  createHandles(): void {
    if (!this.selectedFeature) return;

    // For text features, show text editor instead of handles
    if (this.#isTextFeature()) {
      this.#createTextHandles();
      return;
    }

    const geometry = this.selectedFeature.getGeometry();
    if (!geometry) return;

    // Handles for Points
    if (geometry instanceof Point) {
      if (this.options.enableDelete) {
        const coords = geometry.getCoordinates();
        const offset = this.#getMapBasedPadding() * 2;
        this.createHandle([coords[0] + offset, coords[1] + offset], HandleType.DELETE);
      }
      return;
    }

    // Handles for Circles
    if (geometry instanceof Circle) {
      const center = geometry.getCenter();
      const radius = geometry.getRadius();
      const edgePoint: Coordinate = [center[0] + radius, center[1]];

      // Create center vertex (for moving)
      this.createHandle(center, HandleType.VERTEX, { vertexIndex: 0, isCircleCenter: true });

      // Create edge vertex (for resizing)
      this.createHandle(edgePoint, HandleType.VERTEX, { vertexIndex: 1, isCircleEdge: true });

      // Create delete handle
      if (this.options.enableDelete) {
        const offset = this.#getMapBasedPadding();
        this.createHandle([center[0] + radius + offset, center[1] + offset], HandleType.DELETE);
      }
      return;
    }

    // Handles for other geometries (LineString, Polygon)
    // Get the extent of the feature
    const extent = geometry.getExtent();
    const padding = this.#getMapBasedPadding();
    const expandedExtent: Extent = [extent[0] - padding, extent[1] - padding, extent[2] + padding, extent[3] + padding];
    const center = getCenter(extent);
    this.center = center;

    // Create extent boundary
    this.createExtentBoundary(expandedExtent);

    // Create handles based on the options
    if (this.options.scale) {
      this.createScaleHandles(expandedExtent);
    }

    if (this.options.stretch) {
      this.createStretchHandles(expandedExtent);
    }

    if (this.options.rotate) {
      this.createRotateHandle(expandedExtent);
    }

    if (this.options.enableDelete) {
      this.createDeleteHandle(expandedExtent);
    }

    if (geometry instanceof LineString || geometry instanceof Polygon) {
      this.createVertexHandles(geometry);
    }
  }

  /**
   * Creates a handle at the specified coordinate with the given type.
   * @param {Coordinate} coordinate - The coordinate for the handle.
   * @param {HandleType} type - The type of handle.
   */
  createHandle(coordinate: Coordinate, type: HandleType, properties?: CreateHandleProps): void {
    const handle = new Feature({
      geometry: new Point(coordinate),
      handleType: type,
      ...properties,
    });

    // Store a reference to the selected feature in the handle
    handle.set('feature', this.selectedFeature);

    // Update Rotate Icon Rotation
    if (type === HandleType.ROTATE) {
      const text = ROTATE_STYLE.getText();
      if (text) {
        text.setRotation(this.angle);
        ROTATE_STYLE.setText(text);
      }
    }

    // Apply style based on handle type
    switch (type) {
      case HandleType.VERTEX:
        handle.setStyle(VERTEX_STYLE);
        break;
      case HandleType.ROTATE:
        handle.setStyle(ROTATE_STYLE);
        break;
      case HandleType.DELETE:
        handle.setStyle(DELETE_STYLE);
        break;
      case HandleType.SCALE_NE:
      case HandleType.SCALE_SE:
      case HandleType.SCALE_SW:
      case HandleType.SCALE_NW:
        handle.setStyle(SCALE_STYLE);
        break;
      case HandleType.STRETCH_N:
      case HandleType.STRETCH_E:
      case HandleType.STRETCH_S:
      case HandleType.STRETCH_W:
        handle.setStyle(STRETCH_STYLE);
        break;
      case HandleType.TRANSLATE_CENTER:
        handle.setStyle(TRANSLATE_STYLE);
        break;
      default:
        break;
    }

    // Add the handle to the source
    this.handleSource.addFeature(handle);
  }

  /**
   * Creates the extent boundary rectangle.
   * @param {Extent} extent - The expanded extent.
   */
  createExtentBoundary(extent: Extent): void {
    const [minX, minY, maxX, maxY] = extent;
    const boundaryGeometry = new LineString([
      [minX, minY],
      [maxX, minY],
      [maxX, maxY],
      [minX, maxY],
      [minX, minY],
    ]);

    const boundary = new Feature({
      geometry: boundaryGeometry,
      handleType: HandleType.BOUNDARY,
    });

    boundary.setStyle(EXTENT_BOUNDARY_STYLE);
    this.handleSource.addFeature(boundary);
  }

  /**
   * Creates scale handles at the corners of the extent.
   * @param {Extent} extent - The extent of the feature.
   */
  createScaleHandles(extent: Extent): void {
    const [minX, minY, maxX, maxY] = extent;

    // Create corner handles
    this.createHandle([minX, minY], HandleType.SCALE_SW);
    this.createHandle([maxX, minY], HandleType.SCALE_SE);
    this.createHandle([maxX, maxY], HandleType.SCALE_NE);
    this.createHandle([minX, maxY], HandleType.SCALE_NW);
  }

  /**
   * Creates stretch handles at the middle of each side of the extent.
   * @param {Extent} extent - The extent of the feature.
   */
  createStretchHandles(extent: Extent): void {
    const [minX, minY, maxX, maxY] = extent;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Create middle handles
    this.createHandle([centerX, minY], HandleType.STRETCH_S);
    this.createHandle([maxX, centerY], HandleType.STRETCH_E);
    this.createHandle([centerX, maxY], HandleType.STRETCH_N);
    this.createHandle([minX, centerY], HandleType.STRETCH_W);
  }

  /**
   * Creates a rotation handle above the feature.
   * @param {Extent} extent - The extent of the feature.
   */
  createRotateHandle(extent: Extent): void {
    const [minX, , maxX, maxY] = extent;
    const centerX = (minX + maxX) / 2;
    const offset = this.#getMapBasedPadding() * 2;

    const lineStart: Coordinate = [centerX, maxY];
    const lineEnd: Coordinate = [centerX, maxY + offset];

    // Create line from top stretch to rotate handle
    const line = new Feature({
      geometry: new LineString([lineStart, lineEnd]),
      handleType: HandleType.ROTATE_LINE,
    });
    line.setStyle(ROTATE_LINE_STYLE);
    this.handleSource.addFeature(line);

    // Create rotate handle at end of line
    this.createHandle(lineEnd, HandleType.ROTATE);
  }

  /**
   * Creates a delete handle for the feature.
   * @param {Extent} extent - The extent of the feature.
   */
  createDeleteHandle(extent: Extent): void {
    const [, minY, maxX] = extent;
    const offset = this.#getMapBasedPadding() * 1.3;

    const deletePos: Coordinate = [maxX + offset, minY - offset];
    this.createHandle(deletePos, HandleType.DELETE);
  }

  /**
   * Creates vertex handles for LineString and Polygon geometries.
   * @param {LineString | Polygon} geometry - The geometry to create vertex handles for.
   */
  createVertexHandles(geometry: LineString | Polygon): void {
    let coordinates: Coordinate[];

    if (geometry instanceof LineString) {
      coordinates = geometry.getCoordinates();
    } else {
      // For polygons, use the exterior ring
      [coordinates] = geometry.getCoordinates();
    }

    // Create vertex handles
    coordinates.forEach((coord, index) => {
      // Skip the last coordinate for polygons (it's the same as the first)
      if (geometry instanceof Polygon && index === coordinates.length - 1) return;

      const vertexHandle = new Feature({
        geometry: new Point(coord),
        handleType: HandleType.VERTEX,
        vertexIndex: index,
      });

      vertexHandle.set('feature', this.selectedFeature);
      vertexHandle.setStyle(VERTEX_STYLE);
      this.handleSource.addFeature(vertexHandle);
    });

    // Create edge midpoint handles for adding vertices
    for (let i = 0; i < coordinates.length - 1; i++) {
      const start = coordinates[i];
      const end = coordinates[i + 1];
      const midpoint: Coordinate = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];

      const midpointHandle = new Feature({
        geometry: new Point(midpoint),
        handleType: HandleType.EDGE_MIDPOINT,
        edgeIndex: i,
      });

      midpointHandle.set('feature', this.selectedFeature);
      midpointHandle.setStyle(EDGE_MIDPOINT_STYLE);
      this.handleSource.addFeature(midpointHandle);
    }
  }

  /**
   * Gets the cursor style for a handle type.
   * @param {HandleType} handleType - The handle type.
   * @returns {string} The cursor style.
   */
  static getCursorForHandleType(handleType: HandleType): string {
    switch (handleType) {
      case HandleType.ROTATE:
        return 'grab';

      case HandleType.DELETE:
        return 'pointer';

      case HandleType.VERTEX:
        return 'grab';

      case HandleType.SCALE_NE:
        return 'nesw-resize';

      case HandleType.SCALE_SE:
        return 'nwse-resize';

      case HandleType.SCALE_SW:
        return 'nesw-resize';

      case HandleType.SCALE_NW:
        return 'nwse-resize';

      case HandleType.STRETCH_N:
        return 'ns-resize';

      case HandleType.STRETCH_E:
        return 'ew-resize';

      case HandleType.STRETCH_S:
        return 'ns-resize';

      case HandleType.STRETCH_W:
        return 'ew-resize';

      case HandleType.TRANSLATE_CENTER:
        return 'move';

      default:
        return 'default';
    }
  }

  /**
   * Gets the event type from a handle type.
   * @param {HandleType} handleType - The handle type.
   * @param {string} suffix - The event suffix (start, ing, end).
   * @returns {string} The event type.
   */
  static getEventTypeFromHandleType(handleType: HandleType, suffix: string): string {
    switch (handleType) {
      case HandleType.ROTATE:
        return `rotate${suffix}`;

      case HandleType.SCALE_NE:
      case HandleType.SCALE_SE:
      case HandleType.SCALE_SW:
      case HandleType.SCALE_NW:
        return `scale${suffix}`;

      case HandleType.STRETCH_N:
      case HandleType.STRETCH_E:
      case HandleType.STRETCH_S:
      case HandleType.STRETCH_W:
        return `stretch${suffix}`;

      case HandleType.TRANSLATE:
        return `translate${suffix}`;

      default:
        return `transform${suffix}`;
    }
  }

  /**
   * Clears all handles.
   */
  clearHandles(): void {
    this.handleSource.clear();
  }

  /**
   * Updates the handles to match the new geometry.
   */
  updateHandles(): void {
    // Clear existing handles
    this.clearHandles();

    // Create new handles
    this.createHandles();
  }

  // #region Handlers

  /**
   * Handles translation of a feature.
   * @param {number} deltaX - The change in X coordinate.
   * @param {number} deltaY - The change in Y coordinate.
   */
  handleTranslate(deltaX: number, deltaY: number): void {
    if (!this.selectedFeature || !this.startGeometry) return;

    // Clone the original geometry
    const geometry = this.startGeometry.clone();

    // Translate the geometry
    if (geometry instanceof Point) {
      const coords = geometry.getCoordinates();
      geometry.setCoordinates([coords[0] + deltaX, coords[1] + deltaY]);
    } else if (geometry instanceof LineString) {
      const coords = geometry.getCoordinates();
      geometry.setCoordinates(coords.map((coord) => [coord[0] + deltaX, coord[1] + deltaY]));
    } else if (geometry instanceof Polygon) {
      const coords = geometry.getCoordinates();
      geometry.setCoordinates(coords.map((ring) => ring.map((coord) => [coord[0] + deltaX, coord[1] + deltaY])));
    }

    // Update the feature with the new geometry
    this.selectedFeature.setGeometry(geometry);

    // Update text editor overlay position if it exists
    if (this.#textEditOverlay && this.#isTextFeature()) {
      const newCoords = (geometry as Point).getCoordinates();
      this.#textEditOverlay.setPosition(newCoords);
    }

    // Update the center
    if (this.center) {
      this.center = [this.center[0] + deltaX, this.center[1] + deltaY];
    }
  }

  /**
   * Handles rotation of a feature.
   * @param {Coordinate} coordinate - The current coordinate.
   */
  handleRotate(coordinate: Coordinate): void {
    if (!this.selectedFeature || !this.startGeometry || !this.center || !this.startCoordinate) return;

    // Calculate the angle between the start point and the current point
    const startAngle = Math.atan2(this.startCoordinate[1] - this.center[1], this.startCoordinate[0] - this.center[0]);

    const currentAngle = Math.atan2(coordinate[1] - this.center[1], coordinate[0] - this.center[0]);

    // Calculate the rotation angle
    this.angle = currentAngle - startAngle;

    // Clone the original geometry
    const geometry = this.startGeometry.clone();

    // For text features, update the text style with rotation
    if (this.#isTextFeature()) {
      this.#handleTextRotate(coordinate);
      return;
    }

    // Rotate the geometry
    const { center } = this;
    if (geometry instanceof Point) {
      const coords = geometry.getCoordinates();
      const rotatedCoords = OLTransform.rotateCoordinate(coords, this.center, this.angle);
      geometry.setCoordinates(rotatedCoords);
    } else if (geometry instanceof LineString) {
      const coords = geometry.getCoordinates();
      const rotatedCoords = coords.map((coord) => OLTransform.rotateCoordinate(coord, center, this.angle));
      geometry.setCoordinates(rotatedCoords);
    } else if (geometry instanceof Polygon) {
      const coords = geometry.getCoordinates();
      const rotatedCoords = coords.map((ring) => ring.map((coord) => OLTransform.rotateCoordinate(coord, center, this.angle)));
      geometry.setCoordinates(rotatedCoords);
    }

    // Update the feature with the new geometry
    this.selectedFeature.setGeometry(geometry);
  }

  /**
   * Handles scaling of a feature.
   * @param {Coordinate} coordinate - The current coordinate.
   * @param {HandleType} handleType - The type of handle being dragged.
   * @param {boolean} ctrlKey - If the ctrlKey is being pressed to maintain the ratio
   */
  handleScale(coordinate: Coordinate, handleType: HandleType, ctrlKey: boolean = false): void {
    if (!this.selectedFeature || !this.startGeometry) return;

    // Handle text scaling differently
    if (this.#isTextFeature()) {
      this.#handleTextScale(coordinate, handleType);
      return;
    }

    // Get the extent of the original geometry
    const extent = this.startGeometry.getExtent();
    const [minX, minY, maxX, maxY] = extent;
    const width = maxX - minX;
    const height = maxY - minY;

    // Calculate scale factors based on the handle being dragged
    let scaleX = 1;
    let scaleY = 1;
    let anchorPoint: Coordinate;

    switch (handleType) {
      case HandleType.SCALE_NE:
        scaleX = (coordinate[0] - minX) / width;
        scaleY = (coordinate[1] - minY) / height;
        anchorPoint = [minX, minY]; // SW corner fixed
        break;

      case HandleType.SCALE_SE:
        scaleX = (coordinate[0] - minX) / width;
        scaleY = (maxY - coordinate[1]) / height;
        anchorPoint = [minX, maxY]; // NW corner fixed
        break;

      case HandleType.SCALE_SW:
        scaleX = (maxX - coordinate[0]) / width;
        scaleY = (maxY - coordinate[1]) / height;
        anchorPoint = [maxX, maxY]; // NE corner fixed
        break;

      case HandleType.SCALE_NW:
        scaleX = (maxX - coordinate[0]) / width;
        scaleY = (coordinate[1] - minY) / height;
        anchorPoint = [maxX, minY]; // SE corner fixed
        break;
      default:
        return;
    }

    // Ensure positive scale factors
    scaleX = Math.max(0.1, scaleX);
    scaleY = Math.max(0.1, scaleY);

    // If keeping aspect ratio, use the minimum scale factor for both
    if (this.options.keepAspectRatio || ctrlKey) {
      const minScale = Math.min(scaleX, scaleY);
      scaleX = minScale;
      scaleY = minScale;
    }

    // Clone the original geometry
    const geometry = this.startGeometry.clone();

    // Scale the geometry
    if (geometry instanceof Point) {
      const coords = geometry.getCoordinates();
      const scaledCoords = OLTransform.scaleCoordinate(coords, anchorPoint, scaleX, scaleY);
      geometry.setCoordinates(scaledCoords);
    } else if (geometry instanceof LineString) {
      const coords = geometry.getCoordinates();
      const scaledCoords = coords.map((coord) => OLTransform.scaleCoordinate(coord, anchorPoint, scaleX, scaleY));
      geometry.setCoordinates(scaledCoords);
    } else if (geometry instanceof Polygon) {
      const coords = geometry.getCoordinates();
      const scaledCoords = coords.map((ring) => ring.map((coord) => OLTransform.scaleCoordinate(coord, anchorPoint, scaleX, scaleY)));
      geometry.setCoordinates(scaledCoords);
    }

    // Update the feature with the new geometry
    this.selectedFeature.setGeometry(geometry);
  }

  /**
   * Handles stretching of a feature.
   * @param {Coordinate} coordinate - The current coordinate.
   * @param {HandleType} handleType - The type of handle being dragged.
   */
  handleStretch(coordinate: Coordinate, handleType: HandleType): void {
    if (!this.selectedFeature || !this.startGeometry) return;

    // Get the extent of the original geometry
    const extent = this.startGeometry.getExtent();
    const [minX, minY, maxX, maxY] = extent;

    // Calculate stratch factors
    let scaleX = 1;
    let scaleY = 1;
    let anchorPoint: Coordinate;

    switch (handleType) {
      case HandleType.STRETCH_N:
        scaleY = (coordinate[1] - minY) / (maxY - minY);
        anchorPoint = [(minX + maxX) / 2, minY]; // South edge fixed
        break;

      case HandleType.STRETCH_E:
        scaleX = (coordinate[0] - minX) / (maxX - minX);
        anchorPoint = [minX, (minY + maxY) / 2]; // West edge fixed
        break;

      case HandleType.STRETCH_S:
        scaleY = (maxY - coordinate[1]) / (maxY - minY);
        anchorPoint = [(minX + maxX) / 2, maxY]; // North edge fixed
        break;

      case HandleType.STRETCH_W:
        scaleX = (maxX - coordinate[0]) / (maxX - minX);
        anchorPoint = [maxX, (minY + maxY) / 2]; // East edge fixed
        break;
      default:
        return;
    }

    // Ensure positive scale factors
    scaleX = Math.max(0.1, scaleX);
    scaleY = Math.max(0.1, scaleY);

    // Clone and scale the geometry
    const geometry = this.startGeometry.clone();
    if (geometry instanceof Point) {
      const coords = geometry.getCoordinates();
      const scaledCoords = OLTransform.scaleCoordinate(coords, anchorPoint, scaleX, scaleY);
      geometry.setCoordinates(scaledCoords);
    } else if (geometry instanceof LineString) {
      const coords = geometry.getCoordinates();
      const scaledCoords = coords.map((coord) => OLTransform.scaleCoordinate(coord, anchorPoint, scaleX, scaleY));
      geometry.setCoordinates(scaledCoords);
    } else if (geometry instanceof Polygon) {
      const coords = geometry.getCoordinates();
      const scaledCoords = coords.map((ring) => ring.map((coord) => OLTransform.scaleCoordinate(coord, anchorPoint, scaleX, scaleY)));
      geometry.setCoordinates(scaledCoords);
    }

    // Update the feature with the new geometry
    this.selectedFeature.setGeometry(geometry);
  }

  /**
   * Handle all events, including double-click
   * @param {MapBrowserEvent} event - The map browser event.
   * @returns {boolean} Whether the event was handled.
   */
  override handleEvent(event: MapBrowserEvent<PointerEvent>): boolean {
    if (event.type === 'dblclick') {
      return this.#handleDoubleClick(event);
    }
    return super.handleEvent(event);
  }

  /**
   * Handle double-click events for text editing
   * @param {MapBrowserEvent} event - The map browser event.
   * @returns {boolean} Whether the event was handled.
   */
  #handleDoubleClick(event: MapBrowserEvent<PointerEvent>): boolean {
    const { map } = event;
    const features = map.getFeaturesAtPixel(event.pixel);

    if (features && features.length > 0) {
      const feature = features[0] as Feature;
      if (this.features.getArray().includes(feature) && this.#isTextFeature(feature)) {
        // Prevent default zoom behaviour
        event.preventDefault();
        event.stopPropagation();

        // Select the feature if not already selected
        if (this.selectedFeature !== feature) {
          this.selectFeature(feature);
        }
        // Show text editor
        this.#showTextEditor();
        return true;
      }
    }
    return false;
  }

  /**
   * Handle Click Events
   * @param {MapBrowserEvent} event - The map browser event.
   * @override
   * @returns {boolean} Whether the event was handled.
   */
  // TODO: Rewrite the function name, if this function overrides a mother function, it probably shouldn't be prefixed with 'handle'.
  override handleDownEvent(event: MapBrowserEvent<PointerEvent>): boolean {
    if (this.#inHandleDownEvent) return false;
    this.#inHandleDownEvent = true;

    try {
      const { map } = event;
      const { coordinate } = event;

      // Check if we clicked on a handle
      const handleFeature = this.#getHandleAtCoordinate(coordinate, map);
      const handleType = handleFeature?.get('handleType') as HandleType;

      if (handleFeature && handleType !== HandleType.BOUNDARY && handleType !== HandleType.ROTATE_LINE) {
        // Handle delete action
        if (handleType === HandleType.DELETE) {
          const feature = handleFeature.get('feature');
          if (feature) {
            this.onDeletefeature?.(new TransformDeleteFeatureEvent(feature as Feature));
            this.features.remove(feature);
          }
          return false;
        }

        // Handle right-click on vertex to delete it
        if (handleType === HandleType.VERTEX && event.originalEvent.button === 2) {
          this.#deleteVertex(handleFeature);
          return false;
        }

        // Start transformation
        this.currentHandle = handleFeature;
        this.startCoordinate = coordinate;
        this.#transformType = handleType;
        this.#vertexAdded = false;

        if (this.selectedFeature) {
          this.startGeometry = this.selectedFeature.getGeometry()?.clone();
          this.#isTransforming = true;

          // Store initial rotation for text features when starting rotation
          if (handleType === HandleType.ROTATE && this.#isTextFeature()) {
            this.#originalTextRotation = this.selectedFeature.get('textRotation') || 0;
          }

          // Clear Handles
          this.clearHandles();

          // For edge midpoint, add vertex immediately on down event
          if (handleType === HandleType.EDGE_MIDPOINT) {
            this.handleAddVertex(coordinate, handleFeature);
            this.#vertexAdded = true;
            this.#transformType = HandleType.VERTEX;
            const edgeIndex = handleFeature.get('edgeIndex');
            this.currentHandle.set('vertexIndex', edgeIndex + 1);
          }

          this.onTransformstart?.(new TransformEvent('transformstart', this.selectedFeature));
        }

        return true;
      }

      // Check if we clicked on a feature to select it
      const features = map.getFeaturesAtPixel(event.pixel);

      if (features && features.length > 0) {
        const feature = features[0] as Feature;
        if (this.features.getArray().includes(feature)) {
          // Only select if it's a different feature
          if (this.selectedFeature !== feature) {
            this.selectFeature(feature);
          }

          // Start translation for non-text features or when not text editing
          if (this.options.translate) {
            this.startCoordinate = coordinate;
            this.startGeometry = feature.getGeometry()?.clone();
            this.#transformType = HandleType.TRANSLATE;
            this.#isTransforming = true;

            if (this.#isTextFeature(this.selectedFeature)) {
              this.#originalTextExtent = this.#calculateTextExtent()!;
              this.#originalTextSize = this.selectedFeature?.get('textSize') || 14;
            }

            this.clearHandles();
            this.onTransformstart?.(new TransformEvent('transformstart', feature));
            return true;
          }
        }
      }

      // Also check if we're clicking on the currently selected text feature (even if hidden)
      if (this.selectedFeature && this.#isTextFeature(this.selectedFeature) && this.#isTextEditing) {
        // Check if click is within text bounds
        const textExtent = this.#calculateTextExtent();
        if (textExtent) {
          const [minX, minY, maxX, maxY] = textExtent;
          if (coordinate[0] >= minX && coordinate[0] <= maxX && coordinate[1] >= minY && coordinate[1] <= maxY) {
            // Click is within text bounds, don't clear selection
            return true;
          }
        }
      }

      // If we get here and text editing is active, apply changes and clear selection
      if (this.#isTextEditing) {
        this.#applyTextChanges();
      }

      // Clear selection if clicking elsewhere
      if (this.selectedFeature) {
        this.clearSelection();
      }

      return false;
    } finally {
      this.#inHandleDownEvent = false;
    }
  }

  /**
   * Handle pointer drag events.
   * @param {MapBrowserEvent} event - The map browser event.
   * @override
   */
  // TODO: Rewrite the function name, if this function overrides a mother function, it probably shouldn't be prefixed with 'handle'.
  override handleDragEvent(event: MapBrowserEvent<PointerEvent>): void {
    if (this.#inHandleDragEvent || !this.#isTransforming || !this.selectedFeature || !this.startCoordinate) return;
    this.#inHandleDragEvent = true;

    try {
      const { coordinate } = event;

      // Perform the transformation based on the handle type
      switch (this.#transformType) {
        case HandleType.TRANSLATE:
        case HandleType.TRANSLATE_CENTER:
          // Delta X and Delta Y
          this.handleTranslate(coordinate[0] - this.startCoordinate[0], coordinate[1] - this.startCoordinate[1]);
          break;

        case HandleType.ROTATE:
          this.handleRotate(coordinate);
          break;

        case HandleType.SCALE_NE:
        case HandleType.SCALE_SE:
        case HandleType.SCALE_SW:
        case HandleType.SCALE_NW:
          this.handleScale(coordinate, this.#transformType, event.originalEvent.ctrlKey);
          break;

        case HandleType.STRETCH_N:
        case HandleType.STRETCH_E:
        case HandleType.STRETCH_S:
        case HandleType.STRETCH_W:
          this.handleStretch(coordinate, this.#transformType);
          break;
        case HandleType.VERTEX:
          this.handleVertexMove(coordinate, this.currentHandle);
          break;
        default:
          break;
      }

      // Update handles to match the new geometry
      // this.updateHandles();

      // Dispatch transforming event
      this.onTransforming?.(new TransformEvent('transforming', this.selectedFeature));
    } finally {
      this.#inHandleDragEvent = false;
    }
  }

  /**
   * Handle pointer up events.
   * @param {MapBrowserEvent} event - The map browser event.
   * @override
   * @returns {boolean} Whether the event was handled.
   */
  // TODO: Rewrite the function name, if this function overrides a mother function, it probably shouldn't be prefixed with 'handle'.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override handleUpEvent(event: MapBrowserEvent<PointerEvent>): boolean {
    if (this.#inHandleUpEvent) return false;
    this.#inHandleUpEvent = true;

    try {
      if (this.#isTransforming && this.selectedFeature) {
        // Save state to history after transformation if the geometry changed
        const currentGeometry = this.selectedFeature.getGeometry();
        const geometryChanged = this.startGeometry && currentGeometry && this.startGeometry.getRevision() !== currentGeometry.getRevision();
        if (geometryChanged) {
          this.#saveToHistory();
        }

        // For text features, update handles to match new text size
        if (this.#isTextFeature()) {
          // Apply final style update
          const finalSize = this.selectedFeature.get('textSize') || 14;
          const isBold = this.selectedFeature.get('textBold') || false;
          const isItalic = this.selectedFeature.get('textItalic') || false;
          const currentText = this.selectedFeature.get('text') || 'Text';

          const finalStyle = new Style({
            text: new Text({
              text: currentText,
              fill: new Fill({ color: this.selectedFeature.get('textColor') || '#000000' }),
              stroke: new Stroke({
                color: this.selectedFeature.get('textHaloColor') || 'rgba(255,255,255,0.7)',
                width: this.selectedFeature.get('textHaloWidth') || 3,
              }),
              font: `${isItalic ? 'italic ' : ''}${isBold ? 'bold ' : ''}${finalSize}px ${this.selectedFeature.get('textFont') || 'Arial'}`,
            }),
          });

          this.selectedFeature.setStyle(finalStyle);

          // Clear cached values
          this.#originalTextExtent = undefined;
          this.#originalTextSize = undefined;

          // Update handles
          this.#createTextHandles();
        } else {
          // Update handles to match the new geometry position
          this.updateHandles();
        }

        // Dispatch transform end event
        this.onTransformend?.(new TransformEvent('transformend', this.selectedFeature));

        // Reset transformation state
        this.#isTransforming = false;
        this.currentHandle = undefined;
        this.startCoordinate = undefined;
        this.startGeometry = undefined;
        this.#transformType = undefined;

        // Only reset angle to 0 for non-text features
        if (!this.#isTextFeature()) {
          this.angle = 0;
        }

        return true;
      }

      return false;
    } finally {
      this.#inHandleUpEvent = false;
    }
  }

  /**
   * Handle pointer move events. Not to be confused with moving handles.
   * This overrides the move event from OL Pointer
   * @param {MapBrowserEvent} event - The map browser event.
   * @override
   */
  // TODO: Rewrite the function name, if this function overrides a mother function, it probably shouldn't be prefixed with 'handle'.
  override handleMoveEvent(event: MapBrowserEvent<PointerEvent>): void {
    if (this.#inHandleMoveEvent) return;
    this.#inHandleMoveEvent = true;

    try {
      const { map } = event;
      const { coordinate } = event;

      // Check if we're over a handle and update cursor
      const handleFeature = this.#getHandleAtCoordinate(coordinate, map);
      if (handleFeature) {
        const handleType = handleFeature.get('handleType') as HandleType;
        const cursor = OLTransform.getCursorForHandleType(handleType);
        map.getTargetElement().style.cursor = cursor;
      } else if (!this.#isTransforming) {
        // Check if we're over a feature
        const features = map.getFeaturesAtPixel(event.pixel);
        if (features && features.length > 0) {
          const feature = features[0] as Feature;
          if (this.features.getArray().includes(feature) && this.options.translate) {
            map.getTargetElement().style.cursor = 'move';
            return;
          }
        }
        // Reset cursor when not over a handle and not transforming
        map.getTargetElement().style.cursor = 'default';
      }
    } finally {
      this.#inHandleMoveEvent = false;
    }
  }

  /**
   * Handles moving a vertex.
   * @param {Coordinate} coordinate - The new coordinate.
   * @param {Feature} vertexHandle - The vertex handle being dragged.
   */
  handleVertexMove(coordinate: Coordinate, vertexHandle?: Feature): void {
    if (!this.selectedFeature || !vertexHandle) return;

    const geometry = this.selectedFeature.getGeometry();
    if (geometry instanceof Circle) {
      const isCenter = vertexHandle.get('isCircleCenter');
      const isEdge = vertexHandle.get('isCircleEdge');

      if (isCenter) {
        // Move the circle center
        geometry.setCenter(coordinate);
      } else if (isEdge) {
        // Resize the circle
        const center = geometry.getCenter();
        const newRadius = Math.sqrt((coordinate[0] - center[0]) ** 2 + (coordinate[1] - center[1]) ** 2);
        geometry.setRadius(newRadius);
      }
      return;
    }

    const vertexIndex = vertexHandle.get('vertexIndex');

    if (geometry instanceof LineString) {
      const coords = geometry.getCoordinates();
      coords[vertexIndex] = coordinate;
      geometry.setCoordinates(coords);
    } else if (geometry instanceof Polygon) {
      const coords = geometry.getCoordinates();
      coords[0][vertexIndex] = coordinate;
      // move last vertex too if it's the first vertex for a polygon
      if (vertexIndex === 0) {
        coords[0][coords[0].length - 1] = coordinate;
      }

      geometry.setCoordinates(coords);
    }
  }

  /**
   * Handles adding a new vertex.
   * @param {Coordinate} coordinate - The coordinate for the new vertex.
   * @param {Feature} midpointHandle - The midpoint handle being dragged.
   */
  handleAddVertex(coordinate: Coordinate, midpointHandle?: Feature): void {
    if (!this.selectedFeature || !midpointHandle || this.#vertexAdded) return;

    const edgeIndex = midpointHandle.get('edgeIndex');
    const geometry = this.selectedFeature.getGeometry();

    if (geometry instanceof LineString) {
      const coords = geometry.getCoordinates();
      coords.splice(edgeIndex + 1, 0, coordinate);
      geometry.setCoordinates(coords);
    } else if (geometry instanceof Polygon) {
      const coords = geometry.getCoordinates();
      coords[0].splice(edgeIndex + 1, 0, coordinate);
      geometry.setCoordinates(coords);
    }

    this.#vertexAdded = true;
    // Recreate handles after adding vertex
    // this.updateHandles();
    this.clearHandles();
  }

  // #region Text Editing

  /**
   * Checks if a feature is a text feature
   * @returns {boolean} True if it's a text feature
   */
  #isTextFeature(feature?: Feature): boolean {
    return (feature || this.selectedFeature)?.get('text') !== undefined;
  }

  /**
   * Creates a simple text editor for text features
   */
  #showTextEditor(): void {
    if (!this.mapViewer?.map || this.#textEditOverlay || !this.selectedFeature) return;

    const geometry = this.selectedFeature.getGeometry();
    if (!(geometry instanceof Point)) return;

    const position = geometry.getCoordinates();
    const currentText = this.selectedFeature.get('text') || 'Text';
    const currentSize = this.selectedFeature.get('textSize') || 14;
    const currentColor = this.selectedFeature.get('textColor') || '#000000';
    const currentFont = this.selectedFeature.get('textFont') || 'Arial';

    // Hide the original text on the map by assigning an empty text style
    this.#originalTextStyle = this.selectedFeature.getStyle() as Style;
    this.selectedFeature.setStyle(
      new Style({
        text: new Text({ text: '' }),
      })
    );

    // Create simple text editor element
    this.#textEditorElement = document.createElement('div');
    this.#textEditorElement.contentEditable = 'true';
    this.#textEditorElement.textContent = currentText;
    this.#textEditorElement.style.cssText = `
    background: rgba(255, 255, 255, 0.3);
    border: 2px solid #007cba;
    border-radius: 3px;
    border: none;
    padding: 4px;
    font-size: ${currentSize}px;
    font-family: ${currentFont};
    color: ${currentColor};
    outline: none;
    cursor: text;
    white-space: nowrap;
    min-width: 50px;
  `;

    // Create overlay positioned to match map text exactly
    this.#textEditOverlay = new Overlay({
      element: this.#textEditorElement,
      positioning: 'center-center',
      offset: [0, 0], // Match the original text offsetY
      stopEvent: false,
    });

    this.#textEditOverlay.setPosition(position);
    this.mapViewer.map.addOverlay(this.#textEditOverlay);
    this.#isTextEditing = true;

    // Add keyboard shortcuts
    this.#textEditorElement.addEventListener('keydown', (e) => {
      if (!this.selectedFeature) return;
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            this.#toggleBold();
            this.onTransformend?.(new TransformEvent('transformend', this.selectedFeature));
            break;
          case 'i':
            e.preventDefault();
            this.#toggleItalic();
            this.onTransformend?.(new TransformEvent('transformend', this.selectedFeature));
            break;
          default:
            return;
        }
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.#applyTextChanges();
        this.onTransformend?.(new TransformEvent('transformend', this.selectedFeature));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.#cancelTextEditing();
      }
    });

    // Focus and select text
    setTimeout(() => {
      if (this.#textEditorElement) {
        this.#textEditorElement.focus();
        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.selectNodeContents(this.#textEditorElement);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }, 100);
  }

  /**
   * Calculates the visual extent of text based on its properties
   * @param {Feature} feature - The text feature
   * @returns {Extent | null} The text extent or null if calculation fails
   */
  /**
   * Calculates the visual extent of text based on its properties
   * @returns {Extent | null} The text extent or null if calculation fails
   */
  #calculateTextExtent(): Extent | null {
    if (!this.selectedFeature) return null;

    const geometry = this.selectedFeature.getGeometry();
    if (!(geometry instanceof Point)) return null;

    const coords = geometry.getCoordinates();
    const text = this.selectedFeature.get('text') || 'Text';
    const fontSize = this.selectedFeature.get('textSize') || 14;

    const resolution = this.mapViewer?.map?.getView().getResolution() || 1;

    const charWidth = fontSize * 0.6;
    const textWidth = text.length * charWidth;
    const textHeight = fontSize * 1.2;

    const mapWidth = textWidth * resolution;
    const mapHeight = textHeight * resolution;

    // Text is centered horizontally
    const textCenterY = coords[1];
    const textLeft = coords[0] - mapWidth / 2.5;
    const textRight = coords[0] + mapWidth / 2.5;
    const textBottom = textCenterY - mapHeight / 1.25;
    const textTop = textCenterY + mapHeight / 1.25;

    return [textLeft, textBottom, textRight, textTop];
  }

  /**
   * Handles scaling for text features
   * @param {Coordinate} coordinate - The current coordinate
   * @param {HandleType} handleType - The handle type being dragged
   */
  #handleTextScale(coordinate: Coordinate, handleType: HandleType): void {
    if (!this.selectedFeature || !this.startCoordinate) return;

    const textExtent = this.#calculateTextExtent();

    // Use the original text extent from when dragging started (fixed reference)
    if (!this.#originalTextExtent && textExtent) {
      this.#originalTextExtent = textExtent;
      this.#originalTextSize = this.selectedFeature.get('textSize') || 14;
    }

    if (!this.#originalTextExtent) return;

    const [minX, minY, maxX, maxY] = this.#originalTextExtent;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Calculate distance from center to current mouse position
    const currentDistance = Math.sqrt((coordinate[0] - centerX) ** 2 + (coordinate[1] - centerY) ** 2);

    // Calculate distance from center to the original handle position
    let originalHandlePos: Coordinate;
    switch (handleType) {
      case HandleType.SCALE_SE:
        originalHandlePos = [maxX, minY];
        break;
      case HandleType.SCALE_SW:
        originalHandlePos = [minX, minY];
        break;
      case HandleType.SCALE_NE:
        originalHandlePos = [maxX, maxY];
        break;
      case HandleType.SCALE_NW:
        originalHandlePos = [minX, maxY];
        break;
      default:
        return;
    }

    const originalDistance = Math.sqrt((originalHandlePos[0] - centerX) ** 2 + (originalHandlePos[1] - centerY) ** 2);

    // Use a more conservative scaling factor
    const scaleFactor = Math.max(0.3, currentDistance / originalDistance);
    const newSize = Math.max(8, Math.round(this.#originalTextSize! * scaleFactor));

    // Only update if size actually changed
    if (newSize !== this.selectedFeature.get('textSize')) {
      this.selectedFeature.set('textSize', newSize);

      // Update the actual text style on the feature for real-time feedback
      const currentText = this.selectedFeature.get('text') || 'Text';
      const isBold = this.selectedFeature.get('textBold') || false;
      const isItalic = this.selectedFeature.get('textItalic') || false;
      const rotation = this.selectedFeature.get('textRotation') || 0;

      const updatedStyle = new Style({
        text: new Text({
          text: currentText,
          fill: new Fill({ color: this.selectedFeature.get('textColor') || '#000000' }),
          stroke: new Stroke({
            color: this.selectedFeature.get('textHaloColor') || 'rgba(255,255,255,0.7)',
            width: this.selectedFeature.get('textHaloWidth') || 3,
          }),
          font: `${isItalic ? 'italic ' : ''}${isBold ? 'bold ' : ''}${newSize}px ${this.selectedFeature.get('textFont') || 'Arial'}`,
          rotation,
        }),
      });

      this.selectedFeature.setStyle(updatedStyle);

      // Update text editor element if exists
      if (this.#textEditorElement) {
        this.#textEditorElement.style.fontSize = `${newSize}px`;
      }
    }
  }

  /**
   * Handles rotation for text features
   * @param {Coordinate} coordinate - The current coordinate
   */
  #handleTextRotate(coordinate: Coordinate): void {
    if (!this.selectedFeature || !this.center || !this.startCoordinate) return;

    // Calculate the rotation angle
    const startAngle = Math.atan2(this.startCoordinate[1] - this.center[1], this.startCoordinate[0] - this.center[0]);
    const currentAngle = Math.atan2(coordinate[1] - this.center[1], coordinate[0] - this.center[0]);
    const deltaAngle = -(currentAngle - startAngle);

    this.angle = this.#originalTextRotation! + deltaAngle;
    this.selectedFeature.set('textRotation', this.angle);

    // Update text style with rotation
    const currentText = this.selectedFeature.get('text') || 'Text';
    const currentSize = this.selectedFeature.get('textSize') || 14;
    const isBold = this.selectedFeature.get('textBold') || false;
    const isItalic = this.selectedFeature.get('textItalic') || false;

    const rotatedStyle = new Style({
      text: new Text({
        text: currentText,
        fill: new Fill({ color: this.selectedFeature.get('textColor') || '#000000' }),
        stroke: new Stroke({
          color: this.selectedFeature.get('textHaloColor') || 'rgba(255,255,255,0.7)',
          width: this.selectedFeature.get('textHaloWidth') || 3,
        }),
        font: `${isItalic ? 'italic ' : ''}${isBold ? 'bold ' : ''}${currentSize}px ${this.selectedFeature.get('textFont') || 'Arial'}`,
        rotation: this.angle,
      }),
    });

    this.selectedFeature.setStyle(rotatedStyle);
  }

  /**
   * Toggles bold formatting
   */
  #toggleBold(): void {
    if (!this.#textEditorElement || !this.selectedFeature) return;

    const isBold = this.selectedFeature.get('textBold') || false;
    const newBold = !isBold;

    this.selectedFeature.set('textBold', newBold);
    this.#textEditorElement.style.fontWeight = newBold ? 'bold' : 'normal';
  }

  /**
   * Toggles italic formatting
   */
  #toggleItalic(): void {
    if (!this.#textEditorElement || !this.selectedFeature) return;

    const isItalic = this.selectedFeature.get('textItalic') || false;
    const newItalic = !isItalic;

    this.selectedFeature.set('textItalic', newItalic);
    this.#textEditorElement.style.fontStyle = newItalic ? 'italic' : 'normal';
  }

  /**
   * Applies text changes and shows final result
   */
  #applyTextChanges(): void {
    if (!this.#textEditorElement || !this.selectedFeature) return;

    const finalText = this.#textEditorElement.innerHTML.replace(/<br\s*\/?>/gi, '\n') || 'Text';
    const isBold = this.selectedFeature.get('textBold') || false;
    const isItalic = this.selectedFeature.get('textItalic') || false;
    const currentSize = this.selectedFeature.get('textSize') || 14;
    const rotation = this.selectedFeature.get('textRotation') || 0;

    this.selectedFeature.set('text', finalText);

    const finalStyle = new Style({
      text: new Text({
        text: finalText,
        fill: new Fill({ color: this.selectedFeature.get('textColor') || '#000000' }),
        stroke: new Stroke({
          color: this.selectedFeature.get('textHaloColor') || 'rgba(255,255,255,0.7)',
          width: this.selectedFeature.get('textHaloWidth') || 3,
        }),
        font: `${isItalic ? 'italic ' : ''}${isBold ? 'bold ' : ''}${currentSize}px ${this.selectedFeature.get('textFont') || 'Arial'}`,
        rotation,
      }),
    });

    this.selectedFeature.setStyle(finalStyle);
    this.#hideTextEditor();

    // Create regular handles after text editing is done
    this.#createTextHandles();
  }

  /**
   * Creates handles around the text's visual extent
   */
  #createTextHandles(): void {
    if (!this.selectedFeature) return;

    const textExtent = this.#calculateTextExtent();
    if (!textExtent) return;

    const [minX, minY, maxX, maxY] = textExtent;

    // Only clear handles if we're not currently text editing
    if (!this.#isTextEditing) {
      this.clearHandles();
    }

    // Get the center and text rotation
    this.center = [(minX + maxX) / 2, (minY + maxY) / 2];
    const textRotation = this.selectedFeature.get('textRotation');

    // Calculate rotated handle positions
    const corners = [
      [minX, minY], // SW
      [maxX, minY], // SE
      [maxX, maxY], // NE
      [minX, maxY], // NW
    ];

    const rotatedCorners = corners.map((corner) => OLTransform.rotateCoordinate(corner as Coordinate, this.center!, -textRotation));

    // Create rotated extent boundary
    const rotatedBoundary = [rotatedCorners[0], rotatedCorners[1], rotatedCorners[2], rotatedCorners[3], rotatedCorners[0]];
    const boundaryGeometry = new LineString(rotatedBoundary);
    const boundary = new Feature({
      geometry: boundaryGeometry,
      handleType: HandleType.BOUNDARY,
    });
    boundary.setStyle(EXTENT_BOUNDARY_STYLE);
    this.handleSource.addFeature(boundary);

    // Create rotated scale handles
    this.createHandle(rotatedCorners[0], HandleType.SCALE_SW);
    this.createHandle(rotatedCorners[1], HandleType.SCALE_SE);
    this.createHandle(rotatedCorners[2], HandleType.SCALE_NE);
    this.createHandle(rotatedCorners[3], HandleType.SCALE_NW);

    // Add rotation handle if rotation is enabled
    if (this.options.rotate) {
      const centerX = (minX + maxX) / 2;
      const offset = this.#getMapBasedPadding() * 2;

      const lineStart: Coordinate = [centerX, maxY];
      const lineEnd: Coordinate = [centerX, maxY + offset];

      // Rotate the line positions
      const rotatedLineStart = OLTransform.rotateCoordinate(lineStart, this.center, -textRotation);
      const rotatedLineEnd = OLTransform.rotateCoordinate(lineEnd, this.center, -textRotation);

      // Create rotated line from top to rotate handle
      const line = new Feature({
        geometry: new LineString([rotatedLineStart, rotatedLineEnd]),
        handleType: HandleType.ROTATE_LINE,
      });
      line.setStyle(ROTATE_LINE_STYLE);
      this.handleSource.addFeature(line);

      // Create rotate handle at end of rotated line
      this.createHandle(rotatedLineEnd, HandleType.ROTATE);
    }

    // Add delete handle if enabled
    if (this.options.enableDelete) {
      const offset = this.#getMapBasedPadding() * 1.3;
      const deletePos: Coordinate = [maxX + offset, minY - offset];

      // Rotate the delete handle position
      const rotatedDeletePos = OLTransform.rotateCoordinate(deletePos, this.center, -textRotation);
      this.createHandle(rotatedDeletePos, HandleType.DELETE);
    }
  }

  /**
   * Cancels text editing and restores original
   */
  #cancelTextEditing(): void {
    if (!this.selectedFeature) return;
    if (this.#originalTextStyle) {
      this.selectedFeature.setStyle(this.#originalTextStyle);
    }
    this.#hideTextEditor();
  }

  /**
   * Hides and removes the text editor overlay
   */
  #hideTextEditor(): void {
    if (this.#textEditOverlay && this.mapViewer?.map) {
      this.mapViewer.map.removeOverlay(this.#textEditOverlay);
      this.#textEditOverlay = undefined;
      this.#textEditorElement = undefined;
      this.#originalTextStyle = undefined;
      this.#isTextEditing = false;
    }
  }

  // #region Undo / Redo

  /**
   * Saves the current geometry state to history.
   */
  #saveToHistory(): void {
    if (!this.selectedFeature) return;

    const geometry = this.selectedFeature.getGeometry();
    if (!geometry) return;

    // Remove any history after current index (when undoing then making new changes)
    this.#geometryHistory = this.#geometryHistory.slice(0, this.#historyIndex + 1);

    // Add current geometry to history
    this.#geometryHistory.push(geometry.clone());
    this.#historyIndex++;

    // Limit history size
    if (this.#geometryHistory.length > this.#maxHistorySize) {
      this.#geometryHistory.shift();
      this.#historyIndex--;
    }
  }

  /**
   * Clears the geometry history.
   */
  #clearHistory(): void {
    this.#geometryHistory = [];
    this.#historyIndex = -1;
  }

  /**
   * Undoes the last transformation.
   * @returns {boolean} True if undo was successful.
   */
  undo(callback?: () => void): boolean {
    if (!this.selectedFeature || this.#historyIndex <= 0) return false;

    this.#historyIndex--;
    const previousGeometry = this.#geometryHistory[this.#historyIndex];
    this.selectedFeature.setGeometry(previousGeometry.clone());
    this.updateHandles();

    // Execute callback after state is updated
    if (callback) callback();

    return true;
  }

  /**
   * Redoes the next transformation.
   * @returns {boolean} True if redo was successful.
   */
  redo(callback?: () => void): boolean {
    if (!this.selectedFeature || this.#historyIndex >= this.#geometryHistory.length - 1) return false;

    this.#historyIndex++;
    const nextGeometry = this.#geometryHistory[this.#historyIndex];
    this.selectedFeature.setGeometry(nextGeometry.clone());
    this.updateHandles();

    // Execute callback after state is updated
    if (callback) callback();

    return true;
  }

  /**
   * Checks if undo is available.
   * @returns {boolean} True if undo is available.
   */
  canUndo(): boolean {
    return this.#historyIndex > 0;
  }

  /**
   * Checks if redo is available.
   * @returns {boolean} True if redo is available.
   */
  canRedo(): boolean {
    return this.#historyIndex !== -1 && this.#historyIndex < this.#geometryHistory.length - 1;
  }
}
