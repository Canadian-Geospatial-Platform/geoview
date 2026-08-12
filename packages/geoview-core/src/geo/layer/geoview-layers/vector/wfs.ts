import type { Feature } from 'ol';
import type { ReadOptions } from 'ol/format/Feature';
import type { Options as SourceOptions } from 'ol/source/Vector';
import type { Projection as OLProjection } from 'ol/proj';
import { bbox } from 'ol/loadingstrategy';

import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { WMS } from '@/geo/layer/geoview-layers/raster/wms';
import type {
  DisplayDateMode,
  TypeLayerStyleSettings,
  TypeOutfields,
  TypeOutfieldsType,
  TypeStyleGeometry,
} from '@/api/types/map-schema-types';
import type {
  TypeGeoviewLayerConfig,
  TypePostSettings,
  TypeMetadataWFSCapabilities,
  TypeMetadataWFSOperationMetadataOperationParameter,
  TypeMetadataWFSOperationMetadataOperationParameterValue,
  TypeMetadataWFSTextOnly,
  VectorStrategy,
} from '@/api/types/layer-schema-types';
import {
  CONST_LAYER_TYPES,
  MIME_TYPE_FORMAT_JSON,
  MIME_TYPE_FORMAT_GML_XML_32,
  MIME_TYPE_FORMAT_TEXT_XML_GML_321,
  MIME_TYPE_FORMAT_TEXT_XML_GML_311,
  MIME_TYPE_FORMAT_TEXT_XML_GML_212,
  MIME_TYPE_FORMAT_TEXT_XML,
} from '@/api/types/layer-schema-types';
import {
  OgcWfsLayerEntryConfig,
  type OgcWfsLayerEntryConfigProps,
} from '@/api/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import type { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import {
  LayerInvalidFeatureInfoFormatWFSError,
  LayerNoCapabilitiesError,
  LayerServiceMetadataUnableToFetchError,
} from '@/core/exceptions/layer-exceptions';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { parseXMLToJson } from '@/core/utils/utilities';
import { Fetch } from '@/core/utils/fetch-helper';
import { GVWFS } from '@/geo/layer/gv-layers/vector/gv-wfs';
import { formatError, ResponseEmptyError } from '@/core/exceptions/core-exceptions';
import { GeoUtilities, type FetchWithProxyResult, type SourceFeaturesInfo } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { logger } from '@/core/utils/logger';
import { ServicesManagement } from '@/geo/utils/services-management';

export interface TypeWFSLayerConfig extends Omit<TypeGeoviewLayerConfig, 'geoviewLayerType'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.WFS;
  fetchStylesOnWMS?: boolean;
  listOfLayerEntryConfig: OgcWfsLayerEntryConfig[];
}

/**
 * A class to add WFS layer.
 */
