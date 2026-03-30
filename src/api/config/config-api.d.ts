import { MapFeatureConfig } from '@/api/config/map-feature-config';
import type { TypeDisplayLanguage, TypeLayerStyleConfig } from '@/api/types/map-schema-types';
import type { TypeGeoviewLayerConfig, TypeInitialGeoviewLayerType } from '@/api/types/layer-schema-types';
import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
/**
 * The API class that creates configuration objects. It is used to validate and read the service and layer metadata.
 */
export declare class ConfigApi {
    #private;
    /**
     * Attempts to determine the layer type based on the URL format.
     *
     * @param url - The URL of the service for which we want to guess the GeoView layer type
     * @returns The GeoView layer type or undefined if it cannot be guessed
     */
    static guessLayerType(url: string): string | undefined;
    /**
     * Gets a map feature config from url parameters.
     *
     * @param urlStringParams - The url parameters
     * @param existingUuids - Optional array of existing layer UUIDs to check for duplicates
     * @returns A map feature configuration object generated from url parameters
     */
    static getConfigFromUrl(urlStringParams: string, existingUuids?: string[]): MapFeatureConfig;
    /**
     * Gets the default values that are applied to the map feature configuration when the user doesn't provide a value for a field
     * that is covered by a default value.
     *
     * @returns The map feature configuration default values
     */
    static getDefaultMapFeatureConfig(): MapFeatureConfig;
    /**
     * This method validates the configuration of map elements using the json string or json object supplied by the user.
     *
     * The returned value is a configuration object initialized only from the configuration passed as a parameter.
     * Validation of the configuration based on metadata and application of default values is not performed here,
     * but will be done later using another method.
     *
     * If the configuration is unreadable or generates a fatal error, the default configuration will be returned with
     * the error flag raised and an error message logged in the console. When configuration processing is possible, if
     * errors are detected, the configuration will be corrected to the best of our ability to avoid crashing the viewer,
     * and all changes made will be logged in the console.
     *
     * @param mapConfig - The map feature configuration to validate
     * @returns The validated map feature configuration
     */
    static validateMapConfig(mapConfig: string | MapFeatureConfig): MapFeatureConfig;
    /**
     * Validates an object against a JSON schema using Ajv.
     *
     * @param schemaPath - The JSON schema path used to retrieve the validator function
     * @param targetObject - The object to be validated against the schema
     * @returns `true` if validation passes, `false` otherwise
     */
    static validateSchema(schemaPath: string, targetObject: object): boolean;
    /**
     * Converts an ESRI renderer (in stringified JSON format) into a GeoView-compatible layer style configuration.
     *
     * @param rendererAsString - A stringified JSON representation of the ESRI renderer
     * @returns The corresponding layer style configuration, or undefined if parsing or conversion fails
     */
    static getStyleFromESRIRenderer(rendererAsString: string): TypeLayerStyleConfig | undefined;
    /**
     * Fetches and returns the WMS Styles content (SLD or XML) for the specified layer(s)
     * from a given WMS service URL.
     *
     * This function ensures that the request URL is properly formatted
     * as a valid WMS `GetStyles` request before fetching the style definition.
     *
     * @param wmsUrl - The base WMS service URL
     * @param layers - A comma-separated list of WMS layer names to request styles for
     * @returns A promise that resolves to the style definition (typically an XML or SLD string) retrieved from the WMS service
     */
    static fetchStyleFromWMS(wmsUrl: string, layers: string): Promise<string>;
    /**
     * Converts a WMS XML Styles renderer into a GeoView-compatible layer style configuration.
     *
     * @param xmlContent - An XML representation of the WMS renderer
     * @returns The corresponding layer style configuration, or undefined if parsing or conversion fails
     */
    static getStyleFromWMSRenderer(xmlContent: string): TypeLayerStyleConfig;
    /**
     * Creates and initializes a GeoView layer configuration based on the specified layer type.
     *
     * This method dynamically selects the appropriate layer class (e.g., EsriDynamic, WMS, GeoJSON, etc.)
     * based on the provided `layerType`, and calls its `initGeoviewLayerConfig` method using the
     * supplied ID, name, and URL. If the layer type is not supported, an error is thrown.
     *
     * @param layerType - The type of GeoView layer to initialize (e.g., 'esriDynamic', 'ogcWms', 'GeoJSON', etc.)
     * @param geoviewLayerId - A unique identifier for the GeoView layer
     * @param geoviewLayerName - The display name of the layer
     * @param layerURL - The URL endpoint associated with the layer (e.g., service URL, file path)
     * @param isTimeAware - Optional indicates whether the layer supports time-based filtering
     * @param language - Optional language, used for the geocore layer types to know which language to use when extracting layer information
     * @param mapId - Optional map id, used for the geocore layer types, to determine the layer id
     * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
     * @returns A promise that resolves with a fully initialized TypeGeoviewLayerConfig
     * @throws {NotSupportedError} When the provided layer type is not recognized or supported
     */
    static createInitConfigFromType(layerType: TypeInitialGeoviewLayerType, geoviewLayerId: string, geoviewLayerName: string, layerURL: string, isTimeAware?: boolean, language?: TypeDisplayLanguage, mapId?: string, abortSignal?: AbortSignal): Promise<TypeGeoviewLayerConfig>;
    /**
     * Processes the layer to generate a list of ConfigBaseClass objects.
     *
     * @param layerType - The layer type
     * @param geoviewLayerId - The geoview layer id
     * @param geoviewLayerName - The geoview layer name
     * @param layerURL - The layer url
     * @param layerIds - The layer ids for each layer entry config
     * @param isTimeAware - Indicates if the layer is time aware
     * @returns A promise that resolves with a list of ConfigBaseClass objects
     * @throws {NotSupportedError} When the provided layer type is not recognized or supported
     */
    static processLayerFromType(layerType: TypeInitialGeoviewLayerType, geoviewLayerId: string, geoviewLayerName: string, layerURL: string, layerIds: number[] | string[], isTimeAware: boolean): Promise<ConfigBaseClass[]>;
    /**
     * Utility function to serialize to string a TypeGeoviewLayerConfig object.
     *
     * @param geoviewLayerConfig - The TypeGeoviewLayerConfig to serialize
     * @returns The serialized TypeGeoviewLayerConfig
     */
    static serializeGeoviewLayerConfig(geoviewLayerConfig: TypeGeoviewLayerConfig): string;
    /**
     * Utility function to serialize an array of ConfigBaseClass objects.
     *
     * @param layerConfigs - The array of ConfigBaseClass objects to serialize
     * @returns The serialized array of ConfigBaseClass
     */
    static serializeConfigClasses(layerConfigs: ConfigBaseClass[]): string;
    /**
     * Utility function to validate a UUID.
     *
     * @param uuid - The uuid to test
     * @returns True if the provided uuid is a valid uuid
     */
    static isValidUUID(uuid: string): boolean;
}
//# sourceMappingURL=config-api.d.ts.map