import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { Extent } from 'ol/extent';
import { TypeJsonObject } from '@/core/types/global-types';
import { AbstractGeoViewLayer, TypeLegend } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { TypeLayerEntryConfig, TypeGeoviewLayerConfig, TypeListOfLayerEntryConfig, TypeBaseLayerEntryConfig, TypeOgcWmsLayerEntryConfig } from '@/geo/map/map-schema-types';
import { TypeArrayOfFeatureInfoEntries } from '@/api/events/payloads';
export interface TypeWMSLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: 'ogcWms';
    listOfLayerEntryConfig: TypeOgcWmsLayerEntryConfig[];
}
/** *****************************************************************************************************************************
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeWMSLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is WMS. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsWMS: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeWMSLayerConfig;
/** *****************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as a WMS if the type attribute of the verifyIfGeoViewLayer
 * parameter is WMS. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewLayerIsWMS: (verifyIfGeoViewLayer: AbstractGeoViewLayer) => verifyIfGeoViewLayer is WMS;
/** *****************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeOgcWmsLayerEntryConfig if the geoviewLayerType attribute of the
 * verifyIfGeoViewEntry.geoviewLayerConfig attribute is WMS. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewEntryIsWMS: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is TypeOgcWmsLayerEntryConfig;
/** *****************************************************************************************************************************
 * A class to add wms layer.
 *
 * @exports
 * @class WMS
 */
