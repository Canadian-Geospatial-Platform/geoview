import type { Feature } from 'ol';
import type { ReadOptions } from 'ol/format/Feature';
import type { Options as SourceOptions } from 'ol/source/Vector';
import type { Projection as OLProjection } from 'ol/proj';
import { bbox } from 'ol/loadingstrategy';

import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { WMS } from '@/geo/layer/geoview-layers/raster/wms';
import {
  type TypeLayerStyleSettings,
  type TypeOutfields,
  type TypeOutfieldsType,
  type TypeStyleGeometry,
} from '@/api/types/map-schema-types';
import type {
  TypeGeoviewLayerConfig,
  WFSJsonResponse,
  TypeMetadataWFS,
  VectorStrategy,
  TypeMetadataWFSOperationMetadataOperationParameter,
  TypeMetadataWFSOperationMetadataOperationParameterValue,
  TypeMetadataWFSTextOnly,
} from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { findPropertyByRegexPath } from '@/core/utils/utilities';
import { Fetch } from '@/core/utils/fetch-helper';
import {
  OgcWfsLayerEntryConfig,
  type OgcWfsLayerEntryConfigProps,
} from '@/api/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import type { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import { LayerNoCapabilitiesError, LayerServiceMetadataUnableToFetchError } from '@/core/exceptions/layer-exceptions';
import { GVWFS } from '@/geo/layer/gv-layers/vector/gv-wfs';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import { formatError } from '@/core/exceptions/core-exceptions';
import { GeoUtilities } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { logger } from '@/core/utils/logger';

