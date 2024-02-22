/* eslint-disable no-console */
import { TypeJsonValue, TypeMapFeaturesConfig } from '@/core/types/global-types';
import { getLocalizedMessage, isJsonString, removeCommentsFromJSON, replaceParams, showError } from '../../utilities';
import { logger } from '@/core/utils/logger';
import { api } from '@/app';
import { ConfigValidation } from '../config-validation';
import { UUIDmapConfigReader } from './uuid-config-reader';

/**
 * A class to read the configuration of the GeoView map features from an online div. The configuration is provided in an HTML div
 * whose class name is "geoview-map". The div tag also has the attributes id to set the map id, data-lang to specify the display
 * language and data-config to provide the map configuration.
 *
 * The configuration must respect the JSON format. However, for readability reasons, the quotes (") are replaced by
 * apostrophe ('). The reader will take care of converting the apostrophes into quotes when reading. If you want to insert a
 * quote in the configuration, use the HTML syntax '&quot;' or escape it using a backslash, but remember that it must be preceded
 * by a backslash depending on where it is located in the JSON code.
 * @exports
 * @class URLmapConfigReader
 */
export class InlineDivConfigReader {
  /**
   * Get the config object from inline map element div.
   * @param {string} mapId The ID of the map.
   * @param {Element} mapElement The map element.
   *
   * @returns {TypeMapFeaturesConfig | undefined} The generated map features config object from inline map element.
   */
  static async getMapFeaturesConfig(mapId: string, mapElement: Element): Promise<TypeMapFeaturesConfig | undefined> {
    // instanciate the configValidation object used to validate map config attributes and define default values.
    const configValidation = new ConfigValidation();

    let configObjStr = mapElement.getAttribute('data-config');

    if (configObjStr) {
      // Erase comments in the config file.

      configObjStr = removeCommentsFromJSON(configObjStr);

      // If you want to use quotes in your JSON string, write \&quot or escape it using a backslash;
      // First, replace apostrophes not preceded by a backslash with quotes
      configObjStr = configObjStr.replace(/(?<!\\)'/gm, '"');
      // Then, replace apostrophes preceded by a backslash with a single apostrophe
      configObjStr = configObjStr.replace(/\\'/gm, "'");

      if (isJsonString(configObjStr)) {
        // Create the config
        const gvConfig = JSON.parse(configObjStr);

        // Read the geocore keys
        const geocoreKeys = mapElement.getAttribute('data-geocore-keys');

        // If any
        if (geocoreKeys) {
          try {
            // Make sure we have a mapConfig.serviceUrls.geocoreUrl set by default
            if (!gvConfig.serviceUrls)
              gvConfig.serviceUrls = { geocoreUrl: configValidation.defaultMapFeaturesConfig.serviceUrls.geocoreUrl };

            // If there's a data-geocore-endpoint attribute, use it as the geoCoreUrl
            const geocoreEndpoint = mapElement.getAttribute('data-geocore-endpoint');
            if (geocoreEndpoint) gvConfig.serviceUrls.geocoreUrl = geocoreEndpoint;

            // Get the layers config
            const promise = UUIDmapConfigReader.getGVConfigFromUUIDs(
              gvConfig.serviceUrls.geocoreUrl,
              gvConfig.displayLanguage || 'en',
              geocoreKeys.split(',')
            );
            const listOfGeoviewLayerConfig = (await promise).layers;

            // Append the layers to the config (possibly with others)
            if (!gvConfig.map.listOfGeoviewLayerConfig) gvConfig.map.listOfGeoviewLayerConfig = [];
            gvConfig.map.listOfGeoviewLayerConfig.push(...listOfGeoviewLayerConfig);
          } catch (error) {
            // Log
            logger.logError('Failed to get the GeoView layers from url keys', mapElement.getAttribute('data-geocore-keys'), error);
            const message = replaceParams([error as TypeJsonValue, mapId], getLocalizedMessage(mapId, 'validation.layer.loadfailed'));
            showError(mapId, message);
          }
        }

        // Return the config
        return gvConfig;
      }

      // Log
      logger.logWarning(`- Map: ${mapId} - Invalid JSON configuration object in div, a fallback strategy will be used -`);
      api.utilities.showError(mapId, api.utilities.getLocalizedMessage(mapId, 'validation.invalidConfig'), true);
    }

    // None
    return undefined;
  }
}
