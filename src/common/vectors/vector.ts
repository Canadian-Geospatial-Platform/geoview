/* eslint-disable no-plusplus */
import L, { LatLngExpression } from 'leaflet';

import { Polygon } from './polygon';
import { Polyline } from './polyline';
import { Circle } from './circle';
import { MarkerCGP } from './marker';

import { generateId } from '../constant';
import { api } from '../../api/api';
import { EVENT_NAMES } from '../../api/event';
import { TypeMapRef, TypeVector, TypeGeometry, ConstVectorTypes } from '../../types/cgpv-types';
/**
 * Class used to manage vector geometries (Polyline, Polygon, Circle, Marker...)
 *
 * @export
 * @class Vector
 */
export class Vector {
    // reference to the map object
    private vectorMapRef: TypeMapRef;

    // used to handle creating a polyline
    polyline: Polyline;

    // used to handle creating a polygon
    polygon: Polygon;

    // used to handle crearting a circle
    circle: Circle;

    // used to handle crearting a marker
    marker: MarkerCGP;

    // used to store geometry groups
    geometryGroups: TypeVector[] = [];

    // contains all the added geometries
    geometries: TypeGeometry[] = [];

    // default geometry group name
    defaultGeometryGroupID = 'defaultGeomGroup';

    // index of the active geometry group used to add new geometries in the map
    activeGeometryGroup = 0;

