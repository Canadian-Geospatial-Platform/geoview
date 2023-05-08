import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { AbstractGeoViewLayer, TypeLegend } from '../abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from './abstract-geoview-raster';
import { TypeLayerEntryConfig, TypeGeoviewLayerConfig, TypeListOfLayerEntryConfig, TypeImageStaticLayerEntryConfig } from '../../../map/map-schema-types';
import { TypeArrayOfFeatureInfoEntries } from '../../../../api/events/payloads/get-feature-info-payload';
export interface TypeImageStaticLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: 'imageStatic';
    listOfLayerEntryConfig: TypeImageStaticLayerEntryConfig[];
}
/** *****************************************************************************************************************************
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeImageStaticLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is ImageStatic. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsImageStatic: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeImageStaticLayerConfig;
/** *****************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as a ImageStatic if the type attribute of the verifyIfGeoViewLayer
 * parameter is ImageStatic. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewLayerIsImageStatic: (verifyIfGeoViewLayer: AbstractGeoViewLayer) => verifyIfGeoViewLayer is ImageStatic;
/** *****************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeImageStaticLayerEntryConfig if the geoviewLayerType attribute of the
 * verifyIfGeoViewEntry.geoviewRootLayer attribute is ImageStatic. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewEntryIsImageStatic: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is TypeImageStaticLayerEntryConfig;
/** *****************************************************************************************************************************
 * A class to add image static layer.
 *
 * @exports
 * @class ImageStatic
 */
export declare class ImageStatic extends AbstractGeoViewRaster {
    /** ***************************************************************************************************************************
     * Initialize layer
     *
     * @param {string} mapId the id of the map
     * @param {TypeImageStaticLayerConfig} layerConfig the layer configuration
     */
    constructor(mapId: string, layerConfig: TypeImageStaticLayerConfig);
    /** ***************************************************************************************************************************
     * This method reads the service metadata from the metadataAccessPath.
     *
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected getServiceMetadata(): Promise<void>;
    /** ***************************************************************************************************************************
     * Get the legend image of a layer.
     *
     * @param {TypeImageStaticLayerEntryConfig} layerConfig layer configuration.
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
     * This method recursively validates the layer configuration entries by filtering and reporting invalid layers. If needed,
     * extra configuration may be done here.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
     *
     * @returns {TypeListOfLayerEntryConfig} A new list of layer entries configuration with deleted error layers.
     */
    protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): TypeListOfLayerEntryConfig;
    /** ****************************************************************************************************************************
     * This method creates a GeoView Image Static layer using the definition provided in the layerEntryConfig parameter.
     *
     * @param {TypeImageStaticLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
     *
     * @returns {TypeBaseRasterLayer} The GeoView raster layer that has been created.
     */
    processOneLayerEntry(layerEntryConfig: TypeImageStaticLayerEntryConfig): Promise<TypeBaseRasterLayer | null>;
    /** ***************************************************************************************************************************
     * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
     * initial settings, fields and aliases).
     *
     * @param {TypeVectorLayerEntryConfig} layerEntryConfig The layer entry configuration to process.
     *
     * @returns {Promise<void>} A promise that the layer configuration has its metadata processed.
     */
    protected processLayerMetadata(layerEntryConfig: TypeImageStaticLayerEntryConfig): Promise<void>;
    /** ***************************************************************************************************************************
     * Image Static return null because these services do not support getFeatureInfo queries. When getFeatureInfo is supported this
     * method returns feature information for all the features around the provided Pixel.
     *
     * @param {Coordinate} location The pixel coordinate that will be used by the query.
     * @param {TypeImageStaticLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
     */
    protected getFeatureInfoAtPixel(location: Pixel, layerConfig: TypeImageStaticLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Image Static return null because these services do not support getFeatureInfo queries. When getFeatureInfo is supported this
     * method returns information for all the features around the provided coordinate.
     *
     * @param {Coordinate} location The coordinate that will be used by the query.
     * @param {TypeImageStaticLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
     */
    protected getFeatureInfoAtCoordinate(location: Coordinate, layerConfig: TypeImageStaticLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Image Static return null because these services do not support getFeatureInfo queries. When getFeatureInfo is supported this
     * method returns feature information for all the features around the provided longitude latitude.
     *
     * @param {Coordinate} location The coordinate that will be used by the query.
     * @param {TypeImageStaticLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
     */
    protected getFeatureInfoAtLongLat(location: Coordinate, layerConfig: TypeImageStaticLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Image Static return null because these services do not support getFeatureInfo queries. When getFeatureInfo is supported this
     * method returns feature information for all the features in the provided bounding box.
     *
     * @param {Coordinate} location The coordinate that will be used by the query.
     * @param {TypeImageStaticLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
     */
    protected getFeatureInfoUsingBBox(location: Coordinate[], layerConfig: TypeImageStaticLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Image Static return null because these services do not support getFeatureInfo queries. When getFeatureInfo is supported this
     * method returns feature information for all the features in the provided polygon.
     *
     * @param {Coordinate} location The coordinate that will be used by the query.
     * @param {TypeImageStaticLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
     */
    protected getFeatureInfoUsingPolygon(location: Coordinate[], layerConfig: TypeImageStaticLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
}
