/* eslint-disable max-classes-per-file */
// We want more than 1 Error class here to save files

// Classes in this file mostly inherit GeoViewError.

import { Extent } from 'ol/extent';
import { getLocalizedMessage } from '@/core/utils/utilities';
import { TypeDisplayLanguage } from '@/api/config/types/map-schema-types';
import { logger } from '@/core/utils/logger';

/**
 * Base error for GeoView that includes the map ID and supports localized messages.
 * @extends {Error}
 */
export class GeoViewError extends Error {
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
  constructor(messageKey: string, messageParams?: unknown[], options?: ErrorOptions) {
    // Call super with both message and native options (e.g., cause)
    super(`An error (${messageKey}) happened in GeoView`, options);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'GeoViewError';

    // Keep the attributes
    this.messageKey = messageKey;
    this.messageParams = messageParams;

    // Translate the messag in English by default to at least provide 'something' readable
    this.message = this.translateMessage('en');

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, GeoViewError.prototype);
  }

  /**
   * Returns a localized version of the error message using the given display language.
   * @param {TypeDisplayLanguage} language - The target language for translation.
   * @returns {string} The translated error message based on the error's message key and parameters.
   */
  translateMessage(language: TypeDisplayLanguage): string {
    // Translate the message key of the exception
    return getLocalizedMessage(language, this.messageKey, this.messageParams);
  }

  /**
   * Logs an error using the application's logger.
   * If the error is a GeoViewError, its message is translated to English (default) before logging.
   * @param {unknown} error - The error to be logged. Can be any type.
   * @param {TypeDisplayLanguage} language - The language to translate the error into. English by default.
   */
  static logError(error: unknown, language: TypeDisplayLanguage = 'en'): void {
    // Get the message
    let message = error;

    // If the error is an actual Error object (great)
    if (error instanceof Error) message = error.message;

    // If the error is GeoView, we have a messageKey that needs to be translated
    if (error instanceof GeoViewError) {
      // Translate the message
      message = error.translateMessage(language);
    }

    // If there's a cause of the error inside
    if (error instanceof Error && error.cause) message += ` | ${error.cause}`;

    // Log it
    logger.logError(message);
  }
}

/**
 * Error thrown when a map viewer with a specified ID is not found.
 * @extends {GeoViewError}
 */
export class MapViewerNotFoundError extends GeoViewError {
  /**
   * Creates an instance of MapViewerNotFoundError.
   * @param {string} mapId - The unique identifier of the map that was not found.
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
 * Error thrown when GeoView Store on a specific map ID is not found.
 * @extends {GeoViewError}
 */
export class GeoViewStoreOnMapNotFoundError extends GeoViewError {
  /**
   * Creates an instance of GeoViewStoreOnMapNotFoundError.
   * @param {string} mapId - The unique identifier of the map on which toe GeoView Store was not found.
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
 * @extends {Error}
 */
// GV This Error inherits from 'Error' directly, because it may happen 'before' the actual i18n is created.
export class GeoViewMapIdAlreadyExistError extends Error {
  /**
   * Creates an instance of GeoViewMapIdAlreadyExistError.
   * @param {string} mapId - The unique identifier of the map.
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
 * @extends {GeoViewError}
 */
export class InvalidProjectionError extends GeoViewError {
  /**
   * Creates a new InvalidProjectionError.
   * @param {string} projectionCode - The invalid projection code that caused the error.
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
 * Error thrown when an invalid extent is provided to a GeoView operation, such as zooming.
 * This helps surface cases where extent values are malformed or undefined.
 * @extends {GeoViewError}
 */
export class InvalidExtentError extends GeoViewError {
  /**
   * Constructs an InvalidExtentError error for the specified map ID and extent.
   * @param {Extent} extent - The invalid extent that caused the error.
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
 * This typically indicates a malformed or unexpected response structure from the service,
 * which prevents further processing of the data.
 * @extends {GeoViewError}
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
 * @extends {GeoViewError}
 */
export class CoreBasemapCreationError extends GeoViewError {
  /**
   * Constructs a CoreBasemapCreationError error for the specified map ID.
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
 * This error is typically used to notify that the basemap did not complete its creation
 * within a predefined timeout period.
 */
export class BasemapTakingLongTimeError extends GeoViewError {
  /**
   * Constructs a BasemapTakingLongTimeError error for the specified map ID.
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
 * Custom error class representing a failure to retrieve geographic bounds
 * for a specific map layer.
 * @extends {GeoViewError}
 */
export class NoBoundsError extends GeoViewError {
  /**
   * Creates an instance of NoBoundsError.
   * @param {string} layerPath - The path or identifier of the layer that caused the error.
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
 * This is thrown when a geographic operation expects a bounding extent
 * (e.g., from a layer, source, or feature) but none is found or provided.
 * @extends {GeoViewError}
 */
export class NoExtentError extends GeoViewError {
  /**
   * Creates an instance of NoExtentError.
   * @param {string} layerPath - The layer path for which we tried to get an Extent.
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
 * Typically used to indicate misuse of the initialization sequence.
 */
export class InitMapWrongCallError extends GeoViewError {
  /**
   * Creates an instance of InitMapWrongCallError.
   * @param {string} mapId - The map id for which a wront function call was made.
   */
  constructor(mapId: string) {
    super('error.map.mapWrongCall', [mapId]);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'InitMapWrongCallError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, InitMapWrongCallError.prototype);
  }
}
