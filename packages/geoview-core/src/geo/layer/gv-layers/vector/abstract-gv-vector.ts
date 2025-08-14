import BaseLayer from 'ol/layer/Base';
import { Map as OLMap, Feature } from 'ol';
import { FeatureLike } from 'ol/Feature';
import { Geometry } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Options as VectorLayerOptions } from 'ol/layer/VectorImage';
import Style from 'ol/style/Style';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';
import { Pixel } from 'ol/pixel';
import { Projection as OLProjection } from 'ol/proj';
import isEqual from 'lodash/isEqual';

import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { FilterNodeType, NodeType } from '@/geo/utils/renderer/geoview-renderer-types';
import { logger } from '@/core/utils/logger';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeFeatureInfoEntry, TypeOutfieldsType } from '@/api/config/types/map-schema-types';
import { analyzeLayerFilter, getAndCreateFeatureStyle } from '@/geo/utils/renderer/geoview-renderer';
import { createAliasLookup, featureInfoGetFieldType, parseDateTimeValuesVector } from '@/geo/layer/gv-layers/utils';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { getExtentUnion, validateExtent } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { LayerInvalidLayerFilterError } from '@/core/exceptions/layer-exceptions';
import { NoExtentError } from '@/core/exceptions/geoview-exceptions';
import { formatError } from '@/core/exceptions/core-exceptions';
import { TypeDateFragments } from '@/core/utils/date-mgt';

/**
 * Abstract Geoview Layer managing an OpenLayer vector type layer.
 */
export abstract class AbstractGVVector extends AbstractGVLayer {
  /** Indicates if the style has been applied on the layer yet */
  styleApplied: boolean = false;

  /** Keep all callback delegate references */
  #onStyleAppliedHandlers: StyleAppliedDelegate[] = [];

  /**
   * Constructs a GeoView Vector layer to manage an OpenLayer layer.
   * @param {VectorSource<Feature<Geometry>>} olSource - The OpenLayer source.
   * @param {VectorLayerEntryConfig} layerConfig - The layer configuration.
   */
  protected constructor(olSource: VectorSource<Feature<Geometry>>, layerConfig: VectorLayerEntryConfig) {
    super(olSource, layerConfig);

    // Get the style label in case we need it later
    const label = layerConfig.layerName || layerConfig.layerId;

    // Create the vector layer options.
    const layerOptions: VectorLayerOptions<VectorSource<Feature<Geometry>>> = {
      properties: { layerConfig },
      source: olSource,
      style: (feature) => {
        // Calculate the style for the feature
        const style = AbstractGVVector.calculateStyleForFeature(
          this as AbstractGVLayer,
          feature,
          label,
          layerConfig.getFilterEquation(),
          layerConfig.getLegendFilterIsOff()
        );

        // Set the style applied, throwing a style applied event in the process
        this.setStyleApplied(true);

        // Return the style
        return style;
      },
    };

    // Init the layer options with initial settings
    AbstractGVVector.initOptionsWithInitialSettings(layerOptions, layerConfig);

    // Apply the layer filter right away if any
    AbstractGVVector.applyViewFilterOnConfig(layerConfig, layerConfig.getExternalFragmentsOrder(), undefined, layerConfig.layerFilter);

    // If the layer is initially not visible, make it visible until the style is set so we have a style for the legend
    this.onLayerFirstLoaded(() => {
      if (!this.getStyle() && !this.getVisible()) {
        this.onLayerStyleChanged(() => this.setVisible(false));
        this.setVisible(true);
      }
    });

    // Create and set the OpenLayer layer
    this.setOLLayer(new VectorLayer<VectorSource<Feature<Geometry>>>(layerOptions));
  }

  /**
   * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
   * @override
   * @returns {VectorLayer<VectorSource>} The strongly-typed OpenLayers type.
   */
  override getOLLayer(): VectorLayer<VectorSource> {
    // Call parent and cast
    return super.getOLLayer() as VectorLayer<VectorSource>;
  }

