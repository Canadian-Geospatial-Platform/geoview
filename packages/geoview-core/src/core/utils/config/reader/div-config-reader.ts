/* eslint-disable no-console */
import { TypeMapFeaturesConfig } from '../../../../geo/map/map-types';
import { isJsonString } from '../../utilities';

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** *****************************************************************************************************************************
 * A class to process GeoView map features configuration from an inline div.
 * @exports
 * @class URLmapConfigReader
 */
// ******************************************************************************************************************************
export class InlineDivConfigReader {
  /** ***************************************************************************************************************************
   * Get the config object from inline map element div
   * @param {string} mapId the ID of the map.
   * @param {Element} mapElement the map element
   *
   * @returns {TypeMapFeaturesConfig | undefined} the generated map features config object from inline map element
   */
  static getMapFeaturesConfig(mapId: string, mapElement: Element): TypeMapFeaturesConfig | undefined {
    // create a new config object
    let mapConfig: TypeMapFeaturesConfig | undefined;

    let configObjStr = mapElement.getAttribute('data-config');

    if (configObjStr && configObjStr !== '') {
      configObjStr = configObjStr.replace(/'/g, '"').replace(/(?:[A-Za-zàâçéèêëîïôûùüÿñæœ_.])"(?=[A-Za-zàâçéèêëîïôûùüÿñæœ_.])/g, "\\\\'");

      if (!isJsonString(configObjStr)) {
        console.log(`- map: ${mapId} - Invalid JSON configuration object, using default -`);
      } else {
        mapConfig = { ...JSON.parse(configObjStr) };
      }
    } else {
      console.log(`- map: ${mapId} - Empty JSON configuration object, using default -`);
    }

    return mapConfig;
  }
}
