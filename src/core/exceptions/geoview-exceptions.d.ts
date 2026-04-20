import type { Extent } from 'ol/extent';
import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
/**
 * Base error for GeoView that includes the map ID and supports localized messages.
 */
export declare class GeoViewError extends Error {
    #private;
    /** The localized key or message */
    readonly messageKey: string;
    /** The parameters to be translated using the localizedKey */
    readonly messageParams: unknown[] | undefined;
    /**
     * Constructs a new GeoViewError.
     *
     * @param messageKey - A localization key or a raw error message
     * @param messageParams - Optional parameters for localization formatting
     * @param options - Optional error options, including `cause`
     */
    constructor(messageKey: string, messageParams?: unknown[], options?: ErrorOptions);
    /**
     * Returns a localized version of the error message using the given display language.
     *
     * @param language - The target language for translation
     * @returns The translated error message based on the error's message key and parameters
     */
    translateMessage(language: TypeDisplayLanguage): string;
    /**
     * Logs an error using the application's logger.
     *
     * If the error is a GeoViewError, its message is translated to English (default) before logging.
     *
     * @param error - The error to be logged
     * @param language - The language to translate the error into (English by default)
     */
    static logError(error: unknown, language?: TypeDisplayLanguage): void;
    /**
     * Logs a warning using the application's logger.
     *
     * If the error is a GeoViewError, its message is translated to English (default) before logging.
     *
     * @param error - The error to be logged
     * @param language - The language to translate the error into (English by default)
     */
    static logWarning(error: unknown, language?: TypeDisplayLanguage): void;
}
/**
 * Error thrown when a configuration schema has a wrong path.
 */
export declare class ConfigSchemaWrongPathError extends GeoViewError {
    /**
     * Creates an instance of ConfigSchemaWrongPathError.
     *
     * @param schemaPath - The wrong schema path
     */
    constructor(schemaPath: string);
}
/**
 * Error thrown when a map viewer with a specified ID is not found.
 */
export declare class MapViewerNotFoundError extends GeoViewError {
    /**
     * Creates an instance of MapViewerNotFoundError.
     *
     * @param mapId - The unique identifier of the map that was not found
     */
    constructor(mapId: string);
}
/**
 * Error thrown when a map viewer with a specified ID already exists.
 */
export declare class MapViewerAlreadyExistsError extends GeoViewError {
    /**
     * Creates an instance of MapViewerAlreadyExistsError.
     *
     * @param mapId - The unique identifier of the map that already exists
     */
    constructor(mapId: string);
}
/**
 * Error thrown when GeoView Store on a specific map ID is not found.
 */
export declare class GeoViewStoreOnMapNotFoundError extends GeoViewError {
    /**
     * Creates an instance of GeoViewStoreOnMapNotFoundError.
     *
     * @param mapId - The unique identifier of the map on which the GeoView Store was not found
     */
    constructor(mapId: string);
}
/**
 * Error thrown when GeoView map on a specific map ID already exist.
 */
export declare class GeoViewMapIdAlreadyExistError extends Error {
    /**
     * Creates an instance of GeoViewMapIdAlreadyExistError.
     *
     * @param mapId - The unique identifier of the map
     */
    constructor(mapId: string);
}
/**
 * Error thrown when an invalid or unsupported projection code is encountered.
 */
export declare class InvalidProjectionError extends GeoViewError {
    /**
     * Creates a new InvalidProjectionError.
     *
     * @param projectionCode - The invalid projection code that caused the error
     */
    constructor(projectionCode: string);
}
/**
 * Error thrown when an invalid geometry group id is encountered.
 */
export declare class InvaliGeometryGroupIdError extends GeoViewError {
    /**
     * Creates a new InvaliGeometryGroupIdError.
     *
     * @param geometryGroupId - The invalid geometry group id that caused the error
     */
    constructor(geometryGroupId: string);
}
/**
 * Error thrown when an invalid extent is provided to a GeoView operation, such as zooming.
 *
 * This helps surface cases where extent values are malformed or undefined.
 */
