import { CV_CONFIG_GEOCORE_TYPE } from '@config/types/config-constants';
import { TypeJsonObject, TypeJsonArray } from '@config/types/config-types';
import { MapFeatureConfig } from '@config/types/classes/map-feature-config';
import { AbstractGeoviewLayerConfig, EntryConfigBaseClass, TypeDisplayLanguage, TypeGeoviewLayerType } from '@config/types/map-schema-types';
/**
 * The API class that create configuration object. It is used to validate and read the service and layer metadata.
 * @exports
 * @class DefaultConfig
 */
export declare class ConfigApi {
    #private;
    /** Static property that contains the last object instanciated by the ConfigApi.getLayerConfig call */
    static lastLayerConfigCreated?: AbstractGeoviewLayerConfig;
    /** Static property that contains the last object instanciated by the ConfigApi.createMapConfig call */
    static lastMapConfigCreated?: MapFeatureConfig;
    static devMode: boolean;
    /** ***************************************************************************************************************************
     * Function used to validate the GeoCore UUIDs.
     *
     * @param {string} uuid The UUID to validate.
     *
     * @returns {boolean} Returns true if the UUID respect the format.
     * @static
     */
    static isValidUUID(uuid: string): boolean;
    /** ***************************************************************************************************************************
     * Attempt to determine the layer type based on the URL format.
     *
     * @param {string} url The URL of the service for which we want to guess the GeoView layer type.
     *
     * @returns {string | undefined} The GeoView layer type or undefined if it cannot be guessed.
     */
    static guessLayerType(url: string): string | undefined;
    /**
     * Get a map feature config from url parameters.
     * @param {string} urlStringParams The url parameters.
     *
     * @returns {Promise<MapFeatureConfig>} A map feature configuration object generated from url parameters.
     * @static @async
     */
    static getConfigFromUrl(urlStringParams: string): Promise<MapFeatureConfig>;
    /**
     * Get the default values that are applied to the map feature configuration when the user doesn't provide a value for a field
     * that is covered by a default value.
     * @param {TypeDisplayLanguage} language The language of the map feature config we want to produce.
     *
     * @returns {MapFeatureConfig} The map feature configuration default values.
     * @static
     */
    static getDefaultMapFeatureConfig(language: TypeDisplayLanguage): MapFeatureConfig;
    /**
     * Convert one layer config or an array of GeoCore layer config to their GeoView equivalents. The method returns undefined
     * and log an error in the console if a GeoCore layer cannot be converted. When the input/output type is an array, it is
     * possible to filter out the undefined values.
     *
     * @param {TypeDisplayLanguage} language The language language to use for the conversion.
     * @param {TypeJsonArray | TypeJsonObject} config Configuration to process.
     * @param {string} geocoreUrl Optional GeoCore server URL.
     * @param {boolean} filterUndefinedValues Flag indicating that we want to filter undefined values when the return type is an array..
     *
     * @returns {Promise<TypeJsonArray>} The resulting configurations or undefined if there is an error.
     * @static @private
     */
    static convertGeocoreToGeoview(language: TypeDisplayLanguage, config: TypeJsonArray | TypeJsonObject, geocoreUrl?: string, filterUndefinedValues?: boolean): Promise<TypeJsonArray | TypeJsonObject | undefined>;
    /**
     * This method validates the configuration of map elements using the json string or json object supplied by the user.
     * The returned value is a configuration object initialized only from the configuration passed as a parameter.
     * Validation of the configuration based on metadata and application of default values is not performed here,
     * but will be done later using another method.
     *
     * If the configuration is unreadable or generates a fatal error, the default configuration will be returned with
     * the error flag raised and an error message logged in the console. When configuration processing is possible, if
     * errors are detected, the configuration will be corrected to the best of our ability to avoid crashing the viewer,
     * and all changes made will be logged in the console.
     *
     * @param {string | TypeJsonObject} mapConfig The map feature configuration to validate.
     * @param {TypeDisplayLanguage} language The language of the map feature config we want to produce.
     *
     * @returns {MapFeatureConfig} The validated map feature configuration.
     * @static
     */
    static validateMapConfig(mapConfig: string | TypeJsonObject, language: TypeDisplayLanguage): MapFeatureConfig;
    /**
     * Create the map feature configuration instance using the json string or the json object provided by the user.
     * All GeoCore entries found in the config are translated to their corresponding Geoview configuration.
     *
     * @param {string | TypeJsonObject} mapConfig The map feature configuration to instanciate.
     * @param {TypeDisplayLanguage} language The language of the map feature config we want to produce.
     *
     * @returns {Promise<MapFeatureConfig>} The map feature configuration Promise.
     * @static
     */
    static createMapConfig(mapConfig: string | TypeJsonObject, language: TypeDisplayLanguage): Promise<MapFeatureConfig>;
    /**
     * Create the layer configuration instance using the layer access string and layer type provided by the user.
     *
     * @param {string} serviceAccessString The service access string (a URL or a layer identifier).
     * @param {TypeGeoviewLayerType | CV_CONFIG_GEOCORE_TYPE} layerType The GeoView layer type or 'geoCore'.
     * @param {TypeJsonArray} listOfLayerId Optionnal list of layer ids (default []).
     * @param {TypeDisplayLanguage} language Optional display language (default: en).
     *
     * @returns {AbstractGeoviewLayerConfig | undefined} The layer configuration or undefined if there is an error.
     * @static
     */
    static createLayerConfig(serviceAccessString: string, layerType: TypeGeoviewLayerType | typeof CV_CONFIG_GEOCORE_TYPE, listOfLayerId?: TypeJsonArray, language?: TypeDisplayLanguage): Promise<AbstractGeoviewLayerConfig | undefined>;
    /**
     * Create the layer tree from the service metadata. If an error is detected, throw an error.
     *
     * @param {string} serviceAccessString The service access string (a URL or a layer identifier).
     * @param {TypeGeoviewLayerType | CV_CONFIG_GEOCORE_TYPE} layerType The GeoView layer type or 'geoCore'.
     * @param {TypeJsonArray} listOfLayerId Optionnal list of layer ids (default []).
     * @param {TypeDisplayLanguage} language Optional display language (default: en).
     *
     * @returns {EntryConfigBaseClass[]} The metadata layer tree.
     * @static
     */
    static createMetadataLayerTree(serviceAccessString: string, layerType: TypeGeoviewLayerType, listOfLayerId?: TypeJsonArray, language?: TypeDisplayLanguage): Promise<EntryConfigBaseClass[]>;
}
