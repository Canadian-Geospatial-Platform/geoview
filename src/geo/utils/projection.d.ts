import { Coordinate } from 'ol/coordinate';
import { Projection as olProjection, ProjectionLike } from 'ol/proj';
import { Extent } from 'ol/extent';
/**
 * Class used to handle functions for trasforming projections
 *
 * @exports
 * @class Projection
 */
export declare abstract class Projection {
    /**
     * constant for the CRS84 URL
     */
    static CRS_84_URL: string;
    /**
     * constant used for the available projection names
     */
    static PROJECTION_NAMES: {
        LCC: string;
        WM: string;
        LNGLAT: string;
        CSRS: string;
        CSRS98: string;
    };
    /**
     * List of supported projections and their OpenLayers projection
     */
    static PROJECTIONS: Record<string, olProjection>;
    /**
     * Transforms an extent from source projection to destination projection. This returns a new extent (and does not modify the
     * original).
     *
     * @param {Extent} extent The extent to transform.
     * @param {ProjectionLike} source Source projection-like.
     * @param {ProjectionLike} destination Destination projection-like.
     * @param {number} stops Optional number of stops per side used for the transform. The default value is 20.
     *
     * @returns The densified extent transformed in the destination projection.
     */
    static transformAndDensifyExtent(extent: Extent, source: ProjectionLike, destination: ProjectionLike, stops?: number): Coordinate[];
    /**
     * Transforms an extent from source projection to destination projection. This returns a new extent (and does not modify the
     * original).
     *
     * @param {Extent} extent The extent to transform.
     * @param {ProjectionLike} source Source projection-like.
     * @param {ProjectionLike} destination Destination projection-like.
     * @param {number} stops Optional number of stops per side used for the transform. By default only the corners are used.
     *
     * @returns The new extent transformed in the destination projection.
     */
    static transformExtent(extent: Extent, source: ProjectionLike, destination: ProjectionLike, stops?: number | undefined): Extent;
    /**
     * Convert points from one projection to another using proj4
     *
     * @param {Coordinate[]} points array of passed in points to convert
     * @param {string} fromProj projection to be converted from
     * @param {string} toProj projection to be converted to
     */
    static transformPoints(points: Coordinate[], fromProj: string, toProj: string): Array<Array<number>>;
    /**
     * Wrapper around OpenLayers function to transforms a coordinate from lone projection to another.
     *
     * @param {Coordinate} coordinate Longitude/latitude coordinate
     * @param {ProjectionLike} inProjection Actual projection of the coordinate
     * @param {ProjectionLike} outProjection Desired projection of the coordinate
     * @return {Coordinate}  Coordinate as projected
     */
    static transform(coordinate: Coordinate, inProjection: ProjectionLike, outProjection: ProjectionLike): Coordinate;
    /**
     * Wrapper around OpenLayers function to transforms a coordinate from longitude/latitude.
     *
     * @param {Coordinate} coordinate Longitude/latitude coordinate
     * @param {ProjectionLike} projection Projection to project the coordinate
     * @return {Coordinate}  Coordinate as projected
     */
    static transformFromLonLat(coordinate: Coordinate, projection: ProjectionLike): Coordinate;
    /**
     * Wrapper around OpenLayers function to transforms a coordinate to longitude/latitude.
     *
     * @param {Coordinate} coordinate Projected coordinate
     * @param {ProjectionLike} projection Projection of the coordinate
     * @return {Coordinate}  Coordinate as longitude and latitude, i.e. an array with longitude as 1st and latitude as 2nd element.
     */
    static transformToLonLat(coordinate: Coordinate, projection: ProjectionLike): Coordinate;
    /**
     * Wrapper around OpenLayers get function that fetches a Projection object for the code specified.
     *
     * @param {ProjectionLike} projectionLike Either a code string which is a combination of authority and identifier such as "EPSG:4326", or an existing projection object, or undefined.
     * @return {olProjection | null} — Projection object, or null if not in list.
     */
    static getProjection(projectionLike: ProjectionLike): olProjection | null;
    /**
     * Get map point resolution
     *
     * @param {string} projection the projection code
     * @param {Coordinate} center map center
     * @returns the point resolution for map center
     */
    static getResolution(projection: string, center: Coordinate): number;
}
