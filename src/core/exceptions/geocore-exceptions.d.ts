import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
export declare class LayerGeoCoreError extends GeoViewError {
    /** The uuids that failed */
    readonly uuids: string[];
    /**
     * Constructs a new UUID-not-found error for a given map and list of UUIDs.
     */
    protected constructor(uuids: string[], messageKey: string, messageParams?: unknown[], options?: ErrorOptions);
}
/**
 * Error thrown when one or more layer UUIDs are not found when queried.
 * @extends {LayerGeoCoreError}
 */
export declare class LayerGeoCoreUUIDNotFoundError extends LayerGeoCoreError {
    /**
     * Constructs a new UUID-not-found error for a given map and list of UUIDs.
     * @param {string[]} uuids - The list of UUIDs that could not be found.
     * @param {Error} cause - The original error that caused this one, if any.
     */
    constructor(uuids: string[], cause: Error);
}
/**
 * Error thrown when an invalid response has been returned by the GeoCore service.
 * @extends {LayerGeoCoreError}
 */
export declare class LayerGeoCoreInvalidResponseError extends LayerGeoCoreError {
    /**
     * Constructs a new LayerGeoCoreInvalidResponseError for a given map and UUIDs.
     * @param {string[]} uuids - The list of UUIDs that caused an invalid response by GeoCore.
     */
    constructor(uuids: string[], errorMessage: unknown);
}
/**
 * Error thrown when no layers were returned by the GeoCore service.
 * @extends {LayerGeoCoreError}
 */
export declare class LayerGeoCoreNoLayersError extends LayerGeoCoreError {
    /**
     * Constructs a new LayerGeoCoreNoLayersError for a given map and UUIDs.
     * @param {string[]} uuids - The list of UUIDs that returned no layers.
     */
    constructor(uuids: string[]);
}
