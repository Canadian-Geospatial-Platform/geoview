import proj4 from 'proj4';
import type { Coordinate } from 'ol/coordinate';
import { register } from 'ol/proj/proj4';
import type { Projection as OLProjection, ProjectionLike } from 'ol/proj';
import {
  get as OLGetProjection,
  getPointResolution,
  transform as olTransform,
  transformExtent as olTransformExtent,
  fromLonLat,
  toLonLat,
} from 'ol/proj';
import type { Extent } from 'ol/extent';

import { GeometryApi } from '@/geo/layer/geometry/geometry';
import { logger } from '@/core/utils/logger';
import { Fetch } from '@/core/utils/fetch-helper';
import { InvalidProjectionError } from '@/core/exceptions/geoview-exceptions';
import { NotSupportedError } from '@/core/exceptions/core-exceptions';

/**
 * Class used to handle functions for transforming projections.
 */
export abstract class Projection {
  /** Constant used for the available projection names */
  static PROJECTION_NAMES: Record<string, string> = {
    3578: 'EPSG:3578',
    3573: 'EPSG:3573',
    LCC: 'EPSG:3978',
    3979: 'EPSG:3979',
    42101: 'EPSG:42101',
    102001: 'EPSG:102001', // GV The official name of this projection is ESRI:102001 (not EPSG:102001). However, for the purpose of simplification in GeoView code base, we name it with EPSG prefix.
    102100: 'EPSG:102100', // GV The official name of this projection is ESRI:102100 (not EPSG:102100). However, for the purpose of simplification in GeoView code base, we name it with EPSG prefix.
    102184: 'EPSG:102184', // GV The official name of this projection is ESRI:102184 (not EPSG:102184). However, for the purpose of simplification in GeoView code base, we name it with EPSG prefix.
    102190: 'EPSG:102190', // GV The official name of this projection is ESRI:102190 (not EPSG:102190). However, for the purpose of simplification in GeoView code base, we name it with EPSG prefix.
    WM: 'EPSG:3857',
    3857: 'EPSG:3857',
    4269: 'EPSG:4269',
    LONLAT: 'EPSG:4326',
    CRS84: 'CRS:84', // Supporting CRS:84 which is equivalent to 4326 except it's long-lat, whereas the 4326 standard is lat-long.
    CSRS: 'EPSG:4617',
    CSRS98: 'EPSG:4140',
    2151: 'EPSG:2151',
    2957: 'EPSG:2957',
    3005: 'EPSG:3005', // BC Albers
    3400: 'EPSG:3400',
    26914: 'EPSG:26914',
  };

  /** Incremental number when creating custom WKTs on the fly */
  static CUSTOM_WKT_NUM = 1001;

  /** Holding all custom generated wkt */
  static CUSTOM_WKT_AND_NUM: { [wkt_num: string]: string } = {};

  /** List of supported projections and their OpenLayers projection */
  static PROJECTIONS: Record<string, OLProjection> = {};

  /** In-flight projection addition promises to prevent duplicate fetches for the same code. */
  static #pendingAdditions: Map<string, Promise<OLProjection>> = new Map();

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
  static transformAndDensifyExtent(extent: Extent, source: OLProjection, destination: OLProjection, stops = 25): Coordinate[] {
    const coordinates: number[][] = [];
    const width: number = extent[2] - extent[0];
    const height: number = extent[3] - extent[1];
    for (let i = 0; i < stops; ++i) coordinates.push([extent[0] + (width * i) / stops, extent[1]]);
    for (let i = 0; i < stops; ++i) coordinates.push([extent[2], extent[1] + (height * i) / stops]);
    for (let i = 0; i < stops; ++i) coordinates.push([extent[2] - (width * i) / stops, extent[3]]);
    for (let i = 0; i < stops; ++i) coordinates.push([extent[0], extent[3] - (height * i) / stops]);
    for (let i = 0; i < coordinates.length; i++) coordinates[i] = olTransform(coordinates[i], source, destination);
    return coordinates;
  }

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
  static transformExtentFromObj(
    extent: Extent,
    projection: TypeProjection | undefined,
    destination: OLProjection,
    stops?: number | undefined
  ): Extent {
    // Get the projection object
    const projectionObj = Projection.getProjectionFromObj(projection);

    // If found
    if (projectionObj) {
      // Redirect
      return Projection.transformExtentFromProj(extent, projectionObj, destination, stops);
    }

    // Failed
    throw new NotSupportedError(`Invalid projection object '${JSON.stringify(projection)}`);
  }

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
  static transformExtentFromWKID(extent: Extent, wkid: number, destination: OLProjection, stops?: number | undefined): Extent {
    // The projection
    const proj = Projection.getProjectionFromStringOrNumber(wkid);

    // Redirect
    return Projection.transformExtentFromProj(extent, proj, destination, stops);
  }

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
  static transformExtentFromWKT(extent: Extent, customWKT: string, destination: OLProjection, stops?: number | undefined): Extent {
    // Get the projection from WKT
    const sourceProjection = Projection.getProjectionFromWKT(customWKT);

    // Redirect
    return Projection.transformExtentFromProj(extent, sourceProjection, destination, stops);
  }

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
  static transformExtentFromProj(extent: Extent, source: OLProjection, destination: OLProjection, stops?: number | undefined): Extent {
    // If different projections
    if (source.getCode() !== destination.getCode()) {
      // Project
      return olTransformExtent(extent, source, destination, stops);
    }

    // As-is
    return extent;
  }

