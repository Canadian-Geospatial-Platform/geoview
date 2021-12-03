/* eslint-disable no-plusplus */
import L, { LatLngExpression } from 'leaflet';

import { generateId } from '../constant';
import { api } from '../../api/api';
import { EVENT_NAMES } from '../../api/event';
import { CONST_VECTOR_TYPES } from '../../types/cgpv-types';
/**
 * Class used to manage vector geometries (Polyline, Polygon, Circle, Marker...)
 *
 * @export
 * @class Vector
 */
export class Vector {
    // reference to the map object
    private map: L.Map;

    // used to store geometry groups
    geometryGroups: L.FeatureGroup[] = [];

    // contains all the added geometries
    geometries: L.Layer[] = [];

    // default geometry group name
    defaultGeometryGroupId = 'defaultGeomGroup';

    // index of the active geometry group used to add new geometries in the map
    activeGeometryGroupIndex = 0;

    /**
     * Initialize map, vectors, and listen to add vector events
     *
     * @param {Map} map leaflet map object
     */
    constructor(map: L.Map) {
        this.map = map;

        // create default geometry group
        this.createGeometryGroup(this.defaultGeometryGroupId);

        // listen to add vector events
        api.event.on(EVENT_NAMES.EVENT_VECTOR_ADD, (payload) => {
            const id = payload.id ? payload.id : null;
            if (payload.type === CONST_VECTOR_TYPES.CIRCLE) {
                this.addCircle(payload.latitude, payload.longitude, payload.options, id);
            } else if (payload.type === CONST_VECTOR_TYPES.POLYGON) {
                this.addPolygon(payload.points, payload.options, id);
            } else if (payload.type === CONST_VECTOR_TYPES.POLYLINE) {
                this.addPolyline(payload.points, payload.options, id);
            } else if (payload.type === CONST_VECTOR_TYPES.MARKER) {
                this.addMarker(payload.latitude, payload.longitude, payload.options, id);
            } else if (payload.type === CONST_VECTOR_TYPES.CIRCLE_MARKER) {
                this.addCircleMarker(payload.latitude, payload.longitude, payload.options, id);
            }
        });

        // listen to outside events to remove geometries
        api.event.on(EVENT_NAMES.EVENT_VECTOR_REMOVE, (payload) => {
            // remove geometry from outside
            this.deleteGeometry(payload.id);
        });

        // listen to outside events to turn on geometry groups
        api.event.on(EVENT_NAMES.EVENT_VECTOR_ON, () => {
            this.turnOnGeometryGroups();
        });

        // listen to outside events to turn off geometry groups
        api.event.on(EVENT_NAMES.EVENT_VECTOR_OFF, () => {
            this.turnOffGeometryGroups();
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
    addPolyline = (points: LatLngExpression[] | LatLngExpression[][], options: L.PolylineOptions, id?: string): L.Polyline => {
        const lId = generateId(id);

        const polyline = L.polyline(points, { ...options, id: lId });

        polyline.addTo(this.geometryGroups[this.activeGeometryGroupIndex]);

        this.geometries.push(polyline);

        // emit an event that a polyline vector has been added
        api.event.emit(EVENT_NAMES.EVENT_VECTOR_ADDED, api.mapInstance(this.map).id, { ...polyline });

        return polyline;
    };

    /**
     * Create a new polygon
     *
     * @param {LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][]} points array of points to create the polygon
     * @param {L.PolylineOptions} options polygon options including styling
     * @param {string} id an optional id to be used to manage this geometry
     *
     * @returns a geometry containing the id and the created geometry
     */
    addPolygon = (
        points: LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][],
        options: L.PolylineOptions,
        id?: string
    ): L.Polygon => {
        const lId = generateId(id);

        const polygon = L.polygon(points, { ...options, id: lId });

        polygon.addTo(this.geometryGroups[this.activeGeometryGroupIndex]);

        this.geometries.push(polygon);

        // emit an event that a polygon vector has been added
        api.event.emit(EVENT_NAMES.EVENT_VECTOR_ADDED, api.mapInstance(this.map).id, { ...polygon });

        return polygon;
    };

    /**
     * Create a new circle
     *
     * @param {number} latitude the latitude position of the circle
     * @param {number} longitude the longitude position of the circle
     * @param {L.CircleMarkerOptions} options circle options including styling
     * @param {string} id an optional id to be used to manage this geometry
     *
     * @returns a geometry containing the id and the created geometry
     */
    addCircle = (latitude: number, longitude: number, options: L.CircleMarkerOptions, id?: string): L.Circle => {
        const lId = options.id || generateId(id);

        const circle = L.circle([latitude, longitude], { ...options, id: lId });

        this.geometries.push(circle);

        circle.addTo(this.geometryGroups[this.activeGeometryGroupIndex]);

        // emit an event that a circle vector has been added
        api.event.emit(EVENT_NAMES.EVENT_VECTOR_ADDED, api.mapInstance(this.map).id, { ...circle });

        return circle;
    };

    /**
     * Create a new circle marker
     *
     * @param {number} latitude the latitude position of the circle marker
     * @param {number} longitude the longitude position of the circle marker
     * @param {L.CircleMarkerOptions} options circle marker options including styling
     * @param {string} id an optional id to be used to manage this geometry
     *                 The value from options.id has precedence on the id parameter.
     *
     * @returns a geometry containing the id and the created geometry
     */
    addCircleMarker = (latitude: number, longitude: number, options: L.CircleMarkerOptions, id?: string): L.CircleMarker => {
        const lId = options.id || generateId(id);

        const circleMarker = L.circleMarker([latitude, longitude], { ...options, id: lId });

        this.geometries.push(circleMarker);

        circleMarker.addTo(this.geometryGroups[this.activeGeometryGroupIndex]);

        // emit an event that a circleMarker vector has been added
        api.event.emit(EVENT_NAMES.EVENT_VECTOR_ADDED, api.mapInstance(this.map).id, {
            ...circleMarker,
        });

        return circleMarker;
    };

    /**
     * Create a new marker
     *
     * @param {number} latitude the latitude position of the marker
     * @param {number} longitude the longitude position of the marker
     * @param {L.Marker} options marker options including styling
     * @param {string} id an optional id to be used to manage this geometry
     *
     * @returns a geometry containing the id and the created geometry
     */
    addMarker = (latitude: number, longitude: number, options: L.MarkerOptions, id?: string): L.Marker => {
        const idMarker = generateId(id);

        const marker = L.marker([latitude, longitude], { ...options, id: idMarker });

        this.geometries.push(marker);

        marker.addTo(this.geometryGroups[this.activeGeometryGroupIndex]);

        // emit an event that a marker vector has been added
        api.event.emit(EVENT_NAMES.EVENT_VECTOR_ADDED, api.mapInstance(this.map).id, { ...marker });

        return marker;
    };

    /**
     * Find a geometry using it's id
     *
     * @param {string} id the id of the geometry to return
     *
     * @returns {L.Layer} a geometry having the specified id
     */
    getGeometry = (id: string): L.Layer => {
        return this.geometries.filter((layer) => layer.id === id)[0];
    };

    /**
     * Delete a geometry using the id and delete it from the groups and the map
     *
     * @param {string} id the id of the geometry to delete
     */
    deleteGeometry = (id: string): void => {
        for (let i = 0; i < this.geometries.length; i++) {
            if (this.geometries[i].id === id) {
                this.deleteGeometryFromGroups(id);

                this.geometries[i].remove();

                this.geometries.splice(i, 1);

                break;
            }
        }
    };

    /**
     * Create a new geometry group to manage multiple geometries at once
     *
     * @param {string} geometryGroupid the id of the group to use when managing this group
     */
    createGeometryGroup = (geometryGroupid: string, options?: L.FeatureGroupOptions): L.FeatureGroup => {
        let featureGroup = this.getGeometryGroup(geometryGroupid);
        if (!featureGroup) {
            const featureGroupOptions = { ...options, id: geometryGroupid };
            featureGroup = L.featureGroup([], featureGroupOptions);
            if (featureGroup.visible) {
                featureGroup.addTo(this.map);
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
     * @returns {L.FeatureGroup} the active geometry group
     */
    getActiveGeometryGroup = (): L.FeatureGroup => {
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
    getGeometryGroup = (geometryGroupId?: string): L.FeatureGroup => {
        let geometryGroup: L.FeatureGroup;
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
    getGeometryGroupsByGeometryId = (id: string): L.FeatureGroup[] => {
        const returnValue: L.FeatureGroup[] = [];
        for (let i = 0; i < this.geometryGroups.length; i++) {
            const geometries = this.geometryGroups[i].getLayers();
            for (let j = 0; j < geometries.length; j++) {
                const geometry = geometries[j];
                if (geometry.id === id) returnValue.push(this.geometryGroups[i]);
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
        geometryGroup.addTo(this.map);
        geometryGroup.visible = true;
        geometryGroup.options.visible = true;
    };

    /**
     * hide the identified geometry group from the map
     * if groupId is not provided, use the active geometry group
     *
     * @param {string} geometryGroupId optional the id of the group to show on the map
     */
    setGeometryGroupAsInvisible = (geometryGroupId?: string): void => {
        const geometryGroup = this.getGeometryGroup(geometryGroupId);
        geometryGroup.removeFrom(this.map);
        geometryGroup.visible = false;
        geometryGroup.options.visible = false;
    };

    /**
     * Turn on the geometry groups that are flaged as visible. The visible flag and options
     * remain unchanged, this allow us to turn on and off the geometry groups to temporarily
     * hide them.
     */
    turnOnGeometryGroups = (): void => {
        for (let i = 0; i < this.geometryGroups.length; i++) {
            if (this.geometryGroups[i].visible) this.geometryGroups[i].addTo(this.map);
        }
    };

    /**
     * Turn off the geometry groups that are flaged as visible. The visible flag and options
     * remain unchanged, this allow us to turn on and off the geometry groups to temporarily
     * hide them.
     */
    turnOffGeometryGroups = (): void => {
        for (let i = 0; i < this.geometryGroups.length; i++) {
            if (this.geometryGroups[i].visible) this.geometryGroups[i].removeFrom(this.map);
        }
    };

    /**
     * Add a new geometry to the group whose identifier is equal to geometryGroupId.
     * if geometryGroupId is not provided, use the active geometry group. If the
     * geometry group doesn't exist, create it.
     *
     * @param {L.Layer} geometry the geometry to be added to the group
     * @param {string} geometryGroupId optional id of the group to add the geometry to
     */
    addToGeometryGroup = (geometry: L.Layer, geometryGroupId?: string): void => {
        let geometryGroup: L.FeatureGroup;
        if (geometryGroupId) {
            // create geometry group if it does not exist
            geometryGroup = this.createGeometryGroup(geometryGroupId);
        } else {
            geometryGroup = this.geometryGroups[this.activeGeometryGroupIndex];
        }

        geometryGroup.addLayer(geometry);
    };

    /**
     * Find the groups that the geometry exists in and delete the geometry from those groups
     *
     * @param {string} geometryId the geometry id
     */
    deleteGeometryFromGroups = (geometryId: string): void => {
        const geometry = this.getGeometry(geometryId);
        for (let i = 0; i < this.geometryGroups.length; i++) {
            this.geometryGroups[i].getLayers().forEach((layer) => {
                if (geometry === layer) {
                    this.geometryGroups[i].removeLayer(layer);
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
        geometryGroup.getLayers().forEach((layer) => {
            if (geometry === layer) {
                geometryGroup.removeLayer(layer);
            }
        });
    };

    /**
     * Delete all geometries from the geometry group but keep the group
     * If geometryGroupid is not provided, the active geometry group is used.
     *
     * @param {string} geometryGroupid optional group id
     */
    deleteGeometriesFromGroup = (geometryGroupid?: string): L.FeatureGroup => {
        const geometryGroup = this.getGeometryGroup(geometryGroupid);
        geometryGroup.clearLayers();
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
