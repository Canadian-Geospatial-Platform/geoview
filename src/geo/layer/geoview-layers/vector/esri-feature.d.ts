import type { Vector as VectorSource } from 'ol/source';
import type { Options as SourceOptions } from 'ol/source/Vector';
import type { ReadOptions } from 'ol/format/Feature';
import type Feature from 'ol/Feature';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { EsriFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import type { TypeVectorSourceInitialConfig, TypeGeoviewLayerConfig, TypeMetadataEsriFeature } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { GVEsriFeature } from '@/geo/layer/gv-layers/vector/gv-esri-feature';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
export interface TypeSourceEsriFeatureInitialConfig extends Omit<TypeVectorSourceInitialConfig, 'format'> {
    format: 'EsriJSON';
}
export interface TypeEsriFeatureLayerConfig extends TypeGeoviewLayerConfig {
    geoviewLayerType: typeof CONST_LAYER_TYPES.ESRI_FEATURE;
    listOfLayerEntryConfig: EsriFeatureLayerEntryConfig[];
}
/**
 * A class to add an EsriFeature layer.
 *
 * @exports
 * @class EsriFeature
 */
export declare class EsriFeature extends AbstractGeoViewVector {
    /**
     * Constructs an EsriFeature Layer configuration processor.
     * @param {TypeEsriFeatureLayerConfig} layerConfig The layer configuration.
     */
    constructor(layerConfig: TypeEsriFeatureLayerConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeMetadataEsriFeature | undefined} The strongly-typed layer configuration specific to this layer.
     */
    getMetadata(): TypeMetadataEsriFeature | undefined;
    /**
     * Overrides the way the metadata is fetched.
     * Resolves with the Json object or undefined when no metadata is to be expected for a particular layer type.
     * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
     * @returns {Promise<T = TypeMetadataEsriFeature | undefined>} A promise with the metadata or undefined when no metadata for the particular layer type.
     */
    protected onFetchServiceMetadata<T = TypeMetadataEsriFeature | undefined>(abortSignal?: AbortSignal): Promise<T>;
    /**
     * Overrides the way a geoview layer config initializes its layer entries.
     * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
     * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
     */
    protected onInitLayerEntries(abortSignal?: AbortSignal): Promise<TypeGeoviewLayerConfig>;
    /**
     * This method validates recursively the configuration of the layer entries to ensure that it is a feature layer identified
     * with a numeric layerId and creates a group entry when a layer is a group.
     *
     * @param {ConfigBaseClass[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
     */
    protected onValidateListOfLayerEntryConfig(listOfLayerEntryConfig: ConfigBaseClass[]): void;
    /**
     * Overrides the way the layer metadata is processed.
     * @param {EsriFeatureLayerEntryConfig} layerConfig - The layer entry configuration to process.
     * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
     * @returns {Promise<EsriFeatureLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
     */
    protected onProcessLayerMetadata(layerConfig: EsriFeatureLayerEntryConfig, abortSignal?: AbortSignal): Promise<EsriFeatureLayerEntryConfig>;
    /**
     * Overrides the creation of the source configuration for the vector layer.
     * @param {EsriFeatureLayerEntryConfig} layerConfig - The layer entry configuration.
     * @param {SourceOptions} sourceOptions - The source options.
     * @param {ReadOptions} readOptions - The read options.
     * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
     */
    protected onCreateVectorSource(layerConfig: EsriFeatureLayerEntryConfig, sourceOptions: SourceOptions<Feature>, readOptions: ReadOptions): VectorSource<Feature>;
    /**
     * Overrides the creation of the GV Layer
     * @param {EsriFeatureLayerEntryConfig} layerConfig - The layer entry configuration.
     * @returns {GVEsriFeature} The GV Layer
     */
    protected onCreateGVLayer(layerConfig: EsriFeatureLayerEntryConfig): GVEsriFeature;
    /**
     * Performs specific validation that can only be done by the child of the AbstractGeoViewEsriLayer class.
     * @param {ConfigBaseClass} layerConfig - The layer config to check.
     * @param {esriIndex} esriIndex - The esri layer index config to check.
     * @returns {boolean} true if an error is detected.
     */
    esriChildHasDetectedAnError(layerConfig: ConfigBaseClass, esriIndex: number): boolean;
    /**
     * Initializes a GeoView layer configuration for a Esri Feature layer.
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
     * Creates a configuration object for an Esri Feature layer.
     * This function constructs a `TypeEsriFeatureLayerConfig` object that describes an Esri Feature layer
     * and its associated entry configurations based on the provided parameters.
     * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name of the GeoView layer.
     * @param {string} metadataAccessPath - The URL or path to access metadata or feature data.
     * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
     * @returns {TypeEsriFeatureLayerConfig} The constructed configuration object for the Esri Feature layer.
     */
    static createGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware: boolean, layerEntries: TypeLayerEntryShell[]): TypeEsriFeatureLayerConfig;
    /**
     * Processes an Esri Feature GeoviewLayerConfig and returns a promise
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
    static processGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, url: string, layerIds: number[], isTimeAware: boolean): Promise<ConfigBaseClass[]>;
}
//# sourceMappingURL=esri-feature.d.ts.map