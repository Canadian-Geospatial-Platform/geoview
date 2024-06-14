import VectorLayer from 'ol/layer/Vector';
import VectorSource, { Options as VectorSourceOptions } from 'ol/source/Vector';
import { Feature } from 'ol';
import { Geometry as OLGeometry, Circle, LineString, Point, Polygon } from 'ol/geom';
import { Coordinate } from 'ol/coordinate';
import { Fill, Stroke, Style, Icon } from 'ol/style';
import { Options as VectorLayerOptions } from 'ol/layer/BaseVector';
import { asArray, asString } from 'ol/color';

import { MapViewer } from '@/geo/map/map-viewer';
import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { generateId, setAlphaColor, getScriptAndAssetURL } from '@/core/utils/utilities';
import { TypeStyleGeometry } from '@/geo/map/map-schema-types';
import { Projection } from '@/geo/utils/projection';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { logger } from '@/core/utils/logger';

import { TypeFeatureCircleStyle, TypeFeatureStyle, TypeIconStyle } from './geometry-types';

/**
 * Store a group of features
 */
interface FeatureCollection {
  geometryGroupId: string;
  vectorLayer: VectorLayer<VectorSource>;
  vectorSource: VectorSource;
}

/**
 * Class used to manage vector geometries (Polyline, Polygon, Circle, Marker...)
 *
 * @exports
 * @class GeometryApi
 */
export class GeometryApi {
  // reference to the map id
  #mapId: string;

  // used to store geometry groups
  geometryGroups: FeatureCollection[] = [];

  // contains all the added geometries
  geometries: Feature[] = [];

  // default geometry group name
  defaultGeometryGroupId = 'defaultGeomGroup';

  // index of the active geometry group used to add new geometries in the map
  activeGeometryGroupIndex = 0;

  /** used to reference the map viewer */
  mapViewer: MapViewer;

  // Keep all callback delegates references
  #onGeometryAddedHandlers: GeometryAddedDelegate[] = [];

  /**
   * Constructs a Geometry class and creates a geometry group in the process.
   * @param {MapViewer} mapViewer a reference to the map viewer
   */
  constructor(mapViewer: MapViewer) {
    this.mapViewer = mapViewer;
    this.#mapId = mapViewer.mapId;

    // create default geometry group
    this.createGeometryGroup(this.defaultGeometryGroupId);
  }

