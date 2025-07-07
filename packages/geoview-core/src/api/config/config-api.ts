import cloneDeep from 'lodash/cloneDeep';

import {
  CV_DEFAULT_MAP_FEATURE_CONFIG,
  CV_CONFIG_GEOCORE_TYPE,
  CV_CONFIG_SHAPEFILE_TYPE,
  CV_CONST_LAYER_TYPES,
} from '@/api/config/types/config-constants';
import { TypeJsonValue, TypeJsonObject, toJsonObject, TypeJsonArray } from '@/api/config/types/config-types';
import { MapFeatureConfig } from '@/api/config/types/classes/map-feature-config';
import {
  MapConfigLayerEntry,
  TypeBasemapOptions,
  TypeDisplayLanguage,
  TypeInteraction,
  TypeMapFeaturesInstance,
  TypeValidMapProjectionCodes,
  TypeZoomAndCenter,
} from '@/api/config/types/map-schema-types';
import { MapConfigError } from '@/api/config/types/classes/config-exceptions';

import { isJsonString, removeCommentsFromJSON } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';

import { ShapefileReader } from '@/core/utils/config/reader/shapefile-reader';
import { UUIDmapConfigReader } from '@/core/utils/config/reader/uuid-config-reader';

/**
 * The API class that create configuration object. It is used to validate and read the service and layer metadata.
 * @exports
 * @class DefaultConfig
 */
export class ConfigApi {
  // GV: The following property was created only for debugging purpose. They allow developers to inspect the
  // GV: content or call the methods of the last instance created by the corresponding ConfigApi call.

  /** Static property that contains the last object instanciated by the ConfigApi.createMapConfig call */
  static lastMapConfigCreated?: MapFeatureConfig;

  // TODO: Temporary property that will be deleted when the ConfigApi development is done. Set it to true for normal execution. */
  static devMode = false;

  /** ***************************************************************************************************************************
   * Function used to validate the GeoCore UUIDs.
   *
   * @param {string} uuid The UUID to validate.
   *
   * @returns {boolean} Returns true if the UUID respect the format.
   * @static
   */
  static isValidUUID(uuid: string): boolean {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
  }

  /** ***************************************************************************************************************************
   * Attempt to determine the layer type based on the URL format.
   *
   * @param {string} url The URL of the service for which we want to guess the GeoView layer type.
   *
   * @returns {string | undefined} The GeoView layer type or undefined if it cannot be guessed.
   */
  static guessLayerType(url: string): string | undefined {
    if (!url) return undefined;

    const [upperUrl] = url.toUpperCase().split('?');

    if (/\{z\}\/{[xy]}\/{[xy]}/i.test(url)) return CV_CONST_LAYER_TYPES.XYZ_TILES;

    if (upperUrl.endsWith('MAPSERVER') || upperUrl.endsWith('MAPSERVER/')) return CV_CONST_LAYER_TYPES.ESRI_DYNAMIC;

    if (/(?:FEATURESERVER|MAPSERVER(?:\/\d+)+)/i.test(url)) return CV_CONST_LAYER_TYPES.ESRI_FEATURE;

    if (/IMAGESERVER/i.test(url)) return CV_CONST_LAYER_TYPES.ESRI_IMAGE;

    if (/WFS/i.test(url)) return CV_CONST_LAYER_TYPES.WFS;

    if (/.(?:GEO)?JSON(?:$|\?)/i.test(url)) return CV_CONST_LAYER_TYPES.GEOJSON;

    if (upperUrl.endsWith('.GPKG')) return CV_CONST_LAYER_TYPES.GEOPACKAGE;

    if (upperUrl.includes('VECTORTILESERVER')) return CV_CONST_LAYER_TYPES.VECTOR_TILES;

    if (ConfigApi.isValidUUID(url)) return CV_CONFIG_GEOCORE_TYPE;

    if (/WMS/i.test(url)) return CV_CONST_LAYER_TYPES.WMS;

    if (/.CSV(?:$|\?)/i.test(url)) return CV_CONST_LAYER_TYPES.CSV;

    if (/.(ZIP|SHP)(?:$|\?)/i.test(url)) return CV_CONFIG_SHAPEFILE_TYPE;

    if (upperUrl.includes('COLLECTIONS')) return CV_CONST_LAYER_TYPES.OGC_FEATURE;

    return undefined;
  }

