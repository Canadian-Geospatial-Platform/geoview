import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { TypeJsonObject } from '../../../../core/types/global-types';
import { AbstractGeoViewLayer } from '../abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from './abstract-geoview-raster';
import { TypeImageLayerEntryConfig, TypeLayerEntryConfig, TypeSourceImageEsriInitialConfig, TypeGeoviewLayerConfig, TypeListOfLayerEntryConfig } from '../../../map/map-schema-types';
import { TypeArrayOfFeatureInfoEntries } from '../../../../api/events/payloads/get-feature-info-payload';
export interface TypeEsriDynamicLayerEntryConfig extends Omit<TypeImageLayerEntryConfig, 'source'> {
    source: TypeSourceImageEsriInitialConfig;
}
export interface TypeEsriDynamicLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: 'esriDynamic';
    listOfLayerEntryConfig: TypeEsriDynamicLayerEntryConfig[];
}
/** ******************************************************************************************************************************
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeEsriDynamicLayerConfig if the geoviewLayerType attribute of
 * the verifyIfLayer parameter is ESRI_DYNAMIC. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsEsriDynamic: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeEsriDynamicLayerConfig;
/** ******************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as an EsriDynamic if the type attribute of the verifyIfGeoViewLayer
 * parameter is ESRI_DYNAMIC. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewLayerIsEsriDynamic: (verifyIfGeoViewLayer: AbstractGeoViewLayer) => verifyIfGeoViewLayer is EsriDynamic;
/** ******************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeEsriDynamicLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewRootLayer attribute is ESRI_DYNAMIC. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewEntryIsEsriDynamic: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is TypeEsriDynamicLayerEntryConfig;
/** ******************************************************************************************************************************
 * A class to add esri dynamic layer.
 *
 * @exports
 * @class EsriDynamic
 */
export declare class EsriDynamic extends AbstractGeoViewRaster {
    /** Service metadata */
    metadata: TypeJsonObject;
    /** ****************************************************************************************************************************
     * Initialize layer.
     * @param {string} mapId The id of the map.
     * @param {TypeEsriDynamicLayerConfig} layerConfig The layer configuration.
     */
    constructor(mapId: string, layerConfig: TypeEsriDynamicLayerConfig);
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
     * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
     * initial settings, fields and aliases).
     *
     * @param {TypeLayerEntryConfig} layerEntryConfig The layer entry configuration to process.
     *
     * @returns {Promise<void>} A promise that the layer configuration has its metadata processed.
     */
    protected processLayerMetadata(layerEntryConfig: TypeLayerEntryConfig): Promise<void>;
    /** ***************************************************************************************************************************
     * This method set the initial settings based on the service metadata. Priority is given to the layer configuration.
     *
     * @param {boolean} visibility The metadata initial visibility of the layer.
     * @param {number} minScale The metadata minScale of the layer.
     * @param {number} maxScale The metadata maxScale of the layer.
     * @param {TypeJsonObject} extent The metadata layer extent.
     * @param {TypeEsriDynamicLayerEntryConfig} layerEntryConfig The vector layer entry to configure.
     */
    private processInitialSettings;
    /** ***************************************************************************************************************************
     * This method verifies if the layer is queryable and sets the outfields and aliasFields of the source feature info.
     *
     * @param {string} capabilities The capabilities that will say if the layer is queryable.
     * @param {string} nameField The display field associated to the layer.
     * @param {string} geometryFieldName The field name of the geometry property.
     * @param {TypeJsonArray} fields An array of field names and its aliases.
     * @param {TypeEsriDynamicLayerEntryConfig} layerEntryConfig The vector layer entry to configure.
     */
    private processFeatureInfoConfig;
    /** ****************************************************************************************************************************
     * This method creates a GeoView EsriDynamic layer using the definition provided in the layerEntryConfig parameter.
     *
     * @param {TypeEsriDynamicLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
     *
     * @returns {TypeBaseRasterLayer} The GeoView raster layer that has been created.
     */
    processOneLayerEntry(layerEntryConfig: TypeEsriDynamicLayerEntryConfig): Promise<TypeBaseRasterLayer | null>;
    /** ***************************************************************************************************************************
     * Translate the get feature information at coordinate result set to the TypeArrayOfFeatureInfoEntries used by GeoView.
     *
     * @param {TypeJsonArray} features An array of found features formatted using the query syntax.
     * @param {TypeFeatureInfoLayerConfig} featureInfo Feature information describing the user's desired output format.
     *
     * @returns {TypeArrayOfFeatureInfoEntries} The feature info table.
     */
    private formatFeatureInfoAtCoordinateResult;
    /** ***************************************************************************************************************************
     * Return feature information for all the features around the provided Pixel.
     *
     * @param {Coordinate} location The pixel coordinate that will be used by the query.
     * @param {TypeEsriDynamicLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
     */
    protected getFeatureInfoAtPixel(location: Pixel, layerConfig: TypeEsriDynamicLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features around the provided projection coordinate.
     *
     * @param {Coordinate} location The coordinate that will be used by the query.
     * @param {TypeEsriDynamicLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The promised feature info table.
     */
    protected getFeatureInfoAtCoordinate(location: Coordinate, layerConfig: TypeEsriDynamicLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features around the provided coordinate.
     *
     * @param {Coordinate} lnglat The coordinate that will be used by the query.
     * @param {TypeEsriDynamicLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The promised feature info table.
     */
    protected getFeatureInfoAtLongLat(lnglat: Coordinate, layerConfig: TypeEsriDynamicLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features in the provided bounding box.
     *
     * @param {Coordinate} location The coordinate that will be used by the query.
     * @param {TypeEsriDynamicLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
     */
    protected getFeatureInfoUsingBBox(location: Coordinate[], layerConfig: TypeEsriDynamicLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features in the provided polygon.
     *
     * @param {Coordinate} location The coordinate that will be used by the query.
     * @param {TypeEsriDynamicLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
     */
    protected getFeatureInfoUsingPolygon(location: Coordinate[], layerConfig: TypeEsriDynamicLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
}
