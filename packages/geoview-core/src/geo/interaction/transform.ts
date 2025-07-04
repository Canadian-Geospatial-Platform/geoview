import { Pointer as OLPointer } from 'ol/interaction';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import { Geometry, Point, Polygon, LineString } from 'ol/geom';
import { Style, Fill, Stroke, Circle as CircleStyle, Text } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Coordinate } from 'ol/coordinate';
import { Extent, getCenter, getWidth, getHeight } from 'ol/extent';
import { fromExtent } from 'ol/geom/Polygon';
// import { getTransform } from 'ol/proj';
import { MapBrowserEvent } from 'ol';

import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
// import { convertTypeFeatureStyleToOpenLayersStyle } from '@/geo/utils/utilities';

import { Interaction, InteractionOptions } from './interaction';

/**
 * Supported options for transform interactions
 */
export type TransformOptions = InteractionOptions & {
  features?: Collection<Feature>;
  geometryGroupKey?: string;
  layers?: string[];
  style?: TypeFeatureStyle;
  translateFeature?: boolean;
  scale?: boolean;
  rotate?: boolean;
  stretch?: boolean;
  keepAspectRatio?: boolean;
  hitTolerance?: number;
  enableDelete?: boolean;
};

/**
 * Handle types for the transform interaction
 */
export enum HandleType {
  ROTATE = 'rotate',
  SCALE = 'scale',
  TRANSLATE = 'translate',
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
 * Class used for transforming features on a map.
 * @class Transform
 * @extends {Interaction}
 * @exports
 */
export class Transform extends Interaction {
  /** The embedded OpenLayers Pointer component */
  #ol_pointer: OLPointer;

  /** The collection of features to transform */
  #features: Collection<Feature>;

  /** The geometry group key to filter features */
  #geometryGroupKey?: string;

  /** The layer used to display handles */
  #handleLayer: VectorLayer<VectorSource>;

  /** The source for the handle layer */
  #handleSource: VectorSource;

  /** The currently selected feature */
  #selectedFeature: Feature | undefined = undefined;

  /** The current handle being dragged */
  #currentHandle: Feature | undefined = undefined;

  /** Options for the transform interaction */
  #options: TransformOptions;

  /** The start coordinates when dragging */
  #startCoordinate: Coordinate | undefined = undefined;

  /** The start geometry when transforming */
  #startGeometry: Geometry | undefined = undefined;

  /** The center of the feature being transformed */
  #center: Coordinate | undefined = undefined;

  /** The angle for rotation */
  #angle = 0;

  /** Callback handlers for the transform events */
  #onTransformStartHandlers: TransformEventDelegate[] = [];

  #onTransformingHandlers: TransformEventDelegate[] = [];

  #onTransformEndHandlers: TransformEventDelegate[] = [];

  #onDeleteFeatureHandlers: DeleteFeatureEventDelegate[] = [];

  // Define handle styles
  #rotateStyle = new Style({
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

  #deleteStyle = new Style({
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

  #scaleStyle = new Style({
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

  #stretchStyle = new Style({
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

  /**
   * Initializes a Transform component.
   * @param {TransformOptions} options - Object to configure the initialization of the Transform interaction.
   */
  constructor(options: TransformOptions) {
    super(options);

    this.#options = {
      translateFeature: true,
      scale: true,
      rotate: true,
      stretch: true,
      keepAspectRatio: false,
      hitTolerance: 5,
      enableDelete: true,
      ...options,
    };

    this.#features = options.features || new Collection<Feature>();
    this.#geometryGroupKey = options.geometryGroupKey;