  /**
   * Converts points from one projection to another using proj4.
   *
   * @param points - Array of passed in points to convert
   * @param fromProj - Projection to be converted from
   * @param toProj - Projection to be converted to
   * @returns The converted points array
   */
  static transformPoints(points: Coordinate[], fromProj: string, toProj: string): Array<Array<number>> {
    // initialize empty array for the converted points
    const converted: Array<Array<number>> = [];

    // if the points is an array and has some points
    if (Array.isArray(points) && points.length > 0) {
      // if the array contains another set of arrays containing points
      if (Array.isArray(points[0])) {
        // loop through each point
        for (let i = 0; i < points.length; i++) {
          // convert the points from one projection to another
          const coords = proj4(fromProj, toProj, points[i]);

          // add the converted points
          converted.push(coords);
        }
      }
    }

    return converted;
  }

  /**
   * Wrapper around OpenLayers function to transforms a coordinate from one projection to another.
   *
   * @param coordinate - Longitude/latitude coordinate
   * @param inProjection - Actual projection of the coordinate
   * @param outProjection - Desired projection of the coordinate
   * @returns Coordinate as projected
   */
  static transform(coordinate: Coordinate, inProjection: OLProjection, outProjection: OLProjection): Coordinate {
    return olTransform(coordinate, inProjection, outProjection);
  }

  /**
   * Wrapper around OpenLayers function to transforms a coordinate from longitude/latitude.
   *
   * @param coordinate - Longitude/latitude coordinate
   * @param projection - Projection to project the coordinate
   * @returns Coordinate as projected
   */
  static transformFromLonLat(coordinate: Coordinate, projection: OLProjection): Coordinate {
    return fromLonLat(coordinate, projection);
  }

  /**
   * Wrapper around OpenLayers function to transforms a coordinate to longitude/latitude.
   *
   * @param coordinate - Projected coordinate
   * @param projection - Projection of the coordinate
   * @returns Coordinate as longitude and latitude, i.e. an array with longitude as 1st and latitude as 2nd element
   */
  static transformToLonLat(coordinate: Coordinate, projection: OLProjection): Coordinate {
    return toLonLat(coordinate, projection);
  }

  /**
   * Function for converting a coordinate to a UTM Northing / Easting.
   *
   * @param coordinate - The coordinate to be converted
   * @param utmZone - The utm zone the return coordinates will be in
   * @returns The returned coordinates in UTM Northing / Easting
   */
  static transformToUTMNorthingEasting(coordinate: Coordinate, utmZone: string): Coordinate {
    const lat = coordinate[1];

    // Determine the EPSG Code
    const utmIdentifier = utmZone;
    const hemisphere = lat > 0 ? '6' : '7';
    const utmEpsgCode = `EPSG:23${hemisphere}${utmIdentifier}`;

    // Register the EPSG Code if it doesn't already exist
    const def = proj4.defs(utmEpsgCode);
    if (!def) {
      const defString = `+proj=utm +zone=${utmZone} ${lat < 0 && '+south'} +datum=WGS84 +units=m +no_defs`;
      proj4.defs(utmEpsgCode, defString);
      register(proj4);
    }

    const utmProjection = Projection.getProjectionFromStringOrNumber(utmEpsgCode);
    return Projection.transform(coordinate, Projection.PROJECTIONS['4326'], utmProjection);
  }

