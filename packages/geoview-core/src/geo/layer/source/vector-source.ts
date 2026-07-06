import type Feature from 'ol/Feature';
import { Vector as VectorSource } from 'ol/source';
import type { ProjectionLike } from 'ol/proj';

/**
 * The GeoView equivalent of an OpenLayers Vector Source class, adding notably a loaderError management.
 */
export class GVVectorSource extends VectorSource<Feature> {
  /** Read options for the vector layer */
  #projection?: ProjectionLike;

  /** The load error which occurred */
  protected loaderError?: Error;

  /**
   * Gets the data projection of the source features.
   *
   * @returns The projection the source data is in, or undefined if not set
   */
  getDataProjection(): ProjectionLike | undefined {
    return this.#projection;
  }

  /**
   * Sets the data projection of the source features.
   *
   * @param projection - The projection the source data is in
   */
  setDataProjection(projection: ProjectionLike): void {
    this.#projection = projection;
  }

  /**
   * Gets the error that happened during the vector loader callback.
   *
   * @returns The error that happened during the vector loader callback, or undefined if no error occurred
   */
  getLoaderError(): Error | undefined {
    return this.loaderError;
  }

  /**
   * Sets the error that happened during the vector loader callback.
   *
   * @param error - The error that happened during the vector loader callback
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
