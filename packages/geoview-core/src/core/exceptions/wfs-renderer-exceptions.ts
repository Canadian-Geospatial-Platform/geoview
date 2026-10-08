/* eslint-disable max-classes-per-file */
// We want more than 1 Error class here to save files

import { GeoViewError } from './geoview-exceptions';

/**
 * Error thrown when the GetStyles response is invalid (does not conform to the expected schema).
 */
export class GetStylesInvalidResponseError extends GeoViewError {
  /**
   * Creates an instance of GetStylesInvalidResponseError.
   */
  constructor() {
    super('validation.wfsrenderer.getStylesInvalidResponse');

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'GetStylesInvalidResponseError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, GetStylesInvalidResponseError.prototype);
  }
}

/**
 * Error thrown when the GetStyles operation is not supported.
 */
export class GetStylesNotSupportedError extends GeoViewError {
  /**
   * Creates an instance of GetStylesNotSupportedError.
   */
  constructor(cause: string) {
    super('validation.wfsrenderer.getStylesNotSupported', { cause });

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'GetStylesNotSupportedError';

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, GetStylesNotSupportedError.prototype);
  }
}
