import { Coordinate } from 'ol/coordinate';

import { DateMgt, TypeDateFragments } from '@/core/utils/date-mgt';
import {
  TypeStyleGeometry,
  TypeFeatureInfoEntryPartial,
  codedValueType,
  rangeDomainType,
  TypeFieldEntry,
  TypeFeatureInfoLayerConfig,
  TypeOutfieldsType,
  TypeAliasLookup,
  TypeOutfields,
} from '@/api/config/types/map-schema-types';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { EsriFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { EsriImageLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { GeometryApi } from '@/geo/layer/geometry/geometry';
import { Fetch } from '@/core/utils/fetch-helper';
import { NotSupportedError } from '@/core/exceptions/core-exceptions';

/**
 * Returns the type of the specified field.
 * @param {AbstractBaseLayerEntryConfig} layerConfig The layer config
 * @param {string} fieldName field name for which we want to get the type.
 * @returns {TypeOutfieldsType} The type of the field.
 */
export function featureInfoGetFieldType(layerConfig: AbstractBaseLayerEntryConfig, fieldName: string): TypeOutfieldsType {
  // GV Can be any object so disable eslint and proceed with caution
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layerMetadata = layerConfig.getLayerMetadata() as any;
  const fieldDefinitions = layerMetadata?.source?.featureInfo as TypeFeatureInfoLayerConfig | undefined;
  const outFieldEntry = fieldDefinitions?.outfields?.find((fieldDefinition) => fieldDefinition.name === fieldName);
  return outFieldEntry?.type || 'string';
}

/**
 * Returns the type of the specified field.
 * @param {EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig} layerConfig The ESRI layer config
 * @param {string} fieldName field name for which we want to get the type.
 * @returns {TypeOutfieldsType} The type of the field.
 */
export function esriGetFieldType(
  layerConfig: EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig,
  fieldName: string
): TypeOutfieldsType {
  const esriFieldDefinitions = layerConfig.getLayerMetadata()?.fields;
  const fieldDefinition = esriFieldDefinitions?.find((metadataEntry) => metadataEntry.name === fieldName);
  if (!fieldDefinition) return 'string';
  const esriFieldType = fieldDefinition.type;
  if (esriFieldType === 'esriFieldTypeDate') return 'date';
  if (esriFieldType === 'esriFieldTypeOID') return 'oid';
  if (
    ['esriFieldTypeDouble', 'esriFieldTypeInteger', 'esriFieldTypeSingle', 'esriFieldTypeSmallInteger', 'esriFieldTypeOID'].includes(
      esriFieldType
    )
  )
    return 'number';
  return 'string';
}

/**
 * Returns the domain of the specified field.
 * @param {EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig} layerConfig The ESRI layer config
 * @param {string} fieldName field name for which we want to get the domain.
 * @returns {codedValueType | rangeDomainType | null} The domain of the field.
 */
// TODO: ESRI domains are translated to GeoView domains in the configuration. Any GeoView layer that support geoview domains can
// TO.DOCONT: call a method getFieldDomain that use config.source.featureInfo.outfields to find a field domain.
export function esriGetFieldDomain(
  layerConfig: EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig,
  fieldName: string
): codedValueType | rangeDomainType | null {
  const esriFieldDefinitions = layerConfig.getLayerMetadata()?.fields;
  const fieldDefinition = esriFieldDefinitions?.find((metadataEntry) => metadataEntry.name === fieldName);
  return fieldDefinition ? fieldDefinition.domain : null;
}

/**
 * Transforms the query results of an Esri service response - when not querying on the Layers themselves (giving a 'reduced' FeatureInfoEntry).
 * The transformation reads the Esri formatted information and return a list of `TypeFeatureInfoEntryPartial` records.
 * In a similar fashion and response object as the "Query Feature Infos" functionalities done via the Layers.
 * @param {EsriRelatedRecordsJsonResponseRelatedRecord[]} records The records representing the data from Esri.
 * @param {TypeStyleGeometry?} geometryType - Optional, the geometry type.
 * @returns TypeFeatureInfoEntryPartial[] An array of relared records of type TypeFeatureInfoEntryPartial
 */
export function esriParseFeatureInfoEntries(
  records: EsriRelatedRecordsJsonResponseRelatedRecord[],
  geometryType?: TypeStyleGeometry
): TypeFeatureInfoEntryPartial[] {
  // Loop on the Esri results
  return records.map((rec) => {
    // The coordinates
    const coordinates = rec.geometry?.points || rec.geometry?.paths || rec.geometry?.rings || [rec.geometry?.x, rec.geometry?.y]; // MultiPoint or Line or Polygon or Point schema

    // Prep the TypeFeatureInfoEntryPartial
    const featInfo: TypeFeatureInfoEntryPartial = {
      fieldInfo: {},
      geometry: geometryType ? GeometryApi.createGeometryFromType(geometryType, coordinates) : undefined,
    };

    // Loop on the Esri attributes
    Object.entries(rec.attributes).forEach((tupleAttrValue) => {
      featInfo.fieldInfo[tupleAttrValue[0]] = { value: tupleAttrValue[1] } as TypeFieldEntry;
    });

    // Return the TypeFeatureInfoEntryPartial
    return featInfo;
  });
}

/**
 * Asynchronously queries an Esri feature layer given the url and returns an array of `TypeFeatureInfoEntryPartial` records.
 * @param {string} url - An Esri url indicating a feature layer to query
 * @param {TypeStyleGeometry?} geometryType - The geometry type for the geometries in the layer being queried (used when geometries are returned)
 * @param {boolean} parseFeatureInfoEntries - A boolean to indicate if we use the raw esri output or if we parse it, defaults to true.
 * @returns {TypeFeatureInfoEntryPartial[] | null} An array of relared records of type TypeFeatureInfoEntryPartial, or an empty array.
 */
export async function esriQueryRecordsByUrl(
  url: string,
  geometryType?: TypeStyleGeometry,
  parseFeatureInfoEntries: boolean = true
): Promise<TypeFeatureInfoEntryPartial[]> {
  // TODO: Performance - Refactor - Suggestion to rework this function and the one in EsriDynamic.getFeatureInfoAtLonLat(), making
  // TO.DO.CONT: the latter redirect to this one here and merge some logic between the 2 functions ideally making this
  // TO.DO.CONT: one here return a TypeFeatureInfoEntry[] with options to have returnGeometry=true or false and such.
  // Query the data
  const respJson = await Fetch.fetchEsriJson<EsriRelatedRecordsJsonResponse>(url);

  // Return the array of TypeFeatureInfoEntryPartial or the raw response features array
  return parseFeatureInfoEntries
    ? esriParseFeatureInfoEntries(respJson.features, geometryType)
    : (respJson.features as unknown as TypeFeatureInfoEntryPartial[]);
}

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
export function esriQueryRecordsByUrlObjectIds(
  layerUrl: string,
  geometryType: TypeStyleGeometry,
  objectIds: number[],
  fields: string,
  geometry: boolean,
  outSR?: number,
  maxOffset?: number,
  parseFeatureInfoEntries: boolean = true
): Promise<TypeFeatureInfoEntryPartial[]> {
  // Offset
  const offset = maxOffset !== undefined ? `&maxAllowableOffset=${maxOffset}` : '';

  // Query
  const oids = objectIds.join(',');
  const url = `${layerUrl}/query?&objectIds=${oids}&outFields=${fields}&returnGeometry=${geometry}&outSR=${outSR}&geometryPrecision=1${offset}&f=json`;

  // Redirect
  return esriQueryRecordsByUrl(url, geometryType, parseFeatureInfoEntries);
}

/**
 * Asynchronously queries an Esri relationship table given the url and returns an array of `TypeFeatureInfoEntryPartial` records.
 * @param {string} url - An Esri url indicating a relationship table to query
 * @param {number} recordGroupIndex - The group index of the relationship layer on which to read the related records
 * @returns {Promise<TypeFeatureInfoEntryPartial[]>} A promise of an array of relared records of type TypeFeatureInfoEntryPartial.
 */
export async function esriQueryRelatedRecordsByUrl(url: string, recordGroupIndex: number): Promise<TypeFeatureInfoEntryPartial[]> {
  // Query the data
  const respJson = await Fetch.fetchJson<EsriRelatedRecordsJsonResponse>(url);

  // If any related record groups found
  if (respJson.relatedRecordGroups.length > 0)
    // Return the array of TypeFeatureInfoEntryPartial
    return esriParseFeatureInfoEntries(respJson.relatedRecordGroups[recordGroupIndex].relatedRecords);
  return [];
}

/**
 * Converts an esri geometry type string to a TypeStyleGeometry.
 * @param {string} esriGeometryType - The esri geometry type to convert
 * @returns {TypeStyleGeometry} The corresponding TypeStyleGeometry
 */
export function esriConvertEsriGeometryTypeToOLGeometryType(esriGeometryType: string): TypeStyleGeometry {
  switch (esriGeometryType) {
    case 'esriGeometryPoint':
      return 'Point';
    case 'esriGeometryMultipoint':
      return 'MultiPoint';
    case 'esriGeometryPolyline':
      return 'LineString';
    case 'esriGeometryMultiPolyline':
      return 'MultiLineString';
    case 'esriGeometryPolygon':
      return 'Polygon';
    case 'esriGeometryMultiPolygon':
      return 'MultiPolygon';
    default:
      // Unsupported geometry type
      throw new NotSupportedError(`Unsupported geometry type: ${esriGeometryType}`);
  }
}

/**
 * Parses a datetime filter for use in a Vector Geoviewlayer.
 *
 * @param {string} filter - The filter containing datetimes to parse
 * @returns {TypeDateFragments | undefined} externalFragmentsOrder - The external fragments order of the layer
 */
export function parseDateTimeValuesVector(filter: string, externalFragmentsOrder: TypeDateFragments | undefined): string {
  // The retured filter
  let filterValueToUse = filter;

  // Convert date constants using the externalFragmentsOrder derived from the externalDateFormat
  // OLD REGEX, not working anymore, test before standardization
  //   ...`${filterValueToUse?.replaceAll(/\s{2,}/g, ' ').trim()} `.matchAll(
  //     /(?<=^date\b\s')[\d/\-T\s:+Z]{4,25}(?=')|(?<=[(\s]date\b\s')[\d/\-T\s:+Z]{4,25}(?=')/gi
  //   ),
  const searchDateEntry = [
    ...filterValueToUse.matchAll(
      /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/gi
    ),
  ];

  searchDateEntry.reverse();
  searchDateEntry.forEach((dateFound) => {
    // If the date has a time zone, keep it as is, otherwise reverse its time zone by changing its sign
    const reverseTimeZone = ![20, 25].includes(dateFound[0].length);
    const reformattedDate = DateMgt.applyInputDateFormat(dateFound[0], externalFragmentsOrder, reverseTimeZone);
    filterValueToUse = `${filterValueToUse.slice(0, dateFound.index)}${reformattedDate}${filterValueToUse.slice(
      dateFound.index + dateFound[0].length
    )}`;
  });

  // Return the filter values to use
  return filterValueToUse;
}

/**
 * Parses a datetime filter for use in an Esri Dynamic layer.
 *
 * @param {string} filter - The filter containing datetimes to parse
 * @returns {TypeDateFragments | undefined} externalFragmentsOrder - The external fragments order of the layer
 */
export function parseDateTimeValuesEsriDynamic(filter: string, externalFragmentsOrder: TypeDateFragments | undefined): string {
  // The retured filter
  let filterValueToUse = filter;

  // Convert date constants using the externalFragmentsOrder derived from the externalDateFormat
  // OLD REGEX, not working anymore, test before standardization
  //   ...`${filterValueToUse?.replaceAll(/\s{2,}/g, ' ').trim()} `.matchAll(
  //     /(?<=^date\b\s')[\d/\-T\s:+Z]{4,25}(?=')|(?<=[(\s]date\b\s')[\d/\-T\s:+Z]{4,25}(?=')/gi
  //   ),
  const searchDateEntry = [
    ...filterValueToUse.matchAll(
      /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/gi
    ),
  ];

  searchDateEntry.reverse();
  searchDateEntry.forEach((dateFound) => {
    // If the date has a time zone, keep it as is, otherwise reverse its time zone by changing its sign
    const reverseTimeZone = ![20, 25].includes(dateFound[0].length);
    let reformattedDate = DateMgt.applyInputDateFormat(dateFound[0], externalFragmentsOrder, reverseTimeZone);
    // GV ESRI Dynamic layers doesn't accept the ISO date format. The time zone must be removed. The 'T' separator
    // GV normally placed between the date and the time must be replaced by a space.
    reformattedDate = reformattedDate.slice(0, reformattedDate.length === 20 ? -1 : -6); // drop time zone.
    reformattedDate = reformattedDate.replace('T', ' ');
    filterValueToUse = `${filterValueToUse.slice(0, dateFound.index)}${reformattedDate}${filterValueToUse.slice(
      dateFound.index + dateFound[0].length
    )}`;
  });

  // Return the filter values to use
  return filterValueToUse;
}

/**
 * Parses a datetime filter for use in an Esri Image or WMS layer.
 *
 * @param {string} filter - The filter containing datetimes to parse
 * @returns {TypeDateFragments | undefined} externalFragmentsOrder - The external fragments order of the layer
 */
export function parseDateTimeValuesEsriImageOrWMS(filter: string, externalFragmentsOrder: TypeDateFragments | undefined): string {
  // The retured filter
  let filterValueToUse = filter;

  // Convert date constants using the externalFragmentsOrder derived from the externalDateFormat
  const searchDateEntry = [
    ...`${filterValueToUse} `.matchAll(/(?<=^date\b\s')[\d/\-T\s:+Z]{4,25}(?=')|(?<=[(\s]date\b\s')[\d/\-T\s:+Z]{4,25}(?=')/gi),
  ];
  searchDateEntry.reverse();
  searchDateEntry.forEach((dateFound) => {
    // If the date has a time zone, keep it as is, otherwise reverse its time zone by changing its sign
    const reverseTimeZone = ![20, 25].includes(dateFound[0].length);
    const reformattedDate = DateMgt.applyInputDateFormat(dateFound[0], externalFragmentsOrder, reverseTimeZone);
    filterValueToUse = `${filterValueToUse.slice(0, dateFound.index - 6)}${reformattedDate}${filterValueToUse.slice(
      dateFound.index + dateFound[0].length + 2
    )}`;
  });

  // Return the filter values to use
  return filterValueToUse;
}

// Create lookup dictionary of names to aliases
export function createAliasLookup(outfields: TypeOutfields[] | undefined): TypeAliasLookup {
  if (!outfields) return {};

  const aliasLookup =
    outfields?.reduce((acc, field) => {
      // eslint-disable-next-line no-param-reassign
      acc[field.name] = field.alias;
      return acc;
    }, {} as TypeAliasLookup) ?? {};

  return aliasLookup;
}

export type EsriRelatedRecordsJsonResponse = {
  features: EsriRelatedRecordsJsonResponseRelatedRecord[];
  relatedRecordGroups: EsriRelatedRecordsJsonResponseRelatedRecordGroup[];
};

export type EsriRelatedRecordsJsonResponseRelatedRecordGroup = {
  relatedRecords: EsriRelatedRecordsJsonResponseRelatedRecord[];
};

export type EsriRelatedRecordsJsonResponseRelatedRecord = {
  attributes: { [key: string]: unknown };
  geometry: GeometryJson;
};

export type GeometryJson = {
  points: Coordinate[];
  paths: Coordinate[][];
  rings: Coordinate[][];
  x: Coordinate;
  y: Coordinate;
};
