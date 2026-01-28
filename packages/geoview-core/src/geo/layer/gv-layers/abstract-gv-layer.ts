import type { Options } from 'ol/layer/Base';
import type BaseLayer from 'ol/layer/Base';
import type { Coordinate } from 'ol/coordinate';
import type { Pixel } from 'ol/pixel';
import type { Extent } from 'ol/extent';
import type Feature from 'ol/Feature';
import type { Layer } from 'ol/layer';
import type Source from 'ol/source/Source';
import type { Projection as OLProjection } from 'ol/proj';
import type { Map as OLMap } from 'ol';
import { getUid } from 'ol';

import type { TimeDimension, TypeDateFragments } from '@/core/utils/date-mgt';
import { DateMgt } from '@/core/utils/date-mgt';
import { logger } from '@/core/utils/logger';
import type { EsriDynamicLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import type { OgcWmsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import type { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import type {
  TypeLayerStyleConfig,
  TypeFeatureInfoEntry,
  codedValueType,
  rangeDomainType,
  TypeLocation,
  QueryType,
  TypeStyleGeometry,
  TypeOutfieldsType,
  TypeOutfields,
  TypeLayerStyleSettings,
} from '@/api/types/map-schema-types';
import type {
  TypeLayerMetadataFields,
  TypeLayerMetadataEsri,
  TypeLayerMetadataVector,
  TypeGeoviewLayerType,
} from '@/api/types/layer-schema-types';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import type { TypeLegendItem } from '@/core/components/layers/types';
import { GeoviewRenderer, type TypeStyleProcessorOptions } from '@/geo/utils/renderer/geoview-renderer';
import type { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import type { SnackbarType } from '@/core/utils/notifications';
import { NotImplementedError, NotSupportedError } from '@/core/exceptions/core-exceptions';
import { LayerNotQueryableError, LayerStatusErrorError } from '@/core/exceptions/layer-exceptions';
import { GVLayerUtilities } from '@/geo/layer/gv-layers/utils';
import { GVVectorSource } from '@/geo/layer/source/vector-source';
import { LayerFilters } from '@/geo/layer/gv-layers/layer-filters';
import { delay, whenThisThen } from '@/core/utils/utilities';

/**
 * Abstract Geoview Layer managing an OpenLayer layer.
 */
export abstract class AbstractGVLayer extends AbstractBaseGVLayer {
  /** The default hit tolerance the query should be using */
  static readonly DEFAULT_HIT_TOLERANCE: number = 4;

  /** The default loading period before we show a message to the user about a layer taking a long time to render on map */
  static readonly DEFAULT_LOADING_PERIOD: number = 8 * 1000; // 8 seconds

  /** Counts the number of times the loading happened. */
  loadingCounter: number = 0;

  /** Marks the latest loading count for the layer.
   * This useful to know when the put the layer loaded status back correctly with parallel processing happening */
  loadingMarker: number = 0;

  /** The OpenLayer source */
  #olSource: Source;

  /** The legend as fetched */
  #layerLegend?: TypeLegend;

  /** Style to apply to the vector layer. */
  #layerStyle?: TypeLayerStyleConfig;

  /** The layer filters currently applied on the layer, if any */
  #layerFilters: LayerFilters;

  /** Indicates if the layer is currently queryable */
  #queryable: boolean;

  /** Indicates if the layer is currently hoverable */
  #hoverable: boolean;

  /** Keep all callback delegate references */
  #onLayerStyleChangedHandlers: StyleChangedDelegate[] = [];

  /** Keep all callback delegate references */
  #onLegendQueryingHandlers: LegendQueryingDelegate[] = [];

  /** Keep all callback delegate references */
  #onLegendQueriedHandlers: LegendQueriedDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerFilterAppliedHandlers: LayerFilterAppliedDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerFirstLoadedHandlers: LayerDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerLoadingHandlers: LayerDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerLoadedHandlers: LayerDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerErrorHandlers: LayerErrorDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerMessageHandlers: LayerMessageDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerQueryableChangedHandlers: LayerQueryableChangedDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerHoverableChangedHandlers: LayerHoverableChangedDelegate[] = [];

  /**
   * Constructs a GeoView layer to manage an OpenLayer layer.
   * @param {Source} olSource - The OpenLayer Source.
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer configuration.
   */
  protected constructor(olSource: Source, layerConfig: AbstractBaseLayerEntryConfig) {
    super(layerConfig);
    this.#olSource = olSource;

    // Copy the queryable flag, we'll work with this and the config remains static
    this.#queryable = layerConfig.getInitialSettings()?.states?.queryable ?? true;
    this.#hoverable = layerConfig.getInitialSettings()?.states?.hoverable ?? true;

    // If there is a layer style in the config, set it in the layer
    const style = layerConfig.getLayerStyle();
    if (style) this.setStyle(style);

    // Create the layer filters object to empty. It'll be initialized properly later via 'initGVLayer' once the object is done being created.
    this.#layerFilters = new LayerFilters();
  }

  // #region OVERRIDES

  /**
   * Must override method to return the bounds of a layer in the given projection.
   * @param {OLProjection} projection - The projection to get the bounds into.
   * @param {number} stops - The number of stops to use to generate the extent.
   * @returns {Extent} The layer bounding box.
   */
  abstract onGetBounds(projection: OLProjection, stops: number): Extent | undefined;

  /**
   * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
   * @override
   * @returns {Layer} The strongly-typed OpenLayers type.
   */
  override getOLLayer(): Layer {
    // Call parent and cast
    return super.getOLLayer() as Layer;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {AbstractBaseLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
   */
  override getLayerConfig(): AbstractBaseLayerEntryConfig {
    return super.getLayerConfig() as AbstractBaseLayerEntryConfig;
  }

  /**
   * Overrides the way the attributions are retrieved.
   * @override
   * @returns {string[]} The layer attributions
   */
  override onGetAttributions(): string[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const attributionsAsRead = this.getOLSource().getAttributions()?.({} as any); // This looks very weird, but it's as documented in OpenLayers..

    // Depending on the internal formatting
    if (!attributionsAsRead) return [];
    if (typeof attributionsAsRead === 'string') return [attributionsAsRead];
    return attributionsAsRead;
  }

  /**
   * Overrides the refresh function to refresh the layer source.
   * @param {OLProjection | undefined} projection - Optional, the projection to refresh to.
   * @override
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override onRefresh(projection: OLProjection | undefined): void {
    // Refresh the layer source
    this.getOLSource().refresh();
  }

  /**
   * Overridable function that gets the extent of an array of features.
   * @param {number[] | string[]} objectIds - The IDs of the features to calculate the extent from.
   * @param {OLProjection} outProjection - The output projection for the extent.
   * @param {string} outfield - ID field to return for services that require a value in outfields.
   * @returns {Promise<Extent>} The extent of the features, if available
   * @throws {NotImplementedError} When the function isn't overridden by the children class.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onGetExtentFromFeatures(objectIds: number[] | string[], outProjection: OLProjection, outfield?: string): Promise<Extent> {
    // Crash on purpose
    throw new NotImplementedError(`onGetExtentFromFeatures function not implemented for ${this.getLayerPath()}`);
  }

  /**
   * Overridable function returning the legend of the layer. Returns null when the layerPath specified is not found. If the style property
   * of the layerConfig object is undefined, the legend property of the object returned will be null.
   * @returns {Promise<TypeLegend | null>} The legend of the layer.
   */
  async onFetchLegend(): Promise<TypeLegend | null> {
    try {
      // Get the style
      const style = this.getStyle() || this.getLayerConfig().getLayerStyle();

      // Redirect
      return await AbstractGVLayer.createLegendFromStyle(this.getLayerConfig().getSchemaTag(), style);
    } catch (error: unknown) {
      // Log
      logger.logError(error);
      return null;
    }
  }

  /**
   * Overridable method called when the layer has started to load itself on the map.
   * @param {Event} event - The event which is being triggered.
   */
  protected onLoading(event: Event): void {
    // Increment the counter
    this.loadingCounter++;

    // Mark the current event with the loading counter, this is a trick using the wrapper to re-obtain it in the 'onLoaded' function below.
    // eslint-disable-next-line no-underscore-dangle
    this.#findWrapperBetweenEventHandlers(event)._loadingCounter = this.loadingCounter;

    // Log it, leaving the logDebug for dev purposes
    // logger.logDebug('PRIOR', this.#findWrapperBetweenEventHandlers(event)._loadingCounter);

    // Get the layer config
    const layerConfig = this.getLayerConfig();

    // Set the layer has loading
    layerConfig.setLayerStatusLoading();

    // Update the parent group if any
    this.getLayerConfig().updateLayerStatusParent();

    // Start a watcher and bind the loadingCounter with it
    this.#startLoadingPeriodWatcher(this.loadingCounter);

    // Emit event for all layer load events
    this.#emitLayerLoading();
  }

  /**
   * Overridable method called when the layer has been loaded correctly.
   * @param {Event} event - The event which is being triggered.
   */
  protected onLoaded(event: Event): void {
    // Log it, leaving the logDebug for dev purposes
    // logger.logDebug('AFTER', this.#findWrapperBetweenEventHandlers(event)._loadingCounter);

    // If it's not the 'loaded' that correspond to the last 'loading' (asynchronicity thing)
    // eslint-disable-next-line no-underscore-dangle
    if (this.loadingCounter !== this.#findWrapperBetweenEventHandlers(event)._loadingCounter) return;

    // Log it, leaving the logDebug for dev purposes
    // logger.logDebug('AFTER CHECKED', this.#findWrapperBetweenEventHandlers(event)._loadingCounter);

    // Get the layer config
    const layerConfig = this.getLayerConfig();

    // Set the layer config status to loaded to keep mirroring the AbstractGeoViewLayer for now
    layerConfig.setLayerStatusLoaded();

    // Update the parent group if any
    this.getLayerConfig().updateLayerStatusParent();

    // If first time
    if (!this.loadedOnce) {
      // Now that the layer is loaded, set its visibility correctly (had to be done in the loaded event, not before, per prior note in pre-refactor)
      this.setVisible(layerConfig.getInitialSettings()?.states?.visible ?? true); // default: true

      // Emit event for the first time the layer got loaded
      this.#emitLayerFirstLoaded();
    }

    // Flag
    this.loadedOnce = true;

    // Emit event for all layer load events
    this.#emitLayerLoaded();
  }

  /**
   * Overridable method called when the layer is in error and couldn't be loaded correctly.
   * @param {Event} event - The event which is being triggered.
   */
  protected onError(event: Event): void {
    // Log
    logger.logError(`An error happened on the layer: ${this.getLayerPath()} after it was processed and added on the map.`, event);

    // Check the layer status before
    const layerStatusBefore = this.getLayerConfig().layerStatus;

    // If we were not error before
    if (layerStatusBefore !== 'error') {
      // Set the layer config status to error to keep mirroring the AbstractGeoViewLayer for now
      this.getLayerConfig().setLayerStatusError();

      // Update the parent group if any
      this.getLayerConfig().updateLayerStatusParent();

      // Emit about the error
      this.#emitError(event, 'layers.errorNotLoaded');
    } else {
      // We've already emitted an error to the user about the layer being in error, skip so that we don't spam
    }

    // Emit event for all layer error events
    this.#emitLayerError({ error: event });
  }

  /**
   * Overridable method called when the layer image is in error and couldn't be loaded correctly.
   * @param {Event} event - The event which is being triggered.
   */
  protected onImageLoadError(event: Event): void {
    // Log
    logger.logError(`Error loading source image for layer: ${this.getLayerPath()}.`, event);

    // Check the layer status before
    const layerStatusBefore = this.getLayerConfig().layerStatus;

    // If we were not error before
    if (layerStatusBefore !== 'error') {
      // Set the layer config status to error to keep mirroring the AbstractGeoViewLayer for now
      this.getLayerConfig().setLayerStatusError();

      // Update the parent group if any
      this.getLayerConfig().updateLayerStatusParent();

      // Emit about the error
      this.#emitError(event, 'layers.errorImageLoad');
    } else {
      // We've already emitted an error to the user about the layer being in error, skip
    }

    // Emit event for all layer error events
    this.#emitLayerError({ error: event });
  }

  /**
   * Method called when the layer source changes to check for errors.
   * @param {Event} event - The event which is being triggered.
   */
  protected onSourceChange(event: Event): void {
    const state = this.#olSource.getState();
    if (state === 'error') {
      // eslint-disable-next-line no-underscore-dangle, @typescript-eslint/no-explicit-any
      const error = (this.#olSource as any).error_;
      const errorMessage = error?.message || String(error);

      // Log the error, we do not throw as the layer can still be added but marked as errored
      logger.logError('GeoTIFF source failed with error', {
        layerId: this.getLayerPath(),
        error: errorMessage,
        event,
      });

      // Trigger onError handling
      this.onError(error);
    }
  }

  /**
   * Overridable function to get all feature information for all the features stored in the layer.
   * @param {OLMap} map - The Map so that we can grab the resolution/projection we want to get features on.
   * @param {LayerFilters} layerFilters - The layer filters to apply when querying the features.
   * @param {AbortController?} [abortController] - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   * @throws {NotImplementedError} When the function isn't overridden by the children class.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getAllFeatureInfo(map: OLMap, layerFilters: LayerFilters, abortController?: AbortController): Promise<TypeFeatureInfoEntry[]> {
    // Crash on purpose
    throw new NotImplementedError(`getAllFeatureInfo not implemented on layer path ${this.getLayerPath()}`);
  }

  /**
   * Overridable function to return of feature information at a given pixel location.
   * @param {OLMap} map - The Map where to get Feature Info At Pixel from.
   * @param {Pixel} location - The pixel coordinate that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} [abortController] - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected getFeatureInfoAtPixel(
    map: OLMap,
    location: Pixel,
    queryGeometry: boolean = true,
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Redirect to getFeatureInfoAtCoordinate
    return this.getFeatureInfoAtCoordinate(map, map.getCoordinateFromPixel(location), queryGeometry, abortController);
  }

  /**
   * Overridable function to return of feature information at a given coordinate.
   * @param {OLMap} map - The Map where to get Feature Info At Coordinate from.
   * @param {Coordinate} location - The coordinate that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} [abortController] - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   * @throws {NotImplementedError} When the function isn't overridden by the children class.
   */
  protected getFeatureInfoAtCoordinate(
    map: OLMap,
    location: Coordinate,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queryGeometry: boolean = true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Crash on purpose
    throw new NotImplementedError(`getFeatureInfoAtCoordinate not implemented on layer path ${this.getLayerPath()}`);
  }

  /**
   * Overridable function to return of feature information at the provided long lat coordinate.
   * @param {OLMap} map - The Map where to get Feature Info At LonLat from.
   * @param {Coordinate} lonlat - The coordinate that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} [abortController] - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   * @throws {NotImplementedError} When the function isn't overridden by the children class.
   */
  protected getFeatureInfoAtLonLat(
    map: OLMap,
    lonlat: Coordinate,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queryGeometry: boolean = true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Crash on purpose
    throw new NotImplementedError(`getFeatureInfoAtLonLat not implemented on layer path ${this.getLayerPath()}`);
  }

  /**
   * Overridable function to return of feature information at the provided bounding box.
   * @param {OLMap} map - The Map where to get Feature using BBox from.
   * @param {Coordinate} location - The bounding box that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} [abortController] - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   * @throws {NotImplementedError} When the function isn't overridden by the children class.
   */
  protected getFeatureInfoUsingBBox(
    map: OLMap,
    location: Coordinate[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queryGeometry: boolean = true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Crash on purpose
    throw new NotImplementedError(`getFeatureInfoUsingBBox not implemented on layer path ${this.getLayerPath()}`);
  }

  /**
   * Overridable function to return of feature information at the provided polygon.
   * @param {OLMap} map - The Map where to get Feature Info using Polygon from.
   * @param {Coordinate} location - The polygon that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} [abortController] - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   * @throws {NotImplementedError} When the function isn't overridden by the children class.
   */
  protected getFeatureInfoUsingPolygon(
    map: OLMap,
    location: Coordinate[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queryGeometry: boolean = true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Crash on purpose
    throw new NotImplementedError(`getFeatureInfoUsingPolygon not implemented on layer path ${this.getLayerPath()}`);
  }

  /**
   * Overridable function to return the domain of the specified field or null if the field has no domain.
   * @param {string} fieldName - The field name for which we want to get the domain.
   * @returns {null | codedValueType | rangeDomainType} The domain of the field.
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this, @typescript-eslint/no-unused-vars
  protected onGetFieldDomain(fieldName: string): null | codedValueType | rangeDomainType {
    // Log - REMOVED as it is trigger for every row of data table, just enable for debuggin purpose
    // logger.logWarning(`getFieldDomain is not implemented for ${fieldName} on layer path ${this.getLayerPath()}`);
    return null;
  }

  /**
   * Overridable function to return the type of the specified field from the metadata. If the type can not be found, return 'string'.
   * @param {string} fieldName - The field name for which we want to get the type.
   * @returns {TypeOutfieldsType} The type of the field.
   */
  protected onGetFieldType(fieldName: string): TypeOutfieldsType {
    // Log
    logger.logWarning(`getFieldType is not implemented for ${fieldName} on layer path ${this.getLayerPath()}`);
    return 'string';
  }

  /**
   * Overridable function set the style according to the fetched legend information
   * @param {TypeLegend} legend - The fetched legend information
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this, @typescript-eslint/no-unused-vars
  onSetStyleAccordingToLegend(legend: TypeLegend): void {
    // By default, nothing to do here, check for overrides in children classes
  }

  /**
   * Overridable function to apply a view filter on the current layer.
   * @param {LayerFilters} [filter] - The elaborate layer filters to be used.
   * @returns {void}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/class-methods-use-this
  protected onSetLayerFilters(filter?: LayerFilters): void {
    // Override this to set the filters on the layer
  }

  // #endregion OVERRIDES

  // #region PUBLIC METHODS

  /**
   * Initializes the GVLayer. This function checks if the source is ready and if so it calls onLoaded() to pursue initialization of the layer.
   * If the source isn't ready, it registers to the source ready event to pursue initialization of the layer once its source is ready.
   */
  init(): void {
    // Activation of the load end/error listeners
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.#olSource as any).on(['featuresloadstart', 'imageloadstart', 'tileloadstart'], this.onLoading.bind(this));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.#olSource as any).on(['featuresloadend', 'imageloadend', 'tileloadend'], this.onLoaded.bind(this));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.#olSource as any).on(['featuresloaderror', 'tileloaderror'], this.onError.bind(this));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.#olSource as any).on(['imageloaderror'], this.onImageLoadError.bind(this));

    // Activate source change listener to catch errors
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.#olSource as any).on('change', this.onSourceChange.bind(this));

    // Apply render error handling to prevent "Cannot read properties of null (reading 'globalAlpha')" errors
    AbstractGVLayer.#addRenderErrorHandling(this.getOLLayer());
  }

  /**
   * Gets the OpenLayers Layer Source
   * @returns The OpenLayers Layer Source
   */
  getOLSource(): Source {
    return this.#olSource;
  }

  /**
   * Gets the hit tolerance associated with the layer.
   * @returns {number} The hit tolerance
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  getHitTolerance(): number {
    return AbstractGVLayer.DEFAULT_HIT_TOLERANCE;
  }

  /**
   * Gets the legend associated with the layer.
   * @returns The layer legend
   */
  getLegend(): TypeLegend | undefined {
    return this.#layerLegend;
  }

  /**
   * Sets the legend associated with the layer.
   * @param {TypeLegend} legend - The layer legend
   */
  setLegend(legend: TypeLegend): void {
    this.#layerLegend = legend;
  }

  /**
   * Gets the layer style
   * @returns The layer style
   */
  getStyle(): TypeLayerStyleConfig | undefined {
    return this.#layerStyle;
  }

  /**
   * Sets the layer style
   * @param {TypeStyleConfig} style - The layer style
   */
  setStyle(style: TypeLayerStyleConfig): void {
    this.#layerStyle = style;
    this.#emitLayerStyleChanged({ style });
  }

  /**
   * Gets the style item visibility on the layer.
   * @param {TypeLegendItem} item - The style item to toggle visibility on
   * @returns {boolean} The visibility of the style item
   */
  getStyleItemVisibility(item: TypeLegendItem): boolean {
    // Get the style config
    const geometryStyleConfig = this.getStyle()![item.geometryType];

    // Get all styles with the label matching the name of the clicked item
    const styleInfos = geometryStyleConfig?.info.filter((styleInfo) => styleInfo.label === item.name);
    const styleInfosVisible = styleInfos?.filter((styleInfo) => styleInfo.visible ?? false);

    // Return if all visible
    return styleInfosVisible?.length === styleInfos?.length;
  }

  /**
   * Sets the style item visibility on the layer and refresh it.
   * @param {TypeLegendItem} item - The style item to toggle visibility on
   * @param {boolean} visibility - The visibility of the style item
   */
  setStyleItemVisibility(item: TypeLegendItem, visibility: boolean): void {
    // Get the style config
    const geometryStyleConfig = this.getStyle()![item.geometryType];

    // Get all styles with the label matching the name of the clicked item and update their visibility
    const styleInfos = geometryStyleConfig?.info.filter((styleInfo) => styleInfo.label === item.name);
    styleInfos?.forEach((styleInfo) => {
      // eslint-disable-next-line no-param-reassign
      styleInfo.visible = visibility;
    });

    // Force a re-render of the layer source (this is required if there are classes)
    this.getOLLayer().changed();
  }

  /**
   * Builds and returns a filter expression derived from the layer's style configuration.
   * This method delegates the filter extraction logic to {@link GeoviewRenderer.getFilterFromStyle},
   * using the current layer configuration (outfields, style, and style settings).
   * @returns {string | undefined} A filter expression string if one can be derived from the style,
   * or `undefined` if no filter applies.
   */
  getFilterFromStyle(): string | undefined {
    // Redirect
    return GeoviewRenderer.getFilterFromStyle(
      this.getLayerConfig().getOutfields(),
      this.getLayerConfig().getLayerStyle(), // TODO: Use this.getStyle() once we progress in the refactoring, right now leaving it as-is was..
      this.getLayerConfig().getLayerStyleSettings()
    );
  }

  /**
   * Gets the bounds for the layer in the given projection.
   * @param {OLProjection} projection - The projection to get the bounds into.
   * @param {number} stops - The number of stops to use to generate the extent.
   * @returns {Extent | undefined} The layer bounding box.
   */
  getBounds(projection: OLProjection, stops: number): Extent | undefined {
    // Redirect to overridable method
    // TODO: REFACTOR - Review all onGetBounds() to see how they can be optimized now that the initialSettings extent and bounds have been clarified
    return this.onGetBounds(projection, stops);
  }

  /**
   * Gets the temporal dimension that is associated to the layer.
   * @returns {TimeDimension | undefined} The temporal dimension associated to the layer or undefined.
   */
  getTimeDimension(): TimeDimension | undefined {
    return this.getLayerConfig().getTimeDimension();
  }

  /**
   * Gets the flag if layer use its time dimension, this can be use to exclude layers from time function like time slider
   * @returns {boolean} The flag indicating if the layer should be included in time awareness functions such as the Time Slider. True by default.
   */
  getIsTimeAware(): boolean {
    return this.getLayerConfig().getGeoviewLayerConfig()?.isTimeAware ?? true;
  }

  /**
   * Gets the in visible range value
   * @param {number | undefined} currentZoom - The map current zoom
   * @returns {boolean} true if the layer is in visible range
   */
  getInVisibleRange(currentZoom: number | undefined): boolean {
    if (!currentZoom) return false;
    return currentZoom > this.getMinZoom() && currentZoom <= this.getMaxZoom();
  }

  /**
   * Indicates if the layer is currently queryable.
   * @returns {boolean} The currently queryable flag.
   */
  getQueryable(): boolean {
    return this.#queryable;
  }

  /**
   * Sets if the layer is currently queryable.
   * @param {boolean} queryable - The queryable value.
   */
  setQueryable(queryable: boolean): void {
    // Get the layer config
    const layerConfig = this.getLayerConfig();

    // If the source is not queryable
    if (!layerConfig.getQueryableSourceDefaulted()) throw new LayerNotQueryableError(layerConfig.layerPath, this.getLayerName());

    // Go for it
    this.#queryable = queryable;
    this.#emitLayerQueryableChanged({ queryable });
  }

  /**
   * Indicates if the layer is currently hoverable.
   * @returns {boolean} The currently hoverable flag.
   */
  getHoverable(): boolean {
    return this.#hoverable;
  }

  /**
   * Sets if the layer is currently hoverable.
   * @param {boolean} hoverable - The hoverable value.
   */
  setHoverable(hoverable: boolean): void {
    // Go for it
    this.#hoverable = hoverable;
    this.#emitLayerHoverableChanged({ hoverable });
  }

  /**
   * Gets the extent of an array of features.
   * @param {number[] | string[]} objectIds - The IDs of the features to calculate the extent from.
   * @param {OLProjection} outProjection - The output projection for the extent.
   * @param {string} outfield - ID field to return for services that require a value in outfields.
   * @returns {Promise<Extent>} The extent of the features, if available
   */
  getExtentFromFeatures(objectIds: number[] | string[], outProjection: OLProjection, outfield?: string): Promise<Extent> {
    // Redirect
    return this.onGetExtentFromFeatures(objectIds, outProjection, outfield);
  }

  /**
   * Gets the field type for the given field name.
   * @param {string} fieldName  - The field name
   * @returns {TypeOutfieldsType} The field type.
   */
  getFieldType(fieldName: string): TypeOutfieldsType {
    // Redirect
    return this.onGetFieldType(fieldName);
  }

  /**
   * Gets the layer filters associated to the layer.
   * @returns {LayerFilters} The filter associated to the layer or undefined.
   */
  getLayerFilters(): LayerFilters {
    // Return it
    return this.#layerFilters;
  }

  /**
   * Sets the layer filters associated to the layer.
   * @param {LayerFilters | undefined} layerFilters - The filter layers associated to the layer or undefined.
   * @returns {void}
   */
  setLayerFilters(layerFilters: LayerFilters, refresh: boolean | undefined): void {
    // Keep it
    this.#layerFilters = layerFilters;

    // Redirect
    this.onSetLayerFilters(layerFilters);

    // If refreshing
    if (refresh) {
      // Refresh
      this.getOLLayer().changed();
    }

    // Emit event
    // TODO: LayerApi could listen to that event in case we need to update the store.
    this.emitLayerFilterApplied({
      filter: layerFilters,
    });
  }

  /**
   * Applies a time filter on a date range.
   * @param {string} date1 - The start date
   * @param {string} date2 - The end date
   */
  setLayerFiltersDate(date1: string, date2: string): void {
    // Get the time dimension field
    const { field } = this.getTimeDimension()!;

    // Tweak the current layer filters to modify the time filter (create a new layer filters if none currently exists)
    const layerFilters = this.getLayerFilters();
    layerFilters.setTimeFilter(`${field} >= date '${date1}' and ${field} <= date '${date2}'`);

    // Redirect
    this.setLayerFilters(layerFilters, true);
  }

  /**
   * Returns feature information for the layer specified.
   * @param {OLMap} map - The Map to get feature info from.
   * @param {QueryType} queryType - The type of query to perform.
   * @param {TypeLocation} location - An pixel, coordinate or polygon that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} [abortController] - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} The feature info table.
   */
  async getFeatureInfo(
    map: OLMap,
    queryType: QueryType,
    location: TypeLocation,
    queryGeometry: boolean = true,
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Log
    logger.logTraceCore('ABSTRACT-GV-LAYERS - getFeatureInfo', queryType);
    const logMarkerKey = `${queryType}`;
    logger.logMarkerStart(logMarkerKey);

    let promiseGetFeature: Promise<TypeFeatureInfoEntry[]>;
    switch (queryType) {
      case 'all': {
        // Create the filter on the initial filter only, get everything else.
        const layerFilters = new LayerFilters(this.getLayerFilters().getInitialFilter());

        // Get all feature info
        promiseGetFeature = this.getAllFeatureInfo(map, layerFilters, abortController);
        break;
      }
      case 'at_pixel':
        promiseGetFeature = this.getFeatureInfoAtPixel(map, location as Pixel, queryGeometry, abortController);
        break;
      case 'at_coordinate':
        promiseGetFeature = this.getFeatureInfoAtCoordinate(map, location as Coordinate, queryGeometry, abortController);
        break;
      case 'at_lon_lat':
        promiseGetFeature = this.getFeatureInfoAtLonLat(map, location as Coordinate, queryGeometry, abortController);
        break;
      case 'using_a_bounding_box':
        promiseGetFeature = this.getFeatureInfoUsingBBox(map, location as Coordinate[], queryGeometry, abortController);
        break;
      case 'using_a_polygon':
        promiseGetFeature = this.getFeatureInfoUsingPolygon(map, location as Coordinate[], queryGeometry, abortController);
        break;
      default:
        // Not implemented
        throw new NotSupportedError(`Unsupported query type '${queryType}'`);
    }

    // Wait for results
    const arrayOfFeatureInfoEntries = await promiseGetFeature;

    // Log
    logger.logMarkerCheck(logMarkerKey, `to getFeatureInfo on ${this.getLayerPath()}`, arrayOfFeatureInfoEntries);

    // Return the result
    return arrayOfFeatureInfoEntries;
  }

  /**
   * Queries the legend.
   * This function raises legend querying and queried events. It calls the overridable onFetchLegend() function.
   * @returns {Promise<TypeLegend | null>} The promise when the legend (or null) will be received
   */
  queryLegend(): Promise<TypeLegend | null> {
    // Emit that the legend has been queried
    this.#emitLegendQuerying();

    // Fetch the legend by calling the overridable function
    const promiseLegend = this.onFetchLegend();

    // Whenever the promise resolves
    promiseLegend
      .then((legend) => {
        // If legend was received
        if (legend) {
          // Set the legend
          this.setLegend(legend);
          // Save the style according to the legend
          this.onSetStyleAccordingToLegend(legend);
          // Emit legend information once retrieved
          this.#emitLegendQueried({ legend });
        }
      })
      .catch((error: unknown) => {
        // Log
        logger.logPromiseFailed('promiseLegend in queryLegend in AbstractGVLayer', error);
      });

    // Return the promise
    return promiseLegend;
  }

  /**
   * Utility function allowing to wait for the layer to be loaded at least once.
   * @param {number} timeout - A timeout for the period to wait for. Defaults to 30,000 ms.
   * @returns {Promise<boolean>} A Promise that resolves when the layer has been loaded at least once.
   */
  waitLoadedOnce(timeout: number = 30000): Promise<boolean> {
    // Create a promise and wait until the layer is first loaded
    return whenThisThen(() => {
      // If the layer is in error, abort the waiting
      if (this.getLayerStatus() === 'error') {
        // The layer is in error, throw error
        throw new LayerStatusErrorError(this.getGeoviewLayerId(), this.getLayerName());
      }

      // If the layer was first loaded
      return this.loadedOnce;
    }, timeout);
  }

  /**
   * Utility function allowing to wait for the layer to be loaded at least once.
   * @param {number} timeout - A timeout for the period to wait for. Defaults to 30,000 ms.
   * @returns {Promise<boolean>} A Promise that resolves when the layer has been loaded at least once.
   */
  waitLoadedStatus(timeout: number = 30000): Promise<boolean> {
    // Create a promise and wait until the layer is first loaded
    return whenThisThen(() => {
      // If the layer is in error, abort the waiting
      if (this.getLayerStatus() === 'error') {
        // The layer is in error, throw error
        throw new LayerStatusErrorError(this.getGeoviewLayerId(), this.getLayerName());
      }

      // If the layer status is loaded
      return this.getLayerStatus() === 'loaded';
    }, timeout);
  }

  /**
   * Utility function allowing to wait for the layer legend to be fetched.
   * @param {number} timeout - A timeout for the period to wait for. Defaults to 30,000 ms.
   * @returns {Promise<TypeLegend>} A Promise that resolves when the layer legend has been fetched.
   */
  waitLegendFetched(timeout: number = 30000): Promise<TypeLegend> {
    // Create a promise and wait until the layer is first loaded
    return whenThisThen(() => {
      // If the layer is in error, abort the waiting
      if (this.getLayerStatus() === 'error') {
        // The layer is in error, throw error
        throw new LayerStatusErrorError(this.getGeoviewLayerId(), this.getLayerName());
      }

      // If the layer was first loaded
      return this.getLegend()!;
    }, timeout);
  }

  /**
   * Utility function allowing to wait for the layer style to be applied.
   * @param {number} timeout - A timeout for the period to wait for. Defaults to 30,000 ms.
   * @returns {Promise<void>} A Promise that resolves when the layer style has been applied.
   */
  waitStyleApplied(timeout: number = 30000): Promise<TypeLayerStyleConfig> {
    // Create a promise and wait until the layer is first loaded
    return whenThisThen(() => {
      // If the layer is in error, abort the waiting
      if (this.getLayerStatus() === 'error') {
        // The layer is in error, throw error
        throw new LayerStatusErrorError(this.getGeoviewLayerId(), this.getLayerName());
      }

      // If the layer was first loaded
      return this.getStyle()!;
    }, timeout);
  }

  // #endregion PUBLIC METHODS

  // #region PROTECTED METHODS

  /**
   * Gets and formats the value of the field with the name passed in parameter. Vector GeoView layers convert dates to milliseconds
   * since the base date. Vector feature dates must be in ISO format.
   * @param {Feature} feature - The feature that hold the field values.
   * @param {string} fieldName - The field name.
   * @param {TypeOutfieldsType} fieldType - The field type.
   * @returns {string | number | Date} The formatted value of the field.
   */
  protected getFieldValue(feature: Feature, fieldName: string, fieldType: TypeOutfieldsType): string | number | Date {
    // Redirect
    return AbstractGVLayer.helperGetFieldValue(
      feature,
      fieldName,
      fieldType,
      this.getLayerConfig().getServiceDateFragmentsOrder(),
      this.getLayerConfig().getExternalFragmentsOrder()
    );
  }

  /**
   * Formats a list of features into an array of TypeFeatureInfoEntry, including icons, field values, domains, and metadata.
   * @param {Feature[]} features - Array of features to format.
   * @param {OgcWmsLayerEntryConfig | EsriDynamicLayerEntryConfig | VectorLayerEntryConfig} layerConfig - Configuration of the associated layer.
   * @returns {TypeFeatureInfoEntry[]} An array of TypeFeatureInfoEntry objects.
   */
  protected formatFeatureInfoResult(
    features: Feature[],
    layerConfig: OgcWmsLayerEntryConfig | EsriDynamicLayerEntryConfig | VectorLayerEntryConfig
  ): TypeFeatureInfoEntry[] {
    // Redirect
    return AbstractGVLayer.helperFormatFeatureInfoResult(
      features,
      layerConfig.layerPath,
      layerConfig.getSchemaTag(),
      layerConfig.getNameField(),
      layerConfig.getOutfields(),
      true,
      (layerConfig.getLayerMetadata() as TypeLayerMetadataEsri | TypeLayerMetadataVector)?.fields,
      this.getStyle(),
      this.getFieldType.bind(this),
      this.onGetFieldDomain.bind(this),
      this.getFieldValue.bind(this)
    );
  }

  /**
   * Emits a layer-specific message event with localization support
   * @protected
   * @param {string} messageKey - The key used to lookup the localized message OR message
   * @param {string[]} messageParams - Array of parameters to be interpolated into the localized message
   * @param {SnackbarType} messageType - The message type
   * @param {boolean} [notification=false] - Whether to show this as a notification. Defaults to false
   *
   * @example
   * this.emitMessage(
   *   'layers.fetchProgress',
   *   ['50', '100'],
   *   messageType: 'error',
   *   true
   * );
   *
   * @fires LayerMessageEvent
   */
  protected emitMessage(
    messageKey: string,
    messageParams: string[],
    messageType: SnackbarType = 'info',
    notification: boolean = false
  ): void {
    this.#emitLayerMessage({ messageKey, messageParams, messageType, notification });
  }

  // #endregion PROTECTED METHODS

  // #region PRIVATE METHODS

  /**
   * Extracts the relevant image, tile, or dispatching_ object from the event based on its structure.
   * This method attempts to find the corresponding object (`image`, `tile`, or `dispatching_`) in the event.
   * @param event - The event object, which could contain either an `image`, `tile`, or `dispatching_` property.
   * @returns {any} - The extracted object (either image, tile, or dispatching_).
   * @throws {NotSupportedError} - If the event doesn't match the expected structures.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #findWrapperBetweenEventHandlers(event: unknown): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventAny = event as any;

    if ('image' in eventAny) {
      return eventAny.image;
    }

    if ('tile' in eventAny) {
      return eventAny.tile;
    }

    if ('target' in eventAny && 'dispatching_' in eventAny.target) {
      // eslint-disable-next-line no-underscore-dangle
      return eventAny.target.dispatching_;
    }

    // Throw error
    throw new NotSupportedError(`Not supported event wrapper for layer ${this.getLayerPath()}`);
  }

  /**
   * Monitors the loading status of a layer.
   * After `DEFAULT_LOADING_PERIOD` milliseconds, it checks whether the layer is still loading. If so, it emits a warning message indicating
   * that the rendering is taking longer than expected. The interval stops automatically when the layer finishes loading
   * or encounters an error, or if a new loading process supersedes the current one (based on the loading counter).
   * @param {number} loadingCounter - A unique counter representing the loading instance. Only the interval tied to the current
   *                                  loading process will continue monitoring; outdated intervals will self-terminate.
   */
  #startLoadingPeriodWatcher(loadingCounter: number): void {
    delay(AbstractGVLayer.DEFAULT_LOADING_PERIOD).then(
      () => {
        // This is the right interval that we want to be checking the layer status
        const { layerStatus } = this.getLayerConfig();

        // Check if the loadingCounter is different than our current counter (we're on the wrong timer for the loading checker)
        if (this.loadingCounter !== loadingCounter) return true;

        // If loaded or error, we're done
        if (layerStatus === 'loaded' || layerStatus === 'error') return true;

        // If still loading
        if (layerStatus === 'loading') {
          // Emit about the delay
          this.emitMessage('warning.layer.slowRender', [this.getLayerName()], 'warning');
        }

        return false;
      },
      (error: unknown) => logger.logPromiseFailed('Delay in #startLoadingPeriodWatcher failed', error)
    );
  }

  /**
   * Emits a user-facing error message for a source loading error.
   * This method attempts to extract a {@link GeoViewError} from the event target
   * when the source is a {@link GVVectorSource}. If a GeoViewError is found, its
   * localized message key and parameters are emitted. Otherwise, a default
   * error message is emitted using the provided fallback message key.
   * @param {Event} event -
   * The load error event emitted by the vector source. The event target is
   * expected to be the source that triggered the error.
   * @param {string} defaultErrorMessageKey -
   * The localization key to use when no {@link GeoViewError} is available
   * on the source.
   */
  #emitError(event: Event, defaultErrorMessageKey: string): void {
    // Get the error
    const layerSource = event.target;

    // If the source is GVVectorSource and the error inside is a GeoViewError
    let emitted: boolean = false;
    if (layerSource instanceof GVVectorSource) {
      const loaderError = layerSource.getLoaderError();
      if (loaderError instanceof GeoViewError) {
        // Emit about the error
        this.emitMessage(loaderError.messageKey, (loaderError.messageParams as string[]) || [], 'error', true);
        emitted = true;
      }
    }

    // If not emitted
    if (!emitted) {
      // Emit about the error
      this.emitMessage(defaultErrorMessageKey, [this.getLayerName()], 'error', true);
    }
  }

  // #endregion PRIVATE METHODS

  // #region EVENTS

  /**
   * Emits an event to all handlers.
   * @param {LegendQueryingEvent} event - The event to emit
   * @private
   */
  #emitLegendQuerying(): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLegendQueryingHandlers, undefined);
  }

  /**
   * Registers a legend querying event handler.
   * @param {LegendQueryingDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLegendQuerying(callback: LegendQueryingDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLegendQueryingHandlers, callback);
  }

  /**
   * Unregisters a legend querying event handler.
   * @param {LegendQueryingDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLegendQuerying(callback: LegendQueryingDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLegendQueryingHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {LegendQueriedEvent} event - The event to emit
   * @private
   */
  #emitLegendQueried(event: LegendQueriedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLegendQueriedHandlers, event);
  }

  /**
   * Registers a legend queried event handler.
   * @param {LegendQueriedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLegendQueried(callback: LegendQueriedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLegendQueriedHandlers, callback);
  }

  /**
   * Unregisters a legend queried event handler.
   * @param {LegendQueriedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLegendQueried(callback: LegendQueriedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLegendQueriedHandlers, callback);
  }

  /**
   * Emits filter applied event.
   * @param {FilterAppliedEvent} event - The event to emit
   * @private
   */
  protected emitLayerFilterApplied(event: LayerFilterAppliedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerFilterAppliedHandlers, event);
  }

  /**
   * Registers a filter applied event handler.
   * @param {FilterAppliedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerFilterApplied(callback: LayerFilterAppliedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerFilterAppliedHandlers, callback);
  }

  /**
   * Unregisters a filter applied event handler.
   * @param {FilterAppliedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerFilterApplied(callback: LayerFilterAppliedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerFilterAppliedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {StyleChangedEvent} event - The event to emit
   */
  #emitLayerStyleChanged(event: StyleChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerStyleChangedHandlers, event);
  }

  /**
   * Registers a layer style changed event handler.
   * @param {StyleChangedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerStyleChanged(callback: StyleChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerStyleChangedHandlers, callback);
  }

  /**
   * Unregisters a layer style changed event handler.
   * @param {StyleChangedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerStyleChanged(callback: StyleChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerStyleChangedHandlers, callback);
  }

  /**
   * Emits an event to all handlers when a layer have been first loaded on the map.
   * @private
   */
  #emitLayerFirstLoaded(): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerFirstLoadedHandlers, undefined);
  }

  /**
   * Registers when a layer have been first loaded on the map event handler.
   * @param {LayerDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerFirstLoaded(callback: LayerDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerFirstLoadedHandlers, callback);
  }

  /**
   * Unregisters when a layer have been first loaded on the map event handler.
   * @param {LayerDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerFirstLoaded(callback: LayerDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerFirstLoadedHandlers, callback);
  }

  /**
   * Emits an event to all handlers when a layer is turning into a loading stage on the map.
   * @private
   */
  #emitLayerLoading(): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerLoadingHandlers, undefined);
  }

  /**
   * Registers when a layer is turning into a loading stage event handler.
   * @param {LayerDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerLoading(callback: LayerDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerLoadingHandlers, callback);
  }

  /**
   * Unregisters when a layer is turning into a loading stage event handler.
   * @param {LayerDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerLoading(callback: LayerDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerLoadingHandlers, callback);
  }

  /**
   * Emits an event to all handlers when a layer is turning into a loaded stage on the map.
   * @private
   */
  #emitLayerLoaded(): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerLoadedHandlers, undefined);
  }

  /**
   * Registers when a layer is turning into a loaded stage event handler.
   * @param {LayerDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerLoaded(callback: LayerDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerLoadedHandlers, callback);
  }

  /**
   * Unregisters when a layer is turning into a loaded stage event handler.
   * @param {LayerDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerLoaded(callback: LayerDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerLoadedHandlers, callback);
  }

  /**
   * Emits an event to all handlers when a layer is turning into an error stage on the map.
   * @param {LayerErrorEvent} event - The event to emit
   * @private
   */
  #emitLayerError(event: LayerErrorEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerErrorHandlers, event);
  }

  /**
   * Registers when a layer is turning into a error stage event handler.
   * @param {LayerDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerError(callback: LayerErrorDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerErrorHandlers, callback);
  }

  /**
   * Unregisters when a layer is turning into a error stage event handler.
   * @param {LayerDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerError(callback: LayerErrorDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerErrorHandlers, callback);
  }

  /**
   * Emits an event to all handlers when the layer's sent a message.
   * @param {LayerMessageEvent} event - The event to emit
   * @private
   */
  #emitLayerMessage(event: LayerMessageEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerMessageHandlers, event);
  }

  /**
   * Registers a layer message event handler.
   * @param {LayerMessageEventDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerMessage(callback: LayerMessageDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerMessageHandlers, callback);
  }

  /**
   * Unregisters a layer message event handler.
   * @param {LayerMessageEventDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerMessage(callback: LayerMessageDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerMessageHandlers, callback);
  }

  /**
   * Emits queryable changed event.
   * @param {LayerQueryableChangedEvent} event - The event to emit
   * @private
   */
  #emitLayerQueryableChanged(event: LayerQueryableChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerQueryableChangedHandlers, event);
  }

  /**
   * Registers an queryable changed event handler.
   * @param {LayerQueryableChangedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerQueryableChanged(callback: LayerQueryableChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerQueryableChangedHandlers, callback);
  }

  /**
   * Unregisters an queryable changed event handler.
   * @param {LayerQueryableChangedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerQueryableChanged(callback: LayerQueryableChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerQueryableChangedHandlers, callback);
  }

  /**
   * Emits hoverable changed event.
   * @param {LayerHoverableChangedEvent} event - The event to emit
   * @private
   */
  #emitLayerHoverableChanged(event: LayerHoverableChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerHoverableChangedHandlers, event);
  }

  /**
   * Registers an hoverable changed event handler.
   * @param {LayerHoverableChangedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerHoverableChanged(callback: LayerHoverableChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerHoverableChangedHandlers, callback);
  }

  /**
   * Unregisters an hoverable changed event handler.
   * @param {LayerHoverableChangedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerHoverableChanged(callback: LayerHoverableChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerHoverableChangedHandlers, callback);
  }

  // #endregion EVENTS

  // #region STATIC

  /**
   * Initializes common properties on a layer options.
   * @param {Options} layerOptions - The layer options to initialize
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The config to read the initial settings from
   */
  protected static initOptionsWithInitialSettings(layerOptions: Options, layerConfig: AbstractBaseLayerEntryConfig): void {
    // GV Note: The visible flag (and maybe others?) must be set in the 'onLoaded' function below, because the layer needs to
    // GV attempt to be visible on the map in order to trigger its source loaded event.

    // Set the layer options as read from the initialSettings
    // GV We disable the warnings, because this function purpose is to actually initialize the given parameter

    // If a className is defined in the initial settings, set it in the layer options
    // eslint-disable-next-line no-param-reassign
    if (layerConfig.getInitialSettingsClassName() !== undefined) layerOptions.className = layerConfig.getInitialSettingsClassName();

    // If an extent is defined in the initial settings, set it in the layer options
    // eslint-disable-next-line no-param-reassign
    if (layerConfig.getInitialSettingsExtent() !== undefined) layerOptions.extent = layerConfig.getInitialSettingsExtent();

    // If an opacity is defined in the initial settings, set it in the layer options
    if (layerConfig.getInitialSettings()?.states?.opacity !== undefined)
      // eslint-disable-next-line no-param-reassign
      layerOptions.opacity = layerConfig.getInitialSettings()?.states!.opacity;
  }

  /**
   * Adds error handling to a layer's render function to prevent globalAlpha errors
   * that can occur during layer rendering, especially when highlighting layers while others are still loading.
   * This patches the OpenLayers renderer to safely handle cases where the canvas context is not yet available.
   *
   * @param {BaseLayer} layer - The OpenLayers layer to patch
   */
  static #addRenderErrorHandling(layer: BaseLayer): void {
    // Use type assertion to access internal getRenderer method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const layerWithRenderer = layer as BaseLayer & { getRenderer?: () => any };
    if (!layerWithRenderer || typeof layerWithRenderer.getRenderer !== 'function') return;

    const renderer = layerWithRenderer.getRenderer();
    if (!renderer || typeof renderer.renderDeferredInternal !== 'function') return;

    const originalRenderFunction = renderer.renderDeferredInternal;

    renderer.renderDeferredInternal = function renderDeferredInternalPatched(...args: unknown[]) {
      try {
        // If the renderer is not ready yet, skip rendering
        if (!this.context || !this.context.canvas) {
          // Skip rendering but don't throw an error
          return false;
        }

        // Context exists, proceed with original rendering
        return originalRenderFunction.apply(this, args);
      } catch (error) {
        logger.logError('Vector layer rendering error:', error);

        // Attempt recovery by requesting a new frame
        requestAnimationFrame(() => this.changed());
        return false; // Return false instead of undefined
      }
    };
  }

  /**
   * Creates a legend object based on a given GeoView layer type and style configuration.
   * This method builds a legend representation by combining the provided style settings
   * with the computed legend symbols retrieved from the renderer. It is asynchronous
   * because it waits for `GeoviewRenderer.getLegendStyles` to generate the legend items.
   * @param {TypeGeoviewLayerType} schemaTag - The GeoView layer type identifier (e.g., vector, raster, etc.).
   * @param {Partial<Record<TypeStyleGeometry, TypeLayerStyleSettings>>} [style] -
   *   Optional style configuration mapping geometry types to their style settings.
   * @returns {Promise<TypeLegend>} A promise that resolves to a legend object containing:
   * - `type`: the layer type.
   * - `styleConfig`: the provided style configuration.
   * - `legend`: the legend entries generated from the style.
   * @async
   * @static
   */
  static async createLegendFromStyle(
    schemaTag: TypeGeoviewLayerType,
    style: Partial<Record<TypeStyleGeometry, TypeLayerStyleSettings>> | undefined
  ): Promise<TypeLegend> {
    return {
      type: schemaTag,
      styleConfig: style,
      legend: await GeoviewRenderer.getLegendStyles(style),
    };
  }

  /**
   * Retrieves or generates an image source (data URI or path) representing the visual style of a feature.
   * Caches results in the `imageSourceDict` to avoid redundant processing.
   * @param {Feature} feature - The feature whose visual representation is to be retrieved.
   * @param {TypeLayerStyleConfig} layerStyle - Style configuration grouped by geometry type (e.g., Point, LineString, Polygon).
   * @param {OgcWmsLayerEntryConfig | EsriDynamicLayerEntryConfig | VectorLayerEntryConfig} layerConfig - The configuration for the layer containing the feature.
   * @param {TypeLayerMetadataFields[]?} domainsLookup - Optional domain information for interpreting coded values.
   * @param {Record<string, string>} aliasLookup - A mapping of original field names to their aliases.
   * @param {Record<string, string | undefined>} imageSourceDict - A dictionary used to cache and reuse image sources by style key.
   * @returns {string | undefined} The image source string representing the feature's style, or `undefined` if generation fails.
   */
  static getFeatureIconSource(
    feature: Feature,
    layerStyle: TypeLayerStyleConfig,
    domainsLookup: TypeLayerMetadataFields[] | undefined,
    aliasLookup: Record<string, string>,
    imageSourceDict: Record<string, string | undefined>
  ): string | undefined {
    const geometryType = feature.getGeometry()
      ? (feature.getGeometry()!.getType() as TypeStyleGeometry)
      : (Object.keys(layerStyle)[0] as TypeStyleGeometry);

    // No filter equation, because we want the icon even if technically the feature would be filtered out
    const filterEquation = undefined;

    if (!layerStyle[geometryType]) {
      return GeoviewRenderer.getFeatureIconSource(feature, layerStyle, filterEquation, domainsLookup, aliasLookup);
    }

    const styleSettings = layerStyle[geometryType];
    const { type } = styleSettings;

    const options: TypeStyleProcessorOptions = {
      filterEquation,
      domainsLookup,
      aliasLookup,
    };

    const featureStyle = GeoviewRenderer.processStyle[type][geometryType](styleSettings, feature, options);

    if (!featureStyle) {
      return GeoviewRenderer.getFeatureIconSource(feature, layerStyle, filterEquation, domainsLookup, aliasLookup);
    }

    // Clone the style
    const styleClone = featureStyle.clone();
    styleClone?.setGeometry?.('');
    const styleKey = `${geometryType}${JSON.stringify(styleClone)}`;

    if (!imageSourceDict[styleKey]) {
      // eslint-disable-next-line no-param-reassign
      imageSourceDict[styleKey] = GeoviewRenderer.getFeatureIconSource(feature, layerStyle, filterEquation, domainsLookup, aliasLookup);
    }

    return imageSourceDict[styleKey];
  }

  /**
   * Formats a set of OpenLayers features into a structured array of feature info entries.
   * Each feature is enriched with geometry, extent, field information, and optional styling.
   * @param {Feature[]} features - Array of OpenLayers features to process.
   * @param {string} layerPath - Path of the layer these features belong to.
   * @param {TypeGeoviewLayerType} schemaTag - The Geoview layer type for the features.
   * @param {string | undefined} nameField - Optional field name to use as the display name for features.
   * @param {TypeOutfields[] | undefined} outFields - Optional array of output fields to include in the feature info.
   * @param {boolean} supportZoomTo - Whether zoom-to functionality is supported for these features.
   * @param {TypeLayerMetadataFields[] | undefined} domainsLookup - Optional array of field metadata for domain lookups.
   * @param {Partial<Record<TypeStyleGeometry, TypeLayerStyleSettings>> | undefined} layerStyle - Optional mapping of geometry type to style settings for icons.
   * @param {FilterNodeType[] | undefined} filterEquation - Optional array of filters applied to the layer.
   * @param {(fieldName: string) => TypeOutfieldsType} callbackGetFieldType - Callback that returns the field type for a given field name.
   * @param {(fieldName: string) => codedValueType | rangeDomainType | null} callbackGetFieldDomain - Callback that returns the coded value or range domain for a given field name.
   * @param {(feature: Feature, fieldName: string, fieldType: TypeOutfieldsType) => string | number | Date} callbackGetFieldValue - Callback that returns the value of a field for a feature, in the correct type.
   * @returns {TypeFeatureInfoEntry[]} Array of feature info entries representing each feature with enriched metadata.
   * @description
   * Will not throw; errors are caught and logged. Returns an empty array if processing fails.
   */
  static helperFormatFeatureInfoResult(
    features: Feature[],
    layerPath: string,
    schemaTag: TypeGeoviewLayerType,
    nameField: string | undefined,
    outFields: TypeOutfields[] | undefined,
    supportZoomTo: boolean,
    domainsLookup: TypeLayerMetadataFields[] | undefined,
    layerStyle: Partial<Record<TypeStyleGeometry, TypeLayerStyleSettings>> | undefined,
    callbackGetFieldType: (fieldName: string) => TypeOutfieldsType,
    callbackGetFieldDomain: (fieldName: string) => codedValueType | rangeDomainType | null,
    callbackGetFieldValue: (feature: Feature, fieldName: string, fieldType: TypeOutfieldsType) => string | number | Date
  ): TypeFeatureInfoEntry[] {
    try {
      if (!features.length) return [];

      const aliasLookup = GVLayerUtilities.createAliasLookup(outFields);
      const dictFieldDomains: Record<string, codedValueType | rangeDomainType | null> = {};
      const dictFieldTypes: Record<string, TypeOutfieldsType> = {};

      let featureKeyCounter = 0;
      let fieldKeyCounter = 0;
      const queryResult: TypeFeatureInfoEntry[] = [];

      const imageSourceDict: Record<string, string | undefined> = {};

      // For each feature
      for (const feature of features) {
        // Get the image source for a feature using styling information and cache it
        const imageSource = layerStyle
          ? AbstractGVLayer.getFeatureIconSource(feature, layerStyle, domainsLookup, aliasLookup, imageSourceDict)
          : undefined;

        // Get the extent
        const extent = feature.getGeometry()?.getExtent();

        // Get the TypeFeatureInfoEntry object
        const featureInfoEntry: TypeFeatureInfoEntry = {
          uid: getUid(feature),
          featureKey: featureKeyCounter++,
          geoviewLayerType: schemaTag,
          feature,
          geometry: feature.getGeometry(),
          extent,
          featureIcon: imageSource,
          fieldInfo: {},
          nameField: nameField || null,
          supportZoomTo,
          layerPath,
        };

        // Process the feature fields
        fieldKeyCounter = this.#helperFeatureFields(
          feature,
          outFields,
          dictFieldDomains,
          dictFieldTypes,
          featureInfoEntry,
          fieldKeyCounter,
          callbackGetFieldType,
          callbackGetFieldDomain,
          callbackGetFieldValue
        );
        queryResult.push(featureInfoEntry);
      }

      return queryResult;
    } catch (error: unknown) {
      logger.logError(error);
      return [];
    }
  }

  /**
   * Processes the fields of a given feature and populates a feature info entry with relevant data.
   * It also updates field domain and type dictionaries if needed.
   * @param {Feature} feature - The OpenLayers feature object whose fields are being processed.
   * @param {TypeOutfields[] | undefined} outfields - Optional array of output field metadata. Each entry can specify name, alias, and type.
   * @param {Record<string, codedValueType | rangeDomainType | null>} dictFieldDomains - A mapping of field names to their domain metadata.
   *   This object is updated in-place for fields that do not already have a domain defined.
   * @param {Record<string, TypeOutfieldsType>} dictFieldTypes - A mapping of field names to their data types.
   *   This object is updated in-place for fields that do not already have a type defined.
   * @param {TypeFeatureInfoEntry} featureInfoEntry - The feature info entry object where processed field information is stored.
   *   Fields are stored in `featureInfoEntry.fieldInfo`, keyed by field name.
   * @param {number} fieldKeyCounterStart - Starting value for the field key counter. Each field processed increments the counter.
   * @param {(fieldName: string) => TypeOutfieldsType} callbackGetFieldType - Callback function that returns the type of a given field.
   * @param {(fieldName: string) => codedValueType | rangeDomainType | null} callbackGetFieldDomain - Callback function that returns the domain metadata for a given field.
   * @param {(feature: Feature, fieldName: string, fieldType: TypeOutfieldsType) => string | number | Date} callbackGetFieldValue - Callback function that returns the value of a given field for the feature, typed according to the field type.
   * @returns {number} The next field key counter value after processing, to be used for further fields or subsequent features.
   */
  static #helperFeatureFields(
    feature: Feature,
    outfields: TypeOutfields[] | undefined,
    dictFieldDomains: Record<string, codedValueType | rangeDomainType | null>,
    dictFieldTypes: Record<string, TypeOutfieldsType>,
    featureInfoEntry: TypeFeatureInfoEntry,
    fieldKeyCounterStart: number,
    callbackGetFieldType: (fieldName: string) => TypeOutfieldsType,
    callbackGetFieldDomain: (fieldName: string) => codedValueType | rangeDomainType | null,
    callbackGetFieldValue: (feature: Feature, fieldName: string, fieldType: TypeOutfieldsType) => string | number | Date
  ): number {
    const featureFields = feature.getKeys();
    let fieldKeyCounter = fieldKeyCounterStart;

    for (const fieldName of featureFields) {
      // eslint-disable-next-line no-continue
      if (fieldName === 'geometry') continue;

      const fieldValue = feature.get(fieldName);
      // eslint-disable-next-line no-continue
      if (fieldValue && typeof fieldValue === 'object' && !Array.isArray(fieldValue)) continue;

      if (!(fieldName in dictFieldDomains)) {
        // eslint-disable-next-line no-param-reassign
        dictFieldDomains[fieldName] = callbackGetFieldDomain(fieldName);
      }
      const fieldDomain = dictFieldDomains[fieldName];

      if (!(fieldName in dictFieldTypes)) {
        // eslint-disable-next-line no-param-reassign
        dictFieldTypes[fieldName] = callbackGetFieldType(fieldName);
      }
      const fieldType = dictFieldTypes[fieldName];

      const fieldEntry = outfields?.find((outfield) => outfield.name === fieldName || outfield.alias === fieldName);

      if (fieldEntry) {
        const value =
          callbackGetFieldValue(feature, fieldName, fieldEntry.type as 'string' | 'number' | 'date') ??
          callbackGetFieldValue(feature, fieldEntry.name, fieldEntry.type as 'string' | 'number' | 'date');

        // eslint-disable-next-line no-param-reassign
        featureInfoEntry.fieldInfo[fieldEntry.name] = {
          fieldKey: fieldKeyCounter++,
          value,
          dataType: fieldEntry.type,
          alias: fieldEntry.alias,
          domain: fieldDomain,
        };
      } else if (!outfields) {
        // eslint-disable-next-line no-param-reassign
        featureInfoEntry.fieldInfo[fieldName] = {
          fieldKey: fieldKeyCounter++,
          value: callbackGetFieldValue(feature, fieldName, fieldType),
          dataType: fieldType,
          alias: fieldName,
          domain: fieldDomain,
        };
      }
    }

    // Return the counter
    return fieldKeyCounter;
  }

  /**
   * Gets and formats the value of a field from a feature.
   * For vector GeoView layers, dates are converted from milliseconds since the base date.
   * Vector feature dates must be in ISO format if stored as strings.
   * @param {Feature} feature - The OpenLayers feature that holds the field values.
   * @param {string} fieldName - The name of the field to retrieve.
   * @param {TypeOutfieldsType} fieldType - The type of the field ('string', 'number', 'date', etc.).
   * @param {TypeDateFragments | undefined} serverDateFragmentsOrder - Optional order of date fragments as expected from the server.
   *   If undefined, the server format will be deduced from the field value.
   * @param {TypeDateFragments | undefined} externalFragmentsOrder - Optional order of date fragments for external display formatting.
   * @returns {string | number | Date} The formatted field value.
   *   Returns a string, number, or Date depending on the field type.
   */
  static helperGetFieldValue(
    feature: Feature,
    fieldName: string,
    fieldType: TypeOutfieldsType,
    serverDateFragmentsOrder: TypeDateFragments | undefined,
    externalFragmentsOrder: TypeDateFragments | undefined
  ): string | number | Date {
    const fieldValue = feature.get(fieldName);
    let returnValue: string | number | Date;
    if (fieldType === 'date') {
      if (typeof fieldValue === 'string') {
        // eslint-disable-next-line no-param-reassign
        if (!serverDateFragmentsOrder) serverDateFragmentsOrder = DateMgt.getDateFragmentsOrder(DateMgt.deduceDateFormat(fieldValue));
        returnValue = DateMgt.applyInputDateFormat(fieldValue, serverDateFragmentsOrder);
      } else {
        // All vector dates are kept internally in UTC.
        returnValue = DateMgt.convertToUTC(`${DateMgt.convertMilisecondsToDate(fieldValue)}Z`);
      }
      const reverseTimeZone = true;
      if (externalFragmentsOrder) returnValue = DateMgt.applyOutputDateFormat(returnValue, externalFragmentsOrder, reverseTimeZone);
      return returnValue;
    }
    return fieldValue;
  }

  // #endregion STATIC
}

