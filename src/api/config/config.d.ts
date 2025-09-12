import { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import { MapConfigLayerEntry, TypeGeoviewLayerType, TypeLayerEntryType } from '@/api/types/layer-schema-types';
import { ConfigValidation, ErrorCallbackDelegate } from '@/api/config/config-validation';
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
    /**
     * Returns the corresponding layer entry type for a given GeoView layer type.
     * This method maps a `TypeGeoviewLayerType` (e.g., CSV, WMS, XYZ_TILES)
     * to its associated `TypeLayerEntryType` (e.g., VECTOR, RASTER_IMAGE, RASTER_TILE).
     * Useful for determining how a layer should be handled/rendered internally.
     * @param {TypeGeoviewLayerType} layerType - The GeoView layer type to convert.
     * @returns The corresponding layer entry type.
     * @throws {NotSupportedError} If the provided `layerType` is not supported for conversion.
     */
    static getLayerEntryTypeFromLayerType(layerType: TypeGeoviewLayerType): TypeLayerEntryType;
}
//# sourceMappingURL=config.d.ts.map