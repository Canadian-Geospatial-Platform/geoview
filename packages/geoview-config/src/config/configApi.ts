import cloneDeep from 'lodash/cloneDeep';

import { ConfigValidation } from './config-validation';
import { InlineDivConfigReader } from './reader/div-config-reader';
import { JsonConfigReader } from './reader/json-config-reader';
import { URLmapConfigReader } from './reader/url-config-reader';
import { ConfigBaseClass } from '@/config/types/classes/layer-tree-config/config-base-class';
import { CONST_LAYER_TYPES } from './types/config-constants';
import { TypeGeoviewLayerType } from './types/config-types';
import { TypeDisplayLanguage } from './types/map-schema-types';
import { layerEntryIsGroupLayer } from './types/type-guards';
import { convertLayerTypeToEntry } from './utils';
import { logger } from '@/logger';
import { MapFeaturesConfig } from './types/classes/map-features-config';

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** *****************************************************************************************************************************
 * This class groups together all configuration validation methods. It is used to create JSON structures that respect the data
 * format used by the GeoView viewer. Configuration parameters are validated as and when the necessary information becomes
 * available. Users are responsible for persisting the configuration data returned to complete the work they have started.
 *
 * @exports
 * @class ConfigApi
 */
// ******************************************************************************************************************************
export class ConfigApi {
  /** Config validation object used to validate the configuration and define default values */
  configValidation = new ConfigValidation();

  /** ***************************************************************************************************************************
   * The Config class constructor used to instanciate an object of this type.
   * @param {Element | string} mapElement The map element or the string Id of the map.
   *
   * @returns {Promise<MapFeaturesConfig | undefined>} The initialized valid map config.
   */
  /** ***************************************************************************************************************************
   * GetMapConfig returns a validated configuration computed from the map Element passed as a parameter.
   *
   * @param {Element} mapElement The map Element that contains the map configuration to extract and validate.
   *
   * @returns {TypeJsonMapConfig} The validated JSON map configuration associated to the map Element.
   */
  getMapConfig(mapElement: Element): Promise<MapFeaturesConfig | undefined> {
    const defaultMapFeaturesConfig = cloneDeep(this.configValidation.defaultMapFeaturesConfig);

    // get the id from the map element
    const mapId = mapElement.getAttribute('id');

    // update map id if provided in map element
    if (mapId) defaultMapFeaturesConfig.mapId = mapId;

    // get the triggerReadyCallback from the map element
    const triggerReadyCallback = mapElement.getAttribute('triggerReadyCallback');
    if (triggerReadyCallback && !['true', 'false'].includes(triggerReadyCallback.toLowerCase()))
      logger.logError(
        `Invalid value of triggerReadyCallback (${triggerReadyCallback}) on map "${this.configValidation.mapId}".\nDefault value false used.`
      );

    // update triggerReadyCallback if provided in map element
    defaultMapFeaturesConfig.triggerReadyCallback = triggerReadyCallback?.toLowerCase() === 'true' || false;

    // get the display language from the map element
    const displayLanguage = mapElement.getAttribute('data-lang');
    if (displayLanguage && !['fr', 'en'].includes(displayLanguage.toLowerCase()))
      logger.logError(
        `Invalid value of displayLanguage (${displayLanguage}) on map "${this.configValidation.mapId}".\nDefault value "en" used.`
      );

    // update display language if provided in map element
    defaultMapFeaturesConfig.displayLanguage = (displayLanguage?.toLowerCase() === 'fr' ? 'fr' : 'en') as TypeDisplayLanguage;

    return this.extractConfigFromElement(mapId || 'Unknown/Inconnue', mapElement, defaultMapFeaturesConfig);
  }

  /** ***************************************************************************************************************************
   * Initialize a map config from either inline div, url params, json file. Inline config has precedence on JSON file config that
   * has precedence on URL config.
   *
   * @param {string} mapId The map identifier.
   * @param {Element} mapElement The map element of the map.
   * @param {MapFeaturesConfig} defaultMapFeaturesConfig The map element or the string Id of the map.
   *
   * @returns {Promise<MapFeaturesConfig | undefined>} The initialized valid map config.
   */
  async extractConfigFromElement(
    mapId: string,
    mapElement: Element,
    defaultMapFeaturesConfig: MapFeaturesConfig
  ): Promise<MapFeaturesConfig | undefined> {
    // create a new config object to store provided config by user

    // check if inline div config has been passed
    const inlineDivConfig = await InlineDivConfigReader.getMapFeaturesConfig(mapId, mapElement);
    // use inline config if provided
    if (inlineDivConfig) return this.getValidMapConfig(inlineDivConfig);

    // check if a config file url is provided.
    const jsonFileConfig = await JsonConfigReader.getMapFeaturesConfig(mapId, mapElement);
    if (jsonFileConfig) return this.getValidMapConfig(jsonFileConfig);

    // get the value that will check if any url params are passed
    const shared = mapElement.getAttribute('data-shared');
    if (shared && !['true', 'false'].includes(shared.toLowerCase()))
      logger.logError(`Invalid value of data-shared (${shared}) on map "${mapId}".\nDefault value false used.`);
    if (shared?.toLowerCase() === 'true') {
      // check if config params have been passed
      const urlParamsConfig = await URLmapConfigReader.getMapFeaturesConfig(mapId);
      // use the url params config if provided
      if (urlParamsConfig) return this.getValidMapConfig(urlParamsConfig);
    }

    logger.logInfo(`- Map: ${mapId} - Empty JSON configuration object, using default -`);

    return Promise.resolve(defaultMapFeaturesConfig);
  }

  /** ***************************************************************************************************************************
   * Get a valid map configuration.
   *
   * @param {MapFeaturesConfig} defaultMapFeaturesConfig The default Config object that has the field's default values.
   * @param {MapFeaturesConfig} mapFeaturesConfig Config object to validate.
   *
   * @returns {MapFeaturesConfig} A valid map config.
   */
  getValidMapConfig(mapFeaturesConfig: MapFeaturesConfig): MapFeaturesConfig {
    if (mapFeaturesConfig?.map?.listOfGeoviewLayerConfig) {
      mapFeaturesConfig.map.listOfGeoviewLayerConfig.forEach((geoviewLayerEntry) => {
        if (!Object.values(CONST_LAYER_TYPES).includes(geoviewLayerEntry.geoviewLayerType))
          throw new Error(`Invalid GeoView Layer Type ${geoviewLayerEntry.geoviewLayerType}`);
      });
    }
    return this.configValidation.validateMapConfigAgainstSchema(mapFeaturesConfig);
  }

  /** ***************************************************************************************************************************
   * Initialize all layer entry type fields accordingly to the GeoView layer type.
   * @param {ConfigBaseClass} listOfLayerEntryConfig The list of layer entry configuration to adjust.
   * @param {TypeGeoviewLayerType} geoviewLayerType The GeoView layer type.
   */
  private setLayerEntryType(listOfLayerEntryConfig: ConfigBaseClass[], geoviewLayerType: TypeGeoviewLayerType): void {
    listOfLayerEntryConfig?.forEach((layerConfig) => {
      if (layerEntryIsGroupLayer(layerConfig)) this.setLayerEntryType(layerConfig.listOfLayerEntryConfig!, geoviewLayerType);
      else {
        // eslint-disable-next-line no-param-reassign
        (layerConfig as ConfigBaseClass).geoviewLayerType = geoviewLayerType;
        // eslint-disable-next-line no-param-reassign
        (layerConfig as ConfigBaseClass).entryType = convertLayerTypeToEntry(geoviewLayerType);
      }
    });
  }
}
