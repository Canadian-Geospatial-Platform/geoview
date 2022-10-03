import VectorLayer from 'ol/layer/Vector';
import VectorSource, { Options as VectorSourceOptions } from 'ol/source/Vector';
import { Feature } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { Options as VectorLayerOptions } from 'ol/layer/BaseVector';
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
export declare class Vector {
    #private;
    geometryGroups: FeatureCollection[];
    geometries: Feature[];
    defaultGeometryGroupId: string;
    activeGeometryGroupIndex: number;
    /**
     * Initialize map, vectors, and listen to add vector events
     *
     * @param {string} mapId map id
     */
    constructor(mapId: string);
    /**
     * Create a polyline using an array of lng/lat points
     *
     * @param {Coordinate} points points of lng/lat to draw a polyline
     * @param options polyline options including styling
     * @param {string} id an optional id to be used to manage this geometry
     *
     * @returns {Feature} a geometry containing the id and the created geometry
     */
    addPolyline: (points: Coordinate, options?: {
        geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
        style?: TypeFeatureStyle;
    }, id?: string) => Feature;
    /**
     * Create a new polygon
     *
     * @param {Coordinate} points array of points to create the polygon
     * @param options polygon options including styling
     * @param {string} id an optional id to be used to manage this geometry
     *
     * @returns {Feature} a geometry containing the id and the created geometry
     */
    addPolygon: (points: number[] | Coordinate[][], options?: {
        geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
        style?: TypeFeatureStyle;
    }, id?: string) => Feature;
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
    addCircle: (coordinate: Coordinate, radius?: number, options?: {
        geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
        style?: TypeFeatureCircleStyle;
    }, id?: string) => Feature;
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
    addCircleMarker: (coordinate: Coordinate, radius?: number, options?: {
        geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
        style?: TypeFeatureCircleStyle;
    }, id?: string) => Feature;
    /**
     * Create a new marker
     *
     * @param {Coordinate} coordinate the long lat position of the marker
     * @param options marker options including styling
     * @param {string} id an optional id to be used to manage this geometry
     *
     * @returns {Feature} a geometry containing the id and the created geometry
     */
    addMarker: (coordinate: Coordinate, options?: {
        geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
        style?: TypeFeatureStyle;
    }, id?: string) => Feature;
    /**
     * Find a geometry using it's id
     *
     * @param {string} id the id of the geometry to return
     *
     * @returns {Feature} a geometry having the specified id
     */
    getGeometry: (id: string) => Feature;
    /**
     * Delete a geometry using the id and delete it from the groups and the map
     *
     * @param {string} id the id of the geometry to delete
     */
    deleteGeometry: (id: string) => void;
    /**
     * Create a new geometry group to manage multiple geometries at once
     *
     * @param {string} geometryGroupId the id of the group to use when managing this group
     * @param options an optional vector layer and vector source options
     * @returns {FeatureCollection} created geometry group
     */
    createGeometryGroup: (geometryGroupId: string, options?: {
        vectorLayerOptions?: VectorLayerOptions<VectorSource>;
        vectorSourceOptions?: VectorSourceOptions;
    }) => FeatureCollection;
    /**
     * set the active geometry group (the geometry group used when adding geometries).
     * If id is not specified, use the default geometry group.
     *
     * @param {string} id optional the id of the group to set as active
     */
    setActiveGeometryGroup: (id?: string) => void;
    /**
     * Get the active geometry group
     *
     * @returns {FeatureCollection} the active geometry group
     */
    getActiveGeometryGroup: () => FeatureCollection;
    /**
     * Get the geometry group by using the ID specified when the group was created
     * if geometryGroupid is not provided, return the active geometry group
     *
     * @param {string} geometryGroupId the id of the geometry group to return
     *
     * @returns the geomtry group
     */
    getGeometryGroup: (geometryGroupId?: string) => FeatureCollection;
    /**
     * Find the groups that contain the geometry using it's id
     *
     * @param {string} id the id of the geometry
     *
     * @returns {FeatureGroup | null} the groups that contain the geometry
     *                                or null if not found
     */
    getGeometryGroupsByGeometryId: (id: string) => FeatureCollection[];
    /**
     * Show the identified geometry group on the map
     * if geometryGroupId is not provided, use the active geometry group
     *
     * @param {string} geometryGroupId optional the id of the group to show on the map
     */
    setGeometryGroupAsVisible: (geometryGroupId?: string) => void;
    /**
     * hide the identified geometry group from the map
     * if groupId is not provided, use the active geometry group
     *
     * @param {string} geometryGroupId optional the id of the group to show on the map
     */
    setGeometryGroupAsInvisible: (geometryGroupId?: string) => void;
    /**
     * Add a new geometry to the group whose identifier is equal to geometryGroupId.
     * if geometryGroupId is not provided, use the active geometry group. If the
     * geometry group doesn't exist, create it.
     *
     * @param {Feature} geometry the geometry to be added to the group
     * @param {string} geometryGroupId optional id of the group to add the geometry to
     */
    addToGeometryGroup: (geometry: Feature, geometryGroupId?: string) => void;
    /**
     * Find the groups that the geometry exists in and delete the geometry from those groups
     *
     * @param {string} geometryId the geometry id
     */
    deleteGeometryFromGroups: (geometryId: string) => void;
    /**
     * Delete a specific geometry from a group using the geometry id
     * If geometryGroupid is not provided, the active geometry group is used.
     *
     * @param {string} geometryId the geometry id to be deleted
     * @param {string} geometryGroupid optional group id
     */
    deleteGeometryFromGroup: (geometryId: string, geometryGroupid?: string) => void;
    /**
     * Delete all geometries from the geometry group but keep the group
     * If geometryGroupid is not provided, the active geometry group is used.
     *
     * @param {string} geometryGroupid optional group id
     * @returns {FeatureCollection} the group with empty layers
     */
    deleteGeometriesFromGroup: (geometryGroupid?: string) => FeatureCollection;
    /**
     * Delete a geometry group and all the geometries from the map.
     * If geometryGroupid is not provided, the active geometry group is used.
     * The default geometry group can't be deleted.
     *
     * @param {string} geometryGroupid optional id of the geometry group to delete
     */
    deleteGeometryGroup: (geometryGroupid?: string) => void;
}
export {};
