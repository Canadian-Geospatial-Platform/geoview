import { Options as SourceOptions } from 'ol/source/Vector';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { TypeOutfieldsType } from '@/api/types/map-schema-types';
import { CONST_LAYER_TYPES, TypeGeoviewLayerConfig, TypeMetadataWFS, VectorStrategy } from '@/api/types/layer-schema-types';
import { WfsLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import { GVWFS } from '@/geo/layer/gv-layers/vector/gv-wfs';
import { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
export interface TypeWFSLayerConfig extends Omit<TypeGeoviewLayerConfig, 'geoviewLayerType'> {
    geoviewLayerType: typeof CONST_LAYER_TYPES.WFS;
    listOfLayerEntryConfig: WfsLayerEntryConfig[];
}
/**
 * A class to add WFS layer.
 *
 * @exports
 * @class WFS
 */
export declare class WFS extends AbstractGeoViewVector {
    #private;
    /**
     * Constructs a WFS Layer configuration processor.
     * @param {TypeWFSLayerConfig} layerConfig the layer configuration
     */
    constructor(layerConfig: TypeWFSLayerConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeMetadataWFS | undefined} The strongly-typed layer configuration specific to this layer.
     */
    getMetadata(): TypeMetadataWFS | undefined;
    /**
     * Gets the WFS version
     * @returns {string | undefined} The WFS service version as read from the metadata attribute.
     */
    getVersion(): string | undefined;
    /**
     * Overrides the way the metadata is fetched.
     * Resolves with the Json object or undefined when no metadata is to be expected for a particular layer type.
     * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
     * @returns {Promise<T = TypeMetadataWFS>} A promise with the metadata or undefined when no metadata for the particular layer type.
     */
    protected onFetchServiceMetadata<T = TypeMetadataWFS>(abortSignal?: AbortSignal): Promise<T>;
    /**
     * Overrides the way a geoview layer config initializes its layer entries.
     * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
     * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
     */
    protected onInitLayerEntries(abortSignal?: AbortSignal): Promise<TypeGeoviewLayerConfig>;
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
     * Overrides the creation of the source configuration for the vector layer
     * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer entry configuration.
     * @param {SourceOptions} sourceOptions - The source options.
     * @param {ReadOptions} readOptions - The read options.
     * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
     */
    protected onCreateVectorSource(layerConfig: VectorLayerEntryConfig, sourceOptions: SourceOptions<Feature>, readOptions: ReadOptions): VectorSource<Feature>;
    /**
     * Overrides the creation of the GV Layer
     * @param {WfsLayerEntryConfig} layerConfig - The layer entry configuration.
     * @returns {GVWFS} The GV Layer
     */
    protected onCreateGVLayer(layerConfig: WfsLayerEntryConfig): GVWFS;
    /**
     * Fetches the metadata for a typical WFS class.
     * @param {string} url - The url to query the metadata from.
     * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
     * @returns {Promise<TypeMetadataWFS | undefined>} Promise with the metadata when fetched or undefined when capabilities weren't found.
     */
    static fetchMetadata(url: string, abortSignal?: AbortSignal): Promise<TypeMetadataWFS | undefined>;
    /**
     * Initializes a GeoView layer configuration for a WFS layer.
     * This method creates a basic TypeGeoviewLayerConfig using the provided
     * ID, name, and metadata access path URL. It then initializes the layer entries by calling
     * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
     * @param {string} geoviewLayerId - A unique identifier for the layer.
     * @param {string} geoviewLayerName - The display name of the layer.
     * @param {string} metadataAccessPath - The full service URL to the layer endpoint.
     * @returns {Promise<TypeGeoviewLayerConfig>} A promise that resolves to an initialized GeoView layer configuration with layer entries.
     */
    static initGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string): Promise<TypeGeoviewLayerConfig>;
    static getFieldType(fieldName: string, layerConfig: WfsLayerEntryConfig): TypeOutfieldsType;
    /**
     * Creates a configuration object for an WFS Feature layer.
     * This function constructs a `TypeWFSLayerConfig` object that describes an WFS Feature layer
     * and its associated entry configurations based on the provided parameters.
     * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name of the GeoView layer.
     * @param {string} metadataAccessPath - The URL or path to access metadata or feature data.
     * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param {VectorStrategy} strategy - Indicates the strategy to use to fetch vector data.
     * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
     * @returns {TypeWFSLayerConfig} The constructed configuration object for the WFS Feature layer.
     */
    static createGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware: boolean, strategy: VectorStrategy, layerEntries: TypeLayerEntryShell[]): TypeWFSLayerConfig;
    /**
     * Processes a WFS (Web Feature Service) GeoviewLayerConfig and returns a promise
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
    static processGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, url: string, layerIds: string[], isTimeAware: boolean, vectorStrategy: VectorStrategy): Promise<ConfigBaseClass[]>;
}
//# sourceMappingURL=wfs.d.ts.map