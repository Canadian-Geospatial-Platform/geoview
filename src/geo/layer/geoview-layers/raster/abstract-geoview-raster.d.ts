import { TypeJsonObject } from '@/core/types/global-types';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
/**
 * The AbstractGeoViewRaster class.
 */
export declare abstract class AbstractGeoViewRaster extends AbstractGeoViewLayer {
    /**
     * Fetches the metadata for a typical AbstractGeoViewRaster class.
     * @param {string} url - The url to query the metadata from.
     */
    static fetchMetadata(url: string): Promise<TypeJsonObject>;
    /**
     * Overrides the way the metadata is fetched and set in the 'metadata' property. Resolves when done.
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected onFetchAndSetServiceMetadata(): Promise<void>;
}
