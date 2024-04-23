import axios, { AxiosResponse } from 'axios';

import { CV_CONST_LAYER_TYPES, CV_CONST_SUB_LAYER_TYPES } from '@config/types/config-constants';
import { TypeOfServer, TypeTileGrid } from '@config/types/map-schema-types';
import { TypeJsonArray, TypeJsonObject, toJsonObject } from '@config/types/config-types';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { MapFeaturesConfig } from '../types/classes/map-features-config';
import { logger } from '@/core/utils/logger';
import { createLocalizedString } from '@/core/utils/utilities';

// The GeoChart Json object coming out of the GeoCore response
export type GeoChartGeoCoreConfig = TypeJsonObject & {
  layers: {
    layerId: string;
  };
}; // TypeJsonObject, because the definition is in the external package

// #region GeoChart Config types

// The GeoChart Json object expected by GeoView
export type GeoChartConfig = TypeJsonObject & {
  layers: [
    {
      layerId: string;
    }
  ];
}; // TypeJsonObject, because the definition is in the external package

// The returned parsed response
export type UUIDmapConfigReaderResponse = {
  layers: AbstractGeoviewLayerConfig[];
  geocharts?: GeoChartConfig[];
};

// #endregion

/**
 * A class to generate GeoView layers config from a URL using a UUID.
 * @exports
 * @class UUIDmapConfigReader
 */
export class UUIDmapConfigReader {
  /**
   * Reads and parses Layers configs from uuid request result
   * @param {TypeJsonObject} result the uuid request result
   * @returns {TypeListOfGeoviewLayerConfig} layers parsed from uuid result
   * @private
   */
  static #getLayerConfigFromResponse(result: AxiosResponse<TypeJsonObject>, lang: string): AbstractGeoviewLayerConfig[] {
    // If invalid response
    if (!result?.data || !result.data.reponse || !result.data.reponse.rcs || !result.data.reponse.rcs[lang])
      throw new Error('Invalid response from GeoCore service');
    if (result.data.reponse.rcs[lang].length === 0) throw new Error('No layers returned by GeoCore service');

