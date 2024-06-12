/* eslint-disable no-param-reassign */
// We have many reassign for sourceOptions-layerConfig. We keep it global...
import { Options as SourceOptions } from 'ol/source/Vector';
import { WFS as FormatWFS } from 'ol/format';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';
import { bbox } from 'ol/loadingstrategy';

// import { layerEntryIsGroupLayer } from '@config/types/type-guards';

import { TypeJsonArray, TypeJsonObject } from '@/core/types/global-types';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import {
  TypeLayerEntryConfig,
  TypeVectorSourceInitialConfig,
  TypeGeoviewLayerConfig,
  TypeBaseSourceVectorInitialConfig,
  layerEntryIsGroupLayer,
} from '@/geo/map/map-schema-types';

import { getLocalizedValue, getXMLHttpRequest, xmlToJson, findPropertyNameByRegex } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';
import { WfsLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';

export interface TypeSourceWFSVectorInitialConfig extends TypeVectorSourceInitialConfig {
  format: 'WFS';
}

export interface TypeWFSLayerConfig extends Omit<TypeGeoviewLayerConfig, 'geoviewLayerType'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.WFS;
  listOfLayerEntryConfig: WfsLayerEntryConfig[];
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
 * type guard function that redefines a TypeLayerEntryConfig as a WfsLayerEntryConfig if the geoviewLayerType attribute of the
 * verifyIfGeoViewEntry.geoviewLayerConfig attribute is WFS. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsWFS = (verifyIfGeoViewEntry: TypeLayerEntryConfig): verifyIfGeoViewEntry is WfsLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewLayerConfig?.geoviewLayerType === CONST_LAYER_TYPES.WFS;
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
// GV Layers Refactoring - Obsolete (in layers)
export class WFS extends AbstractGeoViewVector {
  /** private variable holding wfs version. */
  #version = '2.0.0';

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
   * @param {AbstractBaseLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {'string' | 'date' | 'number'} The type of the field.
   */
  // GV Layers Refactoring - Obsolete (in layers)
  protected override getFieldType(fieldName: string, layerConfig: AbstractBaseLayerEntryConfig): 'string' | 'date' | 'number' {
    const fieldDefinitions = this.getLayerMetadata(layerConfig.layerPath) as TypeJsonArray;
    const fieldDefinition = fieldDefinitions.find((metadataEntry) => metadataEntry.name === fieldName);
    if (!fieldDefinition) return 'string';
    const fieldEntryType = (fieldDefinition.type as string).split(':').slice(-1)[0] as string;
    if (fieldEntryType === 'date') return 'date';
    if (['int', 'number'].includes(fieldEntryType)) return 'number';
    return 'string';
  }

  /** ***************************************************************************************************************************
   * This method reads the service metadata from the metadataAccessPath.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected override fetchServiceMetadata(): Promise<void> {
    const promisedExecution = new Promise<void>((resolve) => {
      let metadataUrl = getLocalizedValue(this.metadataAccessPath, AppEventProcessor.getDisplayLanguage(this.mapId)) as string;

      // check if url contains metadata parameters for the getCapabilities request and reformat the urls
      const getCapabilitiesUrl =
        metadataUrl!.indexOf('?') > -1 ? metadataUrl.substring(metadataUrl!.indexOf('?')) : `?service=WFS&request=GetCapabilities`;
      metadataUrl = metadataUrl!.indexOf('?') > -1 ? metadataUrl.substring(0, metadataUrl!.indexOf('?')) : metadataUrl;

      if (metadataUrl) {
        getXMLHttpRequest(`${metadataUrl}${getCapabilitiesUrl}`)
          .then((metadataString) => {
            if (metadataString === '{}') {
              this.setAllLayerStatusTo('error', this.listOfLayerEntryConfig, 'Unable to read metadata');
            } else {
              // need to pass a xmldom to xmlToJson
              const xmlDOMCapabilities = new DOMParser().parseFromString(metadataString, 'text/xml');
              const xmlJsonCapabilities = xmlToJson(xmlDOMCapabilities);

              const capabilitiesObject = findPropertyNameByRegex(xmlJsonCapabilities, /(?:WFS_Capabilities)/);

              this.metadata = capabilitiesObject as TypeJsonObject;
              this.#version = (capabilitiesObject as TypeJsonObject)['@attributes'].version as string;
              resolve();
            }
          })
          .catch((reason) => {
            this.setAllLayerStatusTo('error', this.listOfLayerEntryConfig, 'Unable to read metadata');
            logger.logError('Unableto fetch metadata', this.metadataAccessPath, reason);
            resolve();
          });
      } else {
        this.setAllLayerStatusTo('error', this.listOfLayerEntryConfig, 'Unable to read metadata');
      }
    });
    return promisedExecution;
  }

  /** ***************************************************************************************************************************
   * This method recursively validates the configuration of the layer entries to ensure that each layer is correctly defined. If
   * necessary, additional code can be executed in the child method to complete the layer configuration.
   *
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void {
    listOfLayerEntryConfig.forEach((layerConfig: TypeLayerEntryConfig) => {
      const { layerPath } = layerConfig;
      if (layerEntryIsGroupLayer(layerConfig)) {
        this.validateListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig!);
        if (!layerConfig.listOfLayerEntryConfig.length) {
          this.layerLoadError.push({
            layer: layerPath,
            loggerMessage: `Empty layer group (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
          });
          layerConfig.layerStatus = 'error';
          return;
        }
      }

      layerConfig.layerStatus = 'processing';

      // Note that the code assumes wfs feature type list does not contains metadata layer group. If you need layer group,
      // you can define them in the configuration section.
      // when there is only one layer, it is not an array but an object
      if (!Array.isArray(this.metadata?.FeatureTypeList?.FeatureType))
        this.metadata!.FeatureTypeList!.FeatureType = [this.metadata?.FeatureTypeList?.FeatureType] as TypeJsonObject;

      if (Array.isArray(this.metadata?.FeatureTypeList?.FeatureType)) {
        const metadataLayerList = this.metadata?.FeatureTypeList.FeatureType as Array<TypeJsonObject>;
        const foundMetadata = metadataLayerList.find((layerMetadata) => {
          const metadataLayerId = (layerMetadata.Name && layerMetadata.Name['#text']) as string;
          return metadataLayerId.includes(layerConfig.layerId!);
        });

        if (!foundMetadata) {
          this.layerLoadError.push({
            layer: layerPath,
            loggerMessage: `WFS feature layer not found (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
          });
          layerConfig.layerStatus = 'error';
          return;
        }

        if (layerConfig.initialSettings?.extent)
          // TODO: Check - Why are we converting to the map projection in the pre-processing? Wouldn't it be best to leave it untouched, as it's part of the initial configuration and handle it later?
          layerConfig.initialSettings.extent = this.getMapViewer().convertExtentLngLatToMapProj(layerConfig.initialSettings.extent);

        if (!layerConfig.initialSettings?.bounds && foundMetadata['ows:WGS84BoundingBox']) {
          // TODO: Check - This additional processing seem valid, but is it at the right place? A bit confusing with the rest of the codebase.
          // TODO: Refactor - Layers refactoring. Validate if this code is still being executed after the layers migration. This code may easily have been forgotten.
          const lowerCorner = (foundMetadata['ows:WGS84BoundingBox']['ows:LowerCorner']['#text'] as string).split(' ');
          const upperCorner = (foundMetadata['ows:WGS84BoundingBox']['ows:UpperCorner']['#text'] as string).split(' ');
          const bounds = [Number(lowerCorner[0]), Number(lowerCorner[1]), Number(upperCorner[0]), Number(upperCorner[1])];

          // TODO: Check - Why are we converting to the map projection in the pre-processing? Wouldn't it be best to leave it untouched, as it's part of the initial configuration?
          // TO.DOCONT: We're already making sure to project the settings in the map projection when we getBounds(). Seems we're doing work twice? Should be standardized so that the
          // TO.DOCONT: layer.getBounds() are coherent between children classes. And should probably *not* reproject in the map projection during layer metadata pre-processing if we want to
          // TO.DOCONT: be able to, possibly, fetch metadata information in a standalone manner, outside of a map.
          // layerConfig.initialSettings cannot be undefined because config-validation set it to {} if it is undefined.
          layerConfig.initialSettings!.bounds = this.getMapViewer().convertExtentLngLatToMapProj(bounds);
        }
      }
    });
  }

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty outfields and aliasFields properties of the
   * layer's configuration.
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration to process.
   *
   * @returns {Promise<AbstractBaseLayerEntryConfig>} A promise that the vector layer configuration has its metadata processed.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected override async processLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig> {
    // Instance check
    if (!(layerConfig instanceof VectorLayerEntryConfig)) throw new Error('Invalid layer configuration type provided');

    try {
      let queryUrl = getLocalizedValue(layerConfig.source!.dataAccessPath, AppEventProcessor.getDisplayLanguage(this.mapId));

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

      const describeFeatureUrl = `${queryUrl}?service=WFS&request=DescribeFeatureType&version=${
        this.#version
      }&outputFormat=${encodeURIComponent(outputFormat as string)}&typeName=${layerConfig.layerId}`;

      if (describeFeatureUrl && outputFormat === 'application/json') {
        const layerMetadata = (await (await fetch(describeFeatureUrl)).json()) as TypeJsonObject;
        if (Array.isArray(layerMetadata.featureTypes) && Array.isArray(layerMetadata.featureTypes[0].properties)) {
          this.setLayerMetadata(layerConfig.layerPath, layerMetadata.featureTypes[0].properties);
          this.#processFeatureInfoConfig(layerMetadata.featureTypes[0].properties as TypeJsonArray, layerConfig);
        }
      } else if (describeFeatureUrl && outputFormat.toUpperCase().includes('XML')) {
        const layerMetadata = (await (await fetch(describeFeatureUrl)).text()) as string;
        // need to pass a xmldom to xmlToJson to convert xsd schema to json
        const xmlDOMDescribe = new DOMParser().parseFromString(layerMetadata, 'text/xml');
        const xmlJsonDescribe = xmlToJson(xmlDOMDescribe);
        const prefix = Object.keys(xmlJsonDescribe)[0].includes('xsd:') ? 'xsd:' : '';
        const xmlJsonSchema = xmlJsonDescribe[`${prefix}schema`];
        const xmlJsonDescribeElement =
          xmlJsonSchema[`${prefix}complexType`] !== undefined
            ? xmlJsonSchema[`${prefix}complexType`][`${prefix}complexContent`][`${prefix}extension`][`${prefix}sequence`][
                `${prefix}element`
              ]
            : [];

        if (Array.isArray(xmlJsonDescribeElement)) {
          // recreate the array of properties as if it was json
          const featureTypeProperties: TypeJsonArray = [];
          xmlJsonDescribeElement.forEach((element) => {
            featureTypeProperties.push(element['@attributes']);
          });

          this.setLayerMetadata(layerConfig.layerPath, featureTypeProperties as TypeJsonObject);
          this.#processFeatureInfoConfig(featureTypeProperties as TypeJsonArray, layerConfig);
        }
      }
    } catch (error) {
      logger.logError(`Error processing layer metadata for layer path "${layerConfig.layerPath}`, error);
      layerConfig.layerStatus = 'error';
    }
    return layerConfig;
  }

  /** ***************************************************************************************************************************
   * This method sets the outfields and aliasFields of the source feature info.
   *
   * @param {TypeJsonArray} fields An array of field names and its aliases.
   * @param {VectorLayerEntryConfig} layerConfig The vector layer entry to configure.
   * @private
   */
  // GV Layers Refactoring - Obsolete (in config?)
  #processFeatureInfoConfig(fields: TypeJsonArray, layerConfig: VectorLayerEntryConfig): void {
    if (!layerConfig.source) layerConfig.source = {};
    if (!layerConfig.source.featureInfo) layerConfig.source.featureInfo = { queryable: true };
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
        const fieldEntryType = (fieldEntry.type as string).split(':').slice(-1)[0];
        if (fieldEntryType === 'Geometry') return;
        if (processOutField) {
          layerConfig.source!.featureInfo!.outfields!.en = `${layerConfig.source!.featureInfo!.outfields!.en}${fieldEntry.name},`;
          layerConfig.source!.featureInfo!.fieldTypes = `${layerConfig.source!.featureInfo!.fieldTypes}${this.getFieldType(
            fieldEntry.name as string,
            layerConfig
          )},`;
        }
        layerConfig.source!.featureInfo!.aliasFields!.en = `${layerConfig.source!.featureInfo!.aliasFields!.en}${fieldEntry.name},`;
      });
      layerConfig.source.featureInfo!.outfields!.en = layerConfig.source.featureInfo!.outfields?.en?.slice(0, -1);
      layerConfig.source.featureInfo!.fieldTypes = layerConfig.source.featureInfo!.fieldTypes?.slice(0, -1);
      layerConfig.source.featureInfo!.aliasFields!.en = layerConfig.source.featureInfo!.aliasFields?.en?.slice(0, -1);
      layerConfig.source!.featureInfo!.outfields!.fr = layerConfig.source!.featureInfo!.outfields?.en;
      layerConfig.source!.featureInfo!.aliasFields!.fr = layerConfig.source!.featureInfo!.aliasFields?.en;
    }
    if (!layerConfig.source.featureInfo.nameField) {
      // INFO: WFS as geometry for first field, use second one
      const en =
        layerConfig.source.featureInfo!.outfields!.en?.split(',')[1] || layerConfig.source.featureInfo!.outfields!.fr?.split(',')[1];
      const fr = en;
      if (en) layerConfig.source.featureInfo.nameField = { en, fr };
    }
  }

  /** ***************************************************************************************************************************
   * Create a source configuration for the vector layer.
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration.
   * @param {SourceOptions} sourceOptions The source options (default: {}).
   * @param {ReadOptions} readOptions The read options (default: {}).
   *
   * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
   */
  // GV Layers Refactoring - Obsolete (in config?, in layers?)
  protected override createVectorSource(
    layerConfig: AbstractBaseLayerEntryConfig,
    sourceOptions: SourceOptions<Feature> = {},
    readOptions: ReadOptions = {}
  ): VectorSource<Feature> {
    readOptions.dataProjection = (layerConfig.source as TypeBaseSourceVectorInitialConfig).dataProjection;

    sourceOptions.url = (extent): string => {
      // check if url contains metadata parameters for the getCapabilities request and reformat the urls
      let sourceUrl = getLocalizedValue(layerConfig.source!.dataAccessPath!, AppEventProcessor.getDisplayLanguage(this.mapId));
      sourceUrl = sourceUrl!.indexOf('?') > -1 ? sourceUrl!.substring(0, sourceUrl!.indexOf('?')) : sourceUrl;
      sourceUrl = `${sourceUrl}?service=WFS&request=getFeature&version=${this.#version}`;
      sourceUrl = `${sourceUrl}&typeName=${layerConfig.layerId}`;
      // if an extent is provided, use it in the url
      if (sourceOptions.strategy === bbox && Number.isFinite(extent[0])) {
        sourceUrl = `${sourceUrl}&bbox=${extent},${this.getMapViewer().getProjection().getCode()}`;
      }
      return sourceUrl;
    };

    sourceOptions.format = new FormatWFS({
      version: this.#version,
    });

    const vectorSource = super.createVectorSource(layerConfig, sourceOptions, readOptions);

    return vectorSource;
  }
}
