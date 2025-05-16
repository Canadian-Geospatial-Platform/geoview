import { TypeJsonObject } from '@/api/config/types/config-types';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
/**
 * The AbstractGeoViewRaster class.
 */
export declare abstract class AbstractGeoViewRaster extends AbstractGeoViewLayer {
    /**
     * Overrides the way the metadata is fetched and set in the 'metadata' property. Resolves when done.
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected onFetchAndSetServiceMetadata(): Promise<void>;
    /**
     * Fetches the metadata for a typical AbstractGeoViewRaster class.
     * @param {string} url - The url to query the metadata from.
     */
    static fetchMetadata(url: string): Promise<TypeJsonObject>;
    /**
     * Throws a LayerServiceMetadataUnableToFetchError if the provided metadata has an error in its content.
     * @param {string} geoviewLayerId - The geoview layer id
     * @param {TypeJsonObject} metadata - The metadata to check
     */
    static throwIfMetatadaHasError(geoviewLayerId: string, metadata: TypeJsonObject): void;
}
