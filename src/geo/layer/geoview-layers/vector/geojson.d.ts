import { AbstractGeoViewLayer } from '../abstract-geoview-layers';
import { AbstractGeoViewVector } from './abstract-geoview-vector';
import { TypeLayerEntryConfig, TypeVectorLayerEntryConfig, TypeVectorSourceInitialConfig, TypeGeoviewLayerConfig, TypeListOfLayerEntryConfig } from '../../../map/map-schema-types';
export interface TypeSourceGeoJSONInitialConfig extends Omit<TypeVectorSourceInitialConfig, 'format'> {
    format: 'GeoJSON';
}
export interface TypeGeoJSONLayerEntryConfig extends Omit<TypeVectorLayerEntryConfig, 'source'> {
    source: TypeSourceGeoJSONInitialConfig;
}
export interface TypeGeoJSONLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: 'GeoJSON';
    listOfLayerEntryConfig: TypeGeoJSONLayerEntryConfig[];
}
/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeGeoviewLayerConfig as a TypeGeoJSONLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is GEOJSON. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsGeoJSON: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeGeoJSONLayerConfig;
/** *****************************************************************************************************************************
 * Type Gard function that redefines an AbstractGeoViewLayer as a GeoJSON if the type attribute of the verifyIfGeoViewLayer
 * parameter is GEOJSON. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewLayerIsGeoJSON: (verifyIfGeoViewLayer: AbstractGeoViewLayer) => verifyIfGeoViewLayer is GeoJSON;
/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeLayerEntryConfig as a TypeGeoJSONLayerEntryConfig if the geoviewLayerType attribute of
 * the verifyIfGeoViewEntry.geoviewRootLayer attribute is GEOJSON. The type ascention applies only to the true block of the if
 * clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewEntryIsGeoJSON: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is TypeGeoJSONLayerEntryConfig;
/** *****************************************************************************************************************************
 * Class used to add geojson layer to the map
 *
 * @exports
 * @class GeoJSON
 */
export declare class GeoJSON extends AbstractGeoViewVector {
    /** ***************************************************************************************************************************
     * Initialize layer
     *
     * @param {string} mapId the id of the map
     * @param {TypeGeoJSONLayerConfig} layerConfig the layer configuration
     */
    constructor(mapId: string, layerConfig: TypeGeoJSONLayerConfig);
    /** ***************************************************************************************************************************
     * This method reads the service metadata from the metadataAccessPath.
     *
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected getServiceMetadata(): Promise<void>;
    /** ***************************************************************************************************************************
     * This method recursively validates the layer configuration entries by filtering and reporting invalid layers. If needed,
     * extra configuration may be done here.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
     *
     * @returns {TypeListOfLayerEntryConfig} A new list of layer entries configuration with deleted error layers.
     */
    protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): TypeListOfLayerEntryConfig;
    /** ***************************************************************************************************************************
     * This method processes recursively the metadata of each layer in the list of layer configuration.
     *
     *  @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layers to process.
     *
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected processListOfLayerEntryMetadata(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): Promise<void>;
    /** ***************************************************************************************************************************
     * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
     * initial settings, fields and aliases).
     *
     * @param {TypeVectorLayerEntryConfig} layerEntryConfig The layer entry configuration to process.
     *
     * @returns {Promise<void>} A promise that the vector layer configuration has its metadata processed.
     */
    private processLayerMetadata;
}
