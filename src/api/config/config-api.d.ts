import { MapFeatureConfig } from '@/api/config/types/classes/map-feature-config';
import { TypeDisplayLanguage, TypeGeoviewLayerConfig, TypeInitialGeoviewLayerType, TypeLayerStyleConfig } from '@/api/config/types/map-schema-types';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
/**
 * The API class that create configuration object. It is used to validate and read the service and layer metadata.
 * @exports
 * @class DefaultConfig
 */
export declare class ConfigApi {
    #private;
    /**
     * Attempts to determine the layer type based on the URL format.
     *
     * @param {string} url The URL of the service for which we want to guess the GeoView layer type.
     *
     * @returns {string | undefined} The GeoView layer type or undefined if it cannot be guessed.
     */
    static guessLayerType(url: string): string | undefined;
    /**
     * Converts the stringMapFeatureConfig to a json object. Comments will be removed from the string.
     * @param {string} stringMapFeatureConfig The map configuration string to convert to JSON format.
     * @returns {MapFeatureConfig | undefined} A JSON map feature configuration object.
     * @private
     */
    static convertStringToJson(stringMapFeatureConfig: string): MapFeatureConfig | undefined;
    /**
     * Gets a map feature config from url parameters.
     * @param {string} urlStringParams The url parameters.
     *
     * @returns {Promise<MapFeatureConfig>} A map feature configuration object generated from url parameters.
     * @static @async
     */
    static getConfigFromUrl(urlStringParams: string): Promise<MapFeatureConfig>;
    /**
     * Gets the default values that are applied to the map feature configuration when the user doesn't provide a value for a field
     * that is covered by a default value.
     * @returns {MapFeatureConfig} The map feature configuration default values.
     * @static
     */
    static getDefaultMapFeatureConfig(): MapFeatureConfig;
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
     * @param {string | MapFeatureConfig} mapConfig The map feature configuration to validate.
     * @returns {MapFeatureConfig} The validated map feature configuration.
     * @static
     */
    static validateMapConfig(mapConfig: string | MapFeatureConfig): MapFeatureConfig;
    /**
     * Validates an object against a JSON schema using Ajv.
     * @param {string} schemaPath - The JSON schema path used to retrieve the validator function.
     * @param {object} targetObject - The object to be validated against the schema.
     * @returns {boolean} Returns `true` if validation passes, `false` otherwise.
     */
    static validateSchema(schemaPath: string, targetObject: object): boolean;
    /**
     * Converts an ESRI renderer (in stringified JSON format) into a GeoView-compatible layer style configuration.
     * @param {string} rendererAsString - A stringified JSON representation of the ESRI renderer.
     * @returns {TypeLayerStyleConfig | undefined} The corresponding layer style configuration, or `undefined` if parsing or conversion fails.
     */
    static getStyleFromESRIRenderer(rendererAsString: string): TypeLayerStyleConfig | undefined;
    /**
     * Creates and initializes a GeoView layer configuration based on the specified layer type.
     * This method dynamically selects the appropriate layer class (e.g., EsriDynamic, WMS, GeoJSON, etc.)
     * based on the provided `layerType`, and calls its `initGeoviewLayerConfig` method using the
     * supplied ID, name, and URL. If the layer type is not supported, an error is thrown.
     * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name of the layer.
     * @param {TypeInitialGeoviewLayerType} layerType - The type of GeoView layer to initialize (e.g., 'esriDynamic', 'ogcWms', 'GeoJSON', etc.).
     * @param {string} layerURL - The URL endpoint associated with the layer (e.g., service URL, file path).
     * @param {TypeDisplayLanguage} language - The language, used for the geocore layer types to know which language to use when extracting layer information.
     * @param {string} mapId - The map id, used for the geocore layer types, to determine the layer id.
     * @returns {Promise<TypeGeoviewLayerConfig>} A Promise of a fully initialized `TypeGeoviewLayerConfig`.
     * @throws {NotSupportedError} If the provided layer type is not recognized or supported.
     */
    static createInitConfigFromType(layerType: TypeInitialGeoviewLayerType, geoviewLayerId: string, geoviewLayerName: string, layerURL: string, language?: TypeDisplayLanguage, mapId?: string): Promise<TypeGeoviewLayerConfig>;
    /**
     * Processes the layer to generate a list of ConfigBaseClass objects.
     * @param {TypeInitialGeoviewLayerType} layerType - The layer type
     * @param {string} geoviewLayerId - The geoview layer id
     * @param {string} geoviewLayerName - The geoview layer name
     * @param {string} layerURL - The layer url
     * @param {number[] | string[]} layerIds - The layer ids for each layer entry config.
     * @returns {Promise<ConfigBaseClass[]>} A Promise of a list of ConfigBaseClass objects.
     * @throws {NotSupportedError} If the provided layer type is not recognized or supported.
     */
    static processLayerFromType(layerType: TypeInitialGeoviewLayerType, geoviewLayerId: string, geoviewLayerName: string, layerURL: string, layerIds: number[] | string[]): Promise<ConfigBaseClass[]>;
    /**
     * Utility function to serialize to string a TypeGeoviewLayerConfig object.
     * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The TypeGeoviewLayerConfig to serialize.
     * @returns {string} The serialized TypeGeoviewLayerConfig.
     */
    static serializeGeoviewLayerConfig(geoviewLayerConfig: TypeGeoviewLayerConfig): string;
    /**
     * Utility function to serialize an array of ConfigBaseClass objects.
     * @param {ConfigBaseClass[]} layerConfigs - The array of ConfigBaseClass objects to serialize.
     * @returns {string} The serialized array of ConfigBaseClass.
     */
    static serializeConfigClasses(layerConfigs: ConfigBaseClass[]): string;
}
//# sourceMappingURL=config-api.d.ts.map