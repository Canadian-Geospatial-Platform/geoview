import { TypeDisplayLanguage, TypeGeoviewLayerConfig, MapConfigLayerEntry } from '@/api/config/types/map-schema-types';
/**
 * A class to define the default values of a GeoView map configuration and validation methods for the map config attributes.
 * @exports
 * @class DefaultConfig
 */
export declare class ConfigValidation {
    #private;
    displayLanguage: TypeDisplayLanguage;
    /** ***************************************************************************************************************************
     * The ConfigValidation class constructor used to instanciate an object of this type.
     */
    constructor(language: TypeDisplayLanguage);
    /** ***************************************************************************************************************************
     * Get mapId value.
     *
     * @returns {string} The ID of the Geoview map.
     */
    get mapId(): string;
    /** ***************************************************************************************************************************
     * Set mapId value.
     * @param {string} mapId - The ID of the Geoview map.
     */
    set mapId(mapId: string);
    /** ***************************************************************************************************************************
     * Validate the map features configuration.
     * @param {TypeMapFeaturesConfig} mapFeaturesConfigToValidate - The map features configuration to validate.
     *
     * @returns {TypeMapFeaturesConfig} A valid map features configuration.
     */
    validateMapConfigAgainstSchema(listOfGeoviewLayerConfig: MapConfigLayerEntry[], onErrorCallback: (errorKey: string, params: string[]) => void): MapConfigLayerEntry[];
    /** ***************************************************************************************************************************
     * Validate and adjust the list of GeoView layer configuration.
     * @param {TypeGeoviewLayerConfig[]} listOfGeoviewLayerConfig - The list of GeoView layer configuration to adjust and
     * validate.
     */
    static validateListOfGeoviewLayerConfig(language: TypeDisplayLanguage, listOfGeoviewLayerConfig?: TypeGeoviewLayerConfig[]): void;
}
