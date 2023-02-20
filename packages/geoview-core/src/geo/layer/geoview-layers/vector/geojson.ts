/* eslint-disable block-scoped-var, no-var, vars-on-top, no-param-reassign */
import { transformExtent } from 'ol/proj';
import { Options as SourceOptions } from 'ol/source/Vector';
import { all } from 'ol/loadingstrategy';
import { GeoJSON as FormatGeoJSON } from 'ol/format';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import { Geometry } from 'ol/geom';

import defaultsDeep from 'lodash/defaultsDeep';
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
  TypeLocalizedString,
} from '../../../map/map-schema-types';
import { getLocalizedValue, getXMLHttpRequest } from '../../../../core/utils/utilities';
import { Cast, toJsonObject } from '../../../../core/types/global-types';
import { api } from '../../../../app';
import { Layer } from '../../layer';
import { codedValueType, rangeDomainType } from '../../../../api/events/payloads/get-feature-info-payload';

export interface TypeSourceGeoJSONInitialConfig extends Omit<TypeVectorSourceInitialConfig, 'format'> {
  format: 'GeoJSON';
}

export interface TypeGeoJSONLayerEntryConfig extends Omit<TypeVectorLayerEntryConfig, 'source'> {
  source: TypeSourceGeoJSONInitialConfig;
}

export interface TypeGeoJSONLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: 'GeoJSON';
  listOfLayerEntryConfig: TypeGeoJSONLayerEntryConfig[];
}

/** *****************************************************************************************************************************
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeGeoJSONLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is GEOJSON. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsGeoJSON = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeGeoJSONLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.GEOJSON;
};

/** *****************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as a GeoJSON if the type attribute of the verifyIfGeoViewLayer
 * parameter is GEOJSON. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewLayerIsGeoJSON = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is GeoJSON => {
  return verifyIfGeoViewLayer?.type === CONST_LAYER_TYPES.GEOJSON;
};

/** *****************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeGeoJSONLayerEntryConfig if the geoviewLayerType attribute of
 * the verifyIfGeoViewEntry.geoviewRootLayer attribute is GEOJSON. The type ascention applies only to the true block of the if
 * clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsGeoJSON = (verifyIfGeoViewEntry: TypeLayerEntryConfig): verifyIfGeoViewEntry is TypeGeoJSONLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewRootLayer?.geoviewLayerType === CONST_LAYER_TYPES.GEOJSON;
};

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** *****************************************************************************************************************************
 * Class used to add geojson layer to the map
 *
 * @exports
 * @class GeoJSON
 */
