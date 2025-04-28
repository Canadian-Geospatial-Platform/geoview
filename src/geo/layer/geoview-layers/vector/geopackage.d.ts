import { Options as SourceOptions } from 'ol/source/Vector';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import { Feature } from 'ol';
import initSqlJs from 'sql.js';
import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { TypeLayerEntryConfig, TypeVectorSourceInitialConfig, TypeGeoviewLayerConfig } from '@/api/config/types/map-schema-types';
import { GeoPackageLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/geopackage-layer-config-entry';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
export interface TypeSourceGeoPackageInitialConfig extends TypeVectorSourceInitialConfig {
    format: 'GeoPackage';
}
export interface TypeGeoPackageLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig' | 'geoviewLayerType'> {
    geoviewLayerType: typeof CONST_LAYER_TYPES.GEOPACKAGE;
    listOfLayerEntryConfig: GeoPackageLayerEntryConfig[];
}
interface SldsInterface {
    [key: string | number]: string | number | Uint8Array;
}
interface LayerData {
    name: string;
    source: VectorSource<Feature>;
    properties: initSqlJs.ParamsObject | undefined;
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
     *
     * @param {string} mapId the id of the map
     * @param {TypeGeoPackageFeatureLayerConfig} layerConfig the layer configuration
     */
    constructor(mapId: string, layerConfig: TypeGeoPackageLayerConfig);
    /**
     * Create a source configuration for the vector layer.
     *
     * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration.
     * @param {SourceOptions} sourceOptions The source options (default: {}).
     * @param {ReadOptions} readOptions The read options (default: {}).
     */
    protected extractGeopackageData(layerConfig: AbstractBaseLayerEntryConfig, sourceOptions?: SourceOptions<Feature>, readOptions?: ReadOptions): Promise<[LayerData[], SldsInterface]>;
    /**
     * This method creates a GeoView layer using the definition provided in the layerConfig parameter.
     *
     * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
     * @param {string | number | Uint8Array} sld The SLD style associated with the layer
     */
    protected static processGeopackageStyle(layerConfig: AbstractBaseLayerEntryConfig, sld: string | number | Uint8Array): void;
    /**
     * This method creates a GeoView layer using the definition provided in the layerConfig parameter.
     *
     * @param {AbstractLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
     * @param {sldsInterface} sld The SLD style associated with the layers geopackage, if any
     *
     * @returns {Promise<BaseLayer | undefined>} The GeoView base layer that has been created.
     */
    protected processOneGeopackageLayer(layerConfig: AbstractBaseLayerEntryConfig, layerInfo: LayerData, sld?: SldsInterface): Promise<BaseLayer | undefined>;
    /**
     * Overrides the way the layer entry is processed to generate an Open Layer Base Layer object.
     * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer entry config needed to create the Open Layer object.
     * @param {LayerGroup} layerGroup Optional layer group for multiple layers.
     * @returns {Promise<BaseLayer>} The GeoView base layer that has been created.
     */
    protected onProcessOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig, layerGroup?: LayerGroup): Promise<BaseLayer>;
    /**
     * Create a source configuration for the vector layer.
     *
     * @param {Uint8Array} gpkgBinGeom Binary geometry array to be parsed.
     *
     * @returns {Uint8Array} Uint8Array Subarray of inputted binary geoametry array.
     */
    protected static parseGpkgGeom(gpkgBinGeom: Uint8Array): Uint8Array;
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
export {};
