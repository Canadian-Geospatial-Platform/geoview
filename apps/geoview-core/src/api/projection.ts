/* eslint-disable no-plusplus */
import proj4 from 'proj4';

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
}
