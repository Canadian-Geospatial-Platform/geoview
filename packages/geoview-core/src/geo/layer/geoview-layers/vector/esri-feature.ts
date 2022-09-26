/* eslint-disable no-param-reassign */
import axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';

import { Cast, toJsonObject, TypeJsonArray, TypeJsonObject } from '../../../../core/types/global-types';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '../abstract-geoview-layers';
import { AbstractGeoViewVector } from './abstract-geoview-vector';

import {
  TypeLayerEntryConfig,
  TypeVectorLayerEntryConfig,
  TypeVectorSourceInitialConfig,
  TypeGeoviewLayerConfig,
  TypeListOfLayerEntryConfig,
  TypeLayerGroupEntryConfig,
} from '../../../map/map-schema-types';

import { getLocalizedValue, getXMLHttpRequest } from '../../../../core/utils/utilities';
import { EsriBaseRenderer, getStyleFromEsriRenderer } from '../../../renderer/esri-renderer';

export interface TypeSourceEsriFeatureInitialConfig extends Omit<TypeVectorSourceInitialConfig, 'format'> {
  format: 'EsriJSON';
}

export interface TypeEsriFeatureLayerEntryConfig extends Omit<TypeVectorLayerEntryConfig, 'source'> {
  source: TypeSourceEsriFeatureInitialConfig;
}

export interface TypeEsriFeatureLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: 'esriFeature';
  listOfLayerEntryConfig: TypeEsriFeatureLayerEntryConfig[];
}

/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeGeoviewLayerConfig as a TypeEsriFeatureLayerConfig if the geoviewLayerType attribute
 * of the verifyIfLayer parameter is ESRI_FEATURE. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsEsriFeature = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeEsriFeatureLayerConfig => {
  return verifyIfLayer.geoviewLayerType === CONST_LAYER_TYPES.ESRI_FEATURE;
};

/** *****************************************************************************************************************************
 * Type Gard function that redefines an AbstractGeoViewLayer as an EsriFeature if the type attribute of the verifyIfGeoViewLayer
 * parameter is ESRI_FEATURE. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention
 * is valid
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewLayerIsEsriFeature = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is EsriFeature => {
  return verifyIfGeoViewLayer.type === CONST_LAYER_TYPES.ESRI_FEATURE;
};

/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeLayerEntryConfig as a TypeEsriFeatureLayerEntryConfig if the geoviewLayerType
 * attribute of the verifyIfGeoViewEntry.geoviewRootLayer attribute is ESRI_FEATURE. The type ascention applies only to the true
 * block of the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention
 * is valid
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsEsriFeature = (
  verifyIfGeoViewEntry: TypeLayerEntryConfig
): verifyIfGeoViewEntry is TypeEsriFeatureLayerEntryConfig => {
  return verifyIfGeoViewEntry.geoviewRootLayer!.geoviewLayerType === CONST_LAYER_TYPES.ESRI_FEATURE;
};

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** *****************************************************************************************************************************
 * A class to add esri feature layer.
 *
 * @exports
 * @class EsriFeature
 */
// ******************************************************************************************************************************
export class EsriFeature extends AbstractGeoViewVector {
  /** ***************************************************************************************************************************
   * Initialize layer.
   *
   * @param {string} mapId The id of the map.
   * @param {TypeEsriFeatureLayerConfig} layerConfig The layer configuration.
   */
  constructor(mapId: string, layerConfig: TypeEsriFeatureLayerConfig) {
    super(CONST_LAYER_TYPES.ESRI_FEATURE, layerConfig, mapId);
  }