  /**
   * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
   * @override
   * @returns {VectorSource} The VectorSource source instance associated with this layer.
   */
  override getOLSource(): VectorSource {
    // Get source from OL
    return super.getOLSource() as VectorSource;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {VectorLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
   */
  override getLayerConfig(): VectorLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as VectorLayerEntryConfig;
  }

  /**
   * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
   * @param {string} fieldName - The field name for which we want to get the type.
   * @returns {TypeOutfieldsType} The type of the field.
   */
  protected override onGetFieldType(fieldName: string): TypeOutfieldsType {
    // Redirect
    return featureInfoGetFieldType(this.getLayerConfig(), fieldName);
  }

  /**
   * Overrides the get all feature information for all the features stored in the layer.
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected override getAllFeatureInfo(abortController: AbortController | undefined = undefined): Promise<TypeFeatureInfoEntry[]> {
    // Get the layer config in a loaded phase
    const layerConfig = this.getLayerConfig();
    const features = this.getOLSource().getFeatures();
    return Promise.resolve(this.formatFeatureInfoResult(features, layerConfig));
  }

  /**
   * Overrides the return of feature information at a given pixel location.
   * @param {OLMap} map - The Map where to get Feature Info At Pixel from.
   * @param {Pixel} location - The pixel coordinate that will be used by the query.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override getFeatureInfoAtPixel(map: OLMap, location: Pixel): Promise<TypeFeatureInfoEntry[]> {
    // Get the layer source
    const layerSource = this.getOLSource();

    // Prepare a filter by layer to know on which layer we want to query features
    const layerFilter = (layerCandidate: BaseLayer): boolean => {
      // We know it's the right layer to query on if the source is the same as the current layer
      const candidateSource = layerCandidate.get('source');
      return layerSource && candidateSource && layerSource === candidateSource;
    };

    // Query the map using the layer filter and a hit tolerance
    const features = map.getFeaturesAtPixel(location, {
      hitTolerance: this.getHitTolerance(),
      layerFilter,
    }) as Feature[];

    // Format and return the features
    return Promise.resolve(this.formatFeatureInfoResult(features, this.getLayerConfig()));
  }

  /**
   * Overrides the return of feature information at a given coordinate.
   * @param {OLMap} map - The Map where to get Feature Info At Coordinate from.
   * @param {Coordinate} location - The coordinate that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override getFeatureInfoAtCoordinate(
    map: OLMap,
    location: Coordinate,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queryGeometry: boolean = true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Redirect to getFeatureInfoAtPixel
    return this.getFeatureInfoAtPixel(map, map.getPixelFromCoordinate(location));
  }

  /**
   * Overrides the return of feature information at the provided long lat coordinate.
   * @param {OLMap} map - The Map where to get Feature Info At LonLat from.
   * @param {Coordinate} lonlat - The coordinate that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override getFeatureInfoAtLonLat(
    map: OLMap,
    lonlat: Coordinate,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queryGeometry: boolean = true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Convert Coordinates LonLat to map projection
    const projCoordinate = Projection.transformFromLonLat(lonlat, map.getView().getProjection());

    // Redirect to getFeatureInfoAtPixel
    return this.getFeatureInfoAtPixel(map, map.getPixelFromCoordinate(projCoordinate));
  }

  /**
   * Applies a view filter to a Vector layer's configuration by updating the layerConfig.filterEquation parameter.
   * @param {string | undefined} filter - The raw filter string input (defaults to an empty string if not provided).
   */
  applyViewFilter(filter: string | undefined = ''): void {
    // Log
    logger.logTraceCore('ABSTRACT-GV-VECTOR - applyViewFilter', this.getLayerPath());

    // Redirect
    AbstractGVVector.applyViewFilterOnConfig(
      this.getLayerConfig(),
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
    // Get the source projection
    const sourceProjection = this.getOLSource().getProjection();

    // Get the layer bounds
    let sourceExtent = this.getOLSource()?.getExtent();

    // If both found
    if (sourceExtent && sourceProjection) {
      // Transform extent to given projection
      sourceExtent = Projection.transformExtentFromProj(sourceExtent, sourceProjection, projection, stops);
      sourceExtent = validateExtent(sourceExtent, projection.getCode());
    }

    // Return the calculated layer bounds
    return sourceExtent;
  }

  /**
   * Gets the extent of an array of features.
   * @param {string[]} objectIds - The uids of the features to calculate the extent from.
   * @param {OLProjection} outProjection - The output projection for the extent.
   * @param {string?} outfield - ID field to return for services that require a value in outfields.
   * @override
   * @returns {Promise<Extent>} The extent of the features, if available.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override onGetExtentFromFeatures(objectIds: string[], outProjection: OLProjection, outfield?: string): Promise<Extent> {
    // Get the feature source
    const source = this.getOLSource();

    // Get array of features and only keep the ones we could find by id
    const requestedFeatures = objectIds.map((id) => source.getFeatureById(id)).filter((feature) => !!feature);

    // Determine max extent from features
    let calculatedExtent: Extent | undefined;
    requestedFeatures.forEach((feature) => {
      // Get the geometry
      const geom = feature.getGeometry();
      if (geom) {
        // Get the extent
        let extent = geom.getExtent();
        const srcProjection = source.getProjection();
        if (srcProjection) {
          // Make sure to project the extent in the wanted projection
          extent = Projection.transformExtentFromProj(extent, srcProjection, outProjection);
        }

        // If calculatedExtent has not been defined, set it to extent
        if (!calculatedExtent) calculatedExtent = extent;
        else getExtentUnion(calculatedExtent, extent);
      }
    });

    // If no calculated extent
    if (!calculatedExtent) throw new NoExtentError(this.getLayerPath());

    // Resolve
    return Promise.resolve(calculatedExtent);
  }

  /**
   * Sets the style applied flag indicating when a style has been applied for the AbstractGVVector via the style callback function.
   * @param {boolean} styleApplied - Indicates if the style has been applied on the AbstractGVVector.
   */
  setStyleApplied(styleApplied: boolean): void {
    const changed = this.styleApplied !== styleApplied;
    this.styleApplied = styleApplied;
    if (changed) this.#emitStyleApplied({ styleApplied });
  }

  // #region EVENTS

  /**
   * Emits an event to all handlers.
   * @param {StyleAppliedEvent} event The event to emit
   * @private
   */
  #emitStyleApplied(event: StyleAppliedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onStyleAppliedHandlers, event);
  }

  /**
   * Registers a style applied event handler.
   * @param {StyleAppliedDelegate} callback The callback to be executed whenever the event is emitted
   */
  onStyleApplied(callback: StyleAppliedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onStyleAppliedHandlers, callback);
  }

