import type { Feature } from 'ol';
import type { ReadOptions } from 'ol/format/Feature';
import type { Options as SourceOptions } from 'ol/source/Vector';
import type { Projection as OLProjection } from 'ol/proj';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { EsriFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import type { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import type { TypeGeoviewLayerConfig, TypeMetadataEsriFeature } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { GVEsriFeature } from '@/geo/layer/gv-layers/vector/gv-esri-feature';
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
    #private;
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
     * @param {AbortSignal?} [abortSignal] - Abort signal to handle cancelling of the process.
     * @returns {Promise<T = TypeMetadataEsriFeature | undefined>} A promise with the metadata or undefined when no metadata for the particular layer type.
     * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
     */
    protected onFetchServiceMetadata<T = TypeMetadataEsriFeature | undefined>(abortSignal?: AbortSignal): Promise<T>;
    /**
     * Overrides the way a geoview layer config initializes its layer entries.
     * @param {AbortSignal?} [abortSignal] - Abort signal to handle cancelling of the process.
     * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
     * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
     */
    protected onInitLayerEntries(abortSignal?: AbortSignal): Promise<TypeGeoviewLayerConfig>;
    /**
     * This method validates recursively the configuration of the layer entries to ensure that it is a feature layer identified
     * with a numeric layerId and creates a group entry when a layer is a group.
     * @param {ConfigBaseClass[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
     */
    protected onValidateListOfLayerEntryConfig(listOfLayerEntryConfig: ConfigBaseClass[]): void;
    /**
     * Overrides the way the layer metadata is processed.
     * @param {EsriFeatureLayerEntryConfig} layerConfig - The layer entry configuration to process.
     * @param {OLProjection?} [mapProjection] - The map projection.
     * @param {AbortSignal?} [abortSignal] - Abort signal to handle cancelling of the process.
     * @returns {Promise<EsriFeatureLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
     * @throws {LayerTooManyEsriFeatures} When the layer has too many Esri features.
     */
    protected onProcessLayerMetadata(layerConfig: EsriFeatureLayerEntryConfig, mapProjection?: OLProjection, abortSignal?: AbortSignal): Promise<EsriFeatureLayerEntryConfig>;
    /**
     * Overrides the loading of the vector features for the layer by fetching EsriFeature data and converting it
     * into OpenLayers {@link Feature} feature instances.
     * @param {VectorLayerEntryConfig} layerConfig -
     * The configuration object for the vector layer, containing source and
     * data access information.
     * @param {SourceOptions<Feature>} sourceOptions -
     * The OpenLayers vector source options associated with the layer. This may be
     * used by implementations to customize loading behavior or source configuration.
     * @param {ReadOptions} readOptions -
     * Options controlling how features are read, including the target
     * `featureProjection`.
     * @returns {Promise<Feature[]>}
     * A promise that resolves to an array of OpenLayers features.
     * @protected
     * @override
     */
    protected onCreateVectorSourceLoadFeatures(layerConfig: VectorLayerEntryConfig, sourceOptions: SourceOptions<Feature>, readOptions: ReadOptions): Promise<Feature[]>;
    /**
     * Overrides the creation of the GV Layer
     * @param {EsriFeatureLayerEntryConfig} layerConfig - The layer entry configuration.
     * @returns {GVEsriFeature} The GV Layer
     */
    protected onCreateGVLayer(layerConfig: EsriFeatureLayerEntryConfig): GVEsriFeature;
    /**
     * Initializes a GeoView layer configuration for a Esri Feature layer.
     * This method creates a basic TypeGeoviewLayerConfig using the provided
     * ID, name, and metadata access path URL. It then initializes the layer entries by calling
     * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
     * @param {string} geoviewLayerId - A unique identifier for the layer.
     * @param {string} geoviewLayerName - The display name of the layer.
     * @param {string} metadataAccessPath - The full service URL to the layer endpoint.
     * @param {boolean?} [isTimeAware] - Indicates whether the layer supports time-based filtering.
     * @returns {Promise<TypeGeoviewLayerConfig>} A promise that resolves to an initialized GeoView layer configuration with layer entries.
     * @static
     */
    static initGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware?: boolean): Promise<TypeGeoviewLayerConfig>;
    /**
     * Creates a configuration object for an Esri Feature layer.
     * This function constructs a `TypeEsriFeatureLayerConfig` object that describes an Esri Feature layer
     * and its associated entry configurations based on the provided parameters.
     * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name of the GeoView layer.
     * @param {string} metadataAccessPath - The URL or path to access metadata or feature data.
     * @param {boolean | undefined} isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
     * @returns {TypeEsriFeatureLayerConfig} The constructed configuration object for the Esri Feature layer.
     * @static
     */
    static createGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware: boolean | undefined, layerEntries: TypeLayerEntryShell[]): TypeEsriFeatureLayerConfig;
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
     * @static
     */
    static processGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, url: string, layerIds: number[], isTimeAware: boolean): Promise<ConfigBaseClass[]>;
}
//# sourceMappingURL=esri-feature.d.ts.map