/* eslint-disable no-plusplus */
import L, { Map, LatLngExpression } from 'leaflet';

import { Polygon } from './polygon';
import { Polyline } from './polyline';
import { Circle } from './circle';

import { MapInterface } from '../map-viewer';

import { generateId } from '../constant';
import { api } from '../../api/api';
import { EVENT_NAMES } from '../../api/event';

/**
 * constant used to specify available vectors to draw
 */
export const VectorTypes = {
    POLYLINE: 'polyline',
    POLYGON: 'polygon',
    CIRCLE: 'circle',
    CIRCLE_MARKER: 'circle_marker',
};

/**
 * Used when creating a geometry
 */
export interface GeometryType {
    id: string;
    layer: L.Layer;
    type: string;
}

/**
 * Used to store geometries in a group
 */
interface VectorType {
    id: string;
    geometryGroup: GeometryType[];
}

/**
 * Class used to manage vector geometries (Polyline, Polygon, Circle...)
 *
 * @export
 * @class Vector
 */
export class Vector {
    // reference to the map object
    map: Map;

    // used to handle creating a polyline
    polyline: Polyline;

    // used to handle creating a polygon
    polygon: Polygon;

    // used to handle crearting a circle
    circle: Circle;

    // used to store geometry groups
    geometryGroups: VectorType[] = [];

    // contains all the added geometries
    geometries: GeometryType[] = [];

    // feature group will contain the created geometries in the map
    featurGroup: L.FeatureGroup;

    /**
     * Initialize map, vectors, and listen to add vector events
     *
     * @param {Map} map leaflet map object
     */
    constructor(map: Map) {
        this.map = map;

        // initialize vector types
        this.polyline = new Polyline();
        this.polygon = new Polygon();
        this.circle = new Circle();

        // initialize a feature group
        this.featurGroup = new L.FeatureGroup();

        // add feature group to the map
        this.map.addLayer(this.featurGroup);

        // listen to add vector events
        api.event.on(EVENT_NAMES.EVENT_VECTOR_ADD, (payload) => {
            if (payload.type === VectorTypes.CIRCLE) {
                this.addCircle(payload.latitude, payload.longitude, payload.radius, payload.options);
            } else if (payload.type === VectorTypes.POLYGON) {
                this.addPolygon(payload.points, payload.options);
            } else if (payload.type === VectorTypes.POLYLINE) {
                this.addPolyline(payload.points, payload.options);
            } else if (payload.type === VectorTypes.CIRCLE_MARKER) {
                this.addCircleMarker(payload.latitude, payload.longitude, payload.radius, payload.options);
            }
        });

        // listen to outside events to remove geometries
        api.event.on(EVENT_NAMES.EVENT_VECTOR_REMOVE, (payload) => {
            // remove geometry from outside
            this.deleteGeometry(payload.id);
        });
    }

    /**
     * Create a polyline using an array of lat/lng points
     *
     * @param {LatLngExpression[] | LatLngExpression[][]} points points of lat/lng to draw a polyline
     * @param options polyline options including styling
     * @param {string} id an optional id to be used to manage this geometry
     *
     * @returns a geometry containing the id and the created geometry
     */
    addPolyline = (points: LatLngExpression[] | LatLngExpression[][], options: Record<string, unknown>, id?: string): GeometryType => {
        const lId = generateId(id);

        const polyline = this.polyline.createPolyline(lId, points, options);

        polyline.layer.addTo(this.featurGroup);

        this.geometries.push(polyline);

        // emit an event that a polyline vector has been added
        api.event.emit(EVENT_NAMES.EVENT_VECTOR_ADDED, (api.mapInstance(this.map) as MapInterface).id, { ...polyline });

        return polyline;
    };

