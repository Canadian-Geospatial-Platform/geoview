import { Projection as OLProjection } from 'ol/proj';
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
 * @exports
 * @class Projection
 */
export declare class Projection {
    /**
     * List of supported projections
     */
    projections: Record<string, OLProjection>;
    /**
     * initialize projections
     */
    constructor();
    /**
     * Initialize WM Projection
     */
    private initCRS84Projection;
    /**
     * Initialize WM Projection
     */
    private initWMProjection;
    /**
     * initialize LCC projection
     */
    private initLCCProjection;
    /**
     * Convert points from one projection to another
     *
     * @param {unknown} points array of passed in points to convert
     * @param {string} fromProj projection to be converted from
     * @param {string} toProj projection to be converted to
     */
    transformPoints: (points: unknown, fromProj: string, toProj: string) => Array<Array<number>>;
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
     * Get map point resolution
     *
     * @param {string} projection the projection code
     * @param {Coordinate} center map center
     * @returns the point resolution for map center
     */
    getResolution: (projection: string, center: number[]) => number;
}
