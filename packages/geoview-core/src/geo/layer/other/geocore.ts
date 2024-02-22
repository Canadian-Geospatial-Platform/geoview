import defaultsDeep from 'lodash/defaultsDeep';
import { TypeJsonValue, api, generateId, getLocalizedMessage, replaceParams, showError } from '@/app';
import { UUIDmapConfigReader } from '@/core/utils/config/reader/uuid-config-reader';
import { ConfigValidation } from '@/core/utils/config/config-validation';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { GeochartEventProcessor } from '@/api/event-processors/event-processor-children/geochart-event-processor';
import { logger } from '@/core/utils/logger';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

import {
  TypeLayerEntryConfig,
  TypeGeoviewLayerConfig,
  TypeGeocoreLayerEntryConfig,
  TypeListOfGeoviewLayerConfig,
  TypeLocalizedString,
  layerEntryIsGroupLayer,
  TypeListOfLayerEntryConfig,
  TypeLayerEntryType,
} from '../../map/map-schema-types';
import { CONST_LAYER_TYPES, TypeGeoviewLayerType } from '../geoview-layers/abstract-geoview-layers';

export interface TypeGeoCoreLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: 'geoCore';
  listOfLayerEntryConfig: TypeGeocoreLayerEntryConfig[];
}

/** *****************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeGeocoreLayerEntryConfig if the geoviewLayerType attribute of
 * the verifyIfGeoViewEntry.geoviewLayerConfig attribute is GEOCORE. The type ascention applies only to the true block of the if
 * clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsGeocore = (verifyIfGeoViewEntry: TypeLayerEntryConfig): verifyIfGeoViewEntry is TypeGeocoreLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewLayerConfig?.geoviewLayerType === CONST_LAYER_TYPES.GEOCORE;
};

/** *****************************************************************************************************************************
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeGeoCoreLayerConfig if the geoviewLayerType attribute of
 * the verifyIfLayer parameter is GEOCORE. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsGeoCore = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeGeoCoreLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.GEOCORE;
};

/**
 * Class used to add geoCore layer to the map
 *
 * @exports
 * @class GeoCore
 */
export class GeoCore {
  private mapId: string;

  /** Config validation object used to validate the configuration and define default values */
  private configValidation = new ConfigValidation();

  /**
   * Constructor
   * @param {string} mapId the id of the map
   */
  constructor(mapId: string) {
    this.mapId = mapId;
  }

  /**
   * Builds a Geocore Layer Config from a given UUID
   * @param {string} uuid the given uuid to build the Geocore Layer Config with
   * @returns {TypeGeoCoreLayerConfig} the GeoCore Layer Config
   */
  static buildGeocoreLayerConfigFromUUID(uuid: string): TypeGeoCoreLayerConfig {
    return {
      geoviewLayerId: generateId(),
      geoviewLayerType: 'geoCore',
      listOfLayerEntryConfig: [
        new TypeGeocoreLayerEntryConfig({
          schemaTag: 'geoCore' as TypeGeoviewLayerType,
          entryType: 'geoCore' as TypeLayerEntryType,
          layerId: uuid,
        } as TypeGeocoreLayerEntryConfig),
      ] as TypeGeocoreLayerEntryConfig[],
    } as TypeGeoCoreLayerConfig;
  }

  /**
   *  Gets GeoView layer configurations list from the given UUID. Creates the GeoCore Layer Config in the process.
   *
   * @param {string} uuid the given uuid to build the Geocore Layer Config with
   * @returns {Promise<TypeListOfGeoviewLayerConfig[]>} the GeoCore Layer Config promise
   */
  createLayersFromUUID(uuid: string): Promise<TypeListOfGeoviewLayerConfig[]> {
    // Create the config
    const geocoreConfig = GeoCore.buildGeocoreLayerConfigFromUUID(uuid);

    // Create the layers
    return this.createLayers(geocoreConfig);
  }

