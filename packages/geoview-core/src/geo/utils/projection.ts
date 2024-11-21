import proj4 from 'proj4';
import { Coordinate } from 'ol/coordinate';
import { register } from 'ol/proj/proj4';
import {
  get as olGetProjection,
  Projection as olProjection,
  getPointResolution,
  ProjectionLike,
  transform as olTransform,
  transformExtent as olTransformExtent,
  fromLonLat,
  toLonLat,
} from 'ol/proj';
import { Extent } from 'ol/extent';
import { logger } from '@/core/utils/logger';
import { TypeJsonObject } from '@/core/types/global-types';

/**
 * Class used to handle functions for trasforming projections
 *
 * @exports
 * @class Projection
 */
export abstract class Projection {
  /**
   * constant for the CRS84 URL
   */
  static CRS_84_URL = 'http://www.opengis.net/def/crs/OGC/1.3/CRS84';

  /**
   * constant used for the available projection names
   */
  static PROJECTION_NAMES = {
    3578: 'EPSG:3578',
    LCC: 'EPSG:3978',
    3979: 'EPSG:3979',
    102184: 'EPSG:102184', // This is technically supposed to be ESRI:102184, but more things would need to change in order to support this, works now
    102190: 'EPSG:102190', // This is technically supposed to be ESRI:102190, but some things would need to change in order to support this, works now
    WM: 'EPSG:3857',
    LNGLAT: 'EPSG:4326',
    CSRS: 'EPSG:4617',
    CSRS98: 'EPSG:4140',
  };

  // Incremental number when creating custom WKTs on the fly
  static CUSTOM_WKT_NUM: number = 1001;

  // Holding all custom generated wkt
  static CUSTOM_WKT_AND_NUM: { [wkt_num: string]: string } = {};

