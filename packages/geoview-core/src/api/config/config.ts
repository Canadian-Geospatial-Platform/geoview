import {
  MapConfigLayerEntry,
  CONST_LAYER_TYPES,
  TypeGeoviewLayerType,
  mapConfigLayerEntryIsGeoCore,
  mapConfigLayerEntryIsGeoPackage,
  mapConfigLayerEntryIsShapefile,
  TypeLayerEntryConfig,
  mapConfigLayerEntryIsRCS,
} from '@/api/types/layer-schema-types';
import { logger } from '@/core/utils/logger';

import { ConfigValidation, ErrorCallbackDelegate } from '@/api/config/config-validation';
import { generateId } from '@/core/utils/utilities';
import { LayerInvalidGeoviewLayerTypeError } from '@/core/exceptions/layer-exceptions';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';

/**
 * Class to read and validate the GeoView map features configuration. Will validate every item for structure and valid values.
 * If error found, will replace by default values and sent a message in the console for developers to know something went wrong.
 *
 * @exports
 * @class Config
 */
export class Config {
  /**
   * Get a valid map configuration.
   * @param {MapConfigLayerEntry[]} listOfGeoviewLayerConfig - The list of Geoview layer config to validate.
   * @returns {MapConfigLayerEntry} A valid map config layer entry.
   * @static
   */
  static prevalidateGeoviewLayersConfig(
    listOfGeoviewLayerConfig: MapConfigLayerEntry[],
    onErrorCallback: ErrorCallbackDelegate
  ): MapConfigLayerEntry[] {
    // Validate the layer configs
    if (listOfGeoviewLayerConfig) {
      listOfGeoviewLayerConfig.forEach((geoviewLayerEntry, index, layerArray) => {
        // Add duplicate marker for duplicate IDs
        const firstIndex = layerArray.findIndex((layerEntry) => geoviewLayerEntry.geoviewLayerId === layerEntry.geoviewLayerId);
        if (firstIndex !== index && mapConfigLayerEntryIsGeoCore(geoviewLayerEntry)) {
          // eslint-disable-next-line no-param-reassign
          geoviewLayerEntry.geoviewLayerId = `${geoviewLayerEntry.geoviewLayerId}:${generateId(8)}`;
        }

        if (
          mapConfigLayerEntryIsGeoCore(geoviewLayerEntry) ||
          mapConfigLayerEntryIsShapefile(geoviewLayerEntry) ||
          mapConfigLayerEntryIsGeoPackage(geoviewLayerEntry) ||
          mapConfigLayerEntryIsRCS(geoviewLayerEntry)
        ) {
          //  Skip it, because we don't validate the GeoCore configuration anymore. Not the same way as typical GeoView Layer Types at least.
          // TODO Why not do GeoCore request here? Then could easily replace listOfLayerEntries and validate / process along with other layers
        } else if (Object.values(CONST_LAYER_TYPES).includes(geoviewLayerEntry.geoviewLayerType)) {
          const geoViewLayerEntryCasted = geoviewLayerEntry;
          this.#setLayerEntryType(geoViewLayerEntryCasted.listOfLayerEntryConfig, geoViewLayerEntryCasted.geoviewLayerType);
        } else throw new LayerInvalidGeoviewLayerTypeError(geoviewLayerEntry.geoviewLayerId, geoviewLayerEntry.geoviewLayerType);
      });
    }

    // TODO: refactor - return only the layers
    const validLayers = ConfigValidation.validateLayersConfigAgainstSchema(listOfGeoviewLayerConfig, onErrorCallback);

    // Log
    logger.logDebug('CONFIG-LAYERS-VALIDATED', validLayers);

    // Return the valid layers
    return validLayers;
  }

  /**
   * Initializes all layer entry type fields accordingly to the GeoView layer type.
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig - The list of layer entry configuration to adjust.
   * @param {TypeGeoviewLayerType} geoviewLayerType - The GeoView layer type.
   * @static
   * @private
   */
  static #setLayerEntryType(listOfLayerEntryConfig: TypeLayerEntryConfig[], geoviewLayerType: TypeGeoviewLayerType): void {
    listOfLayerEntryConfig?.forEach((layerConfig) => {
      if (ConfigBaseClass.getClassOrTypeEntryTypeIsGroup(layerConfig))
        Config.#setLayerEntryType(layerConfig.listOfLayerEntryConfig, geoviewLayerType);
      else {
        ConfigBaseClass.setClassOrTypeSchemaTag(layerConfig, geoviewLayerType);
        ConfigBaseClass.setClassOrTypeEntryType(layerConfig, ConfigBaseClass.getLayerEntryTypeFromLayerType(geoviewLayerType));
      }
    });
  }

  /**
   * Initializes the map configuration by prevalidating the list of GeoView layer configurations.
   * @param {string} mapId - The unique identifier for the map instance.
   * @param {MapConfigLayerEntry[]} listOfGeoviewLayerConfig - The list of layer configurations to validate and initialize.
   * @param {ErrorCallbackDelegate} onErrorCallback - A callback function invoked when a validation error occurs.
   * @returns {MapConfigLayerEntry[] | undefined} The validated list of layer configs, or `undefined` if invalid.
   * @static
   */
  static initializeMapConfig(
    mapId: string,
    listOfGeoviewLayerConfig: MapConfigLayerEntry[],
    onErrorCallback: ErrorCallbackDelegate
  ): MapConfigLayerEntry[] | undefined {
    // NOTE: URL config has precedence on JSON file config that has precedence on inline config
    if (!listOfGeoviewLayerConfig) {
      logger.logInfo(`- Map: ${mapId} - Empty JSON configuration object, using default -`);
    }

    return Config.prevalidateGeoviewLayersConfig(listOfGeoviewLayerConfig, onErrorCallback);
  }
}
