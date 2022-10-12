import { Vector as VectorSource } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/Vector';
import { Geometry } from 'ol/geom';
import { ReadOptions } from 'ol/format/Feature';
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { AbstractGeoViewLayer } from '../abstract-geoview-layers';
import { TypeBaseLayerEntryConfig, TypeListOfLayerEntryConfig } from '../../../map/map-schema-types';
import { TypeFeatureInfoResult, TypeQueryType } from '../../../../api/events/payloads/get-feature-info-payload';
export declare type TypeVectorLayerGroup = LayerGroup;
export declare type TypeVectorLayer = VectorSource<Geometry>;
export declare type TypeBaseVectorLayer = BaseLayer | TypeVectorLayerGroup | TypeVectorLayer;
/** ******************************************************************************************************************************
 * The AbstractGeoViewVector class is a direct descendant of AbstractGeoViewLayer. As its name indicates, it is used to
 * instanciate GeoView vector layers. It inherits from its parent class an attribute named gvLayers where the vector elements
 * of the class will be kept.
 *
 * The gvLayers attribute has a hierarchical structure. Its data type is TypetBaseVectorLayer. Subclasses of this type
 * are TypeVectorLayerGroup and TypeVectorLayer. The TypeVectorLayerGroup is a collection of TypetBaseVectorLayer. It is
 * important to note that a TypetBaseVectorLayer attribute can polymorphically refer to a TypeVectorLayerGroup or a
 * TypeVectorLayer. Here, we must not confuse instantiation and declaration of a polymorphic attribute.
 *
 * All leaves of the tree structure stored in the gvLayers attribute must be of type TypeVectorLayer. This is where the
 * features are placed and can be considered as a feature group.
 */
export declare abstract class AbstractGeoViewVector extends AbstractGeoViewLayer {
    /** ***************************************************************************************************************************
     * This method reads the service metadata from the metadataAccessPath.
     *
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected abstract getServiceMetadata(): Promise<void>;
    /** ***************************************************************************************************************************
     * This method recursively validates the configuration of the layer entries to ensure that each layer is correctly defined. If
     * necessary, additional code can be executed in the child method to complete the layer configuration.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
     *
     * @returns {TypeListOfLayerEntryConfig} A new layer configuration list with layers in error removed.
     */
    protected abstract validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): TypeListOfLayerEntryConfig;
    /** ***************************************************************************************************************************
     * This method processes recursively the metadata of each layer in the list of layer configuration.
     *
     *  @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layers to process.
     *
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected abstract processListOfLayerEntryMetadata(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): Promise<void>;
    /** ***************************************************************************************************************************
     * This method creates a GeoView layer using the definition provided in the layerEntryConfig parameter.
     *
     * @param {TypeLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
     *
     * @returns {Promise<BaseLayer | null>} The GeoView base layer that has been created.
     */
    protected processOneLayerEntry(layerEntryConfig: TypeBaseLayerEntryConfig): Promise<BaseLayer | null>;
    /** ***************************************************************************************************************************
     * Create a source configuration for the vector layer.
     *
     * @param {TypeBaseLayerEntryConfig} layerEntryConfig The layer entry configuration.
     *
     * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
     */
    protected createVectorSource(layerEntryConfig: TypeBaseLayerEntryConfig, sourceOptions?: SourceOptions, readOptions?: ReadOptions): VectorSource<Geometry>;
    /** ***************************************************************************************************************************
     * Create a vector layer. The layer has in its properties a reference to the layer entry configuration used at creation time.
     * The layer entry configuration keeps a reference to the layer in the gvLayer attribute.
     *
     * @param {TypeBaseLayerEntryConfig} layerEntryConfig The layer entry configuration used by the source.
     * @param {VectorSource<Geometry>} vectorSource The source configuration for the vector layer.
     *
     * @returns {VectorLayer<VectorSource>} The vector layer created.
     */
    private createVectorLayer;
    private formatFeatureInfoResult;
    /** ***************************************************************************************************************************
     * Return feature information for all the features stored in the layer.
     *
     * @param {string} layerId Optional layer identifier. If undefined, this.activeLayer is used.
     *
     * @returns {TypeFeatureInfoResult} The feature info table.
     */
    getAllFeatureInfo(layerId?: string): TypeFeatureInfoResult;
    /** ***************************************************************************************************************************
     * Return feature information for all the features stored in the layer.
     *
     * @param {Pixel | Coordinate | Coordinate[]} location A pixel, a coordinate or a polygon that will be used by the query.
     * @param {string} layerId Optional layer identifier. If undefined, this.activeLayer is used.
     * @param {TypeQueryType} queryType Optional query type, default value is 'at pixel'.
     *
     * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
     */
    getFeatureInfo(location: Pixel | Coordinate | Coordinate[], layerId?: string, queryType?: TypeQueryType): Promise<TypeFeatureInfoResult>;
}
