import axios, { AxiosResponse } from 'axios';

import { TypeJsonObject, TypeJsonArray, Cast } from '@config/types/config-types';
import { CV_CONST_LAYER_TYPES, CV_CONST_SUB_LAYER_TYPES } from '@config/types/config-constants';
import { createLocalizedString } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';

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
   * @returns {TypeJsonObject[]} layers parsed from uuid result
   */
  static #getLayerConfigFromResponse(result: AxiosResponse<TypeJsonObject>, lang: string): TypeJsonObject[] {
    // If invalid response
    if (!result?.data || !result.data.reponse || !result.data.reponse.rcs || !result.data.reponse.rcs[lang])
      throw new Error('Invalid response from GeoCore service');
    if (result.data.reponse.rcs[lang].length === 0) throw new Error('No layers returned by GeoCore service');

    const listOfGeoviewLayerConfig: TypeJsonObject[] = [];
    for (let i = 0; i < (result.data.reponse.rcs[lang] as TypeJsonArray).length; i++) {
      const data = result.data.reponse.rcs[lang][i];

      if (data?.layers && (data.layers as TypeJsonArray).length > 0) {
        const layer = data.layers[0];

        if (layer) {
          const { layerType, layerEntries, name, url, id } = layer;

          const isFeature = (url as string).indexOf('FeatureServer') > -1;

          if (layerType === CV_CONST_LAYER_TYPES.ESRI_DYNAMIC && !isFeature) {
            const geoviewLayerConfig = Cast<TypeJsonObject>({
              geoviewLayerId: `${id}`,
              geoviewLayerName: createLocalizedString(name as string),
              isGeocore: true,
              metadataAccessPath: createLocalizedString(url as string),
              geoviewLayerType: CV_CONST_LAYER_TYPES.ESRI_DYNAMIC,
            });
            (geoviewLayerConfig.listOfLayerEntryConfig as TypeJsonObject[]) = (layerEntries as TypeJsonArray).map(
              (item): TypeJsonObject => {
                return Cast<TypeJsonObject>({
                  entryType: CV_CONST_SUB_LAYER_TYPES.RASTER_IMAGE,
                  layerId: `${item.index}`,
                });
              }
            );
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (isFeature) {
            let layerEntriesToUse = layerEntries as TypeJsonArray;
            let urlToUse = url as string;
            if (!layerEntries) {
              layerEntriesToUse = [{ index: (url as string).split('/').pop()! as TypeJsonObject }];
              urlToUse = (url as string).split('/').slice(0, -1).join('/');
            }

            for (let j = 0; j < (layerEntriesToUse as TypeJsonArray).length; j++) {
              const geoviewLayerConfig = Cast<TypeJsonObject>({
                geoviewLayerId: `${id}`,
                geoviewLayerName: createLocalizedString(name as string),
                isGeocore: true,
                metadataAccessPath: createLocalizedString(urlToUse as string),
                geoviewLayerType: CV_CONST_LAYER_TYPES.ESRI_FEATURE,
              });
              (geoviewLayerConfig.listOfLayerEntryConfig as TypeJsonObject[]) = (layerEntriesToUse as TypeJsonArray).map(
                (item): TypeJsonObject => {
                  return Cast<TypeJsonObject>({
                    entryType: CV_CONST_SUB_LAYER_TYPES.VECTOR,
                    layerId: `${item.index}`,
                  });
                }
              );
              listOfGeoviewLayerConfig.push(geoviewLayerConfig);
            }
          } else if (layerType === CV_CONST_LAYER_TYPES.ESRI_FEATURE) {
            const geoviewLayerConfig = Cast<TypeJsonObject>({
              geoviewLayerId: `${id}`,
              geoviewLayerName: createLocalizedString(name as string),
              isGeocore: true,
              metadataAccessPath: createLocalizedString(url as string),
              geoviewLayerType: CV_CONST_LAYER_TYPES.ESRI_FEATURE,
            });
            (geoviewLayerConfig.listOfLayerEntryConfig as TypeJsonObject[]) = (layerEntries as TypeJsonArray).map(
              (item): TypeJsonObject => {
                return Cast<TypeJsonObject>({
                  entryType: CV_CONST_SUB_LAYER_TYPES.VECTOR,
                  layerId: `${item.index}`,
                });
              }
            );
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CV_CONST_LAYER_TYPES.WMS) {
            const geoviewLayerConfig = Cast<TypeJsonObject>({
              geoviewLayerId: `${id}`,
              geoviewLayerName: createLocalizedString(name as string),
              metadataAccessPath: createLocalizedString(url as string),
              geoviewLayerType: CV_CONST_LAYER_TYPES.WMS,
            });
            (geoviewLayerConfig.listOfLayerEntryConfig as TypeJsonObject[]) = (layerEntries as TypeJsonArray).map(
              (item): TypeJsonObject => {
                return Cast<TypeJsonObject>({
                  entryType: CV_CONST_SUB_LAYER_TYPES.VECTOR,
                  layerId: `${item.id}`,
                });
              }
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

  // TODO: Check - Commented out as not called anymore by method `getGVConfigFromUUIDs`, but maybe it should still?
  // /**
  //  * Reads and parses GeoChart configs from uuid request result
  //  * @param {AxiosResponse<GeoChartGeoCoreConfig>} result the uuid request result
  //  * @param {string} lang the language to use to read results
  //  * @returns {GeoChartConfig[]} the list of GeoChart configs
  //  * @private
  //  */
  // static #getGeoChartConfigFromResponse(result: AxiosResponse<GeoChartGeoCoreConfig>, lang: string): GeoChartConfig[] {
  //   // If no geochart information
  //   if (!result?.data || !result.data.reponse || !result.data.reponse.gcs || !Array.isArray(result.data.reponse.gcs)) return [];

  //   // Find all Geochart configs
  //   const foundConfigs = result.data.reponse.gcs
  //     .map((gcs) => gcs?.[lang]?.packages?.geochart as GeoChartGeoCoreConfig)
  //     .filter((geochartValue) => !!geochartValue);

  //   // For each found config, parse
  //   const parsedConfigs: GeoChartConfig[] = [];
  //   foundConfigs.forEach((foundConfig) => {
  //     // Transform GeoChartGeoCoreConfig to GeoChartConfig
  //     parsedConfigs.push({ ...(foundConfig as object), layers: [foundConfig.layers] } as GeoChartConfig);
  //   });

  //   // Return all configs
  //   return parsedConfigs;
  // }

  /**
   * Generates GeoView layers and package configurations (i.e. geochart), from GeoCore API, using a list of UUIDs.
   * @param {string} baseUrl the base url of GeoCore API
   * @param {string} lang the language to get the config for
   * @param {string[]} uuids a list of uuids to get the configurations for
   * @returns {Promise<UUIDmapConfigReaderResponse>} layers and geocharts read and parsed from uuids results from GeoCore
   */
  static async getGVConfigFromUUIDs(baseUrl: string, lang: string, uuids: string[]): Promise<TypeJsonObject[]> {
    // Build the url
    const url = `${baseUrl}/vcs?lang=${lang}&id=${uuids.toString()}`;

    // Fetch the config
    const result = await axios.get<GeoChartGeoCoreConfig>(url);

    // Return the parsed response
    return this.#getLayerConfigFromResponse(result, lang);
  }
}