  /**
   * Fetches definitions for unsupported projections and adds them.
   *
   * @param projection - Object containing wkid and possibly latestWkid from service metadata
   * @returns A promise that resolves when the projection is added
   */
  static async addProjection(projection: TypeProjection): Promise<OLProjection> {
    // Resolve the effective code: favor latestWkid, fall back to wkid
    const effectiveCode = projection.latestWkid ?? projection.wkid;
    if (!effectiveCode) throw new InvalidProjectionError(`TypeProjection has no wkid or latestWkid: ${JSON.stringify(projection)}`);

    // Also register wkid if latestWkid differs
    if (projection.latestWkid && projection.wkid && projection.latestWkid !== projection.wkid) {
      await this.addProjectionCode(projection.wkid);
    }

    // Redirect
    return this.addProjectionCode(effectiveCode);
  }

  /**
   * Fetches definitions for unsupported projections and adds them.
   *
   * @param code - Projection code number
   * @returns A promise that resolves when the projection is added
   */
  static async addProjectionCode(code: number): Promise<OLProjection> {
    // The projection name
    const projectionName = `EPSG:${code}`;

    // Fetch proj4 definition from epsg.io
    let definition = await Fetch.fetchText(`https://epsg.io/${code}.proj4`);

    // Sanitize the definition, because sometimes it's giving back something we can't support
    definition = this.#sanitizeProj4Definition(definition);

    // Register in proj4 if fetched
    proj4.defs(projectionName, definition);
    register(proj4);

    // Created a projection based a EPSG code
    logger.logInfo(`Projection ${projectionName} added on-the-fly.`);

    // Register in supported projections
    this.PROJECTION_NAMES = { ...this.PROJECTION_NAMES, [code]: projectionName };
    this.PROJECTIONS[code] = Projection.getProjectionFromStringOrNumber(projectionName);
    return this.PROJECTIONS[code];
  }

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
  static addProjectionIfMissing(projection: TypeProjection | ProjectionLike | number): Promise<OLProjection> {
    // If TypeProjection object
    if (typeof projection === 'object') {
      // Redirect
      return this.#addProjectionIfMissingUsingObj(projection as TypeProjection);
    }

    // Redirect
    return this.#addProjectionIfMissingUsingStringOrNumber(projection);
  }

  /**
   * Checks if a projection exists for GeoView and if not it adds it on-the-fly using the provided TypeProjection object.
   *
   * Attempts resolution via `getProjectionFromObj` (checking `latestWkid`, `wkid`, then `wkt`).
   * If not found, fetches the definition from epsg.io via `addProjection`.
   *
   * @param projection - A TypeProjection object with wkid (and optionally latestWkid/wkt)
   * @returns A promise that resolves with the OLProjection
   */
  static #addProjectionIfMissingUsingObj(projection: TypeProjection): Promise<OLProjection> {
    try {
      const projectionObj = Projection.getProjectionFromObj(projection);
      if (projectionObj) return Promise.resolve(projectionObj); // Already available
    } catch (error: unknown) {
      logger.logWarning(`Unsupported projection, attempting to add projection ${JSON.stringify(projection)} now.`, error);
    }

    // Derive a stable key for deduplication (favor latestWkid, fall back to wkid)
    const key = `EPSG:${projection.latestWkid ?? projection.wkid}`;

    // If another call is already fetching this projection, wait for it
    const pending = this.#pendingAdditions.get(key);
    if (pending) return pending;

