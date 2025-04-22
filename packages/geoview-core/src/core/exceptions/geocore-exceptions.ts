/* eslint-disable max-classes-per-file */
// We want more than 1 Error class here to save files

import { GeoViewError } from '@/core/exceptions/geoview-exceptions';

// Classes in this file mostly inherit GeoViewError for billingual errors.

/**
 * Error thrown when one or more layer UUIDs are not found when queried.
 * @extends {GeoViewError}
 */
export class LayerGeoCoreUUIDNotFoundError extends GeoViewError {
  /**
   * Constructs a new UUID-not-found error for a given map and list of UUIDs.
   * @param {string} mapId - The map ID where the UUID(s) were expected.
   * @param {string[]} uuids - The list of UUIDs that could not be found.
   * @param {Error} cause - The original error that caused this one, if any.
   */
  constructor(mapId: string, uuids: string[], cause: Error) {
    super(mapId, 'error.geocore.uuidNotFound', uuids, { cause });

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'LayerGeoCoreUUIDNotFoundError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerGeoCoreUUIDNotFoundError.prototype);
  }
}

/**
 * Error thrown when an invalid response has been returned by the GeoCore service.
 * @extends {GeoViewError}
 */
export class LayerGeoCoreInvalidResponseError extends GeoViewError {
  /**
   * Constructs a new LayerGeoCoreInvalidResponseError for a given map and UUIDs.
   * @param {string} mapId - The map ID where the UUID(s) were expected.
   * @param {string[]} uuids - The list of UUIDs that caused an invalid response by GeoCore.
   */
  constructor(mapId: string, uuids: string[]) {
    super(mapId, 'error.geocore.invalidResponse', [uuids.toString()]);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'LayerGeoCoreInvalidResponseError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerGeoCoreInvalidResponseError.prototype);
  }
}

/**
 * Error thrown when no layers were returned by the GeoCore service.
 * @extends {GeoViewError}
 */
export class LayerGeoCoreNoLayersError extends GeoViewError {
  /**
   * Constructs a new LayerGeoCoreNoLayersError for a given map and UUIDs.
   * @param {string} mapId - The map ID where the UUID(s) were expected.
   * @param {string[]} uuids - The list of UUIDs that returned no layers.
   */
  constructor(mapId: string, uuids: string[]) {
    super(mapId, 'error.geocore.noLayer', [uuids.toString()]);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'LayerGeoCoreNoLayersError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerGeoCoreNoLayersError.prototype);
  }
}
