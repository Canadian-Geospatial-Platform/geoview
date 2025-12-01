import VectorLayer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import type { Options as VectorSourceOptions } from 'ol/source/Vector';
import VectorSource from 'ol/source/Vector';
import type { Geometry as OLGeometry } from 'ol/geom';
import type { Coordinate } from 'ol/coordinate';
import type { Options as VectorLayerOptions } from 'ol/layer/BaseVector';
import type { MapViewer } from '@/geo/map/map-viewer';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { TypeStyleGeometry } from '@/api/types/map-schema-types';
import type { TypeFeatureCircleStyle, TypeFeatureStyle, TypeIconStyle } from '@/geo/layer/geometry/geometry-types';
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
export declare class GeometryApi {
    #private;
    geometries: Feature[];
    defaultGeometryGroupId: string;
    /**
     * Constructs a Geometry class and creates a geometry group in the process.
     * @param {MapViewer} mapViewer - A reference to the map viewer
     */
    constructor(mapViewer: MapViewer);
    /**
     * Registers a geometry added event handler.
     * @param {GeometryAddedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onGeometryAdded(callback: GeometryAddedDelegate): void;
    /**
     * Unregisters a geometry added event handler.
     * @param {GeometryAddedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offGeometryAdded(callback: GeometryAddedDelegate): void;
    /**
     * Create a polyline using an array of lon/lat points
     *
     * @param {Coordinate} points - The points of lon/lat to draw a polyline
     * @param options - Optional polyline options including styling
     * @param {string} id - Optional id to be used to manage this geometry
     * @param {string} groupId - Optional group id in which we want to add the geometry
     *
     * @returns {Feature} a geometry containing the id and the created geometry
     */
    addPolyline(points: Coordinate, options?: {
        projection?: number;
        geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
        style?: TypeFeatureStyle;
    }, id?: string, groupId?: string): Feature;
    /**
     * Create a new polygon
     *
     * @param {Coordinate} points - The array of points to create the polygon
     * @param options - the polygon options including styling
     * @param {string} optionalFeatureId - Optional id to be used to manage this geometry
     * @param {string} groupId - Optional group id in which we want to add the geometry
     *
     * @returns {Feature} a geometry containing the id and the created geometry
     */
    addPolygon(points: number[] | Coordinate[][], options?: {
        projection?: number;
        geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
        style?: TypeFeatureStyle;
    }, optionalFeatureId?: string, groupId?: string): Feature;
    /**
     * Create a new circle
     *
     * @param {Coordinate} coordinate - The long lat coordinate of the circle
     * @param options - The circle options including styling
     * @param {string} optionalFeatureId - Optional id to be used to manage this geometry
     * @param {string} groupId - Optional group id in which we want to add the geometry
     *
     * @returns {Feature} a geometry containing the id and the created geometry
     */
    addCircle(coordinate: Coordinate, options?: {
        projection?: number;
        geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
        style?: TypeFeatureCircleStyle;
    }, optionalFeatureId?: string, groupId?: string): Feature;
    /**
     * Create a new marker icon
     *
     * @param {Coordinate} coordinate - The long lat position of the marker
     * @param options - The marker options including styling
     * @param {string} optionalFeatureId - Optional id to be used to manage this geometry
     * @param {string} groupId - Optional group id in witch we want to add the geometry
     *
     * @returns {Feature} a geometry containing the id and the created geometry
     */
    addMarkerIcon(coordinate: Coordinate, options?: {
        projection?: number;
        geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
        style?: TypeIconStyle;
    }, optionalFeatureId?: string, groupId?: string): Feature;
    /**
     * Find a feature using it's id
     *
     * @param {string} featureId - The id of the feature to return
     *
     * @returns {Feature} a feature having the specified id
     */
    getGeometry(featureId: string): Feature;
    /**
     * Delete a feature using the id and delete it from the groups and the map
     *
     * @param {string} featureId - The id of the feature to delete
     */
    deleteGeometry(featureId: string): void;
    /**
     * Create a new geometry group to manage multiple geometries at once (z-index is infinity, set the index to change the behaviour)
     *
     * @param {string} geometryGroupId - The id of the group to use when managing this group
     * @param options - Optional vector layer and vector source options
     *
     * @returns {FeatureCollection} created geometry group
     */
    createGeometryGroup(geometryGroupId: string, options?: {
        vectorLayerOptions?: VectorLayerOptions<Feature, VectorSource>;
        vectorSourceOptions?: VectorSourceOptions<Feature>;
    }): FeatureCollection;
    /**
     * set the active geometry group (the geometry group used when adding geometries).
     * If id is not specified, use the default geometry group.
     *
     * @param {string} id - Optional the id of the group to set as active
     */
    setActiveGeometryGroup(id?: string): void;
    /**
     * Get the active geometry group
     *
     * @returns {FeatureCollection} - The active geometry group
     */
    getActiveGeometryGroup(): FeatureCollection;
    /**
     * Check if a geometry group exists
     *
     * @param {string} geometryGroupId - The id of the geometry group to check
     * @returns {boolean} True if the group exists, false otherwise
     */
    hasGeometryGroup(geometryGroupId: string): boolean;
    /**
     * Get the geometry group by using the ID specified when the group was created
     *
     * @param {string} geometryGroupId - The id of the geometry group to return
     *
     * @returns the geomtry group
     * @throws {InvaliGeometryGroupIdError} If the provided geometry group id does not exist.
     */
    getGeometryGroup(geometryGroupId: string): FeatureCollection;
    /**
     * Get all geometry groups
     *
     * @returns {FeatureCollection[]} Array of all geometry groups
     */
    getGeometryGroups(): FeatureCollection[];
    /**
     * Find the groups that contain the geometry using it's id
     *
     * @param {string} featureId - The id of the geometry
     *
     * @returns {FeatureCollection[]} Groups that contain the geometry
     */
    getGeometryGroupsByFeatureId(featureId: string): FeatureCollection[];
    /**
     * Show the identified geometry group on the map
     *
     * @param {string} geometryGroupId - The id of the group to show on the map
     * @throws {InvaliGeometryGroupIdError} If the provided geometry group id does not exist.
     */
    setGeometryGroupAsVisible(geometryGroupId: string): void;
    /**
     * Hide the identified geometry group from the map
     *
     * @param {string} geometryGroupId - The id of the group to show on the map
     * @throws {InvaliGeometryGroupIdError} If the provided geometry group id does not exist.
     */
    setGeometryGroupAsInvisible(geometryGroupId: string): void;
    /**
     * Get the z-index of a geometry group's vector layer, undefined if group does not exist
     *
     * @param {string} geometryGroupId - The id of the group
     * @returns {number | undefined} The z-index value of the vector layer
     * @throws {InvaliGeometryGroupIdError} If the provided geometry group id does not exist.
     */
    getGeometryGroupZIndex(geometryGroupId: string): number;
    /**
     * Set the z-index of a geometry group's vector layer
     *
     * @param {string} geometryGroupId - The id of the group
     * @param {number} zIndex - The z-index value to set
     * @throws {InvaliGeometryGroupIdError} If the provided geometry group id does not exist.
     */
    setGeometryGroupZIndex(geometryGroupId: string, zIndex: number): void;
    /**
     * Add a new geometry to the group whose identifier is equal to geometryGroupId.
     * if geometryGroupId is not provided, use the active geometry group. If the
     * geometry group doesn't exist, create it.
     *
     * @param {Feature} geometry - The geometry to be added to the group
     * @param {string} geometryGroupId - Optional id of the group to add the geometry to
     */
    addToGeometryGroup(geometry: Feature, geometryGroupId?: string): void;
    /**
     * Find the groups that the feature exists in and delete the feature from those groups
     *
     * @param {string} featureId - The geometry id
     */
    deleteGeometryFromGroups(featureId: string): void;
    /**
     * Delete a specific feature from a group using the feature id
     *
     * @param {string} featureId - The feature id to be deleted
     * @param {string} geometryGroupid - The group id
     * @throws {InvaliGeometryGroupIdError} If the provided geometry group id does not exist.
     */
    deleteGeometryFromGroup(featureId: string, geometryGroupid: string): void;
    /**
     * Delete all geometries from the geometry group but keep the group
     *
     * @param {string} geometryGroupid - The group id
     * @returns {FeatureCollection} Group with empty layers
     * @throws {InvaliGeometryGroupIdError} If the provided geometry group id does not exist.
     */
    deleteGeometriesFromGroup(geometryGroupid: string): FeatureCollection;
    /**
     * Delete a geometry group and all the geometries from the map.
     * The default geometry group can't be deleted.
     *
     * @param {string} geometryGroupid - The id of the geometry group to delete
     */
    deleteGeometryGroup(geometryGroupid: string): void;
    /**
     * Get the coordinates of a specific feature
     * @param {string} featureId - The id of the feature
     * @param {number} projection - Optional, transform the coordinates to the provided projection.
     *   Otherwise, uses the map's projection by default
     * @returns {Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][] | undefined} Coordinates of the feature
     */
    getFeatureCoords(featureId: string, projection?: number): Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][] | undefined;
    /**
     * Allows for a feature's coordinates to be updated programatically.
     * @param {string} featureId - The id of the feature to return
     * @param {Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][]} coordinates - The new coordinates for the feature
     * @param {number} projection - Optional, the projection of the coordinates, assumes 4326 if not specified
     */
    setFeatureCoords(featureId: string, coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][], projection?: number): void;
    /**
     * Creates a Geometry given a geometry type and coordinates expected in any logical format.
     * @param {TypeStyleGeometry} geometryType - The geometry type to create
     * @param {Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][]} coordinates - The coordinates to use to create the geometry
     * @returns The OpenLayers Geometry
     */
    static createGeometryFromType(geometryType: TypeStyleGeometry, coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][]): OLGeometry;
    /**
     * Typeguards when a list of coordinates should actually be a single coordinate, such as a Point.
     * @param {Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][]} coordinates - The coordinates to check
     * @returns {Coordinate} When the coordinates represent a Point
     */
    static isCoordinates(coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][]): coordinates is Coordinate;
    /**
     * Typeguards when a list of coordinates should actually be a single coordinate, such as a LineString.
     * @param {Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][]} coordinates - The coordinates to check
     * @returns {Coordinate[]} When the coordinates represent a LineString
     */
    static isArrayOfCoordinates(coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][]): coordinates is Coordinate[];
    /**
     * Typeguards when a list of coordinates should actually be a single coordinate, such as a MultiLineString or Polygon.
     * @param {Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][]} coordinates - The coordinates to check
     * @returns {Coordinate[][]} When the coordinates represent a MultiLineString or Polygon
     */
    static isArrayOfArrayOfCoordinates(coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][]): coordinates is Coordinate[][];
    /**
     * Typeguards when a list of coordinates should actually be a single coordinate, such as a MultiPolygon.
     * @param {Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][]} coordinates - The coordinates to check
     * @returns {Coordinate[][][]} when the coordinates represent a MultiPolygon
     */
    static isArrayOfArrayOfArrayOfCoordinates(coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][]): coordinates is Coordinate[][][];
}
/**
 * Define a delegate for the event handler function signature
 */
type GeometryAddedDelegate = EventDelegateBase<GeometryApi, GeometryAddedEvent, void>;
/**
 * Event interface for GeometryAdded
 */
export type GeometryAddedEvent<T extends OLGeometry = OLGeometry> = Feature<T>;
export {};
//# sourceMappingURL=geometry.d.ts.map