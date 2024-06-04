import BaseLayer from 'ol/layer/Base';
import BaseVectorLayer from 'ol/layer/BaseVector';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Options as VectorLayerOptions } from 'ol/layer/VectorImage';
import Style from 'ol/style/Style';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';
import { Pixel } from 'ol/pixel';
import Feature, { FeatureLike } from 'ol/Feature';

import { DateMgt } from '@/core/utils/date-mgt';
import { getMinOrMaxExtents } from '@/geo/utils/utilities';
import { FilterNodeArrayType, NodeType } from '@/geo/utils/renderer/geoview-renderer-types';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { logger } from '@/core/utils/logger';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeFeatureInfoEntry } from '@/geo/map/map-schema-types';
import { analyzeLayerFilter, getAndCreateFeatureStyle } from '@/geo/utils/renderer/geoview-renderer';
import { featureInfoGetFieldType } from '../utils';
import { AbstractGVLayer } from '../abstract-gv-layer';
import { AbstractGeoViewLayer } from '../../geoview-layers/abstract-geoview-layers';
import { getLocalizedValue } from '@/core/utils/utilities';

/**
 * Abstract Geoview Layer managing an OpenLayer vector type layer.
 */
export abstract class AbstractGVVector extends AbstractGVLayer {
  /**
   * Constructs a GeoView Vector layer to manage an OpenLayer layer.
   * @param {string} mapId - The map id
   * @param {VectorSource} olSource - The OpenLayer source.
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer configuration.
   */
  protected constructor(mapId: string, olSource: VectorSource, layerConfig: VectorLayerEntryConfig) {
    super(mapId, olSource, layerConfig);

    // TODO: remove link to language, layer should be created in one language and recreated if needed to change
    const language = AppEventProcessor.getDisplayLanguage(mapId);

    // Get the style label in case we need it later
    const label = getLocalizedValue(layerConfig.layerName, language) || layerConfig.layerId;

    // Create the vector layer options.
    const layerOptions: VectorLayerOptions<VectorSource> = {
      properties: { layerConfig },
      source: olSource,
      style: (feature) => {
        return AbstractGVVector.calculateStyleForFeature(
          this,
          feature,
          label,
          layerConfig.layerPath,
          layerConfig.filterEquation,
          layerConfig.legendFilterIsOff
        );
      },
    };

    // Init the layer options with initial settings
    AbstractGVVector.initOptionsWithInitialSettings(layerOptions, layerConfig);

    // Create and set the OpenLayer layer
    this.olLayer = new VectorLayer(layerOptions);
  }

  /**
   * Overrides the get of the OpenLayers Layer
   * @returns {BaseVectorLayer<VectorSource, any>} The OpenLayers Layer
   */
  // Disabling 'any', because too many renderer types in OpenLayers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override getOLLayer(): BaseVectorLayer<VectorSource, any> {
    // Call parent and cast
    // Disabling 'any', because too many renderer types in OpenLayers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return super.getOLLayer() as BaseVectorLayer<VectorSource, any>;
  }

  /**
   * Overrides the get of the OpenLayers Layer Source
   * @returns {VectorSource} The OpenLayers Layer Source
   */
  override getOLSource(): VectorSource {
    // Get source from OL
    return super.getOLSource() as VectorSource;
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
      const features = this.getOLSource()!.getFeatures();
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
      // Get the layer source
      const layerSource = this.getOLSource();

      // Prepare a filter by layer to know on which layer we want to query features
      const layerFilter = (layerCandidate: BaseLayer): boolean => {
        // We know it's the right layer to query on if the source is the same as the current layer
        const candidateSource = layerCandidate.get('source');
        return layerSource && candidateSource && layerSource === candidateSource;
      };

      // Query the map using the layer filter and a hit tolerance
      const features = this.getMapViewer().map.getFeaturesAtPixel(location, { hitTolerance: this.hitTolerance, layerFilter }) as Feature[];

      // Format and return the features
      return this.formatFeatureInfoResult(features, this.getLayerConfig());
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
    // Redirect to getFeatureInfoAtPixel
    return this.getFeatureInfoAtPixel(this.getMapViewer().map.getPixelFromCoordinate(location));
  }

  /**
   * Overrides the return of feature information at the provided long lat coordinate.
   * @param {Coordinate} lnglat - The coordinate that will be used by the query.
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override getFeatureInfoAtLongLat(lnglat: Coordinate): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    // Convert Coordinates LngLat to map projection
    const projCoordinate = this.getMapViewer().convertCoordinateLngLatToMapProj(lnglat);

    // Redirect to getFeatureInfoAtPixel
    return this.getFeatureInfoAtPixel(this.getMapViewer().map.getPixelFromCoordinate(projCoordinate));
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

    // Emit event
    this.emitLayerFilterApplied({
      layerPath,
      filter: filterValueToUse,
    });
  }

  /**
   * Gets the bounds of the layer and returns updated bounds
   * @param {Extent | undefined} bounds - The current bounding box to be adjusted.
   * @returns {Extent | undefined} The new layer bounding box.
   */
  protected getBounds(layerPath: string, bounds?: Extent): Extent | undefined {
    // TODO: Refactor - Layers refactoring. Remove the layerPath parameter once hybrid work is done
    const layerBounds = this.getOLSource()?.getExtent();

    if (layerBounds) {
      // eslint-disable-next-line no-param-reassign
      if (!bounds) bounds = [layerBounds[0], layerBounds[1], layerBounds[2], layerBounds[3]];
      // eslint-disable-next-line no-param-reassign
      else bounds = getMinOrMaxExtents(bounds, layerBounds);
    }

    return bounds;
  }

  /**
   * Calculates a style for the given feature, based on the layer current style and options.
   * @param {AbstractGeoViewLayer | AbstractGVLayer} layer - The layer on which to work for the style.
   * @param {FeatureLike} feature - Feature that need its style to be defined.
   * @param {string} label - The style label when one has to be created
   * @param {FilterNodeArrayType} filterEquation - Filter equation associated to the layer.
   * @param {boolean} legendFilterIsOff - When true, do not apply legend filter.
   * @returns {Style} The style for the feature
   */
  static calculateStyleForFeature(
    layer: AbstractGeoViewLayer | AbstractGVLayer,
    feature: FeatureLike,
    label: string,
    layerPath: string,
    filterEquation?: FilterNodeArrayType,
    legendFilterIsOff?: boolean
  ): Style | undefined {
    // TODO: Refactor - After layers refactoring, remove the layerPath parameter here.
    // Get the style
    const style = layer.getStyle(layerPath) || {};

    // Get and create Feature style if necessary
    return getAndCreateFeatureStyle(feature, style, label, filterEquation, legendFilterIsOff, (geometryType, theStyle) => {
      // A new style has been created
      logger.logDebug('A new style has been created on-the-fly', geometryType, layer);
      // Update the layer style
      layer.setStyle(layerPath, { ...style, ...{ [geometryType]: theStyle } });
    });
  }
}
