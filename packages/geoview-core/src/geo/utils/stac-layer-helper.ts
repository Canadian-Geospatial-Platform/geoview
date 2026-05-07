import type OlMap from 'ol/Map';
import type { Extent } from 'ol/extent';
import ImageLayer from 'ol/layer/Image';
import Static from 'ol/source/ImageStatic';
import { transformExtent } from 'ol/proj';

import { logger } from '@/core/utils/logger';

/** Options for creating a STAC layer. */
export interface StacLayerOptions {
  /** URL to a STAC Item, Collection, or Catalog JSON. */
  url?: string;
  /** Pre-loaded STAC JSON data (alternative to url). */
  data?: unknown;
  /** Whether to display preview/thumbnail images. */
  displayPreview?: boolean;
  /** Whether to display overview images. */
  displayOverview?: boolean;
  /** Whether to display footprint geometry. */
  displayFootprint?: boolean;
  /** Whether to display GeoTIFF assets by default. */
  displayGeoTiffByDefault?: boolean;
  /** Whether to display web map link layers (WMS/WMTS/XYZ). */
  displayWebMapLink?: boolean;
  /** Cross-origin setting for image requests. */
  crossOrigin?: string;
}

/** Default options applied to all STAC layers. */
const DEFAULT_OPTIONS: Partial<StacLayerOptions> = {
  displayPreview: true,
  displayFootprint: true,
  crossOrigin: 'anonymous',
};

/**
 * Helper class for managing ol-stac layers on an OpenLayers map.
 *
 * This utility wraps ol-stac's STACLayer to provide a simple API for adding,
 * removing, and querying STAC layers. It does NOT integrate with the GeoView
 * layer system (no layerPath, no legend, no store entry).
 */
export class StacLayerHelper {
  /**
   * Creates and adds an ol-stac layer to the map.
   *
   * @param map - The OpenLayers map instance
   * @param options - STAC layer options
   * @returns A promise that resolves with the created layer, or null on failure
   */
  static async addStacLayer(map: OlMap, options: StacLayerOptions): Promise<unknown> {
    try {
      // Dynamic import to avoid bundling ol-stac when not used
      const { default: STACLayer } = await import('ol-stac');

      const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
      const stacLayer = new STACLayer(mergedOptions);

      map.addLayer(stacLayer);
      logger.logInfo(`StacLayerHelper.addStacLayer - Added STAC layer: ${options.url ?? 'inline data'}`);
      return stacLayer;
    } catch (error) {
      logger.logError('StacLayerHelper.addStacLayer - Failed to add STAC layer', error);
      return null;
    }
  }

  /**
   * Removes an ol-stac layer from the map.
   *
   * @param map - The OpenLayers map instance
   * @param layer - The STAC layer to remove
   */
  static removeStacLayer(map: OlMap, layer: unknown): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ol-stac layer type not statically available
      map.removeLayer(layer as any);
      logger.logInfo('StacLayerHelper.removeStacLayer - Removed STAC layer');
    } catch (error) {
      logger.logError('StacLayerHelper.removeStacLayer - Failed to remove STAC layer', error);
    }
  }

  /**
   * Gets the extent of a STAC layer.
   *
   * @param layer - The STAC layer
   * @returns The extent, or undefined if not available
   */
  static getStacLayerExtent(layer: unknown): Extent | undefined {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ol-stac layer type not statically available
      const stacLayer = layer as any;
      if (stacLayer && typeof stacLayer.getExtent === 'function') {
        return stacLayer.getExtent() as Extent;
      }
      return undefined;
    } catch (error) {
      logger.logError('StacLayerHelper.getStacLayerExtent - Failed to get extent', error);
      return undefined;
    }
  }

  /**
   * Adds a preview image as an ImageStatic layer positioned at the given geographic extent.
   *
   * @param map - The OpenLayers map instance
   * @param imageUrl - URL of the preview/thumbnail image
   * @param bbox - Bounding box in EPSG:4326 [west, south, east, north]
   * @returns The created ImageLayer, or null on failure
   */
  static addPreviewImageLayer(map: OlMap, imageUrl: string, bbox: [number, number, number, number]): ImageLayer<Static> | null {
    try {
      const mapProjection = map.getView().getProjection().getCode();

      // Transform bbox from EPSG:4326 to the map's projection
      const extent = transformExtent(bbox, 'EPSG:4326', mapProjection);

      const imageLayer = new ImageLayer({
        source: new Static({
          url: imageUrl,
          imageExtent: extent,
          projection: mapProjection,
          crossOrigin: 'anonymous',
        }),
      });

      map.addLayer(imageLayer);
      logger.logInfo(`StacLayerHelper.addPreviewImageLayer - Added preview image at extent: ${bbox.join(', ')}`);
      return imageLayer;
    } catch (error) {
      logger.logError('StacLayerHelper.addPreviewImageLayer - Failed to add preview image layer', error);
      return null;
    }
  }
}
