import { CV_DEFAULT_MAP_FEATURE_CONFIG } from '@config/types/config-constants';
import { Cast, TypeJsonValue, TypeJsonObject, toJsonObject, TypeJsonArray } from '@config/types/config-types';
import { MapFeatureConfig } from '@config/types/classes/map-feature-config';
import { UUIDmapConfigReader } from '@config/uuid-config-reader';
import { TypeDisplayLanguage } from '@config/types/map-schema-types';
import { MapConfigError } from '@config/types/classes/config-exceptions';
import { isJsonString, removeCommentsFromJSON } from '@/core/utils/utilities';
import { logger } from '@/core//utils/logger';

/**
 * The API class that create configuration object. It is used to validate and read the service and layer metadata.
 * @exports
 * @class DefaultConfig
 */
export class ConfigApi {
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
   * @staric @private
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
   * @static
   * Get the map feature configuration instance using the json string or the json object provided by the user. When the user
   * doesn't provide a value for a field that is covered by a default value, the default is used.
   *
   * @param {string | TypeJsonObject} mapConfig The map feature configuration to instanciate.
   * @param {TypeDisplayLanguage} language The language of the map feature config we want to produce.
   *
   * @returns {MapFeatureConfig} The map feature configuration.
   */
  // GV: GeoCore layers are processed here, well before the schema validation. The aim is to get rid of these layers in
  // GV: favor of their GeoView equivalent as soon as possible. Processing is based on the JSON representation of the config,
  // GV: and requires a minimum of validation to ensure that the configuration of GeoCore layers is valid.
  static async getMapConfig(mapConfig: string | TypeJsonObject, language: TypeDisplayLanguage): Promise<MapFeatureConfig> {
    // If the user provided a string config, translate it to a json object because the MapFeatureConfig constructor
    // doesn't accept string config. Note that getJsonObjectFromString returns undefined if the string config cannot
    // be translated to a json object.
    const providedMapFeatureConfig: TypeJsonObject | undefined =
      typeof mapConfig === 'string' ? ConfigApi.#getJsonObjectFromString(mapConfig as string) : (mapConfig as TypeJsonObject);

    try {
      // If the user provided a valid string config with the mandatory map property, process geocore layers to translate them to their GeoView layers
      if (!providedMapFeatureConfig) throw new MapConfigError('The string configuration provided cannot be translated to a json object');
      if (!providedMapFeatureConfig.map) throw new MapConfigError('The map property is mandatory');

      // The listOfGeoviewLayerConfig must be an array, otherwise there is an error.
      providedMapFeatureConfig.map.listOfGeoviewLayerConfig = (providedMapFeatureConfig.map.listOfGeoviewLayerConfig ||
        []) as TypeJsonObject;
      if (!Array.isArray(providedMapFeatureConfig.map.listOfGeoviewLayerConfig))
        throw new MapConfigError('The property listOfGeoviewLayerConfig must be an array');

      // Get the geocore URL from the config, otherwise use the default URL.
      const geocoreUrl = (providedMapFeatureConfig?.serviceUrls?.geocoreUrl ||
        CV_DEFAULT_MAP_FEATURE_CONFIG.serviceUrls.geocoreUrl) as string;

      // Convert all geoviewLayerType containing the value 'geocore' to lowercase, regardless of the case used.
      // We do this because we want the 'geocore' test to be case-insensitive.
      providedMapFeatureConfig.map.listOfGeoviewLayerConfig.forEach((layerConfig, i) => {
        if (layerConfig.geoviewLayerType.toString().toLowerCase() === 'geocore')
          providedMapFeatureConfig.map.listOfGeoviewLayerConfig[i].geoviewLayerType = 'geocore' as TypeJsonObject;
      });

      // Filter all geocore layers and convert the result into an array of geoviewLayerId
      const geocoreArrayOfKeys = providedMapFeatureConfig.map.listOfGeoviewLayerConfig
        .filter((layerConfig) => layerConfig.geoviewLayerType === 'geocore')
        .map<string>((geocoreLayer) => {
          return geocoreLayer.geoviewLayerId as string;
        });

      // If the listOfGeoviewLayerConfig contains GeoCore layers, process them.
      if (geocoreArrayOfKeys.length) {
        try {
          // Get the GeoView configurations using the array of GeoCore identifiers.
          const arrayOfJsonConfig = await UUIDmapConfigReader.getGVConfigFromUUIDs(geocoreUrl, language, geocoreArrayOfKeys);

          // replace the GeoCore layers by the GeoView layers returned by the server.
          providedMapFeatureConfig.map.listOfGeoviewLayerConfig.forEach((layerConfig, i) => {
            if (layerConfig.geoviewLayerType === 'geocore') {
              const jsonConfigFound = arrayOfJsonConfig.find(
                (jsonConfig) => jsonConfig.geoviewLayerId === `rcs.${layerConfig.geoviewLayerId}.${language}`
              );
              if (jsonConfigFound) {
                providedMapFeatureConfig.map.listOfGeoviewLayerConfig[i] = jsonConfigFound;
                providedMapFeatureConfig.map.listOfGeoviewLayerConfig[i].geoviewLayerId = layerConfig.geoviewLayerId;
                providedMapFeatureConfig.map.listOfGeoviewLayerConfig[i].isGeocore = true as TypeJsonObject;
              }
              // If the geocore layer cannot be found in the array of layers returned by the server, we leave it as is in
              // the listOfGeoviewLayerConfig. The error will be detected later oby the MapFeatureConfig instanciation.
            }
          });
        } catch (error) {
          // Log
          logger.logWarning('Failed to process the array of GeoCore layers', geocoreArrayOfKeys, geocoreUrl, error);
        }
      }
      // Filter out the erroneous GeoCore layers and print a message to display the layer identifier in error.
      let errorDetected = false; // Variable to remember that an error occured.
      providedMapFeatureConfig.map.listOfGeoviewLayerConfig = providedMapFeatureConfig.map.listOfGeoviewLayerConfig.filter(
        (layerConfig) => {
          if (layerConfig.geoviewLayerType === 'geocore') {
            logger.logError(`Unable to convert GeoCore layer (Id=${layerConfig.geoviewLayerId}).`);
            errorDetected = true;
            return false; // Delete the layer
          }
          return true; // Keep the layer
        }
      ) as TypeJsonObject;
      const mapFeatureConfig = new MapFeatureConfig(providedMapFeatureConfig!, language);
      if (errorDetected) mapFeatureConfig.propagateError();
      return mapFeatureConfig;
    } catch (error) {
      // If we get here, it is because the user provided a string config that cannot be translated to a json object,
      // or the config doesn't have the mandatory map property or the listOfGeoviewLayerConfig is defined but is not
      // an array or the geocore fetch failed.
      logger.logError((error as MapConfigError).message);
      const defaultMapConfig = ConfigApi.getDefaultMapFeatureConfig(language);
      defaultMapConfig.propagateError();
      return defaultMapConfig;
    }
  }
}
