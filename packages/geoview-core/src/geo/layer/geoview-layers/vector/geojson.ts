import type { Options as SourceOptions } from 'ol/source/Vector';
import { GeoJSON as FormatGeoJSON } from 'ol/format';
import type { Vector as VectorSource } from 'ol/source';
import type Feature from 'ol/Feature';

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
import { deepMerge } from '@/core/utils/utilities';

export interface TypeGeoJSONLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.GEOJSON;
  listOfLayerEntryConfig: GeoJSONLayerEntryConfig[];
}

/**
 * Class used to add GeoJSON layer to the map
 *
 * @exports
 * @class GeoJSON
 */
export class GeoJSON extends AbstractGeoViewVector {
  /**
   * Constructs a GeoJSON Layer configuration processor.
   * @param {TypeGeoJSONLayerConfig} layerConfig the layer configuration
   */
  // The constructor is not useless, it narrows down the accepted parameter type.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(layerConfig: TypeGeoJSONLayerConfig) {
    super(layerConfig);
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeMetadataGeoJSON | undefined} The strongly-typed layer configuration specific to this layer.
   */
  override getMetadata(): TypeMetadataGeoJSON | undefined {
    return super.getMetadata() as TypeMetadataGeoJSON | undefined;
  }

  /**
   * Overrides the way the metadata is fetched.
   * Resolves with the Json object or undefined when no metadata is to be expected for a particular layer type.
   * @param {AbortSignal | undefined} [abortSignal] - Abort signal to handle cancelling of fetch.
   * @returns {Promise<T = TypeMetadataGeoJSON | undefined>} A promise with the metadata or undefined when no metadata for the particular layer type.
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
   */
  protected override async onFetchServiceMetadata<T = TypeMetadataGeoJSON | undefined>(abortSignal?: AbortSignal): Promise<T> {
    try {
      // If metadataAccessPath ends with .meta, .json or .geojson
      if (
        this.getMetadataAccessPathIfExists()?.toLowerCase().endsWith('.meta') ||
        this.getMetadataAccessPathIfExists()?.toLowerCase().endsWith('.json') ||
        this.getMetadataAccessPathIfExists()?.toLowerCase().endsWith('.geojson')
      ) {
        // Fetch it
        return (await GeoJSON.fetchMetadata(this.getMetadataAccessPath(), abortSignal)) as T;
      }

      // The metadataAccessPath didn't seem like it was containing actual metadata, so it was skipped
      logger.logWarning(
        `The metadataAccessPath '${this.getMetadataAccessPathIfExists()}' didn't seem like it was containing actual metadata, so it was skipped`
      );

      // None
      return Promise.resolve(undefined) as Promise<T>;
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
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
   */
  protected override async onInitLayerEntries(): Promise<TypeGeoviewLayerConfig> {
    // Get the folder url
    const idx = this.getMetadataAccessPath().lastIndexOf('/');
    const rootUrl = this.getMetadataAccessPath().substring(0, idx);
    const id = this.getMetadataAccessPath().substring(idx + 1);

    // Attempt a fetch of the metadata
    await this.onFetchServiceMetadata();

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
   * @param {ConfigBaseClass} layerConfig - The layer entry config to validate.
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
   * @param {VectorLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @returns {Promise<VectorLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override onProcessLayerMetadata(layerConfig: VectorLayerEntryConfig): Promise<VectorLayerEntryConfig> {
    // Get the metadata
    const metadata = this.getMetadata();

    // If metadata was previously found
    if (metadata) {
      // Search for the layer metadata
      const layerMetadataFound = GeoJSON.#recursiveSearch(
        layerConfig.layerId,
        metadata.listOfLayerEntryConfig
      ) as VectorLayerEntryConfigProps;

      // If the layer metadata was found
      if (layerMetadataFound) {
        // If no name
        if (!layerConfig.getLayerName()) layerConfig.setLayerName(layerMetadataFound.layerName || layerConfig.getLayerNameCascade());

        // eslint-disable-next-line no-param-reassign
        layerConfig.source = deepMerge(layerMetadataFound.source, layerConfig.source);

        // Set the initial settings
        layerConfig.setInitialSettings(deepMerge(layerMetadataFound.initialSettings, layerConfig.getInitialSettings()));

        // Set the layer style
        layerConfig.setLayerStyle(deepMerge(layerMetadataFound.layerStyle, layerConfig.getLayerStyle()!));

        // If max scale found in metadata
        if (layerMetadataFound.maxScale) {
          layerConfig.setMaxScale(Math.min(layerConfig.getMaxScale() || Infinity, layerMetadataFound.maxScale));
        }

        // If min scale found in metadata
        if (layerMetadataFound.minScale) {
          layerConfig.setMinScale(Math.max(layerConfig.getMinScale() || 0, layerMetadataFound.minScale));
        }

        // Verify the data access path when comparing it to the metadata found
        layerConfig.verifyDataAccessPath(layerMetadataFound.source);
      }

      // Validate and update the extent initial settings
      layerConfig.validateUpdateInitialSettingsExtent();
    }

    // Setting the layer metadata now with the updated config values. Setting the layer metadata with the config, directly, like it's done in CSV
    layerConfig.setLayerMetadata(layerConfig);

    // Return the layer config
    return Promise.resolve(layerConfig);
  }

  /**
   * Overrides the creation of the source configuration for the vector layer.
   * @param {VectorLayerEntryConfig} layerConfig - The layer entry configuration.
   * @param {SourceOptions} sourceOptions - The source options.
   * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
   * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
   */
  protected override onCreateVectorSource(
    layerConfig: VectorLayerEntryConfig,
    sourceOptions: SourceOptions<Feature>
  ): VectorSource<Feature> {
    // eslint-disable-next-line no-param-reassign
    sourceOptions.url = layerConfig.getDataAccessPath();
    // eslint-disable-next-line no-param-reassign
    sourceOptions.format = new FormatGeoJSON();

    // Call parent
    return super.onCreateVectorSource(layerConfig, sourceOptions);
  }

  /**
   * Overrides the creation of the GV Layer
   * @param {GeoJSONLayerEntryConfig} layerConfig - The layer entry configuration.
   * @returns {GVGeoJSON} The GV Layer
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

  // #region STATIC METHODS

  /**
   * This method is used to do a recursive search in the array of layer entry config.
   * @param {string} searchKey The layer list to search.
   * @param {TypeLayerEntryShell[]} metadataLayerList The layer list to search.
   * @returns {TypeLayerEntryShell | undefined} The found layer or undefined if not found.
   * @private
   * @static
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

  /**
   * Fetches the metadata for a typical GeoJson class.
   * @param {AbortSignal | undefined} [abortSignal] - Abort signal to handle cancelling of fetch.
   * @param {string} url - The url to query the metadata from.
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
   * @throws {ResponseError} When the response is not OK (non-2xx).
   * @throws {ResponseEmptyError} When the JSON response is empty.
   * @static
   */
  static fetchMetadata(url: string, abortSignal?: AbortSignal): Promise<TypeMetadataGeoJSON> {
    // Return it
    return Fetch.fetchJson<TypeMetadataGeoJSON>(url, { signal: abortSignal });
  }

  /**
   * Initializes a GeoView layer configuration for a GeoJson layer.
   * This method creates a basic TypeGeoviewLayerConfig using the provided
   * ID, name, and metadata access path URL. It then initializes the layer entries by calling
   * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
   * @param {string} geoviewLayerId - A unique identifier for the layer.
   * @param {string} geoviewLayerName - The display name of the layer.
   * @param {string} metadataAccessPath - The full service URL to the layer endpoint.
   * @param {boolean | undefined} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise that resolves to an initialized GeoView layer configuration with layer entries.
   * @static
   */
  static initGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean | undefined
  ): Promise<TypeGeoviewLayerConfig> {
    // Create the Layer config
    const myLayer = new GeoJSON({ geoviewLayerId, geoviewLayerName, metadataAccessPath, isTimeAware } as TypeGeoJSONLayerConfig);
    return myLayer.initGeoViewLayerEntries();
  }

  /**
   * Creates a configuration object for a GeoJson Feature layer.
   * This function constructs a `TypeGeoJSONLayerConfig` object that describes an GeoJson Feature layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string | undefined} metadataAccessPath - The URL or path to access metadata or feature data.
   * @param {boolean | undefined} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
   * @returns {TypeGeoJSONLayerConfig} The constructed configuration object for the GeoJson Feature layer.
   * @static
   */
  static createGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
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
        layerName: layerEntry.layerName || (layerEntries.length === 1 ? geoviewLayerName : `${layerEntry.id}`),
      });
      return layerEntryConfig;
    });

    // Return it
    return geoviewLayerConfig;
  }

  /**
   * Processes a GeoJSON GeoviewLayerConfig and returns a promise
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
    isTimeAware: boolean
  ): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = GeoJSON.createGeoviewLayerConfig(
      geoviewLayerId,
      geoviewLayerName,
      url,
      isTimeAware,
      layerIds.map((layerId) => {
        return { id: layerId };
      })
    );

    // Create the class from geoview-layers package
    const myLayer = new GeoJSON(layerConfig);

    // Process it
    return AbstractGeoViewVector.processConfig(myLayer);
  }

  // #endregion STATIC METHODS
}
