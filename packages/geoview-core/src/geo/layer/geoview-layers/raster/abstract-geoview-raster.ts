import { formatError } from '@/core/exceptions/core-exceptions';
import { LayerServiceMetadataUnableToFetchError } from '@/core/exceptions/layer-exceptions';
import { Fetch } from '@/core/utils/fetch-helper';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';

/**
 * The AbstractGeoViewRaster class.
 */
export abstract class AbstractGeoViewRaster extends AbstractGeoViewLayer {
  /**
   * Overrides the way the metadata is fetched.
   * Resolves with the Json object or undefined when no metadata is to be expected for a particular layer type.
   * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
   * @returns {Promise<T>} A promise with the metadata or undefined when no metadata for the particular layer type.
   * @throws {LayerServiceMetadataUnableToFetchError} If the metadata fetch fails or contains an error.
   */
  protected override async onFetchServiceMetadata<T>(abortSignal?: AbortSignal): Promise<T> {
    let responseJson;
    try {
      // Fetch it
      responseJson = await AbstractGeoViewRaster.fetchMetadata<T>(this.metadataAccessPath, abortSignal);
    } catch (error: unknown) {
      // Throw
      throw new LayerServiceMetadataUnableToFetchError(this.geoviewLayerId, this.getLayerEntryNameOrGeoviewLayerName(), formatError(error));
    }

    // Validate the metadata response
    AbstractGeoViewRaster.throwIfMetatadaHasError(this.geoviewLayerId, this.getLayerEntryNameOrGeoviewLayerName(), responseJson);

    // Return it
    return responseJson;
  }

  // #region STATIC

  /**
   * Fetches and validates metadata from a given URL for a GeoView raster layer.
   * If the URL does not end with `.json`, the query string `?f=json` is appended to request JSON format.
   * The response is parsed and checked for service-level errors. If an error is found, an exception is thrown.
   * @param {string} url - The base URL to fetch the metadata from (e.g., ArcGIS REST endpoint).
   * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
   * @returns {Promise<T>} A promise resolving to the parsed JSON metadata response.
   * @throws {ResponseError} If the response is not OK (non-2xx).
   * @throws {ResponseEmptyError} If the JSON response is empty.
   * @throws {RequestAbortedError | RequestTimeoutError} If the request was cancelled or timed out.
   */
  static fetchMetadata<T>(url: string, abortSignal?: AbortSignal): Promise<T> {
    // The url
    const parsedUrl = url.toLowerCase().endsWith('json') ? url : `${url}?f=json`;

    // Query and read
    return Fetch.fetchJson<T>(parsedUrl, { signal: abortSignal });
  }

  /**
   * Throws a LayerServiceMetadataUnableToFetchError if the provided metadata has an error in its content.
   * @param {string} geoviewLayerId - The geoview layer id
   * @param {string | undefined} layerName - The layer name
   * @param {any} metadata - The metadata to check
   * @throws {LayerServiceMetadataUnableToFetchError} If the metadata response contains an error.
   */
  // GV The metadata structure can be anything, we only care to check if there's an error inside of it
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static throwIfMetatadaHasError(geoviewLayerId: string, layerName: string | undefined, metadata: any): void {
    // If there's an error in the content of the response itself
    if ('error' in metadata && metadata.error.message) {
      // Throw the error as read from the metadata error
      throw new LayerServiceMetadataUnableToFetchError(geoviewLayerId, layerName, formatError(metadata.error.message));
    }
  }

  // #endregion
}
