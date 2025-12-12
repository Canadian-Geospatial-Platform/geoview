import type { Options as SourceOptions } from 'ol/source/Vector';
import type { Vector as VectorSource } from 'ol/source';
import type Feature from 'ol/Feature';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import type { TypeVectorSourceInitialConfig, TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { CsvLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/csv-layer-entry-config';
import type { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import { GVCSV } from '@/geo/layer/gv-layers/vector/gv-csv';
export interface TypeSourceCSVInitialConfig extends Omit<TypeVectorSourceInitialConfig, 'format'> {
    format: 'CSV';
    separator?: ',';
}
export interface TypeCSVLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: typeof CONST_LAYER_TYPES.CSV;
    listOfLayerEntryConfig: CsvLayerEntryConfig[];
}
/**
 * Class used to add a CSV layer to the map
 *
 * @exports
 * @class CSV
 */
export declare class CSV extends AbstractGeoViewVector {
    /**
     * Constructs a CSV Layer configuration processor.
     * @param {TypeCSVLayerConfig} layerConfig the layer configuration
     */
    constructor(layerConfig: TypeCSVLayerConfig);
    /**
     * Overrides the way a geoview layer config initializes its layer entries.
     * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
     */
    protected onInitLayerEntries(): Promise<TypeGeoviewLayerConfig>;
    /**
     * Overrides the way the layer metadata is processed.
     * @param {VectorLayerEntryConfig} layerConfig - The layer entry configuration to process.
     * @returns {Promise<VectorLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
     */
    protected onProcessLayerMetadata(layerConfig: VectorLayerEntryConfig): Promise<VectorLayerEntryConfig>;
    /**
     * Overrides the creation of the source configuration for the vector layer
     * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer entry configuration.
     * @param {SourceOptions} sourceOptions - The source options.
     * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
     * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
     */
    protected onCreateVectorSource(layerConfig: VectorLayerEntryConfig, sourceOptions: SourceOptions<Feature>): VectorSource<Feature>;
    /**
     * Overrides the creation of the GV Layer
     * @param {CsvLayerEntryConfig} layerConfig - The layer entry configuration.
     * @returns {GVCSV} The GV Layer
     */
    protected onCreateGVLayer(layerConfig: CsvLayerEntryConfig): GVCSV;
    /**
     * Initializes a GeoView layer configuration for a CSV layer.
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
     * Creates a configuration object for a CSV Feature layer.
     * This function constructs a `TypeCSVLayerConfig` object that describes a CSV Feature layer
     * and its associated entry configurations based on the provided parameters.
     * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name of the GeoView layer.
     * @param {string} metadataAccessPath - The URL or path to access metadata or feature data.
     * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
     * @returns {TypeCSVLayerConfig} The constructed configuration object for the CSV Feature layer.
     */
    static createGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware: boolean, layerEntries: TypeLayerEntryShell[]): TypeCSVLayerConfig;
    /**
     * Processes a CSV GeoviewLayerConfig and returns a promise
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
//# sourceMappingURL=csv.d.ts.map