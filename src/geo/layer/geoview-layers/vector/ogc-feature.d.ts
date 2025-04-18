import { Options as SourceOptions } from 'ol/source/Vector';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';
import { TypeJsonObject } from '@/core/types/global-types';
import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { TypeLayerEntryConfig, TypeVectorSourceInitialConfig, TypeGeoviewLayerConfig } from '@/geo/map/map-schema-types';
import { OgcFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
export interface TypeSourceOgcFeatureInitialConfig extends TypeVectorSourceInitialConfig {
    format: 'featureAPI';
}
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
     *
     * @param {string} mapId the id of the map
     * @param {TypeOgcFeatureLayerConfig} layerConfig the layer configuration
     */
    constructor(mapId: string, layerConfig: TypeOgcFeatureLayerConfig);
    /**
     * Fetches the metadata for a typical OGCFeature class.
     * @param {string} url - The url to query the metadata from.
     */
    static fetchMetadata(url: string): Promise<TypeJsonObject>;
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
     * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer entry configuration to process.
     * @returns {Promise<AbstractBaseLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
     */
    protected onProcessLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig>;
    /**
     * Create a source configuration for the vector layer.
     *
     * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration.
     * @param {SourceOptions} sourceOptions The source options (default: {}).
     * @param {ReadOptions} readOptions The read options (default: {}).
     *
     * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
     */
    protected createVectorSource(layerConfig: AbstractBaseLayerEntryConfig, sourceOptions?: SourceOptions<Feature>, readOptions?: ReadOptions): VectorSource<Feature>;
}
/**
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeOgcFeatureLayerConfig if the geoviewLayerType attribute of
 * the verifyIfLayer parameter is OGC_FEATURE. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsOgcFeature: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeOgcFeatureLayerConfig;
/**
 * type guard function that redefines a TypeLayerEntryConfig as a OgcFeatureLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewLayerConfig attribute is OGC_FEATURE. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewEntryIsOgcFeature: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is OgcFeatureLayerEntryConfig;
