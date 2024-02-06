import axios, { AxiosResponse } from 'axios';

import { TypeJsonObject, TypeJsonArray, TypeJsonValue } from '@/core/types/global-types';
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
import { showError, replaceParams, getLocalizedMessage, createLocalizedString } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';

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
              const geoviewLayerConfig: TypeEsriDynamicLayerConfig = {
                geoviewLayerId: `${id}`,
                geoviewLayerName: createLocalizedString(name as string),
                metadataAccessPath: createLocalizedString(url as string),
                geoviewLayerType: 'esriDynamic',
                listOfLayerEntryConfig: [],
              };
              geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): TypeEsriDynamicLayerEntryConfig => {
                const esriDynamicLayerEntryConfig = new TypeEsriDynamicLayerEntryConfig({
                  geoviewLayerConfig,
                  schemaTag: 'esriDynamic',
                  entryType: 'raster-image',
                  layerId: `${item.index}`,
                  source: {
                    dataAccessPath: createLocalizedString(url as string),
                  },
                } as TypeEsriDynamicLayerEntryConfig);
                return esriDynamicLayerEntryConfig;
              });
              listOfGeoviewLayerConfig.push(geoviewLayerConfig);
            } else if (isFeature) {
              for (let j = 0; j < (layerEntries as TypeJsonArray).length; j++) {
                const featureUrl = `${url}/${layerEntries[j].index}`;
                const geoviewLayerConfig: TypeEsriFeatureLayerConfig = {
                  geoviewLayerId: `${id}`,
                  geoviewLayerName: createLocalizedString(name as string),
                  metadataAccessPath: createLocalizedString(featureUrl),
                  geoviewLayerType: 'esriFeature',
                  listOfLayerEntryConfig: [],
                };
                geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): TypeEsriFeatureLayerEntryConfig => {
                  const esriFeatureLayerEntryConfig = new TypeEsriFeatureLayerEntryConfig({
                    geoviewLayerConfig,
                    schemaTag: 'esriFeature',
                    entryType: 'vector',
                    layerId: `${item.index}`,
                    source: {
                      format: 'EsriJSON',
                      dataAccessPath: createLocalizedString(url as string),
                    },
                  } as TypeEsriFeatureLayerEntryConfig);
                  return esriFeatureLayerEntryConfig;
                });
                listOfGeoviewLayerConfig.push(geoviewLayerConfig);
              }
            } else if (layerType === CONST_LAYER_TYPES.ESRI_FEATURE) {
              const geoviewLayerConfig: TypeEsriFeatureLayerConfig = {
                geoviewLayerId: `${id}`,
                geoviewLayerName: createLocalizedString(name as string),
                metadataAccessPath: createLocalizedString(url as string),
                geoviewLayerType: 'esriFeature',
                listOfLayerEntryConfig: [],
              };
              geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): TypeEsriFeatureLayerEntryConfig => {
                const esriFeatureLayerEntryConfig = new TypeEsriFeatureLayerEntryConfig({
                  geoviewLayerConfig,
                  schemaTag: 'esriFeature',
                  entryType: 'vector',
                  layerId: `${item.index}`,
                  source: {
                    format: 'EsriJSON',
                    dataAccessPath: createLocalizedString(url as string),
                  },
                } as TypeEsriFeatureLayerEntryConfig);
                return esriFeatureLayerEntryConfig;
              });
              listOfGeoviewLayerConfig.push(geoviewLayerConfig);
            } else if (layerType === CONST_LAYER_TYPES.WMS) {
              const geoviewLayerConfig: TypeWMSLayerConfig = {
                geoviewLayerId: `${id}`,
                geoviewLayerName: createLocalizedString(name as string),
                metadataAccessPath: createLocalizedString(url as string),
                geoviewLayerType: 'ogcWms',
                listOfLayerEntryConfig: [],
              };
              geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): TypeOgcWmsLayerEntryConfig => {
                const wmsLayerEntryConfig = new TypeOgcWmsLayerEntryConfig({
                  geoviewLayerConfig,
                  schemaTag: 'ogcWms',
                  entryType: 'raster-image',
                  layerId: `${item.id}`,
                  source: {
                    dataAccessPath: createLocalizedString(url as string),
                    serverType: (serverType === undefined ? 'mapserver' : serverType) as TypeOfServer,
                  },
                } as TypeOgcWmsLayerEntryConfig);
                return wmsLayerEntryConfig;
              });
              listOfGeoviewLayerConfig.push(geoviewLayerConfig);
            } else if (layerType === CONST_LAYER_TYPES.WFS) {
              const geoviewLayerConfig: TypeWFSLayerConfig = {
                geoviewLayerId: `${id}`,
                geoviewLayerName: createLocalizedString(name as string),
                metadataAccessPath: createLocalizedString(url as string),
                geoviewLayerType: 'ogcWfs',
                listOfLayerEntryConfig: [],
              };
              geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): TypeWfsLayerEntryConfig => {
                const wfsLayerEntryConfig = new TypeWfsLayerEntryConfig({
                  geoviewLayerConfig,
                  schemaTag: 'ogcWfs',
                  entryType: 'vector',
                  layerId: `${item.id}`,
                  source: {
                    format: 'WFS',
                    strategy: 'all',
                    dataAccessPath: createLocalizedString(url as string),
                  },
                } as TypeWfsLayerEntryConfig);
                return wfsLayerEntryConfig;
              });
              listOfGeoviewLayerConfig.push(geoviewLayerConfig);
            } else if (layerType === CONST_LAYER_TYPES.OGC_FEATURE) {
              const geoviewLayerConfig: TypeOgcFeatureLayerConfig = {
                geoviewLayerId: `${id}`,
                geoviewLayerName: createLocalizedString(name as string),
                metadataAccessPath: createLocalizedString(url as string),
                geoviewLayerType: 'ogcFeature',
                listOfLayerEntryConfig: [],
              };
              geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): TypeOgcFeatureLayerEntryConfig => {
                const ogcFeatureLayerEntryConfig = new TypeOgcFeatureLayerEntryConfig({
                  geoviewLayerConfig,
                  schemaTag: 'ogcFeature',
                  entryType: 'vector',
                  layerId: `${item.id}`,
                  source: {
                    format: 'featureAPI',
                    dataAccessPath: createLocalizedString(url as string),
                  },
                } as TypeOgcFeatureLayerEntryConfig);
                return ogcFeatureLayerEntryConfig;
              });
              listOfGeoviewLayerConfig.push(geoviewLayerConfig);
            } else if (layerType === CONST_LAYER_TYPES.GEOJSON) {
              const geoviewLayerConfig: TypeGeoJSONLayerConfig = {
                geoviewLayerId: `${id}`,
                geoviewLayerName: createLocalizedString(name as string),
                metadataAccessPath: createLocalizedString(url as string),
                geoviewLayerType: 'GeoJSON',
                listOfLayerEntryConfig: [],
              };
              geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): TypeGeoJSONLayerEntryConfig => {
                const geoJSONLayerEntryConfig = new TypeGeoJSONLayerEntryConfig({
                  geoviewLayerConfig,
                  schemaTag: 'GeoJSON',
                  entryType: 'vector',
                  layerId: `${item.id}`,
                  source: {
                    format: 'GeoJSON',
                    dataAccessPath: createLocalizedString(url as string),
                  },
                } as TypeGeoJSONLayerEntryConfig);
                return geoJSONLayerEntryConfig;
              });
              listOfGeoviewLayerConfig.push(geoviewLayerConfig);
            } else if (layerType === CONST_LAYER_TYPES.XYZ_TILES) {
              const geoviewLayerConfig: TypeXYZTilesConfig = {
                geoviewLayerId: `${id}`,
                geoviewLayerName: createLocalizedString(name as string),
                metadataAccessPath: createLocalizedString(url as string),
                geoviewLayerType: 'xyzTiles',
                listOfLayerEntryConfig: [],
              };
              geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): TypeXYZTilesLayerEntryConfig => {
                const xyzTilesLayerEntryConfig = new TypeXYZTilesLayerEntryConfig({
                  geoviewLayerConfig,
                  schemaTag: 'xyzTiles',
                  entryType: 'raster-tile',
                  layerId: `${item.id}`,
                  source: {
                    dataAccessPath: createLocalizedString(url as string),
                  },
                } as TypeXYZTilesLayerEntryConfig);
                return xyzTilesLayerEntryConfig;
              });
              listOfGeoviewLayerConfig.push(geoviewLayerConfig);
            } else if (layerType === CONST_LAYER_TYPES.VECTOR_TILES) {
              const geoviewLayerConfig: TypeVectorTilesConfig = {
                geoviewLayerId: `${id}`,
                geoviewLayerName: createLocalizedString(name as string),
                metadataAccessPath: createLocalizedString(url as string),
                geoviewLayerType: 'vectorTiles',
                listOfLayerEntryConfig: [],
              };
              geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): TypeVectorTilesLayerEntryConfig => {
                const vectorTilesLayerEntryConfig = new TypeVectorTilesLayerEntryConfig({
                  schemaTag: 'vectorTiles',
                  entryType: 'raster-tile',
                  layerId: `${item.id}`,
                  tileGrid: item.tileGrid as unknown as TypeTileGrid,
                  source: {
                    dataAccessPath: createLocalizedString(url as string),
                  },
                } as TypeVectorTilesLayerEntryConfig);
                return vectorTilesLayerEntryConfig;
              });
              listOfGeoviewLayerConfig.push(geoviewLayerConfig);
            } else if (layerType === CONST_LAYER_TYPES.GEOPACKAGE) {
              const geoviewLayerConfig: TypeGeoPackageLayerConfig = {
                geoviewLayerId: `${id}`,
                geoviewLayerName: createLocalizedString(name as string),
                metadataAccessPath: createLocalizedString(url as string),
                geoviewLayerType: 'GeoPackage',
                listOfLayerEntryConfig: [],
              };
              geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): TypeGeoPackageLayerEntryConfig => {
                const geoPackageLayerEntryConfig = new TypeGeoPackageLayerEntryConfig({
                  geoviewLayerConfig,
                  schemaTag: 'GeoPackage',
                  entryType: 'vector',
                  layerId: `${item.id}`,
                  source: {
                    format: 'GeoPackage',
                    dataAccessPath: createLocalizedString(url as string),
                  },
                } as TypeGeoPackageLayerEntryConfig);
                return geoPackageLayerEntryConfig;
              });
              listOfGeoviewLayerConfig.push(geoviewLayerConfig);
            } else if (layerType === CONST_LAYER_TYPES.IMAGE_STATIC) {
              const geoviewLayerConfig: TypeImageStaticLayerConfig = {
                geoviewLayerId: `${id}`,
                geoviewLayerName: createLocalizedString(name as string),
                metadataAccessPath: createLocalizedString(url as string),
                geoviewLayerType: 'imageStatic',
                listOfLayerEntryConfig: [],
              };
              geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): TypeImageStaticLayerEntryConfig => {
                const imageStaticLayerEntryConfig = new TypeImageStaticLayerEntryConfig({
                  schemaTag: 'imageStatic',
                  entryType: 'raster-image',
                  layerId: `${item.id}`,
                  source: {
                    dataAccessPath: createLocalizedString(url as string),
                  },
                } as TypeImageStaticLayerEntryConfig);
                return imageStaticLayerEntryConfig;
              });
              listOfGeoviewLayerConfig.push(geoviewLayerConfig);
            } else {
              // Log
              logger.logWarning(`Layer type ${layerType} not supported`);
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
      // Log
      logger.logError('Failed to get the GeoView layer from UUI', requestUrl, error);
      const message = replaceParams([error as TypeJsonValue, mapId], getLocalizedMessage(mapId, 'validation.layer.loadfailed'));
      showError(mapId, message);
    }
    return [];
  }
}
