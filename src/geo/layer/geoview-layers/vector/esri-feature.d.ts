import { AbstractGeoViewLayer } from '../abstract-geoview-layers';
import { AbstractGeoViewVector } from './abstract-geoview-vector';
import { TypeLayerEntryConfig, TypeVectorLayerEntryConfig, TypeVectorSourceInitialConfig, TypeGeoviewLayerConfig, TypeListOfLayerEntryConfig } from '../../../map/map-schema-types';
export interface TypeSourceEsriFeatureInitialConfig extends Omit<TypeVectorSourceInitialConfig, 'format'> {
    format: 'EsriJSON';
}
export interface TypeEsriFeatureLayerEntryConfig extends Omit<TypeVectorLayerEntryConfig, 'source'> {
    source: TypeSourceEsriFeatureInitialConfig;
}
export interface TypeEsriFeatureLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: 'esriFeature';
    listOfLayerEntryConfig: TypeEsriFeatureLayerEntryConfig[];
}
/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeGeoviewLayerConfig as a TypeEsriFeatureLayerConfig if the geoviewLayerType attribute
 * of the verifyIfLayer parameter is ESRI_FEATURE. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsEsriFeature: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeEsriFeatureLayerConfig;
/** *****************************************************************************************************************************
 * Type Gard function that redefines an AbstractGeoViewLayer as an EsriFeature if the type attribute of the verifyIfGeoViewLayer
 * parameter is ESRI_FEATURE. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention
 * is valid
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewLayerIsEsriFeature: (verifyIfGeoViewLayer: AbstractGeoViewLayer) => verifyIfGeoViewLayer is EsriFeature;
/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeLayerEntryConfig as a TypeEsriFeatureLayerEntryConfig if the geoviewLayerType
 * attribute of the verifyIfGeoViewEntry.geoviewRootLayer attribute is ESRI_FEATURE. The type ascention applies only to the true
 * block of the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention
 * is valid
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewEntryIsEsriFeature: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is TypeEsriFeatureLayerEntryConfig;
/** *****************************************************************************************************************************
 * A class to add esri feature layer.
 *
 * @exports
 * @class EsriFeature
 */
export declare class EsriFeature extends AbstractGeoViewVector {
    /** ***************************************************************************************************************************
     * Initialize layer.
     *
     * @param {string} mapId The id of the map.
     * @param {TypeEsriFeatureLayerConfig} layerConfig The layer configuration.
     */
    constructor(mapId: string, layerConfig: TypeEsriFeatureLayerConfig);
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
     * This method processes recursively the metadata of each layer in the "layer list" configuration.
     *
     *  @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layers to process.
     *
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected processListOfLayerEntryMetadata(listOfLayerEntryConfig?: TypeListOfLayerEntryConfig): Promise<void>;
    /** ***************************************************************************************************************************
     * This method is used to process ESRI layers that define an ESRI group layer. These layers behave as a GeoView group layer and
     * also as a data layer (i.e. they have extent, visibility and query flag definition). ESRI group layer can be identified by
     * the presence of a esriType attribute. The attribute content is 'Group Layer', but it has no meaning. We could have decided
     * to put any other value, and it would not have had any impact on the code.
     *
     * @param {TypeVectorLayerEntryConfig} layerEntryConfig The layer entry configuration to process.
     *
     * @returns {Promise<void>} A promise that the vector layer configuration has its metadata and group layers processed.
     */
    private processEsriGroupLayer;
    /** ***************************************************************************************************************************
     * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
     * initial settings, fields and aliases).
     *
     * @param {TypeVectorLayerEntryConfig} layerEntryConfig The layer entry configuration to process.
     *
     * @returns {Promise<void>} A promise that the vector layer configuration has its metadata processed.
     */
    private processLayerMetadata;
    /** ***************************************************************************************************************************
     * This method verify if the layer is queryable and set the array of fields and aliases.
     *
     * @param {boolean} visibility The default visibility of the layer.
     * @param {TypeJsonObject} extent The layer extent.
     * @param {TypeVectorLayerEntryConfig} layerEntryConfig The vector layer entry to configure.
     */
    private processInitialSettings;
    /** ***************************************************************************************************************************
     * This method verifies if the layer is queryable and sets the outfields and aliasFields of the source feature info.
     *
     * @param {string} capabilities The capabilities that will say if the layer is queryable.
     * @param {string} nameField The display field associated to the layer.
     * @param {string} geometryFieldName The field name of the geometry property.
     * @param {TypeJsonArray} fields An array of field names and its aliases.
     * @param {TypeVectorLayerEntryConfig} layerEntryConfig The vector layer entry to configure.
     */
    private processFeatureInfoConfig;
}
