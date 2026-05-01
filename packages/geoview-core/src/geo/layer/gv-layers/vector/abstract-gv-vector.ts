import type BaseLayer from 'ol/layer/Base';
import type { Map as OLMap, Feature } from 'ol';
import type { FeatureLike } from 'ol/Feature';
import type { Geometry } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';
import type { Options as VectorLayerOptions } from 'ol/layer/VectorImage';
import Style from 'ol/style/Style';
import type { Coordinate } from 'ol/coordinate';
import type { Extent } from 'ol/extent';
import type { Pixel } from 'ol/pixel';
import type { Projection as OLProjection } from 'ol/proj';

import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import { logger } from '@/core/utils/logger';
import type { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import type { TypeFeatureInfoResult, TypeLayerStyleConfig } from '@/api/types/map-schema-types';
import type { FilterNodeType } from '@/geo/utils/renderer/geoview-renderer-types';
import { GeoviewRenderer } from '@/geo/utils/renderer/geoview-renderer';
import { GVLayerUtilities } from '@/geo/layer/gv-layers/utils';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { GVVectorSource } from '@/geo/layer/source/vector-source';
import type { LayerFilters } from '@/geo/layer/gv-layers/layer-filters';
import { GeoUtilities } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { GeoViewError, NoExtentError } from '@/core/exceptions/geoview-exceptions';
import { GeoviewTextRenderer } from '@/geo/utils/renderer/geoview-text-renderer';

/**
 * Abstract Geoview Layer managing an OpenLayer vector type layer.
 */
export abstract class AbstractGVVector extends AbstractGVLayer {
  /** Indicates if the style has been applied on the layer yet */
  styleApplied: boolean = false;

  /** Callback delegates for the style applied event */
  #onStyleAppliedHandlers: StyleAppliedDelegate[] = [];

  /** Optional text-only layer for text labels */
  #textOLLayer?: VectorLayer<VectorSource<Feature<Geometry>>>;

  /** Indicates if the text layer is visible */
  #textVisible: boolean = true;

  /** Callback delegates for the text visible changed event */
  #onTextVisibleChangedHandlers: TextVisibleChangedDelegate[] = [];

  /** Cache for feature styles keyed by feature ID */
  #styleCache: Map<string, Style | undefined> = new Map();

  /** Maximum number of styles to cache */
  static readonly STYLE_CACHE_SIZE_LIMIT = 1000;

  /**
   * Constructs a GeoView Vector layer to manage an OpenLayer layer.
   *
   * @param olSource - The OpenLayer source.
   * @param layerConfig - The layer configuration.
   */
  protected constructor(olSource: VectorSource<Feature<Geometry>>, layerConfig: VectorLayerEntryConfig) {
    super(olSource, layerConfig);

    // Get the style label in case we need it later
    const label = layerConfig.getLayerNameCascade();

    // Create the vector layer options.
    const layerOptions: VectorLayerOptions<VectorSource<Feature<Geometry>>> = {
      properties: { layerConfig },
      source: olSource,
      style: (feature) => {
        // Get or create cached style
        const style =
          feature.getGeometry()?.getType() === 'Point'
            ? this.#getOrCreateCachedStyle(feature, label)
            : AbstractGVVector.calculateStyleForFeature(this, feature, label, this.getLayerFilters()?.getFilterEquation());

        // Set the style applied, throwing a style applied event in the process
        this.setStyleApplied(true);

        // Return the style
        return style;
      },
    };

    // Init the layer options with initial settings
    AbstractGVVector.initOptionsWithInitialSettings(layerOptions, layerConfig);

    // Clear cache when filters are updated.
    this.onLayerFilterApplied(() => this.#clearStyleCache());

    // Keep the subscription clean and readable
    this.onLayerFirstLoaded(this.#handleLayerFirstLoaded.bind(this));

    // Create and set the OpenLayer layer
    this.setOLLayer(new VectorLayer<VectorSource<Feature<Geometry>>>(layerOptions));

    if (layerConfig.getLayerText() || GeoviewTextRenderer.hasStyleText(layerConfig.getLayerStyle())) {
      const textLayerOptions: VectorLayerOptions<VectorSource<Feature<Geometry>>> = {
        properties: { layerConfig, isAuxiliaryLayer: true },
        source: olSource, // Share the same source
        style: (feature) => {
          // Calculate text-only style for the feature
          const style = AbstractGVVector.calculateTextStyleForFeature(this, feature);
          return style;
        },
        // Enable declutter based on layerText.declutterMode
        declutter: layerConfig.getLayerText()?.declutterMode !== 'none',
      };

      // Set declutterMode on layer options if specified
      const declutterMode = layerConfig.getLayerText()?.declutterMode;
      if (declutterMode) {
        textLayerOptions.declutter = declutterMode;
      }

      // Set minZoom for text layer if specified in layerText config
      const textMinZoom = layerConfig.getLayerText()?.minZoomLevel;
      if (textMinZoom) {
        textLayerOptions.minZoom = textMinZoom;
      }

      // Set maxZoom for text layer if specified in layerText config
      const textMaxZoom = layerConfig.getLayerText()?.maxZoomLevel;
      if (textMaxZoom) {
        textLayerOptions.maxZoom = textMaxZoom;
      }

      // Init the text layer options with initial settings
      AbstractGVVector.initOptionsWithInitialSettings(textLayerOptions, layerConfig);

      // Create the text layer
      this.#textOLLayer = new VectorLayer<VectorSource<Feature<Geometry>>>(textLayerOptions);
    }
  }

  // #region OVERRIDES

  /**
   * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
   *
   * @returns The strongly-typed OpenLayers type.
   */
  override getOLLayer(): VectorLayer<VectorSource> {
    // Call parent and cast
    return super.getOLLayer() as VectorLayer<VectorSource>;
  }

  /**
   * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
   *
   * @returns The VectorSource source instance associated with this layer.
   */
  override getOLSource(): GVVectorSource {
    // Get source from OL
    return super.getOLSource() as GVVectorSource;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed layer configuration specific to this layer.
   */
  override getLayerConfig(): VectorLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig();
  }

  /**
   * Sets the visibility of the layer.
   *
   * @param layerVisibility - The visibility state to set.
   */
  protected override onSetVisible(layerVisibility: boolean): void {
    // Call parent to handle geometry layer
    super.onSetVisible(layerVisibility);

    // Sync text layer visibility if it exists
    // Text layer visibility = layerVisibility && textVisible
    this.#textOLLayer?.setVisible(layerVisibility && this.#textVisible);
  }

  /**
   * Sets the opacity of the layer.
   *
   * @param opacity - The opacity value to set.
   * @param emitOpacityChanged - Whether to emit the opacity changed event.
   */
  protected override onSetOpacity(opacity: number, emitOpacityChanged: boolean = true): void {
    // Call parent to handle geometry layer
    super.onSetOpacity(opacity, emitOpacityChanged);

    // Set opacity for text layer if it exists
    this.#textOLLayer?.setOpacity(opacity);
  }

  /**
   * Sets the z-index of the layer.
   *
   * @param zIndex - The z-index value to set.
   * @param emitZIndexChanged - Whether to emit the z-index changed event.
   */
  protected override onSetZIndex(zIndex: number, emitZIndexChanged: boolean = true): void {
    // Set z-index for geometry layer
    super.onSetZIndex(zIndex, emitZIndexChanged);

    // Set z-index for text layer if it exists, ensuring it's above the geometry layers
    this.#textOLLayer?.setZIndex(zIndex + 100);
  }

  /**
   * Overridable method called to get a more specific error code for all errors.
   *
   * @param event - The event which is being triggered.
   * @returns The GeoViewError stored in the GVVectorSource if any or the one from the parent method.
   */
  protected override onErrorDecipherError(event: Event): GeoViewError {
    // Try to get the error from the source
    const layerSource = event.target;

    // Check if the source is GVVectorSource (should be) and check if the error inside is a GeoViewError
    if (layerSource instanceof GVVectorSource) {
      const loaderError = layerSource.getLoaderError();
      if (loaderError instanceof GeoViewError) {
        return loaderError;
      }
    }

    // Couldn't be deciphered, use parent's
    return super.onErrorDecipherError(event);
  }

  /**
   * Overrides the get all feature information for all the features stored in the layer.
   *
   * @param map - The Map so that we can grab the resolution/projection we want to get features on.
   * @param layerFilters - The layer filters to apply when querying the features.
   * @param abortController - Optional {@link AbortController} to cancel the request.
   * @returns A promise that resolves with the feature info result.
   */
  protected override getAllFeatureInfo(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    map: OLMap,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    layerFilters: LayerFilters,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abortController?: AbortController
  ): Promise<TypeFeatureInfoResult> {
    // Get the layer config in a loaded phase
    const layerConfig = this.getLayerConfig();
    const features = this.getOLSource().getFeatures();
    return Promise.resolve({
      results: this.formatFeatureInfoResult(
        features,
        layerConfig,
        layerConfig.getServiceDateFormat(),
        layerConfig.getServiceDateTimezone(),
        layerConfig.getServiceDateTemporalMode()
      ),
    });
  }

  /**
   * Overrides the return of feature information at a given pixel location.
   *
   * @param map - The Map where to get Feature Info At Pixel from.
   * @param location - The pixel coordinate that will be used by the query.
   * @returns A promise that resolves with the feature info result.
   */
  protected override getFeatureInfoAtPixel(map: OLMap, location: Pixel): Promise<TypeFeatureInfoResult> {
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

    // Get the layer config
    const layerConfig = this.getLayerConfig();

    // Format and return the features
    return Promise.resolve({
      results: this.formatFeatureInfoResult(
        features,
        layerConfig,
        layerConfig.getServiceDateFormat(),
        layerConfig.getServiceDateTimezone(),
        layerConfig.getServiceDateTemporalMode()
      ),
    });
  }

  /**
   * Overrides the return of feature information at a given coordinate.
   *
   * @param map - The Map where to get Feature Info At Coordinate from.
   * @param location - The coordinate that will be used by the query.
   * @param queryGeometry - Whether to include geometry in the query, default is true.
   * @param abortController - Optional {@link AbortController} to cancel the request.
   * @returns A promise that resolves with the feature info result.
   */
  protected override getFeatureInfoAtCoordinate(
    map: OLMap,
    location: Coordinate,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queryGeometry: boolean = true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoResult> {
    // Redirect to getFeatureInfoAtPixel
    return this.getFeatureInfoAtPixel(map, map.getPixelFromCoordinate(location));
  }

  /**
   * Overrides the return of feature information at the provided long lat coordinate.
   *
   * @param map - The Map where to get Feature Info At LonLat from.
   * @param lonlat - The coordinate that will be used by the query.
   * @param queryGeometry - Whether to include geometry in the query, default is true.
   * @param abortController - Optional {@link AbortController} to cancel the request.
   * @returns A promise that resolves with the feature info result.
   */
  protected override getFeatureInfoAtLonLat(
    map: OLMap,
    lonlat: Coordinate,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queryGeometry: boolean = true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoResult> {
    // Convert Coordinates LonLat to map projection
    const projCoordinate = Projection.transformFromLonLat(lonlat, map.getView().getProjection());

    // Redirect to getFeatureInfoAtPixel
    return this.getFeatureInfoAtPixel(map, map.getPixelFromCoordinate(projCoordinate));
  }

  /**
   * Overrides the way to get the bounds for this layer type.
   *
   * @param projection - The projection to get the bounds into.
   * @param stops - The number of stops to use to generate the extent.
   * @returns A promise that resolves with the layer bounding box, or undefined if not available.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override async onGetBounds(projection: OLProjection, stops: number): Promise<Extent | undefined> {
    // Wait for the features to be loaded, because this is a vector layer the features have to be loaded for the extent to be valid
    await this.waitLoadedStatus();

    // Get the layer bounds
    let sourceExtent = this.getOLSource()?.getExtent();

    // If both found
    if (sourceExtent) {
      // Transform extent to given projection
      sourceExtent = GeoUtilities.validateExtent(sourceExtent, projection.getCode());
    }

    // Return the calculated layer bounds
    return sourceExtent;
  }

  /**
   * Gets the extent of an array of features.
   *
   * @param objectIds - The uids of the features to calculate the extent from.
   * @param outProjection - The output projection for the extent.
   * @param outfield - Optional ID field to return for services that require a value in outfields.
   * @returns A promise that resolves with the extent of the features.
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
   * Gets or creates a cached style for a feature.
   *
   * @param feature - The feature to calculate style for.
   * @param label - Style label for fallback styling.
   * @returns The cached or newly calculated style.
   */
  #getOrCreateCachedStyle(feature: FeatureLike, label: string): Style | undefined {
    // Calculate new style and cache it
    const featureStyle = AbstractGVVector.calculateStyleForFeature(this, feature, label, this.getLayerFilters()?.getFilterEquation());

    // If no feature style generated
    if (!featureStyle) {
      // No style
      return undefined;
    }

    // Clone the style
    const styleClone = featureStyle.clone();
    // Eliminate geometry from the style clone to prevent cache misses due to different geometries on features
    styleClone.setGeometry('');
    // Create a cache key based on the stringified style (without geometry)
    const styleKey = JSON.stringify(styleClone);

    // Cache the style if not already cached
    if (!this.#styleCache.has(styleKey)) {
      this.#styleCache.set(styleKey, featureStyle);

      // Limit cache size to prevent memory bloat
      if (this.#styleCache.size > AbstractGVVector.STYLE_CACHE_SIZE_LIMIT) {
        const firstKey = this.#styleCache.keys().next().value;
        if (firstKey) {
          this.#styleCache.delete(firstKey);
        }
      }
    }

    return this.#styleCache.get(styleKey);
  }

  /**
   * Clears the style cache. Call this when layer style, filters, or visibility changes to ensure fresh styles are recalculated.
   */
  #clearStyleCache(): void {
    this.#styleCache.clear();
  }

  /**
   * Sets the layer style.
   *
   * @param style - The layer style
   */
  override setStyle(style: TypeLayerStyleConfig): void {
    // Clear the style cache to ensure new styles are calculated with the updated style configuration
    this.#clearStyleCache();
    super.setStyle(style);
    // Trigger a refresh to apply the new style to all features
    this.refresh(undefined);
  }

  /**
   * Sets the style applied flag indicating when a style has been applied for the AbstractGVVector via the style callback function.
   *
   * @param styleApplied - Indicates if the style has been applied on the AbstractGVVector.
   */
  setStyleApplied(styleApplied: boolean): void {
    const changed = this.styleApplied !== styleApplied;
    this.styleApplied = styleApplied;
    if (changed) this.#emitStyleApplied({ styleApplied });
  }

  /**
   * Gets the OpenLayers text layer if one exists.
   *
   * @returns The text layer or undefined if no text layer exists.
   */
  getTextOLLayer(): VectorLayer<VectorSource> | undefined {
    return this.#textOLLayer;
  }

  /**
   * Gets the independent visibility state of the text layer.
   *
   * @returns True if text layer is set to visible independently.
   */
  getTextVisible(): boolean {
    return this.#textVisible;
  }

  /**
   * Sets the independent visibility of the text layer.
   * The text layer's actual visibility is: layerVisible && textVisible
   *
   * @param visible - Whether text should be visible independently.
   */
  setTextVisible(visible: boolean): void {
    this.#textVisible = visible;

    // Update text layer actual visibility if it exists
    this.#textOLLayer?.setVisible(this.getVisible() && visible);

    // Emit event for text visibility change
    this.#emitTextVisibleChanged({ textVisible: visible });
  }

  /**
   * Gets the actual visibility state of the text layer on the map.
   * This considers both layer visibility and independent text visibility.
   *
   * @returns True if the text layer is currently visible on the map.
   */
  getTextLayerVisible(): boolean {
    return this.#textOLLayer?.getVisible() ?? false;
  }

  /**
   * Handles the first loaded event for the layer.
   *
   * If the layer starts with no style and is initially invisible, it temporarily sets the layer to visible
   * to allow the style to be applied, then restores the original visibility state after the style is applied.
   */
  #handleLayerFirstLoaded(): void {
    // Capture the initial visibility state so we can restore it later
    const initialVisible = this.getVisible();

    // If the layer has no style yet and is initially invisible
    if (!this.getStyle() && !initialVisible) {
      this.#ensureStyleWithTemporaryVisibility(initialVisible);
    }
  }

  /**
   * Ensures that the layer style is applied even if the layer is initially invisible.
   *
   * Temporarily sets the layer to visible to allow the style to be applied, then restores the original visibility state.
   *
   * @param initialVisible - Whether the layer is visible intially
   */
  #ensureStyleWithTemporaryVisibility(initialVisible: boolean): void {
    // Subscribe to style changes
    const hook = this.onLayerStyleChanged(() => {
      // Unsubscribe after the first style change to avoid repeated triggers
      this.offLayerStyleChanged(hook);

      // Restore the original visibility state
      this.setVisible(initialVisible);
    });

    // Handle race condition: style may already be set
    if (this.getStyle()) {
      this.offLayerStyleChanged(hook);
      return;
    }

    // Temporarily make the layer visible so the style can be computed/applied
    this.setVisible(true);
  }

  // #endregion METHODS

  // #region EVENTS

  /**
   * Emits an event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitStyleApplied(event: StyleAppliedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onStyleAppliedHandlers, event);
  }

  /**
   * Registers a style applied event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onStyleApplied(callback: StyleAppliedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onStyleAppliedHandlers, callback);
  }

  /**
   * Unregisters a style applied event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offStyleApplied(callback: StyleAppliedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onStyleAppliedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitTextVisibleChanged(event: TextVisibleChangedEvent): void {
    EventHelper.emitEvent(this, this.#onTextVisibleChangedHandlers, event);
  }

  /**
   * Registers a text visible changed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onTextVisibleChanged(callback: TextVisibleChangedDelegate): void {
    EventHelper.onEvent(this.#onTextVisibleChangedHandlers, callback);
  }

  /**
   * Unregisters a text visible changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offTextVisibleChanged(callback: TextVisibleChangedDelegate): void {
    EventHelper.offEvent(this.#onTextVisibleChangedHandlers, callback);
  }

  // #endregion EVENTS

  // #region STATIC METHODS

  /**
   * Calculates a style for the given feature, based on the layer current style and options.
   *
   * @param layer - The layer on which to work for the style.
   * @param feature - Feature that need its style to be defined.
   * @param label - The style label when one has to be created
   * @param filterEquation - Filter equation associated to the layer.
   * @returns The style for the feature or undefined if no style could be calculated.
   */
  static calculateStyleForFeature(
    layer: AbstractGVLayer,
    feature: FeatureLike,
    label: string,
    filterEquation?: FilterNodeType[]
  ): Style | undefined {
    // Get the style
    const style = layer.getStyle() || {};

    // Get and create Feature style if necessary
    return GeoviewRenderer.getAndCreateFeatureStyle(feature, style, label, filterEquation, (geometryType, theStyle) => {
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
   * Calculates a text-only style (no geometry) for the given feature.
   *
   * @param layer - The layer on which to work for the style.
   * @param feature - Feature that needs its style defined.
   * @returns The text-only style or undefined if no text style could be calculated.
   */
  static calculateTextStyleForFeature(layer: AbstractGVLayer, feature: FeatureLike): Style | undefined {
    // Get the layer config and style
    const style = layer.getStyle() || {};
    const outfields = layer.getLayerConfig().getOutfields();
    const aliasLookup = GVLayerUtilities.createAliasLookup(outfields);
    const layerText = layer.getLayerConfig().getLayerText();

    // If no text configured, return undefined
    if (!layerText) return undefined;

    // Get the geometry type
    const geometryType = GeoviewRenderer.readGeometryTypeSimplifiedFromFeature(feature, style);
    const styleSettings = style?.[geometryType];

    // If no style settings, return undefined
    if (!styleSettings) return undefined;

    // Get the text style
    const textStyle = GeoviewTextRenderer.getTextStyle(feature, styleSettings, layerText, aliasLookup);

    // If no text style, return undefined
    if (!textStyle) return undefined;

    // Create a new transparent style with only text
    return new Style({
      text: textStyle,
    });
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

/**
 * Define an event for the delegate
 */
export type TextVisibleChangedEvent = {
  textVisible: boolean;
};

/**
 * Define a delegate for the event handler function signature
 */
export type TextVisibleChangedDelegate = EventDelegateBase<AbstractGVVector, TextVisibleChangedEvent, void>;
