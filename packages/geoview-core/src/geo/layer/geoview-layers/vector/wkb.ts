import type { Feature } from 'ol';
import type { ReadOptions } from 'ol/format/Feature';
import type { Options as SourceOptions } from 'ol/source/Vector';
import type { Projection as OLProjection } from 'ol/proj';

import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import type { TypeGeoviewLayerConfig, TypeMetadataGeoJSON } from '@/api/types/layer-schema-types';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { WkbLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wkb-layer-entry-config';
import type { VectorLayerEntryConfig, VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { Fetch } from '@/core/utils/fetch-helper';
import { logger } from '@/core/utils/logger';
import {
  LayerEntryConfigInvalidLayerEntryConfigError,
  LayerEntryConfigLayerIdNotFoundError,
} from '@/core/exceptions/layer-entry-config-exceptions';
import { GVWKB } from '@/geo/layer/gv-layers/vector/gv-wkb';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import { LayerServiceMetadataUnableToFetchError } from '@/core/exceptions/layer-exceptions';
import { formatError } from '@/core/exceptions/core-exceptions';
import { GeoUtilities } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';

export interface TypeWkbLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.WKB;
  listOfLayerEntryConfig: WkbLayerEntryConfig[];
}

/**
 * Class used to add WKB layer to the map
 *
 * @exports
 * @class WKB
 */
export class WKB extends AbstractGeoViewVector {
  /**
   * Constructs a WKB Layer configuration processor.
   * @param {TypeWkbLayerConfig} layerConfig the layer configuration
   */
  // The constructor is not useless, it narrows down the accepted parameter type.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(layerConfig: TypeWkbLayerConfig) {
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
   * @param {AbortSignal?} [abortSignal] - Abort signal to handle cancelling of the process.
   * @returns {Promise<T = TypeMetadataGeoJSON | undefined>} A promise with the metadata or undefined when no metadata for the particular layer type.
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
   */
  protected override async onFetchServiceMetadata<T = TypeMetadataGeoJSON | undefined>(abortSignal?: AbortSignal): Promise<T> {
    // If metadataAccessPath ends with .meta or .json
    if (
      this.getMetadataAccessPathIfExists()?.toLowerCase().endsWith('.meta') ||
      this.getMetadataAccessPathIfExists()?.toLowerCase().endsWith('.json')
    ) {
      try {
        // Fetch it
        return (await WKB.fetchMetadata(this.getMetadataAccessPath(), abortSignal)) as T;
      } catch (error: unknown) {
        // Throw
        throw new LayerServiceMetadataUnableToFetchError(
          this.getGeoviewLayerId(),
          this.getLayerEntryNameOrGeoviewLayerName(),
          formatError(error)
        );
      }
    }

    // The metadataAccessPath didn't seem like it was containing actual metadata, so it was skipped
    logger.logWarning(
      `The metadataAccessPath '${this.getMetadataAccessPathIfExists()}' didn't seem like it was containing actual metadata, so it was skipped`
    );

    // None
    return Promise.resolve(undefined) as Promise<T>;
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
      WKB.createGeoviewLayerConfig(
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
    if (Array.isArray(this.getMetadata()?.listOfLayerEntryConfig)) {
      const foundEntry = WKB.#recursiveSearch(layerConfig.layerId, this.getMetadata()?.listOfLayerEntryConfig || []);
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
   * @param {OLProjection?} [mapProjection] - The map projection.
   * @param {AbortSignal?} [abortSignal] - Abort signal to handle cancelling of the process.
   * @returns {Promise<VectorLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override onProcessLayerMetadata(
    layerConfig: VectorLayerEntryConfig,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mapProjection?: OLProjection,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abortSignal?: AbortSignal
  ): Promise<VectorLayerEntryConfig> {
    // Get the metadata
    const metadata = this.getMetadata();

    // If metadata was previously found
    if (metadata) {
      // Search for the layer metadata
      const layerMetadataFound = WKB.#recursiveSearch(layerConfig.layerId, metadata.listOfLayerEntryConfig) as VectorLayerEntryConfigProps;

      // If the layer metadata was found
      if (layerMetadataFound) {
        // Set the layer name
        layerConfig.setLayerName(layerConfig.getLayerName() || layerMetadataFound.layerName || layerConfig.getLayerNameCascade());

        // Initialize the source by filling the blanks with the information from the metadata
        layerConfig.initSourceFromMetadata(layerMetadataFound.source);

        // Initialize the initial settings by filling the blanks with the information from the metadata
        layerConfig.initInitialSettingsFromMetadata(layerMetadataFound.initialSettings);

        // Initialize the layer style by filling the blanks with the information from the metadata
        layerConfig.initLayerStyleFromMetadata(layerMetadataFound.layerStyle);

        // Init min and max scales
        layerConfig.initMinScaleFromMetadata(layerMetadataFound.minScale);
        layerConfig.initMaxScaleFromMetadata(layerMetadataFound.maxScale);
      }
    }

    // Setting the layer metadata now with the updated config values. Setting the layer metadata with the config, directly, like it's done in CSV
    layerConfig.setLayerMetadata(layerConfig);

    // Return the layer config
    return Promise.resolve(layerConfig);
  }

  /**
   * Overrides the loading of the vector features for the layer by reading WKB data and converting it
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
    // Cast the layer config
    const layerConfigWKB = layerConfig as WkbLayerEntryConfig;

    // Is WKB format
    const responseData = layerConfig.getDataAccessPath();

    // Check if we have it in Projection and try adding it if we're missing it (should already be done?)
    await Projection.addProjectionIfMissing(layerConfig.getSource().dataProjection);

    // Read the data projection
    // eslint-disable-next-line no-param-reassign
    readOptions.dataProjection ??= layerConfig.getSource().dataProjection || 'EPSG:4326'; // default: 4326 because OpenLayers struggles to figure it out by itself for WKB here

    // If we have a feature package
    let features = [];
    if (layerConfigWKB.getSource().geoPackageFeatures?.length) {
      const { geoPackageFeatures } = layerConfigWKB.getSource();
      features = geoPackageFeatures!.map(({ geom, properties }) => {
        const feature = GeoUtilities.readFeaturesFromWKB(geom, readOptions)[0];
        if (properties) feature.setProperties(properties);
        return feature;
      });
    } else {
      // Fallback to using default read method
      features = GeoUtilities.readFeaturesFromWKB(responseData, readOptions);
    }

    // Return them
    return Promise.resolve(features);
  }

  /**
   * Overrides the creation of the GV Layer
   * @param {WkbLayerEntryConfig} layerConfig - The layer entry configuration.
   * @returns {GVWKB} The GV Layer
   */
  protected override onCreateGVLayer(layerConfig: WkbLayerEntryConfig): GVWKB {
    // Create the source
    const source = this.createVectorSource(layerConfig);
    // Create the GV Layer
    const gvLayer = new GVWKB(source, layerConfig);
    // Return it
    return gvLayer;
  }

  // #endregion OVERRIDES

  // #region STATIC METHODS

  /**
   * This method is used to do a recursive search in the array of layer entry config.
   *
   * @param {string} searchKey The layer list to search.
   * @param {TypeLayerEntryShell[]} metadataLayerList The layer list to search.
   *
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
   * Initializes a GeoView layer configuration for a WKB layer.
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
    const myLayer = new WKB({ geoviewLayerId, geoviewLayerName, metadataAccessPath, isTimeAware } as TypeWkbLayerConfig);
    return myLayer.initGeoViewLayerEntries();
  }

  /**
   * Creates a configuration object for a WKB Feature layer.
   * This function constructs a `TypeWkbLayerConfig` object that describes an WKB Feature layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata or feature data.
   * @param {boolean | undefined} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
   * @returns {TypeWkbLayerConfig} The constructed configuration object for the WKB Feature layer.
   * @static
   */
  static createGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean | undefined,
    layerEntries: TypeLayerEntryShell[]
  ): TypeWkbLayerConfig {
    const geoviewLayerConfig: TypeWkbLayerConfig = {
      geoviewLayerId,
      geoviewLayerName,
      metadataAccessPath,
      geoviewLayerType: CONST_LAYER_TYPES.WKB,
      isTimeAware,
      listOfLayerEntryConfig: [],
    };
    geoviewLayerConfig.listOfLayerEntryConfig = layerEntries.map((layerEntry) => {
      const layerEntryConfig = new WkbLayerEntryConfig({
        geoviewLayerConfig,
        schemaTag: CONST_LAYER_TYPES.WKB,
        entryType: CONST_LAYER_ENTRY_TYPES.VECTOR,
        layerId: `${layerEntry.id}`,
        layerName: `${layerEntry.layerName || layerEntry.id}`,
        source: {
          dataAccessPath: layerEntry.source?.dataAccessPath,
        },
      });
      return layerEntryConfig;
    });

    // Return it
    return geoviewLayerConfig;
  }

  /**
   * Processes a WKB GeoviewLayerConfig and returns a promise
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
    const layerConfig = WKB.createGeoviewLayerConfig(
      geoviewLayerId,
      geoviewLayerName,
      url,
      isTimeAware,
      layerIds.map((layerId) => {
        return { id: layerId };
      })
    );

    // Create the class from geoview-layers package
    const myLayer = new WKB(layerConfig);

    // Process it
    return AbstractGeoViewVector.processConfig(myLayer);
  }

  // #endregion STATIC METHODS
}