export class WFS extends AbstractGeoViewVector {
  /**
   * Constructs a WFS Layer configuration processor.
   *
   * @param layerConfig - The layer configuration
   */
  // The constructor is not useless, it narrows down the accepted parameter type.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(layerConfig: TypeWFSLayerConfig) {
    super(layerConfig);
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed layer configuration specific to this layer
   */
  override getGeoviewLayerConfig(): TypeWFSLayerConfig {
    return super.getGeoviewLayerConfig() as TypeWFSLayerConfig;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed metadata specific to this layer
   */
  override getMetadata(): TypeMetadataWFSCapabilities | undefined {
    return super.getMetadata() as TypeMetadataWFSCapabilities | undefined;
  }

  /**
   * Overrides the way the metadata is fetched.
   *
   * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
   * @returns A promise that resolves with the fetched metadata and proxy information
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error
   * @throws {LayerNoCapabilitiesError} When the metadata is empty (no Capabilities)
   */
  protected override async onFetchServiceMetadata(abortSignal?: AbortSignal): Promise<FetchWithProxyResult<unknown>> {
    try {
      // Fetch it and return
      return await WFS.fetchMetadata(this.getMetadataAccessPath(), this.getConfigProxyUrl(), abortSignal);
    } catch (error: unknown) {
      // If empty response
      if (error instanceof ResponseEmptyError) {
        // Throw no capabilities response
        throw new LayerNoCapabilitiesError(this.getGeoviewLayerId(), this.getLayerEntryNameOrGeoviewLayerName());
      }

      // Throw standard
      throw new LayerServiceMetadataUnableToFetchError(
        this.getGeoviewLayerId(),
        this.getLayerEntryNameOrGeoviewLayerName(),
        formatError(error)
      );
    }
  }

  /**
   * Overrides the way a geoview layer config initializes its layer entries.
   *
   * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
   * @returns A promise that resolves once the layer entries have been initialized
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error
   * @throws {LayerNoCapabilitiesError} When the metadata is empty (no Capabilities)
   */
  protected override async onInitLayerEntries(abortSignal?: AbortSignal): Promise<TypeGeoviewLayerConfig> {
    // Calls fetchServiceMetadata which delegates to this class's overridden onFetchServiceMetadata (may use a proxy fallback and store the proxyUrl on the instance)
    const rootUrl = this.getMetadataAccessPath();
    const fetchResult = await this.fetchServiceMetadata<TypeMetadataWFSCapabilities>(abortSignal);

    // The entries
    let entries: TypeLayerEntryShell[] = [];

    // If any
    if (fetchResult.data.FeatureTypeList?.FeatureType) {
      // Now that we have metadata, get the layer ids from it
      if (!Array.isArray(fetchResult.data.FeatureTypeList?.FeatureType))
        fetchResult.data.FeatureTypeList.FeatureType = [fetchResult.data.FeatureTypeList?.FeatureType];

      const metadataLayerList = fetchResult?.data.FeatureTypeList.FeatureType;
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
   *
   * @param layerConfig - The layer entry config to validate
   */
  protected override onValidateLayerEntryConfig(layerConfig: ConfigBaseClass): void {
    // Note that the code assumes wfs feature type list does not contains metadata layer group. If you need layer group,
    // you can define them in the configuration section.
    // when there is only one layer, it is not an array but an object

    try {
      // Try to get the feature type
      const layerConfigCasted = layerConfig as OgcWfsLayerEntryConfig;
      const featureType = layerConfigCasted.getFeatureType();

      // Check the title from the metadata
      let foundTitle = featureType.Title as string;
      if (typeof featureType.Title === 'object' && '#text' in featureType.Title) foundTitle = featureType.Title['#text'];

      // Initialize the layer name by filling the blanks with the name from the metadata
      layerConfig.initLayerNameFromMetadata(foundTitle);

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
   *
   * @param layerConfig - The layer entry configuration to process
   * @param displayDateMode - The display date mode to use for processing time dimensions in the metadata
   * @param mapProjection - Optional map projection
   * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
   * @returns A promise that resolves once the layer entry configuration has gotten its metadata processed
   * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called
   */
  protected override async onProcessLayerMetadata(
    layerConfig: VectorLayerEntryConfig,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    displayDateMode: DisplayDateMode,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mapProjection?: OLProjection,
    abortSignal?: AbortSignal
  ): Promise<VectorLayerEntryConfig> {
    // Cast it
    const layerConfigWFS = layerConfig as OgcWfsLayerEntryConfig;

    // Build url
    let outputFormat = WFS.extractDescribeFeatureOutputFormat(this.getMetadata()!);

    // TODO: CHECK IMPORTANT - Why is it better to call DescribeFeatureType without outputFormat!?
    outputFormat = '';

    // Get the version
    const version = layerConfigWFS.getVersionOrDefault();

    // Fetch and parse the DescribeFeatureType response

    // Build the DescribeFeatureType URL
    let describeFeatureUrl = GeoUtilities.ensureServiceRequestUrlDescribeFeatureType(
      layerConfigWFS.getDataAccessPath(),
      layerConfigWFS.layerId,
      version,
      outputFormat
    );

    // Tweak url with the proxy if necessary
    describeFeatureUrl = layerConfigWFS.getUrlWithProxyWhenNeeded(describeFeatureUrl);

    // Fetch the service for DescribeFeatureType
    const responseText = await Fetch.fetchText(describeFeatureUrl, { signal: abortSignal });

    // Parse the response to read the out fields
    const featureProps = WFS.#parseResponseForOutfields(responseText, outputFormat);

    // Set it
    WFS.initLayerMetadata(layerConfigWFS, featureProps);

    // Try
    const layerStyle = await WFS.#tryProcessLayerStylingInformationIfAny(layerConfigWFS);

    // Initialize the layer style by filling the blanks with the information from the metadata
    layerConfigWFS.initLayerStyleFromMetadata(layerStyle);

    // Return the layer config
    return layerConfigWFS;
  }

  /**
   * Overrides the loading of the vector features for the layer by fetching WFS data and converting it
   * into OpenLayers {@link Feature} feature instances.
   *
   * @param layerConfig - The configuration object for the vector layer, containing source and data access information
   * @param sourceOptions - The OpenLayers vector source options associated with the layer
   * @param readOptions - Options controlling how features are read, including the target `featureProjection`
   * @returns A promise that resolves to an array of OpenLayers features
   */
  protected override onCreateVectorSourceLoadFeatures(
    layerConfig: VectorLayerEntryConfig,
    sourceOptions: SourceOptions<Feature>,
    readOptions: ReadOptions
  ): Promise<SourceFeaturesInfo> {
    // Cast it to proper type
    const layerConfigWFS = layerConfig as OgcWfsLayerEntryConfig;

    // Build the bbox extent string if the strategy is bbox and the extent is valid
    let bboxExtent: string | undefined;
    if (sourceOptions.strategy === bbox && Number.isFinite(readOptions.extent?.[0])) {
      bboxExtent = `${readOptions.extent},${Projection.getProjectionFromStringOrNumber(readOptions.featureProjection)?.getCode()}`;
    }

    // Get the version and post settings
    const version = layerConfigWFS.getVersionOrDefault();
    const { postSettings } = layerConfigWFS.getSource();

    // Delegate to the generic fallback with the standard WFS parse functions
    return WFS.fetchWithFormatFallback(
      layerConfigWFS,
      (url) => WFS.#fetchAndParseWFSFeaturesJSON(url, version, postSettings, readOptions.dataProjection, readOptions.featureProjection),
      (url) => WFS.#fetchAndParseWFSFeaturesText(url, version, postSettings, readOptions.dataProjection, readOptions.featureProjection),
      bboxExtent
    );
  }

  /**
   * Overrides the creation of the GV Layer.
   *
   * @param layerConfig - The layer entry configuration
   * @returns The GV Layer
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
   * Creates a configuration object for an WFS Feature layer.
   *
   * This function constructs a `TypeWFSLayerConfig` object that describes an WFS Feature layer
   * and its associated entry configurations based on the provided parameters.
   *
   * @param geoviewLayerId - A unique identifier for the GeoView layer
   * @param geoviewLayerName - The display name of the GeoView layer
   * @param metadataAccessPath - The full service URL to the layer endpoint
   * @param isTimeAware - Indicates whether the layer supports time-based filtering
   * @param strategy - Indicates the strategy to use to fetch vector data
   * @param layerEntries - An array of layer entries objects to be included in the configuration
   * @returns The constructed configuration object for the WFS Feature layer
   */
  static createGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string | undefined,
    metadataAccessPath: string,
    isTimeAware: boolean | undefined,
    strategy: VectorStrategy,
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
      const props = {
        geoviewLayerConfig,
        layerId: `${layerEntry.id}`,
        ...(layerEntry.layerName && { layerName: `${layerEntry.layerName}` }),
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
   * Initializes a GeoView layer configuration for a WFS layer.
   *
   * This method creates a basic TypeGeoviewLayerConfig using the provided
   * ID, name, and metadata access path URL. It then initializes the layer entries by calling
   * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
   *
   * @param geoviewLayerId - A unique identifier for the layer
   * @param geoviewLayerName - The display name of the layer
   * @param metadataAccessPath - The full service URL to the layer endpoint
   * @param isTimeAware - Optional to indicates whether the layer supports time-based filtering
   * @returns A promise that resolves to an initialized GeoView layer configuration with layer entries
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
   * Initializes the layer metadata for a WFS layer entry configuration based on the provided feature type properties.
   *
   * This method processes the list of feature type properties obtained from a DescribeFeatureType response, identifies geometry fields,
   * and sets the appropriate metadata on the layer configuration.
   *
   * @param layerConfig - The vector layer entry to configure
   * @param fields - An array of field names and its aliases
   */
  static initLayerMetadata(layerConfig: OgcWfsLayerEntryConfig, fields: TypeOutfields[] | undefined): void {
    // When no fields, skip
    if (!fields) return;

    // The the layer metadata
    layerConfig.setLayerMetadata(fields);

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
        };

        outfields!.push(newOutfield);
      });

      // Set it
      layerConfig.setOutfields(outfields);
    }
  }

  /**
   * Processes a WFS (Web Feature Service) GeoviewLayerConfig and returns a promise
   * that resolves to an array of `ConfigBaseClass` layer entry configurations.
   *
   * This method:
   * 1. Creates a Geoview layer configuration using the provided parameters.
   * 2. Instantiates a layer with that configuration.
   * 3. Processes the layer configuration and returns the result.
   *
   * @param geoviewLayerId - The unique identifier for the GeoView layer
   * @param geoviewLayerName - The display name for the GeoView layer
   * @param url - The URL of the service endpoint
   * @param configProxyUrl - Proxy URL to use when necessary
   * @param layerEntries - An array of layer entry shells to include in the configuration
   * @param isTimeAware - Indicates if the layer is time aware
   * @param vectorStrategy - The strategy to use for fetching vector data
   * @param fetchStylesOnWMS - Indicates whether to fetch styles from WMS
   * @returns A promise that resolves to an array of layer configurations
   */
  static processGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    url: string,
    configProxyUrl: string | undefined,
    layerEntries: TypeLayerEntryShell[],
    isTimeAware: boolean,
    vectorStrategy: VectorStrategy,
    fetchStylesOnWMS: boolean
  ): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = WFS.createGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, url, isTimeAware, vectorStrategy, layerEntries);

