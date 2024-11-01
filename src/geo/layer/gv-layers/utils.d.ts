import { TypeJsonObject } from '@/core/types/global-types';
import { TypeStyleGeometry, TypeFeatureInfoEntryPartial, codedValueType, rangeDomainType } from '@/geo/map/map-schema-types';
import { TypeOutfieldsType } from '@/api/config/types/map-schema-types';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { EsriFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { EsriImageLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
/**
 * Returns the type of the specified field.
 * @param {AbstractBaseLayerEntryConfig} layerConfig The layer config
 * @param {string} fieldName field name for which we want to get the type.
 * @returns {TypeOutfieldsType} The type of the field.
 */
export declare function featureInfoGetFieldType(layerConfig: AbstractBaseLayerEntryConfig, fieldName: string): TypeOutfieldsType;
/**
 * Returns the type of the specified field.
 * @param {EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig} layerConfig The ESRI layer config
 * @param {string} fieldName field name for which we want to get the type.
 * @returns {TypeOutfieldsType} The type of the field.
 */
export declare function esriGetFieldType(layerConfig: EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig, fieldName: string): TypeOutfieldsType;
/**
 * Returns the domain of the specified field.
 * @param {EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig} layerConfig The ESRI layer config
 * @param {string} fieldName field name for which we want to get the domain.
 * @returns {codedValueType | rangeDomainType | null} The domain of the field.
 */
export declare function esriGetFieldDomain(layerConfig: EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig, fieldName: string): codedValueType | rangeDomainType | null;
/**
 * Transforms the query results of an Esri service response - when not querying on the Layers themselves (giving a 'reduced' FeatureInfoEntry).
 * The transformation reads the Esri formatted information and return a list of `TypeFeatureInfoEntryPartial` records.
 * In a similar fashion and response object as the "Query Feature Infos" functionalities done via the Layers.
 *
 * @param results TypeJsonObject The Json Object representing the data from Esri.
 *
 * @returns TypeFeatureInfoEntryPartial[] an array of relared records of type TypeFeatureInfoEntryPartial
 */
export declare function esriParseFeatureInfoEntries(records: TypeJsonObject[]): TypeFeatureInfoEntryPartial[];
/**
 * Asynchronously queries an Esri feature layer given the url and returns an array of `TypeFeatureInfoEntryPartial` records.
 * @param {url} string An Esri url indicating a feature layer to query
 * @returns {TypeFeatureInfoEntryPartial[] | null} An array of relared records of type TypeFeatureInfoEntryPartial, or an empty array.
 */
export declare function esriQueryRecordsByUrl(url: string): Promise<TypeFeatureInfoEntryPartial[]>;
/**
 * Asynchronously queries an Esri relationship table given the url and returns an array of `TypeFeatureInfoEntryPartial` records.
 * @param {url} string An Esri url indicating a relationship table to query
 * @param {recordGroupIndex} number The group index of the relationship layer on which to read the related records
 * @returns {TypeFeatureInfoEntryPartial[] | null} An array of relared records of type TypeFeatureInfoEntryPartial, or an empty array.
 */
export declare function esriQueryRelatedRecordsByUrl(url: string, recordGroupIndex: number): Promise<TypeFeatureInfoEntryPartial[]>;
/**
 * Converts an esri geometry type string to a TypeStyleGeometry.
 * @param {string} esriGeometryType - The esri geometry type to convert
 * @returns {TypeStyleGeometry} The corresponding TypeStyleGeometry
 */
export declare function esriConvertEsriGeometryTypeToOLGeometryType(esriGeometryType: string): TypeStyleGeometry;
