import { TypeDisplayLanguage } from '@config/types/map-schema-types';

import { UUIDmapConfigReader } from '@/core/utils/config/reader/uuid-config-reader';
import { ConfigValidation } from '@/core/utils/config/config-validation';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { GeochartEventProcessor } from '@/api/event-processors/event-processor-children/geochart-event-processor';
import { logger } from '@/core/utils/logger';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

import { TypeListOfGeoviewLayerConfig } from '@/geo/map/map-schema-types';
import { TypeJsonValue } from '@/core/types/global-types';
import { api } from '@/app';

/**
 * Class used to add geoCore layer to the map
 *
 * @exports
 * @class GeoCore
 */
export class GeoCore {
  private mapId: string;

  private displayLanguage: TypeDisplayLanguage;

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
      ConfigValidation.validateListOfGeoviewLayerConfig(AppEventProcessor.getSupportedLanguages(this.mapId), response.layers);

      // For each found geochart associated with the Geocore UUIDs
      response.geocharts?.forEach((geochartConfig) => {
        // Add a GeoChart
        GeochartEventProcessor.addGeochartChart(this.mapId, geochartConfig.layers[0].layerId as string, geochartConfig);
      });

      return response.layers;
    } catch (error) {
      // Log
      logger.logError(`Failed to get the GeoView layer from UUI ${uuid}`, error);

      // TODO: find a more centralized way to trap error and display message
      api.maps[this.mapId].notifications.showError('validation.layer.loadfailed', [error as TypeJsonValue, this.mapId]);
      throw error;
    }
  }
}
