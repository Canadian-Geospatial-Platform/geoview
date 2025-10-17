import type { MapConfigLayerEntry } from '@/api/types/layer-schema-types';
import type { ErrorCallbackDelegate } from '@/api/config/config-validation';
/**
 * Class to read and validate the GeoView map features configuration. Will validate every item for structure and valid values.
 * If error found, will replace by default values and sent a message in the console for developers to know something went wrong.
 *
 * @exports
 * @class Config
 */
export declare class Config {
    #private;
    /**
     * Get a valid map configuration.
     * @param {MapConfigLayerEntry[]} listOfGeoviewLayerConfig - The list of Geoview layer config to validate.
     * @returns {MapConfigLayerEntry} A valid map config layer entry.
     * @static
     */
    static prevalidateGeoviewLayersConfig(listOfGeoviewLayerConfig: MapConfigLayerEntry[], onErrorCallback: ErrorCallbackDelegate): MapConfigLayerEntry[];
    /**
     * Initializes the map configuration by prevalidating the list of GeoView layer configurations.
     * @param {string} mapId - The unique identifier for the map instance.
     * @param {MapConfigLayerEntry[]} listOfGeoviewLayerConfig - The list of layer configurations to validate and initialize.
     * @param {ErrorCallbackDelegate} onErrorCallback - A callback function invoked when a validation error occurs.
     * @returns {MapConfigLayerEntry[] | undefined} The validated list of layer configs, or `undefined` if invalid.
     * @static
     */
    static initializeMapConfig(mapId: string, listOfGeoviewLayerConfig: MapConfigLayerEntry[], onErrorCallback: ErrorCallbackDelegate): MapConfigLayerEntry[] | undefined;
}
//# sourceMappingURL=config.d.ts.map