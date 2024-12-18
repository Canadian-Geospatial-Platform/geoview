import { GroupLayerEntryConfig, TypeDisplayLanguage } from '@config/types/map-schema-types';

import { UUIDmapConfigReader } from '@/core/utils/config/reader/uuid-config-reader';
import { ConfigValidation } from '@/core/utils/config/config-validation';
import { GeochartEventProcessor } from '@/api/event-processors/event-processor-children/geochart-event-processor';
import { logger } from '@/core/utils/logger';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

import { GeoCoreLayerConfig, TypeGeoviewLayerConfig, TypeLayerEntryConfig } from '@/geo/map/map-schema-types';
import { TypeJsonValue } from '@/core/types/global-types';
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
   * Merges two listOfLayerEntryConfigs together.
   * Properties from the second will overwrite the first
   * @param {TypeGeoviewLayerConfig} geocoreLayerEntryConfig the geocore layer entry config
   * @param {GeoCoreLayerConfig} newLayerEntryConfig the new layer entry config
   * @returns {TypeGeoviewLayerConfig} the merged layer entry config
   */
  static mergeLayerEntryConfigs(
    geocoreLayerEntryConfig: TypeGeoviewLayerConfig,
    newLayerEntryConfig: GeoCoreLayerConfig
  ): TypeGeoviewLayerConfig {
    // Guard against empty listOflayerEntryConfig
    if (!newLayerEntryConfig.listOfLayerEntryConfig || newLayerEntryConfig.listOfLayerEntryConfig.length === 0)
      return geocoreLayerEntryConfig;

    // Get a map of the configs for the new LayerEntryConfigs based on the Layer IDs
    const mergedLayerEntryConfig = { ...geocoreLayerEntryConfig };
    const newConfigMap = new Map<string, GroupLayerEntryConfig | TypeLayerEntryConfig>();

    function addToConfigMap(entryConfigs: TypeLayerEntryConfig[]): void {
      entryConfigs.forEach((entryConfig) => {
        if (entryConfig.listOfLayerEntryConfig) {
          newConfigMap.set(entryConfig.layerId, entryConfig);
          addToConfigMap(entryConfig.listOfLayerEntryConfig);
        } else {
          newConfigMap.set(entryConfig.layerId, entryConfig);
        }
      });
    }
    addToConfigMap(newLayerEntryConfig.listOfLayerEntryConfig);

    // Remove Layer Configs that aren't in the listOfLayerEntryConfig.
    // If a parent layer is removed, but the children are still in the list to remain, then they are
    // brought up to the parent's array instead
    function removeLayerConfigs(layerEntryConfigs: TypeLayerEntryConfig[]): TypeLayerEntryConfig[] {
      const adjustedLayerEntryConfigs: TypeLayerEntryConfig[] = [...layerEntryConfigs];
      // Go through all layers and group layers backwards and remove layers as necessary.
      // Use backwards so that the indexing isn't messed up when moving children up to the parent level
      for (let i = adjustedLayerEntryConfigs.length - 1; i >= 0; i--) {
        if (adjustedLayerEntryConfigs[i].listOfLayerEntryConfig) {
          adjustedLayerEntryConfigs[i].listOfLayerEntryConfig = removeLayerConfigs(
            adjustedLayerEntryConfigs[i].listOfLayerEntryConfig as TypeLayerEntryConfig[]
          );
        }

        if (newConfigMap.get(adjustedLayerEntryConfigs[i].layerId)) {
          if (adjustedLayerEntryConfigs[i].listOfLayerEntryConfig) {
            const numEntries = adjustedLayerEntryConfigs[i].listOfLayerEntryConfig.length;
            for (let j = numEntries - 1; j >= 0; j--) {
              adjustedLayerEntryConfigs[i].listOfLayerEntryConfig[j].parentLayerConfig = undefined;
              adjustedLayerEntryConfigs.splice(i + 1, 0, adjustedLayerEntryConfigs[i].listOfLayerEntryConfig[j]);
            }
          }
          adjustedLayerEntryConfigs.splice(i, 1);
        }
      }
      return adjustedLayerEntryConfigs;
    }
    mergedLayerEntryConfig.listOfLayerEntryConfig = removeLayerConfigs(
      mergedLayerEntryConfig.listOfLayerEntryConfig as TypeLayerEntryConfig[]
    );

    // TODO! May be an issue. Currently ignoring the listOfLayerEntryConfig order and just keeping layers based on ID ...
    // Need to make sure the initialSettings are updated properly and not over-written entirely
    function mergeLayerEntryConfigs(
      layerEntryConfigs: TypeLayerEntryConfig[],
      configMap: Map<string, GroupLayerEntryConfig | TypeLayerEntryConfig>
    ): TypeLayerEntryConfig[] {
      const newLayerEntryConfigs = [...layerEntryConfigs];
      newLayerEntryConfigs.forEach((layerEntryConfig) => {
        const newConfig = configMap.get(layerEntryConfig.layerId);
        if (!newConfig) return;
        const mergedConfig = { ...layerEntryConfig, ...newConfig };
        if (newConfig.initialSettings) {
          mergedConfig.initialSettings = { ...layerEntryConfig.initialSettings, ...newConfig.initialSettings };
          mergedConfig.initialSettings.states = { ...layerEntryConfig.initialSettings.states, ...newConfig.initialSettings.states };
        }
        if (layerEntryConfig.listOfLayerEntryConfig) {
          mergedConfig.listOfLayerEntryConfig = mergeLayerEntryConfigs(layerEntryConfig.listOfLayerEntryConfig, configMap);
        }
      });
      return newLayerEntryConfigs;
    }
    mergedLayerEntryConfig.listOfLayerEntryConfig = mergeLayerEntryConfigs(mergedLayerEntryConfig.listOfLayerEntryConfig, newConfigMap);
    return mergedLayerEntryConfig;
  }

  /**
   * Gets GeoView layer configurations list from the UUIDs of the list of layer entry configurations.
   * @param {string} uuid the UUID of the layer
   * @param {GeoCoreLayerConfig} layerConfig the layer configuration
   * @returns {Promise<TypeGeoviewLayerConfig[]>} list of layer configurations to add to the map
   */
  async createLayersFromUUID(uuid: string, layerConfig?: GeoCoreLayerConfig): Promise<TypeGeoviewLayerConfig[]> {
    // Get the map config
    const mapConfig = MapEventProcessor.getGeoViewMapConfig(this.#mapId);

    // Generate the url using metadataAccessPath when specified or using the geocore url
    const url = `${mapConfig!.serviceUrls.geocoreUrl}`;

    try {
      // Get the GV config from UUID and await
      const response = await UUIDmapConfigReader.getGVConfigFromUUIDs(url, this.#displayLanguage, [uuid]);

      // Validate the generated Geoview Layer Config
      ConfigValidation.validateListOfGeoviewLayerConfig(this.#displayLanguage, response.layers);

      // Set the Layer Name for the main layer
      if (!layerConfig?.listOfLayerEntryConfig) {
        if (layerConfig?.geoviewLayerName) response.layers[0].listOfLayerEntryConfig[0].layerName = layerConfig.geoviewLayerName;
      }

      // if (layerConfig?.listOfLayerEntryConfig) {
      //   response.layers = response.layers.map((responseLayer) => {
      //     return GeoCore.mergeLayerEntryConfigs(responseLayer, layerConfig);
      //   });
      // }

      // For each found geochart associated with the Geocore UUIDs
      response.geocharts?.forEach((geochartConfig) => {
        // Add a GeoChart
        GeochartEventProcessor.addGeochartChart(this.#mapId, geochartConfig.layers[0].layerId as string, geochartConfig);
      });

      return response.layers;
    } catch (error) {
      // Log
      logger.logError(`Failed to get the GeoView layer from UUI ${uuid}`, error);

      // TODO: find a more centralized way to trap error and display message
      api.maps[this.#mapId].notifications.showError('validation.layer.loadfailed', [error as TypeJsonValue, this.#mapId]);
      throw error;
    }
  }
}
