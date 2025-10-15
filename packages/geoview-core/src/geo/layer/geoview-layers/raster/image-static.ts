import type { Options as SourceOptions } from 'ol/source/ImageStatic';
import Static from 'ol/source/ImageStatic';

import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import type { Extent } from '@/api/types/map-schema-types';
import type { TypeGeoviewLayerConfig, TypeValidSourceProjectionCodes } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';

import { ImageStaticLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/image-static-layer-entry-config';
import {
  LayerEntryConfigParameterExtentNotDefinedInSourceError,
  LayerEntryConfigParameterProjectionNotDefinedInSourceError,
} from '@/core/exceptions/layer-entry-config-exceptions';
import {
  LayerDataAccessPathMandatoryError,
  LayerMissingSourceExtentError,
  LayerMissingSourceProjectionError,
} from '@/core/exceptions/layer-exceptions';
import { GVImageStatic } from '@/geo/layer/gv-layers/raster/gv-image-static';

export interface TypeImageStaticLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.IMAGE_STATIC;
  listOfLayerEntryConfig: ImageStaticLayerEntryConfig[];
}

/**
 * A class to add image static layer.
 *
 * @exports
 * @class ImageStatic
 */
export class ImageStatic extends AbstractGeoViewRaster {
  /**
   * Constructs a ImageStatic Layer configuration processor.
   * @param {TypeImageStaticLayerConfig} layerConfig the layer configuration
   */
  // The constructor is not useless, it narrows down the accepted parameter type.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(layerConfig: TypeImageStaticLayerConfig) {
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
      ImageStatic.createGeoviewLayerConfig(this.geoviewLayerId, this.geoviewLayerName, this.metadataAccessPath, false, [])
    );
  }

  /**
   * Overrides the way the layer metadata is processed.
   * @param {ImageStaticLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @returns {Promise<ImageStaticLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override onProcessLayerMetadata(layerConfig: ImageStaticLayerEntryConfig): Promise<ImageStaticLayerEntryConfig> {
    // Return as-is
    return Promise.resolve(layerConfig);
  }

  /**
   * Overrides the creation of the GV Layer
   * @param {ImageStaticLayerEntryConfig} layerConfig - The layer entry configuration.
   * @returns {GVImageStatic} The GV Layer
   */
  protected override onCreateGVLayer(layerConfig: ImageStaticLayerEntryConfig): GVImageStatic {
    // Create the source
    const source = ImageStatic.createImageStaticSource(layerConfig);

    // Create the GV Layer
    const gvLayer = new GVImageStatic(source, layerConfig);

    // Return it
    return gvLayer;
  }

  /**
   * Initializes a GeoView layer configuration for an Image Static layer.
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
    const myLayer = new ImageStatic({ geoviewLayerId, geoviewLayerName, metadataAccessPath } as TypeImageStaticLayerConfig);
    return myLayer.initGeoViewLayerEntries();
  }

  /**
   * Creates a configuration object for a Static Image layer.
   * This function constructs a `TypeImageStaticLayerConfig` object that describes an Static Image layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata.
   * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
   * @returns {TypeImageStaticLayerConfig} The constructed configuration object for the Static Image layer.
   */
  static createGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean,
    layerEntries: TypeLayerEntryShell[]
  ): TypeImageStaticLayerConfig {
    const geoviewLayerConfig: TypeImageStaticLayerConfig = {
      geoviewLayerId,
      geoviewLayerName,
      metadataAccessPath,
      geoviewLayerType: CONST_LAYER_TYPES.IMAGE_STATIC,
      isTimeAware,
      listOfLayerEntryConfig: [],
    };
    geoviewLayerConfig.listOfLayerEntryConfig = layerEntries.map((layerEntry) => {
      // Validate input
      if (!layerEntry.source || !layerEntry.source.extent) throw new LayerMissingSourceExtentError();
      if (!layerEntry.source.projection) throw new LayerMissingSourceProjectionError();

      // Create the entry
      const layerEntryConfig = new ImageStaticLayerEntryConfig({
        geoviewLayerConfig,
        layerId: `${layerEntry.id}`,
        source: {
          extent: layerEntry.source.extent,
          projection: layerEntry.source.projection,
        },
      });
      return layerEntryConfig;
    });

    // Return it
    return geoviewLayerConfig;
  }

  /**
   * Processes an ImageStatic GeoviewLayerConfig and returns a promise
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
   * @param {Extent} sourceExtent - Indicates the extent where the static image should be.
   * @param {number} sourceProjection - Indicates the projection used for the sourceExtent.
   * @returns {Promise<ConfigBaseClass[]>} A promise that resolves to an array of layer configurations.
   */
  static processGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    url: string,
    layerIds: string[],
    isTimeAware: boolean,
    sourceExtent: Extent,
    sourceProjection: TypeValidSourceProjectionCodes
  ): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = ImageStatic.createGeoviewLayerConfig(
      geoviewLayerId,
      geoviewLayerName,
      url,
      isTimeAware,
      layerIds.map((layerId) => {
        return { id: layerId, source: { extent: sourceExtent, projection: sourceProjection } };
      })
    );

    // Create the class from geoview-layers package
    const myLayer = new ImageStatic(layerConfig);

    // Process it
    return AbstractGeoViewLayer.processConfig(myLayer);
  }

  /**
   * Creates a StaticImage source from a layer config.
   * @param {ImageStaticLayerEntryConfig} layerConfig - Configuration for the image static layer.
   * @returns A configured ol/source/ImageStatic instance.
   * @throws If required config fields like dataAccessPath, extent, or projection are missing.
   */
  static createImageStaticSource(layerConfig: ImageStaticLayerEntryConfig): Static {
    const { source } = layerConfig;

    // Validate required properties
    if (!source?.dataAccessPath) {
      throw new LayerDataAccessPathMandatoryError(layerConfig.layerPath, layerConfig.getLayerNameCascade());
    }

    if (!source.extent) {
      throw new LayerEntryConfigParameterExtentNotDefinedInSourceError(layerConfig);
    }

    if (!source.projection) {
      throw new LayerEntryConfigParameterProjectionNotDefinedInSourceError(layerConfig);
    }

    // Assemble the source options
    const sourceOptions: SourceOptions = {
      url: source.dataAccessPath,
      imageExtent: source.extent,
      projection: `EPSG:${source.projection}`,
      crossOrigin: source.crossOrigin ?? 'Anonymous',
    };

    return new Static(sourceOptions);
  }
}
