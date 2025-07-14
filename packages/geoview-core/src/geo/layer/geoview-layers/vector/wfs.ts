import { Options as SourceOptions } from 'ol/source/Vector';
import { WFS as FormatWFS } from 'ol/format';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';
import { bbox } from 'ol/loadingstrategy';
import { Extent } from 'ol/extent';
import { Projection as OLProjection } from 'ol/proj';
import { TypeJsonArray, TypeJsonObject } from '@/api/config/types/config-types';
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

import { findPropertyNameByRegex } from '@/core/utils/utilities';
import { Fetch } from '@/core/utils/fetch-helper';
import { WfsLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { validateExtentWhenDefined } from '@/geo/utils/utilities';
import { LayerNoCapabilitiesError } from '@/core/exceptions/layer-exceptions';
import { LayerEntryConfigLayerIdNotFoundError } from '@/core/exceptions/layer-entry-config-exceptions';
import { GVWFS } from '@/geo/layer/gv-layers/vector/gv-wfs';

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
   * Gets the WFS version
   * @returns {string | undefined} The WFS service version as read from the metadata attribute.
   */
  getVersion(): string | undefined {
    return this.metadata?.['@attributes'].version as string | undefined;
  }

  /**
   * Overrides the way the metadata is fetched.
   * Resolves with the Json object or undefined when no metadata is to be expected for a particular layer type.
   * @returns {Promise<TypeJsonObject | undefined>} A promise with the metadata or undefined when no metadata for the particular layer type.
   */
  protected override async onFetchServiceMetadata(): Promise<TypeJsonObject | undefined> {
    // Fetch it
    const metadata = await WFS.fetchMetadata(this.metadataAccessPath);

    // If not found
    if (!metadata) throw new LayerNoCapabilitiesError(this.geoviewLayerId, this.geoviewLayerName);

    // Return it
    return metadata;
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
    if (!Array.isArray(metadata?.FeatureTypeList?.FeatureType))
      metadata!.FeatureTypeList.FeatureType = [metadata?.FeatureTypeList?.FeatureType] as TypeJsonObject;

    const metadataLayerList = metadata?.FeatureTypeList.FeatureType as TypeJsonArray;
    const entries = metadataLayerList.map((layerMetadata) => {
      return {
        id: layerMetadata.Name && (layerMetadata.Name['#text'] as string),
        layerId: layerMetadata.Name && (layerMetadata.Name['#text'] as string),
        layerName: layerMetadata.Title && (layerMetadata.Title['#text'] as string),
      };
    }) as unknown as TypeJsonArray;

    // Redirect
    return Promise.resolve(WFS.createWfsFeatureLayerConfig(this.geoviewLayerId, this.geoviewLayerName, rootUrl, false, entries));
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
      this.metadata!.FeatureTypeList.FeatureType = [this.metadata?.FeatureTypeList?.FeatureType] as TypeJsonObject;

    if (Array.isArray(this.metadata?.FeatureTypeList?.FeatureType)) {
      const metadataLayerList = this.metadata?.FeatureTypeList.FeatureType as Array<TypeJsonObject>;
      const foundMetadata = metadataLayerList.find((layerMetadata) => {
        const metadataLayerId = (layerMetadata.Name && layerMetadata.Name['#text']) as string;
        return metadataLayerId.includes(layerConfig.layerId);
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
        const lowerCorner = (foundMetadata['ows:WGS84BoundingBox']['ows:LowerCorner']['#text'] as string).split(' ');
        const upperCorner = (foundMetadata['ows:WGS84BoundingBox']['ows:UpperCorner']['#text'] as string).split(' ');
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
    const describeFeatureParams = this.metadata!['ows:OperationsMetadata']['ows:Operation'][1]['ows:Parameter'];
    const describeFeatureParamsValues = findPropertyNameByRegex(describeFeatureParams, /(?:Value)/);
    let outputFormat = '';
    if (describeFeatureParamsValues !== undefined) {
      if (Array.isArray(describeFeatureParamsValues['ows:Value'])) {
        outputFormat = describeFeatureParamsValues['ows:Value'][0]['#text'] as string;
      } else if (describeFeatureParamsValues['ows:Value'] === undefined) {
        outputFormat = describeFeatureParamsValues[0]['#text'] as string;
      } else {
        outputFormat = describeFeatureParamsValues['ows:Value']['#text'] as string;
      }
    }

    const describeFeatureUrl = `${queryUrl}?service=WFS&request=DescribeFeatureType&version=${this.getVersion()}&outputFormat=${encodeURIComponent(outputFormat)}&typeName=${layerConfig.layerId}`;

    if (describeFeatureUrl && outputFormat === 'application/json') {
      const layerMetadata = await Fetch.fetchJsonAsObject(describeFeatureUrl);
      if (Array.isArray(layerMetadata.featureTypes) && Array.isArray(layerMetadata.featureTypes[0].properties)) {
        layerConfig.setLayerMetadata(layerMetadata.featureTypes[0].properties);
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

        layerConfig.setLayerMetadata(featureTypeProperties as TypeJsonObject);
        WFS.#processFeatureInfoConfig(featureTypeProperties as TypeJsonArray, layerConfig);
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
   * @returns {Promise<TypeJsonObject | undefined>} Promise with the metadata when fetched or undefined when capabilities weren't found.
   */
  static async fetchMetadata(url: string): Promise<TypeJsonObject | undefined> {
    // Check if url contains metadata parameters for the getCapabilities request and reformat the urls
    const getCapabilitiesUrl = url.indexOf('?') > -1 ? url.substring(url.indexOf('?')) : `?service=WFS&request=GetCapabilities`;
    const queryUrl = url.indexOf('?') > -1 ? url.substring(0, url.indexOf('?')) : url;

    // Query XML to Json
    const responseJson = await Fetch.fetchXMLToJson(`${queryUrl}${getCapabilitiesUrl}`);

    // Parse the WFS_Capabilities
    return findPropertyNameByRegex(responseJson, /(?:WFS_Capabilities)/);
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
    const layerConfig = WFS.createWfsFeatureLayerConfig(geoviewLayerId, geoviewLayerName, metadataAccessPath, false, []);
    const myLayer = new WFS(layerConfig);
    return myLayer.initGeoViewLayerEntries();
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
  static getFieldType(fieldName: string, layerConfig: VectorLayerEntryConfig): TypeOutfieldsType {
    const fieldDefinitions = layerConfig.getLayerMetadata() as TypeJsonArray;
    const fieldDefinition =
      fieldDefinitions !== undefined ? fieldDefinitions.find((metadataEntry) => metadataEntry.name === fieldName) : undefined;
    if (!fieldDefinition) return 'string';
    const fieldEntryType = (fieldDefinition.type as string).split(':').slice(-1)[0];
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
   * @param {TypeJsonArray} layerEntries - An array of layer entries objects to be included in the configuration.
   * @returns {TypeWFSLayerConfig} The constructed configuration object for the WFS Feature layer.
   */
  static createWfsFeatureLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean,
    layerEntries: TypeJsonArray
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
      } as WfsLayerEntryConfig);
      return layerEntryConfig;
    });

    // Return it
    return geoviewLayerConfig;
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
