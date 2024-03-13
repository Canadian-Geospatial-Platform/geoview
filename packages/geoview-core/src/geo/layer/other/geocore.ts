import { TypeJsonValue, getLocalizedMessage, replaceParams, showError } from '@/app';
import { UUIDmapConfigReader } from '@/core/utils/config/reader/uuid-config-reader';
import { ConfigValidation } from '@/core/utils/config/config-validation';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { GeochartEventProcessor } from '@/api/event-processors/event-processor-children/geochart-event-processor';
import { logger } from '@/core/utils/logger';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

import { TypeListOfGeoviewLayerConfig, TypeDisplayLanguage } from '../../map/map-schema-types';

/**
 * Class used to add geoCore layer to the map
 *
 * @exports
 * @class GeoCore
 */
export class GeoCore {
  private mapId: string;

  private displayLanguage: TypeDisplayLanguage;

  /** Config validation object used to validate the configuration and define default values */
  private configValidation = new ConfigValidation();

  /**
   * Constructor
   * @param {string} mapId the id of the map
   */
  constructor(mapId: string, displayLanguage: TypeDisplayLanguage) {
    this.mapId = mapId;
    this.displayLanguage = displayLanguage;
  }

  /**
   * Gets GeoView layer configurations list from the UUIDs of the list of layer entry configurations.
   *
   * @param {GeoCoreLayerEntryConfig} geocoreLayerConfig the layer configuration
   * @returns {Promise<TypeListOfGeoviewLayerConfig>} list of layer configurations to add to the map
   */
  async createLayersFromUUID(uuid: string): Promise<TypeListOfGeoviewLayerConfig> {
    // Get the map config
    const mapConfig = MapEventProcessor.getGeoViewMapConfig(this.mapId);

    // Generate the url using metadataAccessPath when specified or using the geocore url
    const url = `${mapConfig!.serviceUrls.geocoreUrl}`;

    try {
      // Get the GV config from UUID and await
      const response = await UUIDmapConfigReader.getGVConfigFromUUIDs(url, this.displayLanguage, [uuid]);

      // Validate the generated Geoview Layer Config
      this.configValidation.validateListOfGeoviewLayerConfig(AppEventProcessor.getSupportedLanguages(this.mapId), response.layers);

      // For each found geochart associated with the Geocore UUIDs
      response.geocharts?.forEach((geochartConfig) => {
        // Add a GeoChart
        GeochartEventProcessor.addGeochartChart(this.mapId, geochartConfig.layers[0].layerId as string, geochartConfig);
      });

      return response.layers;
    } catch (error) {
      // Log
      logger.logError(`Failed to get the GeoView layer from UUI ${uuid}`, error);
      const message = replaceParams([error as TypeJsonValue, this.mapId], getLocalizedMessage(this.mapId, 'validation.layer.loadfailed'));
      showError(this.mapId, message);
      throw error;
    }
  }
}
