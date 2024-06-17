import { CV_DEFAULT_MAP_FEATURE_CONFIG, CV_CONFIG_GEOCORE_TYPE } from '@config/types/config-constants';
import { Cast, TypeJsonValue, TypeJsonObject, toJsonObject, TypeJsonArray } from '@config/types/config-types';
import { MapFeatureConfig } from '@config/types/classes/map-feature-config';
import { UUIDmapConfigReader } from '@config/uuid-config-reader';
import { AbstractGeoviewLayerConfig, TypeDisplayLanguage, TypeGeoviewLayerType } from '@config/types/map-schema-types';
import { MapConfigError } from '@config/types/classes/config-exceptions';

import { generateId, isJsonString, removeCommentsFromJSON } from '@/core/utils/utilities';
import { logger } from '@/core//utils/logger';

/**
 * The API class that create configuration object. It is used to validate and read the service and layer metadata.
 * @exports
 * @class DefaultConfig
 */
export class ConfigApi {
  // GV: The two following properties was created only for debugging purpose. They allow developers to inspect the
  // GV: content or call the methods of the last instance created by the corresponding ConfigApi call.
  /** Static property that contains the last object instanciated by the ConfigApi.getLayerConfig call */
  static lastLayerConfigCreated?: AbstractGeoviewLayerConfig;

  /** Static property that contains the last object instanciated by the ConfigApi.createMapConfig call */
  static lastMapConfigCreated?: MapFeatureConfig;