  /**
   * Emits an event to all handlers.
   * @param {GeometryAddedEvent} event The event to emit
   * @private
   */
  #emitGeometryAdded(event: GeometryAddedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onGeometryAddedHandlers, event);
  }

  /**
   * Registers a geometry added event handler.
   * @param {GeometryAddedDelegate} callback The callback to be executed whenever the event is emitted
   */
  onGeometryAdded(callback: GeometryAddedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onGeometryAddedHandlers, callback);
  }

  /**
   * Unregisters a geometry added event handler.
   * @param {GeometryAddedDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offGeometryAdded(callback: GeometryAddedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onGeometryAddedHandlers, callback);
  }

  /**
   * Create a polyline using an array of lng/lat points
   *
   * @param {Coordinate} points points of lng/lat to draw a polyline
   * @param options polyline options including styling
   * @param {string} id an optional id to be used to manage this geometry
   *
   * @returns {Feature} a geometry containing the id and the created geometry
   */
  addPolyline(
    points: Coordinate,
    options?: {
      projection?: number;
      geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
      style?: TypeFeatureStyle;
    },
    id?: string
  ): Feature {
    const polylineOptions = options || {};

    const featureId = generateId(id);

    // create a line geometry
    const polyline = new Feature({
      geometry: new LineString(points, polylineOptions.geometryLayout).transform(
        `EPSG:${options?.projection || 4326}`,
        Projection.PROJECTIONS[MapEventProcessor.getMapState(this.#mapId).currentProjection]
      ),
    });

    // if style is provided then set override the vector layer style for this feature
    if (polylineOptions.style) {
      let fill: Fill | undefined;
      let stroke: Stroke | undefined;

      if (polylineOptions.style.fillColor) {
        fill = new Fill({
          color: asString(setAlphaColor(asArray(polylineOptions.style.fillColor), polylineOptions.style.fillOpacity || 1)),
        });
      }

      if (polylineOptions.style.strokeColor || polylineOptions.style.strokeOpacity || polylineOptions.style.strokeWidth) {
        stroke = new Stroke({
          color: asString(setAlphaColor(asArray(polylineOptions.style.strokeColor || 'blue'), polylineOptions.style.strokeOpacity || 1)),
          width: polylineOptions.style.strokeWidth || 1,
        });
      }

      polyline.setStyle(
        new Style({
          fill,
          stroke,
        })
      );
    }

    // set a feature id and a geometry group index for this geometry
    polyline.set('featureId', featureId);
    polyline.set('GeometryGroupIndex', this.activeGeometryGroupIndex);

    // add geometry to feature collection
    this.geometryGroups[this.activeGeometryGroupIndex].vectorSource.addFeature(polyline);

    // add the geometry to the geometries array
    this.geometries.push(polyline);

    // emit an event that a geometry has been added
    this.#emitGeometryAdded(polyline);

    return polyline;
  }

  /**
   * Create a new polygon
   *
   * @param {Coordinate} points array of points to create the polygon
   * @param options polygon options including styling
   * @param {string} optionalFeatureId an optional id to be used to manage this geometry
   *
   * @returns {Feature} a geometry containing the id and the created geometry
   */
  addPolygon(
    points: number[] | Coordinate[][],
    options?: {
      projection?: number;
      geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
      style?: TypeFeatureStyle;
    },
    optionalFeatureId?: string
  ): Feature {
    const polygonOptions = options || {};

    const featureId = generateId(optionalFeatureId);

    // create a polygon geometry
    const polygon = new Feature({
      geometry: new Polygon(points, polygonOptions.geometryLayout).transform(
        `EPSG:${options?.projection || 4326}`,
        Projection.PROJECTIONS[MapEventProcessor.getMapState(this.#mapId).currentProjection]
      ),
    });

    // if style is provided then set override the vector layer style for this feature
    if (polygonOptions.style) {
      let fill: Fill | undefined;
      let stroke: Stroke | undefined;

      if (polygonOptions.style.fillColor) {
        fill = new Fill({
          color: asString(setAlphaColor(asArray(polygonOptions.style.fillColor), polygonOptions.style.fillOpacity || 1)),
        });
      }

      if (polygonOptions.style.strokeColor || polygonOptions.style.strokeOpacity || polygonOptions.style.strokeWidth) {
        stroke = new Stroke({
          color: asString(setAlphaColor(asArray(polygonOptions.style.strokeColor || 'blue'), polygonOptions.style.strokeOpacity || 1)),
          width: polygonOptions.style.strokeWidth || 1,
        });
      }

      polygon.setStyle(
        new Style({
          fill,
          stroke,
        })
      );
    }

    // set a feature id and a geometry group index for this geometry
    polygon.set('featureId', featureId);
    polygon.set('GeometryGroupIndex', this.activeGeometryGroupIndex);

    // add geometry to feature collection
    this.geometryGroups[this.activeGeometryGroupIndex].vectorSource.addFeature(polygon);

    // add the geometry to the geometries array
    this.geometries.push(polygon);

    // emit an event that a geometry has been added
    this.#emitGeometryAdded(polygon);

    return polygon;
  }

  /**
   * Create a new circle
   *
   * @param {Coordinate} coordinate long lat coordinate of the circle
   * @param options circle options including styling
   * @param {string} optionalFeatureId an optional id to be used to manage this geometry
   *
   * @returns {Feature} a geometry containing the id and the created geometry
   */
  addCircle(
    coordinate: Coordinate,
    options?: {
      projection?: number;
      geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
      style?: TypeFeatureCircleStyle;
    },
    optionalFeatureId?: string
  ): Feature {
    const circleOptions = options || {};

    const featureId = generateId(optionalFeatureId);

    const projectedCoordinates = Projection.transform(
      coordinate,
      `EPSG:${options?.projection || 4326}`,
      Projection.PROJECTIONS[MapEventProcessor.getMapState(this.#mapId).currentProjection]
    );

    // get radius, if not defined, set default
    const radius = circleOptions.style !== undefined ? circleOptions.style.radius || 1 : 1;

    // create a circle geometry
    const circle = new Feature({
      geometry: new Circle(projectedCoordinates, radius * 10000, circleOptions.geometryLayout),
    });

    // if style is provided then set override the vector layer style for this feature
    if (circleOptions.style) {
      let fill: Fill | undefined;
      let stroke: Stroke | undefined;

      if (circleOptions.style.fillColor) {
        fill = new Fill({
          color: asString(setAlphaColor(asArray(circleOptions.style.fillColor), circleOptions.style.fillOpacity || 1)),
        });
      }

      if (circleOptions.style.strokeColor || circleOptions.style.strokeOpacity || circleOptions.style.strokeWidth) {
        stroke = new Stroke({
          color: asString(setAlphaColor(asArray(circleOptions.style.strokeColor || 'blue'), circleOptions.style.strokeOpacity || 1)),
          width: circleOptions.style.strokeWidth || 1,
        });
      }

      circle.setStyle(
        new Style({
          fill,
          stroke,
        })
      );
    }

    // set a feature id and a geometry group index for this geometry
    circle.set('featureId', featureId);
    circle.set('GeometryGroupIndex', this.activeGeometryGroupIndex);

    // add geometry to feature collection
    this.geometryGroups[this.activeGeometryGroupIndex].vectorSource.addFeature(circle);

    // add the geometry to the geometries array
    this.geometries.push(circle);

    // emit an event that a geometry has been added
    this.#emitGeometryAdded(circle);

    return circle;
  }

  /**
   * Create a new marker icon
   *
   * @param {Coordinate} coordinate the long lat position of the marker
   * @param options marker options including styling
   * @param {string} optionalFeatureId an optional id to be used to manage this geometry
   *
   * @returns {Feature} a geometry containing the id and the created geometry
   */
  addMarkerIcon(
    coordinate: Coordinate,
    options?: {
      projection?: number;
      geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
      style?: TypeIconStyle;
    },
    optionalFeatureId?: string
  ): Feature {
    // Read the params and set defaults when needed
    const markerOptions = options || {
      style: {
        anchor: [0.5, 256],
        size: [256, 256],
        scale: 0.1,
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        src: `${getScriptAndAssetURL()}/img/Marker.png`,
      },
    };

    const featureId = generateId(optionalFeatureId);

    // create a point feature
    const marker = new Feature({
      geometry: new Point(coordinate, markerOptions.geometryLayout).transform(
        `EPSG:${options?.projection || 4326}`,
        Projection.PROJECTIONS[MapEventProcessor.getMapState(this.#mapId).currentProjection]
      ),
    });

    marker.setStyle(
      new Style({
        // ? unknown type cannot be use, need to escape
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        image: new Icon(markerOptions.style as any),
      })
    );

    // set a feature id and a geometry group index for this geometry
    marker.set('featureId', featureId);
    marker.set('GeometryGroupIndex', this.activeGeometryGroupIndex);

    // add geometry to feature collection
    this.geometryGroups[this.activeGeometryGroupIndex].vectorSource.addFeature(marker);

    // add the geometry to the geometries array
    this.geometries.push(marker);

    // emit an event that a geometry has been added
    this.#emitGeometryAdded(marker);

    return marker;
  }

  /**
   * Find a feature using it's id
   *
   * @param {string} featureId the id of the feature to return
   *
   * @returns {Feature} a feature having the specified id
   */
  getGeometry(featureId: string): Feature {
    return this.geometries.filter((layer) => layer.get('featureId') === featureId)[0];
  }

  /**
   * Delete a feature using the id and delete it from the groups and the map
   *
   * @param {string} featureId the id of the feature to delete
   */
  deleteGeometry(featureId: string): void {
    for (let i = 0; i < this.geometries.length; i++) {
      if (this.geometries[i].get('featureId') === featureId) {
        this.deleteGeometryFromGroups(featureId);

        this.geometries[i].dispose();

        this.geometries.splice(i, 1);

        break;
      }
    }
  }

  /**
   * Create a new geometry group to manage multiple geometries at once
   *
   * @param {string} geometryGroupId the id of the group to use when managing this group
   * @param options an optional vector layer and vector source options
   * @returns {FeatureCollection} created geometry group
   */
  createGeometryGroup(
    geometryGroupId: string,
    options?: {
      vectorLayerOptions?: VectorLayerOptions<VectorSource>;
      vectorSourceOptions?: VectorSourceOptions<Feature>;
    }
  ): FeatureCollection {
    const geometryGroupOptions = options || {};

    let geometryGroup = this.getGeometryGroup(geometryGroupId);
    if (!geometryGroup) {
      const vectorSource = new VectorSource(geometryGroupOptions.vectorSourceOptions);

      const vectorLayer = new VectorLayer({
        ...geometryGroupOptions.vectorLayerOptions,
        source: vectorSource,
      });

      geometryGroup = {
        geometryGroupId,
        vectorLayer,
        vectorSource,
      };

      if (geometryGroup.vectorLayer.getVisible()) {
        this.mapViewer.map.addLayer(geometryGroup.vectorLayer);
        geometryGroup.vectorLayer.changed();
      }
      this.geometryGroups.push(geometryGroup);
    }

    return geometryGroup;
  }

  /**
   * set the active geometry group (the geometry group used when adding geometries).
   * If id is not specified, use the default geometry group.
   *
   * @param {string} id optional the id of the group to set as active
   */
  setActiveGeometryGroup(id?: string): void {
    // if group name not give, add to default group
    const geometryGroupId = id || this.defaultGeometryGroupId;
    for (let i = 0; i < this.geometryGroups.length; i++) {
      if (this.geometryGroups[i].geometryGroupId === geometryGroupId) {
        this.activeGeometryGroupIndex = i;
        break;
      }
    }
  }

  /**
   * Get the active geometry group
   *
   * @returns {FeatureCollection} the active geometry group
   */
  getActiveGeometryGroup(): FeatureCollection {
    return this.geometryGroups[this.activeGeometryGroupIndex];
  }

  /**
   * Get the geometry group by using the ID specified when the group was created
   * if geometryGroupid is not provided, return the active geometry group
   *
   * @param {string} geometryGroupId the id of the geometry group to return
   *
   * @returns the geomtry group
   */
  getGeometryGroup(geometryGroupId?: string): FeatureCollection | undefined {
    if (geometryGroupId) {
      const geometryGroupIndex = this.geometryGroups.findIndex((theGeometryGroup) => theGeometryGroup.geometryGroupId === geometryGroupId);
      if (geometryGroupIndex === -1) return undefined;
      return this.geometryGroups[geometryGroupIndex];
    }
    return this.geometryGroups[this.activeGeometryGroupIndex];
  }

  /**
   * Find the groups that contain the geometry using it's id
   *
   * @param {string} featureId the id of the geometry
   *
   * @returns {FeatureCollection[]} the groups that contain the geometry
   */
  getGeometryGroupsByFeatureId(featureId: string): FeatureCollection[] {
    const returnValue: FeatureCollection[] = [];
    for (let i = 0; i < this.geometryGroups.length; i++) {
      const geometries = this.geometryGroups[i].vectorLayer.getSource()?.getFeatures() || [];
      for (let j = 0; j < geometries.length; j++) {
        const geometry = geometries[j];

        if (geometry.get('featureId') === featureId) returnValue.push(this.geometryGroups[i]);
      }
    }

    return returnValue;
  }

  /**
   * Show the identified geometry group on the map
   * if geometryGroupId is not provided, use the active geometry group
   *
   * @param {string} geometryGroupId optional the id of the group to show on the map
   */
  setGeometryGroupAsVisible(geometryGroupId?: string): void {
    const geometryGroup = this.getGeometryGroup(geometryGroupId)!;

    geometryGroup.vectorLayer.setVisible(true);
    geometryGroup.vectorLayer.changed();
  }

  /**
   * hide the identified geometry group from the map
   * if groupId is not provided, use the active geometry group
   *
   * @param {string} geometryGroupId optional the id of the group to show on the map
   */
  setGeometryGroupAsInvisible(geometryGroupId?: string): void {
    const geometryGroup = this.getGeometryGroup(geometryGroupId)!;

    geometryGroup.vectorLayer.setVisible(false);
    geometryGroup.vectorLayer.changed();
  }

  /**
   * Add a new geometry to the group whose identifier is equal to geometryGroupId.
   * if geometryGroupId is not provided, use the active geometry group. If the
   * geometry group doesn't exist, create it.
   *
   * @param {Feature} geometry the geometry to be added to the group
   * @param {string} geometryGroupId optional id of the group to add the geometry to
   */
  addToGeometryGroup(geometry: Feature, geometryGroupId?: string): void {
    let geometryGroup: FeatureCollection;
    if (geometryGroupId) {
      // create geometry group if it does not exist
      geometryGroup = this.createGeometryGroup(geometryGroupId);
    } else {
      geometryGroup = this.geometryGroups[this.activeGeometryGroupIndex];
    }

    try {
      geometryGroup.vectorLayer.getSource()?.addFeature(geometry);
      geometryGroup.vectorLayer.changed();
    } catch (error) {
      logger.logError(`Error adding geometry to group ${geometryGroupId}`, error);
    }
  }

  /**
   * Find the groups that the feature exists in and delete the feature from those groups
   *
   * @param {string} featureId the geometry id
   */
  deleteGeometryFromGroups(featureId: string): void {
    const geometry = this.getGeometry(featureId);
    for (let i = 0; i < this.geometryGroups.length; i++) {
      this.geometryGroups[i].vectorLayer
        .getSource()
        ?.getFeatures()
        .forEach((layerGeometry) => {
          if (geometry === layerGeometry) {
            this.geometryGroups[i].vectorLayer.getSource()?.removeFeature(geometry);
          }
        });
      this.geometryGroups[i].vectorLayer.changed();
    }
  }

  /**
   * Delete a specific feature from a group using the feature id
   * If geometryGroupid is not provided, the active geometry group is used.
   *
   * @param {string} featureId the feature id to be deleted
   * @param {string} geometryGroupid optional group id
   */
  deleteGeometryFromGroup(featureId: string, geometryGroupid?: string): void {
    const geometry = this.getGeometry(featureId);
    const geometryGroup = this.getGeometryGroup(geometryGroupid)!;
    geometryGroup.vectorLayer
      .getSource()
      ?.getFeatures()
      .forEach((layerGeometry) => {
        if (geometry === layerGeometry) {
          geometryGroup.vectorLayer.getSource()?.removeFeature(geometry);
        }
      });
    geometryGroup.vectorLayer.changed();
  }

  /**
   * Delete all geometries from the geometry group but keep the group
   * If geometryGroupid is not provided, the active geometry group is used.
   *
   * @param {string} geometryGroupid optional group id
   * @returns {FeatureCollection} the group with empty layers
   */
  deleteGeometriesFromGroup(geometryGroupid?: string): FeatureCollection {
    const geometryGroup = this.getGeometryGroup(geometryGroupid)!;
    geometryGroup.vectorLayer
      .getSource()
      ?.getFeatures()
      .forEach((geometry) => {
        geometryGroup.vectorLayer.getSource()?.removeFeature(geometry);
      });
    geometryGroup.vectorLayer.changed();

    return geometryGroup;
  }

  /**
   * Delete a geometry group and all the geometries from the map.
   * If geometryGroupid is not provided, the active geometry group is used.
   * The default geometry group can't be deleted.
   *
   * @param {string} geometryGroupid optional id of the geometry group to delete
   */
  deleteGeometryGroup(geometryGroupid?: string): void {
    const geometryGroup = this.deleteGeometriesFromGroup(geometryGroupid);
    if (geometryGroup.geometryGroupId !== this.defaultGeometryGroupId) {
      for (let i = 0; i < this.geometryGroups.length; i++) {
        if (this.geometryGroups[i].geometryGroupId === geometryGroup.geometryGroupId) {
          this.geometryGroups.splice(i, 1);
        }
      }
    }
  }

  /**
   * Creates a Geometry given a geometry type and coordinates expected in any logical format.
   * @param geometryType - The geometry type to create
   * @param coordinates - The coordinates to use to create the geometry
   * @returns The OpenLayers Geometry
   */
  static createGeometryFromType(
    geometryType: TypeStyleGeometry,
    coordinates: Coordinate | Coordinate[] | Coordinate[][] | number[]
  ): OLGeometry {
    switch (geometryType) {
      case 'Point':
        // Create a point geometry
        return new Point(coordinates as Coordinate);

      case 'LineString':
        // Create a line geometry
        return new LineString(coordinates as Coordinate[] | number[]);

      case 'Polygon':
        // Create a polygon geometry
        return new Polygon(coordinates as Coordinate[][] | number[]);

      // Add support for other geometry types as needed
      default:
        throw new Error(`Unsupported geometry type: ${geometryType}`);
    }
  }
}

/**
 * Define a delegate for the event handler function signature
 */
type GeometryAddedDelegate = EventDelegateBase<GeometryApi, GeometryAddedEvent, void>;

/**
 * Event interface for GeometryAdded
 */
export type GeometryAddedEvent<T extends OLGeometry = OLGeometry> = Feature<T>;
