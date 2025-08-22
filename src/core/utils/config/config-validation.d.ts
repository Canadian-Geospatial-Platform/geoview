import { TypeDisplayLanguage, MapConfigLayerEntry } from '@/api/config/types/map-schema-types';
/**
 * A class to define the default values of a GeoView map configuration and validation methods for the map config attributes.
 * @exports
 * @class DefaultConfig
 */
export declare class ConfigValidation {
    #private;
    displayLanguage: TypeDisplayLanguage;
    /**
     * The ConfigValidation class constructor used to instanciate an object of this type.
     */
    constructor(language: TypeDisplayLanguage);
    /**
     * Get mapId value.
     *
     * @returns {string} The ID of the Geoview map.
     */
    get mapId(): string;
    /**
     * Set mapId value.
     * @param {string} mapId - The ID of the Geoview map.
     */
    set mapId(mapId: string);
    /**
     * Validate the map features configuration.
     * @param {TypeMapFeaturesConfig} mapFeaturesConfigToValidate - The map features configuration to validate.
     *
     * @returns {TypeMapFeaturesConfig} A valid map features configuration.
     */
    validateLayersConfigAgainstSchema(listOfGeoviewLayerConfig: MapConfigLayerEntry[], onErrorCallback: ErrorCallbackDelegate): MapConfigLayerEntry[];
    /**
     * Validate and adjust the list of GeoView layer configuration.
     * @param {MapConfigLayerEntry[]} listOfGeoviewLayerConfig - The list of GeoView layer configuration to adjust and
     * validate.
     */
    static validateListOfGeoviewLayerConfig(listOfGeoviewLayerConfig?: MapConfigLayerEntry[]): void;
}
export type ErrorCallbackDelegate = (errorKey: string, params: string[]) => void;
//# sourceMappingURL=config-validation.d.ts.map