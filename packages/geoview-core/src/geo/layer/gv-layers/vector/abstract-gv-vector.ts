import type BaseLayer from 'ol/layer/Base';
import type { Map as OLMap, Feature } from 'ol';
import type { FeatureLike } from 'ol/Feature';
import type { Geometry } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';
import type { Options as VectorLayerOptions } from 'ol/layer/VectorImage';
import type Style from 'ol/style/Style';
import type { Coordinate } from 'ol/coordinate';
import type { Extent } from 'ol/extent';
import type { Pixel } from 'ol/pixel';
import type { Projection as OLProjection } from 'ol/proj';

import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import { logger } from '@/core/utils/logger';
import type { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import type { TypeFeatureInfoEntry, TypeOutfieldsType } from '@/api/types/map-schema-types';
import type { FilterNodeType } from '@/geo/utils/renderer/geoview-renderer-types';
import { GeoviewRenderer } from '@/geo/utils/renderer/geoview-renderer';
import { GVLayerUtilities } from '@/geo/layer/gv-layers/utils';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import type { LayerFilters } from '@/geo/layer/gv-layers/layer-filters';
import { GeoUtilities } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { NoExtentError } from '@/core/exceptions/geoview-exceptions';

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
    const label = layerConfig.getLayerName() || layerConfig.layerId;

    // Create the vector layer options.
    const layerOptions: VectorLayerOptions<VectorSource<Feature<Geometry>>> = {
      properties: { layerConfig },
      source: olSource,
      style: (feature, resolution) => {
        // Calculate the style for the feature
        const style = AbstractGVVector.calculateStyleForFeature(
          this as AbstractGVLayer,
          feature,
          resolution,
          label,
          this.getLayerFilters()?.getFilterEquation()
        );

        // Set the style applied, throwing a style applied event in the process
        this.setStyleApplied(true);

        // Return the style
        return style;
      },
      // TODO: (SEE ISSUE 3227)For layers with text, in order for declutterMode options to work, declutter at the layer level must be true
      // TO.DOCONT: If true though, this will cause the features themselves to be decluttered, which we don't want
      // TO.DOCONT: Instead, the best solution would be to create a second text only layer that uses the same source.
      // TO.DOCONT: Could both layers be accessed by the same GeoView Layer? So that only the text layer or both layer's visibility can be toggled?
      // TO.DOCONT: If two separate layers, could we remove the text from the sublayers? Could have separate categories for the text, although
      // TO.DOCONT: then we wouldn't be able to turn off the individual text categories in the UI. Would be all or nothing at the main layer level.
      // declutter: true,
    };

    // Init the layer options with initial settings
    AbstractGVVector.initOptionsWithInitialSettings(layerOptions, layerConfig);

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

  // #region OVERRIDES

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
   * @returns {TypeOutfieldsType} The type of the field or 'string' when undefined.
   */
  protected override onGetFieldType(fieldName: string): TypeOutfieldsType {
    // By default, look into the layer metadata for information on the field types
    const layerMetadata = this.getLayerConfig();
    const fieldDefinitions = layerMetadata?.getOutfields()?.find((fieldDefinition) => fieldDefinition.name === fieldName);
    return fieldDefinitions?.type || 'string';
  }

  /**
   * Overrides the get all feature information for all the features stored in the layer.
   * @param {OLMap} map - The Map so that we can grab the resolution/projection we want to get features on.
   * @param {LayerFilters} layerFilters - The layer filters to apply when querying the features.
   * @param {AbortController?} [abortController] - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   * @protected
   * @override
   */
  protected override getAllFeatureInfo(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    map: OLMap,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    layerFilters: LayerFilters,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abortController?: AbortController
  ): Promise<TypeFeatureInfoEntry[]> {
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
   * @param {AbortController?} [abortController] - The optional abort controller.
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
   * @param {AbortController?} [abortController] - The optional abort controller.
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
      sourceExtent = GeoUtilities.validateExtent(sourceExtent, projection.getCode());
    }

    // Return the calculated layer bounds
    return sourceExtent;
  }

  /**
   * Gets the extent of an array of features.
   * @param {number[] | string[]} objectIds - The uids of the features to calculate the extent from.
   * @param {OLProjection} outProjection - The output projection for the extent.
   * @param {string?} outfield - ID field to return for services that require a value in outfields.
   * @override
   * @returns {Promise<Extent>} The extent of the features, if available.
   * @deprecated Seems like this is not used anymore, not called anywhere and unsure how it'd work with adhoc vector layers without 'ids' (objectids) necessarily.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override onGetExtentFromFeatures(objectIds: number[] | string[], outProjection: OLProjection, outfield?: string): Promise<Extent> {
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
        else GeoUtilities.getExtentUnion(calculatedExtent, extent);
      }
    });

    // If no calculated extent
    if (!calculatedExtent) throw new NoExtentError(this.getLayerPath());

    // Resolve
    return Promise.resolve(calculatedExtent);
  }

  // #endregion OVERRIDES

  // #region METHODS

  /**
   * Sets the style applied flag indicating when a style has been applied for the AbstractGVVector via the style callback function.
   * @param {boolean} styleApplied - Indicates if the style has been applied on the AbstractGVVector.
   */
  setStyleApplied(styleApplied: boolean): void {
    const changed = this.styleApplied !== styleApplied;
    this.styleApplied = styleApplied;
    if (changed) this.#emitStyleApplied({ styleApplied });
  }

  // #endregion METHODS

  // #region EVENTS

  /**
   * Emits an event to all handlers.
   * @param {StyleAppliedEvent} event - The event to emit
   * @private
   */
  #emitStyleApplied(event: StyleAppliedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onStyleAppliedHandlers, event);
  }

  /**
   * Registers a style applied event handler.
   * @param {StyleAppliedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onStyleApplied(callback: StyleAppliedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onStyleAppliedHandlers, callback);
  }

  /**
   * Unregisters a style applied event handler.
   * @param {StyleAppliedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offStyleApplied(callback: StyleAppliedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onStyleAppliedHandlers, callback);
  }

  // #endregion EVENTS

  // #region STATIC METHODS

  /**
   * Calculates a style for the given feature, based on the layer current style and options.
   * @param {AbstractGVLayer} layer - The layer on which to work for the style.
   * @param {FeatureLike} feature - Feature that need its style to be defined.
   * @param {string} label - The style label when one has to be created
   * @param {FilterNodeType[]} filterEquation - Filter equation associated to the layer.
   * @returns {Style} The style for the feature
   */
  static calculateStyleForFeature(
    layer: AbstractGVLayer,
    feature: FeatureLike,
    resolution: number,
    label: string,
    filterEquation?: FilterNodeType[]
  ): Style | undefined {
    // Get the style
    const style = layer.getStyle() || {};

    // Create lookup dictionary of names to alias
    const outfields = layer.getLayerConfig().getOutfields();
    const aliasLookup = GVLayerUtilities.createAliasLookup(outfields);
    const layerText = layer.getLayerConfig().getLayerText();

    // Get and create Feature style if necessary
    return GeoviewRenderer.getAndCreateFeatureStyle(
      feature,
      resolution,
      style,
      label,
      filterEquation,
      aliasLookup,
      layerText,
      (geometryType, theStyle) => {
        // A new style has been created
        logger.logDebug('A new style has been created on-the-fly', geometryType, layer);

        // Update the layer style
        layer.setStyle({
          ...style,
          [geometryType]: { type: 'simple', hasDefault: false, fields: [], info: [theStyle] },
        });
      }
    );
  }

  // #endregion STATIC METHODS
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
