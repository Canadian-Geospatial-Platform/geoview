import { TypeJsonArray, TypeJsonObject } from '../../../core/types/global-types';
import { TypeEsriDynamicLayerEntryConfig, TypeLayerEntryConfig, TypeListOfLayerEntryConfig } from '../../map/map-schema-types';
import { EsriDynamic } from './raster/esri-dynamic';
import { EsriFeature, TypeEsriFeatureLayerEntryConfig } from './vector/esri-feature';
import { codedValueType, rangeDomainType } from '../../../api/events/payloads/get-feature-info-payload';
/** ***************************************************************************************************************************
 * This method reads the service metadata from the metadataAccessPath.
 *
 * @returns {Promise<void>} A promise that the execution is completed.
 */
export declare function commonGetServiceMetadata(this: EsriDynamic | EsriFeature, resolve: (value: void | PromiseLike<void>) => void): void;
/** ***************************************************************************************************************************
 * This method validates recursively the configuration of the layer entries to ensure that it is a feature layer identified
 * with a numeric layerId and creates a group entry when a layer is a group.
 *
 * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
 *
 * @returns {TypeListOfLayerEntryConfig} A new list of layer entries configuration with deleted error layers.
 */
export declare function commonValidateListOfLayerEntryConfig(this: EsriDynamic | EsriFeature, listOfLayerEntryConfig: TypeListOfLayerEntryConfig): TypeListOfLayerEntryConfig;
/** ***************************************************************************************************************************
 * Extract the domain of the specified field from the metadata. If the type can not be found, return 'string'.
 *
 * @param {string} fieldName field name for which we want to get the domain.
 * @param {TypeLayerEntryConfig} layerConfig layer configuration.
 *
 * @returns {'string' | 'date' | 'number'} The type of the field.
 */
export declare function commonGetFieldType(this: EsriDynamic | EsriFeature, fieldName: string, layerConfig: TypeLayerEntryConfig): 'string' | 'date' | 'number';
/** ***************************************************************************************************************************
 * Return the type of the specified field.
 *
 * @param {string} fieldName field name for which we want to get the type.
 * @param {TypeLayerEntryConfig} layerConfig layer configuration.
 *
 * @returns {null | codedValueType | rangeDomainType} The domain of the field.
 */
export declare function commonGetFieldDomain(this: EsriDynamic | EsriFeature, fieldName: string, layerConfig: TypeLayerEntryConfig): null | codedValueType | rangeDomainType;
/** ***************************************************************************************************************************
 * This method will create a Geoview temporal dimension if it exist in the service metadata
 * @param {TypeJsonObject} esriTimeDimension The ESRI time dimension object
 * @param {TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig} layerEntryConfig The layer entry to configure
 */
export declare function commonProcessTemporalDimension(this: EsriDynamic | EsriFeature, esriTimeDimension: TypeJsonObject, layerEntryConfig: TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig): void;
/** ***************************************************************************************************************************
 * This method verifies if the layer is queryable and sets the outfields and aliasFields of the source feature info.
 *
 * @param {string} capabilities The capabilities that will say if the layer is queryable.
 * @param {string} nameField The display field associated to the layer.
 * @param {string} geometryFieldName The field name of the geometry property.
 * @param {TypeJsonArray} fields An array of field names and its aliases.
 * @param {TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig} layerEntryConfig The layer entry to configure.
 */
export declare function commonProcessFeatureInfoConfig(this: EsriDynamic | EsriFeature, capabilities: string, nameField: string, geometryFieldName: string, fields: TypeJsonArray, layerEntryConfig: TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig): void;
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
export declare function commonProcessInitialSettings(this: EsriDynamic | EsriFeature, visibility: boolean, minScale: number, maxScale: number, extent: TypeJsonObject, layerEntryConfig: TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig): void;
/** ***************************************************************************************************************************
 * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
 * initial settings, fields and aliases).
 *
 * @param {TypeLayerEntryConfig} layerEntryConfig The layer entry configuration to process.
 *
 * @returns {Promise<void>} A promise that the layer configuration has its metadata processed.
 */
export declare function commonProcessLayerMetadata(this: EsriDynamic | EsriFeature, resolve: (value: void | PromiseLike<void>) => void, layerEntryConfig: TypeLayerEntryConfig): void;
