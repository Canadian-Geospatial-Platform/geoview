import { Vector as VectorSource } from 'ol/source';
import { Geometry } from 'ol/geom';
import BaseLayer from 'ol/layer/Base';
import { Coordinate } from 'ol/coordinate';
import LayerGroup from 'ol/layer/Group';
import { Extent } from 'ol/extent';
import { Pixel } from 'ol/pixel';
import { AbstractGeoViewLayer } from '../abstract-geoview-layers';
import { TypeBaseVectorLayerEntryConfig, TypeListOfLayerEntryConfig, TypeLocalizedString, TypeStyleConfig, TypeVectorLayerEntryConfig } from '../../../map/map-schema-types';
import { TypeFeatureInfoResult, TypeQueryType } from '../../../../api/events/payloads/get-feature-info-payload';
import { TypeJsonObject } from '../../../../core/types/global-types';
export declare type TypeVectorLayerGroup = LayerGroup;
export declare type TypeVectorLayer = VectorSource<Geometry>;
export declare type TypeBaseVectorLayer = BaseLayer | TypeVectorLayerGroup | TypeVectorLayer;
export declare type TypeVectorLegend = {
    layerId: string;
    layerName: TypeLocalizedString;
    legend: TypeStyleConfig;
};
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
    metadata: TypeJsonObject | null;
    /** Attribution used in the OpenLayer source. */
    attributions: string[];
    /** ***************************************************************************************************************************
     * This method is used to create the layers specified in the listOfLayerEntryConfig attribute inherited from its parent.
     * Normally, it is the second method called in the life cycle of a GeoView layer, the first one being the constructor.
     * Its code is the same for all child classes. It must first validate that the gvLayers attribute is null indicating
     * that the method has never been called before. If this is not the case, an error message must be sent. Then, it calls the
     * abstract method getAdditionalServiceDefinition. For example, when the child is a WFS service, this method executes the
     * GetCapabilities request and saves the result in the metadata attribute of the class. It also process the layer's metadata
     * for each layer in the listOfLayerEntryConfig tree in order to define the missing pieces of the layer's configuration.
     * Layer's configuration can come from the configuration of the GeoView layer or from the information saved by the method
     * processListOfLayerEntryMetadata, priority being given to the first of the two. When the GeoView layer does not have a
     * service definition, the getAdditionalServiceDefinition method does nothing.
     *
     * Finally, the processListOfLayerEntryConfig is called to instantiate each layer identified by the listOfLayerEntryConfig
     * attribute. This method will also register the layers to all panels that offer this possibility. For example, if a layer is
     * queryable, it will subscribe to the details-panel and every time the user clicks on the map, the panel will ask the layer
     * to return the descriptive information of all the features in a tolerance radius. This information will be used to populate
     * the details-panel.
     */
    createGeoViewVectorLayers(): Promise<void>;
    /** ***************************************************************************************************************************
     * This method reads from the metadataAccessPath additional information to complete the GeoView layer configuration.
     * If the GeoView layer does not have a service definition, this method does nothing.
     */
    private getAdditionalServiceDefinition;
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
     * Process recursively the list of layer Entries to create the layers and the layer groups.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries to process.
     *
     * @returns {Promise<TypeBaseVectorLayer | null>} The promise that the layers were created.
     */
    private processListOfLayerEntryConfig;
    /** ***************************************************************************************************************************
     * This method creates a GeoView layer using the definition provided in the layerEntryConfig parameter.
     *
     * @param {TypeLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
     *
     * @returns {TypeBaseVectorLayer} The GeoView vector layer that has been created.
     */
    processOneLayerEntry(layerEntryConfig: TypeBaseVectorLayerEntryConfig): Promise<TypeBaseVectorLayer | null>;
    /** ***************************************************************************************************************************
     * Create a source configuration for the vector layer.
     *
     * @param {TypeBaseVectorLayerEntryConfig} layerEntryConfig The layer entry configuration.
     *
     * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
     */
    private createVectorSource;
    /** ***************************************************************************************************************************
     * Create a vector layer. The layer has in its properties a reference to the layer entry configuration used at creation time.
     * The layer entry configuration keeps a reference to the layer in the gvLayer attribute.
     *
     * @param {TypeBaseVectorLayerEntryConfig} layerEntryConfig The layer entry configuration used by the source.
     * @param {VectorSource<Geometry>} vectorSource The source configuration for the vector layer.
     *
     * @returns {VectorLayer<VectorSource>} The vector layer created.
     */
    private createVectorLayer;
    /** ***************************************************************************************************************************
     * Return the extent of the layer or undefined if it will be visible regardless of extent. The layer extent is an array of
     * numbers representing an extent: [minx, miny, maxx, maxy]. If no layer identifier is specified, the activeLayer of the class
     * will be used. This routine return undefined when the layerId specified is not found or when the layerId is undefined and
     * the active layer is null.
     *
     * @param {string} layerId Optional layer identifier.
     *
     * @returns {Extent} The layer extent.
     */
    getBounds(layerId?: string): Extent | undefined;
    /** ***************************************************************************************************************************
     * set the extent of the layer. Use undefined if it will be visible regardless of extent. The layer extent is an array of
     * numbers representing an extent: [minx, miny, maxx, maxy]. If no layer identifier is specified, the activeLayer of the class
     * will be used. This routine does nothing when the layerId specified is not found or when the layerId is undefined and the
     * active layer is null.
     *
     * @param {Extent} layerExtent The extent to assign to the layer.
     * @param {string} layerId Optional layer identifier.
     */
    setBounds(layerExtent: Extent, layerId?: string): void;
    /** ***************************************************************************************************************************
     * Return the opacity of the layer (between 0 and 1). If no layer identifier is specified, the activeLayer of the class
     * will be used. This routine return undefined when the layerId specified is not found or when the layerId is undefined and
     * the active layer is null.
     *
     * @param {string} layerId Optional layer identifier.
     *
     * @returns {number} The opacity of the layer.
     */
    getOpacity(layerId?: string): number | undefined;
    /** ***************************************************************************************************************************
     * Set the opacity of the layer (between 0 and 1). If no layer identifier is specified, the activeLayer of the class
     * will be used. This routine does nothing when the layerId specified is not found or when the layerId is undefined and the
     * active layer is null.
     *
     * @param {number} layerOpacity The opacity of the layer.
     * @param {string} layerId Optional layer identifier.
     *
     */
    setOpacity(layerOpacity: number, layerId?: string): void;
    /** ***************************************************************************************************************************
     * Return the visibility of the layer (true or false). If no layer identifier is specified, the activeLayer of the class
     * will be used. This routine return undefined when the layerId specified is not found or when the layerId is undefined and
     * the active layer is null.
     *
     * @param {string} layerId Optional layer identifier.
     *
     * @returns {boolean} The visibility of the layer.
     */
    getVisible(layerId?: string): boolean | undefined;
    /** ***************************************************************************************************************************
     * Set the visibility of the layer (true or false). If no layer identifier is specified, the activeLayer of the class
     * will be used. This routine does nothing when the layerId specified is not found or when the layerId is undefined and the
     * active layer is null.
     *
     * @param {boolean} layerVisibility The visibility of the layer.
     * @param {string} layerId Optional layer identifier.
     */
    setVisible(layerVisibility: boolean, layerId?: string): void;
    /** ***************************************************************************************************************************
     * Return the legend of the layer. If no layer identifier is specified, the activeLayer of the class will be used. This routine
     * returns null when the layerId specified is not found or when the layerId is undefined and the active layer is null or the
     * configuration's style is undefined.
     *
     * @param {string} layerId Optional layer identifier.
     *
     * @returns {TypeVectorLegend | null} The legend of the layer.
     */
    getLegend(layerId?: string): TypeVectorLegend | null;
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
    /** ***************************************************************************************************************************
     * This method register the GeoView layer to panels that offer this possibility.
     *
     * @param {TypeBaseVectorLayerEntryConfig} layerEntryConfig The layer entry to register.
     */
    protected registerToPanels(layerEntryConfig: TypeBaseVectorLayerEntryConfig): void;
    /** ***************************************************************************************************************************
     * Utility method use to add an entry to the outfields or aliasFields attribute of the layerEntryConfig.source.featureInfo.
     *
     * @param {TypeVectorLayerEntryConfig} layerEntryConfig The layer entry configuration that contains the source.featureInfo.
     * @param {outfields' | 'aliasFields} fieldName The field name to update.
     * @param {string} fieldValue The value to append to the field name.
     * @param {number} prefixEntryWithComa flag (0 = false) indicating that we must prefix the entry with a ','
     */
    protected addFieldEntryToSourceFeatureInfo: (layerEntryConfig: TypeVectorLayerEntryConfig, fieldName: 'outfields' | 'aliasFields', fieldValue: string, prefixEntryWithComa: number) => void;
}