// #region EVENT TYPES

/**
 * Define an event for the delegate
 */
export type StyleChangedEvent = {
  // The style
  style: TypeLayerStyleConfig;
};

/**
 * Define a delegate for the event handler function signature
 */
export type StyleChangedDelegate = EventDelegateBase<AbstractGVLayer, StyleChangedEvent, void>;

/**
 * Define an event for the delegate
 */
export type LegendQueryingEvent = unknown;

/**
 * Define a delegate for the event handler function signature
 */
export type LegendQueryingDelegate = EventDelegateBase<AbstractGVLayer, LegendQueryingEvent, void>;

/**
 * Define an event for the delegate
 */
export type LegendQueriedEvent = {
  legend: TypeLegend;
};

/**
 * Define a delegate for the event handler function signature
 */
export type LegendQueriedDelegate = EventDelegateBase<AbstractGVLayer, LegendQueriedEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerFilterAppliedEvent = {
  // The filter
  filter: LayerFilters;
};

/**
 * Define a delegate for the event handler function signature
 */
export type LayerFilterAppliedDelegate = EventDelegateBase<AbstractGVLayer, LayerFilterAppliedEvent, void>;

/**
 * Define a delegate for the event handler function signature
 */
export type LayerDelegate = EventDelegateBase<AbstractGVLayer, undefined, void>;

/**
 * Define an event for the delegate
 */
export type LayerErrorEvent = {
  // The error
  error: unknown;
};

/**
 * Define a delegate for the event handler function signature
 */
export type LayerErrorDelegate = EventDelegateBase<AbstractGVLayer, LayerErrorEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerMessageEvent = {
  // The loaded layer
  messageKey: string;
  messageParams: string[];
  messageType: SnackbarType;
  notification: boolean;
};

/**
 * Define a delegate for the event handler function signature
 */
export type LayerMessageDelegate = EventDelegateBase<AbstractGVLayer, LayerMessageEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerQueryableChangedEvent = {
  // The flag
  queryable: boolean;
};

/**
 * Define a delegate for the event handler function signature
 */
export type LayerQueryableChangedDelegate = EventDelegateBase<AbstractBaseGVLayer, LayerQueryableChangedEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerHoverableChangedEvent = {
  // The flag
  hoverable: boolean;
};

/**
 * Define a delegate for the event handler function signature
 */
export type LayerHoverableChangedDelegate = EventDelegateBase<AbstractBaseGVLayer, LayerHoverableChangedEvent, void>;

// #endregion EVENT TYPES
