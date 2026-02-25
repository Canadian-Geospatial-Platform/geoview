import TileLayer from 'ol/layer/Tile';
import type { Options as TileOptions } from 'ol/layer/BaseTile';
import type WMTSSource from 'ol/source/WMTS';
import type { Extent } from 'ol/extent';
import type { Projection as OLProjection } from 'ol/proj';

import type {
  OgcWmtsLayerEntryConfig,
  TypeMetadataWMTSLayer,
} from '@/api/config/validation-classes/raster-validation-classes/ogc-wmts-layer-entry-config';
import { AbstractGVTile } from '@/geo/layer/gv-layers/tile/abstract-gv-tile';
import { GeoUtilities } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import type { TypeLegend } from '@/index';
import { Fetch } from '@/core/utils/fetch-helper';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { logger } from '@/core/utils/logger';

/**
 * Manages a WMTS layer.
 *
 * @class GVWMTS
 */
export class GVWMTS extends AbstractGVTile {
  /**
   * Constructs a GVWMTS layer to manage an OpenLayer layer.
   * @param {WMTSSource} olSource - The OpenLayer source.
   * @param {OgcWmtsLayerEntryConfig} layerConfig - The layer configuration.
   */
  constructor(olSource: WMTSSource, layerConfig: OgcWmtsLayerEntryConfig) {
    super(olSource, layerConfig);

    // Create the tile layer options.
    const tileLayerOptions: TileOptions<WMTSSource> = { source: olSource };

    // Init the layer options with initial settings
    AbstractGVTile.initOptionsWithInitialSettings(tileLayerOptions, layerConfig);

    // Create and set the OpenLayer layer
    this.setOLLayer(new TileLayer(tileLayerOptions));
  }

  // #region OVERRIDES

  /**
   * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
   *
   * @returns The strongly-typed OpenLayers type.
   */
  override getOLLayer(): TileLayer<WMTSSource> {
    // Call parent and cast
    return super.getOLLayer() as TileLayer<WMTSSource>;
  }

  /**
   * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
   *
   * @returns The WMTS source instance associated with this layer.
   */
  override getOLSource(): WMTSSource {
    // Get source from OL
    return super.getOLSource() as WMTSSource;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed layer configuration specific to this layer.
   */
  override getLayerConfig(): OgcWmtsLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as OgcWmtsLayerEntryConfig;
  }

  /**
   * Overrides the way to get the bounds for this layer type.
   *
   * @param projection - The projection to get the bounds into.
   * @param stops - The number of stops to use to generate the extent.
   * @returns The layer bounding box.
   */
  override onGetBounds(projection: OLProjection, stops: number): Extent | undefined {
    // Get the layer
    const layer = this.getOLLayer() as TileLayer<WMTSSource> | undefined;

    // Get the source projection
    const sourceProjection = this.getOLSource()?.getProjection() || undefined;

    // Get the layer bounds
    let sourceExtent = layer?.getSource()?.getTileGrid()?.getExtent();

    // If both found
    if (sourceExtent && sourceProjection) {
      // Transform extent to given projection
      sourceExtent = Projection.transformExtentFromProj(sourceExtent, sourceProjection, projection, stops);
      sourceExtent = GeoUtilities.validateExtent(sourceExtent, projection.getCode());
    }

    // Return the calculated layer bounds
    return sourceExtent;
  }

  /**
   * Gets the legend image of a layer.
   *
   * @param layerConfig - The layer configuration.
   * @returns A promise of an image blob
   */
  static #getLegendImage(layerConfig: OgcWmtsLayerEntryConfig): Promise<string | ArrayBuffer | null> {
    const promisedImage = new Promise<string | ArrayBuffer | null>((resolve) => {
      const metadata = layerConfig.getLayerMetadata();
      const layer = metadata?.Layer as TypeMetadataWMTSLayer | undefined;
      const foundStyle = Array.isArray(layer?.Style)
        ? layer.Style.find((style) => style['@attributes'].isDefault === 'true') || layer.Style[0]
        : layer?.Style;

      const legendUrl = foundStyle?.LegendURL?.['@attributes']?.['xlink:href'];

      if (legendUrl) {
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
   * Overrides the fetching of the legend for a WMTS layer.
   *
   * @returns The legend of the layer or null.
   */
  override async onFetchLegend(): Promise<TypeLegend | null> {
    // Get the config
    const layerConfig = this.getLayerConfig();

    try {
      // Get legend image
      const legendImage = await GVWMTS.#getLegendImage(layerConfig);

      // If legend image was read
      if (legendImage) {
        // Create image element directly to avoid recursion
        // GV: use direct Image constructor to avoid errors using GeoviewRenderer.loadImage
        const image = new Image();

        // Create promise for image loading
        const imageLoaded = new Promise<HTMLImageElement>((resolve, reject) => {
          image.onload = () => {
            resolve(image);
          };
          image.onerror = (error) => {
            reject(error);
          };
          // Set src to start loading
          image.src = legendImage as string;
        });

        // Wait for image to load
        const loadedImage = await imageLoaded;

        // If image was loaded successfully
        if (loadedImage && loadedImage.width > 0 && loadedImage.height > 0) {
          const drawingCanvas = document.createElement('canvas');
          drawingCanvas.width = image.width;
          drawingCanvas.height = image.height;
          const drawingContext = drawingCanvas.getContext('2d', { willReadFrequently: true })!;
          drawingContext.drawImage(image, 0, 0);

          // Return legend information
          return {
            type: CONST_LAYER_TYPES.WMTS,
            legend: drawingCanvas,
          };
        }
      }

      // No good
      return {
        type: CONST_LAYER_TYPES.WMTS,
        legend: null,
      };
    } catch (error: unknown) {
      logger.logError(`Error getting legend for ${layerConfig.layerPath}`, error);
      return null;
    }
  }

  // #endregion OVERRIDES
}
