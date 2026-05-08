import type OlMap from 'ol/Map';
import type { Extent } from 'ol/extent';
import type BaseLayer from 'ol/layer/Base';
import type LayerGroup from 'ol/layer/Group';
import WebGLTile from 'ol/layer/WebGLTile';
import GeoTIFF from 'ol/source/GeoTIFF';
import type GeoTIFFSource from 'ol/source/GeoTIFF';
import ImageLayer from 'ol/layer/Image';
import Static from 'ol/source/ImageStatic';
import { transformExtent } from 'ol/proj';

import { logger } from '@/core/utils/logger';
import { extractGeotiffColorMap, type RGBA } from '@/core/utils/utilities';

/** Options for creating a STAC layer. */
export interface StacLayerOptions {
  /** URL to a STAC Item, Collection, or Catalog JSON. */
  url?: string;
  /** Pre-loaded STAC JSON data (alternative to url). */
  data?: unknown;
  /** Whether to display preview/thumbnail images. */
  displayPreview?: boolean;
  /** Whether to display overview images (COGs). */
  displayOverview?: boolean;
  /** Whether to display footprint geometry. */
  displayFootprint?: boolean;
  /** Whether to display GeoTIFF assets by default. */
  displayGeoTiffByDefault?: boolean;
  /** Whether to display web map link layers (WMS/WMTS/XYZ). */
  displayWebMapLink?: boolean;
  /** Explicit asset keys to render. null shows default, empty array shows none. */
  assets?: string[] | null;
  /** Cross-origin setting for image requests. */
  crossOrigin?: string;
}

/** Default options applied to all STAC layers. */
const DEFAULT_OPTIONS: Partial<StacLayerOptions> = {
  displayPreview: true,
  displayFootprint: true,
  crossOrigin: 'anonymous',
};