    /**
     * Initialize map, vectors, and listen to add vector events
     *
     * @param {Map} map leaflet map object
     */
    constructor(mapRef: TypeMapRef) {
        this.vectorMapRef = mapRef;

        // initialize vector types
        this.polyline = new Polyline();
        this.polygon = new Polygon();
        this.circle = new Circle();
        this.marker = new MarkerCGP();

        // create default geometry group
        this.createGeometryGroup(this.defaultGeometryGroupID, true);

        // listen to add vector events
        api.event.on(EVENT_NAMES.EVENT_VECTOR_ADD, (payload) => {
            const id = payload.id ? payload.id : null;
            if (payload.type === ConstVectorTypes.CIRCLE) {
                this.addCircle(payload.latitude, payload.longitude, payload.radius, payload.options, id);
            } else if (payload.type === ConstVectorTypes.POLYGON) {
                this.addPolygon(payload.points, payload.options, id);
            } else if (payload.type === ConstVectorTypes.POLYLINE) {
                this.addPolyline(payload.points, payload.options, id);
            } else if (payload.type === ConstVectorTypes.MARKER) {
                this.addMarker(payload.latitude, payload.longitude, payload.options, id);
            } else if (payload.type === ConstVectorTypes.CIRCLE_MARKER) {
                this.addCircleMarker(payload.latitude, payload.longitude, payload.radius, payload.options, id);
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
    addPolyline = (points: LatLngExpression[] | LatLngExpression[][], options: Record<string, unknown>, id?: string): TypeGeometry => {
        const lId = generateId(id);

        const polyline = this.polyline.createPolyline(lId, points, options);

        polyline.addTo(this.geometryGroups[this.activeGeometryGroup]);

        this.geometries.push(polyline);

        // emit an event that a polyline vector has been added
        api.event.emit(EVENT_NAMES.EVENT_VECTOR_ADDED, api.mapInstance(this.vectorMapRef.map).id, { ...polyline });

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
    ): TypeGeometry => {
        const lId = generateId(id);

        const polygon = this.polygon.createPolygon(lId, points, options);

        polygon.addTo(this.geometryGroups[this.activeGeometryGroup]);

        this.geometries.push(polygon);

        // emit an event that a polygon vector has been added
        api.event.emit(EVENT_NAMES.EVENT_VECTOR_ADDED, api.mapInstance(this.vectorMapRef.map).id, { ...polygon });

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
    addCircle = (latitude: number, longitude: number, radius: number, options: Record<string, unknown>, id?: string): TypeGeometry => {
        const lId = generateId(id);

        const circle = this.circle.createCircle(lId, latitude, longitude, radius, options);

        this.geometries.push(circle);

        circle.addTo(this.geometryGroups[this.activeGeometryGroup]);

        // emit an event that a circle vector has been added
        api.event.emit(EVENT_NAMES.EVENT_VECTOR_ADDED, api.mapInstance(this.vectorMapRef.map).id, { ...circle });

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
    ): TypeGeometry => {
        const lId = generateId(id);

        const circleMarker = this.circle.createCircleMarker(lId, latitude, longitude, radius, options);

        this.geometries.push(circleMarker);

        circleMarker.addTo(this.geometryGroups[this.activeGeometryGroup]);

        // emit an event that a circleMarker vector has been added
        api.event.emit(EVENT_NAMES.EVENT_VECTOR_ADDED, api.mapInstance(this.vectorMapRef.map).id, {
            ...circleMarker,
        });

        return circleMarker;
    };

    /**
     * Create a new marker
     *
     * @param {number} latitude the latitude position of the marker
     * @param {number} longitude the longitude position of the marker
     * @param {Record<string, unknown>} options marker options including styling
     * @param {string} id an optional id to be used to manage this geometry
     *
     * @returns a geometry containing the id and the created geometry
     */
    addMarker = (latitude: number, longitude: number, options: Record<string, unknown>, id?: string): TypeGeometry => {
        const lId = generateId(id);

        const marker = this.marker.createMarker(lId, latitude, longitude, options);

        this.geometries.push(marker);

        marker.addTo(this.geometryGroups[this.activeGeometryGroup]);

        // emit an event that a marker vector has been added
        api.event.emit(EVENT_NAMES.EVENT_VECTOR_ADDED, api.mapInstance(this.vectorMapRef.map).id, { ...marker });

        return marker;
    };

    /**
     * Find a geometry using it's id
     *
     * @param {string} id the id of the geometry to return
     *
     * @returns a geometry with a geometry and id
     */
    getGeometry = (id: string): TypeGeometry => {
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
     * @param {string} GeometryGroupid the id of the group to use when managing this group
     * @param {boolean} addGroupToMap a flag indicating that the geometry group must be added to the map
     */
    createGeometryGroup = (GeometryGroupid: string, addGroupToMap = true): void => {
        if (!this.getGeometryGroup(GeometryGroupid)) {
            const featureGroup = L.featureGroup() as TypeVector;
            featureGroup.id = GeometryGroupid;
            if (addGroupToMap) {
                featureGroup.addTo(this.vectorMapRef.map);
                featureGroup.visible = true;
            }
            this.geometryGroups.push(featureGroup);
        }
    };

    /**
     * set the active geometry group (the geometry group used when adding geometries)
     *
     * @param {string} id optional the id of the group to set as active
     */
    setActiveGeometryGroup = (id?: string): void => {
        // if group name not give, add to default group
        const groupName = id || this.defaultGeometryGroupID;
        for (let i = 0; i < this.geometryGroups.length; i++) {
            if (this.geometryGroups[i].id === groupName) {
                this.activeGeometryGroup = i;
                break;
            }
        }
    };

    /**
     * Get the geometry group by using the ID specified when the group was created
     *
     * @param {string} id the id of the geometry group to return
     *
     * @returns the geomtry group
     */
    getGeometryGroup = (id: string): TypeVector => {
        return this.geometryGroups.filter((geometryGroup) => geometryGroup.id === id)[0];
    };

    /**
     * Show the identified geometry group on the map
     *
     * @param {string} id optional the id of the group to show on the map
     */
    setGeometryGroupAsVisible = (id?: string): void => {
        const groupName = id || this.defaultGeometryGroupID;
        const geometryGroup = this.getGeometryGroup(groupName);
        geometryGroup.addTo(this.vectorMapRef.map);
        geometryGroup.visible = true;
    };

    /**
     * hide the identified geometry group from the map
     *
     * @param {string} id optional the id of the group to show on the map
     */
    setGeometryGroupAsInvisible = (id?: string): void => {
        const groupName = id || this.defaultGeometryGroupID;
        const geometryGroup = this.getGeometryGroup(groupName);
        geometryGroup.removeFrom(this.vectorMapRef.map);
        geometryGroup.visible = false;
    };

    /**
     * turn on the geometry groups that are flaged as visible;
     */
    turnOnGeometryGroups = (): void => {
        for (let i = 0; i < this.geometryGroups.length; i++) {
            if (this.geometryGroups[i].visible) this.geometryGroups[i].addTo(this.vectorMapRef.map);
        }
    };

    /**
     * turn off the geometry groups that are flaged as visible;
     */
    turnOffGeometryGroups = (): void => {
        for (let i = 0; i < this.geometryGroups.length; i++) {
            if (this.geometryGroups[i].visible) this.geometryGroups[i].removeFrom(this.vectorMapRef.map);
        }
    };

    /**
     * Add a new geometry to the group that was created with an id
     *
     * @param {TypeGeometry} geometry the geometry to be added to the group
     * @param {string} id optional id of the group to add the geometry to
     */
    addToGeometryGroup = (geometry: TypeGeometry, id?: string): void => {
        // if group name not given, add to default group
        const groupName = id || this.defaultGeometryGroupID;

        // create geometry group if it does not exist
        this.createGeometryGroup(groupName);

        for (let i = 0; i < this.geometryGroups.length; i++) {
            if (this.geometryGroups[i].id === groupName) {
                this.geometryGroups[i].addLayer(geometry);
            }
        }
    };

    /**
     * Find the group that the geometry exists in and delete the geometry from that group
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
     *
     * @param {string} geometryId the geometry id to be deleted
     * @param {string} groupId optional group id
     */
    deleteGeometryFromGroup = (geometryId: string, groupId?: string): void => {
        const geometry = this.getGeometry(geometryId);
        // if group name not given, use the default group
        const groupName = groupId || this.defaultGeometryGroupID;
        for (let i = 0; i < this.geometryGroups.length; i++) {
            if (this.geometryGroups[i].id === groupName) {
                this.geometryGroups[i].getLayers().forEach((layer) => {
                    if (geometry === layer) {
                        this.geometryGroups[i].removeLayer(layer);
                    }
                });
            }
        }
    };

    /**
     * Delete all geometries from the geometry group but keep the group
     *
     * @param {string} id optional group id
     */
    deleteGeometriesFromGroup = (id?: string): void => {
        // if group name not give, add to default group
        const groupName = id || this.defaultGeometryGroupID;
        for (let i = 0; i < this.geometryGroups.length; i++) {
            if (this.geometryGroups[i].id === groupName) {
                this.geometryGroups[i].clearLayers();
                break;
            }
        }
    };

    /**
     * Delete a geometry group and all the geometries from the map
     *
     * @param {string} id optional id of the geometry group to delete
     */
    deleteGeometryGroup = (id?: string): void => {
        if (id === this.defaultGeometryGroupID || id === '') {
            // can't delete the default group
            this.deleteGeometriesFromGroup();
        } else {
            for (let i = 0; i < this.geometryGroups.length; i++) {
                if (this.geometryGroups[i].id === id) {
                    this.geometryGroups[i].clearLayers();
                    this.geometryGroups.splice(i, 1);
                }
            }
        }
    };
}