    const listOfGeoviewLayerConfig: AbstractGeoviewLayerConfig[] = [];
    for (let i = 0; i < (result.data.reponse.rcs[lang] as TypeJsonArray).length; i++) {
      const data = result.data.reponse.rcs[lang][i];

      if (data?.layers && (data.layers as TypeJsonArray).length > 0) {
        const layer = data.layers[0];

        if (layer) {
          const { layerType, layerEntries, name, url, id, serverType } = layer;

          const isFeature = (url as string).indexOf('FeatureServer') > -1;

          if (layerType === CV_CONST_LAYER_TYPES.ESRI_DYNAMIC && !isFeature) {
            const geoviewLayerConfig = MapFeaturesConfig.nodeFactory(
              toJsonObject({
                geoviewLayerId: `${id}`,
                geoviewLayerName: createLocalizedString(name as string),
                metadataAccessPath: createLocalizedString(url as string),
                geoviewLayerType: CV_CONST_LAYER_TYPES.ESRI_DYNAMIC,
                listOfLayerEntryConfig: [],
              })
            )!;
            geoviewLayerConfig.createListOfLayerEntryConfig(
              (layerEntries as TypeJsonArray).map((item): TypeJsonObject => {
                return toJsonObject({
                  geoviewLayerConfig,
                  schemaTag: CV_CONST_LAYER_TYPES.ESRI_DYNAMIC,
                  entryType: CV_CONST_SUB_LAYER_TYPES.RASTER_IMAGE,
                  layerId: `${item.index}`,
                  source: {
                    dataAccessPath: createLocalizedString(url as string),
                  },
                });
              })
            );
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (isFeature) {
            for (let j = 0; j < (layerEntries as TypeJsonArray).length; j++) {
              const featureUrl = `${url}/${layerEntries[j].index}`;
              const geoviewLayerConfig = MapFeaturesConfig.nodeFactory(
                toJsonObject({
                  geoviewLayerId: `${id}`,
                  geoviewLayerName: createLocalizedString(name as string),
                  metadataAccessPath: createLocalizedString(featureUrl),
                  geoviewLayerType: CV_CONST_LAYER_TYPES.ESRI_FEATURE,
                  listOfLayerEntryConfig: [],
                })
              )!;
              geoviewLayerConfig.createListOfLayerEntryConfig(
                (layerEntries as TypeJsonArray).map((item): TypeJsonObject => {
                  return toJsonObject({
                    geoviewLayerConfig,
                    schemaTag: CV_CONST_LAYER_TYPES.ESRI_FEATURE,
                    entryType: CV_CONST_SUB_LAYER_TYPES.VECTOR,
                    layerId: `${item.index}`,
                    source: {
                      format: 'EsriJSON',
                      dataAccessPath: createLocalizedString(url as string),
                    },
                  });
                })
              );
              listOfGeoviewLayerConfig.push(geoviewLayerConfig);
            }
          } else if (layerType === CV_CONST_LAYER_TYPES.ESRI_FEATURE) {
            const geoviewLayerConfig = MapFeaturesConfig.nodeFactory(
              toJsonObject({
                geoviewLayerId: `${id}`,
                geoviewLayerName: createLocalizedString(name as string),
                metadataAccessPath: createLocalizedString(url as string),
                geoviewLayerType: CV_CONST_LAYER_TYPES.ESRI_FEATURE,
                listOfLayerEntryConfig: [],
              })
            )!;
            geoviewLayerConfig.createListOfLayerEntryConfig(
              (layerEntries as TypeJsonArray).map((item): TypeJsonObject => {
                return toJsonObject({
                  geoviewLayerConfig,
                  schemaTag: CV_CONST_LAYER_TYPES.ESRI_FEATURE,
                  entryType: CV_CONST_SUB_LAYER_TYPES.VECTOR,
                  layerId: `${item.index}`,
                  source: {
                    format: 'EsriJSON',
                    dataAccessPath: createLocalizedString(url as string),
                  },
                });
              })
            );
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CV_CONST_LAYER_TYPES.WMS) {
            const geoviewLayerConfig = MapFeaturesConfig.nodeFactory(
              toJsonObject({
                geoviewLayerId: `${id}`,
                geoviewLayerName: createLocalizedString(name as string),
                metadataAccessPath: createLocalizedString(url as string),
                geoviewLayerType: CV_CONST_LAYER_TYPES.WMS,
                listOfLayerEntryConfig: [],
              })
            )!;
            geoviewLayerConfig.createListOfLayerEntryConfig(
              (layerEntries as TypeJsonArray).map((item): TypeJsonObject => {
                return toJsonObject({
                  geoviewLayerConfig,
                  schemaTag: CV_CONST_LAYER_TYPES.WMS,
                  entryType: CV_CONST_SUB_LAYER_TYPES.RASTER_IMAGE,
                  layerId: `${item.id}`,
                  source: {
                    dataAccessPath: createLocalizedString(url as string),
                    serverType: (serverType === undefined ? 'mapserver' : serverType) as TypeOfServer,
                  },
                });
              })
            );
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CV_CONST_LAYER_TYPES.WFS) {
            const geoviewLayerConfig = MapFeaturesConfig.nodeFactory(
              toJsonObject({
                geoviewLayerId: `${id}`,
                geoviewLayerName: createLocalizedString(name as string),
                metadataAccessPath: createLocalizedString(url as string),
                geoviewLayerType: CV_CONST_LAYER_TYPES.WFS,
                listOfLayerEntryConfig: [],
              })
            )!;
            geoviewLayerConfig.createListOfLayerEntryConfig(
              (layerEntries as TypeJsonArray).map((item): TypeJsonObject => {
                return toJsonObject({
                  geoviewLayerConfig,
                  schemaTag: CV_CONST_LAYER_TYPES.WFS,
                  entryType: CV_CONST_SUB_LAYER_TYPES.VECTOR,
                  layerId: `${item.id}`,
                  source: {
                    format: 'WFS',
                    strategy: 'all',
                    dataAccessPath: createLocalizedString(url as string),
                  },
                });
              })
            );
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CV_CONST_LAYER_TYPES.OGC_FEATURE) {
            const geoviewLayerConfig = MapFeaturesConfig.nodeFactory(
              toJsonObject({
                geoviewLayerId: `${id}`,
                geoviewLayerName: createLocalizedString(name as string),
                metadataAccessPath: createLocalizedString(url as string),
                geoviewLayerType: CV_CONST_LAYER_TYPES.OGC_FEATURE,
                listOfLayerEntryConfig: [],
              })
            )!;
            geoviewLayerConfig.createListOfLayerEntryConfig(
              (layerEntries as TypeJsonArray).map((item): TypeJsonObject => {
                return toJsonObject({
                  geoviewLayerConfig,
                  schemaTag: CV_CONST_LAYER_TYPES.OGC_FEATURE,
                  entryType: CV_CONST_SUB_LAYER_TYPES.VECTOR,
                  layerId: `${item.id}`,
                  source: {
                    format: 'featureAPI',
                    dataAccessPath: createLocalizedString(url as string),
                  },
                });
              })
            );
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CV_CONST_LAYER_TYPES.GEOJSON) {
            const geoviewLayerConfig = MapFeaturesConfig.nodeFactory(
              toJsonObject({
                geoviewLayerId: `${id}`,
                geoviewLayerName: createLocalizedString(name as string),
                metadataAccessPath: createLocalizedString(url as string),
                geoviewLayerType: CV_CONST_LAYER_TYPES.GEOJSON,
                listOfLayerEntryConfig: [],
              })
            )!;
            geoviewLayerConfig.createListOfLayerEntryConfig(
              (layerEntries as TypeJsonArray).map((item): TypeJsonObject => {
                return toJsonObject({
                  geoviewLayerConfig,
                  schemaTag: CV_CONST_LAYER_TYPES.GEOJSON,
                  entryType: CV_CONST_SUB_LAYER_TYPES.VECTOR,
                  layerId: `${item.id}`,
                  source: {
                    format: 'GeoJSON',
                    dataAccessPath: createLocalizedString(url as string),
                  },
                });
              })
            );
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CV_CONST_LAYER_TYPES.XYZ_TILES) {
            const geoviewLayerConfig = MapFeaturesConfig.nodeFactory(
              toJsonObject({
                geoviewLayerId: `${id}`,
                geoviewLayerName: createLocalizedString(name as string),
                metadataAccessPath: createLocalizedString(url as string),
                geoviewLayerType: CV_CONST_LAYER_TYPES.XYZ_TILES,
                listOfLayerEntryConfig: [],
              })
            )!;
            geoviewLayerConfig.createListOfLayerEntryConfig(
              (layerEntries as TypeJsonArray).map((item): TypeJsonObject => {
                return toJsonObject({
                  geoviewLayerConfig,
                  schemaTag: CV_CONST_LAYER_TYPES.XYZ_TILES,
                  entryType: CV_CONST_SUB_LAYER_TYPES.RASTER_TILE,
                  layerId: `${item.id}`,
                  source: {
                    dataAccessPath: createLocalizedString(url as string),
                  },
                });
              })
            );
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CV_CONST_LAYER_TYPES.VECTOR_TILES) {
            const geoviewLayerConfig = MapFeaturesConfig.nodeFactory(
              toJsonObject({
                geoviewLayerId: `${id}`,
                geoviewLayerName: createLocalizedString(name as string),
                metadataAccessPath: createLocalizedString(url as string),
                geoviewLayerType: CV_CONST_LAYER_TYPES.VECTOR_TILES,
                listOfLayerEntryConfig: [],
              })
            )!;
            geoviewLayerConfig.createListOfLayerEntryConfig(
              (layerEntries as TypeJsonArray).map((item): TypeJsonObject => {
                return toJsonObject({
                  schemaTag: CV_CONST_LAYER_TYPES.VECTOR_TILES,
                  entryType: CV_CONST_SUB_LAYER_TYPES.RASTER_TILE,
                  layerId: `${item.id}`,
                  tileGrid: item.tileGrid as unknown as TypeTileGrid,
                  source: {
                    dataAccessPath: createLocalizedString(url as string),
                  },
                });
              })
            );
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CV_CONST_LAYER_TYPES.GEOPACKAGE) {
            const geoviewLayerConfig = MapFeaturesConfig.nodeFactory(
              toJsonObject({
                geoviewLayerId: `${id}`,
                geoviewLayerName: createLocalizedString(name as string),
                metadataAccessPath: createLocalizedString(url as string),
                geoviewLayerType: CV_CONST_LAYER_TYPES.GEOPACKAGE,
                listOfLayerEntryConfig: [],
              })
            )!;
            geoviewLayerConfig.createListOfLayerEntryConfig(
              (layerEntries as TypeJsonArray).map((item): TypeJsonObject => {
                return toJsonObject({
                  geoviewLayerConfig,
                  schemaTag: CV_CONST_LAYER_TYPES.GEOPACKAGE,
                  entryType: CV_CONST_SUB_LAYER_TYPES.VECTOR,
                  layerId: `${item.id}`,
                  source: {
                    format: 'GeoPackage',
                    dataAccessPath: createLocalizedString(url as string),
                  },
                });
              })
            );
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CV_CONST_LAYER_TYPES.IMAGE_STATIC) {
            const geoviewLayerConfig = MapFeaturesConfig.nodeFactory(
              toJsonObject({
                geoviewLayerId: `${id}`,
                geoviewLayerName: createLocalizedString(name as string),
                metadataAccessPath: createLocalizedString(url as string),
                geoviewLayerType: CV_CONST_LAYER_TYPES.IMAGE_STATIC,
                listOfLayerEntryConfig: [],
              })
            )!;
            geoviewLayerConfig.createListOfLayerEntryConfig(
              (layerEntries as TypeJsonArray).map((item): TypeJsonObject => {
                return toJsonObject({
                  schemaTag: CV_CONST_LAYER_TYPES.IMAGE_STATIC,
                  entryType: CV_CONST_SUB_LAYER_TYPES.RASTER_IMAGE,
                  layerId: `${item.id}`,
                  source: {
                    dataAccessPath: createLocalizedString(url as string),
                  },
                });
              })
            );
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else {
            // Log
            logger.logWarning(`Layer type ${layerType} not supported`);
          }
        }
      }
    }
    return listOfGeoviewLayerConfig;
  }

  /**
   * Reads and parses GeoChart configs from uuid request result
   * @param {AxiosResponse<GeoChartGeoCoreConfig>} result the uuid request result
   * @param {string} lang the language to use to read results
   * @returns {GeoChartConfig[]} the list of GeoChart configs
   * @private
   */
  static getGeoChartConfigFromResponse(result: AxiosResponse<GeoChartGeoCoreConfig>, lang: string): GeoChartConfig[] {
    // If no geochart information
    if (!result?.data || !result.data.reponse || !result.data.reponse.gcs || !Array.isArray(result.data.reponse.gcs)) return [];

    // Find all Geochart configs
    const foundConfigs = result.data.reponse.gcs
      .map((gcs) => gcs?.[lang]?.packages?.geochart as GeoChartGeoCoreConfig)
      .filter((geochartValue) => !!geochartValue);

    // For each found config, parse
    const parsedConfigs: GeoChartConfig[] = [];
    foundConfigs.forEach((foundConfig) => {
      // Transform GeoChartGeoCoreConfig to GeoChartConfig
      parsedConfigs.push({ ...(foundConfig as object), layers: [foundConfig.layers] } as GeoChartConfig);
    });

    // Return all configs
    return parsedConfigs;
  }

  /**
   * Generates GeoView layers and package configurations (i.e. geochart), from GeoCore API, using a list of UUIDs.
   * @param {string} baseUrl the base url of GeoCore API
   * @param {string} lang the language to get the config for
   * @param {string[]} uuids a list of uuids to get the configurations for
   * @returns {Promise<UUIDmapConfigReaderResponse>} layers and geocharts read and parsed from uuids results from GeoCore
   */
  static async getGVConfigFromUUIDs(baseUrl: string, lang: string, uuids: string[]): Promise<UUIDmapConfigReaderResponse> {
    // Build the url
    const url = `${baseUrl}/vcs?lang=${lang}&id=${uuids.toString()}`;

    // Fetch the config
    const result = await axios.get<GeoChartGeoCoreConfig>(url);

    // Return the parsed response
    return {
      layers: this.#getLayerConfigFromResponse(result, lang),
      geocharts: this.getGeoChartConfigFromResponse(result, lang),
    };
  }
}
