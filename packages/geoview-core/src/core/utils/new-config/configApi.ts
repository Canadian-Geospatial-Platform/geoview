import cloneDeep from 'lodash/cloneDeep';

import {
  convertLayerTypeToEntry,
  TypeDisplayLanguage,
  TypeListOfLayerEntryConfig,
  layerEntryIsGroupLayer,
  mapConfigLayerEntryIsGeoCore,
} from '@/geo/map/map-schema-types';
import { CONST_LAYER_TYPES, TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { logger } from '@/core/utils/logger';

import { TypeGeoviewLayerConfig, TypeMapFeaturesConfig } from '@/core/types/global-types';
import { ConfigValidation } from '@/core/utils/config/config-validation';
import { InlineDivConfigReader } from '@/core/utils/config/reader/div-config-reader';
import { JsonConfigReader } from '@/core/utils/config/reader/json-config-reader';
import { URLmapConfigReader } from '@/core/utils/config/reader/url-config-reader';
import { ConfigBaseClass } from '../config/validation-classes/config-base-class';

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
   * @returns {Promise<TypeMapFeaturesConfig | undefined>} The initialized valid map config.
   */
  /** ***************************************************************************************************************************
   * GetMapConfig returns a validated configuration computed from the map Element passed as a parameter.
   *
   * @param {Element} mapElement The map Element that contains the map configuration to extract and validate.
   *
   * @returns {TypeJsonMapConfig} The validated JSON map configuration associated to the map Element.
   */
  getMapConfig(mapElement: Element): Promise<TypeMapFeaturesConfig | undefined> {
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

    return this.extractConfigFromElement(mapElement, defaultMapFeaturesConfig);
  }

  /** ***************************************************************************************************************************
   * Initialize a map config from either inline div, url params, json file. Inline config has precedence on JSON file config that
   * has precedence on URL config.
   *
   * @param {Element | string} mapElement The map element or the string Id of the map.
   *
   * @returns {Promise<TypeMapFeaturesConfig | undefined>} The initialized valid map config.
   */
  async extractConfigFromElement(
    mapElement: Element,
    defaultMapFeaturesConfig: TypeMapFeaturesConfig
  ): Promise<TypeMapFeaturesConfig | undefined> {
    // create a new config object to store provided config by user
    let mapFeaturesConfig: TypeMapFeaturesConfig | undefined;

    // check if inline div config has been passed
    const inlineDivConfig = await InlineDivConfigReader.getMapFeaturesConfig(defaultMapFeaturesConfig.mapId, mapElement);

    // use inline config if provided
    if (inlineDivConfig) mapFeaturesConfig = { ...inlineDivConfig };
    else {
      // check if a config file url is provided.
      const jsonFileConfig = await JsonConfigReader.getMapFeaturesConfig(defaultMapFeaturesConfig.mapId, mapElement);

      if (jsonFileConfig) mapFeaturesConfig = { ...jsonFileConfig };
      else {
        // get the value that will check if any url params are passed
        const shared = mapElement.getAttribute('data-shared');
        if (shared && !['true', 'false'].includes(shared.toLowerCase()))
          logger.logError(
            `Invalid value of data-shared (${shared}) on map "${defaultMapFeaturesConfig.mapId}".\nDefault value false used.`
          );

        if (shared?.toLowerCase() === 'true') {
          // check if config params have been passed
          const urlParamsConfig = await URLmapConfigReader.getMapFeaturesConfig(defaultMapFeaturesConfig.mapId);

          // use the url params config if provided
          if (urlParamsConfig) mapFeaturesConfig = { ...urlParamsConfig };
        }
      }
    }
    if (mapFeaturesConfig) return this.getValidMapConfig(defaultMapFeaturesConfig, mapFeaturesConfig);

    if (!mapFeaturesConfig) logger.logInfo(`- Map: ${defaultMapFeaturesConfig.mapId} - Empty JSON configuration object, using default -`);

    return Promise.resolve(defaultMapFeaturesConfig);
  }

  /** ***************************************************************************************************************************
   * Get a valid map configuration.
   *
   * @param {TypeMapFeaturesConfig} defaultMapFeaturesConfig The default Config object that has the field's default values.
   * @param {TypeMapFeaturesConfig} mapFeaturesConfig Config object to validate.
   *
   * @returns {TypeMapFeaturesConfig} A valid map config.
   */
  getValidMapConfig(defaultMapFeaturesConfig: TypeMapFeaturesConfig, mapFeaturesConfig: TypeMapFeaturesConfig): TypeMapFeaturesConfig {
    if (mapFeaturesConfig?.map?.listOfGeoviewLayerConfig) {
      mapFeaturesConfig.map.listOfGeoviewLayerConfig.forEach((geoviewLayerEntry) => {
        if (mapConfigLayerEntryIsGeoCore(geoviewLayerEntry)) {
          //  Skip it, because we don't validate the GeoCore configuration anymore. Not the same way as typical GeoView Layer Types at least.
        } else if (Object.values(CONST_LAYER_TYPES).includes((geoviewLayerEntry as TypeGeoviewLayerConfig).geoviewLayerType)) {
          const geoViewLayerEntryCasted = geoviewLayerEntry as TypeGeoviewLayerConfig;
          this.setLayerEntryType(geoViewLayerEntryCasted.listOfLayerEntryConfig!, geoViewLayerEntryCasted.geoviewLayerType);
        } else throw new Error(`Invalid GeoView Layer Type ${geoviewLayerEntry.geoviewLayerType}`);
      });
    }
    return this.configValidation.validateMapConfigAgainstSchema(mapFeaturesConfig);
  }

  /** ***************************************************************************************************************************
   * Initialize all layer entry type fields accordingly to the GeoView layer type.
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entry configuration to adjust.
   * @param {TypeGeoviewLayerType} geoviewLayerType The GeoView layer type.
   */
  private setLayerEntryType(listOfLayerEntryConfig: TypeListOfLayerEntryConfig, geoviewLayerType: TypeGeoviewLayerType): void {
    listOfLayerEntryConfig?.forEach((layerConfig) => {
      if (layerEntryIsGroupLayer(layerConfig)) this.setLayerEntryType(layerConfig.listOfLayerEntryConfig!, geoviewLayerType);
      else {
        // eslint-disable-next-line no-param-reassign
        (layerConfig as ConfigBaseClass).schemaTag = geoviewLayerType;
        // eslint-disable-next-line no-param-reassign
        (layerConfig as ConfigBaseClass).entryType = convertLayerTypeToEntry(geoviewLayerType);
      }
    });
  }
}