export interface TypeWFSLayerConfig extends Omit<TypeGeoviewLayerConfig, 'geoviewLayerType'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.WFS;
  fetchStylesOnWMS?: boolean;
  listOfLayerEntryConfig: OgcWfsLayerEntryConfig[];
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
  // The constructor is not useless, it narrows down the accepted parameter type.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(layerConfig: TypeWFSLayerConfig) {
    super(layerConfig);
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeMetadataWFS | undefined} The strongly-typed layer configuration specific to this layer.
   */
  override getMetadata(): TypeMetadataWFS | undefined {
    return super.getMetadata() as TypeMetadataWFS | undefined;
  }

  /**
   * Overrides the way the metadata is fetched.
   * Resolves with the Json object or undefined when no metadata is to be expected for a particular layer type.
   * @param {AbortSignal?} [abortSignal] - Abort signal to handle cancelling of the process.
   * @returns {Promise<T = TypeMetadataWFS>} A promise with the metadata or undefined when no metadata for the particular layer type.
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
   * @throws {LayerNoCapabilitiesError} When the metadata is empty (no Capabilities).
   */
  protected override async onFetchServiceMetadata<T = TypeMetadataWFS>(abortSignal?: AbortSignal): Promise<T> {
    let metadata;
    try {
      // Fetch it
      metadata = await WFS.fetchMetadata(this.getMetadataAccessPath(), abortSignal);
    } catch (error: unknown) {
      // Throw
      throw new LayerServiceMetadataUnableToFetchError(
        this.getGeoviewLayerId(),
        this.getLayerEntryNameOrGeoviewLayerName(),
        formatError(error)
      );
    }

    // If not found
    if (!metadata) throw new LayerNoCapabilitiesError(this.getGeoviewLayerId(), this.getLayerEntryNameOrGeoviewLayerName());

    // Return it
    return metadata as T;
  }

  /**
   * Overrides the way a geoview layer config initializes its layer entries.
   * @param {AbortSignal?} [abortSignal] - Abort signal to handle cancelling of the process.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
   * @throws {LayerNoCapabilitiesError} When the metadata is empty (no Capabilities).
   */
  protected override async onInitLayerEntries(abortSignal?: AbortSignal): Promise<TypeGeoviewLayerConfig> {
    // Fetch metadata
    const rootUrl = this.getMetadataAccessPath();
    const metadata = await this.onFetchServiceMetadata(abortSignal);

    // The entries
    let entries: TypeLayerEntryShell[] = [];

    // If any
    if (metadata.FeatureTypeList?.FeatureType) {
      // Now that we have metadata, get the layer ids from it
      if (!Array.isArray(metadata.FeatureTypeList?.FeatureType))
        metadata.FeatureTypeList.FeatureType = [metadata.FeatureTypeList?.FeatureType];

      const metadataLayerList = metadata?.FeatureTypeList.FeatureType;
      entries = metadataLayerList.map((layerMetadata) => {
        let id = layerMetadata.Name as string;
        if (typeof layerMetadata.Name === 'object' && '#text' in layerMetadata.Name) id = layerMetadata.Name['#text'];

        let title = layerMetadata.Title as string;
        if (typeof layerMetadata.Title === 'object' && '#text' in layerMetadata.Title) title = layerMetadata.Title['#text'];

        return {
          id,
          layerId: id,
          layerName: title,
        };
      });
    }

    // Redirect
    // TODO: Check - Config init - Check if there's a way to better determine the vector strategy flag, defaults to 'all', how is it used here?
    return WFS.createGeoviewLayerConfig(
      this.getGeoviewLayerId(),
      this.getGeoviewLayerName(),
      rootUrl,
      this.getGeoviewLayerConfig().isTimeAware,
      'all',
      entries
    );
  }

  /**
   * Overrides the validation of a layer entry config.
   * @param {ConfigBaseClass} layerConfig - The layer entry config to validate.
   */
  protected override onValidateLayerEntryConfig(layerConfig: ConfigBaseClass): void {
    // Note that the code assumes wfs feature type list does not contains metadata layer group. If you need layer group,
    // you can define them in the configuration section.
    // when there is only one layer, it is not an array but an object

    try {
      // Try to get the feature type
      const layerConfigCasted = layerConfig as OgcWfsLayerEntryConfig;
      const featureType = layerConfigCasted.getFeatureType();

      // If no name
      if (!layerConfig.getLayerName()) {
        let foundTitle = featureType.Title as string;
        if (typeof featureType.Title === 'object' && '#text' in featureType.Title) foundTitle = featureType.Title['#text'];
        // If found title, use that
        if (foundTitle) layerConfig.setLayerName(foundTitle);
      }

      // If no bounds defined in the initial settings and an extent is defined in the metadata
      let bounds = layerConfig.getInitialSettingsBounds();
      if (!bounds && featureType['ows:WGS84BoundingBox']) {
        let lowerCornerRaw = featureType['ows:WGS84BoundingBox']['ows:LowerCorner'] as string;
        if (typeof lowerCornerRaw === 'object' && '#text' in lowerCornerRaw) lowerCornerRaw = lowerCornerRaw['#text'];
        let upperCornerRaw = featureType['ows:WGS84BoundingBox']['ows:UpperCorner'] as string;
        if (typeof upperCornerRaw === 'object' && '#text' in upperCornerRaw) upperCornerRaw = upperCornerRaw['#text'];
        const lowerCorner = lowerCornerRaw.split(' ');
        const upperCorner = upperCornerRaw.split(' ');
        bounds = [Number(lowerCorner[0]), Number(lowerCorner[1]), Number(upperCorner[0]), Number(upperCorner[1])];

        // Validate and update the bounds initial settings
        layerConfig.initInitialSettingsBoundsFromMetadata(bounds);
      }
    } catch (error: unknown) {
      // Add a layer load error
      this.addLayerLoadError(formatError(error), layerConfig);
    }
  }

  /**
   * Overrides the way the layer metadata is processed.
   * @param {VectorLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @param {OLProjection?} [mapProjection] - The map projection.
   * @param {AbortSignal?} [abortSignal] - Abort signal to handle cancelling of the process.
   * @returns {Promise<VectorLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
   */
  protected override async onProcessLayerMetadata(
    layerConfig: VectorLayerEntryConfig,
    mapProjection?: OLProjection,
    abortSignal?: AbortSignal
  ): Promise<VectorLayerEntryConfig> {
    // Cast it
    const layerConfigWFS = layerConfig as OgcWfsLayerEntryConfig;

    // Build url
    const url = layerConfig.getDataAccessPath();
    const outputFormat = WFS.extractDescribeFeatureOutputFormat(this.getMetadata()!);
    const describeFeatureUrl = GeoUtilities.ensureServiceRequestUrlDescribeFeatureType(
      url,
      layerConfig.layerId,
      layerConfigWFS.getVersion(),
      outputFormat
    );

    // If supporting application/json format
    if (outputFormat === 'application/json') {
      // Process using Json
      await WFS.#processDescribeFeatureJson(describeFeatureUrl, layerConfig, abortSignal);
    } else if (outputFormat.toUpperCase().includes('XML')) {
      // Process using XML
      await WFS.#processDescribeFeatureXml(describeFeatureUrl, layerConfig, abortSignal);
    }

    // Try
    const layerStyle = await WFS.#tryProcessLayerStylingInformationIfAny(layerConfigWFS);

    // Initialize the layer style by filling the blanks with the information from the metadata
    layerConfig.initLayerStyleFromMetadata(layerStyle);

    // Return the layer config
    return layerConfig;
  }

  /**
   * Overrides the loading of the vector features for the layer by fetching WFS data and converting it
   * into OpenLayers {@link Feature} feature instances.
   * @param {VectorLayerEntryConfig} layerConfig -
   * The configuration object for the vector layer, containing source and
   * data access information.
   * @param {SourceOptions<Feature>} sourceOptions -
   * The OpenLayers vector source options associated with the layer. This may be
   * used by implementations to customize loading behavior or source configuration.
   * @param {ReadOptions} readOptions -
   * Options controlling how features are read, including the target
   * `featureProjection`.
   * @returns {Promise<Feature[]>}
   * A promise that resolves to an array of OpenLayers features.
   * @protected
   * @override
   */
  protected override async onCreateVectorSourceLoadFeatures(
    layerConfig: VectorLayerEntryConfig,
    sourceOptions: SourceOptions<Feature>,
    readOptions: ReadOptions
  ): Promise<Feature[]> {
    // Cast it to a WFS layer config
    const layerConfigWFS = layerConfig as OgcWfsLayerEntryConfig;

    // Get the supported info formats
    const featureInfoFormat = layerConfigWFS.getSupportedFormats('application/json'); // application/json by default (QGIS Server doesn't seem to provide the metadata for the output formats, use application/json)

    // If one of those contain application/json, use that format to get features
    let outputFormat = featureInfoFormat.find((format) => format.toLowerCase().includes('application/json'));

    // TODO: WMS - Add support for other formats. Not quite the GV issue #3134, but similar

    // TODO: ALEX - FIX THIS EXCEPTION - Exception, the geo.weather.gc.ca/geomet service says it supports application/json, but it doesn't in reality
    if (layerConfig.getDataAccessPath().includes('//geo.weather.gc.ca/geomet')) outputFormat = undefined;

    // Check if url contains metadata parameters for the getCapabilities request and reformat the urls
    let wfsUrl = GeoUtilities.ensureServiceRequestUrlGetFeature(
      layerConfig.getDataAccessPath(),
      layerConfig.layerId,
      layerConfigWFS.getVersion(),
      outputFormat,
      undefined,
      undefined,
      undefined
    );

    // if an extent is provided, use it in the url
    if (sourceOptions.strategy === bbox && Number.isFinite(readOptions.extent?.[0])) {
      wfsUrl = `${wfsUrl}&bbox=${readOptions.extent},${Projection.getProjectionFromString(readOptions.featureProjection)?.getCode()}`;
    }

    // If output format is json
    let responseData;
    if (outputFormat) {
      // Query and read Json
      responseData = await AbstractGeoViewVector.fetchJson(wfsUrl, layerConfig.getSource().postSettings);
    } else {
      // Query and read text
      responseData = await AbstractGeoViewVector.fetchText(wfsUrl, layerConfig.getSource().postSettings);
    }

    // Check if the data is GeoJSON
    if (GeoUtilities.isGeoJSONObject(responseData)) {
      // Read the EPSG from the data
      const dataEPSG = GeoUtilities.readEPSGOfGeoJSON(responseData);

      // Check if we have it in Projection and try adding it if we're missing it
      await Projection.addProjectionIfMissing(dataEPSG);

      // Read the features
      return GeoUtilities.readFeaturesFromGeoJSON(responseData, readOptions);
    }

    // Here, the output isn't GeoJSON, probably XML/GML

    // Use the features response to determine the EPSG of the data, otherwise use the config otherwise force it to 4326, because OpenLayers struggles to figure it out by itself here
    const dataEPSG = GeoUtilities.readEPSGOfGML(responseData);

    // Check if we have it in Projection and try adding it if we're missing it
    await Projection.addProjectionIfMissing(dataEPSG);

    // eslint-disable-next-line no-param-reassign
    readOptions.dataProjection = dataEPSG || 'EPSG:4326'; // default: 4326

    // Read the features
    return GeoUtilities.readFeaturesFromWFS(responseData, layerConfigWFS.getVersion(), readOptions);
  }

  /**
   * Overrides the creation of the GV Layer
   * @param {OgcWfsLayerEntryConfig} layerConfig - The layer entry configuration.
   * @returns {GVWFS} The GV Layer
   */
  protected override onCreateGVLayer(layerConfig: OgcWfsLayerEntryConfig): GVWFS {
    // Create the source
    const source = this.createVectorSource(layerConfig);
    // Create the GV Layer
    const gvLayer = new GVWFS(source, layerConfig);
    // Return it
    return gvLayer;
  }

  // #endregion OVERRIDES

  // #region STATIC METHODS

  /**
   * Fetches the metadata for a typical WFS class.
   * @param {string} url - The url to query the metadata from.
   * @param {AbortSignal?} [abortSignal] - Abort signal to handle cancelling of the process.
   * @returns {Promise<TypeMetadataWFS | undefined>} Promise with the metadata when fetched or undefined when capabilities weren't found.
   * @static
   */
  static async fetchMetadata(url: string, abortSignal?: AbortSignal): Promise<TypeMetadataWFS | undefined> {
    // Get the GetCapabilities url
    const urlGetCap = GeoUtilities.ensureServiceRequestUrlGetCapabilities(url, 'WFS');

    // Query XML to Json
    const responseJson = await Fetch.fetchXMLToJson(`${urlGetCap}`, { signal: abortSignal });

    // Parse the WFS_Capabilities opening the root node right away to skip to the meat.
    return findPropertyByRegexPath(responseJson, /(?:WFS_Capabilities)/) as TypeMetadataWFS;
  }

  /**
   * Fetches WFS metadata for a given service URL and layer ID, then retrieves
   * the corresponding geometry type from the DescribeFeatureType response.
   * This method performs the following steps:
   * 1. Normalizes the base service URL.
   * 2. Fetches WFS capabilities or metadata from the service.
   * 3. Determines the WFS version and the proper output format for DescribeFeatureType.
   * 4. Builds and executes the DescribeFeatureType request.
   * 5. Extracts and returns the geometry type (e.g., `"Point"`, `"LineString"`, `"Polygon"`).
   * @param {string} url - The full WFS or WMS service URL from which to derive the base endpoint.
   * @param {string} layerId - The name or identifier of the layer to inspect.
   * @param {AbortSignal} [abortSignal] - Optional signal that allows the request to be aborted.
   * @returns {Promise<TypeOutfields[]>} A promise that resolves with the list of fields for the layer.
   * @static
   */
  static async fetchMetadataAndRetrieveFieldsInfo(url: string, layerId: string, abortSignal?: AbortSignal): Promise<TypeOutfields[]> {
    // Fetch the WFS metadata
    const metadata = await WFS.fetchMetadata(url, abortSignal);
    const version = metadata?.['@attributes'].version || '1.1.0';
    const outputFormat = WFS.extractDescribeFeatureOutputFormat(metadata!);

    // Build a describe feature url
    const describeFeatureUrl = GeoUtilities.ensureServiceRequestUrlDescribeFeatureType(url, layerId, version, outputFormat);

    // Call the describe feature url to try to get the geometry type
    return WFS.fetchDescribeFeature(describeFeatureUrl, outputFormat);
  }

  /**
   * Initializes a GeoView layer configuration for a WFS layer.
   * This method creates a basic TypeGeoviewLayerConfig using the provided
   * ID, name, and metadata access path URL. It then initializes the layer entries by calling
   * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
   * @param {string} geoviewLayerId - A unique identifier for the layer.
   * @param {string} geoviewLayerName - The display name of the layer.
   * @param {string} metadataAccessPath - The full service URL to the layer endpoint.
   * @param {boolean?} [isTimeAware] - Indicates whether the layer supports time-based filtering.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise that resolves to an initialized GeoView layer configuration with layer entries.
   * @static
   */
  static initGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware?: boolean
  ): Promise<TypeGeoviewLayerConfig> {
    // Create the Layer config
    const myLayer = new WFS({ geoviewLayerId, geoviewLayerName, metadataAccessPath, isTimeAware } as TypeWFSLayerConfig);
    return myLayer.initGeoViewLayerEntries();
  }

  /**
   * Extracts the preferred output format value for a WFS DescribeFeatureType operation
   * from the parsed WFS capabilities metadata.
   * The method navigates through the `ows:OperationsMetadata` section of the capabilities
   * document to locate the `"DescribeFeatureType"` operation and returns the first available
   * output format value.
   * @param {TypeMetadataWFS} metadata - The parsed WFS capabilities metadata object.
   * @returns {string} The detected output format string for the DescribeFeatureType operation,
   * or an empty string if no suitable value is found.
   * @static
   */
  static extractDescribeFeatureOutputFormat(metadata: TypeMetadataWFS): string {
    // Find the operation for DescribeFeatureOutput
    const describeFeatureOp = metadata['ows:OperationsMetadata']['ows:Operation'].find(
      (op) => op['@attributes'].name === 'DescribeFeatureType'
    );

    // If found
    if (describeFeatureOp) {
      // Find the outputFormat parameter
      let describeFeatureOperationParameter = describeFeatureOp['ows:Parameter'] as TypeMetadataWFSOperationMetadataOperationParameter[];
      if (!Array.isArray(describeFeatureOperationParameter)) describeFeatureOperationParameter = [describeFeatureOperationParameter];

      // Now Parameter is an array, find the 'outputFormat' parameter
      const describeOperationOutputFormat = describeFeatureOperationParameter.find((op) => op['@attributes'].name === 'outputFormat');

      // If found
      if (describeOperationOutputFormat) {
        // If there's an 'AllowedValues' property
        let outputFormatValue;
        if (typeof describeOperationOutputFormat === 'object' && 'ows:AllowedValues' in describeOperationOutputFormat) {
          // GEO SERVER WAY
          // Read
          let values = describeOperationOutputFormat['ows:AllowedValues'] as TypeMetadataWFSOperationMetadataOperationParameterValue[];
          if (!Array.isArray(values)) values = [values];

          // Read first one
          outputFormatValue = values?.[0]['ows:Value'] as (string | TypeMetadataWFSTextOnly)[];
          if (!Array.isArray(outputFormatValue)) outputFormatValue = [outputFormatValue];
        } else if (typeof describeOperationOutputFormat === 'object' && 'ows:Value' in describeOperationOutputFormat) {
          // QGIS SERVER WAY
          // Read
          let values = describeOperationOutputFormat['ows:Value'] as (string | TypeMetadataWFSTextOnly)[];
          if (!Array.isArray(values)) values = [values];

          // Read first one
          outputFormatValue = values?.[0];
          if (!Array.isArray(outputFormatValue)) outputFormatValue = [outputFormatValue];
        }

        // Final read
        let outputFormatValueFinal = outputFormatValue?.[0];
        if (typeof outputFormatValueFinal === 'object' && '#text' in outputFormatValueFinal)
          outputFormatValueFinal = outputFormatValueFinal['#text'];

        // Return it
        return outputFormatValueFinal || '';
      }
    }

    // Not found
    return '';
  }

  /**
   * Fetches and parses a WFS `DescribeFeatureType` response from the given URL,
   * automatically selecting the appropriate parsing method (JSON or XML)
   * based on the specified output format.
   * @param {string} url - The DescribeFeatureType request URL.
   * @param {string} outputFormat - The expected response format (`"application/json"` or XML-based MIME type).
   * @param {AbortSignal} [abortSignal] - Optional signal that allows the fetch request to be aborted.
   * @returns {Promise<TypeOutfields[]>} A promise resolving to an array of field definitions
   *   describing the feature type's properties (including geometry fields).
   * @static
   */
  static fetchDescribeFeature(url: string, outputFormat: string, abortSignal?: AbortSignal): Promise<TypeOutfields[]> {
    // If json
    if (outputFormat === 'application/json') {
      return WFS.fetchDescribeFeatureJson(url, abortSignal);
    }

    // XML
    return WFS.fetchDescribeFeatureXML(url, abortSignal);
  }

  /**
   * Fetches and parses a WFS `DescribeFeatureType` response in JSON format.
   * This method is used when the WFS server supports
   * `outputFormat=application/json` for DescribeFeatureType requests.
   * It extracts and returns the list of feature type properties.
   * @param {string} url - The DescribeFeatureType request URL.
   * @param {AbortSignal} [abortSignal] - Optional signal to abort the fetch request.
   * @returns {Promise<TypeOutfields[]>} A promise resolving to
   *   an array of feature type field definitions extracted from the JSON response.
   * @static
   */
  static async fetchDescribeFeatureJson(url: string, abortSignal?: AbortSignal): Promise<TypeOutfields[]> {
    // Fetch
    const layerMetadata = await Fetch.fetchJson<WFSJsonResponse>(url, { signal: abortSignal });
    return layerMetadata.featureTypes?.[0]?.properties || [];
  }

  /**
   * Fetches and parses a WFS `DescribeFeatureType` response in XML format.
   * This method is used for servers that only support XML DescribeFeatureType responses
   * (e.g., GeoServer, MapServer, or QGIS Server without JSON output).
   * It converts the XML schema to JSON and extracts the list of feature properties
   * from the complex type definition.
   * @param {string} url - The DescribeFeatureType request URL.
   * @param {AbortSignal} [abortSignal] - Optional signal to abort the fetch request.
   * @returns {Promise<TypeOutfields[]>} A promise resolving to
   *   an array of feature type field definitions extracted from the XML schema.
   * @static
   */
  static async fetchDescribeFeatureXML(url: string, abortSignal?: AbortSignal): Promise<TypeOutfields[]> {
    // Fetch
    const xmlJsonDescribe = await Fetch.fetchXMLToJson(url, { signal: abortSignal });
    const prefix = Object.keys(xmlJsonDescribe)[0].includes('xsd:') ? 'xsd:' : '';

    const xmlJsonSchema = xmlJsonDescribe[`${prefix}schema`] as Record<string, unknown>;
    const xmlJsonSchemaComplexType = xmlJsonSchema?.[`${prefix}complexType`] as Record<string, unknown>;

    const elements =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (xmlJsonSchemaComplexType as any)?.[`${prefix}complexContent`]?.[`${prefix}extension`]?.[`${prefix}sequence`]?.[`${prefix}element`] ??
      [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return elements.map((el: any) => el['@attributes']) as TypeOutfields[];
  }

  /**
   * Fetches a WFS DescribeFeatureType response in JSON format and updates the layer metadata configuration
   * with the parsed feature type properties.
   * @param {string} url - The full URL to the DescribeFeatureType request for the layer.
   * @param {VectorLayerEntryConfig} layerConfig - The layer configuration object to populate with metadata.
   * @param {AbortSignal} [abortSignal] - Optional abort signal to cancel the fetch request.
   * @returns {Promise<void>} Resolves once the layer metadata has been processed and feature info configuration updated.
   * @private
   * @static
   */
  static async #processDescribeFeatureJson(url: string, layerConfig: VectorLayerEntryConfig, abortSignal?: AbortSignal): Promise<void> {
    // Fetch
    const featureProps = await WFS.fetchDescribeFeatureJson(url, abortSignal);

    // Set it
    layerConfig.setLayerMetadata(featureProps);
    WFS.#processFeatureInfoConfig(featureProps, layerConfig as OgcWfsLayerEntryConfig);
  }

  /**
   * Fetches a WFS DescribeFeatureType XML, converts it to JSON, and updates the layer metadata configuration
   * with the parsed feature type properties.
   * @param {string} url - The full URL to the DescribeFeatureType request for the layer.
   * @param {VectorLayerEntryConfig} layerConfig - The layer configuration object to populate with metadata.
   * @param {AbortSignal} [abortSignal] - Optional abort signal to cancel the fetch request.
   * @returns {Promise<void>} Resolves once the layer metadata has been processed and feature info configuration updated.
   * @private
   * @static
   */
  static async #processDescribeFeatureXml(url: string, layerConfig: VectorLayerEntryConfig, abortSignal?: AbortSignal): Promise<void> {
    // Fetch
    const featureProps = await WFS.fetchDescribeFeatureXML(url, abortSignal);

    // Set it
    layerConfig.setLayerMetadata(featureProps);
    WFS.#processFeatureInfoConfig(featureProps, layerConfig as OgcWfsLayerEntryConfig);
  }

  /**
   * This method sets the outfields and aliasFields of the source feature info.
   *
   * @param {TypeOutfields[]} fields An array of field names and its aliases.
   * @param {VectorLayerEntryConfig} layerConfig The vector layer entry to configure.
   * @private
   * @static
   */
  static #processFeatureInfoConfig(fields: TypeOutfields[], layerConfig: OgcWfsLayerEntryConfig): void {
    // Get the outfields
    let outfields = layerConfig.getOutfields();

    // Process undefined outfields or aliasFields
    if (!outfields?.length) {
      // Create it
      outfields = [];

      // For each field
      fields.forEach((fieldEntry) => {
        // If field entry is gml geometry type
        if (this.isGmlGeometryField(fieldEntry)) {
          // Keep the geometry field for future use
          layerConfig.setGeometryField(fieldEntry);

          // Skip that geometry field
          return;
        }

        const newOutfield: TypeOutfields = {
          name: fieldEntry.name,
          alias: fieldEntry.alias ?? fieldEntry.name,
          type: WFS.getFieldType(fieldEntry.name, layerConfig),
          domain: null,
        };

        outfields!.push(newOutfield);
      });

      // Set it
      layerConfig.setOutfields(outfields);
    }

    // Set the name field to the first attribute by default if no nameField is specified already
    layerConfig.initNameField(outfields?.[0]?.name);
  }

  /**
   * Determines the simplified data type of a specified field from a WFS layer configuration.
   * Extracts the field definition from the layer’s metadata, interprets its WFS type
   * (e.g., `xsd:int`, `xsd:date`), and maps it to a normalized internal type
   * (`'string'`, `'number'`, or `'date'`).
   * @param {string} fieldName - The name of the field whose type should be retrieved.
   * @param {OgcWfsLayerEntryConfig} layerConfig - The WFS layer configuration containing metadata definitions.
   * @returns {TypeOutfieldsType} The normalized field type (`'string'`, `'number'`, or `'date'`).
   * @static
   */
  static getFieldType(fieldName: string, layerConfig: OgcWfsLayerEntryConfig): TypeOutfieldsType {
    const fieldDefinitions = layerConfig.getLayerMetadata();
    const fieldDefinition = fieldDefinitions?.find((metadataEntry) => metadataEntry.name === fieldName);
    if (!fieldDefinition) return 'string';

    // GV Special case for CDTK features the pk_lyr_id is the equivalent of the OBJECTID, treat it as such
    if (fieldDefinition.name === 'pk_lyr_id') return 'oid';

    const fieldEntryType = fieldDefinition.type.split(':').slice(-1)[0];
    if (fieldEntryType === 'date') return 'date';
    if (['int', 'integer', 'number', 'decimal', 'long', 'short', 'float', 'double'].includes(fieldEntryType)) return 'number';

    // Default: string
    return 'string';
  }

  /**
   * Determines whether a given WFS feature type field represents a geometry property.
   * Checks if the field's type string starts with the `"gml:"` prefix, which indicates
   * a GML geometry type such as `gml:PointPropertyType`, `gml:PolygonPropertyType`, etc.
   * @param {TypeOutfields} field - The feature type field definition to evaluate.
   * @returns {boolean} `true` if the field is a geometry field; otherwise, `false`.
   * @static
   */
  static isGmlGeometryField(field: TypeOutfields): boolean {
    return field.type.startsWith('gml:');
  }

  /**
   * Creates a configuration object for an WFS Feature layer.
   * This function constructs a `TypeWFSLayerConfig` object that describes an WFS Feature layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata or feature data.
   * @param {boolean | undefined} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {VectorStrategy} strategy - Indicates the strategy to use to fetch vector data.
   * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
   * @returns {TypeWFSLayerConfig} The constructed configuration object for the WFS Feature layer.
   * @static
   */
  static createGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean | undefined,
    strategy: VectorStrategy,
    layerEntries: TypeLayerEntryShell[] // TODO: ALEX: Change this (and in all siblings) to receive a OgcWfsLayerEntryConfigProps[]
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
      const props = {
        geoviewLayerConfig,
        layerId: `${layerEntry.id}`,
        layerName: layerEntry.layerName || geoviewLayerName || `${layerEntry.id}`,
        source: {
          strategy,
        },
      } as unknown as TypeLayerEntryShell;

      if (layerEntry.wmsLayerId) props.wmsLayerId = layerEntry.wmsLayerId;
      const layerEntryConfig = new OgcWfsLayerEntryConfig(props as OgcWfsLayerEntryConfigProps);
      return layerEntryConfig;
    });

    // Return it
    return geoviewLayerConfig;
  }

  /**
   * Processes a WFS (Web Feature Service) GeoviewLayerConfig and returns a promise
   * that resolves to an array of `ConfigBaseClass` layer entry configurations.
   *
   * This method:
   * 1. Creates a Geoview layer configuration using the provided parameters.
   * 2. Instantiates a layer with that configuration.
   * 3. Processes the layer configuration and returns the result.
   * @param {string} geoviewLayerId - The unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name for the GeoView layer.
   * @param {string} url - The URL of the service endpoint.
   * @param {string[]} layerIds - An array of layer IDs to include in the configuration.
   * @param {boolean} isTimeAware - Indicates if the layer is time aware.
   * @returns {Promise<ConfigBaseClass[]>} A promise that resolves to an array of layer configurations.
   * @static
   */
  static processGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    url: string,
    layerIds: string[],
    isTimeAware: boolean,
    vectorStrategy: VectorStrategy,
    fetchStylesOnWMS: boolean,
    callbackCreateLayerEntryConfig?: (wfsEntry: TypeLayerEntryShell) => TypeLayerEntryShell // TODO: ALEX: Review this to simplify it (linked to the TODO about changing the last param of the all the createGeoviewLayerConfig functions)
  ): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = WFS.createGeoviewLayerConfig(
      geoviewLayerId,
      geoviewLayerName,
      url,
      isTimeAware,
      vectorStrategy,
      layerIds.map((layerId) => {
        // Create the entry config
        let entryConfig = { id: layerId } as TypeLayerEntryShell;

        // Callback in case we want to tweak the config
        if (callbackCreateLayerEntryConfig) {
          entryConfig = callbackCreateLayerEntryConfig(entryConfig);
        }

        // Return the entry config
        return entryConfig;
      })
    );

    // If not fetching styles on the WMS
    if (!fetchStylesOnWMS) {
      layerConfig.fetchStylesOnWMS = false;
    }

    // Create the class from geoview-layers package
    const myLayer = new WFS(layerConfig);

    // Process it
    return AbstractGeoViewVector.processConfig(myLayer);
  }

  /**
   * Attempts to derive and apply styling information to a WFS layer using corresponding WMS styles.
   * This method:
   *  - Checks whether the layer has no defined style and is configured to fetch styles from WMS.
   *  - Determines the WMS layer identifier associated with the WFS layer.
   *  - Attempts to infer the geometry type from metadata (non-fatal if it fails).
   *  - Converts the WFS service URL into its WMS equivalent (commonly `cgi-bin/wfs` → `cgi-bin/wms`).
   *  - Requests dynamic styles from the WMS service via `GetStyles`.
   *  - Applies the generated style back onto the WFS layer if successful.
   * Any failures during the process are logged as warnings but do not throw.
   * @param {OgcWfsLayerEntryConfig} layerConfig
   *   The WFS layer configuration for which styling should be processed.
   * @returns {Promise<void>} Resolves once styling processing attempts are complete.
   * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
   * @description
   * Enables a WFS layer to adopt styling derived from a corresponding WMS service, allowing
   * consistent symbology between raster and vector representations when the server supports
   * style retrieval through WMS `GetStyles`.
   * @private
   * @static
   * @async
   */
  static async #tryProcessLayerStylingInformationIfAny(
    layerConfig: OgcWfsLayerEntryConfig
  ): Promise<Record<TypeStyleGeometry, TypeLayerStyleSettings> | undefined> {
    // If should fetch styles from the WMS (default)
    if (layerConfig.getShouldFetchStylesFromWMS()) {
      try {
        // Get the layer id equivalent for the WMS
        const wmsLayerId = layerConfig.getWmsStylesLayerId();

        // Tweak the url, all the time, typical wms/wfs url
        const tweakedUrl = layerConfig.getDataAccessPath().replaceAll('cgi-bin/wfs', 'cgi-bin/wms');

        // Create the layer style and return
        return await WMS.createStylesFromWMS(tweakedUrl, wmsLayerId, layerConfig.getGeometryType());
      } catch (error: unknown) {
        // Log warning
        logger.logWarning(`Failed to create a dynamic layer style for the WFS using the WMS styles for ${layerConfig.layerPath}`, error);
      }
    }

    // None
    return undefined;
  }

  // #endregion STATIC METHODS
}