    // Start the addition and cache the promise
    const additionPromise = Projection.addProjection(projection).then((addedProjection) => {
      this.#pendingAdditions.delete(key);
      return addedProjection;
    });
    this.#pendingAdditions.set(key, additionPromise);
    return additionPromise;
  }

  /**
   * Checks if a projection exists for GeoView and if not it adds it on-the-fly using a string or numeric identifier.
   *
   * Attempts resolution via `getProjectionFromStringOrNumber` (supports EPSG strings, numbers, CRS URIs/URNs).
   * If not found, extracts the EPSG code via `readEPSGNumber` and fetches the definition from epsg.io.
   *
   * @param projection - A ProjectionLike string, OLProjection instance, or numeric EPSG code
   * @returns A promise that resolves with the OLProjection
   */
  static #addProjectionIfMissingUsingStringOrNumber(projection: ProjectionLike | number): Promise<OLProjection> {
    try {
      const projectionObj = Projection.getProjectionFromStringOrNumber(projection);
      if (projectionObj) return Promise.resolve(projectionObj); // Already available
    } catch (error: unknown) {
      logger.logWarning(`Unsupported projection, attempting to add projection ${projection} now.`, error);
    }

    // Derive a stable key for deduplication
    const epsgCode = this.readEPSGNumber(projection)!;
    const key = `EPSG:${epsgCode}`;

    // If another call is already fetching this projection, wait for it
    const pending = this.#pendingAdditions.get(key);
    if (pending) return pending;

    // Start the addition and cache the promise
    const additionPromise = Projection.addProjectionCode(epsgCode).then((addedProjection) => {
      this.#pendingAdditions.delete(key);
      return addedProjection;
    });
    this.#pendingAdditions.set(key, additionPromise);
    return additionPromise;
  }

  /**
   * Wrapper around OpenLayers get function that fetches a Projection object for the code specified.
   *
   * @param projectionObj - A projection object with properties such as latestWkid, wkid, or wkt
   * @returns Projection object, or undefined if not in list
   */
  static getProjectionFromObj(projectionObj: TypeProjection | undefined): OLProjection | undefined {
    // If latestWkid, favor that
    if (projectionObj?.latestWkid) {
      return Projection.getProjectionFromStringOrNumber(projectionObj.latestWkid);
    }

    // If wkid, favor that
    if (projectionObj?.wkid) {
      // Redirect
      return Projection.getProjectionFromStringOrNumber(projectionObj.wkid);
    }

    // If wkt use that
    if (projectionObj?.wkt) {
      // Redirect
      return Projection.getProjectionFromWKT(projectionObj.wkt);
    }

    // Not found
    return undefined;
  }

  /**
   * Wrapper around OpenLayers get function that fetches a Projection object for the code specified.
   *
   * @param customWKT - A code string which is a combination of authority and identifier such as "EPSG:4326"
   * @returns Projection object, or undefined if not in list
   */
  static getProjectionFromWKT(customWKT: string): OLProjection {
    // If the custom WKT doesn't exist
    if (!this.CUSTOM_WKT_AND_NUM[customWKT]) {
      // WKT short name
      const wktShortName = this.readProjectionNameFromWKT(customWKT);

      // Register a new custom projection using the WKT
      const WKT_KEY = `CUSTOM:${wktShortName}:${this.CUSTOM_WKT_NUM}`;
      // Increment for the next one
      this.CUSTOM_WKT_NUM++;

      // Register in proj4js
      proj4.defs(WKT_KEY, customWKT);
      register(proj4);

      // Add it for the next time this WKT is used
      this.CUSTOM_WKT_AND_NUM[customWKT] = WKT_KEY;

      // Created a custom projection based on WKT
      logger.logInfo(`Projection based on WKT ${wktShortName} added on-the-fly.`);
    }

    // Get the key
    const wktKey = this.CUSTOM_WKT_AND_NUM[customWKT];

    // Get the projection
    return Projection.getProjectionFromStringOrNumber(wktKey);
  }

  /**
   * Extracts the projection name from a WKT string.
   *
   * Parses the first quoted string after the opening keyword (e.g., `PROJCS["NAD83 / BC Albers", ...]`
   * returns `"NAD83 / BC Albers"`).
   *
   * @param wkt - The WKT projection definition string
   * @returns The extracted projection name, or undefined if not found
   */
  static readProjectionNameFromWKT(wkt: string): string | undefined {
    const match = /^[A-Z_]+\["([^"]+)"/.exec(wkt);
    return match?.[1];
  }

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
  static getProjectionFromStringOrNumber(projection: ProjectionLike | number): OLProjection {
    // Handle numeric input (e.g., 4326 → "EPSG:4326")
    if (typeof projection === 'number') {
      return Projection.getProjectionFromStringOrNumber(`EPSG:${projection}`);
    }

    // Handle numeric strings (e.g., '4326' → "EPSG:4326")
    if (typeof projection === 'string' && /^\d+$/.test(projection.trim())) {
      return Projection.getProjectionFromStringOrNumber(`EPSG:${projection.trim()}`);
    }

    // Handle CRS URI/URN formats (e.g., "http://www.opengis.net/def/crs/EPSG/0/4326" or "urn:ogc:def:crs:EPSG::4326")
    if (typeof projection === 'string' && (projection.includes('/') || projection.includes('urn:'))) {
      const resolved = Projection.getProjectionFromCRS(projection);
      if (resolved) return resolved;
      // Fall through to throw if unresolved
    }

    // Standard resolution via OpenLayers get()
    const proj = OLGetProjection(projection);

    // If found
    if (proj) return proj;

    // Failed
    throw new InvalidProjectionError(projection?.toString() || 'undefined');
  }

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
  static getProjectionFromCRS(crs: string): OLProjection | undefined {
    // Direct code (e.g., "EPSG:4326", "CRS:84")
    if (!crs.includes('/') && !crs.includes('urn:')) {
      return OLGetProjection(crs) ?? undefined;
    }

    // OGC HTTP URI: http://www.opengis.net/def/crs/{authority}/{version}/{code}
    const httpMatch = crs.match(/\/def\/crs\/([^/]+)\/[^/]+\/([^/\s]+)$/i);
    if (httpMatch) {
      const code = `${httpMatch[1]}:${httpMatch[2]}`;
      return OLGetProjection(code) ?? undefined;
    }

    // URN: urn:ogc:def:crs:EPSG::4326
    const urnMatch = crs.match(/^urn:[^:]+:[^:]+:crs:([^:]+):[^:]*:([^:\s]+)$/i);
    if (urnMatch) {
      const code = `${urnMatch[1]}:${urnMatch[2]}`;
      return OLGetProjection(code) ?? undefined;
    }

    return undefined;
  }

  /**
   * Gets the projection representing a LonLat projection.
   *
   * @returns Projection object representing LonLat
   */
  static getProjectionLonLat(): OLProjection {
    // Redirect
    return Projection.getProjectionFromStringOrNumber(Projection.PROJECTION_NAMES.LONLAT);
  }

  /**
   * Get map point resolution.
   *
   * @param projection - The projection code
   * @param center - Map center
   * @returns The point resolution for map center
   */
  static getResolution(projection: string, center: Coordinate): number {
    // Redirect
    return getPointResolution(projection, 1, center, 'm');
  }

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
  static readEPSGNumber(projection: ProjectionLike | number): number | undefined {
    if (!projection && projection !== 0) return undefined;

    // Handle numeric input directly
    if (typeof projection === 'number') return Number.isFinite(projection) ? projection : undefined;

    // Treat both OLProjection or string inputs
    let projectionCode: string = projection as string;
    if (typeof projection === 'object' && 'getCode' in projection) projectionCode = projection.getCode();

    // Trim and normalize
    const projectionCodeTrimmed = projectionCode.trim();

    // Match patterns like: EPSG:4326, epsg:3857, EpSg:1234, etc.
    const match = /^epsg\s*:\s*(\d+)$/i.exec(projectionCodeTrimmed);
    if (!match) return undefined;

    const epsgNumber = Number(match[1]);
    return Number.isFinite(epsgNumber) ? epsgNumber : undefined;
  }

  /**
   * Reads an extent and verifies if it might be reversed (ymin,xmin,ymax,ymin) and when
   * so puts it back in order (xmin,ymin,xmax,ymax).
   *
   * @param projection - The projection the extent is in
   * @param extent - The extent to check
   * @returns The extent in order (xmin,ymin,xmax,ymax)
   */
  static readExtentCarefully(projection: string, extent: Extent): Extent {
    // Sometimes (e.g. with 4326, 4269, and others?) the extent coordinates might be in wrong order.
    if (projection === 'EPSG:4326' || projection === 'EPSG:4269') {
      // If any number in 1 and 3 position, as absolute, is greater than 90, it's reversed for sure
      if (Math.abs(extent[1]) > 90 || Math.abs(extent[3]) > 90) {
        // Careful!
        return [extent[1], extent[0], extent[3], extent[2]];
      }
    }

    // All good
    return extent;
  }

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
  static transformCoordinates(
    coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][] | undefined,
    startProjection: string,
    endProjection: string
  ): Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][] | undefined {
    let projectedCoordinates;

    // Read the projections
    const startProjectionConv = Projection.getProjectionFromStringOrNumber(startProjection);
    const endProjectionConv = Projection.getProjectionFromStringOrNumber(endProjection);

    if (coordinates && GeometryApi.isCoordinates(coordinates)) {
      projectedCoordinates = Projection.transform(coordinates, startProjectionConv, endProjectionConv);
    } else if (coordinates && GeometryApi.isArrayOfCoordinates(coordinates)) {
      projectedCoordinates = coordinates.map((coord) => Projection.transform(coord, startProjectionConv, endProjectionConv));
    } else if (coordinates && GeometryApi.isArrayOfArrayOfCoordinates(coordinates)) {
      projectedCoordinates = coordinates.map((coordArray) =>
        coordArray.map((coord) => Projection.transform(coord, startProjectionConv, endProjectionConv))
      );
    } else if (coordinates && GeometryApi.isArrayOfArrayOfArrayOfCoordinates(coordinates)) {
      projectedCoordinates = coordinates.map((coordArrayArray) =>
        coordArrayArray.map((coordArray) => coordArray.map((coord) => Projection.transform(coord, startProjectionConv, endProjectionConv)))
      );
    }

    return projectedCoordinates;
  }

  /**
   * Sanitizes a PROJ.4 projection definition so it can be used safely with OpenLayers.
   *
   * OpenLayers does **not** support `+nadgrids=` parameters. This method removes
   * the unsupported grid reference and applies a safe replacement depending on
   * the characteristics of the projection.
   *
   * Behavior:
   * - If no `+nadgrids=` parameter is present, the definition is returned unchanged.
   * - If the projection appears to be NAD27-like (`+proj=longlat` and `+ellps=clrk66`),
   *   it replaces the grid and datum with `+datum=NAD27 +no_defs`.
   * - Otherwise, it removes the grid reference and appends a generic
   *   fallback transform: `+towgs84=0,0,0`.
   *
   * @param def - The PROJ.4 definition string to sanitize
   * @returns A cleaned and OpenLayers-compatible PROJ.4 definition
   */
  static #sanitizeProj4Definition(def: string): string {
    if (!def.includes('+nadgrids=')) return def;

    // Here, the defs contains a nadgrids={something} which isn't supported by OpenLayers, so we check if we can replace it
    const isLongLat = def.includes('+proj=longlat');
    const usesClarke66 = def.includes('+ellps=clrk66');

    // If NAD27 style, we replace it
    if (isLongLat && usesClarke66) {
      return (
        def
          .replace(/\+nadgrids=[^\s]+/g, '') // remove the grid ref
          .replace(/\+datum=[^\s]+/g, '') // remove conflicting datums
          .trim() + ' +datum=NAD27 +no_defs'
      );
    }

    // If we can't detect the datum, fall back to a safe transform
    return def.replace(/\+nadgrids=[^\s]+/g, '').trim() + ' +towgs84=0,0,0';
  }
}

