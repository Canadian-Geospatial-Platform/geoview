/* eslint-disable no-var, vars-on-top, block-scoped-var, no-param-reassign */
import { Extent } from 'ol/extent';
import { transformExtent } from 'ol/proj';
import { Options as SourceOptions } from 'ol/source/Vector';
import { all } from 'ol/loadingstrategy';
import { GeoJSON as FormatGeoJSON } from 'ol/format';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import { Geometry } from 'ol/geom';

import { TypeJsonArray, TypeJsonObject } from '../../../../core/types/global-types';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '../abstract-geoview-layers';
import { AbstractGeoViewVector } from './abstract-geoview-vector';
import {
  TypeLayerEntryConfig,
  TypeVectorLayerEntryConfig,
  TypeVectorSourceInitialConfig,
  TypeGeoviewLayerConfig,
  TypeListOfLayerEntryConfig,
  layerEntryIsGroupLayer,
  TypeBaseSourceVectorInitialConfig,
  TypeBaseLayerEntryConfig,
} from '../../../map/map-schema-types';

import { getLocalizedValue, getXMLHttpRequest, xmlToJson } from '../../../../core/utils/utilities';
import { api } from '../../../../app';

export interface TypeSourceWFSVectorInitialConfig extends TypeVectorSourceInitialConfig {
  format: 'WFS';
}

export interface TypeWfsLayerEntryConfig extends Omit<TypeVectorLayerEntryConfig, 'source'> {
  source: TypeSourceWFSVectorInitialConfig;
}

export interface TypeWFSLayerConfig extends Omit<TypeGeoviewLayerConfig, 'geoviewLayerType' | 'geoviewLayerType'> {
  geoviewLayerType: 'ogcWfs';
  listOfLayerEntryConfig: TypeWfsLayerEntryConfig[];
}

/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeGeoviewLayerConfig as a TypeWFSLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is WFS. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsWFS = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeWFSLayerConfig => {
  return verifyIfLayer.geoviewLayerType === CONST_LAYER_TYPES.WFS;
};

/** *****************************************************************************************************************************
 * Type Gard function that redefines an AbstractGeoViewLayer as a WFS if the type attribute of the verifyIfGeoViewLayer parameter
 * is WFS. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewLayerIsWFS = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is WFS => {
  return verifyIfGeoViewLayer.type === CONST_LAYER_TYPES.WFS;
};

/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeLayerEntryConfig as a TypeWfsLayerEntryConfig if the geoviewLayerType attribute of the
 * verifyIfGeoViewEntry.geoviewRootLayer attribute is WFS. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsWFS = (verifyIfGeoViewEntry: TypeLayerEntryConfig): verifyIfGeoViewEntry is TypeWfsLayerEntryConfig => {
  return verifyIfGeoViewEntry.geoviewRootLayer!.geoviewLayerType === CONST_LAYER_TYPES.WFS;
};

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** *****************************************************************************************************************************
 * A class to add WFS layer.
 *
 * @exports
 * @class WFS
 */
// ******************************************************************************************************************************
export class WFS extends AbstractGeoViewVector {
  /** Feature type description obtained by the DescribeFeatureType service call. */
  featureTypeDescripion: Record<string, TypeJsonObject> = {};

  /** private varibale holding wfs version. */
  private version = '2.0.0';