    // Create a vector source and layer for the handles
    this.#handleSource = new VectorSource();
    this.#handleLayer = new VectorLayer({
      source: this.#handleSource,
      // style: this.#getHandleStyle.bind(this),
      zIndex: 1000,
    });

    // Create the pointer interaction
    this.#ol_pointer = new OLPointer({
      handleDownEvent: this.#handleDownEvent.bind(this),
      handleDragEvent: this.#handleDragEvent.bind(this),
      handleUpEvent: this.#handleUpEvent.bind(this),
      handleMoveEvent: this.#handleMoveEvent.bind(this),
    });
  }

  /**
   * Starts the interaction on the map.
   */
  override startInteraction(): void {
    // Add the handle layer to the map
    if (this.mapViewer) {
      this.mapViewer.map.addLayer(this.#handleLayer);

      // If we have a geometry group key, populate the features collection
      if (this.#geometryGroupKey) {
        // Find the layer with the matching geometry group ID
        const layers = this.mapViewer.map.getLayers().getArray();
        for (const layer of layers) {
          if (layer instanceof VectorLayer && layer.get('geometryGroupId') === this.#geometryGroupKey) {
            const source = layer.getSource();
            if (source instanceof VectorSource) {
              // Add all features from this layer to our collection
              source.getFeatures().forEach((feature) => {
                this.#features.push(feature);
              });
            }
          }
        }
      }

      // Set up feature collection change handlers
      this.#features.on('add', this.#onFeatureAdd.bind(this));
      this.#features.on('remove', this.#onFeatureRemove.bind(this));
    }

    // Redirect to super method to start interaction
    super.startInteraction(this.#ol_pointer);
  }

  /**
   * Stops the interaction on the map.
   */
  override stopInteraction(): void {
    // Remove the handle layer from the map
    if (this.mapViewer) {
      this.mapViewer.map.removeLayer(this.#handleLayer);

      // Remove feature collection change handlers
      this.#features.un('add', this.#onFeatureAdd.bind(this));
      this.#features.un('remove', this.#onFeatureRemove.bind(this));
    }

    // Clear any selected feature
    this.#clearHandles();
    this.#selectedFeature = undefined;

    // Redirect to super method to stop interaction
    super.stopInteraction(this.#ol_pointer);
  }

  /**
   * Gets the features being transformed.
   * @returns {Collection<Feature<Geometry>>} The features.
   */
  public getFeatures(): Collection<Feature<Geometry>> {
    return this.#features;
  }

  /**
   * Sets the features to be transformed.
   * @param {Collection<Feature<Geometry>>} features - The features to transform.
   */
  public setFeatures(features: Collection<Feature<Geometry>>): void {
    // Clear existing features
    this.#features.clear();

    // Add new features
    features.forEach((feature) => {
      this.#features.push(feature);
    });
  }

  /**
   * Adds a feature to be transformed.
   * @param {Feature<Geometry>} feature - The feature to add.
   */
  public addFeature(feature: Feature<Geometry>): void {
    this.#features.push(feature);
  }

  /**
   * Removes a feature from being transformed.
   * @param {Feature<Geometry>} feature - The feature to remove.
   */
  public removeFeature(feature: Feature<Geometry>): void {
    this.#features.remove(feature);
  }

  /**
   * Selects a feature for transformation.
   * @param {Feature<Geometry>} feature - The feature to select.
   */
  public selectFeature(feature: Feature<Geometry>): void {
    // Clear any existing selection
    this.#clearHandles();

    // Set the selected feature
    this.#selectedFeature = feature;

    // Create handles for the feature
    this.#createHandles();
  }

  /**
   * Clears the current selection.
   */
  public clearSelection(): void {
    this.#clearHandles();
    this.#selectedFeature = undefined;
  }

  /**
   * Handles when a feature is added to the collection.
   * @param {Event} event - The event.
   * @private
   */
  #onFeatureAdd(event: { element: Feature }): void {
    const feature = event.element;

    // If this is the first feature, select it
    if (this.#features.getLength() === 1 && !this.#selectedFeature) {
      this.selectFeature(feature);
    }
  }

  /**
   * Handles when a feature is removed from the collection.
   * @param {Event} event - The event.
   * @private
   */
  #onFeatureRemove(event: { element: Feature }): void {
    const feature = event.element;

    // If this was the selected feature, clear the selection
    if (this.#selectedFeature === feature) {
      this.clearSelection();
    }
  }

  /**
   * Creates handles for the selected feature.
   * @private
   */
  #createHandles(): void {
    if (!this.#selectedFeature) return;

    const geometry = this.#selectedFeature.getGeometry();
    if (!geometry) return;

    // Get the extent of the feature
    const extent = geometry.getExtent();
    const center = getCenter(extent);
    this.#center = center;

    // Create handles based on the options
    if (this.#options.scale) {
      this.#createScaleHandles(extent);
    }

    if (this.#options.stretch) {
      this.#createStretchHandles(extent);
    }

    if (this.#options.rotate) {
      this.#createRotateHandle(center, extent);
    }

    if (this.#options.enableDelete) {
      this.#createDeleteHandle(center, extent);
    }
  }

  /**
   * Creates scale handles at the corners of the extent.
   * @param {Extent} extent - The extent of the feature.
   * @private
   */
  #createScaleHandles(extent: Extent): void {
    const [minX, minY, maxX, maxY] = extent;

    // Create corner handles
    this.#createHandle([minX, minY], HandleType.SCALE_SW);
    this.#createHandle([maxX, minY], HandleType.SCALE_SE);
    this.#createHandle([maxX, maxY], HandleType.SCALE_NE);
    this.#createHandle([minX, maxY], HandleType.SCALE_NW);
  }

  /**
   * Creates stretch handles at the middle of each side of the extent.
   * @param {Extent} extent - The extent of the feature.
   * @private
   */
  #createStretchHandles(extent: Extent): void {
    const [minX, minY, maxX, maxY] = extent;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Create middle handles
    this.#createHandle([centerX, minY], HandleType.STRETCH_S);
    this.#createHandle([maxX, centerY], HandleType.STRETCH_E);
    this.#createHandle([centerX, maxY], HandleType.STRETCH_N);
    this.#createHandle([minX, centerY], HandleType.STRETCH_W);
  }

  /**
   * Creates a rotation handle above the feature.
   * @param {Coordinate} center - The center of the feature.
   * @param {Extent} extent - The extent of the feature.
   * @private
   */
  #createRotateHandle(center: Coordinate, extent: Extent): void {
    const [, , , maxY] = extent;
    const rotateY = maxY + 30; // Position the rotate handle above the feature

    this.#createHandle([center[0], rotateY], HandleType.ROTATE);
  }

  /**
   * Creates a delete handle for the feature.
   * @param {Coordinate} center - The center of the feature.
   * @param {Extent} extent - The extent of the feature.
   * @private
   */
  #createDeleteHandle(center: Coordinate, extent: Extent): void {
    const [, , maxX] = extent;
    const deleteX = maxX + 30; // Position the delete handle to the right of the feature

    this.#createHandle([deleteX, center[1]], HandleType.DELETE);
  }

  /**
   * Creates a handle at the specified coordinate with the given type.
   * @param {Coordinate} coordinate - The coordinate for the handle.
   * @param {HandleType} type - The type of handle.
   * @private
   */
  #createHandle(coordinate: Coordinate, type: HandleType): void {
    const handle = new Feature({
      geometry: new Point(coordinate),
      handleType: type,
    });

    // Store a reference to the selected feature in the handle
    handle.set('feature', this.#selectedFeature);

    // Apply style based on handle type
    switch (type) {
      case HandleType.ROTATE:
        handle.setStyle(this.#rotateStyle);
        break;
      case HandleType.DELETE:
        handle.setStyle(this.#deleteStyle);
        break;
      case HandleType.SCALE_NE:
      case HandleType.SCALE_SE:
      case HandleType.SCALE_SW:
      case HandleType.SCALE_NW:
        handle.setStyle(this.#scaleStyle);
        break;
      case HandleType.STRETCH_N:
      case HandleType.STRETCH_E:
      case HandleType.STRETCH_S:
      case HandleType.STRETCH_W:
        handle.setStyle(this.#stretchStyle);
        break;
      default:
        break;
    }

    // Add the handle to the source
    this.#handleSource.addFeature(handle);
  }

  /**
   * Clears all handles.
   * @private
   */
  #clearHandles(): void {
    this.#handleSource.clear();
  }

  // /**
  //  * Gets the style for a handle based on its type.
  //  * @param {Feature} feature - The handle feature.
  //  * @returns {Style} The style for the handle.
  //  * @private
  //  */
  // #getHandleStyle(feature: Feature): Style {
  //   const handleType = feature.get('handleType') as HandleType;

  //   // Base style for all handles
  //   const baseStyle = {
  //     image: new CircleStyle({
  //       radius: 8,
  //       fill: new Fill({
  //         color: 'rgba(255, 255, 255, 0.8)',
  //       }),
  //       stroke: new Stroke({
  //         color: '#333',
  //         width: 1,
  //       }),
  //     }),
  //   };

  //   // Customize style based on handle type
  //   switch (handleType) {
  //     case HandleType.ROTATE:
  //       return new Style({
  //         ...baseStyle,
  //         image: new CircleStyle({
  //           radius: 8,
  //           fill: new Fill({
  //             color: 'rgba(255, 255, 0, 0.8)',
  //           }),
  //           stroke: new Stroke({
  //             color: '#333',
  //             width: 1,
  //           }),
  //         }),
  //       });

  //     case HandleType.DELETE:
  //       return new Style({
  //         ...baseStyle,
  //         image: new CircleStyle({
  //           radius: 8,
  //           fill: new Fill({
  //             color: 'rgba(255, 0, 0, 0.8)',
  //           }),
  //           stroke: new Stroke({
  //             color: '#333',
  //             width: 1,
  //           }),
  //         }),
  //         text: new Text({
  //           text: 'X',
  //           fill: new Fill({
  //             color: '#fff',
  //           }),
  //           font: 'bold 12px sans-serif',
  //           offsetY: 1,
  //         }),
  //       });

  //     case HandleType.SCALE_NE:
  //     case HandleType.SCALE_SE:
  //     case HandleType.SCALE_SW:
  //     case HandleType.SCALE_NW:
  //       return new Style({
  //         ...baseStyle,
  //         image: new CircleStyle({
  //           radius: 8,
  //           fill: new Fill({
  //             color: 'rgba(0, 255, 0, 0.8)',
  //           }),
  //           stroke: new Stroke({
  //             color: '#333',
  //             width: 1,
  //           }),
  //         }),
  //       });

  //     case HandleType.STRETCH_N:
  //     case HandleType.STRETCH_E:
  //     case HandleType.STRETCH_S:
  //     case HandleType.STRETCH_W:
  //       return new Style({
  //         ...baseStyle,
  //         image: new CircleStyle({
  //           radius: 8,
  //           fill: new Fill({
  //             color: 'rgba(0, 0, 255, 0.8)',
  //           }),
  //           stroke: new Stroke({
  //             color: '#333',
  //             width: 1,
  //           }),
  //         }),
  //       });

  //     default:
  //       return new Style(baseStyle);
  //   }
  // }

  /**
   * Handles the pointer down event.
   * @param {MapBrowserEvent} event - The map browser event.
   * @returns {boolean} Whether the event was handled.
   * @private
   */
  #handleDownEvent(event: MapBrowserEvent): boolean {
    // Check if we clicked on a handle
    const handle = this.#getHandleAtPixel(event.pixel);
    if (handle) {
      this.#currentHandle = handle;
      this.#startCoordinate = event.coordinate;

      // Store the original geometry for transformation
      if (this.#selectedFeature) {
        const geometry = this.#selectedFeature.getGeometry();
        if (geometry) {
          this.#startGeometry = geometry.clone();
        }
      }

      // Emit transform start event
      const handleType = handle.get('handleType') as HandleType;
      this.#emitTransformStart({
        feature: this.#selectedFeature!,
        type: Transform.#getEventTypeFromHandleType(handleType, 'start'),
      });

      return true;
    }

    // Check if we clicked on a feature to select it
    const feature = this.#getFeatureAtPixel(event.pixel);
    if (feature && this.#features.getArray().includes(feature)) {
      this.selectFeature(feature);

      // If translate is enabled, start translation
      if (this.#options.translateFeature) {
        this.#currentHandle = new Feature({
          geometry: new Point(event.coordinate),
          handleType: HandleType.TRANSLATE,
        });
        this.#startCoordinate = event.coordinate;

        // Store the original geometry for transformation
        const geometry = feature.getGeometry();
        if (geometry) {
          this.#startGeometry = geometry.clone();
        }

        // Emit transform start event
        this.#emitTransformStart({
          feature,
          type: 'translatestart',
        });

        return true;
      }

      return false;
    }

    // If we didn't click on a handle or feature, clear the selection
    this.clearSelection();
    return false;
  }

  /**
   * Handles the pointer drag event.
   * @param {MapBrowserEvent} event - The map browser event.
   * @private
   */
  #handleDragEvent(event: MapBrowserEvent): void {
    if (!this.#currentHandle || !this.#startCoordinate || !this.#selectedFeature || !this.#startGeometry) {
      return;
    }

    const handleType = this.#currentHandle.get('handleType') as HandleType;
    const deltaX = event.coordinate[0] - this.#startCoordinate[0];
    const deltaY = event.coordinate[1] - this.#startCoordinate[1];

    switch (handleType) {
      case HandleType.TRANSLATE:
        this.#handleTranslate(deltaX, deltaY);
        break;

      case HandleType.ROTATE:
        this.#handleRotate(event.coordinate);
        break;

      case HandleType.SCALE_NE:
      case HandleType.SCALE_SE:
      case HandleType.SCALE_SW:
      case HandleType.SCALE_NW:
        this.#handleScale(event.coordinate, handleType);
        break;

      case HandleType.STRETCH_N:
      case HandleType.STRETCH_E:
      case HandleType.STRETCH_S:
      case HandleType.STRETCH_W:
        this.#handleStretch(event.coordinate, handleType);
        break;

      default:
        break;
    }

    // Update the handles to match the new geometry
    this.#updateHandles();

    // Emit transforming event
    this.#emitTransforming({
      feature: this.#selectedFeature,
      type: Transform.#getEventTypeFromHandleType(handleType, 'ing'),
    });
  }

  /**
   * Handles the pointer up event.
   * @param {MapBrowserEvent} event - The map browser event.
   * @returns {boolean} Whether the event was handled.
   * @private
   */
  #handleUpEvent(event: MapBrowserEvent): boolean {
    if (!this.#currentHandle || !this.#selectedFeature) {
      return false;
    }

    const handleType = this.#currentHandle.get('handleType') as HandleType;

    // Handle delete action
    if (handleType === HandleType.DELETE) {
      this.#emitDeleteFeature({
        feature: this.#selectedFeature,
      });

      // Remove the feature from the collection
      this.#features.remove(this.#selectedFeature);

      // Clear the selection
      this.clearSelection();
      this.#currentHandle = undefined;
      this.#startCoordinate = undefined;
      this.#startGeometry = undefined;

      return true;
    }

    // Emit transform end event
    this.#emitTransformEnd({
      feature: this.#selectedFeature,
      type: Transform.#getEventTypeFromHandleType(handleType, 'end'),
    });

    // Reset state
    this.#currentHandle = undefined;
    this.#startCoordinate = undefined;
    this.#startGeometry = undefined;

    return true;
  }

  /**
   * Handles the pointer move event.
   * @param {MapBrowserEvent} event - The map browser event.
   * @private
   */
  #handleMoveEvent(event: MapBrowserEvent): void {
    // Change cursor based on what's under the pointer
    if (!this.mapViewer) return;

    const handle = this.#getHandleAtPixel(event.pixel);
    if (handle) {
      const handleType = handle.get('handleType') as HandleType;
      this.mapViewer.map.getTargetElement().style.cursor = Transform.#getCursorForHandleType(handleType);
      return;
    }

    const feature = this.#getFeatureAtPixel(event.pixel);
    if (feature && this.#features.getArray().includes(feature)) {
      this.mapViewer.map.getTargetElement().style.cursor = 'move';
      return;
    }

    this.mapViewer.map.getTargetElement().style.cursor = 'default';
  }

  /**
   * Gets the cursor style for a handle type.
   * @param {HandleType} handleType - The handle type.
   * @returns {string} The cursor style.
   * @private
   */
  static #getCursorForHandleType(handleType: HandleType): string {
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

      default:
        return 'default';
    }
  }

  /**
   * Gets a handle at the specified pixel.
   * @param {Coordinate} pixel - The pixel coordinate.
   * @returns {Feature | undefined} The handle at the pixel, or undefined if none.
   * @private
   */
  #getHandleAtPixel(pixel: Coordinate): Feature | undefined {
    if (!this.mapViewer) return undefined;

    const hitTolerance = this.#options.hitTolerance || 5;
    let handle: Feature | undefined;

    this.mapViewer.map.forEachFeatureAtPixel(
      pixel,
      (feature) => {
        const featureAsFeature = feature as Feature;
        if (this.#handleSource.getFeatures().includes(featureAsFeature)) {
          handle = featureAsFeature;
          return true;
        }
        return false;
      },
      { hitTolerance }
    );

    return handle;
  }

  /**
   * Gets a feature at the specified pixel.
   * @param {Coordinate} pixel - The pixel coordinate.
   * @returns {Feature | undefined} The feature at the pixel, or undefined if none.
   * @private
   */
  #getFeatureAtPixel(pixel: Coordinate): Feature | undefined {
    if (!this.mapViewer) return undefined;

    const hitTolerance = this.#options.hitTolerance || 5;
    let foundFeature: Feature | undefined;

    this.mapViewer.map.forEachFeatureAtPixel(
      pixel,
      (feature) => {
        const featureAsFeature = feature as Feature;

        // Skip handle features
        if (this.#handleSource.getFeatures().includes(featureAsFeature)) {
          return false;
        }

        // If there's a geometry group key, check if the feature belongs to it
        if (this.#geometryGroupKey) {
          // Get the layer that contains this feature
          const layer = this.mapViewer.map
            .getLayers()
            .getArray()
            .find((lyr) => {
              if (lyr instanceof VectorLayer) {
                const source = lyr.getSource();
                if (source instanceof VectorSource) {
                  return source.getFeatures().includes(featureAsFeature);
                }
              }
              return false;
            });

          // Check if the layer has the correct geometry group ID
          if (layer && layer.get('geometryGroupId') === this.#geometryGroupKey) {
            foundFeature = featureAsFeature;
            return true;
          }
          return false;
        }

        // If no geometry group key is specified, select any feature
        foundFeature = featureAsFeature;
        return true;
      },
      { hitTolerance }
    );

    return foundFeature;
  }

  /**
   * Handles translation of a feature.
   * @param {number} deltaX - The change in X coordinate.
   * @param {number} deltaY - The change in Y coordinate.
   * @private
   */
  #handleTranslate(deltaX: number, deltaY: number): void {
    if (!this.#selectedFeature || !this.#startGeometry) return;

    // Clone the original geometry
    const geometry = this.#startGeometry.clone();

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
    this.#selectedFeature.setGeometry(geometry);

    // Update the center
    if (this.#center) {
      this.#center = [this.#center[0] + deltaX, this.#center[1] + deltaY];
    }
  }

  /**
   * Handles rotation of a feature.
   * @param {Coordinate} coordinate - The current coordinate.
   * @private
   */
  #handleRotate(coordinate: Coordinate): void {
    if (!this.#selectedFeature || !this.#startGeometry || !this.#center || !this.#startCoordinate) return;

    // Calculate the angle between the start point and the current point
    const startAngle = Math.atan2(this.#startCoordinate[1] - this.#center[1], this.#startCoordinate[0] - this.#center[0]);

    const currentAngle = Math.atan2(coordinate[1] - this.#center[1], coordinate[0] - this.#center[0]);

    // Calculate the rotation angle
    this.#angle = currentAngle - startAngle;

    // Clone the original geometry
    const geometry = this.#startGeometry.clone();

    // Rotate the geometry
    if (geometry instanceof Point) {
      const coords = geometry.getCoordinates();
      const rotatedCoords = Transform.#rotateCoordinate(coords, this.#center, this.#angle);
      geometry.setCoordinates(rotatedCoords);
    } else if (geometry instanceof LineString) {
      const coords = geometry.getCoordinates();
      const rotatedCoords = coords.map((coord) => Transform.#rotateCoordinate(coord, this.#center!, this.#angle));
      geometry.setCoordinates(rotatedCoords);
    } else if (geometry instanceof Polygon) {
      const coords = geometry.getCoordinates();
      const rotatedCoords = coords.map((ring) => ring.map((coord) => Transform.#rotateCoordinate(coord, this.#center!, this.#angle)));
      geometry.setCoordinates(rotatedCoords);
    }

    // Update the feature with the new geometry
    this.#selectedFeature.setGeometry(geometry);
  }

  /**
   * Rotates a coordinate around a center point by an angle.
   * @param {Coordinate} coordinate - The coordinate to rotate.
   * @param {Coordinate} center - The center point.
   * @param {number} angle - The angle in radians.
   * @returns {Coordinate} The rotated coordinate.
   * @private
   */
  static #rotateCoordinate(coordinate: Coordinate, center: Coordinate, angle: number): Coordinate {
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
   * @private
   */
  #handleScale(coordinate: Coordinate, handleType: HandleType): void {
    if (!this.#selectedFeature || !this.#startGeometry || !this.#center) return;

    // Get the extent of the original geometry
    const extent = this.#startGeometry.getExtent();
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
    if (this.#options.keepAspectRatio) {
      const minScale = Math.min(scaleX, scaleY);
      scaleX = minScale;
      scaleY = minScale;
    }

    // Clone the original geometry
    const geometry = this.#startGeometry.clone();

    // Scale the geometry
    if (geometry instanceof Point) {
      const coords = geometry.getCoordinates();
      const scaledCoords = Transform.#scaleCoordinate(coords, this.#center, scaleX, scaleY);
      geometry.setCoordinates(scaledCoords);
    } else if (geometry instanceof LineString) {
      const coords = geometry.getCoordinates();
      if (!this.#center) return;
      const scaledCoords = coords.map((coord) => Transform.#scaleCoordinate(coord, this.#center!, scaleX, scaleY));
      geometry.setCoordinates(scaledCoords);
    } else if (geometry instanceof Polygon) {
      const coords = geometry.getCoordinates();
      const scaledCoords = coords.map((ring) => ring.map((coord) => Transform.#scaleCoordinate(coord, this.#center!, scaleX, scaleY)));
      geometry.setCoordinates(scaledCoords);
    }

    // Update the feature with the new geometry
    this.#selectedFeature.setGeometry(geometry);
  }

  /**
   * Scales a coordinate relative to a center point.
   * @param {Coordinate} coordinate - The coordinate to scale.
   * @param {Coordinate} center - The center point.
   * @param {number} scaleX - The X scale factor.
   * @param {number} scaleY - The Y scale factor.
   * @returns {Coordinate} The scaled coordinate.
   * @private
   */
  static #scaleCoordinate(coordinate: Coordinate, center: Coordinate, scaleX: number, scaleY: number): Coordinate {
    const dx = coordinate[0] - center[0];
    const dy = coordinate[1] - center[1];

    return [center[0] + dx * scaleX, center[1] + dy * scaleY];
  }

  /**
   * Handles stretching of a feature.
   * @param {Coordinate} coordinate - The current coordinate.
   * @param {HandleType} handleType - The type of handle being dragged.
   * @private
   */
  #handleStretch(coordinate: Coordinate, handleType: HandleType): void {
    if (!this.#selectedFeature || !this.#startGeometry) return;

    // Get the extent of the original geometry
    const extent = this.#startGeometry.getExtent();
    const [minX, minY, maxX, maxY] = extent;

    // Create a new extent based on the handle being dragged
    let newExtent: Extent = [...extent];

    switch (handleType) {
      case HandleType.STRETCH_N:
        newExtent = [minX, minY, maxX, coordinate[1]];
        break;

      case HandleType.STRETCH_E:
        newExtent = [minX, minY, coordinate[0], maxY];
        break;

      case HandleType.STRETCH_S:
        newExtent = [minX, coordinate[1], maxX, maxY];
        break;

      case HandleType.STRETCH_W:
        newExtent = [coordinate[0], minY, maxX, maxY];
        break;

      default:
        break;
    }

    // Create a new geometry from the stretched extent
    const newGeometry = fromExtent(newExtent);

    // Update the feature with the new geometry
    this.#selectedFeature.setGeometry(newGeometry);
  }

  /**
   * Updates the positions of the handles based on the current feature geometry.
   * @private
   */
  #updateHandles(): void {
    // Clear existing handles
    this.#clearHandles();

    // Create new handles
    this.#createHandles();
  }

  /**
   * Gets the event type from a handle type.
   * @param {HandleType} handleType - The handle type.
   * @param {string} suffix - The event suffix (start, ing, end).
   * @returns {string} The event type.
   * @private
   */
  static #getEventTypeFromHandleType(handleType: HandleType, suffix: string): string {
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
   * Emits a transform start event to all handlers.
   * @param {TransformEvent} event - The event to emit.
   * @private
   */
  #emitTransformStart(event: TransformEvent): void {
    EventHelper.emitEvent(this, this.#onTransformStartHandlers, event);
  }

  /**
   * Registers a transform start event handler.
   * @param {TransformEventDelegate} callback - The callback to be executed whenever the event is emitted.
   */
  onTransformStart(callback: TransformEventDelegate): void {
    EventHelper.onEvent(this.#onTransformStartHandlers, callback);
  }

  /**
   * Unregisters a transform start event handler.
   * @param {TransformEventDelegate} callback - The callback to stop being called whenever the event is emitted.
   */
  offTransformStart(callback: TransformEventDelegate): void {
    EventHelper.offEvent(this.#onTransformStartHandlers, callback);
  }

  /**
   * Emits a transforming event to all handlers.
   * @param {TransformEvent} event - The event to emit.
   * @private
   */
  #emitTransforming(event: TransformEvent): void {
    EventHelper.emitEvent(this, this.#onTransformingHandlers, event);
  }

  /**
   * Registers a transforming event handler.
   * @param {TransformEventDelegate} callback - The callback to be executed whenever the event is emitted.
   */
  onTransforming(callback: TransformEventDelegate): void {
    EventHelper.onEvent(this.#onTransformingHandlers, callback);
  }

  /**
   * Unregisters a transforming event handler.
   * @param {TransformEventDelegate} callback - The callback to stop being called whenever the event is emitted.
   */
  offTransforming(callback: TransformEventDelegate): void {
    EventHelper.offEvent(this.#onTransformingHandlers, callback);
  }

  /**
   * Emits a transform end event to all handlers.
   * @param {TransformEvent} event - The event to emit.
   * @private
   */
  #emitTransformEnd(event: TransformEvent): void {
    EventHelper.emitEvent(this, this.#onTransformEndHandlers, event);
  }

  /**
   * Registers a transform end event handler.
   * @param {TransformEventDelegate} callback - The callback to be executed whenever the event is emitted.
   */
  onTransformEnd(callback: TransformEventDelegate): void {
    EventHelper.onEvent(this.#onTransformEndHandlers, callback);
  }

  /**
   * Unregisters a transform end event handler.
   * @param {TransformEventDelegate} callback - The callback to stop being called whenever the event is emitted.
   */
  offTransformEnd(callback: TransformEventDelegate): void {
    EventHelper.offEvent(this.#onTransformEndHandlers, callback);
  }

  /**
   * Emits a delete feature event to all handlers.
   * @param {DeleteFeatureEvent} event - The event to emit.
   * @private
   */
  #emitDeleteFeature(event: DeleteFeatureEvent): void {
    EventHelper.emitEvent(this, this.#onDeleteFeatureHandlers, event);
  }

  /**
   * Registers a delete feature event handler.
   * @param {DeleteFeatureEventDelegate} callback - The callback to be executed whenever the event is emitted.
   */
  onDeleteFeature(callback: DeleteFeatureEventDelegate): void {
    EventHelper.onEvent(this.#onDeleteFeatureHandlers, callback);
  }

  /**
   * Unregisters a delete feature event handler.
   * @param {DeleteFeatureEventDelegate} callback - The callback to stop being called whenever the event is emitted.
   */
  offDeleteFeature(callback: DeleteFeatureEventDelegate): void {
    EventHelper.offEvent(this.#onDeleteFeatureHandlers, callback);
  }
}

/**
 * Define a delegate for the event handler function signature
 */
type TransformEventDelegate = EventDelegateBase<Transform, TransformEvent, void>;

/**
 * Define an event for transform operations
 */
export type TransformEvent = {
  feature: Feature;
  type: string;
};

/**
 * Define a delegate for the delete feature event handler function signature
 */
type DeleteFeatureEventDelegate = EventDelegateBase<Transform, DeleteFeatureEvent, void>;

/**
 * Define an event for delete feature operations
 */
export type DeleteFeatureEvent = {
  feature: Feature;
};
