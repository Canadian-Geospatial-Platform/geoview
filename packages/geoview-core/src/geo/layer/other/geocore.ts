import { TypeJsonValue, getLocalizedMessage, replaceParams, showError } from '@/app';
import { UUIDmapConfigReader } from '@/core/utils/config/reader/uuid-config-reader';
import { ConfigValidation } from '@/core/utils/config/config-validation';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { GeochartEventProcessor } from '@/api/event-processors/event-processor-children/geochart-event-processor';
import { logger } from '@/core/utils/logger';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

import { TypeListOfGeoviewLayerConfig, GeoCoreLayerConfig, TypeDisplayLanguage } from '../../map/map-schema-types';

/**
 * Class used to add geoCore layer to the map
 *
 * @exports
 * @class GeoCore
 */
export class GeoCore {
  private mapId: string;

  private displayLanguage: TypeDisplayLanguage;

  /** Config validation object used to validate the configuration and define default values */
  private configValidation = new ConfigValidation();

  /**
   * Constructor
   * @param {string} mapId the id of the map
   */
  constructor(mapId: string, displayLanguage: TypeDisplayLanguage) {
    this.mapId = mapId;
    this.displayLanguage = displayLanguage;
  }

  /**
   * Builds a Geocore Layer Config from a given UUID
   * @param {string} uuid the given uuid to build the Geocore Layer Config with
   * @returns {GeoCoreLayerConfig} the GeoCore Layer Config
   */
  static buildGeocoreLayerConfigFromUUID(uuid: string): GeoCoreLayerConfig {
    return {
      geoviewLayerId: uuid,
      geoviewLayerType: 'geoCore',
    } as GeoCoreLayerConfig;
  }

  /**
   *  Gets GeoView layer configurations list from the given UUID. Creates the GeoCore Layer Config in the process.
   *
   * @param {string} uuid the given uuid to build the Geocore Layer Config with
   * @returns {Promise<TypeListOfGeoviewLayerConfig[]>} the GeoCore Layer Config promise
   */
  createLayersFromUUID(uuid: string): Promise<TypeListOfGeoviewLayerConfig> {
    // Create the config
    const geocoreConfig = GeoCore.buildGeocoreLayerConfigFromUUID(uuid);

    // Create the layers
    return this.createLayers(geocoreConfig);
  }

  /**
   * Gets GeoView layer configurations list from the UUIDs of the list of layer entry configurations.
   *
   * @param {GeoCoreLayerEntryConfig} geocoreLayerConfig the layer configuration
   * @returns {Promise<TypeListOfGeoviewLayerConfig>} list of layer configurations to add to the map
   */
  async createLayers(geocoreLayerConfig: GeoCoreLayerConfig): Promise<TypeListOfGeoviewLayerConfig> {
    // Get the map config
    const mapConfig = MapEventProcessor.getGeoViewMapConfig(this.mapId);

    // Generate the url using metadataAccessPath when specified or using the geocore url
    const url = `${mapConfig!.serviceUrls.geocoreUrl}`;
    const uuid = geocoreLayerConfig.geoviewLayerId;

    try {
      // Get the GV config from UUID and await
      const response = await UUIDmapConfigReader.getGVConfigFromUUIDs(url, this.displayLanguage, [uuid]);

      // // For each found layer associated with the Geocore UUIDs
      // response.layers.forEach((geoviewLayerConfig) => {
      //   this.copyConfigSettingsOverGeocoreSettings(layerConfig, geoviewLayerConfig);
      // });

      // Validate the generated Geoview Layer Config
      this.configValidation.validateListOfGeoviewLayerConfig(AppEventProcessor.getSupportedLanguages(this.mapId), response.layers);

      // For each found geochart associated with the Geocore UUIDs
      response.geocharts?.forEach((geochartConfig) => {
        // Add a GeoChart
        GeochartEventProcessor.addGeochartChart(this.mapId, geochartConfig.layers[0].layerId as string, geochartConfig);
      });

      return response.layers;
    } catch (error) {
      // Log
      logger.logError(`Failed to get the GeoView layer from UUI ${uuid}`, error);
      const message = replaceParams([error as TypeJsonValue, this.mapId], getLocalizedMessage(this.mapId, 'validation.layer.loadfailed'));
      showError(this.mapId, message);
    }
    return Promise.resolve([]);
  }

  // /**
  //  * Copies the config settings over the geocore values (config values have priority).
  //  *
  //  * @param {GeoCoreLayerEntryConfig} geocoreLayerEntryConfig The config file settings
  //  * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The settings returned by the geocore service
  //  */
  // private copyConfigSettingsOverGeocoreSettings(
  //   geocoreLayerEntryConfig: GeoCoreLayerEntryConfig,
  //   geoviewLayerConfig: TypeGeoviewLayerConfig
  // ) {
  //   if (geocoreLayerEntryConfig.geocoreLayerName)
  //     // eslint-disable-next-line no-param-reassign
  //     geoviewLayerConfig.geoviewLayerName = {
  //       ...geocoreLayerEntryConfig.geocoreLayerName,
  //     } as TypeLocalizedString;

  //   if (geocoreLayerEntryConfig.listOfLayerEntryConfig?.length) {
  //     const defaultDeepFoundEntry = (
  //       layerArrayFromConfig: TypeListOfLayerEntryConfig,
  //       layerArrayFromService: TypeListOfLayerEntryConfig
  //     ) => {
  //       layerArrayFromService.forEach((layerEntryFromService, i, arrayFromService) => {
  //         const entryFound = layerArrayFromConfig.find((layerEntryFromConfig) => {
  //           if (layerEntryFromConfig.layerId === layerEntryFromService.layerId) {
  //             if (layerEntryIsGroupLayer(layerEntryFromService)) {
  //               if (layerEntryIsGroupLayer(layerEntryFromConfig)) {
  //                 defaultDeepFoundEntry(layerEntryFromConfig.listOfLayerEntryConfig!, layerEntryFromService.listOfLayerEntryConfig);
  //               } else
  //                 throw new Error(`Geocore group id ${layerEntryFromService.layerId} should be defined as a group in the configuration`);
  //             } else {
  //               // eslint-disable-next-line no-param-reassign
  //               arrayFromService[i] = defaultsDeep(layerEntryFromConfig, layerEntryFromService);
  //               // Force a found property to the layerEntryFromConfig object
  //               Object.assign(layerEntryFromConfig, { found: true });
  //             }
  //             return true;
  //           }
  //           return false;
  //         });
  //         // eslint-disable-next-line no-param-reassign
  //         if (!entryFound) arrayFromService[i].layerId = '';
  //       });
  //       for (let i = layerArrayFromService.length - 1; i >= 0; i--)
  //         if (!layerArrayFromService[i].layerId) layerArrayFromService.splice(i, 1);
  //     };
  //     defaultDeepFoundEntry(geocoreLayerEntryConfig.listOfLayerEntryConfig, geoviewLayerConfig.listOfLayerEntryConfig);
  //     const validateConfig = (layerArrayFromConfig: TypeListOfLayerEntryConfig) => {
  //       for (let i = 0; i < layerArrayFromConfig.length; i++) {
  //         if (!('found' in layerArrayFromConfig[i]))
  //           throw new Error(`Layer ${layerArrayFromConfig[i].layerId} from the configuration does not exist on the geocore service`);
  //         if (layerEntryIsGroupLayer(layerArrayFromConfig[i])) validateConfig(layerArrayFromConfig[i].listOfLayerEntryConfig!);
  //       }
  //     };
  //     validateConfig(geocoreLayerEntryConfig.listOfLayerEntryConfig);
  //   }
  // }
}
