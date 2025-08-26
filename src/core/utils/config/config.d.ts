import { MapConfigLayerEntry, TypeDisplayLanguage } from '@/api/config/types/map-schema-types';
import { ConfigValidation, ErrorCallbackDelegate } from '@/core/utils/config/config-validation';
/**
 * Class to read and validate the GeoView map features configuration. Will validate every item for structure and valid values.
 * If error found, will replace by default values and sent a message in the console for developers to know something went wrong.
 *
 * @exports
 * @class Config
 */
export declare class Config {
    #private;
    /** The element associated to the map properties configuration.. */
    /** Config validation object used to validate the configuration and define default values */
    configValidation: ConfigValidation;
    /**
     * Constructor
     * @param {TypeDisplayLanguage} language - The language
     */
    constructor(language: TypeDisplayLanguage);
    /**
     * Get a valid map configuration.
     * @param {MapConfigLayerEntry[]} listOfGeoviewLayerConfig - The list of Geoview layer config to validate.
     * @returns {MapConfigLayerEntry} A valid map config layer entry.
     */
    prevalidateGeoviewLayersConfig(listOfGeoviewLayerConfig: MapConfigLayerEntry[], onErrorCallback: ErrorCallbackDelegate): MapConfigLayerEntry[];
    /**
     * Initializes the map configuration by prevalidating the list of GeoView layer configurations.
     * @param {string} mapId - The unique identifier for the map instance.
     * @param {MapConfigLayerEntry[]} listOfGeoviewLayerConfig - The list of layer configurations to validate and initialize.
     * @param {ErrorCallbackDelegate} onErrorCallback - A callback function invoked when a validation error occurs.
     * @returns {MapConfigLayerEntry[] | undefined} The validated list of layer configs, or `undefined` if invalid.
     */
    initializeMapConfig(mapId: string, listOfGeoviewLayerConfig: MapConfigLayerEntry[], onErrorCallback: ErrorCallbackDelegate): MapConfigLayerEntry[] | undefined;
}
//# sourceMappingURL=config.d.ts.map