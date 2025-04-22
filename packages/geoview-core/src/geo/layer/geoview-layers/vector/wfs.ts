import { Options as SourceOptions } from 'ol/source/Vector';
import { WFS as FormatWFS } from 'ol/format';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';
import { bbox } from 'ol/loadingstrategy';
import { TypeJsonArray, TypeJsonObject } from '@/api/config/types/config-types';
import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import {
  TypeLayerEntryConfig,
  TypeVectorSourceInitialConfig,
  TypeGeoviewLayerConfig,
  TypeOutfields,
  TypeOutfieldsType,
  TypeSourceWfsInitialConfig,
} from '@/api/config/types/map-schema-types';

import { findPropertyNameByRegex } from '@/core/utils/utilities';
import { Fetch } from '@/core/utils/fetch-helper';
import { WfsLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { validateExtentWhenDefined } from '@/geo/utils/utilities';
import { LayerNoCapabilitiesError } from '@/core/exceptions/layer-exceptions';
import { LayerEntryConfigLayerIdNotFoundError } from '@/core/exceptions/layer-entry-config-exceptions';

export interface TypeSourceWFSVectorInitialConfig extends TypeVectorSourceInitialConfig {
  format: 'WFS';
}

export interface TypeWFSLayerConfig extends Omit<TypeGeoviewLayerConfig, 'geoviewLayerType'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.WFS;
  listOfLayerEntryConfig: WfsLayerEntryConfig[];
}

/**
 * A class to add WFS layer.
 *
 * @exports
 * @class WFS
 */
export class WFS extends AbstractGeoViewVector {
  /** private variable holding wfs version. */
  #version = '2.0.0';

  /**
   * Constructs a WFS Layer configuration processor.
   * @param {string} mapId the id of the map
   * @param {TypeWFSLayerConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeWFSLayerConfig) {
    super(CONST_LAYER_TYPES.WFS, layerConfig, mapId);
  }

  /**
   * Fetches the metadata for a typical WFS class.
   * @param {string} url - The url to query the metadata from.
   */
  static fetchMetadata(url: string): Promise<TypeJsonObject> {
    // Check if url contains metadata parameters for the getCapabilities request and reformat the urls
    const getCapabilitiesUrl = url.indexOf('?') > -1 ? url.substring(url!.indexOf('?')) : `?service=WFS&request=GetCapabilities`;
    const queryUrl = url!.indexOf('?') > -1 ? url.substring(0, url!.indexOf('?')) : url;

    // Query XML to Json
    return Fetch.fetchXMLToJson(`${queryUrl}${getCapabilitiesUrl}`);
  }

  /**
   * Overrides the way the metadata is fetched and set in the 'metadata' property. Resolves when done.
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected override async onFetchAndSetServiceMetadata(): Promise<void> {
    // Fetch it
    const metadataString = await WFS.fetchMetadata(this.metadataAccessPath);

    // Parse the WFS_Capabilities
    const capabilitiesObject = findPropertyNameByRegex(metadataString, /(?:WFS_Capabilities)/);

    // If found
    if (capabilitiesObject) {
      // Set it
      this.metadata = capabilitiesObject;
      this.#version = (capabilitiesObject as TypeJsonObject)['@attributes'].version as string;
    } else {
      // Throw error
      throw new LayerNoCapabilitiesError(this.mapId, this.geoviewLayerId);
    }
  }

  /**
   * Overrides the validation of a layer entry config.
   * @param {TypeLayerEntryConfig} layerConfig - The layer entry config to validate.
   */
  protected override onValidateLayerEntryConfig(layerConfig: TypeLayerEntryConfig): void {
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
        // Add a layer load error
        this.addLayerLoadError(new LayerEntryConfigLayerIdNotFoundError(this.mapId, layerConfig), layerConfig);
        return;
      }

