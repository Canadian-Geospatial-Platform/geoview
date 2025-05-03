import { TypeJsonObject, TypeJsonArray } from '@/api/config/types/config-types';
import { CONST_LAYER_ENTRY_TYPES, TypeGeoviewLayerConfig, TypeOfServer, TypeTileGrid } from '@/api/config/types/map-schema-types';
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
import { deepMergeObjects } from '@/core/utils/utilities';
import { WfsLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import { OgcFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';
import { VectorTilesLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';
import { GeoJSONLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { EsriFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { GeoPackageLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/geopackage-layer-config-entry';
import { XYZTilesLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';
import { ImageStaticLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/image-static-layer-entry-config';
import { OgcWmsLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { EsriImageLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { TypeEsriImageLayerConfig } from '@/geo/layer/geoview-layers/raster/esri-image';
import {
  LayerGeoCoreInvalidResponseError,
  LayerGeoCoreNoLayersError,
  LayerGeoCoreUUIDNotFoundError,
} from '@/core/exceptions/geocore-exceptions';
import { Fetch } from '@/core/utils/fetch-helper';
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

// The returned parsed response
export type UUIDmapConfigReaderResponse = {
  layers: TypeGeoviewLayerConfig[];
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
   * Generates GeoView layers and package configurations (i.e. geochart), from GeoCore API, using a list of UUIDs.
   * @param {string} baseUrl - The base url of GeoCore API
   * @param {string} lang - The language to get the config for
   * @param {string[]} uuids - A list of uuids to get the configurations for
   * @returns {Promise<UUIDmapConfigReaderResponse>} Layers and Geocharts read and parsed from uuids results from GeoCore
   */
  static async getGVConfigFromUUIDs(baseUrl: string, lang: string, uuids: string[]): Promise<UUIDmapConfigReaderResponse> {
    let result;
    try {
      // Build the url
      const url = `${baseUrl}/vcs?lang=${lang}&id=${uuids.toString()}&referrer=${window.location.hostname}`;

      // Fetch the config
      result = await Fetch.fetchJsonAs<GeoChartGeoCoreConfig>(url);

      // Return the parsed response
      return {
        layers: this.#getLayerConfigFromResponse(uuids, result, lang),
        geocharts: this.#getGeoChartConfigFromResponse(result, lang),
      };
    } catch (error) {
      // If the promise had failed
      if (!result) throw new LayerGeoCoreUUIDNotFoundError(uuids, error as Error);

      // Re-throw the original error otherwise
      throw error;
    }
  }

  /**
   * Reads and parses Layers configs from uuid request result
   *
   * @param {TypeJsonObject} resultData - the uuid request result
   * @param {string} lang the language to use
   *
   * @returns {TypeGeoviewLayerConfig[]} layers parsed from uuid result
   * @private
   */
  static #getLayerConfigFromResponse(uuids: string[], resultData: TypeJsonObject, lang: string): TypeGeoviewLayerConfig[] {
    // If invalid response
    if (!resultData || !resultData.response || !resultData.response.rcs || !resultData.response.rcs[lang]) {
      const errorMessage = resultData?.errorMessage || '<no error description>';
      throw new LayerGeoCoreInvalidResponseError(uuids, errorMessage);
    }
    if (resultData.response.rcs[lang].length === 0) throw new LayerGeoCoreNoLayersError(uuids);

    const listOfGeoviewLayerConfig: TypeGeoviewLayerConfig[] = [];
    for (let i = 0; i < (resultData.response.rcs[lang] as TypeJsonArray).length; i++) {
      const data = resultData.response.rcs[lang][i];

      if (data?.layers && (data.layers as TypeJsonArray).length > 0) {
        const layer = data.layers[0];

        if (layer) {
          // Get RCS values
          const { layerType, layerEntries, name, url, id, serverType, isTimeAware } = layer;

          // Remove rcs. and .[lang] from geocore response
          const idClean = `${(id as string).split('.')[1]}`;

          // Get Geocore custom config layer entries values
          // TODO: Modification done only for WMS and esriDynamic... If we have esriFeature, esriImage later, we will need to fix
          // TO.DOCONT: These 4 types are the only one stored in RCS
          const customGeocoreLayerConfig = this.#getGeocoreCustomLayerConfig(resultData, lang);

          const isFeature = (url as string).indexOf('FeatureServer') > -1;

          if (layerType === CONST_LAYER_TYPES.ESRI_DYNAMIC && !isFeature) {
            const geoviewLayerConfig: TypeEsriDynamicLayerConfig = {
              geoviewLayerId: idClean,
              geoviewLayerName: name as string,
              metadataAccessPath: url as string,
              geoviewLayerType: CONST_LAYER_TYPES.ESRI_DYNAMIC,
              isTimeAware: isTimeAware as boolean,
              listOfLayerEntryConfig: [],
            };
            geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): EsriDynamicLayerEntryConfig => {
              const originalConfig = {
                geoviewLayerConfig,
                schemaTag: CONST_LAYER_TYPES.ESRI_DYNAMIC,
                entryType: CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE,
                layerId: `${item.index}`,
                source: {
                  dataAccessPath: url,
                },
              };

              // Overwrite default from geocore custom config
              const mergedConfig = deepMergeObjects(
                originalConfig as unknown as TypeJsonObject,
                customGeocoreLayerConfig as unknown as TypeJsonObject
              );
              const esriDynamicLayerEntryConfig = new EsriDynamicLayerEntryConfig(mergedConfig as unknown as EsriDynamicLayerEntryConfig);

              return esriDynamicLayerEntryConfig;
            });
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (isFeature) {
            // GV: esriFeature layers as they are returned by RCS don't have a layerEntries property. It is undefined.
            // GV: Everything needed to create the geoview layer is in the URL.
            // GV: The geoview layer created contains only one layer entry config in the list.
            const serviceUrl = (url as string).split('/').slice(0, -1).join('/');
            const layerId = (url as string).split('/').pop();

            const geoviewLayerConfig: TypeEsriFeatureLayerConfig = {
              geoviewLayerId: `${idClean}`,
              geoviewLayerName: name as string,
              metadataAccessPath: serviceUrl,
              geoviewLayerType: CONST_LAYER_TYPES.ESRI_FEATURE,
              isTimeAware: isTimeAware as boolean,
              listOfLayerEntryConfig: [],
            };
            geoviewLayerConfig.listOfLayerEntryConfig = [
              new EsriFeatureLayerEntryConfig({
                geoviewLayerConfig,
                schemaTag: CONST_LAYER_TYPES.ESRI_FEATURE,
                entryType: CONST_LAYER_ENTRY_TYPES.VECTOR,
                layerId,
                source: {
                  format: 'EsriJSON',
                  dataAccessPath: url as string,
                },
              } as EsriFeatureLayerEntryConfig),
            ];
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CONST_LAYER_TYPES.ESRI_FEATURE) {
            const geoviewLayerConfig: TypeEsriFeatureLayerConfig = {
              geoviewLayerId: `${idClean}`,
              geoviewLayerName: name as string,
              metadataAccessPath: url as string,
              geoviewLayerType: CONST_LAYER_TYPES.ESRI_FEATURE,
              isTimeAware: isTimeAware as boolean,
              listOfLayerEntryConfig: [],
            };
            geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): EsriFeatureLayerEntryConfig => {
              const esriFeatureLayerEntryConfig = new EsriFeatureLayerEntryConfig({
                geoviewLayerConfig,
                schemaTag: CONST_LAYER_TYPES.ESRI_FEATURE,
                entryType: CONST_LAYER_ENTRY_TYPES.VECTOR,
                layerId: `${item.index}`,
                source: {
                  format: 'EsriJSON',
                },
              } as EsriFeatureLayerEntryConfig);
              return esriFeatureLayerEntryConfig;
            });
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CONST_LAYER_TYPES.WMS) {
            const geoviewLayerConfig: TypeWMSLayerConfig = {
              geoviewLayerId: `${idClean}`,
              geoviewLayerName: name as string,
              metadataAccessPath: url as string,
              geoviewLayerType: CONST_LAYER_TYPES.WMS,
              isTimeAware: isTimeAware as boolean,
              listOfLayerEntryConfig: [],
            };
            geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): OgcWmsLayerEntryConfig => {
              const originalConfig = {
                geoviewLayerConfig,
                schemaTag: CONST_LAYER_TYPES.WMS,
                entryType: CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE,
                layerId: `${item.id}`,
                source: {
                  serverType: (serverType === undefined ? 'mapserver' : serverType) as TypeOfServer,
                  dataAccessPath: url as string,
                },
              };

              // Overwrite default from geocore custom config
              const mergedConfig = deepMergeObjects(
                originalConfig as unknown as TypeJsonObject,
                customGeocoreLayerConfig as unknown as TypeJsonObject
              );
              const wmsLayerEntryConfig = new OgcWmsLayerEntryConfig(mergedConfig as unknown as OgcWmsLayerEntryConfig);

              return wmsLayerEntryConfig;
            });
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CONST_LAYER_TYPES.WFS) {
            const geoviewLayerConfig: TypeWFSLayerConfig = {
              geoviewLayerId: `${idClean}`,
              geoviewLayerName: name as string,
              metadataAccessPath: url as string,
              geoviewLayerType: CONST_LAYER_TYPES.WFS,
              isTimeAware: isTimeAware as boolean,
              listOfLayerEntryConfig: [],
            };
            geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): WfsLayerEntryConfig => {
              const wfsLayerEntryConfig = new WfsLayerEntryConfig({
                geoviewLayerConfig,
                schemaTag: CONST_LAYER_TYPES.WFS,
                entryType: CONST_LAYER_ENTRY_TYPES.VECTOR,
                layerId: `${item.id}`,
                source: {
                  format: 'WFS',
                  strategy: 'all',
                  dataAccessPath: url as string,
                },
              } as WfsLayerEntryConfig);
              return wfsLayerEntryConfig;
            });
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CONST_LAYER_TYPES.OGC_FEATURE) {
            const geoviewLayerConfig: TypeOgcFeatureLayerConfig = {
              geoviewLayerId: `${idClean}`,
              geoviewLayerName: name as string,
              metadataAccessPath: url as string,
              geoviewLayerType: CONST_LAYER_TYPES.OGC_FEATURE,
              isTimeAware: isTimeAware as boolean,
              listOfLayerEntryConfig: [],
            };
            geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): OgcFeatureLayerEntryConfig => {
              const ogcFeatureLayerEntryConfig = new OgcFeatureLayerEntryConfig({
                geoviewLayerConfig,
                schemaTag: CONST_LAYER_TYPES.OGC_FEATURE,
                entryType: CONST_LAYER_ENTRY_TYPES.VECTOR,
                layerId: `${item.id}`,
                source: {
                  format: 'featureAPI',
                  dataAccessPath: url as string,
                },
              } as OgcFeatureLayerEntryConfig);
              return ogcFeatureLayerEntryConfig;
            });
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CONST_LAYER_TYPES.GEOJSON) {
            const geoviewLayerConfig: TypeGeoJSONLayerConfig = {
              geoviewLayerId: `${idClean}`,
              geoviewLayerName: name as string,
              metadataAccessPath: url as string,
              geoviewLayerType: CONST_LAYER_TYPES.GEOJSON,
              isTimeAware: isTimeAware as boolean,
              listOfLayerEntryConfig: [],
            };
            geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): GeoJSONLayerEntryConfig => {
              const geoJSONLayerEntryConfig = new GeoJSONLayerEntryConfig({
                geoviewLayerConfig,
                schemaTag: CONST_LAYER_TYPES.GEOJSON,
                entryType: CONST_LAYER_ENTRY_TYPES.VECTOR,
                layerId: `${item.id}`,
                source: {
                  format: 'GeoJSON',
                  dataAccessPath: url as string,
                },
              } as GeoJSONLayerEntryConfig);
              return geoJSONLayerEntryConfig;
            });
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CONST_LAYER_TYPES.XYZ_TILES) {
            const geoviewLayerConfig: TypeXYZTilesConfig = {
              geoviewLayerId: `${idClean}`,
              geoviewLayerName: name as string,
              metadataAccessPath: url as string,
              geoviewLayerType: CONST_LAYER_TYPES.XYZ_TILES,
              isTimeAware: isTimeAware as boolean,
              listOfLayerEntryConfig: [],
            };
            geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): XYZTilesLayerEntryConfig => {
              const xyzTilesLayerEntryConfig = new XYZTilesLayerEntryConfig({
                geoviewLayerConfig,
                schemaTag: CONST_LAYER_TYPES.XYZ_TILES,
                entryType: CONST_LAYER_ENTRY_TYPES.RASTER_TILE,
                layerId: `${item.id}`,
                source: {
                  dataAccessPath: url as string,
                },
              } as XYZTilesLayerEntryConfig);
              return xyzTilesLayerEntryConfig;
            });
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CONST_LAYER_TYPES.VECTOR_TILES) {
            const geoviewLayerConfig: TypeVectorTilesConfig = {
              geoviewLayerId: `${idClean}`,
              geoviewLayerName: name as string,
              metadataAccessPath: url as string,
              geoviewLayerType: CONST_LAYER_TYPES.VECTOR_TILES,
              isTimeAware: isTimeAware as boolean,
              listOfLayerEntryConfig: [],
            };
            geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): VectorTilesLayerEntryConfig => {
              const vectorTilesLayerEntryConfig = new VectorTilesLayerEntryConfig({
                schemaTag: CONST_LAYER_TYPES.VECTOR_TILES,
                entryType: CONST_LAYER_ENTRY_TYPES.RASTER_TILE,
                layerId: `${item.id}`,
                tileGrid: item.tileGrid as unknown as TypeTileGrid,
                source: {
                  dataAccessPath: url as string,
                },
              } as VectorTilesLayerEntryConfig);
              return vectorTilesLayerEntryConfig;
            });
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CONST_LAYER_TYPES.GEOPACKAGE) {
            const geoviewLayerConfig: TypeGeoPackageLayerConfig = {
              geoviewLayerId: `${idClean}`,
              geoviewLayerName: name as string,
              geoviewLayerType: CONST_LAYER_TYPES.GEOPACKAGE,
              isTimeAware: isTimeAware as boolean,
              listOfLayerEntryConfig: [],
            };
            geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): GeoPackageLayerEntryConfig => {
              const geoPackageLayerEntryConfig = new GeoPackageLayerEntryConfig({
                geoviewLayerConfig,
                schemaTag: CONST_LAYER_TYPES.GEOPACKAGE,
                entryType: CONST_LAYER_ENTRY_TYPES.VECTOR,
                layerId: `${item.id}`,
                source: {
                  format: 'GeoPackage',
                  dataAccessPath: url as string,
                },
              } as GeoPackageLayerEntryConfig);
              return geoPackageLayerEntryConfig;
            });
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CONST_LAYER_TYPES.IMAGE_STATIC) {
            const geoviewLayerConfig: TypeImageStaticLayerConfig = {
              geoviewLayerId: `${idClean}`,
              geoviewLayerName: name as string,
              metadataAccessPath: url as string,
              geoviewLayerType: CONST_LAYER_TYPES.IMAGE_STATIC,
              isTimeAware: isTimeAware as boolean,
              listOfLayerEntryConfig: [],
            };
            geoviewLayerConfig.listOfLayerEntryConfig = (layerEntries as TypeJsonArray).map((item): ImageStaticLayerEntryConfig => {
              const imageStaticLayerEntryConfig = new ImageStaticLayerEntryConfig({
                geoviewLayerConfig,
                schemaTag: CONST_LAYER_TYPES.IMAGE_STATIC,
                entryType: CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE,
                layerId: `${item.id}`,
                source: {
                  dataAccessPath: url as string,
                },
              } as ImageStaticLayerEntryConfig);
              return imageStaticLayerEntryConfig;
            });
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else if (layerType === CONST_LAYER_TYPES.ESRI_IMAGE) {
            // GV: ESRI Image layers as they are returned by RCS don't have a layerEntries property. It is undefined.
            // GV: Everything needed to create the geoview layer is in the URL. The layerId of the layerEntryConfig is not used,
            // GV: but we need to create a layerEntryConfig in the list for the layer to be displayed.
            const geoviewLayerConfig: TypeEsriImageLayerConfig = {
              geoviewLayerId: `${idClean}`,
              geoviewLayerName: name as string,
              metadataAccessPath: url as string,
              geoviewLayerType: CONST_LAYER_TYPES.ESRI_IMAGE,
              isTimeAware: isTimeAware as boolean,
              listOfLayerEntryConfig: [],
            };
            geoviewLayerConfig.listOfLayerEntryConfig = [
              new EsriImageLayerEntryConfig({
                geoviewLayerConfig,
                schemaTag: CONST_LAYER_TYPES.ESRI_IMAGE,
                entryType: CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE,
                layerId: (url as string).split('/').slice(-2, -1)[0],
              } as EsriImageLayerEntryConfig),
            ];
            listOfGeoviewLayerConfig.push(geoviewLayerConfig);
          } else {
            // Log
            logger.logWarning(`Layer type ${layerType} not supported`);
          }

          // If there's only the one layer, replace the layer name with the name from GeoCore
          if (
            listOfGeoviewLayerConfig[i].listOfLayerEntryConfig.length === 1 &&
            !listOfGeoviewLayerConfig[i].listOfLayerEntryConfig[0].listOfLayerEntryConfig
          ) {
            listOfGeoviewLayerConfig[i].listOfLayerEntryConfig[0].layerName = name as string;
          }
        }
      }
    }
    return listOfGeoviewLayerConfig;
  }

  /**
   * Reads the layers config from uuid request result
   * @param {TypeJsonObject} resultData - the uuid request result
   * @param {string} lang - the language to use to read results
   * @returns {TypeJsonObject} the layers snippet configs
   * @private
   */
  static #getGeocoreCustomLayerConfig(resultData: TypeJsonObject, lang: string): TypeJsonObject {
    // If no custon geocore information
    if (!resultData || !resultData.response || !resultData.response.gcs || !Array.isArray(resultData.response.gcs)) return {};

    // Find custom layer entry configuration
    const foundConfigs = resultData.response.gcs.map((gcs) => gcs?.[lang]?.layers as TypeJsonObject);

    return foundConfigs[0] || {};
  }

  /**
   * Reads and parses GeoChart configs from uuid request result
   * @param {TypeJsonObject} resultData - the uuid request result
   * @param {string} lang the language to use to read results
   * @returns {GeoChartConfig[]} the list of GeoChart configs
   * @private
   */
  static #getGeoChartConfigFromResponse(resultData: GeoChartGeoCoreConfig, lang: string): GeoChartConfig[] {
    // If no geochart information
    if (!resultData || !resultData.response || !resultData.response.gcs || !Array.isArray(resultData.response.gcs)) return [];

    // Find all Geochart configs
    const foundConfigs = resultData.response.gcs
      .flatMap((gcs) => gcs?.[lang]?.packages?.geochart as unknown as GeoChartGeoCoreConfig[])
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
}
