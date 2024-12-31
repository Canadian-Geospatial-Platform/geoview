import { Coordinate } from 'ol/coordinate';
import { Projection as olProjection, ProjectionLike } from 'ol/proj';
import { Extent } from 'ol/extent';
import { TypeJsonObject } from '@/core/types/global-types';
/**
 * Class used to handle functions for transforming projections
 *
 * @exports
 * @class Projection
 */
export declare abstract class Projection {
    /**
     * constant used for the available projection names
     */
    static PROJECTION_NAMES: {
        3578: string;
        LCC: string;
        3979: string;
        102100: string;
        102184: string;
        102190: string;
        WM: string;
        4269: string;
        LNGLAT: string;
        CRS84: string;
        CSRS: string;
        CSRS98: string;
    };
    static CUSTOM_WKT_NUM: number;
    static CUSTOM_WKT_AND_NUM: {
        [wkt_num: string]: string;
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
     * @param {TypeJsonObject | undefined} projection An object containing a wkid or wkt property.
     * @param {ProjectionLike} destination Destination projection-like.
     * @param {number} stops Optional number of stops per side used for the transform. By default only the corners are used.
     *
     * @returns The new extent transformed in the destination projection.
     */
    static transformExtentFromObj(extent: Extent, projection: TypeJsonObject | undefined, destination: ProjectionLike, stops?: number | undefined): Extent;
    /**
     * Transforms an extent from source projection to destination projection. This returns a new extent (and does not modify the
     * original).
     *
     * @param {Extent} extent The extent to transform.
     * @param {number} wkid An EPSG id number.
     * @param {ProjectionLike} destination Destination projection-like.
     * @param {number} stops Optional number of stops per side used for the transform. By default only the corners are used.
     *
     * @returns The new extent transformed in the destination projection.
     */
    static transformExtentFromWKID(extent: Extent, wkid: number, destination: ProjectionLike, stops?: number | undefined): Extent;
    /**
     * Transforms an extent from source projection to destination projection. This returns a new extent (and does not modify the
     * original).
     *
     * @param {Extent} extent The extent to transform.
     * @param {string} customWKT A custom WKT projection.
     * @param {ProjectionLike} destination Destination projection-like.
     * @param {number} stops Optional number of stops per side used for the transform. By default only the corners are used.
     *
     * @returns The new extent transformed in the destination projection.
     */
    static transformExtentFromWKT(extent: Extent, customWKT: string, destination: ProjectionLike, stops?: number | undefined): Extent;
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
    static transformExtentFromProj(extent: Extent, source: ProjectionLike, destination: ProjectionLike, stops?: number | undefined): Extent;
    /**
     * Convert points from one projection to another using proj4
     *
     * @param {Coordinate[]} points array of passed in points to convert
     * @param {string} fromProj projection to be converted from
     * @param {string} toProj projection to be converted to
     */
    static transformPoints(points: Coordinate[], fromProj: string, toProj: string): Array<Array<number>>;
    /**
     * Wrapper around OpenLayers function to transforms a coordinate from one projection to another.
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
     * @return {olProjection | undefined} — Projection object, or undefined if not in list.
     */
    static getProjectionFromObj(projection: TypeJsonObject | undefined): olProjection | undefined;
    /**
     * Wrapper around OpenLayers get function that fetches a Projection object for the code specified.
     *
     * @param {ProjectionLike} projectionLike Either a code string which is a combination of authority and identifier such as "EPSG:4326", or an existing projection object, or undefined.
     * @return {olProjection | undefined} — Projection object, or undefined if not in list.
     */
    static getProjectionFromWKT(customWKT: string): olProjection | undefined;
    /**
     * Wrapper around OpenLayers get function that fetches a Projection object for the code specified.
     *
     * @param {ProjectionLike} projectionLike Either a code string which is a combination of authority and identifier such as "EPSG:4326", or an existing projection object, or undefined.
     * @return {olProjection | undefined} — Projection object, or undefined if not in list.
     */
    static getProjectionFromProj(projectionLike: ProjectionLike): olProjection | undefined;
    /**
     * Get map point resolution
     *
     * @param {string} projection the projection code
     * @param {Coordinate} center map center
     * @returns the point resolution for map center
     */
    static getResolution(projection: string, center: Coordinate): number;
    /**
     * Reads an extent and verifies if it might be reversed (ymin,xmin,ymax,ymin) and when
     * so puts it back in order (xmin,ymin,xmax,ymax).
     * @param {string} projection The projection the extent is in
     * @param {Extent} extent The extent to check
     * @returns {Extent} The extent in order (xmin,ymin,xmax,ymax).
     */
    static readExtentCarefully(projection: string, extent: Extent): Extent;
}
