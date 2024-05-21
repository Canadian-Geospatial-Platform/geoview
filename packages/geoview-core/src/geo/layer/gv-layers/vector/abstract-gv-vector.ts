import BaseLayer from 'ol/layer/Base';
import BaseVectorLayer from 'ol/layer/BaseVector';
import VectorSource from 'ol/source/Vector';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';
import { Pixel } from 'ol/pixel';
import Feature from 'ol/Feature';

import { DateMgt } from '@/core/utils/date-mgt';
import { getMinOrMaxExtents } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { NodeType } from '@/geo/utils/renderer/geoview-renderer-types';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { logger } from '@/core/utils/logger';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeFeatureInfoEntry } from '@/geo/layer/layer-sets/abstract-layer-set';
import { analyzeLayerFilter } from '@/geo/utils/renderer/geoview-renderer';
import { featureInfoGetFieldType } from '../utils';
import { AbstractGVLayer } from '../abstract-gv-layer';

/**
 * Abstract Geoview Layer managing an OpenLayer vector type layer.
 */
export abstract class AbstractGVVector extends AbstractGVLayer {
  /**
   * Overrides the get of the OpenLayers Layer
   * @returns {BaseVectorLayer<VectorSource<Feature>, any>} The OpenLayers Layer
   */
  // Disabling 'any', because too many renderer types in OpenLayers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override getOLLayer(): BaseVectorLayer<VectorSource<Feature>, any> {
    // Call parent and cast
    // Disabling 'any', because too many renderer types in OpenLayers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return super.getOLLayer() as BaseVectorLayer<VectorSource<Feature>, any>;
  }

  /**
   * Overrides the get of the layer configuration associated with the layer.
   * @returns {VectorLayerEntryConfig} The layer configuration or undefined if not found.
   */
  override getLayerConfig(): VectorLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as VectorLayerEntryConfig;
  }

  /**
   * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
   * @param {string} fieldName - The field name for which we want to get the type.
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer configuration.
   * @returns {'string' | 'date' | 'number'} The type of the field.
   */
  protected override getFieldType(fieldName: string): 'string' | 'date' | 'number' {
    // Redirect
    return featureInfoGetFieldType(this.getLayerConfig(), fieldName, AppEventProcessor.getDisplayLanguage(this.getMapId()));
  }

  /**
   * Overrides the get all feature information for all the features stored in the layer.
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override getAllFeatureInfo(): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    try {
      // Get the layer config in a loaded phase
      const layerConfig = this.getLayerConfig();
      const layer = this.getOLLayer();
      const features = layer.getSource()!.getFeatures();
      return this.formatFeatureInfoResult(features, layerConfig);
    } catch (error) {
      // Log
      logger.logError('abstract-gv-vector.getAllFeatureInfo()\n', error);
      return Promise.resolve(null);
    }
  }

  /**
   * Overrides the return of feature information at a given pixel location.
   * @param {Coordinate} location - The pixel coordinate that will be used by the query.
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override getFeatureInfoAtPixel(location: Pixel): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    try {
      // Get the layer config in a loaded phase
      const layerConfig = this.getLayerConfig();
      // TODO: Check - Why getting the layerConfig this way here!? Use regular way instead?
      const layerFilter = (layer: BaseLayer): boolean => {
        const layerSource = layer.get('layerConfig')?.source;
        const configSource = layerConfig?.source;
        return layerSource !== undefined && configSource !== undefined && layerSource === configSource;
      };
      const { map } = MapEventProcessor.getMapViewer(this.getMapId());
      const features = map.getFeaturesAtPixel(location, { hitTolerance: 4, layerFilter });
      return this.formatFeatureInfoResult(features as Feature[], layerConfig as VectorLayerEntryConfig);
    } catch (error) {
      // Log
      logger.logError('abstract-gv-vector.getFeatureInfoAtPixel()\n', error);
      return Promise.resolve(null);
    }
  }

  /**
   * Overrides the return of feature information at a given coordinate.
   * @param {Coordinate} location - The coordinate that will be used by the query.
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override getFeatureInfoAtCoordinate(location: Coordinate): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    const { map } = MapEventProcessor.getMapViewer(this.getMapId());
    return this.getFeatureInfoAtPixel(map.getPixelFromCoordinate(location as Coordinate));
  }

  /**
   * Overrides the return of feature information at the provided long lat coordinate.
   * @param {Coordinate} lnglat - The coordinate that will be used by the query.
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override getFeatureInfoAtLongLat(location: Coordinate): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    const { map } = MapEventProcessor.getMapViewer(this.getMapId());
    const convertedLocation = Projection.transform(
      location,
      Projection.PROJECTION_NAMES.LNGLAT,
      `EPSG:${MapEventProcessor.getMapState(this.getMapId()).currentProjection}`
    );
    return this.getFeatureInfoAtPixel(map.getPixelFromCoordinate(convertedLocation as Coordinate));
  }

  /**
   * Overrides when the layer gets in loaded status.
   */
  protected override onLoaded(): void {
    // Call parent
    super.onLoaded();

    // Apply view filter immediately (no need to provide a layer path here so '' is sent (hybrid work))
    this.applyViewFilter('', this.getLayerConfig().layerFilter || '');
  }

  /**
   * Applies a view filter to the layer. When the combineLegendFilter flag is false, the filter parameter is used alone to display
   * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
   * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
   * is done.
   * @param {string} filter - A filter to be used in place of the getViewFilter value.
   * @param {boolean} combineLegendFilter - Flag used to combine the legend filter and the filter together (default: true)
   */
  applyViewFilter(layerPath: string, filter: string, combineLegendFilter = true): void {
    // TODO: Refactor - Layers refactoring. Remove the layerPath parameter once hybrid work is done (it should be moved when calling getLayerFilter below too)
    // Log
    logger.logTraceCore('ABSTRACT-GV-VECTOR - applyViewFilter');

    const layerConfig = this.getLayerConfig();
    const olLayer = this.getOLLayer();

    let filterValueToUse = filter.replaceAll(/\s{2,}/g, ' ').trim();
    layerConfig.legendFilterIsOff = !combineLegendFilter;
    if (combineLegendFilter) layerConfig.layerFilter = filter;

    // Convert date constants using the externalFragmentsOrder derived from the externalDateFormat
    const searchDateEntry = [
      ...`${filterValueToUse?.replaceAll(/\s{2,}/g, ' ').trim()} `.matchAll(
        /(?<=^date\b\s')[\d/\-T\s:+Z]{4,25}(?=')|(?<=[(\s]date\b\s')[\d/\-T\s:+Z]{4,25}(?=')/gi
      ),
    ];
    searchDateEntry.reverse();
    searchDateEntry.forEach((dateFound) => {
      // If the date has a time zone, keep it as is, otherwise reverse its time zone by changing its sign
      const reverseTimeZone = ![20, 25].includes(dateFound[0].length);
      const reformattedDate = DateMgt.applyInputDateFormat(dateFound[0], this.getExternalFragmentsOrder(), reverseTimeZone);
      filterValueToUse = `${filterValueToUse!.slice(0, dateFound.index)}${reformattedDate}${filterValueToUse!.slice(
        dateFound.index! + dateFound[0].length
      )}`;
    });

    try {
      const filterEquation = analyzeLayerFilter([{ nodeType: NodeType.unprocessedNode, nodeValue: filterValueToUse }]);
      layerConfig.filterEquation = filterEquation;
    } catch (error) {
      throw new Error(
        `Invalid vector layer filter (${(error as { message: string }).message}).\nfilter = ${this.getLayerFilter(
          layerPath
        )}\ninternal filter = ${filterValueToUse}`
      );
    }

    olLayer.changed();
  }

  /**
   * Gets the bounds of the layer and returns updated bounds
   * @param {Extent | undefined} bounds - The current bounding box to be adjusted.
   * @returns {Extent | undefined} The new layer bounding box.
   */
  protected getBounds(bounds?: Extent): Extent | undefined {
    const layerBounds = this.getOLLayer().getSource()?.getExtent();

    if (layerBounds) {
      // eslint-disable-next-line no-param-reassign
      if (!bounds) bounds = [layerBounds[0], layerBounds[1], layerBounds[2], layerBounds[3]];
      // eslint-disable-next-line no-param-reassign
      else bounds = getMinOrMaxExtents(bounds, layerBounds);
    }

    return bounds;
  }
}
