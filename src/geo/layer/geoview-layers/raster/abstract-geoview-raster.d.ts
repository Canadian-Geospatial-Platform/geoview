import BaseLayer from 'ol/layer/Base';
import { AbstractGeoViewLayer } from '../abstract-geoview-layers';
import { TypeLayerEntryConfig } from '../../../map/map-schema-types';
/** *****************************************************************************************************************************
 * AbstractGeoViewRaster types
 */
export declare type TypeBaseRasterLayer = BaseLayer;
/** *****************************************************************************************************************************
 * The AbstractGeoViewRaster class is a direct descendant of AbstractGeoViewLayer. As its name indicates, it is used to
 * instanciate GeoView raster layers. In addition to the components of the parent class, there is an attribute named
 * gvLayers where the raster elements of the class will be kept.
 *
 * The gvLayers attribute has a hierarchical structure. Its data type is TypetBaseRasterLayer. Subclasses of this type
 * are TypeRasterLayerGroup and TypeRasterLayer. The TypeRasterLayerGroup is a collection of TypetBaseRasterLayer. It is
 * important to note that a TypetBaseRasterLayer attribute can polymorphically refer to a TypeRasterLayerGroup or a
 * TypeRasterLayer. Here, we must not confuse instantiation and declaration of a polymorphic attribute.
 *
 * All leaves of the structure stored in the gvLayers attribute must be of type TypeRasterLayer. This is where the
 * features are placed.
 */
export declare abstract class AbstractGeoViewRaster extends AbstractGeoViewLayer {
    /**
     * This method is used to create the layers specified in the listOfLayerEntryConfig attribute inherited from its parent.
     * Normally, it is the second method called in the life cycle of a GeoView layer, the first one being the constructor.
     * Its code is the same for all child classes. It must first validate that the gvLayers attribute is null indicating
     * that the method has never been called before. If this is not the case, an error message must be sent. Then, it calls the
     * abstract method getAdditionalServiceDefinition. If the GeoView layer does not have a service definition, this method does
     * nothing. For example, when the child is a WMS service, this method executes the GetCapabilities request and saves the
     * result in an attribute of the class.
     *
     * The next operation is to instantiate each layer identified by the listOfLayerEntryConfig attribute. This is done using the
     * abstract method processOneLayerEntry. Then, a renderer is assigned to the newly created layer. The definition of the
     * renderers can come from the configuration of the GeoView layer or from the information saved by the method
     * getAdditionalServiceDefinition, priority being given to the first of the two. This operation is done by the abstract
     * method processLayerMetadata. Note that if field aliases are used, they will be set at the same time as the renderer.
     *
     * Finally, the layer registers to all panels that offer this possibility. For example, if the layer is query able, it could
     * subscribe to the details-panel and every time the user clicks on the map, the panel will ask the layer to return the
     * descriptive information of all the features in a tolerance radius. This information will be used to populate the
     * details-panel.
     *
     * @returns {Promise<void>} The promise that the code was executed.
     */
    createGeoViewRasterLayers(): Promise<void>;
    /** ***************************************************************************************************************************
     * Process recursively the list of layer Entries to create the layers and the layer groups.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries to process.
     *
     * @returns {Promise<BaseLayer | null>} The promise that the layers were created.
     */
    private processListOfLayerEntryConfig;
    /**
     * This method reads from the metadataAccessPath additional information to complete the GeoView layer configuration.
     * If the GeoView layer does not have a service definition, this method does nothing.
     */
    abstract getAdditionalServiceDefinition(): Promise<void>;
    /**
     * This method creates a GeoView layer using the definition provided in the layerEntryConfig parameter.
     *
     * @param {TypeLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
     *
     * @returns {TypeBaseRasterLayer} The GeoView raster layer that has been created.
     */
    abstract processOneLayerEntry(layerEntryConfig: TypeLayerEntryConfig): Promise<TypeBaseRasterLayer | null>;
    /**
     * This method associate a renderer to the GeoView layer.
     *
     * @param {TypeBaseRasterLayer} rasterLayer The GeoView layer associated to the renderer.
     */
    abstract processLayerMetadata(rasterLayer: TypeBaseRasterLayer): void;
    /**
     * This method register the GeoView layer to panels that offer this possibility.
     *
     * @param {TypeBaseRasterLayer} rasterLayer The GeoView layer who wants to register.
     */
    abstract registerToPanels(rasterLayer: TypeBaseRasterLayer): void;
}
