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
    static addProjection(projection: TypeProjection): Promise<OLProjection>;
    /**
     * Fetches definitions for unsupported projections and adds them.
     *
     * @param code - Projection code number
     * @returns A promise that resolves when the projection is added
     */
    static addProjectionCode(code: number): Promise<OLProjection>;
    /**
     * Checks if a projection exists for GeoView and if not it adds it on-the-fly by fetching its definition from epsg.io.
     *
     * Accepts:
     * - A `TypeProjection` object (with `wkid` / `latestWkid` / `wkt`)
     * - A `ProjectionLike` string (e.g., `"EPSG:4326"`, CRS URI/URN, or an OLProjection instance)
     * - A numeric EPSG code (e.g., `4326`)
     *
     * @param projection - The projection identifier to check and register if missing
     * @returns A promise that resolves with the OLProjection
     */
    static addProjectionIfMissing(projection: TypeProjection | ProjectionLike | number): Promise<OLProjection>;
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
     * Extracts the projection name from a WKT string.
     *
     * Parses the first quoted string after the opening keyword (e.g., `PROJCS["NAD83 / BC Albers", ...]`
     * returns `"NAD83 / BC Albers"`).
     *
     * @param wkt - The WKT projection definition string
     * @returns The extracted projection name, or undefined if not found
     */
    static readProjectionNameFromWKT(wkt: string): string | undefined;
    /**
     * Resolves a projection from various input formats to an OpenLayers Projection object.
     *
     * Supports:
     * - Authority:code strings (e.g., `"EPSG:4326"`, `"CRS:84"`)
     * - Numeric EPSG codes (e.g., `4326`, `3857`)
     * - Numeric strings (e.g., `"4326"`, `"3857"`)
     * - OGC CRS URIs (e.g., `"http://www.opengis.net/def/crs/EPSG/0/4326"`)
     * - OGC URNs (e.g., `"urn:ogc:def:crs:EPSG::4326"`)
     * - Existing OLProjection objects (pass-through)
     *
     * @param projection - A projection identifier (string, number, or OLProjection)
     * @returns The resolved OpenLayers Projection object
     * @throws {InvalidProjectionError} When the projection cannot be resolved
     */
    static getProjectionFromStringOrNumber(projection: ProjectionLike | number): OLProjection;
    /**
     * Resolves an OGC CRS URI or standard code string to an OpenLayers projection.
     *
     * Supports formats:
     * - `http://www.opengis.net/def/crs/EPSG/0/4326` → `EPSG:4326`
     * - `http://www.opengis.net/def/crs/OGC/1.3/CRS84` → `CRS:84`
     * - `urn:ogc:def:crs:EPSG::4326` → `EPSG:4326`
     * - `EPSG:4326` (pass-through)
     *
     * @param crs - The CRS string (URI, URN, or authority:code)
     * @returns The resolved OpenLayers projection, or undefined if unrecognized
     */
    static getProjectionFromCRS(crs: string): OLProjection | undefined;
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
     * Reads the numeric EPSG code from a projection identifier.
     *
     * Supports:
     * - Numeric input (e.g., `4326`) — returned immediately
     * - Case-insensitive `"EPSG:4326"`, `"epsg:3857"`, `"EpSg: 1234"` strings
     * - OLProjection objects (extracts the code via `getCode()`)
     *
     * The function trims whitespace and validates that the string matches a proper
     * `EPSG:<number>` pattern. Returns `undefined` if the format is invalid or the
     * numeric part is not a valid number.
     *
     * @param projection - The projection identifier containing the EPSG code (string, number, or OLProjection)
     * @returns The extracted EPSG numeric code, or `undefined` if invalid
     */
    static readEPSGNumber(projection: ProjectionLike | number): number | undefined;
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
    wkid?: number;
    latestWkid?: number;
    wkt?: string;
};
//# sourceMappingURL=projection.d.ts.map