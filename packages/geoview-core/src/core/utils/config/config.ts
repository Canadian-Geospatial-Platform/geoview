// import { layerEntryIsGroupLayer } from '@/api/config/types/type-guards';

import {
  convertLayerTypeToEntry,
  TypeLayerEntryConfig,
  mapConfigLayerEntryIsGeoCore,
  MapConfigLayerEntry,
  layerEntryIsGroupLayer,
  TypeDisplayLanguage,
  CONST_LAYER_TYPES,
  TypeGeoviewLayerType,
  mapConfigLayerEntryIsShapefile,
} from '@/api/config/types/map-schema-types';
import { logger } from '@/core/utils/logger';

import { ConfigValidation } from '@/core/utils/config/config-validation';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { generateId } from '@/core/utils/utilities';
import { LayerInvalidGeoviewLayerTypeError } from '@/core/exceptions/layer-exceptions';

/**
 * Class to read and validate the GeoView map features configuration. Will validate every item for structure and valid values.
 * If error found, will replace by default values and sent a message in the console for developers to know something went wrong.
 *
 * @exports
 * @class Config
 */
export class Config {
  /** The element associated to the map properties configuration.. */
  // #mapElement: Element;

  /** Config validation object used to validate the configuration and define default values */
  configValidation: ConfigValidation;

  /**
   * Constructor
   * @param {TypeDisplayLanguage} language - The language
   */
  constructor(language: TypeDisplayLanguage) {
    // Instanciate the configuration validator.
    this.configValidation = new ConfigValidation(language);
  }

  /**
   * Get a valid map configuration.
   * @param {MapConfigLayerEntry[]} listOfGeoviewLayerConfig Config object to validate.
   * @returns {MapConfigLayerEntry} A valid map config layer entry.
   */
  getValidMapConfig(
    listOfGeoviewLayerConfig: MapConfigLayerEntry[],
    onErrorCallback: (errorKey: string, params: string[]) => void
  ): MapConfigLayerEntry[] {
    if (listOfGeoviewLayerConfig) {
      listOfGeoviewLayerConfig.forEach((geoviewLayerEntry, index, layerArray) => {
        // Add duplicate marker for duplicate IDs
        const firstIndex = layerArray.findIndex((layerEntry) => geoviewLayerEntry.geoviewLayerId === layerEntry.geoviewLayerId);
        if (firstIndex !== index && mapConfigLayerEntryIsGeoCore(geoviewLayerEntry)) {
          // eslint-disable-next-line no-param-reassign
          geoviewLayerEntry.geoviewLayerId = `${geoviewLayerEntry.geoviewLayerId}:${generateId(8)}`;
        }

        if (mapConfigLayerEntryIsGeoCore(geoviewLayerEntry) || mapConfigLayerEntryIsShapefile(geoviewLayerEntry)) {
          //  Skip it, because we don't validate the GeoCore configuration anymore. Not the same way as typical GeoView Layer Types at least.
          // TODO Why not do GeoCore request here? Then could easily replace listOfLayerEntries and validate / process along with other layers
        } else if (Object.values(CONST_LAYER_TYPES).includes(geoviewLayerEntry.geoviewLayerType)) {
          const geoViewLayerEntryCasted = geoviewLayerEntry;
          this.#setLayerEntryType(geoViewLayerEntryCasted.listOfLayerEntryConfig, geoViewLayerEntryCasted.geoviewLayerType);
        } else throw new LayerInvalidGeoviewLayerTypeError(geoviewLayerEntry.geoviewLayerId, geoviewLayerEntry.geoviewLayerType);
      });
    }

    // TODO: refactor - return only the layers
    const validLayers = this.configValidation.validateMapConfigAgainstSchema(listOfGeoviewLayerConfig, onErrorCallback);
    logger.logDebug('CONFIG', validLayers);

    return validLayers;
  }

  /**
   * Initialize all layer entry type fields accordingly to the GeoView layer type.
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entry configuration to adjust.
   * @param {TypeGeoviewLayerType} geoviewLayerType The GeoView layer type.
   * @private
   */
  #setLayerEntryType(listOfLayerEntryConfig: TypeLayerEntryConfig[], geoviewLayerType: TypeGeoviewLayerType): void {
    listOfLayerEntryConfig?.forEach((layerConfig) => {
      if (layerEntryIsGroupLayer(layerConfig as ConfigBaseClass))
        this.#setLayerEntryType(layerConfig.listOfLayerEntryConfig, geoviewLayerType);
      else {
        // eslint-disable-next-line no-param-reassign
        layerConfig.schemaTag = geoviewLayerType;
        // eslint-disable-next-line no-param-reassign
        layerConfig.entryType = convertLayerTypeToEntry(geoviewLayerType);
      }
    });
  }

  /**
   * Initialize a map config from either inline div, url params, json file.
   *
   * @returns {Promise<TypeMapFeaturesConfig | undefined>} The initialized valid map config.
   */
  initializeMapConfig(
    mapId: string,
    listOfGeoviewLayerConfig: MapConfigLayerEntry[],
    onErrorCallback: (errorKey: string, params: string[]) => void
  ): MapConfigLayerEntry[] | undefined {
    // NOTE: URL config has precedence on JSON file config that has precedence on inline config
    if (!listOfGeoviewLayerConfig) {
      logger.logInfo(`- Map: ${mapId} - Empty JSON configuration object, using default -`);
    }

    return this.getValidMapConfig(listOfGeoviewLayerConfig, onErrorCallback);
  }
}
