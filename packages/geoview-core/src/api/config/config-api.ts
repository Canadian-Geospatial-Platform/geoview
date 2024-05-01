import { CV_DEFAULT_MAP_FEATURE_CONFIG } from '@config/types/config-constants';
import { toJsonObject } from '@config/types/config-types';
import { TypeDisplayLanguage } from '@config/types/map-schema-types';
import { MapFeatureConfig } from '@/api/config/types/classes/map-feature-config';

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** *****************************************************************************************************************************
 * A class to define the default values of a GeoView map configuration and validation methods for the map config attributes.
 * @exports
 * @class DefaultConfig
 */
// ******************************************************************************************************************************
export class ConfigApi {
  /** ***************************************************************************************************************************
   * Get map feature configuration object.
   *
   * @returns {MapFeatureConfig} The map feature configuration.
   */
  static getDefaultMapFeatureConfig(language: TypeDisplayLanguage): MapFeatureConfig {
    return new MapFeatureConfig(toJsonObject(CV_DEFAULT_MAP_FEATURE_CONFIG), language);
  }

  static getMapConfig(jsonStringMapConfig: string, language: TypeDisplayLanguage): MapFeatureConfig {
    // Return the config
    return new MapFeatureConfig(jsonStringMapConfig, language);
  }
}
