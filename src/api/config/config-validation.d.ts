import type { MapConfigLayerEntry, ConfigClassOrType } from '@/api/types/layer-schema-types';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
/**
 * A class to define the default values of a GeoView map configuration and validation methods for the map config attributes.
 */
export declare class ConfigValidation {
    #private;
    /**
     * Validate the map features configuration.
     *
     * @param listOfGeoviewLayerConfig - The map features configuration to validate
     * @param onErrorCallback - Callback invoked when a schema error is encountered
     * @returns The validated map features configuration
     */
    static validateLayersConfigAgainstSchema(listOfGeoviewLayerConfig: MapConfigLayerEntry[], onErrorCallback: ErrorCallbackDelegate): MapConfigLayerEntry[];
    /**
     * Check if the list of layer entry configs are validated.
     * A layer entry config is considered validated if it is an instance of ConfigBaseClass.
     *
     * @param listOfLayerEntryConfig - The list of layer entry configs to check
     * @returns True if all layer entry configs are validated, false otherwise
     */
    static isListOfLayerEntryConfigValidated(listOfLayerEntryConfig: ConfigClassOrType[]): boolean;
    /**
     * Validate and adjust the list of GeoView layer configuration.
     *
     * Errors, when expected, are logged and not thrown so that each MapConfigLayerEntry can be processed independently.
     *
     * @param listOfMapConfigLayerEntry - Optional list of GeoView layer configuration to adjust and validate
     */
    static validateListOfGeoviewLayerConfig(listOfMapConfigLayerEntry?: MapConfigLayerEntry[]): void;
}
/** Callback delegate for error handling during validation. */
export type ErrorCallbackDelegate = (error: GeoViewError) => void;
//# sourceMappingURL=config-validation.d.ts.map