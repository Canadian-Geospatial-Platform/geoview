import type Feature from 'ol/Feature';
import { Vector as VectorSource } from 'ol/source';
import type { ProjectionLike } from 'ol/proj';
/**
 * The GeoView equivalent of an OpenLayers Vector Source class, adding notably a loaderError management.
 */
export declare class GVVectorSource extends VectorSource<Feature> {
    #private;
    /** The load error which occurred */
    protected loaderError?: Error;
    /**
     * Gets the data projection of the source features.
     *
     * @returns The projection the source data is in, or undefined if not set
     */
    getDataProjection(): ProjectionLike | undefined;
    /**
     * Sets the data projection of the source features.
     *
     * @param projection - The projection the source data is in
     */
    setDataProjection(projection: ProjectionLike): void;
    /**
     * Gets the error that happened during the vector loader callback.
     *
     * @returns The error that happened during the vector loader callback, or undefined if no error occurred
     */
    getLoaderError(): Error | undefined;
    /**
     * Sets the error that happened during the vector loader callback.
     *
     * @param error - The error that happened during the vector loader callback
     */
    setLoaderError(error: Error): void;
    /**
     * Clears any error that might have happened during the vector loader callback.
     */
    clearLoaderError(): void;
}
//# sourceMappingURL=vector-source.d.ts.map