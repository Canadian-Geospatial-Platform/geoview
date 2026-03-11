import type { GeoViewGeoChartConfig } from '@/api/config/reader/uuid-config-reader';
import { UUIDmapConfigReader } from '@/api/config/reader/uuid-config-reader';
import { Config } from '@/api/config/config';
import { ConfigValidation } from '@/api/config/config-validation';
import { generateId } from '@/core/utils/utilities';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import { DEFAULT_MAP_FEATURE_CONFIG } from '@/api/types/map-schema-types';
import type { GeoCoreLayerConfig, RCSLayerConfig, TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
import type { GeoViewError } from '@/core/exceptions/geoview-exceptions';

/**
 * Class used to add geoCore layer to the map
 * @exports
 * @class GeoCore
 */
export class GeoCore {
  /**
   * Gets GeoView layer configurations list from the UUIDs of the list of layer entry configurations.
   * @param uuid - The UUID of the layer.
   * @param language - The language.
   * @param mapId - The optional map id.
   * @param layerConfig - Optional layer configuration.
   * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process.
   * @returns List of layer configurations to add to the map.
   */
  static async createLayerConfigFromUUID(
    uuid: string,
    language: TypeDisplayLanguage,
    mapId?: string,
    layerConfig?: GeoCoreLayerConfig,
    abortSignal?: AbortSignal
  ): Promise<GeoCoreLayerConfigResponse> {
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
    const response = await UUIDmapConfigReader.getGVConfigFromUUIDs(geocoreUrl, language, [uuid.split(':')[0]], abortSignal);

    // For each found GeoChart associated with the Geocore UUIDs
    const geocharts: { [key: string]: GeoViewGeoChartConfig } = {};
    response.geocharts?.forEach((geochartConfig) => {
      // Get the layerPath from geocore response
      geocharts[geochartConfig.layers[0].layerId] = geochartConfig;
    });

    // Use user supplied listOfLayerEntryConfig if provided
    if (layerConfig?.listOfLayerEntryConfig || layerConfig?.initialSettings) {
      const tempLayerConfig = { ...layerConfig } as unknown as TypeGeoviewLayerConfig;
      tempLayerConfig.metadataAccessPath = response.layers[0].metadataAccessPath;
      tempLayerConfig.geoviewLayerType = response.layers[0].geoviewLayerType;
      tempLayerConfig.listOfLayerEntryConfig ??= response.layers[0].listOfLayerEntryConfig ?? [];
      if (response.layers[0].isTimeAware === true || response.layers[0].isTimeAware === false)
        tempLayerConfig.isTimeAware = response.layers[0].isTimeAware;

      // Use the name from the first layer if none is provided in the config
      tempLayerConfig.geoviewLayerName ??= response.layers[0].geoviewLayerName;

      const newLayerConfig = Config.prevalidateGeoviewLayersConfig([tempLayerConfig], (error: GeoViewError) => {
        // When an error happens, raise the exception, we handle it higher in this case
        throw error;
      });
      // Return the created layer config from the merged config informations
      return { config: newLayerConfig[0] as TypeGeoviewLayerConfig, geocharts };
    }

    // If the config already has a name
    if (layerConfig?.geoviewLayerName) {
      // Use the name from the config
      response.layers[0].geoviewLayerName = layerConfig.geoviewLayerName;
    }

    // TODO: CLEANUP - Remove commented code 2026-03-06 - trying to reduce the clutter with the layer name processing
    // // In case of simplified geocoreConfig being provided, just update geoviewLayerName and the first layer
    // if (layerConfig?.geoviewLayerName) {
    //   response.layers[0].geoviewLayerName = layerConfig.geoviewLayerName;
    //   if (response.layers[0].listOfLayerEntryConfig.length === 1)
    //     response.layers[0].listOfLayerEntryConfig[0].setLayerName(layerConfig.geoviewLayerName);
    // }

    // Make sure if it's a duplicate, the response has the duplicates safe ID
    if (uuid.includes(':') && uuid.split(':')[0] === response.layers[0].geoviewLayerId) {
      response.layers[0].geoviewLayerId = uuid;
    }

    // Always only first one
    return { config: response.layers[0], geocharts };
  }

  /**
   * Gets GeoView layer configurations list from the RCS UUIDs of the list of layer entry configurations.
   * @param uuid - The UUID of the layer.
   * @param language - The language.
   * @param mapId - The optional map id.
   * @param layerConfig - Optional layer configuration.
   * @param abortSignal - Optional {@link AbortSignal} used to handle cancelling of fetch.
   * @returns List of layer configurations to add to the map.
   */
  static async createLayerConfigFromRCSUUID(
    uuid: string,
    language: TypeDisplayLanguage,
    mapId: string,
    layerConfig?: RCSLayerConfig,
    abortSignal?: AbortSignal
  ): Promise<TypeGeoviewLayerConfig> {
    // Get the map config and rcsUrl if it overrides the default
    const rcsUrl = MapEventProcessor.getGeoViewMapConfig(mapId)?.serviceUrls?.rcsUrl ?? DEFAULT_MAP_FEATURE_CONFIG.serviceUrls.rcsUrl;

    // Get the GV config from UUID and await
    const response = await UUIDmapConfigReader.getGVConfigFromUUIDsRCS(`${rcsUrl}`, language, [uuid], abortSignal);

    // Validate the generated Geoview Layer Config
    ConfigValidation.validateListOfGeoviewLayerConfig(response.layers);

    // TODO: CLEANUP - Remove commented code 2026-03-06 - trying to reduce the clutter with the layer name processing
    // // In case of simplified geocoreConfig being provided, just update geoviewLayerName and the first layer
    // // TODO refactor: this is a terrible patch to get it to work the way OSDP wants, should be changed after refactor
    // // GV: Always the ifrst one because there is only one layer by layers array...
    // if (layerConfig?.geoviewLayerName) {
    //   response.layers[0].geoviewLayerName = layerConfig.geoviewLayerName;
    //   if (response.layers[0].listOfLayerEntryConfig.length === 1)
    //     response.layers[0].listOfLayerEntryConfig[0].setLayerName(layerConfig.geoviewLayerName);
    // }

    // Always only first one
    return response.layers[0];
  }
}

export type GeoCoreLayerConfigResponse = {
  config: TypeGeoviewLayerConfig;
  geocharts: { [key: string]: GeoViewGeoChartConfig };
};
