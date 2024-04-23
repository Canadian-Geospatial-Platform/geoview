import { MapFeaturesConfig } from '@config/types/classes/map-features-config';
import { logger } from '@/core/utils/logger';

/**
 * A class to process GeoView map features configuration from JSON file.
 * @exports
 * @class URLmapConfigReader
 */
export class JsonConfigReader {
  /**
   * Get the config object from json file
   * @param {string} mapId the ID of the map.
   * @param {Element} mapElement the map element
   *
   * @returns {TypeMapFeaturesConfig | undefined} the generated config object from json file
   */
  static async getMapFeaturesConfig(mapId: string, mapElement: Element): Promise<MapFeaturesConfig | undefined> {
    // create a new config object
    let mapConfig: MapFeaturesConfig | undefined;

    const configUrl = mapElement.getAttribute('data-config-url');

    // check config url
    if (configUrl) {
      try {
        const res = await fetch(configUrl);

        const configData = await res.json();

        mapConfig = new MapFeaturesConfig({ ...configData });
      } catch (error) {
        logger.logError(`- Map: ${mapId} - Invalid config url provided -`);
      }
    }

    return mapConfig;
  }
}