      // eslint-disable-next-line no-param-reassign
      layerConfig.initialSettings.extent = validateExtentWhenDefined(layerConfig.initialSettings.extent);

      if (!layerConfig.initialSettings?.bounds && foundMetadata['ows:WGS84BoundingBox']) {
        // TODO: Check - This additional processing seem valid, but is it at the right place? A bit confusing with the rest of the codebase.
        // TODO: Refactor - Layers refactoring. Validate if this code is still being executed after the layers migration. This code may easily have been forgotten.
        const lowerCorner = (foundMetadata['ows:WGS84BoundingBox']['ows:LowerCorner']['#text'] as string).split(' ');
        const upperCorner = (foundMetadata['ows:WGS84BoundingBox']['ows:UpperCorner']['#text'] as string).split(' ');
        const bounds = [Number(lowerCorner[0]), Number(lowerCorner[1]), Number(upperCorner[0]), Number(upperCorner[1])];

        // eslint-disable-next-line no-param-reassign
        layerConfig.initialSettings!.bounds = bounds;
      }

      // eslint-disable-next-line no-param-reassign
      layerConfig.initialSettings!.bounds = validateExtentWhenDefined(layerConfig.initialSettings!.bounds);
    }
  }

  /**
   * Overrides the way the layer metadata is processed.
   * @param {VectorLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @returns {Promise<VectorLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override async onProcessLayerMetadata(layerConfig: VectorLayerEntryConfig): Promise<VectorLayerEntryConfig> {
    let queryUrl = layerConfig.source!.dataAccessPath;

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
      const layerMetadata = await Fetch.fetchJson(describeFeatureUrl);
      if (Array.isArray(layerMetadata.featureTypes) && Array.isArray(layerMetadata.featureTypes[0].properties)) {
        this.setLayerMetadata(layerConfig.layerPath, layerMetadata.featureTypes[0].properties);
        WFS.#processFeatureInfoConfig(layerMetadata.featureTypes[0].properties as TypeJsonArray, layerConfig);
      }
    } else if (describeFeatureUrl && outputFormat.toUpperCase().includes('XML')) {
      // Fetch the XML and read the content as Json
      const xmlJsonDescribe = await Fetch.fetchXMLToJson(describeFeatureUrl);
      const prefix = Object.keys(xmlJsonDescribe)[0].includes('xsd:') ? 'xsd:' : '';
      const xmlJsonSchema = xmlJsonDescribe[`${prefix}schema`];
      const xmlJsonDescribeElement =
        xmlJsonSchema[`${prefix}complexType`] !== undefined
          ? xmlJsonSchema[`${prefix}complexType`][`${prefix}complexContent`][`${prefix}extension`][`${prefix}sequence`][`${prefix}element`]
          : [];

      if (Array.isArray(xmlJsonDescribeElement)) {
        // recreate the array of properties as if it was json
        const featureTypeProperties: TypeJsonArray = [];
        xmlJsonDescribeElement.forEach((element) => {
          featureTypeProperties.push(element['@attributes']);
        });

        this.setLayerMetadata(layerConfig.layerPath, featureTypeProperties as TypeJsonObject);
        WFS.#processFeatureInfoConfig(featureTypeProperties as TypeJsonArray, layerConfig);
      }
    }

    // Return the layer config
    return layerConfig;
  }

  /**
   * This method sets the outfields and aliasFields of the source feature info.
   *
   * @param {TypeJsonArray} fields An array of field names and its aliases.
   * @param {VectorLayerEntryConfig} layerConfig The vector layer entry to configure.
   * @private
   */
  static #processFeatureInfoConfig(fields: TypeJsonArray, layerConfig: VectorLayerEntryConfig): void {
    // eslint-disable-next-line no-param-reassign
    if (!layerConfig.source) layerConfig.source = {};
    // eslint-disable-next-line no-param-reassign
    if (!layerConfig.source.featureInfo) layerConfig.source.featureInfo = { queryable: true };

    // Process undefined outfields or aliasFields
    if (!layerConfig.source.featureInfo.outfields?.length) {
      // eslint-disable-next-line no-param-reassign
      if (!layerConfig.source.featureInfo.outfields) layerConfig.source.featureInfo.outfields = [];

      fields.forEach((fieldEntry) => {
        const fieldEntryType = (fieldEntry.type as string).split(':').slice(-1)[0];
        if (fieldEntryType === 'Geometry') return;

        const newOutfield: TypeOutfields = {
          name: fieldEntry.name as string,
          alias: fieldEntry.name as string,
          type: WFS.getFieldType(fieldEntry.name as string, layerConfig),
          domain: null,
        };

        layerConfig.source!.featureInfo!.outfields!.push(newOutfield);
      });
    }

    layerConfig.source.featureInfo!.outfields.forEach((outfield) => {
      // eslint-disable-next-line no-param-reassign
      if (!outfield.alias) outfield.alias = outfield.name;
    });

    // INFO: WFS as geometry for first field, set name field to second value
    if (!layerConfig.source.featureInfo.nameField) {
      // eslint-disable-next-line no-param-reassign
      layerConfig.source.featureInfo.nameField = layerConfig.source.featureInfo!.outfields[1].name;
    }
  }

  // Patch for field type only use for WFS
  static getFieldType(fieldName: string, layerConfig: VectorLayerEntryConfig): TypeOutfieldsType {
    const fieldDefinitions = layerConfig.getLayerMetadata() as TypeJsonArray;
    const fieldDefinition =
      fieldDefinitions !== undefined ? fieldDefinitions.find((metadataEntry) => metadataEntry.name === fieldName) : undefined;
    if (!fieldDefinition) return 'string';
    const fieldEntryType = (fieldDefinition.type as string).split(':').slice(-1)[0] as string;
    if (fieldEntryType === 'date') return 'date';
    if (['int', 'number'].includes(fieldEntryType)) return 'number';
    return 'string';
  }

  /**
   * Create a source configuration for the vector layer.
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration.
   * @param {SourceOptions} sourceOptions The source options (default: {}).
   * @param {ReadOptions} readOptions The read options (default: {}).
   *
   * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
   */
  protected override createVectorSource(
    layerConfig: VectorLayerEntryConfig,
    sourceOptions: SourceOptions<Feature> = {},
    readOptions: ReadOptions = {}
  ): VectorSource<Feature> {
    // eslint-disable-next-line no-param-reassign
    readOptions.dataProjection = (layerConfig.source as TypeSourceWfsInitialConfig).dataProjection;

    // eslint-disable-next-line no-param-reassign
    sourceOptions.url = (extent): string => {
      // check if url contains metadata parameters for the getCapabilities request and reformat the urls
      let sourceUrl = layerConfig.source!.dataAccessPath!;
      sourceUrl = sourceUrl!.indexOf('?') > -1 ? sourceUrl!.substring(0, sourceUrl!.indexOf('?')) : sourceUrl;
      // GV: Use processUrlParameters('GetFeature') method of GeoView layer config to get the sourceUrl and append &typeName= to it.
      sourceUrl = `${sourceUrl}?service=WFS&request=getFeature&version=${this.#version}`;
      sourceUrl = `${sourceUrl}&typeName=${layerConfig.layerId}`;
      // if an extent is provided, use it in the url
      if (sourceOptions.strategy === bbox && Number.isFinite(extent[0])) {
        sourceUrl = `${sourceUrl}&bbox=${extent},${this.getMapViewer().getProjection().getCode()}`;
      }
      return sourceUrl;
    };

    // eslint-disable-next-line no-param-reassign
    sourceOptions.format = new FormatWFS({
      version: this.#version,
    });

    // Call parent
    return super.createVectorSource(layerConfig, sourceOptions, readOptions);
  }
}

/**
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

/**
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
