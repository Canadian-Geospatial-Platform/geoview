import { TypeListOfGeoviewLayerConfig } from '../../../../geo/map/map-schema-types';
/** *****************************************************************************************************************************
 * A class to generate GeoView layers config from a URL using a UUID.
 * @exports
 * @class UUIDmapConfigReader
 */
export declare class UUIDmapConfigReader {
    /** ***************************************************************************************************************************
     * Generate layer configs from uuid request result
     *
     * @param {TypeJsonObject} result the uuid request result
     * @returns {TypeListOfGeoviewLayerConfig} layers parsed from uuid result
     */
    private static getLayerConfigFromResponse;
    /** ***************************************************************************************************************************
     * Generate GeoView layers config from a URL using a UUID.
     * @param {string} mapId the ID of the map.
     * @param {string} requestUrl the URL to request result
     * @param {Element} mapElement the map element
     *
     * @returns {Promise<TypeGeoviewLayerConfig>} layers parsed from uuid result
     */
    static getGVlayersConfigFromUUID(mapId: string, requestUrl: string): Promise<TypeListOfGeoviewLayerConfig>;
}
