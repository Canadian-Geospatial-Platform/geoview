import { CV_DEFAULT_MAP_FEATURE_CONFIG } from '@config/types/config-constants';
import { TypeJsonObject, toJsonObject } from '@config/types/config-types';
import { TypeDisplayLanguage } from '@config/types/map-schema-types';
import { MapFeatureConfig } from '@config/types/classes/map-feature-config';

/**
 * The API class that create configuration object. It is used to validate and read the service and layer metadata.
 * @exports
 * @class DefaultConfig
 */
export class ConfigApi {
  /**
   * @static
   * Get the default values that are applied to the map feature configuration when the user doesn't provide a value for a field
   * that is covered by a default value.
   * @param {TypeDisplayLanguage} language The language of the map feature config we want to produce.
   *
   * @returns {MapFeatureConfig} The map feature configuration default values.
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
  static getMapConfig(mapConfig: string | TypeJsonObject, language: TypeDisplayLanguage): MapFeatureConfig {
    return new MapFeatureConfig(mapConfig, language);
  }
}
