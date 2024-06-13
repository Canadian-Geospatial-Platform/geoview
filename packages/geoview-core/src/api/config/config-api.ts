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
  static #getJsonObjectFromString(stringMapFeatureConfig: string): TypeJsonObject | undefined {
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
   * Convert all the GeoCore entries to their GeoView equivalents.
   *
   * @param {TypeDisplayLanguage} language The language language to use for the conversion.
   * @param {TypeJsonArray} listOfGeoviewLayerConfig The list of layers to process.
   * @param {string} geocoreUrl Optional GeoCore server URL.
   *
   * @returns {Promise<TypeJsonArray>} The resulting list of layer configurations.
   * @static @private
   */
  static async #geocoreToGeoview(
    language: TypeDisplayLanguage,
    listOfGeoviewLayerConfig?: TypeJsonArray,
    geocoreUrl?: string
  ): Promise<TypeJsonArray> {
    // return an empty array if listOfGeoviewLayerConfig is undefined.
    if (!listOfGeoviewLayerConfig) return [];
    // The listOfGeoviewLayerConfig must be an array, otherwise there is an error.
    if (!Array.isArray(listOfGeoviewLayerConfig)) throw new MapConfigError('The property listOfGeoviewLayerConfig must be an array');

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
        return listOfGeoviewLayerConfig.map((layerConfig) => {
          if (layerConfig.geoviewLayerType === CV_CONFIG_GEOCORE_TYPE) {
            const jsonConfigFound = arrayOfJsonConfig.find(
              (jsonConfig) => jsonConfig.geoviewLayerId === `rcs.${layerConfig.geoviewLayerId}.${language}`
            );
            if (jsonConfigFound) {
              jsonConfigFound.geoviewLayerId = layerConfig.geoviewLayerId;
              jsonConfigFound.isGeocore = true as TypeJsonObject;
              return jsonConfigFound;
            }
            // If a geocore layer cannot be found in the array of layers returned by the server, we leave it as is in
            // the listOfGeoviewLayerConfig. It will be deleted in the post processing phase lower.
          }
          return layerConfig;
        }) as TypeJsonArray;
      } catch (error) {
        // Log
        logger.logError('Failed to process the array of GeoCore layers', geocoreArrayOfKeys, geocoreUrl, error);
      }
    }
    return listOfGeoviewLayerConfig;
  }

  // TODO: Change the code below using the schema provided during our last meating. This change must be done in the next PR
  /**
   * Create the map feature configuration instance using the json string or the json object provided by the user. When the user
   * doesn't provide a value for a field that is covered by a default value, the default is used.
   *
   * @param {string | TypeJsonObject} mapConfig The map feature configuration to instanciate.
   * @param {TypeDisplayLanguage} language The language of the map feature config we want to produce.
   *
   * @returns {MapFeatureConfig} The map feature configuration.
   * @static
   */
  // GV: GeoCore layers are processed here, well before the schema validation. The aim is to get rid of these layers in
  // GV: favor of their GeoView equivalent as soon as possible. Processing is based on the JSON representation of the config,
  // GV: and requires a minimum of validation to ensure that the configuration of GeoCore layers is valid.
  static async createMapConfig(mapConfig: string | TypeJsonObject, language: TypeDisplayLanguage): Promise<MapFeatureConfig> {
    // If the user provided a string config, translate it to a json object because the MapFeatureConfig constructor
    // doesn't accept string config. Note that getJsonObjectFromString returns undefined if the string config cannot
    // be translated to a json object.
    const providedMapFeatureConfig: TypeJsonObject | undefined =
      typeof mapConfig === 'string' ? ConfigApi.#getJsonObjectFromString(mapConfig as string) : (mapConfig as TypeJsonObject);

    try {
      // If the user provided a valid string config with the mandatory map property, process geocore layers to translate them to their GeoView layers
      if (!providedMapFeatureConfig) throw new MapConfigError('The string configuration provided cannot be translated to a json object');
      if (!providedMapFeatureConfig.map) throw new MapConfigError('The map property is mandatory');

      providedMapFeatureConfig.map.listOfGeoviewLayerConfig = (await ConfigApi.#geocoreToGeoview(
        language,
        providedMapFeatureConfig.map.listOfGeoviewLayerConfig as TypeJsonArray,
        providedMapFeatureConfig?.serviceUrls?.geocoreUrl as string
      )) as TypeJsonObject;

      // Filter out the erroneous GeoCore layers and print a message to display the layer identifier in error.
      let geocoreErrorDetected = false; // Variable to remember that an error occured.
      providedMapFeatureConfig.map.listOfGeoviewLayerConfig = (
        providedMapFeatureConfig.map.listOfGeoviewLayerConfig as TypeJsonArray
      ).filter((layerConfig) => {
        if (layerConfig.geoviewLayerType === CV_CONFIG_GEOCORE_TYPE) {
          logger.logError(`Unable to convert GeoCore layer (Id=${layerConfig.geoviewLayerId}).`);
          geocoreErrorDetected = true;
          return false; // Delete the layer
        }
        return true; // Keep the layer
      }) as TypeJsonObject;

      // Instanciate the mapFeatureConfig. If an error is detected, a workaround procedure
      // will be executed to try to correct the problem in the best possible way.
      const mapFeatureConfig = new MapFeatureConfig(providedMapFeatureConfig!, language);
      if (geocoreErrorDetected) mapFeatureConfig.setErrorDetectedFlag(); // If a geocore error was detected, signal it.

      ConfigApi.lastMapConfigCreated = mapFeatureConfig;
    } catch (error) {
      // If we get here, it is because the user provided a string config that cannot be translated to a json object,
      // or the config doesn't have the mandatory map property or the listOfGeoviewLayerConfig is defined but is not
      // an array.
      if (error instanceof MapConfigError) logger.logError(error.message);
      else logger.logError('ConfigApi.createMapConfig - An erroroccured', error);
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
    let geoviewLayerConfig: TypeJsonObject;
    if (layerType === CV_CONFIG_GEOCORE_TYPE) {
      try {
        const layerConfig = { geoviewLayerId: serviceAccessString, geoviewLayerType: layerType };
        [geoviewLayerConfig] = await ConfigApi.#geocoreToGeoview(language, Cast<TypeJsonArray>([layerConfig]));
        if (geoviewLayerConfig.geoviewLayerType === CV_CONFIG_GEOCORE_TYPE) return undefined;
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
