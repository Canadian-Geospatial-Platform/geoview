import { Options as SourceOptions } from 'ol/source/Vector';
import { WFS as FormatWFS } from 'ol/format';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';
import { bbox } from 'ol/loadingstrategy';
import { Extent } from 'ol/extent';
import { Projection as OLProjection } from 'ol/proj';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import {
  TypeLayerEntryConfig,
  TypeVectorSourceInitialConfig,
  TypeGeoviewLayerConfig,
  TypeOutfields,
  TypeOutfieldsType,
  TypeSourceWfsInitialConfig,
  CONST_LAYER_ENTRY_TYPES,
  CONST_LAYER_TYPES,
} from '@/api/config/types/map-schema-types';

import { findPropertyByRegexPath } from '@/core/utils/utilities';
import { Fetch } from '@/core/utils/fetch-helper';
import {
  TypeMetadataWFS,
  TypeMetadataWFSFeatureTypeListFeatureType,
  TypeMetadataWFSFeatureTypeListFeatureTypeText,
  TypeMetadataWFSOperationMetadataOperationParameter,
  TypeMetadataWFSOperationMetadataOperationParameterValue,
  WfsLayerEntryConfig,
} from '@/core/utils/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { validateExtentWhenDefined } from '@/geo/utils/utilities';
import { LayerNoCapabilitiesError } from '@/core/exceptions/layer-exceptions';
import { LayerEntryConfigLayerIdNotFoundError } from '@/core/exceptions/layer-entry-config-exceptions';
import { GVWFS } from '@/geo/layer/gv-layers/vector/gv-wfs';
import { ConfigBaseClass, TypeLayerEntryShell } from '@/core/utils/config/validation-classes/config-base-class';

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
  /**
   * Constructs a WFS Layer configuration processor.
   * @param {TypeWFSLayerConfig} layerConfig the layer configuration
   */
  constructor(layerConfig: TypeWFSLayerConfig) {
    super(CONST_LAYER_TYPES.WFS, layerConfig);
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeMetadataWFS | undefined} The strongly-typed layer configuration specific to this layer.
   */
  override getMetadata(): TypeMetadataWFS | undefined {
    return super.getMetadata() as TypeMetadataWFS | undefined;
  }

  /**
   * Gets the WFS version
   * @returns {string | undefined} The WFS service version as read from the metadata attribute.
   */
  getVersion(): string | undefined {
    return this.getMetadata()?.['@attributes'].version;
  }

  /**
   * Overrides the way the metadata is fetched.
   * Resolves with the Json object or undefined when no metadata is to be expected for a particular layer type.
   * @returns {Promise<T = TypeMetadataWFS>} A promise with the metadata or undefined when no metadata for the particular layer type.
   */
  protected override async onFetchServiceMetadata<T = TypeMetadataWFS>(): Promise<T> {
    // Fetch it
    const metadata = await WFS.fetchMetadata(this.metadataAccessPath);

    // If not found
    if (!metadata) throw new LayerNoCapabilitiesError(this.geoviewLayerId, this.geoviewLayerName);

    // Return it
    return metadata as T;
  }

  /**
   * Overrides the way a geoview layer config initializes its layer entries.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
   */
  protected override async onInitLayerEntries(): Promise<TypeGeoviewLayerConfig> {
    // Fetch metadata
    const rootUrl = this.metadataAccessPath;
    const metadata = await this.onFetchServiceMetadata();

    // Now that we have metadata, get the layer ids from it
    if (metadata && !Array.isArray(metadata?.FeatureTypeList?.FeatureType))
      metadata.FeatureTypeList.FeatureType = [metadata.FeatureTypeList?.FeatureType];

    const metadataLayerList = metadata?.FeatureTypeList.FeatureType as TypeMetadataWFSFeatureTypeListFeatureType[];
    const entries = metadataLayerList.map((layerMetadata) => {
      let id = layerMetadata.Name as string;
      if ('#text' in (layerMetadata.Name as TypeMetadataWFSFeatureTypeListFeatureTypeText))
        id = (layerMetadata.Name as TypeMetadataWFSFeatureTypeListFeatureTypeText)['#text'];
      let title = layerMetadata.Title as string;
      if ('#text' in (layerMetadata.Title as TypeMetadataWFSFeatureTypeListFeatureTypeText))
        title = (layerMetadata.Title as TypeMetadataWFSFeatureTypeListFeatureTypeText)['#text'];

      return {
        id,
        layerId: id,
        layerName: title,
      };
    });

    // Redirect
    return WFS.createWfsFeatureLayerConfig(this.geoviewLayerId, this.geoviewLayerName, rootUrl, false, entries);
  }

  /**
   * Overrides the validation of a layer entry config.
   * @param {ConfigBaseClass} layerConfig - The layer entry config to validate.
   */
  protected override onValidateLayerEntryConfig(layerConfig: ConfigBaseClass): void {
    // Note that the code assumes wfs feature type list does not contains metadata layer group. If you need layer group,
    // you can define them in the configuration section.
    // when there is only one layer, it is not an array but an object
    if (!Array.isArray(this.getMetadata()?.FeatureTypeList?.FeatureType))
      this.getMetadata()!.FeatureTypeList.FeatureType = [
        this.getMetadata()!.FeatureTypeList?.FeatureType as TypeMetadataWFSFeatureTypeListFeatureType,
      ];

    if (Array.isArray(this.getMetadata()?.FeatureTypeList?.FeatureType)) {
      const metadataLayerList = this.getMetadata()!.FeatureTypeList.FeatureType as TypeMetadataWFSFeatureTypeListFeatureType[];
      const foundMetadata = metadataLayerList.find((layerMetadata) => {
        let id = layerMetadata.Name as string;
        if ('#text' in (layerMetadata.Name as TypeMetadataWFSFeatureTypeListFeatureTypeText))
          id = (layerMetadata.Name as TypeMetadataWFSFeatureTypeListFeatureTypeText)['#text'];
        return id.includes(layerConfig.layerId);
      });

      if (!foundMetadata) {
        // Add a layer load error
        this.addLayerLoadError(new LayerEntryConfigLayerIdNotFoundError(layerConfig), layerConfig);
        return;
      }

      // eslint-disable-next-line no-param-reassign
      layerConfig.initialSettings.extent = validateExtentWhenDefined(layerConfig.initialSettings.extent);

      if (!layerConfig.initialSettings?.bounds && foundMetadata['ows:WGS84BoundingBox']) {
        // TODO: Check - This additional processing seem valid, but is it at the right place? A bit confusing with the rest of the codebase.
        // TODO: Refactor - Layers refactoring. Validate if this code is still being executed after the layers migration. This code may easily have been forgotten.
        const lowerCorner = foundMetadata['ows:WGS84BoundingBox']['ows:LowerCorner']['#text'].split(' ');
        const upperCorner = foundMetadata['ows:WGS84BoundingBox']['ows:UpperCorner']['#text'].split(' ');
        const bounds = [Number(lowerCorner[0]), Number(lowerCorner[1]), Number(upperCorner[0]), Number(upperCorner[1])];

        // eslint-disable-next-line no-param-reassign
        layerConfig.initialSettings.bounds = bounds;
      }

      // eslint-disable-next-line no-param-reassign
      layerConfig.initialSettings.bounds = validateExtentWhenDefined(layerConfig.initialSettings.bounds);
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
    const describeFeatureParams = this.getMetadata()!['ows:OperationsMetadata']['ows:Operation'][1]['ows:Parameter'];
    const describeFeatureParamsValues = findPropertyByRegexPath(describeFeatureParams, /(?:Value)/) as
      | TypeMetadataWFSOperationMetadataOperationParameter
      | TypeMetadataWFSOperationMetadataOperationParameterValue[];

    let outputFormat = '';
    if (Array.isArray(describeFeatureParamsValues)) {
      if (describeFeatureParamsValues.length > 0) {
        outputFormat = describeFeatureParamsValues[0]['#text'];
      }
    } else if (Array.isArray(describeFeatureParamsValues['ows:Value'])) {
      outputFormat = describeFeatureParamsValues['ows:Value'][0]['#text'];
    } else {
      outputFormat = describeFeatureParamsValues['ows:Value']['#text'];
    }

    const describeFeatureUrl = `${queryUrl}?service=WFS&request=DescribeFeatureType&version=${this.getVersion()}&outputFormat=${encodeURIComponent(outputFormat)}&typeName=${layerConfig.layerId}`;

    if (describeFeatureUrl && outputFormat === 'application/json') {
      const layerMetadata = await Fetch.fetchJson<WFSJsonResponse>(describeFeatureUrl);
      if (Array.isArray(layerMetadata.featureTypes) && Array.isArray(layerMetadata.featureTypes[0].properties)) {
        layerConfig.setLayerMetadata(layerMetadata.featureTypes[0].properties);
        WFS.#processFeatureInfoConfig(layerMetadata.featureTypes[0].properties, layerConfig as WfsLayerEntryConfig);
      }
    } else if (describeFeatureUrl && outputFormat.toUpperCase().includes('XML')) {
      // Fetch the XML and read the content as Json
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const xmlJsonDescribe = (await Fetch.fetchXMLToJson(describeFeatureUrl)) as any;
      const prefix = Object.keys(xmlJsonDescribe)[0].includes('xsd:') ? 'xsd:' : '';
      const xmlJsonSchema = xmlJsonDescribe[`${prefix}schema`];
      const xmlJsonDescribeElement =
        xmlJsonSchema[`${prefix}complexType`] !== undefined
          ? xmlJsonSchema[`${prefix}complexType`][`${prefix}complexContent`][`${prefix}extension`][`${prefix}sequence`][`${prefix}element`]
          : [];

      if (Array.isArray(xmlJsonDescribeElement)) {
        // recreate the array of properties as if it was json
        const featureTypeProperties: WFSJsonResponseFeatureTypeFields[] = [];
        xmlJsonDescribeElement.forEach((element) => {
          featureTypeProperties.push(element['@attributes']);
        });

        layerConfig.setLayerMetadata(featureTypeProperties);
        WFS.#processFeatureInfoConfig(featureTypeProperties, layerConfig as WfsLayerEntryConfig);
      }
    }

    // Return the layer config
    return layerConfig;
  }

  /**
   * Overrides the creation of the source configuration for the vector layer
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer entry configuration.
   * @param {SourceOptions} sourceOptions - The source options.
   * @param {ReadOptions} readOptions - The read options.
   * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
   */
  protected override onCreateVectorSource(
    layerConfig: VectorLayerEntryConfig,
    sourceOptions: SourceOptions<Feature>,
    readOptions: ReadOptions
  ): VectorSource<Feature> {
    // eslint-disable-next-line no-param-reassign
    readOptions.dataProjection = (layerConfig.source as TypeSourceWfsInitialConfig).dataProjection;

    // eslint-disable-next-line no-param-reassign
    sourceOptions.url = (extent: Extent, resolution: number, projection: OLProjection): string => {
      // check if url contains metadata parameters for the getCapabilities request and reformat the urls
      let sourceUrl = layerConfig.source!.dataAccessPath!;
      sourceUrl = sourceUrl.indexOf('?') > -1 ? sourceUrl.substring(0, sourceUrl.indexOf('?')) : sourceUrl;
      // GV: Use processUrlParameters('GetFeature') method of GeoView layer config to get the sourceUrl and append &typeName= to it.
      sourceUrl = `${sourceUrl}?service=WFS&request=getFeature&version=${this.getVersion()}`;
      sourceUrl = `${sourceUrl}&typeName=${layerConfig.layerId}`;
      // if an extent is provided, use it in the url
      if (sourceOptions.strategy === bbox && Number.isFinite(extent[0])) {
        sourceUrl = `${sourceUrl}&bbox=${extent},${projection.getCode()}`;
      }
      return sourceUrl;
    };

    // eslint-disable-next-line no-param-reassign
    sourceOptions.format = new FormatWFS({
      version: this.getVersion(),
    });

    // Call parent
    return super.onCreateVectorSource(layerConfig, sourceOptions, readOptions);
  }

  /**
   * Overrides the creation of the GV Layer
   * @param {WfsLayerEntryConfig} layerConfig - The layer entry configuration.
   * @returns {GVWFS} The GV Layer
   */
  protected override onCreateGVLayer(layerConfig: WfsLayerEntryConfig): GVWFS {
    // Create the source
    const source = this.createVectorSource(layerConfig);
    // Create the GV Layer
    const gvLayer = new GVWFS(source, layerConfig);
    // Return it
    return gvLayer;
  }

  /**
   * Fetches the metadata for a typical WFS class.
   * @param {string} url - The url to query the metadata from.
   * @returns {Promise<TypeMetadataWFS | undefined>} Promise with the metadata when fetched or undefined when capabilities weren't found.
   */
  static async fetchMetadata(url: string): Promise<TypeMetadataWFS | undefined> {
    // Check if url contains metadata parameters for the getCapabilities request and reformat the urls
    const getCapabilitiesUrl = url.indexOf('?') > -1 ? url.substring(url.indexOf('?')) : `?service=WFS&request=GetCapabilities`;
    const queryUrl = url.indexOf('?') > -1 ? url.substring(0, url.indexOf('?')) : url;

    // Query XML to Json
    const responseJson = await Fetch.fetchXMLToJson(`${queryUrl}${getCapabilitiesUrl}`);

    // Parse the WFS_Capabilities
    return findPropertyByRegexPath(responseJson, /(?:WFS_Capabilities)/) as TypeMetadataWFS;
  }

  /**
   * Initializes a GeoView layer configuration for a WFS layer.
   * This method creates a basic TypeGeoviewLayerConfig using the provided
   * ID, name, and metadata access path URL. It then initializes the layer entries by calling
   * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
   * @param {string} geoviewLayerId - A unique identifier for the layer.
   * @param {string} geoviewLayerName - The display name of the layer.
   * @param {string} metadataAccessPath - The full service URL to the layer endpoint.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise that resolves to an initialized GeoView layer configuration with layer entries.
   */
  static initGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string
  ): Promise<TypeGeoviewLayerConfig> {
    // Create the Layer config
    const myLayer = new WFS({ geoviewLayerId, geoviewLayerName, metadataAccessPath } as TypeWFSLayerConfig);
    return myLayer.initGeoViewLayerEntries();
  }

  /**
   * This method sets the outfields and aliasFields of the source feature info.
   *
   * @param {WFSJsonResponseFeatureTypeFields[]} fields An array of field names and its aliases.
   * @param {VectorLayerEntryConfig} layerConfig The vector layer entry to configure.
   * @private
   */
  static #processFeatureInfoConfig(fields: WFSJsonResponseFeatureTypeFields[], layerConfig: WfsLayerEntryConfig): void {
    // eslint-disable-next-line no-param-reassign
    if (!layerConfig.source) layerConfig.source = { format: 'WFS' };
    // eslint-disable-next-line no-param-reassign
    if (!layerConfig.source.featureInfo) layerConfig.source.featureInfo = { queryable: true };

    // Process undefined outfields or aliasFields
    if (!layerConfig.source.featureInfo.outfields?.length) {
      // eslint-disable-next-line no-param-reassign
      if (!layerConfig.source.featureInfo.outfields) layerConfig.source.featureInfo.outfields = [];

      fields.forEach((fieldEntry) => {
        const fieldEntryType = fieldEntry.type.split(':').slice(-1)[0];
        if (fieldEntryType === 'Geometry') return;

        const newOutfield: TypeOutfields = {
          name: fieldEntry.name,
          alias: fieldEntry.name,
          type: WFS.getFieldType(fieldEntry.name, layerConfig),
          domain: null,
        };

        layerConfig.source.featureInfo!.outfields!.push(newOutfield);
      });
    }

    layerConfig.source.featureInfo.outfields.forEach((outfield) => {
      // eslint-disable-next-line no-param-reassign
      if (!outfield.alias) outfield.alias = outfield.name;
    });

    // INFO: WFS as geometry for first field, set name field to second value
    if (!layerConfig.source.featureInfo.nameField) {
      // eslint-disable-next-line no-param-reassign
      layerConfig.source.featureInfo.nameField = layerConfig.source.featureInfo.outfields[1].name;
    }
  }

  // Patch for field type only use for WFS
  static getFieldType(fieldName: string, layerConfig: WfsLayerEntryConfig): TypeOutfieldsType {
    const fieldDefinitions = layerConfig.getLayerMetadata();
    const fieldDefinition = fieldDefinitions?.find((metadataEntry) => metadataEntry.name === fieldName);
    if (!fieldDefinition) return 'string';
    const fieldEntryType = fieldDefinition.type.split(':').slice(-1)[0];
    if (fieldEntryType === 'date') return 'date';
    if (['int', 'number'].includes(fieldEntryType)) return 'number';
    return 'string';
  }

  /**
   * Creates a configuration object for an WFS Feature layer.
   * This function constructs a `TypeWFSLayerConfig` object that describes an WFS Feature layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata or feature data.
   * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
   * @returns {TypeWFSLayerConfig} The constructed configuration object for the WFS Feature layer.
   */
  static createWfsFeatureLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean,
    layerEntries: TypeLayerEntryShell[]
  ): TypeWFSLayerConfig {
    const geoviewLayerConfig: TypeWFSLayerConfig = {
      geoviewLayerId,
      geoviewLayerName,
      metadataAccessPath,
      geoviewLayerType: CONST_LAYER_TYPES.WFS,
      isTimeAware,
      listOfLayerEntryConfig: [],
    };
    geoviewLayerConfig.listOfLayerEntryConfig = layerEntries.map((layerEntry) => {
      const layerEntryConfig = new WfsLayerEntryConfig({
        geoviewLayerConfig,
        schemaTag: CONST_LAYER_TYPES.WFS,
        entryType: CONST_LAYER_ENTRY_TYPES.VECTOR,
        layerId: `${layerEntry.id}`,
        layerName: `${layerEntry.layerName || layerEntry.id}`,
        source: {
          format: 'WFS',
          strategy: 'all',
          dataAccessPath: metadataAccessPath,
        },
      } as unknown as WfsLayerEntryConfig);
      return layerEntryConfig;
    });

    // Return it
    return geoviewLayerConfig;
  }

  /**
   * Processes a WFS config returning a Promise of an array of ConfigBaseClass layer entry configurations.
   * @returns A Promise with the layer configurations.
   */
  static processWFSConfig(geoviewLayerId: string, geoviewLayerName: string, url: string, layerIds: string[]): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = WFS.createWfsFeatureLayerConfig(
      geoviewLayerId,
      geoviewLayerName,
      url,
      false,
      layerIds.map((layerId) => {
        return { id: layerId };
      })
    );

    // Create the class from geoview-layers package
    const myLayer = new WFS(layerConfig);

    // Process it
    return AbstractGeoViewVector.processConfig(myLayer);
  }
}

export type WFSJsonResponse = {
  featureTypes: WFSJsonResponseFeatureType[];
};

export type WFSJsonResponseFeatureType = {
  properties: WFSJsonResponseFeatureTypeFields[];
};

export type WFSJsonResponseFeatureTypeFields = {
  type: string;
  name: string;
};

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