  /** ***************************************************************************************************************************
   * Initialize layer
   * @param {string} mapId the id of the map
   * @param {TypeWFSLayerConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeWFSLayerConfig) {
    super(CONST_LAYER_TYPES.WFS, layerConfig, mapId);
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
        getXMLHttpRequest(`${metadataUrl}?service=WFS&request=getcapabilities`).then((metadataString) => {
          if (metadataString === '{}') throw new Error(`Cant't read service metadata for layer ${this.layerId} of map ${this.mapId}.`);
          else {
            // need to pass a xmldom to xmlToJson
            const xmlDOMCapabilities = new DOMParser().parseFromString(metadataString, 'text/xml');
            const xmlJsonCapabilities = xmlToJson(xmlDOMCapabilities);

            this.metadata = xmlJsonCapabilities['wfs:WFS_Capabilities'];
            this.version = xmlJsonCapabilities['wfs:WFS_Capabilities']['@attributes'].version as string;
            resolve();
          }
        });
      } else throw new Error(`Cant't read service metadata for layer ${this.layerId} of map ${this.mapId}.`);
    });
    return promisedExecution;
  }

  /** ***************************************************************************************************************************
   * This method recursively validates the configuration of the layer entries to ensure that each layer is correctly defined. If
   * necessary, additional code can be executed in the child method to complete the layer configuration.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
   *
   * @returns {TypeListOfLayerEntryConfig} A new layer configuration list with layers in error removed.
   */
  protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): TypeListOfLayerEntryConfig {
    return listOfLayerEntryConfig.filter((layerEntryConfig: TypeLayerEntryConfig) => {
      if (api.map(this.mapId).layer.isRegistered(layerEntryConfig)) {
        this.layerLoadError.push({
          layer: layerEntryConfig.layerId,
          consoleMessage: `Duplicate layerId (mapId:  ${this.mapId}, layerId: ${layerEntryConfig.layerId})`,
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
          layer: layerEntryConfig.layerId,
          consoleMessage: `Empty layer group (mapId:  ${this.mapId}, layerId: ${layerEntryConfig.layerId})`,
        });
        return false;
      }

      // Note that the code assumes wfs feature type list does not contains layer group. If you need layer group,
      // you can define them in the configuration section.
      if (Array.isArray(this.metadata?.FeatureTypeList?.FeatureType)) {
        const metadataLayerList = this.metadata?.FeatureTypeList.FeatureType as Array<TypeJsonObject>;
        for (var i = 0; i < metadataLayerList.length; i++) {
          const metadataLayerId = (metadataLayerList[i].Name && metadataLayerList[i].Name['#text']) as string;
          if (metadataLayerId.includes(layerEntryConfig.layerId)) break;
        }
        if (i === metadataLayerList.length) {
          this.layerLoadError.push({
            layer: layerEntryConfig.layerId,
            consoleMessage: `WFS feature layer not found (mapId:  ${this.mapId}, layerId: ${layerEntryConfig.layerId})`,
          });
          return false;
        }

        if (metadataLayerList[i]['ows:WGS84BoundingBox']) {
          const lowerCorner = (metadataLayerList[i]['ows:WGS84BoundingBox']['ows:LowerCorner']['#text'] as string).split(' ');
          const upperCorner = (metadataLayerList[i]['ows:WGS84BoundingBox']['ows:UpperCorner']['#text'] as string).split(' ');
          const extent = [Number(lowerCorner[0]), Number(lowerCorner[1]), Number(upperCorner[0]), Number(upperCorner[1])];
          const layerExtent = transformExtent(extent, 'EPSG:4326', `EPSG:${api.map(this.mapId).currentProjection}`) as Extent;
          if (!layerEntryConfig.initialSettings) layerEntryConfig.initialSettings = { extent: layerExtent };
          else if (!layerEntryConfig.initialSettings.extent) layerEntryConfig.initialSettings.extent = layerExtent;
          api.map(this.mapId).layer.registerLayerConfig(layerEntryConfig);
          return true;
        }
      }
      this.layerLoadError.push({
        layer: layerEntryConfig.layerId,
        consoleMessage: `Invalid feature type list in WFS metadata prevent loading of layer (mapId:  ${this.mapId}, layerId: ${layerEntryConfig.layerId})`,
      });
      return false;
    });
  }

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty outfields and aliasFields properties of the
   * layer's configuration.
   *
   * @param {TypeVectorLayerEntryConfig} layerEntryConfig The layer entry configuration to process.
   *
   * @returns {Promise<void>} A promise that the vector layer configuration has its metadata processed.
   */
  protected processLayerMetadata(layerEntryConfig: TypeVectorLayerEntryConfig): Promise<void> {
    const promiseOfExecution = new Promise<void>((resolve) => {
      const queryUrl = getLocalizedValue(layerEntryConfig.source!.dataAccessPath, this.mapId);
      if (queryUrl) {
        fetch(`${queryUrl}?service=WFS&request=DescribeFeatureType&outputFormat=application/json&typeName=${layerEntryConfig.layerId}`)
          .then<TypeJsonObject>((fetchResponse) => {
            return fetchResponse.json();
          })
          .then((layerMetadata) => {
            if (Array.isArray(layerMetadata.featureTypes) && Array.isArray(layerMetadata.featureTypes[0].properties))
              this.processFeatureInfoConfig(layerMetadata.featureTypes[0].properties as TypeJsonArray, layerEntryConfig);
            resolve();
          });
      } else resolve();
    });
    return promiseOfExecution;
  }

  /** ***************************************************************************************************************************
   * This method sets the outfields and aliasFields of the source feature info.
   *
   * @param {TypeJsonArray} fields An array of field names and its aliases.
   * @param {TypeVectorLayerEntryConfig} layerEntryConfig The vector layer entry to configure.
   */
  private processFeatureInfoConfig(fields: TypeJsonArray, layerEntryConfig: TypeVectorLayerEntryConfig) {
    if (!layerEntryConfig.source) layerEntryConfig.source = {};
    if (!layerEntryConfig.source.featureInfo) layerEntryConfig.source.featureInfo = { queryable: true };
    // Process undefined outfields or aliasFields ('' = false and !'' = true)
    if (!layerEntryConfig.source.featureInfo.outfields?.en || !layerEntryConfig.source.featureInfo.aliasFields?.en) {
      const processOutField = !layerEntryConfig.source.featureInfo.outfields?.en;
      const processAliasFields = !layerEntryConfig.source.featureInfo.aliasFields?.en;
      if (processOutField) layerEntryConfig.source.featureInfo.outfields = { en: '' };
      if (processAliasFields) layerEntryConfig.source.featureInfo.aliasFields = { en: '' };
      fields.forEach((fieldEntry, i) => {
        if (processOutField) this.addFieldEntryToSourceFeatureInfo(layerEntryConfig, 'outfields', fieldEntry.name as string, i);
        if (processAliasFields) this.addFieldEntryToSourceFeatureInfo(layerEntryConfig, 'aliasFields', fieldEntry.name as string, i);
      });
      layerEntryConfig.source!.featureInfo!.outfields!.fr = layerEntryConfig.source!.featureInfo!.outfields?.en;
      layerEntryConfig.source!.featureInfo!.aliasFields!.fr = layerEntryConfig.source!.featureInfo!.aliasFields?.en;
    }
  }

  /** ***************************************************************************************************************************
   * Create a source configuration for the vector layer.
   *
   * @param {TypeBaseLayerEntryConfig} layerEntryConfig The layer entry configuration.
   *
   * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
   */
  protected createVectorSource(
    layerEntryConfig: TypeBaseLayerEntryConfig,
    sourceOptions: SourceOptions = { strategy: all },
    readOptions: ReadOptions = {}
  ): VectorSource<Geometry> {
    readOptions.dataProjection = (layerEntryConfig.source as TypeBaseSourceVectorInitialConfig).dataProjection;
    sourceOptions.url = getLocalizedValue(layerEntryConfig.source!.dataAccessPath!, this.mapId);
    sourceOptions.url = `${sourceOptions.url}?service=WFS&request=getFeature&outputFormat=application/json&version=2.0.0`;
    sourceOptions.url = `${sourceOptions.url}&srsname=${(layerEntryConfig.source as TypeBaseSourceVectorInitialConfig).dataProjection}`;
    sourceOptions.url = `${sourceOptions.url}&typeName=${layerEntryConfig.layerId}`;
    sourceOptions.format = new FormatGeoJSON();
    const vectorSource = super.createVectorSource(layerEntryConfig, sourceOptions, readOptions);
    return vectorSource;
  }
}
