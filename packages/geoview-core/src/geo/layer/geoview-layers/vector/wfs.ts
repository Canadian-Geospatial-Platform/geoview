/* eslint-disable no-var, vars-on-top, block-scoped-var, no-param-reassign */
import { transformExtent } from 'ol/proj';
import { Options as SourceOptions } from 'ol/source/Vector';
import { WFS as FormatWFS } from 'ol/format';
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

import { getLocalizedValue, getXMLHttpRequest, xmlToJson, findPropertyNameByRegex } from '../../../../core/utils/utilities';
import { api } from '../../../../app';
import { Layer } from '../../layer';
import { codedValueType, rangeDomainType } from '../../../../api/events/payloads/get-feature-info-payload';

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
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeWFSLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is WFS. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsWFS = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeWFSLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.WFS;
};

/** *****************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as a WFS if the type attribute of the verifyIfGeoViewLayer parameter
 * is WFS. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewLayerIsWFS = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is WFS => {
  return verifyIfGeoViewLayer?.type === CONST_LAYER_TYPES.WFS;
};

/** *****************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeWfsLayerEntryConfig if the geoviewLayerType attribute of the
 * verifyIfGeoViewEntry.geoviewRootLayer attribute is WFS. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsWFS = (verifyIfGeoViewEntry: TypeLayerEntryConfig): verifyIfGeoViewEntry is TypeWfsLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewRootLayer?.geoviewLayerType === CONST_LAYER_TYPES.WFS;
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
   * Extract the type of the specified field from the metadata. If the type can not be found, return 'string'.
   *
   * @param {string} fieldName field name for which we want to get the type.
   * @param {TypeLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {'string' | 'date' | 'number'} The type of the field.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFieldType(fieldName: string, layerConfig: TypeLayerEntryConfig): 'string' | 'date' | 'number' {
    const fieldDefinitions = this.layerMetadata[Layer.getLayerPath(layerConfig)] as TypeJsonArray;
    const fieldDefinition = fieldDefinitions.find((metadataEntry) => metadataEntry.name === fieldName);
    if (!fieldDefinition) return 'string';
    const fieldEntryType = (fieldDefinition.type as string).split(':').slice(-1)[0] as string;
    if (fieldEntryType === 'date') return 'date';
    if (['int', 'number'].includes(fieldEntryType)) return 'number';
    return 'string';
  }

  /** ***************************************************************************************************************************
   * Returns null. WFS services don't have domains.
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
      let metadataUrl = getLocalizedValue(this.metadataAccessPath, this.mapId) as string;

      // check if url contains metadata parameters for the getCapabilities request and reformat the urls
      const getCapabilitiesUrl =
        metadataUrl!.indexOf('?') > -1 ? metadataUrl.substring(metadataUrl!.indexOf('?')) : `?service=WFS&request=GetCapabilities`;
      metadataUrl = metadataUrl!.indexOf('?') > -1 ? metadataUrl.substring(0, metadataUrl!.indexOf('?')) : metadataUrl;

      if (metadataUrl) {
        getXMLHttpRequest(`${metadataUrl}${getCapabilitiesUrl}`).then((metadataString) => {
          if (metadataString === '{}')
            throw new Error(`Cant't read service metadata for layer ${this.geoviewLayerId} of map ${this.mapId}.`);
          else {
            // need to pass a xmldom to xmlToJson
            const xmlDOMCapabilities = new DOMParser().parseFromString(metadataString, 'text/xml');
            const xmlJsonCapabilities = xmlToJson(xmlDOMCapabilities);

            const capabilitiesObject = findPropertyNameByRegex(xmlJsonCapabilities, /(?:WFS_Capabilities)/);

            this.metadata = capabilitiesObject as TypeJsonObject;
            this.version = (capabilitiesObject as TypeJsonObject)['@attributes'].version as string;
            resolve();
          }
        });
      } else throw new Error(`Cant't read service metadata for layer ${this.geoviewLayerId} of map ${this.mapId}.`);
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

      // Note that the code assumes wfs feature type list does not contains metadata layer group. If you need layer group,
      // you can define them in the configuration section.
      // when there is only one layer, it is not an array but an object
      if (!Array.isArray(this.metadata?.FeatureTypeList?.FeatureType)) {
        const tempFeature = this.metadata?.FeatureTypeList?.FeatureType as TypeJsonObject;
        this.metadata!.FeatureTypeList!.FeatureType = [tempFeature] as TypeJsonObject;
      }

      if (Array.isArray(this.metadata?.FeatureTypeList?.FeatureType)) {
        const metadataLayerList = this.metadata?.FeatureTypeList.FeatureType as Array<TypeJsonObject>;
        for (var i = 0; i < metadataLayerList.length; i++) {
          const metadataLayerId = (metadataLayerList[i].Name && metadataLayerList[i].Name['#text']) as string;
          if (metadataLayerId.includes(layerEntryConfig.layerId)) break;
        }
        if (i === metadataLayerList.length) {
          this.layerLoadError.push({
            layer: Layer.getLayerPath(layerEntryConfig),
            consoleMessage: `WFS feature layer not found (mapId:  ${this.mapId}, layerPath: ${Layer.getLayerPath(layerEntryConfig)})`,
          });
          return false;
        }

        if (layerEntryConfig.initialSettings?.extent)
          layerEntryConfig.initialSettings.extent = transformExtent(
            layerEntryConfig.initialSettings.extent,
            'EPSG:4326',
            `EPSG:${api.map(this.mapId).currentProjection}`
          );

        if (!layerEntryConfig.initialSettings?.bounds && metadataLayerList[i]['ows:WGS84BoundingBox']) {
          const lowerCorner = (metadataLayerList[i]['ows:WGS84BoundingBox']['ows:LowerCorner']['#text'] as string).split(' ');
          const upperCorner = (metadataLayerList[i]['ows:WGS84BoundingBox']['ows:UpperCorner']['#text'] as string).split(' ');
          const bounds = [Number(lowerCorner[0]), Number(lowerCorner[1]), Number(upperCorner[0]), Number(upperCorner[1])];
          // layerEntryConfig.initialSettings cannot be undefined because config-validation set it to {} if it is undefined.
          layerEntryConfig.initialSettings!.bounds = transformExtent(bounds, 'EPSG:4326', `EPSG:${api.map(this.mapId).currentProjection}`);
        }

        api.map(this.mapId).layer.registerLayerConfig(layerEntryConfig);
        return true;
      }

      this.layerLoadError.push({
        layer: Layer.getLayerPath(layerEntryConfig),
        consoleMessage: `Invalid feature type list in WFS metadata prevent loading of layer (mapId:  ${
          this.mapId
        }, layerPath: ${Layer.getLayerPath(layerEntryConfig)})`,
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
      let queryUrl = getLocalizedValue(layerEntryConfig.source!.dataAccessPath, this.mapId);

      // check if url contains metadata parameters for the getCapabilities request and reformat the urls
      queryUrl = queryUrl!.indexOf('?') > -1 ? queryUrl!.substring(0, queryUrl!.indexOf('?')) : queryUrl;

      // extract DescribeFeatureType operation parameters
      const describeFeatureParams = this.metadata!['ows:OperationsMetadata']['ows:Operation'][1]['ows:Parameter'];
      const describeFeatureParamsValues = findPropertyNameByRegex(describeFeatureParams, /(?:Value)/);
      let outputFormat = '';
      if (describeFeatureParamsValues !== undefined) {
        if (Array.isArray(describeFeatureParamsValues['ows:Value'])) {
          outputFormat = describeFeatureParamsValues['ows:Value'][0]['#text'] as string;
        } else if (describeFeatureParamsValues['ows:Value'] === undefined) {
          outputFormat = describeFeatureParamsValues[0]['#text'] as string;
        } else {
          outputFormat = (describeFeatureParamsValues as TypeJsonObject)['ows:Value']['#text'] as string;
        }
      }

      // eslint-disable-next-line prettier/prettier
      const describeFeatureUrl = `${queryUrl}?service=WFS&request=DescribeFeatureType&version=${
        this.version
      }&outputFormat=${encodeURIComponent(outputFormat as string)}&typeName=${layerEntryConfig.layerId}`;

      if (describeFeatureUrl && outputFormat === 'application/json') {
        fetch(describeFeatureUrl)
          .then<TypeJsonObject>((fetchResponse) => {
            return fetchResponse.json();
          })
          .then((layerMetadata) => {
            if (Array.isArray(layerMetadata.featureTypes) && Array.isArray(layerMetadata.featureTypes[0].properties)) {
              this.layerMetadata[Layer.getLayerPath(layerEntryConfig)] = layerMetadata.featureTypes[0].properties;
              this.processFeatureInfoConfig(layerMetadata.featureTypes[0].properties as TypeJsonArray, layerEntryConfig);
            }
            resolve();
          });
      } else if (describeFeatureUrl && outputFormat.toUpperCase().includes('XML')) {
        fetch(describeFeatureUrl)
          .then<string>((fetchResponse) => {
            return fetchResponse.text();
          })
          .then((layerMetadata) => {
            // need to pass a xmldom to xmlToJson to convert xsd schema to json
            const xmlDOMDescribe = new DOMParser().parseFromString(layerMetadata, 'text/xml');
            const xmlJsonDescribe = xmlToJson(xmlDOMDescribe);
            const prefix = Object.keys(xmlJsonDescribe)[0].includes('xsd:') ? 'xsd:' : '';
            const xmlJsonDescribeElement =
              xmlJsonDescribe[`${prefix}schema`][`${prefix}complexType`][`${prefix}complexContent`][`${prefix}extension`][
                `${prefix}sequence`
              ][`${prefix}element`];

            if (Array.isArray(xmlJsonDescribeElement)) {
              // recreate the array of properties as if it was json
              const featureTypeProperties: TypeJsonArray = [];
              xmlJsonDescribeElement.forEach((element) => {
                featureTypeProperties.push(element['@attributes']);
              });

              this.layerMetadata[Layer.getLayerPath(layerEntryConfig)] = featureTypeProperties as TypeJsonObject;
              this.processFeatureInfoConfig(featureTypeProperties as TypeJsonArray, layerEntryConfig);
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
  private processFeatureInfoConfig(fields: TypeJsonArray, layerEntryConfig: TypeVectorLayerEntryConfig) {
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
      fields.forEach((fieldEntry) => {
        const fieldEntryType = (fieldEntry.type as string).split(':').slice(-1)[0];
        if (fieldEntryType === 'Geometry') return;
        if (processOutField) {
          layerEntryConfig.source!.featureInfo!.outfields!.en = `${layerEntryConfig.source!.featureInfo!.outfields!.en}${fieldEntry.name},`;
          layerEntryConfig.source!.featureInfo!.fieldTypes = `${layerEntryConfig.source!.featureInfo!.fieldTypes}${this.getFieldType(
            fieldEntry.name as string,
            layerEntryConfig
          )},`;
        }
        layerEntryConfig.source!.featureInfo!.aliasFields!.en = `${layerEntryConfig.source!.featureInfo!.aliasFields!.en}${
          fieldEntry.name
        },`;
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
   * @param {SourceOptions} sourceOptions The source options (default: {}).
   * @param {ReadOptions} readOptions The read options (default: {}).
   *
   * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
   */
  protected createVectorSource(
    layerEntryConfig: TypeBaseLayerEntryConfig,
    sourceOptions: SourceOptions = {},
    readOptions: ReadOptions = {}
  ): VectorSource<Geometry> {
    readOptions.dataProjection = (layerEntryConfig.source as TypeBaseSourceVectorInitialConfig).dataProjection;

    // check if url contains metadata parameters for the getCapabilities request and reformat the urls
    const sourceUrl = getLocalizedValue(layerEntryConfig.source!.dataAccessPath!, this.mapId);
    sourceOptions.url = sourceUrl!.indexOf('?') > -1 ? sourceUrl!.substring(0, sourceUrl!.indexOf('?')) : sourceUrl;
    sourceOptions.url = `${sourceOptions.url}?service=WFS&request=getFeature&version=${this.version}`;
    sourceOptions.url = `${sourceOptions.url}&typeName=${layerEntryConfig.layerId}`;

    sourceOptions.format = new FormatWFS({
      version: this.version,
    });

    const vectorSource = super.createVectorSource(layerEntryConfig, sourceOptions, readOptions);

    return vectorSource;
  }
}