  /**
   * Unregisters a style applied event handler.
   * @param {StyleAppliedDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offStyleApplied(callback: StyleAppliedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onStyleAppliedHandlers, callback);
  }

  // #endregion EVENTS

  /**
   * Calculates a style for the given feature, based on the layer current style and options.
   * @param {AbstractGVLayer} layer - The layer on which to work for the style.
   * @param {FeatureLike} feature - Feature that need its style to be defined.
   * @param {string} label - The style label when one has to be created
   * @param {FilterNodeType[]} filterEquation - Filter equation associated to the layer.
   * @param {boolean} legendFilterIsOff - When true, do not apply legend filter.
   * @returns {Style} The style for the feature
   */
  static calculateStyleForFeature(
    layer: AbstractGVLayer,
    feature: FeatureLike,
    label: string,
    filterEquation?: FilterNodeType[],
    legendFilterIsOff?: boolean
  ): Style | undefined {
    // Get the style
    const style = layer.getStyle() || {};

    // Create lookup dictionary of names to alias
    const outfields = (layer.getLayerConfig() as VectorLayerEntryConfig).source?.featureInfo?.outfields;
    const aliasLookup = createAliasLookup(outfields);

    // Get and create Feature style if necessary
    return getAndCreateFeatureStyle(feature, style, label, filterEquation, legendFilterIsOff, aliasLookup, (geometryType, theStyle) => {
      // A new style has been created
      logger.logDebug('A new style has been created on-the-fly', geometryType, layer);
      // Update the layer style
      layer.setStyle({
        ...style,
        [geometryType]: { type: 'simple', hasDefault: false, fields: [], info: [theStyle] },
      });
    });
  }

