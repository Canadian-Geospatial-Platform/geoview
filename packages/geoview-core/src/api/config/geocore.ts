import type { GeoViewGeoChartConfig, GeoViewTimeSliderConfig } from '@/api/config/reader/uuid-config-reader';
import { UUIDmapConfigReader } from '@/api/config/reader/uuid-config-reader';
import { Config } from '@/api/config/config';
import { ConfigValidation } from '@/api/config/config-validation';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { generateId } from '@/core/utils/utilities';

import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import { DEFAULT_MAP_FEATURE_CONFIG } from '@/api/types/map-schema-types';
import type { GeoCoreLayerConfig, TypeGeoviewLayerConfig, TypeLayerEntryConfig } from '@/api/types/layer-schema-types';
import type { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { getStoreMapConfigServiceUrls, getStoreMapConfigState } from '@/core/stores/states/map-state';

/** Class used to add GeoCore layers to the map. */
export class GeoCore {
  /**
   * Gets GeoView layer configurations list from the UUIDs of the list of layer entry configurations.
   *
   * @param uuid - The UUID of the layer
   * @param language - The language
   * @param mapId - Optional map id
   * @param layerConfig - Optional layer configuration
   * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
   * @returns A promise that resolves with the layer configuration and associated geocharts
   * @throws {LayerGeoCoreServiceFailError} When the Geocore service fails to respond
   * @throws {LayerGeoCoreInvalidResponseError} When the Geocore service fails to respond with a valid payload
   * @throws {LayerGeoCoreNoLayersError} When the Geocore service responds a 'valid' payload with missing layers information
   * @throws {NotSupportedError} When the layer type read in the layerType property from Geocore payload isn't a supported type
   */
  static async createLayerConfigFromUUID(
    uuid: string,
    currentLayerIds: string[],
    language: TypeDisplayLanguage,
    mapId?: string,
    layerConfig?: GeoCoreLayerConfig,
    abortSignal?: AbortSignal
  ): Promise<GeoCoreLayerConfigResponse> {
    // If there's a mapId provided, validate the uuid
    let { geocoreUrl } = DEFAULT_MAP_FEATURE_CONFIG.serviceUrls;

    if (mapId) {
      // Check if the provided uuid is in the list of current layer ids
      if (currentLayerIds.includes(uuid)) {
        // eslint-disable-next-line no-param-reassign
        uuid = `${uuid}:${generateId(8)}`;
      }

      // Get the map config
      const mapConfig = getStoreMapConfigState(mapId);

      // Generate the url using the geocore url
      ({ geocoreUrl } = mapConfig.serviceUrls);
    }

    // Get the GV config from UUID and await
    const response = await UUIDmapConfigReader.getGVConfigFromUUIDs(geocoreUrl, language, [uuid.split(':')[0]], abortSignal);

    // For each found GeoChart associated with the Geocore UUIDs
    const geocharts: { [key: string]: GeoViewGeoChartConfig } = {};
    response.geocharts?.forEach((geochartConfig) => {
      // Get the layerPath from geocore response
      geocharts[geochartConfig.layers[0].layerId] = geochartConfig;
    });

    // Collect all time-slider configs from the response
    const timeSliderConfigs = response.timeSliderConfigs ?? [];

    // Normalize GCS custom layer entries to best-effort match inline listOfLayerEntryConfig behavior.
    const defaultLayerId =
      response.layers[0].listOfLayerEntryConfig.length === 1
        ? AbstractBaseLayerEntryConfig.getClassOrTypeLayerId(response.layers[0].listOfLayerEntryConfig[0])
        : undefined;
    const normalizedCustomListOfLayerEntryConfig = GeoCore.#normalizeCustomListOfLayerEntryConfig(
      response.customListOfLayerEntryConfig,
      defaultLayerId
    );

    // Use merged custom layer entry config (inline config has precedence over GCS custom config).
    if (layerConfig?.listOfLayerEntryConfig || normalizedCustomListOfLayerEntryConfig || layerConfig?.initialSettings) {
      // TODO: CHECK - Should we really spread here and create a 'new' TypeGeoviewLayerConfig json object here?
      const tempLayerConfig = { ...layerConfig } as unknown as TypeGeoviewLayerConfig;
      tempLayerConfig.geoviewLayerId = layerConfig?.geoviewLayerId ?? response.layers[0].geoviewLayerId;
      tempLayerConfig.metadataAccessPath = response.layers[0].metadataAccessPath;
      tempLayerConfig.geoviewLayerType = response.layers[0].geoviewLayerType;
      tempLayerConfig.listOfLayerEntryConfig =
        layerConfig?.listOfLayerEntryConfig ?? normalizedCustomListOfLayerEntryConfig ?? response.layers[0].listOfLayerEntryConfig ?? [];
      if (response.layers[0].isTimeAware === true || response.layers[0].isTimeAware === false)
        tempLayerConfig.isTimeAware = response.layers[0].isTimeAware;

      // Use the name from the first layer if none is provided in the config
      tempLayerConfig.geoviewLayerName ??= response.layers[0].geoviewLayerName;

      const newLayerConfig = Config.prevalidateGeoviewLayersConfig([tempLayerConfig], (error: GeoViewError) => {
        // When an error happens, raise the exception, we handle it higher in this case
        throw error;
      });

      // Make sure if it's a duplicate, the response has the duplicates safe ID.
      if (uuid.includes(':') && uuid.split(':')[0] === newLayerConfig[0].geoviewLayerId) {
        newLayerConfig[0].geoviewLayerId = uuid;
      }

      // Return the created layer config from the merged config informations
      return { config: newLayerConfig[0] as TypeGeoviewLayerConfig, geocharts, timeSliderConfigs };
    }

    // In case of simplified geocoreConfig being provided, just update geoviewLayerName and the first layer
    // GV This fixes the test like adding DFO via custom layer config such as:
    // [
    //   {
    //     "layerName": "Critical Habitat for Aquatic Species at Risk - Canada"
    //   }
    // ]
    // GV and called like cgpv.api.getMapViewer('map1').layer.addGeoviewLayerByGeoCoreUUID(uuid, customListOfLayerEntries);
    if (layerConfig?.geoviewLayerName) {
      response.layers[0].geoviewLayerName = layerConfig.geoviewLayerName;
      if (response.layers[0].listOfLayerEntryConfig.length === 1)
        response.layers[0].listOfLayerEntryConfig[0].setLayerName(layerConfig.geoviewLayerName);
    }

    // Make sure if it's a duplicate, the response has the duplicates safe ID
    if (uuid.includes(':') && uuid.split(':')[0] === response.layers[0].geoviewLayerId) {
      // Update the geoview layer id
      response.layers[0].geoviewLayerId = uuid;
    }

    // Always only first one
    return { config: response.layers[0], geocharts, timeSliderConfigs };
  }

  /**
   * Normalizes custom layer entries to improve backward compatibility with legacy GCS payloads.
   *
   * @param customListOfLayerEntryConfig - The custom list of layer entries to normalize
   * @param defaultLayerId - Optional fallback layer id for legacy single-layer payloads
   * @returns The normalized list, or undefined when no valid entries remain
   */
  static #normalizeCustomListOfLayerEntryConfig(
    customListOfLayerEntryConfig: TypeLayerEntryConfig[] | undefined,
    defaultLayerId?: string
  ): TypeLayerEntryConfig[] | undefined {
    if (!customListOfLayerEntryConfig?.length) {
      return undefined;
    }

    const normalizedCustomList = customListOfLayerEntryConfig
      .map((entryConfig) => {
        const entryLayerId = AbstractBaseLayerEntryConfig.getClassOrTypeLayerId(entryConfig);

        // For legacy custom payloads with no layerId, use the default layer id when we can infer it safely.
        if (!entryLayerId && defaultLayerId && !AbstractBaseLayerEntryConfig.getClassOrTypeEntryType(entryConfig)) {
          return {
            ...entryConfig,
            layerId: defaultLayerId,
          } as TypeLayerEntryConfig;
        }

        return entryConfig;
      })
      .filter((entryConfig) => {
        const entryLayerId = AbstractBaseLayerEntryConfig.getClassOrTypeLayerId(entryConfig);
        const entryType = AbstractBaseLayerEntryConfig.getClassOrTypeEntryType(entryConfig);

        // Best-effort behavior: keep entries with layerId and keep group entries; skip malformed leaf entries.
        return Boolean(entryLayerId || entryType === 'group');
      });

    return normalizedCustomList.length ? normalizedCustomList : undefined;
  }

  /**
   * Gets GeoView layer configurations list from the RCS UUIDs of the list of layer entry configurations.
   *
   * @param uuid - The UUID of the layer
   * @param language - The language
   * @param mapId - The map identifier
   * @param abortSignal - Optional {@link AbortSignal} used to handle cancelling of fetch
   * @returns A promise that resolves with the layer configuration to add to the map
   * @throws {LayerGeoCoreServiceFailError} When the Geocore service fails to respond
   * @throws {LayerGeoCoreInvalidResponseError} When the Geocore service fails to respond with a valid payload
   * @throws {LayerGeoCoreNoLayersError} When the Geocore service responds a 'valid' payload with missing layers information
   * @throws {NotSupportedError} When the layer type read in the layerType property from Geocore payload isn't a supported type
   */
  static async createLayerConfigFromRCSUUID(
    uuid: string,
    language: TypeDisplayLanguage,
    mapId: string,
    abortSignal?: AbortSignal
  ): Promise<TypeGeoviewLayerConfig> {
    // Get the map config and rcsUrl if it overrides the default
    const rcsUrl = getStoreMapConfigServiceUrls(mapId)?.rcsUrl ?? DEFAULT_MAP_FEATURE_CONFIG.serviceUrls.rcsUrl;

    // Get the GV config from UUID and await
    const response = await UUIDmapConfigReader.getGVConfigFromUUIDsRCS(`${rcsUrl}`, language, [uuid], abortSignal);

    // Validate the generated Geoview Layer Config
    ConfigValidation.validateListOfGeoviewLayerConfig(response.layers);

    // Always only first one
    return response.layers[0];
  }
}

/** Response structure containing the layer configuration and associated geocharts. */
export type GeoCoreLayerConfigResponse = {
  /** The resolved layer configuration. */
  config: TypeGeoviewLayerConfig;
  /** The geochart configurations keyed by layer path. */
  geocharts: { [key: string]: GeoViewGeoChartConfig };
  /** The time-slider configurations from GeoCore. */
  timeSliderConfigs: GeoViewTimeSliderConfig[];
};
