import { Options as SourceOptions } from 'ol/source/Vector';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { TypeLayerEntryConfig, TypeVectorSourceInitialConfig, TypeGeoviewLayerConfig, CONST_LAYER_TYPES } from '@/api/config/types/map-schema-types';
import { TypeJsonArray, TypeJsonObject } from '@/api/config/types/config-types';
import { GeoJSONLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { GVGeoJSON } from '@/geo/layer/gv-layers/vector/gv-geojson';
export interface TypeSourceGeoJSONInitialConfig extends Omit<TypeVectorSourceInitialConfig, 'format'> {
    format: 'GeoJSON';
    geojson?: string;
}
export interface TypeGeoJSONLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: typeof CONST_LAYER_TYPES.GEOJSON;
    listOfLayerEntryConfig: GeoJSONLayerEntryConfig[];
}
/**
 * Class used to add GeoJSON layer to the map
 *
 * @exports
 * @class GeoJSON
 */
export declare class GeoJSON extends AbstractGeoViewVector {
    #private;
    /**
     * Constructs a GeoJSON Layer configuration processor.
     * @param {TypeGeoJSONLayerConfig} layerConfig the layer configuration
     */
    constructor(layerConfig: TypeGeoJSONLayerConfig);
    /**
     * Overrides the way the metadata is fetched and set in the 'metadata' property. Resolves when done.
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected onFetchAndSetServiceMetadata(): Promise<void>;
    /**
     * Overrides the validation of a layer entry config.
     * @param {TypeLayerEntryConfig} layerConfig - The layer entry config to validate.
     */
    protected onValidateLayerEntryConfig(layerConfig: TypeLayerEntryConfig): void;
    /**
     * Overrides the way the layer metadata is processed.
     * @param {VectorLayerEntryConfig} layerConfig - The layer entry configuration to process.
     * @returns {Promise<VectorLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
     */
    protected onProcessLayerMetadata(layerConfig: VectorLayerEntryConfig): Promise<VectorLayerEntryConfig>;
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
     * @param {GeoJSONLayerEntryConfig} layerConfig - The layer entry configuration.
     * @returns {GVGeoJSON} The GV Layer
     */
    protected onCreateGVLayer(layerConfig: GeoJSONLayerEntryConfig): GVGeoJSON;
    /**
     * Fetches the metadata for a typical GeoJson class.
     * @param {string} url - The url to query the metadata from.
     */
    static fetchMetadata(url: string): Promise<TypeJsonObject>;
    /**
     * Creates a configuration object for a GeoJson Feature layer.
     * This function constructs a `TypeGeoJSONLayerConfig` object that describes an GeoJson Feature layer
     * and its associated entry configurations based on the provided parameters.
     * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name of the GeoView layer.
     * @param {string} metadataAccessPath - The URL or path to access metadata or feature data.
     * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param {TypeJsonArray} layerEntries - An array of layer entries objects to be included in the configuration.
     * @returns {TypeGeoJSONLayerConfig} The constructed configuration object for the GeoJson Feature layer.
     */
    static createGeoJsonLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware: boolean, layerEntries: TypeJsonArray): TypeGeoJSONLayerConfig;
}
/**
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeGeoJSONLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is GEOJSON. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsGeoJSON: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeGeoJSONLayerConfig;
/**
 * type guard function that redefines a TypeLayerEntryConfig as a GeoJSONLayerEntryConfig if the geoviewLayerType attribute of
 * the verifyIfGeoViewEntry.geoviewLayerConfig attribute is GEOJSON. The type ascention applies only to the true block of the if
 * clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewEntryIsGeoJSON: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is GeoJSONLayerEntryConfig;