    /**
     * Create a new polygon
     *
     * @param {LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][]} points array of points to create the polygon
     * @param {Record<string, unknown>} options polygon options including styling
     * @param {string} id an optional id to be used to manage this geometry
     *
     * @returns a geometry containing the id and the created geometry
     */
    addPolygon = (
        points: LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][],
        options: Record<string, unknown>,
        id?: string
    ): GeometryType => {
        const lId = generateId(id);

        const polygon = this.polygon.createPolygon(lId, points, options);

        polygon.layer.addTo(this.featurGroup);

        this.geometries.push(polygon);

        // emit an event that a polygon vector has been added
        api.event.emit(EVENT_NAMES.EVENT_VECTOR_ADDED, (api.mapInstance(this.map) as MapInterface).id, { ...polygon });

        return polygon;
    };

    /**
     * Create a new circle
     *
     * @param {number} latitude the latitude position of the circle
     * @param {number} longitude the longitude position of the circle
     * @param {number} radius the radius of the circle (in kilometers)
     * @param {Record<string, unknown>} options circle options including styling
     * @param {string} id an optional id to be used to manage this geometry
     *
     * @returns a geometry containing the id and the created geometry
     */
    addCircle = (latitude: number, longitude: number, radius: number, options: Record<string, unknown>, id?: string): GeometryType => {
        const lId = generateId(id);

        const circle = this.circle.createCircle(lId, latitude, longitude, radius, options);

        this.geometries.push(circle);

        circle.layer.addTo(this.featurGroup);

        // emit an event that a circle vector has been added
        api.event.emit(EVENT_NAMES.EVENT_VECTOR_ADDED, (api.mapInstance(this.map) as MapInterface).id, { ...circle });

        return circle;
    };

    /**
     * Create a new circle marker
     *
     * @param {number} latitude the latitude position of the circle marker
     * @param {number} longitude the longitude position of the circle marker
     * @param {number} radius the radius of the circle marker (in meters)
     * @param {Record<string, unknown>} options circle marker options including styling
     * @param {string} id an optional id to be used to manage this geometry
     *
     * @returns a geometry containing the id and the created geometry
     */
    addCircleMarker = (
        latitude: number,
        longitude: number,
        radius: number,
        options: Record<string, unknown>,
        id?: string
    ): GeometryType => {
        const lId = generateId(id);

        const circleMarker = this.circle.createCircleMarker(lId, latitude, longitude, radius, options);

        this.geometries.push(circleMarker);

        circleMarker.layer.addTo(this.featurGroup);

        // emit an event that a circleMarker vector has been added
        api.event.emit(EVENT_NAMES.EVENT_VECTOR_ADDED, (api.mapInstance(this.map) as MapInterface).id, {
            ...circleMarker,
        });

        return circleMarker;
    };

    /**
     * Find a geometry using it's id
     *
     * @param {string} id the id of the geometry to return
     *
     * @returns a geometry with a geometry and id
     */
    getGeometry = (id: string): GeometryType => {
        return this.geometries.filter((layer) => layer.id === id)[0];
    };

    /**
     * Delete a geometry and the geometry from the map using the id
     *
     * @param {string} id the id of the geometry to delete
     */
    deleteGeometry = (id: string): void => {
        for (let i = 0; i < this.geometries.length; i++) {
            if (this.geometries[i].id === id) {
                this.geometries[i].layer.remove();

                this.deleteGeometryFromGroups(this.geometries[i].id);

                this.geometries.splice(i, 1);

                break;
            }
        }
    };

    /**
     * Create a new geometry group to manage multiple geometries at once
     *
     * @param {string} id the id of the group to use when managing this group
     */
    createGeometryGroup = (id: string): void => {
        this.geometryGroups.push({ id, geometryGroup: [] });
    };

    /**
     * Get the geometry group by using the ID specified when the group was created
     *
     * @param {string} id the id of the geometry group to return
     *
     * @returns the geomtry group
     */
    getGeometryGroup = (id: string): VectorType => {
        return this.geometryGroups.filter((geometryGroup) => geometryGroup.id === id)[0];
    };

    /**
     * Add a new geometry to the group that was created with an id
     *
     * @param {string} id the id of the group to add the geometry to
     * @param {GeometryType} layer the geometry to be added to the group
     */
    addToGeometryGroup = (id: string, layer: GeometryType): void => {
        for (let i = 0; i < this.geometryGroups.length; i++) {
            if (this.geometryGroups[i].id === id) {
                this.geometryGroups[i].geometryGroup.push(layer);
            }
        }
    };

    /**
     * Find the group that the geometry exists in and delete the geometry from that group
     *
     * @param {string} geometryId the geometry id
     */
    deleteGeometryFromGroups = (geometryId: string): void => {
        for (let i = 0; i < this.geometryGroups.length; i++) {
            this.geometryGroups[i].geometryGroup.forEach((geometry, index) => {
                if (geometry.id === geometryId) {
                    this.geometryGroups[i].geometryGroup.splice(index, 1);
                }
            });
        }
    };

    /**
     * Delete a specific geometry from a group using the geometry id
     *
     * @param {string} geometryId the geometry id to be deleted
     * @param {string} groupId the group id
     */
    deleteGeometryFromGroup = (geometryId: string, groupId: string): void => {
        for (let i = 0; i < this.geometryGroups.length; i++) {
            if (this.geometryGroups[i].id === groupId) {
                this.geometryGroups[i].geometryGroup.forEach((geometry, index) => {
                    if (geometry.id === geometryId) {
                        geometry.layer.remove();
                        this.geometryGroups[i].geometryGroup.splice(index, 1);
                    }
                });
            }
        }
    };

    /**
     * Delete all geometries from the geometry group but keep the group
     *
     * @param {string} id group id
     */
    deleteGeometriesFromGroup = (id: string): void => {
        for (let i = 0; i < this.geometryGroups.length; i++) {
            if (this.geometryGroups[i].id === id) {
                this.geometryGroups[i].geometryGroup.forEach((geometry) => {
                    geometry.layer.remove();
                });
            }
        }
    };

    /**
     * Delete a geometry group and all the geometries from the map
     *
     * @param {string} id the id of the geometry group to delete
     */
    deleteGeometryGroup = (id: string): void => {
        for (let i = 0; i < this.geometryGroups.length; i++) {
            if (this.geometryGroups[i].id === id) {
                this.geometryGroups[i].geometryGroup.forEach((geometry) => {
                    geometry.layer.remove();
                });

                this.geometryGroups.splice(i, 1);
            }
        }
    };
}
