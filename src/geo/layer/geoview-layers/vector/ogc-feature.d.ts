import { Options as SourceOptions } from 'ol/source/Vector';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { TypeGeoviewLayerConfig, CONST_LAYER_TYPES, TypeMetadataOGCFeature } from '@/api/types/layer-schema-types';
import { OgcFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import { GVOGCFeature } from '@/geo/layer/gv-layers/vector/gv-ogc-feature';
import { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
export interface TypeOgcFeatureLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig' | 'geoviewLayerType'> {
    geoviewLayerType: typeof CONST_LAYER_TYPES.OGC_FEATURE;
    listOfLayerEntryConfig: OgcFeatureLayerEntryConfig[];
}
/**
 * A class to add OGC api feature layer.
 *
 * @exports
 * @class OgcFeature
 */
export declare class OgcFeature extends AbstractGeoViewVector {
    #private;
    /**
     * Constructs a OgcFeature Layer configuration processor.
     * @param {TypeOgcFeatureLayerConfig} layerConfig the layer configuration
     */
    constructor(layerConfig: TypeOgcFeatureLayerConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeMetadataOGCFeature | undefined} The strongly-typed layer configuration specific to this layer.
     */
    getMetadata(): TypeMetadataOGCFeature | undefined;
    /**
     * Overrides the way the metadata is fetched.
     * Resolves with the Json object or undefined when no metadata is to be expected for a particular layer type.
     * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
     * @returns {Promise<T = TypeMetadataOGCFeature>} A promise with the metadata or undefined when no metadata for the particular layer type.
     */
    protected onFetchServiceMetadata<T = TypeMetadataOGCFeature>(abortSignal?: AbortSignal): Promise<T>;
    /**
     * Overrides the way a geoview layer config initializes its layer entries.
     * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
     */
    protected onInitLayerEntries(): Promise<TypeGeoviewLayerConfig>;
    /**
     * Overrides the validation of a layer entry config.
     * @param {ConfigBaseClass} layerConfig - The layer entry config to validate.
     */
    protected onValidateLayerEntryConfig(layerConfig: ConfigBaseClass): void;
    /**
     * Overrides the way the layer metadata is processed.
     * @param {VectorLayerEntryConfig} layerConfig - The layer entry configuration to process.
     * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
     * @returns {Promise<VectorLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
     */
    protected onProcessLayerMetadata(layerConfig: VectorLayerEntryConfig, abortSignal?: AbortSignal): Promise<VectorLayerEntryConfig>;
    /**
     * Overrides the creation of the source configuration for the vector layer.
     * @param {VectorLayerEntryConfig} layerConfig - The layer entry configuration.
     * @param {SourceOptions} sourceOptions - The source options.
     * @param {ReadOptions} readOptions - The read options.
     * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
     */
    protected onCreateVectorSource(layerConfig: VectorLayerEntryConfig, sourceOptions: SourceOptions<Feature>, readOptions: ReadOptions): VectorSource<Feature>;
    /**
     * Overrides the creation of the GV Layer
     * @param {OgcFeatureLayerEntryConfig} layerConfig - The layer entry configuration.
     * @returns {GVOGCFeature} The GV Layer
     */
    protected onCreateGVLayer(layerConfig: OgcFeatureLayerEntryConfig): GVOGCFeature;
    /**
     * Fetches the metadata for a typical OGCFeature class.
     * @param {string} url - The url to query the metadata from.
     * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
     */
    static fetchMetadata(url: string, abortSignal?: AbortSignal): Promise<TypeMetadataOGCFeature>;
    /**
     * Initializes a GeoView layer configuration for an OGC Feature layer.
     * This method creates a basic TypeGeoviewLayerConfig using the provided
     * ID, name, and metadata access path URL. It then initializes the layer entries by calling
     * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
     * @param {string} geoviewLayerId - A unique identifier for the layer.
     * @param {string} geoviewLayerName - The display name of the layer.
     * @param {string} metadataAccessPath - The full service URL to the layer endpoint.
     * @returns {Promise<TypeGeoviewLayerConfig>} A promise that resolves to an initialized GeoView layer configuration with layer entries.
     */
    static initGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string): Promise<TypeGeoviewLayerConfig>;
    /**
     * Creates a configuration object for an OGC Feature layer.
     * This function constructs a `TypeOgcFeatureLayerConfig` object that describes an OGC Feature layer
     * and its associated entry configurations based on the provided parameters.
     * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name of the GeoView layer.
     * @param {string} metadataAccessPath - The URL or path to access metadata or feature data.
     * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
     * @returns {TypeOgcFeatureLayerConfig} The constructed configuration object for the OGC Feature layer.
     */
    static createGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware: boolean, layerEntries: TypeLayerEntryShell[]): TypeOgcFeatureLayerConfig;
    /**
     * Processes an OGC Feature GeoviewLayerConfig and returns a promise
     * that resolves to an array of `ConfigBaseClass` layer entry configurations.
     *
     * This method:
     * 1. Creates a Geoview layer configuration using the provided parameters.
     * 2. Instantiates a layer with that configuration.
     * 3. Processes the layer configuration and returns the result.
     * @param {string} geoviewLayerId - The unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name for the GeoView layer.
     * @param {string} url - The URL of the service endpoint.
     * @param {string[]} layerIds - An array of layer IDs to include in the configuration.
     * @param {boolean} isTimeAware - Indicates if the layer is time aware.
     * @returns {Promise<ConfigBaseClass[]>} A promise that resolves to an array of layer configurations.
     */
    static processGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, url: string, layerIds: string[], isTimeAware: boolean): Promise<ConfigBaseClass[]>;
}
//# sourceMappingURL=ogc-feature.d.ts.map