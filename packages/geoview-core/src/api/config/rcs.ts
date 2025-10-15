import { UUIDmapConfigReader } from '@/api/config/reader/uuid-config-reader';
import { ConfigValidation } from '@/api/config/config-validation';

import { DEFAULT_MAP_FEATURE_CONFIG, TypeDisplayLanguage } from '@/api/types/map-schema-types';
import { RCSLayerConfig, TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';

/**
 * Class used to add RCS layer to the map
 * @exports
 * @class RCS
 */
export class RCS {
  /**
   * Gets GeoView layer configurations list from the UUIDs of the list of layer entry configurations.
   * @param {string} uuid - The UUID of the layer.
   * @param {TypeDisplayLanguage} language - The language.
   * @param {RCSLayerConfig?} layerConfig - The optional layer configuration.
   * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
   * @returns {Promise<TypeGeoviewLayerConfig>} List of layer configurations to add to the map.
   */
  static async createLayerConfigFromUUID(
    uuid: string,
    language: TypeDisplayLanguage,
    layerConfig?: RCSLayerConfig,
    abortSignal?: AbortSignal
  ): Promise<TypeGeoviewLayerConfig> {
    // If there's a mapId provided, validate the uuid
    const { rcsUrl } = DEFAULT_MAP_FEATURE_CONFIG.serviceUrls;

    // Get the GV config from UUID and await
    const response = await UUIDmapConfigReader.getGVConfigFromUUIDsRCS(`${rcsUrl}`, language, [uuid], abortSignal);

    // Validate the generated Geoview Layer Config
    ConfigValidation.validateListOfGeoviewLayerConfig(response.layers);

    // In case of simplified geocoreConfig being provided, just update geoviewLayerName and the first layer
    // TODO refactor: this is a terrible patch to get it to work the way OSDP wants, should be changed after refactor
    if (layerConfig?.geoviewLayerName) {
      response.layers[0].geoviewLayerName = layerConfig.geoviewLayerName;
      if (response.layers[0].listOfLayerEntryConfig.length === 1)
        response.layers[0].listOfLayerEntryConfig[0].setLayerName(layerConfig.geoviewLayerName);
    }

    // Always only first one
    return response.layers[0];
  }
}
