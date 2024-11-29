import ImageLayer from 'ol/layer/Image';
import Static from 'ol/source/ImageStatic';
import { Options as ImageOptions } from 'ol/layer/BaseImage';
import { Extent } from 'ol/extent';
import axios from 'axios';

import { Cast, TypeJsonObject } from '@/core/types/global-types';
import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { logger } from '@/core/utils/logger';
import { ImageStaticLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/image-static-layer-entry-config';
import { loadImage } from '@/geo/utils/renderer/geoview-renderer';
import { AbstractGVRaster } from './abstract-gv-raster';
import { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';

/**
 * Manages an Image static layer.
 *
 * @exports
 * @class GVImageStatic
 */
export class GVImageStatic extends AbstractGVRaster {
  /**
   * Constructs a GVImageStatic layer to manage an OpenLayer layer.
   * @param {string} mapId - The map id
   * @param {Static} olSource - The OpenLayer source.
   * @param {ImageStaticLayerEntryConfig} layerConfig - The layer configuration.
   */
  public constructor(mapId: string, olSource: Static, layerConfig: ImageStaticLayerEntryConfig) {
    super(mapId, olSource, layerConfig);

    // Create the image layer options.
    const staticImageOptions: ImageOptions<Static> = { source: olSource };

    // Init the layer options with initial settings
    AbstractGVRaster.initOptionsWithInitialSettings(staticImageOptions, layerConfig);

    // Create and set the OpenLayer layer
    this.olLayer = new ImageLayer(staticImageOptions);
  }

  /**
   * Overrides the get of the OpenLayers Layer
   * @returns {ImageLayer<Static>} The OpenLayers Layer
   */
  override getOLLayer(): ImageLayer<Static> {
    // Call parent and cast
    return super.getOLLayer() as ImageLayer<Static>;
  }

  /**
   * Overrides the get of the OpenLayers Layer Source
   * @returns {Static} The OpenLayers Layer Source
   */
  override getOLSource(): Static {
    // Get source from OL
    return super.getOLSource() as Static;
  }

  /**
   * Overrides the get of the layer configuration associated with the layer.
   * @returns {ImageStaticLayerEntryConfig} The layer configuration or undefined if not found.
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
      const readImage = (blob: Blob): Promise<string | ArrayBuffer | null> =>
        // eslint-disable-next-line @typescript-eslint/no-shadow
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });

      let legendUrl: string | undefined = layerConfig.source.dataAccessPath;

      if (legendUrl) {
        legendUrl = legendUrl.toLowerCase().startsWith('http:') ? `https${legendUrl.slice(4)}` : legendUrl;

        axios
          .get<TypeJsonObject>(legendUrl, { responseType: 'blob', withCredentials: false })
          .then((response) => {
            resolve(readImage(Cast<Blob>(response.data)));
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
  override async getLegend(): Promise<TypeLegend | null> {
    const layerConfig = this.getLayerConfig();
    try {
      const legendImage = await GVImageStatic.#getLegendImage(layerConfig!);
      if (!legendImage) {
        const legend: TypeLegend = {
          type: CONST_LAYER_TYPES.IMAGE_STATIC,
          legend: null,
        };
        return legend;
      }
      const image = await loadImage(legendImage as string);
      if (image) {
        const drawingCanvas = document.createElement('canvas');
        drawingCanvas.width = image.width;
        drawingCanvas.height = image.height;
        const drawingContext = drawingCanvas.getContext('2d')!;
        drawingContext.drawImage(image, 0, 0);
        const legend: TypeLegend = {
          type: CONST_LAYER_TYPES.IMAGE_STATIC,
          legend: drawingCanvas,
        };
        return legend;
      }
      const legend: TypeLegend = {
        type: CONST_LAYER_TYPES.IMAGE_STATIC,
        legend: null,
      };
      return legend;
    } catch (error) {
      logger.logError(`Error getting legend for ${layerConfig.layerPath}`, error);
      return null;
    }
  }

  /**
   * Gets the bounds of the layer and returns updated bounds.
   * @returns {Extent | undefined} The layer bounding box.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override getBounds(): Extent | undefined {
    // Get the source projection
    const sourceProjection = this.getOLSource().getProjection() || undefined;

    // Get the layer bounds
    let sourceExtent = this.getOLSource()?.getImageExtent();
    if (sourceExtent) {
      // Make sure we're in the map projection
      sourceExtent = this.getMapViewer().convertExtentFromProjToMapProj(sourceExtent, sourceProjection);
    }

    // Return the calculated layer bounds
    return sourceExtent;
  }
}
