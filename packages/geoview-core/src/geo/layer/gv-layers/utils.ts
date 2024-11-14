import { Cast, TypeJsonArray, TypeJsonObject } from '@/core/types/global-types';
import { logger } from '@/core/utils/logger';
import {
  TypeStyleGeometry,
  TypeFeatureInfoEntryPartial,
  codedValueType,
  rangeDomainType,
  TypeFieldEntry,
  TypeFeatureInfoLayerConfig,
  TypeGeometry,
} from '@/geo/map/map-schema-types';
import { TypeOutfieldsType } from '@/api/config/types/map-schema-types';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { EsriFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { EsriImageLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { GeometryApi } from '../geometry/geometry';

/**
 * Returns the type of the specified field.
 * @param {AbstractBaseLayerEntryConfig} layerConfig The layer config
 * @param {string} fieldName field name for which we want to get the type.
 * @returns {TypeOutfieldsType} The type of the field.
 */
export function featureInfoGetFieldType(layerConfig: AbstractBaseLayerEntryConfig, fieldName: string): TypeOutfieldsType {
  const fieldDefinitions = layerConfig.getLayerMetadata()?.source.featureInfo as unknown as TypeFeatureInfoLayerConfig;
  const outFieldEntry = fieldDefinitions.outfields?.find((fieldDefinition) => fieldDefinition.name === fieldName);
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
  const esriFieldDefinitions = layerConfig.getLayerMetadata()?.fields as TypeJsonArray;
  const fieldDefinition = esriFieldDefinitions.find((metadataEntry) => metadataEntry.name === fieldName);
  if (!fieldDefinition) return 'string';
  const esriFieldType = fieldDefinition.type as string;
  if (esriFieldType === 'esriFieldTypeDate') return 'date';
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
// TODO.CONT: call a method getFieldDomain that use config.source.featureInfo.outfields to find a field domain.
export function esriGetFieldDomain(
  layerConfig: EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig,
  fieldName: string
): codedValueType | rangeDomainType | null {
  const esriFieldDefinitions = layerConfig.getLayerMetadata()?.fields as TypeJsonArray;
  const fieldDefinition = esriFieldDefinitions.find((metadataEntry) => metadataEntry.name === fieldName);
  return fieldDefinition ? Cast<codedValueType | rangeDomainType>(fieldDefinition.domain) : null;
}

/**
 * Transforms the query results of an Esri service response - when not querying on the Layers themselves (giving a 'reduced' FeatureInfoEntry).
 * The transformation reads the Esri formatted information and return a list of `TypeFeatureInfoEntryPartial` records.
 * In a similar fashion and response object as the "Query Feature Infos" functionalities done via the Layers.
 *
 * @param results TypeJsonObject The Json Object representing the data from Esri.
 *
 * @returns TypeFeatureInfoEntryPartial[] an array of relared records of type TypeFeatureInfoEntryPartial
 */
export function esriParseFeatureInfoEntries(records: TypeJsonObject[], geometryType?: TypeStyleGeometry): TypeFeatureInfoEntryPartial[] {
  // Loop on the Esri results
  return records.map((rec: TypeJsonObject) => {
    // The coordinates
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coordinates = (rec.geometry?.points || rec.geometry?.paths || rec.geometry?.rings || [rec.geometry?.x, rec.geometry?.y]) as any; // MultiPoint or Line or Polygon or Point schema

    // Prep the TypeFeatureInfoEntryPartial
    const featInfo: TypeFeatureInfoEntryPartial = {
      fieldInfo: {},
      geometry: geometryType ? (GeometryApi.createGeometryFromType(geometryType, coordinates) as unknown as TypeGeometry) : null,
    };

    // Loop on the Esri attributes
    Object.entries(rec.attributes).forEach((tupleAttrValue: [string, unknown]) => {
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
 * @returns {TypeFeatureInfoEntryPartial[] | null} An array of relared records of type TypeFeatureInfoEntryPartial, or an empty array.
 */
export async function esriQueryRecordsByUrl(url: string, geometryType?: TypeStyleGeometry): Promise<TypeFeatureInfoEntryPartial[]> {
  // TODO: Refactor - Suggestion to rework this function and the one in EsriDynamic.getFeatureInfoAtLongLat(), making
  // TO.DO.CONT: the latter redirect to this one here and merge some logic between the 2 functions ideally making this
  // TO.DO.CONT: one here return a TypeFeatureInfoEntry[] with options to have returnGeometry=true or false and such.
  // Query the data
  try {
    const response = await fetch(url);
    const respJson = await response.json();
    if (respJson.error) {
      // Throw
      throw new Error(`Error code = ${respJson.error.code} ${respJson.error.message}` || '');
    }

    // Return the array of TypeFeatureInfoEntryPartial
    return esriParseFeatureInfoEntries(respJson.features, geometryType);
  } catch (error) {
    // Log
    logger.logError('There is a problem with this query: ', url, error);
    throw error;
  }
}

/**
 * Asynchronously queries an Esri feature layer given the url and object ids and returns an array of `TypeFeatureInfoEntryPartial` records.
 * @param {string} layerUrl - An Esri url indicating a feature layer to query
 * @param {TypeStyleGeometry} geometryType - The geometry type for the geometries in the layer being queried (used when returnGeometry is true)
 * @param {number[]} objectIds - The list of objectids to filter the query on
 * @param {string} fields - The list of field names to include in the output
 * @param {boolean} geometry - True to return the geometries in the output
 * @param {number} outSR - The spatial reference of the output geometries from the query
 * @returns {TypeFeatureInfoEntryPartial[] | null} An array of relared records of type TypeFeatureInfoEntryPartial, or an empty array.
 */
export function esriQueryRecordsByUrlObjectIds(
  layerUrl: string,
  geometryType: TypeStyleGeometry,
  objectIds: number[],
  fields: string,
  geometry: boolean,
  outSR?: number
): Promise<TypeFeatureInfoEntryPartial[]> {
  // Query
  const oids = objectIds.join(',');
  const url = `${layerUrl}/query?where=&objectIds=${oids}&outFields=${fields}&returnGeometry=${geometry}&outSR=${outSR}&f=json`;

  // Redirect
  return esriQueryRecordsByUrl(url, geometryType);
}

/**
 * Asynchronously queries an Esri relationship table given the url and returns an array of `TypeFeatureInfoEntryPartial` records.
 * @param {url} string An Esri url indicating a relationship table to query
 * @param {recordGroupIndex} number The group index of the relationship layer on which to read the related records
 * @returns {TypeFeatureInfoEntryPartial[] | null} An array of relared records of type TypeFeatureInfoEntryPartial, or an empty array.
 */
export async function esriQueryRelatedRecordsByUrl(url: string, recordGroupIndex: number): Promise<TypeFeatureInfoEntryPartial[]> {
  // Query the data
  try {
    const response = await fetch(url);
    const respJson = await response.json();
    if (respJson.error) {
      // Throw
      throw new Error(`Error code = ${respJson.error.code} ${respJson.error.message}` || '');
    }

    // If any related record groups found
    if (respJson.relatedRecordGroups.length > 0)
      // Return the array of TypeFeatureInfoEntryPartial
      return esriParseFeatureInfoEntries(respJson.relatedRecordGroups[recordGroupIndex].relatedRecords);
    return Promise.resolve([]);
  } catch (error) {
    // Log
    logger.logError('There is a problem with this query: ', url, error);
    throw error;
  }
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
      throw new Error(`Unsupported geometry type: ${esriGeometryType}`);
  }
}
