import axios from 'axios';

import { AbstractBaseLayerEntryConfig } from '@config/types/classes/sub-layer-config/abstract-base-layer-entry-config';
import { TypeJsonObject } from '@config/types/config-types';

import { logger } from '@/core/utils/logger';

/**
 * Base type used to define the common implementation of an ESRI GeoView sublayer to display on the map.
 */
export abstract class AbstractBaseEsriLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** ***************************************************************************************************************************
   * This method is used to process the metadata of the sub-layers. It will fill the empty properties of the configuration
   * (renderer, initial settings, fields and aliases).
   */
  override async fetchLayerMetadata(): Promise<void> {
    const serviceUrl = this.geoviewLayerConfigInstance.metadataAccessPath;
    const queryUrl = serviceUrl.endsWith('/') ? `${serviceUrl}${this.layerId}` : `${serviceUrl}/${this.layerId}`;

    if (!this.errorDetected) {
      try {
        const { data } = await axios.get<TypeJsonObject>(`${queryUrl}?f=json`);
        if ('error' in data) logger.logError('Error detected while reading layer metadata.', data.error);
        else {
          this.metadata = data;
          return;
        }
      } catch (error) {
        logger.logError('Error detected while reading Layer metadata.', error);
      }
      this.setErrorDetectedFlag();
    }
    this.metadata = {};
  }
}
