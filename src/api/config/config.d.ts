import type { MapConfigLayerEntry } from '@/api/types/layer-schema-types';
import type { ErrorCallbackDelegate } from '@/api/config/config-validation';
/**
 * Class to read and validate the GeoView map features configuration.
 * Will validate every item for structure and valid values.
 *
 * If error found, will replace by default values and sent a message in the console for developers to know something went wrong.
 */
export declare class Config {
    #private;
    /**
     * Get a valid map configuration.
     *
     * @param listOfGeoviewLayerConfig - The list of Geoview layer config to validate
     * @param onErrorCallback - Callback invoked when a validation error occurs
     * @returns A valid list of map config layer entries
     */
    static prevalidateGeoviewLayersConfig(listOfGeoviewLayerConfig: MapConfigLayerEntry[], onErrorCallback: ErrorCallbackDelegate): MapConfigLayerEntry[];
    /**
     * Initializes the map configuration by prevalidating the list of GeoView layer configurations.
     *
     * @param mapId - The unique identifier for the map instance
     * @param listOfGeoviewLayerConfig - The list of layer configurations to validate and initialize
     * @param onErrorCallback - A callback function invoked when a validation error occurs
     * @returns The validated list of layer configs, or undefined if invalid
     */
    static initializeMapConfig(mapId: string, listOfGeoviewLayerConfig: MapConfigLayerEntry[], onErrorCallback: ErrorCallbackDelegate): MapConfigLayerEntry[] | undefined;
}
//# sourceMappingURL=config.d.ts.map