  /** ***************************************************************************************************************************
   * Parse the parameters obtained from a url.
   *
   * @param {string} urlParams The parameters found on the url after the ?.
   *
   * @returns {TypeJsonObject} Object containing the parsed params.
   * @static @private
   */
  static #getMapPropsFromUrlParams(urlParams: string): TypeJsonObject {
    // Get parameters from path. Ex: x=123&y=456 will get {"x": 123, "z": "456"}
    const obj: TypeJsonObject = {};

    if (urlParams !== undefined) {
      const params = urlParams.split('&');

      for (let i = 0; i < params.length; i += 1) {
        const param = params[i].split('=');
        const key = param[0];
        const value = param[1] as TypeJsonValue;

        obj[key] = value as TypeJsonObject;
      }
    }

    return obj;
  }

  /**
   * Get url parameters from url param search string.
   *
   * @param {objStr} objStr the url parameter string.
   *
   * @returns {TypeJsonObject} an object containing url parameters.
   * @static @private
   */
  static #parseObjectFromUrl(objStr: string): TypeJsonObject {
    const obj: TypeJsonObject = {};

    if (objStr && objStr.length) {
      // first { is kept with regex, remove
      const objProps = objStr.split(',');

      if (objProps) {
        for (let i = 0; i < objProps.length; i += 1) {
          const prop = objProps[i].split(':');
          if (prop && prop.length) {
            const key: string = prop[0];
            const value: string = prop[1];

            if (prop[1] === 'true') {
              obj[key] = true as TypeJsonObject;
            } else if (prop[1] === 'false') {
              obj[key] = false as TypeJsonObject;
            } else {
              obj[key] = value as TypeJsonObject;
            }
          }
        }
      }
    }

    return obj;
  }

  /**
   * Convert the stringMapFeatureConfig to a json object. Comments will be removed from the string.
   * @param {string} stringMapFeatureConfig The map configuration string to convert to JSON format.
   *
   * @returns {TypeJsonObject} A JSON map feature configuration object.
   * @private
   */
  static convertStringToJson(stringMapFeatureConfig: string): TypeJsonObject | undefined {
    // Erase comments in the config file.
    let newStringMapFeatureConfig = removeCommentsFromJSON(stringMapFeatureConfig);

    // If you want to use quotes in your JSON string, write \&quot or escape it using a backslash;
    // First, replace apostrophes not preceded by a backslash with quotes
    newStringMapFeatureConfig = newStringMapFeatureConfig.replace(/(?<!\\)'/gm, '"');
    // Then, replace apostrophes preceded by a backslash with a single apostrophe
    newStringMapFeatureConfig = newStringMapFeatureConfig.replace(/\\'/gm, "'");

    if (isJsonString(newStringMapFeatureConfig)) {
      // Create the config
      return JSON.parse(newStringMapFeatureConfig);
    }
    return undefined;
  }

  /**
   * Get a map feature config from url parameters.
   * @param {string} urlStringParams The url parameters.
   *
   * @returns {Promise<MapFeatureConfig>} A map feature configuration object generated from url parameters.
   * @static @async
   */
  static async getConfigFromUrl(urlStringParams: string): Promise<MapFeatureConfig> {
    // return the parameters as an object if url contains any params
    const urlParams = ConfigApi.#getMapPropsFromUrlParams(urlStringParams);

    // if user provided any url parameters update
    const jsonConfig = {} as TypeMapFeaturesInstance;

    // update the language if provided from the map configuration.
    const displayLanguage = (urlParams.l as TypeDisplayLanguage) || 'en';

    if (Object.keys(urlParams).length && !urlParams.geoms) {
      // Ex: p=3857&z=4&c=40,-100&l=en&t=dark&b=basemapId:transport,shaded:false,labeled:true&i=dynamic&cp=details-panel,layers-panel&cc=overview-map&keys=12acd145-626a-49eb-b850-0a59c9bc7506,ccc75c12-5acc-4a6a-959f-ef6f621147b9

      // get center
      let center: string[] = [];
      if (urlParams.c) center = (urlParams.c as string).split(',');
      if (center.length !== 2)
        center = [
          CV_DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.initialView!.zoomAndCenter![1][0].toString(),
          CV_DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.initialView!.zoomAndCenter![1][1].toString(),
        ];

      // get zoom
      let zoom = CV_DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.initialView!.zoomAndCenter![0].toString();
      if (urlParams.z) zoom = urlParams.z as string;

      jsonConfig.map = {
        interaction: urlParams.i as TypeInteraction,
        viewSettings: {
          initialView: {
            zoomAndCenter: [parseInt(zoom, 10), [parseInt(center[0], 10), parseInt(center[1], 10)]] as TypeZoomAndCenter,
          },
          projection: parseInt(urlParams.p as string, 10) as TypeValidMapProjectionCodes,
        },
        basemapOptions: ConfigApi.#parseObjectFromUrl(urlParams.b as string) as unknown as TypeBasemapOptions,
        listOfGeoviewLayerConfig: [] as MapConfigLayerEntry[],
      };

      // get layer information from catalog using their uuid's if any passed from url params
      // and store it in the listOfGeoviewLayerConfig of the map.
      if (urlParams.keys) {
        try {
          // Get the GeoView layer configurations from the GeoCore UUIDs provided (urlParams.keys is a CSV string of UUIDs).
          const response = await UUIDmapConfigReader.getGVConfigFromUUIDs(
            CV_DEFAULT_MAP_FEATURE_CONFIG.serviceUrls.geocoreUrl,
            displayLanguage,
            urlParams.keys.toString().split(',')
          );

          // Focus on the layers in the response
          const listOfGeoviewLayerConfig = response.layers;

          // The listOfGeoviewLayerConfig returned by the previous call appended 'rcs.' at the beginning and
          // '.en' or '.fr' at the end of the UUIDs. We want to restore the ids as they were before.
          listOfGeoviewLayerConfig.forEach((layerConfig, i) => {
            listOfGeoviewLayerConfig[i].geoviewLayerId = layerConfig.geoviewLayerId.slice(4, -3);
          });

          // Store the new computed listOfGeoviewLayerConfig in the map.
          jsonConfig.map.listOfGeoviewLayerConfig = listOfGeoviewLayerConfig;
        } catch (error: unknown) {
          // Log the error. The listOfGeoviewLayerConfig returned will be [].
          logger.logError('Failed to get the GeoView layers from url keys', urlParams.keys, error);
        }
      }

      // get core components
      if (urlParams.cc) {
        (jsonConfig.components as TypeJsonArray) = (urlParams.cc as string).split(',') as TypeJsonArray;
      }

      // get core packages if any
      if (urlParams.cp) {
        (jsonConfig.corePackages as TypeJsonArray) = (urlParams.cp as string).split(',') as TypeJsonArray;
      }

      // update the version if provided from the map configuration.
      jsonConfig.schemaVersionUsed = urlParams.v as '1.0' | undefined;
    }

    // Trace the detail config read from url
    logger.logTraceDetailed('URL Config - ', jsonConfig);

    return new MapFeatureConfig(jsonConfig);
  }

  /**
   * Get the default values that are applied to the map feature configuration when the user doesn't provide a value for a field
   * that is covered by a default value.
   * @returns {MapFeatureConfig} The map feature configuration default values.
   * @static
   */
  static getDefaultMapFeatureConfig(): MapFeatureConfig {
    return new MapFeatureConfig(toJsonObject(CV_DEFAULT_MAP_FEATURE_CONFIG));
  }

  /**
   * Convert one layer config or an array of GeoCore layer config to their GeoView equivalents. The method returns undefined
   * and log an error in the console if a GeoCore layer cannot be converted. When the input/output type is an array, it is
   * possible to filter out the undefined values.
   *
   * @param {TypeDisplayLanguage} language The language language to use for the conversion.
   * @param {TypeJsonArray | TypeJsonObject} config Configuration to process.
   * @param {string} geocoreUrl Optional GeoCore server URL.
   * @param {boolean} filterUndefinedValues Flag indicating that we want to filter undefined values when the return type is an array..
   *
   * @returns {Promise<TypeJsonArray>} The resulting configurations or undefined if there is an error.
   * @static @private
   */
  static async convertGeocoreToGeoview(
    language: TypeDisplayLanguage,
    config: TypeJsonArray | TypeJsonObject,
    geocoreUrl?: string,
    filterUndefinedValues: boolean = true
  ): Promise<TypeJsonArray | TypeJsonObject | undefined> {
    // convert the JSON object to a JSON array. We want to process a single type.
    const listOfGeoviewLayerConfig = Array.isArray(config) ? config : [config];

    // Get the geocore URL from the config, otherwise use the default URL.
    const geocoreServerUrl = geocoreUrl || CV_DEFAULT_MAP_FEATURE_CONFIG.serviceUrls.geocoreUrl;

    // Filter all geocore layers and convert the result into an array of unique geoviewLayerId.
    const geocoreArrayOfKeys = listOfGeoviewLayerConfig
      .filter((layerConfig) => layerConfig.geoviewLayerType === CV_CONFIG_GEOCORE_TYPE)
      .map<string>((geocoreLayer) => geocoreLayer.geoviewLayerId as string);

    // If the listOfGeoviewLayerConfig contains GeoCore layers, process them.
    if (geocoreArrayOfKeys.length) {
      try {
        // Get the GeoView configurations using the array of GeoCore identifiers.
        const response = await UUIDmapConfigReader.getGVConfigFromUUIDs(geocoreServerUrl, language, geocoreArrayOfKeys);

        // Focus on the layers in the response
        const arrayOfJsonConfig = response.layers;

        // replace the GeoCore layers by the GeoView layers returned by the server.
        // If a geocore layer cannot be found in the array of layers returned by the server, we leave it as is in
        // the listOfGeoviewLayerConfig.
        let newListOfGeoviewLayerConfig = listOfGeoviewLayerConfig.map((layerConfig) => {
          if (layerConfig.geoviewLayerType === CV_CONFIG_GEOCORE_TYPE) {
            const jsonConfigFound = arrayOfJsonConfig.find((jsonConfig) => {
              // Remove the duplicate tag from the ID so it will match
              const geocoreId = (layerConfig.geoviewLayerId as string).split(':')[0];
              return jsonConfig.geoviewLayerId === `rcs.${geocoreId}.${language}`;
            });
            if (jsonConfigFound) {
              // take a clone in case the ID is a duplicate so the config can be re-used
              const newConfig = cloneDeep(jsonConfigFound);
              newConfig.geoviewLayerId = layerConfig.geoviewLayerId as string;
              newConfig.isGeocore = true; // We want to remember that the origin is GeoCore.
              return newConfig;
            }
          }
          return layerConfig;
        }) as TypeJsonArray;

        // Print a message to display the layer identifier in error and if the input config is an array and the
        // filterUndefinedValues flag is true, filter out the erroneous GeoCore layers.
        newListOfGeoviewLayerConfig = newListOfGeoviewLayerConfig.filter((layerConfig) => {
          if (layerConfig.geoviewLayerType === CV_CONFIG_GEOCORE_TYPE) {
            logger.logError(`Unable to convert GeoCore layer (Id=${layerConfig.geoviewLayerId}).`);
            // if the config input type is an array and the filterUndefinedValues is on
            return !(filterUndefinedValues || !Array.isArray(config)); // Delete the layer entry
          }
          return true; // Keep the layer
        });

        // return the result according to the config type
        return Array.isArray(config) ? newListOfGeoviewLayerConfig : newListOfGeoviewLayerConfig[0];
      } catch (error: unknown) {
        logger.logError('Failed to process the array of GeoCore layers', geocoreArrayOfKeys, geocoreUrl, error);
      }
    } else return config;
    return undefined;
  }

  /**
   * Processes listOfGeoviewLayers and converts any shapefile entries to geojson.
   * @param {TypeJsonArray | TypeJsonObject} listOfGeoviewLayers Layers to process.
   * @returns {Promise<TypeJsonArray>} The resulting configurations or undefined if there is an error.
   * @static @private
   */
  static async convertShapefileToGeojson(
    listOfGeoviewLayers: TypeJsonArray | TypeJsonObject
  ): Promise<TypeJsonArray | TypeJsonObject | undefined> {
    // convert the JSON object to a JSON array. We want to process a single type.
    const listOfGeoviewLayerConfig = Array.isArray(listOfGeoviewLayers) ? listOfGeoviewLayers : [listOfGeoviewLayers];
    const shapefileConfigs = listOfGeoviewLayerConfig.filter(
      (geoviewLayerConfig) => geoviewLayerConfig.geoviewLayerType === CV_CONFIG_SHAPEFILE_TYPE
    );

    if (shapefileConfigs) {
      const convertedShapefileConfigs = await ShapefileReader.getGVConfigsFromShapefiles(shapefileConfigs);
      let newListOfGeoviewLayerConfig = listOfGeoviewLayerConfig.map((layerConfig) => {
        // Replace any shapefile entries with their converted version
        if (layerConfig.geoviewLayerType === CV_CONFIG_SHAPEFILE_TYPE) {
          const jsonConfigFound = convertedShapefileConfigs.find((convertedConfig) => {
            return convertedConfig.geoviewLayerId === layerConfig.geoviewLayerId;
          });
          if (jsonConfigFound) {
            return jsonConfigFound;
          }
        }

        // Retuen other configs as they appear
        return layerConfig;
      }) as TypeJsonArray;

      // Remove any remaining shapefile entries
      newListOfGeoviewLayerConfig = newListOfGeoviewLayerConfig.filter((layerConfig) => {
        if (layerConfig.geoviewLayerType === CV_CONFIG_SHAPEFILE_TYPE) {
          logger.logError(`Unable to convert shapefile layer (Id=${layerConfig.geoviewLayerId}).`);
          return false;
        }
        return true;
      });

      return newListOfGeoviewLayerConfig;
    }

    return listOfGeoviewLayers;
  }

  /**
   * This method validates the configuration of map elements using the json string or json object supplied by the user.
   * The returned value is a configuration object initialized only from the configuration passed as a parameter.
   * Validation of the configuration based on metadata and application of default values is not performed here,
   * but will be done later using another method.
   *
   * If the configuration is unreadable or generates a fatal error, the default configuration will be returned with
   * the error flag raised and an error message logged in the console. When configuration processing is possible, if
   * errors are detected, the configuration will be corrected to the best of our ability to avoid crashing the viewer,
   * and all changes made will be logged in the console.
   *
   * @param {string | TypeJsonObject} mapConfig The map feature configuration to validate.
   * @returns {MapFeatureConfig} The validated map feature configuration.
   * @static
   */
  static validateMapConfig(mapConfig: string | MapFeatureConfig | TypeJsonObject): MapFeatureConfig {
    // If the user provided a string config, translate it to a json object because the MapFeatureConfig constructor
    // doesn't accept string config. Note that convertStringToJson returns undefined if the string config cannot
    // be translated to a json object.
    const providedMapFeatureConfig: TypeJsonObject =
      typeof mapConfig === 'string' ? ConfigApi.convertStringToJson(mapConfig as string)! : (mapConfig as TypeJsonObject);

    try {
      // If the user provided a valid string config with the mandatory map property, process geocore layers to translate them to their GeoView layers
      if (!providedMapFeatureConfig) throw new MapConfigError('The string configuration provided cannot be translated to a json object');
      if (!providedMapFeatureConfig.map) throw new MapConfigError('The map property is mandatory');

      // Instanciate the mapFeatureConfig. If an error is detected, a workaround procedure
      // will be executed to try to correct the problem in the best possible way.
      ConfigApi.lastMapConfigCreated = new MapFeatureConfig(providedMapFeatureConfig);
    } catch (error: unknown) {
      // If we get here, it is because the user provided a string config that cannot be translated to a json object,
      // or the config doesn't have the mandatory map property or the listOfGeoviewLayerConfig is defined but is not
      // an array.
      if (error instanceof MapConfigError) logger.logError(error.message);
      else logger.logError('ConfigApi.validateMapConfig - An error occured', error);
      const defaultMapConfig = ConfigApi.getDefaultMapFeatureConfig();
      defaultMapConfig.setErrorDetectedFlag();
      ConfigApi.lastMapConfigCreated = defaultMapConfig;
    }
    return ConfigApi.lastMapConfigCreated;
  }

  // /**
  //  * Create the map feature configuration instance using the json string or the json object provided by the user.
  //  * All GeoCore entries found in the config are translated to their corresponding Geoview configuration.
  //  *
  //  * @param {string | TypeJsonObject} mapConfig The map feature configuration to instanciate.
  //  * @param {TypeDisplayLanguage} language The language of the map feature config we want to produce.
  //  *
  //  * @returns {Promise<MapFeatureConfig>} The map feature configuration Promise.
  //  * @static
  //  */
  // // GV: GeoCore layers are processed here, well before the schema validation. The aim is to get rid of these layers in
  // // GV: favor of their GeoView equivalent as soon as possible. Processing is based on the JSON representation of the config,
  // // GV: and requires a minimum of validation to ensure that the configuration of GeoCore layers is valid.
  // static async createMapConfig(mapConfig: string | TypeJsonObject, language: TypeDisplayLanguage): Promise<MapFeatureConfig> {
  //   // If the user provided a string config, translate it to a json object because the MapFeatureConfig constructor
  //   // doesn't accept string config. Note that convertStringToJson returns undefined if the string config cannot
  //   // be translated to a json object.
  //   const providedMapFeatureConfig: TypeJsonObject | undefined =
  //     // We clone to prevent modifications from leaking back to the user object.
  //     typeof mapConfig === 'string' ? ConfigApi.convertStringToJson(mapConfig as string) : (cloneDeep(mapConfig) as TypeJsonObject);

  //   try {
  //     // If the user provided a valid string config with the mandatory map property, process geocore layers to translate them to their GeoView layers
  //     if (!providedMapFeatureConfig) throw new MapConfigError('The string configuration provided cannot be translated to a json object');
  //     if (!providedMapFeatureConfig.map) throw new MapConfigError('The map property is mandatory');
  //     providedMapFeatureConfig.map.listOfGeoviewLayerConfig = (providedMapFeatureConfig.map.listOfGeoviewLayerConfig ||
  //       []) as TypeJsonObject;

  //     const inputLength = providedMapFeatureConfig.map.listOfGeoviewLayerConfig.length;
  //     providedMapFeatureConfig.map.listOfGeoviewLayerConfig = (await ConfigApi.convertGeocoreToGeoview(
  //       language,
  //       providedMapFeatureConfig.map.listOfGeoviewLayerConfig as TypeJsonArray,
  //       providedMapFeatureConfig?.serviceUrls?.geocoreUrl as string
  //     )) as TypeJsonObject;
  //     // TODO: Reinstate this once TODO's in app.tsx 102 and 115 are removed
  //     // providedMapFeatureConfig.map.listOfGeoviewLayerConfig = (await ConfigApi.convertShapefileToGeojson(
  //     //   providedMapFeatureConfig.map.listOfGeoviewLayerConfig
  //     // )) as TypeJsonObject;

  //     const errorDetected = inputLength !== providedMapFeatureConfig.map.listOfGeoviewLayerConfig.length;

  //     // Instanciate the mapFeatureConfig. If an error is detected, a workaround procedure
  //     // will be executed to try to correct the problem in the best possible way.
  //     ConfigApi.lastMapConfigCreated = new MapFeatureConfig(providedMapFeatureConfig);
  //     if (errorDetected) ConfigApi.lastMapConfigCreated.setErrorDetectedFlag();
  //   } catch (error: unknown) {
  //     // If we get here, it is because the user provided a string config that cannot be translated to a json object,
  //     // or the config doesn't have the mandatory map property or the listOfGeoviewLayerConfig is defined but is not
  //     // an array.
  //     if (error instanceof MapConfigError) logger.logError(error.message);
  //     else logger.logError('ConfigApi.createMapConfig - An error occured', error);
  //     const defaultMapConfig = ConfigApi.getDefaultMapFeatureConfig();
  //     defaultMapConfig.setErrorDetectedFlag();
  //     ConfigApi.lastMapConfigCreated = defaultMapConfig;
  //   }

  //   return ConfigApi.lastMapConfigCreated;
  // }

  // /**
  //  * Returns the ESRI Renderer as a Style Config
  //  * @param {string} input The input renderer to be converted to a GeoView Style
  //  * @returns {TypeLayerStyleConfig} The converted style
  //  */
  // static getStyleFromESRIRenderer(input: string): TypeLayerStyleConfig | undefined {
  //   const renderer = this.#convertStringToJson(input);
  //   if (renderer) {
  //     return createStyleUsingEsriRenderer(renderer as unknown as EsriBaseRenderer);
  //   }
  //   return undefined;
  // }
}
