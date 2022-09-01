import VectorLayer from 'ol/layer/Vector';
import VectorSource, { Options as VectorSourceOptions } from 'ol/source/Vector';
import { Feature } from 'ol';
import { Circle, LineString, Point, Polygon } from 'ol/geom';
import { Coordinate } from 'ol/coordinate';
import { Fill, Stroke, Style } from 'ol/style';
import { Options as VectorLayerOptions } from 'ol/layer/BaseVector';
import { asArray, asString } from 'ol/color';

import { api } from '../../../app';
import { EVENT_NAMES } from '../../../api/events/event-types';

import { generateId, setAlphaColor } from '../../../core/utils/utilities';
import {
  payloadIsACircleConfig,
  payloadIsACircleMarkerConfig,
  payloadIsAMarkerConfig,
  payloadIsAPolygonConfig,
  payloadIsAPolylineConfig,
  payloadIsAVectorConfig,
} from '../../../api/events/payloads/vector-config-payload';
import { VectorPayload } from '../../../api/events/payloads/vector-payload';
import { TypeFeatureCircleStyle, TypeFeatureStyle } from './vector-types';

/**
 * Store a group of features
 */
interface FeatureCollection {
  id: string;
  vectorLayer: VectorLayer<VectorSource>;
  vectorSource: VectorSource;
}

/**
 * Class used to manage vector geometries (Polyline, Polygon, Circle, Marker...)
 *
 * @exports
 * @class Vector
 */
export class Vector {
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

