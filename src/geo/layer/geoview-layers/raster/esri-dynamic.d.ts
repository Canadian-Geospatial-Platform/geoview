import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { AbstractGeoViewLayer } from '../abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from './abstract-geoview-raster';
import { TypeImageLayerEntryConfig, TypeLayerEntryConfig, TypeSourceImageEsriInitialConfig, TypeGeoviewLayerConfig, TypeListOfLayerEntryConfig } from '../../../map/map-schema-types';
import { TypeArrayOfFeatureInfoEntries, codedValueType, rangeDomainType } from '../../../../api/events/payloads/get-feature-info-payload';
import { TypeJsonArray, TypeJsonObject } from '../../../../core/types/global-types';
import { TypeEsriFeatureLayerEntryConfig } from '../vector/esri-feature';
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
    getServiceMetadata(): Promise<void>;
    /** ***************************************************************************************************************************
     * This method validates recursively the configuration of the layer entries to ensure that it is a feature layer identified
     * with a numeric layerId and creates a group entry when a layer is a group.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
     *
     * @returns {TypeListOfLayerEntryConfig} A new list of layer entries configuration with deleted error layers.
     */
    validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): TypeListOfLayerEntryConfig;
    /** ***************************************************************************************************************************
     * This method perform specific validation that can only be done by the child of the AbstractGeoViewEsriLayer class.
     *
     * @param {number} esriIndex The index of the current layer in the metadata.
     *
     * @returns {boolean} true if an error is detected.
     */
    esriChildHasDetectedAnError(layerEntryConfig: TypeLayerEntryConfig, esriIndex: number): boolean;
    /** ***************************************************************************************************************************
     * Extract the type of the specified field from the metadata. If the type can not be found, return 'string'.
     *
     * @param {string} fieldName field name for which we want to get the type.
     * @param {TypeLayerEntryConfig} layeConfig layer configuration.
     *
     * @returns {'string' | 'date' | 'number'} The type of the field.
     */
    getFieldType(fieldName: string, layerConfig: TypeLayerEntryConfig): 'string' | 'date' | 'number';
    /** ***************************************************************************************************************************
     * Return the domain of the specified field.
     *
     * @param {string} fieldName field name for which we want to get the domain.
     * @param {TypeLayerEntryConfig} layeConfig layer configuration.
     *
     * @returns {null | codedValueType | rangeDomainType} The domain of the field.
     */
    getFieldDomain(fieldName: string, layerConfig: TypeLayerEntryConfig): null | codedValueType | rangeDomainType;
    /** ***************************************************************************************************************************
     * This method will create a Geoview temporal dimension if it exist in the service metadata
     * @param {TypeJsonObject} esriTimeDimension The ESRI time dimension object
     * @param {TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig} layerEntryConfig The layer entry to configure
     */
    processTemporalDimension(esriTimeDimension: TypeJsonObject, layerEntryConfig: TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig): void;
    /** ***************************************************************************************************************************
     * This method verifies if the layer is queryable and sets the outfields and aliasFields of the source feature info.
     *
     * @param {string} capabilities The capabilities that will say if the layer is queryable.
     * @param {string} nameField The display field associated to the layer.
     * @param {string} geometryFieldName The field name of the geometry property.
     * @param {TypeJsonArray} fields An array of field names and its aliases.
     * @param {TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig} layerEntryConfig The layer entry to configure.
     */
    processFeatureInfoConfig: (capabilities: string, nameField: string, geometryFieldName: string, fields: TypeJsonArray, layerEntryConfig: TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig) => void;
    /** ***************************************************************************************************************************
     * This method set the initial settings based on the service metadata. Priority is given to the layer configuration.
     *
     * @param {string} mapId The map identifier.
     * @param {boolean} visibility The metadata initial visibility of the layer.
     * @param {number} minScale The metadata minScale of the layer.
     * @param {number} maxScale The metadata maxScale of the layer.
     * @param {TypeJsonObject} extent The metadata layer extent.
     * @param {TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig} layerEntryConfig The layer entry to configure.
     */
    processInitialSettings(visibility: boolean, minScale: number, maxScale: number, extent: TypeJsonObject, layerEntryConfig: TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig): void;
    /** ***************************************************************************************************************************
     * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
     * initial settings, fields and aliases).
     *
     * @param {TypeLayerEntryConfig} layerEntryConfig The layer entry configuration to process.
     *
     * @returns {Promise<void>} A promise that the layer configuration has its metadata processed.
     */
    protected processLayerMetadata(layerEntryConfig: TypeLayerEntryConfig): Promise<void>;
    /** ****************************************************************************************************************************
     * This method creates a GeoView EsriDynamic layer using the definition provided in the layerEntryConfig parameter.
     *
     * @param {TypeEsriDynamicLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
     *
     * @returns {TypeBaseRasterLayer} The GeoView raster layer that has been created.
     */
    processOneLayerEntry(layerEntryConfig: TypeEsriDynamicLayerEntryConfig): Promise<TypeBaseRasterLayer | null>;
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
    /** ***************************************************************************************************************************
     * Get the layer view filter. The filter is derived fron the uniqueValue or the classBreak visibility flags and an layerFilter
     * associated to the layer.
     *
     * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
     *
     * @returns {string} the filter associated to the layerPath
     */
    getViewFilter(layerPathOrConfig?: string | TypeLayerEntryConfig | null): string;
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
     * Set the layerFilter that will be applied with the legend filters derived from the uniqueValue or classBreabs style of
     * the layer. The resulting filter will be (legend filters) and (layerFilter). When the layer config is invalid, nothing is
     * done.
     *
     * @param {string} filterValue The filter to associate to the layer.
     * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
     */
    setLayerFilter(filterValue: string, layerPathOrConfig?: string | TypeLayerEntryConfig | null): void;
    /** ***************************************************************************************************************************
     * Get the layerFilter that is associated to the layer. Returns undefined when the layer config is invalid.
     * If layerPathOrConfig is undefined, this.activeLayer is used.
     *
     * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
     *
     * @returns {string | undefined} The filter associated to the layer or undefined.
     */
    getLayerFilter(layerPathOrConfig?: string | TypeLayerEntryConfig | null): string | undefined;
}
