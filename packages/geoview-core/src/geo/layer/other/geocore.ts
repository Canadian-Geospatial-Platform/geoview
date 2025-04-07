import { TypeDisplayLanguage } from '@config/types/map-schema-types';

import { UUIDmapConfigReader } from '@/core/utils/config/reader/uuid-config-reader';
import { Config } from '@/core/utils/config/config';
import { ConfigValidation } from '@/core/utils/config/config-validation';
import { GeochartEventProcessor } from '@/api/event-processors/event-processor-children/geochart-event-processor';
import { logger } from '@/core/utils/logger';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

import { GeoCoreLayerConfig, TypeGeoviewLayerConfig } from '@/geo/map/map-schema-types';
import { api } from '@/app';

/**
 * Class used to add geoCore layer to the map
 *
 * @exports
 * @class GeoCore
 */
export class GeoCore {
  #mapId: string;

  #displayLanguage: TypeDisplayLanguage;

  /**
   * Constructor
   * @param {string} mapId the id of the map
   */
  constructor(mapId: string, displayLanguage: TypeDisplayLanguage) {
    this.#mapId = mapId;
    this.#displayLanguage = displayLanguage;
  }

  /**
   * Gets GeoView layer configurations list from the UUIDs of the list of layer entry configurations.
   * @param {string} uuid the UUID of the layer
   * @param {GeoCoreLayerConfig} layerConfig the layer configuration
   * @returns {Promise<TypeGeoviewLayerConfig[]>} list of layer configurations to add to the map
   */
  async createLayersFromUUID(uuid: string, layerConfig?: GeoCoreLayerConfig): Promise<TypeGeoviewLayerConfig[]> {
    // Get the map config
    const map = MapEventProcessor.getMapViewer(this.#mapId);
    if (map.layer.getGeoviewLayerIds().includes(uuid)) {
      // eslint-disable-next-line no-param-reassign
      uuid = `${uuid}:${crypto.randomUUID().substring(0, 8)}`;
    }
    const mapConfig = MapEventProcessor.getGeoViewMapConfig(this.#mapId);

    // Generate the url using metadataAccessPath when specified or using the geocore url
    const url = `${mapConfig!.serviceUrls.geocoreUrl}`;

    try {
      // Get the GV config from UUID and await
      const response = await UUIDmapConfigReader.getGVConfigFromUUIDs(url, this.#displayLanguage, [uuid.split(':')[0]]);

      // Validate the generated Geoview Layer Config
      ConfigValidation.validateListOfGeoviewLayerConfig(this.#displayLanguage, response.layers);

      // For each found geochart associated with the Geocore UUIDs
      response.geocharts?.forEach((geochartConfig) => {
        // Get the layerPath from geocore response
        const layerPath = geochartConfig.layers[0].layerId;

        // Add a GeoChart
        GeochartEventProcessor.addGeochartChart(this.#mapId, layerPath, geochartConfig);
      });

      // Use user supplied listOfLayerEntryConfig if provided
      if (layerConfig?.listOfLayerEntryConfig || layerConfig?.initialSettings) {
        const tempLayerConfig = { ...layerConfig } as unknown as TypeGeoviewLayerConfig;
        tempLayerConfig.metadataAccessPath = response.layers[0].metadataAccessPath;
        tempLayerConfig.geoviewLayerType = response.layers[0].geoviewLayerType;
        if (response.layers[0].isTimeAware === true || response.layers[0].isTimeAware === false)
          tempLayerConfig.isTimeAware = response.layers[0].isTimeAware;
        // Use the name from the first layer if none is provided in the config
        if (!tempLayerConfig.geoviewLayerName) tempLayerConfig.geoviewLayerName = response.layers[0].geoviewLayerName;

        const config = new Config(this.#displayLanguage);
        const newLayerConfig = config.getValidMapConfig([tempLayerConfig]);
        return newLayerConfig as TypeGeoviewLayerConfig[];
      }

      // In case of simplified geocoreConfig being provided, just update geoviewLayerName and the first layer
      // TODO refactor: this is a terrible patch to get it to work the way OSDP wants, should be changed after refactor
      if (layerConfig?.geoviewLayerName) {
        response.layers[0].geoviewLayerName = layerConfig.geoviewLayerName;
        if (response.layers[0].listOfLayerEntryConfig.length === 1)
          response.layers[0].listOfLayerEntryConfig[0].layerName = layerConfig.geoviewLayerName;
      }

      // Make sure if it's a duplicate, the response has the duplicates safe ID
      if (uuid.includes(':') && uuid.split(':')[0] === response.layers[0].geoviewLayerId) {
        response.layers[0].geoviewLayerId = uuid;
      }
      return response.layers;
    } catch (error) {
      // Log
      logger.logError(`Failed to get the GeoView layer from UUID ${uuid}`, error);

      // Remove geoCore ordered layer info placeholder
      if (MapEventProcessor.findMapLayerFromOrderedInfo(this.#mapId, uuid))
        MapEventProcessor.removeOrderedLayerInfo(this.#mapId, uuid, false);

      // TODO: find a more centralized way to trap error and display message
      api.getMapViewer(this.#mapId).notifications.showError('validation.layer.uuidNotFound', [uuid]);
      throw error;
    }
  }
}
