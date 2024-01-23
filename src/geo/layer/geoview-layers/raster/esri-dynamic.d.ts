import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { Extent } from 'ol/extent';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { TypeEsriFeatureLayerEntryConfig } from '@/geo/layer/geoview-layers/vector/esri-feature';
import { TypeLayerEntryConfig, TypeGeoviewLayerConfig, TypeListOfLayerEntryConfig, TypeEsriDynamicLayerEntryConfig } from '@/geo/map/map-schema-types';
import { TypeArrayOfFeatureInfoEntries, codedValueType, rangeDomainType } from '@/api/events/payloads';
import { TypeJsonArray, TypeJsonObject } from '@/core/types/global-types';
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
 * of the verifyIfGeoViewEntry.geoviewLayerConfig attribute is ESRI_DYNAMIC. The type ascention applies only to the true block of
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
    protected fetchServiceMetadata(): Promise<void>;
    /** ***************************************************************************************************************************
     * This method validates recursively the configuration of the layer entries to ensure that it is a feature layer identified
     * with a numeric layerId and creates a group entry when a layer is a group.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
     */
    validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): void;
    /** ***************************************************************************************************************************
     * This method perform specific validation that can only be done by the child of the AbstractGeoViewEsriLayer class.
     *
     * @param {number} esriIndex The index of the current layer in the metadata.
     *
     * @returns {boolean} true if an error is detected.
     */
    esriChildHasDetectedAnError(layerConfig: TypeLayerEntryConfig, esriIndex: number): boolean;
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
     * Return the domain of the specified field.
     *
     * @param {string} fieldName field name for which we want to get the domain.
     * @param {TypeLayerEntryConfig} layerConfig layer configuration.
     *
     * @returns {null | codedValueType | rangeDomainType} The domain of the field.
     */
    protected getFieldDomain(fieldName: string, layerConfig: TypeLayerEntryConfig): null | codedValueType | rangeDomainType;
    /** ***************************************************************************************************************************
     * This method will create a Geoview temporal dimension if it exist in the service metadata
     * @param {TypeJsonObject} esriTimeDimension The ESRI time dimension object
     * @param {TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig} layerConfig The layer entry to configure
     */
    protected processTemporalDimension(esriTimeDimension: TypeJsonObject, layerConfig: TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig): void;
    /** ***************************************************************************************************************************
     * This method verifies if the layer is queryable and sets the outfields and aliasFields of the source feature info.
     *
     * @param {string} capabilities The capabilities that will say if the layer is queryable.
     * @param {string} nameField The display field associated to the layer.
     * @param {string} geometryFieldName The field name of the geometry property.
     * @param {TypeJsonArray} fields An array of field names and its aliases.
     * @param {TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig} layerConfig The layer entry to configure.
     */
    processFeatureInfoConfig: (capabilities: string, nameField: string, geometryFieldName: string, fields: TypeJsonArray, layerConfig: TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig) => void;
    /** ***************************************************************************************************************************
     * This method set the initial settings based on the service metadata. Priority is given to the layer configuration.
     *
     * @param {string} mapId The map identifier.
     * @param {boolean} visibility The metadata initial visibility of the layer.
     * @param {number} minScale The metadata minScale of the layer.
     * @param {number} maxScale The metadata maxScale of the layer.
     * @param {TypeJsonObject} extent The metadata layer extent.
     * @param {TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig} layerConfig The layer entry to configure.
     */
    processInitialSettings(visibility: boolean, minScale: number, maxScale: number, extent: TypeJsonObject, layerConfig: TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig): void;
    /** ***************************************************************************************************************************
     * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
     * initial settings, fields and aliases).
     *
     * @param {TypeLayerEntryConfig} layerConfig The layer entry configuration to process.
     *
     * @returns {Promise<void>} A promise that the layer configuration has its metadata processed.
     */
    protected processLayerMetadata(layerConfig: TypeLayerEntryConfig): Promise<void>;
    /** ****************************************************************************************************************************
     * This method creates a GeoView EsriDynamic layer using the definition provided in the layerConfig parameter.
     *
     * @param {TypeEsriDynamicLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
     *
     * @returns {TypeBaseRasterLayer} The GeoView raster layer that has been created.
     */
    protected processOneLayerEntry(layerConfig: TypeEsriDynamicLayerEntryConfig): Promise<TypeBaseRasterLayer | null>;
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
     * Count the number of times the value of a field is used by the unique value style information object. Depending on the
     * visibility of the default, we count visible or invisible settings.
     *
     * @param {TypeUniqueValueStyleConfig} styleSettings The unique value style settings to evaluate.
     *
     * @returns {TypeFieldOfTheSameValue[][]} The result of the evaluation. The first index of the array correspond to the field's
     * index in the style settings and the second one to the number of different values the field may have based on visibility of
     * the feature.
     */
    private countFieldOfTheSameValue;
    /** ***************************************************************************************************************************
     * Sort the number of times the value of a field is used by the unique value style information object. Depending on the
     * visibility of the default value, we count the visible or invisible parameters. The order goes from the highest number of
     * occurrences to the lowest number of occurrences.
     *
     * @param {TypeUniqueValueStyleConfig} styleSettings The unique value style settings to evaluate.
     * @param {TypeFieldOfTheSameValue[][]} fieldOfTheSameValue The count information that contains the number of occurrences
     * of a value.
     *
     * @returns {number[]} An array that gives the field order to use to build the query tree.
     */
    private sortFieldOfTheSameValue;
    /** ***************************************************************************************************************************
     * Get the query tree. The tree structure is a representation of the optimized query we have to create. It contains the field
     * values in the order specified by the fieldOrder parameter. The optimization is based on the distributivity and associativity
     * of the Boolean algebra. The form is the following:
     *
     * (f1 = v11 and (f2 = v21 and f3 in (v31, v32) or f2 = v22 and f3 in (v31, v32, v33)) or f1 = v12 and (f2 = v21 and ...)))
     *
     * which is equivalent to:
     *
     * f1 = v11 and f2 = v21 and f3 = v31 or f1 = v11 and f2 = v21 and f3 = v32 or f1 = v11 and f2 = v22 and f3 = v31 ...
     *
     * @param {TypeUniqueValueStyleConfig} styleSettings The unique value style settings to evaluate.
     * @param {TypeFieldOfTheSameValue[][]} fieldOfTheSameValue The count information that contains the number of occurrences
     * of a value.
     * @param {number[]} fieldOrder The field order to use when building the tree.
     *
     * @returns {TypeQueryTree} The query tree to use when building the final query string.
     */
    private getQueryTree;
    /** ***************************************************************************************************************************
     * format the field value to use in the query.
     *
     * @param {string} fieldName The field name.
     * @param {string | number | Date} rawValue The unformatted field value.
     * @param {TypeFeatureInfoLayerConfig} sourceFeatureInfo The source feature information that knows the field type.
     *
     * @returns {string} The resulting field value.
     */
    private formatFieldValue;
    /** ***************************************************************************************************************************
     * Build the query using the provided query tree.
     *
     * @param {TypeQueryTree} queryTree The query tree to use.
     * @param {number} level The level to use for solving the tree.
     * @param {number[]} fieldOrder The field order to use for solving the tree.
     * @param {TypeUniqueValueStyleConfig} styleSettings The unique value style settings to evaluate.
     * @param {TypeFeatureInfoLayerConfig} sourceFeatureInfo The source feature information that knows the field type.
     *
     * @returns {string} The resulting query.
     */
    private buildQuery;
    /** ***************************************************************************************************************************
     * Get the layer view filter. The filter is derived from the uniqueValue or the classBreak visibility flags and a layerFilter
     * associated to the layer.
     *
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {string} the filter associated to the layerPath
     */
    getViewFilter(layerPath: string): string;
    /** ***************************************************************************************************************************
     * Apply a view filter to the layer identified by the path stored in the layerPathAssociatedToTheGeoviewLayer property stored
     * in the layer instance associated to the map. The legend filters are derived from the uniqueValue or classBreaks style of the
     * layer. When the layer config is invalid, nothing is done.
     *
     * @param {string} filter An optional filter to be used in place of the getViewFilter value.
     * @param {never} notUsed1 This parameter must not be provided. It is there to allow overloading of the method signature.
     * @param {never} notUsed2 This parameter must not be provided. It is there to allow overloading of the method signature.
     */
    applyViewFilter(filter: string, notUsed1?: never, notUsed2?: never): Promise<void>;
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
    applyViewFilter(filter: string, CombineLegendFilter: boolean, notUsed?: never): Promise<void>;
    /** ***************************************************************************************************************************
     * Apply a view filter to the layer. When the CombineLegendFilter flag is false, the filter paramater is used alone to display
     * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
     * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
     * is done.
     *
     * @param {string} layerPath The layer path to the layer's configuration.
     * @param {string} filter An optional filter to be used in place of the getViewFilter value.
     * @param {boolean} combineLegendFilter Flag used to combine the legend filter and the filter together (default: true)
     */
    applyViewFilter(layerPath: string, filter?: string, combineLegendFilter?: boolean): Promise<void>;
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
