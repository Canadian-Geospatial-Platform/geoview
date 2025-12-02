import WebGLTile from 'ol/layer/WebGLTile';
import type GeoTIFFSource from 'ol/source/GeoTIFF';
import type { Extent } from 'ol/extent';
import type { Projection as OLProjection } from 'ol/proj';

import type { GeoTIFFLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/geotiff-layer-entry-config';
import { AbstractGVTile } from '@/geo/layer/gv-layers/tile/abstract-gv-tile';
import { GVLayerUtilities } from '@/geo/layer/gv-layers/utils';
import { GeoUtilities } from '@/geo/utils/utilities';
import type { TypeOutfieldsType } from '@/api/types/map-schema-types';
import { Projection } from '@/geo/utils/projection';
import { type TypeLegend } from '@/index';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { logger } from '@/core/utils/logger';
import { Fetch } from '@/core/utils/fetch-helper';

/**
 * Manages a GeoTIFF layer.
 * @exports
 * @class GVGeoTIFF
 */
export class GVGeoTIFF extends AbstractGVTile {
  /**
   * Constructs a GVGeoTIFF layer to manage an OpenLayer layer.
   * @param {GeoTIFFSource} olSource - The OpenLayer source.
   * @param {GeoTIFFLayerEntryConfig} layerConfig - The layer configuration.
   */
  constructor(olSource: GeoTIFFSource, layerConfig: GeoTIFFLayerEntryConfig) {
    // Call parent constructor with source
    super(olSource, layerConfig);

    // Create WebGLTile layer
    const olLayer = new WebGLTile({
      source: olSource,
      properties: { layerConfig },
      className: `ol-layer-${layerConfig.layerId}`,
    });

    // Set the OpenLayer layer
    this.setOLLayer(olLayer);
  }

  // #region OVERRIDES

  /**
   * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
   * @override
   * @returns {WebGLTile} The strongly-typed OpenLayers type.
   */
  override getOLLayer(): WebGLTile {
    // Call parent and cast
    return super.getOLLayer() as WebGLTile;
  }

  /**
   * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
   * @override
   * @returns {GeoTIFFSource} The GeoTIFF source instance associated with this layer.
   */
  override getOLSource(): GeoTIFFSource {
    // Get source from OL
    return super.getOLSource() as GeoTIFFSource;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {GeoTIFFLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
   */
  override getLayerConfig(): GeoTIFFLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as GeoTIFFLayerEntryConfig;
  }

  /**
   * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
   * @param {string} fieldName - The field name for which we want to get the type.
   * @returns {TypeOutfieldsType} The type of the field.
   */
  protected override onGetFieldType(fieldName: string): TypeOutfieldsType {
    // Redirect
    return GVLayerUtilities.featureInfoGetFieldType(this.getLayerConfig(), fieldName);
  }

  /**
   * Overrides the way to get the bounds for this layer type.
   * @param {OLProjection} projection - The projection to get the bounds into.
   * @param {number} stops - The number of stops to use to generate the extent.
   * @returns {Extent | undefined} The layer bounding box.
   */
  override onGetBounds(projection: OLProjection, stops: number): Extent | undefined {
    // Get the source
    const source = this.getOLSource();

    // Get the source projection
    const sourceProjection = source?.getProjection() || undefined;

    // Get the layer bounds
    let sourceExtent = source?.getTileGrid()?.getExtent();

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
   * @param {GeoTIFFLayerEntryConfig} layerConfig - The layer configuration.
   * @returns {blob} A promise of an image blob
   * @private
   */
  static #getLegendImage(layerConfig: GeoTIFFLayerEntryConfig): Promise<string | ArrayBuffer | null> {
    const promisedImage = new Promise<string | ArrayBuffer | null>((resolve) => {
      const metadata = layerConfig.getServiceMetadata();
      // If there is a thumbnail asset in the metadata, use it as legend
      if (metadata?.assets?.thumbnail?.href) {
        const legendUrl = metadata.assets.thumbnail.href;

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
   * Overrides the fetching of the legend for a static image layer.
   * @override
   * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
   */
  override async onFetchLegend(): Promise<TypeLegend | null> {
    // Get the config
    const layerConfig = this.getLayerConfig();

    try {
      // Get legend image
      const legendImage = await GVGeoTIFF.#getLegendImage(layerConfig);

      // If legend image was read
      if (legendImage) {
        // Create image element directly to avoid recursion
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
            type: CONST_LAYER_TYPES.GEOTIFF,
            legend: drawingCanvas,
          };
        }
      }

      // No good
      return {
        type: CONST_LAYER_TYPES.GEOTIFF,
        legend: null,
      };
    } catch (error: unknown) {
      logger.logError(`Error getting legend for ${layerConfig.layerPath}`, error);
      return null;
    }
  }

  // #endregion OVERRIDES
}
