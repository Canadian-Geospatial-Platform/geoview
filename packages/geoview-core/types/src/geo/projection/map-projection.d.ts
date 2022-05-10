import { CRS } from 'leaflet';
import { Projection } from './projection';
/**
 * A class that manages the projection for the loaded map
 *
 * @export
 * @class MapProjection
 */
export declare class MapProjection extends Projection {
    private crs?;
    /**
     * initialize projection
     *
     * @param {number} projection projection number
     */
    constructor(projection?: number);
    /**
     * Set the CRS from the provided projection
     *
     * @param projection the projection to use
     */
    setCRS: (projection: number) => void;
    /**
     * Get the CRS that was set by the used projection
     *
     * @returns the crs being used in the map
     */
    getCRS: () => CRS;
}
