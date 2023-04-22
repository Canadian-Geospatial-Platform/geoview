/* eslint-disable no-var, vars-on-top, block-scoped-var, no-param-reassign */
import axios from 'axios';

import { get, transformExtent } from 'ol/proj';
import { Options as SourceOptions } from 'ol/source/Vector';
import { all } from 'ol/loadingstrategy';
import { GeoJSON as FormatGeoJSON } from 'ol/format';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import { Geometry } from 'ol/geom';

import { TypeJsonObject } from '../../../../core/types/global-types';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '../abstract-geoview-layers';
import { AbstractGeoViewVector } from './abstract-geoview-vector';
import {
  TypeLayerEntryConfig,
  TypeVectorLayerEntryConfig,
  TypeVectorSourceInitialConfig,
  TypeGeoviewLayerConfig,
  TypeListOfLayerEntryConfig,
  layerEntryIsGroupLayer,
  TypeBaseLayerEntryConfig,
  TypeBaseSourceVectorInitialConfig,
} from '../../../map/map-schema-types';

import { getLocalizedValue } from '../../../../core/utils/utilities';
import { api } from '../../../../app';
import { Layer } from '../../layer';
import { codedValueType, rangeDomainType } from '../../../../api/events/payloads/get-feature-info-payload';

export interface TypeSourceOgcFeatureInitialConfig extends TypeVectorSourceInitialConfig {
  format: 'featureAPI';
}

export interface TypeOgcFeatureLayerEntryConfig extends Omit<TypeVectorLayerEntryConfig, 'source'> {
  source: TypeSourceOgcFeatureInitialConfig;
}

export interface TypeOgcFeatureLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig' | 'geoviewLayerType'> {
  geoviewLayerType: 'ogcFeature';
  listOfLayerEntryConfig: TypeOgcFeatureLayerEntryConfig[];
}

/** *****************************************************************************************************************************
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeOgcFeatureLayerConfig if the geoviewLayerType attribute of
 * the verifyIfLayer parameter is OGC_FEATURE. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsOgcFeature = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeOgcFeatureLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.OGC_FEATURE;
};

/** *****************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as an OgcFeature
 * if the type attribute of the verifyIfGeoViewLayer parameter is OGC_FEATURE. The type ascention
 * applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewLayerIsOgcFeature = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is OgcFeature => {
  return verifyIfGeoViewLayer?.type === CONST_LAYER_TYPES.OGC_FEATURE;
};

/** *****************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeOgcFeatureLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewRootLayer attribute is OGC_FEATURE. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsOgcFeature = (
  verifyIfGeoViewEntry: TypeLayerEntryConfig
): verifyIfGeoViewEntry is TypeOgcFeatureLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewRootLayer?.geoviewLayerType === CONST_LAYER_TYPES.OGC_FEATURE;
};

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** ******************************************************************************************************************************
 * A class to add OGC api feature layer.
 *
 * @exports
 * @class OgcFeature
 */
// ******************************************************************************************************************************
export class OgcFeature extends AbstractGeoViewVector {
  // private varibale holding wfs version
  private version = '2.0.0';

