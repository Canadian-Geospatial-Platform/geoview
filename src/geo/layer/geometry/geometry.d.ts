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
 * Class used to manage vector geometries (Polyline, Polygon, Circle, Marker...).
 */
export declare class GeometryApi {
    #private;
    /** All added geometries */
    geometries: Feature[];
    /** The default geometry group name */
    defaultGeometryGroupId: string;
    /**
     * Constructs a Geometry class and creates a geometry group in the process.
     *
     * @param mapViewer - A reference to the map viewer
     */
    constructor(mapViewer: MapViewer);
    /**
     * Registers a geometry added event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onGeometryAdded(callback: GeometryAddedDelegate): void;
    /**
     * Unregisters a geometry added event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offGeometryAdded(callback: GeometryAddedDelegate): void;
    /**
     * Creates a polyline using an array of lon/lat points.
     *
     * @param points - The points of lon/lat to draw a polyline
     * @param options - Optional polyline options including styling
     * @param id - Optional id to be used to manage this geometry
     * @param groupId - Optional group id in which we want to add the geometry
     * @returns The created polyline feature
     */
    addPolyline(points: Coordinate, options?: {
        projection?: number;
        geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
        style?: TypeFeatureStyle;
    }, id?: string, groupId?: string): Feature;
    /**
     * Creates a new polygon.
     *
     * @param points - The array of points to create the polygon
     * @param options - Optional polygon options including styling
     * @param optionalFeatureId - Optional id to be used to manage this geometry
     * @param groupId - Optional group id in which we want to add the geometry
     * @returns The created polygon feature
     */
    addPolygon(points: number[] | Coordinate[][], options?: {
        projection?: number;
        geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
        style?: TypeFeatureStyle;
    }, optionalFeatureId?: string, groupId?: string): Feature;
    /**
     * Creates a new circle.
     *
     * @param coordinate - The lon/lat coordinate of the circle
     * @param options - Optional circle options including styling
     * @param optionalFeatureId - Optional id to be used to manage this geometry
     * @param groupId - Optional group id in which we want to add the geometry
     * @returns The created circle feature
     */
    addCircle(coordinate: Coordinate, options?: {
        projection?: number;
        geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
        style?: TypeFeatureCircleStyle;
    }, optionalFeatureId?: string, groupId?: string): Feature;
    /**
     * Creates a new marker icon.
     *
     * @param coordinate - The lon/lat position of the marker
     * @param options - Optional marker options including styling
     * @param optionalFeatureId - Optional id to be used to manage this geometry
     * @param groupId - Optional group id in which we want to add the geometry
     * @returns The created marker feature
     */
    addMarkerIcon(coordinate: Coordinate, options?: {
        projection?: number;
        geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
        style?: TypeIconStyle;
    }, optionalFeatureId?: string, groupId?: string): Feature;
    /**
     * Finds a feature using its id.
     *
     * @param featureId - The id of the feature to return
     * @returns The feature having the specified id
     */
    getGeometry(featureId: string): Feature;
    /**
     * Deletes a feature using the id and removes it from the groups and the map.
     *
     * @param featureId - The id of the feature to delete
     */
    deleteGeometry(featureId: string): void;
    /**
     * Creates a new geometry group to manage multiple geometries at once.
     *
     * The z-index is infinity by default, set the index to change the behaviour.
     *
     * @param geometryGroupId - The id of the group to use when managing this group
     * @param options - Optional vector layer and vector source options
     * @returns The created or existing geometry group
     */
    createGeometryGroup(geometryGroupId: string, options?: {
        vectorLayerOptions?: VectorLayerOptions<Feature, VectorSource>;
        vectorSourceOptions?: VectorSourceOptions<Feature>;
    }): FeatureCollection;
    /**
     * Sets the active geometry group (the geometry group used when adding geometries).
     *
     * If id is not specified, uses the default geometry group.
     *
     * @param id - Optional id of the group to set as active
     */
    setActiveGeometryGroup(id?: string): void;
    /**
     * Gets the active geometry group.
     *
     * @returns The active geometry group
     */
    getActiveGeometryGroup(): FeatureCollection;
    /**
     * Checks if a geometry group exists.
     *
     * @param geometryGroupId - The id of the geometry group to check
     * @returns True if the group exists, false otherwise
     */
    hasGeometryGroup(geometryGroupId: string): boolean;
    /**
     * Gets the geometry group by using the ID specified when the group was created.
     *
     * @param geometryGroupId - The id of the geometry group to return
     * @returns The geometry group
     * @throws {InvaliGeometryGroupIdError} When the provided geometry group id does not exist
     */
    getGeometryGroup(geometryGroupId: string): FeatureCollection;
    /**
     * Gets all geometry groups.
     *
     * @returns Array of all geometry groups
     */
    getGeometryGroups(): FeatureCollection[];
    /**
     * Finds the groups that contain the geometry using its id.
     *
     * @param featureId - The id of the geometry
     * @returns Groups that contain the geometry
     */
    getGeometryGroupsByFeatureId(featureId: string): FeatureCollection[];
    /**
     * Shows the identified geometry group on the map.
     *
     * @param geometryGroupId - The id of the group to show on the map
     * @throws {InvaliGeometryGroupIdError} When the provided geometry group id does not exist
     */
    setGeometryGroupAsVisible(geometryGroupId: string): void;
    /**
     * Hides the identified geometry group from the map.
     *
     * @param geometryGroupId - The id of the group to hide from the map
     * @throws {InvaliGeometryGroupIdError} When the provided geometry group id does not exist
     */
    setGeometryGroupAsInvisible(geometryGroupId: string): void;
    /**
     * Gets the z-index of a geometry group's vector layer.
     *
     * @param geometryGroupId - The id of the group
     * @returns The z-index value of the vector layer
     * @throws {InvaliGeometryGroupIdError} When the provided geometry group id does not exist
     */
    getGeometryGroupZIndex(geometryGroupId: string): number;
    /**
     * Sets the z-index of a geometry group's vector layer.
     *
     * @param geometryGroupId - The id of the group
     * @param zIndex - The z-index value to set
     * @throws {InvaliGeometryGroupIdError} When the provided geometry group id does not exist
     */
    setGeometryGroupZIndex(geometryGroupId: string, zIndex: number): void;
    /**
     * Adds a new geometry to the group whose identifier is equal to geometryGroupId.
     *
     * If geometryGroupId is not provided, uses the active geometry group. If the
     * geometry group doesn't exist, creates it.
     *
     * @param geometry - The geometry to be added to the group
     * @param geometryGroupId - Optional id of the group to add the geometry to
     */
    addToGeometryGroup(geometry: Feature, geometryGroupId?: string): void;
    /**
     * Finds the groups that the feature exists in and deletes the feature from those groups.
     *
     * @param featureId - The geometry id
     */
    deleteGeometryFromGroups(featureId: string): void;
    /**
     * Deletes a specific feature from a group using the feature id.
     *
     * @param featureId - The feature id to be deleted
     * @param geometryGroupid - The group id
     * @throws {InvaliGeometryGroupIdError} When the provided geometry group id does not exist
     */
    deleteGeometryFromGroup(featureId: string, geometryGroupid: string): void;
    /**
     * Deletes all geometries from the geometry group but keeps the group.
     *
     * @param geometryGroupid - The group id
     * @returns The group with empty layers
     * @throws {InvaliGeometryGroupIdError} When the provided geometry group id does not exist
     */
    deleteGeometriesFromGroup(geometryGroupid: string): FeatureCollection;
    /**
     * Deletes a geometry group and all the geometries from the map.
     *
     * The default geometry group can't be deleted.
     *
     * @param geometryGroupid - The id of the geometry group to delete
     */
    deleteGeometryGroup(geometryGroupid: string): void;
    /**
     * Gets the coordinates of a specific feature.
     *
     * @param featureId - The id of the feature
     * @param projection - Optional projection code to transform the coordinates to.
     *   Otherwise, uses the map's projection by default
     * @returns The coordinates of the feature, or undefined if not found
     */
    getFeatureCoords(featureId: string, projection?: number): Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][] | undefined;
    /**
     * Allows for a feature's coordinates to be updated programmatically.
     *
     * @param featureId - The id of the feature to update
     * @param coordinates - The new coordinates for the feature
     * @param projection - Optional projection code of the coordinates, assumes 4326 if not specified
     */
    setFeatureCoords(featureId: string, coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][], projection?: number): void;
    /**
     * Creates a Geometry given a geometry type and coordinates expected in any logical format.
     *
     * @param geometryType - The geometry type to create
     * @param coordinates - The coordinates to use to create the geometry
     * @returns The OpenLayers Geometry
     * @throws {NotSupportedError} When the geometry type is not supported
     */
    static createGeometryFromType(geometryType: TypeStyleGeometry, coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][]): OLGeometry;
    /**
     * Typeguards when a list of coordinates should actually be a single coordinate, such as a Point.
     *
     * @param coordinates - The coordinates to check
     * @returns True when the coordinates represent a Point
     */
    static isCoordinates(coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][]): coordinates is Coordinate;
    /**
     * Typeguards when a list of coordinates should actually be a single coordinate, such as a LineString.
     *
     * @param coordinates - The coordinates to check
     * @returns True when the coordinates represent a LineString
     */
    static isArrayOfCoordinates(coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][]): coordinates is Coordinate[];
    /**
     * Typeguards when a list of coordinates should actually be a single coordinate, such as a MultiLineString or Polygon.
     *
     * @param coordinates - The coordinates to check
     * @returns True when the coordinates represent a MultiLineString or Polygon
     */
    static isArrayOfArrayOfCoordinates(coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][]): coordinates is Coordinate[][];
    /**
     * Typeguards when a list of coordinates should actually be a single coordinate, such as a MultiPolygon.
     *
     * @param coordinates - The coordinates to check
     * @returns True when the coordinates represent a MultiPolygon
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