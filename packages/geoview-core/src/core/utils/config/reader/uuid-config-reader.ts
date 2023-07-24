import axios, { AxiosResponse } from 'axios';

import { TypeJsonObject, TypeJsonArray, TypeJsonValue } from '../../../types/global-types';

import {
  TypeEsriDynamicLayerEntryConfig,
  TypeImageStaticLayerEntryConfig,
  TypeListOfGeoviewLayerConfig,
  TypeOfServer,
  TypeOgcWmsLayerEntryConfig,
  TypeTileGrid,
} from '@/geo/map/map-schema-types';
import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeEsriDynamicLayerConfig } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { TypeEsriFeatureLayerConfig, TypeEsriFeatureLayerEntryConfig } from '@/geo/layer/geoview-layers/vector/esri-feature';
import { TypeImageStaticLayerConfig } from '@/geo/layer/geoview-layers/raster/image-static';
import { TypeWMSLayerConfig } from '@/geo/layer/geoview-layers/raster/wms';
import { TypeWFSLayerConfig, TypeWfsLayerEntryConfig } from '@/geo/layer/geoview-layers/vector/wfs';
import { TypeOgcFeatureLayerConfig, TypeOgcFeatureLayerEntryConfig } from '@/geo/layer/geoview-layers/vector/ogc-feature';
import { TypeGeoJSONLayerConfig, TypeGeoJSONLayerEntryConfig } from '@/geo/layer/geoview-layers/vector/geojson';
import { TypeGeoPackageLayerConfig, TypeGeoPackageLayerEntryConfig } from '@/geo/layer/geoview-layers/vector/geopackage';
import { TypeXYZTilesConfig, TypeXYZTilesLayerEntryConfig } from '@/geo/layer/geoview-layers/raster/xyz-tiles';
import { TypeVectorTilesConfig, TypeVectorTilesLayerEntryConfig } from '@/geo/layer/geoview-layers/raster/vector-tiles';
import { api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';
import { snackbarMessagePayload } from '@/api/events/payloads/snackbar-message-payload';

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

    if (result?.data) {
      for (let i = 0; i < (result.data as TypeJsonArray).length; i++) {
        const data = result.data[i];

        if (data?.layers && (data.layers as TypeJsonArray).length > 0) {
          const layer = data.layers[0];

          if (layer) {
            const { layerType, layerEntries, name, url, id, serverType } = layer;

            const isFeature = (url as string).indexOf('FeatureServer') > -1;

            if (layerType === CONST_LAYER_TYPES.ESRI_DYNAMIC && !isFeature) {
              const layerConfig: TypeEsriDynamicLayerConfig = {
                geoviewLayerId: `${id}`,
                geoviewLayerName: {
                  en: name as string,
                  fr: name as string,
                },
                metadataAccessPath: {
                  en: url as string,
                  fr: url as string,
                },
                geoviewLayerType: 'esriDynamic',
                listOfLayerEntryConfig: (layerEntries as TypeJsonArray).map((item): TypeEsriDynamicLayerEntryConfig => {
                  const esriDynamicLayerEntryConfig: TypeEsriDynamicLayerEntryConfig = {
                    schemaTag: 'esriDynamic',
                    entryType: 'raster-image',
                    layerId: `${item.index}`,
                    source: {
                      dataAccessPath: {
                        en: url as string,
                        fr: url as string,
                      },
                    },
                  };
                  return esriDynamicLayerEntryConfig;
                }),
              };
              listOfGeoviewLayerConfig.push(layerConfig);
            } else if (isFeature) {
              for (let j = 0; j < (layerEntries as TypeJsonArray).length; j++) {
                const featureUrl = `${url}/${layerEntries[j].index}`;
                const layerConfig: TypeEsriFeatureLayerConfig = {
                  geoviewLayerId: `${id}`,
                  geoviewLayerName: {
                    en: name as string,
                    fr: name as string,
                  },
                  metadataAccessPath: {
                    en: featureUrl,
                    fr: featureUrl,
                  },
                  geoviewLayerType: 'esriFeature',
                  listOfLayerEntryConfig: (layerEntries as TypeJsonArray).map((item): TypeEsriFeatureLayerEntryConfig => {
                    const esriFeatureLayerEntryConfig: TypeEsriFeatureLayerEntryConfig = {
                      schemaTag: 'esriFeature',
                      entryType: 'vector',
                      layerId: `${item.index}`,
                      source: {
                        format: 'EsriJSON',
                        dataAccessPath: {
                          en: url as string,
                          fr: url as string,
                        },
                      },
                    };
                    return esriFeatureLayerEntryConfig;
                  }),
                };
                listOfGeoviewLayerConfig.push(layerConfig);
              }
            } else if (layerType === CONST_LAYER_TYPES.ESRI_FEATURE) {
              const layerConfig: TypeEsriFeatureLayerConfig = {
                geoviewLayerId: `${id}`,
                geoviewLayerName: {
                  en: name as string,
                  fr: name as string,
                },
                metadataAccessPath: {
                  en: url as string,
                  fr: url as string,
                },
                geoviewLayerType: 'esriFeature',
                listOfLayerEntryConfig: (layerEntries as TypeJsonArray).map((item): TypeEsriFeatureLayerEntryConfig => {
                  const esriFeatureLayerEntryConfig: TypeEsriFeatureLayerEntryConfig = {
                    schemaTag: 'esriFeature',
                    entryType: 'vector',
                    layerId: `${item.index}`,
                    source: {
                      format: 'EsriJSON',
                      dataAccessPath: {
                        en: url as string,
                        fr: url as string,
                      },
                    },
                  };
                  return esriFeatureLayerEntryConfig;
                }),
              };
              listOfGeoviewLayerConfig.push(layerConfig);
            } else if (layerType === CONST_LAYER_TYPES.WMS) {
              const layerConfig: TypeWMSLayerConfig = {
                geoviewLayerId: `${id}`,
                geoviewLayerName: {
                  en: name as string,
                  fr: name as string,
                },
                metadataAccessPath: {
                  en: url as string,
                  fr: url as string,
                },
                geoviewLayerType: 'ogcWms',
                listOfLayerEntryConfig: (layerEntries as TypeJsonArray).map((item): TypeOgcWmsLayerEntryConfig => {
                  const wmsLayerEntryConfig: TypeOgcWmsLayerEntryConfig = {
                    schemaTag: 'ogcWms',
                    entryType: 'raster-image',
                    layerId: `${item.id}`,
                    source: {
                      dataAccessPath: {
                        en: url as string,
                        fr: url as string,
                      },
                      serverType: (serverType === undefined ? 'mapserver' : serverType) as TypeOfServer,
                    },
                  };
                  return wmsLayerEntryConfig;
                }),
              };
              listOfGeoviewLayerConfig.push(layerConfig);
            } else if (layerType === CONST_LAYER_TYPES.WFS) {
              const layerConfig: TypeWFSLayerConfig = {
                geoviewLayerId: `${id}`,
                geoviewLayerName: {
                  en: name as string,
                  fr: name as string,
                },
                metadataAccessPath: {
                  en: url as string,
                  fr: url as string,
                },
                geoviewLayerType: 'ogcWfs',
                listOfLayerEntryConfig: (layerEntries as TypeJsonArray).map((item): TypeWfsLayerEntryConfig => {
                  const wfsLayerEntryConfig: TypeWfsLayerEntryConfig = {
                    schemaTag: 'ogcWfs',
                    entryType: 'vector',
                    layerId: `${item.id}`,
                    source: {
                      format: 'WFS',
                      strategy: 'all',
                      dataAccessPath: {
                        en: url as string,
                        fr: url as string,
                      },
                    },
                  };
                  return wfsLayerEntryConfig;
                }),
              };
              listOfGeoviewLayerConfig.push(layerConfig);
            } else if (layerType === CONST_LAYER_TYPES.OGC_FEATURE) {
              const layerConfig: TypeOgcFeatureLayerConfig = {
                geoviewLayerId: `${id}`,
                geoviewLayerName: {
                  en: name as string,
                  fr: name as string,
                },
                metadataAccessPath: {
                  en: url as string,
                  fr: url as string,
                },
                geoviewLayerType: 'ogcFeature',
                listOfLayerEntryConfig: (layerEntries as TypeJsonArray).map((item): TypeOgcFeatureLayerEntryConfig => {
                  const ogcFeatureLayerEntryConfig: TypeOgcFeatureLayerEntryConfig = {
                    schemaTag: 'ogcFeature',
                    entryType: 'vector',
                    layerId: `${item.id}`,
                    source: {
                      format: 'featureAPI',
                      dataAccessPath: {
                        en: url as string,
                        fr: url as string,
                      },
                    },
                  };
                  return ogcFeatureLayerEntryConfig;
                }),
              };
              listOfGeoviewLayerConfig.push(layerConfig);
            } else if (layerType === CONST_LAYER_TYPES.GEOJSON) {
              const layerConfig: TypeGeoJSONLayerConfig = {
                geoviewLayerId: `${id}`,
                geoviewLayerName: {
                  en: name as string,
                  fr: name as string,
                },
                metadataAccessPath: {
                  en: url as string,
                  fr: url as string,
                },
                geoviewLayerType: 'GeoJSON',
                listOfLayerEntryConfig: (layerEntries as TypeJsonArray).map((item): TypeGeoJSONLayerEntryConfig => {
                  const geoJSONLayerEntryConfig: TypeGeoJSONLayerEntryConfig = {
                    schemaTag: 'GeoJSON',
                    entryType: 'vector',
                    layerId: `${item.id}`,
                    source: {
                      format: 'GeoJSON',
                      dataAccessPath: {
                        en: url as string,
                        fr: url as string,
                      },
                    },
                  };
                  return geoJSONLayerEntryConfig;
                }),
              };
              listOfGeoviewLayerConfig.push(layerConfig);
            } else if (layerType === CONST_LAYER_TYPES.XYZ_TILES) {
              const layerConfig: TypeXYZTilesConfig = {
                geoviewLayerId: `${id}`,
                geoviewLayerName: {
                  en: name as string,
                  fr: name as string,
                },
                metadataAccessPath: {
                  en: url as string,
                  fr: url as string,
                },
                geoviewLayerType: 'xyzTiles',
                listOfLayerEntryConfig: (layerEntries as TypeJsonArray).map((item): TypeXYZTilesLayerEntryConfig => {
                  const xyzTilesLayerEntryConfig: TypeXYZTilesLayerEntryConfig = {
                    schemaTag: 'xyzTiles',
                    entryType: 'raster-tile',
                    layerId: `${item.id}`,
                    source: {
                      dataAccessPath: {
                        en: url as string,
                        fr: url as string,
                      },
                    },
                  };
                  return xyzTilesLayerEntryConfig;
                }),
              };
              listOfGeoviewLayerConfig.push(layerConfig);
            } else if (layerType === CONST_LAYER_TYPES.VECTOR_TILES) {
              const layerConfig: TypeVectorTilesConfig = {
                geoviewLayerId: `${id}`,
                geoviewLayerName: {
                  en: name as string,
                  fr: name as string,
                },
                metadataAccessPath: {
                  en: url as string,
                  fr: url as string,
                },
                geoviewLayerType: 'vectorTiles',
                listOfLayerEntryConfig: (layerEntries as TypeJsonArray).map((item): TypeVectorTilesLayerEntryConfig => {
                  const vectorTilesLayerEntryConfig: TypeVectorTilesLayerEntryConfig = {
                    schemaTag: 'vectorTiles',
                    entryType: 'raster-tile',
                    layerId: `${item.id}`,
                    tileGrid: item.tileGrid as unknown as TypeTileGrid,
                    source: {
                      dataAccessPath: {
                        en: url as string,
                        fr: url as string,
                      },
                    },
                  };
                  return vectorTilesLayerEntryConfig;
                }),
              };
              listOfGeoviewLayerConfig.push(layerConfig);
            } else if (layerType === CONST_LAYER_TYPES.GEOPACKAGE) {
              const layerConfig: TypeGeoPackageLayerConfig = {
                geoviewLayerId: `${id}`,
                geoviewLayerName: {
                  en: name as string,
                  fr: name as string,
                },
                metadataAccessPath: {
                  en: url as string,
                  fr: url as string,
                },
                geoviewLayerType: 'GeoPackage',
                listOfLayerEntryConfig: (layerEntries as TypeJsonArray).map((item): TypeGeoPackageLayerEntryConfig => {
                  const geoPackageLayerEntryConfig: TypeGeoPackageLayerEntryConfig = {
                    schemaTag: 'GeoPackage',
                    entryType: 'vector',
                    layerId: `${item.id}`,
                    source: {
                      format: 'GeoPackage',
                      dataAccessPath: {
                        en: url as string,
                        fr: url as string,
                      },
                    },
                  };
                  return geoPackageLayerEntryConfig;
                }),
              };
              listOfGeoviewLayerConfig.push(layerConfig);
            } else if (layerType === CONST_LAYER_TYPES.IMAGE_STATIC) {
              const layerConfig: TypeImageStaticLayerConfig = {
                geoviewLayerId: `${id}`,
                geoviewLayerName: {
                  en: name as string,
                  fr: name as string,
                },
                metadataAccessPath: {
                  en: url as string,
                  fr: url as string,
                },
                geoviewLayerType: 'imageStatic',
                listOfLayerEntryConfig: (layerEntries as TypeJsonArray).map((item): TypeImageStaticLayerEntryConfig => {
                  const imageStaticLayerEntryConfig: TypeImageStaticLayerEntryConfig = {
                    schemaTag: 'imageStatic',
                    entryType: 'raster-image',
                    layerId: `${item.id}`,
                    source: {
                      dataAccessPath: {
                        en: url as string,
                        fr: url as string,
                      },
                      extent: [],
                    },
                  };
                  return imageStaticLayerEntryConfig;
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
