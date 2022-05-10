import L, { LatLngExpression } from 'leaflet';
/**
 * Class used to manage vector geometries (Polyline, Polygon, Circle, Marker...)
 *
 * @export
 * @class Vector
 */
export declare class Vector {
    #private;
    geometryGroups: L.FeatureGroup[];
    geometries: L.Layer[];
    defaultGeometryGroupId: string;
    activeGeometryGroupIndex: number;
    /**
     * Initialize map, vectors, and listen to add vector events
     *
     * @param {string} mapId leaflet map id
     */
    constructor(mapId: string);
    /**
     * Create a polyline using an array of lat/lng points
     *
     * @param {LatLngExpression[] | LatLngExpression[][]} points points of lat/lng to draw a polyline
     * @param options polyline options including styling
     * @param {string} id an optional id to be used to manage this geometry
     *
     * @returns a geometry containing the id and the created geometry
     */
    addPolyline: (points: LatLngExpression[] | LatLngExpression[][], options: L.PolylineOptions, id?: string | undefined) => L.Polyline;
    /**
     * Create a new polygon
     *
     * @param {LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][]} points array of points to create the polygon
     * @param {L.PolylineOptions} options polygon options including styling
     * @param {string} id an optional id to be used to manage this geometry
     *
     * @returns a geometry containing the id and the created geometry
     */
    addPolygon: (points: LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][], options: L.PolylineOptions, id?: string | undefined) => L.Polygon;
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
    addCircle: (latitude: number, longitude: number, options: L.CircleMarkerOptions, id?: string | undefined) => L.Circle;
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
    addCircleMarker: (latitude: number, longitude: number, options: L.CircleMarkerOptions, id?: string | undefined) => L.CircleMarker;
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
    addMarker: (latitude: number, longitude: number, options: L.MarkerOptions, id?: string | undefined) => L.Marker;
    /**
     * Find a geometry using it's id
     *
     * @param {string} id the id of the geometry to return
     *
     * @returns {L.Layer} a geometry having the specified id
     */
    getGeometry: (id: string) => L.Layer;
    /**
     * Delete a geometry using the id and delete it from the groups and the map
     *
     * @param {string} id the id of the geometry to delete
     */
    deleteGeometry: (id: string) => void;
    /**
     * Create a new geometry group to manage multiple geometries at once
     *
     * @param {string} geometryGroupid the id of the group to use when managing this group
     */
    createGeometryGroup: (geometryGroupid: string, options?: L.FeatureGroupOptions | undefined) => L.FeatureGroup;
    /**
     * set the active geometry group (the geometry group used when adding geometries).
     * If id is not specified, use the default geometry group.
     *
     * @param {string} id optional the id of the group to set as active
     */
    setActiveGeometryGroup: (id?: string | undefined) => void;
    /**
     * Get the active geometry group
     *
     * @returns {L.FeatureGroup} the active geometry group
     */
    getActiveGeometryGroup: () => L.FeatureGroup;
    /**
     * Get the geometry group by using the ID specified when the group was created
     * if geometryGroupid is not provided, return the active geometry group
     *
     * @param {string} geometryGroupId the id of the geometry group to return
     *
     * @returns the geomtry group
     */
    getGeometryGroup: (geometryGroupId?: string | undefined) => L.FeatureGroup;
    /**
     * Find the groups that contain the geometry using it's id
     *
     * @param {string} id the id of the geometry
     *
     * @returns {FeatureGroup | null} the groups that contain the geometry
     *                                or null if not found
     */
    getGeometryGroupsByGeometryId: (id: string) => L.FeatureGroup[];
    /**
     * Show the identified geometry group on the map
     * if geometryGroupId is not provided, use the active geometry group
     *
     * @param {string} geometryGroupId optional the id of the group to show on the map
     */
    setGeometryGroupAsVisible: (geometryGroupId?: string | undefined) => void;
    /**
     * hide the identified geometry group from the map
     * if groupId is not provided, use the active geometry group
     *
     * @param {string} geometryGroupId optional the id of the group to show on the map
     */
    setGeometryGroupAsInvisible: (geometryGroupId?: string | undefined) => void;
    /**
     * Turn on the geometry groups that are flaged as visible. The visible flag and options
     * remain unchanged, this allow us to turn on and off the geometry groups to temporarily
     * hide them.
     */
    turnOnGeometryGroups: () => void;
    /**
     * Turn off the geometry groups that are flaged as visible. The visible flag and options
     * remain unchanged, this allow us to turn on and off the geometry groups to temporarily
     * hide them.
     */
    turnOffGeometryGroups: () => void;
    /**
     * Add a new geometry to the group whose identifier is equal to geometryGroupId.
     * if geometryGroupId is not provided, use the active geometry group. If the
     * geometry group doesn't exist, create it.
     *
     * @param {L.Layer} geometry the geometry to be added to the group
     * @param {string} geometryGroupId optional id of the group to add the geometry to
     */
    addToGeometryGroup: (geometry: L.Layer, geometryGroupId?: string | undefined) => void;
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
    deleteGeometryFromGroup: (geometryId: string, geometryGroupid?: string | undefined) => void;
    /**
     * Delete all geometries from the geometry group but keep the group
     * If geometryGroupid is not provided, the active geometry group is used.
     *
     * @param {string} geometryGroupid optional group id
     */
    deleteGeometriesFromGroup: (geometryGroupid?: string | undefined) => L.FeatureGroup;
    /**
     * Delete a geometry group and all the geometries from the map.
     * If geometryGroupid is not provided, the active geometry group is used.
     * The default geometry group can't be deleted.
     *
     * @param {string} geometryGroupid optional id of the geometry group to delete
     */
    deleteGeometryGroup: (geometryGroupid?: string | undefined) => void;
}
