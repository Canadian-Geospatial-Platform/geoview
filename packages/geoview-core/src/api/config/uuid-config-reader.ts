import axios, { AxiosResponse } from 'axios';

import { TypeJsonObject, TypeJsonArray, toJsonObject } from '@/api/config/types/config-types';
import { CV_CONST_LAYER_TYPES } from '@/api/config/types/config-constants';
import { deepMergeObjects } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';

// The GeoChart Json object coming out of the GeoCore response
export type GeoChartGeoCoreConfig = TypeJsonObject & {
  layers: {
    layerId: string;
  };
}; // TypeJsonObject, because the definition is in the external package

// #region GeoChart type

// The GeoChart Json object expected by GeoView
export type GeoChartConfig = TypeJsonObject & {
  layers: [
    {
      layerId: string;
    },
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
   *
   * @param {AxiosResponse<TypeJsonObject>} result the uuid request result
   * @param {string} lang the language to use
   *
   * @returns {TypeJsonObject[]} layers parsed from uuid result
   * @static @private
   */
  static #getLayerConfigFromResponse(result: AxiosResponse<TypeJsonObject>, lang: string): TypeJsonObject[] {
    // If invalid response
    if (!result?.data || !result.data.response || !result.data.response.rcs || !result.data.response.rcs[lang]) {
      const errorMessage = result?.data?.errorMessage || '';
      throw new Error(`Invalid response from GeoCore service\n${errorMessage}\n`);
    }
    if (result.data.response.rcs[lang].length === 0) throw new Error('No layers returned by GeoCore service');

    const listOfGeoviewLayerConfig: TypeJsonObject[] = [];
    for (let i = 0; i < (result.data.response.rcs[lang] as TypeJsonArray).length; i++) {
      const data = result.data.response.rcs[lang][i];

      if (data?.layers && (data.layers as TypeJsonArray).length > 0) {
        const layer = data.layers[0];

        if (layer) {
          const { layerType, layerEntries, name, url, id, serverType, isTimeAware } = layer;

          // Get Geocore custom config layer entries values
          // TODO: The proof of concept is done only for WMS layers. We need to implement other layer types after the refactor
          // TO.DOCONT: We need to support config for the geoviewLAyer and children layer entries...
          const customGeocoreLayerConfig = this.#getGeocoreCustomLayerConfig(result, lang);

          const isFeature = (url as string).indexOf('FeatureServer') > -1;

          // TODO: Simplify this wherever possible
          if (layerType === CV_CONST_LAYER_TYPES.ESRI_DYNAMIC && !isFeature) {
            const geoviewLayerConfig = toJsonObject({
              geoviewLayerId: `${id}`,
              geoviewLayerName: name,
              metadataAccessPath: url,
              geoviewLayerType: CV_CONST_LAYER_TYPES.ESRI_DYNAMIC,
              isGeocore: true,
              isTimeAware,
            });
            (geoviewLayerConfig.listOfLayerEntryConfig as TypeJsonObject[]) = (layerEntries as TypeJsonArray).map(
              (item): TypeJsonObject => {
                return toJsonObject({
                  layerId: `${item.index}`,
                });
              }
            );
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (isFeature) {
            // GV: esriFeature layers as they are returned by RCS don't have a layerEntries property. It is undefined.
            // GV: Everything needed to create the geoview layer is in the URL.
            // GV: The geoview layer created contains only one layer entry config in the list.
            const serviceUrl = (url as string).split('/').slice(0, -1).join('/');
            const layerId = (url as string).split('/').pop();

            const geoviewLayerConfig = toJsonObject({
              geoviewLayerId: `${id}`,
              geoviewLayerName: name,
              metadataAccessPath: serviceUrl,
              geoviewLayerType: CV_CONST_LAYER_TYPES.ESRI_FEATURE,
              isGeocore: true,
              isTimeAware,
            });
            (geoviewLayerConfig.listOfLayerEntryConfig as TypeJsonObject[]) = [
              toJsonObject({
                layerId,
              }),
            ];
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CV_CONST_LAYER_TYPES.ESRI_FEATURE) {
            const geoviewLayerConfig = toJsonObject({
              geoviewLayerId: `${id}`,
              geoviewLayerName: name,
              metadataAccessPath: url,
              geoviewLayerType: CV_CONST_LAYER_TYPES.ESRI_FEATURE,
              isGeocore: true,
              isTimeAware,
            });
            (geoviewLayerConfig.listOfLayerEntryConfig as TypeJsonObject[]) = (layerEntries as TypeJsonArray).map(
              (item): TypeJsonObject => {
                return toJsonObject({
                  layerId: `${item.index}`,
                });
              }
            );
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CV_CONST_LAYER_TYPES.WMS) {
            const geoviewLayerConfig = toJsonObject({
              geoviewLayerId: `${id}`,
              geoviewLayerName: name,
              metadataAccessPath: url,
              geoviewLayerType: CV_CONST_LAYER_TYPES.WMS,
              isGeocore: true,
              isTimeAware,
            });
            (geoviewLayerConfig.listOfLayerEntryConfig as TypeJsonObject[]) = (layerEntries as TypeJsonArray).map(
              (item): TypeJsonObject => {
                const originalConfig = {
                  layerId: `${item.id}`,
                  source: {
                    serverType: serverType === undefined ? 'mapserver' : serverType,
                  },
                };

                // Overwrite default from geocore custom config
                const mergedConfig = deepMergeObjects(
                  originalConfig as unknown as TypeJsonObject,
                  customGeocoreLayerConfig as unknown as TypeJsonObject
                );

                return mergedConfig;
              }
            );
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CV_CONST_LAYER_TYPES.WFS) {
            const geoviewLayerConfig = toJsonObject({
              geoviewLayerId: `${id}`,
              geoviewLayerName: name,
              metadataAccessPath: url,
              geoviewLayerType: CV_CONST_LAYER_TYPES.WFS,
              isGeocore: true,
              isTimeAware,
            });
            (geoviewLayerConfig.listOfLayerEntryConfig as TypeJsonObject[]) = (layerEntries as TypeJsonArray).map(
              (item): TypeJsonObject => {
                return toJsonObject({
                  layerId: `${item.id}`,
                  source: {
                    format: 'WFS',
                    strategy: 'all',
                  },
                });
              }
            );
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CV_CONST_LAYER_TYPES.OGC_FEATURE) {
            const geoviewLayerConfig = toJsonObject({
              geoviewLayerId: `${id}`,
              geoviewLayerName: name,
              metadataAccessPath: url,
              geoviewLayerType: CV_CONST_LAYER_TYPES.OGC_FEATURE,
              isGeocore: true,
              isTimeAware,
            });
            (geoviewLayerConfig.listOfLayerEntryConfig as TypeJsonObject[]) = (layerEntries as TypeJsonArray).map(
              (item): TypeJsonObject => {
                return toJsonObject({
                  layerId: `${item.id}`,
                  source: {
                    format: 'featureAPI',
                  },
                });
              }
            );
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CV_CONST_LAYER_TYPES.GEOJSON) {
            const geoviewLayerConfig = toJsonObject({
              geoviewLayerId: `${id}`,
              geoviewLayerName: name,
              metadataAccessPath: url,
              geoviewLayerType: CV_CONST_LAYER_TYPES.GEOJSON,
              isGeocore: true,
              isTimeAware,
            });
            (geoviewLayerConfig.listOfLayerEntryConfig as TypeJsonObject[]) = (layerEntries as TypeJsonArray).map(
              (item): TypeJsonObject => {
                return toJsonObject({
                  layerId: `${item.id}`,
                  source: {
                    format: 'GeoJSON',
                  },
                });
              }
            );
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CV_CONST_LAYER_TYPES.XYZ_TILES) {
            const geoviewLayerConfig = toJsonObject({
              geoviewLayerId: `${id}`,
              geoviewLayerName: name,
              metadataAccessPath: url,
              geoviewLayerType: CV_CONST_LAYER_TYPES.XYZ_TILES,
              isGeocore: true,
              isTimeAware,
            });
            (geoviewLayerConfig.listOfLayerEntryConfig as TypeJsonObject[]) = (layerEntries as TypeJsonArray).map(
              (item): TypeJsonObject => {
                return toJsonObject({
                  layerId: `${item.id}`,
                });
              }
            );
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CV_CONST_LAYER_TYPES.VECTOR_TILES) {
            const geoviewLayerConfig = toJsonObject({
              geoviewLayerId: `${id}`,
              geoviewLayerName: name,
              metadataAccessPath: url,
              geoviewLayerType: CV_CONST_LAYER_TYPES.VECTOR_TILES,
              isGeocore: true,
              isTimeAware,
            });
            (geoviewLayerConfig.listOfLayerEntryConfig as TypeJsonObject[]) = (layerEntries as TypeJsonArray).map(
              (item): TypeJsonObject => {
                return toJsonObject({
                  layerId: `${item.id}`,
                  tileGrid: item.tileGrid,
                  source: {
                    dataAccessPath: url,
                  },
                });
              }
            );
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CV_CONST_LAYER_TYPES.GEOPACKAGE) {
            const geoviewLayerConfig = toJsonObject({
              geoviewLayerId: `${id}`,
              geoviewLayerName: name,
              metadataAccessPath: url,
              geoviewLayerType: CV_CONST_LAYER_TYPES.GEOPACKAGE,
              isGeocore: true,
              isTimeAware,
            });
            (geoviewLayerConfig.listOfLayerEntryConfig as TypeJsonObject[]) = (layerEntries as TypeJsonArray).map(
              (item): TypeJsonObject => {
                return toJsonObject({
                  layerId: `${item.id}`,
                  source: {
                    format: 'GeoPackage',
                  },
                });
              }
            );
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CV_CONST_LAYER_TYPES.IMAGE_STATIC) {
            const geoviewLayerConfig = toJsonObject({
              geoviewLayerId: `${id}`,
              geoviewLayerName: name,
              metadataAccessPath: url,
              geoviewLayerType: CV_CONST_LAYER_TYPES.IMAGE_STATIC,
              isTimeAware,
            });
            (geoviewLayerConfig.listOfLayerEntryConfig as TypeJsonObject[]) = (layerEntries as TypeJsonArray).map(
              (item): TypeJsonObject => {
                return toJsonObject({
                  layerId: `${item.id}`,
                });
              }
            );
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CV_CONST_LAYER_TYPES.ESRI_IMAGE) {
            // GV: ESRI Image layers as they are returned by RCS don't have a layerEntries property. It is undefined.
            // GV: Everything needed to create the geoview layer is in the URL. The layerId of the layerEntryConfig is not used,
            // GV: but we need to create a layerEntryConfig in the list for the layer to be displayed.
            const geoviewLayerConfig = toJsonObject({
              geoviewLayerId: `${id}`,
              geoviewLayerName: name,
              metadataAccessPath: url,
              geoviewLayerType: CV_CONST_LAYER_TYPES.ESRI_IMAGE,
              isGeocore: true,
              isTimeAware,
            });
            (geoviewLayerConfig.listOfLayerEntryConfig as TypeJsonObject[]) = [
              toJsonObject({
                layerId: (url as string).split('/').slice(-2, -1)[0],
              }),
            ];
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
   * Reads the layers config from uuid request result
   * @param {AxiosResponse<GeoChartGeoCoreConfig>} result - the uuid request result
   * @param {string} lang - the language to use to read results
   * @returns {TypeJsonObject} the layers snippet configs
   * @private
   */
  static #getGeocoreCustomLayerConfig(result: AxiosResponse<TypeJsonObject>, lang: string): TypeJsonObject {
    // If no custon geocore information
    if (!result?.data || !result.data.response || !result.data.response.gcs || !Array.isArray(result.data.response.gcs)) return {};

    // TODO: Once refactor done rename to layers
    // TODO: Before moving to the new api, layers will need to link to ids inside the gsc response so we can customize group, or specific id
    // Find custom layer entry configuration
    const foundConfigs = result.data.response.gcs.map((gcs) => gcs?.[lang]?.layersNew as TypeJsonObject);

    return foundConfigs[0] || {};
  }

  // GV This is important, it sets the geochart config, we need to relink
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
