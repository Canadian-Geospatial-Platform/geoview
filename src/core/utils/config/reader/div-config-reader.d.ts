import { TypeMapFeaturesConfig } from '../../../types/global-types';
/** *****************************************************************************************************************************
 * A class to read the configuration of the GeoView map features from an online div. The configuration is provided in an HTML div
 * whose class name is "llwp-map". The div tag also has the attributes id to set the map id, data-lang to specify the display
 * language and data-config to provide the map configuration.
 *
 * The configuration must respect the JSON format. However, for readability reasons, the quotes (") are replaced by
 * apostrophe ('). The reader will take care of converting the apostrophes into quotes when reading. If you want to insert a
 * quote in the configuration, use the HTML syntax '&quot;', but remember that it must be preceded by a backslash depending on
 * where it is located in the JSON code.
 * @exports
 * @class URLmapConfigReader
 */
export declare class InlineDivConfigReader {
    /** ***************************************************************************************************************************
     * Get the config object from inline map element div.
     * @param {string} mapId The ID of the map.
     * @param {Element} mapElement The map element.
     *
     * @returns {TypeMapFeaturesConfig | undefined} The generated map features config object from inline map element.
     */
    static getMapFeaturesConfig(mapId: string, mapElement: Element): TypeMapFeaturesConfig | undefined;
}
