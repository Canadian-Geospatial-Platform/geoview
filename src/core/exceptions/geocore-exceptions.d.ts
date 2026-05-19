import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
/** Error related to a GeoCore layer operation. */
export declare class LayerGeoCoreError extends GeoViewError {
    /** The uuids that failed */
    readonly uuids: string[];
    /**
     * Constructs a new UUID-not-found error for a given map and list of UUIDs.
     *
     * @param uuids - The list of UUIDs that failed
     * @param messageKey - A localization key
     * @param messageParams - Optional parameters for localization formatting
     * @param options - Optional error options, including `cause`
     */
    protected constructor(uuids: string[], messageKey: string, messageParams?: Record<string, unknown>, options?: ErrorOptions);
}
/**
 * Error thrown when the Geocore service fails to respond.
 */
export declare class LayerGeoCoreServiceFailError extends LayerGeoCoreError {
    /**
     * Constructs a new geocore service fail error for a given UUIDs.
     *
     * @param uuids - The list of UUIDs that could not be found
     * @param cause - The original error that caused this one
     */
    constructor(uuids: string[], cause: Error);
}
/**
 * Error thrown when an invalid response has been returned by the GeoCore service.
 */
export declare class LayerGeoCoreInvalidResponseError extends LayerGeoCoreError {
    /**
     * Constructs a new LayerGeoCoreInvalidResponseError for a given map and UUIDs.
     *
     * @param uuids - The list of UUIDs that caused an invalid response by GeoCore
     * @param errorMessage - The error message explaining the invalid response
     */
    constructor(uuids: string[], errorMessage: string);
}
/**
 * Error thrown when no layers were returned by the GeoCore service.
 */
export declare class LayerGeoCoreNoLayersError extends LayerGeoCoreError {
    /**
     * Constructs a new LayerGeoCoreNoLayersError for a given map and UUIDs.
     *
     * @param uuids - The list of UUIDs that returned no layers
     */
    constructor(uuids: string[]);
}
//# sourceMappingURL=geocore-exceptions.d.ts.map