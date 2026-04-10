/* eslint-disable max-classes-per-file */
// We want more than 1 Error class here to save files

// Classes in this file mostly inherit GeoViewError.

import type { Extent } from 'ol/extent';
import { getLocalizedMessage } from '@/core/utils/utilities';
import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import { logger } from '@/core/utils/logger';

/**
 * Base error for GeoView that includes the map ID and supports localized messages.
 */
export class GeoViewError extends Error {
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
  constructor(messageKey: string, messageParams?: unknown[], options?: ErrorOptions) {
    // Call super with both message and native options (e.g., cause)
    super(`An error (${messageKey}) happened in GeoView`, options);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'GeoViewError';

    // Keep the attributes
    this.messageKey = messageKey;
    this.messageParams = messageParams;

    // Translate the message in English by default to at least provide 'something' readable
    this.message = this.translateMessage('en');

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, GeoViewError.prototype);
  }

  /**
   * Returns a localized version of the error message using the given display language.
   *
   * @param language - The target language for translation
   * @returns The translated error message based on the error's message key and parameters
   */
  translateMessage(language: TypeDisplayLanguage): string {
    // Translate the message key of the exception
    return getLocalizedMessage(language, this.messageKey, this.messageParams);
  }

  /**
   * Logs an error using the application's logger.
   *
   * If the error is a GeoViewError, its message is translated to English (default) before logging.
   *
   * @param error - The error to be logged
   * @param language - The language to translate the error into (English by default)
   */
  static logError(error: unknown, language: TypeDisplayLanguage = 'en'): void {
    // Get the message
    const message = GeoViewError.#extractMessage(error, language);

    // Log it
    logger.logError(message);
  }

  /**
   * Logs a warning using the application's logger.
   *
   * If the error is a GeoViewError, its message is translated to English (default) before logging.
   *
   * @param error - The error to be logged
   * @param language - The language to translate the error into (English by default)
   */
  static logWarning(error: unknown, language: TypeDisplayLanguage = 'en'): void {
    // Get the message
    const message = GeoViewError.#extractMessage(error, language);

    // Log it
    logger.logWarning(message);
  }

  /**
   * Extracts a user-friendly message from an error object, optionally translating it based on the provided language.
   *
   * Handles different types of errors:
   * - If the error is a standard `Error`, extracts its message.
   * - If the error is a `GeoViewError`, translates the message using the specified language.
   * - If the error has a `cause`, appends it to the message.
   *
   * @param error - The error object from which to extract the message
   * @param language - The language code used for translating the message (default is English)
   * @returns The extracted and possibly translated error message as a string
   */
  static #extractMessage(error: unknown, language: TypeDisplayLanguage = 'en'): string {
    // Get the message
    let message = error;

    // If the error is an actual Error object (great)
    if (error instanceof Error) ({ message } = error);

    // If the error is GeoView, we have a messageKey that needs to be translated
    if (error instanceof GeoViewError) {
      // Translate the message
      message = error.translateMessage(language);
    }

    // If there's a cause of the error inside
    if (error instanceof Error && error.cause) message += ` | ${error.cause}`;

    // Return the message
    return String(message);
  }
}

/**
 * Error thrown when a configuration schema has a wrong path.
 */
export class ConfigSchemaWrongPathError extends GeoViewError {
  /**
   * Creates an instance of ConfigSchemaWrongPathError.
   *
   * @param schemaPath - The wrong schema path
   */
  constructor(schemaPath: string) {
    super('validation.schema.wrongPath', [schemaPath]);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'ConfigSchemaWrongPathError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, ConfigSchemaWrongPathError.prototype);
  }
}

/**
 * Error thrown when a map viewer with a specified ID is not found.
 */
export class MapViewerNotFoundError extends GeoViewError {
  /**
   * Creates an instance of MapViewerNotFoundError.
   *
   * @param mapId - The unique identifier of the map that was not found
   */
  constructor(mapId: string) {
    super('error.map.mapIdNotFound', [mapId]);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'MapViewerNotFoundError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, MapViewerNotFoundError.prototype);
  }
}

/**
 * Error thrown when a map viewer with a specified ID already exists.
 */
export class MapViewerAlreadyExistsError extends GeoViewError {
  /**
   * Creates an instance of MapViewerAlreadyExistsError.
   *
   * @param mapId - The unique identifier of the map that already exists
   */
  constructor(mapId: string) {
    super('error.map.mapIdAlreadyExists', [mapId]);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'MapViewerAlreadyExistsError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, MapViewerAlreadyExistsError.prototype);
  }
}

