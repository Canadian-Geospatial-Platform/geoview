import { TypeJsonArray } from '@/api/config/types/config-types';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { TypeLayerEntryConfig, TypeVectorSourceInitialConfig, TypeGeoviewLayerConfig, CONST_LAYER_TYPES } from '@/api/config/types/map-schema-types';
import { GeoPackageLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/geopackage-layer-config-entry';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { AbstractBaseLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { GVGroupLayer } from '@/geo/layer/gv-layers/gv-group-layer';
export interface TypeSourceGeoPackageInitialConfig extends TypeVectorSourceInitialConfig {
    format: 'GeoPackage';
}
export interface TypeGeoPackageLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig' | 'geoviewLayerType'> {
    geoviewLayerType: typeof CONST_LAYER_TYPES.GEOPACKAGE;
    listOfLayerEntryConfig: GeoPackageLayerEntryConfig[];
}
/**
 * A class to add GeoPackage api feature layer.
 *
 * @exports
 * @class GeoPackage
 */
export declare class GeoPackage extends AbstractGeoViewVector {
    #private;
    /**
     * Constructs a GeoPackage Layer configuration processor.
     * @param {TypeGeoPackageFeatureLayerConfig} layerConfig the layer configuration
     */
    constructor(layerConfig: TypeGeoPackageLayerConfig);
    /**
     * Overrides the way the metadata is fetched and set in the 'metadata' property. Resolves when done.
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected onFetchAndSetServiceMetadata(): Promise<void>;
    /**
     * Overrides the way the layer metadata is processed.
     * @param {VectorLayerEntryConfig} layerConfig - The layer entry configuration to process.
     * @returns {Promise<VectorLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
     */
    protected onProcessLayerMetadata(layerConfig: VectorLayerEntryConfig): Promise<VectorLayerEntryConfig>;
    /**
     * Overrides the way the layer entry is processed to generate an Open Layer Base Layer object.
     * @param {VectorLayerEntryConfig} layerConfig - The layer entry config needed to create the Open Layer object.
     * @param {LayerGroup} layerGroup Optional layer group for multiple layers.
     * @returns {Promise<BaseLayer>} The GeoView base layer that has been created.
     */
    protected onProcessOneLayerEntry(layerConfig: VectorLayerEntryConfig, layerGroup?: GVGroupLayer): Promise<AbstractBaseLayer>;
    /**
     * Overrides the creation of the GV Layer
     * @param {VectorLayerEntryConfig} layerConfig - The layer entry configuration.
     * @returns {AbstractGVLayer} The GV Layer
     */
    protected onCreateGVLayer(layerConfig: VectorLayerEntryConfig): AbstractGVLayer;
    /**
     * This method creates a GeoView layer using the definition provided in the layerConfig parameter.
     *
     * @param {VectorLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
     * @param {string | number | Uint8Array} sld The SLD style associated with the layer
     */
    protected static processGeopackageStyle(layerConfig: VectorLayerEntryConfig, sld: string | number | Uint8Array): void;
    /**
     * Creates a configuration object for a Geopackage Feature layer.
     * This function constructs a `TypeGeoPackageLayerConfig` object that describes an Geopackage Feature layer
     * and its associated entry configurations based on the provided parameters.
     * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name of the GeoView layer.
     * @param {string} metadataAccessPath - The URL or path to access metadata or feature data.
     * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param {TypeJsonArray} layerEntries - An array of layer entries objects to be included in the configuration.
     * @returns {TypeGeoPackageLayerConfig} The constructed configuration object for the Geopackage Feature layer.
     */
    static createGeopackageLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware: boolean, layerEntries: TypeJsonArray): TypeGeoPackageLayerConfig;
}
/**
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeGeoPackageFeatureLayerConfig if the geoviewLayerType attribute of
 * the verifyIfLayer parameter is GEOPACKAGE. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsGeoPackage: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeGeoPackageLayerConfig;
/**
 * type guard function that redefines a TypeLayerEntryConfig as a GeoPackageLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewLayerConfig attribute is GEOPACKAGE. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewEntryIsGeoPackage: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is GeoPackageLayerEntryConfig;