/** Property key used to tag layers added by the STAC browser plugin. */
const STAC_BROWSER_TAG = 'gv-stac-browser';

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

      // Tag the layer so we can find/remove it later
      stacLayer.set(STAC_BROWSER_TAG, true);

      // Listen for errors from ol-stac (asset loading failures, CORS, etc.)
      stacLayer.on('error', (event: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ol-stac error event structure
        const errorEvent = event as any;
        logger.logError('StacLayerHelper.addStacLayer - ol-stac error event', errorEvent?.error ?? errorEvent);
      });

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

      // Tag the layer so we can find/remove it later
      imageLayer.set(STAC_BROWSER_TAG, true);

      map.addLayer(imageLayer);
      logger.logInfo(`StacLayerHelper.addPreviewImageLayer - Added preview image at extent: ${bbox.join(', ')}`);
      return imageLayer;
    } catch (error) {
      logger.logError('StacLayerHelper.addPreviewImageLayer - Failed to add preview image layer', error);
      return null;
    }
  }

  /**
   * Removes all layers added by the STAC browser plugin from the map.
   *
   * @param map - The OpenLayers map instance
   */
  static removeAllStacBrowserLayers(map: OlMap): void {
    const layersToRemove = map
      .getLayers()
      .getArray()
      .filter((layer) => layer.get(STAC_BROWSER_TAG) === true);

    layersToRemove.forEach((layer) => {
      map.removeLayer(layer);
    });

    logger.logInfo(`StacLayerHelper.removeAllStacBrowserLayers - Removed ${layersToRemove.length} STAC layers`);
  }

  /**
   * Applies embedded colormaps to any WebGLTile (COG) sub-layers within an ol-stac layer group.
   *
   * ol-stac creates GeoTIFF sources with normalize=true by default, which renders palette-indexed
   * rasters as grayscale. This method extracts the embedded colormap from each COG and applies
   * a WebGL palette style, matching the behavior of GVGeoTIFF.
   *
   * @param stacLayer - The ol-stac STACLayer (a LayerGroup)
   */
  static async applyColorMapsToStacLayer(stacLayer: unknown): Promise<void> {
    try {
      const layerGroup = stacLayer as LayerGroup;
      if (!layerGroup || typeof layerGroup.getLayers !== 'function') return;

      const layers = layerGroup.getLayers().getArray();
      const promises = layers.map((layer: BaseLayer) => StacLayerHelper.#processLayerForColorMap(layer));
      await Promise.all(promises);
    } catch (error) {
      logger.logError('StacLayerHelper.applyColorMapsToStacLayer - Failed to apply color maps', error);
    }
  }

  /**
   * Recursively processes a layer (or layer group) to find WebGLTile layers and apply colormaps.
   *
   * @param layer - An OL layer or layer group
   */
  static async #processLayerForColorMap(layer: BaseLayer): Promise<void> {
    // If it's a group, recurse into children
    if ('getLayers' in layer && typeof (layer as LayerGroup).getLayers === 'function') {
      const children = (layer as LayerGroup).getLayers().getArray();
      const promises = children.map((child: BaseLayer) => StacLayerHelper.#processLayerForColorMap(child));
      await Promise.all(promises);
      return;
    }

    // Only process WebGLTile layers (COG renderers)
    if (!(layer instanceof WebGLTile)) return;

    const source = layer.getSource() as GeoTIFFSource | null;
    if (!source) return;

    // Get the COG URL from the source's TileJSON or internal sources array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-underscore-dangle -- accessing internal ol source config
    const sourceInfo = (source as any).sourceInfo_ ?? (source as any).sourceOptions_;
    let cogUrl: string | undefined;

    if (Array.isArray(sourceInfo)) {
      cogUrl = sourceInfo[0]?.url;
    } else if (sourceInfo?.url) {
      cogUrl = sourceInfo.url;
    }

    if (!cogUrl) {
      logger.logDebug('StacLayerHelper.#processLayerForColorMap - No COG URL found, skipping');
      return;
    }

    // Extract colormap from the GeoTIFF
    const palette = await extractGeotiffColorMap(cogUrl);
    if (!palette) {
      logger.logDebug(`StacLayerHelper.#processLayerForColorMap - No embedded colormap for: ${cogUrl}`);
      return;
    }

    // Apply the palette style (same logic as GVGeoTIFF.#applyColorMapStyle)
    StacLayerHelper.#applyPaletteStyle(layer, palette);
    logger.logInfo(`StacLayerHelper.#processLayerForColorMap - Applied colormap to COG: ${cogUrl}`);
  }

  /**
   * Transforms a bbox from EPSG:4326 to the map's current projection.
   *
   * @param map - The OpenLayers map instance
   * @param bbox - Bounding box in EPSG:4326 [west, south, east, north]
   * @returns The transformed extent in the map's projection
   */
  static transformBboxToMapProjection(map: OlMap, bbox: [number, number, number, number]): [number, number, number, number] {
    const mapProjection = map.getView().getProjection().getCode();
    const extent = transformExtent(bbox, 'EPSG:4326', mapProjection);
    return [extent[0], extent[1], extent[2], extent[3]];
  }

  /**
   * Transforms the map's current extent to EPSG:4326 bbox.
   *
   * @param map - The OpenLayers map instance
   * @returns The map extent as [west, south, east, north] in EPSG:4326, clamped to valid bounds
   */
  static getMapExtentAsWgs84Bbox(map: OlMap): [number, number, number, number] {
    const view = map.getView();
    const extent = view.calculateExtent(map.getSize());
    const mapProjection = view.getProjection().getCode();
    const bbox4326 = transformExtent(extent, mapProjection, 'EPSG:4326');
    return [Math.max(bbox4326[0], -180), Math.max(bbox4326[1], -90), Math.min(bbox4326[2], 180), Math.min(bbox4326[3], 90)];
  }

  /**
   * Creates a WebGLTile layer with a GeoTIFF source directly, bypassing ol-stac.
   *
   * This is useful when ol-stac's asset selection logic does not find the right
   * asset (e.g., datacube items with role "data" instead of "overview"/"visual").
   *
   * @param map - The OpenLayers map instance
   * @param geotiffUrl - URL to the Cloud-Optimized GeoTIFF file
   * @returns A promise that resolves with the created WebGLTile layer, or null on failure
   */
  static async addGeoTiffLayer(map: OlMap, geotiffUrl: string): Promise<WebGLTile | null> {
    try {
      // Try to extract embedded colormap — it affects source configuration.
      // This can fail (CORS, network, malformed TIFF) so we catch and fall back to default rendering.
      let palette: RGBA[] | undefined;
      try {
        palette = await extractGeotiffColorMap(geotiffUrl);
      } catch (error) {
        logger.logDebug(
          `StacLayerHelper.addGeoTiffLayer - Could not extract colormap (falling back to default rendering): ${geotiffUrl}`,
          error
        );
      }

      const hasColorMap = !!palette;
      logger.logInfo(
        `StacLayerHelper.addGeoTiffLayer - hasColorMap=${hasColorMap}, palette entries=${palette?.length ?? 0} for: ${geotiffUrl}`
      );

      const source = new GeoTIFF({
        sources: [{ url: geotiffUrl }],
        // When an embedded color map exists, disable normalization so raw integer pixel values can index the palette
        normalize: !hasColorMap,
        // Use nearest-neighbor interpolation for palette data to avoid blending between class indices
        interpolate: !hasColorMap,
        // Auto-detect multi-band RGB/RGBA COGs and render in color (only when no palette)
        convertToRGB: hasColorMap ? undefined : 'auto',
      });

      const layer = new WebGLTile({ source });

      // Tag the layer so we can find/remove it later
      layer.set(STAC_BROWSER_TAG, true);

      // Apply colormap palette style if present
      if (palette) {
        StacLayerHelper.#applyPaletteStyle(layer, palette);
        logger.logInfo(`StacLayerHelper.addGeoTiffLayer - Applied colormap to: ${geotiffUrl}`);
      }

      map.addLayer(layer);
      logger.logInfo(`StacLayerHelper.addGeoTiffLayer - Added GeoTIFF layer: ${geotiffUrl}`);

      return layer;
    } catch (error) {
      logger.logError(`StacLayerHelper.addGeoTiffLayer - Failed to add GeoTIFF layer: ${geotiffUrl}`, error);
      return null;
    }
  }

  /**
   * Finds the best GeoTIFF asset URL from a STAC item's assets record.
   *
   * Searches by media type first (application/geo+json excluded), then falls back
   * to file extension (.tif, .tiff). Prefers assets with role "visual" or "overview",
   * then "data", then any GeoTIFF.
   *
   * @param assets - Record of asset key to asset object
   * @returns The GeoTIFF asset href, or undefined if none found
   */
  static findGeoTiffAssetUrl(assets: Record<string, { href: string; type?: string; roles?: string[] }>): string | undefined {
    const entries = Object.values(assets);

    /** GeoTIFF media type patterns. */
    const geotiffTypes = ['image/tiff', 'image/geotiff', 'image/x-geotiff', 'application/x-geotiff'];

    /** Checks if an asset is a GeoTIFF by media type or file extension. */
    const isGeoTiff = (asset: { href: string; type?: string }): boolean => {
      if (asset.type) {
        return geotiffTypes.some((t) => asset.type!.toLowerCase().startsWith(t));
      }
      // Fallback: check file extension
      const url = asset.href.toLowerCase().split('?')[0];
      return url.endsWith('.tif') || url.endsWith('.tiff');
    };

    // Prefer assets with visual/overview role
    const visual = entries.find((a) => isGeoTiff(a) && a.roles?.some((r) => ['visual', 'overview'].includes(r)));
    if (visual) return visual.href;

    // Then data role
    const data = entries.find((a) => isGeoTiff(a) && a.roles?.includes('data'));
    if (data) return data.href;

    // Then any GeoTIFF
    const any = entries.find((a) => isGeoTiff(a));
    if (any) return any.href;

    return undefined;
  }

  /**
   * Applies an embedded color palette as a WebGLTile style.
   *
   * @param layer - The WebGLTile layer
   * @param palette - Array of RGBA color tuples from the GeoTIFF color map
   */
  static #applyPaletteStyle(layer: WebGLTile, palette: RGBA[]): void {
    // Make nodata index (0) fully transparent
    const adjustedPalette = [...palette];
    adjustedPalette[0] = [0, 0, 0, 0];

    // Convert RGBA tuples to CSS color strings
    const colorStrings = adjustedPalette.map(([r, g, b, a]) => `rgba(${r},${g},${b},${a / 255})`);

    // Apply the palette style
    layer.setStyle({
      color: ['palette', ['band', 1], colorStrings],
    });
  }
}
