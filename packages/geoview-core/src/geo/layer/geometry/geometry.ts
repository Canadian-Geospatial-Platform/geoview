import VectorLayer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import type { Options as VectorSourceOptions } from 'ol/source/Vector';
import VectorSource from 'ol/source/Vector';
import type { Geometry as OLGeometry } from 'ol/geom';
import { Circle, LineString, MultiLineString, Point, Polygon, MultiPolygon, MultiPoint } from 'ol/geom';
import type { Coordinate } from 'ol/coordinate';
import { Fill, Stroke, Style, Icon } from 'ol/style';
import type { Options as VectorLayerOptions } from 'ol/layer/BaseVector';
import { asArray, asString } from 'ol/color';

import type { MapViewer } from '@/geo/map/map-viewer';
import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import { setAlphaColor, getScriptAndAssetURL, generateId } from '@/core/utils/utilities';
import type { TypeStyleGeometry } from '@/api/types/map-schema-types';
import { Projection } from '@/geo/utils/projection';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { logger } from '@/core/utils/logger';

import type { TypeFeatureCircleStyle, TypeFeatureStyle, TypeIconStyle } from '@/geo/layer/geometry/geometry-types';
import { NotSupportedError } from '@/core/exceptions/core-exceptions';
import { InvaliGeometryGroupIdError } from '@/core/exceptions/geoview-exceptions';

/**
 * Store a group of features
 */
interface FeatureCollection {
  geometryGroupId: string;
  vectorLayer: VectorLayer<VectorSource>;
  vectorSource: VectorSource;
}

/**
 * Class used to manage vector geometries (Polyline, Polygon, Circle, Marker...).
 */
export class GeometryApi {
  /** The map id */
  #mapId: string;

  /** The geometry groups */
  #geometryGroups: FeatureCollection[] = [];

  /** All added geometries */
  geometries: Feature[] = [];

  /** The default geometry group name */
  defaultGeometryGroupId = 'defaultGeomGroup';

  /** The index of the active geometry group used to add new geometries in the map */
  #activeGeometryGroupIndex = 0;

  /** Reference to the map viewer */
  #mapViewer: MapViewer;

  /** Callback delegates for the geometry added event */
  #onGeometryAddedHandlers: GeometryAddedDelegate[] = [];

  /**
   * Constructs a Geometry class and creates a geometry group in the process.
   *
   * @param mapViewer - A reference to the map viewer
   */
  constructor(mapViewer: MapViewer) {
    this.#mapViewer = mapViewer;
    this.#mapId = mapViewer.mapId;
  }

