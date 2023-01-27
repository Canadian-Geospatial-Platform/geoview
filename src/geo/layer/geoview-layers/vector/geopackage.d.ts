import { Options as SourceOptions } from 'ol/source/Vector';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import { Geometry } from 'ol/geom';
import { AbstractGeoViewLayer } from '../abstract-geoview-layers';
import { AbstractGeoViewVector } from './abstract-geoview-vector';
import { TypeLayerEntryConfig, TypeVectorLayerEntryConfig, TypeVectorSourceInitialConfig, TypeGeoviewLayerConfig, TypeListOfLayerEntryConfig, TypeBaseLayerEntryConfig } from '../../../map/map-schema-types';
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
     * This method reads the service metadata from the metadataAccessPath.
     *
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected getServiceMetadata(): Promise<void>;
    /** ***************************************************************************************************************************
     * This method validates recursively the configuration of the layer entries to ensure that it is a feature layer identified
     * with a numeric layerId and creates a group entry when a layer is a group.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
     *
     * @returns {TypeListOfLayerEntryConfig} A new list of layer entries configuration with deleted error layers.
     */
    protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): TypeListOfLayerEntryConfig;
    /** ***************************************************************************************************************************
     * This method is used to process the layer's metadata. It will fill the empty outfields and aliasFields properties of the
     * layer's configuration.
     *
     * @param {TypeVectorLayerEntryConfig} layerEntryConfig The layer entry configuration to process.
     *
     * @returns {Promise<void>} A promise that the vector layer configuration has its metadata processed.
     */
    protected processLayerMetadata(layerEntryConfig: TypeVectorLayerEntryConfig): Promise<void>;
    /** ***************************************************************************************************************************
     * Create a source configuration for the vector layer.
     *
     * @param {TypeBaseLayerEntryConfig} layerEntryConfig The layer entry configuration.
     *
     * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
     */
    protected createVectorSource(layerEntryConfig: TypeBaseLayerEntryConfig, sourceOptions?: SourceOptions, readOptions?: ReadOptions): VectorSource<Geometry>;
    /** ***************************************************************************************************************************
     * Create a source configuration for the vector layer.
     *
     * @param {Uint8Array} gpkgBinGeom Binary geometry array to be parsed.
     *
     * @returns {Uint8Array} Uint8Array Subarray of inputted binary geoametry array.
     */
    protected parseGpkgGeom(gpkgBinGeom: Uint8Array): Uint8Array;
}
