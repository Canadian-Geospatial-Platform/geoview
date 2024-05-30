import { ImageArcGISRest } from 'ol/source';
import { Image as ImageLayer } from 'ol/layer';
import { Extent } from 'ol/extent';

import { getLocalizedValue } from '@/core/utils/utilities';
import { getMinOrMaxExtents } from '@/geo/utils/utilities';
import { DateMgt } from '@/core/utils/date-mgt';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { logger } from '@/core/utils/logger';
import { EsriImageLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { codedValueType, rangeDomainType } from '@/geo/layer/layer-sets/abstract-layer-set';
import { CONST_LAYER_TYPES, TypeLegend } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { Projection } from '@/geo/utils/projection';
import { TypeUniqueValueStyleConfig, TypeUniqueValueStyleInfo, TypeStyleConfig } from '@/geo/map/map-schema-types';
import { esriGetFieldType, esriGetFieldDomain } from '../utils';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { getLegendStyles } from '@/geo/utils/renderer/geoview-renderer';
import { AbstractGVRaster } from './abstract-gv-raster';

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
   * @param {ImageLayer<ImageArcGISRest>} olLayer - The OpenLayer layer.
   * @param {EsriImageLayerEntryConfig} layerConfig - The layer configuration.
   */
  public constructor(mapId: string, olLayer: ImageLayer<ImageArcGISRest>, layerConfig: EsriImageLayerEntryConfig) {
    super(mapId, olLayer, layerConfig);
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
   * Overrides the get of the layer configuration associated with the layer.
   * @returns {EsriImageLayerEntryConfig} The layer configuration or undefined if not found.
   */
  override getLayerConfig(): EsriImageLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as EsriImageLayerEntryConfig;
  }

  /**
   * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
   * @param {string} fieldName - The field name for which we want to get the type.
   * @returns {'string' | 'date' | 'number'} The type of the field.
   */
  protected override getFieldType(fieldName: string): 'string' | 'date' | 'number' {
    // TODO: Refactor - Layers refactoring. Is this function really valid for an esri-image? Remove?
    // Redirect
    return esriGetFieldType(this.getLayerConfig(), fieldName);
  }

  /**
   * Overrides the return of the domain of the specified field.
   * @param {string} fieldName - The field name for which we want to get the domain.
   * @returns {codedValueType | rangeDomainType | null} The domain of the field.
   */
  protected override getFieldDomain(fieldName: string): null | codedValueType | rangeDomainType {
    // Redirect
    return esriGetFieldDomain(this.getLayerConfig(), fieldName);
  }

  /**
   * Overrides the fetching of the legend for an Esri image layer.
   * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
   */
  override async getLegend(): Promise<TypeLegend | null> {
    const layerConfig = this.getLayerConfig();
    try {
      if (!layerConfig) return null;
      const legendUrl = `${getLocalizedValue(
        layerConfig.geoviewLayerConfig.metadataAccessPath,
        AppEventProcessor.getDisplayLanguage(this.getMapId())
      )}/legend?f=pjson`;
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
          layerName: layerConfig.layerName!,
          styleConfig: layerConfig.style,
          legend: null,
        };
        return legend;
      }
      const uniqueValueStyleInfo: TypeUniqueValueStyleInfo[] = [];
      legendInfo.forEach((info) => {
        const styleInfo: TypeUniqueValueStyleInfo = {
          label: info.label,
          values: info.label.split(','),
          settings: {
            type: 'iconSymbol',
            mimeType: info.contentType,
            src: info.imageData,
            width: info.width,
            height: info.height,
          },
        };
        uniqueValueStyleInfo.push(styleInfo);
      });
      const styleSettings: TypeUniqueValueStyleConfig = {
        styleType: 'uniqueValue',
        fields: ['default'],
        uniqueValueStyleInfo,
      };
      const styleConfig: TypeStyleConfig = {
        Point: styleSettings,
      };
      layerConfig.style = styleConfig;
      const legend: TypeLegend = {
        type: CONST_LAYER_TYPES.ESRI_IMAGE,
        layerName: layerConfig?.layerName,
        styleConfig,
        legend: await getLegendStyles(
          layerConfig as AbstractBaseLayerEntryConfig & {
            style: TypeStyleConfig;
          }
        ),
      };
      return legend;
    } catch (error) {
      logger.logError(`Get Legend for ${layerConfig.layerPath} error`, error);
      return null;
    }
  }

  /**
   * Overrides when the layer gets in loaded status.
   */
  override onLoaded(): void {
    // Call parent
    super.onLoaded();

    // Apply view filter immediately (no need to provide a layer path here so '' is sent (hybrid work))
    this.applyViewFilter('', this.getLayerConfig().layerFilter || '');
  }

  /**
   * Applies a view filter to the layer. When the combineLegendFilter flag is false, the filter paramater is used alone to display
   * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
   * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
   * is done.
   * @param {string} filter - An optional filter to be used in place of the getViewFilter value.
   * @param {boolean} combineLegendFilter - Flag used to combine the legend filter and the filter together (default: true)
   */
  applyViewFilter(layerPath: string, filter: string, combineLegendFilter?: boolean): void {
    // TODO: Refactor - Layers refactoring. Remove the layerPath parameter once hybrid work is done
    // Log
    logger.logTraceCore('GV-ESRI-IMAGE - applyViewFilter', layerPath);

    const layerConfig = this.getLayerConfig();
    const olLayer = this.getOLLayer();

    // Get source
    const source = olLayer.getSource();
    if (source) {
      let filterValueToUse = filter;
      layerConfig.legendFilterIsOff = !combineLegendFilter;
      if (combineLegendFilter) layerConfig.layerFilter = filter;

      if (filterValueToUse) {
        filterValueToUse = filterValueToUse.replaceAll(/\s{2,}/g, ' ').trim();
        const queryElements = filterValueToUse.split(/(?<=\b)\s*=/);
        const dimension = queryElements[0].trim();
        filterValueToUse = queryElements[1].trim();

        // Convert date constants using the externalFragmentsOrder derived from the externalDateFormat
        const searchDateEntry = [
          ...`${filterValueToUse} `.matchAll(/(?<=^date\b\s')[\d/\-T\s:+Z]{4,25}(?=')|(?<=[(\s]date\b\s')[\d/\-T\s:+Z]{4,25}(?=')/gi),
        ];
        searchDateEntry.reverse();
        searchDateEntry.forEach((dateFound) => {
          // If the date has a time zone, keep it as is, otherwise reverse its time zone by changing its sign
          const reverseTimeZone = ![20, 25].includes(dateFound[0].length);
          const reformattedDate = DateMgt.applyInputDateFormat(dateFound[0], this.getExternalFragmentsOrder(), reverseTimeZone);
          filterValueToUse = `${filterValueToUse!.slice(0, dateFound.index! - 6)}${reformattedDate}${filterValueToUse!.slice(
            dateFound.index! + dateFound[0].length + 2
          )}`;
        });
        source.updateParams({ [dimension]: filterValueToUse.replace(/\s*/g, '') });
        olLayer.changed();
      }
    }
  }

  /**
   * Gets the bounds of the layer and returns updated bounds
   * @param {Extent | undefined} bounds The current bounding box to be adjusted.
   * @returns {Extent | undefined} The new layer bounding box.
   */
  protected getBounds(bounds?: Extent): Extent | undefined {
    const layerConfig = this.getLayerConfig();
    const layerBounds = layerConfig?.initialSettings?.bounds || [];
    const projection =
      layerConfig.getMetadata()?.fullExtent?.spatialReference?.wkid || MapEventProcessor.getMapState(this.getMapId()).currentProjection;

    if (layerConfig.getMetadata()?.fullExtent) {
      layerBounds[0] = layerConfig.getMetadata()?.fullExtent.xmin as number;
      layerBounds[1] = layerConfig.getMetadata()?.fullExtent.ymin as number;
      layerBounds[2] = layerConfig.getMetadata()?.fullExtent.xmax as number;
      layerBounds[3] = layerConfig.getMetadata()?.fullExtent.ymax as number;
    }

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

interface TypeEsriImageLayerLegend {
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
