import { Extent } from 'ol/extent';
import { AbstractGeoViewLayer, TypeLegend } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { TypeLayerEntryConfig, TypeGeoviewLayerConfig, TypeListOfLayerEntryConfig, TypeEsriDynamicLayerEntryConfig, TypeEsriImageLayerEntryConfig } from '@/geo/map/map-schema-types';
import { codedValueType, rangeDomainType } from '@/api/events/payloads';
import { TypeEsriFeatureLayerEntryConfig } from '@/app';
import { TypeJsonArray, TypeJsonObject } from '@/core/types/global-types';
export interface TypeEsriImageLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: 'esriImage';
    listOfLayerEntryConfig: TypeEsriImageLayerEntryConfig[];
}
/** ******************************************************************************************************************************
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeEsriImageLayerConfig if the geoviewLayerType attribute of
 * the verifyIfLayer parameter is ESRI_IMAGE. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsEsriImage: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeEsriImageLayerConfig;
/** ******************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as an EsriImage if the type attribute of the verifyIfGeoViewLayer
 * parameter is ESRI_IMAGE. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewLayerIsEsriImage: (verifyIfGeoViewLayer: AbstractGeoViewLayer) => verifyIfGeoViewLayer is EsriImage;
/** ******************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeEsriImageLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewLayerConfig attribute is ESRI_IMAGE. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewEntryIsEsriImage: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is TypeEsriImageLayerEntryConfig;
/** ******************************************************************************************************************************
 * A class to add esri image layer.
 *
 * @exports
 * @class EsriImage
 */
export declare class EsriImage extends AbstractGeoViewRaster {
    /** ****************************************************************************************************************************
     * Initialize layer.
     * @param {string} mapId The id of the map.
     * @param {TypeEsriImageLayerConfig} layerConfig The layer configuration.
     */
    constructor(mapId: string, layerConfig: TypeEsriImageLayerConfig);
    /** ***************************************************************************************************************************
     * Return the legend of the layer.This routine return null when the layerPath specified is not found. If the legend can't be
     * read, the legend property of the object returned will be null.
     *
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {Promise<TypeLegend | null>} The legend of the layer.
     */
    getLegend(layerPath: string): Promise<TypeLegend | null>;
    /** ***************************************************************************************************************************
     * This method recursively validates the layer configuration entries by filtering and reporting invalid layers. If needed,
     * extra configuration may be done here.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
     *
     * @returns {TypeListOfLayerEntryConfig} A new list of layer entries configuration with deleted error layers.
     */
    protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): void;
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
     * @param {TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig | TypeEsriImageLayerEntryConfig} layerConfig The layer entry to configure
     */
    protected processTemporalDimension(esriTimeDimension: TypeJsonObject, layerConfig: TypeEsriImageLayerEntryConfig): void;
    /** ***************************************************************************************************************************
     * This method verifies if the layer is queryable and sets the outfields and aliasFields of the source feature info.
     *
     * @param {string} capabilities The capabilities that will say if the layer is queryable.
     * @param {string} nameField The display field associated to the layer.
     * @param {string} geometryFieldName The field name of the geometry property.
     * @param {TypeJsonArray} fields An array of field names and its aliases.
     * @param {TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig | TypeEsriImageLayerEntryConfig} layerConfig The layer entry to configure.
     */
    processFeatureInfoConfig: (capabilities: string, nameField: string, geometryFieldName: string, fields: TypeJsonArray, layerConfig: TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig | TypeEsriImageLayerEntryConfig) => void;
    /** ***************************************************************************************************************************
     * This method set the initial settings based on the service metadata. Priority is given to the layer configuration.
     *
     * @param {boolean} visibility The metadata initial visibility of the layer.
     * @param {number} minScale The metadata minScale of the layer.
     * @param {number} maxScale The metadata maxScale of the layer.
     * @param {TypeJsonObject} extent The metadata layer extent.
     * @param {TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig | TypeEsriImageLayerEntryConfig} layerConfig The layer entry to configure.
     */
    processInitialSettings(visibility: boolean, minScale: number, maxScale: number, extent: TypeJsonObject, layerConfig: TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig | TypeEsriImageLayerEntryConfig): void;
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
     * This method creates a GeoView Esri Image layer using the definition provided in the layerConfig parameter.
     *
     * @param {TypeEsriImageLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
     *
     * @returns {TypeBaseRasterLayer} The GeoView raster layer that has been created.
     */
    protected processOneLayerEntry(layerConfig: TypeEsriImageLayerEntryConfig): Promise<TypeBaseRasterLayer | null>;
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
