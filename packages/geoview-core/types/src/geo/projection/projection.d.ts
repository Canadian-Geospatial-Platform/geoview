import L from 'leaflet';
import 'proj4leaflet';
/**
 * constant used for the available projection names
 */
export declare const PROJECTION_NAMES: {
    LCC: string;
    WM: string;
    LATLNG: string;
};
/**
 * Class used to handle functions for trasforming projections
 *
 * @export
 * @class Projection
 */
export declare class Projection {
    /**
     * Convert points from one projection to another
     *
     * @param {unknown} points array of passed in points to convert
     * @param {string} fromProj projection to be converted from
     * @param {string} toProj projection to be converted to
     */
    transformPoints: (points: unknown, fromProj: string, toProj: string) => Array<Array<number> | number>;
    /**
     * Convert points from LATLNG EPSG:4326 to LCC EPSG:3978
     *
     * @param {Array<number | Array<number>>} points array of passed in points to convert
     */
    latLngToLCC: (points: Array<number | Array<number>>) => Array<Array<number> | number>;
    /**
     * Convert points from LATLNG EPSG:4326 to WM EPSG:3857
     *
     * @param {Array<number | Array<number>>} points array of passed in points to convert
     */
    latLngToWm: (points: Array<number | Array<number>>) => Array<Array<number> | number>;
    /**
     * Convert points from LCC EPSG:3978 to WM EPSG:3857
     *
     * @param {Array<number | Array<number>>} points array of passed in points to convert
     */
    lccToWm: (points: Array<number | Array<number>>) => Array<Array<number> | number>;
    /**
     * Convert points from LCC EPSG:3978 to LATLNG EPSG:4326
     *
     * @param {Array<number | Array<number>>} points array of passed in points to convert
     */
    lccToLatLng: (points: Array<number | Array<number>>) => Array<Array<number> | number>;
    /**
     * Convert points from WM EPSG:3857 to LATLNG EPSG:4326
     *
     * @param {Array<number | Array<number>>} points array of passed in points to convert
     */
    wmToLatLng: (points: Array<number | Array<number>>) => Array<Array<number> | number>;
    /**
     * Convert points from WM EPSG:3857 to LCC EPSG:3978
     *
     * @param {Array<number | Array<number>>} points array of passed in points to convert
     */
    wmToLcc: (points: Array<number | Array<number>>) => Array<Array<number> | number>;
    /**
     * Get the proper projection paramters to set for the map.
     *
     * @param {string} epsg
     * @returns {projection is L.CRS}
     */
    getProjection: (epsg: number) => L.CRS;
    /**
     * Get the LCC project paramters to set for the map.
     *
     * @returns {projection is object}
     */
    getLCCProjection: () => L.CRS;
}
