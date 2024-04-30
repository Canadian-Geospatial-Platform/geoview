import { CV_DEFAULT_MAP_FEATURES_CONFIG } from '@config/types/config-constants';
import { Cast } from '@config/types/config-types';
import { TypeDisplayLanguage } from '@config/types/map-schema-types';
import { MapFeaturesConfig } from '@config/types/classes/map-features-config';

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
   * Get map features configuration object.
   *
   * @returns {MapFeaturesConfig} The map features configuration.
   */
  static get defaultMapFeaturesConfig(): MapFeaturesConfig {
    return Cast<MapFeaturesConfig>(JSON.stringify(CV_DEFAULT_MAP_FEATURES_CONFIG));
  }

  static getMapConfig(jsonStringMapConfig: string, language: TypeDisplayLanguage): MapFeaturesConfig {
    // Return the config
    return new MapFeaturesConfig(jsonStringMapConfig, language);
  }
}
