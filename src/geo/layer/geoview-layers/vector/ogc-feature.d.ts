import { Options as SourceOptions } from 'ol/source/Vector';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { TypeLayerEntryConfig, TypeVectorLayerEntryConfig, TypeVectorSourceInitialConfig, TypeGeoviewLayerConfig, TypeListOfLayerEntryConfig, TypeBaseLayerEntryConfig } from '@/geo/map/map-schema-types';
export interface TypeSourceOgcFeatureInitialConfig extends TypeVectorSourceInitialConfig {
    format: 'featureAPI';
}
export declare class TypeOgcFeatureLayerEntryConfig extends TypeVectorLayerEntryConfig {
    source: TypeSourceOgcFeatureInitialConfig;
    /**
     * The class constructor.
     * @param {TypeOgcFeatureLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
     */
    constructor(layerConfig: TypeOgcFeatureLayerEntryConfig);
}
export interface TypeOgcFeatureLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig' | 'geoviewLayerType'> {
    geoviewLayerType: 'ogcFeature';
    listOfLayerEntryConfig: TypeOgcFeatureLayerEntryConfig[];
}
/** *****************************************************************************************************************************
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeOgcFeatureLayerConfig if the geoviewLayerType attribute of
 * the verifyIfLayer parameter is OGC_FEATURE. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsOgcFeature: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeOgcFeatureLayerConfig;
/** *****************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as an OgcFeature
 * if the type attribute of the verifyIfGeoViewLayer parameter is OGC_FEATURE. The type ascention
 * applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewLayerIsOgcFeature: (verifyIfGeoViewLayer: AbstractGeoViewLayer) => verifyIfGeoViewLayer is OgcFeature;
/** *****************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeOgcFeatureLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewLayerConfig attribute is OGC_FEATURE. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewEntryIsOgcFeature: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is TypeOgcFeatureLayerEntryConfig;
/** ******************************************************************************************************************************
 * A class to add OGC api feature layer.
 *
 * @exports
 * @class OgcFeature
 */
export declare class OgcFeature extends AbstractGeoViewVector {
    private version;
    /** ***************************************************************************************************************************
     * Initialize layer
     *
     * @param {string} mapId the id of the map
     * @param {TypeOgcFeatureLayerConfig} layerConfig the layer configuration
     */
    constructor(mapId: string, layerConfig: TypeOgcFeatureLayerConfig);
    /** ***************************************************************************************************************************
     * Extract the type of the specified field from the metadata. If the type can not be found, return 'string'.
     *
     * @param {string} fieldName field name for which we want to get the type.
     * @param {TypeLayerEntryConfig} layerConfig layer configuration.
     *
     * @returns {'string' | 'date' | 'number'} The type of the field.
     */
    protected getFieldType(fieldName: string, layerConfig: TypeLayerEntryConfig): 'string' | 'date' | 'number';
    /** ***************************************************************************************************************************
     * This method reads the service metadata from the metadataAccessPath.
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
     * This method is used to process the layer's metadata. It will fill the empty outfields and aliasFields properties of the
     * layer's configuration.
     *
     * @param {TypeVectorLayerEntryConfig} layerConfig The layer entry configuration to process.
     *
     * @returns {Promise<TypeLayerEntryConfig>} A promise that the vector layer configuration has its metadata processed.
     */
    protected processLayerMetadata(layerConfig: TypeVectorLayerEntryConfig): Promise<TypeLayerEntryConfig>;
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
     * @param {TypeBaseLayerEntryConfig} layerConfig The layer entry configuration.
     * @param {SourceOptions} sourceOptions The source options (default: {}).
     * @param {ReadOptions} readOptions The read options (default: {}).
     *
     * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
     */
    protected createVectorSource(layerConfig: TypeBaseLayerEntryConfig, sourceOptions?: SourceOptions, readOptions?: ReadOptions): VectorSource<Feature>;
}