export declare class InvalidExtentError extends GeoViewError {
    /**
     * Constructs an InvalidExtentError error for the specified map ID and extent.
     *
     * @param extent - The invalid extent that caused the error
     */
    constructor(extent: Extent);
}
/**
 * Error thrown when a response from a geospatial service does not include a `features` property.
 *
 * This typically indicates a malformed or unexpected response structure from the service,
 * which prevents further processing of the data.
 */
export declare class NoFeaturesPropertyError extends GeoViewError {
    /**
     * Creates an instance of NoFeaturesPropertyError.
     */
    constructor();
}
/**
 * Error thrown when a core basemap creation fails.
 */
export declare class CoreBasemapCreationError extends GeoViewError {
    /**
     * Creates an instance of CoreBasemapCreationError.
     */
    constructor();
}
/**
 * Error thrown when the basemap creation process takes longer than expected.
 *
 * This error is typically used to notify that the basemap did not complete its creation
 * within a predefined timeout period.
 */
export declare class BasemapTakingLongTimeError extends GeoViewError {
    /**
     * Creates an instance of BasemapTakingLongTimeError.
     */
    constructor();
}
/**
 * Error thrown when a basemap layer creation fails.
 */
export declare class BasemapLayerCreationError extends GeoViewError {
    /**
     * Creates an instance of BasemapLayerCreationError.
     *
     * @param basemapType - The basemap type that failed to create
     */
    constructor(basemapType: string);
}
/**
 * Error thrown when the overview map basemap creation fails.
 */
export declare class OverviewMapCreationError extends GeoViewError {
    /**
     * Creates an instance of OverviewMapCreationError.
     */
    constructor();
}
/**
 * Error thrown when trying to get a primary key field for a layer and such a field doesn't exist.
 */
export declare class NoPrimaryKeyFieldError extends GeoViewError {
    /**
     * Creates an instance of NoPrimaryKeyFieldError.
     *
     * @param layerPath - The path or identifier of the layer that caused the error
     */
    constructor(layerPath: string);
}
/**
 * Custom error class representing a failure to retrieve geographic bounds
 * for a specific map layer.
 */
export declare class NoBoundsError extends GeoViewError {
    /**
     * Creates an instance of NoBoundsError.
     *
     * @param layerPath - The path or identifier of the layer that caused the error
     */
    constructor(layerPath: string);
}
/**
 * Error class representing the absence of an extent.
 *
 * This is thrown when a geographic operation expects a bounding extent
 * (e.g., from a layer, source, or feature) but none is found or provided.
 */
export declare class NoExtentError extends GeoViewError {
    /**
     * Creates an instance of NoExtentError.
     *
     * @param layerPath - The layer path for which we tried to get an Extent
     */
    constructor(layerPath: string);
}
/**
 * Error thrown when a map-related function is called at the wrong time or under invalid conditions during initialization.
 *
 * Typically used to indicate misuse of the initialization sequence.
 */
export declare class InitDivNotExistError extends GeoViewError {
    /**
     * Creates an instance of InitDivNotExistError.
     *
     * @param mapId - The map id for which a wrong function call was made
     */
    constructor(mapId: string);
}
/**
 * Error thrown when a map-related function is called at the wrong time or under invalid conditions during initialization.
 *
 * Typically used to indicate misuse of the initialization sequence.
 */
export declare class InitMapWrongCallError extends GeoViewError {
    /**
     * Creates an instance of InitMapWrongCallError.
     *
     * @param mapId - The map id for which a wrong function call was made
     */
    constructor(mapId: string);
}
/**
 * Error thrown when a Plugin error happened.
 */
export declare class PluginError extends GeoViewError {
    /**
     * Creates an instance of PluginError.
     *
     * @param pluginId - The plugin id for which the error occurred
     * @param mapId - The map id
     */
    constructor(pluginId: string, mapId: string);
}
/**
 * Error thrown when a Plugin configuration couldn't be found.
 */
