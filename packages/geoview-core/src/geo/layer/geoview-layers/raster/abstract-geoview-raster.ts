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
   */
  protected override onFetchServiceMetadata<T>(abortSignal?: AbortSignal): Promise<T> {
    // Fetch it
    return AbstractGeoViewRaster.fetchMetadata<T>(this.metadataAccessPath, this.geoviewLayerId, this.geoviewLayerName, abortSignal);
  }

  // #region STATIC

  /**
   * Fetches and validates metadata from a given URL for a GeoView raster layer.
   * If the URL does not end with `.json`, the query string `?f=json` is appended to request JSON format.
   * The response is parsed and checked for service-level errors. If an error is found, an exception is thrown.
   * @param {string} url - The base URL to fetch the metadata from (e.g., ArcGIS REST endpoint).
   * @param {string} geoviewLayerId - The unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer (used in error messages).
   * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
   * @returns {Promise<T>} A promise resolving to the parsed JSON metadata response.
   * @throws {ServiceError} If the metadata response contains an error.
   */
  static async fetchMetadata<T>(url: string, geoviewLayerId: string, geoviewLayerName: string, abortSignal?: AbortSignal): Promise<T> {
    // The url
    const parsedUrl = url.toLowerCase().endsWith('json') ? url : `${url}?f=json`;

    // Query and read
    const responseJson = await Fetch.fetchJson<T>(parsedUrl, { signal: abortSignal });

    // Validate the metadata response
    AbstractGeoViewRaster.throwIfMetatadaHasError(geoviewLayerId, geoviewLayerName, responseJson);

    // Return the response
    return responseJson;
  }

  /**
   * Throws a LayerServiceMetadataUnableToFetchError if the provided metadata has an error in its content.
   * @param {string} geoviewLayerId - The geoview layer id
   * @param {string | undefined} layerName - The layer name
   * @param {any} metadata - The metadata to check
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
