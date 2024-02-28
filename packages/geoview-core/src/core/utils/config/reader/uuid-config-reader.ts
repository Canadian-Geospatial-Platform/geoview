import axios, { AxiosResponse } from 'axios';

import { TypeJsonObject, TypeJsonArray } from '@/core/types/global-types';
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
import { TypeEsriFeatureLayerConfig } from '@/geo/layer/geoview-layers/vector/esri-feature';
import { TypeImageStaticLayerConfig } from '@/geo/layer/geoview-layers/raster/image-static';
import { TypeWMSLayerConfig } from '@/geo/layer/geoview-layers/raster/wms';
import { TypeWFSLayerConfig } from '@/geo/layer/geoview-layers/vector/wfs';
import { TypeOgcFeatureLayerConfig } from '@/geo/layer/geoview-layers/vector/ogc-feature';
import { TypeGeoJSONLayerConfig } from '@/geo/layer/geoview-layers/vector/geojson';
import { TypeGeoPackageLayerConfig } from '@/geo/layer/geoview-layers/vector/geopackage';
import { TypeXYZTilesConfig } from '@/geo/layer/geoview-layers/raster/xyz-tiles';
import { TypeVectorTilesConfig } from '@/geo/layer/geoview-layers/raster/vector-tiles';
import { createLocalizedString } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';
import { WfsLayerEntryConfig } from '../validationClasses/wfs-layer-entry-config';
import { OgcFeatureLayerEntryConfig } from '../validationClasses/ogc-layer-entry-config';
import { VectorTilesLayerEntryConfig } from '../validationClasses/vector-tiles-layer-entry-config';
import { GeoJSONLayerEntryConfig } from '../validationClasses/geojson-layer-entry-config';
import { EsriFeatureLayerEntryConfig } from '../validationClasses/esri-feature-layer-entry-config';
import { GeoPackageLayerEntryConfig } from '../validationClasses/geopackage-layer-config-entry';
import { XYZTilesLayerEntryConfig } from '../validationClasses/xyz-layer-entry-config';

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
  layers: TypeListOfGeoviewLayerConfig;
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
   */
  private static getLayerConfigFromResponse(result: AxiosResponse<TypeJsonObject>, lang: string): TypeListOfGeoviewLayerConfig {
    // If invalid response
    if (!result?.data || !result.data.reponse || !result.data.reponse.rcs || !result.data.reponse.rcs[lang])
      throw new Error('Invalid response from GeoCore service');

    const listOfGeoviewLayerConfig: TypeListOfGeoviewLayerConfig = [];
    for (let i = 0; i < (result.data.reponse.rcs[lang] as TypeJsonArray).length; i++) {
      const data = result.data.reponse.rcs[lang][i];

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
              geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): EsriFeatureLayerEntryConfig => {
                const esriFeatureLayerEntryConfig = new EsriFeatureLayerEntryConfig({
                  geoviewLayerConfig,
                  schemaTag: 'esriFeature',
                  entryType: 'vector',
                  layerId: `${item.index}`,
                  source: {
                    format: 'EsriJSON',
                    dataAccessPath: createLocalizedString(url as string),
                  },
                } as EsriFeatureLayerEntryConfig);
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
            geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): EsriFeatureLayerEntryConfig => {
              const esriFeatureLayerEntryConfig = new EsriFeatureLayerEntryConfig({
                geoviewLayerConfig,
                schemaTag: 'esriFeature',
                entryType: 'vector',
                layerId: `${item.index}`,
                source: {
                  format: 'EsriJSON',
                  dataAccessPath: createLocalizedString(url as string),
                },
              } as EsriFeatureLayerEntryConfig);
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
            geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): WfsLayerEntryConfig => {
              const wfsLayerEntryConfig = new WfsLayerEntryConfig({
                geoviewLayerConfig,
                schemaTag: 'ogcWfs',
                entryType: 'vector',
                layerId: `${item.id}`,
                source: {
                  format: 'WFS',
                  strategy: 'all',
                  dataAccessPath: createLocalizedString(url as string),
                },
              } as WfsLayerEntryConfig);
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
            geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): OgcFeatureLayerEntryConfig => {
              const ogcFeatureLayerEntryConfig = new OgcFeatureLayerEntryConfig({
                geoviewLayerConfig,
                schemaTag: 'ogcFeature',
                entryType: 'vector',
                layerId: `${item.id}`,
                source: {
                  format: 'featureAPI',
                  dataAccessPath: createLocalizedString(url as string),
                },
              } as OgcFeatureLayerEntryConfig);
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
            geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): GeoJSONLayerEntryConfig => {
              const geoJSONLayerEntryConfig = new GeoJSONLayerEntryConfig({
                geoviewLayerConfig,
                schemaTag: 'GeoJSON',
                entryType: 'vector',
                layerId: `${item.id}`,
                source: {
                  format: 'GeoJSON',
                  dataAccessPath: createLocalizedString(url as string),
                },
              } as GeoJSONLayerEntryConfig);
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
            geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): XYZTilesLayerEntryConfig => {
              const xyzTilesLayerEntryConfig = new XYZTilesLayerEntryConfig({
                geoviewLayerConfig,
                schemaTag: 'xyzTiles',
                entryType: 'raster-tile',
                layerId: `${item.id}`,
                source: {
                  dataAccessPath: createLocalizedString(url as string),
                },
              } as XYZTilesLayerEntryConfig);
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
            geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): VectorTilesLayerEntryConfig => {
              const vectorTilesLayerEntryConfig = new VectorTilesLayerEntryConfig({
                schemaTag: 'vectorTiles',
                entryType: 'raster-tile',
                layerId: `${item.id}`,
                tileGrid: item.tileGrid as unknown as TypeTileGrid,
                source: {
                  dataAccessPath: createLocalizedString(url as string),
                },
              } as VectorTilesLayerEntryConfig);
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
            geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): GeoPackageLayerEntryConfig => {
              const geoPackageLayerEntryConfig = new GeoPackageLayerEntryConfig({
                geoviewLayerConfig,
                schemaTag: 'GeoPackage',
                entryType: 'vector',
                layerId: `${item.id}`,
                source: {
                  format: 'GeoPackage',
                  dataAccessPath: createLocalizedString(url as string),
                },
              } as GeoPackageLayerEntryConfig);
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
    return listOfGeoviewLayerConfig;
  }

  /**
   * Reads and parses GeoChart configs from uuid request result
   * @param {AxiosResponse<GeoChartGeoCoreConfig>} result the uuid request result
   * @param {string} lang the language to use to read results
   * @returns {GeoChartConfig[]} the list of GeoChart configs
   */
  private static getGeoChartConfigFromResponse(result: AxiosResponse<GeoChartGeoCoreConfig>, lang: string): GeoChartConfig[] {
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
      layers: this.getLayerConfigFromResponse(result, lang),
      geocharts: this.getGeoChartConfigFromResponse(result, lang),
    };
  }
}
