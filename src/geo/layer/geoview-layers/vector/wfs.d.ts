import { TypeJsonObject } from '../../../../core/types/global-types';
import { AbstractGeoViewLayer } from '../abstract-geoview-layers';
import { AbstractGeoViewVector } from './abstract-geoview-vector';
import { TypeLayerEntryConfig, TypeVectorLayerEntryConfig, TypeVectorSourceInitialConfig, TypeGeoviewLayerConfig, TypeListOfLayerEntryConfig } from '../../../map/map-schema-types';
export interface TypeSourceWFSVectorInitialConfig extends TypeVectorSourceInitialConfig {
    format: 'WFS';
}
export interface TypeWfsLayerEntryConfig extends Omit<TypeVectorLayerEntryConfig, 'source'> {
    source: TypeSourceWFSVectorInitialConfig;
}
export interface TypeWFSLayerConfig extends Omit<TypeGeoviewLayerConfig, 'geoviewLayerType' | 'geoviewLayerType'> {
    geoviewLayerType: 'ogcWfs';
    listOfLayerEntryConfig: TypeWfsLayerEntryConfig[];
}
/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeGeoviewLayerConfig as a TypeWFSLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is WFS. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsWFS: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeWFSLayerConfig;
/** *****************************************************************************************************************************
 * Type Gard function that redefines an AbstractGeoViewLayer as a WFS if the type attribute of the verifyIfGeoViewLayer parameter
 * is WFS. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewLayerIsWFS: (verifyIfGeoViewLayer: AbstractGeoViewLayer) => verifyIfGeoViewLayer is WFS;
/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeLayerEntryConfig as a TypeWfsLayerEntryConfig if the geoviewLayerType attribute of the
 * verifyIfGeoViewEntry.geoviewRootLayer attribute is WFS. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewEntryIsWFS: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is TypeWfsLayerEntryConfig;
/** *****************************************************************************************************************************
 * A class to add WFS layer.
 *
 * @exports
 * @class WFS
 */
export declare class WFS extends AbstractGeoViewVector {
    /** Feature type description obtained by the DescribeFeatureType service call. */
    featureTypeDescripion: Record<string, TypeJsonObject>;
    /** private varibale holding wfs version. */
    private version;
    /** ***************************************************************************************************************************
     * Initialize layer
     * @param {string} mapId the id of the map
     * @param {TypeWFSLayerConfig} layerConfig the layer configuration
     */
    constructor(mapId: string, layerConfig: TypeWFSLayerConfig);
    /** ***************************************************************************************************************************
     * This method reads the service metadata from the metadataAccessPath.
     *
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected getServiceMetadata(): Promise<void>;
    /** ***************************************************************************************************************************
     * This method recursively validates the configuration of the layer entries to ensure that each layer is correctly defined. If
     * necessary, additional code can be executed in the child method to complete the layer configuration.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
     *
     * @returns {TypeListOfLayerEntryConfig} A new layer configuration list with layers in error removed.
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
     * This method is used to process the layer's metadata. It will fill the empty outfields and aliasFields properties of the
     * layer's configuration.
     *
     * @param {TypeVectorLayerEntryConfig} layerEntryConfig The layer entry configuration to process.
     *
     * @returns {Promise<void>} A promise that the vector layer configuration has its metadata processed.
     */
    private processLayerMetadata;
    /** ***************************************************************************************************************************
     * This method sets the outfields and aliasFields of the source feature info.
     *
     * @param {TypeJsonArray} fields An array of field names and its aliases.
     * @param {TypeVectorLayerEntryConfig} layerEntryConfig The vector layer entry to configure.
     */
    private processFeatureInfoConfig;
}