/**
 * A Type to represent a Projection in JSON.
 */
export type TypeProjection = {
  wkid?: number; // Old web map services or custom ones might not have a wkid, only a wkt
  latestWkid?: number;
  wkt?: string;
};

/**
 * Initializes the CRS84 Projection
 */
function initCRS84Projection(): void {
  // define 3978 projection
  proj4.defs(Projection.PROJECTION_NAMES.CRS84, '+proj=longlat +datum=WGS84 +no_defs +type=crs');
  register(proj4);

  const projection = Projection.getProjectionFromStringOrNumber(Projection.PROJECTION_NAMES.CRS84);
  Projection.PROJECTIONS['CRS:84'] = projection;
}

/**
 * Initializes the 4326 Projection
 */
function init4326Projection(): void {
  proj4.defs(Projection.PROJECTION_NAMES.LONLAT, '+proj=longlat +datum=WGS84 +no_defs +type=crs');
  register(proj4);

  const projection = Projection.getProjectionFromStringOrNumber(Projection.PROJECTION_NAMES.LONLAT);
  Projection.PROJECTIONS['4326'] = projection;
}

/**
 * Initializes the WM Projection
 */
function initWMProjection(): void {
  const projection = Projection.getProjectionFromStringOrNumber(Projection.PROJECTION_NAMES.WM);
  Projection.PROJECTIONS['3857'] = projection;
}

