import OLMap from 'ol/Map';
import { Pointer as OLPointer } from 'ol/interaction';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import { Geometry, Point, Polygon, LineString } from 'ol/geom';
import { Style, Fill, Stroke, Circle as CircleStyle, Text } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Coordinate } from 'ol/coordinate';
import { Extent, getCenter } from 'ol/extent';
import { MapBrowserEvent } from 'ol';

import { TransformEvent } from './transform-event';
import { DeleteFeatureEvent } from './delete-event';
import { MapViewer } from '@/app';

/**
 * Handle types for the transform interaction
 */
export enum HandleType {
  ROTATE = 'rotate',
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
}

/**
 * Options for the transform interaction
 */
export interface TransformBaseOptions {
  features?: Collection<Feature>;
  source?: VectorSource;
  translateFeature?: boolean;
  scale?: boolean;
  rotate?: boolean;
  stretch?: boolean;
  keepAspectRatio?: boolean;
  hitTolerance?: number;
  enableDelete?: boolean;
  mapViewer?: MapViewer; // MapViewer type
}

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

  // Define handle styles
  rotateStyle = new Style({
    image: new CircleStyle({
      radius: 8,
      fill: new Fill({
        color: 'rgba(255, 255, 0, 0.8)',
      }),
      stroke: new Stroke({
        color: '#333',
        width: 1,
      }),
    }),
  });

  deleteStyle = new Style({
    image: new CircleStyle({
      radius: 8,
      fill: new Fill({
        color: 'rgba(255, 0, 0, 0.8)',
      }),
      stroke: new Stroke({
        color: '#333',
        width: 1,
      }),
    }),
    text: new Text({
      text: 'X',
      fill: new Fill({
        color: '#fff',
      }),
      font: 'bold 12px sans-serif',
      offsetY: 1,
    }),
  });

  scaleStyle = new Style({
    image: new CircleStyle({
      radius: 8,
      fill: new Fill({
        color: 'rgba(0, 255, 0, 0.8)',
      }),
      stroke: new Stroke({
        color: '#333',
        width: 1,
      }),
    }),
  });

  stretchStyle = new Style({
    image: new CircleStyle({
      radius: 8,
      fill: new Fill({
        color: 'rgba(0, 0, 255, 0.8)',
      }),
      stroke: new Stroke({
        color: '#333',
        width: 1,
      }),
    }),
  });

  translateStyle = new Style({
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

  /** Callback functions for events */
  onTransformstart?: (event: TransformEvent) => void;

  onTransforming?: (event: TransformEvent) => void;

  onTransformend?: (event: TransformEvent) => void;

  onDeletefeature?: (event: DeleteFeatureEvent) => void;

  /**
   * Initializes a OLTransform component.
   * @param {TransformBaseOptions} options - Object to configure the initialization.
   */
  constructor(options: TransformBaseOptions = {}) {
    super();

    this.options = {
      translateFeature: true,
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
    this.features.on('add', this.onFeatureAdd.bind(this));
    this.features.on('remove', this.onFeatureRemove.bind(this));
  }

  /**
   * Handles when a feature is added to the collection.
   * @param {Event} event - The event.
   */
  onFeatureAdd(event: { element: Feature }): void {
    const feature = event.element;

    // If this is the first feature, select it
    if (this.features.getLength() === 1 && !this.selectedFeature) {
      this.selectFeature(feature);
    }
  }

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
    // Clear any existing selection
    this.clearHandles();

    // Set the selected feature
    this.selectedFeature = feature;

    // Create handles for the feature
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
    this.clearHandles();
    this.selectedFeature = undefined;
  }

  /**
   * Creates handles for the selected feature.
   */
  createHandles(): void {
    if (!this.selectedFeature) return;

    const geometry = this.selectedFeature.getGeometry();
    if (!geometry) return;

    // Get the extent of the feature
    const extent = geometry.getExtent();
    const center = getCenter(extent);
    this.center = center;

    // Create handles based on the options
    if (this.options.scale) {
      this.createScaleHandles(extent);
    }

    if (this.options.stretch) {
      this.createStretchHandles(extent);
    }

    if (this.options.rotate) {
      this.createRotateHandle(center, extent);
    }

    if (this.options.enableDelete) {
      this.createDeleteHandle(center, extent);
    }

    if (this.options.translateFeature) {
      this.createHandle(center, HandleType.TRANSLATE_CENTER);
    }
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
   * @param {Coordinate} center - The center of the feature.
   * @param {Extent} extent - The extent of the feature.
   */
  createRotateHandle(center: Coordinate, extent: Extent): void {
    const [, , , maxY] = extent;
    const rotateY = maxY + 30; // Position the rotate handle above the feature

    this.createHandle([center[0], rotateY], HandleType.ROTATE);
  }

  /**
   * Creates a delete handle for the feature.
   * @param {Coordinate} center - The center of the feature.
   * @param {Extent} extent - The extent of the feature.
   */
  createDeleteHandle(center: Coordinate, extent: Extent): void {
    const [, , maxX] = extent;
    const deleteX = maxX + 30; // Position the delete handle to the right of the feature

    this.createHandle([deleteX, center[1]], HandleType.DELETE);
  }

  /**
   * Creates a handle at the specified coordinate with the given type.
   * @param {Coordinate} coordinate - The coordinate for the handle.
   * @param {HandleType} type - The type of handle.
   */
  createHandle(coordinate: Coordinate, type: HandleType): void {
    const handle = new Feature({
      geometry: new Point(coordinate),
      handleType: type,
    });

    // Store a reference to the selected feature in the handle
    handle.set('feature', this.selectedFeature);

    // Apply style based on handle type
    switch (type) {
      case HandleType.ROTATE:
        handle.setStyle(this.rotateStyle);
        break;
      case HandleType.DELETE:
        handle.setStyle(this.deleteStyle);
        break;
      case HandleType.SCALE_NE:
      case HandleType.SCALE_SE:
      case HandleType.SCALE_SW:
      case HandleType.SCALE_NW:
        handle.setStyle(this.scaleStyle);
        break;
      case HandleType.STRETCH_N:
      case HandleType.STRETCH_E:
      case HandleType.STRETCH_S:
      case HandleType.STRETCH_W:
        handle.setStyle(this.stretchStyle);
        break;
      case HandleType.TRANSLATE_CENTER:
        handle.setStyle(this.translateStyle);
        break;
      default:
        break;
    }

    // Add the handle to the source
    this.handleSource.addFeature(handle);
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
   * Handles scaling of a feature.
   * @param {Coordinate} coordinate - The current coordinate.
   * @param {HandleType} handleType - The type of handle being dragged.
   */
  handleScale(coordinate: Coordinate, handleType: HandleType): void {
    if (!this.selectedFeature || !this.startGeometry || !this.center) return;

    // Get the extent of the original geometry
    const extent = this.startGeometry.getExtent();
    const [minX, minY, maxX, maxY] = extent;
    const width = maxX - minX;
    const height = maxY - minY;

    // Calculate scale factors based on the handle being dragged
    let scaleX = 1;
    let scaleY = 1;

    switch (handleType) {
      case HandleType.SCALE_NE:
        scaleX = (coordinate[0] - minX) / width;
        scaleY = (coordinate[1] - minY) / height;
        break;

      case HandleType.SCALE_SE:
        scaleX = (coordinate[0] - minX) / width;
        scaleY = (maxY - coordinate[1]) / height;
        break;

      case HandleType.SCALE_SW:
        scaleX = (maxX - coordinate[0]) / width;
        scaleY = (maxY - coordinate[1]) / height;
        break;

      case HandleType.SCALE_NW:
        scaleX = (maxX - coordinate[0]) / width;
        scaleY = (coordinate[1] - minY) / height;
        break;
      default:
        break;
    }

    // Ensure positive scale factors
    scaleX = Math.max(0.1, scaleX);
    scaleY = Math.max(0.1, scaleY);

    // If keeping aspect ratio, use the minimum scale factor for both
    if (this.options.keepAspectRatio) {
      const minScale = Math.min(scaleX, scaleY);
      scaleX = minScale;
      scaleY = minScale;
    }

    // Clone the original geometry
    const geometry = this.startGeometry.clone();

    // Scale the geometry
    const { center } = this;
    if (geometry instanceof Point) {
      const coords = geometry.getCoordinates();
      const scaledCoords = OLTransform.scaleCoordinate(coords, center, scaleX, scaleY);
      geometry.setCoordinates(scaledCoords);
    } else if (geometry instanceof LineString) {
      const coords = geometry.getCoordinates();
      const scaledCoords = coords.map((coord) => OLTransform.scaleCoordinate(coord, center, scaleX, scaleY));
      geometry.setCoordinates(scaledCoords);
    } else if (geometry instanceof Polygon) {
      const coords = geometry.getCoordinates();
      const scaledCoords = coords.map((ring) => ring.map((coord) => OLTransform.scaleCoordinate(coord, center, scaleX, scaleY)));
      geometry.setCoordinates(scaledCoords);
    }

    // Update the feature with the new geometry
    this.selectedFeature.setGeometry(geometry);
  }

  /**
   * Scales a coordinate relative to a center point.
   * @param {Coordinate} coordinate - The coordinate to scale.
   * @param {Coordinate} center - The center point.
   * @param {number} scaleX - The X scale factor.
   * @param {number} scaleY - The Y scale factor.
   * @returns {Coordinate} The scaled coordinate.
   */
  static scaleCoordinate(coordinate: Coordinate, center: Coordinate, scaleX: number, scaleY: number): Coordinate {
    const dx = coordinate[0] - center[0];
    const dy = coordinate[1] - center[1];

    return [center[0] + dx * scaleX, center[1] + dy * scaleY];
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

    switch (handleType) {
      case HandleType.STRETCH_N:
        scaleY = (coordinate[1] - minY) / (maxY - minY);
        break;

      case HandleType.STRETCH_E:
        scaleX = (coordinate[0] - minX) / (maxX - minX);
        break;

      case HandleType.STRETCH_S:
        scaleY = (maxY - coordinate[1]) / (maxY - minY);
        break;

      case HandleType.STRETCH_W:
        scaleX = (maxX - coordinate[0]) / (maxX - minX);
        break;
      default:
        break;
    }

    // Ensure positive scale factors
    scaleX = Math.max(0.1, scaleX);
    scaleY = Math.max(0.1, scaleY);

    // Clone and scale the geometry
    const geometry = this.startGeometry.clone();
    if (geometry instanceof Point) {
      const coords = geometry.getCoordinates();
      const scaledCoords = OLTransform.scaleCoordinate(coords, this.center!, scaleX, scaleY);
      geometry.setCoordinates(scaledCoords);
    } else if (geometry instanceof LineString) {
      const coords = geometry.getCoordinates();
      const scaledCoords = coords.map((coord) => OLTransform.scaleCoordinate(coord, this.center!, scaleX, scaleY));
      geometry.setCoordinates(scaledCoords);
    } else if (geometry instanceof Polygon) {
      const coords = geometry.getCoordinates();
      const scaledCoords = coords.map((ring) => ring.map((coord) => OLTransform.scaleCoordinate(coord, this.center!, scaleX, scaleY)));
      geometry.setCoordinates(scaledCoords);
    }

    // Update the feature with the new geometry
    this.selectedFeature.setGeometry(geometry);
  }

  /**
   * Gets the cursor style for a handle type.
   * @param {HandleType} handleType - The handle type.
   * @returns {string} The cursor style.
   */
  static getCursorForHandleType(handleType: HandleType): string {
    switch (handleType) {
      case HandleType.ROTATE:
        return 'crosshair';

      case HandleType.DELETE:
        return 'pointer';

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
   * Handle pointer down events.
   * @param {MapBrowserEvent} event - The map browser event.
   * @returns {boolean} Whether the event was handled.
   */
  override handleDownEvent(event: MapBrowserEvent<PointerEvent>): boolean {
    if (this.#inHandleDownEvent) return false;
    this.#inHandleDownEvent = true;

    try {
      const { map } = event;
      const { coordinate } = event;

      // Check if we clicked on a handle
      const handleFeature = this.#getHandleAtCoordinate(coordinate, map);
      if (handleFeature) {
        const handleType = handleFeature.get('handleType') as HandleType;

        // Handle delete action immediately
        if (handleType === HandleType.DELETE) {
          const feature = handleFeature.get('feature');
          if (feature) {
            this.onDeletefeature?.(new DeleteFeatureEvent(feature as Feature));
            this.features.remove(feature);
          }
          return false;
        }

        // Start transformation
        this.currentHandle = handleFeature;
        this.startCoordinate = coordinate;
        this.#transformType = handleType;

        if (this.selectedFeature) {
          this.startGeometry = this.selectedFeature.getGeometry()?.clone();
          this.#isTransforming = true;

          // Dispatch transform start event
          this.onTransformstart?.(new TransformEvent('transformstart', this.selectedFeature));
        }

        return true;
      }

      // Check if we clicked on a feature to select it
      const features = map.getFeaturesAtPixel(event.pixel);

      if (features && features.length > 0) {
        const feature = features[0] as Feature;
        if (this.features.getArray().includes(feature)) {
          this.selectFeature(feature);

          // // Start translation if enabled
          // if (this.options.translateFeature) {
          //   this.startCoordinate = coordinate;
          //   this.startGeometry = feature.getGeometry()?.clone();
          //   this.#transformType = HandleType.TRANSLATE;
          //   this.#isTransforming = true;

          //   // Dispatch transform start event
          //   if (this.selectedFeature) {
          //     this.onTransformstart?.(new TransformEvent('transformstart', this.selectedFeature));
          //     return true;
          //   }
          // }
        }
      }

      return false;
    } finally {
      this.#inHandleDownEvent = false;
    }
  }

  /**
   * Handle pointer drag events.
   * @param {MapBrowserEvent} event - The map browser event.
   */
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
          this.handleScale(coordinate, this.#transformType);
          break;

        case HandleType.STRETCH_N:
        case HandleType.STRETCH_E:
        case HandleType.STRETCH_S:
        case HandleType.STRETCH_W:
          this.handleStretch(coordinate, this.#transformType);
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
   * @returns {boolean} Whether the event was handled.
   */
  override handleUpEvent(event: MapBrowserEvent<PointerEvent>): boolean {
    if (this.#inHandleUpEvent) return false;
    this.#inHandleUpEvent = true;

    try {
      if (this.#isTransforming && this.selectedFeature) {
        // Update handles to match the new geometry position
        this.updateHandles();

        // Dispatch transform end event
        this.onTransformend?.(new TransformEvent('transformend', this.selectedFeature));

        // Reset transformation state
        this.#isTransforming = false;
        this.currentHandle = undefined;
        this.startCoordinate = undefined;
        this.startGeometry = undefined;
        this.#transformType = undefined;
        this.angle = 0;

        return true;
      }

      return false;
    } finally {
      this.#inHandleUpEvent = false;
    }
  }

  /**
   * Handle pointer move events.
   * @param {MapBrowserEvent} event - The map browser event.
   */
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
        // Reset cursor when not over a handle and not transforming
        map.getTargetElement().style.cursor = 'default';
      }
    } finally {
      this.#inHandleMoveEvent = false;
    }
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
}
