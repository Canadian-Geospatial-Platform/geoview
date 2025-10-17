import type { Coordinate } from 'ol/coordinate';
import type { Projection as OLProjection, ProjectionLike } from 'ol/proj';
import type { Extent } from 'ol/extent';
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
    static PROJECTION_NAMES: Record<string, string>;
    static CUSTOM_WKT_NUM: number;
    static CUSTOM_WKT_AND_NUM: {
        [wkt_num: string]: string;
    };
    /**
     * List of supported projections and their OpenLayers projection
     */
    static PROJECTIONS: Record<string, OLProjection>;
    /**
     * Transforms an extent from source projection to destination projection. This returns a new extent (and does not modify the
     * original).
     * @param {Extent} extent - The extent to transform.
     * @param {OLProjection} source - Source projection-like.
     * @param {OLProjection} destination - Destination projection-like.
     * @param {number} stops - Optional number of stops per side used for the transform. The default value is 25.
     *
     * @returns The densified extent transformed in the destination projection.
     */
    static transformAndDensifyExtent(extent: Extent, source: OLProjection, destination: OLProjection, stops?: number): Coordinate[];
    /**
     * Transforms an extent from source projection to destination projection. This returns a new extent (and does not modify the
     * original).
     *
     * @param {Extent} extent - The extent to transform.
     * @param {TypeProjection | undefined} projection - An object containing a wkid or wkt property.
     * @param {OLProjection} destination - Destination projection-like.
     * @param {number?} stops - Optional number of stops per side used for the transform. By default only the corners are used.
     *
     * @returns The new extent transformed in the destination projection.
     */
    static transformExtentFromObj(extent: Extent, projection: TypeProjection | undefined, destination: OLProjection, stops?: number | undefined): Extent;
    /**
     * Transforms an extent from source projection to destination projection. This returns a new extent (and does not modify the
     * original).
     *
     * @param {Extent} extent - The extent to transform.
     * @param {number} wkid - An EPSG id number.
     * @param {OLProjection} destination - Destination projection-like.
     * @param {number?} stops - Optional number of stops per side used for the transform. By default only the corners are used.
     *
     * @returns The new extent transformed in the destination projection.
     */
    static transformExtentFromWKID(extent: Extent, wkid: number, destination: OLProjection, stops?: number | undefined): Extent;
    /**
     * Transforms an extent from source projection to destination projection. This returns a new extent (and does not modify the
     * original).
     *
     * @param {Extent} extent - The extent to transform.
     * @param {string} customWKT - A custom WKT projection.
     * @param {OLProjection} destination - Destination projection-like.
     * @param {number?} stops - Optional number of stops per side used for the transform. By default only the corners are used.
     *
     * @returns The new extent transformed in the destination projection.
     */
    static transformExtentFromWKT(extent: Extent, customWKT: string, destination: OLProjection, stops?: number | undefined): Extent;
    /**
     * Transforms an extent from source projection to destination projection. This returns a new extent (and does not modify the
     * original).
     *
     * @param {Extent} extent - The extent to transform.
     * @param {OLProjection} source - Source projection-like.
     * @param {OLProjection} destination - Destination projection-like.
     * @param {number?} stops - Optional number of stops per side used for the transform. By default only the corners are used.
     *
     * @returns The new extent transformed in the destination projection.
     */
    static transformExtentFromProj(extent: Extent, source: OLProjection, destination: OLProjection, stops?: number | undefined): Extent;
    /**
     * Converts points from one projection to another using proj4
     * @param {Coordinate[]} points - Array of passed in points to convert
     * @param {string} fromProj - Projection to be converted from
     * @param {string} toProj - Projection to be converted to
     */
    static transformPoints(points: Coordinate[], fromProj: string, toProj: string): Array<Array<number>>;
    /**
     * Wrapper around OpenLayers function to transforms a coordinate from one projection to another.
     * @param {Coordinate} coordinate - Longitude/latitude coordinate
     * @param {OLProjection} inProjection - Actual projection of the coordinate
     * @param {OLProjection} outProjection - Desired projection of the coordinate
     * @return {Coordinate} Coordinate as projected
     */
    static transform(coordinate: Coordinate, inProjection: OLProjection, outProjection: OLProjection): Coordinate;
    /**
     * Wrapper around OpenLayers function to transforms a coordinate from longitude/latitude.
     * @param {Coordinate} coordinate - Longitude/latitude coordinate
     * @param {OLProjection} projection - Projection to project the coordinate
     * @return {Coordinate} Coordinate as projected
     */
    static transformFromLonLat(coordinate: Coordinate, projection: OLProjection): Coordinate;
    /**
     * Wrapper around OpenLayers function to transforms a coordinate to longitude/latitude.
     * @param {Coordinate} coordinate - Projected coordinate
     * @param {OLProjection} projection - Projection of the coordinate
     * @return {Coordinate} Coordinate as longitude and latitude, i.e. an array with longitude as 1st and latitude as 2nd element.
     */
    static transformToLonLat(coordinate: Coordinate, projection: OLProjection): Coordinate;
    /**
     * Function for converting a coordinate to a UTM Northing / Easting
     * @param {Coordinate} coordinate - The coordinate to be converted
     * @param {string} utmZone - The utm zone the return coordinates will be in
     * @returns {Coordinate} The returned coordinates in UTM Northing / Easting
     */
    static transformToUTMNorthingEasting(coordinate: Coordinate, utmZone: string): Coordinate;
    /**
     * Fetches definitions for unsupported projections and adds them.
     * @param {TypeProjection} projection - Object containing wkid and possibly latestWkid from service metadata.
     */
    static addProjection(projection: TypeProjection): Promise<void>;
    /**
     * Wrapper around OpenLayers get function that fetches a Projection object for the code specified.
     * @param {TypeProjection | undefined} projectionObj - A projection object with properties such as latestWkid, wkid, or wkt.
     * @return {OLProjection | undefined} — Projection object, or undefined if not in list.
     */
    static getProjectionFromObj(projectionObj: TypeProjection | undefined): OLProjection | undefined;
    /**
     * Wrapper around OpenLayers get function that fetches a Projection object for the code specified.
     * @param {string} customWKT - A code string which is a combination of authority and identifier such as "EPSG:4326".
     * @return {OLProjection | undefined} Projection object, or undefined if not in list.
     */
    static getProjectionFromWKT(customWKT: string): OLProjection;
    /**
     * Wrapper around OpenLayers get function that fetches a Projection object for the code specified.
     * @param {string} projection - A code string which is a combination of authority and identifier such as "EPSG:4326".
     * @return {OLProjection | undefined} Projection object, or undefined if not found.
     */
    static getProjectionFromString(projection: string | ProjectionLike): OLProjection;
    /**
     * Gets the projection representing a LonLat projection.
     * @return {OLProjection} Projection object representing LonLat.
     */
    static getProjectionLonLat(): OLProjection;
    /**
     * Get map point resolution
     * @param {string} projection - The projection code
     * @param {Coordinate} center - Map center
     * @returns The point resolution for map center
     */
    static getResolution(projection: string, center: Coordinate): number;
    /**
     * Reads an extent and verifies if it might be reversed (ymin,xmin,ymax,ymin) and when
     * so puts it back in order (xmin,ymin,xmax,ymax).
     * @param {string} projection - The projection the extent is in
     * @param {Extent} extent - The extent to check
     * @returns {Extent} The extent in order (xmin,ymin,xmax,ymax).
     */
    static readExtentCarefully(projection: string, extent: Extent): Extent;
    /**
     * Transform coordinates between two projections
     * @param {Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][] | undefined} coordinates - The coordinates to transform
     * @param {string} startProjection - The current projection of the coordinates.
     *   Note: the value should include 'EPSG:' then the projection  number.
     * @param {string} endProjection - The transformed projection of the coordinates.
     *   Note: the value should include 'EPSG:' then the projection  number.
     * @returns {Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][] | undefined} The transformed coordinates
     */
    static transformCoordinates(coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][] | undefined, startProjection: string, endProjection: string): Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][] | undefined;
}
/**
 * A Type to represent a Projection in JSON.
 */
export type TypeProjection = {
    wkid: number;
    latestWkid?: number;
    wkt?: string;
};
//# sourceMappingURL=projection.d.ts.map