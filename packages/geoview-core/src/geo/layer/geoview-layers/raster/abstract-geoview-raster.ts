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
   * Fetches the metadata for a typical AbstractGeoViewRaster class.
   * @param {string} url - The url to query the metadata from.
   */
  static fetchMetadata(url: string): Promise<TypeJsonObject> {
    // The url
    const parsedUrl = url.toLowerCase().endsWith('json') ? url : `${url}?f=json`;

    // Query and read
    return Fetch.fetchJsonAsObject(parsedUrl);
  }

  /**
   * Throws a LayerServiceMetadataUnableToFetchError if the provided metadata has an error in its content.
   * @param {string} geoviewLayerId - The geoview layer id
   * @param {TypeJsonObject} metadata - The metadata to check
   */
  static throwIfMetatadaHasError(geoviewLayerId: string, metadata: TypeJsonObject): void {
    // If there's an error in the content of the response itself
    if ('error' in metadata && metadata.error.message) {
      // Throw the error as read from the metadata error
      throw new LayerServiceMetadataUnableToFetchError(geoviewLayerId, formatError(metadata.error.message));
    }
  }

  /**
   * Overrides the way the metadata is fetched and set in the 'metadata' property. Resolves when done.
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected override async onFetchAndSetServiceMetadata(): Promise<void> {
    // Fetch it
    const responseJson = await AbstractGeoViewRaster.fetchMetadata(this.metadataAccessPath);

    // Validate the metadata response
    AbstractGeoViewRaster.throwIfMetatadaHasError(this.geoviewLayerId, responseJson);

    // Set it
    this.metadata = responseJson;

    const copyrightText = this.metadata.copyrightText as string;
    const attributions = this.getAttributions();
    if (copyrightText && !attributions.includes(copyrightText)) {
      // Add it
      attributions.push(copyrightText);
      this.setAttributions(attributions);
    }
  }
}
