import type { MapConfigLayerEntry } from '@/api/types/layer-schema-types';
/**
 * A class to define the default values of a GeoView map configuration and validation methods for the map config attributes.
 * @exports
 * @class DefaultConfig
 */
export declare class ConfigValidation {
    #private;
    /**
     * Validate the map features configuration.
     * @param {MapConfigLayerEntry[]} listOfGeoviewLayerConfig - The map features configuration to validate.
     * @returns {MapConfigLayerEntry[]} A valid map features configuration.
     * @static
     */
    static validateLayersConfigAgainstSchema(listOfGeoviewLayerConfig: MapConfigLayerEntry[], onErrorCallback: ErrorCallbackDelegate): MapConfigLayerEntry[];
    /**
     * Validate and adjust the list of GeoView layer configuration.
     * @param {MapConfigLayerEntry[]} listOfMapConfigLayerEntry - The list of GeoView layer configuration to adjust and
     * validate.
     */
    static validateListOfGeoviewLayerConfig(listOfMapConfigLayerEntry?: MapConfigLayerEntry[]): void;
}
export type ErrorCallbackDelegate = (errorKey: string, params: string[]) => void;
//# sourceMappingURL=config-validation.d.ts.map