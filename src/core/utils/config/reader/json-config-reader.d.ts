import { TypeMapFeaturesConfig } from '../../../types/global-types';
/** *****************************************************************************************************************************
 * A class to process GeoView map features configuration from JSON file.
 * @exports
 * @class URLmapConfigReader
 */
export declare class JsonConfigReader {
    /** ***************************************************************************************************************************
     * Get the config object from json file
     * @param {string} mapId the ID of the map.
     * @param {Element} mapElement the map element
     *
     * @returns {TypeMapFeaturesConfig | undefined} the generated config object from json file
     */
    static getMapFeaturesConfig(mapId: string, mapElement: Element): Promise<TypeMapFeaturesConfig | undefined>;
}
