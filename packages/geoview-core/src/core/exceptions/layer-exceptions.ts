/* eslint-disable max-classes-per-file */
// We want more than 1 Error class here to save files

// Classes in this file mostly inherit LayerError errors.

import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { TypeJsonArray, TypeJsonValue } from '@/api/config/types/config-types';

/**
 * Error related to a specific GeoView layer, extending GeoViewError with the layer ID.
 * @extends {GeoViewError}
 */
export class LayerError extends GeoViewError {
  /** The GeoView layer path or GeoView layer ID associated with this error. */
  layerPathOrId: string;

  /**
   * Constructs a new LayerError.
   * @param {string} mapId - The map ID.
   * @param {string} layerPathOrId - The layer ID associated with this error.
   * @param {string} localizedKeyOrMessage - A localization key or raw message.
   * @param {TypeJsonValue[] | TypeJsonArray | string[] | undefined} params - Optional localization parameters.
   * @param {ErrorOptions?} options - Optional error options, including `cause`.
   */
  constructor(
    mapId: string,
    layerPathOrId: string,
    localizedKeyOrMessage?: string,
    params?: TypeJsonValue[] | TypeJsonArray | string[],
    options?: ErrorOptions
  ) {
    super(mapId, localizedKeyOrMessage || `A generic error happened for layer ${layerPathOrId} on map ${mapId}`, params, options);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'LayerError';

    // Keep the layer path or id identifier
    this.layerPathOrId = layerPathOrId;

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerError.prototype);
  }
}

/**
 * Error thrown when a specified layer cannot be found.
 * This error is typically raised when attempting to reference a layer that does not exist,
 * possibly due to an invalid path.
 * @extends {LayerError}
 */
export class LayerNotFoundError extends LayerError {
  /**
   * Constructs a new LayerNotFoundError instance.
   * @param {string} mapId - The unique identifier of the map instance.
   * @param {string} layerPath - The path or identifier of the missing layer.
   */
  constructor(mapId: string, layerPath: string) {
    super(mapId, layerPath, `Layer at path ${layerPath} not found.`);

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerNotFoundError.prototype);
  }
}

/**
 * Error thrown when a layer is expected to be a GeoJson layer but is not.
 * @extends {LayerError}
 */
export class LayerNotGeoJsonError extends LayerError {
  /**
   * Constructor to initialize the LayerNotEsriDynamicError with the map ID and layer path
   * @param {string} mapId - The ID of the map where the error occurred.
   * @param {string} layerPath - The path of the layer that failed validation.
   */
  constructor(mapId: string, layerPath: string) {
    super(mapId, layerPath, 'Not a GeoJson layer', [layerPath]);

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerNotGeoJsonError.prototype);
  }
}

/**
 * Error thrown when a layer is expected to be an EsriDynamic layer but is not.
 * @extends {LayerError}
 */
export class LayerNotEsriDynamicError extends LayerError {
  /**
   * Constructor to initialize the LayerNotEsriDynamicError with the map ID and layer path
   * @param {string} mapId - The ID of the map where the error occurred.
   * @param {string} layerPath - The path of the layer that failed validation.
   */
  constructor(mapId: string, layerPath: string) {
    super(mapId, layerPath, 'Not an EsriDynamic layer', [layerPath]);

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerNotEsriDynamicError.prototype);
  }
}

/**
 * Error thrown when a layer is not queryable.
 * This typically means that the layer does not support feature queries, such as `GetFeatureInfo`,
 * attribute selection, or spatial filtering, either due to its type or configuration.
 * @extends {LayerError}
 */
export class LayerNotQueryableError extends LayerError {
  /**
   * Creates an instance of LayerNotQueryableError.
   * @param {string} mapId - The unique identifier for the map where the error occurred.
   * @param {string} layerPath - The path or identifier of the layer that is not queryable.
   */
  constructor(mapId: string, layerPath: string) {
    // Construct a detailed error message for debugging
    super(mapId, layerPath, `Layer at path ${layerPath} is not queryable`, [layerPath]);

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerNotQueryableError.prototype);
  }
}

/**
 * Error thrown when an invalid filter is applied to a layer.
 * This typically occurs when a provided filter string doesn't match the expected format
 * or values for the target layer, which may cause issues in rendering or data querying.
 * @extends {LayerError}
 */
export class LayerInvalidLayerFilterError extends LayerError {
  /**
   * Creates an instance of LayerInvalidLayerFilterError.
   * @param {string} mapId - The unique identifier for the map in which the error occurred.
   * @param {string} layerPath - The identifier or path to the layer with the invalid filter.
   * @param {string} filter - The internal representation of the filter that caused the error.
   * @param {string | undefined} layerFilter - The filter string applied to the layer, if provided.
   * @param {Error} cause - The original error that triggered this error, used for debugging and tracing.
   */
  constructor(mapId: string, layerPath: string, filter: string, layerFilter: string | undefined, cause: Error) {
    // Construct a detailed error message for debugging
    super(mapId, layerPath, `Invalid layer filter.\nfilter = ${layerFilter}\ninternal filter = ${filter}`, [layerPath], cause);

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerInvalidLayerFilterError.prototype);
  }
}

/**
 * Custom error class for errors that occur when metadata for a GeoView layer cannot be fetched.
 * This is typically used in scenarios where fetching or reading metadata for a specific service fails.
 * @extends {LayerError}
 */