/**
 * Error thrown when GeoView Store on a specific map ID is not found.
 */
export class GeoViewStoreOnMapNotFoundError extends GeoViewError {
  /**
   * Creates an instance of GeoViewStoreOnMapNotFoundError.
   *
   * @param mapId - The unique identifier of the map on which the GeoView Store was not found
   */
  constructor(mapId: string) {
    super('error.map.geoviewStoreNotFound', [mapId]);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'GeoViewStoreOnMapNotFoundError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, GeoViewStoreOnMapNotFoundError.prototype);
  }
}

/**
 * Error thrown when GeoView map on a specific map ID already exist.
 */
// GV This Error inherits from 'Error' directly, because it may happen 'before' the actual i18n is created.
export class GeoViewMapIdAlreadyExistError extends Error {
  /**
   * Creates an instance of GeoViewMapIdAlreadyExistError.
   *
   * @param mapId - The unique identifier of the map
   */
  constructor(mapId: string) {
    super(`GeoView Map ID '${mapId}' already exist`);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'GeoViewMapIdAlreadyExistError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, GeoViewMapIdAlreadyExistError.prototype);
  }
}

/**
 * Error thrown when an invalid or unsupported projection code is encountered.
 */
export class InvalidProjectionError extends GeoViewError {
  /**
   * Creates a new InvalidProjectionError.
   *
   * @param projectionCode - The invalid projection code that caused the error
   */
  constructor(projectionCode: string) {
    super('layers.errorProj', [projectionCode]);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'InvalidProjectionError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, InvalidProjectionError.prototype);
  }
}

/**
 * Error thrown when an invalid geometry group id is encountered.
 */
export class InvaliGeometryGroupIdError extends GeoViewError {
  /**
   * Creates a new InvaliGeometryGroupIdError.
   *
   * @param geometryGroupId - The invalid geometry group id that caused the error
   */
  constructor(geometryGroupId: string) {
    super('error.map.errorGeometryGroupId', [geometryGroupId]);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'InvaliGeometryGroupIdError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, InvaliGeometryGroupIdError.prototype);
  }
}

/**
 * Error thrown when an invalid extent is provided to a GeoView operation, such as zooming.
 *
 * This helps surface cases where extent values are malformed or undefined.
 */
export class InvalidExtentError extends GeoViewError {
  /**
   * Constructs an InvalidExtentError error for the specified map ID and extent.
   *
   * @param extent - The invalid extent that caused the error
   */
  constructor(extent: Extent) {
    super('layers.errorInvalidExtent', [extent]);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'InvalidExtentError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, InvalidExtentError.prototype);
  }
}

/**
 * Error thrown when a response from a geospatial service does not include a `features` property.
 *
 * This typically indicates a malformed or unexpected response structure from the service,
 * which prevents further processing of the data.
 */
export class NoFeaturesPropertyError extends GeoViewError {
  /**
   * Creates an instance of NoFeaturesPropertyError.
   */
  constructor() {
    super('layers.errorResponseNoFeaturesProperty');

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'NoFeaturesPropertyError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, NoFeaturesPropertyError.prototype);
  }
}

/**
 * Error thrown when a core basemap creation fails.
 */
export class CoreBasemapCreationError extends GeoViewError {
  /**
   * Creates an instance of CoreBasemapCreationError.
   */
  constructor() {
    super('mapctrl.overviewmap.error');

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'CoreBasemapCreationError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, CoreBasemapCreationError.prototype);
  }
}

/**
 * Error thrown when the basemap creation process takes longer than expected.
 *
 * This error is typically used to notify that the basemap did not complete its creation
 * within a predefined timeout period.
 */
export class BasemapTakingLongTimeError extends GeoViewError {
  /**
   * Creates an instance of BasemapTakingLongTimeError.
   */
  constructor() {
    super('warning.layer.basemapTakingLongTime');

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'BasemapTakingLongTimeError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, BasemapTakingLongTimeError.prototype);
  }
}

/**
 * Error thrown when a basemap layer creation fails.
 */
export class BasemapLayerCreationError extends GeoViewError {
  /**
   * Creates an instance of BasemapLayerCreationError.
   *
   * @param basemapType - The basemap type that failed to create
   */
  constructor(basemapType: string) {
    super('warning.layer.basemapLayerCreationError', [basemapType]);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'BasemapLayerCreationError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, BasemapLayerCreationError.prototype);
  }
}

