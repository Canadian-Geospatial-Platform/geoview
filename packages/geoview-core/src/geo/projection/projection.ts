import proj4 from 'proj4';
import { Coordinate } from 'ol/coordinate';

import { register } from 'ol/proj/proj4';
import { get as getOLProjection, Projection as OLProjection, getPointResolution } from 'ol/proj';

/**
 * constant used for the available projection names
 */
export const PROJECTION_NAMES = {
  LCC: 'EPSG:3978',
  WM: 'EPSG:3857',
  LATLNG: 'EPSG:4326',
};

/**
 * Class used to handle functions for trasforming projections
 *
 * @exports
 * @class Projection
 */
export class Projection {
  /**
   * List of supported projections
   */
  projections: Record<string, OLProjection> = {};

  /**
   * initialize projections
   */
  constructor() {
    this.initCRS84Projection();
    this.initWMProjection();
    this.initLCCProjection();

    proj4.defs('EPSG:4617', '+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs');
    register(proj4);
  }

  /**
   * Initialize WM Projection
   */
  private initCRS84Projection() {
    const newDefinition = proj4.defs('EPSG:4326');
    newDefinition.axis = 'neu';
    proj4.defs('http://www.opengis.net/def/crs/OGC/1.3/CRS84', newDefinition);

    const projection = getOLProjection('http://www.opengis.net/def/crs/OGC/1.3/CRS84');
    if (projection) this.projections['http://www.opengis.net/def/crs/OGC/1.3/CRS84'] = projection;
  }

  /**
   * Initialize WM Projection
   */
  private initWMProjection() {
    const projection = getOLProjection('EPSG:3857');

    if (projection) this.projections['3857'] = projection;
  }

  /**
   * initialize LCC projection
   */
  private initLCCProjection() {
    // define 3978 projection
    proj4.defs(
      'EPSG:3978',
      '+proj=lcc +lat_1=49 +lat_2=77 +lat_0=49 +lon_0=-95 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
    );
    register(proj4);

    const projection = getOLProjection('EPSG:3978');

    if (projection) this.projections['3978'] = projection;
  }

  /**
   * Convert points from one projection to another
   *
   * @param {unknown} points array of passed in points to convert
   * @param {string} fromProj projection to be converted from
   * @param {string} toProj projection to be converted to
   */
  transformPoints = (points: unknown, fromProj: string, toProj: string): Array<Array<number>> => {
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
      } else if (typeof points[0] === 'number') {
        // if the array contain one point then convert the point
        const coords = proj4(fromProj, toProj, points);

        // add the converted point
        converted.push(coords);
      }
    }

    return converted;
  };

  /**
   * Convert points from LATLNG EPSG:4326 to LCC EPSG:3978
   *
   * @param {Array<number | Array<number>>} points array of passed in points to convert
   */
  latLngToLCC = (points: Array<number | Array<number>>): Array<Array<number> | number> => {
    return this.transformPoints(points, PROJECTION_NAMES.LATLNG, PROJECTION_NAMES.LCC);
  };

  /**
   * Convert points from LATLNG EPSG:4326 to WM EPSG:3857
   *
   * @param {Array<number | Array<number>>} points array of passed in points to convert
   */
  latLngToWm = (points: Array<number | Array<number>>): Array<Array<number> | number> => {
    return this.transformPoints(points, PROJECTION_NAMES.LATLNG, PROJECTION_NAMES.WM);
  };

  /**
   * Convert points from LCC EPSG:3978 to WM EPSG:3857
   *
   * @param {Array<number | Array<number>>} points array of passed in points to convert
   */
  lccToWm = (points: Array<number | Array<number>>): Array<Array<number> | number> => {
    return this.transformPoints(points, PROJECTION_NAMES.LCC, PROJECTION_NAMES.WM);
  };

  /**
   * Convert points from LCC EPSG:3978 to LATLNG EPSG:4326
   *
   * @param {Array<number | Array<number>>} points array of passed in points to convert
   */
  lccToLatLng = (points: Array<number | Array<number>>): Array<Array<number> | number> => {
    return this.transformPoints(points, PROJECTION_NAMES.LCC, PROJECTION_NAMES.LATLNG);
  };

  /**
   * Convert points from WM EPSG:3857 to LATLNG EPSG:4326
   *
   * @param {Array<number | Array<number>>} points array of passed in points to convert
   */
  wmToLatLng = (points: Array<number | Array<number>>): Array<Array<number> | number> => {
    return this.transformPoints(points, PROJECTION_NAMES.WM, PROJECTION_NAMES.LATLNG);
  };

  /**
   * Convert points from WM EPSG:3857 to LCC EPSG:3978
   *
   * @param {Array<number | Array<number>>} points array of passed in points to convert
   */
  wmToLcc = (points: Array<number | Array<number>>): Array<Array<number> | number> => {
    return this.transformPoints(points, PROJECTION_NAMES.WM, PROJECTION_NAMES.LCC);
  };

  /**
   * Get map point resolution
   *
   * @param {string} projection the projection code
   * @param {Coordinate} center map center
   * @returns the point resolution for map center
   */
  getResolution = (projection: string, center: Coordinate): number => {
    return getPointResolution(projection, 1, center, 'm');
  };
}
