import type { Coordinate } from 'ol/coordinate';
import type { Projection as OLProjection, ProjectionLike } from 'ol/proj';
import type { Extent } from 'ol/extent';
/**
 * Class used to handle functions for transforming projections.
 */
export declare abstract class Projection {
    #private;
    /** Constant used for the available projection names */
    static PROJECTION_NAMES: Record<string, string>;
    /** Incremental number when creating custom WKTs on the fly */
    static CUSTOM_WKT_NUM: number;
    /** Holding all custom generated wkt */
    static CUSTOM_WKT_AND_NUM: {
        [wkt_num: string]: string;
    };
    /** List of supported projections and their OpenLayers projection */
    static PROJECTIONS: Record<string, OLProjection>;
    /**
     * Transforms an extent from source projection to destination projection.
     *
     * This returns a new extent (and does not modify the original).
     *
     * @param extent - The extent to transform
     * @param source - Source projection-like
     * @param destination - Destination projection-like
     * @param stops - Optional number of stops per side used for the transform. The default value is 25
     * @returns The densified extent transformed in the destination projection
     */
    static transformAndDensifyExtent(extent: Extent, source: OLProjection, destination: OLProjection, stops?: number): Coordinate[];
    /**
     * Transforms an extent from source projection to destination projection.
     *
     * This returns a new extent (and does not modify the original).
     *
     * @param extent - The extent to transform
     * @param projection - An object containing a wkid or wkt property
     * @param destination - Destination projection-like
     * @param stops - Optional number of stops per side used for the transform. By default only the corners are used
     * @returns The new extent transformed in the destination projection
     */
    static transformExtentFromObj(extent: Extent, projection: TypeProjection | undefined, destination: OLProjection, stops?: number | undefined): Extent;
    /**
     * Transforms an extent from source projection to destination projection.
     *
     * This returns a new extent (and does not modify the original).
     *
     * @param extent - The extent to transform
     * @param wkid - An EPSG id number
     * @param destination - Destination projection-like
     * @param stops - Optional number of stops per side used for the transform. By default only the corners are used
     * @returns The new extent transformed in the destination projection
     */
    static transformExtentFromWKID(extent: Extent, wkid: number, destination: OLProjection, stops?: number | undefined): Extent;
    /**
     * Transforms an extent from source projection to destination projection.
     *
     * This returns a new extent (and does not modify the original).
     *
     * @param extent - The extent to transform
     * @param customWKT - A custom WKT projection
     * @param destination - Destination projection-like
     * @param stops - Optional number of stops per side used for the transform. By default only the corners are used
     * @returns The new extent transformed in the destination projection
     */
    static transformExtentFromWKT(extent: Extent, customWKT: string, destination: OLProjection, stops?: number | undefined): Extent;
    /**
     * Transforms an extent from source projection to destination projection.
     *
     * This returns a new extent (and does not modify the original).
     *
     * @param extent - The extent to transform
     * @param source - Source projection-like
     * @param destination - Destination projection-like
     * @param stops - Optional number of stops per side used for the transform. By default only the corners are used
     * @returns The new extent transformed in the destination projection
     */
    static transformExtentFromProj(extent: Extent, source: OLProjection, destination: OLProjection, stops?: number | undefined): Extent;
    /**
     * Converts points from one projection to another using proj4.
     *
     * @param points - Array of passed in points to convert
     * @param fromProj - Projection to be converted from
     * @param toProj - Projection to be converted to
     * @returns The converted points array
     */
    static transformPoints(points: Coordinate[], fromProj: string, toProj: string): Array<Array<number>>;
    /**
     * Wrapper around OpenLayers function to transforms a coordinate from one projection to another.
     *
     * @param coordinate - Longitude/latitude coordinate
     * @param inProjection - Actual projection of the coordinate
     * @param outProjection - Desired projection of the coordinate
     * @returns Coordinate as projected
     */
    static transform(coordinate: Coordinate, inProjection: OLProjection, outProjection: OLProjection): Coordinate;
    /**
     * Wrapper around OpenLayers function to transforms a coordinate from longitude/latitude.
     *
     * @param coordinate - Longitude/latitude coordinate
     * @param projection - Projection to project the coordinate
     * @returns Coordinate as projected
     */
    static transformFromLonLat(coordinate: Coordinate, projection: OLProjection): Coordinate;
    /**
     * Wrapper around OpenLayers function to transforms a coordinate to longitude/latitude.
     *
     * @param coordinate - Projected coordinate
     * @param projection - Projection of the coordinate
     * @returns Coordinate as longitude and latitude, i.e. an array with longitude as 1st and latitude as 2nd element
     */
    static transformToLonLat(coordinate: Coordinate, projection: OLProjection): Coordinate;
    /**
     * Function for converting a coordinate to a UTM Northing / Easting.
     *
     * @param coordinate - The coordinate to be converted
     * @param utmZone - The utm zone the return coordinates will be in
     * @returns The returned coordinates in UTM Northing / Easting
     */
    static transformToUTMNorthingEasting(coordinate: Coordinate, utmZone: string): Coordinate;
    /**
     * Fetches definitions for unsupported projections and adds them.
     *
     * @param projection - Object containing wkid and possibly latestWkid from service metadata
     * @returns A promise that resolves when the projection is added
     */
    static addProjection(projection: TypeProjection): Promise<void>;
    /**
     * Fetches definitions for unsupported projections and adds them.
     *
     * @param code - Projection code number
     * @returns A promise that resolves when the projection is added
     */
    static addProjectionCode(code: number): Promise<void>;
    /**
     * Checks if a projection exists for GeoView and if not it adds it on-the-fly using the provided projection string information.
     *
     * @param projection - The projection string to check if existing and to add when not existing
     * @returns A promise that resolves when the projection is added if missing
     */
    static addProjectionIfMissing(projection: TypeProjection | ProjectionLike | undefined): Promise<void>;
    /**
     * Wrapper around OpenLayers get function that fetches a Projection object for the code specified.
     *
     * @param projectionObj - A projection object with properties such as latestWkid, wkid, or wkt
     * @returns Projection object, or undefined if not in list
     */
    static getProjectionFromObj(projectionObj: TypeProjection | undefined): OLProjection | undefined;
    /**
     * Wrapper around OpenLayers get function that fetches a Projection object for the code specified.
     *
     * @param customWKT - A code string which is a combination of authority and identifier such as "EPSG:4326"
     * @returns Projection object, or undefined if not in list
     */
    static getProjectionFromWKT(customWKT: string): OLProjection;
    /**
     * Wrapper around OpenLayers get function that fetches a Projection object for the code specified.
     *
     * @param projection - A code string which is a combination of authority and identifier such as "EPSG:4326"
     * @returns Projection object, or undefined if not found
     */
    static getProjectionFromString(projection: ProjectionLike): OLProjection;
    /**
     * Gets the projection representing a LonLat projection.
     *
     * @returns Projection object representing LonLat
     */
    static getProjectionLonLat(): OLProjection;
    /**
     * Get map point resolution.
     *
     * @param projection - The projection code
     * @param center - Map center
     * @returns The point resolution for map center
     */
    static getResolution(projection: string, center: Coordinate): number;
    /**
     * Reads the numeric EPSG code from a projection string.
     *
     * Supports case-insensitive formats such as:
     * - `"EPSG:4326"`
     * - `"epsg:3857"`
     * - `"EpSg: 1234"`
     * The function trims whitespace and validates that the string matches a proper
     * `EPSG:<number>` pattern. Returns `undefined` if the format is invalid or the
     * numeric part is not a valid number.
     *
     * @param projection - The projection like identifier containing the EPSG code
     * @returns The extracted EPSG numeric code, or `undefined` if invalid
     */
    static readEPSGNumber(projection: ProjectionLike): number | undefined;
    /**
     * Reads an extent and verifies if it might be reversed (ymin,xmin,ymax,ymin) and when
     * so puts it back in order (xmin,ymin,xmax,ymax).
     *
     * @param projection - The projection the extent is in
     * @param extent - The extent to check
     * @returns The extent in order (xmin,ymin,xmax,ymax)
     */
    static readExtentCarefully(projection: string, extent: Extent): Extent;
    /**
     * Transform coordinates between two projections.
     *
     * @param coordinates - The coordinates to transform
     * @param startProjection - The current projection of the coordinates.
     *   Note: the value should include 'EPSG:' then the projection  number.
     * @param endProjection - The transformed projection of the coordinates.
     *   Note: the value should include 'EPSG:' then the projection  number.
     * @returns The transformed coordinates
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