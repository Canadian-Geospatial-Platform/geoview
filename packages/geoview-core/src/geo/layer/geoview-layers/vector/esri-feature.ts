import type { Feature } from 'ol';
import type { ReadOptions } from 'ol/format/Feature';
import type { Options as SourceOptions } from 'ol/source/Vector';
import type { Projection as OLProjection } from 'ol/proj';

import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { EsriFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import type { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import type { TypeGeoviewLayerConfig, TypeMetadataEsriFeature } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';

import { EsriUtilities } from '@/geo/layer/geoview-layers/esri-layer-common';
import { LayerServiceMetadataUnableToFetchError, LayerTooManyEsriFeatures } from '@/core/exceptions/layer-exceptions';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { GVEsriFeature } from '@/geo/layer/gv-layers/vector/gv-esri-feature';
import { Fetch } from '@/core/utils/fetch-helper';
import { formatError } from '@/core/exceptions/core-exceptions';
import { GeoUtilities } from '@/geo/utils/utilities';

export interface TypeEsriFeatureLayerConfig extends TypeGeoviewLayerConfig {
  geoviewLayerType: typeof CONST_LAYER_TYPES.ESRI_FEATURE;
  listOfLayerEntryConfig: EsriFeatureLayerEntryConfig[];
}

/**
 * A class to add an EsriFeature layer.
 *
 * @exports
 * @class EsriFeature
 */
export class EsriFeature extends AbstractGeoViewVector {
  /**
   * Constructs an EsriFeature Layer configuration processor.
   * @param {TypeEsriFeatureLayerConfig} layerConfig The layer configuration.
   */
  // The constructor is not useless, it narrows down the accepted parameter type.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(layerConfig: TypeEsriFeatureLayerConfig) {
    super(layerConfig);
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeMetadataEsriFeature | undefined} The strongly-typed layer configuration specific to this layer.
   */
  override getMetadata(): TypeMetadataEsriFeature | undefined {
    return super.getMetadata() as TypeMetadataEsriFeature | undefined;
  }

  /**
   * Overrides the way the metadata is fetched.
   * Resolves with the Json object or undefined when no metadata is to be expected for a particular layer type.
   * @param {AbortSignal?} [abortSignal] - Abort signal to handle cancelling of the process.
   * @returns {Promise<T = TypeMetadataEsriFeature | undefined>} A promise with the metadata or undefined when no metadata for the particular layer type.
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
   */
  protected override async onFetchServiceMetadata<T = TypeMetadataEsriFeature | undefined>(abortSignal?: AbortSignal): Promise<T> {
    let responseJson;
    try {
      // Query
      responseJson = await Fetch.fetchJson<T>(`${this.getMetadataAccessPath()}?f=json`, { signal: abortSignal });
    } catch (error: unknown) {
      // Throw
      throw new LayerServiceMetadataUnableToFetchError(
        this.getGeoviewLayerId(),
        this.getLayerEntryNameOrGeoviewLayerName(),
        formatError(error)
      );
    }

    // Validate the metadata response
    AbstractGeoViewRaster.throwIfMetatadaHasError(this.getGeoviewLayerId(), this.getLayerEntryNameOrGeoviewLayerName(), responseJson);

    // Return it
    return responseJson as T;
  }

  /**
   * Overrides the way a geoview layer config initializes its layer entries.
   * @param {AbortSignal?} [abortSignal] - Abort signal to handle cancelling of the process.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
   */
  protected override async onInitLayerEntries(abortSignal?: AbortSignal): Promise<TypeGeoviewLayerConfig> {
    // Fetch metadata
    const metadata = await this.onFetchServiceMetadata(abortSignal);

    // If metadata was fetched successfully
    const entries = [];
    let finalUrl = this.getMetadataAccessPath();
    if (metadata) {
      // If MapServer url
      let sep = '/mapserver';
      let idx = this.getMetadataAccessPath().toLowerCase().lastIndexOf(sep);

      if (idx > 0) {
        // The layer id is in the metadata at root
        finalUrl = this.getMetadataAccessPath().substring(0, idx + sep.length);
        entries.push({
          id: Number(metadata.id),
          index: Number(metadata.id),
          layerId: Number(metadata.id),
          layerName: metadata.name,
        });
      } else {
        // If FeatureServer url, the metadata is in the first layer
        sep = '/featureserver';
        idx = this.getMetadataAccessPath().toLowerCase().lastIndexOf(sep);
        if (idx > 0) {
          // The layer metadata is in the first layer of the metadata
          const layer = metadata.layers[0];
          entries.push({
            id: layer.id,
            index: layer.id,
            layerId: layer.id,
            layerName: layer.name,
          });
        }
      }
    }

    // Redirect
    return EsriFeature.createGeoviewLayerConfig(
      this.getGeoviewLayerId(),
      this.getGeoviewLayerName(),
      finalUrl,
      this.getGeoviewLayerConfig().isTimeAware,
      entries
    );
  }

  /**
   * This method validates recursively the configuration of the layer entries to ensure that it is a feature layer identified
   * with a numeric layerId and creates a group entry when a layer is a group.
   * @param {ConfigBaseClass[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
   */
  protected override onValidateListOfLayerEntryConfig(listOfLayerEntryConfig: ConfigBaseClass[]): void {
    // Redirect and hook when a layer entry must be registered
    EsriUtilities.commonValidateListOfLayerEntryConfig(this, listOfLayerEntryConfig, (config) => {
      // Register the layer entry config
      this.emitLayerEntryRegisterInit({ config });
    });
  }

  /**
   * Overrides the way the layer metadata is processed.
   * @param {EsriFeatureLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @param {OLProjection?} [mapProjection] - The map projection.
   * @param {AbortSignal?} [abortSignal] - Abort signal to handle cancelling of the process.
   * @returns {Promise<EsriFeatureLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   * @throws {LayerTooManyEsriFeatures} When the layer has too many Esri features.
   */
  protected override onProcessLayerMetadata(
    layerConfig: EsriFeatureLayerEntryConfig,
    mapProjection?: OLProjection,
    abortSignal?: AbortSignal
  ): Promise<EsriFeatureLayerEntryConfig> {
    return EsriUtilities.commonProcessLayerMetadata(this, layerConfig, abortSignal);
  }

  /**
   * Overrides the loading of the vector features for the layer by fetching EsriFeature data and converting it
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
    // Use the basic fetch
    const responseDataCount = await Fetch.fetchEsriJson<{ count: number }>(
      `${layerConfig.getDataAccessPath(true)}${layerConfig.layerId}/query?f=json&where=1=1&returnCountOnly=true`
    );

    // Check if feature count is too large
    if (responseDataCount.count > AbstractGeoViewVector.MAX_ESRI_FEATURES) {
      // Throw
      throw new LayerTooManyEsriFeatures(layerConfig.layerId, layerConfig.getLayerNameCascade(), responseDataCount.count);
    }

    // Determine the maximum number of records allowed
    const maxRecords = layerConfig.getLayerMetadataCasted()?.maxRecordCount;

    // Retrieve the full ESRI feature data
    const responseData = await EsriFeature.#fetchEsriFeaturesByChunk(
      `${layerConfig.getDataAccessPath(true)}${layerConfig.layerId}/query?f=json&where=1=1&outfields=*&geometryPrecision=1&maxAllowableOffset=5`,
      responseDataCount.count,
      maxRecords
    );

    // Convert each ESRI response chunk to features and flatten the result
    return responseData.flatMap((json) => GeoUtilities.readFeaturesFromEsriJSON(json, readOptions));
  }

  /**
   * Overrides the creation of the GV Layer
   * @param {EsriFeatureLayerEntryConfig} layerConfig - The layer entry configuration.
   * @returns {GVEsriFeature} The GV Layer
   */
  protected override onCreateGVLayer(layerConfig: EsriFeatureLayerEntryConfig): GVEsriFeature {
    // Create the source
    const source = this.createVectorSource(layerConfig);
    // Create the GV Layer
    const gvLayer = new GVEsriFeature(source, layerConfig);
    // Return it
    return gvLayer;
  }

  // #endregion OVERRIDES

  // #region STATIC METHODS

  /**
   * Initializes a GeoView layer configuration for a Esri Feature layer.
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
    const myLayer = new EsriFeature({ geoviewLayerId, geoviewLayerName, metadataAccessPath, isTimeAware } as TypeEsriFeatureLayerConfig);
    return myLayer.initGeoViewLayerEntries();
  }

  /**
   * Creates a configuration object for an Esri Feature layer.
   * This function constructs a `TypeEsriFeatureLayerConfig` object that describes an Esri Feature layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata or feature data.
   * @param {boolean | undefined} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
   * @returns {TypeEsriFeatureLayerConfig} The constructed configuration object for the Esri Feature layer.
   * @static
   */
  static createGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean | undefined,
    layerEntries: TypeLayerEntryShell[]
  ): TypeEsriFeatureLayerConfig {
    const geoviewLayerConfig: TypeEsriFeatureLayerConfig = {
      geoviewLayerId,
      geoviewLayerName,
      metadataAccessPath,
      geoviewLayerType: CONST_LAYER_TYPES.ESRI_FEATURE,
      isTimeAware,
      listOfLayerEntryConfig: [],
    };
    geoviewLayerConfig.listOfLayerEntryConfig = layerEntries.map((layerEntry) => {
      const layerEntryConfig = new EsriFeatureLayerEntryConfig({
        geoviewLayerConfig,
        layerId: `${layerEntry.index || layerEntry.id}`,
        layerName: layerEntry.layerName,
      });
      return layerEntryConfig;
    });

    // Return it
    return geoviewLayerConfig;
  }

  /**
   * Processes an Esri Feature GeoviewLayerConfig and returns a promise
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
    layerIds: number[],
    isTimeAware: boolean
  ): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = EsriFeature.createGeoviewLayerConfig(
      geoviewLayerId,
      geoviewLayerName,
      url,
      isTimeAware,
      layerIds.map((layerId) => {
        return { id: layerId, index: layerId };
      })
    );

    // Create the class from geoview-layers package
    const myLayer = new EsriFeature(layerConfig);

    // Process it
    return AbstractGeoViewRaster.processConfig(myLayer);
  }

  /**
   * Fetches features from ESRI Feature services with query and feature limits.
   * @param {string} url - The base url for the service.
   * @param {number} featureCount - The number of features in the layer.
   * @param {number} maxRecordCount - The max features per query from the service.
   * @param {number} featureLimit - The maximum number of features to fetch per query.
   * @returns {Promise<unknown[]>} An array of the response text for the features.
   * @static
   * @private
   */
  // GV: featureLimit ideal amount varies with the service and with maxAllowableOffset.
  // TODO: Add options for featureLimit to config
  static #fetchEsriFeaturesByChunk(
    url: string,
    featureCount: number,
    maxRecordCount?: number,
    featureLimit: number = 1000
  ): Promise<unknown[]> {
    // Update url
    const featureFetchLimit = maxRecordCount && maxRecordCount < featureLimit ? maxRecordCount : featureLimit;

    // GV: Web worker does not improve the performance of this fetching
    // Create array of url's to call
    const urlArray: string[] = [];
    for (let i = 0; i < featureCount; i += featureFetchLimit) {
      urlArray.push(`${url}&resultOffset=${i}&resultRecordCount=${featureFetchLimit}`);
    }

    // Get array of all the promises
    const promises = urlArray.map((featureUrl) => Fetch.fetchEsriJson(featureUrl));

    // Return the all promise
    return Promise.all(promises);
  }

  // #endregion STATIC METHODS
}
