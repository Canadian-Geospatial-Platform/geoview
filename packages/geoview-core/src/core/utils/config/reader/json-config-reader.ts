/* eslint-disable no-console */
import { TypeMapFeaturesConfig } from '../../../types/global-types';

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** *****************************************************************************************************************************
 * A class to process GeoView map features configuration from JSON file.
 * @exports
 * @class URLmapConfigReader
 */
// ******************************************************************************************************************************
export class JsonConfigReader {
  /** ***************************************************************************************************************************
   * Get the config object from json file
   * @param {string} mapId the ID of the map.
   * @param {Element} mapElement the map element
   *
   * @returns {TypeMapFeaturesConfig | undefined} the generated config object from json file
   */
  static async getMapFeaturesConfig(mapId: string, mapElement: Element): Promise<TypeMapFeaturesConfig | undefined> {
    // create a new config object
    let mapConfig: TypeMapFeaturesConfig | undefined;

    const configUrl = mapElement.getAttribute('data-config-url');

    // check config url
    if (configUrl) {
      try {
        const res = await fetch(configUrl);

        const configData = await res.json();

        mapConfig = { ...configData };
      } catch (error) {
        console.log(`- Map: ${mapId} - Invalid config url provided -`);
      }
    }

    return mapConfig;
  }
}
