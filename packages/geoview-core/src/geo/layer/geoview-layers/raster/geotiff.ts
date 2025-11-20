import type { Options as SourceOptions } from 'ol/source/GeoTIFF';
import GeoTIFFSource from 'ol/source/GeoTIFF';

import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import type { TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';

import { GeoTIFFLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/geotiff-layer-entry-config';

import { GVGeoTIFF } from '@/geo/layer/gv-layers/tile/gv-geotiff';
import { logger } from '@/core/utils/logger';
import { Projection, type TypeProjection } from '@/geo/utils/projection';
import { generateId } from '@/core/utils/utilities';

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

  /**
   * Overrides the way the metadata is fetched.
   * Resolves with the Json object or undefined when no metadata is to be expected for a particular layer type.
   * @returns {Promise<T>} A promise with the metadata or undefined when no metadata for the particular layer type.
   */
  protected override onFetchServiceMetadata<T>(): Promise<T> {
    // No metadata
    return Promise.resolve(undefined as T);
  }

  /**
   * Overrides the way a geoview layer config initializes its layer entries.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
   */
  protected override onInitLayerEntries(): Promise<TypeGeoviewLayerConfig> {
    // Redirect
    return Promise.resolve(
      // TODO: Check - Config init - Check if there's a way to better determine the isTimeAware flag, defaults to false, how is it used here?
      GeoTIFF.createGeoviewLayerConfig(this.geoviewLayerId, this.geoviewLayerName, this.metadataAccessPath, false, [])
    );
  }

  /**
   * Overrides the way the layer metadata is processed.
   * @param {GeoTIFFLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @returns {Promise<GeoTIFFLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override onProcessLayerMetadata(layerConfig: GeoTIFFLayerEntryConfig): Promise<GeoTIFFLayerEntryConfig> {
    // Return as-is
    return Promise.resolve(layerConfig);
  }

  /**
   * Creates a GeoTIFF source from a layer config.
   * @param {GeoTIFFLayerEntryConfig} layerConfig - The configuration for the GeoTIFF layer.
   * @returns A fully configured GeoTIFF source.
   * @throws If required config fields like dataAccessPath are missing.
   */
  static createGeoTIFFSource(layerConfig: GeoTIFFLayerEntryConfig): GeoTIFFSource {
    const sourceOptions: SourceOptions = {
      sources: [{ url: layerConfig.getDataAccessPath(), overviews: layerConfig.source.overviews }],
    };

    return new GeoTIFFSource(sourceOptions);
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

  /**
   * Initializes monitoring for the GeoTIFF source (async)
   * @param {GeoTIFFSource} source - The GeoTIFF source
   * @param {GeoTIFFLayerEntryConfig} layerConfig - The layer config
   * @private
   */
  static async #initializeSourceProjection(source: GeoTIFFSource, layerConfig: GeoTIFFLayerEntryConfig): Promise<void> {
    try {
      const srcView = await source.getView();
      const projection = typeof srcView?.projection === 'string' ? srcView.projection : srcView?.projection?.getCode();

      // TODO: Check this call, unsure if the type is right, here projection is a string like 'EPSG:4326', calling Number() in that will make a NaN value

      const projectionObject: TypeProjection = projection ? { wkid: Number(projection) } : { wkid: 4326 };

      // Add projection definition if not already included
      await Projection.addProjectionIfMissingUsingObj(projectionObject);
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
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise that resolves to an initialized GeoView layer configuration with layer entries.
   */
  static initGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string
  ): Promise<TypeGeoviewLayerConfig> {
    // Create the Layer config
    const myLayer = new GeoTIFF({
      geoviewLayerId,
      geoviewLayerName:
        geoviewLayerName === 'tempoName' || !geoviewLayerName ? metadataAccessPath.split('/').pop()?.split('.')[0] : geoviewLayerName,
      metadataAccessPath,
    } as TypeGeoTIFFLayerConfig);
    return myLayer.initGeoViewLayerEntries();
  }

  /**
   * Creates a configuration object for a GeoTIFF layer.
   * This function constructs a `TypeGeoTIFFConfig` object that describes an GeoTIFF layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata.
   * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
   * @returns {TypeGeoTIFFConfig} The constructed configuration object for the GeoTIFF layer.
   */
  static createGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean,
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
          source: {
            dataAccessPath: metadataAccessPath, // TODO: Check - Maybe remove this source.dataAccessPath assignation from here and let the process take care of setting it (as it should do)?
          },
        });
        return layerEntryConfig;
      });
    else
      geoviewLayerConfig.listOfLayerEntryConfig = [
        new GeoTIFFLayerEntryConfig({
          geoviewLayerConfig,
          schemaTag: CONST_LAYER_TYPES.GEOTIFF,
          entryType: CONST_LAYER_ENTRY_TYPES.RASTER_TILE,
          layerId: metadataAccessPath.split('/').pop() || generateId(18),
          layerName: geoviewLayerName,
          source: {
            dataAccessPath: metadataAccessPath, // TODO: Check - Maybe remove this source.dataAccessPath assignation from here and let the process take care of setting it (as it should do)?
          },
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
}