    // Keep track if fetching styles on the WMS
    layerConfig.fetchStylesOnWMS = fetchStylesOnWMS;

    // Create the class from geoview-layers package
    const myLayer = new WFS(layerConfig);

    // Set the config proxy url, if any in case the layer needs a proxy during processing
    myLayer.setConfigProxyUrl(configProxyUrl);

    // Process it
    return AbstractGeoViewVector.processConfig(myLayer);
  }

  /**
   * Extracts the preferred output format value for a WFS DescribeFeatureType operation
   * from the parsed WFS capabilities metadata.
   *
   * The method navigates through the `ows:OperationsMetadata` section of the capabilities
   * document to locate the `"DescribeFeatureType"` operation and returns the first available
   * output format value.
   *
   * @param metadata - The parsed WFS capabilities metadata object
   * @returns The detected output format string for the DescribeFeatureType operation, or an empty string if no suitable value is found
   */
  static extractDescribeFeatureOutputFormat(metadata: TypeMetadataWFSCapabilities): string {
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
   * Fetches the metadata for a typical WFS class.
   *
   * @param url - The url to query the metadata from
   * @param configProxyUrl - Proxy URL to use when necessary
   * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
   * @returns A promise that resolves with the parsed WFS metadata and proxy information
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal
   * @throws {ResponseError} When the response is not OK (non-2xx)
   * @throws {ResponseEmptyError} When the JSON response is empty
   * @throws {NetworkError} When a network issue happened
   */
  static fetchMetadata(
    url: string,
    configProxyUrl: string | undefined,
    abortSignal?: AbortSignal
  ): Promise<FetchWithProxyResult<TypeMetadataWFSCapabilities>> {
    // Redirect
    return GeoUtilities.getWFSServiceMetadata(url, configProxyUrl, abortSignal);
  }

  /**
   * Determines whether a given WFS feature type field represents a geometry property.
   *
   * Checks if the field's type string starts with the `"gml:"` prefix, which indicates
   * a GML geometry type such as `gml:PointPropertyType`, `gml:PolygonPropertyType`, etc.
   *
   * @param field - The feature type field definition to evaluate
   * @returns `true` if the field is a geometry field; otherwise, `false`
   */
  static isGmlGeometryField(field: TypeOutfields): boolean {
    return field.type.startsWith('gml:');
  }

  /**
   * Determines the simplified data type of a specified field from a WFS layer configuration.
   *
   * Extracts the field definition from the layer's metadata, interprets its WFS type
   * (e.g., `xsd:int`, `xsd:date`), and maps it to a normalized internal type
   * (`'string'`, `'number'`, `'date'`, or `'dateTime'`).
   *
   * @param fieldName - The name of the field whose type should be retrieved
   * @param layerConfig - The WFS layer configuration containing metadata definitions
   * @returns The normalized field type (`'string'`, `'number'`, `'date'`, or `'dateTime'`)
   */
  static getFieldType(fieldName: string, layerConfig: OgcWfsLayerEntryConfig): TypeOutfieldsType {
    const fieldDefinitions = layerConfig.getLayerMetadata();
    const fieldDefinition = fieldDefinitions?.find((metadataEntry) => metadataEntry.name === fieldName);
    if (!fieldDefinition) return 'string';

    // GV Special case for CDTK features the pk_lyr_id is the equivalent of the OBJECTID, treat it as such
    if (fieldDefinition.name === 'pk_lyr_id') return 'oid';

    const fieldEntryType = fieldDefinition.type.split(':').slice(-1)[0];
    if (fieldEntryType === 'date') return 'date';
    if (fieldEntryType === 'dateTime') return 'date';
    if (['int', 'integer', 'number', 'decimal', 'long', 'short', 'float', 'double'].includes(fieldEntryType)) return 'number';

    // Default: string
    return 'string';
  }

  /**
   * Generic format fallback strategy: tries the preferred format first, then falls back to no specific format.
   * Accepts custom parse functions so callers can plug in their own fetch+parse pipeline.
   *
   * @param layerConfig - The WFS layer entry configuration
   * @param parseFnJSON - A function that receives a URL and parses the response as JSON
   * @param parseFnFallback - A function that receives a URL and parses the response as text (used when JSON format is unavailable or fails)
   * @param bboxExtent - Optional bbox extent string (e.g., 'minx,miny,maxx,maxy,EPSG:3978')
   * @param outfields - Optional list of fields to return (propertyName parameter)
   * @param filter - Optional OGC XML filter string
   * @param srsName - Optional output projection code (e.g., 'EPSG:3857')
   * @returns A promise that resolves with the result of the parse function
   * @throws {LayerInvalidFeatureInfoFormatWFSError} When no format produces usable results
   */
  static async fetchWithFormatFallback<T>(
    layerConfig: OgcWfsLayerEntryConfig,
    queryFnJSON: (url: string) => Promise<T>,
    queryFnFallback: (url: string) => Promise<T>,
    bboxExtent?: string,
    outfields?: TypeOutfields[],
    filter?: string,
    srsName?: string
  ): Promise<T> {
    const supportedFormats = WFS.#resolveSupportedFormats(layerConfig);

    // Ordered list of formats to try, from most preferred to least preferred.
    // Each entry maps a MIME type to the parse function to use for that format.
    const formatCandidates: { format: string; queryFn: (url: string) => Promise<T> }[] = [
      { format: MIME_TYPE_FORMAT_JSON, queryFn: queryFnJSON },
      { format: MIME_TYPE_FORMAT_GML_XML_32, queryFn: queryFnFallback },
      { format: MIME_TYPE_FORMAT_TEXT_XML_GML_321, queryFn: queryFnFallback },
      { format: MIME_TYPE_FORMAT_TEXT_XML_GML_311, queryFn: queryFnFallback },
      { format: MIME_TYPE_FORMAT_TEXT_XML_GML_212, queryFn: queryFnFallback },
      { format: MIME_TYPE_FORMAT_TEXT_XML, queryFn: queryFnFallback },
    ];

    // Try each format candidate in order
    let result: T | undefined;
    for (const candidate of formatCandidates) {
      // Check if the service supports this format
      const matchingFormats = WFS.#supportedFormatsInclude(supportedFormats, candidate.format);
      if (matchingFormats.length) {
        try {
          // Build the GetFeatureUrl with the candidate format and other parameters
          const url = WFS.#buildGetFeatureUrl(layerConfig, matchingFormats[0], bboxExtent, outfields, filter, srsName);

          // GV Here, we do want to await in the loop, because we want to know if the fetch/parse succeeded before looping to the next format request.
          // eslint-disable-next-line no-await-in-loop
          result = await candidate.queryFn(url);

          // If the fetch/parse succeeded, return right away
          if (result) return result;
        } catch (error: unknown) {
          // Throw on abort to skip remaining format attempts
          GeoViewError.throwIfAborted(error);
        }
      }
    }

    // Final fallback: try with no specific outputFormat
    if (!result) {
      try {
        const url = WFS.#buildGetFeatureUrl(layerConfig, '', bboxExtent, outfields, filter, srsName);
        result = await queryFnFallback(url);
      } catch (error: unknown) {
        // Throw on abort to skip
        GeoViewError.throwIfAborted(error);
      }
    }

    // If result was retrieved
    if (result) return result;

    // Failed
    throw new LayerInvalidFeatureInfoFormatWFSError(layerConfig.layerPath, supportedFormats, layerConfig.getLayerNameCascade());
  }

  // #endregion STATIC PUBLIC METHODS

  // #region STATIC PRIVATE METHODS

  /**
   * Fetches WFS features as JSON and parses the response into OpenLayers features.
   *
   * @param url - The WFS GetFeature request URL
   * @param version - The WFS version string (e.g., '1.1.0', '2.0.0')
   * @param postSettings - Optional POST settings for the request
   * @param dataProjection - Optional data projection for feature reading
   * @param featureProjection - Optional feature projection for reprojection
   * @returns A promise that resolves to source features info
   */
  static async #fetchAndParseWFSFeaturesJSON(
    url: string,
    version: string,
    postSettings?: TypePostSettings,
    dataProjection?: string | OLProjection,
    featureProjection?: string | OLProjection
  ): Promise<SourceFeaturesInfo> {
    // Fetch as JSON
    const responseData = await AbstractGeoViewVector.fetchJson(url, postSettings);

    // Parse the response
    return WFS.#parseWFSResponseData(responseData, version, dataProjection, featureProjection);
  }

  /**
   * Fetches WFS features as text and parses the response into OpenLayers features.
   *
   * @param url - The WFS GetFeature request URL
   * @param version - The WFS version string (e.g., '1.1.0', '2.0.0')
   * @param postSettings - Optional POST settings for the request
   * @param dataProjection - Optional data projection for feature reading
   * @param featureProjection - Optional feature projection for reprojection
   * @returns A promise that resolves to source features info
   */
  static async #fetchAndParseWFSFeaturesText(
    url: string,
    version: string,
    postSettings?: TypePostSettings,
    dataProjection?: string | OLProjection,
    featureProjection?: string | OLProjection
  ): Promise<SourceFeaturesInfo> {
    // Fetch as text
    const responseData = await AbstractGeoViewVector.fetchText(url, postSettings);

    // Parse the response
    return WFS.#parseWFSResponseData(responseData, version, dataProjection, featureProjection);
  }

  /**
   * Parses WFS response data into OpenLayers features, detecting GeoJSON vs XML/GML automatically.
   *
   * @param responseData - The fetched response data (JSON object or text string)
   * @param version - The WFS version string (e.g., '1.1.0', '2.0.0')
   * @param dataProjection - Optional data projection for feature reading
   * @param featureProjection - Optional feature projection for reprojection
   * @returns Source features info
   */
  static #parseWFSResponseData(
    responseData: unknown,
    version: string,
    dataProjection?: string | OLProjection,
    featureProjection?: string | OLProjection
  ): Promise<SourceFeaturesInfo> {
    // Check if the data is GeoJSON
    if (GeoUtilities.isGeoJSONObject(responseData)) {
      return GeoUtilities.readFeaturesFromGeoJSON(responseData, dataProjection, featureProjection);
    }

    // Here, the output isn't GeoJSON, probably XML/GML
    return GeoUtilities.readFeaturesFromWFS(responseData, version, dataProjection, featureProjection);
  }

  /**
   * Parses a DescribeFeatureType response text into an array of field definitions.
   *
   * @param responseText - The raw response text from the DescribeFeatureType request
   * @param outputFormat - The output format used for the request (determines JSON vs XML parsing)
   * @returns The parsed array of field definitions
   */
  static #parseResponseForOutfields(responseText: string, outputFormat: string): TypeOutfields[] {
    // Parse based on output format
    if (outputFormat === MIME_TYPE_FORMAT_JSON) {
      const parsed = JSON.parse(responseText);
      return parsed.featureTypes?.[0]?.properties || [];
    }

    // XML format — parse the schema
    const xmlJson = parseXMLToJson<Record<string, unknown>>(responseText);
    const prefix = Object.keys(xmlJson)[0].includes('xsd:') ? 'xsd:' : '';

    const xmlJsonSchema = xmlJson[`${prefix}schema`] as Record<string, unknown>;
    const xmlJsonSchemaComplexType = xmlJsonSchema?.[`${prefix}complexType`] as Record<string, unknown>;

    const elements =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (xmlJsonSchemaComplexType as any)?.[`${prefix}complexContent`]?.[`${prefix}extension`]?.[`${prefix}sequence`]?.[`${prefix}element`] ??
      [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return elements.map((el: any) => el['@attributes']) as TypeOutfields[];
  }

  /**
   * Resolves the preferred output format for a WFS layer by checking the layer's supported formats
   * and validating them against known service issues via ServicesManagement.
   *
   * @param layerConfig - The WFS layer entry configuration
   * @returns The supported output format strings, or an empty array if none are supported
   */
  static #resolveSupportedFormats(layerConfig: OgcWfsLayerEntryConfig): string[] {
    // Get the supported info formats from metadata (defaults to preferredFormat if metadata is absent)
    const formats = layerConfig.getSupportedFormats(MIME_TYPE_FORMAT_JSON);

    // Check with the services management if the service does in fact handle the output format or if it's a known issue
    return ServicesManagement.checkWFSOutputFormats(layerConfig.getDataAccessPath(), formats);
  }

  /**
   * Filters the supported formats to those that include the specified format substring (case-insensitive).
   *
   * @param supportedFormats - The list of supported MIME type format strings
   * @param formatToCheck - The format substring to match against (e.g., 'application/json')
   * @returns The subset of supported formats that contain the format substring
   */
  static #supportedFormatsInclude(supportedFormats: string[], formatToCheck: string): string[] {
    // Return if the format to check is included in the list of supported formats.
    // This supports when the supported format is e.g.: "application/json; subtype=geojson" and formatToCheck is application/json
    return supportedFormats.filter((format) => format.toLowerCase().includes(formatToCheck.toLowerCase()));
  }

  /**
   * Builds a WFS GetFeature URL for the given layer config and output format.
   *
   * @param layerConfig - The WFS layer entry configuration
   * @param outputFormat - The output format to use (empty string for no specific format)
   * @param bboxExtent - Optional bbox extent string (e.g., 'minx,miny,maxx,maxy,EPSG:3978')
   * @param outfields - Optional list of fields to return (propertyName parameter)
   * @param filter - Optional OGC XML filter string
   * @param srsName - Optional output projection code (e.g., 'EPSG:3857')
   * @returns The constructed GetFeature URL
   */
  static #buildGetFeatureUrl(
    layerConfig: OgcWfsLayerEntryConfig,
    outputFormat: string,
    bboxExtent?: string,
    outfields?: TypeOutfields[],
    filter?: string,
    srsName?: string
  ): string {
    // Work the url for a GetFeature request
    let url = GeoUtilities.ensureServiceRequestUrlGetFeature(
      layerConfig.getDataAccessPath(),
      layerConfig.layerId,
      layerConfig.getVersionOrDefault(),
      outputFormat,
      outfields,
      filter,
      srsName
    );

    // If an extent is provided, append bbox
    if (bboxExtent) {
      url = `${url}&bbox=${bboxExtent}`;
    }

    // Tweak url with the proxy if necessary
    url = layerConfig.getUrlWithProxyWhenNeeded(url);

    // Return the url
    return url;
  }

  /**
   * Attempts to derive and apply styling information to a WFS layer using corresponding WMS styles.
   *
   * This method:
   *  - Checks whether the layer has no defined style and is configured to fetch styles from WMS.
   *  - Determines the WMS layer identifier associated with the WFS layer.
   *  - Attempts to infer the geometry type from metadata (non-fatal if it fails).
   *  - Converts the WFS service URL into its WMS equivalent (commonly `cgi-bin/wfs` -> `cgi-bin/wms`).
   *  - Requests dynamic styles from the WMS service via `GetStyles`.
   *  - Applies the generated style back onto the WFS layer if successful.
   * Any failures during the process are logged as warnings but do not throw.
   *
   * Enables a WFS layer to adopt styling derived from a corresponding WMS service, allowing
   * consistent symbology between raster and vector representations when the server supports
   * style retrieval through WMS `GetStyles`.
   *
   * @param layerConfig - The WFS layer configuration for which styling should be processed
   * @returns A promise that resolves with the layer style settings or undefined
   * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called
   */
  static async #tryProcessLayerStylingInformationIfAny(
    layerConfig: OgcWfsLayerEntryConfig
  ): Promise<Record<TypeStyleGeometry, TypeLayerStyleSettings> | undefined> {
    // If should fetch styles from the WMS (default)
    if (layerConfig.getShouldFetchStylesFromWMS()) {
      try {
        // Get the layer id equivalent for the WMS
        const wmsLayerId = layerConfig.getWmsStylesLayerId();

        // Tweak url when switching from WFS to WMS
        let tweakedUrl = ServicesManagement.checkUrlSwitchWFSToWMS(layerConfig.getDataAccessPath());

        // Make sure the URL has necessary information
        tweakedUrl = GeoUtilities.ensureServiceRequestUrlGetStyles(tweakedUrl, wmsLayerId);

        // Tweak url with the proxy if necessary
        tweakedUrl = layerConfig.getUrlWithProxyWhenNeeded(tweakedUrl);

        // Create the layer style and return
        return await WMS.createLayerStyleFromWMS(tweakedUrl, layerConfig.getGeometryType());
      } catch (error: unknown) {
        // Log warning
        logger.logWarning(`Failed to create a dynamic layer style for the WFS using the WMS styles for ${layerConfig.layerPath}`, error);
      }
    }

    // None
    return undefined;
  }

  // #endregion STATIC PRIVATE METHODS
}
