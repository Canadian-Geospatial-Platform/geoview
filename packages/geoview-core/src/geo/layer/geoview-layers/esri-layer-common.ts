/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-param-reassign */
import axios from 'axios';
import { Extent } from 'ol/extent';
import { transformExtent } from 'ol/proj';

import cloneDeep from 'lodash/cloneDeep';
import { Cast, TypeJsonArray, TypeJsonObject } from '@/core/types/global-types';
import {
  layerEntryIsGroupLayer,
  TypeBaseLayerEntryConfig,
  TypeEsriDynamicLayerEntryConfig,
  TypeLayerEntryConfig,
  TypeLayerGroupEntryConfig,
  TypeListOfLayerEntryConfig,
} from '../../map/map-schema-types';
import { getLocalizedValue, getXMLHttpRequest } from '@/core/utils/utilities';
import { api } from '@/app';
import { Layer } from '../layer';
import { EsriDynamic, geoviewEntryIsEsriDynamic } from './raster/esri-dynamic';
import { EsriFeature, geoviewEntryIsEsriFeature, TypeEsriFeatureLayerEntryConfig } from './vector/esri-feature';
import { EsriBaseRenderer, getStyleFromEsriRenderer } from '../../renderer/esri-renderer';
import { TimeDimensionESRI } from '@/core/utils/date-mgt';
import { codedValueType, rangeDomainType } from '@/api/events/payloads/get-feature-info-payload';
import { LayerSetPayload } from '@/api/events/payloads/layer-set-payload';

/** ***************************************************************************************************************************
 * This method reads the service metadata from the metadataAccessPath.
 *
 * @returns {Promise<void>} A promise that the execution is completed.
 */
export function commonGetServiceMetadata(this: EsriDynamic | EsriFeature, resolve: (value: void | PromiseLike<void>) => void) {
  const metadataUrl = getLocalizedValue(this.metadataAccessPath, this.mapId);
  if (metadataUrl) {
    getXMLHttpRequest(`${metadataUrl}?f=json`)
      .then((metadataString) => {
        if (metadataString === '{}') {
          api.geoUtilities.setAllLayerStatusToError(this, this.listOfLayerEntryConfig, 'Unable to read metadata');
        } else {
          this.metadata = JSON.parse(metadataString) as TypeJsonObject;
          const { copyrightText } = this.metadata;
          if (copyrightText) this.attributions.push(copyrightText as string);
          resolve();
        }
      })
      .catch((reason) => {
        api.geoUtilities.setAllLayerStatusToError(this, this.listOfLayerEntryConfig, 'Unable to read metadata');
      });
  } else {
    api.geoUtilities.setAllLayerStatusToError(this, this.listOfLayerEntryConfig, 'Unable to read metadata');
  }
}

/** ***************************************************************************************************************************
 * This method validates recursively the configuration of the layer entries to ensure that it is a feature layer identified
 * with a numeric layerId and creates a group entry when a layer is a group.
 *
 * @param {EsriDynamic | EsriFeature} this The this property of the ESRI layer.
 * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
 */
