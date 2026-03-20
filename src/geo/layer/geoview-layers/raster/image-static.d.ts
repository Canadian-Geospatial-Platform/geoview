import type { Projection as OLProjection } from 'ol/proj';
import Static from 'ol/source/ImageStatic';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import type { DisplayDateMode, Extent } from '@/api/types/map-schema-types';
import type { TypeGeoviewLayerConfig, TypeValidSourceProjectionCodes } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { ImageStaticLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/image-static-layer-entry-config';
import { GVImageStatic } from '@/geo/layer/gv-layers/raster/gv-image-static';
export interface TypeImageStaticLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: typeof CONST_LAYER_TYPES.IMAGE_STATIC;
    listOfLayerEntryConfig: ImageStaticLayerEntryConfig[];
}
/**
 * A class to add image static layer.
 */
export declare class ImageStatic extends AbstractGeoViewRaster {
    /**
     * Constructs a ImageStatic Layer configuration processor.
     *
     * @param layerConfig - The layer configuration
     */
    constructor(layerConfig: TypeImageStaticLayerConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getGeoviewLayerConfig(): TypeImageStaticLayerConfig;
    /**
     * Overrides the way the metadata is fetched.
     *
     * Resolves with the Json object or undefined when no metadata is to be expected for a particular layer type.
     *
     * @returns A promise that resolves with the metadata or undefined when no metadata for the particular layer type.
     */
    protected onFetchServiceMetadata<T>(): Promise<T>;
    /**
     * Overrides the way a geoview layer config initializes its layer entries.
     *
     * @returns A promise that resolves once the layer entries have been initialized.
     */
    protected onInitLayerEntries(): Promise<TypeGeoviewLayerConfig>;
    /**
     * Overrides the way the layer metadata is processed.
     *
     * @param layerConfig - The layer entry configuration to process.
     * @param displayDateMode - The display date mode to use for processing time dimensions in the metadata.
     * @param mapProjection - Optional map projection.
     * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process.
     * @returns A promise that resolves once the layer entry configuration has gotten its metadata processed.
     */
    protected onProcessLayerMetadata(layerConfig: ImageStaticLayerEntryConfig, displayDateMode: DisplayDateMode, mapProjection?: OLProjection, abortSignal?: AbortSignal): Promise<ImageStaticLayerEntryConfig>;
    /**
     * Overrides the creation of the GV Layer
     *
     * @param layerConfig - The layer entry configuration.
     * @returns The GV Layer
     */
    protected onCreateGVLayer(layerConfig: ImageStaticLayerEntryConfig): GVImageStatic;
    /**
     * Initializes a GeoView layer configuration for an Image Static layer.
     * This method creates a basic TypeGeoviewLayerConfig using the provided
     * ID, name, and metadata access path URL. It then initializes the layer entries by calling
     * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
     * @param geoviewLayerId - A unique identifier for the layer.
     * @param geoviewLayerName - The display name of the layer.
     * @param metadataAccessPath - The full service URL to the layer endpoint.
     * @param isTimeAware - Indicates whether the layer supports time-based filtering.
     * @returns A promise that resolves to an initialized GeoView layer configuration with layer entries.
     */
    static initGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware?: boolean): Promise<TypeGeoviewLayerConfig>;
    /**
     * Creates a configuration object for a Static Image layer.
     * This function constructs a `TypeImageStaticLayerConfig` object that describes an Static Image layer
     * and its associated entry configurations based on the provided parameters.
     * @param geoviewLayerId - A unique identifier for the GeoView layer.
     * @param geoviewLayerName - The display name of the GeoView layer.
     * @param metadataAccessPath - The URL or path to access metadata.
     * @param isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param layerEntries - An array of layer entries objects to be included in the configuration.
     * @returns The constructed configuration object for the Static Image layer.
     */
    static createGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string | undefined, isTimeAware: boolean | undefined, layerEntries: TypeLayerEntryShell[]): TypeImageStaticLayerConfig;
    /**
     * Processes an ImageStatic GeoviewLayerConfig and returns a promise
     * that resolves to an array of `ConfigBaseClass` layer entry configurations.
     *
     * This method:
     * 1. Creates a Geoview layer configuration using the provided parameters.
     * 2. Instantiates a layer with that configuration.
     * 3. Processes the layer configuration and returns the result.
     *
     * @param geoviewLayerId - The unique identifier for the GeoView layer.
     * @param geoviewLayerName - The display name for the GeoView layer.
     * @param url - The URL of the service endpoint.
     * @param layerIds - An array of layer IDs to include in the configuration.
     * @param isTimeAware - Indicates if the layer is time aware.
     * @param sourceExtent - Indicates the extent where the static image should be.
     * @param sourceProjection - Indicates the projection used for the sourceExtent.
     * @returns A promise that resolves to an array of layer configurations.
     */
    static processGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, url: string, layerIds: string[], isTimeAware: boolean, sourceExtent: Extent, sourceProjection: TypeValidSourceProjectionCodes): Promise<ConfigBaseClass[]>;
    /**
     * Creates a StaticImage source from a layer config.
     *
     * @param layerConfig - Configuration for the image static layer.
     * @returns A configured ol/source/ImageStatic instance.
     * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
     * @throws {LayerEntryConfigParameterExtentNotDefinedInSourceError} When the source extent isn't defined.
     * @throws {LayerEntryConfigParameterProjectionNotDefinedInSourceError} When the source projection isn't defined.
     */
    static createImageStaticSource(layerConfig: ImageStaticLayerEntryConfig): Static;
}
//# sourceMappingURL=image-static.d.ts.map