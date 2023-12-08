import { Coordinate } from 'ol/coordinate';
import { Projection as OLProjection } from 'ol/proj';
/**
 * constant used for the available projection names
 */
export declare const PROJECTION_NAMES: {
    LCC: string;
    WM: string;
    LNGLAT: string;
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
     * @param {Coordinate[]} points array of passed in points to convert
     * @param {string} fromProj projection to be converted from
     * @param {string} toProj projection to be converted to
     */
    transformPoints: (points: Coordinate[], fromProj: string, toProj: string) => Array<Array<number>>;
    /**
     * Convert points from LNGLAT EPSG:4326 to LCC EPSG:3978
     *
     * @param {Coordinate[]} points array of passed in points to convert
     */
    lngLatToLCC: (points: Coordinate[]) => Array<Array<number> | number>;
    /**
     * Convert points from LNGLAT EPSG:4326 to WM EPSG:3857
     *
     * @param {Coordinate[]} points array of passed in points to convert
     */
    LngLatToWm: (points: Coordinate[]) => Array<Array<number> | number>;
    /**
     * Convert points from LCC EPSG:3978 to WM EPSG:3857
     *
     * @param {Coordinate[]} points array of passed in points to convert
     */
    lccToWm: (points: Coordinate[]) => Array<Array<number> | number>;
    /**
     * Convert points from LCC EPSG:3978 to LNGLAT EPSG:4326
     *
     * @param {Coordinate[]} points array of passed in points to convert
     */
    lccToLngLat: (points: Coordinate[]) => Array<Array<number> | number>;
    /**
     * Convert points from WM EPSG:3857 to LNGLAT EPSG:4326
     *
     * @param {Coordinate[]} points array of passed in points to convert
     */
    wmToLngLat: (points: Coordinate[]) => Array<Array<number> | number>;
    /**
     * Convert points from WM EPSG:3857 to LCC EPSG:3978
     *
     * @param {Coordinate[]} points array of passed in points to convert
     */
    wmToLcc: (points: Coordinate[]) => Array<Array<number> | number>;
    /**
     * Get map point resolution
     *
     * @param {string} projection the projection code
     * @param {Coordinate} center map center
     * @returns the point resolution for map center
     */
    getResolution: (projection: string, center: Coordinate) => number;
}
