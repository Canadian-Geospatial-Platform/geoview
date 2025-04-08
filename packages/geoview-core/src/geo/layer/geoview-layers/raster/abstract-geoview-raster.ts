import { TypeJsonObject } from '@/core/types/global-types';
import { logger } from '@/core/utils/logger';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';

/**
 * The AbstractGeoViewRaster class.
 */
export abstract class AbstractGeoViewRaster extends AbstractGeoViewLayer {
  /**
   * Overrides the way the metadata is fetched and set in the 'metadata' property. Resolves when done.
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected override async onFetchAndSetServiceMetadata(): Promise<void> {
    // TODO: Refactor Metadata - Maybe call 'commonfetchServiceMetadata'?
    // The url
    const url = this.metadataAccessPath.toLowerCase().endsWith('json') ? this.metadataAccessPath : `${this.metadataAccessPath}?f=json`;

    // Query and read
    this.metadata = null;
    const response = await fetch(url);
    const metadataJson: TypeJsonObject = await response.json();

    // If read
    if (metadataJson && metadataJson !== '' && metadataJson !== '{}') {
      this.metadata = metadataJson;
      const copyrightText = this.metadata.copyrightText as string;
      const attributions = this.getAttributions();
      if (copyrightText && !attributions.includes(copyrightText)) {
        // Add it
        attributions.push(copyrightText);
        this.setAttributions(attributions);
      }
    } else {
      // Log
      logger.logError('Metadata was empty');
      this.setAllLayerStatusTo('error', this.listOfLayerEntryConfig, 'Unable to read metadata');
    }
  }
}
