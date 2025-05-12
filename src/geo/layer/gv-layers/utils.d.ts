import { TypeJsonObject } from '@/api/config/types/config-types';
import { TypeDateFragments } from '@/core/utils/date-mgt';
import { TypeStyleGeometry, TypeFeatureInfoEntryPartial, codedValueType, rangeDomainType, TypeOutfieldsType, TypeAliasLookup, TypeOutfields } from '@/api/config/types/map-schema-types';
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
export declare function esriParseFeatureInfoEntries(records: TypeJsonObject[], geometryType?: TypeStyleGeometry): TypeFeatureInfoEntryPartial[];
/**
 * Asynchronously queries an Esri feature layer given the url and returns an array of `TypeFeatureInfoEntryPartial` records.
 * @param {string} url - An Esri url indicating a feature layer to query
 * @param {TypeStyleGeometry?} geometryType - The geometry type for the geometries in the layer being queried (used when geometries are returned)
 * @param {boolean} parseFeatureInfoEntries - A boolean to indicate if we use the raw esri output or if we parse it
 * @returns {TypeFeatureInfoEntryPartial[] | null} An array of relared records of type TypeFeatureInfoEntryPartial, or an empty array.
 */
export declare function esriQueryRecordsByUrl(url: string, geometryType?: TypeStyleGeometry, parseFeatureInfoEntries?: boolean): Promise<TypeFeatureInfoEntryPartial[]>;
/**
 * Asynchronously queries an Esri feature layer given the url and object ids and returns an array of `TypeFeatureInfoEntryPartial` records.
 * @param {string} layerUrl - An Esri url indicating a feature layer to query
 * @param {TypeStyleGeometry} geometryType - The geometry type for the geometries in the layer being queried (used when returnGeometry is true)
 * @param {number[]} objectIds - The list of objectids to filter the query on
 * @param {string} fields - The list of field names to include in the output
 * @param {boolean} geometry - True to return the geometries in the output
 * @param {number} outSR - The spatial reference of the output geometries from the query
 * @param {number} maxOffset - The max allowable offset value to simplify geometry
 * @param {boolean} parseFeatureInfoEntries - A boolean to indicate if we use the raw esri output or if we parse it
 * @returns {TypeFeatureInfoEntryPartial[] | null} An array of relared records of type TypeFeatureInfoEntryPartial, or an empty array.
 */
export declare function esriQueryRecordsByUrlObjectIds(layerUrl: string, geometryType: TypeStyleGeometry, objectIds: number[], fields: string, geometry: boolean, outSR?: number, maxOffset?: number, parseFeatureInfoEntries?: boolean): Promise<TypeFeatureInfoEntryPartial[]>;
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
/**
 * Parses a datetime filter for use in a Vector Geoviewlayer.
 *
 * @param {string} filter - The filter containing datetimes to parse
 * @returns {TypeDateFragments | undefined} externalFragmentsOrder - The external fragments order of the layer
 */
export declare function parseDateTimeValuesVector(filter: string, externalFragmentsOrder: TypeDateFragments | undefined): string;
/**
 * Parses a datetime filter for use in an Esri Dynamic layer.
 *
 * @param {string} filter - The filter containing datetimes to parse
 * @returns {TypeDateFragments | undefined} externalFragmentsOrder - The external fragments order of the layer
 */
export declare function parseDateTimeValuesEsriDynamic(filter: string, externalFragmentsOrder: TypeDateFragments | undefined): string;
/**
 * Parses a datetime filter for use in an Esri Image or WMS layer.
 *
 * @param {string} filter - The filter containing datetimes to parse
 * @returns {TypeDateFragments | undefined} externalFragmentsOrder - The external fragments order of the layer
 */
export declare function parseDateTimeValuesEsriImageOrWMS(filter: string, externalFragmentsOrder: TypeDateFragments | undefined): string;
export declare function createAliasLookup(outfields: TypeOutfields[] | undefined): TypeAliasLookup;
