/* eslint-disable max-classes-per-file */
// We want more than 1 Error class here to save files

import { GeoViewError } from '@/core/exceptions/geoview-exceptions';

// Classes in this file mostly inherit GeoViewError.

export class LayerGeoCoreError extends GeoViewError {
  /** The uuids that failed */
  readonly uuids: string[];

  /**
   * Constructs a new UUID-not-found error for a given map and list of UUIDs.
   */
  protected constructor(uuids: string[], messageKey: string, messageParams?: unknown[], options?: ErrorOptions) {
    super(messageKey, messageParams, options);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'LayerGeoCoreError';

    // Keep the uuids
    this.uuids = uuids;

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerGeoCoreError.prototype);
  }
}

/**
 * Error thrown when one or more layer UUIDs are not found when queried.
 * @extends {LayerGeoCoreError}
 */
export class LayerGeoCoreUUIDNotFoundError extends LayerGeoCoreError {
  /**
   * Constructs a new UUID-not-found error for a given map and list of UUIDs.
   * @param {string[]} uuids - The list of UUIDs that could not be found.
   * @param {Error} cause - The original error that caused this one, if any.
   */
  constructor(uuids: string[], cause: Error) {
    super(uuids, 'error.geocore.uuidNotFound', uuids, { cause });

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'LayerGeoCoreUUIDNotFoundError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerGeoCoreUUIDNotFoundError.prototype);
  }
}

/**
 * Error thrown when an invalid response has been returned by the GeoCore service.
 * @extends {LayerGeoCoreError}
 */
export class LayerGeoCoreInvalidResponseError extends LayerGeoCoreError {
  /**
   * Constructs a new LayerGeoCoreInvalidResponseError for a given map and UUIDs.
   * @param {string[]} uuids - The list of UUIDs that caused an invalid response by GeoCore.
   */
  constructor(uuids: string[], errorMessage: unknown) {
    super(uuids, 'error.geocore.invalidResponse', [errorMessage, uuids.toString()]);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'LayerGeoCoreInvalidResponseError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerGeoCoreInvalidResponseError.prototype);
  }
}

/**
 * Error thrown when no layers were returned by the GeoCore service.
 * @extends {LayerGeoCoreError}
 */
export class LayerGeoCoreNoLayersError extends LayerGeoCoreError {
  /**
   * Constructs a new LayerGeoCoreNoLayersError for a given map and UUIDs.
   * @param {string[]} uuids - The list of UUIDs that returned no layers.
   */
  constructor(uuids: string[]) {
    super(uuids, 'error.geocore.noLayer', [uuids.toString()]);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'LayerGeoCoreNoLayersError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, LayerGeoCoreNoLayersError.prototype);
  }
}
