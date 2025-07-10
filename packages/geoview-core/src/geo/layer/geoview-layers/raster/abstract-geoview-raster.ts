import { TypeJsonObject } from '@/api/config/types/config-types';
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
   * @returns {Promise<TypeJsonObject | undefined>} A promise with the metadata or undefined when no metadata for the particular layer type.
   */
  protected override onFetchServiceMetadata(): Promise<TypeJsonObject | undefined> {
    // Fetch it
    return AbstractGeoViewRaster.fetchMetadata(this.metadataAccessPath, this.geoviewLayerId, this.geoviewLayerName);
  }

  // #region STATIC

  /**
   * Fetches the metadata for a typical AbstractGeoViewRaster class.
   * @param {string} url - The url to query the metadata from.
   */
  static async fetchMetadata(url: string, geoviewLayerId: string, geoviewLayerName: string): Promise<TypeJsonObject> {
    // The url
    const parsedUrl = url.toLowerCase().endsWith('json') ? url : `${url}?f=json`;

    // Query and read
    const responseJson = await Fetch.fetchJsonAsObject(parsedUrl);

    // Validate the metadata response
    AbstractGeoViewRaster.throwIfMetatadaHasError(geoviewLayerId, geoviewLayerName, responseJson);

    // Return the response
    return responseJson;
  }

  /**
   * Throws a LayerServiceMetadataUnableToFetchError if the provided metadata has an error in its content.
   * @param {string} geoviewLayerId - The geoview layer id
   * @param {TypeJsonObject} metadata - The metadata to check
   */
  static throwIfMetatadaHasError(geoviewLayerId: string, layerName: string | undefined, metadata: TypeJsonObject): void {
    // If there's an error in the content of the response itself
    if ('error' in metadata && metadata.error.message) {
      // Throw the error as read from the metadata error
      throw new LayerServiceMetadataUnableToFetchError(geoviewLayerId, layerName, formatError(metadata.error.message));
    }
  }

  // #endregion
}
