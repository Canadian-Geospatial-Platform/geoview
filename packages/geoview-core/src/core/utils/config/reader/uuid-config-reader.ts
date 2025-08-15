import { TypeDisplayLanguage } from '@/api/config/types/map-schema-types';
import { CONST_LAYER_TYPES, TypeGeoviewLayerConfig, TypeGeoviewLayerType, TypeOfServer } from '@/api/config/types/layer-schema-types';

import { EsriDynamic } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { EsriFeature } from '@/geo/layer/geoview-layers/vector/esri-feature';
import { EsriImage } from '@/geo/layer/geoview-layers/raster/esri-image';
import { GeoJSON } from '@/geo/layer/geoview-layers/vector/geojson';
import { GeoPackage } from '@/geo/layer/geoview-layers/vector/geopackage';
import { ImageStatic } from '@/geo/layer/geoview-layers/raster/image-static';
import { OgcFeature } from '@/geo/layer/geoview-layers/vector/ogc-feature';
import { VectorTiles } from '@/geo/layer/geoview-layers/raster/vector-tiles';
import { WFS } from '@/geo/layer/geoview-layers/vector/wfs';
import { WMS } from '@/geo/layer/geoview-layers/raster/wms';
import { XYZTiles } from '@/geo/layer/geoview-layers/raster/xyz-tiles';

import {
  LayerGeoCoreInvalidResponseError,
  LayerGeoCoreNoLayersError,
  LayerGeoCoreUUIDNotFoundError,
} from '@/core/exceptions/geocore-exceptions';
import { Fetch } from '@/core/utils/fetch-helper';
import { formatError, NotSupportedError } from '@/core/exceptions/core-exceptions';
import { TypeLayerEntryShell } from '@/core/utils/config/validation-classes/config-base-class';

/**
 * A class to generate GeoView layers config from a URL using a UUID.
 * @exports
 * @class UUIDmapConfigReader
 */
