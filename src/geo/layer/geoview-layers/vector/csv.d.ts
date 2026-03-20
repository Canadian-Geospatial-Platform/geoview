import { Feature } from 'ol';
import type { ReadOptions } from 'ol/format/Feature';
import type { Projection as OLProjection, ProjectionLike } from 'ol/proj';
import type { Options as SourceOptions } from 'ol/source/Vector';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import type { TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { CsvLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/csv-layer-entry-config';
import type { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import { GVCSV } from '@/geo/layer/gv-layers/vector/gv-csv';
import type { DisplayDateMode } from '@/api/types/map-schema-types';
export interface TypeCSVLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: typeof CONST_LAYER_TYPES.CSV;
    listOfLayerEntryConfig: CsvLayerEntryConfig[];
}
/**
 * Class used to add a CSV layer to the map.
 */
export declare class CSV extends AbstractGeoViewVector {
    #private;
    /**
     * Constructs a CSV Layer configuration processor.
     *
     * @param layerConfig - The layer configuration
     */
    constructor(layerConfig: TypeCSVLayerConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getGeoviewLayerConfig(): TypeCSVLayerConfig;
    /**
     * Overrides the way a geoview layer config initializes its layer entries.
     *
     * @returns A promise that resolves once the layer entries have been initialized
     */
    protected onInitLayerEntries(): Promise<TypeGeoviewLayerConfig>;
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
     * Overrides the loading of the vector features for the layer by fetching CSV data and converting it
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
    protected onCreateGVLayer(layerConfig: CsvLayerEntryConfig): GVCSV;
    /**
     * Initializes a GeoView layer configuration for a CSV layer.
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
     * Creates a configuration object for a CSV Feature layer.
     *
     * This function constructs a `TypeCSVLayerConfig` object that describes a CSV Feature layer
     * and its associated entry configurations based on the provided parameters.
     *
     * @param geoviewLayerId - A unique identifier for the GeoView layer.
     * @param geoviewLayerName - The display name of the GeoView layer.
     * @param metadataAccessPath - The full service URL to the layer endpoint.
     * @param isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param layerEntries - An array of layer entries objects to be included in the configuration.
     * @returns The constructed configuration object for the CSV Feature layer.
     */
    static createGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware: boolean | undefined, layerEntries: TypeLayerEntryShell[]): TypeCSVLayerConfig;
    /**
     * Processes a CSV GeoviewLayerConfig and returns a promise
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
    /**
     * Converts csv text to feature array.
     *
     * @param csvData - The data from the .csv file
     * @param layerConfig - The config of the layer
     * @param outProjection - The output projection for the features
     * @returns The array of features
     */
    static convertCsv(csvData: string, layerConfig: CsvLayerEntryConfig, outProjection: ProjectionLike): Feature[];
}
//# sourceMappingURL=csv.d.ts.map