import { TypeJsonObject, TypeJsonArray } from '@/api/config/types/config-types';
import { CONST_LAYER_TYPES, TypeGeoviewLayerConfig, TypeGeoviewLayerType, TypeOfServer } from '@/api/config/types/map-schema-types';
import { EsriDynamic } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { EsriFeature } from '@/geo/layer/geoview-layers/vector/esri-feature';
import { ImageStatic } from '@/geo/layer/geoview-layers/raster/image-static';
import { WMS } from '@/geo/layer/geoview-layers/raster/wms';
import { OgcFeature } from '@/geo/layer/geoview-layers/vector/ogc-feature';
import { WFS } from '@/geo/layer/geoview-layers/vector/wfs';
import { GeoJSON } from '@/geo/layer/geoview-layers/vector/geojson';
import { GeoPackage } from '@/geo/layer/geoview-layers/vector/geopackage';
import { XYZTiles } from '@/geo/layer/geoview-layers/raster/xyz-tiles';
import { VectorTiles } from '@/geo/layer/geoview-layers/raster/vector-tiles';
import { EsriImage } from '@/geo/layer/geoview-layers/raster/esri-image';
import {
  LayerGeoCoreInvalidResponseError,
  LayerGeoCoreNoLayersError,
  LayerGeoCoreUUIDNotFoundError,
} from '@/core/exceptions/geocore-exceptions';
import { Fetch } from '@/core/utils/fetch-helper';
import { formatError, NotSupportedError } from '@/core/exceptions/core-exceptions';

// The GeoChart Json object coming out of the GeoCore response
export type GeoChartGeoCoreConfig = TypeJsonObject & {
  layers: {
    layerId: string;
  };
}; // TypeJsonObject, because the definition is in the external package and so this TypeJsonObject reminds us of that

// The GeoChart Json object expected by GeoView
// GV This type is the core equivalent of the homonym 'GeoViewGeoChartConfig' in geoview-geochart\geochart-types.ts
export type GeoViewGeoChartConfig = TypeJsonObject & {
  layers: { layerId: string }[];
}; // TypeJsonObject, because the 'GeoChartConfig' definition is in the external package and so this TypeJsonObject reminds us of that