export class LayerServiceMetadataUnableToFetchError extends LayerError {
  /**
   * Constructor to initialize the LayerServiceMetadataUnableToFetchError with the map ID, layer ID, and the underlying cause of the error.
   * @param {string} mapId - The ID of the map where the error occurred.
   * @param {string} geoviewLayerId - The ID of the GeoView layer related to the error.
   * @param {Error} cause - The underlying error that caused this exception (e.g., network failure or timeout).
   */
  constructor(mapId: string, geoviewLayerId: string, cause: Error) {
    super(mapId, geoviewLayerId, `Unable to fetch and read metadata for layer ${geoviewLayerId}`, undefined, { cause });

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerServiceMetadataUnableToFetchError.prototype);
  }
}

/**
 * Custom error class for scenarios where the metadata of a GeoView layer service is empty.
 * This error is typically thrown when a metadata request returns an empty response.
 * @extends {LayerError}
 */
export class LayerServiceMetadataEmptyError extends LayerError {
  /**
   * Constructor to initialize the LayerServiceMetadataEmptyError with the map ID and layer ID.
   * @param {string} mapId - The ID of the map where the error occurred.
   * @param {string} geoviewLayerId - The ID of the GeoView layer whose metadata was empty.
   */
  constructor(mapId: string, geoviewLayerId: string) {
    // TODO: FIX FORMATTINGS
    super(mapId, geoviewLayerId, `Metadata of the service was empty for layer ${geoviewLayerId}`);

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerServiceMetadataEmptyError.prototype);
  }
}

/**
 * Custom error class thrown when a GeoView layer is attempted to be created more than once.
 * This error is typically used when a layer is added to a map with an already existing layer ID.
 * @extends {LayerError}
 */
export class LayerCreatedTwiceError extends LayerError {
  /**
   * Constructor to initialize the LayerCreatedTwiceError with the map ID and layer ID.
   * @param {string} mapId - The ID of the map where the error occurred.
   * @param {string} geoviewLayerId - The ID of the GeoView layer that was attempted to be created twice.
   */
  constructor(mapId: string, geoviewLayerId: string) {
    super(mapId, geoviewLayerId, 'validation.layer.createtwice', [geoviewLayerId]);

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerCreatedTwiceError.prototype);
  }
}

/**
 * Custom error class thrown when a GeoView layer creation fails.
 * This error is typically used when a layer cannot be successfully created on the map.
 * @extends {LayerError}
 */
export class LayerNotCreatedError extends LayerError {
  /**
   * Constructor to initialize the LayerNotCreatedError with the map ID and layer ID.
   * @param {string} mapId - The ID of the map where the error occurred.
   * @param {string} geoviewLayerId - The ID of the GeoView layer that failed to be created.
   */
  constructor(mapId: string, geoviewLayerId: string) {
    super(mapId, geoviewLayerId, `Failed to create the layer ${geoviewLayerId} on map ${mapId}`);

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerNotCreatedError.prototype);
  }
}

/**
 * Custom error class thrown when no capabilities are found (or capabilities are empty)
 * for a GeoView layer on a map.
 * This error typically occurs when the capabilities for a specific layer are either not available
 * or not properly loaded for the given layer.
 * @extends {LayerError}
 */
export class LayerNoCapabilitiesError extends LayerError {
  /**
   * Constructor to initialize the LayerNoCapabilitiesError with the map ID and layer ID.
   * @param {string} mapId - The ID of the map where the error occurred.
   * @param {string} geoviewLayerId - The ID of the GeoView layer that does not have capabilities.
   */
  constructor(mapId: string, geoviewLayerId: string) {
    super(mapId, geoviewLayerId, `No capabilities (or empty) found for layer ${geoviewLayerId} on map ${mapId}`);

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerNoCapabilitiesError.prototype);
  }
}

/**
 * Error thrown when an unsupported `Format` parameter is used in a WMS `GetFeatureInfo` request.
 * According to WMS standards, the `Format` parameter for `GetFeatureInfo` requests must be one of:
 * `text/xml`, `text/html`, or `text/plain`. This error indicates that a different or invalid format
 * was supplied.
 * @extends {LayerError}
 */
export class LayerInvalidFeatureInfoFormatWMSError extends LayerError {
  /**
   * Creates an instance of LayerInvalidFeatureInfoFormatWMSError.
   *
   * @param {string} mapId - The unique identifier for the map where the error occurred.
   * @param {string} layerPath - The path or identifier of the WMS layer that received the invalid format.
   */
  constructor(mapId: string, layerPath: string) {
    super(mapId, layerPath, "Parameter 'Format' of GetFeatureInfo only support text/xml, text/html and text/plain for WMS services.");

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerInvalidFeatureInfoFormatWMSError.prototype);
  }
}

/**
 * Error thrown when no geographic data (e.g., coordinates or location fields) is found in a CSV sheet.
 * This error typically occurs when attempting to load a CSV file as a map layer,
 * but the file does not contain recognizable geographic fields (such as latitude and longitude).
 * @extends {LayerError}
 */
export class LayerNoGeographicDataInCSVError extends LayerError {
  /**
   * Creates an instance of LayerNoGeographicDataInCSVError.
   * @param {string} mapId - The unique identifier for the map where the error occurred.
   * @param {string} layerPath - The identifier or path of the CSV layer lacking geographic data.
   */
  constructor(mapId: string, layerPath: string) {
    super(mapId, layerPath, `Could not find geographic data in the CSV`);

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerNoGeographicDataInCSVError.prototype);
  }
}
