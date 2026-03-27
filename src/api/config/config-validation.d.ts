import type { MapConfigLayerEntry } from '@/api/types/layer-schema-types';
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