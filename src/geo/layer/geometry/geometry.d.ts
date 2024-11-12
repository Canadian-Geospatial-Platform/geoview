import VectorLayer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import VectorSource, { Options as VectorSourceOptions } from 'ol/source/Vector';
import { Geometry as OLGeometry } from 'ol/geom';
import { Coordinate } from 'ol/coordinate';
import { Options as VectorLayerOptions } from 'ol/layer/BaseVector';
import { MapViewer } from '@/geo/map/map-viewer';
import { EventDelegateBase } from '@/api/events/event-helper';
import { TypeStyleGeometry } from '@/geo/map/map-schema-types';
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
export declare class GeometryApi {
    #private;
    geometryGroups: FeatureCollection[];
    geometries: Feature[];
    defaultGeometryGroupId: string;
    activeGeometryGroupIndex: number;
    /** used to reference the map viewer */
    mapViewer: MapViewer;
    /**
     * Constructs a Geometry class and creates a geometry group in the process.
     * @param {MapViewer} mapViewer a reference to the map viewer
     */
    constructor(mapViewer: MapViewer);
    /**
     * Registers a geometry added event handler.
     * @param {GeometryAddedDelegate} callback The callback to be executed whenever the event is emitted
     */
    onGeometryAdded(callback: GeometryAddedDelegate): void;
    /**
     * Unregisters a geometry added event handler.
     * @param {GeometryAddedDelegate} callback The callback to stop being called whenever the event is emitted
     */
    offGeometryAdded(callback: GeometryAddedDelegate): void;
    /**
     * Create a polyline using an array of lng/lat points
     *
     * @param {Coordinate} points points of lng/lat to draw a polyline
     * @param options polyline options including styling
     * @param {string} id an optional id to be used to manage this geometry
     * @param {string} groupId an optional group id in witch we want to add the geometry
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
     * @param {Coordinate} points array of points to create the polygon
     * @param options polygon options including styling
     * @param {string} optionalFeatureId an optional id to be used to manage this geometry
     * @param {string} groupId an optional group id in witch we want to add the geometry
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
     * @param {Coordinate} coordinate long lat coordinate of the circle
     * @param options circle options including styling
     * @param {string} optionalFeatureId an optional id to be used to manage this geometry
     * @param {string} groupId an optional group id in witch we want to add the geometry
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
     * @param {Coordinate} coordinate the long lat position of the marker
     * @param options marker options including styling
     * @param {string} optionalFeatureId an optional id to be used to manage this geometry
     * @param {string} groupId an optional group id in witch we want to add the geometry
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
     * @param {string} featureId the id of the feature to return
     *
     * @returns {Feature} a feature having the specified id
     */
    getGeometry(featureId: string): Feature;
    /**
     * Delete a feature using the id and delete it from the groups and the map
     *
     * @param {string} featureId the id of the feature to delete
     */
    deleteGeometry(featureId: string): void;
    /**
     * Create a new geometry group to manage multiple geometries at once
     *
     * @param {string} geometryGroupId the id of the group to use when managing this group
     * @param options an optional vector layer and vector source options
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
     * @param {string} id optional the id of the group to set as active
     */
    setActiveGeometryGroup(id?: string): void;
    /**
     * Get the active geometry group
     *
     * @returns {FeatureCollection} the active geometry group
     */
    getActiveGeometryGroup(): FeatureCollection;
    /**
     * Get the geometry group by using the ID specified when the group was created
     * if geometryGroupid is not provided, return the active geometry group
     *
     * @param {string} geometryGroupId the id of the geometry group to return
     *
     * @returns the geomtry group
     */
    getGeometryGroup(geometryGroupId?: string): FeatureCollection | undefined;
    /**
     * Find the groups that contain the geometry using it's id
     *
     * @param {string} featureId the id of the geometry
     *
     * @returns {FeatureCollection[]} the groups that contain the geometry
     */
    getGeometryGroupsByFeatureId(featureId: string): FeatureCollection[];
    /**
     * Show the identified geometry group on the map
     * if geometryGroupId is not provided, use the active geometry group
     *
     * @param {string} geometryGroupId optional the id of the group to show on the map
     */
    setGeometryGroupAsVisible(geometryGroupId?: string): void;
    /**
     * hide the identified geometry group from the map
     * if groupId is not provided, use the active geometry group
     *
     * @param {string} geometryGroupId optional the id of the group to show on the map
     */
    setGeometryGroupAsInvisible(geometryGroupId?: string): void;
    /**
     * Add a new geometry to the group whose identifier is equal to geometryGroupId.
     * if geometryGroupId is not provided, use the active geometry group. If the
     * geometry group doesn't exist, create it.
     *
     * @param {Feature} geometry the geometry to be added to the group
     * @param {string} geometryGroupId optional id of the group to add the geometry to
     */
    addToGeometryGroup(geometry: Feature, geometryGroupId?: string): void;
    /**
     * Find the groups that the feature exists in and delete the feature from those groups
     *
     * @param {string} featureId the geometry id
     */
    deleteGeometryFromGroups(featureId: string): void;
    /**
     * Delete a specific feature from a group using the feature id
     * If geometryGroupid is not provided, the active geometry group is used.
     *
     * @param {string} featureId the feature id to be deleted
     * @param {string} geometryGroupid optional group id
     */
    deleteGeometryFromGroup(featureId: string, geometryGroupid?: string): void;
    /**
     * Delete all geometries from the geometry group but keep the group
     * If geometryGroupid is not provided, the active geometry group is used.
     *
     * @param {string} geometryGroupid optional group id
     * @returns {FeatureCollection} the group with empty layers
     */
    deleteGeometriesFromGroup(geometryGroupid?: string): FeatureCollection;
    /**
     * Delete a geometry group and all the geometries from the map.
     * If geometryGroupid is not provided, the active geometry group is used.
     * The default geometry group can't be deleted.
     *
     * @param {string} geometryGroupid optional id of the geometry group to delete
     */
    deleteGeometryGroup(geometryGroupid?: string): void;
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
     * @returns {Coordinate} when the coordinates represent a Point
     */
    static isCoordinates(coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][]): coordinates is Coordinate;
    /**
     * Typeguards when a list of coordinates should actually be a single coordinate, such as a LineString.
     * @param {Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][]} coordinates - The coordinates to check
     * @returns {Coordinate[]} when the coordinates represent a LineString
     */
    static isArrayOfCoordinates(coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][]): coordinates is Coordinate[];
    /**
     * Typeguards when a list of coordinates should actually be a single coordinate, such as a MultiLineString or Polygon.
     * @param {Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][]} coordinates - The coordinates to check
     * @returns {Coordinate[][]} when the coordinates represent a MultiLineString or Polygon
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
