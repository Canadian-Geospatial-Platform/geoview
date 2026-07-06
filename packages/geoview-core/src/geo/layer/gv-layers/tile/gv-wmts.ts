import TileLayer from 'ol/layer/Tile';
import type { Options as TileOptions } from 'ol/layer/BaseTile';
import type WMTSSource from 'ol/source/WMTS';
import type { Extent } from 'ol/extent';
import type { Projection as OLProjection } from 'ol/proj';

import type {
  OgcWmtsLayerEntryConfig,
  TypeMetadataWMTSLayer,
} from '@/api/config/validation-classes/raster-validation-classes/ogc-wmts-layer-entry-config';
import { CONST_LAYER_TYPES, type TypeLegend } from '@/api/types/layer-schema-types';
import { AbstractGVTile } from '@/geo/layer/gv-layers/tile/abstract-gv-tile';
import { GeoUtilities } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { Fetch } from '@/core/utils/fetch-helper';
import { logger } from '@/core/utils/logger';
import type { TypeEsriImageLayerLegend } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import { GeoviewRenderer } from '@/geo/utils/renderer/geoview-renderer';

/**
 * Manages a WMTS layer.
 */
export class GVWMTS extends AbstractGVTile {
  /**
   * Constructs a GVWMTS layer to manage an OpenLayer layer.
   *
   * @param olSource - The OpenLayer source.
   * @param layerConfig - The layer configuration.
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
  protected override getOLSource(): WMTSSource {
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
   * Overrides the way to initialize the bounds for this layer type.
   *
   * @param projection - The projection to initialize the bounds into.
   * @param stops - The number of stops to use to generate the extent.
   * @returns A promise that resolves with the layer bounding box or undefined when not found
   */
  override async onInitBounds(projection: OLProjection, stops: number): Promise<Extent | undefined> {
    // Wait for the source to be ready, just in case the caller is early
    await this.waitForSourceReady();

    // Get the OpenLayers source (not the configured source property)
    const source = this.getOLSource();

    // Get the source projection
    const sourceProjection = source.getProjection() ?? undefined;

    // Get the layer bounds
    let sourceExtent = source.getTileGrid()?.getExtent();

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
   * Overrides the fetching of the legend for a WMTS layer.
   *
   * @returns A promise that resolves with the legend of the layer or null
   */
  override async onFetchLegend(): Promise<TypeLegend | null> {
    // Get the config
    const layerConfig = this.getLayerConfig();

    try {
      // Get legend image
      const legendImage = await GVWMTS.#getLegendImage(layerConfig);

      // If legend image was read
      if (legendImage) {
        // Create image element directly to avoid recursion.
        // GV: use direct Image constructor to avoid errors using GeoviewRenderer.loadImage
        const loadedImage = await GeoviewRenderer.loadImageFromDataUrl(legendImage);

        // If image was loaded successfully
        if (loadedImage.width > 0 && loadedImage.height > 0) {
          return {
            type: CONST_LAYER_TYPES.WMTS,
            legend: GeoviewRenderer.createCanvasFromImage(loadedImage),
          };
        }
      }

      // Here, no image could be found, try using a legend? endpoint (Esri ArcGIS WMTS layer?)
      const metadataAccessPath = layerConfig.getMetadataAccessPath();
      const { looksLikeArcGisWmtsService, normalizedMetadataAccessPath } = GVWMTS.#looksLikeArcGisWmtsServiceUrl(metadataAccessPath);
      if (looksLikeArcGisWmtsService && normalizedMetadataAccessPath) {
        const legendUrl = `${normalizedMetadataAccessPath}/legend?f=json`;

        const legendJson = await Fetch.fetchEsriJson<TypeEsriImageLayerLegend>(legendUrl);
        const layerInfo = legendJson.layers?.find((lyr) => lyr.layerId.toString() === layerConfig.layerId) ?? legendJson.layers?.[0];
        const legendInfo = layerInfo?.legend;

        if (legendInfo) {
          const styleConfig = GeoviewRenderer.createPointStyleConfigFromEsriLegend(
            legendInfo,
            layerConfig.getInitialSettings()?.states?.visible ?? true // default: true
          );

          return {
            type: CONST_LAYER_TYPES.ESRI_IMAGE,
            styleConfig,
            legend: await GeoviewRenderer.getLegendStyles(styleConfig),
          };
        }
      }

      // No good
      return {
        type: CONST_LAYER_TYPES.ESRI_IMAGE,
        styleConfig: this.getStyle(),
        legend: null,
      };
    } catch (error: unknown) {
      logger.logError(`Error getting legend for ${layerConfig.layerPath}`, error);
      return null;
    }
  }

  // #endregion OVERRIDES

  // #region STATIC METHODS

  /**
   * Gets the legend image of a layer.
   *
   * @param layerConfig - The layer configuration.
   * @returns A promise that resolves with the legend image as a data URL or null
   */
  static async #getLegendImage(layerConfig: OgcWmtsLayerEntryConfig): Promise<string | null> {
    const metadata = layerConfig.getLayerMetadata();
    const layer = metadata?.Layer as TypeMetadataWMTSLayer | undefined;
    const foundStyle = Array.isArray(layer?.Style)
      ? layer.Style.find((style) => style['@attributes'].isDefault === 'true') || layer.Style[0]
      : layer?.Style;
    const legendUrl = foundStyle?.LegendURL?.['@attributes']?.['xlink:href'];

    if (legendUrl) {
      try {
        const legendBlob = await Fetch.fetchBlob(legendUrl, { credentials: 'omit' });
        return await GeoviewRenderer.readBlobAsDataUrl(legendBlob);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Checks whether a metadata access URL looks like an ArcGIS-backed WMTS service.
   *
   * @param metadataAccessPath - The metadata access URL to evaluate
   * @returns A result object with ArcGIS WMTS detection status and normalized service URL
   */
  static #looksLikeArcGisWmtsServiceUrl(metadataAccessPath: string | undefined): {
    looksLikeArcGisWmtsService: boolean;
    normalizedMetadataAccessPath: string | undefined;
  } {
    if (!metadataAccessPath) {
      return {
        looksLikeArcGisWmtsService: false,
        normalizedMetadataAccessPath: undefined,
      };
    }

    const lowerUrl = metadataAccessPath?.toLowerCase() ?? '';
    if (!(lowerUrl.includes('/mapserver') || lowerUrl.includes('/imageserver')) || !lowerUrl.includes('/wmts')) {
      return {
        looksLikeArcGisWmtsService: false,
        normalizedMetadataAccessPath: undefined,
      };
    }

    const strippedUrlMatch = metadataAccessPath.match(/^(.*\/(?:MapServer|ImageServer)\/WMTS)(?:[/?].*)?$/i);
    if (!strippedUrlMatch?.[1]) {
      return {
        looksLikeArcGisWmtsService: false,
        normalizedMetadataAccessPath: undefined,
      };
    }

    return {
      looksLikeArcGisWmtsService: true,
      normalizedMetadataAccessPath: strippedUrlMatch[1],
    };
  }

  // #endregion STATIC METHODS
}
