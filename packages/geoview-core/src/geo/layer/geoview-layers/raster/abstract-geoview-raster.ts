import { TypeJsonObject } from '@/core/types/global-types';
import { fetchJson } from '@/core/utils/utilities';
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
    return fetchJson(parsedUrl);
  }

  /**
   * Overrides the way the metadata is fetched and set in the 'metadata' property. Resolves when done.
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected override async onFetchAndSetServiceMetadata(): Promise<void> {
    // Fetch it
    const metadata = await AbstractGeoViewRaster.fetchMetadata(this.metadataAccessPath);

    // Set it
    this.metadata = metadata;
    const copyrightText = this.metadata.copyrightText as string;
    const attributions = this.getAttributions();
    if (copyrightText && !attributions.includes(copyrightText)) {
      // Add it
      attributions.push(copyrightText);
      this.setAttributions(attributions);
    }
  }
}