/**
 * Error thrown when the overview map basemap creation fails.
 */
export class OverviewMapCreationError extends GeoViewError {
  /**
   * Creates an instance of OverviewMapCreationError.
   */
  constructor() {
    super('error.basemap.overviewMapCreationError');

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'OverviewMapCreationError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, OverviewMapCreationError.prototype);
  }
}

/**
 * Error thrown when trying to get a primary key field for a layer and such a field doesn't exist.
 */
export class NoPrimaryKeyFieldError extends GeoViewError {
  /**
   * Creates an instance of NoPrimaryKeyFieldError.
   *
   * @param layerPath - The path or identifier of the layer that caused the error
   */
  constructor(layerPath: string) {
    super('layers.errorNoPrimaryKeyField', [layerPath]);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'NoPrimaryKeyFieldError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, NoPrimaryKeyFieldError.prototype);
  }
}

/**
 * Custom error class representing a failure to retrieve geographic bounds
 * for a specific map layer.
 */
export class NoBoundsError extends GeoViewError {
  /**
   * Creates an instance of NoBoundsError.
   *
   * @param layerPath - The path or identifier of the layer that caused the error
   */
  constructor(layerPath: string) {
    super('layers.errorNoBounds', [layerPath]);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'NoBoundsError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, NoBoundsError.prototype);
  }
}

/**
 * Error class representing the absence of an extent.
 *
 * This is thrown when a geographic operation expects a bounding extent
 * (e.g., from a layer, source, or feature) but none is found or provided.
 */
export class NoExtentError extends GeoViewError {
  /**
   * Creates an instance of NoExtentError.
   *
   * @param layerPath - The layer path for which we tried to get an Extent
   */
  constructor(layerPath: string) {
    super('layers.errorNoExtent', [layerPath]);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'NoExtentError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, NoExtentError.prototype);
  }
}

/**
 * Error thrown when a map-related function is called at the wrong time or under invalid conditions during initialization.
 *
 * Typically used to indicate misuse of the initialization sequence.
 */
export class InitDivNotExistError extends GeoViewError {
  /**
   * Creates an instance of InitDivNotExistError.
   *
   * @param mapId - The map id for which a wrong function call was made
   */
  constructor(mapId: string) {
    super('error.map.mapDivNotExists', [mapId]);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'InitDivNotExistError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, InitDivNotExistError.prototype);
  }
}

/**
 * Error thrown when a map-related function is called at the wrong time or under invalid conditions during initialization.
 *
 * Typically used to indicate misuse of the initialization sequence.
 */
export class InitMapWrongCallError extends GeoViewError {
  /**
   * Creates an instance of InitMapWrongCallError.
   *
   * @param mapId - The map id for which a wrong function call was made
   */
  constructor(mapId: string) {
    super('error.map.mapWrongCall', [mapId]);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'InitMapWrongCallError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, InitMapWrongCallError.prototype);
  }
}

/**
 * Error thrown when a Plugin error happened.
 */
export class PluginError extends GeoViewError {
  /**
   * Creates an instance of PluginError.
   *
   * @param pluginId - The plugin id for which the error occurred
   * @param mapId - The map id
   */
  constructor(pluginId: string, mapId: string) {
    super('error.map.pluginError', [pluginId, mapId]);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'PluginError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, PluginError.prototype);
  }
}

/**
 * Error thrown when a Plugin configuration couldn't be found.
 */
export class PluginConfigNotFoundError extends GeoViewError {
  /**
   * Creates an instance of PluginConfigNotFoundError.
   *
   * @param pluginId - The plugin id for which the config was not found
   * @param mapId - The map id
   * @param path - The config path that was not found
   */
  constructor(pluginId: string, mapId: string, path: string) {
    super('error.map.pluginConfigNotFound', [pluginId, mapId, path]);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'PluginConfigNotFoundError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, PluginConfigNotFoundError.prototype);
  }
}

/**
 * Error thrown when a plugin state hasn't been initialized and we're trying to access it.
 */
export class PluginStateUninitializedError extends GeoViewError {
  /**
   * Creates an instance of PluginStateUninitializedError.
   *
   * @param pluginId - The plugin id for which the state was uninitialized
   * @param mapId - The map id
   */
  constructor(pluginId: string, mapId: string) {
    super('error.map.pluginStateUninitialized', [pluginId, mapId]);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'PluginStateUninitializedError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, PluginStateUninitializedError.prototype);
  }
}

