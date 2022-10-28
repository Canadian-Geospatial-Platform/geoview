/* eslint-disable no-param-reassign */
import axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { Extent } from 'ol/extent';
import { transformExtent } from 'ol/proj';
import { Vector as VectorSource } from 'ol/source';
import { Geometry } from 'ol/geom';
import { Options as SourceOptions } from 'ol/source/Vector';
import { all } from 'ol/loadingstrategy';
import { EsriJSON } from 'ol/format';
import { ReadOptions } from 'ol/format/Feature';

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
  layerEntryIsGroupLayer,
} from '../../../map/map-schema-types';

import { getLocalizedValue, getXMLHttpRequest } from '../../../../core/utils/utilities';
import { EsriBaseRenderer, getStyleFromEsriRenderer } from '../../../renderer/esri-renderer';
import { api } from '../../../../app';
import { Layer } from '../../layer';

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
          if (metadataString === '{}')
            throw new Error(`Cant't read service metadata for layer ${this.geoviewLayerId} of map ${this.mapId}.`);
          else {
            this.metadata = toJsonObject(JSON.parse(metadataString));
            const { copyrightText } = this.metadata;
            if (copyrightText) this.attributions.push(copyrightText as string);
            resolve();
          }
        });
      } else throw new Error(`Cant't read service metadata for layer ${this.geoviewLayerId} of map ${this.mapId}.`);
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
      if (api.map(this.mapId).layer.isRegistered(layerEntryConfig)) {
        this.layerLoadError.push({
          layer: Layer.getLayerPath(layerEntryConfig),
          consoleMessage: `Duplicate layerPath (mapId:  ${this.mapId}, layerPath: ${Layer.getLayerPath(layerEntryConfig)})`,
        });
        return false;
      }

      if (layerEntryIsGroupLayer(layerEntryConfig)) {
        layerEntryConfig.listOfLayerEntryConfig = this.validateListOfLayerEntryConfig(layerEntryConfig.listOfLayerEntryConfig!);
        if (layerEntryConfig.listOfLayerEntryConfig.length) {
          api.map(this.mapId).layer.registerLayerConfig(layerEntryConfig);
          return true;
        }
        this.layerLoadError.push({
          layer: Layer.getLayerPath(layerEntryConfig),
          consoleMessage: `Empty layer group (mapId:  ${this.mapId}, layerPath: ${Layer.getLayerPath(layerEntryConfig)})`,
        });
        return false;
      }

      const esriIndex = Number(layerEntryConfig.layerId);
      if (Number.isNaN(esriIndex)) {
        this.layerLoadError.push({
          layer: Layer.getLayerPath(layerEntryConfig),
          consoleMessage: `ESRI layerId must be a number (mapId:  ${this.mapId}, layerPath: ${Layer.getLayerPath(layerEntryConfig)})`,
        });
        return false;
      }

      if (this.metadata?.layers[esriIndex] === undefined) {
        this.layerLoadError.push({
          layer: Layer.getLayerPath(layerEntryConfig),
          consoleMessage: `ESRI layerId not found (mapId:  ${this.mapId}, layerPath: ${Layer.getLayerPath(layerEntryConfig)})`,
        });
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
          api.map(this.mapId).layer.registerLayerConfig(subLayerEntryConfig);
        });
        const switchToGroupLayer = Cast<TypeLayerGroupEntryConfig>(layerEntryConfig);
        switchToGroupLayer.entryType = 'group';
        switchToGroupLayer.isDynamicLayerGroup = true;
        switchToGroupLayer.listOfLayerEntryConfig = newListOfLayerEntryConfig;
        api.map(this.mapId).layer.registerLayerConfig(layerEntryConfig);
        return true;
      }

      if (this.metadata!.layers[esriIndex].type !== 'Feature Layer') {
        this.layerLoadError.push({
          layer: Layer.getLayerPath(layerEntryConfig),
          consoleMessage: `LayerId ${Layer.getLayerPath(layerEntryConfig)} of map ${this.mapId} is not a feature layer`,
        });
        return false;
      }

      layerEntryConfig.layerName = {
        en: this.metadata!.layers[esriIndex].name as string,
        fr: this.metadata!.layers[esriIndex].name as string,
      };
      api.map(this.mapId).layer.registerLayerConfig(layerEntryConfig);
      return true;
    });
  }

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
   * initial settings, fields and aliases).
   *
   * @param {TypeLayerEntryConfig} layerEntryConfig The layer entry configuration to process.
   *
   * @returns {Promise<void>} A promise that the vector layer configuration has its metadata processed.
   */
  protected processLayerMetadata(layerEntryConfig: TypeLayerEntryConfig): Promise<void> {
    const promiseOfExecution = new Promise<void>((resolve) => {
      // User-defined groups do not have metadata provided by the service endpoint.
      if (layerEntryIsGroupLayer(layerEntryConfig) && !layerEntryConfig.isDynamicLayerGroup) resolve();
      else {
        let queryUrl = getLocalizedValue(this.metadataAccessPath, this.mapId);
        if (queryUrl) {
          queryUrl = queryUrl.endsWith('/') ? `${queryUrl}${layerEntryConfig.layerId}` : `${queryUrl}/${layerEntryConfig.layerId}`;
          const queryResult = axios.get<TypeJsonObject>(`${queryUrl}?f=pjson`);
          queryResult.then((response) => {
            // layers must have a fields attribute except if it is an dynamic layer group.
            if (!response.data.fields && !(layerEntryConfig as TypeLayerGroupEntryConfig).isDynamicLayerGroup)
              throw new Error(`Despite a return code of 200, an error was detected with this query (${queryUrl}?f=pjson)`);
            if (geoviewEntryIsEsriFeature(layerEntryConfig)) {
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
            }
            resolve();
          });
        } else resolve();
      }
    });
    return promiseOfExecution;
  }

  /** ***************************************************************************************************************************
   * This method set the initial settings based on the service metadata. Priority is given to the layer configuration.
   *
   * @param {boolean} visibility The metadata initial visibility of the layer.
   * @param {number} minScale The metadata minScale of the layer.
   * @param {number} maxScale The metadata maxScale of the layer.
   * @param {TypeJsonObject} extent The metadata layer extent.
   * @param {TypeEsriFeatureLayerEntryConfig} layerEntryConfig The vector layer entry to configure.
   */
  private processInitialSettings(
    visibility: boolean,
    minScale: number,
    maxScale: number,
    extent: TypeJsonObject,
    layerEntryConfig: TypeEsriFeatureLayerEntryConfig
  ) {
    if (!layerEntryConfig.initialSettings) layerEntryConfig.initialSettings = {};
    if (layerEntryConfig.initialSettings?.minZoom === undefined && minScale !== 0) layerEntryConfig.initialSettings.minZoom = minScale;
    if (layerEntryConfig.initialSettings?.maxZoom === undefined && maxScale !== 0) layerEntryConfig.initialSettings.maxZoom = maxScale;
    if (layerEntryConfig.initialSettings?.visible === undefined) layerEntryConfig.initialSettings.visible = visibility;
    if (!layerEntryConfig.initialSettings?.extent) {
      const layerExtent: Extent = [extent.xmin as number, extent.ymin as number, extent.xmax as number, extent.ymax as number];
      layerEntryConfig.initialSettings.extent = transformExtent(
        layerExtent,
        `EPSG:${extent.spatialReference.wkid as number}`,
        `EPSG:${api.map(this.mapId).currentProjection}`
      ) as Extent;
    }
  }

  /** ***************************************************************************************************************************
   * This method verifies if the layer is queryable and sets the outfields and aliasFields of the source feature info.
   *
   * @param {string} capabilities The capabilities that will say if the layer is queryable.
   * @param {string} nameField The display field associated to the layer.
   * @param {string} geometryFieldName The field name of the geometry property.
   * @param {TypeJsonArray} fields An array of field names and its aliases.
   * @param {TypeEsriFeatureLayerEntryConfig} layerEntryConfig The vector layer entry to configure.
   */
  private processFeatureInfoConfig(
    capabilities: string,
    nameField: string,
    geometryFieldName: string,
    fields: TypeJsonArray,
    layerEntryConfig: TypeEsriFeatureLayerEntryConfig
  ) {
    if (!layerEntryConfig.source.featureInfo) layerEntryConfig.source.featureInfo = { queryable: capabilities.includes('Query') };
    // dynamic group layer doesn't have fields definition
    if (!layerEntryConfig.isDynamicLayerGroup) {
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
        layerEntryConfig.source.featureInfo!.outfields!.fr = layerEntryConfig.source.featureInfo!.outfields?.en;
        layerEntryConfig.source.featureInfo!.aliasFields!.fr = layerEntryConfig.source.featureInfo!.aliasFields?.en;
      }
    }
  }

  /** ***************************************************************************************************************************
   * Create a source configuration for the vector layer.
   *
   * @param {TypeEsriFeatureLayerEntryConfig} layerEntryConfig The layer entry configuration.
   *
   * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
   */
  protected createVectorSource(
    layerEntryConfig: TypeEsriFeatureLayerEntryConfig,
    sourceOptions: SourceOptions = { strategy: all },
    readOptions: ReadOptions = {}
  ): VectorSource<Geometry> {
    sourceOptions.url = getLocalizedValue(layerEntryConfig.source!.dataAccessPath!, this.mapId);
    sourceOptions.url = `${sourceOptions.url}/query?f=pjson&outfields=*&where=1%3D1`;
    sourceOptions.format = new EsriJSON();
    const vectorSource = super.createVectorSource(layerEntryConfig, sourceOptions, readOptions);
    return vectorSource;
  }
}
