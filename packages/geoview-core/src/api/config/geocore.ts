import { UUIDmapConfigReader } from '@/api/config/reader/uuid-config-reader';
import { Config } from '@/api/config/config';
import { ConfigValidation } from '@/api/config/config-validation';
import { GeochartEventProcessor } from '@/api/event-processors/event-processor-children/geochart-event-processor';
import { generateId } from '@/core/utils/utilities';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

import { DEFAULT_MAP_FEATURE_CONFIG, TypeDisplayLanguage } from '@/api/types/map-schema-types';
import { GeoCoreLayerConfig, TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';

/**
 * Class used to add geoCore layer to the map
 * @exports
 * @class GeoCore
 */
export class GeoCore {
  /**
   * Gets GeoView layer configurations list from the UUIDs of the list of layer entry configurations.
   * @param {string} uuid - The UUID of the layer
   * @param {TypeDisplayLanguage} language - The language
   * @param {string} mapId - The optional map id
   * @param {GeoCoreLayerConfig?} layerConfig - The optional layer configuration
   * @returns {Promise<TypeGeoviewLayerConfig>} List of layer configurations to add to the map.
   */
  static async createLayerConfigFromUUID(
    uuid: string,
    language: TypeDisplayLanguage,
    mapId?: string,
    layerConfig?: GeoCoreLayerConfig
  ): Promise<TypeGeoviewLayerConfig> {
    // If there's a mapId provided, validate the uuid
    let { geocoreUrl } = DEFAULT_MAP_FEATURE_CONFIG.serviceUrls;

    if (mapId) {
      // Get the map config
      const map = MapEventProcessor.getMapViewer(mapId);
      if (map.layer.getGeoviewLayerIds().includes(uuid)) {
        // eslint-disable-next-line no-param-reassign
        uuid = `${uuid}:${generateId(8)}`;
      }

      // Get the map config
      const mapConfig = MapEventProcessor.getGeoViewMapConfig(mapId);

      // Generate the url using the geocore url
      ({ geocoreUrl } = mapConfig!.serviceUrls);
    }

    // Get the GV config from UUID and await
    const response = await UUIDmapConfigReader.getGVConfigFromUUIDs(geocoreUrl, language, [uuid.split(':')[0]]);

    // Validate the generated Geoview Layer Config
    ConfigValidation.validateListOfGeoviewLayerConfig(response.layers);

    // If there's a mapId, check for geochart
    if (mapId) {
      // For each found geochart associated with the Geocore UUIDs
      response.geocharts?.forEach((geochartConfig) => {
        // Get the layerPath from geocore response
        const layerPath = geochartConfig.layers[0].layerId;

        // If a Geochart is initialized
        if (GeochartEventProcessor.isGeochartInitialized(mapId)) {
          // Add a GeoChart
          GeochartEventProcessor.addGeochartChart(mapId, layerPath, geochartConfig);
        }
      });
    }

    // Use user supplied listOfLayerEntryConfig if provided
    if (layerConfig?.listOfLayerEntryConfig || layerConfig?.initialSettings) {
      const tempLayerConfig = { ...layerConfig } as unknown as TypeGeoviewLayerConfig;
      tempLayerConfig.metadataAccessPath = response.layers[0].metadataAccessPath;
      tempLayerConfig.geoviewLayerType = response.layers[0].geoviewLayerType;
      if (response.layers[0].isTimeAware === true || response.layers[0].isTimeAware === false)
        tempLayerConfig.isTimeAware = response.layers[0].isTimeAware;
      // Use the name from the first layer if none is provided in the config
      if (!tempLayerConfig.geoviewLayerName) tempLayerConfig.geoviewLayerName = response.layers[0].geoviewLayerName;

      const newLayerConfig = Config.prevalidateGeoviewLayersConfig([tempLayerConfig], (errorKey: string, params: string[]) => {
        // When an error happens, raise the exception, we handle it higher in this case
        throw new GeoViewError(errorKey, params);
      });

      // Return the created layer config from the merged config informations
      return newLayerConfig[0] as TypeGeoviewLayerConfig;
    }

    // In case of simplified geocoreConfig being provided, just update geoviewLayerName and the first layer
    // TODO refactor: this is a terrible patch to get it to work the way OSDP wants, should be changed after refactor
    if (layerConfig?.geoviewLayerName) {
      response.layers[0].geoviewLayerName = layerConfig.geoviewLayerName;
      if (response.layers[0].listOfLayerEntryConfig.length === 1)
        response.layers[0].listOfLayerEntryConfig[0].setLayerName(layerConfig.geoviewLayerName);
    }

    // Make sure if it's a duplicate, the response has the duplicates safe ID
    if (uuid.includes(':') && uuid.split(':')[0] === response.layers[0].geoviewLayerId) {
      response.layers[0].geoviewLayerId = uuid;
    }

    // Always only first one
    return response.layers[0];
  }
}