/**
 * Initializes the LCC projection
 */
function initLCCProjection(): void {
  // define 3978 projection
  proj4.defs(
    Projection.PROJECTION_NAMES.LCC,
    '+proj=lcc +lat_0=49 +lon_0=-95 +lat_1=49 +lat_2=77 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
  );
  register(proj4);

  const projection = Projection.getProjectionFromStringOrNumber(Projection.PROJECTION_NAMES.LCC);
  Projection.PROJECTIONS['3978'] = projection;
}

/**
 * Initializes the CSRS projection
 */
function initCSRSProjection(): void {
  // define 4617 projection
  proj4.defs(Projection.PROJECTION_NAMES.CSRS, '+proj=longlat +ellps=GRS80 +no_defs +type=crs');
  register(proj4);

  const projection = Projection.getProjectionFromStringOrNumber(Projection.PROJECTION_NAMES.CSRS);
  Projection.PROJECTIONS['4617'] = projection;
}

/**
 * Initializes the CSRS98 projection
 */
function initCSRS98Projection(): void {
  // define 4140 projection
  proj4.defs(Projection.PROJECTION_NAMES.CSRS98, '+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs +type=crs');
  register(proj4);

  const projection = Projection.getProjectionFromStringOrNumber(Projection.PROJECTION_NAMES.CSRS98);
  Projection.PROJECTIONS['4140'] = projection;
}

