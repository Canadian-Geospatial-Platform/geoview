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

/**
 * Manages an Esri Image layer.
 *
 * @exports
 * @class GVEsriImage
 */
export class GVEsriImage extends AbstractGVRaster {
  /**
   * Constructs a GVEsriImage layer to manage an OpenLayer layer.
   * @param {ImageArcGISRest} olSource - The OpenLayer source.
   * @param {EsriImageLayerEntryConfig} layerConfig - The layer configuration.
   */
  constructor(olSource: ImageArcGISRest, layerConfig: EsriImageLayerEntryConfig) {
    super(olSource, layerConfig);

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
      const legendJson = await Fetch.fetchEsriJson<TypeEsriImageLayerLegend>(`${layerConfig.getMetadataAccessPath()}/legend?f=json`);
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
          visible: layerConfig.getInitialSettings().states?.visible ?? true, // default: true
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
   * Applies a view filter to the layer. When the combineLegendFilter flag is false, the filter parameter is used alone to display
   * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
   * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
   * is done.
   * @param {string} filter - An optional filter to be used in place of the getViewFilter value.
   */
  applyViewFilter(filter: string | undefined = ''): void {
    // Log
    logger.logTraceCore('GV-ESRI-IMAGE - applyViewFilter', this.getLayerPath());

    // Process the layer filtering using the static method shared between EsriImage and WMS
    GVWMS.applyViewFilterOnSource(
      this.getLayerConfig(),
      this.getOLSource(),
      undefined,
      this.getExternalFragmentsOrder(),
      this,
      filter,
      (filterToUse: string) => {
        // Emit event
        this.emitLayerFilterApplied({
          filter: filterToUse,
        });
      }
    );
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
