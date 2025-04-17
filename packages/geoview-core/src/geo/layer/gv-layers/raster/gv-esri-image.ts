import { ImageArcGISRest } from 'ol/source';
import { Options as ImageOptions } from 'ol/layer/BaseImage';
import { Image as ImageLayer } from 'ol/layer';
import { Extent } from 'ol/extent';

import { logger } from '@/core/utils/logger';
import { EsriImageLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import {
  TypeIconSymbolVectorConfig,
  TypeLayerStyleConfig,
  TypeLayerStyleConfigInfo,
  TypeLayerStyleSettings,
} from '@/api/config/types/map-schema-types';
import { parseDateTimeValuesEsriImageOrWMS } from '@/geo/layer/gv-layers/utils';
import { validateExtent } from '@/geo/utils/utilities';
import { getLegendStyles } from '@/geo/utils/renderer/geoview-renderer';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';

/**
 * Manages an Esri Image layer.
 *
 * @exports
 * @class GVEsriImage
 */
export class GVEsriImage extends AbstractGVRaster {
  /**
   * Constructs a GVEsriImage layer to manage an OpenLayer layer.
   * @param {string} mapId - The map id
   * @param {ImageArcGISRest} olSource - The OpenLayer source.
   * @param {EsriImageLayerEntryConfig} layerConfig - The layer configuration.
   */
  public constructor(mapId: string, olSource: ImageArcGISRest, layerConfig: EsriImageLayerEntryConfig) {
    super(mapId, olSource, layerConfig);

    // Create the image layer options.
    const imageLayerOptions: ImageOptions<ImageArcGISRest> = {
      source: olSource,
      properties: { layerConfig },
    };

    // Init the layer options with initial settings
    AbstractGVRaster.initOptionsWithInitialSettings(imageLayerOptions, layerConfig);

    // Create and set the OpenLayer layer
    this.olLayer = new ImageLayer(imageLayerOptions);
  }

  /**
   * Overrides the get of the OpenLayers Layer
   * @returns {ImageLayer<ImageArcGISRest>} The OpenLayers Layer
   */
  override getOLLayer(): ImageLayer<ImageArcGISRest> {
    // Call parent and cast
    return super.getOLLayer() as ImageLayer<ImageArcGISRest>;
  }

  /**
   * Overrides the get of the OpenLayers Layer Source
   * @returns {ImageArcGISRest} The OpenLayers Layer Source
   */
  override getOLSource(): ImageArcGISRest {
    // Get source from OL
    return super.getOLSource() as ImageArcGISRest;
  }

  /**
   * Overrides the get of the layer configuration associated with the layer.
   * @returns {EsriImageLayerEntryConfig} The layer configuration or undefined if not found.
   */
  override getLayerConfig(): EsriImageLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as EsriImageLayerEntryConfig;
  }

  /**
   * Overrides the fetching of the legend for an Esri image layer.
   * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
   */
  override async onFetchLegend(): Promise<TypeLegend | null> {
    const layerConfig = this.getLayerConfig();
    try {
      if (!layerConfig) return null;
      const legendUrl = `${layerConfig.geoviewLayerConfig.metadataAccessPath}/legend?f=json`;
      const response = await fetch(legendUrl);
      const legendJson: TypeEsriImageLayerLegend = await response.json();
      let legendInfo;
      if (legendJson.layers && legendJson.layers.length === 1) {
        legendInfo = legendJson.layers[0].legend;
      } else if (legendJson.layers.length) {
        const layerInfo = legendJson.layers.find((layer) => layer.layerId === layerConfig.layerId);
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
          visible: layerConfig.initialSettings.states?.visible || true,
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
        legend: await getLegendStyles(styleConfig),
      };

      return legend;
    } catch (error) {
      logger.logError(`Get Legend for ${layerConfig.layerPath} error`, error);
      return null;
    }
  }

  /**
   * Overrides when the style should be set by the fetched legend.
   * @param legend
   */
  override onSetStyleAccordingToLegend(legend: TypeLegend): void {
    // Set the style
    this.setStyle(legend.styleConfig!);
  }

  /**
   * Overrides when the layer gets in loaded status.
   */
  override onLoaded(): void {
    // Call parent
    super.onLoaded();

    // Apply view filter immediately
    this.applyViewFilter(this.getLayerConfig().layerFilter || '');
  }

  /**
   * Applies a view filter to the layer. When the combineLegendFilter flag is false, the filter paramater is used alone to display
   * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
   * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
   * is done.
   * @param {string} filter - An optional filter to be used in place of the getViewFilter value.
   * @param {boolean} combineLegendFilter - Flag used to combine the legend filter and the filter together (default: true)
   */
  applyViewFilter(filter: string, combineLegendFilter: boolean = true): void {
    // Log
    logger.logTraceCore('GV-ESRI-IMAGE - applyViewFilter', this.getLayerPath());

    const layerConfig = this.getLayerConfig();
    const olLayer = this.getOLLayer();

    // Get source
    const source = olLayer.getSource();
    if (source) {
      // Update the layer config on the fly (maybe not ideal to do this?)
      layerConfig.legendFilterIsOff = !combineLegendFilter;
      if (combineLegendFilter) layerConfig.layerFilter = filter;

      if (filter) {
        let filterValueToUse: string = filter.replaceAll(/\s{2,}/g, ' ').trim();
        const queryElements = filterValueToUse.split(/(?<=\b)\s*=/);
        const dimension = queryElements[0].trim();
        filterValueToUse = queryElements[1].trim();

        // Parse the filter value to use
        filterValueToUse = parseDateTimeValuesEsriImageOrWMS(filterValueToUse, this.getExternalFragmentsOrder());

        source.updateParams({ [dimension]: filterValueToUse.replace(/\s*/g, '') });
        olLayer.changed();

        // Emit event
        this.emitLayerFilterApplied({
          filter: filterValueToUse,
        });
      }
    }
  }

  /**
   * Overrides the way to get the bounds for this layer type.
   * @returns {Extent | undefined} The layer bounding box.
   */
  override onGetBounds(): Extent | undefined {
    // Get the metadata extent
    const metadataExtent = this.getMetadataExtent();

    // If found
    let layerBounds;
    if (metadataExtent) {
      // Get the metadata projection
      const metadataProjection = this.getMetadataProjection();
      layerBounds = this.getMapViewer().convertExtentFromProjToMapProj(metadataExtent, metadataProjection);
      layerBounds = validateExtent(layerBounds, this.getMapViewer().getProjection().getCode());
    }

    // Return the calculated layer bounds
    return layerBounds;
  }
}

// Exported for use in ESRI Dynamic raster layers
export interface TypeEsriImageLayerLegend {
  layers: {
    layerId: number | string;
    layerName: string;
    layerType: string;
    minScale: number;
    maxScale: number;
    legendType: string;
    legend: {
      label: string;
      url: string;
      imageData: string;
      contentType: string;
      height: number;
      width: number;
      values: string[];
    }[];
  }[];
}