  /** ***************************************************************************************************************************
   * Initialize layer
   *
   * @param {string} mapId the id of the map
   * @param {TypeOgcFeatureLayerConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeOgcFeatureLayerConfig) {
    super(CONST_LAYER_TYPES.OGC_FEATURE, layerConfig, mapId);
  }

  /** ***************************************************************************************************************************
   * Extract the type of the specified field from the metadata. If the type can not be found, return 'string'.
   *
   * @param {string} fieldName field name for which we want to get the type.
   * @param {TypeLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {'string' | 'date' | 'number'} The type of the field.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFieldType(fieldName: string, layerConfig: TypeLayerEntryConfig): 'string' | 'date' | 'number' {
    const fieldDefinitions = this.layerMetadata[Layer.getLayerPath(layerConfig)];
    const fieldEntryType = (fieldDefinitions[fieldName].type as string).split(':').slice(-1)[0] as string;
    if (fieldEntryType === 'date') return 'date';
    if (['int', 'number'].includes(fieldEntryType)) return 'number';
    return 'string';
  }

  /** ***************************************************************************************************************************
   * Returns null. OGC feature services don't have domains.
   *
   * @param {string} fieldName field name for which we want to get the domain.
   * @param {TypeLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {null | codedValueType | rangeDomainType} The domain of the field.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFieldDomain(fieldName: string, layerConfig: TypeLayerEntryConfig): null | codedValueType | rangeDomainType {
    return null;
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
        const queryUrl = metadataUrl.endsWith('/') ? `${metadataUrl}collections?f=json` : `${metadataUrl}/collections?f=json`;
        axios.get<TypeJsonObject>(queryUrl).then((response) => {
          this.metadata = response.data;
          resolve();
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

      // Note that the code assumes ogc-feature collections does not contains metadata layer group. If you need layer group,
      // you can define them in the configuration section.
      if (Array.isArray(this.metadata!.collections)) {
        for (var i = 0; i < this.metadata!.collections.length; i++)
          if (this.metadata!.collections[i].id === layerEntryConfig.layerId) break;
        if (i === this.metadata!.collections.length) {
          this.layerLoadError.push({
            layer: Layer.getLayerPath(layerEntryConfig),
            consoleMessage: `OGC feature layer not found (mapId:  ${this.mapId}, layerPath: ${Layer.getLayerPath(layerEntryConfig)})`,
          });
          return false;
        }

        if (this.metadata!.collections[i].description)
          layerEntryConfig.layerName = {
            en: this.metadata!.collections[i].description as string,
            fr: this.metadata!.collections[i].description as string,
          };

        if (layerEntryConfig.initialSettings?.extent)
          layerEntryConfig.initialSettings.extent = transformExtent(
            layerEntryConfig.initialSettings.extent,
            'EPSG:4326',
            `EPSG:${api.map(this.mapId).currentProjection}`
          );

        if (
          !layerEntryConfig.initialSettings?.bounds &&
          this.metadata?.collections[i].extent?.spatial?.bbox &&
          this.metadata?.collections[i].extent?.spatial?.crs
        ) {
          // layerEntryConfig.initialSettings cannot be undefined because config-validation set it to {} if it is undefined.
          layerEntryConfig.initialSettings!.bounds = transformExtent(
            this.metadata.collections[i].extent.spatial.bbox[0] as number[],
            get(this.metadata.collections[i].extent.spatial.crs as string)!,
            `EPSG:${api.map(this.mapId).currentProjection}`
          );
        }

        api.map(this.mapId).layer.registerLayerConfig(layerEntryConfig);
        return true;
      }

      this.layerLoadError.push({
        layer: Layer.getLayerPath(layerEntryConfig),
        consoleMessage: `Invalid collection's metadata prevent loading of layer (mapId:  ${this.mapId}, layerPath: ${Layer.getLayerPath(
          layerEntryConfig
        )})`,
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
      const metadataUrl = getLocalizedValue(this.metadataAccessPath, this.mapId);
      if (metadataUrl) {
        const queryUrl = metadataUrl.endsWith('/')
          ? `${metadataUrl}collections/${layerEntryConfig.layerId.replace('-unclustered', '')}/queryables?f=json`
          : `${metadataUrl}/collections/${layerEntryConfig.layerId.replace('-unclustered', '')}/queryables?f=json`;
        const queryResult = axios.get<TypeJsonObject>(queryUrl);
        queryResult.then((response) => {
          if (response.data.properties) {
            this.layerMetadata[Layer.getLayerPath(layerEntryConfig)] = response.data.properties;
            this.processFeatureInfoConfig(response.data.properties, layerEntryConfig);
          }
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
  private processFeatureInfoConfig(fields: TypeJsonObject, layerEntryConfig: TypeVectorLayerEntryConfig) {
    if (!layerEntryConfig.source) layerEntryConfig.source = {};
    if (!layerEntryConfig.source.featureInfo) layerEntryConfig.source.featureInfo = { queryable: true };
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
      Object.keys(fields).forEach((fieldEntry) => {
        if (fields[fieldEntry].type === 'Geometry') return;
        if (processOutField) {
          layerEntryConfig.source!.featureInfo!.outfields!.en = `${layerEntryConfig.source!.featureInfo!.outfields!.en}${fieldEntry},`;
          let fieldType: 'string' | 'date' | 'number';
          if (fields[fieldEntry].type === 'date') fieldType = 'date';
          else if (['int', 'number'].includes(fields[fieldEntry].type as string)) fieldType = 'number';
          else fieldType = 'string';
          layerEntryConfig.source!.featureInfo!.fieldTypes = `${layerEntryConfig.source!.featureInfo!.fieldTypes}${fieldType},`;
        }
        layerEntryConfig.source!.featureInfo!.aliasFields!.en = `${layerEntryConfig.source!.featureInfo!.aliasFields!.en}${fieldEntry},`;
      });
      layerEntryConfig.source.featureInfo!.outfields!.en = layerEntryConfig.source.featureInfo!.outfields?.en?.slice(0, -1);
      layerEntryConfig.source.featureInfo!.fieldTypes = layerEntryConfig.source.featureInfo!.fieldTypes?.slice(0, -1);
      layerEntryConfig.source.featureInfo!.aliasFields!.en = layerEntryConfig.source.featureInfo!.aliasFields?.en?.slice(0, -1);
      layerEntryConfig.source!.featureInfo!.outfields!.fr = layerEntryConfig.source!.featureInfo!.outfields?.en;
      layerEntryConfig.source!.featureInfo!.aliasFields!.fr = layerEntryConfig.source!.featureInfo!.aliasFields?.en;
    }
    if (!layerEntryConfig.source.featureInfo.nameField) {
      const en =
        layerEntryConfig.source.featureInfo!.outfields!.en?.split(',')[0] ||
        layerEntryConfig.source.featureInfo!.outfields!.fr?.split(',')[0];
      const fr = en;
      if (en) layerEntryConfig.source.featureInfo.nameField = { en, fr };
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
    sourceOptions.url = `${sourceOptions.url}/collections/${layerEntryConfig.layerId}/items?f=json`;
    sourceOptions.format = new FormatGeoJSON();
    const vectorSource = super.createVectorSource(layerEntryConfig, sourceOptions, readOptions);
    return vectorSource;
  }
}
