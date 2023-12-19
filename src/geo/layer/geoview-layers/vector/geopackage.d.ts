import { Options as SourceOptions } from 'ol/source/Vector';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import { Feature } from 'ol';
import initSqlJs from 'sql.js';
import { AbstractGeoViewLayer } from '../abstract-geoview-layers';
import { AbstractGeoViewVector } from './abstract-geoview-vector';
import { TypeLayerEntryConfig, TypeVectorLayerEntryConfig, TypeVectorSourceInitialConfig, TypeGeoviewLayerConfig, TypeListOfLayerEntryConfig, TypeBaseLayerEntryConfig } from '@/geo/map/map-schema-types';
export interface TypeSourceGeoPackageInitialConfig extends TypeVectorSourceInitialConfig {
    format: 'GeoPackage';
}
export interface TypeGeoPackageLayerEntryConfig extends Omit<TypeVectorLayerEntryConfig, 'source'> {
    source: TypeSourceGeoPackageInitialConfig;
}
export interface TypeGeoPackageLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig' | 'geoviewLayerType'> {
    geoviewLayerType: 'GeoPackage';
    listOfLayerEntryConfig: TypeGeoPackageLayerEntryConfig[];
}
interface sldsInterface {
    [key: string | number]: string | number | Uint8Array;
}
interface layerData {
    name: string;
    source: VectorSource<Feature>;
    properties: initSqlJs.ParamsObject | undefined;
}
/** *****************************************************************************************************************************
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeGeoPackageFeatureLayerConfig if the geoviewLayerType attribute of
 * the verifyIfLayer parameter is GEOPACKAGE. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsGeoPackage: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeGeoPackageLayerConfig;
/** *****************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as a GeoPackage
 * if the type attribute of the verifyIfGeoViewLayer parameter is GEOPACKAGE. The type ascention
 * applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewLayerIsGeoPackage: (verifyIfGeoViewLayer: AbstractGeoViewLayer) => verifyIfGeoViewLayer is GeoPackage;
/** *****************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeGeoPackageLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewRootLayer attribute is GEOPACKAGE. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewEntryIsGeoPackage: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is TypeGeoPackageLayerEntryConfig;
/** ******************************************************************************************************************************
 * A class to add GeoPackage api feature layer.
 *
 * @exports
 * @class GeoPackage
 */
export declare class GeoPackage extends AbstractGeoViewVector {
    /** ***************************************************************************************************************************
     * Initialize layer
     *
     * @param {string} mapId the id of the map
     * @param {TypeGeoPackageFeatureLayerConfig} layerConfig the layer configuration
     */
    constructor(mapId: string, layerConfig: TypeGeoPackageLayerConfig);
    /** ***************************************************************************************************************************
     * Geopackages have no metadata.
     *
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected fetchServiceMetadata(): Promise<void>;
    /** ***************************************************************************************************************************
     * This method validates recursively the configuration of the layer entries to ensure that it is a feature layer identified
     * with a numeric layerId and creates a group entry when a layer is a group.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
     */
    protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): void;
    /** ***************************************************************************************************************************
     * Process recursively the list of layer Entries to create the layers and the layer groups.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries to process.
     * @param {LayerGroup} layerGroup Optional layer group to use when we have many layers. The very first call to
     *  processListOfLayerEntryConfig must not provide a value for this parameter. It is defined for internal use.
     *
     * @returns {Promise<BaseLayer | null>} The promise that the layers were processed.
     */
    protected processListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig, layerGroup?: LayerGroup): Promise<BaseLayer | null>;
    /** ***************************************************************************************************************************
     * Create a source configuration for the vector layer.
     *
     * @param {TypeBaseLayerEntryConfig} layerConfig The layer entry configuration.
     * @param {SourceOptions} sourceOptions The source options (default: {}).
     * @param {ReadOptions} readOptions The read options (default: {}).
     */
    protected extractGeopackageData(layerConfig: TypeBaseLayerEntryConfig, sourceOptions?: SourceOptions, readOptions?: ReadOptions): Promise<[layerData[], sldsInterface]>;
    /** ***************************************************************************************************************************
     * This method creates a GeoView layer using the definition provided in the layerConfig parameter.
     *
     * @param {TypeLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
     * @param {sldsInterface} sld The SLD style associated with the layers geopackage, if any
     *
     * @returns {Promise<BaseLayer | null>} The GeoView base layer that has been created.
     */
    protected processOneGeopackageLayer(layerConfig: TypeBaseLayerEntryConfig, layerInfo: layerData, sld?: sldsInterface): Promise<BaseLayer | null>;
    /** ***************************************************************************************************************************
     * This method creates all layers from a single geopackage
     *
     * @param {TypeLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
     * @param {LayerGroup} layerGroup Optional layer group for multiple layers.
     *
     * @returns {Promise<BaseLayer | null>} The GeoView base layer that has been created.
     */
    protected processOneGeopackage(layerConfig: TypeBaseLayerEntryConfig, layerGroup?: LayerGroup): Promise<BaseLayer | null>;
    /** ***************************************************************************************************************************
     * This method sets the outfields and aliasFields of the source feature info.
     *
     * @param {TypeJsonArray} fields An array of field names and its aliases.
     * @param {TypeVectorLayerEntryConfig} layerConfig The vector layer entry to configure.
     */
    private processFeatureInfoConfig;
    /** ***************************************************************************************************************************
     * Create a source configuration for the vector layer.
     *
     * @param {Uint8Array} gpkgBinGeom Binary geometry array to be parsed.
     *
     * @returns {Uint8Array} Uint8Array Subarray of inputted binary geoametry array.
     */
    protected parseGpkgGeom(gpkgBinGeom: Uint8Array): Uint8Array;
}
export {};
