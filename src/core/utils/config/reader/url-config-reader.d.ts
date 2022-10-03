import { TypeMapFeaturesConfig } from '../../../types/global-types';
/** *****************************************************************************************************************************
 * A class to process GeoView map features configuration from a URL.
 * @exports
 * @class URLmapConfigReader
 */
export declare class URLmapConfigReader {
    /** ***************************************************************************************************************************
     * Parse the search parameters passed from a url
     *
     * @param {string} urlPath A url path with parameters "?..."
     * @returns {TypeJsonObject} Object containing the parsed params.
     */
    private static getMapPropsFromUrlParams;
    /** ***************************************************************************************************************************
     * Get url parameters from url param search string
     *
     * @param {objStr} objStr the url parameters string
     * @returns {TypeJsonObject} an object containing url parameters
     */
    private static parseObjectFromUrl;
    /** ***************************************************************************************************************************
     * Get map config from url parameters
     * @param {string} mapId the map ID of the GeoView map.
     *
     * @returns {Promise<TypeMapFeaturesConfig | undefined>} A map features configuration object generated from url parameters
     */
    static getMapFeaturesConfig(mapId: string): Promise<TypeMapFeaturesConfig | undefined>;
}
