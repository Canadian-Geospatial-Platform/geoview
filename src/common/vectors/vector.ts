/* eslint-disable no-plusplus */
import L, { Map, LatLngExpression } from 'leaflet';

import { Polygon } from './polygon';
import { Polyline } from './polyline';
import { Circle } from './circle';

/**
 * constant used to specify available vectors to draw
 */
export const VECTOR_TYPES = {
    POLYLINE: 'polyline',
    POLYGON: 'polygon',
    CIRCLE: 'circle',
};

/**
 * Used when creating a geometry
 */
export interface GeometryType {
    id: string;
    layer: L.Layer;
}

/**
 * Used to store geometries in a group
 */
interface VectorType {
    id: string;
    geometryGroup: GeometryType[];
}

/**
 * Class used to manage vector layers (Polyline, Polygon, Circle...)
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

    // used to store layer groups
    geometryGroups: VectorType[] = [];

    // contains all the added layers
    layers: GeometryType[] = [];

    // feature group will contain the created layers in the map
    featurGroup: L.FeatureGroup;

    /**
     * Initialize map, vectors
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
    }

    /**
     * Generate a unique id to use in a geometry if an id was not specified
     *
     * @param {string} id an id to return if it was already passed
     *
     * @returns the generated id
     */
    private generateGeometryId(id: string | undefined): string {
        return id !== null && id !== undefined && id.length > 0
            ? id
            : (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase();
    }

    /**
     * Create a polyline using an array of lat/lng points
     *
     * @param {LatLngExpression[] | LatLngExpression[][]} points points of lat/lng to draw a polyline
     * @param options polyline options including styling
     * @param {string} id an optional id to be used to manage this layer
     *
     * @returns a geometry containing the id and the created layer
     */
    addPolyline = (points: LatLngExpression[] | LatLngExpression[][], options: Record<string, unknown>, id?: string): GeometryType => {
        const lId = this.generateGeometryId(id);

        const polyline = this.polyline.createPolyline(lId, points, options);

        this.layers.push({
            id: lId,
            layer: polyline.layer,
        });

        polyline.layer.addTo(this.featurGroup);

        return polyline;
    };

    /**
     * Create a new polygon
     *
     * @param {LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][]} points array of points to create the polygon
     * @param {Record<string, unknown>} options polygon options including styling
     * @param {string} id an optional id to be used to manage this layer
     *
     * @returns a geometry containing the id and the created layer
     */
    addPolygon = (
        points: LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][],
        options: Record<string, unknown>,
        id?: string
    ): GeometryType => {
        const lId = this.generateGeometryId(id);

        const polygon = this.polygon.createPolygon(lId, points, options);

        this.layers.push({
            id: lId,
            layer: polygon.layer,
        });

        polygon.layer.addTo(this.featurGroup);

        return polygon;
    };

    /**
     * Create a new circle
     *
     * @param {number} latitude the latitude position of the circle
     * @param {number} longitude the longitude position of the circle
     * @param {number} radius the radius of the circle (in kilometers)
     * @param {Record<string, unknown>} options circle options including styling
     * @param {string} id an optional id to be used to manage this layer
     *
     * @returns a geometry containing the id and the created layer
     */
    addCircle = (latitude: number, longitude: number, radius: number, options: Record<string, unknown>, id?: string): GeometryType => {
        const lId = this.generateGeometryId(id);

        const circle = this.circle.createCircle(lId, latitude, longitude, radius, options);

        this.layers.push({
            id: lId,
            layer: circle.layer,
        });

        circle.layer.addTo(this.featurGroup);

        return circle;
    };

    /**
     * Create a new circle marker
     *
     * @param {number} latitude the latitude position of the circle marker
     * @param {number} longitude the longitude position of the circle marker
     * @param {number} radius the radius of the circle marker (in meters)
     * @param {Record<string, unknown>} options circle marker options including styling
     * @param {string} id an optional id to be used to manage this layer
     *
     * @returns a geometry containing the id and the created layer
     */
    addCircleMarker = (
        latitude: number,
        longitude: number,
        radius: number,
        options: Record<string, unknown>,
        id?: string
    ): GeometryType => {
        const lId = this.generateGeometryId(id);

        const circleMarker = this.circle.createCircleMarker(lId, latitude, longitude, radius, options);

        this.layers.push({
            id: lId,
            layer: circleMarker.layer,
        });

        circleMarker.layer.addTo(this.featurGroup);

        return circleMarker;
    };

    /**
     * Find a geometry using it's id
     *
     * @param {string} id the id of the geometry to return
     *
     * @returns a geometry with a layer and id
     */
    getGeometry = (id: string): GeometryType => {
        return this.layers.filter((layer) => layer.id === id)[0];
    };

    /**
     * Delete a geometry and the layer from the map using the id
     *
     * @param {string} id the id of the geometry to delete
     */
    deleteGeometry = (id: string): void => {
        this.layers.filter((layer) => layer.id === id)[0].layer.remove();
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
     * Add a new layer to the group that was created with an id
     *
     * @param {string} id the id of the group to add the layer to
     * @param {GeometryType} layer the layer to be added to the group
     */
    addToGeometryGroup = (id: string, layer: GeometryType): void => {
        for (let i = 0; i < this.geometryGroups.length; i++) {
            if (this.geometryGroups[i].id === id) {
                this.geometryGroups[i].geometryGroup.push(layer);
            }
        }
    };

    /**
     * Delete a geometry group and all the layers from the map
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
