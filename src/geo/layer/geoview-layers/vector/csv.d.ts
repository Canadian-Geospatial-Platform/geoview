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
    #private;
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
     * @param {OLProjection?} [mapProjection] - The map projection.
     * @param {AbortSignal?} [abortSignal] - Abort signal to handle cancelling of the process.
     * @returns {Promise<VectorLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
     */
    protected onProcessLayerMetadata(layerConfig: VectorLayerEntryConfig, mapProjection?: OLProjection, abortSignal?: AbortSignal): Promise<VectorLayerEntryConfig>;
    /**
     * Overrides the loading of the vector features for the layer by fetching CSV data and converting it
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
     * @param {boolean?} [isTimeAware] - Indicates whether the layer supports time-based filtering.
     * @returns {Promise<TypeGeoviewLayerConfig>} A promise that resolves to an initialized GeoView layer configuration with layer entries.
     * @static
     */
    static initGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware?: boolean): Promise<TypeGeoviewLayerConfig>;
    /**
     * Creates a configuration object for a CSV Feature layer.
     * This function constructs a `TypeCSVLayerConfig` object that describes a CSV Feature layer
     * and its associated entry configurations based on the provided parameters.
     * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name of the GeoView layer.
     * @param {string} metadataAccessPath - The URL or path to access metadata or feature data.
     * @param {boolean | undefined} isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
     * @returns {TypeCSVLayerConfig} The constructed configuration object for the CSV Feature layer.
     * @static
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
     * @param {string} geoviewLayerId - The unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name for the GeoView layer.
     * @param {string} url - The URL of the service endpoint.
     * @param {string[]} layerIds - An array of layer IDs to include in the configuration.
     * @param {boolean} isTimeAware - Indicates if the layer is time aware.
     * @returns {Promise<ConfigBaseClass[]>} A promise that resolves to an array of layer configurations.
     * @static
     */
    static processGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, url: string, layerIds: string[], isTimeAware: boolean): Promise<ConfigBaseClass[]>;
    /**
     * Converts csv text to feature array.
     * @param {string} csvData - The data from the .csv file.
     * @param {CsvLayerEntryConfig} layerConfig - The config of the layer.
     * @param {ProjectionLike} outProjection - The output projection for the features.
     * @returns {Feature[]} The array of features.
     * @private
     * @static
     */
    static convertCsv(csvData: string, layerConfig: CsvLayerEntryConfig, outProjection: ProjectionLike): Feature[];
}
//# sourceMappingURL=csv.d.ts.map