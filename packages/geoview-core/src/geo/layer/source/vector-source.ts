import type Feature from 'ol/Feature';
import { Vector as VectorSource } from 'ol/source';

/**
 * The GeoView equivalent of an OpenLayers Vector Source class, adding notably an loaderError management.
 */
export class GVVectorSource extends VectorSource<Feature> {
  /** The load error which occured */
  protected loaderError?: Error;

  /**
   * Gets the error that happened during the vector loader callback.
   * @returns {Error | undefined} The error that happened during the vector loader callback.
   */
  getLoaderError(): Error | undefined {
    return this.loaderError;
  }

  /**
   * Sets the error that happened during the vector loader callback.
   * @param {Error | undefined} error - The error that happened during the vector loader callback.
   */
  setLoaderError(error: Error): void {
    this.loaderError = error;
  }

  /**
   * Clears any error that might have happened during the vector loader callback.
   */
  clearLoaderError(): void {
    this.loaderError = undefined;
  }
}
