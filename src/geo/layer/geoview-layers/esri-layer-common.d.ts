import { TypeJsonObject } from '@/api/config/types/config-types';
import { EsriFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { EsriImageLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { TypeFeatureInfoEntryPartial, TypeLayerEntryConfig, TypeStyleGeometry, codedValueType, rangeDomainType, TypeOutfieldsType } from '@/api/config/types/map-schema-types';
import { EsriDynamic } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { EsriFeature } from '@/geo/layer/geoview-layers/vector/esri-feature';
import { EsriImage } from '@/geo/layer/geoview-layers/raster/esri-image';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
/**
 * Fetches the Esri metadata and sets it for the given layer.
 * @param {EsriDynamic | EsriFeature} layer The ESRI layer instance pointer.
 * @returns {Promise<void>} A promise that the execution is completed.
 */
export declare function commonFetchAndSetServiceMetadata(layer: EsriDynamic | EsriFeature): Promise<void>;
/**
 * This method validates recursively the configuration of the layer entries to ensure that it is a feature layer identified
 * with a numeric layerId and creates a group entry when a layer is a group.
 *
 * @param {EsriDynamic | EsriFeature} layer The ESRI layer instance pointer.
 * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
 */
export declare function commonValidateListOfLayerEntryConfig(layer: EsriDynamic | EsriFeature, listOfLayerEntryConfig: TypeLayerEntryConfig[]): void;
/**
 * Extract the domain of the specified field from the metadata. If the type can not be found, return 'string'.
 *
 * @param {EsriDynamic | EsriFeature} layer The ESRI layer instance pointer.
 * @param {string} fieldName field name for which we want to get the domain.
 * @param {AbstractBaseLayerEntryConfig} layerConfig layer configuration.
 *
 * @returns {TypeOutfieldsType} The type of the field.
 */
export declare function commonGetFieldType(layer: EsriDynamic | EsriFeature | EsriImage, fieldName: string, layerConfig: AbstractBaseLayerEntryConfig): TypeOutfieldsType;
/**
 * Return the type of the specified field.
 *
 * @param {EsriDynamic | EsriFeature} layer The ESRI layer instance pointer.
 * @param {string} fieldName field name for which we want to get the type.
 * @param {AbstractBaseLayerEntryConfig} layerConfig layer configuration.
 *
 * @returns {null | codedValueType | rangeDomainType} The domain of the field.
 */
export declare function commonGetFieldDomain(layer: EsriDynamic | EsriFeature | EsriImage, fieldName: string, layerConfig: AbstractBaseLayerEntryConfig): null | codedValueType | rangeDomainType;
/**
 * This method will create a Geoview temporal dimension if it exist in the service metadata
 *
 * @param {EsriDynamic | EsriFeature} layer The ESRI layer instance pointer.
 * @param {TypeJsonObject} esriTimeDimension The ESRI time dimension object
 * @param {EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig} layerConfig The layer entry to configure
 * @param {boolean} singleHandle True for ESRI Image
 */
export declare function commonProcessTemporalDimension(layer: EsriDynamic | EsriFeature | EsriImage, esriTimeDimension: TypeJsonObject, layerConfig: EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig, singleHandle?: boolean): void;
/**
 * This method verifies if the layer is queryable and sets the outfields and aliasFields of the source feature info.
 *
 * @param {EsriDynamic | EsriFeature | EsriImage} layer The ESRI layer instance pointer.
 * @param {EsriFeatureLayerEntryConfig |
 *         EsriDynamicLayerEntryConfig |
 *         EsriImageLayerEntryConfig} layerConfig The layer entry to configure.
 */
export declare function commonProcessFeatureInfoConfig(layer: EsriDynamic | EsriFeature | EsriImage, layerConfig: EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig): void;
/**
 * This method set the initial settings based on the service metadata. Priority is given to the layer configuration.
 *
 * @param {EsriDynamic | EsriFeature | EsriImage} layer The ESRI layer instance pointer.
 * @param {EsriFeatureLayerEntryConfig |
 *         EsriDynamicLayerEntryConfig |
 *         EsriImageLayerEntryConfig} layerConfig The layer entry to configure.
 */
export declare function commonProcessInitialSettings(layer: EsriDynamic | EsriFeature | EsriImage, layerConfig: EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig): void;
/**
 * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
 * initial settings, fields and aliases).
 *
 * @param {EsriDynamic | EsriFeature | EsriImage} layer The ESRI layer instance pointer.
 * @param {TypeLayerEntryConfig} layerConfig The layer entry configuration to process.
 *
 * @returns {Promise<TypeLayerEntryConfig>} A promise that the layer configuration has its metadata processed.
 */
export declare function commonProcessLayerMetadata<T extends EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig>(layer: EsriDynamic | EsriFeature | EsriImage, layerConfig: T): Promise<T>;
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
 * @param {string} url An Esri url indicating a feature layer to query
 * @returns {TypeFeatureInfoEntryPartial[] | null} An array of relared records of type TypeFeatureInfoEntryPartial, or an empty array.
 */
export declare function queryRecordsByUrl(url: string): Promise<TypeFeatureInfoEntryPartial[]>;
/**
 * Asynchronously queries an Esri relationship table given the url and returns an array of `TypeFeatureInfoEntryPartial` records.
 * @param {url} string An Esri url indicating a relationship table to query
 * @param {recordGroupIndex} number The group index of the relationship layer on which to read the related records
 * @returns {TypeFeatureInfoEntryPartial[] | null} An array of relared records of type TypeFeatureInfoEntryPartial, or an empty array.
 */
export declare function queryRelatedRecordsByUrl(url: string, recordGroupIndex: number): Promise<TypeFeatureInfoEntryPartial[]>;
/**
 * Converts an esri geometry type string to a TypeStyleGeometry.
 * @param {string} esriGeometryType - The esri geometry type to convert
 * @returns {TypeStyleGeometry} The corresponding TypeStyleGeometry
 */
export declare function convertEsriGeometryTypeToOLGeometryType(esriGeometryType: string): TypeStyleGeometry;
