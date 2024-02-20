/* eslint-disable @typescript-eslint/no-unused-vars, no-param-reassign, no-console */
import axios from 'axios';
import { Extent } from 'ol/extent';

import cloneDeep from 'lodash/cloneDeep';
import { Cast, TypeJsonArray, TypeJsonObject } from '@/core/types/global-types';
import {
  layerEntryIsGroupLayer,
  TypeBaseLayerEntryConfig,
  TypeEsriDynamicLayerEntryConfig,
  TypeEsriImageLayerEntryConfig,
  TypeLayerEntryConfig,
  TypeLayerGroupEntryConfig,
  TypeListOfLayerEntryConfig,
} from '@/geo/map/map-schema-types';
import { getLocalizedValue, getXMLHttpRequest } from '@/core/utils/utilities';
import { api } from '@/app';
import { Layer } from '../layer';
import { EsriDynamic, geoviewEntryIsEsriDynamic } from './raster/esri-dynamic';
import { EsriFeature, geoviewEntryIsEsriFeature, TypeEsriFeatureLayerEntryConfig } from './vector/esri-feature';
import { EsriBaseRenderer, getStyleFromEsriRenderer } from '../../renderer/esri-renderer';
import { TimeDimensionESRI } from '@/core/utils/date-mgt';
import {
  codedValueType,
  rangeDomainType,
  LayerSetPayload,
  TypeFeatureInfoEntry,
  TypeFeatureInfoEntryPartial,
  TypeFieldEntry,
} from '@/api/events/payloads';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { EsriImage, layerConfigIsEsriImage } from './raster/esri-image';
import { logger } from '@/core/utils/logger';

/** ***************************************************************************************************************************
 * This method reads the service metadata from the metadataAccessPath.
 *
 * @param {EsriDynamic | EsriFeature} this The ESRI layer instance pointer.
 *
 * @returns {Promise<void>} A promise that the execution is completed.
 */
export async function commonfetchServiceMetadata(this: EsriDynamic | EsriFeature): Promise<void> {
  this.setLayerPhase('fetchServiceMetadata');
  const metadataUrl = getLocalizedValue(this.metadataAccessPath, this.mapId);
  if (metadataUrl) {
    try {
      const metadataString = await getXMLHttpRequest(`${metadataUrl}?f=json`);
      if (metadataString === '{}') this.setAllLayerStatusTo('error', this.listOfLayerEntryConfig, 'Unable to read metadata');
      else {
        this.metadata = JSON.parse(metadataString) as TypeJsonObject;
        if ('error' in this.metadata) throw new Error(`Error code = ${this.metadata.error.code}, ${this.metadata.error.message}`);
        const { copyrightText } = this.metadata;
        if (copyrightText) this.attributions.push(copyrightText as string);
      }
    } catch (error) {
      logger.logInfo('Unable to read metadata', error);
      this.setAllLayerStatusTo('error', this.listOfLayerEntryConfig, 'Unable to read metadata');
    }
  } else {
    this.setAllLayerStatusTo('error', this.listOfLayerEntryConfig, 'Unable to read metadata');
  }
}

/** ***************************************************************************************************************************
 * This method validates recursively the configuration of the layer entries to ensure that it is a feature layer identified
 * with a numeric layerId and creates a group entry when a layer is a group.
 *
 * @param {EsriDynamic | EsriFeature} this The ESRI layer instance pointer.
 * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
 */
