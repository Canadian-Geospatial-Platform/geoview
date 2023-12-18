import { Options as SourceOptions } from 'ol/source/Vector';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { TypeLayerEntryConfig, TypeVectorLayerEntryConfig, TypeVectorSourceInitialConfig, TypeGeoviewLayerConfig, TypeListOfLayerEntryConfig, TypeBaseLayerEntryConfig } from '@/geo/map/map-schema-types';
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
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeGeoJSONLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is GEOJSON. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsGeoJSON: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeGeoJSONLayerConfig;
/** *****************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as a GeoJSON if the type attribute of the verifyIfGeoViewLayer
 * parameter is GEOJSON. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewLayerIsGeoJSON: (verifyIfGeoViewLayer: AbstractGeoViewLayer) => verifyIfGeoViewLayer is GeoJSON;
/** *****************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeGeoJSONLayerEntryConfig if the geoviewLayerType attribute of
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
     * Extract the type of the specified field from the metadata. If the type can not be found, return 'string'.
     *
     * @param {string} fieldName field name for which we want to get the type.
     * @param {TypeLayerEntryConfig} layerConfig layer configuration.
     *
     * @returns {'string' | 'date' | 'number'} The type of the field.
     */
    protected getFieldType(fieldName: string, layerConfig: TypeLayerEntryConfig): 'string' | 'date' | 'number';
    /** ***************************************************************************************************************************
     * This method recursively validates the layer configuration entries by filtering and reporting invalid layers. If needed,
     * extra configuration may be done here.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
     */
    protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): void;
    /** ***************************************************************************************************************************
     * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
     * initial settings, fields and aliases).
     *
     * @param {TypeVectorLayerEntryConfig} layerConfig The layer entry configuration to process.
     *
     * @returns {Promise<void>} A promise that the vector layer configuration has its metadata processed.
     */
    protected processLayerMetadata(layerConfig: TypeVectorLayerEntryConfig): Promise<void>;
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