  /**
   * List of supported projections and their OpenLayers projection
   */
  static PROJECTIONS: Record<string, olProjection> = {};

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
  static transformAndDensifyExtent(extent: Extent, source: ProjectionLike, destination: ProjectionLike, stops = 25): Coordinate[] {
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
  static transformExtentFromObj(
    extent: Extent,
    projection: TypeJsonObject | undefined,
    destination: ProjectionLike,
    stops?: number | undefined
  ): Extent {
    // Get the projection object
    const projectionObj = Projection.getProjectionFromObj(projection);

    // If found
    if (projectionObj) {
      // Redirect
      return Projection.transformExtentFromProj(extent, projectionObj, destination, stops);
    }

    // Invalid projection
    throw new Error(`Invalid or unsupported projection: ${JSON.stringify(projection)}`);
  }

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
  static transformExtentFromWKID(extent: Extent, wkid: number, destination: ProjectionLike, stops?: number | undefined): Extent {
    // Redirect
    return Projection.transformExtentFromProj(extent, `EPSG:${wkid}`, destination, stops);
  }

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
  static transformExtentFromWKT(extent: Extent, customWKT: string, destination: ProjectionLike, stops?: number | undefined): Extent {
    // Redirect
    return Projection.transformExtentFromProj(extent, Projection.getProjectionFromWKT(customWKT), destination, stops);
  }

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
  static transformExtentFromProj(extent: Extent, source: ProjectionLike, destination: ProjectionLike, stops?: number | undefined): Extent {
    // Project
    return olTransformExtent(extent, source, destination, stops);
  }

  /**
   * Convert points from one projection to another using proj4
   *
   * @param {Coordinate[]} points array of passed in points to convert
   * @param {string} fromProj projection to be converted from
   * @param {string} toProj projection to be converted to
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
   * @param {Coordinate} coordinate Longitude/latitude coordinate
   * @param {ProjectionLike} inProjection Actual projection of the coordinate
   * @param {ProjectionLike} outProjection Desired projection of the coordinate
   * @return {Coordinate}  Coordinate as projected
   */
  static transform(coordinate: Coordinate, inProjection: ProjectionLike, outProjection: ProjectionLike): Coordinate {
    return olTransform(coordinate, inProjection, outProjection);
  }

  /**
   * Wrapper around OpenLayers function to transforms a coordinate from longitude/latitude.
   *
   * @param {Coordinate} coordinate Longitude/latitude coordinate
   * @param {ProjectionLike} projection Projection to project the coordinate
   * @return {Coordinate}  Coordinate as projected
   */
  static transformFromLonLat(coordinate: Coordinate, projection: ProjectionLike): Coordinate {
    return fromLonLat(coordinate, projection);
  }

  /**
   * Wrapper around OpenLayers function to transforms a coordinate to longitude/latitude.
   *
   * @param {Coordinate} coordinate Projected coordinate
   * @param {ProjectionLike} projection Projection of the coordinate
   * @return {Coordinate}  Coordinate as longitude and latitude, i.e. an array with longitude as 1st and latitude as 2nd element.
   */
  static transformToLonLat(coordinate: Coordinate, projection: ProjectionLike): Coordinate {
    return toLonLat(coordinate, projection);
  }

  /**
   * Wrapper around OpenLayers get function that fetches a Projection object for the code specified.
   *
   * @param {ProjectionLike} projectionLike Either a code string which is a combination of authority and identifier such as "EPSG:4326", or an existing projection object, or undefined.
   * @return {olProjection | undefined} — Projection object, or undefined if not in list.
   */
  static getProjectionFromObj(projection: TypeJsonObject | undefined): olProjection | undefined {
    // If wkid
    if (projection && projection.wkid) {
      // Redirect
      return Projection.getProjectionFromProj(`EPSG:${projection.wkid}`);
    }

    // If wkt
    if (projection && projection.wkt) {
      // Redirect
      return Projection.getProjectionFromWKT(projection.wkt as string);
    }

    // Nope
    return undefined;
  }

  /**
   * Wrapper around OpenLayers get function that fetches a Projection object for the code specified.
   *
   * @param {ProjectionLike} projectionLike Either a code string which is a combination of authority and identifier such as "EPSG:4326", or an existing projection object, or undefined.
   * @return {olProjection | undefined} — Projection object, or undefined if not in list.
   */
  static getProjectionFromWKT(customWKT: string): olProjection | undefined {
    // If the custom WKT doesn't exist
    if (!this.CUSTOM_WKT_AND_NUM[customWKT]) {
      // Register a new custom projection using the WKT
      const WKT_KEY = `CUSTOM:${this.CUSTOM_WKT_NUM}`;
      // Increment for the next one
      this.CUSTOM_WKT_NUM++;

      // Register in proj4js
      proj4.defs(WKT_KEY, customWKT);
      register(proj4);

      // Add it for the next time this WKT is used
      this.CUSTOM_WKT_AND_NUM[customWKT] = WKT_KEY;
    }

    // Get the key
    const wktKey = this.CUSTOM_WKT_AND_NUM[customWKT];

    // Get the projection
    return Projection.getProjectionFromProj(wktKey);
  }

  /**
   * Wrapper around OpenLayers get function that fetches a Projection object for the code specified.
   *
   * @param {ProjectionLike} projectionLike Either a code string which is a combination of authority and identifier such as "EPSG:4326", or an existing projection object, or undefined.
   * @return {olProjection | undefined} — Projection object, or undefined if not in list.
   */
  static getProjectionFromProj(projectionLike: ProjectionLike): olProjection | undefined {
    return olGetProjection(projectionLike) || undefined;
  }

  /**
   * Get map point resolution
   *
   * @param {string} projection the projection code
   * @param {Coordinate} center map center
   * @returns the point resolution for map center
   */
  static getResolution(projection: string, center: Coordinate): number {
    return getPointResolution(projection, 1, center, 'm');
  }
}

/**
 * Initialize CRS84 Projection
 * @private
 */
function initCRS84Projection(): void {
  const newDefinition = proj4.defs(Projection.PROJECTION_NAMES.LNGLAT);
  newDefinition.axis = 'neu';
  proj4.defs(Projection.CRS_84_URL, newDefinition);

  const projection = olGetProjection(Projection.CRS_84_URL);

  if (projection) Projection.PROJECTIONS[Projection.CRS_84_URL] = projection;
}

/**
 * Initialize WM Projection
 * @private
 */
function initWMProjection(): void {
  const projection = olGetProjection(Projection.PROJECTION_NAMES.WM);
  if (projection) Projection.PROJECTIONS['3857'] = projection;
}

/**
 * initialize LCC projection
 * @private
 */
function initLCCProjection(): void {
  // define 3978 projection
  proj4.defs(
    Projection.PROJECTION_NAMES.LCC,
    '+proj=lcc +lat_0=49 +lon_0=-95 +lat_1=49 +lat_2=77 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
  );
  register(proj4);

  const projection = olGetProjection(Projection.PROJECTION_NAMES.LCC);
  if (projection) Projection.PROJECTIONS['3978'] = projection;
}

/**
 * initialize CSRS projection
 * @private
 */
function initCSRSProjection(): void {
  // define 4617 projection
  proj4.defs(Projection.PROJECTION_NAMES.CSRS, '+proj=longlat +ellps=GRS80 +no_defs +type=crs');
  register(proj4);

  const projection = olGetProjection(Projection.PROJECTION_NAMES.CSRS);
  if (projection) Projection.PROJECTIONS['4617'] = projection;
}

/**
 * initialize CSRS98 projection
 * @private
 */
function initCSRS98Projection(): void {
  // define 4140 projection
  proj4.defs(Projection.PROJECTION_NAMES.CSRS98, '+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs +type=crs');
  register(proj4);

  const projection = olGetProjection(Projection.PROJECTION_NAMES.CSRS98);

  if (projection) Projection.PROJECTIONS['4140'] = projection;
}

/**
 * initialize EPSG:3578 projection
 * @private
 */
function init3578Projection(): void {
  proj4.defs(
    Projection.PROJECTION_NAMES[3578],
    '+proj=aea +lat_0=59 +lon_0=-132.5 +lat_1=61.6666666666667 +lat_2=68 +x_0=500000 +y_0=500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
  );
  register(proj4);

  const projection = olGetProjection(Projection.PROJECTION_NAMES[3578]);

  if (projection) Projection.PROJECTIONS['3578'] = projection;
}

/**
 * initialize EPSG:3979 projection
 * @private
 */
function init3979Projection(): void {
  proj4.defs(
    Projection.PROJECTION_NAMES[3979],
    '+proj=lcc +lat_0=49 +lon_0=-95 +lat_1=49 +lat_2=77 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=-0.991,1.9072,0.5129,-1.25033e-07,-4.6785e-08,-5.6529e-08,0 +units=m +no_defs +type=crs'
  );
  register(proj4);

  const projection = olGetProjection(Projection.PROJECTION_NAMES[3979]);

  if (projection) Projection.PROJECTIONS['3979'] = projection;
}

/**
 * initialize EPSG:102184 (ESRI:102184) projection
 * @private
 */
function init102184Projection(): void {
  proj4.defs(
    Projection.PROJECTION_NAMES[102184],
    '+proj=tmerc +lat_0=0 +lon_0=-115 +k=0.9992 +x_0=500000 +y_0=0 +datum=NAD83 +units=m +no_defs +type=crs'
  );
  register(proj4);

  const projection = olGetProjection(Projection.PROJECTION_NAMES[102184]);

  if (projection) Projection.PROJECTIONS['102184'] = projection;
}

/**
 * initialize EPSG:102190 (ESRI:102190) projection
 * @private
 */
function init102190Projection(): void {
  proj4.defs(
    Projection.PROJECTION_NAMES[102190],
    '+proj=aea +lat_0=45 +lon_0=-126 +lat_1=50 +lat_2=58.5 +x_0=1000000 +y_0=0 +datum=NAD83 +units=m +no_defs +type=crs'
  );
  register(proj4);

  const projection = olGetProjection(Projection.PROJECTION_NAMES[102190]);

  if (projection) Projection.PROJECTIONS['102190'] = projection;
}

// Initialize the supported projections
initCRS84Projection();
initWMProjection();
initLCCProjection();
initCSRSProjection();
initCSRS98Projection();
init3578Projection();
init3979Projection();
init102184Projection();
init102190Projection();
logger.logInfo('Projections initialized');
