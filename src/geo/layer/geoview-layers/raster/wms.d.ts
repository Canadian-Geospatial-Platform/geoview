import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { Extent } from 'ol/extent';
import { TypeJsonObject } from '../../../../core/types/global-types';
import { AbstractGeoViewLayer, TypeLegend } from '../abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from './abstract-geoview-raster';
import { TypeLayerEntryConfig, TypeGeoviewLayerConfig, TypeListOfLayerEntryConfig, TypeBaseLayerEntryConfig, TypeOgcWmsLayerEntryConfig } from '../../../map/map-schema-types';
import { TypeArrayOfFeatureInfoEntries } from '../../../../api/events/payloads/get-feature-info-payload';
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
 * verifyIfGeoViewEntry.geoviewRootLayer attribute is WMS. The type ascention applies only to the true block of
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
    protected getServiceMetadata(): Promise<void>;
    /** ***************************************************************************************************************************
     * This method reads the service metadata using a GetCapabilities request.
     *
     * @param {string} metadataUrl The GetCapabilities query to execute
     *
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    private fetchServiceMetadata;
    /** ***************************************************************************************************************************
     * This method reads the service metadata from a XML metadataAccessPath.
     *
     * @param {string} metadataUrl The localized value of the metadataAccessPath
     *
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    private getXmlServiceMetadata;
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
     * @returns {string[]} The array of layer identifiers.
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
     *
     * @returns {TypeListOfLayerEntryConfig} A new layer configuration list with layers in error removed.
     */
    protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): TypeListOfLayerEntryConfig;
    /** ***************************************************************************************************************************
     * This method create recursively dynamic group layers from the service metadata.
     *
     * @param {TypeJsonObject} layer The dynamic group layer metadata.
     * @param {TypeLayerEntryConfig} layerEntryConfig The layer configurstion associated to the dynamic group.
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
     * This method creates a GeoView WMS layer using the definition provided in the layerEntryConfig parameter.
     *
     * @param {TypeBaseLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
     *
     * @returns {TypeBaseRasterLayer | null} The GeoView raster layer that has been created.
     */
    processOneLayerEntry(layerEntryConfig: TypeBaseLayerEntryConfig): Promise<TypeBaseRasterLayer | null>;
    /** ***************************************************************************************************************************
     * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
     * initial settings, fields and aliases).
     *
     * @param {TypeLayerEntryConfig} layerEntryConfig The layer entry configuration to process.
     *
     * @returns {Promise<void>} A promise that the layer configuration has its metadata processed.
     */
    protected processLayerMetadata(layerEntryConfig: TypeLayerEntryConfig): Promise<void>;
    /** ***************************************************************************************************************************
     * This method will create a Geoview temporal dimension if ot exist in the service metadata
     * @param {TypeJsonObject} wmsTimeDimension The WMS time dimension object
     * @param {TypeOgcWmsLayerEntryConfig} layerEntryConfig The layer entry to configure
     */
    private processTemporalDimension;
    /** ***************************************************************************************************************************
     * Return feature information for all the features around the provided Pixel.
     *
     * @param {Coordinate} location The pixel coordinate that will be used by the query.
     * @param {TypeOgcWmsLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
     */
    protected getFeatureInfoAtPixel(location: Pixel, layerConfig: TypeOgcWmsLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features around the provided projection coordinate.
     *
     * @param {Coordinate} location The coordinate that will be used by the query.
     * @param {TypeOgcWmsLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The promised feature info table.
     */
    protected getFeatureInfoAtCoordinate(location: Coordinate, layerConfig: TypeOgcWmsLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features around the provided coordinate.
     *
     * @param {Coordinate} lnglat The coordinate that will be used by the query.
     * @param {TypeOgcWmsLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The promised feature info table.
     */
    protected getFeatureInfoAtLongLat(lnglat: Coordinate, layerConfig: TypeOgcWmsLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features in the provided bounding box.
     *
     * @param {Coordinate} location The coordinate that will be used by the query.
     * @param {TypeOgcWmsLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
     */
    protected getFeatureInfoUsingBBox(location: Coordinate[], layerConfig: TypeOgcWmsLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features in the provided polygon.
     *
     * @param {Coordinate} location The coordinate that will be used by the query.
     * @param {TypeOgcWmsLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
     */
    protected getFeatureInfoUsingPolygon(location: Coordinate[], layerConfig: TypeOgcWmsLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Get the legend image URL of a layer from the capabilities. Return null if it does not exist.
     *
     * @param {TypeOgcWmsLayerEntryConfig} layerConfig layer configuration.
     *
     * @returns {TypeJsonObject | null} URL of a Legend image in png format or null
     */
    private getLegendUrlFromCapabilities;
    /** ***************************************************************************************************************************
     * Get the legend image of a layer.
     *
     * @param {TypeOgcWmsLayerEntryConfig} layerConfig layer configuration.
     *
     * @returns {blob} image blob
     */
    private getLegendImage;
    /** ***************************************************************************************************************************
     * Return the legend of the layer. When layerPathOrConfig is undefined, the activeLayer of the class is used. This routine
     * return null when the layerPath specified is not found or when the layerPathOrConfig is undefined and the active layer
     * is null or the selected layerConfig is undefined or null.
     *
     * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
     *
     * @returns {Promise<TypeLegend | null>} The legend of the layer.
     */
    getLegend(layerPathOrConfig?: string | TypeLayerEntryConfig | null): Promise<TypeLegend | null>;
    /** ***************************************************************************************************************************
     * Translate the get feature information result set to the TypeArrayOfFeatureInfoEntries used by GeoView.
     *
     * @param {TypeJsonObject} featureMember An object formatted using the query syntax.
     * @param {TypeOgcWmsLayerEntryConfig} layerEntryConfig The layer configuration.
     * @param {Coordinate} clickCoordinate The coordinate where the user has clicked.
     *
     * @returns {TypeArrayOfFeatureInfoEntries} The feature info table.
     */
    formatWmsFeatureInfoResult(featureMember: TypeJsonObject, layerEntryConfig: TypeOgcWmsLayerEntryConfig, clickCoordinate: Coordinate): TypeArrayOfFeatureInfoEntries;
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
     * Return the attribute of an object that ends with the specified ending string or null if not found.
     *
     * @param {TypeJsonObject} jsonObject The object that is supposed to have the needed attribute.
     * @param {string} attribute The attribute searched.
     *
     * @returns {TypeJsonObject | undefined} The promised feature info table.
     */
    setStyle(StyleId: string, layerPathOrConfig?: string | TypeLayerEntryConfig | null): void;
    /** ***************************************************************************************************************************
     * Apply a view filter to the layer. When the filter parameter is not empty (''), the view filter does not use the legend
     * filter. Otherwise, the getViewFilter method is used to define the view filter and the resulting filter is
     * (legend filters) and (layerFilter). The legend filters are derived from the uniqueValue or classBreaks style of the layer.
     * When the layer config is invalid, nothing is done.
     *
     * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
     * @param {string} filter An optional filter to be used in place of the getViewFilter value.
     */
    applyViewFilter(layerPathOrConfig?: string | TypeLayerEntryConfig | null, filter?: string): void;
    /** ***************************************************************************************************************************
     * Compute the layer bounds or undefined if the result can not be obtained from the feature extents that compose the layer. If
     * layerPathOrConfig is undefined, the active layer is used. If projectionCode is defined, returns the bounds in the specified
     * projection otherwise use the map projection. The bounds are different from the extent. They are mainly used for display
     * purposes to show the bounding box in which the data resides and to zoom in on the entire layer data. It is not used by
     * openlayer to limit the display of data on the map. If the bounds lie outside the extents, they are reduced to the extents.
     *
     * @param {string | TypeLayerEntryConfig | TypeListOfLayerEntryConfig | null} layerPathOrConfig Optional layer path or
     * configuration.
     * @param {string | number | undefined} projectionCode Optional projection code to use for the returned bounds.
     *
     * @returns {Extent} The layer bounding box.
     */
    calculateBounds(layerPathOrConfig?: string | TypeLayerEntryConfig | TypeListOfLayerEntryConfig | null, projectionCode?: string | number): Extent | undefined;
}
