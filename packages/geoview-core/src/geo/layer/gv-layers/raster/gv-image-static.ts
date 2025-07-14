import ImageLayer from 'ol/layer/Image';
import Static from 'ol/source/ImageStatic';
import { Options as ImageOptions } from 'ol/layer/BaseImage';
import { Extent } from 'ol/extent';
import { Projection as OLProjection } from 'ol/proj';

import { logger } from '@/core/utils/logger';
import { ImageStaticLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/image-static-layer-entry-config';
import { loadImage } from '@/geo/utils/renderer/geoview-renderer';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { Projection } from '@/geo/utils/projection';
import { validateExtent } from '@/geo/utils/utilities';
import { Fetch } from '@/core/utils/fetch-helper';
import { CONST_LAYER_TYPES } from '@/api/config/types/map-schema-types';

/**
 * Manages an Image static layer.
 *
 * @exports
 * @class GVImageStatic
 */
export class GVImageStatic extends AbstractGVRaster {
  /**
   * Constructs a GVImageStatic layer to manage an OpenLayer layer.
   * @param {Static} olSource - The OpenLayer source.
   * @param {ImageStaticLayerEntryConfig} layerConfig - The layer configuration.
   */
  public constructor(olSource: Static, layerConfig: ImageStaticLayerEntryConfig) {
    super(olSource, layerConfig);

    // Create the image layer options.
    const staticImageOptions: ImageOptions<Static> = { source: olSource };

    // Init the layer options with initial settings
    AbstractGVRaster.initOptionsWithInitialSettings(staticImageOptions, layerConfig);

    // Create and set the OpenLayer layer
    this.setOLLayer(new ImageLayer(staticImageOptions));
  }

  /**
   * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
   * @override
   * @returns {ImageLayer<Static>} The strongly-typed OpenLayers type.
   */
  override getOLLayer(): ImageLayer<Static> {
    // Call parent and cast
    return super.getOLLayer() as ImageLayer<Static>;
  }

  /**
   * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
   * @override
   * @returns {Static} The Static source instance associated with this layer.
   */
  override getOLSource(): Static {
    // Get source from OL
    return super.getOLSource() as Static;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {ImageStaticLayerEntryConfig} The strongly-typed layer configuration specific to this group layer.
   */
  override getLayerConfig(): ImageStaticLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as ImageStaticLayerEntryConfig;
  }

  /**
   * Gets the legend image of a layer.
   * @param {ImageStaticLayerEntryConfig} layerConfig - The layer configuration.
   * @returns {blob} A promise of an image blob
   * @private
   */
  static #getLegendImage(layerConfig: ImageStaticLayerEntryConfig): Promise<string | ArrayBuffer | null> {
    const promisedImage = new Promise<string | ArrayBuffer | null>((resolve) => {
      // If a data access path is defined
      if (layerConfig.source.dataAccessPath) {
        const legendUrl = layerConfig.source.dataAccessPath.toLowerCase().startsWith('http:')
          ? `https${layerConfig.source.dataAccessPath.slice(4)}`
          : layerConfig.source.dataAccessPath;

        // Fetch the blob
        Fetch.fetchBlob(legendUrl, { credentials: 'omit' })
          .then((blob) => {
            // The blob has been read, read it with a FileReader
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(reader.result);
            };
            reader.onerror = () => {
              resolve(null);
            };
            reader.readAsDataURL(blob);
          })
          .catch(() => resolve(null));
      } else resolve(null);
    });
    return promisedImage;
  }

  /**
   * Overrides the fetching of the legend for an Esri image layer.
   * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
   */
  override async onFetchLegend(): Promise<TypeLegend | null> {
    // Get the config
    const layerConfig = this.getLayerConfig();

    try {
      // Get legend image
      const legendImage = await GVImageStatic.#getLegendImage(layerConfig);

      // If legend image was read
      if (legendImage) {
        // Legend was read, load the image
        const image = await loadImage(legendImage as string);

        // If image was loaded
        if (image) {
          const drawingCanvas = document.createElement('canvas');
          drawingCanvas.width = image.width;
          drawingCanvas.height = image.height;
          const drawingContext = drawingCanvas.getContext('2d', { willReadFrequently: true })!;
          drawingContext.drawImage(image, 0, 0);

          // Return legend information
          return {
            type: CONST_LAYER_TYPES.IMAGE_STATIC,
            legend: drawingCanvas,
          };
        }
      }

      // No good
      return {
        type: CONST_LAYER_TYPES.IMAGE_STATIC,
        legend: null,
      };
    } catch (error: unknown) {
      logger.logError(`Error getting legend for ${layerConfig.layerPath}`, error);
      return null;
    }
  }

  /**
   * Overrides the way to get the bounds for this layer type.
   * @param {OLProjection} projection - The projection to get the bounds into.
   * @param {number} stops - The number of stops to use to generate the extent.
   * @returns {Extent | undefined} The layer bounding box.
   */
  override onGetBounds(projection: OLProjection, stops: number): Extent | undefined {
    // Get the source projection
    const sourceProjection = this.getOLSource().getProjection() || undefined;

    // Get the layer bounds
    let sourceExtent = this.getOLSource()?.getImageExtent();

    // If both found
    if (sourceExtent && sourceProjection) {
      // Transform extent to given projection
      sourceExtent = Projection.transformExtentFromProj(sourceExtent, sourceProjection, projection, stops);
      sourceExtent = validateExtent(sourceExtent, projection.getCode());
    }

    // Return the calculated layer bounds
    return sourceExtent;
  }
}
