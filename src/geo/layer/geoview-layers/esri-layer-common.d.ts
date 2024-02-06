import { TypeJsonArray, TypeJsonObject } from '@/core/types/global-types';
import { TypeEsriDynamicLayerEntryConfig, TypeEsriImageLayerEntryConfig, TypeLayerEntryConfig, TypeListOfLayerEntryConfig } from '@/geo/map/map-schema-types';
import { EsriDynamic } from './raster/esri-dynamic';
import { EsriFeature, TypeEsriFeatureLayerEntryConfig } from './vector/esri-feature';
import { codedValueType, rangeDomainType, TypeFeatureInfoEntryPartial } from '@/api/events/payloads';
import { EsriImage } from './raster/esri-image';
/** ***************************************************************************************************************************
 * This method reads the service metadata from the metadataAccessPath.
 *
 * @param {EsriDynamic | EsriFeature} this The ESRI layer instance pointer.
 *
 * @returns {Promise<void>} A promise that the execution is completed.
 */
export declare function commonfetchServiceMetadata(this: EsriDynamic | EsriFeature): Promise<void>;
/** ***************************************************************************************************************************
 * This method validates recursively the configuration of the layer entries to ensure that it is a feature layer identified
 * with a numeric layerId and creates a group entry when a layer is a group.
 *
 * @param {EsriDynamic | EsriFeature} this The ESRI layer instance pointer.
 * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
 */
export declare function commonValidateListOfLayerEntryConfig(this: EsriDynamic | EsriFeature, listOfLayerEntryConfig: TypeListOfLayerEntryConfig): void;
/** ***************************************************************************************************************************
 * Extract the domain of the specified field from the metadata. If the type can not be found, return 'string'.
 *
 * @param {EsriDynamic | EsriFeature} this The ESRI layer instance pointer.
 * @param {string} fieldName field name for which we want to get the domain.
 * @param {TypeLayerEntryConfig} layerConfig layer configuration.
 *
 * @returns {'string' | 'date' | 'number'} The type of the field.
 */
export declare function commonGetFieldType(this: EsriDynamic | EsriFeature | EsriImage, fieldName: string, layerConfig: TypeLayerEntryConfig): 'string' | 'date' | 'number';
/** ***************************************************************************************************************************
 * Return the type of the specified field.
 *
 * @param {EsriDynamic | EsriFeature} this The ESRI layer instance pointer.
 * @param {string} fieldName field name for which we want to get the type.
 * @param {TypeLayerEntryConfig} layerConfig layer configuration.
 *
 * @returns {null | codedValueType | rangeDomainType} The domain of the field.
 */
export declare function commonGetFieldDomain(this: EsriDynamic | EsriFeature | EsriImage, fieldName: string, layerConfig: TypeLayerEntryConfig): null | codedValueType | rangeDomainType;
/** ***************************************************************************************************************************
 * This method will create a Geoview temporal dimension if it exist in the service metadata
 *
 * @param {EsriDynamic | EsriFeature} this The ESRI layer instance pointer.
 * @param {TypeJsonObject} esriTimeDimension The ESRI time dimension object
 * @param {TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig} layerConfig The layer entry to configure
 */
export declare function commonProcessTemporalDimension(this: EsriDynamic | EsriFeature | EsriImage, esriTimeDimension: TypeJsonObject, layerConfig: TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig | TypeEsriImageLayerEntryConfig): void;
/** ***************************************************************************************************************************
 * This method verifies if the layer is queryable and sets the outfields and aliasFields of the source feature info.
 *
 * @param {EsriDynamic | EsriFeature} this The ESRI layer instance pointer.
 * @param {string} capabilities The capabilities that will say if the layer is queryable.
 * @param {string} nameField The display field associated to the layer.
 * @param {string} geometryFieldName The field name of the geometry property.
 * @param {TypeJsonArray} fields An array of field names and its aliases.
 * @param {TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig} layerConfig The layer entry to configure.
 */
export declare function commonProcessFeatureInfoConfig(this: EsriDynamic | EsriFeature | EsriImage, capabilities: string, nameField: string, geometryFieldName: string, fields: TypeJsonArray, layerConfig: TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig | TypeEsriImageLayerEntryConfig): void;
/** ***************************************************************************************************************************
 * This method set the initial settings based on the service metadata. Priority is given to the layer configuration.
 *
 * @param {EsriDynamic | EsriFeature} this The ESRI layer instance pointer.
 * @param {boolean} visibility The metadata initial visibility of the layer.
 * @param {number} minScale The metadata minScale of the layer.
 * @param {number} maxScale The metadata maxScale of the layer.
 * @param {TypeJsonObject} extent The metadata layer extent.
 * @param {TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig} layerConfig The layer entry to configure.
 */
export declare function commonProcessInitialSettings(this: EsriDynamic | EsriFeature | EsriImage, visibility: boolean, minScale: number, maxScale: number, extent: TypeJsonObject, layerConfig: TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig | TypeEsriImageLayerEntryConfig): void;
/** ***************************************************************************************************************************
 * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
 * initial settings, fields and aliases).
 *
 * @param {EsriDynamic | EsriFeature} this The ESRI layer instance pointer.
 * @param {TypeLayerEntryConfig} layerConfig The layer entry configuration to process.
 *
 * @returns {Promise<void>} A promise that the layer configuration has its metadata processed.
 */
export declare function commonProcessLayerMetadata(this: EsriDynamic | EsriFeature | EsriImage, layerConfig: TypeLayerEntryConfig): Promise<void>;
/**
 * Transforms the query results of an Esri service response - when not querying on the Layers themselves (giving a 'reduced' FeatureInfoEntry).
 * The transformation reads the Esri formatted information and return a list of `TypeFeatureInfoEntryPartial` records.
 * In a similar fashion and response object as the "Query Feature Infos" functionalities done via the Layers.
 *
 * @param results TypeJsonObject The Json Object representing the data from Esri.
 *
 * @returns TypeFeatureInfoEntryPartial[] an array of relared records of type TypeFeatureInfoEntryPartial
 */
export declare function parseFeatureInfoEntries(records: TypeJsonObject[]): TypeFeatureInfoEntryPartial[];
/**
 * Asynchronously queries an Esri feature layer given the url and returns an array of `TypeFeatureInfoEntryPartial` records.
 * @param url string An Esri url indicating a feature layer to query
 * @returns TypeFeatureInfoEntryPartial[] An array of relared records of type TypeFeatureInfoEntryPartial, or an empty array.
 */
export declare function queryRecordsByUrl(url: string): Promise<TypeFeatureInfoEntryPartial[]>;
/**
 * Asynchronously queries an Esri relationship table given the url and returns an array of `TypeFeatureInfoEntryPartial` records.
 * @param url string An Esri url indicating a relationship table to query
 * @param recordGroupIndex number The group index of the relationship layer on which to read the related records
 * @returns TypeFeatureInfoEntryPartial[] An array of relared records of type TypeFeatureInfoEntryPartial, or an empty array.
 */
export declare function queryRelatedRecordsByUrl(url: string, recordGroupIndex: number): Promise<TypeFeatureInfoEntryPartial[]>;