export function commonValidateListOfLayerEntryConfig(this: EsriDynamic | EsriFeature, listOfLayerEntryConfig: TypeListOfLayerEntryConfig) {
  this.setLayerPhase('validateListOfLayerEntryConfig');
  listOfLayerEntryConfig.forEach((layerConfig: TypeLayerEntryConfig, i) => {
    const { layerPath } = layerConfig;
    if (layerConfig.layerStatus === 'error') return;
    if (layerEntryIsGroupLayer(layerConfig)) {
      this.validateListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig!);
      if (!(layerConfig as TypeLayerGroupEntryConfig).listOfLayerEntryConfig.length) {
        this.layerLoadError.push({
          layer: layerPath,
          loggerMessage: `Empty layer group (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
        });
        layerConfig.layerStatus = 'error';
        return;
      }
    }

    layerConfig.layerStatus = 'processing';

    let esriIndex = Number(layerConfig.layerId);
    if (Number.isNaN(esriIndex)) {
      this.layerLoadError.push({
        layer: layerPath,
        loggerMessage: `ESRI layerId must be a number (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
      });
      layerConfig.layerStatus = 'error';
      return;
    }

    esriIndex = this.metadata?.layers
      ? (this.metadata.layers as TypeJsonArray).findIndex((layerInfo: TypeJsonObject) => layerInfo.id === esriIndex)
      : -1;

    if (esriIndex === -1) {
      this.layerLoadError.push({
        layer: layerPath,
        loggerMessage: `ESRI layerId not found (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
      });
      layerConfig.layerStatus = 'error';
      return;
    }

    if (this.metadata!.layers[esriIndex].type === 'Group Layer') {
      // We will create dynamically a group layer.
      const newListOfLayerEntryConfig: TypeListOfLayerEntryConfig = [];
      // Group layer are not registered to layer sets.
      if (this.registerToLayerSetListenerFunctions[layerPath]) this.unregisterFromLayerSets(layerConfig as TypeBaseLayerEntryConfig);
      const switchToGroupLayer = Cast<TypeLayerGroupEntryConfig>(cloneDeep(layerConfig));
      switchToGroupLayer.entryType = 'group';
      switchToGroupLayer.layerName = {
        en: this.metadata!.layers[esriIndex].name as string,
        fr: this.metadata!.layers[esriIndex].name as string,
      };
      switchToGroupLayer.isMetadataLayerGroup = true;
      switchToGroupLayer.listOfLayerEntryConfig = newListOfLayerEntryConfig;
      const groupLayerConfig = new TypeLayerGroupEntryConfig(switchToGroupLayer as TypeLayerGroupEntryConfig);
      // Replace the old version of the layer with the new layer group
      listOfLayerEntryConfig[i] = groupLayerConfig;
      // Don't forget to replace the old version in registeredLayers
      api.maps[this.mapId].layer.registeredLayers[groupLayerConfig.layerPath] = groupLayerConfig;

      (this.metadata!.layers[esriIndex].subLayerIds as TypeJsonArray).forEach((layerId) => {
        const subLayerEntryConfig: TypeLayerEntryConfig = geoviewEntryIsEsriDynamic(layerConfig)
          ? new TypeEsriDynamicLayerEntryConfig(layerConfig as TypeEsriDynamicLayerEntryConfig)
          : new TypeEsriFeatureLayerEntryConfig(layerConfig as TypeEsriFeatureLayerEntryConfig);
        subLayerEntryConfig.parentLayerConfig = groupLayerConfig;
        subLayerEntryConfig.layerId = `${layerId}`;
        subLayerEntryConfig.layerName = {
          en: this.metadata!.layers[layerId as number].name as string,
          fr: this.metadata!.layers[layerId as number].name as string,
        };
        newListOfLayerEntryConfig.push(subLayerEntryConfig);
        subLayerEntryConfig.registerLayerConfig();
      });

      this.validateListOfLayerEntryConfig(newListOfLayerEntryConfig);
      return;
    }

    if (this.esriChildHasDetectedAnError(layerConfig, esriIndex)) {
      layerConfig.layerStatus = 'error';
      return;
    }

    if (!layerConfig.layerName)
      layerConfig.layerName = {
        en: this.metadata!.layers[esriIndex].name as string,
        fr: this.metadata!.layers[esriIndex].name as string,
      };
  });
}

/** ***************************************************************************************************************************
 * Extract the domain of the specified field from the metadata. If the type can not be found, return 'string'.
 *
 * @param {EsriDynamic | EsriFeature} this The ESRI layer instance pointer.
 * @param {string} fieldName field name for which we want to get the domain.
 * @param {TypeLayerEntryConfig} layerConfig layer configuration.
 *
 * @returns {'string' | 'date' | 'number'} The type of the field.
 */
export function commonGetFieldType(
  this: EsriDynamic | EsriFeature | EsriImage,
  fieldName: string,
  layerConfig: TypeLayerEntryConfig
): 'string' | 'date' | 'number' {
  const esriFieldDefinitions = this.layerMetadata[layerConfig.layerPath].fields as TypeJsonArray;
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

/** ***************************************************************************************************************************
 * Return the type of the specified field.
 *
 * @param {EsriDynamic | EsriFeature} this The ESRI layer instance pointer.
 * @param {string} fieldName field name for which we want to get the type.
 * @param {TypeLayerEntryConfig} layerConfig layer configuration.
 *
 * @returns {null | codedValueType | rangeDomainType} The domain of the field.
 */
export function commonGetFieldDomain(
  this: EsriDynamic | EsriFeature | EsriImage,
  fieldName: string,
  layerConfig: TypeLayerEntryConfig
): null | codedValueType | rangeDomainType {
  const esriFieldDefinitions = this.layerMetadata[layerConfig.layerPath].fields as TypeJsonArray;
  const fieldDefinition = esriFieldDefinitions.find((metadataEntry) => metadataEntry.name === fieldName);
  return fieldDefinition ? Cast<codedValueType | rangeDomainType>(fieldDefinition.domain) : null;
}

/** ***************************************************************************************************************************
 * This method will create a Geoview temporal dimension if it exist in the service metadata
 *
 * @param {EsriDynamic | EsriFeature} this The ESRI layer instance pointer.
 * @param {TypeJsonObject} esriTimeDimension The ESRI time dimension object
 * @param {TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig} layerConfig The layer entry to configure
 */
export function commonProcessTemporalDimension(
  this: EsriDynamic | EsriFeature | EsriImage,
  esriTimeDimension: TypeJsonObject,
  layerConfig: TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig | TypeEsriImageLayerEntryConfig
) {
  if (esriTimeDimension !== undefined) {
    this.layerTemporalDimension[layerConfig.layerPath] = api.dateUtilities.createDimensionFromESRI(
      Cast<TimeDimensionESRI>(esriTimeDimension)
    );
  }
}

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
export function commonProcessFeatureInfoConfig(
  this: EsriDynamic | EsriFeature | EsriImage,
  capabilities: string,
  nameField: string,
  geometryFieldName: string,
  fields: TypeJsonArray,
  layerConfig: TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig | TypeEsriImageLayerEntryConfig
) {
  if (!layerConfig.source.featureInfo) layerConfig.source.featureInfo = { queryable: capabilities.includes('Query') };
  MapEventProcessor.setMapLayerQueryable(this.mapId, layerConfig.layerPath, layerConfig.source.featureInfo.queryable);
  // dynamic group layer doesn't have fields definition
  if (!layerConfig.isMetadataLayerGroup) {
    // Process undefined outfields or aliasFields ('' = false and !'' = true). Also, if en is undefined, then fr is also undefined.
    // when en and fr are undefined, we set both en and fr to the same value.
    if (!layerConfig.source.featureInfo.outfields?.en || !layerConfig.source.featureInfo.aliasFields?.en) {
      const processOutField = !layerConfig.source.featureInfo.outfields?.en;
      const processAliasFields = !layerConfig.source.featureInfo.aliasFields?.en;
      if (processOutField) {
        layerConfig.source.featureInfo.outfields = { en: '' };
        layerConfig.source.featureInfo.fieldTypes = '';
      }
      if (processAliasFields) layerConfig.source.featureInfo.aliasFields = { en: '' };
      fields.forEach((fieldEntry) => {
        if (fieldEntry.name === geometryFieldName) return;
        if (processOutField) {
          layerConfig.source.featureInfo!.outfields!.en = `${layerConfig.source.featureInfo!.outfields!.en}${fieldEntry.name},`;
          const fieldType = commonGetFieldType.call(this, fieldEntry.name as string, layerConfig);
          layerConfig.source.featureInfo!.fieldTypes = `${layerConfig.source.featureInfo!.fieldTypes}${fieldType},`;
        }
        if (processAliasFields)
          layerConfig.source.featureInfo!.aliasFields!.en = `${layerConfig.source.featureInfo!.aliasFields!.en}${
            fieldEntry.alias ? fieldEntry.alias : fieldEntry.name
          },`;
      });
      layerConfig.source.featureInfo!.outfields!.en = layerConfig.source.featureInfo!.outfields?.en?.slice(0, -1);
      layerConfig.source.featureInfo!.fieldTypes = layerConfig.source.featureInfo!.fieldTypes?.slice(0, -1);
      layerConfig.source.featureInfo!.aliasFields!.en = layerConfig.source.featureInfo!.aliasFields?.en?.slice(0, -1);
      layerConfig.source.featureInfo!.outfields!.fr = layerConfig.source.featureInfo!.outfields?.en;
      layerConfig.source.featureInfo!.aliasFields!.fr = layerConfig.source.featureInfo!.aliasFields?.en;
    }
    if (!layerConfig.source.featureInfo.nameField)
      if (nameField)
        layerConfig.source.featureInfo.nameField = {
          en: nameField,
          fr: nameField,
        };
      else {
        const en =
          layerConfig.source.featureInfo!.outfields!.en?.split(',')[0] || layerConfig.source.featureInfo!.outfields!.fr?.split(',')[0];
        const fr = en;
        if (en) layerConfig.source.featureInfo.nameField = { en, fr };
      }
  }
}

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
export function commonProcessInitialSettings(
  this: EsriDynamic | EsriFeature | EsriImage,
  visibility: boolean,
  minScale: number,
  maxScale: number,
  extent: TypeJsonObject,
  layerConfig: TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig | TypeEsriImageLayerEntryConfig
) {
  // layerConfig.initialSettings cannot be undefined because config-validation set it to {} if it is undefined.
  if (layerConfig.initialSettings?.visible === undefined) layerConfig.initialSettings!.visible = visibility ? 'yes' : 'no';
  // ! TODO: The solution implemented in the following two lines is not right. scale and zoom are not the same things.
  // ! if (layerConfig.initialSettings?.minZoom === undefined && minScale !== 0) layerConfig.initialSettings.minZoom = minScale;
  // ! if (layerConfig.initialSettings?.maxZoom === undefined && maxScale !== 0) layerConfig.initialSettings.maxZoom = maxScale;
  if (layerConfig.initialSettings?.extent)
    layerConfig.initialSettings.extent = api.projection.transformExtent(
      layerConfig.initialSettings.extent,
      'EPSG:4326',
      `EPSG:${MapEventProcessor.getMapState(this.mapId).currentProjection}`
    );

  if (!layerConfig.initialSettings?.bounds) {
    const layerExtent = [extent.xmin, extent.ymin, extent.xmax, extent.ymax] as Extent;
    layerConfig.initialSettings!.bounds = layerExtent;
  }
}

/** ***************************************************************************************************************************
 * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
 * initial settings, fields and aliases).
 *
 * @param {EsriDynamic | EsriFeature} this The ESRI layer instance pointer.
 * @param {TypeLayerEntryConfig} layerConfig The layer entry configuration to process.
 *
 * @returns {Promise<TypeLayerEntryConfig>} A promise that the layer configuration has its metadata processed.
 */
export async function commonProcessLayerMetadata(
  this: EsriDynamic | EsriFeature | EsriImage,
  layerConfig: TypeLayerEntryConfig
): Promise<TypeLayerEntryConfig> {
  // User-defined groups do not have metadata provided by the service endpoint.
  if (layerEntryIsGroupLayer(layerConfig) && !layerConfig.isMetadataLayerGroup) return layerConfig;
  const { layerPath } = layerConfig;

  let queryUrl = getLocalizedValue(this.metadataAccessPath, this.mapId);
  if (queryUrl) {
    queryUrl = queryUrl.endsWith('/') ? `${queryUrl}${layerConfig.layerId}` : `${queryUrl}/${layerConfig.layerId}`;
    try {
      const { data } = await axios.get<TypeJsonObject>(`${queryUrl}?f=pjson`);
      // layers must have a fields attribute except if it is an metadata layer group.
      if (!data?.fields && !(layerConfig as TypeLayerGroupEntryConfig).isMetadataLayerGroup && layerConfig.schemaTag !== 'esriImage') {
        layerConfig.layerStatus = 'error';
        if (data?.error) throw new Error(`Error code = ${data.error.code}, ${data.error.message}`);
        else throw new Error(`Despite a return code of 200, no fields was returned with this query (${queryUrl}?f=pjson)`);
      }
      this.layerMetadata[layerPath] = data;
      if (geoviewEntryIsEsriDynamic(layerConfig) || geoviewEntryIsEsriFeature(layerConfig)) {
        if (!layerConfig.style) {
          const renderer = Cast<EsriBaseRenderer>(data.drawingInfo?.renderer);
          if (renderer) layerConfig.style = getStyleFromEsriRenderer(renderer);
        }
        this.processFeatureInfoConfig(
          data.capabilities as string,
          data.displayField as string,
          data.geometryField.name as string,
          data.fields as TypeJsonArray,
          layerConfig
        );
        this.processInitialSettings(
          data.defaultVisibility as boolean,
          data.minScale as number,
          data.maxScale as number,
          data.extent,
          layerConfig
        );
        commonProcessTemporalDimension.call(this, data.timeInfo as TypeJsonObject, layerConfig);
      }

      // When we get here, we know that the metadata (if the service provide some) are processed.
      // We need to signal to the layer sets that the 'processed' phase is done. Be aware that the
      // layerStatus setter is doing a lot of things behind the scene.
      layerConfig.layerStatus = 'processed';
    } catch (error) {
      layerConfig.layerStatus = 'error';
      console.log(error);
    }
  }
  return layerConfig;
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
export function parseFeatureInfoEntries(records: TypeJsonObject[]): TypeFeatureInfoEntryPartial[] {
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
export async function queryRecordsByUrl(url: string): Promise<TypeFeatureInfoEntryPartial[] | null> {
  // TODO: Refactor - Suggestion to rework this function and the one in EsriDynamic.getFeatureInfoAtLongLat(), making
  // TO.DO.CONT: the latter redirect to this one here and merge some logic between the 2 functions ideally making this one here return a TypeFeatureInfoEntry[] with options to have returnGeometry=true or false and such.
  // Query the data
  try {
    const response = await fetch(url);
    const respJson = await response.json();
    const jsonResponse = await response.json();
    if (jsonResponse.error) {
      logger.logInfo('There is a problem with this query: ', url);
      throw new Error(`Error code = ${jsonResponse.error.code} ${jsonResponse.error.message}` || '');
    }

    // Return the array of TypeFeatureInfoEntryPartial
    return parseFeatureInfoEntries(respJson.features);
  } catch (error) {
    // Log
    logger.logError('esri-layer-common.queryRelatedRecordsByUrl()\n', error);
    return null;
  }
}

/**
 * Asynchronously queries an Esri relationship table given the url and returns an array of `TypeFeatureInfoEntryPartial` records.
 * @param {url} string An Esri url indicating a relationship table to query
 * @param {recordGroupIndex} number The group index of the relationship layer on which to read the related records
 * @returns {TypeFeatureInfoEntryPartial[] | null} An array of relared records of type TypeFeatureInfoEntryPartial, or an empty array.
 */
export async function queryRelatedRecordsByUrl(url: string, recordGroupIndex: number): Promise<TypeFeatureInfoEntryPartial[] | null> {
  // Query the data
  try {
    const response = await fetch(url);
    const respJson = await response.json();
    const jsonResponse = await response.json();
    if (jsonResponse.error) {
      logger.logInfo('There is a problem with this query: ', url);
      throw new Error(`Error code = ${jsonResponse.error.code} ${jsonResponse.error.message}` || '');
    }

    // If any related record groups found
    if (respJson.relatedRecordGroups.length > 0)
      // Return the array of TypeFeatureInfoEntryPartial
      return parseFeatureInfoEntries(respJson.relatedRecordGroups[recordGroupIndex].relatedRecords);
    return Promise.resolve([]);
  } catch (error) {
    // Log
    logger.logError('esri-layer-common.queryRelatedRecordsByUrl()\n', error);
    return null;
  }
}