// The type representing the GeoCore parsed response
export type UUIDmapConfigReaderResponse = {
  layers: TypeGeoviewLayerConfig[];
  geocharts?: GeoViewGeoChartConfig[];
};

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
    } catch (error: unknown) {
      // If the promise had failed
      if (!result) throw new LayerGeoCoreUUIDNotFoundError(uuids, formatError(error));

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
    if (
      !resultData ||
      !resultData.response ||
      !resultData.response.rcs ||
      !resultData.response.rcs[lang] ||
      resultData.response.rcs[lang].length === 0
    ) {
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
          // Get RCS values and cast them
          const layerId = layer.id as string;
          const layerName = layer.name as string;
          const layerType = layer.layerType as TypeGeoviewLayerType;
          const layerUrl = layer.url as string;
          const serverType = layer.serverType as TypeOfServer | undefined;
          const layerIsTimeAware = (layer.isTimeAware as boolean) || false;
          const layerEntries = layer.layerEntries as TypeJsonArray;

          // Remove rcs. and .[lang] from geocore response
          const idClean = `${layerId.split('.')[1]}`;

          // Get Geocore custom config layer entries values
          // TODO: Modification done only for WMS and esriDynamic... If we have esriFeature, esriImage later, we will need to fix
          // TO.DOCONT: These 4 types are the only one stored in RCS
          const customGeocoreLayerConfig = this.#getGeocoreCustomLayerConfig(resultData, lang);

          const isFeature = layerUrl.indexOf('FeatureServer') > -1;

          let geoviewLayerConfig: TypeGeoviewLayerConfig;
          if (layerType === CONST_LAYER_TYPES.ESRI_DYNAMIC && !isFeature) {
            // Redirect
            geoviewLayerConfig = EsriDynamic.createEsriDynamicLayerConfig(
              idClean,
              layerName,
              layerUrl,
              layerIsTimeAware,
              layerEntries,
              customGeocoreLayerConfig
            );
          } else if (isFeature) {
            // GV: esriFeature layers as they are returned by RCS don't have a layerEntries property. It is undefined.
            // GV: Everything needed to create the geoview layer is in the URL.
            // GV: The geoview layer created contains only one layer entry config in the list.
            const serviceUrl = layerUrl.split('/').slice(0, -1).join('/');
            const layerIndex = layerUrl.split('/').pop() as TypeJsonObject;

            // Redirect
            geoviewLayerConfig = EsriFeature.createEsriFeatureLayerConfig(idClean, layerName, serviceUrl, layerIsTimeAware, [
              {
                index: layerIndex,
                dataAccessPath: layerUrl as TypeJsonObject,
              },
            ]);
          } else if (layerType === CONST_LAYER_TYPES.ESRI_FEATURE) {
            // Redirect
            geoviewLayerConfig = EsriFeature.createEsriFeatureLayerConfig(idClean, layerName, layerUrl, layerIsTimeAware, layerEntries);
          } else if (layerType === CONST_LAYER_TYPES.WMS) {
            // Redirect
            geoviewLayerConfig = WMS.createWMSLayerConfig(
              idClean,
              layerName,
              layerUrl,
              serverType!,
              layerIsTimeAware,
              layerEntries,
              customGeocoreLayerConfig
            );
          } else if (layerType === CONST_LAYER_TYPES.WFS) {
            // Redirect
            geoviewLayerConfig = WFS.createWfsFeatureLayerConfig(idClean, layerName, layerUrl, layerIsTimeAware, layerEntries);
          } else if (layerType === CONST_LAYER_TYPES.OGC_FEATURE) {
            // Redirect
            geoviewLayerConfig = OgcFeature.createOgcFeatureLayerConfig(idClean, layerName, layerUrl, layerIsTimeAware, layerEntries);
          } else if (layerType === CONST_LAYER_TYPES.GEOJSON) {
            // Redirect
            geoviewLayerConfig = GeoJSON.createGeoJsonLayerConfig(idClean, layerName, layerUrl, layerIsTimeAware, layerEntries);
          } else if (layerType === CONST_LAYER_TYPES.XYZ_TILES) {
            // Redirect
            geoviewLayerConfig = XYZTiles.createXYZTilesLayerConfig(idClean, layerName, layerUrl, layerIsTimeAware, layerEntries);
          } else if (layerType === CONST_LAYER_TYPES.VECTOR_TILES) {
            // Redirect
            geoviewLayerConfig = VectorTiles.createVectorTilesLayerConfig(idClean, layerName, layerUrl, layerIsTimeAware, layerEntries);
          } else if (layerType === CONST_LAYER_TYPES.GEOPACKAGE) {
            // Redirect
            geoviewLayerConfig = GeoPackage.createGeopackageLayerConfig(idClean, layerName, layerUrl, layerIsTimeAware, layerEntries);
          } else if (layerType === CONST_LAYER_TYPES.IMAGE_STATIC) {
            // Redirect
            geoviewLayerConfig = ImageStatic.createImageStaticLayerConfig(idClean, layerName, layerUrl, layerIsTimeAware, layerEntries);
          } else if (layerType === CONST_LAYER_TYPES.ESRI_IMAGE) {
            // GV: ESRI Image layers as they are returned by RCS don't have a layerEntries property. It is undefined.
            // GV: Everything needed to create the geoview layer is in the URL. The layerId of the layerEntryConfig is not used,
            // GV: but we need to create a layerEntryConfig in the list for the layer to be displayed.
            // Redirect
            geoviewLayerConfig = EsriImage.createEsriImageLayerConfig(idClean, layerName, layerUrl, layerIsTimeAware);
          } else {
            // Throw
            throw new NotSupportedError(`Layer type ${layerType} not supported`);
          }

          // Add it
          listOfGeoviewLayerConfig.push(geoviewLayerConfig);

          // If there's only the one layer AND customGeocoreLayerConfig.layerName is not provided, replace the layer name with the name from GeoCore
          if (
            listOfGeoviewLayerConfig[i].listOfLayerEntryConfig.length === 1 &&
            !listOfGeoviewLayerConfig[i].listOfLayerEntryConfig[0].listOfLayerEntryConfig &&
            customGeocoreLayerConfig.layerName === undefined
          ) {
            listOfGeoviewLayerConfig[i].listOfLayerEntryConfig[0].layerName = layerName;
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
    const foundConfigs = resultData.response.gcs.map((gcs) => gcs?.[lang]?.layers);

    return foundConfigs[0] || {};
  }

  /**
   * Reads and parses GeoChart configs from uuid request result
   * @param {TypeJsonObject} resultData - the uuid request result
   * @param {string} lang the language to use to read results
   * @returns {GeoChartConfig[]} the list of GeoChart configs
   * @private
   */
  static #getGeoChartConfigFromResponse(resultData: GeoChartGeoCoreConfig, lang: string): GeoViewGeoChartConfig[] {
    // If no geochart information
    if (!resultData || !resultData.response || !resultData.response.gcs || !Array.isArray(resultData.response.gcs)) return [];

    // Find all Geochart configs
    const foundConfigs = resultData.response.gcs
      .flatMap((gcs) => gcs?.[lang]?.packages?.geochart as unknown as GeoChartGeoCoreConfig[])
      .filter((geochartValue) => !!geochartValue);

    // For each found config, parse
    const parsedConfigs: GeoViewGeoChartConfig[] = [];
    foundConfigs.forEach((foundConfig) => {
      // Transform GeoChartGeoCoreConfig to GeoViewGeoChartConfig
      parsedConfigs.push({ ...(foundConfig as object), layers: [foundConfig.layers] } as GeoViewGeoChartConfig);
    });

    // Return all configs
    return parsedConfigs;
  }
}
