import type { Vector as VectorSource } from 'ol/source';
import type { Options as SourceOptions } from 'ol/source/Vector';
import { EsriJSON } from 'ol/format';
import type Feature from 'ol/Feature';

import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { EsriFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import type { TypeGeoviewLayerConfig, TypeMetadataEsriFeature } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';

import { EsriUtilities } from '@/geo/layer/geoview-layers/esri-layer-common';
import { LayerServiceMetadataUnableToFetchError } from '@/core/exceptions/layer-exceptions';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { GVEsriFeature } from '@/geo/layer/gv-layers/vector/gv-esri-feature';
import { Fetch } from '@/core/utils/fetch-helper';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import { formatError } from '@/core/exceptions/core-exceptions';

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
   * @param {AbortSignal | undefined} [abortSignal] - Abort signal to handle cancelling of fetch.
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
   * @param {AbortSignal | undefined} [abortSignal] - Abort signal to handle cancelling of fetch.
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
   * @param {AbortSignal | undefined} [abortSignal] - Abort signal to handle cancelling of fetch.
   * @returns {Promise<EsriFeatureLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override onProcessLayerMetadata(
    layerConfig: EsriFeatureLayerEntryConfig,
    abortSignal?: AbortSignal
  ): Promise<EsriFeatureLayerEntryConfig> {
    return EsriUtilities.commonProcessLayerMetadata(this, layerConfig, abortSignal);
  }

  /**
   * Overrides the creation of the source configuration for the vector layer.
   * @param {EsriFeatureLayerEntryConfig} layerConfig - The layer entry configuration.
   * @param {SourceOptions} sourceOptions - The source options.
   * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
   * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
   */
  protected override onCreateVectorSource(
    layerConfig: EsriFeatureLayerEntryConfig,
    sourceOptions: SourceOptions<Feature>
  ): VectorSource<Feature> {
    // eslint-disable-next-line no-param-reassign
    sourceOptions.url = `${layerConfig.getDataAccessPath(true)}${layerConfig.layerId}/query?f=json&where=1=1&returnCountOnly=true`;
    // eslint-disable-next-line no-param-reassign
    sourceOptions.format = new EsriJSON();

    // Call parent
    return super.onCreateVectorSource(layerConfig, sourceOptions);
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

  // #endregion STATIC METHODS
}