/**
 * Initializes the EPSG:3578 projection
 */
function init3578Projection(): void {
  proj4.defs(
    Projection.PROJECTION_NAMES[3578],
    '+proj=aea +lat_0=59 +lon_0=-132.5 +lat_1=61.6666666666667 +lat_2=68 +x_0=500000 +y_0=500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
  );
  register(proj4);

  const projection = Projection.getProjectionFromStringOrNumber(Projection.PROJECTION_NAMES[3578]);
  Projection.PROJECTIONS['3578'] = projection;
}

/**
 * Initializes the EPSG:4269 projection
 */
function init4269Projection(): void {
  proj4.defs(Projection.PROJECTION_NAMES[4269], '+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs +type=crs');
  register(proj4);

  const projection = Projection.getProjectionFromStringOrNumber(Projection.PROJECTION_NAMES[4269]);
  Projection.PROJECTIONS['4269'] = projection;
}

/**
 * Initializes the EPSG:42101 projection
 */
function init42101Projection(): void {
  proj4.defs(
    Projection.PROJECTION_NAMES[42101],
    '+proj=lcc +lat_0=0 +lon_0=-95 +lat_1=49 +lat_2=77 +x_0=0 +y_0=-8000000 +datum=WGS84 +units=m +no_defs +type=crs'
  );
  register(proj4);

  const projection = Projection.getProjectionFromStringOrNumber(Projection.PROJECTION_NAMES[42101]);
  Projection.PROJECTIONS['42101'] = projection;
}

/**
 * Initializes the EPSG:3979 projection
 */
function init3979Projection(): void {
  proj4.defs(
    Projection.PROJECTION_NAMES[3979],
    '+proj=lcc +lat_0=49 +lon_0=-95 +lat_1=49 +lat_2=77 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=-0.991,1.9072,0.5129,-1.25033e-07,-4.6785e-08,-5.6529e-08,0 +units=m +no_defs +type=crs'
  );
  register(proj4);

  const projection = Projection.getProjectionFromStringOrNumber(Projection.PROJECTION_NAMES[3979]);
  Projection.PROJECTIONS['3979'] = projection;
}

function init102001Projection(): void {
  proj4.defs(
    Projection.PROJECTION_NAMES[102001],
    '+proj=aea +lat_0=40 +lon_0=-96 +lat_1=50 +lat_2=70 +x_0=0 +y_0=0 +datum=NAD83 +units=m +no_defs +type=crs'
  );
  register(proj4);

  const projection = Projection.getProjectionFromStringOrNumber(Projection.PROJECTION_NAMES[102001]);
  Projection.PROJECTIONS['102001'] = projection;
}

/**
 * Initializes the EPSG:102100 (ESRI:102100) projection
 */
function init102100Projection(): void {
  proj4.defs(
    Projection.PROJECTION_NAMES[102100],
    '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs'
  );
  register(proj4);

  const projection = Projection.getProjectionFromStringOrNumber(Projection.PROJECTION_NAMES[102100]);
  Projection.PROJECTIONS['102100'] = projection;
}

/**
 * Initializes the EPSG:102184 (ESRI:102184) projection
 */
function init102184Projection(): void {
  proj4.defs(
    Projection.PROJECTION_NAMES[102184],
    '+proj=tmerc +lat_0=0 +lon_0=-115 +k=0.9992 +x_0=500000 +y_0=0 +datum=NAD83 +units=m +no_defs +type=crs'
  );
  register(proj4);

  const projection = Projection.getProjectionFromStringOrNumber(Projection.PROJECTION_NAMES[102184]);
  Projection.PROJECTIONS['102184'] = projection;
}