  /**
   * Gets GeoView layer configurations list from the UUIDs of the list of layer entry configurations.
   *
   * @param {TypeGeocoreLayerEntryConfig} geocoreLayerConfig the layer configuration
   * @returns {Promise<TypeListOfGeoviewLayerConfig>} list of layer configurations to add to the map
   */
  async createLayers(geocoreLayerConfig: TypeGeoCoreLayerConfig): Promise<TypeListOfGeoviewLayerConfig[]> {
    // Get the map config
    const mapConfig = MapEventProcessor.getGeoViewMapConfig(this.mapId);

    // For each layer entry config in the list
    const listOfLayerCreated: TypeListOfGeoviewLayerConfig[] = [];
    for (let i = 0; i < geocoreLayerConfig.listOfLayerEntryConfig.length; i++) {
      // Get the config
      const layerConfig = geocoreLayerConfig.listOfLayerEntryConfig[i];

      // Get the language
      const lang = api.maps[this.mapId].getDisplayLanguage();

      // Generate the url using metadataAccessPath when specified or using the geocore url
      const url = geocoreLayerConfig.metadataAccessPath?.[lang] || `${mapConfig!.serviceUrls.geocoreUrl}`;
      const uuid = layerConfig.layerId;

      try {
        // Get the GV config from UUID and await even if within loop
        // eslint-disable-next-line no-await-in-loop
        const response = await UUIDmapConfigReader.getGVConfigFromUUIDs(url, lang, [uuid]);

        // Cumulate
        listOfLayerCreated.push(response.layers);

        // For each found layer associated with the Geocore UUIDs
        response.layers.forEach((geoviewLayerConfig) => {
          this.copyConfigSettingsOverGeocoreSettings(layerConfig, geoviewLayerConfig);
        });
        this.configValidation.validateListOfGeoviewLayerConfig(AppEventProcessor.getSupportedLanguages(this.mapId), response.layers);

        // For each found geochart associated with the Geocore UUIDs
        response.geocharts?.forEach((geochartConfig) => {
          // Add a GeoChart
          GeochartEventProcessor.addGeochartChart(this.mapId, geochartConfig.layers[0].layerId as string, geochartConfig);
        });
      } catch (error) {
        // Log
        logger.logError(`Failed to get the GeoView layer from UUI ${uuid}`, error);
        const message = replaceParams([error as TypeJsonValue, this.mapId], getLocalizedMessage(this.mapId, 'validation.layer.loadfailed'));
        showError(this.mapId, message);
      }
    }

    // Return the created layers
    return listOfLayerCreated;
  }

  /**
   * Copies the config settings over the geocore values (config values have priority).
   *
   * @param {TypeGeocoreLayerEntryConfig} geocoreLayerEntryConfig The config file settings
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The settings returned by the geocore service
   */
  private copyConfigSettingsOverGeocoreSettings(
    geocoreLayerEntryConfig: TypeGeocoreLayerEntryConfig,
    geoviewLayerConfig: TypeGeoviewLayerConfig
  ) {
    if (geocoreLayerEntryConfig.geocoreLayerName)
      // eslint-disable-next-line no-param-reassign
      geoviewLayerConfig.geoviewLayerName = {
        ...geocoreLayerEntryConfig.geocoreLayerName,
      } as TypeLocalizedString;

    if (geocoreLayerEntryConfig.listOfLayerEntryConfig?.length) {
      const defaultDeepFoundEntry = (
        layerArrayFromConfig: TypeListOfLayerEntryConfig,
        layerArrayFromService: TypeListOfLayerEntryConfig
      ) => {
        layerArrayFromService.forEach((layerEntryFromService, i, arrayFromService) => {
          const entryFound = layerArrayFromConfig.find((layerEntryFromConfig) => {
            if (layerEntryFromConfig.layerId === layerEntryFromService.layerId) {
              if (layerEntryIsGroupLayer(layerEntryFromService)) {
                if (layerEntryIsGroupLayer(layerEntryFromConfig)) {
                  defaultDeepFoundEntry(layerEntryFromConfig.listOfLayerEntryConfig!, layerEntryFromService.listOfLayerEntryConfig);
                } else
                  throw new Error(`Geocore group id ${layerEntryFromService.layerId} should be defined as a group in the configuration`);
              } else {
                // eslint-disable-next-line no-param-reassign
                arrayFromService[i] = defaultsDeep(layerEntryFromConfig, layerEntryFromService);
                // Force a found property to the layerEntryFromConfig object
                Object.assign(layerEntryFromConfig, { found: true });
              }
              return true;
            }
            return false;
          });
          // eslint-disable-next-line no-param-reassign
          if (!entryFound) arrayFromService[i].layerId = '';
        });
        for (let i = layerArrayFromService.length - 1; i >= 0; i--)
          if (!layerArrayFromService[i].layerId) layerArrayFromService.splice(i, 1);
      };
      defaultDeepFoundEntry(geocoreLayerEntryConfig.listOfLayerEntryConfig, geoviewLayerConfig.listOfLayerEntryConfig);
      const validateConfig = (layerArrayFromConfig: TypeListOfLayerEntryConfig) => {
        for (let i = 0; i < layerArrayFromConfig.length; i++) {
          if (!('found' in layerArrayFromConfig[i]))
            throw new Error(`Layer ${layerArrayFromConfig[i].layerId} from the configuration does not exist on the geocore service`);
          if (layerEntryIsGroupLayer(layerArrayFromConfig[i])) validateConfig(layerArrayFromConfig[i].listOfLayerEntryConfig!);
        }
      };
      validateConfig(geocoreLayerEntryConfig.listOfLayerEntryConfig);
    }
  }
}