// ******************************************************************************************************************************
export class GeoJSON extends AbstractGeoViewVector {
  /** ***************************************************************************************************************************
   * Initialize layer
   *
   * @param {string} mapId the id of the map
   * @param {TypeGeoJSONLayerConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeGeoJSONLayerConfig) {
    super(CONST_LAYER_TYPES.GEOJSON, layerConfig, mapId);
  }

  /** ***************************************************************************************************************************
   * Extract the domain of the specified field from the metadata. If the type can not be found, return 'string'.
   *
   * @param {string} fieldName field name for which we want to get the domain.
   * @param {TypeLayerEntryConfig} layeConfig layer configuration.
   *
   * @returns {'string' | 'date' | 'number'} The type of the field.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFieldType(fieldName: string, layerConfig: TypeLayerEntryConfig): 'string' | 'date' | 'number' {
    const fieldDefinitions = this.layerMetadata[Layer.getLayerPath(layerConfig)].source.featureInfo;
    const fieldIndex = getLocalizedValue(Cast<TypeLocalizedString>(fieldDefinitions.outfields), this.mapId)?.split(',').indexOf(fieldName);
    if (fieldIndex === -1) return 'string';
    return (fieldDefinitions.fieldTypes as string).split(',')[fieldIndex!] as 'string' | 'date' | 'number';
  }

  /** ***************************************************************************************************************************
   * Return the type of the specified field.
   *
   * @param {string} fieldName field name for which we want to get the type.
   * @param {TypeLayerEntryConfig} layeConfig layer configuration.
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
        getXMLHttpRequest(`${metadataUrl}?f=json`).then((metadataString) => {
          if (metadataString === '{}')
            throw new Error(`Cant't read service metadata for GeoView layer ${this.geoviewLayerId} of map ${this.mapId}.`);
          else {
            this.metadata = toJsonObject(JSON.parse(metadataString));
            const { copyrightText } = this.metadata;
            if (copyrightText) this.attributions.push(copyrightText as string);
            resolve();
          }
        });
      } else resolve();
    });
    return promisedExecution;
  }

  /** ***************************************************************************************************************************
   * This method recursively validates the layer configuration entries by filtering and reporting invalid layers. If needed,
   * extra configuration may be done here.
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

      // When no metadata are provided, all layers are considered valid.
      if (!this.metadata) {
        api.map(this.mapId).layer.registerLayerConfig(layerEntryConfig);
        return true;
      }

      // Note that geojson metadata as we defined it does not contains layer group. If you need geogson layer group,
      // you can define them in the configuration section.
      if (Array.isArray(this.metadata?.listOfLayerEntryConfig)) {
        const metadataLayerList = Cast<TypeLayerEntryConfig[]>(this.metadata?.listOfLayerEntryConfig);
        for (var i = 0; i < metadataLayerList.length; i++) if (metadataLayerList[i].layerId === layerEntryConfig.layerId) break;
        if (i === metadataLayerList.length) {
          this.layerLoadError.push({
            layer: Layer.getLayerPath(layerEntryConfig),
            consoleMessage: `GeoJSON layer not found (mapId:  ${this.mapId}, layerPath: ${Layer.getLayerPath(layerEntryConfig)})`,
          });
          return false;
        }
        api.map(this.mapId).layer.registerLayerConfig(layerEntryConfig);
        return true;
      }

      this.layerLoadError.push({
        layer: Layer.getLayerPath(layerEntryConfig),
        consoleMessage: `Invalid GeoJSON metadata (listOfLayerEntryConfig) prevent loading of layer (mapId:  ${
          this.mapId
        }, layerPath: ${Layer.getLayerPath(layerEntryConfig)})`,
      });
      return false;
    });
  }

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
   * initial settings, fields and aliases).
   *
   * @param {TypeVectorLayerEntryConfig} layerEntryConfig The layer entry configuration to process.
   *
   * @returns {Promise<void>} A promise that the vector layer configuration has its metadata processed.
   */
  protected processLayerMetadata(layerEntryConfig: TypeVectorLayerEntryConfig): Promise<void> {
    const promiseOfExecution = new Promise<void>((resolve) => {
      if (!this.metadata) resolve();
      else {
        const metadataLayerList = Cast<TypeVectorLayerEntryConfig[]>(this.metadata?.listOfLayerEntryConfig);
        const layerMetadataFound = metadataLayerList.find((layerMetadata) => layerMetadata.layerId === layerEntryConfig.layerId);
        if (layerMetadataFound) {
          this.layerMetadata[Layer.getLayerPath(layerEntryConfig)] = toJsonObject(layerMetadataFound);
          layerEntryConfig.source = defaultsDeep(layerEntryConfig.source, layerMetadataFound.source);
          layerEntryConfig.initialSettings = defaultsDeep(layerEntryConfig.initialSettings, layerMetadataFound.initialSettings);
          layerEntryConfig.style = defaultsDeep(layerEntryConfig.style, layerMetadataFound.style);
        }

        if (layerEntryConfig.initialSettings?.extent)
          layerEntryConfig.initialSettings.extent = transformExtent(
            layerEntryConfig.initialSettings.extent,
            'EPSG:4326',
            `EPSG:${api.map(this.mapId).currentProjection}`
          );

        if (layerEntryConfig.initialSettings?.bounds) {
          layerEntryConfig.initialSettings.bounds = transformExtent(
            layerEntryConfig.initialSettings.bounds,
            'EPSG:4326',
            `EPSG:${api.map(this.mapId).currentProjection}`
          );
        }
        resolve();
      }
    });
    return promiseOfExecution;
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
    sourceOptions.format = new FormatGeoJSON();
    const vectorSource = super.createVectorSource(layerEntryConfig, sourceOptions, readOptions);
    return vectorSource;
  }
}
