import { TypeDisplayLanguage } from '@/api/config/types/map-schema-types';
import {
  mapConfigLayerEntryIsGeoCore,
  MapConfigLayerEntry,
  layerEntryIsGroupLayer,
  CONST_LAYER_TYPES,
  TypeGeoviewLayerType,
  mapConfigLayerEntryIsShapefile,
  TypeLayerEntryType,
  CONST_LAYER_ENTRY_TYPES,
  TypeLayerEntryConfig,
} from '@/api/config/types/layer-schema-types';
import { logger } from '@/core/utils/logger';

import { ConfigValidation, ErrorCallbackDelegate } from '@/core/utils/config/config-validation';
import { generateId } from '@/core/utils/utilities';
import { LayerInvalidGeoviewLayerTypeError } from '@/core/exceptions/layer-exceptions';
import { NotSupportedError } from '@/core/exceptions/core-exceptions';

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
   * @param {MapConfigLayerEntry[]} listOfGeoviewLayerConfig - The list of Geoview layer config to validate.
   * @returns {MapConfigLayerEntry} A valid map config layer entry.
   */
  prevalidateGeoviewLayersConfig(
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
    const validLayers = this.configValidation.validateLayersConfigAgainstSchema(listOfGeoviewLayerConfig, onErrorCallback);

    // Log
    logger.logDebug('CONFIG-LAYERS-VALIDATED', validLayers);

    // Return the valid layers
    return validLayers;
  }

  /**
   * Initializes all layer entry type fields accordingly to the GeoView layer type.
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig - The list of layer entry configuration to adjust.
   * @param {TypeGeoviewLayerType} geoviewLayerType - The GeoView layer type.
   * @private
   */
  #setLayerEntryType(listOfLayerEntryConfig: TypeLayerEntryConfig[], geoviewLayerType: TypeGeoviewLayerType): void {
    listOfLayerEntryConfig?.forEach((layerConfig) => {
      if (layerEntryIsGroupLayer(layerConfig)) this.#setLayerEntryType(layerConfig.listOfLayerEntryConfig, geoviewLayerType);
      else {
        // eslint-disable-next-line no-param-reassign
        layerConfig.schemaTag = geoviewLayerType;
        // eslint-disable-next-line no-param-reassign
        layerConfig.entryType = Config.getLayerEntryTypeFromLayerType(geoviewLayerType);
      }
    });
  }

  /**
   * Initializes the map configuration by prevalidating the list of GeoView layer configurations.
   * @param {string} mapId - The unique identifier for the map instance.
   * @param {MapConfigLayerEntry[]} listOfGeoviewLayerConfig - The list of layer configurations to validate and initialize.
   * @param {ErrorCallbackDelegate} onErrorCallback - A callback function invoked when a validation error occurs.
   * @returns {MapConfigLayerEntry[] | undefined} The validated list of layer configs, or `undefined` if invalid.
   */
  initializeMapConfig(
    mapId: string,
    listOfGeoviewLayerConfig: MapConfigLayerEntry[],
    onErrorCallback: ErrorCallbackDelegate
  ): MapConfigLayerEntry[] | undefined {
    // NOTE: URL config has precedence on JSON file config that has precedence on inline config
    if (!listOfGeoviewLayerConfig) {
      logger.logInfo(`- Map: ${mapId} - Empty JSON configuration object, using default -`);
    }

    return this.prevalidateGeoviewLayersConfig(listOfGeoviewLayerConfig, onErrorCallback);
  }

  /**
   * Returns the corresponding layer entry type for a given GeoView layer type.
   * This method maps a `TypeGeoviewLayerType` (e.g., CSV, WMS, XYZ_TILES)
   * to its associated `TypeLayerEntryType` (e.g., VECTOR, RASTER_IMAGE, RASTER_TILE).
   * Useful for determining how a layer should be handled/rendered internally.
   * @param {TypeGeoviewLayerType} layerType - The GeoView layer type to convert.
   * @returns The corresponding layer entry type.
   * @throws {NotSupportedError} If the provided `layerType` is not supported for conversion.
   */
  static getLayerEntryTypeFromLayerType(layerType: TypeGeoviewLayerType): TypeLayerEntryType {
    switch (layerType) {
      case CONST_LAYER_TYPES.CSV:
      case CONST_LAYER_TYPES.GEOJSON:
      case CONST_LAYER_TYPES.GEOPACKAGE:
      case CONST_LAYER_TYPES.OGC_FEATURE:
      case CONST_LAYER_TYPES.WFS:
      case CONST_LAYER_TYPES.WKB:
      case CONST_LAYER_TYPES.ESRI_FEATURE:
        return CONST_LAYER_ENTRY_TYPES.VECTOR;

      case CONST_LAYER_TYPES.IMAGE_STATIC:
      case CONST_LAYER_TYPES.ESRI_DYNAMIC:
      case CONST_LAYER_TYPES.ESRI_IMAGE:
      case CONST_LAYER_TYPES.WMS:
        return CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE;
      case CONST_LAYER_TYPES.XYZ_TILES:
      case CONST_LAYER_TYPES.VECTOR_TILES:
        return CONST_LAYER_ENTRY_TYPES.RASTER_TILE;
      default:
        // Throw unsupported error
        throw new NotSupportedError(`Unsupported layer type ${layerType} to convert to layer entry`);
    }
  }
}
