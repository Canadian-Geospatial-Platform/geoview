import axios, { AxiosResponse } from 'axios';

import { TypeJsonObject, TypeJsonArray, TypeJsonValue } from '../../../types/global-types';

import { TypeListOfGeoviewLayerConfig, TypeOfServer } from '../../../../geo/map/map-schema-types';
import { CONST_LAYER_TYPES } from '../../../../geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeEsriDynamicLayerConfig, TypeEsriDynamicLayerEntryConfig } from '../../../../geo/layer/geoview-layers/raster/esri-dynamic';
import { TypeEsriFeatureLayerConfig, TypeEsriFeatureLayerEntryConfig } from '../../../../geo/layer/geoview-layers/vector/esri-feature';
import { TypeWMSLayerConfig, TypeWmsLayerEntryConfig } from '../../../../geo/layer/geoview-layers/raster/wms';
import { TypeWFSLayerConfig, TypeWFSLayerEntryConfig } from '../../../../geo/layer/geoview-layers/vector/wfs';
import { TypeOgcFeatureLayerConfig, TypeOgcFeatureLayerEntryConfig } from '../../../../geo/layer/geoview-layers/vector/ogc-feature';
import { TypeGeoJSONLayerConfig, TypeGeoJSONLayerEntryConfig } from '../../../../geo/layer/geoview-layers/vector/geojson';
import { TypeXYZTilesConfig, TypeXYZTilesLayerEntryConfig } from '../../../../geo/layer/geoview-layers/raster/xyz-tiles';
import { api } from '../../../../app';
import { EVENT_NAMES } from '../../../../api/events/event-types';
import { snackbarMessagePayload } from '../../../../api/events/payloads/snackbar-message-payload';

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** *****************************************************************************************************************************
 * A class to generate GeoView layers config from a URL using a UUID.
 * @exports
 * @class UUIDmapConfigReader
 */
