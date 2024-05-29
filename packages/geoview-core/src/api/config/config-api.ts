import { CV_DEFAULT_MAP_FEATURE_CONFIG } from '@config/types/config-constants';
import { Cast, TypeJsonValue, TypeJsonObject, toJsonObject, TypeJsonArray } from '@config/types/config-types';
import { MapFeatureConfig } from '@config/types/classes/map-feature-config';
import { UUIDmapConfigReader } from '@config/uuid-config-reader';
import { TypeDisplayLanguage } from '@config/types/map-schema-types';
import { logger } from '@/core//utils/logger';
import { isJsonString, removeCommentsFromJSON } from '@/core/utils/utilities';

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
   * @param {string | TypeJsonObject} mapConfig The map feature configuration to instanciate.
   * @param {TypeDisplayLanguage} language The language of the map feature config we want to produce.
   *
   * @returns {MapFeatureConfig} The map feature configuration.
   */
  static async getMapConfig(mapConfig: string | TypeJsonObject, language: TypeDisplayLanguage): Promise<MapFeatureConfig> {
    const providedMapFeatureConfig: TypeJsonObject | undefined =
      typeof mapConfig === 'string' ? ConfigApi.#getJsonObjectFromString(mapConfig as string) : (mapConfig as TypeJsonObject);

    if (providedMapFeatureConfig) {
      if (Array.isArray(providedMapFeatureConfig?.map?.listOfGeoviewLayerConfig)) {
        const geocoreUrl = (providedMapFeatureConfig?.serviceUrls?.geocoreUrl ||
          CV_DEFAULT_MAP_FEATURE_CONFIG.serviceUrls.geocoreUrl) as string;
        providedMapFeatureConfig.map.listOfGeoviewLayerConfig.forEach((layerConfig, i) => {
          if (layerConfig.geoviewLayerType.toString().toLowerCase() === 'geocore')
            providedMapFeatureConfig.map.listOfGeoviewLayerConfig[i].geoviewLayerType = 'geocore' as TypeJsonObject;
        });
        const geocoreArray = providedMapFeatureConfig.map.listOfGeoviewLayerConfig.filter(
          (layerConfig) => layerConfig.geoviewLayerType === 'geocore'
        );
        const geocoreArrayOfKeys = geocoreArray.map<string>((geocoreLayer) => {
          return geocoreLayer.geoviewLayerId as string;
        });
        try {
          // Get the layers config
          const arrayOfJsonConfig = await UUIDmapConfigReader.getGVConfigFromUUIDs(geocoreUrl, language, geocoreArrayOfKeys);
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
            }
          });
          return new MapFeatureConfig(providedMapFeatureConfig!, language);
        } catch (error) {
          // Log
          logger.logError('Failed to get the GeoView layers', geocoreArrayOfKeys, geocoreUrl, error);
        }
      }
    }
    const defaultMapConfig = ConfigApi.getDefaultMapFeatureConfig(language);
    defaultMapConfig.propagateError();
    return defaultMapConfig;
  }
}
