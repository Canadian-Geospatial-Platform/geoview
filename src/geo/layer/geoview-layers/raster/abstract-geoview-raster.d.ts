import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
/**
 * The AbstractGeoViewRaster class.
 */
export declare abstract class AbstractGeoViewRaster extends AbstractGeoViewLayer {
    /**
     * Overrides the way the metadata is fetched.
     * Resolves with the Json object or undefined when no metadata is to be expected for a particular layer type.
     * @param {AbortSignal?} [abortSignal] - Abort signal to handle cancelling of the process.
     * @returns {Promise<T>} A promise with the metadata or undefined when no metadata for the particular layer type.
     * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
     */
    protected onFetchServiceMetadata<T>(abortSignal?: AbortSignal): Promise<T>;
    /**
     * Fetches and validates metadata from a given URL for a GeoView raster layer.
     * If the URL does not end with `.json`, the query string `?f=json` is appended to request JSON format.
     * The response is parsed and checked for service-level errors. If an error is found, an exception is thrown.
     * @param {string} url - The base URL to fetch the metadata from (e.g., ArcGIS REST endpoint).
     * @param {AbortSignal?} [abortSignal] - Abort signal to handle cancelling of the process.
     * @returns {Promise<T>} A promise resolving to the parsed JSON metadata response.
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
     * @throws {ResponseError} When the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} When the JSON response is empty.
     * @static
     */
    static fetchMetadata<T>(url: string, abortSignal?: AbortSignal): Promise<T>;
    /**
     * Throws a LayerServiceMetadataUnableToFetchError if the provided metadata has an error in its content.
     * @param {string} geoviewLayerId - The geoview layer id
     * @param {string | undefined} layerName - The layer name
     * @param {any} metadata - The metadata to check
     * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
     * @static
     */
    static throwIfMetatadaHasError(geoviewLayerId: string, layerName: string | undefined, metadata: any): void;
}
//# sourceMappingURL=abstract-geoview-raster.d.ts.map