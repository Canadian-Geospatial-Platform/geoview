// import { layerEntryIsGroupLayer } from '@config/types/type-guards';

import {
  convertLayerTypeToEntry,
  TypeLayerEntryConfig,
  mapConfigLayerEntryIsGeoCore,
  TypeGeoviewLayerConfig,
  MapConfigLayerEntry,
  layerEntryIsGroupLayer,
} from '@/geo/map/map-schema-types';
import { CONST_LAYER_TYPES, TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { logger } from '@/core/utils/logger';

import { ConfigValidation } from '@/core/utils/config/config-validation';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { TypeDisplayLanguage } from '@/api/config/types/map-schema-types';

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** *****************************************************************************************************************************
 * Class to read and validate the GeoView map features configuration. Will validate every item for structure and valid values.
 * If error found, will replace by default values and sent a message in the console for developers to know something went wrong.
 *
 * @exports
 * @class Config
 */
// ******************************************************************************************************************************
export class Config {
  /** The element associated to the map properties configuration.. */
  // #mapElement: Element;

  /** Config validation object used to validate the configuration and define default values */
  configValidation: ConfigValidation;

  /** ***************************************************************************************************************************
   * The Config class constructor used to instanciate an object of this type.
   * @param {Element} mapElement The map element.
   *
   * @returns {Config} An instance of the Config class.
   */
  constructor(language: TypeDisplayLanguage) {
    // Instanciate the configuration validator.
    this.configValidation = new ConfigValidation(language);
  }

  /** ***************************************************************************************************************************
   * Get a valid map configuration.
   *
   * @param {TypeMapFeaturesConfig} mapFeaturesConfig Config object to validate.
   *
   * @returns {TypeMapFeaturesConfig} A valid map config.
   */
  getValidMapConfig(listOfGeoviewLayerConfig: MapConfigLayerEntry[]): MapConfigLayerEntry[] {
    if (listOfGeoviewLayerConfig) {
      listOfGeoviewLayerConfig.forEach((geoviewLayerEntry) => {
        if (mapConfigLayerEntryIsGeoCore(geoviewLayerEntry)) {
          //  Skip it, because we don't validate the GeoCore configuration anymore. Not the same way as typical GeoView Layer Types at least.
        } else if (Object.values(CONST_LAYER_TYPES).includes((geoviewLayerEntry as TypeGeoviewLayerConfig).geoviewLayerType)) {
          const geoViewLayerEntryCasted = geoviewLayerEntry as TypeGeoviewLayerConfig;
          this.#setLayerEntryType(geoViewLayerEntryCasted.listOfLayerEntryConfig!, geoViewLayerEntryCasted.geoviewLayerType);
        } else throw new Error(`Invalid GeoView Layer Type ${geoviewLayerEntry.geoviewLayerType}`);
      });
    }

    // TODO: refactor - return only the layers
    const validLayers = this.configValidation.validateMapConfigAgainstSchema(listOfGeoviewLayerConfig);
    logger.logDebug('Config', validLayers);

    return validLayers;
  }

  /** ***************************************************************************************************************************
   * Initialize all layer entry type fields accordingly to the GeoView layer type.
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entry configuration to adjust.
   * @param {TypeGeoviewLayerType} geoviewLayerType The GeoView layer type.
   * @private
   */
  #setLayerEntryType(listOfLayerEntryConfig: TypeLayerEntryConfig[], geoviewLayerType: TypeGeoviewLayerType): void {
    listOfLayerEntryConfig?.forEach((layerConfig) => {
      if (layerEntryIsGroupLayer(layerConfig as ConfigBaseClass))
        this.#setLayerEntryType(layerConfig.listOfLayerEntryConfig!, geoviewLayerType);
      else {
        // eslint-disable-next-line no-param-reassign
        layerConfig.schemaTag = geoviewLayerType;
        // eslint-disable-next-line no-param-reassign
        layerConfig.entryType = convertLayerTypeToEntry(geoviewLayerType);
      }
    });
  }

  /** ***************************************************************************************************************************
   * Initialize a map config from either inline div, url params, json file.
   *
   * @returns {Promise<TypeMapFeaturesConfig | undefined>} The initialized valid map config.
   */
  initializeMapConfig(mapId: string, listOfGeoviewLayerConfig: MapConfigLayerEntry[]): MapConfigLayerEntry[] | undefined {
    // NOTE: URL config has precedence on JSON file config that has precedence on inline config
    if (!listOfGeoviewLayerConfig) {
      logger.logInfo(`- Map: ${mapId} - Empty JSON configuration object, using default -`);
    }

    return this.getValidMapConfig(listOfGeoviewLayerConfig!);
  }
}
