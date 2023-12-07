/* eslint-disable no-param-reassign */
import defaultsDeep from 'lodash/defaultsDeep';
import { api } from '@/app';
import { catalogUrl } from '@/core/utils/config/config';
import {
  TypeLayerEntryConfig,
  TypeGeoviewLayerConfig,
  TypeGeocoreLayerEntryConfig,
  TypeListOfGeoviewLayerConfig,
  TypeLocalizedString,
  layerEntryIsGroupLayer,
  TypeListOfLayerEntryConfig,
} from '../../map/map-schema-types';
import { CONST_LAYER_TYPES } from '../geoview-layers/abstract-geoview-layers';
import { UUIDmapConfigReader } from '@/core/utils/config/reader/uuid-config-reader';
import { ConfigValidation } from '@/core/utils/config/config-validation';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';

export interface TypeGeoCoreLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: 'geoCore';
  listOfLayerEntryConfig: TypeGeocoreLayerEntryConfig[];
}

/** *****************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeGeocoreLayerEntryConfig if the geoviewLayerType attribute of
 * the verifyIfGeoViewEntry.geoviewRootLayer attribute is GEOCORE. The type ascention applies only to the true block of the if
 * clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsGeocore = (verifyIfGeoViewEntry: TypeLayerEntryConfig): verifyIfGeoViewEntry is TypeGeocoreLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewRootLayer?.geoviewLayerType === CONST_LAYER_TYPES.GEOCORE;
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
   * Initialize layer
   * @param {string} mapId the id of the map
   */
  constructor(mapId: string) {
    this.mapId = mapId;
  }

  /**
   * Get GeoView layer configurations list from the UUIDs of the list of layer entry configurations.
   *
   * @param {TypeGeocoreLayerEntryConfig} geocoreLayerConfig the layer configuration
   * @returns {Promise<TypeListOfGeoviewLayerConfig>} list of layer configurations to add to the map
   */
  createLayers(geocoreLayerConfig: TypeGeoCoreLayerConfig): Promise<TypeListOfGeoviewLayerConfig[]> {
    const arrayOfListOfGeoviewLayerConfig = new Promise<TypeListOfGeoviewLayerConfig[]>((resolve) => {
      const url = geocoreLayerConfig.metadataAccessPath || `${catalogUrl}/${api.maps[this.mapId].getDisplayLanguage()}`;
      const promiseOfLayerConfigs: Promise<TypeListOfGeoviewLayerConfig>[] = [];
      geocoreLayerConfig.listOfLayerEntryConfig.forEach((layerConfig: TypeLayerEntryConfig) => {
        const requestUrl = `${url}/${layerConfig.layerId}`;
        promiseOfLayerConfigs.push(UUIDmapConfigReader.getGVlayersConfigFromUUID(this.mapId, requestUrl));
      });
      Promise.all(promiseOfLayerConfigs).then((listOfLayerCreated) => {
        listOfLayerCreated.forEach((listOfGeoviewLayerConfig, index) => {
          listOfGeoviewLayerConfig.forEach((geoviewLayerConfig) => {
            this.copyConfigSettingsOverGeocoreSettings(geocoreLayerConfig.listOfLayerEntryConfig[index], geoviewLayerConfig);
          });
          this.configValidation.validateListOfGeoviewLayerConfig(
            AppEventProcessor.getSupportedLanguages(this.mapId),
            listOfGeoviewLayerConfig
          );
        });
        resolve(listOfLayerCreated);
      });
    });
    return arrayOfListOfGeoviewLayerConfig;
  }

  /**
   * Copy the config settings over the geocore values (config values have priority).
   *
   * @param {TypeGeocoreLayerEntryConfig} geocoreLayerEntryConfig The config file settings
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The settings returned by the geocore service
   */
  private copyConfigSettingsOverGeocoreSettings(
    geocoreLayerEntryConfig: TypeGeocoreLayerEntryConfig,
    geoviewLayerConfig: TypeGeoviewLayerConfig
  ) {
    if (geocoreLayerEntryConfig.geocoreLayerName)
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
                arrayFromService[i] = defaultsDeep(layerEntryFromConfig, layerEntryFromService);
                // Force a found property to the layerEntryFromConfig object
                Object.assign(layerEntryFromConfig, { found: true });
              }
              return true;
            }
            return false;
          });
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
