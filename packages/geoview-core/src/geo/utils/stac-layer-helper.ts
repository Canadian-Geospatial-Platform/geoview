import ImageLayer from 'ol/layer/Image';
import WebGLTile from 'ol/layer/WebGLTile';
import { transform as transformCoordinate } from 'ol/proj';
import type OlProjection from 'ol/proj/Projection';
import GeoTIFF from 'ol/source/GeoTIFF';
import ImageCanvas from 'ol/source/ImageCanvas';
import { boundingExtent, getHeight, getWidth, type Extent } from 'ol/extent';
import type { Size } from 'ol/size';

import { logger } from '@/core/utils/logger';
import { extractGeotiffColorMap, getGeotiffPaletteStyle, loadImage, type RGBA } from '@/core/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { GeoUtilities } from '@/geo/utils/utilities';

/** Property key used to tag layers added by the STAC browser plugin. */
const STAC_BROWSER_TAG = 'gv-stac-browser';

/** Z-index of the previews, above every STAC footprint group (9999 by default, 10001 for selected items). */
const PREVIEW_ZINDEX = 10002;

/** Two-dimensional coordinate used while fitting a static preview to its footprint. */
export type TypePoint2D = [number, number];

/**
 * Helper class for creating STAC preview layers. Adding them to the map is the controller's responsibility.
 *
 * These layers are not integrated with the GeoView layer system (no layerPath, legend, or store entry).
 */
export abstract class StacLayerHelper {
  // #region STATIC METHODS

  /**
   * Creates a WebGLTile layer with a GeoTIFF source directly, bypassing ol-stac.
   *
   * This is useful when ol-stac's asset selection logic does not find the right
   * asset (e.g., datacube items with role "data" instead of "overview"/"visual").
   *
   * @param geotiffUrl - URL to the Cloud-Optimized GeoTIFF file
   * @param opacity - Optional layer opacity (0-1), defaults to 1
   * @returns A promise that resolves with the created layer, or undefined when the source cannot be set up
   */
  static async createGeoTiffLayer(geotiffUrl: string, opacity?: number): Promise<WebGLTile | undefined> {
    try {
      let palette: RGBA[] | undefined;
      try {
        palette = await extractGeotiffColorMap(geotiffUrl);
      } catch (error: unknown) {
        logger.logWarning(
          `StacLayerHelper.createGeoTiffLayer - Could not extract colormap (falling back to default rendering): ${geotiffUrl}`,
          error
        );
      }

      const hasColorMap = !!palette;
      logger.logInfo(
        `StacLayerHelper.createGeoTiffLayer - hasColorMap=${hasColorMap}, palette entries=${palette?.length ?? 0} for: ${geotiffUrl}`
      );

      const source = new GeoTIFF({
        sources: [{ url: geotiffUrl }],
        normalize: !hasColorMap,
        interpolate: !hasColorMap,
        convertToRGB: hasColorMap ? undefined : 'auto',
      });

      const sourceView = await source.getView();
      if (sourceView.projection) {
        const epsgCode = Projection.readEPSGNumber(sourceView.projection);
        if (epsgCode) await Projection.addProjectionIfMissing(epsgCode);
      }

      const layer = new WebGLTile({ source, opacity });
      layer.set(STAC_BROWSER_TAG, true);
      layer.setZIndex(PREVIEW_ZINDEX);
      if (palette) layer.setStyle(getGeotiffPaletteStyle(palette));
      return layer;
    } catch (error: unknown) {
      logger.logError(`StacLayerHelper.createGeoTiffLayer - Failed to create GeoTIFF layer: ${geotiffUrl}`, error);
      return undefined;
    }
  }

  /**
   * Creates a non-georeferenced image layer stretched over the projected footprint bounds and clipped to the footprint.
   *
   * If the item has no polygon geometry, its axis-aligned bbox is used as the footprint.
   *
   * @param imageUrl - URL of the image
   * @param bbox - Bounding box in EPSG:4326 [west, south, east, north]
   * @param opacity - Optional overlay opacity (0-1), defaults to 1
   * @param geometry - Optional GeoJSON footprint geometry in EPSG:4326
   * @returns A promise that resolves with the created image layer after the image loads
   * @throws {Error} When the image fails to load
   */
  static async createImageLayer(
    imageUrl: string,
    bbox: [number, number, number, number],
    opacity?: number,
    geometry?: unknown
  ): Promise<ImageLayer<ImageCanvas>> {
    // Some browse images do not expose Access-Control-Allow-Origin (e.g. NAPL); this canvas is only drawn for display, never pixel-read.
    const image = await loadImage(imageUrl);
    const source = new ImageCanvas({
      ratio: 1,
      canvasFunction: (extent, resolution, pixelRatio, size, projection): HTMLCanvasElement =>
        StacLayerHelper.#renderFootprintImage(image, bbox, geometry, extent, resolution, pixelRatio, size, projection),
    });
    const layer = new ImageLayer({ source, opacity });
    layer.set(STAC_BROWSER_TAG, true);
    layer.setZIndex(PREVIEW_ZINDEX);
    return layer;
  }

