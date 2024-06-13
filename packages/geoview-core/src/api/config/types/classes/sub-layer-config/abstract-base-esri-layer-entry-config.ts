import { AbstractBaseLayerEntryConfig } from '@config/types/classes/sub-layer-config/abstract-base-layer-entry-config';
import axios from 'axios';
import { TypeJsonObject } from '../../config-types';
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
    const serviceUrlFragments = this.geoviewLayerConfigInstance.metadataAccessPath.split('/');
    // The test convert to number and back to string because parseInt('10a', 10) returns 10, but '10a' is not a number
    const endingIsNumeric = parseInt(serviceUrlFragments.slice(-1)[0], 10).toString() === serviceUrlFragments.slice(-1)[0];
    const serviceUrl = endingIsNumeric
      ? `${serviceUrlFragments.slice(0, -1).join('/')}/`
      : this.geoviewLayerConfigInstance.metadataAccessPath;

    const queryUrl = serviceUrl.endsWith('/') ? `${serviceUrl}${this.layerId}` : `${serviceUrl}/${this.layerId}`;

    try {
      const { data } = await axios.get<TypeJsonObject>(`${queryUrl}?f=pjson`);
      if ('error' in data) logger.logError('Error detected while reading layer metadata.', data.error);
      else this.metadata = data;
    } catch (error) {
      logger.logError('Error detected in fetchEsriLayerMetadata while reading ESRI metadata.', error);
    }
    this.setErrorDetectedFlag();
    this.metadata = {};
  }
}
