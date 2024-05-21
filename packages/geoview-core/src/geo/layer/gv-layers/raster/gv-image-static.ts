import ImageLayer from 'ol/layer/Image';
import Static from 'ol/source/ImageStatic';
import { Extent } from 'ol/extent';
import axios from 'axios';

import { Cast, TypeJsonObject } from '@/core/types/global-types';
import { CONST_LAYER_TYPES, TypeLegend } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { Projection } from '@/geo/utils/projection';
import { getLocalizedValue } from '@/core/utils/utilities';
import { getMinOrMaxExtents } from '@/geo/utils/utilities';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { logger } from '@/core/utils/logger';
import { ImageStaticLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/image-static-layer-entry-config';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { loadImage } from '@/geo/utils/renderer/geoview-renderer';
import { AbstractGVRaster } from './abstract-gv-raster';

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
   * @param {ImageLayer<Static>} olLayer - The OpenLayer layer.
   * @param {ImageStaticLayerEntryConfig} layerConfig - The layer configuration.
   */
  public constructor(mapId: string, olLayer: ImageLayer<Static>, layerConfig: ImageStaticLayerEntryConfig) {
    super(mapId, olLayer, layerConfig);
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
  #getLegendImage(layerConfig: ImageStaticLayerEntryConfig): Promise<string | ArrayBuffer | null> {
    const promisedImage = new Promise<string | ArrayBuffer | null>((resolve) => {
      const readImage = (blob: Blob): Promise<string | ArrayBuffer | null> =>
        // eslint-disable-next-line @typescript-eslint/no-shadow
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });

      let legendUrl: string | undefined = getLocalizedValue(
        layerConfig.source.dataAccessPath,
        AppEventProcessor.getDisplayLanguage(this.getMapId())
      );

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
      const legendImage = await this.#getLegendImage(layerConfig!);
      if (!legendImage) {
        const legend: TypeLegend = {
          type: CONST_LAYER_TYPES.IMAGE_STATIC,
          layerName: layerConfig!.layerName,
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
          layerName: layerConfig!.layerName,
          legend: drawingCanvas,
        };
        return legend;
      }
      const legend: TypeLegend = {
        type: CONST_LAYER_TYPES.IMAGE_STATIC,
        layerName: layerConfig!.layerName,
        legend: null,
      };
      return legend;
    } catch (error) {
      logger.logError(`Error getting legend for ${layerConfig.layerPath}`, error);
      return null;
    }
  }

  /**
   * Gets the bounds of the layer and returns updated bounds
   * @param {Extent | undefined} bounds The current bounding box to be adjusted.
   * @returns {Extent} The new layer bounding box.
   */
  protected getBounds(bounds?: Extent): Extent | undefined {
    const layerConfig = this.getLayerConfig();
    const layer = this.getOLLayer();

    const layerBounds = layer?.getSource()?.getImageExtent();
    const projection =
      layer?.getSource()?.getProjection()?.getCode().replace('EPSG:', '') ||
      MapEventProcessor.getMapState(this.getMapId()).currentProjection;

    if (layerBounds) {
      let transformedBounds = layerBounds;
      if (
        layerConfig.getMetadata()?.fullExtent?.spatialReference?.wkid !== MapEventProcessor.getMapState(this.getMapId()).currentProjection
      ) {
        transformedBounds = Projection.transformExtent(
          layerBounds,
          `EPSG:${projection}`,
          `EPSG:${MapEventProcessor.getMapState(this.getMapId()).currentProjection}`
        );
      }

      // eslint-disable-next-line no-param-reassign
      if (!bounds) bounds = [transformedBounds[0], transformedBounds[1], transformedBounds[2], transformedBounds[3]];
      // eslint-disable-next-line no-param-reassign
      else bounds = getMinOrMaxExtents(bounds, transformedBounds);
    }

    return bounds;
  }
}