  /**
   * Applies a view filter to a vector layer configuration. The resulting filter is parsed and stored in the layer
   * config's `filterEquation`, and triggers a re-evaluation of feature styles if applicable.
   * If the layer config is invalid or the filter has not changed, no action is taken. Date values in the filter are also
   * parsed using external fragments if available.
   * @param {VectorLayerEntryConfig} layerConfig - The vector layer configuration to apply the filter to.
   * @param {TypeDateFragments | undefined} externalDateFragments - Optional date fragments used to parse time-based filters.
   * @param {AbstractGVLayer | undefined} layer - Optional GeoView layer containing that will get its source updated to trigger a redraw.
   * @param {string | undefined} filter - A raw filter string to override the layer's view filter (default is an empty string).
   * @param {(filterToUse: string) => void} [callbackWhenUpdated] - Optional callback invoked with the final filter string if updated.
   * @throws {LayerInvalidLayerFilterError} If the filter cannot be parsed or applied due to a syntax or runtime issue.
   */
  static applyViewFilterOnConfig(
    layerConfig: VectorLayerEntryConfig,
    externalDateFragments: TypeDateFragments | undefined,
    layer: AbstractGVLayer | undefined,
    filter: string | undefined = '',
    callbackWhenUpdated: ((filterToUse: string) => void) | undefined = undefined
  ): void {
    // TODO: Check - Is this assignation necessary? What's the intent?
    // Update the layer config on the fly (maybe not ideal to do this?)
    // eslint-disable-next-line no-param-reassign
    layerConfig.layerFilter = filter;

    // Get the current filter
    const currentFilter = layerConfig.getFilterEquation();

    // Parse the filter value to use
    let filterValueToUse: string = filter.replaceAll(/\s{2,}/g, ' ').trim();

    try {
      // Parse is some more for the dates
      filterValueToUse = parseDateTimeValuesVector(filterValueToUse, externalDateFragments);

      // Analyze the layer filter
      const filterEquation = analyzeLayerFilter([{ nodeType: NodeType.unprocessedNode, nodeValue: filterValueToUse }]);

      // Define what is considered the default filter
      const isDefaultFilter = !filterValueToUse;

      // Define what is a no operation
      const isNewFilterEffectivelyNoop = isDefaultFilter && !currentFilter;

      // Check whether the current filter is different from the new one
      const filterChanged = !isEqual(currentFilter, filterEquation);

      // Determine if we should apply or reset filter
      const shouldUpdateFilter = (filterChanged && !isNewFilterEffectivelyNoop) || (!!currentFilter && isDefaultFilter);

      // If should update the filtering
      if (shouldUpdateFilter) {
        // Update the filter equation
        layerConfig.setFilterEquation(filterEquation);

        // Flag about the change.
        // GV This will force a callback on the source style callback, which for us is the 'calculateStyleForFeature' function and
        // GV since we've changed the filterEquation, the style will be recreated using that filterEquation.
        layer?.getOLLayer().changed();

        // Callback
        callbackWhenUpdated?.(filterValueToUse);
      }
    } catch (error: unknown) {
      // Failed
      throw new LayerInvalidLayerFilterError(
        layerConfig.layerPath,
        layerConfig.getLayerName(),
        filterValueToUse,
        currentFilter?.join(','),
        formatError(error)
      );
    }
  }
}

/**
 * Define an event for the delegate
 */
export type StyleAppliedEvent = {
  // The style applied indicator
  styleApplied: boolean;
};

/**
 * Define a delegate for the event handler function signature
 */
export type StyleAppliedDelegate = EventDelegateBase<AbstractGVVector, StyleAppliedEvent, void>;
