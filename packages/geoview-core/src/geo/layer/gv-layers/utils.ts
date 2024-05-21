import { Cast, TypeJsonArray, TypeJsonObject } from '@/core/types/global-types';
import { logger } from '@/core/utils/logger';
import { TypeFeatureInfoEntryPartial, TypeFieldEntry, codedValueType, rangeDomainType } from '@/geo/layer/layer-sets/abstract-layer-set';
import { TypeStyleGeometry } from '@/geo/map/map-schema-types';
import { TypeDisplayLanguage, TypeLocalizedString } from '@/api/config/types/map-schema-types';
import { getLocalizedValue } from '@/core/utils/utilities';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { EsriFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { EsriImageLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';

/**
 * Returns the type of the specified field.
 * @param {AbstractBaseLayerEntryConfig} layerConfig The layer config
 * @param {string} fieldName field name for which we want to get the type.
 * @returns {'string' | 'date' | 'number'} The type of the field.
 */
export function featureInfoGetFieldType(
  layerConfig: AbstractBaseLayerEntryConfig,
  fieldName: string,
  language: TypeDisplayLanguage
): 'string' | 'date' | 'number' {
  const fieldDefinitions = layerConfig.getMetadata()!.source.featureInfo;
  const fieldIndex = getLocalizedValue(Cast<TypeLocalizedString>(fieldDefinitions.outfields), language)?.split(',').indexOf(fieldName);
  if (!fieldIndex || fieldIndex === -1) return 'string';
  return (fieldDefinitions.fieldTypes as string).split(',')[fieldIndex!] as 'string' | 'date' | 'number';
}

/**
 * Returns the type of the specified field.
 * @param {EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig} layerConfig The ESRI layer config
 * @param {string} fieldName field name for which we want to get the type.
 * @returns {'string' | 'date' | 'number'} The type of the field.
 */
export function esriGetFieldType(
  layerConfig: EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig,
  fieldName: string
): 'string' | 'date' | 'number' {
  const esriFieldDefinitions = layerConfig.getMetadata()?.fields as TypeJsonArray;
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
export function esriGetFieldDomain(
  layerConfig: EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig | EsriImageLayerEntryConfig,
  fieldName: string
): codedValueType | rangeDomainType | null {
  const esriFieldDefinitions = layerConfig.getMetadata()?.fields as TypeJsonArray;
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
export function esriParseFeatureInfoEntries(records: TypeJsonObject[]): TypeFeatureInfoEntryPartial[] {
  // Loop on the Esri results
  return records.map((rec: TypeJsonObject) => {
    // Prep the TypeFeatureInfoEntryPartial
    const featInfo: TypeFeatureInfoEntryPartial = {
      fieldInfo: {},
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
 * @param {url} string An Esri url indicating a feature layer to query
 * @returns {TypeFeatureInfoEntryPartial[] | null} An array of relared records of type TypeFeatureInfoEntryPartial, or an empty array.
 */
export async function esriQueryRecordsByUrl(url: string): Promise<TypeFeatureInfoEntryPartial[]> {
  // TODO: Refactor - Suggestion to rework this function and the one in EsriDynamic.getFeatureInfoAtLongLat(), making
  // TO.DO.CONT: the latter redirect to this one here and merge some logic between the 2 functions ideally making this
  // TO.DO.CONT: one here return a TypeFeatureInfoEntry[] with options to have returnGeometry=true or false and such.
  // Query the data
  try {
    const response = await fetch(url);
    const respJson = await response.json();
    if (respJson.error) {
      logger.logInfo('There is a problem with this query: ', url);
      throw new Error(`Error code = ${respJson.error.code} ${respJson.error.message}` || '');
    }

    // Return the array of TypeFeatureInfoEntryPartial
    return esriParseFeatureInfoEntries(respJson.features);
  } catch (error) {
    // Log
    logger.logError('esri-layer-common.queryRecordsByUrl()\n', error);
    throw error;
  }
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
      logger.logInfo('There is a problem with this query: ', url);
      throw new Error(`Error code = ${respJson.error.code} ${respJson.error.message}` || '');
    }

    // If any related record groups found
    if (respJson.relatedRecordGroups.length > 0)
      // Return the array of TypeFeatureInfoEntryPartial
      return esriParseFeatureInfoEntries(respJson.relatedRecordGroups[recordGroupIndex].relatedRecords);
    return Promise.resolve([]);
  } catch (error) {
    // Log
    logger.logError('esri-layer-common.queryRelatedRecordsByUrl()\n', error);
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
    case 'esriGeometryMultipoint':
      return 'Point';

    case 'esriGeometryPolyline':
      return 'LineString';

    case 'esriGeometryPolygon':
    case 'esriGeometryMultiPolygon':
      return 'Polygon';

    default:
      throw new Error(`Unsupported geometry type: ${esriGeometryType}`);
  }
}
