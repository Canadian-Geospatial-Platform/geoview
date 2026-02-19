import type { ImageArcGISRest } from 'ol/source';
import type { Options as ImageOptions } from 'ol/layer/BaseImage';
import { Image as ImageLayer } from 'ol/layer';
import type { Extent } from 'ol/extent';
import type { Projection as OLProjection } from 'ol/proj';

import { logger } from '@/core/utils/logger';
import type { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import type {
  TypeIconSymbolVectorConfig,
  TypeLayerStyleConfig,
  TypeLayerStyleConfigInfo,
  TypeLayerStyleSettings,
} from '@/api/types/map-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { GeoUtilities } from '@/geo/utils/utilities';
import { GeoviewRenderer } from '@/geo/utils/renderer/geoview-renderer';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import type { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { Projection } from '@/geo/utils/projection';
import { Fetch } from '@/core/utils/fetch-helper';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import type { LayerFilters } from '@/geo/layer/gv-layers/layer-filters';
import type { TypeMetadataEsriRasterFunctionInfos } from '@/api/types/layer-schema-types';

/**
 * Manages an Esri Image layer.
 *
 * @exports
 * @class GVEsriImage
 */
export class GVEsriImage extends AbstractGVRaster {
  /** The currently active raster function id */
  #rasterFunction?: string;

  /** The cache of image previews for the different raster functions */
  #rasterFunctionPreviewCache = new Map<string, string>();

  /**
   * Constructs a GVEsriImage layer to manage an OpenLayer layer.
   * @param {ImageArcGISRest} olSource - The OpenLayer source.
   * @param {EsriImageLayerEntryConfig} layerConfig - The layer configuration.
   */
  constructor(olSource: ImageArcGISRest, layerConfig: EsriImageLayerEntryConfig) {
    super(olSource, layerConfig);

    // Initialize the active raster function from config's initial value
    this.#rasterFunction = layerConfig.getInitialRasterFunction();

    // Create the image layer options.
    const imageLayerOptions: ImageOptions<ImageArcGISRest> = {
      source: olSource,
      properties: { layerConfig },
    };

    // Init the layer options with initial settings
    AbstractGVRaster.initOptionsWithInitialSettings(imageLayerOptions, layerConfig);

    // Create and set the OpenLayer layer
    this.setOLLayer(new ImageLayer(imageLayerOptions));
  }

  // #region OVERRIDES

  /**
   * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
   * @override
   * @returns {ImageLayer<ImageArcGISRest>} The strongly-typed OpenLayers type.
   */
  override getOLLayer(): ImageLayer<ImageArcGISRest> {
    // Call parent and cast
    return super.getOLLayer() as ImageLayer<ImageArcGISRest>;
  }

  /**
   * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
   * @override
   * @returns {ImageArcGISRest} The ImageArcGISRest source instance associated with this layer.
   */
  override getOLSource(): ImageArcGISRest {
    // Get source from OL
    return super.getOLSource() as ImageArcGISRest;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {EsriImageLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
   */
  override getLayerConfig(): EsriImageLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as EsriImageLayerEntryConfig;
  }

  /**
   * Overrides the fetching of the legend for an Esri image layer.
   * @override
   * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
   */
  override async onFetchLegend(): Promise<TypeLegend | null> {
    const layerConfig = this.getLayerConfig();
    try {
      if (!layerConfig) return null;

      // Build legend URL with optional raster function
      let legendUrl = `${layerConfig.getMetadataAccessPath()}/legend?f=json`;
      const rasterFunction = this.#rasterFunction;
      if (rasterFunction) {
        const renderingRule = encodeURIComponent(JSON.stringify({ rasterFunction }));
        legendUrl += `&renderingRule=${renderingRule}`;
      }

      const legendJson = await Fetch.fetchEsriJson<TypeEsriImageLayerLegend>(legendUrl);
      let legendInfo;
      if (legendJson.layers && legendJson.layers.length === 1) {
        legendInfo = legendJson.layers[0].legend;
      } else if (legendJson.layers.length) {
        const layerInfo = legendJson.layers.find((layer) => Number(layer.layerId) === Number(layerConfig.layerId));
        if (layerInfo) legendInfo = layerInfo.legend;
      }
      if (!legendInfo) {
        const legend: TypeLegend = {
          type: CONST_LAYER_TYPES.ESRI_IMAGE,
          styleConfig: this.getStyle(),
          legend: null,
        };
        return legend;
      }
      const uniqueValueStyleInfo: TypeLayerStyleConfigInfo[] = [];
      legendInfo.forEach((info) => {
        const styleInfo: TypeLayerStyleConfigInfo = {
          label: info.label,
          visible: layerConfig.getInitialSettings()?.states?.visible ?? true, // default: true
          values: info.label.split(','),
          settings: {
            type: 'iconSymbol',
            mimeType: info.contentType,
            src: info.imageData,
            width: info.width,
            height: info.height,
          } as TypeIconSymbolVectorConfig,
        };
        uniqueValueStyleInfo.push(styleInfo);
      });
      const styleSettings: TypeLayerStyleSettings = {
        type: 'uniqueValue',
        fields: ['default'],
        hasDefault: false,
        info: uniqueValueStyleInfo,
      };
      const styleConfig: TypeLayerStyleConfig = {
        Point: styleSettings,
      };

      const legend: TypeLegend = {
        type: CONST_LAYER_TYPES.ESRI_IMAGE,
        styleConfig,
        legend: await GeoviewRenderer.getLegendStyles(styleConfig),
      };

      return legend;
    } catch (error: unknown) {
      logger.logError(`Get Legend for ${layerConfig.layerPath} error`, error);
      return null;
    }
  }

  /**
   * Overrides when the style should be set by the fetched legend.
   * @param {TypeLegend} legend - The legend type
   * @override
   */
  override onSetStyleAccordingToLegend(legend: TypeLegend): void {
    // Set the style
    this.setStyle(legend.styleConfig!);
  }

  /**
   * Overrides the way to get the bounds for this layer type.
   * @param {OLProjection} projection - The projection to get the bounds into.
   * @param {number} stops - The number of stops to use to generate the extent.
   * @override
   * @returns {Extent | undefined} The layer bounding box.
   */
  override onGetBounds(projection: OLProjection, stops: number): Extent | undefined {
    // Get the metadata projection
    const metadataProjection = this.getMetadataProjection();

    // Get the metadata extent
    let metadataExtent = this.getMetadataExtent();

    // If both found
    if (metadataExtent && metadataProjection) {
      // Transform extent to given projection
      metadataExtent = Projection.transformExtentFromProj(metadataExtent, metadataProjection, projection, stops);
      metadataExtent = GeoUtilities.validateExtent(metadataExtent, projection.getCode());
    }

    // Return the calculated layer bounds
    return metadataExtent;
  }

  /**
   * Overrides the way a WMS layer applies a view filter. It does so by updating the source TIME parameters.
   * @param {LayerFilters} [filter] - An optional filter to be used in place of the getViewFilter value.
   */
  protected override onSetLayerFilters(filter?: LayerFilters): void {
    // Process the layer filtering using the static method shared between EsriImage and WMS
    GVWMS.applyViewFilterOnSource(this.getLayerConfig(), this.getOLSource(), filter);
  }

  // #endregion OVERRIDES

  // #region METHODS

  /**
   * Gets the list of rasterFunctionInfos that are available in the ImageServer
   * @returns {TypeMetadataEsriRasterFunctionInfo[]} The ImageServer's rasterFunctionInfos
   * @protected
   */
  protected getMetadataRasterFunctionInfos(): TypeMetadataEsriRasterFunctionInfos[] | undefined {
    return this.getLayerConfig().getRasterFunctionInfos();
  }

  /**
   * Gets the currently active raster function identifier.
   * @returns {string | undefined} The raster function identifier
   */
  getRasterFunction(): string | undefined {
    return this.#rasterFunction;
  }

  /**
   * Updates the raster function for the layer
   * @param {string | undefined} rasterFunctionId - The raster function ID to apply
   * @returns {void}
   */
  updateRasterFunction(rasterFunctionId: string | undefined): void {
    // Update the config
    this.#rasterFunction = rasterFunctionId;

    // Prepare the renderingRule / rasterFunction parameter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: Record<string, any> = {};
    if (rasterFunctionId) {
      params.renderingRule = JSON.stringify({ rasterFunction: rasterFunctionId });
    }

    // Update the OpenLayers source
    this.getOLSource().updateParams(params);
  }

  /**
   * Gets individual preview promises for each raster function
   * @param {number} [size=400] - The size of the preview image (width and height)
   * @returns {Map<string, Promise<string>>} Map of raster function names to preview promises
   */
  getRasterFunctionPreviews(size: number = 400): Map<string, Promise<string>> {
    const promises = new Map<string, Promise<string>>();
    const rasterFunctionInfos = this.getMetadataRasterFunctionInfos();
    const layerConfig = this.getLayerConfig();

    if (!rasterFunctionInfos || !layerConfig) return promises;

    const bounds = this.getMetadataExtent();
    if (!bounds) return promises;

    const baseUrl = layerConfig.getMetadataAccessPath();
    const bbox = bounds.join(',');

    rasterFunctionInfos.forEach((info) => {
      // Check cache first
      if (this.#rasterFunctionPreviewCache.has(info.name)) {
        promises.set(info.name, Promise.resolve(this.#rasterFunctionPreviewCache.get(info.name)!));
        return;
      }

      // Create individual promise
      const promise = (async () => {
        try {
          const renderingRule = encodeURIComponent(JSON.stringify({ rasterFunction: info.name }));
          const previewUrl = `${baseUrl}/exportImage?bbox=${bbox}&size=${size},${size}&f=image&renderingRule=${renderingRule}`;

          const response = await fetch(previewUrl);
          if (response.ok) {
            const blob = await response.blob();
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });

            // Cache the result
            this.#rasterFunctionPreviewCache.set(info.name, base64);
            return base64;
          }
          throw new Error('Failed to fetch');
        } catch (error) {
          logger.logWarning(`Failed to fetch preview for raster function ${info.name}`, error);
          throw error;
        }
      })();

      promises.set(info.name, promise);
    });

    return promises;
  }

  // #endregion METHODS
}

// Exported for use in ESRI Dynamic raster layers
export type TypeEsriImageLayerLegend = {
  layers: TypeEsriImageLayerLegendLayer[];
};

export type TypeEsriImageLayerLegendLayer = {
  layerId: number | string;
  layerName: string;
  layerType: string;
  minScale: number;
  maxScale: number;
  legendType: string;
  legend: TypeEsriImageLayerLegendLayerLegend[];
};

export type TypeEsriImageLayerLegendLayerLegend = {
  label: string;
  url: string;
  imageData: string;
  contentType: string;
  height: number;
  width: number;
  values: string[];
};
