import type { Feature } from 'ol';
import type { ReadOptions } from 'ol/format/Feature';
import type { Options as SourceOptions } from 'ol/source/Vector';
import type { Projection as OLProjection } from 'ol/proj';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import type { DisplayDateMode } from '@/api/types/map-schema-types';
import type { TypeGeoviewLayerConfig, TypeMetadataOGCFeature } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { OgcFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';
import type { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import { GVOGCFeature } from '@/geo/layer/gv-layers/vector/gv-ogc-feature';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
export interface TypeOgcFeatureLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig' | 'geoviewLayerType'> {
    geoviewLayerType: typeof CONST_LAYER_TYPES.OGC_FEATURE;
    listOfLayerEntryConfig: OgcFeatureLayerEntryConfig[];
}
/**
 * A class to add OGC api feature layer.
 */
export declare class OgcFeature extends AbstractGeoViewVector {
    #private;
    /**
     * Constructs a OgcFeature Layer configuration processor.
     *
     * @param layerConfig - The layer configuration
     */
    constructor(layerConfig: TypeOgcFeatureLayerConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getGeoviewLayerConfig(): TypeOgcFeatureLayerConfig;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed metadata specific to this layer.
     */
    getMetadata(): TypeMetadataOGCFeature | undefined;
    /**
     * Overrides the way the metadata is fetched.
     *
     * Resolves with the Json object or undefined when no metadata is to be expected for a particular layer type.
     *
     * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
     * @returns A promise that resolves with the metadata or undefined when no metadata for the particular layer type
     * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error
     */
    protected onFetchServiceMetadata<T = TypeMetadataOGCFeature>(abortSignal?: AbortSignal): Promise<T>;
    /**
     * Overrides the way a geoview layer config initializes its layer entries.
     *
     * @returns A promise that resolves once the layer entries have been initialized
     * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error
     */
    protected onInitLayerEntries(): Promise<TypeGeoviewLayerConfig>;
    /**
     * Overrides the validation of a layer entry config.
     *
     * @param layerConfig - The layer entry config to validate
     */
    protected onValidateLayerEntryConfig(layerConfig: ConfigBaseClass): void;
    /**
     * Overrides the way the layer metadata is processed.
     *
     * @param layerConfig - The layer entry configuration to process
     * @param displayDateMode - The display date mode to use for processing time dimensions in the metadata
     * @param mapProjection - Optional map projection
     * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
     * @returns A promise that resolves once the layer entry configuration has gotten its metadata processed
     */
    protected onProcessLayerMetadata(layerConfig: VectorLayerEntryConfig, displayDateMode: DisplayDateMode, mapProjection?: OLProjection, abortSignal?: AbortSignal): Promise<VectorLayerEntryConfig>;
    /**
     * Overrides the loading of the vector features for the layer by fetching OGC Feature data and converting it
     * into OpenLayers {@link Feature} feature instances.
     *
     * @param layerConfig - The configuration object for the vector layer, containing source and data access information
     * @param sourceOptions - The OpenLayers vector source options associated with the layer
     * @param readOptions - Options controlling how features are read, including the target `featureProjection`
     * @returns A promise that resolves to an array of OpenLayers features
     */
    protected onCreateVectorSourceLoadFeatures(layerConfig: VectorLayerEntryConfig, sourceOptions: SourceOptions<Feature>, readOptions: ReadOptions): Promise<Feature[]>;
    /**
     * Overrides the creation of the GV Layer.
     *
     * @param layerConfig - The layer entry configuration
     * @returns The GV Layer
     */
    protected onCreateGVLayer(layerConfig: OgcFeatureLayerEntryConfig): GVOGCFeature;
    /**
     * Fetches the metadata for a typical OGCFeature class.
     *
     * @param url - The url to query the metadata from
     * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal
     * @throws {ResponseError} When the response is not OK (non-2xx)
     * @throws {ResponseEmptyError} When the JSON response is empty
     */
    static fetchMetadata(url: string, abortSignal?: AbortSignal): Promise<TypeMetadataOGCFeature>;
    /**
     * Initializes a GeoView layer configuration for an OGC Feature layer.
     *
     * This method creates a basic TypeGeoviewLayerConfig using the provided
     * ID, name, and metadata access path URL. It then initializes the layer entries by calling
     * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
     *
     * @param geoviewLayerId - A unique identifier for the layer.
     * @param geoviewLayerName - The display name of the layer.
     * @param metadataAccessPath - The full service URL to the layer endpoint.
     * @param isTimeAware - Indicates whether the layer supports time-based filtering.
     * @returns A promise that resolves to an initialized GeoView layer configuration with layer entries.
     */
    static initGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware?: boolean): Promise<TypeGeoviewLayerConfig>;
    /**
     * Creates a configuration object for an OGC Feature layer.
     *
     * This function constructs a `TypeOgcFeatureLayerConfig` object that describes an OGC Feature layer
     * and its associated entry configurations based on the provided parameters.
     *
     * @param geoviewLayerId - A unique identifier for the GeoView layer.
     * @param geoviewLayerName - The display name of the GeoView layer.
     * @param metadataAccessPath - The full service URL to the layer endpoint.
     * @param isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param layerEntries - An array of layer entries objects to be included in the configuration.
     * @returns The constructed configuration object for the OGC Feature layer
     */
    static createGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware: boolean | undefined, layerEntries: TypeLayerEntryShell[]): TypeOgcFeatureLayerConfig;
    /**
     * Processes an OGC Feature GeoviewLayerConfig and returns a promise
     * that resolves to an array of `ConfigBaseClass` layer entry configurations.
     *
     * This method:
     * 1. Creates a Geoview layer configuration using the provided parameters.
     * 2. Instantiates a layer with that configuration.
     * 3. Processes the layer configuration and returns the result.
     *
     * @param geoviewLayerId - The unique identifier for the GeoView layer
     * @param geoviewLayerName - The display name for the GeoView layer
     * @param url - The URL of the service endpoint
     * @param layerIds - An array of layer IDs to include in the configuration
     * @param isTimeAware - Indicates if the layer is time aware
     * @returns A promise that resolves to an array of layer configurations
     */
    static processGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, url: string, layerIds: string[], isTimeAware: boolean): Promise<ConfigBaseClass[]>;
}
//# sourceMappingURL=ogc-feature.d.ts.map