  /**
   * Emits an event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitGeometryAdded(event: GeometryAddedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onGeometryAddedHandlers, event);
  }

  /**
   * Registers a geometry added event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onGeometryAdded(callback: GeometryAddedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onGeometryAddedHandlers, callback);
  }

  /**
   * Unregisters a geometry added event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offGeometryAdded(callback: GeometryAddedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onGeometryAddedHandlers, callback);
  }

  /**
   * Creates a polyline using an array of lon/lat points.
   *
   * @param points - The points of lon/lat to draw a polyline
   * @param options - Optional polyline options including styling
   * @param id - Optional id to be used to manage this geometry
   * @param groupId - Optional group id in which we want to add the geometry
   * @returns The created polyline feature
   */
  addPolyline(
    points: Coordinate,
    options?: {
      projection?: number;
      geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
      style?: TypeFeatureStyle;
    },
    id?: string,
    groupId?: string
  ): Feature {
    const polylineOptions = options || {};

    const featureId = id || generateId();

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
    polyline.set('GeometryGroupIndex', this.#activeGeometryGroupIndex);

    // add geometry to feature collection
    this.addToGeometryGroup(polyline, groupId);

    // add the geometry to the geometries array
    this.geometries.push(polyline);

    // emit an event that a geometry has been added
    this.#emitGeometryAdded(polyline);

    return polyline;
  }

  /**
   * Creates a new polygon.
   *
   * @param points - The array of points to create the polygon
   * @param options - Optional polygon options including styling
   * @param optionalFeatureId - Optional id to be used to manage this geometry
   * @param groupId - Optional group id in which we want to add the geometry
   * @returns The created polygon feature
   */
  addPolygon(
    points: number[] | Coordinate[][],
    options?: {
      projection?: number;
      geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
      style?: TypeFeatureStyle;
    },
    optionalFeatureId?: string,
    groupId?: string
  ): Feature {
    const polygonOptions = options || {};

    const featureId = optionalFeatureId || generateId();

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
    polygon.set('GeometryGroupIndex', this.#activeGeometryGroupIndex);

    // add geometry to feature collection
    this.addToGeometryGroup(polygon, groupId);

    // add the geometry to the geometries array
    this.geometries.push(polygon);

    // emit an event that a geometry has been added
    this.#emitGeometryAdded(polygon);

    return polygon;
  }

  /**
   * Creates a new circle.
   *
   * @param coordinate - The lon/lat coordinate of the circle
   * @param options - Optional circle options including styling
   * @param optionalFeatureId - Optional id to be used to manage this geometry
   * @param groupId - Optional group id in which we want to add the geometry
   * @returns The created circle feature
   */
  addCircle(
    coordinate: Coordinate,
    options?: {
      projection?: number;
      geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
      style?: TypeFeatureCircleStyle;
    },
    optionalFeatureId?: string,
    groupId?: string
  ): Feature {
    const circleOptions = options || {};

    const featureId = optionalFeatureId || generateId();

    const projectionConv = Projection.getProjectionFromString(`EPSG:${options?.projection || 4326}`);

    const projectedCoordinates = Projection.transform(
      coordinate,
      projectionConv,
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
    circle.set('GeometryGroupIndex', this.#activeGeometryGroupIndex);

    // add geometry to feature collection
    this.addToGeometryGroup(circle, groupId);

    // add the geometry to the geometries array
    this.geometries.push(circle);

    // emit an event that a geometry has been added
    this.#emitGeometryAdded(circle);

    return circle;
  }

  /**
   * Creates a new marker icon.
   *
   * @param coordinate - The lon/lat position of the marker
   * @param options - Optional marker options including styling
   * @param optionalFeatureId - Optional id to be used to manage this geometry
   * @param groupId - Optional group id in which we want to add the geometry
   * @returns The created marker feature
   */
  addMarkerIcon(
    coordinate: Coordinate,
    options?: {
      projection?: number;
      geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
      style?: TypeIconStyle;
    },
    optionalFeatureId?: string,
    groupId?: string
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

    const featureId = optionalFeatureId || generateId();

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
    marker.set('GeometryGroupIndex', this.#activeGeometryGroupIndex);

    // add geometry to feature collection
    this.addToGeometryGroup(marker, groupId);

    // add the geometry to the geometries array
    this.geometries.push(marker);

    // emit an event that a geometry has been added
    this.#emitGeometryAdded(marker);

    return marker;
  }

  /**
   * Finds a feature using its id.
   *
   * @param featureId - The id of the feature to return
   * @returns The feature having the specified id
   */
  getGeometry(featureId: string): Feature {
    return this.geometries.filter((layer) => layer.get('featureId') === featureId)[0];
  }

  /**
   * Deletes a feature using the id and removes it from the groups and the map.
   *
   * @param featureId - The id of the feature to delete
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
   * Creates a new geometry group to manage multiple geometries at once.
   *
   * The z-index is infinity by default, set the index to change the behaviour.
   *
   * @param geometryGroupId - The id of the group to use when managing this group
   * @param options - Optional vector layer and vector source options
   * @returns The created or existing geometry group
   */
  createGeometryGroup(
    geometryGroupId: string,
    options?: {
      vectorLayerOptions?: VectorLayerOptions<Feature, VectorSource>;
      vectorSourceOptions?: VectorSourceOptions<Feature>;
    }
  ): FeatureCollection {
    const geometryGroupOptions = options || {};

    // Check if geometry group exist, if not create it, if so get it then return the group
    let geometryGroup;
    if (!this.hasGeometryGroup(geometryGroupId)) {
      const vectorSource = new VectorSource<Feature>(geometryGroupOptions.vectorSourceOptions);

      const vectorLayer = new VectorLayer<VectorSource>({
        ...geometryGroupOptions.vectorLayerOptions,
        source: vectorSource,
      });

      geometryGroup = {
        geometryGroupId,
        vectorLayer,
        vectorSource,
      };

      if (geometryGroup.vectorLayer.getVisible()) {
        // This would give it a z-index equal to infinity. Instead of doing this.mapViewer.map.addLayer(geometryGroup.vectorLayer).
        vectorLayer.setMap(this.#mapViewer.map);
        vectorLayer.setZIndex(9999);
        geometryGroup.vectorLayer.changed();
      }
      this.getGeometryGroups().push(geometryGroup);
    } else geometryGroup = this.getGeometryGroup(geometryGroupId);

    return geometryGroup;
  }

  /**
   * Sets the active geometry group (the geometry group used when adding geometries).
   *
   * If id is not specified, uses the default geometry group.
   *
   * @param id - Optional id of the group to set as active
   */
  setActiveGeometryGroup(id?: string): void {
    // if group name not give, add to default group
    const geometryGroupId = id || this.defaultGeometryGroupId;
    const geometryGroups = this.getGeometryGroups();
    for (let i = 0; i < geometryGroups.length; i++) {
      if (geometryGroups[i].geometryGroupId === geometryGroupId) {
        this.#activeGeometryGroupIndex = i;
        break;
      }
    }
  }

  /**
   * Gets the active geometry group.
   *
   * @returns The active geometry group
   */
  getActiveGeometryGroup(): FeatureCollection {
    return this.getGeometryGroups()[this.#activeGeometryGroupIndex];
  }

  /**
   * Checks if a geometry group exists.
   *
   * @param geometryGroupId - The id of the geometry group to check
   * @returns True if the group exists, false otherwise
   */
  hasGeometryGroup(geometryGroupId: string): boolean {
    const geometryGroups = this.getGeometryGroups();
    return geometryGroups.some((group) => group.geometryGroupId === geometryGroupId);
  }

  /**
   * Gets the geometry group by using the ID specified when the group was created.
   *
   * @param geometryGroupId - The id of the geometry group to return
   * @returns The geometry group
   * @throws {InvaliGeometryGroupIdError} When the provided geometry group id does not exist
   */
  getGeometryGroup(geometryGroupId: string): FeatureCollection {
    const geometryGroups = this.getGeometryGroups();
    const geometryGroupIndex = geometryGroups.findIndex((theGeometryGroup) => theGeometryGroup.geometryGroupId === geometryGroupId);

    if (geometryGroupIndex === -1) throw new InvaliGeometryGroupIdError(geometryGroupId); // Failed

    return geometryGroups[geometryGroupIndex];
  }

  /**
   * Gets all geometry groups.
   *
   * @returns Array of all geometry groups
   */
  getGeometryGroups(): FeatureCollection[] {
    return this.#geometryGroups;
  }

  /**
   * Finds the groups that contain the geometry using its id.
   *
   * @param featureId - The id of the geometry
   * @returns Groups that contain the geometry
   */
  getGeometryGroupsByFeatureId(featureId: string): FeatureCollection[] {
    const returnValue: FeatureCollection[] = [];
    const geometryGroups = this.getGeometryGroups();

    for (let i = 0; i < geometryGroups.length; i++) {
      const geometries = geometryGroups[i].vectorLayer.getSource()?.getFeatures() || [];
      for (let j = 0; j < geometries.length; j++) {
        const geometry = geometries[j];

        if (geometry.get('featureId') === featureId) returnValue.push(geometryGroups[i]);
      }
    }

    return returnValue;
  }

  /**
   * Shows the identified geometry group on the map.
   *
   * @param geometryGroupId - The id of the group to show on the map
   * @throws {InvaliGeometryGroupIdError} When the provided geometry group id does not exist
   */
  setGeometryGroupAsVisible(geometryGroupId: string): void {
    const geometryGroup = this.getGeometryGroup(geometryGroupId);

    geometryGroup.vectorLayer.setVisible(true);
    geometryGroup.vectorLayer.changed();
  }

  /**
   * Hides the identified geometry group from the map.
   *
   * @param geometryGroupId - The id of the group to hide from the map
   * @throws {InvaliGeometryGroupIdError} When the provided geometry group id does not exist
   */
  setGeometryGroupAsInvisible(geometryGroupId: string): void {
    const geometryGroup = this.getGeometryGroup(geometryGroupId);

    geometryGroup.vectorLayer.setVisible(false);
    geometryGroup.vectorLayer.changed();
  }

  /**
   * Gets the z-index of a geometry group's vector layer.
   *
   * @param geometryGroupId - The id of the group
   * @returns The z-index value of the vector layer
   * @throws {InvaliGeometryGroupIdError} When the provided geometry group id does not exist
   */
  getGeometryGroupZIndex(geometryGroupId: string): number {
    const geometryGroup = this.getGeometryGroup(geometryGroupId);
    const zIndex = geometryGroup.vectorLayer.getZIndex();
    return zIndex === undefined ? Infinity : zIndex;
  }

  /**
   * Sets the z-index of a geometry group's vector layer.
   *
   * @param geometryGroupId - The id of the group
   * @param zIndex - The z-index value to set
   * @throws {InvaliGeometryGroupIdError} When the provided geometry group id does not exist
   */
  setGeometryGroupZIndex(geometryGroupId: string, zIndex: number): void {
    const geometryGroup = this.getGeometryGroup(geometryGroupId);
    geometryGroup.vectorLayer.setZIndex(zIndex);
    geometryGroup.vectorLayer.changed();
  }

  /**
   * Adds a new geometry to the group whose identifier is equal to geometryGroupId.
   *
   * If geometryGroupId is not provided, uses the active geometry group. If the
   * geometry group doesn't exist, creates it.
   *
   * @param geometry - The geometry to be added to the group
   * @param geometryGroupId - Optional id of the group to add the geometry to
   */
  addToGeometryGroup(geometry: Feature, geometryGroupId?: string): void {
    let geometryGroup: FeatureCollection;
    if (geometryGroupId) {
      // create geometry group if it does not exist
      geometryGroup = this.createGeometryGroup(geometryGroupId);
    } else {
      geometryGroup = this.getGeometryGroups()[this.#activeGeometryGroupIndex];
    }

    try {
      geometryGroup.vectorLayer.getSource()?.addFeature(geometry as never);
      geometryGroup.vectorLayer.changed();
    } catch (error: unknown) {
      logger.logError(`Error adding geometry to group ${geometryGroupId}`, error);
    }
  }

  /**
   * Finds the groups that the feature exists in and deletes the feature from those groups.
   *
   * @param featureId - The geometry id
   */
  deleteGeometryFromGroups(featureId: string): void {
    const geometry = this.getGeometry(featureId);
    const geometryGroups = this.getGeometryGroups();

    for (let i = 0; i < geometryGroups.length; i++) {
      geometryGroups[i].vectorLayer
        .getSource()
        ?.getFeatures()
        .forEach((layerGeometry) => {
          if (geometry === layerGeometry) {
            geometryGroups[i].vectorLayer.getSource()?.removeFeature(geometry as never);
          }
        });
      geometryGroups[i].vectorLayer.changed();
    }
  }

  /**
   * Deletes a specific feature from a group using the feature id.
   *
   * @param featureId - The feature id to be deleted
   * @param geometryGroupid - The group id
   * @throws {InvaliGeometryGroupIdError} When the provided geometry group id does not exist
   */
  deleteGeometryFromGroup(featureId: string, geometryGroupid: string): void {
    const geometry = this.getGeometry(featureId);
    const geometryGroup = this.getGeometryGroup(geometryGroupid);
    geometryGroup.vectorLayer
      .getSource()
      ?.getFeatures()
      .forEach((layerGeometry) => {
        if (geometry === layerGeometry) {
          geometryGroup.vectorLayer.getSource()?.removeFeature(geometry as never);
        }
      });
    geometryGroup.vectorLayer.changed();
  }

  /**
   * Deletes all geometries from the geometry group but keeps the group.
   *
   * @param geometryGroupid - The group id
   * @returns The group with empty layers
   * @throws {InvaliGeometryGroupIdError} When the provided geometry group id does not exist
   */
  deleteGeometriesFromGroup(geometryGroupid: string): FeatureCollection {
    const geometryGroup = this.getGeometryGroup(geometryGroupid);
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
   * Deletes a geometry group and all the geometries from the map.
   *
   * The default geometry group can't be deleted.
   *
   * @param geometryGroupid - The id of the geometry group to delete
   */
  deleteGeometryGroup(geometryGroupid: string): void {
    const geometryGroup = this.deleteGeometriesFromGroup(geometryGroupid);
    const geometryGroups = this.getGeometryGroups();

    if (geometryGroup.geometryGroupId !== this.defaultGeometryGroupId) {
      for (let i = 0; i < geometryGroups.length; i++) {
        if (geometryGroups[i].geometryGroupId === geometryGroup.geometryGroupId) {
          geometryGroups.splice(i, 1);
        }
      }
    }
  }

  /**
   * Gets the coordinates of a specific feature.
   *
   * @param featureId - The id of the feature
   * @param projection - Optional projection code to transform the coordinates to.
   *   Otherwise, uses the map's projection by default
   * @returns The coordinates of the feature, or undefined if not found
   */
  getFeatureCoords(featureId: string, projection?: number): Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][] | undefined {
    const feature = this.getGeometry(featureId);
    const featureGeometry = feature?.getGeometry();
    let coords;

    if (
      featureGeometry &&
      (featureGeometry instanceof Point ||
        featureGeometry instanceof MultiPoint ||
        featureGeometry instanceof LineString ||
        featureGeometry instanceof MultiLineString ||
        featureGeometry instanceof Polygon ||
        featureGeometry instanceof MultiPolygon)
    ) {
      coords = featureGeometry.getCoordinates();
    } else if (featureGeometry && featureGeometry instanceof Circle) {
      coords = featureGeometry.getCenter();
    }

    if (coords && projection) {
      const mapProjection = Projection.PROJECTIONS[MapEventProcessor.getMapState(this.#mapId).currentProjection];
      const mapProjectionCode = mapProjection.getCode();
      const transformProjection = `EPSG:${projection}`;
      coords = Projection.transformCoordinates(coords, mapProjectionCode, transformProjection);
    }

    return coords;
  }

  /**
   * Allows for a feature's coordinates to be updated programmatically.
   *
   * @param featureId - The id of the feature to update
   * @param coordinates - The new coordinates for the feature
   * @param projection - Optional projection code of the coordinates, assumes 4326 if not specified
   */
  setFeatureCoords(
    featureId: string,
    coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][],
    projection?: number
  ): void {
    const feature = this.getGeometry(featureId);
    const featureGeometry = feature.getGeometry();
    const mapProjection = Projection.PROJECTIONS[MapEventProcessor.getMapState(this.#mapId).currentProjection].getCode();
    const coordsProjection = `EPSG:${projection || 4326}`;
    const projectedCoordinates = Projection.transformCoordinates(coordinates, coordsProjection, mapProjection);

    // Check if coordinates are valid, and transform the projection to match the map's projection
    if (projectedCoordinates) {
      if (featureGeometry instanceof Point) {
        featureGeometry.setCoordinates(projectedCoordinates);
      } else if (
        (featureGeometry instanceof MultiPoint || featureGeometry instanceof LineString) &&
        GeometryApi.isArrayOfCoordinates(projectedCoordinates)
      ) {
        featureGeometry.setCoordinates(projectedCoordinates);
      } else if (
        (featureGeometry instanceof MultiLineString || featureGeometry instanceof Polygon) &&
        GeometryApi.isArrayOfArrayOfCoordinates(projectedCoordinates)
      ) {
        featureGeometry.setCoordinates(projectedCoordinates);
      } else if (featureGeometry instanceof MultiPolygon && GeometryApi.isArrayOfArrayOfArrayOfCoordinates(projectedCoordinates)) {
        featureGeometry.setCoordinates(projectedCoordinates);
      } else if (featureGeometry instanceof Circle) {
        if (GeometryApi.isCoordinates(projectedCoordinates)) {
          featureGeometry.setCenter(projectedCoordinates);
        }
      } else {
        throw new Error(`Unable to set coordinates for feature ${featureId}`);
      }
    } else {
      throw new Error(`Unable to set coordinates for feature ${featureId}`);
    }
  }

  /**
   * Creates a Geometry given a geometry type and coordinates expected in any logical format.
   *
   * @param geometryType - The geometry type to create
   * @param coordinates - The coordinates to use to create the geometry
   * @returns The OpenLayers Geometry
   * @throws {NotSupportedError} When the geometry type is not supported
   */
  static createGeometryFromType(
    geometryType: TypeStyleGeometry,
    coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][]
  ): OLGeometry {
    switch (geometryType) {
      case 'Point':
        // If it's actually a MultiPoint
        if (GeometryApi.isArrayOfCoordinates(coordinates)) {
          // Create a MultiLine geometry
          return new MultiPoint(coordinates);
        }
        // Create a Point geometry
        return new Point(coordinates as Coordinate);

      case 'MultiPoint':
        // Create a MultiPoint geometry
        return new MultiPoint(coordinates as Coordinate[]);

      case 'LineString':
        // If it's actually a MultiLineString
        if (GeometryApi.isArrayOfArrayOfCoordinates(coordinates)) {
          // Create a MultiLine geometry
          return new MultiLineString(coordinates);
        }
        // Create a Line geometry
        return new LineString(coordinates as Coordinate[]);

      case 'MultiLineString':
        // Create a MultiLine geometry
        return new MultiLineString(coordinates as Coordinate[][]);

      case 'Polygon':
        // If it's actually a MultiPolygon
        if (GeometryApi.isArrayOfArrayOfArrayOfCoordinates(coordinates)) {
          // Create a MultiPolygon geometry
          return new MultiPolygon(coordinates);
        }
        // Create a Polygon geometry
        return new Polygon(coordinates as Coordinate[][]);

      case 'MultiPolygon':
        // Create a MultiPolygon geometry
        return new MultiPolygon(coordinates as Coordinate[][][]);

      // Add support for other geometry types as needed
      default:
        // Unsupported geometry type
        throw new NotSupportedError(`Unsupported geometry type: ${geometryType}`);
    }
  }

  /**
   * Typeguards when a list of coordinates should actually be a single coordinate, such as a Point.
   *
   * @param coordinates - The coordinates to check
   * @returns True when the coordinates represent a Point
   */
  static isCoordinates(coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][]): coordinates is Coordinate {
    return Array.isArray(coordinates) && coordinates.length > 0 && !Array.isArray(coordinates[0]);
  }

  /**
   * Typeguards when a list of coordinates should actually be a single coordinate, such as a LineString.
   *
   * @param coordinates - The coordinates to check
   * @returns True when the coordinates represent a LineString
   */
  static isArrayOfCoordinates(coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][]): coordinates is Coordinate[] {
    return (
      Array.isArray(coordinates) &&
      coordinates.length > 0 &&
      Array.isArray(coordinates[0]) &&
      coordinates[0].length > 0 &&
      !Array.isArray(coordinates[0][0])
    );
  }

  /**
   * Typeguards when a list of coordinates should actually be a single coordinate, such as a MultiLineString or Polygon.
   *
   * @param coordinates - The coordinates to check
   * @returns True when the coordinates represent a MultiLineString or Polygon
   */
  static isArrayOfArrayOfCoordinates(
    coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][]
  ): coordinates is Coordinate[][] {
    return (
      Array.isArray(coordinates) &&
      coordinates.length > 0 &&
      Array.isArray(coordinates[0]) &&
      coordinates[0].length > 0 &&
      Array.isArray(coordinates[0][0])
    );
  }

  /**
   * Typeguards when a list of coordinates should actually be a single coordinate, such as a MultiPolygon.
   *
   * @param coordinates - The coordinates to check
   * @returns True when the coordinates represent a MultiPolygon
   */
  static isArrayOfArrayOfArrayOfCoordinates(
    coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][]
  ): coordinates is Coordinate[][][] {
    return (
      Array.isArray(coordinates) &&
      coordinates.length > 0 &&
      Array.isArray(coordinates[0]) &&
      coordinates[0].length > 0 &&
      Array.isArray(coordinates[0][0]) &&
      coordinates[0][0].length > 0 &&
      Array.isArray(coordinates[0][0][0])
    );
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
