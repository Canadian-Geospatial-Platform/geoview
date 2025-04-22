/* eslint-disable max-classes-per-file */
// We want more than 1 Error class here to save files

// Classes in this file mostly inherit GeoViewError for billingual errors.

import { Extent } from 'ol/extent';
import { TypeJsonArray, TypeJsonValue } from '@/api/config/types/config-types';
import { getLocalizedMessage } from '@/core/utils/utilities';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';

/**
 * Base error for GeoView that includes the map ID and supports localized messages.
 * @extends {Error}
 */
export class GeoViewError extends Error {
  /** The map ID associated with the error. */
  mapId: string;

  /**
   * Constructs a new GeoViewError. GeoViewErrors are billingual.
   * @param {string} mapId - The map ID where the error occurred.
   * @param {string} localizedKeyOrMessage - A localization key or a raw error message.
   * @param {TypeJsonValue[] | TypeJsonArray | string[] | undefined} params - Optional parameters for localization formatting.
   * @param {ErrorOptions?} options - Optional error options, including `cause`.
   */
  constructor(mapId: string, localizedKeyOrMessage: string, params?: TypeJsonValue[] | TypeJsonArray | string[], options?: ErrorOptions) {
    // Compose a meaningful error message
    const localizedMsg = getLocalizedMessage(localizedKeyOrMessage, AppEventProcessor.getDisplayLanguage(mapId), params);

    // Call super with both message and native options (e.g., cause)
    super(localizedMsg, options);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'GeoViewError';

    // Keep the map id
    this.mapId = mapId;

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, GeoViewError.prototype);
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
   * @param {string} mapId - The ID of the map where the invalid extent was encountered.
   * @param {Extent} extent - The invalid extent that caused the error.
   */
  constructor(mapId: string, extent: Extent) {
    super(mapId, `Couldn't zoom to extent, invalid extent: ${extent}`);

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
   * @param {string} mapId - The unique identifier for the map where the error occurred.
   */
  constructor(mapId: string) {
    super(mapId, "The response from the service didn't provide a 'features' property.");

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
   * @param {string} mapId - The ID of the map where the basemap creation failed.
   */
  constructor(mapId: string) {
    super(mapId, 'mapctrl.overviewmap.error');

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'CoreBasemapCreationError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, CoreBasemapCreationError.prototype);
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
   *
   * @param {string} mapId - The unique identifier for the map where the error occurred.
   * @param {string} layerPath - The path or identifier of the layer that caused the error.
   */
  constructor(mapId: string, layerPath: string) {
    super(mapId, `Couldn't find bounds for layer: ${layerPath}`);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'NoBoundsError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, NoBoundsError.prototype);
  }
}