export class UUIDmapConfigReader {
  /**
   * Generates GeoView layers and package configurations (i.e. geochart), from GeoCore API, using a list of UUIDs.
   * @param {string} baseUrl - The base url of GeoCore API
   * @param {TypeDisplayLanguage} lang - The language to get the config for
   * @param {string[]} uuids - A list of uuids to get the configurations for
   * @returns {Promise<UUIDmapConfigReaderResponse>} Layers and Geocharts read and parsed from uuids results from GeoCore
   */
  static async getGVConfigFromUUIDs(baseUrl: string, lang: TypeDisplayLanguage, uuids: string[]): Promise<UUIDmapConfigReaderResponse> {
    let result;
    try {
      // Build the url
      const url = `${baseUrl}/vcs?lang=${lang}&id=${uuids.toString()}&referrer=${window.location.hostname}`;

      // Fetch the config
      result = await Fetch.fetchJson<GeoCoreConfigResponseRoot>(url);

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
   * @param {string[]} uuids - The uuids to read Geocore API for
   * @param {GeoCoreConfigResponseRoot} resultData - The uuid request result
   * @param {TypeDisplayLanguage} lang - The language to use
   * @returns {TypeGeoviewLayerConfig[]} The Layers parsed from uuid result
   * @private
   */
  static #getLayerConfigFromResponse(
    uuids: string[],
    resultData: GeoCoreConfigResponseRoot,
    lang: TypeDisplayLanguage
  ): TypeGeoviewLayerConfig[] {
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
    for (let i = 0; i < resultData.response.rcs[lang].length; i++) {
      const data = resultData.response.rcs[lang][i];

      if (data?.layers && data.layers.length > 0) {
        const layer = data.layers[0];

        if (layer) {
          // Get RCS values and cast them
          const layerId = layer.id;
          const layerName = layer.name;
          const { layerType } = layer;
          const layerUrl = layer.url;
          const { serverType } = layer;
          const layerIsTimeAware = layer.isTimeAware || false;
          const { layerEntries } = layer;

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
            geoviewLayerConfig = EsriDynamic.createGeoviewLayerConfig(idClean, layerName, layerUrl, layerIsTimeAware, layerEntries);
          } else if (isFeature) {
            // GV: esriFeature layers as they are returned by RCS don't have a layerEntries property. It is undefined.
            // GV: Everything needed to create the geoview layer is in the URL.
            // GV: The geoview layer created contains only one layer entry config in the list.
            const serviceUrl = layerUrl.split('/').slice(0, -1).join('/');
            const layerIndex = Number(layerUrl.split('/').pop());

            // Redirect
            geoviewLayerConfig = EsriFeature.createGeoviewLayerConfig(idClean, layerName, serviceUrl, layerIsTimeAware, [
              {
                id: layerIndex,
                index: layerIndex,
                source: {
                  dataAccessPath: layerUrl,
                },
              },
            ]);
          } else if (layerType === CONST_LAYER_TYPES.ESRI_FEATURE) {
            // Redirect
            geoviewLayerConfig = EsriFeature.createGeoviewLayerConfig(idClean, layerName, layerUrl, layerIsTimeAware, layerEntries);
          } else if (layerType === CONST_LAYER_TYPES.WMS) {
            // Redirect
            geoviewLayerConfig = WMS.createGeoviewLayerConfig(idClean, layerName, layerUrl, serverType!, layerIsTimeAware, layerEntries);
          } else if (layerType === CONST_LAYER_TYPES.WFS) {
            // Redirect
            // TODO: Check - Check if there's a way to better determine the vector strategy to send, defaults to 'all'
            geoviewLayerConfig = WFS.createGeoviewLayerConfig(idClean, layerName, layerUrl, layerIsTimeAware, 'all', layerEntries);
          } else if (layerType === CONST_LAYER_TYPES.OGC_FEATURE) {
            // Redirect
            geoviewLayerConfig = OgcFeature.createGeoviewLayerConfig(idClean, layerName, layerUrl, layerIsTimeAware, layerEntries);
          } else if (layerType === CONST_LAYER_TYPES.GEOJSON) {
            // Redirect
            geoviewLayerConfig = GeoJSON.createGeoviewLayerConfig(idClean, layerName, layerUrl, layerIsTimeAware, layerEntries);
          } else if (layerType === CONST_LAYER_TYPES.XYZ_TILES) {
            // Redirect
            geoviewLayerConfig = XYZTiles.createGeoviewLayerConfig(idClean, layerName, layerUrl, layerIsTimeAware, layerEntries);
          } else if (layerType === CONST_LAYER_TYPES.VECTOR_TILES) {
            // Redirect
            geoviewLayerConfig = VectorTiles.createGeoviewLayerConfig(idClean, layerName, layerUrl, layerIsTimeAware, layerEntries);
          } else if (layerType === CONST_LAYER_TYPES.GEOPACKAGE) {
            // Redirect
            geoviewLayerConfig = GeoPackage.createGeoviewLayerConfig(idClean, layerName, layerUrl, layerIsTimeAware, layerEntries);
          } else if (layerType === CONST_LAYER_TYPES.IMAGE_STATIC) {
            // Redirect
            geoviewLayerConfig = ImageStatic.createGeoviewLayerConfig(idClean, layerName, layerUrl, layerIsTimeAware, layerEntries);
          } else if (layerType === CONST_LAYER_TYPES.ESRI_IMAGE) {
            // GV: ESRI Image layers as they are returned by RCS don't have a layerEntries property. It is undefined.
            // GV: Everything needed to create the geoview layer is in the URL. The layerId of the layerEntryConfig is not used,
            // GV: but we need to create a layerEntryConfig in the list for the layer to be displayed.
            // Redirect
            geoviewLayerConfig = EsriImage.createGeoviewLayerConfig(idClean, layerName, layerUrl, layerIsTimeAware);
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
            customGeocoreLayerConfig?.layerName === undefined
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
   * @param {GeoCoreConfigResponseRoot} resultData - The uuid request result
   * @param {TypeDisplayLanguage} lang - The language to use to read results
   * @returns {GeoCoreConfigResponseGCSLayer | undefined} The layers snippet configs
   * @private
   */
  static #getGeocoreCustomLayerConfig(
    resultData: GeoCoreConfigResponseRoot,
    lang: TypeDisplayLanguage
  ): GeoCoreConfigResponseGCSLayer | undefined {
    // Check for valid response format
    if (!resultData?.response?.gcs || !Array.isArray(resultData.response.gcs)) {
      return undefined;
    }

    // Find the first config that has layers under the specified language
    const found = resultData.response.gcs.find((gcItem) => gcItem?.[lang]?.layers);

    return found?.[lang].layers || undefined;
  }

  /**
   * Reads and parses GeoChart configs from uuid request result
   * @param {GeoCoreConfigResponseRoot} resultData - The uuid request result
   * @param {TypeDisplayLanguage} lang - The language to use to read results
   * @returns {GeoViewGeoChartConfig[]} the list of GeoChart configs
   * @private
   */
  static #getGeoChartConfigFromResponse(resultData: GeoCoreConfigResponseRoot, lang: TypeDisplayLanguage): GeoViewGeoChartConfig[] {
    // If no geochart information
    if (!resultData || !resultData.response || !resultData.response.gcs || !Array.isArray(resultData.response.gcs)) return [];

    // Find all Geochart configs
    const foundConfigs = resultData.response.gcs
      .flatMap((gcItem) => gcItem?.[lang]?.packages?.geochart)
      .filter((geochartValue) => !!geochartValue);

    // For each found config, parse
    const parsedConfigs: GeoViewGeoChartConfig[] = [];
    foundConfigs.forEach((foundConfig) => {
      // Clean the GeoCore response (it happened in past some attribute names needed to be trimmed(!))
      const cleaned = foundConfig.layers;
      cleaned.propertyDisplay = cleaned.propertyDisplay.trim();
      cleaned.propertyValue = cleaned.propertyValue.trim();

      // Transform GeoCoreConfig to GeoViewGeoChartConfig
      parsedConfigs.push({ ...foundConfig, layers: [cleaned] });
    });

    // Return all configs
    return parsedConfigs;
  }
}

/**
 * The GeoCore response Json root.
 */
export type GeoCoreConfigResponseRoot = {
  response: GeoCoreConfigResponse;
  errorMessage?: string;
};

export type GeoCoreConfigResponse = {
  rcs: Record<TypeDisplayLanguage, GeoCoreConfigResponseRCSLayers[]>;
  gcs: Record<TypeDisplayLanguage, GeoCoreConfigResponseGCSLayers>[];
};

export type GeoCoreConfigResponseRCSLayers = {
  layers: GeoCoreConfigResponseLayer[];
};

export type GeoCoreConfigResponseGCSLayers = {
  layers?: GeoCoreConfigResponseGCSLayer;
  packages: GeoCoreConfigResponsePackages;
};

export type GeoCoreConfigResponseGCSLayer = {
  layerName: string;
};

export type GeoCoreConfigResponsePackages = {
  geochart: GeoChartGeoCoreConfig[];
};

export type GeoChartGeoCoreConfig = {
  layers: GeoChartGeoCoreConfigLayer; // For GeoCore, this is not an array.
};

export type GeoChartGeoCoreConfigLayer = {
  layerId: string;
  propertyValue: string;
  propertyDisplay: string;
};

export type GeoCoreConfigResponseLayer = {
  id: string;
  name: string;
  layerType: TypeGeoviewLayerType;
  url: string;
  serverType?: TypeOfServer;
  isTimeAware?: boolean;
  layerEntries: TypeLayerEntryShell[];
};

// The GeoChart Json object expected by GeoView
// GV This type is the core equivalent of the homonym 'GeoViewGeoChartConfig' in geoview-geochart\geochart-types.ts
export type GeoViewGeoChartConfig = {
  layers: GeoChartGeoCoreConfigLayer[]; // For us, this is an array, compared to GeoCore where it's not.
};

// The type representing the GeoCore parsed response
export type UUIDmapConfigReaderResponse = {
  layers: TypeGeoviewLayerConfig[];
  geocharts?: GeoViewGeoChartConfig[];
};
