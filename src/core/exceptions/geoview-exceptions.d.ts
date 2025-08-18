import { Extent } from 'ol/extent';
import { TypeDisplayLanguage } from '@/api/config/types/map-schema-types';
/**
 * Base error for GeoView that includes the map ID and supports localized messages.
 * @extends {Error}
 */
export declare class GeoViewError extends Error {
    /** The localized key or message */
    readonly messageKey: string;
    /** The parameters to be translated using the localizedKey */
    readonly messageParams: unknown[] | undefined;
    /**
     * Constructs a new GeoViewError.
     * @param {string} messageKey - A localization key or a raw error message.
     * @param {unknown[] | undefined} messageParams - Optional parameters for localization formatting.
     * @param {ErrorOptions?} options - Optional error options, including `cause`.
     */
    constructor(messageKey: string, messageParams?: unknown[], options?: ErrorOptions);
    /**
     * Returns a localized version of the error message using the given display language.
     * @param {TypeDisplayLanguage} language - The target language for translation.
     * @returns {string} The translated error message based on the error's message key and parameters.
     */
    translateMessage(language: TypeDisplayLanguage): string;
    /**
     * Logs an error using the application's logger.
     * If the error is a GeoViewError, its message is translated to English (default) before logging.
     * @param {unknown} error - The error to be logged. Can be any type.
     * @param {TypeDisplayLanguage} language - The language to translate the error into. English by default.
     */
    static logError(error: unknown, language?: TypeDisplayLanguage): void;
}
/**
 * Error thrown when a map viewer with a specified ID is not found.
 * @extends {GeoViewError}
 */
export declare class MapViewerNotFoundError extends GeoViewError {
    /**
     * Creates an instance of MapViewerNotFoundError.
     * @param {string} mapId - The unique identifier of the map that was not found.
     */
    constructor(mapId: string);
}
/**
 * Error thrown when a map viewer with a specified ID already exists.
 * @extends {GeoViewError}
 */
export declare class MapViewerAlreadyExistsError extends GeoViewError {
    /**
     * Creates an instance of MapViewerAlreadyExistsError.
     * @param {string} mapId - The unique identifier of the map that was not found.
     */
    constructor(mapId: string);
}
/**
 * Error thrown when GeoView Store on a specific map ID is not found.
 * @extends {GeoViewError}
 */
export declare class GeoViewStoreOnMapNotFoundError extends GeoViewError {
    /**
     * Creates an instance of GeoViewStoreOnMapNotFoundError.
     * @param {string} mapId - The unique identifier of the map on which toe GeoView Store was not found.
     */
    constructor(mapId: string);
}
/**
 * Error thrown when GeoView map on a specific map ID already exist.
 * @extends {Error}
 */
export declare class GeoViewMapIdAlreadyExistError extends Error {
    /**
     * Creates an instance of GeoViewMapIdAlreadyExistError.
     * @param {string} mapId - The unique identifier of the map.
     */
    constructor(mapId: string);
}
/**
 * Error thrown when an invalid or unsupported projection code is encountered.
 * @extends {GeoViewError}
 */
export declare class InvalidProjectionError extends GeoViewError {
    /**
     * Creates a new InvalidProjectionError.
     * @param {string} projectionCode - The invalid projection code that caused the error.
     */
    constructor(projectionCode: string);
}
/**
 * Error thrown when an invalid extent is provided to a GeoView operation, such as zooming.
 * This helps surface cases where extent values are malformed or undefined.
 * @extends {GeoViewError}
 */
export declare class InvalidExtentError extends GeoViewError {
    /**
     * Constructs an InvalidExtentError error for the specified map ID and extent.
     * @param {Extent} extent - The invalid extent that caused the error.
     */
    constructor(extent: Extent);
}
/**
 * Error thrown when a response from a geospatial service does not include a `features` property.
 * This typically indicates a malformed or unexpected response structure from the service,
 * which prevents further processing of the data.
 * @extends {GeoViewError}
 */
export declare class NoFeaturesPropertyError extends GeoViewError {
    /**
     * Creates an instance of NoFeaturesPropertyError.
     */
    constructor();
}
/**
 * Error thrown when a core basemap creation fails.
 * @extends {GeoViewError}
 */
export declare class CoreBasemapCreationError extends GeoViewError {
    /**
     * Constructs a CoreBasemapCreationError error for the specified map ID.
     */
    constructor();
}
/**
 * Error thrown when the basemap creation process takes longer than expected.
 * This error is typically used to notify that the basemap did not complete its creation
 * within a predefined timeout period.
 */
export declare class BasemapTakingLongTimeError extends GeoViewError {
    /**
     * Constructs a BasemapTakingLongTimeError error for the specified map ID.
     */
    constructor();
}
/**
 * Error thrown when a basemap layer creation fails.
 */
export declare class BasemapLayerCreationError extends GeoViewError {
    /**
     * Constructs a BasemapLayerCreationError error for the specified map ID.
     */
    constructor(basemapType: string);
}
/**
 * Custom error class representing a failure to retrieve geographic bounds
 * for a specific map layer.
 * @extends {GeoViewError}
 */
export declare class NoBoundsError extends GeoViewError {
    /**
     * Creates an instance of NoBoundsError.
     * @param {string} layerPath - The path or identifier of the layer that caused the error.
     */
    constructor(layerPath: string);
}
/**
 * Error class representing the absence of an extent.
 * This is thrown when a geographic operation expects a bounding extent
 * (e.g., from a layer, source, or feature) but none is found or provided.
 * @extends {GeoViewError}
 */
export declare class NoExtentError extends GeoViewError {
    /**
     * Creates an instance of NoExtentError.
     * @param {string} layerPath - The layer path for which we tried to get an Extent.
     */
    constructor(layerPath: string);
}
/**
 * Error thrown when a map-related function is called at the wrong time or under invalid conditions during initialization.
 * Typically used to indicate misuse of the initialization sequence.
 */
export declare class InitDivNotExistError extends GeoViewError {
    /**
     * Creates an instance of InitDivNotExistError.
     * @param {string} mapId - The map id for which a wront function call was made.
     */
    constructor(mapId: string);
}
/**
 * Error thrown when a map-related function is called at the wrong time or under invalid conditions during initialization.
 * Typically used to indicate misuse of the initialization sequence.
 */
export declare class InitMapWrongCallError extends GeoViewError {
    /**
     * Creates an instance of InitMapWrongCallError.
     * @param {string} mapId - The map id for which a wront function call was made.
     */
    constructor(mapId: string);
}
//# sourceMappingURL=geoview-exceptions.d.ts.map