export declare class WMS extends AbstractGeoViewRaster {
    WMSStyles: string[];
    /** ***************************************************************************************************************************
     * Initialize layer
     * @param {string} mapId the id of the map
     * @param {TypeWMSLayerConfig} layerConfig the layer configuration
     */
    constructor(mapId: string, layerConfig: TypeWMSLayerConfig);
    /** ***************************************************************************************************************************
     * This method reads the service metadata from the metadataAccessPath.
     *
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected fetchServiceMetadata(): Promise<void>;
    /** ***************************************************************************************************************************
     * This method reads the service metadata using a GetCapabilities request.
     *
     * @param {string} metadataUrl The GetCapabilities query to execute
     *
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    private getServiceMetadata;
    /** ***************************************************************************************************************************
     * This method reads the service metadata from a XML metadataAccessPath.
     *
     * @param {string} metadataUrl The localized value of the metadataAccessPath
     *
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    private fetchXmlServiceMetadata;
    /** ***************************************************************************************************************************
     * This method find the layer path that lead to the layer identified by the layerName. Values stored in the array tell us which
     * direction to use to get to the layer. A value of -1 tells us that the Layer property is an object. Other values tell us that
     * the Layer property is an array and the value is the index to follow. If the layer can not be found, the returned value is
     * an empty array.
     *
     * @param {string} layerName The layer name to be found
     * @param {TypeJsonObject} layerProperty The layer property from the metadata
     * @param {number[]} pathToTheLayerProperty The path leading to the parent of the layerProperty parameter
     *
     * @returns {number[]} An array containing the path to the layer or [] if not found.
     */
    private getMetadataLayerPath;
    /** ***************************************************************************************************************************
     * This method merge the layer identified by the path stored in the metadataLayerPathToAdd array to the metadata property of
     * the WMS instance. Values stored in the path array tell us which direction to use to get to the layer. A value of -1 tells us
     * that the Layer property is an object. In this case, it is assumed that the metadata objects at this level only differ by the
     * layer property to add. Other values tell us that the Layer property is an array and the value is the index to follow. If at
     * this level in the path the layers have the same name, we move to the next level. Otherwise, the layer can be added.
     *
     * @param {number[]} metadataLayerPathToAdd The layer name to be found
     * @param {TypeJsonObject | undefined} metadataLayer The metadata layer that will receive the new layer
     * @param {TypeJsonObject} layerToAdd The layer property to add
     */
    private addLayerToMetadataInstance;
    /** ***************************************************************************************************************************
     * This method reads the layer identifiers from the configuration to create an array that will be used in the GetCapabilities.
     *
     * @returns {TypeLayerEntryConfig[]} The array of layer configurations.
     */
    private getLayersToQuery;
    /** ***************************************************************************************************************************
     * This method propagate the WMS metadata inherited values.
     *
     * @param {TypeJsonObject} parentLayer The parent layer that contains the inherited values
     * @param {TypeJsonObject | undefined} layer The layer property from the metadata that will inherit the values
     */
    private processMetadataInheritance;
    /** ***************************************************************************************************************************
     * This method recursively validates the configuration of the layer entries to ensure that each layer is correctly defined.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
     */
    protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): void;
    /** ***************************************************************************************************************************
     * This method create recursively dynamic group layers from the service metadata.
     *
     * @param {TypeJsonObject} layer The dynamic group layer metadata.
     * @param {TypeBaseLayerEntryConfig} layerConfig The layer configurstion associated to the dynamic group.
     */
    private createGroupLayer;
    /** ****************************************************************************************************************************
     * This method search recursively the layerId in the layer entry of the capabilities.
     *
     * @param {string} layerId The layer identifier that must exists on the server.
     * @param {TypeJsonObject | undefined} layer The layer entry from the capabilities that will be searched.
     *
     * @returns {TypeJsonObject | null} The found layer from the capabilities or null if not found.
     */
    private getLayerMetadataEntry;
    /** ****************************************************************************************************************************
     * This method creates a GeoView WMS layer using the definition provided in the layerConfig parameter.
     *
     * @param {TypeBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
     *
     * @returns {TypeBaseRasterLayer | null} The GeoView raster layer that has been created.
     */
    protected processOneLayerEntry(layerConfig: TypeBaseLayerEntryConfig): Promise<TypeBaseRasterLayer | null>;
    /** ***************************************************************************************************************************
     * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
     * initial settings, fields and aliases).
     *
     * @param {TypeLayerEntryConfig} layerConfig The layer entry configuration to process.
     *
     * @returns {Promise<TypeLayerEntryConfig>} A promise that the layer configuration has its metadata processed.
     */
    protected processLayerMetadata(layerConfig: TypeLayerEntryConfig): Promise<TypeLayerEntryConfig>;
    /** ***************************************************************************************************************************
     * This method will create a Geoview temporal dimension if it existds in the service metadata
     * @param {TypeJsonObject} wmsTimeDimension The WMS time dimension object
     * @param {TypeOgcWmsLayerEntryConfig} layerConfig The layer entry to configure
     */
    protected processTemporalDimension(wmsTimeDimension: TypeJsonObject, layerConfig: TypeOgcWmsLayerEntryConfig): void;
    /** ***************************************************************************************************************************
     * Return feature information for all the features around the provided Pixel.
     *
     * @param {Coordinate} location The pixel coordinate that will be used by the query.
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
     */
    protected getFeatureInfoAtPixel(location: Pixel, layerPath: string): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features around the provided projection coordinate.
     *
     * @param {Coordinate} location The coordinate that will be used by the query.
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The promised feature info table.
     */
    protected getFeatureInfoAtCoordinate(location: Coordinate, layerPath: string): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features around the provided coordinate.
     *
     * @param {Coordinate} lnglat The coordinate that will be used by the query.
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The promised feature info table.
     */
    protected getFeatureInfoAtLongLat(lnglat: Coordinate, layerPath: string): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Get the legend image URL of a layer from the capabilities. Return null if it does not exist.
     *
     * @param {TypeOgcWmsLayerEntryConfig} layerConfig layer configuration.
     * @param {string} style the style to get the url for
     *
     * @returns {TypeJsonObject | null} URL of a Legend image in png format or null
     */
    private getLegendUrlFromCapabilities;
    /** ***************************************************************************************************************************
     * Get the legend image of a layer.
     *
     * @param {TypeOgcWmsLayerEntryConfig} layerConfig layer configuration.
     * @param {striung} chosenStyle Style to get the legend image for.
     *
     * @returns {blob} image blob
     */
    private getLegendImage;
    /** ***************************************************************************************************************************
     * Get the legend info of a style.
     *
     * @param {TypeOgcWmsLayerEntryConfig} layerConfig layer configuration.
     * @param {number} position index number of style to get
     *
     * @returns {Promise<TypeWmsLegendStylel>} The legend of the style.
     */
    private getStyleLegend;
    /** ***************************************************************************************************************************
     * Return the legend of the layer. This routine return null when the layerPath specified is not found. If the legend can't be
     * read, the legend property of the object returned will be null.
     *
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
     */
    getLegend(layerPath: string): Promise<TypeLegend | null>;
    /** ***************************************************************************************************************************
     * Translate the get feature information result set to the TypeArrayOfFeatureInfoEntries used by GeoView.
     *
     * @param {TypeJsonObject} featureMember An object formatted using the query syntax.
     * @param {TypeOgcWmsLayerEntryConfig} layerConfig The layer configuration.
     * @param {Coordinate} clickCoordinate The coordinate where the user has clicked.
     *
     * @returns {TypeArrayOfFeatureInfoEntries} The feature info table.
     */
    private formatWmsFeatureInfoResult;
    /** ***************************************************************************************************************************
     * Return the attribute of an object that ends with the specified ending string or null if not found.
     *
     * @param {TypeJsonObject} jsonObject The object that is supposed to have the needed attribute.
     * @param {string} attribute The attribute searched.
     *
     * @returns {TypeJsonObject | undefined} The promised feature info table.
     */
    private getAttribute;
    /** ***************************************************************************************************************************
     * Set the style to be used by the wms layer. This methode does nothing if the layer path can't be found.
     *
     * @param {string} wmsStyleId The style identifier that will be used.
     * @param {string} layerPath The layer path to the layer's configuration.
     */
    setWmsStyle(wmsStyleId: string, layerPath: string): void;
    /** ***************************************************************************************************************************
     * Apply a view filter to the layer identified by the path stored in the layerPathAssociatedToTheGeoviewLayer property stored
     * in the layer instance associated to the map. The legend filters are derived from the uniqueValue or classBreaks style of the
     * layer. When the layer config is invalid, nothing is done.
     *
     * @param {string} filter An optional filter to be used in place of the getViewFilter value.
     * @param {never} notUsed1 This parameter must not be provided. It is there to allow overloading of the method signature.
     * @param {never} notUsed2 This parameter must not be provided. It is there to allow overloading of the method signature.
     */
    applyViewFilter(filter: string, notUsed1?: never, notUsed2?: never): void;
    /** ***************************************************************************************************************************
     * Apply a view filter to the layer identified by the path stored in the layerPathAssociatedToTheGeoviewLayer property stored
     * in the layer instance associated to the map. When the CombineLegendFilter flag is false, the filter paramater is used alone
     * to display the features. Otherwise, the legend filter and the filter parameter are combined together to define the view
     * filter. The legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is
     * invalid, nothing is done.
     *
     * @param {string} filter An optional filter to be used in place of the getViewFilter value.
     * @param {boolean} CombineLegendFilter Flag used to combine the legend filter and the filter together (default: true)
     * @param {never} notUsed This parameter must not be provided. It is there to allow overloading of the method signature.
     */
    applyViewFilter(filter: string, CombineLegendFilter: boolean, notUsed?: never): void;
    /** ***************************************************************************************************************************
     * Apply a view filter to the layer. When the CombineLegendFilter flag is false, the filter paramater is used alone to display
     * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
     * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
     * is done.
     * TODO ! The combination of the legend filter and the dimension filter probably does not apply to WMS. The code can be simplified.
     *
     * @param {string} layerPath The layer path to the layer's configuration.
     * @param {string} filter An optional filter to be used in place of the getViewFilter value.
     * @param {boolean} CombineLegendFilter Flag used to combine the legend filter and the filter together (default: true)
     */
    applyViewFilter(layerPath: string, filter?: string, CombineLegendFilter?: boolean): void;
    /** ***************************************************************************************************************************
     * Get the bounds of the layer represented in the layerConfig pointed to by the cached layerPath, returns updated bounds
     *
     * @param {Extent | undefined} bounds The current bounding box to be adjusted.
     * @param {never} notUsed This parameter must not be provided. It is there to allow overloading of the method signature.
     *
     * @returns {Extent} The new layer bounding box.
     */
    protected getBounds(bounds: Extent, notUsed?: never): Extent | undefined;
    /** ***************************************************************************************************************************
     * Get the bounds of the layer represented in the layerConfig pointed to by the layerPath, returns updated bounds
     *
     * @param {string} layerPath The Layer path to the layer's configuration.
     * @param {Extent | undefined} bounds The current bounding box to be adjusted.
     *
     * @returns {Extent} The new layer bounding box.
     */
    protected getBounds(layerPath: string, bounds?: Extent): Extent | undefined;
}
