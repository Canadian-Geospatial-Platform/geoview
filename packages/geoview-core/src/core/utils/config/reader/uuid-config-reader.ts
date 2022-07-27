import axios, { AxiosResponse } from 'axios';

import { TypeJsonObject, TypeJsonArray } from '../../../types/global-types';

import {
  TypeImageLayerEntryConfig,
  TypeSourceImageEsriInitialConfig,
  TypeSourceImageWmsInitialConfig,
} from '../../../../geo/layer/geoview-layers/schema-types';
import { CONST_LAYER_TYPES } from '../../../../geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeEsriDynamicLayerConfig } from '../../../../geo/layer/geoview-layers/raster/esri-dynamic';
import { TypeEsriFeatureLayerConfig } from '../../../../geo/layer/geoview-layers/vector/esri-feature';
import { TypeWMSLayerConfig } from '../../../../geo/layer/geoview-layers/raster/wms';
import {
  TypeSourceWFSVectorInitialConfig,
  TypeWFSLayerConfig,
  TypeWFSLayerEntryConfig,
} from '../../../../geo/layer/geoview-layers/vector/wfs';
import {
  TypeOgcFeatureLayerConfig,
  TypeOgcFeatureLayerEntryConfig,
  TypeSourceOgcFeatureInitialConfig,
} from '../../../../geo/layer/geoview-layers/vector/ogc-feature';
import { TypeGeoJSONLayerConfig } from '../../../../geo/layer/geoview-layers/vector/geojson';
import { TypeXYZTilesConfig } from '../../../../geo/layer/geoview-layers/raster/xyz-tiles';
import { TypeGeoviewLayerConfigList } from '../../../../geo/map/map-types';
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
   * @returns {TypeGeoviewLayerConfigList} layers parsed from uuid result
   */
  private static getLayerConfigFromResponse(result: AxiosResponse<TypeJsonObject>): TypeGeoviewLayerConfigList {
    const geoviewLayerConfigList: TypeGeoviewLayerConfigList = [];

    if (result && result.data) {
      for (let i = 0; i < result.data.length; i++) {
        const data = result.data[i];

        if (data && data.layers && data.layers.length > 0) {
          const layer = data.layers[0];

          if (layer) {
            const { geoviewLayerType, layerEntries, name, url, id } = layer;

            const isFeature = (url as string).indexOf('FeatureServer') > -1;

            if (geoviewLayerType === CONST_LAYER_TYPES.ESRI_DYNAMIC && !isFeature) {
              const layerConfig: TypeEsriDynamicLayerConfig = {
                id,
                name: {
                  en: name,
                  fr: name,
                },
                accessPath: {
                  en: url,
                  fr: url,
                },
                geoviewLayerType,
                layerEntries: (layerEntries as TypeJsonArray).map((item) => {
                  return {
                    geoviewLayerParent: layerConfig,
                    info: { layerId: item.index },
                    layerEntryType: 'image',
                    source: { sourceType: 'ESRI' } as TypeSourceImageEsriInitialConfig,
                  } as TypeImageLayerEntryConfig;
                }),
              } as TypeEsriDynamicLayerConfig;
              geoviewLayerConfigList.push(layerConfig);
            } else if (isFeature) {
              for (let j = 0; j < layerEntries.length; j++) {
                const featureUrl = `${url}/${layerEntries[j].index}`;
                const layerConfig: TypeEsriFeatureLayerConfig = {
                  id,
                  name: {
                    en: name,
                    fr: name,
                  },
                  accessPath: {
                    en: featureUrl,
                    fr: featureUrl,
                  },
                  geoviewLayerType: CONST_LAYER_TYPES.ESRI_FEATURE,
                } as TypeEsriFeatureLayerConfig;
                geoviewLayerConfigList.push(layerConfig);
              }
            } else if (geoviewLayerType === CONST_LAYER_TYPES.ESRI_FEATURE) {
              const layerConfig: TypeEsriFeatureLayerConfig = {
                id,
                name: {
                  en: name,
                  fr: name,
                },
                accessPath: {
                  en: url,
                  fr: url,
                },
                geoviewLayerType,
              } as TypeEsriFeatureLayerConfig;
              geoviewLayerConfigList.push(layerConfig);
            } else if (geoviewLayerType === CONST_LAYER_TYPES.WMS) {
              const layerConfig: TypeWMSLayerConfig = {
                id,
                name: {
                  en: name,
                  fr: name,
                },
                accessPath: {
                  en: url,
                  fr: url,
                },
                geoviewLayerType,
                layerEntries: (layerEntries as TypeJsonArray).map((item) => {
                  return {
                    geoviewLayerParent: layerConfig,
                    info: { layerId: item.id },
                    layerEntryType: 'image',
                    source: { sourceType: 'WMS' } as TypeSourceImageWmsInitialConfig,
                  } as TypeImageLayerEntryConfig;
                }),
              } as TypeWMSLayerConfig;
              geoviewLayerConfigList.push(layerConfig);
            } else if (geoviewLayerType === CONST_LAYER_TYPES.WFS) {
              const layerConfig: TypeWFSLayerConfig = {
                id,
                name: {
                  en: name,
                  fr: name,
                },
                accessPath: {
                  en: url,
                  fr: url,
                },
                geoviewLayerType,
                layerEntries: (layerEntries as TypeJsonArray).map((item) => {
                  return {
                    geoviewLayerParent: layerConfig,
                    info: { layerId: item.id },
                    layerEntryType: 'vector',
                    source: { format: 'WFS' } as TypeSourceWFSVectorInitialConfig,
                  } as TypeWFSLayerEntryConfig;
                }),
              } as TypeWFSLayerConfig;
              geoviewLayerConfigList.push(layerConfig);
            } else if (geoviewLayerType === CONST_LAYER_TYPES.OGC_FEATURE) {
              const layerConfig: TypeOgcFeatureLayerConfig = {
                id,
                name: {
                  en: name,
                  fr: name,
                },
                accessPath: {
                  en: url,
                  fr: url,
                },
                geoviewLayerType,
                layerEntries: (layerEntries as TypeJsonArray).map((item) => {
                  return {
                    geoviewLayerParent: layerConfig,
                    info: { layerId: item.id },
                    layerEntryType: 'vector',
                    source: { format: 'featureAPI' } as TypeSourceOgcFeatureInitialConfig,
                  } as TypeOgcFeatureLayerEntryConfig;
                }),
              } as TypeOgcFeatureLayerConfig;
              geoviewLayerConfigList.push(layerConfig);
            } else if (geoviewLayerType === CONST_LAYER_TYPES.GEOJSON) {
              const layerConfig: TypeGeoJSONLayerConfig = {
                id,
                name: {
                  en: name,
                  fr: name,
                },
                accessPath: {
                  en: url,
                  fr: url,
                },
                geoviewLayerType,
              } as TypeGeoJSONLayerConfig;
              geoviewLayerConfigList.push(layerConfig);
            } else if (geoviewLayerType === CONST_LAYER_TYPES.XYZ_TILES) {
              const layerConfig: TypeXYZTilesConfig = {
                id,
                name: {
                  en: name,
                  fr: name,
                },
                accessPath: {
                  en: url,
                  fr: url,
                },
                geoviewLayerType,
              } as TypeXYZTilesConfig;
              geoviewLayerConfigList.push(layerConfig);
            }
          }
        }
      }
    }

    return geoviewLayerConfigList;
  }

  /** ***************************************************************************************************************************
   * Generate GeoView layers config from a URL using a UUID.
   * @param {string} mapId the ID of the map.
   * @param {string} requestUrl the URL to request result
   * @param {Element} mapElement the map element
   *
   * @returns {Promise<TypeGeoviewLayerConfig>} layers parsed from uuid result
   */
  static async getGVlayersConfigFromUUID(mapId: string, requestUrl: string): Promise<TypeGeoviewLayerConfigList> {
    try {
      const result = await axios.get<TypeJsonObject>(requestUrl);

      return this.getLayerConfigFromResponse(result);
    } catch (error: unknown) {
      api.event.emit(
        snackbarMessagePayload(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, mapId, {
          type: 'key',
          value: 'validation.layer.loadfailed',
          params: [error as TypeJsonObject, mapId as TypeJsonObject],
        })
      );
    }
    return [];
  }
}