/**
 * Initializes the EPSG:102190 (ESRI:102190) projection
 */
function init102190Projection(): void {
  proj4.defs(
    Projection.PROJECTION_NAMES[102190],
    '+proj=aea +lat_0=45 +lon_0=-126 +lat_1=50 +lat_2=58.5 +x_0=1000000 +y_0=0 +datum=NAD83 +units=m +no_defs +type=crs'
  );
  register(proj4);

  const projection = Projection.getProjectionFromStringOrNumber(Projection.PROJECTION_NAMES[102190]);
  Projection.PROJECTIONS['102190'] = projection;
}

/**
 * Initializes the EPSG:3400 projection
 */
function init3400Projection(): void {
  proj4.defs(
    Projection.PROJECTION_NAMES[3400],
    '+proj=tmerc +lat_0=0 +lon_0=-115 +k=0.9992 +x_0=500000 +y_0=0 +datum=NAD83 +units=m +no_defs +type=crs'
  );
  register(proj4);

  const projection = Projection.getProjectionFromStringOrNumber(Projection.PROJECTION_NAMES[3400]);
  Projection.PROJECTIONS['3400'] = projection;
}

/**
 * Initializes the EPSG:2151 projection
 */
function init2151Projection(): void {
  proj4.defs(Projection.PROJECTION_NAMES[2151], '+proj=utm +zone=13 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs');
  register(proj4);

  const projection = Projection.getProjectionFromStringOrNumber(Projection.PROJECTION_NAMES[2151]);
  Projection.PROJECTIONS['2151'] = projection;
}

/**
 * Initializes the EPSG:2957 projection
 */
function init2957Projection(): void {
  proj4.defs(
    Projection.PROJECTION_NAMES[2957],
    '+proj=utm +zone=13 +ellps=GRS80 +towgs84=-0.991,1.9072,0.5129,-1.25033e-07,-4.6785e-08,-5.6529e-08,0 +units=m +no_defs +type=crs'
  );
  register(proj4);

  const projection = Projection.getProjectionFromStringOrNumber(Projection.PROJECTION_NAMES[2957]);
  Projection.PROJECTIONS['2957'] = projection;
}

/**
 * Initializes the EPSG:26914 projection
 */
function init26914Projection(): void {
  proj4.defs(Projection.PROJECTION_NAMES[26914], '+proj=utm +zone=14 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs');
  register(proj4);

  const projection = Projection.getProjectionFromStringOrNumber(Projection.PROJECTION_NAMES[26914]);
  Projection.PROJECTIONS['26914'] = projection;
}

/**
 * Initializes the EPSG:3005 projection
 */
function initBCAlbersProjection(): void {
  // define EPSG:3005 projection (BC Albers)
  proj4.defs(
    Projection.PROJECTION_NAMES[3005],
    '+proj=aea +lat_1=50 +lat_2=58.5 +lat_0=45 +lon_0=-126 ' + '+x_0=1000000 +y_0=0 +datum=NAD83 +units=m +no_defs'
  );
  register(proj4);

  const projection = Projection.getProjectionFromStringOrNumber('EPSG:3005');
  Projection.PROJECTIONS['3005'] = projection;
}

/**
 * Initializes the EPSG:3573 - WGS 84 / North Pole LAEA Canada projection
 */
function init3573Projection(): void {
  // EPSG:3573 - WGS 84 / North Pole LAEA Canada
  proj4.defs('EPSG:3573', '+proj=laea +lat_0=90 +lon_0=-100 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs');
  register(proj4);

  const projection = Projection.getProjectionFromStringOrNumber(Projection.PROJECTION_NAMES[3573]);
  // The extent must be set at registration time so the map View picks it up for zoom constraints.
  projection.setExtent([-9000000, -9000000, 9000000, 9000000]);
  Projection.PROJECTIONS['3573'] = projection;
}

// Initialize the supported projections
initCRS84Projection();
init4326Projection();
initWMProjection();
initLCCProjection();
initCSRSProjection();
initCSRS98Projection();
init3573Projection();
init3578Projection();
init3979Projection();
init4269Projection();
init42101Projection();
init102001Projection();
init102100Projection();
init102184Projection();
init102190Projection();
init3400Projection();
init2151Projection();
init2957Projection();
init26914Projection();
initBCAlbersProjection();
logger.logInfo('Projections initialized');
