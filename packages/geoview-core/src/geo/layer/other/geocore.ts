import { GroupLayerEntryConfig, TypeDisplayLanguage, TypeGeoviewLayerType } from '@config/types/map-schema-types';

import { UUIDmapConfigReader } from '@/core/utils/config/reader/uuid-config-reader';
// import { UUIDmapConfigReader } from '@/api/config/uuid-config-reader';
import { ConfigValidation } from '@/core/utils/config/config-validation';
import { GeochartEventProcessor } from '@/api/event-processors/event-processor-children/geochart-event-processor';
import { logger } from '@/core/utils/logger';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

import { GeoCoreLayerConfig, TypeGeoviewLayerConfig, TypeLayerEntryConfig } from '@/geo/map/map-schema-types';
import { GeoJSON, layerConfigIsGeoJSON } from '@/geo/layer/geoview-layers/vector/geojson';
import { GeoPackage, layerConfigIsGeoPackage } from '@/geo/layer/geoview-layers/vector/geopackage';
import { layerConfigIsWMS, WMS } from '@/geo/layer/geoview-layers/raster/wms';
import { EsriDynamic, layerConfigIsEsriDynamic } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { EsriFeature, layerConfigIsEsriFeature } from '@/geo/layer/geoview-layers/vector/esri-feature';
import { EsriImage, layerConfigIsEsriImage } from '@/geo/layer/geoview-layers/raster/esri-image';
import { ImageStatic, layerConfigIsImageStatic } from '@/geo/layer/geoview-layers/raster/image-static';
import { layerConfigIsWFS, WFS } from '@/geo/layer/geoview-layers/vector/wfs';
import { layerConfigIsOgcFeature, OgcFeature } from '@/geo/layer/geoview-layers/vector/ogc-feature';
import { layerConfigIsXYZTiles, XYZTiles } from '@/geo/layer/geoview-layers/raster/xyz-tiles';
import { layerConfigIsVectorTiles, VectorTiles } from '@/geo/layer/geoview-layers/raster/vector-tiles';
import { CSV, layerConfigIsCSV } from '@/geo/layer/geoview-layers/vector/csv';
import { TypeJsonValue } from '@/core/types/global-types';
import { AbstractGeoViewLayer, api } from '@/app';

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
   * Get full configuration of layer
   * @param {TypeGeoviewLayerConfig} layerConfig The layer config from the geocore response
   * @returns {TypeGeoviewLayerConfig} The complete layerConfig
   */
  async getFullConfig(layerConfig: TypeGeoviewLayerConfig): Promise<TypeGeoviewLayerConfig> {
    let layerBeingAdded: AbstractGeoViewLayer;
    let layerType: TypeGeoviewLayerType;
    if (layerConfigIsGeoJSON(layerConfig)) {
      layerType = 'GeoJSON';
      layerBeingAdded = new GeoJSON(this.#mapId, layerConfig);
    } else if (layerConfigIsGeoPackage(layerConfig)) {
      layerType = 'GeoPackage';
      layerBeingAdded = new GeoPackage(this.#mapId, layerConfig);
    } else if (layerConfigIsCSV(layerConfig)) {
      layerType = 'CSV';
      layerBeingAdded = new CSV(this.#mapId, layerConfig);
    } else if (layerConfigIsWMS(layerConfig)) {
      layerType = 'ogcWms';
      layerBeingAdded = new WMS(this.#mapId, layerConfig);
    } else if (layerConfigIsEsriDynamic(layerConfig)) {
      layerType = 'esriDynamic';
      layerBeingAdded = new EsriDynamic(this.#mapId, layerConfig);
    } else if (layerConfigIsEsriFeature(layerConfig)) {
      layerType = 'esriFeature';
      layerBeingAdded = new EsriFeature(this.#mapId, layerConfig);
    } else if (layerConfigIsEsriImage(layerConfig)) {
      layerType = 'esriImage';
      layerBeingAdded = new EsriImage(this.#mapId, layerConfig);
    } else if (layerConfigIsImageStatic(layerConfig)) {
      layerType = 'imageStatic';
      layerBeingAdded = new ImageStatic(this.#mapId, layerConfig);
    } else if (layerConfigIsWFS(layerConfig)) {
      layerType = 'ogcWfs';
      layerBeingAdded = new WFS(this.#mapId, layerConfig);
    } else if (layerConfigIsOgcFeature(layerConfig)) {
      layerType = 'ogcFeature';
      layerBeingAdded = new OgcFeature(this.#mapId, layerConfig);
    } else if (layerConfigIsXYZTiles(layerConfig)) {
      layerType = 'xyzTiles';
      layerBeingAdded = new XYZTiles(this.#mapId, layerConfig);
    } else if (layerConfigIsVectorTiles(layerConfig)) {
      layerType = 'vectorTiles';
      layerBeingAdded = new VectorTiles(this.#mapId, layerConfig);
    } else {
      // TODO: Refactor - Throw an Error when falling in this else and change return type to AbstractGeoViewLayer without undefined
      throw new Error(`Layer type ${layerConfig.geoviewLayerType} not supported`);
    }
    await layerBeingAdded?.preflightGetAllLayerEntryConfigs();
    const newConfig: TypeGeoviewLayerConfig = {
      ...layerBeingAdded,
      geoviewLayerType: layerType,
    };

    return newConfig;
  }

  static cloneLayerEntryConfigs(entries: TypeLayerEntryConfig[]): TypeLayerEntryConfig[] {
    return entries.map((entry) => {
      // Create new object with preserved getters/setters
      const clonedEntry = Object.create(Object.getPrototypeOf(entry), Object.getOwnPropertyDescriptors(entry));

      // If this entry has its own listOfLayerEntryConfig
      if (clonedEntry.listOfLayerEntryConfig) {
        clonedEntry.listOfLayerEntryConfig = GeoCore.cloneLayerEntryConfigs(clonedEntry.listOfLayerEntryConfig);
      }

      return clonedEntry;
    });
  }

  static subMergeLayerEntryConfigs(
    layerEntryConfigs: TypeLayerEntryConfig[],
    configMap: Map<string, GroupLayerEntryConfig | TypeLayerEntryConfig>
  ): TypeLayerEntryConfig[] {
    return layerEntryConfigs.map((layerEntryConfig) => {
      const newConfig = configMap.get(layerEntryConfig.layerId);
      if (!newConfig) {
        // If no new config to merge, just clone the existing one
        return Object.create(Object.getPrototypeOf(layerEntryConfig), Object.getOwnPropertyDescriptors(layerEntryConfig));
      }

      // Create base merged config preserving getters/setters
      const mergedConfig = Object.create(Object.getPrototypeOf(layerEntryConfig), Object.getOwnPropertyDescriptors(layerEntryConfig));

      if (mergedConfig.listOfLayerEntryConfig) {
        mergedConfig.listOfLayerEntryConfig = GeoCore.subMergeLayerEntryConfigs(mergedConfig.listOfLayerEntryConfig, configMap);
      }

      // Merge initial Settings
      if (newConfig.initialSettings) {
        mergedConfig.initialSettings = {
          ...layerEntryConfig.initialSettings,
          ...newConfig.initialSettings,
          // Special handling for states
          states: {
            ...layerEntryConfig.initialSettings?.states,
            ...newConfig.initialSettings?.states,
          },
        };
      }
      return mergedConfig;
    });
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
    mergedLayerEntryConfig.listOfLayerEntryConfig = GeoCore.cloneLayerEntryConfigs(mergedLayerEntryConfig.listOfLayerEntryConfig);
    const newConfigMap = new Map<string, GroupLayerEntryConfig | TypeLayerEntryConfig>();

    function addToConfigMap(entryConfigs: TypeLayerEntryConfig[]): void {
      entryConfigs.forEach((entryConfig) => {
        // Forces the keyId to be string, can change to integer otherwise
        const keyId = `${entryConfig.layerId}`;
        if (entryConfig.listOfLayerEntryConfig) {
          newConfigMap.set(keyId, entryConfig);
          addToConfigMap(entryConfig.listOfLayerEntryConfig);
        } else {
          newConfigMap.set(keyId, entryConfig);
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
        // remove problomatic properties
        adjustedLayerEntryConfigs[i].layerStatus = 'newInstance';

        if (adjustedLayerEntryConfigs[i].listOfLayerEntryConfig) {
          adjustedLayerEntryConfigs[i].listOfLayerEntryConfig = removeLayerConfigs(
            adjustedLayerEntryConfigs[i].listOfLayerEntryConfig as TypeLayerEntryConfig[]
          );
        }

        // if the layer is NOT in the configMap
        if (!newConfigMap.get(adjustedLayerEntryConfigs[i].layerId)) {
          // Move children up before removing the parent
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

    mergedLayerEntryConfig.listOfLayerEntryConfig = GeoCore.subMergeLayerEntryConfigs(
      mergedLayerEntryConfig.listOfLayerEntryConfig,
      newConfigMap
    );
    mergedLayerEntryConfig.listOfLayerEntryConfig = GeoCore.cloneLayerEntryConfigs(mergedLayerEntryConfig.listOfLayerEntryConfig);
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

      if (layerConfig?.initialSettings) {
        response.layers[0].initialSettings = {
          ...response.layers[0].initialSettings,
          ...layerConfig.initialSettings,
          // Special handling for states
          states: {
            ...response.layers[0].initialSettings?.states,
            ...layerConfig.initialSettings?.states,
          },
        };
      }

      if (layerConfig?.listOfLayerEntryConfig) {
        const newLayers: Promise<TypeGeoviewLayerConfig | undefined>[] = response.layers.map(async (lyr) => {
          const fullConfig = await this.getFullConfig(lyr);
          if (!fullConfig) return Promise.resolve(undefined);
          return GeoCore.mergeLayerEntryConfigs(fullConfig, layerConfig);
        });

        // Set the response layers to the merged config values
        const resolvedLayers = await Promise.all(newLayers);
        resolvedLayers.forEach((lyr, i) => {
          if (lyr) {
            response.layers[i] = lyr;
          }
        });
        // response.layers[0].listOfLayerEntryConfig = layerConfig.listOfLayerEntryConfig;
      }

      // For each found geochart associated with the Geocore UUIDs
      response.geocharts?.forEach((geochartConfig) => {
        // Add a GeoChart
        GeochartEventProcessor.addGeochartChart(this.#mapId, geochartConfig.layers[0].layerId as string, geochartConfig);
      });

      // Testing only
      // response.layers[0].listOfLayerEntryConfig[0].layerId = '1';
      // response.layers[0].listOfLayerEntryConfig[0].layerName = 'Name Set from Config';
      // response.layers[0].listOfLayerEntryConfig[0].initialSettings.states.visible = false;

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
