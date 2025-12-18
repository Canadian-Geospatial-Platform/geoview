import type { Feature } from 'ol';
import type { ReadOptions } from 'ol/format/Feature';
import type { Options as SourceOptions } from 'ol/source/Vector';

import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import type { TypeOutfields } from '@/api/types/map-schema-types';
import type {
  TypeGeoviewLayerConfig,
  TypeMetadataOGCFeature,
  TypeLayerMetadataQueryables,
  TypeLayerMetadataOGC,
} from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { Projection } from '@/geo/utils/projection';
import { OgcFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';
import type { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import { Fetch } from '@/core/utils/fetch-helper';
import {
  LayerEntryConfigInvalidLayerEntryConfigError,
  LayerEntryConfigLayerIdNotFoundError,
} from '@/core/exceptions/layer-entry-config-exceptions';
import { GVOGCFeature } from '@/geo/layer/gv-layers/vector/gv-ogc-feature';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import { LayerServiceMetadataUnableToFetchError } from '@/core/exceptions/layer-exceptions';
import { formatError } from '@/core/exceptions/core-exceptions';
import { GeoUtilities } from '@/geo/utils/utilities';

export interface TypeOgcFeatureLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig' | 'geoviewLayerType'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.OGC_FEATURE;
  listOfLayerEntryConfig: OgcFeatureLayerEntryConfig[];
}

/**
 * A class to add OGC api feature layer.
 *
 * @exports
 * @class OgcFeature
 */
export class OgcFeature extends AbstractGeoViewVector {
  /**
   * Constructs a OgcFeature Layer configuration processor.
   * @param {TypeOgcFeatureLayerConfig} layerConfig the layer configuration
   */
  // The constructor is not useless, it narrows down the accepted parameter type.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(layerConfig: TypeOgcFeatureLayerConfig) {
    super(layerConfig);
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeMetadataOGCFeature | undefined} The strongly-typed layer configuration specific to this layer.
   */
  override getMetadata(): TypeMetadataOGCFeature | undefined {
    return super.getMetadata() as TypeMetadataOGCFeature | undefined;
  }

  /**
   * Overrides the way the metadata is fetched.
   * Resolves with the Json object or undefined when no metadata is to be expected for a particular layer type.
   * @param {AbortSignal | undefined} [abortSignal] - Abort signal to handle cancelling of fetch.
   * @returns {Promise<T = TypeMetadataOGCFeature>} A promise with the metadata or undefined when no metadata for the particular layer type.
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
   */
  protected override async onFetchServiceMetadata<T = TypeMetadataOGCFeature>(abortSignal?: AbortSignal): Promise<T> {
    try {
      // Fetch it
      return (await OgcFeature.fetchMetadata(this.getMetadataAccessPath(), abortSignal)) as T;
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
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
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
      // Fetch the metadata
      const metadata = await this.onFetchServiceMetadata();

      // Now that we have metadata
      entries = metadata.collections.map((collection) => {
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
   * @param {ConfigBaseClass} layerConfig - The layer entry config to validate.
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

      // If found description, replace the name
      if (foundCollection.description) layerConfig.setLayerName(foundCollection.description);

      // Validate and update the extent initial settings
      layerConfig.validateUpdateInitialSettingsExtent();

      // If no bounds defined in the initial settings and an extent is defined in the metadata
      if (!layerConfig.getInitialSettings().bounds && foundCollection.extent?.spatial?.bbox && foundCollection.extent?.spatial?.crs) {
        const latlonExtent = Projection.transformExtentFromProj(
          foundCollection.extent.spatial.bbox[0],
          Projection.getProjectionFromString(foundCollection.extent.spatial.crs),
          Projection.getProjectionLonLat()
        );

        // Update the bounds initial settings
        layerConfig.updateInitialSettings({ bounds: latlonExtent });
      }

      // Validate and update the bounds initial settings
      layerConfig.validateUpdateInitialSettingsBounds();
      return;
    }

    // Failed
    throw new LayerEntryConfigInvalidLayerEntryConfigError(layerConfig);
  }

  /**
   * Overrides the way the layer metadata is processed.
   * @param {VectorLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @param {AbortSignal | undefined} [abortSignal] - Abort signal to handle cancelling of fetch.
   * @returns {Promise<VectorLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override async onProcessLayerMetadata(
    layerConfig: VectorLayerEntryConfig,
    abortSignal?: AbortSignal
  ): Promise<VectorLayerEntryConfig> {
    const metadataUrl = this.getMetadataAccessPath();
    if (metadataUrl) {
      const queryUrl = metadataUrl.endsWith('/')
        ? `${metadataUrl}collections/${layerConfig.layerId}/queryables?f=json`
        : `${metadataUrl}/collections/${layerConfig.layerId}/queryables?f=json`;
      const queryResultData = await Fetch.fetchJson<TypeLayerMetadataQueryables>(queryUrl, { signal: abortSignal });
      if (queryResultData.properties) {
        layerConfig.setLayerMetadata(queryResultData.properties);
        OgcFeature.#processFeatureInfoConfig(queryResultData.properties, layerConfig);
      }
    }

    // Return the layer config
    return layerConfig;
  }

  /**
   * Overrides the loading of the vector features for the layer by fetching OGC Feature data and converting it
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
    // Query
    const responseData = await Fetch.fetchJson(`${layerConfig.getDataAccessPath(true)}collections/${layerConfig.layerId}/items?f=json`);

    // Read the EPSG from the data
    const dataEPSG = GeoUtilities.readEPSGOfGeoJSON(responseData);

    // Check if we have it in Projection and try adding it if we're missing it
    await Projection.addProjectionIfMissing(dataEPSG);

    // Read the features
    return GeoUtilities.readFeaturesFromGeoJSON(responseData, readOptions);
  }

  /**
   * Overrides the creation of the GV Layer
   * @param {OgcFeatureLayerEntryConfig} layerConfig - The layer entry configuration.
   * @returns {GVOGCFeature} The GV Layer
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

  // #region STATIC METHODS

  /**
   * This method sets the outfields and aliasFields of the source feature info.
   *
   * @param {TypeLayerMetadataOGC} fields An array of field names and its aliases.
   * @param {VectorLayerEntryConfig} layerConfig The vector layer entry to configure.
   * @static
   * @private
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

        let fieldType = 'string';
        if (fieldEntry.type === 'date') fieldType = 'date';
        else if (['bigint', 'number'].includes(typeof fieldEntry)) fieldType = 'number';

        const newOutfield: TypeOutfields = {
          name: fieldEntryKey,
          alias: fieldEntryKey,
          type: fieldType as 'string' | 'number' | 'date',
          domain: null,
        };
        outfields!.push(newOutfield);
      });

      // Set it
      layerConfig.setOutfields(outfields);
    }

    // Initialize the aliases
    layerConfig.initOutfieldsAliases();

    // Initialize the name field
    layerConfig.initNameField(outfields?.[0]?.name);
  }

  /**
   * Fetches the metadata for a typical OGCFeature class.
   * @param {string} url - The url to query the metadata from.
   * @param {AbortSignal | undefined} [abortSignal] - Abort signal to handle cancelling of fetch.
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
   * @throws {ResponseError} When the response is not OK (non-2xx).
   * @throws {ResponseEmptyError} When the JSON response is empty.
   * @static
   */
  static fetchMetadata(url: string, abortSignal?: AbortSignal): Promise<TypeMetadataOGCFeature> {
    // The url
    const queryUrl = url.endsWith('/') ? `${url}collections?f=json` : `${url}/collections?f=json`;

    // Set it
    return Fetch.fetchJson<TypeMetadataOGCFeature>(queryUrl, { signal: abortSignal });
  }

  /**
   * Initializes a GeoView layer configuration for an OGC Feature layer.
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
    const myLayer = new OgcFeature({ geoviewLayerId, geoviewLayerName, metadataAccessPath, isTimeAware } as TypeOgcFeatureLayerConfig);
    return myLayer.onInitLayerEntries();
  }

  /**
   * Creates a configuration object for an OGC Feature layer.
   * This function constructs a `TypeOgcFeatureLayerConfig` object that describes an OGC Feature layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata or feature data.
   * @param {boolean | undefined} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
   * @returns {TypeOgcFeatureLayerConfig} The constructed configuration object for the OGC Feature layer.
   * @static
   */
  static createGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
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
      const layerEntryConfig = new OgcFeatureLayerEntryConfig({
        geoviewLayerConfig,
        layerId: `${layerEntry.id}`,
        layerName: layerEntry.layerName || `${layerEntry.id}`,
      });
      return layerEntryConfig;
    });

    // Return it
    return geoviewLayerConfig;
  }

  /**
   * Processes an OGC Feature GeoviewLayerConfig and returns a promise
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
    const layerConfig = OgcFeature.createGeoviewLayerConfig(
      geoviewLayerId,
      geoviewLayerName,
      url,
      isTimeAware,
      layerIds.map((layerId) => {
        return { id: layerId };
      })
    );

    // Create the class from geoview-layers package
    const myLayer = new OgcFeature(layerConfig);

    // Process it
    return AbstractGeoViewVector.processConfig(myLayer);
  }

  // #endregion STATIC METHODS
}
