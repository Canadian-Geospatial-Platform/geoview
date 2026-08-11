import type { Feature } from 'ol';
import type { ReadOptions } from 'ol/format/Feature';
import type { Options as SourceOptions } from 'ol/source/Vector';
import type { Projection as OLProjection } from 'ol/proj';

import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import type { TypeGeoviewLayerConfig, TypeMetadataGeoJSON } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { GeoJSONLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import type { VectorLayerEntryConfig, VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { Fetch } from '@/core/utils/fetch-helper';
import { logger } from '@/core/utils/logger';
import {
  LayerEntryConfigInvalidLayerEntryConfigError,
  LayerEntryConfigLayerIdNotFoundError,
} from '@/core/exceptions/layer-entry-config-exceptions';
import { GVGeoJSON } from '@/geo/layer/gv-layers/vector/gv-geojson';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import { LayerServiceMetadataUnableToFetchError } from '@/core/exceptions/layer-exceptions';
import { formatError } from '@/core/exceptions/core-exceptions';
import { EMPTY_FETCH_RESULT, GeoUtilities, type FetchWithProxyResult, type SourceFeaturesInfo } from '@/geo/utils/utilities';
import type { DisplayDateMode } from '@/api/types/map-schema-types';

export interface TypeGeoJSONLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.GEOJSON;
  listOfLayerEntryConfig: GeoJSONLayerEntryConfig[];
}

/**
 * Class used to add GeoJSON layer to the map.
 */
export class GeoJSON extends AbstractGeoViewVector {
  /**
   * Constructs a GeoJSON Layer configuration processor.
   *
   * @param layerConfig - The layer configuration
   */
  // The constructor is not useless, it narrows down the accepted parameter type.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(layerConfig: TypeGeoJSONLayerConfig) {
    super(layerConfig);
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed layer configuration specific to this layer
   */
  override getGeoviewLayerConfig(): TypeGeoJSONLayerConfig {
    return super.getGeoviewLayerConfig() as TypeGeoJSONLayerConfig;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed metadata specific to this layer
   */
  override getMetadata(): TypeMetadataGeoJSON | undefined {
    return super.getMetadata() as TypeMetadataGeoJSON | undefined;
  }

  /**
   * Overrides the way the metadata is fetched.
   *
   * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
   * @returns A promise that resolves with the fetched metadata and proxy information
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error
   */
  protected override async onFetchServiceMetadata(abortSignal?: AbortSignal): Promise<FetchWithProxyResult<unknown>> {
    try {
      // Get the metadataAccessPath if it exists
      const metadataAccessPath = this.getMetadataAccessPathIfExists();

      // If metadataAccessPath ends with .meta, .json or .geojson
      if (
        metadataAccessPath?.toLowerCase().endsWith('.meta') ||
        metadataAccessPath?.toLowerCase().endsWith('.json') ||
        metadataAccessPath?.toLowerCase().endsWith('.geojson')
      ) {
        // Fetch it and return
        return { data: await GeoJSON.fetchMetadata(metadataAccessPath, abortSignal) };
      }

      // The metadataAccessPath didn't seem like it was containing actual metadata, so it was skipped
      logger.logWarning(
        `The metadataAccessPath '${metadataAccessPath}' didn't seem like it was containing actual metadata, so it was skipped`
      );

      // None
      return EMPTY_FETCH_RESULT;
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
   */
  protected override async onInitLayerEntries(): Promise<TypeGeoviewLayerConfig> {
    // Get the folder url
    const idx = this.getMetadataAccessPath().lastIndexOf('/');
    const rootUrl = this.getMetadataAccessPath().substring(0, idx);
    const id = this.getMetadataAccessPath().substring(idx + 1);

    // Calls fetchServiceMetadata which delegates to this class's overridden onFetchServiceMetadata (may use a proxy fallback and store the proxyUrl on the instance)
    await this.fetchServiceMetadata();

    // Redirect
    return Promise.resolve(
      GeoJSON.createGeoviewLayerConfig(
        this.getGeoviewLayerId(),
        this.getGeoviewLayerName(),
        rootUrl,
        this.getGeoviewLayerConfig().isTimeAware,
        [{ id }]
      )
    );
  }

  /**
   * Overrides the validation of a layer entry config.
   *
   * @param layerConfig - The layer entry config to validate
   */
  protected override onValidateLayerEntryConfig(layerConfig: ConfigBaseClass): void {
    // Get the metadata
    const metadata = this.getMetadata();

    if (Array.isArray(metadata?.listOfLayerEntryConfig)) {
      const foundEntry = GeoJSON.#recursiveSearch(layerConfig.layerId, metadata.listOfLayerEntryConfig || []);
      if (!foundEntry) {
        // Add a layer load error
        this.addLayerLoadError(new LayerEntryConfigLayerIdNotFoundError(layerConfig), layerConfig);
      }
      return;
    }

    // Throw an invalid layer entry config error
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
   */
  protected override onProcessLayerMetadata(
    layerConfig: VectorLayerEntryConfig,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    displayDateMode: DisplayDateMode,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mapProjection?: OLProjection,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abortSignal?: AbortSignal
  ): Promise<VectorLayerEntryConfig> {
    // Get the metadata
    const metadata = this.getMetadata();

    // Process the metadata and set it on the layer config
    GeoJSON.initLayerMetadata(layerConfig, metadata);

    // Return the layer config
    return Promise.resolve(layerConfig);
  }

  /**
   * Overrides the loading of the vector features for the layer by fetching GeoJSON data and converting it
   * into OpenLayers {@link Feature} feature instances.
   *
   * @param layerConfig - The configuration object for the vector layer, containing source and data access information
   * @param sourceOptions - The OpenLayers vector source options associated with the layer
   * @param readOptions - Options controlling how features are read, including the target `featureProjection`
   * @returns A promise that resolves to an array of OpenLayers features
   */
  protected override async onCreateVectorSourceLoadFeatures(
    layerConfig: VectorLayerEntryConfig,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sourceOptions: SourceOptions<Feature>,
    readOptions: ReadOptions
  ): Promise<SourceFeaturesInfo> {
    // Cast it to proper type
    const layerConfigGeoJSON = layerConfig as GeoJSONLayerEntryConfig;

    // Read input config geojson
    const { geojson } = layerConfigGeoJSON.getSource();

    // If GeoJson is present
    let responseData;
    if (geojson) {
      // As-is
      responseData = geojson;
    } else {
      // Have to fetch it
      responseData = await AbstractGeoViewVector.fetchJson(
        layerConfigGeoJSON.getDataAccessPath(false),
        layerConfigGeoJSON.getSource().postSettings
      );
    }

    // Read the features
    return GeoUtilities.readFeaturesFromGeoJSON(responseData, readOptions.dataProjection, readOptions.featureProjection);
  }

  /**
   * Overrides the creation of the GV Layer.
   *
   * @param layerConfig - The layer entry configuration
   * @returns The GV Layer
   */
  protected override onCreateGVLayer(layerConfig: GeoJSONLayerEntryConfig): GVGeoJSON {
    // Create the source
    const source = this.createVectorSource(layerConfig);
    // Create the GV Layer
    const gvLayer = new GVGeoJSON(source, layerConfig);
    // Return it
    return gvLayer;
  }

  // #endregion OVERRIDES

  // #region STATIC PUBLIC METHODS

  /**
   * Creates a configuration object for a GeoJson Feature layer.
   *
   * This function constructs a `TypeGeoJSONLayerConfig` object that describes an GeoJson Feature layer
   * and its associated entry configurations based on the provided parameters.
   *
   * @param geoviewLayerId - A unique identifier for the GeoView layer
   * @param geoviewLayerName - The display name of the GeoView layer
   * @param metadataAccessPath - The URL or path to access metadata or feature data
   * @param isTimeAware - Indicates whether the layer supports time-based filtering
   * @param layerEntries - An array of layer entries objects to be included in the configuration
   * @returns The constructed configuration object for the GeoJson Feature layer
   */
  static createGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string | undefined,
    metadataAccessPath: string | undefined,
    isTimeAware: boolean | undefined,
    layerEntries: TypeLayerEntryShell[]
  ): TypeGeoJSONLayerConfig {
    const geoviewLayerConfig: TypeGeoJSONLayerConfig = {
      geoviewLayerId,
      geoviewLayerName,
      metadataAccessPath,
      geoviewLayerType: CONST_LAYER_TYPES.GEOJSON,
      isTimeAware,
      listOfLayerEntryConfig: [],
    };
    geoviewLayerConfig.listOfLayerEntryConfig = layerEntries.map((layerEntry) => {
      const layerEntryConfig = new GeoJSONLayerEntryConfig({
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
   * Initializes a GeoView layer configuration for a GeoJson layer.
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
    const myLayer = new GeoJSON({ geoviewLayerId, geoviewLayerName, metadataAccessPath, isTimeAware } as TypeGeoJSONLayerConfig);
    return myLayer.initGeoViewLayerEntries();
  }

  /**
   * Initializes the layer metadata by filling in the blanks with the information from the provided metadata.
   *
   * This method searches for the corresponding metadata entry in the provided metadata object based on the layer ID.
   *
   * @param layerConfig - The layer entry configuration to initialize
   * @param metadata - The metadata object containing the layer information
   */
  static initLayerMetadata(layerConfig: VectorLayerEntryConfig, metadata: TypeMetadataGeoJSON | undefined): void {
    // Search for the layer metadata
    const layerMetadataFound = GeoJSON.#recursiveSearch(
      layerConfig.layerId,
      metadata?.listOfLayerEntryConfig || []
    ) as VectorLayerEntryConfigProps;

    // If the layer metadata was found
    if (layerMetadataFound) {
      // Initialize the layer name by filling the blanks with the name from the metadata
      layerConfig.initLayerNameFromMetadata(layerMetadataFound.layerName);

      // Initialize the source by filling the blanks with the information from the metadata
      layerConfig.initSourceFromMetadata(layerMetadataFound.source);

      // Initialize the initial settings by filling the blanks with the information from the metadata
      layerConfig.initInitialSettingsFromMetadata(layerMetadataFound.initialSettings);

      // Initialize the layer style by filling the blanks with the information from the metadata
      layerConfig.initLayerStyleFromMetadata(layerMetadataFound.layerStyle);

      // Initialize the layer text by filling the blanks with the information from the metadata
      layerConfig.initLayerTextFromMetadata(layerMetadataFound.layerText);

      // Init min and max scales
      layerConfig.initMinScaleFromMetadata(layerMetadataFound.minScale);
      layerConfig.initMaxScaleFromMetadata(layerMetadataFound.maxScale);

      // Verify the data access path when comparing it to the metadata found
      layerConfig.overrideDataAccessPathFromMetadata(layerMetadataFound.source);
    }

    // Setting the layer metadata now with the updated config values. Setting the layer metadata with the config, directly, like it's done in CSV
    layerConfig.setLayerMetadata(layerConfig);
  }

  /**
   * Processes a GeoJSON GeoviewLayerConfig and returns a promise
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
   * @param layerEntries - An array of layer entry shells to include in the configuration
   * @param isTimeAware - Indicates if the layer is time aware
   * @returns A promise that resolves to an array of layer configurations
   */
  static processGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    url: string,
    layerEntries: TypeLayerEntryShell[],
    isTimeAware: boolean
  ): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = GeoJSON.createGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, url, isTimeAware, layerEntries);

    // Create the class from geoview-layers package
    const myLayer = new GeoJSON(layerConfig);

    // Process it
    return AbstractGeoViewVector.processConfig(myLayer);
  }

  /**
   * Fetches the metadata for a typical GeoJson class.
   *
   * @param url - The url to query the metadata from
   * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
   * @returns A promise that resolves to the metadata object
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal
   * @throws {ResponseError} When the response is not OK (non-2xx)
   * @throws {ResponseEmptyError} When the JSON response is empty
   */
  static fetchMetadata(url: string, abortSignal?: AbortSignal): Promise<TypeMetadataGeoJSON> {
    // Return it
    return Fetch.fetchJson<TypeMetadataGeoJSON>(url, { signal: abortSignal });
  }

  // #endregion STATIC PUBLIC METHODS

  // #region STATIC PRIVATE METHODS

  /**
   * This method is used to do a recursive search in the array of layer entry config.
   *
   * @param searchKey - The layer list to search
   * @param metadataLayerList - The layer list to search
   * @returns The found layer or undefined if not found
   */
  static #recursiveSearch(searchKey: string, metadataLayerList: TypeLayerEntryShell[]): TypeLayerEntryShell | undefined {
    for (const layerMetadata of metadataLayerList) {
      if (searchKey === layerMetadata.layerId) return layerMetadata;
      if ('isLayerGroup' in layerMetadata && (layerMetadata.isLayerGroup as boolean) && layerMetadata.listOfLayerEntryConfig) {
        const foundLayer = this.#recursiveSearch(searchKey, layerMetadata.listOfLayerEntryConfig);
        if (foundLayer) return foundLayer;
      }
    }
    return undefined;
  }

  // #endregion STATIC PRIVATE METHODS
}