  /**
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

        obj[key] = Cast<TypeJsonObject>(value);
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
              obj[key] = Cast<TypeJsonObject>(true);
            } else if (prop[1] === 'false') {
              obj[key] = Cast<TypeJsonObject>(false);
            } else {
              obj[key] = Cast<TypeJsonObject>(value);
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
  static #convertStringToJson(stringMapFeatureConfig: string): TypeJsonObject | undefined {
    // Erase comments in the config file.
    let newStringMapFeatureConfig = removeCommentsFromJSON(stringMapFeatureConfig as string);

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
    const jsonConfig = {} as TypeJsonObject;

    // update the language if provided from the map configuration.
    const displayLanguage = (urlParams.l as TypeDisplayLanguage) || 'en';

    if (Object.keys(urlParams).length && !urlParams.geoms) {
      // Ex: p=3857&z=4&c=40,-100&l=en&t=dark&b=basemapId:transport,shaded:false,labeled:true&i=dynamic&cp=details-panel,layers-panel&cc=overview-map&keys=12acd145-626a-49eb-b850-0a59c9bc7506,ccc75c12-5acc-4a6a-959f-ef6f621147b9

      // get center
      let center: string[] = [];
      if (urlParams.c) center = (urlParams.c as string).split(',');
      if (center.length !== 2)
        center = [
          CV_DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.initialView!.zoomAndCenter![1][0]!.toString(),
          CV_DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.initialView!.zoomAndCenter![1][1].toString(),
        ];

      // get zoom
      let zoom = CV_DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.initialView!.zoomAndCenter![0].toString();
      if (urlParams.z) zoom = urlParams.z as string;

      jsonConfig.map = {
        interaction: urlParams.i as TypeJsonObject,
        viewSettings: {
          initialView: {
            zoomAndCenter: [parseInt(zoom, 10), [parseInt(center[0], 10), parseInt(center[1], 10)]] as TypeJsonObject,
          },
          projection: parseInt(urlParams.p as string, 10) as TypeJsonObject,
        },
        basemapOptions: ConfigApi.#parseObjectFromUrl(urlParams.b as string),
        listOfGeoviewLayerConfig: Cast<TypeJsonObject>([]),
      };

      // get layer information from catalog using their uuid's if any passed from url params
      if (urlParams.keys) {
        try {
          // Get the layers config
          const promise = UUIDmapConfigReader.getGVConfigFromUUIDs(
            CV_DEFAULT_MAP_FEATURE_CONFIG.serviceUrls.geocoreUrl,
            displayLanguage.split('-')[0],
            urlParams.keys.toString().split(',')
          );
          (jsonConfig.map.listOfGeoviewLayerConfig as TypeJsonObject[]) = await promise;
        } catch (error) {
          // Log
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
      jsonConfig.schemaVersionUsed = urlParams.v as TypeJsonObject;
    }

    // Trace the detail config read from url
    logger.logTraceDetailed('URL Config - ', jsonConfig);

    return new MapFeatureConfig(jsonConfig, displayLanguage);
  }

  /**
   * Get the default values that are applied to the map feature configuration when the user doesn't provide a value for a field
   * that is covered by a default value.
   * @param {TypeDisplayLanguage} language The language of the map feature config we want to produce.
   *
   * @returns {MapFeatureConfig} The map feature configuration default values.
   * @static
   */
  static getDefaultMapFeatureConfig(language: TypeDisplayLanguage): MapFeatureConfig {
    return new MapFeatureConfig(toJsonObject(CV_DEFAULT_MAP_FEATURE_CONFIG), language);
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
    filterUndefinedValues = true
  ): Promise<TypeJsonArray | TypeJsonObject | undefined> {
    // convert the JSON object to a JSON array. We want to process a single type.
    const listOfGeoviewLayerConfig = Array.isArray(config) ? config : [config];

    // Get the geocore URL from the config, otherwise use the default URL.
    const geocoreServerUrl = geocoreUrl || CV_DEFAULT_MAP_FEATURE_CONFIG.serviceUrls.geocoreUrl;

    // Filter all geocore layers and convert the result into an array of geoviewLayerId.
    const geocoreArrayOfKeys = listOfGeoviewLayerConfig
      .filter((layerConfig) => layerConfig.geoviewLayerType === CV_CONFIG_GEOCORE_TYPE)
      .map<string>((geocoreLayer) => {
        return geocoreLayer.geoviewLayerId as string;
      });

    // If the listOfGeoviewLayerConfig contains GeoCore layers, process them.
    if (geocoreArrayOfKeys.length) {
      try {
        // Get the GeoView configurations using the array of GeoCore identifiers.
        const arrayOfJsonConfig = await UUIDmapConfigReader.getGVConfigFromUUIDs(geocoreServerUrl, language, geocoreArrayOfKeys);

        // replace the GeoCore layers by the GeoView layers returned by the server.
        // If a geocore layer cannot be found in the array of layers returned by the server, we leave it as is in
        // the listOfGeoviewLayerConfig.
        let newListOfGeoviewLayerConfig = listOfGeoviewLayerConfig.map((layerConfig) => {
          if (layerConfig.geoviewLayerType === CV_CONFIG_GEOCORE_TYPE) {
            const jsonConfigFound = arrayOfJsonConfig.find(
              (jsonConfig) => jsonConfig.geoviewLayerId === `rcs.${layerConfig.geoviewLayerId}.${language}`
            );
            if (jsonConfigFound) {
              jsonConfigFound.geoviewLayerId = layerConfig.geoviewLayerId;
              jsonConfigFound.isGeocore = true as TypeJsonObject; // We want to remember that the origin is GeoCore.
              return jsonConfigFound;
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
            return !(Array.isArray(config) && filterUndefinedValues); // Delete the layer entry
          }
          return true; // Keep the layer
        });

        // return the result according to the config type
        return Array.isArray(config) ? newListOfGeoviewLayerConfig : newListOfGeoviewLayerConfig[0];
      } catch (error) {
        logger.logError('Failed to process the array of GeoCore layers', geocoreArrayOfKeys, geocoreUrl, error);
      }
    } else return config;
    return undefined;
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
   * @param {TypeDisplayLanguage} language The language of the map feature config we want to produce.
   *
   * @returns {MapFeatureConfig} The validated map feature configuration.
   * @static
   */
  static validateMapConfig(mapConfig: string | TypeJsonObject, language: TypeDisplayLanguage): MapFeatureConfig {
    // If the user provided a string config, translate it to a json object because the MapFeatureConfig constructor
    // doesn't accept string config. Note that convertStringToJson returns undefined if the string config cannot
    // be translated to a json object.
    const providedMapFeatureConfig: TypeJsonObject | undefined =
      typeof mapConfig === 'string' ? ConfigApi.#convertStringToJson(mapConfig as string) : (mapConfig as TypeJsonObject);

    try {
      // If the user provided a valid string config with the mandatory map property, process geocore layers to translate them to their GeoView layers
      if (!providedMapFeatureConfig) throw new MapConfigError('The string configuration provided cannot be translated to a json object');
      if (!providedMapFeatureConfig.map) throw new MapConfigError('The map property is mandatory');

      // Instanciate the mapFeatureConfig. If an error is detected, a workaround procedure
      // will be executed to try to correct the problem in the best possible way.
      ConfigApi.lastMapConfigCreated = new MapFeatureConfig(providedMapFeatureConfig!, language);
    } catch (error) {
      // If we get here, it is because the user provided a string config that cannot be translated to a json object,
      // or the config doesn't have the mandatory map property or the listOfGeoviewLayerConfig is defined but is not
      // an array.
      if (error instanceof MapConfigError) logger.logError(error.message);
      else logger.logError('ConfigApi.validateMapConfig - An error occured', error);
      const defaultMapConfig = ConfigApi.getDefaultMapFeatureConfig(language);
      defaultMapConfig.setErrorDetectedFlag();
      ConfigApi.lastMapConfigCreated = defaultMapConfig;
    }
    return ConfigApi.lastMapConfigCreated;
  }

  /**
   * Create the map feature configuration instance using the json string or the json object provided by the user. When the user
   * doesn't provide a value for a field that is covered by a default value, the default is used.
   *
   * @param {string | TypeJsonObject} mapConfig The map feature configuration to instanciate.
   * @param {TypeDisplayLanguage} language The language of the map feature config we want to produce.
   *
   * @returns {Promise<MapFeatureConfig>} The map feature configuration Promise.
   * @static
   */
  // GV: GeoCore layers are processed here, well before the schema validation. The aim is to get rid of these layers in
  // GV: favor of their GeoView equivalent as soon as possible. Processing is based on the JSON representation of the config,
  // GV: and requires a minimum of validation to ensure that the configuration of GeoCore layers is valid.
  static async createMapConfig(mapConfig: string | TypeJsonObject, language: TypeDisplayLanguage): Promise<MapFeatureConfig> {
    // If the user provided a string config, translate it to a json object because the MapFeatureConfig constructor
    // doesn't accept string config. Note that convertStringToJson returns undefined if the string config cannot
    // be translated to a json object.
    const providedMapFeatureConfig: TypeJsonObject | undefined =
      typeof mapConfig === 'string' ? ConfigApi.#convertStringToJson(mapConfig as string) : (mapConfig as TypeJsonObject);

    try {
      // If the user provided a valid string config with the mandatory map property, process geocore layers to translate them to their GeoView layers
      if (!providedMapFeatureConfig) throw new MapConfigError('The string configuration provided cannot be translated to a json object');
      if (!providedMapFeatureConfig.map) throw new MapConfigError('The map property is mandatory');

      const inputLength = providedMapFeatureConfig.map.listOfGeoviewLayerConfig.length;
      providedMapFeatureConfig.map.listOfGeoviewLayerConfig = (await ConfigApi.convertGeocoreToGeoview(
        language,
        providedMapFeatureConfig.map.listOfGeoviewLayerConfig as TypeJsonArray,
        providedMapFeatureConfig?.serviceUrls?.geocoreUrl as string
      )) as TypeJsonObject;
      const errorDetected = inputLength !== providedMapFeatureConfig.map.listOfGeoviewLayerConfig.length;

      // Instanciate the mapFeatureConfig. If an error is detected, a workaround procedure
      // will be executed to try to correct the problem in the best possible way.
      ConfigApi.lastMapConfigCreated = new MapFeatureConfig(providedMapFeatureConfig!, language);
      if (errorDetected) ConfigApi.lastMapConfigCreated.setErrorDetectedFlag();
    } catch (error) {
      // If we get here, it is because the user provided a string config that cannot be translated to a json object,
      // or the config doesn't have the mandatory map property or the listOfGeoviewLayerConfig is defined but is not
      // an array.
      if (error instanceof MapConfigError) logger.logError(error.message);
      else logger.logError('ConfigApi.validateMapConfig - An error occured', error);
      const defaultMapConfig = ConfigApi.getDefaultMapFeatureConfig(language);
      defaultMapConfig.setErrorDetectedFlag();
      ConfigApi.lastMapConfigCreated = defaultMapConfig;
    }
    return ConfigApi.lastMapConfigCreated;
  }

  /**
   * Create the layer configuration instance using the layer access string and layer type provided by the user.
   *
   * @param {string} serviceAccessString The service access string (a URL or a layer identifier).
   * @param {TypeGeoviewLayerType | CV_CONFIG_GEOCORE_TYPE} layerType The GeoView layer type or 'geoCore'.
   *
   * @returns {AbstractGeoviewLayerConfig | undefined} The layer configuration or undefined if there is an error.
   * @static
   */
  // GV: GeoCore layers are processed here, well before the schema validation. The aim is to get rid of these layers in
  // GV: favor of their GeoView equivalent as soon as possible.
  static async createLayerConfig(
    serviceAccessString: string,
    layerType: TypeGeoviewLayerType | typeof CV_CONFIG_GEOCORE_TYPE,
    language: TypeDisplayLanguage = 'en'
  ): Promise<AbstractGeoviewLayerConfig | undefined> {
    let geoviewLayerConfig: TypeJsonObject | undefined;
    if (layerType === CV_CONFIG_GEOCORE_TYPE) {
      try {
        const layerConfig = { geoviewLayerId: serviceAccessString, geoviewLayerType: layerType };
        geoviewLayerConfig = (await ConfigApi.convertGeocoreToGeoview(language, Cast<TypeJsonObject>(layerConfig))) as TypeJsonObject;
      } catch (error) {
        logger.logError(`Unable to convert GeoCore layer (Id=${serviceAccessString}).`);
        return undefined;
      }
    } else {
      geoviewLayerConfig = Cast<TypeJsonObject>({
        geoviewLayerId: generateId(),
        geoviewLayerName: { en: 'unknown', fr: 'inconnu' },
        geoviewLayerType: layerType,
        metadataAccessPath: { en: serviceAccessString },
        listOfLayerEntryConfig: [],
      });
    }

    // Create a layer configuration instance and validate it against the schema.
    ConfigApi.lastLayerConfigCreated = MapFeatureConfig.nodeFactory(geoviewLayerConfig, language);
    return ConfigApi.lastLayerConfigCreated;
  }
}