  /**
   * Initialize map, vectors, and listen to add vector events
   *
   * @param {string} mapId map id
   */
  constructor(mapId: string) {
    this.#mapId = mapId;

    // create default geometry group
    this.createGeometryGroup(this.defaultGeometryGroupId);

    // listen to add vector events
    api.event.on(
      EVENT_NAMES.VECTOR.EVENT_VECTOR_ADD,
      (payload) => {
        if (payloadIsACircleConfig(payload)) {
          this.addCircle(payload.coordintate, payload.radius, payload.options, payload.id);
        } else if (payloadIsAPolygonConfig(payload)) {
          this.addPolygon(payload.points, payload.options, payload.id);
        } else if (payloadIsAPolylineConfig(payload)) {
          this.addPolyline(payload.points, payload.options, payload.id);
        } else if (payloadIsAMarkerConfig(payload)) {
          this.addMarker(payload.coordinate, payload.options, payload.id);
        } else if (payloadIsACircleMarkerConfig(payload)) {
          this.addCircleMarker(payload.coordinate, payload.radius, payload.options, payload.id);
        }
      },
      this.#mapId
    );

    // listen to outside events to remove geometries
    api.event.on(
      EVENT_NAMES.VECTOR.EVENT_VECTOR_REMOVE,
      (payload) => {
        if (payloadIsAVectorConfig(payload)) {
          // remove geometry from outside
          this.deleteGeometry(payload.id!);
        }
      },
      this.#mapId
    );

    // listen to outside events to turn on geometry groups
    api.event.on(
      EVENT_NAMES.VECTOR.EVENT_VECTOR_ON,
      () => {
        this.setGeometryGroupAsVisible();
      },
      this.#mapId
    );

    // listen to outside events to turn off geometry groups
    api.event.on(
      EVENT_NAMES.VECTOR.EVENT_VECTOR_OFF,
      () => {
        this.setGeometryGroupAsInvisible();
      },
      this.#mapId
    );
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
  addPolyline = (
    points: Coordinate,
    options?: {
      geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
      style?: TypeFeatureStyle;
    },
    id?: string
  ): Feature => {
    const polylineOptions = options || {};

    const lId = generateId(id);

    // create a line geometry
    const polyline = new Feature({
      geometry: new LineString(points, polylineOptions.geometryLayout).transform(
        'EPSG:4326',
        api.projection.projections[api.map(this.#mapId).currentProjection]
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

      if (polylineOptions.style.strokeColor) {
        stroke = new Stroke({
          color: asString(setAlphaColor(asArray(polylineOptions.style.strokeColor), polylineOptions.style.strokeOpacity || 1)),
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

    // set an id to this geometry
    polyline.set('id', lId);

    // add geometry to feature collection
    this.geometryGroups[this.activeGeometryGroupIndex].vectorSource.addFeature(polyline);

    // add the geometry to the geometries array
    this.geometries.push(polyline);

    // emit an event that a polyline vector has been added
    api.event.emit(VectorPayload.forPolyline(EVENT_NAMES.VECTOR.EVENT_VECTOR_ADDED, this.#mapId, polyline));

    return polyline;
  };

  /**
   * Create a new polygon
   *
   * @param {Coordinate} points array of points to create the polygon
   * @param options polygon options including styling
   * @param {string} id an optional id to be used to manage this geometry
   *
   * @returns {Feature} a geometry containing the id and the created geometry
   */
  addPolygon = (
    points: number[] | Coordinate[][],
    options?: {
      geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
      style?: TypeFeatureStyle;
    },
    id?: string
  ): Feature => {
    const polygonOptions = options || {};

    const lId = generateId(id);

    // create a line geometry
    const polygon = new Feature({
      geometry: new Polygon(points, polygonOptions.geometryLayout).transform(
        'EPSG:4326',
        api.projection.projections[api.map(this.#mapId).currentProjection]
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

      if (polygonOptions.style.strokeColor) {
        stroke = new Stroke({
          color: asString(setAlphaColor(asArray(polygonOptions.style.strokeColor), polygonOptions.style.strokeOpacity || 1)),
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

    // set an id to this geometry
    polygon.set('id', lId);

    // add geometry to feature collection
    this.geometryGroups[this.activeGeometryGroupIndex].vectorSource.addFeature(polygon);

    // add the geometry to the geometries array
    this.geometries.push(polygon);

    // emit an event that a polygon vector has been added
    api.event.emit(VectorPayload.forPolygon(EVENT_NAMES.VECTOR.EVENT_VECTOR_ADDED, this.#mapId, polygon));

    return polygon;
  };

  /**
   * Create a new circle
   *
   * @param {Coordinate} coordinate long lat coordinate of the circle
   * @param {number} radius an optional radius
   * @param options circle options including styling
   * @param {string} id an optional id to be used to manage this geometry
   *
   * @returns {Feature} a geometry containing the id and the created geometry
   */
  addCircle = (
    coordinate: Coordinate,
    radius?: number,
    options?: {
      geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
      style?: TypeFeatureCircleStyle;
    },
    id?: string
  ): Feature => {
    const circleOptions = options || {};

    const lId = generateId(id);

    // create a line geometry
    const circle = new Feature({
      geometry: new Circle(coordinate, radius, circleOptions.geometryLayout).transform(
        'EPSG:4326',
        api.projection.projections[api.map(this.#mapId).currentProjection]
      ),
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

      if (circleOptions.style.strokeColor) {
        stroke = new Stroke({
          color: asString(setAlphaColor(asArray(circleOptions.style.strokeColor), circleOptions.style.strokeOpacity || 1)),
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

    // set an id to this geometry
    circle.set('id', lId);

    // add geometry to feature collection
    this.geometryGroups[this.activeGeometryGroupIndex].vectorSource.addFeature(circle);

    // add the geometry to the geometries array
    this.geometries.push(circle);

    // emit an event that a circle vector has been added
    api.event.emit(VectorPayload.forCircle(EVENT_NAMES.VECTOR.EVENT_VECTOR_ADDED, this.#mapId, circle));

    return circle;
  };

  /**
   * Create a new circle marker
   *
   * @param {Coordinate} coordinate long lat coordinate of the circle marker
   * @param {number} radius optional circle marker radius
   * @param options circle marker options including styling
   * @param {string} id an optional id to be used to manage this geometry
   *
   * @returns {Feature} a geometry containing the id and the created geometry
   */
  addCircleMarker = (
    coordinate: Coordinate,
    radius?: number,
    options?: {
      geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
      style?: TypeFeatureCircleStyle;
    },
    id?: string
  ): Feature => {
    const circleMarkerOptions = options || {};

    const lId = generateId(id);

    // create a line geometry
    const circleMarker = new Feature({
      geometry: new Circle(coordinate, radius, circleMarkerOptions.geometryLayout).transform(
        'EPSG:4326',
        api.projection.projections[api.map(this.#mapId).currentProjection]
      ),
    });

    // if style is provided then set override the vector layer style for this feature
    if (circleMarkerOptions.style) {
      let fill: Fill | undefined;
      let stroke: Stroke | undefined;

      if (circleMarkerOptions.style.fillColor) {
        fill = new Fill({
          color: asString(setAlphaColor(asArray(circleMarkerOptions.style.fillColor), circleMarkerOptions.style.fillOpacity || 1)),
        });
      }

      if (circleMarkerOptions.style.strokeColor) {
        stroke = new Stroke({
          color: asString(setAlphaColor(asArray(circleMarkerOptions.style.strokeColor), circleMarkerOptions.style.strokeOpacity || 1)),
          width: circleMarkerOptions.style.strokeWidth || 1,
        });
      }

      circleMarker.setStyle(
        new Style({
          fill,
          stroke,
        })
      );
    }

    // set an id to this geometry
    circleMarker.set('id', lId);

    // add geometry to feature collection
    this.geometryGroups[this.activeGeometryGroupIndex].vectorSource.addFeature(circleMarker);

    // add the geometry to the geometries array
    this.geometries.push(circleMarker);

    // emit an event that a circle vector has been added
    api.event.emit(VectorPayload.forCircleMarker(EVENT_NAMES.VECTOR.EVENT_VECTOR_ADDED, this.#mapId, circleMarker));

    return circleMarker;
  };

  /**
   * Create a new marker
   *
   * @param {Coordinate} coordinate the long lat position of the marker
   * @param options marker options including styling
   * @param {string} id an optional id to be used to manage this geometry
   *
   * @returns {Feature} a geometry containing the id and the created geometry
   */
  addMarker = (
    coordinate: Coordinate,
    options?: {
      geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
      style?: TypeFeatureStyle;
    },
    id?: string
  ): Feature => {
    const markerOptions = options || {};

    const idMarker = generateId(id);

    // create a line geometry
    const marker = new Feature({
      geometry: new Point(coordinate, markerOptions.geometryLayout).transform(
        'EPSG:4326',
        api.projection.projections[api.map(this.#mapId).currentProjection]
      ),
    });

    // if style is provided then set override the vector layer style for this feature
    if (markerOptions.style) {
      let fill: Fill | undefined;
      let stroke: Stroke | undefined;

      if (markerOptions.style.fillColor) {
        fill = new Fill({
          color: asString(setAlphaColor(asArray(markerOptions.style.fillColor), markerOptions.style.fillOpacity || 1)),
        });
      }

      if (markerOptions.style.strokeColor) {
        stroke = new Stroke({
          color: asString(setAlphaColor(asArray(markerOptions.style.strokeColor), markerOptions.style.strokeOpacity || 1)),
          width: markerOptions.style.strokeWidth || 1,
        });
      }

      marker.setStyle(
        new Style({
          fill,
          stroke,
        })
      );
    }

    // set an id to this geometry
    marker.set('id', idMarker);

    // add geometry to feature collection
    this.geometryGroups[this.activeGeometryGroupIndex].vectorSource.addFeature(marker);

    // add the geometry to the geometries array
    this.geometries.push(marker);

    // emit an event that a marker vector has been added
    api.event.emit(VectorPayload.forMarker(EVENT_NAMES.VECTOR.EVENT_VECTOR_ADDED, this.#mapId, marker));

    return marker;
  };

  /**
   * Find a geometry using it's id
   *
   * @param {string} id the id of the geometry to return
   *
   * @returns {Feature} a geometry having the specified id
   */
  getGeometry = (id: string): Feature => {
    return this.geometries.filter((layer) => layer.get('id') === id)[0];
  };

  /**
   * Delete a geometry using the id and delete it from the groups and the map
   *
   * @param {string} id the id of the geometry to delete
   */
  deleteGeometry = (id: string): void => {
    for (let i = 0; i < this.geometries.length; i++) {
      if (this.geometries[i].get('id') === id) {
        this.deleteGeometryFromGroups(id);

        this.geometries[i].dispose();

        this.geometries.splice(i, 1);

        break;
      }
    }
  };

  /**
   * Create a new geometry group to manage multiple geometries at once
   *
   * @param {string} geometryGroupId the id of the group to use when managing this group
   * @param options an optional vector layer and vector source options
   * @returns {FeatureCollection} created geometry group
   */
  createGeometryGroup = (
    geometryGroupId: string,
    options?: {
      vectorLayerOptions?: VectorLayerOptions<VectorSource>;
      vectorSourceOptions?: VectorSourceOptions;
    }
  ): FeatureCollection => {
    const geometryGroupOptions = options || {};

    let featureGroup = this.getGeometryGroup(geometryGroupId);
    if (!featureGroup) {
      const vectorSource = new VectorSource(geometryGroupOptions.vectorSourceOptions);

      const vectorLayer = new VectorLayer({
        ...geometryGroupOptions.vectorLayerOptions,
        source: vectorSource,
      });

      featureGroup = {
        id: geometryGroupId,
        vectorLayer,
        vectorSource,
      };

      if (featureGroup.vectorLayer.getVisible()) {
        api.map(this.#mapId).map.addLayer(featureGroup.vectorLayer);
        featureGroup.vectorLayer.changed();
      }
      this.geometryGroups.push(featureGroup);
    }

    return featureGroup;
  };

  /**
   * set the active geometry group (the geometry group used when adding geometries).
   * If id is not specified, use the default geometry group.
   *
   * @param {string} id optional the id of the group to set as active
   */
  setActiveGeometryGroup = (id?: string): void => {
    // if group name not give, add to default group
    const groupId = id || this.defaultGeometryGroupId;
    for (let i = 0; i < this.geometryGroups.length; i++) {
      if (this.geometryGroups[i].id === groupId) {
        this.activeGeometryGroupIndex = i;
        break;
      }
    }
  };

  /**
   * Get the active geometry group
   *
   * @returns {FeatureCollection} the active geometry group
   */
  getActiveGeometryGroup = (): FeatureCollection => {
    return this.geometryGroups[this.activeGeometryGroupIndex];
  };

  /**
   * Get the geometry group by using the ID specified when the group was created
   * if geometryGroupid is not provided, return the active geometry group
   *
   * @param {string} geometryGroupId the id of the geometry group to return
   *
   * @returns the geomtry group
   */
  getGeometryGroup = (geometryGroupId?: string): FeatureCollection => {
    let geometryGroup: FeatureCollection;
    if (geometryGroupId) {
      [geometryGroup] = this.geometryGroups.filter((theGeometryGroup) => theGeometryGroup.id === geometryGroupId);
    } else {
      geometryGroup = this.geometryGroups[this.activeGeometryGroupIndex];
    }

    return geometryGroup;
  };

  /**
   * Find the groups that contain the geometry using it's id
   *
   * @param {string} id the id of the geometry
   *
   * @returns {FeatureGroup | null} the groups that contain the geometry
   *                                or null if not found
   */
  getGeometryGroupsByGeometryId = (id: string): FeatureCollection[] => {
    const returnValue: FeatureCollection[] = [];
    for (let i = 0; i < this.geometryGroups.length; i++) {
      const geometries = this.geometryGroups[i].vectorLayer.getSource()?.getFeatures() || [];
      for (let j = 0; j < geometries.length; j++) {
        const geometry = geometries[j];

        const geometryId = geometry.get('id');

        if (geometryId === id) returnValue.push(this.geometryGroups[i]);
      }
    }

    return returnValue;
  };

  /**
   * Show the identified geometry group on the map
   * if geometryGroupId is not provided, use the active geometry group
   *
   * @param {string} geometryGroupId optional the id of the group to show on the map
   */
  setGeometryGroupAsVisible = (geometryGroupId?: string): void => {
    const geometryGroup = this.getGeometryGroup(geometryGroupId);

    geometryGroup.vectorLayer.setVisible(true);
    geometryGroup.vectorLayer.changed();
  };

  /**
   * hide the identified geometry group from the map
   * if groupId is not provided, use the active geometry group
   *
   * @param {string} geometryGroupId optional the id of the group to show on the map
   */
  setGeometryGroupAsInvisible = (geometryGroupId?: string): void => {
    const geometryGroup = this.getGeometryGroup(geometryGroupId);

    geometryGroup.vectorLayer.setVisible(false);
    geometryGroup.vectorLayer.changed();
  };

  /**
   * Add a new geometry to the group whose identifier is equal to geometryGroupId.
   * if geometryGroupId is not provided, use the active geometry group. If the
   * geometry group doesn't exist, create it.
   *
   * @param {Feature} geometry the geometry to be added to the group
   * @param {string} geometryGroupId optional id of the group to add the geometry to
   */
  addToGeometryGroup = (geometry: Feature, geometryGroupId?: string): void => {
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
      // eslint-disable-next-line no-console
      console.error(error);
    }
  };

  /**
   * Find the groups that the geometry exists in and delete the geometry from those groups
   *
   * @param {string} geometryId the geometry id
   */
  deleteGeometryFromGroups = (geometryId: string): void => {
    const geometry = this.getGeometry(geometryId);
    for (let i = 0; i < this.geometryGroups.length; i++) {
      this.geometryGroups[i].vectorLayer
        .getSource()
        ?.getFeatures()
        .forEach((layer) => {
          if (geometry === layer) {
            this.geometryGroups[i].vectorLayer.getSource()?.removeFeature(geometry);
            this.geometryGroups[i].vectorLayer.changed();
          }
        });
    }
  };

  /**
   * Delete a specific geometry from a group using the geometry id
   * If geometryGroupid is not provided, the active geometry group is used.
   *
   * @param {string} geometryId the geometry id to be deleted
   * @param {string} geometryGroupid optional group id
   */
  deleteGeometryFromGroup = (geometryId: string, geometryGroupid?: string): void => {
    const geometry = this.getGeometry(geometryId);
    const geometryGroup = this.getGeometryGroup(geometryGroupid);
    geometryGroup.vectorLayer
      .getSource()
      ?.getFeatures()
      .forEach((layer) => {
        if (geometry === layer) {
          geometryGroup.vectorLayer.getSource()?.removeFeature(layer);
        }
      });
  };

  /**
   * Delete all geometries from the geometry group but keep the group
   * If geometryGroupid is not provided, the active geometry group is used.
   *
   * @param {string} geometryGroupid optional group id
   * @returns {FeatureCollection} the group with empty layers
   */
  deleteGeometriesFromGroup = (geometryGroupid?: string): FeatureCollection => {
    const geometryGroup = this.getGeometryGroup(geometryGroupid);
    geometryGroup.vectorLayer.dispose();
    api.map(this.#mapId).map.removeLayer(geometryGroup.vectorLayer);

    return geometryGroup;
  };

  /**
   * Delete a geometry group and all the geometries from the map.
   * If geometryGroupid is not provided, the active geometry group is used.
   * The default geometry group can't be deleted.
   *
   * @param {string} geometryGroupid optional id of the geometry group to delete
   */
  deleteGeometryGroup = (geometryGroupid?: string): void => {
    const geometryGroup = this.deleteGeometriesFromGroup(geometryGroupid);
    if (geometryGroup.id !== this.defaultGeometryGroupId) {
      for (let i = 0; i < this.geometryGroups.length; i++) {
        if (this.geometryGroups[i].id === geometryGroup.id) {
          this.geometryGroups.splice(i, 1);
        }
      }
    }
  };
}