  /**
   * Clips a canvas to the projected footprint rings.
   *
   * @param context - The canvas drawing context
   * @param rings - Projected footprint rings
   * @param toCanvasPixel - Converts projected coordinates to canvas pixels
   */
  static #clipFootprint(
    context: CanvasRenderingContext2D,
    rings: TypePoint2D[][],
    toCanvasPixel: (coordinate: TypePoint2D) => TypePoint2D
  ): void {
    context.beginPath();
    rings.forEach((ring) => {
      ring.forEach((coordinate, index) => {
        const [pixelX, pixelY] = toCanvasPixel(coordinate);
        if (index === 0) context.moveTo(pixelX, pixelY);
        else context.lineTo(pixelX, pixelY);
      });
      context.closePath();
    });
    context.clip('evenodd');
  }

  /**
   * Stretches an image across the projected footprint bounds and clips it to the footprint.
   *
   * @param image - The loaded thumbnail image
   * @param bbox - Fallback item bbox in EPSG:4326
   * @param geometry - Optional GeoJSON footprint in EPSG:4326
   * @param extent - Current map image extent
   * @param resolution - Current map units per pixel
   * @param pixelRatio - Current device pixel ratio
   * @param size - Canvas dimensions in CSS pixels
   * @param projection - Current map projection
   * @returns The canvas containing the footprint-aligned image
   */
  static #renderFootprintImage(
    image: HTMLImageElement,
    bbox: [number, number, number, number],
    geometry: unknown,
    extent: Extent,
    resolution: number,
    pixelRatio: number,
    size: Size,
    projection: OlProjection
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(size[0] * pixelRatio);
    canvas.height = Math.round(size[1] * pixelRatio);
    if (!image.complete || image.naturalWidth === 0 || image.naturalHeight === 0 || resolution <= 0) return canvas;

    const rings = GeoUtilities.getGeoJsonPolygons(geometry).flat();
    const fallbackRing: TypePoint2D[] = [
      [bbox[0], bbox[3]],
      [bbox[0], bbox[1]],
      [bbox[2], bbox[1]],
      [bbox[2], bbox[3]],
      [bbox[0], bbox[3]],
    ];
    const footprintRings = rings.length ? rings : [fallbackRing];
    const projectedRings = footprintRings
      .map((ring) => ring.map((coordinate) => transformCoordinate(coordinate, 'EPSG:4326', projection) as TypePoint2D))
      .filter((ring) => ring.length >= 4 && ring.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y)));
    if (!projectedRings.length) return canvas;

    // Projected rings already contain only finite coordinates, so only a zero-area extent is rejected
    const footprintExtent = boundingExtent(projectedRings.flat());
    if (getWidth(footprintExtent) <= 0 || getHeight(footprintExtent) <= 0) return canvas;

    const context = canvas.getContext('2d');
    if (!context) return canvas;
    context.imageSmoothingEnabled = true;
    const toCanvasPixel = (coordinate: TypePoint2D): TypePoint2D => [
      ((coordinate[0] - extent[0]) / resolution) * pixelRatio,
      ((extent[3] - coordinate[1]) / resolution) * pixelRatio,
    ];

    StacLayerHelper.#clipFootprint(context, projectedRings, toCanvasPixel);

    const topLeft = toCanvasPixel([footprintExtent[0], footprintExtent[3]]);
    const bottomLeft = toCanvasPixel([footprintExtent[0], footprintExtent[1]]);
    const topRight = toCanvasPixel([footprintExtent[2], footprintExtent[3]]);

    context.setTransform(
      (topRight[0] - topLeft[0]) / image.naturalWidth,
      (topRight[1] - topLeft[1]) / image.naturalWidth,
      (bottomLeft[0] - topLeft[0]) / image.naturalHeight,
      (bottomLeft[1] - topLeft[1]) / image.naturalHeight,
      topLeft[0],
      topLeft[1]
    );
    context.drawImage(image, 0, 0);
    context.setTransform(1, 0, 0, 1, 0, 0);
    return canvas;
  }

  // #endregion STATIC METHODS
}