export declare class PluginConfigNotFoundError extends GeoViewError {
    /**
     * Creates an instance of PluginConfigNotFoundError.
     *
     * @param pluginId - The plugin id for which the config was not found
     * @param mapId - The map id
     * @param path - The config path that was not found
     */
    constructor(pluginId: string, mapId: string, path: string);
}
/**
 * Error thrown when a plugin state hasn't been initialized and we're trying to access it.
 */
export declare class PluginStateUninitializedError extends GeoViewError {
    /**
     * Creates an instance of PluginStateUninitializedError.
     *
     * @param pluginId - The plugin id for which the state was uninitialized
     * @param mapId - The map id
     */
    constructor(pluginId: string, mapId: string);
}
/**
 * Error thrown when a Test Suite fails to initialize.
 */
export declare class TestSuiteInitializationError extends GeoViewError {
    /**
     * Creates an instance of TestSuiteInitializationError.
     *
     * @param testSuite - The test suite id that failed to initialize
     * @param mapId - The map id
     */
    constructor(testSuite: string, mapId: string);
}
/**
 * Error thrown when a Layer configuration couldn't be found.
 */
export declare class LayerConfigNotFoundError extends GeoViewError {
    /**
     * Creates an instance of LayerConfigNotFoundError.
     *
     * @param layerPath - The layer path where the layer config couldn't be found
     */
    constructor(layerPath: string);
}
/**
 * Error thrown when a Layer fails to load on the map.
 */
export declare class LayerFailedToLoadError extends GeoViewError {
    /**
     * Creates an instance of LayerFailedToLoadError.
     *
     * @param layerName - The layer name of the layer that failed to load
     * @param cause - Optional inner cause of the error
     */
    constructor(layerName: string, cause?: Error);
}
/**
 * Error thrown when a Layer Image fails to load on the map.
 */
export declare class LayerImageFailedToLoadError extends GeoViewError {
    /**
     * Creates an instance of LayerImageFailedToLoadError.
     *
     * @param layerName - The layer name of the layer image that failed to load
     * @param cause - Optional inner cause of the error
     */
    constructor(layerName: string, cause?: Error);
}
/**
 * Error thrown when a Layer Image fails to load on the map due to its requested width being too big.
 */
export declare class LayerImageFailedToLoadWidthTooBigError extends GeoViewError {
    /**
     * Creates an instance of LayerImageFailedToLoadWidthTooBigError.
     *
     * @param layerName - The layer name of the layer image that failed to load
     * @param requestedWidth - The requested width for the image
     * @param maxWidth - The maximum supported width for the generated image by the service
     */
    constructor(layerName: string, requestedWidth: number, maxWidth: number);
}
/**
 * Error thrown when a Layer Image fails to load on the map due to its requested height being too big.
 */
export declare class LayerImageFailedToLoadHeightTooBigError extends GeoViewError {
    /**
     * Creates an instance of LayerImageFailedToLoadHeightTooBigError.
     *
     * @param layerName - The layer name of the layer image that failed to load
     * @param requestedHeight - The requested height for the image
     * @param maxHeight - The maximum supported height for the generated image by the service
     */
    constructor(layerName: string, requestedHeight: number, maxHeight: number);
}
/**
 * Error thrown when a Layer Image fails to load on the map due to no image returned.
 */
export declare class LayerImageFailedNoImageError extends GeoViewError {
    /**
     * Creates an instance of LayerImageFailedNoImageError.
     *
     * @param layerName - The layer name of the layer image that returned an empty image on load
     */
    constructor(layerName: string);
}
/**
 * Error thrown when there's no last query to perform.
 */
export declare class LayerNoLastQueryToPerformError extends GeoViewError {
    /**
     * Creates an instance of LayerNoLastQueryToPerformError.
     */
    constructor();
}
//# sourceMappingURL=geoview-exceptions.d.ts.map