export function commonValidateListOfLayerEntryConfig(this: EsriDynamic | EsriFeature, listOfLayerEntryConfig: TypeListOfLayerEntryConfig) {
  listOfLayerEntryConfig.forEach((layerEntryConfig: TypeLayerEntryConfig) => {
    const layerPath = Layer.getLayerPath(layerEntryConfig);
    if (layerEntryIsGroupLayer(layerEntryConfig)) {
      this.validateListOfLayerEntryConfig(layerEntryConfig.listOfLayerEntryConfig!);
      if (!layerEntryConfig.listOfLayerEntryConfig.length) {
        this.layerLoadError.push({
          layer: layerPath,
          consoleMessage: `Empty layer group (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
        });
        api.event.emit(LayerSetPayload.createLayerSetChangeLayerStatusPayload(this.mapId, layerPath, 'error'));
        return;
      }
    }

    api.event.emit(LayerSetPayload.createLayerSetChangeLayerStatusPayload(this.mapId, layerPath, 'loading'));

    let esriIndex = Number(layerEntryConfig.layerId);
    if (Number.isNaN(esriIndex)) {
      this.layerLoadError.push({
        layer: layerPath,
        consoleMessage: `ESRI layerId must be a number (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
      });
      api.event.emit(LayerSetPayload.createLayerSetChangeLayerStatusPayload(this.mapId, layerPath, 'error'));
      return;
    }

    esriIndex = this.metadata?.layers
      ? (this.metadata.layers as TypeJsonArray).findIndex((layerInfo: TypeJsonObject) => layerInfo.id === esriIndex)
      : -1;

    if (esriIndex === -1) {
      this.layerLoadError.push({
        layer: layerPath,
        consoleMessage: `ESRI layerId not found (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
      });
      api.event.emit(LayerSetPayload.createLayerSetChangeLayerStatusPayload(this.mapId, layerPath, 'error'));
      return;
    }

    if (this.metadata!.layers[esriIndex].type === 'Group Layer') {
      const newListOfLayerEntryConfig: TypeListOfLayerEntryConfig = [];
      (this.metadata!.layers[esriIndex].subLayerIds as TypeJsonArray).forEach((layerId) => {
        const subLayerEntryConfig: TypeLayerEntryConfig = cloneDeep(layerEntryConfig);
        subLayerEntryConfig.parentLayerConfig = Cast<TypeLayerGroupEntryConfig>(layerEntryConfig);
        subLayerEntryConfig.layerId = `${layerId}`;
        subLayerEntryConfig.layerName = {
          en: this.metadata!.layers[layerId as number].name as string,
          fr: this.metadata!.layers[layerId as number].name as string,
        };
        newListOfLayerEntryConfig.push(subLayerEntryConfig);
        api.map(this.mapId).layer.registerLayerConfig(subLayerEntryConfig);
      });

      if (this.registerToLayerSetListenerFunctions[Layer.getLayerPath(layerEntryConfig)])
        this.unregisterFromLayerSets(layerEntryConfig as TypeBaseLayerEntryConfig);
      const switchToGroupLayer = Cast<TypeLayerGroupEntryConfig>(layerEntryConfig);
      delete (layerEntryConfig as TypeBaseLayerEntryConfig).layerStatus;
      switchToGroupLayer.entryType = 'group';
      switchToGroupLayer.layerName = {
        en: this.metadata!.layers[esriIndex].name as string,
        fr: this.metadata!.layers[esriIndex].name as string,
      };
      switchToGroupLayer.isMetadataLayerGroup = true;
      switchToGroupLayer.listOfLayerEntryConfig = newListOfLayerEntryConfig;
      this.validateListOfLayerEntryConfig(newListOfLayerEntryConfig);
      return;
    }

    if (this.esriChildHasDetectedAnError(layerEntryConfig, esriIndex)) {
      api.event.emit(LayerSetPayload.createLayerSetChangeLayerStatusPayload(this.mapId, layerPath, 'error'));
      return;
    }

    if (!layerEntryConfig.layerName)
      layerEntryConfig.layerName = {
        en: this.metadata!.layers[esriIndex].name as string,
        fr: this.metadata!.layers[esriIndex].name as string,
      };
  });
}

/** ***************************************************************************************************************************
 * Extract the domain of the specified field from the metadata. If the type can not be found, return 'string'.
 *
 * @param {string} fieldName field name for which we want to get the domain.
 * @param {TypeLayerEntryConfig} layerConfig layer configuration.
 *
 * @returns {'string' | 'date' | 'number'} The type of the field.
 */
export function commonGetFieldType(
  this: EsriDynamic | EsriFeature,
  fieldName: string,
  layerConfig: TypeLayerEntryConfig
): 'string' | 'date' | 'number' {
  const esriFieldDefinitions = this.layerMetadata[Layer.getLayerPath(layerConfig)].fields as TypeJsonArray;
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
 * @param {string} fieldName field name for which we want to get the type.
 * @param {TypeLayerEntryConfig} layerConfig layer configuration.
 *
 * @returns {null | codedValueType | rangeDomainType} The domain of the field.
 */
export function commonGetFieldDomain(
  this: EsriDynamic | EsriFeature,
  fieldName: string,
  layerConfig: TypeLayerEntryConfig
): null | codedValueType | rangeDomainType {
  const esriFieldDefinitions = this.layerMetadata[Layer.getLayerPath(layerConfig).replace('-unclustered', '')].fields as TypeJsonArray;
  const fieldDefinition = esriFieldDefinitions.find((metadataEntry) => metadataEntry.name === fieldName);
  return fieldDefinition ? Cast<codedValueType | rangeDomainType>(fieldDefinition.domain) : null;
}

/** ***************************************************************************************************************************
 * This method will create a Geoview temporal dimension if it exist in the service metadata
 * @param {TypeJsonObject} esriTimeDimension The ESRI time dimension object
 * @param {TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig} layerEntryConfig The layer entry to configure
 */
export function commonProcessTemporalDimension(
  this: EsriDynamic | EsriFeature,
  esriTimeDimension: TypeJsonObject,
  layerEntryConfig: TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig
) {
  if (esriTimeDimension !== undefined) {
    this.layerTemporalDimension[Layer.getLayerPath(layerEntryConfig)] = api.dateUtilities.createDimensionFromESRI(
      Cast<TimeDimensionESRI>(esriTimeDimension)
    );
  }
}

/** ***************************************************************************************************************************
 * This method verifies if the layer is queryable and sets the outfields and aliasFields of the source feature info.
 *
 * @param {string} capabilities The capabilities that will say if the layer is queryable.
 * @param {string} nameField The display field associated to the layer.
 * @param {string} geometryFieldName The field name of the geometry property.
 * @param {TypeJsonArray} fields An array of field names and its aliases.
 * @param {TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig} layerEntryConfig The layer entry to configure.
 */
export function commonProcessFeatureInfoConfig(
  this: EsriDynamic | EsriFeature,
  capabilities: string,
  nameField: string,
  geometryFieldName: string,
  fields: TypeJsonArray,
  layerEntryConfig: TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig
) {
  if (!layerEntryConfig.source.featureInfo) layerEntryConfig.source.featureInfo = { queryable: capabilities.includes('Query') };
  // dynamic group layer doesn't have fields definition
  if (!layerEntryConfig.isMetadataLayerGroup) {
    // Process undefined outfields or aliasFields ('' = false and !'' = true). Also, if en is undefined, then fr is also undefined.
    // when en and fr are undefined, we set both en and fr to the same value.
    if (!layerEntryConfig.source.featureInfo.outfields?.en || !layerEntryConfig.source.featureInfo.aliasFields?.en) {
      const processOutField = !layerEntryConfig.source.featureInfo.outfields?.en;
      const processAliasFields = !layerEntryConfig.source.featureInfo.aliasFields?.en;
      if (processOutField) {
        layerEntryConfig.source.featureInfo.outfields = { en: '' };
        layerEntryConfig.source.featureInfo.fieldTypes = '';
      }
      if (processAliasFields) layerEntryConfig.source.featureInfo.aliasFields = { en: '' };
      fields.forEach((fieldEntry) => {
        if (fieldEntry.name === geometryFieldName) return;
        if (processOutField) {
          layerEntryConfig.source.featureInfo!.outfields!.en = `${layerEntryConfig.source.featureInfo!.outfields!.en}${fieldEntry.name},`;
          const fieldType = this.getFieldType(fieldEntry.name as string, layerEntryConfig);
          layerEntryConfig.source.featureInfo!.fieldTypes = `${layerEntryConfig.source.featureInfo!.fieldTypes}${fieldType},`;
        }
        if (processAliasFields)
          layerEntryConfig.source.featureInfo!.aliasFields!.en = `${layerEntryConfig.source.featureInfo!.aliasFields!.en}${
            fieldEntry.alias ? fieldEntry.alias : fieldEntry.name
          },`;
      });
      layerEntryConfig.source.featureInfo!.outfields!.en = layerEntryConfig.source.featureInfo!.outfields?.en?.slice(0, -1);
      layerEntryConfig.source.featureInfo!.fieldTypes = layerEntryConfig.source.featureInfo!.fieldTypes?.slice(0, -1);
      layerEntryConfig.source.featureInfo!.aliasFields!.en = layerEntryConfig.source.featureInfo!.aliasFields?.en?.slice(0, -1);
      layerEntryConfig.source.featureInfo!.outfields!.fr = layerEntryConfig.source.featureInfo!.outfields?.en;
      layerEntryConfig.source.featureInfo!.aliasFields!.fr = layerEntryConfig.source.featureInfo!.aliasFields?.en;
    }
    if (!layerEntryConfig.source.featureInfo.nameField)
      if (nameField)
        layerEntryConfig.source.featureInfo.nameField = {
          en: nameField,
          fr: nameField,
        };
      else {
        const en =
          layerEntryConfig.source.featureInfo!.outfields!.en?.split(',')[0] ||
          layerEntryConfig.source.featureInfo!.outfields!.fr?.split(',')[0];
        const fr = en;
        if (en) layerEntryConfig.source.featureInfo.nameField = { en, fr };
      }
  }
}

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
export function commonProcessInitialSettings(
  this: EsriDynamic | EsriFeature,
  visibility: boolean,
  minScale: number,
  maxScale: number,
  extent: TypeJsonObject,
  layerEntryConfig: TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig
) {
  // layerEntryConfig.initialSettings cannot be undefined because config-validation set it to {} if it is undefined.
  if (layerEntryConfig.initialSettings?.visible === undefined) layerEntryConfig.initialSettings!.visible = visibility;
  // ! TODO: The solution implemented in the following two lines is not right. scale and zoom are not the same things.
  // ! if (layerEntryConfig.initialSettings?.minZoom === undefined && minScale !== 0) layerEntryConfig.initialSettings.minZoom = minScale;
  // ! if (layerEntryConfig.initialSettings?.maxZoom === undefined && maxScale !== 0) layerEntryConfig.initialSettings.maxZoom = maxScale;
  if (layerEntryConfig.initialSettings?.extent)
    layerEntryConfig.initialSettings.extent = transformExtent(
      layerEntryConfig.initialSettings.extent,
      'EPSG:4326',
      `EPSG:${api.map(this.mapId).currentProjection}`
    );

  if (!layerEntryConfig.initialSettings?.bounds) {
    const layerExtent = [extent.xmin, extent.ymin, extent.xmax, extent.ymax] as Extent;
    layerEntryConfig.initialSettings!.bounds = layerExtent;
  }
}

/** ***************************************************************************************************************************
 * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
 * initial settings, fields and aliases).
 *
 * @param {TypeLayerEntryConfig} layerEntryConfig The layer entry configuration to process.
 *
 * @returns {Promise<void>} A promise that the layer configuration has its metadata processed.
 */
export function commonProcessLayerMetadata(
  this: EsriDynamic | EsriFeature,
  resolve: (value: void | PromiseLike<void>) => void,
  layerEntryConfig: TypeLayerEntryConfig
) {
  // User-defined groups do not have metadata provided by the service endpoint.
  if (layerEntryIsGroupLayer(layerEntryConfig) && !layerEntryConfig.isMetadataLayerGroup) resolve();
  else {
    let queryUrl = getLocalizedValue(this.metadataAccessPath, this.mapId);
    if (queryUrl) {
      queryUrl = queryUrl.endsWith('/') ? `${queryUrl}${layerEntryConfig.layerId}` : `${queryUrl}/${layerEntryConfig.layerId}`;
      const queryResult = axios.get<TypeJsonObject>(`${queryUrl}?f=pjson`);
      queryResult.then((response) => {
        // layers must have a fields attribute except if it is an metadata layer group.
        if (!response.data.fields && !(layerEntryConfig as TypeLayerGroupEntryConfig).isMetadataLayerGroup)
          throw new Error(`Despite a return code of 200, an error was detected with this query (${queryUrl}?f=pjson)`);
        this.layerMetadata[Layer.getLayerPath(layerEntryConfig)] = response.data;
        if (geoviewEntryIsEsriDynamic(layerEntryConfig) || geoviewEntryIsEsriFeature(layerEntryConfig)) {
          if (!layerEntryConfig.style) {
            const renderer = Cast<EsriBaseRenderer>(response.data.drawingInfo?.renderer);
            if (renderer) layerEntryConfig.style = getStyleFromEsriRenderer(this.mapId, layerEntryConfig, renderer);
          }
          this.processFeatureInfoConfig(
            response.data.capabilities as string,
            response.data.displayField as string,
            response.data.geometryField.name as string,
            response.data.fields as TypeJsonArray,
            layerEntryConfig
          );
          this.processInitialSettings(
            response.data.defaultVisibility as boolean,
            response.data.minScale as number,
            response.data.maxScale as number,
            response.data.extent,
            layerEntryConfig
          );
          this.processTemporalDimension(response.data.timeInfo as TypeJsonObject, layerEntryConfig);
        }
        resolve();
      });
    } else resolve();
  }
}
