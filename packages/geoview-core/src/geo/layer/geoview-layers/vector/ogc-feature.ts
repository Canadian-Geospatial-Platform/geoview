import type { Feature } from 'ol';
import type { ReadOptions } from 'ol/format/Feature';
import type { Options as SourceOptions } from 'ol/source/Vector';
import type { Projection as OLProjection } from 'ol/proj';

import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import type { DisplayDateMode, TypeOutfields, TypeOutfieldsType } from '@/api/types/map-schema-types';
import type {
  TypeGeoviewLayerConfig,
  TypeMetadataOGCFeature,
  TypeLayerMetadataQueryables,
  TypeLayerMetadataOGC,
} from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { OgcFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';
import type { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import { Fetch } from '@/core/utils/fetch-helper';
import { getNextOgcFeaturePageUrl } from '@/core/utils/ogc-url-helper';
import {
  LayerEntryConfigInvalidLayerEntryConfigError,
  LayerEntryConfigLayerIdNotFoundError,
} from '@/core/exceptions/layer-entry-config-exceptions';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import { LayerServiceMetadataUnableToFetchError } from '@/core/exceptions/layer-exceptions';
import { formatError } from '@/core/exceptions/core-exceptions';
import { Projection } from '@/geo/utils/projection';
import { GeoUtilities, type FetchWithProxyResult, type SourceFeaturesInfo } from '@/geo/utils/utilities';
import { WMS } from '@/geo/layer/geoview-layers/raster/wms';
import { GVOGCFeature } from '@/geo/layer/gv-layers/vector/gv-ogc-feature';

export interface TypeOgcFeatureLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig' | 'geoviewLayerType'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.OGC_FEATURE;
  fetchStylesOnWMS?: boolean;
  listOfLayerEntryConfig: OgcFeatureLayerEntryConfig[];
}

/**
 * A class to add OGC api feature layer.
 */
export class OgcFeature extends AbstractGeoViewVector {
  /**
   * Constructs a OgcFeature Layer configuration processor.
   *
   * @param layerConfig - The layer configuration
   */
  // The constructor is not useless, it narrows down the accepted parameter type.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(layerConfig: TypeOgcFeatureLayerConfig) {
    super(layerConfig);
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed layer configuration specific to this layer
   */
  override getGeoviewLayerConfig(): TypeOgcFeatureLayerConfig {
    return super.getGeoviewLayerConfig() as TypeOgcFeatureLayerConfig;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed metadata specific to this layer
   */
  override getMetadata(): TypeMetadataOGCFeature | undefined {
    return super.getMetadata() as TypeMetadataOGCFeature | undefined;
  }

  /**
   * Overrides the way the metadata is fetched.
   *
   * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
   * @returns A promise that resolves with the fetched metadata and proxy information
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails (network, proxy, or HTTP error)
   */
  protected override async onFetchServiceMetadata(abortSignal?: AbortSignal): Promise<FetchWithProxyResult<unknown>> {
    try {
      // Fetch it and return
      return await OgcFeature.fetchMetadata(this.getMetadataAccessPath(), this.getConfigProxyUrl(), abortSignal);
    } catch (error: unknown) {
      // Throw
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
   * @returns A promise that resolves once the layer entries have been initialized
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error
   */
  protected override async onInitLayerEntries(): Promise<TypeGeoviewLayerConfig> {
    // Get the folder url
    const sep = '/collections/';
    const idx = this.getMetadataAccessPath().lastIndexOf(sep);
    let rootUrl = this.getMetadataAccessPath();
    let id: string | undefined;
    let entries: TypeLayerEntryShell[] = [];
    if (idx > 0) {
      rootUrl = this.getMetadataAccessPath().substring(0, idx);
      id = this.getMetadataAccessPath().substring(idx + sep.length);
      entries = [{ id }];
    }

    // If no id
    if (!id) {
      // Calls fetchServiceMetadata which delegates to this class's overridden onFetchServiceMetadata (may use a proxy fallback and store the proxyUrl on the instance)
      const fetchResult = await this.fetchServiceMetadata<TypeMetadataOGCFeature>();

      // Now that we have metadata
      entries = fetchResult.data.collections.map((collection) => {
        return { id: collection.id, layerId: collection.id, layerName: collection.description };
      });
    }

    // Redirect
    return OgcFeature.createGeoviewLayerConfig(
      this.getGeoviewLayerId(),
      this.getGeoviewLayerName(),
      rootUrl,
      this.getGeoviewLayerConfig().isTimeAware,
      entries
    );
  }

  /**
   * Overrides the validation of a layer entry config.
   *
   * @param layerConfig - The layer entry config to validate
   */
  protected override onValidateLayerEntryConfig(layerConfig: ConfigBaseClass): void {
    // Note that the code assumes ogc-feature collections does not contains metadata layer group. If you need layer group,
    // you can define them in the configuration section.

    // Get the metadata
    const metadata = this.getMetadata();

    if (Array.isArray(metadata?.collections)) {
      const foundCollection = metadata.collections.find((layerMetadata) => layerMetadata.id === layerConfig.layerId);
      if (!foundCollection) {
        // Add a layer load error
        this.addLayerLoadError(new LayerEntryConfigLayerIdNotFoundError(layerConfig), layerConfig);
        return;
      }

      // Initialize the layer name by filling the blanks with the name from the metadata
      layerConfig.initLayerNameFromMetadata(foundCollection.description);

      // If no bounds defined in the initial settings and an extent is defined in the metadata
      let bounds = layerConfig.getInitialSettingsBounds();
      if (!bounds && foundCollection.extent?.spatial?.bbox && foundCollection.extent?.spatial?.crs) {
        // Project the latlong
        bounds = Projection.transformExtentFromProj(
          foundCollection.extent.spatial.bbox[0],
          Projection.getProjectionFromStringOrNumber(foundCollection.extent.spatial.crs),
          Projection.getProjectionLonLat()
        );

        // Validate and update the bounds initial settings
        layerConfig.initInitialSettingsBoundsFromMetadata(bounds);
      }

      // Done
      return;
    }

    // Failed
    throw new LayerEntryConfigInvalidLayerEntryConfigError(layerConfig);
  }

  /**
   * Overrides the way the layer metadata is processed.
   *
   * @param layerConfig - The layer entry configuration to process
   * @param displayDateMode - The display date mode to use for processing time dimensions in the metadata
   * @param mapProjection - Optional map projection
   * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
   * @returns A promise that resolves once the layer entry configuration has gotten its metadata processed
   * @throws {LayerMetadataAccessPathMandatoryError} When the collection queryables metadata path is not configured
   * @throws {RequestTimeoutError} When the collection queryables request exceeds the timeout duration
   * @throws {RequestAbortedError} When the collection queryables request is aborted
   * @throws {ResponseError} When the collection queryables response is not successful
   * @throws {ResponseEmptyError} When the collection queryables response is empty
   * @throws {NetworkError} When the collection queryables request encounters a network error
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
    const layerConfigOgcFeature = layerConfig as OgcFeatureLayerEntryConfig;

    // The metadata url
    const metadataUrl = layerConfigOgcFeature.getMetadataAccessPath(true);

    // The url suffix
    const urlSuffix = `collections/${layerConfigOgcFeature.layerId}/queryables?f=json`;

    // If there is a metadata url
    if (metadataUrl) {
      // The query url
      const queryUrl = `${layerConfigOgcFeature.getMetadataAccessPathProxiedWhenNecessary(true)}${urlSuffix}`;

      // Query the metadata for the queryables
      const queryResultData = await Fetch.fetchJson<TypeLayerMetadataQueryables>(queryUrl, { signal: abortSignal });

      // Keep the non-proxied full URL of the queryables request
      layerConfigOgcFeature.setQueryablesFullUrl(`${metadataUrl}${urlSuffix}`);

      // Init the layer metadata
      OgcFeature.initLayerMetadata(layerConfigOgcFeature, queryResultData);

      // Try
      const layerStyle = await WMS.tryProcessLayerStylingInformationIfAny(layerConfigOgcFeature);

      // Initialize the layer style by filling the blanks with the information from the metadata
      layerConfigOgcFeature.initLayerStyleFromMetadata(layerStyle);
    }

    // Return the layer config
    return layerConfigOgcFeature;
  }

  /**
   * Overrides the loading of the vector features for the layer by fetching OGC Feature data and converting it
   * into OpenLayers {@link Feature} feature instances, following advertised next-page links until exhausted.
   *
   * @param layerConfig - The configuration object for the vector layer, containing source and data access information
   * @param sourceOptions - The OpenLayers vector source options associated with the layer
   * @param readOptions - Options controlling how features are read, including the target `featureProjection`
   * @returns A promise that resolves with all pages' OpenLayers features and the interpreted source projection
   * @throws {Error} When pagination repeats an already requested page
   * @throws {LayerSourceFailedToLoadError} When any page request fails
   * @throws {LayerTooManyFeatures} When the advertised or accumulated feature count exceeds the supported limit
   * @throws {LayerTooManyFeaturesInBBOX} When a BBOX query exceeds the supported feature limit
   * @throws {LayerTooManyPages} When another page remains after the maximum number of pages has been fetched
   */
  protected override async onCreateVectorSourceLoadFeatures(
    layerConfig: VectorLayerEntryConfig,
    _sourceOptions: SourceOptions<Feature>,
    readOptions: ReadOptions
  ): Promise<SourceFeaturesInfo> {
    // Get the items url as specified in the metadata
    const itemsUrl = new URL(OgcFeature.#getItemsUrl(layerConfig));

    // Apply the bbox strategy on the items url if necessary
    OgcFeature.#applyBboxStrategy(layerConfig, readOptions, itemsUrl);
    const itemsUrlString = itemsUrl.toString();

    // Fetch with proxy fallback support; surface a specific message if the source can't be loaded (e.g. unreachable/404)
    const responseData = await AbstractGeoViewVector.fetchSourceForLayer(layerConfig, () =>
      Fetch.fetchJson(layerConfig.getUrlWithProxyWhenNeeded(itemsUrlString), {
        headers: { Accept: 'application/geo+json, application/json' },
        retryCount: 3,
      })
    );

    // Reject oversized collections before converting even the first page to OpenLayers features.
    let featureCount = OgcFeature.#checkFeatureCount(layerConfig, responseData, 0);
    const sourceFeaturesInfo = await GeoUtilities.readFeaturesFromGeoJSON(
      responseData,
      readOptions.dataProjection,
      readOptions.featureProjection
    );
    const requestedPageUrls = new Set([itemsUrlString]);
    let nextPageUrl = getNextOgcFeaturePageUrl(responseData, itemsUrlString);

    while (nextPageUrl) {
      // Reject broken paging rather than reporting a silently truncated layer as successfully loaded.
      if (requestedPageUrls.has(nextPageUrl)) throw new Error(`OGC API Features pagination repeated page '${nextPageUrl}'.`);

      requestedPageUrls.add(nextPageUrl);
      const pageUrl = layerConfig.getUrlWithProxyWhenNeeded(nextPageUrl);

      // GV Each request depends on the next link returned by the preceding page.
      // eslint-disable-next-line no-await-in-loop
      const pageResponse = await AbstractGeoViewVector.fetchSourceForLayer(layerConfig, () =>
        Fetch.fetchJson(pageUrl, { headers: { Accept: 'application/geo+json, application/json' }, retryCount: 3 })
      );

      // Services may omit numberMatched, so also enforce the limit using actual returned features.
      featureCount = OgcFeature.#checkFeatureCount(layerConfig, pageResponse, featureCount);

      // Keep the first page's interpreted projection when later pages omit CRS metadata.
      // eslint-disable-next-line no-await-in-loop
      const pageFeatures = await GeoUtilities.readFeaturesFromGeoJSON(
        pageResponse,
        sourceFeaturesInfo.dataProjection,
        readOptions.featureProjection
      );
      for (const feature of pageFeatures.features) sourceFeaturesInfo.features.push(feature);
      nextPageUrl = getNextOgcFeaturePageUrl(pageResponse, nextPageUrl);
    }

    return sourceFeaturesInfo;
  }

  /**
   * Overrides the creation of the GV Layer.
   *
   * @param layerConfig - The layer entry configuration
   * @returns The GV Layer
   */
  protected override onCreateGVLayer(layerConfig: OgcFeatureLayerEntryConfig): GVOGCFeature {
    // Create the source
    const source = this.createVectorSource(layerConfig);
    // Create the GV Layer
    const gvLayer = new GVOGCFeature(source, layerConfig);
    // Return it
    return gvLayer;
  }

  // #endregion OVERRIDES

  // #region STATIC PUBLIC METHODS

  /**
   * Creates a configuration object for an OGC Feature layer.
   *
   * This function constructs a `TypeOgcFeatureLayerConfig` object that describes an OGC Feature layer
   * and its associated entry configurations based on the provided parameters.
   *
   * @param geoviewLayerId - A unique identifier for the GeoView layer
   * @param geoviewLayerName - The display name of the GeoView layer
   * @param metadataAccessPath - The full service URL to the layer endpoint
   * @param isTimeAware - Indicates whether the layer supports time-based filtering
   * @param layerEntries - An array of layer entries objects to be included in the configuration
   * @returns The constructed configuration object for the OGC Feature layer
   */
  static createGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string | undefined,
    metadataAccessPath: string,
    isTimeAware: boolean | undefined,
    layerEntries: TypeLayerEntryShell[]
  ): TypeOgcFeatureLayerConfig {
    const geoviewLayerConfig: TypeOgcFeatureLayerConfig = {
      geoviewLayerId,
      geoviewLayerName,
      metadataAccessPath,
      geoviewLayerType: CONST_LAYER_TYPES.OGC_FEATURE,
      isTimeAware,
      listOfLayerEntryConfig: [],
    };
    geoviewLayerConfig.listOfLayerEntryConfig = layerEntries.map((layerEntry) => {
      // TODO: REFACTOR IMPORTANT - This spreading should be rewritten like explained in GeoJSON file. Search id : 59026aa9

      const layerEntryConfig = new OgcFeatureLayerEntryConfig({
        geoviewLayerConfig,
        layerId: `${layerEntry.id}`,
        ...(layerEntry.layerName && { layerName: `${layerEntry.layerName}` }),
      });
      return layerEntryConfig;
    });

    // Return it
    return geoviewLayerConfig;
  }

  /**
   * Initializes a GeoView layer configuration for an OGC Feature layer.
   *
   * This method creates a basic TypeGeoviewLayerConfig using the provided
   * ID, name, and metadata access path URL. It then initializes the layer entries by calling
   * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
   *
   * @param geoviewLayerId - A unique identifier for the layer
   * @param geoviewLayerName - The display name of the layer
   * @param metadataAccessPath - The full service URL to the layer endpoint
   * @param isTimeAware - Indicates whether the layer supports time-based filtering
   * @returns A promise that resolves to an initialized GeoView layer configuration with layer entries
   */
  static initGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware?: boolean
  ): Promise<TypeGeoviewLayerConfig> {
    // Create the Layer config
    const myLayer = new OgcFeature({ geoviewLayerId, geoviewLayerName, metadataAccessPath, isTimeAware } as TypeOgcFeatureLayerConfig);
    return myLayer.onInitLayerEntries();
  }

  /**
   * Initializes the metadata for a given OGC Feature layer entry configuration.
   *
   * This method processes the service metadata queryables and sets the relevant information on the layer entry configuration,
   * such as outfields and their aliases, which are essential for configuring the feature info retrieval and display.
   *
   * @param layerConfig - The OGC Feature layer entry configuration to initialize with metadata
   * @param metadataQueryables - The queryables metadata retrieved from the OGC service, containing information about the fields and
   * their types for the layer entry
   */
  static initLayerMetadata(layerConfig: VectorLayerEntryConfig, metadataQueryables: TypeLayerMetadataQueryables): void {
    if (metadataQueryables.properties) {
      layerConfig.setLayerMetadata(metadataQueryables.properties);
      OgcFeature.#processFeatureInfoConfig(metadataQueryables.properties, layerConfig);
    }
  }

  /**
   * Processes an OGC Feature GeoviewLayerConfig and returns a promise
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
   * @param fetchStylesOnWMS - Indicates whether to fetch styles from WMS
   * @returns A promise that resolves to an array of layer configurations
   * @throws {LayerServiceMetadataUnableToFetchError} When OGC API Features service metadata cannot be fetched
   * @throws {LayerServiceMetadataEmptyError} When the service metadata response is empty
   * @throws {LayerEntryConfigLayerIdNotFoundError} When a configured collection is not found
   * @throws {LayerEntryConfigInvalidLayerEntryConfigError} When the OGC API Features service metadata is invalid
   * @throws {LayerEntryConfigEmptyLayerGroupError} When an empty layer group prevents the root layer from being created
   * @throws {LayerEntryConfigUnableToCreateGroupLayerError} When a layer group cannot be created
   * @throws {LayerMetadataAccessPathMandatoryError} When a collection queryables metadata path is not configured
   * @throws {RequestTimeoutError} When a collection queryables request exceeds the timeout duration
   * @throws {RequestAbortedError} When a collection queryables request is aborted
   * @throws {ResponseError} When a collection queryables response is not successful
   * @throws {ResponseEmptyError} When a collection queryables response is empty
   * @throws {NetworkError} When a collection queryables request encounters a network error
   * @throws {AggregateError} When multiple layer entries fail to process
   */
  static processGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    url: string,
    configProxyUrl: string | undefined,
    layerEntries: TypeLayerEntryShell[],
    isTimeAware: boolean,
    fetchStylesOnWMS: boolean
  ): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = OgcFeature.createGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, url, isTimeAware, layerEntries);

    // Keep track if fetching styles on the WMS
    layerConfig.fetchStylesOnWMS = fetchStylesOnWMS;

    // Create the class from geoview-layers package
    const myLayer = new OgcFeature(layerConfig);

    // Set the config proxy url, if any in case the layer needs a proxy during processing
    myLayer.setConfigProxyUrl(configProxyUrl);

    // Process it
    return AbstractGeoViewVector.processConfig(myLayer);
  }

  /**
   * Fetches the metadata for a typical OGCFeature class.
   *
   * @param url - The url to query the metadata from
   * @param configProxyUrl - Proxy URL to use when necessary
   * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
   * @returns A promise that resolves with the fetched metadata and proxy information
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
  ): Promise<FetchWithProxyResult<TypeMetadataOGCFeature>> {
    // The url
    let queryUrl = url.endsWith('/') ? `${url}collections` : `${url}/collections`;
    queryUrl = `${queryUrl}?f=json`;

    // Redirect to GeoUtilities
    return GeoUtilities.fetchJsonWithProxyFallback(queryUrl, configProxyUrl, abortSignal);
  }

  // #endregion STATIC PUBLIC METHODS

  // #region STATIC PRIVATE METHODS

  /**
   * Checks advertised and accumulated page counts before allocating OpenLayers features.
   *
   * @param layerConfig - The layer configuration used to identify an oversized collection
   * @param responseData - The current GeoJSON page
   * @param previousCount - The number of features returned by preceding pages
   * @returns The accumulated number of returned features
   * @throws {LayerTooManyFeatures} When the advertised or accumulated count exceeds the limit
   * @throws {LayerTooManyFeaturesInBBOX} When a BBOX query exceeds the limit
   */
  static #checkFeatureCount(layerConfig: VectorLayerEntryConfig, responseData: unknown, previousCount: number): number {
    let featureCount = previousCount;
    let numberMatched: number | undefined;
    if (typeof responseData === 'object' && responseData !== null) {
      if ('features' in responseData && Array.isArray(responseData.features)) featureCount += responseData.features.length;
      if (
        'numberMatched' in responseData &&
        typeof responseData.numberMatched === 'number' &&
        Number.isFinite(responseData.numberMatched)
      ) {
        const { numberMatched: advertisedCount } = responseData;
        numberMatched = advertisedCount;
        if (Number.isSafeInteger(advertisedCount) && advertisedCount >= 0) {
          layerConfig.setTotalRecordsCount(advertisedCount, 'numberMatched');
        }
      }
    }

    const largestCount = Math.max(featureCount, numberMatched ?? 0);
    AbstractGeoViewVector.checkFeatureCount(layerConfig, largestCount);
    return featureCount;
  }

  /**
   * Resolves the items endpoint advertised by the matching OGC API Features collection.
   *
   * @param layerConfig - The OGC Feature layer entry configuration
   * @returns The absolute items URL with a default limit when one was not advertised
   * @throws {Error} When the collection does not advertise a valid HTTP(S) items link
   */
  static #getItemsUrl(layerConfig: VectorLayerEntryConfig): string {
    if (!(layerConfig instanceof OgcFeatureLayerEntryConfig)) {
      throw new Error(`Layer '${layerConfig.layerId}' is not an OGC Feature layer entry.`);
    }

    const collection = layerConfig.getServiceMetadata()?.collections.find((metadata) => metadata.id === layerConfig.layerId);
    if (!collection) throw new Error(`OGC API Features metadata does not contain collection '${layerConfig.layerId}'.`);

    const itemsLinks =
      collection.links?.filter(
        (link) => link.rel === 'items' && !link.templated && typeof link.href === 'string' && link.href.trim().length > 0
      ) ?? [];
    const itemsLink =
      itemsLinks.find((link) => link.type?.split(';', 1)[0].trim().toLowerCase() === 'application/geo+json') ??
      itemsLinks.find((link) => link.type?.split(';', 1)[0].trim().toLowerCase() === 'application/json') ??
      itemsLinks.find((link) => !link.type);
    if (!itemsLink) throw new Error(`OGC API Features collection '${layerConfig.layerId}' does not advertise a usable items link.`);

    const metadataAccessPath = layerConfig.getMetadataAccessPath(true);
    if (!metadataAccessPath) throw new Error(`OGC API Features layer '${layerConfig.layerId}' has no metadata access path.`);

    const collectionsUrl = new URL('collections?f=json', metadataAccessPath);
    const itemsUrl = new URL(itemsLink.href, collectionsUrl);
    if (itemsUrl.protocol !== 'http:' && itemsUrl.protocol !== 'https:') {
      throw new Error(`OGC API Features collection '${layerConfig.layerId}' advertises a non-HTTP items link.`);
    }

    if (collectionsUrl.protocol === 'https:' && itemsUrl.protocol === 'http:' && itemsUrl.hostname === collectionsUrl.hostname) {
      itemsUrl.protocol = 'https:';
    }

    // Get the max page size or default
    const maxPageSize = layerConfig.getMaxPageSizeOrDefault();

    if (!itemsUrl.searchParams.has('limit')) itemsUrl.searchParams.set('limit', `${maxPageSize}`);
    return itemsUrl.toString();
  }

  /**
   * Adds the requested extent to the items URL when the layer uses BBOX loading.
   *
   * @param layerConfig - The OGC Feature layer entry configuration
   * @param readOptions - The requested map extent and its projection
   * @param itemsUrl - The items URL to update with the transformed bbox
   * @throws {Error} When BBOX loading lacks an extent or projection, or the transformed extent is not finite
   */
  static #applyBboxStrategy(layerConfig: VectorLayerEntryConfig, readOptions: ReadOptions, itemsUrl: URL): void {
    // If using the bbox strategy to load features
    if (layerConfig.getSource().strategy === 'bbox') {
      if (!readOptions.extent || !readOptions.featureProjection) {
        throw new Error(`OGC API Features layer '${layerConfig.layerId}' requires a valid extent and projection for BBOX loading.`);
      }

      const sourceProjection = Projection.getProjectionFromStringOrNumber(readOptions.featureProjection);
      const bboxCrs = itemsUrl.searchParams.get('bbox-crs');
      const bboxProjection = bboxCrs ? Projection.getProjectionFromStringOrNumber(bboxCrs) : Projection.getProjectionLonLat();
      const bboxExtent = Projection.transformExtentFromProj(readOptions.extent, sourceProjection, bboxProjection, 8);
      if (!bboxExtent.every(Number.isFinite)) {
        throw new Error(`OGC API Features layer '${layerConfig.layerId}' could not transform the requested extent to its bbox CRS.`);
      }

      itemsUrl.searchParams.set('bbox', bboxExtent.join(','));
    }
  }

  /**
   * This method sets the outfields and aliasFields of the source feature info.
   *
   * @param fields - An array of field names and its aliases
   * @param layerConfig - The vector layer entry to configure
   */
  static #processFeatureInfoConfig(fields: TypeLayerMetadataOGC, layerConfig: VectorLayerEntryConfig): void {
    // Get the outfields
    let outfields = layerConfig.getOutfields();

    // Process undefined outfields or aliasFields
    if (!outfields?.length) {
      // Create it
      outfields = [];

      // Loop
      Object.keys(fields).forEach((fieldEntryKey) => {
        if (fields[fieldEntryKey].type === 'Geometry') return;

        if (!fields[fieldEntryKey]) return;

        const fieldEntry = fields[fieldEntryKey];
        if (fieldEntry.type === 'Geometry') return;

        let fieldType = 'string' as TypeOutfieldsType;
        if (fieldEntry.type === 'date') fieldType = 'date';
        else if (['bigint', 'number'].includes(typeof fieldEntry)) fieldType = 'number';

        const newOutfield: TypeOutfields = {
          name: fieldEntryKey,
          alias: fieldEntryKey,
          type: fieldType,
        };
        outfields!.push(newOutfield);
      });

      // Set it
      layerConfig.setOutfields(outfields);
    }

    // Initialize the aliases
    layerConfig.initOutfieldsAliases();
  }

  // #endregion STATIC PRIVATE METHODS
}
