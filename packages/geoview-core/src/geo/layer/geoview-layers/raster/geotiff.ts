import type { Options as SourceOptions } from 'ol/source/GeoTIFF';
import GeoTIFFSource from 'ol/source/GeoTIFF';

import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import type { TypeGeoviewLayerConfig, TypeMetadataGeoTIFF } from '@/api/types/layer-schema-types';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';

import { GeoTIFFLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/geotiff-layer-entry-config';

import { GVGeoTIFF } from '@/geo/layer/gv-layers/tile/gv-geotiff';
import { logger } from '@/core/utils/logger';
import { Projection, type TypeProjection } from '@/geo/utils/projection';
import { generateId } from '@/core/utils/utilities';
import { Fetch } from '@/core/utils/fetch-helper';

export interface TypeGeoTIFFLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.GEOTIFF;
  listOfLayerEntryConfig: GeoTIFFLayerEntryConfig[];
}

/**
 * A class to add GeoTIFF layer.
 * @exports
 * @class GeoTIFF
 */
export class GeoTIFF extends AbstractGeoViewRaster {
  /**
   * Constructs a GeoTIFF Layer configuration processor.
   * @param {TypeGeoTIFFLayerConfig} layerConfig the layer configuration
   */
  // The constructor is not useless, it narrows down the accepted parameter type.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(layerConfig: TypeGeoTIFFLayerConfig) {
    super(layerConfig);
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeMetadataGeoTIFF | undefined} The strongly-typed layer configuration specific to this layer.
   */
  override getMetadata(): TypeMetadataGeoTIFF | undefined {
    return super.getMetadata() as TypeMetadataGeoTIFF | undefined;
  }

  /**
   * Overrides the way the metadata is fetched.
   * Resolves with the Json object or undefined when no metadata is to be expected for a particular layer type.
   * @param {AbortSignal | undefined} [abortSignal] - Abort signal to handle cancelling of fetch.
   * @returns {Promise<T = TypeMetadataGeoTIFF | undefined>} A promise with the metadata or undefined when no metadata for the particular layer type.
   * @throws {LayerServiceMetadataUnableToFetchError} Error thrown when the metadata fetch fails or contains an error.
   */
  protected override async onFetchServiceMetadata<T = TypeMetadataGeoTIFF | undefined>(abortSignal?: AbortSignal): Promise<T> {
    // If metadataAccessPath does not point to a .tif file, we try to fetch metadata
    const metadataAccessPath = this.getMetadataAccessPath();

    try {
      // GV: This is currently only for datacube sources that provide a JSON metadata file
      if (metadataAccessPath && !metadataAccessPath.endsWith('.tif')) {
        const url = metadataAccessPath.endsWith('/') ? metadataAccessPath.slice(0, -1) : metadataAccessPath;

        // Fetch it
        return (await Fetch.fetchJson<T>(url, { signal: abortSignal })) as T;
      }

      // The metadataAccessPath didn't seem like it was containing actual metadata, so it was skipped
      logger.logWarning(
        `The metadataAccessPath '${metadataAccessPath}' didn't seem like it was containing actual metadata, so it was skipped`
      );

      // None
      return Promise.resolve(undefined) as Promise<T>;
    } catch (error: unknown) {
      // Error likely means there is no metadata to fetch
      logger.logWarning(
        `The metadataAccessPath '${metadataAccessPath}' didn't seem like it was containing actual metadata, so it was skipped. Error: ${error}`
      );
      return Promise.resolve(undefined) as Promise<T>;
    }
  }

  /**
   * Overrides the way a geoview layer config initializes its layer entries.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
   */
  protected override onInitLayerEntries(): Promise<TypeGeoviewLayerConfig> {
    // Redirect
    return Promise.resolve(
      GeoTIFF.createGeoviewLayerConfig(
        this.getGeoviewLayerId(),
        this.getGeoviewLayerName(),
        this.getMetadataAccessPathIfExists(),
        this.getGeoviewLayerConfig().isTimeAware,
        []
      )
    );
  }

  /**
   * Overrides the way the layer metadata is processed.
   * @param {GeoTIFFLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @returns {Promise<GeoTIFFLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override onProcessLayerMetadata(layerConfig: GeoTIFFLayerEntryConfig): Promise<GeoTIFFLayerEntryConfig> {
    const metadata = this.getMetadata();
    if (metadata) {
      // Set the metadata
      layerConfig.setServiceMetadata(metadata);

      // If the data access path points to the layerId, and there's a classification asset, use that as data access path
      if (
        layerConfig.hasDataAccessPath() &&
        layerConfig.getDataAccessPath().endsWith(layerConfig.layerId) &&
        layerConfig.getDataAccessPath().startsWith(this.getMetadataAccessPath()) &&
        metadata.assets?.[layerConfig.layerId]?.href
      ) {
        // Update the data access path
        layerConfig.setDataAccessPath(metadata.assets[layerConfig.layerId].href);
      }
    }

    return Promise.resolve(layerConfig);
  }

  /**
   * Overrides the creation of the GV Layer
   * @param {GeoTIFFLayerEntryConfig} layerConfig - The layer entry configuration.
   * @returns {GVGeoTIFF} The GV Layer
   */
  protected override onCreateGVLayer(layerConfig: GeoTIFFLayerEntryConfig): GVGeoTIFF {
    // Create the source
    const source = GeoTIFF.createGeoTIFFSource(layerConfig);

    // Create the GV Layer with WebGL layer
    const gvLayer = new GVGeoTIFF(source, layerConfig);

    // Setup async initialization monitoring (don't await here)
    void GeoTIFF.#initializeSourceProjection(source, layerConfig);

    // Return the layer immediately
    return gvLayer;
  }

  // #endregion OVERRIDES

  // #region STATIC METHODS

  /**
   * Creates a GeoTIFF source from a layer config.
   * @param {GeoTIFFLayerEntryConfig} layerConfig - The configuration for the GeoTIFF layer.
   * @returns A fully configured GeoTIFF source.
   * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
   * @static
   */
  static createGeoTIFFSource(layerConfig: GeoTIFFLayerEntryConfig): GeoTIFFSource {
    const sourceOptions: SourceOptions = {
      sources: [{ url: layerConfig.getDataAccessPath(), overviews: layerConfig.source.overviews }],
    };

    return new GeoTIFFSource(sourceOptions);
  }

  /**
   * Initializes monitoring for the GeoTIFF source (async)
   * @param {GeoTIFFSource} source - The GeoTIFF source
   * @param {GeoTIFFLayerEntryConfig} layerConfig - The layer config
   * @static
   * @private
   */
  static async #initializeSourceProjection(source: GeoTIFFSource, layerConfig: GeoTIFFLayerEntryConfig): Promise<void> {
    try {
      const srcView = await source.getView();
      const { projection } = srcView;
      const projectionObject: TypeProjection = projection ? { wkid: Projection.readEPSGNumber(projection)! } : { wkid: 4326 };

      // Add projection definition if not already included
      await Projection.addProjectionIfMissing(projectionObject);
    } catch (error) {
      logger.logError('Failed to initialize GeoTIFF source:', {
        layerId: layerConfig.layerId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  /**
   * Initializes a GeoView layer configuration for a GeoTIFF layer.
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
    const myLayer = new GeoTIFF({
      geoviewLayerId,
      geoviewLayerName:
        geoviewLayerName === 'tempoName' || !geoviewLayerName ? metadataAccessPath.split('/').pop()?.split('.')[0] : geoviewLayerName,
      metadataAccessPath,
      isTimeAware,
    } as TypeGeoTIFFLayerConfig);
    return myLayer.initGeoViewLayerEntries();
  }

  /**
   * Creates a configuration object for a GeoTIFF layer.
   * This function constructs a `TypeGeoTIFFConfig` object that describes an GeoTIFF layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string | undefined} metadataAccessPath - The URL or path to access metadata.
   * @param {boolean | undefined} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
   * @returns {TypeGeoTIFFConfig} The constructed configuration object for the GeoTIFF layer.
   * @static
   */
  static createGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string | undefined,
    isTimeAware: boolean | undefined,
    layerEntries: TypeLayerEntryShell[]
  ): TypeGeoTIFFLayerConfig {
    const geoviewLayerConfig: TypeGeoTIFFLayerConfig = {
      geoviewLayerId,
      geoviewLayerName,
      metadataAccessPath,
      geoviewLayerType: CONST_LAYER_TYPES.GEOTIFF,
      isTimeAware,
      listOfLayerEntryConfig: [],
    };
    if (layerEntries.length)
      geoviewLayerConfig.listOfLayerEntryConfig = layerEntries.map((layerEntry) => {
        const layerEntryConfig = new GeoTIFFLayerEntryConfig({
          geoviewLayerConfig,
          schemaTag: CONST_LAYER_TYPES.GEOTIFF,
          entryType: CONST_LAYER_ENTRY_TYPES.RASTER_TILE,
          layerId: `${layerEntry.id}`,
          layerName: `${layerEntry.layerName || layerEntry.id}`,
        });
        return layerEntryConfig;
      });
    else
      geoviewLayerConfig.listOfLayerEntryConfig = [
        new GeoTIFFLayerEntryConfig({
          geoviewLayerConfig,
          schemaTag: CONST_LAYER_TYPES.GEOTIFF,
          entryType: CONST_LAYER_ENTRY_TYPES.RASTER_TILE,
          layerId: metadataAccessPath?.split('/').pop() || generateId(18),
          layerName: geoviewLayerName,
        }),
      ];

    // Return it
    return geoviewLayerConfig;
  }

  /**
   * Processes a GeoTIFF GeoviewLayerConfig and returns a promise
   * that resolves to an array of `ConfigBaseClass` layer entry configurations.
   *
   * This method:
   * 1. Creates a Geoview layer configuration using the provided parameters.
   * 2. Instantiates a layer with that configuration.
   * 3. Processes the layer configuration and returns the result.
   * @param {string} geoviewLayerId - The unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name for the GeoView layer.
   * @param {string} url - The URL of the service endpoint.
   * @param {boolean} isTimeAware - Indicates if the layer is time aware.
   * @param {string[]} layerIds - An array of layer IDs to include in the configuration.
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
    const layerConfig = GeoTIFF.createGeoviewLayerConfig(
      geoviewLayerId,
      geoviewLayerName,
      url,
      isTimeAware,
      layerIds.map((layerId) => {
        return { id: layerId };
      })
    );

    // Create the class from geoview-layers package
    const myLayer = new GeoTIFF(layerConfig);

    // Process it
    return AbstractGeoViewLayer.processConfig(myLayer);
  }

  // #endregion STATIC METHODS
}
