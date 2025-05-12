import Static, { Options as SourceOptions } from 'ol/source/ImageStatic';
import ImageLayer from 'ol/layer/Image';

import { Cast, TypeJsonArray } from '@/api/config/types/config-types';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import {
  TypeLayerEntryConfig,
  TypeGeoviewLayerConfig,
  CONST_LAYER_ENTRY_TYPES,
  CONST_LAYER_TYPES,
} from '@/api/config/types/map-schema-types';

import { ImageStaticLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/image-static-layer-entry-config';
import {
  LayerEntryConfigInvalidLayerEntryConfigError,
  LayerEntryConfigLayerIdNotFoundError,
  LayerEntryConfigNoLayerProvidedError,
  LayerEntryConfigParameterExtentNotDefinedInSourceError,
  LayerEntryConfigParameterProjectionNotDefinedInSourceError,
} from '@/core/exceptions/layer-entry-config-exceptions';
import { LayerDataAccessPathMandatoryError } from '@/core/exceptions/layer-exceptions';

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
   *
   * @param {string} mapId the id of the map
   * @param {TypeImageStaticLayerConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeImageStaticLayerConfig) {
    super(CONST_LAYER_TYPES.IMAGE_STATIC, layerConfig, mapId);
  }

  /**
   * Overrides the way the metadata is fetched and set in the 'metadata' property. Resolves when done.
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected override onFetchAndSetServiceMetadata(): Promise<void> {
    // No metadata
    return Promise.resolve();
  }

  /**
   * Overrides the validation of a layer entry config.
   * @param {TypeLayerEntryConfig} layerConfig - The layer entry config to validate.
   */
  protected override onValidateLayerEntryConfig(layerConfig: TypeLayerEntryConfig): void {
    // Note that Image Static metadata as we defined it does not contains metadata layer group. If you need geojson layer group,
    // you can define them in the configuration section.
    if (Array.isArray(this.metadata?.listOfLayerEntryConfig)) {
      const metadataLayerList = Cast<TypeLayerEntryConfig[]>(this.metadata?.listOfLayerEntryConfig);
      const foundEntry = metadataLayerList.find((layerMetadata) => layerMetadata.layerId === layerConfig.layerId);
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
   * @param {ImageStaticLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @returns {Promise<ImageStaticLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override onProcessLayerMetadata(layerConfig: ImageStaticLayerEntryConfig): Promise<ImageStaticLayerEntryConfig> {
    // Return as-is
    return Promise.resolve(layerConfig);
  }

  /**
   * Overrides the way the layer entry is processed to generate an Open Layer Base Layer object.
   * @param {ImageStaticLayerEntryConfig} layerConfig - The layer entry config needed to create the Open Layer object.
   * @returns {Promise<ImageLayer<Static>>} The GeoView raster layer that has been created.
   */
  protected override onProcessOneLayerEntry(layerConfig: ImageStaticLayerEntryConfig): Promise<ImageLayer<Static>> {
    // GV Time to request an OpenLayers layer!
    const requestResult = this.emitLayerRequesting({ config: layerConfig });

    // If any response
    let olLayer: ImageLayer<Static>;
    if (requestResult.length > 0) {
      // Get the OpenLayer that was created
      olLayer = requestResult[0] as ImageLayer<Static>;
    } else throw new LayerEntryConfigNoLayerProvidedError(layerConfig);

    // Return the OpenLayer layer
    return Promise.resolve(olLayer);
  }

  /**
   * Creates a configuration object for a Static Image layer.
   * This function constructs a `TypeImageStaticLayerConfig` object that describes an Static Image layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata.
   * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeJsonArray} layerEntries - An array of layer entries objects to be included in the configuration.
   * @returns {TypeImageStaticLayerConfig} The constructed configuration object for the Static Image layer.
   */
  static createImageStaticLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean,
    layerEntries: TypeJsonArray
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
      const layerEntryConfig = new ImageStaticLayerEntryConfig({
        geoviewLayerConfig,
        schemaTag: CONST_LAYER_TYPES.IMAGE_STATIC,
        entryType: CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE,
        layerId: layerEntry.id as string,
        source: {
          dataAccessPath: metadataAccessPath,
        },
      } as ImageStaticLayerEntryConfig);
      return layerEntryConfig;
    });

    // Return it
    return geoviewLayerConfig;
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
      throw new LayerDataAccessPathMandatoryError(layerConfig.layerPath);
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

/**
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeImageStaticLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is ImageStatic. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsImageStatic = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeImageStaticLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.IMAGE_STATIC;
};

/**
 * type guard function that redefines a TypeLayerEntryConfig as a ImageStaticLayerEntryConfig if the geoviewLayerType attribute of the
 * verifyIfGeoViewEntry.geoviewLayerConfig attribute is ImageStatic. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsImageStatic = (
  verifyIfGeoViewEntry: TypeLayerEntryConfig
): verifyIfGeoViewEntry is ImageStaticLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewLayerConfig?.geoviewLayerType === CONST_LAYER_TYPES.IMAGE_STATIC;
};