// ******************************************************************************************************************************
export class UUIDmapConfigReader {
  /** ***************************************************************************************************************************
   * Generate layer configs from uuid request result
   *
   * @param {TypeJsonObject} result the uuid request result
   * @returns {TypeListOfGeoviewLayerConfig} layers parsed from uuid result
   */
  private static getLayerConfigFromResponse(result: AxiosResponse<TypeJsonObject>): TypeListOfGeoviewLayerConfig {
    const listOfGeoviewLayerConfig: TypeListOfGeoviewLayerConfig = [];

    if (result && result.data) {
      for (let i = 0; i < result.data.length; i++) {
        const data = result.data[i];

        if (data && data.layers && data.layers.length > 0) {
          const layer = data.layers[0];

          if (layer) {
            const { geoviewLayerType, listOfLayerEntryConfig, name, url, id, serverType } = layer;

            const isFeature = (url as string).indexOf('FeatureServer') > -1;

            if (geoviewLayerType === CONST_LAYER_TYPES.ESRI_DYNAMIC && !isFeature) {
              const layerConfig: TypeEsriDynamicLayerConfig = {
                layerId: id as string,
                name: {
                  en: name as string,
                  fr: name as string,
                },
                metadataAccessPath: {
                  en: url as string,
                  fr: url as string,
                },
                geoviewLayerType: 'esriDynamic',
                listOfLayerEntryConfig: (listOfLayerEntryConfig as TypeJsonArray).map((item): TypeEsriDynamicLayerEntryConfig => {
                  return {
                    entryType: 'raster',
                    layerId: item.index as string,
                    source: {
                      dataAccessPath: {
                        en: url as string,
                        fr: url as string,
                      },
                    },
                  };
                }),
              };
              listOfGeoviewLayerConfig.push(layerConfig);
            } else if (isFeature) {
              for (let j = 0; j < listOfLayerEntryConfig.length; j++) {
                const featureUrl = `${url}/${listOfLayerEntryConfig[j].index}`;
                const layerConfig: TypeEsriFeatureLayerConfig = {
                  layerId: id as string,
                  name: {
                    en: name as string,
                    fr: name as string,
                  },
                  metadataAccessPath: {
                    en: featureUrl,
                    fr: featureUrl,
                  },
                  geoviewLayerType: 'esriFeature',
                  listOfLayerEntryConfig: (listOfLayerEntryConfig as TypeJsonArray).map((item): TypeEsriFeatureLayerEntryConfig => {
                    return {
                      entryType: 'vector',
                      layerId: item.index as string,
                      source: {
                        format: 'EsriJSON',
                        dataAccessPath: {
                          en: url as string,
                          fr: url as string,
                        },
                      },
                    };
                  }),
                };
                listOfGeoviewLayerConfig.push(layerConfig);
              }
            } else if (geoviewLayerType === CONST_LAYER_TYPES.ESRI_FEATURE) {
              const layerConfig: TypeEsriFeatureLayerConfig = {
                layerId: id as string,
                name: {
                  en: name as string,
                  fr: name as string,
                },
                metadataAccessPath: {
                  en: url as string,
                  fr: url as string,
                },
                geoviewLayerType: 'esriFeature',
                listOfLayerEntryConfig: (listOfLayerEntryConfig as TypeJsonArray).map((item): TypeEsriFeatureLayerEntryConfig => {
                  return {
                    entryType: 'vector',
                    layerId: item.index as string,
                    source: {
                      format: 'EsriJSON',
                      dataAccessPath: {
                        en: url as string,
                        fr: url as string,
                      },
                    },
                  };
                }),
              };
              listOfGeoviewLayerConfig.push(layerConfig);
            } else if (geoviewLayerType === CONST_LAYER_TYPES.WMS) {
              const layerConfig: TypeWMSLayerConfig = {
                layerId: id as string,
                name: {
                  en: name as string,
                  fr: name as string,
                },
                metadataAccessPath: {
                  en: url as string,
                  fr: url as string,
                },
                geoviewLayerType: 'ogcWms',
                listOfLayerEntryConfig: (listOfLayerEntryConfig as TypeJsonArray).map((item): TypeWmsLayerEntryConfig => {
                  return {
                    entryType: 'raster',
                    layerId: item.id as string,
                    source: {
                      dataAccessPath: {
                        en: url as string,
                        fr: url as string,
                      },
                      serverType: (typeof serverType === 'undefined' ? 'mapserver' : serverType) as TypeOfServer,
                    },
                  };
                }),
              };
              listOfGeoviewLayerConfig.push(layerConfig);
            } else if (geoviewLayerType === CONST_LAYER_TYPES.WFS) {
              const layerConfig: TypeWFSLayerConfig = {
                layerId: id as string,
                name: {
                  en: name as string,
                  fr: name as string,
                },
                metadataAccessPath: {
                  en: url as string,
                  fr: url as string,
                },
                geoviewLayerType: 'ogcWfs',
                listOfLayerEntryConfig: (listOfLayerEntryConfig as TypeJsonArray).map((item): TypeWFSLayerEntryConfig => {
                  return {
                    entryType: 'vector',
                    layerId: item.id as string,
                    source: {
                      format: 'WFS',
                      dataAccessPath: {
                        en: url as string,
                        fr: url as string,
                      },
                    },
                  };
                }),
              };
              listOfGeoviewLayerConfig.push(layerConfig);
            } else if (geoviewLayerType === CONST_LAYER_TYPES.OGC_FEATURE) {
              const layerConfig: TypeOgcFeatureLayerConfig = {
                layerId: id as string,
                name: {
                  en: name as string,
                  fr: name as string,
                },
                metadataAccessPath: {
                  en: url as string,
                  fr: url as string,
                },
                geoviewLayerType: 'ogcFeature',
                listOfLayerEntryConfig: (listOfLayerEntryConfig as TypeJsonArray).map((item): TypeOgcFeatureLayerEntryConfig => {
                  return {
                    entryType: 'vector',
                    layerId: item.id as string,
                    source: {
                      format: 'featureAPI',
                      dataAccessPath: {
                        en: url as string,
                        fr: url as string,
                      },
                    },
                  };
                }),
              };
              listOfGeoviewLayerConfig.push(layerConfig);
            } else if (geoviewLayerType === CONST_LAYER_TYPES.GEOJSON) {
              const layerConfig: TypeGeoJSONLayerConfig = {
                layerId: id as string,
                name: {
                  en: name as string,
                  fr: name as string,
                },
                metadataAccessPath: {
                  en: url as string,
                  fr: url as string,
                },
                geoviewLayerType: 'GeoJSON',
                listOfLayerEntryConfig: (listOfLayerEntryConfig as TypeJsonArray).map((item): TypeGeoJSONLayerEntryConfig => {
                  return {
                    entryType: 'vector',
                    layerId: item.id as string,
                    source: {
                      format: 'GeoJSON',
                      dataAccessPath: {
                        en: url as string,
                        fr: url as string,
                      },
                    },
                  };
                }),
              };
              listOfGeoviewLayerConfig.push(layerConfig);
            } else if (geoviewLayerType === CONST_LAYER_TYPES.XYZ_TILES) {
              const layerConfig: TypeXYZTilesConfig = {
                layerId: id as string,
                name: {
                  en: name as string,
                  fr: name as string,
                },
                metadataAccessPath: {
                  en: url as string,
                  fr: url as string,
                },
                geoviewLayerType: 'xyzTiles',
                listOfLayerEntryConfig: (listOfLayerEntryConfig as TypeJsonArray).map((item): TypeXYZTilesLayerEntryConfig => {
                  return {
                    entryType: 'raster',
                    layerId: item.id as string,
                    source: {
                      dataAccessPath: {
                        en: url as string,
                        fr: url as string,
                      },
                    },
                  };
                }),
              };
              listOfGeoviewLayerConfig.push(layerConfig);
            }
          }
        }
      }
    }

    return listOfGeoviewLayerConfig;
  }

  /** ***************************************************************************************************************************
   * Generate GeoView layers config from a URL using a UUID.
   * @param {string} mapId the ID of the map.
   * @param {string} requestUrl the URL to request result
   * @param {Element} mapElement the map element
   *
   * @returns {Promise<TypeGeoviewLayerConfig>} layers parsed from uuid result
   */
  static async getGVlayersConfigFromUUID(mapId: string, requestUrl: string): Promise<TypeListOfGeoviewLayerConfig> {
    try {
      const result = await axios.get<TypeJsonObject>(requestUrl);

      return this.getLayerConfigFromResponse(result);
    } catch (error: unknown) {
      api.event.emit(
        snackbarMessagePayload(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, mapId, {
          type: 'key',
          value: 'validation.layer.loadfailed',
          params: [error as TypeJsonValue, mapId],
        })
      );
    }
    return [];
  }
}
