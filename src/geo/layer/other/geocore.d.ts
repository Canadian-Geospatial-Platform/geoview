import { TypeLayerEntryConfig, TypeGeoviewLayerConfig, TypeGeocoreLayerEntryConfig, TypeListOfGeoviewLayerConfig } from '../../map/map-schema-types';
export interface TypeGeoCoreLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: 'geoCore';
    listOfLayerEntryConfig: TypeGeocoreLayerEntryConfig[];
}
/** *****************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeGeocoreLayerEntryConfig if the geoviewLayerType attribute of
 * the verifyIfGeoViewEntry.geoviewLayerConfig attribute is GEOCORE. The type ascention applies only to the true block of the if
 * clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewEntryIsGeocore: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is TypeGeocoreLayerEntryConfig;
/** *****************************************************************************************************************************
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeGeoCoreLayerConfig if the geoviewLayerType attribute of
 * the verifyIfLayer parameter is GEOCORE. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsGeoCore: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeGeoCoreLayerConfig;
/**
 * Class used to add geoCore layer to the map
 *
 * @exports
 * @class GeoCore
 */
export declare class GeoCore {
    private mapId;
    /** Config validation object used to validate the configuration and define default values */
    private configValidation;
    /**
     * Initialize layer
     * @param {string} mapId the id of the map
     */
    constructor(mapId: string);
    /**
     * Get GeoView layer configurations list from the UUIDs of the list of layer entry configurations.
     *
     * @param {TypeGeocoreLayerEntryConfig} geocoreLayerConfig the layer configuration
     * @returns {Promise<TypeListOfGeoviewLayerConfig>} list of layer configurations to add to the map
     */
    createLayers(geocoreLayerConfig: TypeGeoCoreLayerConfig): Promise<TypeListOfGeoviewLayerConfig[]>;
    /**
     * Copy the config settings over the geocore values (config values have priority).
     *
     * @param {TypeGeocoreLayerEntryConfig} geocoreLayerEntryConfig The config file settings
     * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The settings returned by the geocore service
     */
    private copyConfigSettingsOverGeocoreSettings;
}
