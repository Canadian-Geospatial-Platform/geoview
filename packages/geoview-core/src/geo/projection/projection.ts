<<<<<<< HEAD
=======
/* eslint-disable no-plusplus */
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d
import L from 'leaflet';
import proj4 from 'proj4';
import 'proj4leaflet';

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
 * @export
 * @class Projection
 */
export class Projection {
  // proj4 leaflet does the projection on the fly when we add geometries from another projection.
  // So theses functions are not use at the moment.
  // TODO: Evaluate what we need to keep from use case.

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
   * @param {string} epsg
   * @returns {projection is L.CRS}
   */
  getProjection = (epsg: number): L.CRS => {
    let projection: L.CRS = L.CRS.EPSG3857;
    if (epsg === 3978) {
      projection = this.getLCCProjection();
    }

    return projection;
  };

  /**
   * Get the LCC project paramters to set for the map.
   *
   * @returns {projection is object}
   */
  getLCCProjection = (): L.CRS => {
    // tile layer extent, expressed in local projection (xmin-left, ymin-bottom, xmax-right, ymax-top)
    const bbox = [-6211271, -5367092, 5972815, 4761177];

    // tile layer scales[i] = 1 / resolutions[i]
    const resolutions = [
      38364.660062653464, 22489.62831258996, 13229.193125052918, 7937.5158750317505, 4630.2175937685215, 2645.8386250105837,
      1587.5031750063501, 926.0435187537042, 529.1677250021168, 317.50063500127004, 185.20870375074085, 111.12522225044451,
      66.1459656252646, 38.36466006265346, 22.48962831258996, 13.229193125052918, 7.9375158750317505, 4.6302175937685215,
      2.6458386250105836, 1.5875031750063502,
    ];

    // transformation matrix
    // TODO: check if the transformation matrix is required
    const scaleIn = 0.5 / (Math.PI * 6378137);
    const transformation = new L.Transformation(scaleIn, 0.5, -scaleIn, 0.5);

    const p1 = L.point(bbox[1], bbox[0]); // minx, miny
    const p2 = L.point(bbox[3], bbox[2]); // maxx, maxy

    // LCC projection
    const projection = new L.Proj.CRS(
      'EPSG:3978',
      '+proj=lcc +lat_1=49 +lat_2=77 +lat_0=49 +lon_0=-95 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
      {
        resolutions,
        origin: [-3.46558e7, 3.931e7],
        bounds: L.bounds(p1, p2),
        transformation,
      }
    );

    return projection;
  };
}