  /** ***************************************************************************************************************************
   * This method reads the service metadata from the metadataAccessPath.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected getServiceMetadata(): Promise<void> {
    const promisedExecution = new Promise<void>((resolve) => {
      const metadataUrl = getLocalizedValue(this.metadataAccessPath, this.mapId);
      if (metadataUrl) {
        getXMLHttpRequest(`${metadataUrl}?f=json`).then((metadataString) => {
          if (metadataString === '{}') throw new Error(`Cant't read service metadata for layer ${this.layerId} of map ${this.mapId}.`);
          else {
            this.metadata = toJsonObject(JSON.parse(metadataString));
            const { copyrightText } = this.metadata;
            if (copyrightText) this.attributions.push(copyrightText as string);
            resolve();
          }
        });
      } else throw new Error(`Cant't read service metadata for layer ${this.layerId} of map ${this.mapId}.`);
    });
    return promisedExecution;
  }

  /** ***************************************************************************************************************************
   * This method validates recursively the configuration of the layer entries to ensure that it is a feature layer identified
   * with a numeric layerId and creates a group entry when a layer is a group.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
   *
   * @returns {TypeListOfLayerEntryConfig} A new list of layer entries configuration with deleted error layers.
   */
  protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): TypeListOfLayerEntryConfig {
    return listOfLayerEntryConfig.filter((layerEntryConfig: TypeLayerEntryConfig) => {
      if (layerEntryConfig.entryType === 'group') {
        layerEntryConfig.listOfLayerEntryConfig = this.validateListOfLayerEntryConfig(layerEntryConfig.listOfLayerEntryConfig);
        return layerEntryConfig.listOfLayerEntryConfig.length; // if the list is empty. then delete the node.
      }
      const esriIndex = Number(layerEntryConfig.layerId);
      if (Number.isNaN(esriIndex)) {
        this.layerLoadError.push(layerEntryConfig.layerId);
        return false;
      }
      if (this.metadata!.layers[esriIndex].type === 'Group Layer') {
        const newListOfLayerEntryConfig: TypeListOfLayerEntryConfig = [];
        (this.metadata!.layers[esriIndex].subLayerIds as TypeJsonArray).forEach((layerId) => {
          const subLayerEntryConfig: TypeLayerEntryConfig = cloneDeep(layerEntryConfig);
          subLayerEntryConfig.parentLayerConfig = Cast<TypeLayerGroupEntryConfig>(layerEntryConfig);
          subLayerEntryConfig.layerId = `${layerId}`;
          let enDataAccessPath = layerEntryConfig.source!.dataAccessPath!.en!;
          let frDataAccessPath = layerEntryConfig.source!.dataAccessPath!.fr!;
          enDataAccessPath = `${enDataAccessPath.slice(0, enDataAccessPath.lastIndexOf('/'))}/${layerId}`;
          frDataAccessPath = `${frDataAccessPath.slice(0, frDataAccessPath.lastIndexOf('/'))}/${layerId}`;
          subLayerEntryConfig.source!.dataAccessPath = {
            en: enDataAccessPath,
            fr: frDataAccessPath,
          };
          subLayerEntryConfig.layerName = {
            en: this.metadata!.layers[layerId as number].name as string,
            fr: this.metadata!.layers[layerId as number].name as string,
          };
          newListOfLayerEntryConfig.push(subLayerEntryConfig);
        });
        Object.assign(layerEntryConfig, {
          entryType: 'group',
          // esriType is not part of the schema, but we need it to distinguish ESRI group layer in processListOfLayerEntryMetadata
          esriType: 'Group Layer',
          listOfLayerEntryConfig: newListOfLayerEntryConfig,
        });

        return true;
      }
      if (this.metadata!.layers[esriIndex].type !== 'Feature Layer') {
        this.layerLoadError.push(layerEntryConfig.layerId);
        return false;
      }
      layerEntryConfig.layerName = {
        en: this.metadata!.layers[esriIndex].name as string,
        fr: this.metadata!.layers[esriIndex].name as string,
      };
      return true;
    });
  }

  /** ***************************************************************************************************************************
   * This method processes recursively the metadata of each layer in the "layer list" configuration.
   *
   *  @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layers to process.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected processListOfLayerEntryMetadata(
    listOfLayerEntryConfig: TypeListOfLayerEntryConfig = this.listOfLayerEntryConfig
  ): Promise<void> {
    const promisedListOfLayerEntryProcessed = new Promise<void>((resolve) => {
      const promisedAllLayerDone: Promise<void>[] = [];
      listOfLayerEntryConfig.forEach((layerEntryConfig: TypeLayerEntryConfig) => {
        if ('esriType' in layerEntryConfig) promisedAllLayerDone.push(this.processEsriGroupLayer(layerEntryConfig));
        else if (layerEntryConfig.entryType === 'group')
          promisedAllLayerDone.push(this.processListOfLayerEntryMetadata(layerEntryConfig.listOfLayerEntryConfig));
        else promisedAllLayerDone.push(this.processLayerMetadata(layerEntryConfig as TypeVectorLayerEntryConfig));
      });
      Promise.all(promisedAllLayerDone).then(() => resolve());
    });
    return promisedListOfLayerEntryProcessed;
  }

  /** ***************************************************************************************************************************
   * This method is used to process ESRI layers that define an ESRI group layer. These layers behave as a GeoView group layer and
   * also as a data layer (i.e. they have extent, visibility and query flag definition). ESRI group layer can be identified by
   * the presence of a esriType attribute. The attribute content is 'Group Layer', but it has no meaning. We could have decided
   * to put any other value, and it would not have had any impact on the code.
   *
   * @param {TypeVectorLayerEntryConfig} layerEntryConfig The layer entry configuration to process.
   *
   * @returns {Promise<void>} A promise that the vector layer configuration has its metadata and group layers processed.
   */
  private processEsriGroupLayer(layerEntryConfig: TypeVectorLayerEntryConfig): Promise<void> {
    const promisedListOfLayerEntryProcessed = new Promise<void>((resolve) => {
      this.processLayerMetadata(layerEntryConfig as TypeVectorLayerEntryConfig).then(() => {
        this.processListOfLayerEntryMetadata(layerEntryConfig.listOfLayerEntryConfig!).then(() => resolve());
      });
    });
    return promisedListOfLayerEntryProcessed;
  }

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
   * initial settings, fields and aliases).
   *
   * @param {TypeVectorLayerEntryConfig} layerEntryConfig The layer entry configuration to process.
   *
   * @returns {Promise<void>} A promise that the vector layer configuration has its metadata processed.
   */
  private processLayerMetadata(layerEntryConfig: TypeVectorLayerEntryConfig): Promise<void> {
    const promiseOfExecution = new Promise<void>((resolve) => {
      const queryUrl = getLocalizedValue(layerEntryConfig.source!.dataAccessPath, this.mapId);
      if (queryUrl) {
        const queryResult = axios.get<TypeJsonObject>(`${queryUrl}?f=pjson`);
        queryResult.then((response) => {
          if (!response.data.fields) {
            ((): never => {
              throw new Error(`Despite a return code of 200, an error was detected with this query (${queryUrl}?f=pjson)`);
            })();
          }
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
          this.processInitialSettings(response.data.defaultVisibility as boolean, response.data.extent, layerEntryConfig);
          resolve();
        });
      } else resolve();
    });
    return promiseOfExecution;
  }

  /** ***************************************************************************************************************************
   * This method verify if the layer is queryable and set the array of fields and aliases.
   *
   * @param {boolean} visibility The default visibility of the layer.
   * @param {TypeJsonObject} extent The layer extent.
   * @param {TypeVectorLayerEntryConfig} layerEntryConfig The vector layer entry to configure.
   */
  private processInitialSettings(visibility: boolean, extent: TypeJsonObject, layerEntryConfig: TypeVectorLayerEntryConfig) {
    if (!layerEntryConfig.initialSettings) layerEntryConfig.initialSettings = {};
    if (!layerEntryConfig.initialSettings?.visible) layerEntryConfig.initialSettings.visible = visibility;
    if (!layerEntryConfig.initialSettings?.extent)
      layerEntryConfig.initialSettings.extent = [
        extent.xmin as number,
        extent.ymin as number,
        extent.xmax as number,
        extent.ymax as number,
      ];
  }

  /** ***************************************************************************************************************************
   * This method verifies if the layer is queryable and sets the outfields and aliasFields of the source feature info.
   *
   * @param {string} capabilities The capabilities that will say if the layer is queryable.
   * @param {string} nameField The display field associated to the layer.
   * @param {string} geometryFieldName The field name of the geometry property.
   * @param {TypeJsonArray} fields An array of field names and its aliases.
   * @param {TypeVectorLayerEntryConfig} layerEntryConfig The vector layer entry to configure.
   */
  private processFeatureInfoConfig(
    capabilities: string,
    nameField: string,
    geometryFieldName: string,
    fields: TypeJsonArray,
    layerEntryConfig: TypeVectorLayerEntryConfig
  ) {
    if (!layerEntryConfig.source) layerEntryConfig.source = {};
    if (!layerEntryConfig.source.featureInfo) layerEntryConfig.source.featureInfo = { queryable: capabilities.includes('Query') };
    // ESRI group layer doesn't have fields definition
    if (!('esriType' in layerEntryConfig)) {
      if (!layerEntryConfig.source.featureInfo.nameField)
        layerEntryConfig.source.featureInfo.nameField = {
          en: nameField,
          fr: nameField,
        };

      // Process undefined outfields or aliasFields ('' = false and !'' = true)
      if (!layerEntryConfig.source.featureInfo.outfields?.en || !layerEntryConfig.source.featureInfo.aliasFields?.en) {
        const processOutField = !layerEntryConfig.source.featureInfo.outfields?.en;
        const processAliasFields = !layerEntryConfig.source.featureInfo.aliasFields?.en;
        if (processOutField) layerEntryConfig.source.featureInfo.outfields = { en: '' };
        if (processAliasFields) layerEntryConfig.source.featureInfo.aliasFields = { en: '' };
        fields.forEach((fieldEntry, i) => {
          if (fieldEntry.name === geometryFieldName) return;
          if (processOutField) this.addFieldEntryToSourceFeatureInfo(layerEntryConfig, 'outfields', fieldEntry.name as string, i);
          if (processAliasFields)
            this.addFieldEntryToSourceFeatureInfo(
              layerEntryConfig,
              'aliasFields',
              (fieldEntry.alias ? fieldEntry.alias : fieldEntry.name) as string,
              i
            );
        });
        layerEntryConfig.source!.featureInfo!.outfields!.fr = layerEntryConfig.source!.featureInfo!.outfields?.en;
        layerEntryConfig.source!.featureInfo!.aliasFields!.fr = layerEntryConfig.source!.featureInfo!.aliasFields?.en;
      }
    }
  }
}
