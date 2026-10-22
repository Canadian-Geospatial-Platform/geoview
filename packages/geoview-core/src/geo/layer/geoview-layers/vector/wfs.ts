import type { Feature } from 'ol';
import type { ReadOptions } from 'ol/format/Feature';
import WFSFormat from 'ol/format/WFS';
import type { Options as SourceOptions } from 'ol/source/Vector';
import type { Projection as OLProjection } from 'ol/proj';
import { bbox as vectorBbox } from 'ol/loadingstrategy';

import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import type { DisplayDateMode, TypeOutfields, TypeOutfieldsType } from '@/api/types/map-schema-types';
import type { TypeGeoviewLayerConfig, TypeMetadataWFSCapabilities, VectorStrategy } from '@/api/types/layer-schema-types';
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
import { parseXMLToJson, toArray } from '@/core/utils/utilities';
import { Fetch } from '@/core/utils/fetch-helper';
import { GVWFS } from '@/geo/layer/gv-layers/vector/gv-wfs';
import { formatError, NetworkError, RequestTimeoutError, ResponseEmptyError, ResponseError } from '@/core/exceptions/core-exceptions';
import { GeoUtilities, type FetchWithProxyResult, type SourceFeaturesInfo } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { ServicesManagement } from '@/geo/utils/services-management';
import { WMS } from '@/geo/layer/geoview-layers/raster/wms';

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
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails (network, proxy, or HTTP error)
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
      fetchResult.data.FeatureTypeList.FeatureType = toArray(fetchResult.data.FeatureTypeList.FeatureType);

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
   * DescribeFeatureType requests first use the service default, then try advertised output formats if needed.
   *
   * @param layerConfig - The layer entry configuration to process
   * @param displayDateMode - The display date mode to use for processing time dimensions in the metadata
   * @param mapProjection - Optional map projection
   * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
   * @returns A promise that resolves once the layer entry configuration has gotten its metadata processed
   * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called
   * @throws {RequestTimeoutError} When the DescribeFeatureType request exceeds the timeout duration
   * @throws {RequestAbortedError} When the DescribeFeatureType request is aborted
   * @throws {ResponseError} When all output format attempts return unsuccessful HTTP responses
   * @throws {ResponseEmptyError} When all output format attempts return empty responses
   * @throws {NetworkError} When the DescribeFeatureType request encounters a network error
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

    // Try without specifying an output format first (typically the describefeaturetype shouldn't need one), then advertised formats as fallbacks
    const version = layerConfigWFS.getVersionOrDefault();
    const outputFormats = layerConfigWFS.getMetadataDescribeFeatureTypeOutputFormats();
    const outputFormatsToTry = ['', ...outputFormats];

    // Retry response-level failures with advertised formats
    let featureProps: TypeOutfields[] | undefined;
    let lastError: unknown;
    for (const outputFormat of outputFormatsToTry) {
      const describeFeatureUrl = GeoUtilities.ensureServiceRequestUrlDescribeFeatureType(
        layerConfigWFS.getDataAccessPath(),
        layerConfigWFS.layerId,
        version,
        outputFormat
      );

      // Keep track of the URL for the current attempt
      layerConfigWFS.setDescribeFeatureTypeFullUrl(describeFeatureUrl);

      // Tweak url with the proxy if necessary
      const describeFeatureUrlWithProxy = layerConfigWFS.getUrlWithProxyWhenNeeded(describeFeatureUrl);

      let responseText: string | undefined;
      try {
        // GV Requests are sequential so a failed format can fall back to the next one.
        // eslint-disable-next-line no-await-in-loop
        responseText = await Fetch.fetchText(describeFeatureUrlWithProxy, { signal: abortSignal });
      } catch (error: unknown) {
        GeoViewError.throwIfAborted(error);
        if (error instanceof RequestTimeoutError || error instanceof NetworkError) throw error;
        if (!(error instanceof ResponseError || error instanceof ResponseEmptyError)) throw error;
        lastError = error;
      }

      if (responseText !== undefined) {
        try {
          featureProps = WFS.#parseResponseForOutfields(responseText);
          break;
        } catch (error: unknown) {
          // An unusable body may still be parseable when requested in another advertised format.
          lastError = error;
        }
      }
    }

    // Throw the final attempt's failure if no response could be parsed
    if (!featureProps) throw lastError;

    // Set it
    WFS.initLayerMetadata(layerConfigWFS, featureProps);

    // Try
    const layerStyle = await WMS.tryProcessLayerStylingInformationIfAny(layerConfigWFS);

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
    if (sourceOptions.strategy === vectorBbox && Number.isFinite(readOptions.extent?.[0])) {
      bboxExtent = `${readOptions.extent},${Projection.getProjectionFromStringOrNumber(readOptions.featureProjection)?.getCode()}`;
    }

    // Get the version and post settings
    const version = layerConfigWFS.getVersionOrDefault();

    // Delegate to the generic fallback with the standard WFS parse functions
    return WFS.fetchWithFormatFallback(
      layerConfigWFS,
      (url, requestInit) =>
        WFS.#fetchAndParseWFSFeaturesJSON(url, version, readOptions.dataProjection, readOptions.featureProjection, requestInit),
      (url, requestInit) =>
        WFS.#fetchAndParseWFSFeaturesText(url, version, readOptions.dataProjection, readOptions.featureProjection, requestInit),
      undefined,
      bboxExtent,
      undefined,
      undefined
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
      // TODO: REFACTOR IMPORTANT - This spreading should be rewritten like explained in GeoJSON file. Search id : 59026aa9

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
        if (GeoUtilities.isGmlGeometryField(fieldEntry.type)) {
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
   * @throws {LayerServiceMetadataUnableToFetchError} When WFS service metadata cannot be fetched
   * @throws {LayerNoCapabilitiesError} When the WFS capabilities response is empty
   * @throws {LayerServiceMetadataEmptyError} When the WFS service metadata is incomplete
   * @throws {LayerEntryConfigLayerIdNotFoundError} When a configured feature type is not found
   * @throws {LayerDataAccessPathMandatoryError} When a layer data access path is not configured
   * @throws {RequestTimeoutError} When a DescribeFeatureType request exceeds the timeout duration
   * @throws {RequestAbortedError} When a DescribeFeatureType request is aborted
   * @throws {ResponseError} When a DescribeFeatureType response is not successful
   * @throws {ResponseEmptyError} When a DescribeFeatureType response is empty
   * @throws {NetworkError} When a DescribeFeatureType request encounters a network error
   * @throws {LayerEntryConfigEmptyLayerGroupError} When an empty layer group prevents the root layer from being created
   * @throws {LayerEntryConfigUnableToCreateGroupLayerError} When a layer group cannot be created
   * @throws {AggregateError} When multiple layer entries fail to process
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

    const fieldEntryType = fieldDefinition.type?.split(':').slice(-1)[0];
    if (fieldEntryType === 'date') return 'date';
    if (fieldEntryType === 'dateTime') return 'date';
    if (fieldEntryType === 'TimeInstantType') {
      return 'date';
    }

    if (fieldEntryType && ['int', 'integer', 'number', 'decimal', 'long', 'short', 'float', 'double'].includes(fieldEntryType))
      return 'number';

    // Default: string
    return 'string';
  }

  /**
   * Generic format fallback strategy: tries the preferred format first, then falls back to no specific format.
   * Accepts custom parse functions so callers can plug in their own fetch+parse pipeline.
   *
   * @param layerConfig - The WFS layer entry configuration
   * @param queryFnJSON - A function that receives a URL and optional request settings and queries the response as JSON
   * @param queryFnFallback - A function that receives a URL and optional request settings and queries the response as text
   * @param bboxExtent - Optional bbox extent string (e.g., 'minx,miny,maxx,maxy,EPSG:3978')
   * @param outfields - Optional list of fields to return (propertyName parameter)
   * @param filter - Optional OGC XML filter string
   * @param srsName - Optional output projection code (e.g., 'EPSG:3857')
   * @returns A promise that resolves with the result of the parse function
   * @throws {ResponseError} When GetFeature requests remain too long and no POST fallback succeeds
   * @throws {LayerInvalidFeatureInfoFormatWFSError} When no format produces usable results
   */
  static async fetchWithFormatFallback<T>(
    layerConfig: OgcWfsLayerEntryConfig,
    queryFnJSON: (url: string, requestInit?: RequestInit) => Promise<T>,
    queryFnFallback: (url: string, requestInit?: RequestInit) => Promise<T>,
    outfields: TypeOutfields[] | undefined,
    bboxExtent: string | undefined,
    filter: string | undefined,
    srsName: string | undefined
  ): Promise<T> {
    // Get the officially supported formats by the service
    const supportedFormats = WFS.#resolveSupportedFormats(layerConfig);

    // Get the post endpoint URL if available
    const postEndpointHref = layerConfig.getMetadataGetFeatureOperationUrlPost();

    // Resolve the full URL with proxy if needed
    const postEndpoint = postEndpointHref ? layerConfig.getUrlWithProxyWhenNeeded(postEndpointHref) : undefined;

    // Context object for handling post fallback scenarios
    const postFallbackContext = {
      layerConfig,
      postEndpoint,
      bboxExtent,
      outfields,
      filter,
      srsName,
      state: {
        usePostFallback: false,
        lastUriTooLongError: undefined as ResponseError | undefined,
      },
    };

    // Ordered list of formats to try, from most preferred to least preferred.
    // Each entry maps a MIME type to the parse function to use for that format.
    const formatCandidates: { format: string; queryFn: (url: string, requestInit?: RequestInit) => Promise<T> }[] = [
      { format: MIME_TYPE_FORMAT_JSON, queryFn: queryFnJSON },
      { format: MIME_TYPE_FORMAT_GML_XML_32, queryFn: queryFnFallback },
      { format: MIME_TYPE_FORMAT_TEXT_XML_GML_321, queryFn: queryFnFallback },
      { format: MIME_TYPE_FORMAT_TEXT_XML_GML_311, queryFn: queryFnFallback },
      { format: MIME_TYPE_FORMAT_TEXT_XML_GML_212, queryFn: queryFnFallback },
      { format: MIME_TYPE_FORMAT_TEXT_XML, queryFn: queryFnFallback },
      { format: '', queryFn: queryFnFallback },
    ];

    // Try each format candidate in order
    let result: T | undefined;
    for (const candidate of formatCandidates) {
      // The empty format is a final request without an outputFormat parameter.
      const matchingFormats = candidate.format ? WFS.#supportedFormatsInclude(supportedFormats, candidate.format) : [''];
      if (matchingFormats.length) {
        try {
          // Build the GetFeatureUrl with the candidate format and other parameters
          const url = WFS.#buildGetFeatureUrl(layerConfig, matchingFormats[0], bboxExtent, outfields, filter, srsName);

          // GV Here, we do want to await in the loop, because we want to know if the fetch/parse succeeded before looping to the next format request.
          // eslint-disable-next-line no-await-in-loop
          result = await WFS.#queryWithGetOrPostFallback(candidate.queryFn, url, matchingFormats[0], postFallbackContext);

          // If the fetch/parse succeeded, return right away
          if (result) return result;
        } catch (error: unknown) {
          // Throw on abort to skip remaining format attempts
          GeoViewError.throwIfAborted(error);
          if (error instanceof ResponseError && error.status === 414) postFallbackContext.state.lastUriTooLongError = error;
        }
      }
    }

    // Preserve the actionable URI-length failure if every format and POST fallback failed.
    if (postFallbackContext.state.lastUriTooLongError) throw postFallbackContext.state.lastUriTooLongError;

    // Failed
    throw new LayerInvalidFeatureInfoFormatWFSError(layerConfig.layerPath, supportedFormats, layerConfig.getLayerNameCascade());
  }

  // #endregion STATIC PUBLIC METHODS

  // #region STATIC PRIVATE METHODS

  /**
   * Queries a GetFeature candidate and retries with an advertised XML POST endpoint after HTTP 414.
   *
   * @param queryFn - The response parser and query function
   * @param url - The candidate GetFeature URL
   * @param outputFormat - The requested response format
   * @param context - The request settings and retry state shared by all format candidates
   * @returns The parsed response
   */
  static async #queryWithGetOrPostFallback<T>(
    queryFn: (url: string, requestInit?: RequestInit) => Promise<T>,
    url: string,
    outputFormat: string,
    context: TypeWFSGetOrPostFallbackContext
  ): Promise<T> {
    const { layerConfig, postEndpoint, bboxExtent, outfields, filter, srsName, state } = context;

    // Once GET has exceeded the URI limit, send later format candidates through POST too.
    if (state.usePostFallback && postEndpoint) {
      const postRequest = WFS.#buildGetFeaturePostRequest(layerConfig, postEndpoint, outputFormat, bboxExtent, outfields, filter, srsName);
      if (postRequest) return queryFn(postRequest.url, postRequest.requestInit);
    }

    try {
      // Keep GET as the default; only switch methods when the server rejects its URL length.
      return await queryFn(url);
    } catch (error: unknown) {
      // POST only addresses an overlong request URL; propagate unrelated failures unchanged.
      if (!(error instanceof ResponseError) || error.status !== 414) throw error;
      state.lastUriTooLongError = error;
      if (!postEndpoint) throw error;

      // Preserve the original 414 if the advertised endpoint or request cannot be used safely.
      const postRequest = WFS.#buildGetFeaturePostRequest(layerConfig, postEndpoint, outputFormat, bboxExtent, outfields, filter, srsName);
      if (!postRequest) throw error;

      state.usePostFallback = true;
      return queryFn(postRequest.url, postRequest.requestInit);
    }
  }

  /**
   * Builds a WFS GetFeature POST request using the service's advertised XML endpoint.
   *
   * @param layerConfig - The WFS layer entry configuration
   * @param postEndpoint - The advertised POST endpoint
   * @param outputFormat - The requested response format
   * @param bboxExtent - Optional comma-separated BBOX and CRS
   * @param outfields - Optional requested properties
   * @param filter - Optional OGC/FES filter XML
   * @param srsName - Optional response projection
   * @returns The POST endpoint and request settings, or undefined when the request cannot be represented safely
   */
  static #buildGetFeaturePostRequest(
    layerConfig: OgcWfsLayerEntryConfig,
    postEndpoint: string,
    outputFormat: string,
    bboxExtent?: string,
    outfields?: TypeOutfields[],
    filter?: string,
    srsName?: string
  ): TypeWFSGetFeaturePostRequest | undefined {
    // Get the WFS version
    const version = layerConfig.getVersionOrDefault();

    // Feature namespace declarations come from capabilities metadata, not the WFS protocol namespace.
    const metadata = layerConfig.getServiceMetadata();
    if (!metadata) return undefined;

    const namespaceAttributes = metadata['@attributes'] as Record<string, unknown>;
    const featureType = WFS.#asRecord(layerConfig.getFeatureType());
    const featureTypeAttributes = WFS.#asRecord(featureType?.['@attributes']);
    const prefixSeparator = layerConfig.layerId.indexOf(':');
    // A feature type QName can contain at most one prefix separator; don't guess how to encode malformed names.
    if (prefixSeparator !== -1 && layerConfig.layerId.indexOf(':', prefixSeparator + 1) !== -1) return undefined;
    const declaredPrefix = prefixSeparator === -1 ? undefined : layerConfig.layerId.substring(0, prefixSeparator);
    const featurePrefix = declaredPrefix ?? 'feature';
    const featureTypeName = prefixSeparator === -1 ? layerConfig.layerId : layerConfig.layerId.substring(prefixSeparator + 1);
    const namespaceKey = `xmlns:${featurePrefix}`;
    // An unprefixed type may use the service's default namespace; a declared prefix must resolve explicitly.
    const featureNamespace =
      namespaceAttributes[namespaceKey] ??
      featureTypeAttributes?.[namespaceKey] ??
      (!declaredPrefix ? (namespaceAttributes.xmlns ?? featureTypeAttributes?.xmlns) : undefined);
    // WFS protocol namespaces cannot stand in for the application's feature namespace.
    if (typeof featureNamespace !== 'string' || !featureNamespace || featureNamespace.startsWith('http://www.opengis.net/wfs'))
      return undefined;

    let bbox: [number, number, number, number] | undefined;
    let bboxProjection: string | undefined;
    if (bboxExtent) {
      // Split the four numeric ordinates from the optional CRS suffix used by GeoView's BBOX string.
      const bboxParts = bboxExtent.split(',');
      if (bboxParts.length < 4 || bboxParts.slice(0, 4).some((value) => !value.trim())) return undefined;
      const bboxValues = bboxParts.slice(0, 4).map(Number);
      if (!bboxValues.every(Number.isFinite)) return undefined;
      bbox = [bboxValues[0], bboxValues[1], bboxValues[2], bboxValues[3]];
      bboxProjection = bboxParts.slice(4).join(',') || undefined;
    }

    // Get the geometry field name
    const geometryName = layerConfig.getGeometryField()?.name;

    // WFS BBOX filters need the feature's geometry property name.
    if (bbox && !geometryName) return undefined;

    // Use OpenLayers to emit the version-specific GetFeature and Query XML.
    const requestNode = new WFSFormat({ version }).writeGetFeature({
      featureNS: featureNamespace,
      featurePrefix,
      featureTypes: [featureTypeName],
      ...(outputFormat && { outputFormat }),
      ...(srsName && { srsName }),
      ...(outfields && { propertyNames: outfields.map((outfield) => outfield.name) }),
      ...(bbox && { bbox, geometryName }),
    });
    const requestElement = requestNode as Element;
    const requestDocument = requestElement.ownerDocument;
    if (!requestDocument) return undefined;

    // Fail closed if the writer did not produce the Query node needed for filter and BBOX updates.
    const queryElement = Array.from(requestElement.getElementsByTagName('*')).find((element) => element.localName === 'Query');
    if (!queryElement) return undefined;

    if (bboxProjection) {
      // Restore the CRS suffix because the writer receives only the numeric BBOX ordinates.
      const bboxElement = Array.from(queryElement.getElementsByTagName('*')).find(
        (element) => element.localName === 'Envelope' || element.localName === 'Box'
      );
      bboxElement?.setAttribute('srsName', bboxProjection);
    }

    if (filter) {
      const filterDocument = new DOMParser().parseFromString(filter, 'application/xml');
      const filterElement = filterDocument.documentElement;
      // The filter namespace is version-specific; reject malformed or incompatible XML instead of sending it as text.
      const filterNamespace = version === '2.0.0' ? 'http://www.opengis.net/fes/2.0' : 'http://www.opengis.net/ogc';
      if (
        filterDocument.getElementsByTagName('parsererror').length ||
        filterElement.localName !== 'Filter' ||
        filterElement.namespaceURI !== filterNamespace
      )
        return undefined;

      const generatedFilterElement = queryElement.getElementsByTagNameNS(filterNamespace, 'Filter').item(0);
      if (generatedFilterElement) {
        // OpenLayers may have added a BBOX predicate; combine it with the caller's predicate using AND.
        const filterChildren = Array.from(filterElement.childNodes).filter((node) => node.nodeType === Node.ELEMENT_NODE);
        const bboxFilterChildren = Array.from(generatedFilterElement.childNodes).filter((node) => node.nodeType === Node.ELEMENT_NODE);
        if (!filterChildren.length || !bboxFilterChildren.length) return undefined;

        // Keep namespace bindings declared on the caller's filter for its imported predicates.
        for (const attribute of Array.from(filterElement.attributes)) {
          if (attribute.namespaceURI === 'http://www.w3.org/2000/xmlns/') {
            generatedFilterElement.setAttributeNS(attribute.namespaceURI, attribute.name, attribute.value);
          }
        }

        const filterPrefix = generatedFilterElement.prefix ?? (version === '2.0.0' ? 'fes' : 'ogc');
        const andElement = requestDocument.createElementNS(filterNamespace, `${filterPrefix}:And`);
        while (generatedFilterElement.firstChild) generatedFilterElement.removeChild(generatedFilterElement.firstChild);
        generatedFilterElement.appendChild(andElement);
        for (const child of [...filterChildren, ...bboxFilterChildren]) andElement.appendChild(requestDocument.importNode(child, true));
      } else {
        queryElement.appendChild(requestDocument.importNode(filterElement, true));
      }
    }

    return {
      url: postEndpoint,
      requestInit: {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml; charset=UTF-8' },
        // Put GetFeature parameters in the XML body instead of extending the query string.
        body: new XMLSerializer().serializeToString(requestElement),
      },
    };
  }

  /**
   * Narrows an unknown value to a plain record.
   *
   * @param value - The value to inspect
   * @returns The record, or undefined when the value is not a record
   */
  static #asRecord(value: unknown): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
    return value as Record<string, unknown>;
  }

  /**
   * Fetches WFS features as JSON and parses the response into OpenLayers features.
   *
   * @param url - The WFS GetFeature request URL
   * @param version - The WFS version string (e.g., '1.1.0', '2.0.0')
   * @param dataProjection - Optional data projection for feature reading
   * @param featureProjection - Optional feature projection for reprojection
   * @returns A promise that resolves to source features info
   */
  static async #fetchAndParseWFSFeaturesJSON(
    url: string,
    version: string,
    dataProjection?: string | OLProjection,
    featureProjection?: string | OLProjection,
    requestInit?: RequestInit
  ): Promise<SourceFeaturesInfo> {
    // Fetch as JSON
    const responseData = await Fetch.fetchJson(url, requestInit);

    // Parse the response
    return WFS.#parseWFSResponseData(responseData, version, dataProjection, featureProjection);
  }

  /**
   * Fetches WFS features as text and parses the response into OpenLayers features.
   *
   * @param url - The WFS GetFeature request URL
   * @param version - The WFS version string (e.g., '1.1.0', '2.0.0')
   * @param dataProjection - Optional data projection for feature reading
   * @param featureProjection - Optional feature projection for reprojection
   * @returns A promise that resolves to source features info
   */
  static async #fetchAndParseWFSFeaturesText(
    url: string,
    version: string,
    dataProjection?: string | OLProjection,
    featureProjection?: string | OLProjection,
    requestInit?: RequestInit
  ): Promise<SourceFeaturesInfo> {
    // Fetch as text
    const responseData = await Fetch.fetchText(url, requestInit);

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

    // Here, the output isn't GeoJSON, assume XML/GML
    return GeoUtilities.readFeaturesFromWFS(responseData, version, dataProjection, featureProjection);
  }

  /**
   * Parses a DescribeFeatureType response into field definitions, trying XML before JSON.
   *
   * XML schema responses are preferred regardless of the requested output format. If the response
   * is not a supported XML schema, it is parsed as JSON and must contain feature properties.
   *
   * @param responseText - The raw response text from the DescribeFeatureType request
   * @returns The parsed array of field definitions
   * @throws {Error} When the response is valid JSON but does not contain a feature properties array
   */
  static #parseResponseForOutfields(responseText: string): TypeOutfields[] {
    try {
      // Try the widely used XML schema response first, regardless of the requested output format.
      const xmlJson = parseXMLToJson<Record<string, unknown>>(responseText);
      const schemaKey = Object.keys(xmlJson).find((key) => key.split(':').pop() === 'schema');
      if (!schemaKey) throw new Error('DescribeFeatureType response is not an XML schema');

      const prefix = schemaKey.includes(':') ? `${schemaKey.split(':')[0]}:` : '';
      const xmlJsonSchema = xmlJson[schemaKey] as Record<string, unknown>;
      const xmlJsonSchemaComplexType = xmlJsonSchema[`${prefix}complexType`] as Record<string, unknown>;
      const elements =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (xmlJsonSchemaComplexType as any)?.[`${prefix}complexContent`]?.[`${prefix}extension`]?.[`${prefix}sequence`]?.[
          `${prefix}element`
        ] ?? [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const xmlFields = toArray(elements).flatMap((element: any) =>
        element['@attributes'] ? [element['@attributes']] : []
      ) as TypeOutfields[];
      if (!xmlFields.length) throw new Error('DescribeFeatureType XML schema does not contain extractable fields');
      return xmlFields;
    } catch {
      // Some services return JSON even when they accept an outputFormat request for XML or vice versa.
      // Continue to try parsing as JSON if XML parsing fails.
    }

    const parsed = JSON.parse(responseText) as { featureTypes?: { properties?: TypeOutfields[] }[] };
    const properties = parsed.featureTypes?.[0]?.properties;
    if (!Array.isArray(properties)) throw new Error('DescribeFeatureType JSON response does not contain feature properties');
    return properties;
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
      layerConfig.getMetadataGetFeatureOperationUrlGet() ?? layerConfig.getDataAccessPath(),
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

  // #endregion STATIC PRIVATE METHODS
}

/** Shared inputs and retry state for WFS GetFeature format candidates. */
type TypeWFSGetOrPostFallbackContext = {
  /** Layer configuration used to build a POST request. */
  layerConfig: OgcWfsLayerEntryConfig;
  /** Advertised POST endpoint, when available. */
  postEndpoint: string | undefined;
  /** Optional BBOX extent and CRS. */
  bboxExtent: string | undefined;
  /** Optional feature properties requested by the caller. */
  outfields: TypeOutfields[] | undefined;
  /** Optional OGC filter expression. */
  filter: string | undefined;
  /** Optional output projection code. */
  srsName: string | undefined;
  /** Mutable state shared while trying formats and switching from GET to POST. */
  state: {
    /** Whether an earlier HTTP 414 switched subsequent candidates to POST. */
    usePostFallback: boolean;
    /** Most recent HTTP 414 to preserve if all request attempts fail. */
    lastUriTooLongError: ResponseError | undefined;
  };
};

/** A WFS POST endpoint paired with the serialized request settings. */
type TypeWFSGetFeaturePostRequest = {
  /** Advertised service endpoint for the POST request. */
  url: string;
  /** HTTP method, headers, and serialized XML body. */
  requestInit: RequestInit;
};