/**
 * Error thrown when a Test Suite fails to initialize.
 */
export class TestSuiteInitializationError extends GeoViewError {
  /**
   * Creates an instance of TestSuiteInitializationError.
   *
   * @param testSuite - The test suite id that failed to initialize
   * @param mapId - The map id
   */
  constructor(testSuite: string, mapId: string) {
    super('testSuite.initializationError', [testSuite, mapId]);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'TestSuiteInitializationError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, TestSuiteInitializationError.prototype);
  }
}

/**
 * Error thrown when a Layer configuration couldn't be found.
 */
export class LayerConfigNotFoundError extends GeoViewError {
  /**
   * Creates an instance of LayerConfigNotFoundError.
   *
   * @param layerPath - The layer path where the layer config couldn't be found
   */
  constructor(layerPath: string) {
    super('error.layer.layerConfigNotFound', [layerPath]);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'LayerConfigNotFoundError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerConfigNotFoundError.prototype);
  }
}

/**
 * Error thrown when a Layer fails to load on the map.
 */
export class LayerFailedToLoadError extends GeoViewError {
  /**
   * Creates an instance of LayerFailedToLoadError.
   *
   * @param layerName - The layer name of the layer that failed to load
   * @param cause - Optional inner cause of the error
   */
  constructor(layerName: string, cause?: Error) {
    super('layers.errorNotLoaded', [layerName], { cause });

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'LayerFailedToLoadError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerFailedToLoadError.prototype);
  }
}

/**
 * Error thrown when a Layer Image fails to load on the map.
 */
export class LayerImageFailedToLoadError extends GeoViewError {
  /**
   * Creates an instance of LayerImageFailedToLoadError.
   *
   * @param layerName - The layer name of the layer image that failed to load
   * @param cause - Optional inner cause of the error
   */
  constructor(layerName: string, cause?: Error) {
    super('layers.errorImageLoad', [layerName], { cause });

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'LayerImageFailedToLoadError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerImageFailedToLoadError.prototype);
  }
}

/**
 * Error thrown when a Layer Image fails to load on the map due to its requested width being too big.
 */
export class LayerImageFailedToLoadWidthTooBigError extends GeoViewError {
  /**
   * Creates an instance of LayerImageFailedToLoadWidthTooBigError.
   *
   * @param layerName - The layer name of the layer image that failed to load
   * @param requestedWidth - The requested width for the image
   * @param maxWidth - The maximum supported width for the generated image by the service
   */
  constructor(layerName: string, requestedWidth: number, maxWidth: number) {
    super('layers.errorImageLoadSizeLimitExceededWidth', [layerName, requestedWidth, maxWidth]);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'LayerImageFailedToLoadWidthTooBigError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerImageFailedToLoadWidthTooBigError.prototype);
  }
}

/**
 * Error thrown when a Layer Image fails to load on the map due to its requested height being too big.
 */
export class LayerImageFailedToLoadHeightTooBigError extends GeoViewError {
  /**
   * Creates an instance of LayerImageFailedToLoadHeightTooBigError.
   *
   * @param layerName - The layer name of the layer image that failed to load
   * @param requestedHeight - The requested height for the image
   * @param maxHeight - The maximum supported height for the generated image by the service
   */
  constructor(layerName: string, requestedHeight: number, maxHeight: number) {
    super('layers.errorImageLoadSizeLimitExceededHeight', [layerName, requestedHeight, maxHeight]);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'LayerImageFailedToLoadHeightTooBigError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerImageFailedToLoadHeightTooBigError.prototype);
  }
}

/**
 * Error thrown when a Layer Image fails to load on the map due to no image returned.
 */
export class LayerImageFailedNoImageError extends GeoViewError {
  /**
   * Creates an instance of LayerImageFailedNoImageError.
   *
   * @param layerName - The layer name of the layer image that returned an empty image on load
   */
  constructor(layerName: string) {
    super('layers.errorImageLoadNoImageReturned', [layerName]);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'LayerImageFailedNoImageError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerImageFailedNoImageError.prototype);
  }
}

/**
 * Error thrown when there's no last query to perform.
 */
export class LayerNoLastQueryToPerformError extends GeoViewError {
  /**
   * Creates an instance of LayerNoLastQueryToPerformError.
   */
  constructor() {
    super('layers.errorNoLastQueryToPerform');

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'LayerNoLastQueryToPerformError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerNoLastQueryToPerformError.prototype);
  }
}
