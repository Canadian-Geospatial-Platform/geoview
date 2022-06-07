import proj4 from 'proj4';

import { register } from 'ol/proj/proj4';
import { get as getOLProjection, ProjectionLike, Projection as OLProjection, getTransform } from 'ol/proj';
import { applyTransform } from 'ol/extent';

import { TypeProjection } from '../../core/types/cgpv-types';

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
  // proj4 leaflet does the projection on the fly when we add geometries from another projection.
  // So theses functions are not use at the moment.
  // TODO: Evaluate what we need to keep from use case.

  /**
   * List of supported projections
   */
  projections: Record<string, TypeProjection> = {};

  /**
   * initialize projections
   */
  constructor() {
    this.initWMProjection();
    this.initLCCProjection();
  }

  /**
   * Initialize WM Projection
   */
  private initWMProjection() {
    const projection = getOLProjection('EPSG:3857');

    if (projection)
      this.projections['3857'] = {
        extent: projection.getExtent(),
        projection,
        resolutions: [
          156543.03392800014, 78271.51696399994, 39135.75848200009, 19567.87924099992, 9783.93962049996, 4891.96981024998, 2445.98490512499,
          1222.992452562495, 611.4962262813797, 305.74811314055756, 152.87405657041106, 76.43702828507324, 38.21851414253662,
          19.10925707126831, 9.554628535634155, 4.77731426794937, 2.388657133974685, 1.1943285668550503, 0.5971642835598172,
          0.29858214164761665, 0.14929107082380833, 0.07464553541190416, 0.03732276770595208, 0.01866138385297604,
        ],
        origin: [-2.0037508342787e7, 2.0037508342787e7],
      };
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

    const projection = new OLProjection({
      code: 'EPSG:3978',
    });

    const fromLonLat = getTransform('EPSG:4326', projection);

    const bbox = [86.46, -172.54, 23.81, -47.74];

    let worldExtent = [bbox[1], bbox[2], bbox[3], bbox[0]];
    projection.setWorldExtent(worldExtent);

    // approximate calculation of projection extent,
    // checking if the world extent crosses the dateline
    if (bbox[1] > bbox[3]) {
      worldExtent = [bbox[1], bbox[2], bbox[3] + 360, bbox[0]];
    }

    const extent = applyTransform(worldExtent, fromLonLat, undefined, 8);
    projection.setExtent(extent);

    if (projection)
      this.projections['3978'] = {
        extent,
        projection,
        resolutions: [
          38364.660062653464, 22489.62831258996, 13229.193125052918, 7937.5158750317505, 4630.2175937685215, 2645.8386250105837,
          1587.5031750063501, 926.0435187537042, 529.1677250021168, 317.50063500127004, 185.20870375074085, 111.12522225044451,
          66.1459656252646, 38.36466006265346, 22.48962831258996, 13.229193125052918, 7.9375158750317505, 4.6302175937685215,
          2.6458386250105836, 1.5875031750063502,
        ],
        origin: [-3.46558e7, 3.931e7],
      };
  }

  /**
   * Convert points from one projection to another
   *
   * @param {unknown} points array of passed in points to convert
   * @param {string} fromProj projection to be converted from
   * @param {string} toProj projection to be converted to
   */
  transformPoints = (points: unknown, fromProj: string, toProj: string): Array<Array<number> | number> => {
    // initialize empty array for the converted points
    const converted: Array<number | Array<number>> = [];

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
   * Get the proper projection paramters to set for the map.
   *
   * @param {number} epsg the projection code
   * @returns {ProjectionLike} the projection based on the projection code
   */
  getProjection = (epsg: number): ProjectionLike => {
    return this.projections[epsg.toString()].projection;
  };
}
