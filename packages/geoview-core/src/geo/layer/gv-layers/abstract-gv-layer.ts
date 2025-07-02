import BaseLayer, { Options } from 'ol/layer/Base';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { Extent } from 'ol/extent';
import Feature from 'ol/Feature';
import { Layer } from 'ol/layer';
import Source from 'ol/source/Source';
import { Projection as OLProjection } from 'ol/proj';
import { Map as OLMap } from 'ol';

import { Style } from 'ol/style';
import cloneDeep from 'lodash/cloneDeep';
import { TimeDimension, DateMgt, TypeDateFragments } from '@/core/utils/date-mgt';
import { logger } from '@/core/utils/logger';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { OgcWmsLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import {
  TypeLayerStyleConfig,
  TypeFeatureInfoEntry,
  codedValueType,
  rangeDomainType,
  TypeLocation,
  QueryType,
  TypeStyleGeometry,
  TypeOutfieldsType,
} from '@/api/config/types/map-schema-types';
import { getLegendStyles, getFeatureImageSource, processStyle } from '@/geo/utils/renderer/geoview-renderer';
import { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { AbstractBaseLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { SnackbarType } from '@/core/utils/notifications';
import { NotImplementedError, NotSupportedError } from '@/core/exceptions/core-exceptions';
import { LayerNotQueryableError } from '@/core/exceptions/layer-exceptions';
import { createAliasLookup } from '@/geo/layer/gv-layers/utils';
import { doUntil } from '@/core/utils/utilities';
import { TypeJsonArray } from '@/api/config/types/config-types';

/**
 * Abstract Geoview Layer managing an OpenLayer layer.
 */
export abstract class AbstractGVLayer extends AbstractBaseLayer {
  /** The default hit tolerance the query should be using */
  static readonly DEFAULT_HIT_TOLERANCE: number = 4;

  /** The default loading period before we show a message to the user about a layer taking a long time to render on map */
  static readonly DEFAULT_LOADING_PERIOD: number = 8 * 1000; // 8 seconds

  /** Indicates if the layer has become in loaded status at least once already */
  loadedOnce: boolean = false;

  /** Counts the number of times the loading happened. */
  loadingCounter: number = 0;

  /** Marks the latest loading count for the layer.
   * This useful to know when the put the layer loaded status back correctly with parallel processing happening */
  loadingMarker: number = 0;

  /** The OpenLayer source */
  #olSource: Source;

  /** Style to apply to the vector layer. */
  #layerStyle?: TypeLayerStyleConfig;

  /** Date format object used to translate server to ISO format and ISO to server format */
  #serverDateFragmentsOrder?: TypeDateFragments;

  /** Date format object used to translate internal UTC ISO format to the external format, the one used by the user */
  #externalFragmentsOrder?: TypeDateFragments;

  /** Boolean indicating if the layer should be included in time awareness functions such as the Time Slider. True by default. */
  #isTimeAware: boolean = true;

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

  /**
   * Constructs a GeoView layer to manage an OpenLayer layer.
   * @param {Source} olSource - The OpenLayer Source.
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer configuration.
   */
  protected constructor(olSource: Source, layerConfig: AbstractBaseLayerEntryConfig) {
    super(layerConfig);
    this.#olSource = olSource;

    // Keep the date formatting information
    this.#serverDateFragmentsOrder = layerConfig.geoviewLayerConfig.serviceDateFormat
      ? DateMgt.getDateFragmentsOrder(layerConfig.geoviewLayerConfig.serviceDateFormat)
      : undefined;
    this.#externalFragmentsOrder = layerConfig.getExternalFragmentsOrder();

    // Boolean indicating if the layer should be included in time awareness functions such as the Time Slider. True by default.
    this.#isTimeAware = layerConfig.geoviewLayerConfig.isTimeAware === undefined ? true : layerConfig.geoviewLayerConfig.isTimeAware;

    // If there is a layer style in the config, set it in the layer
    if (layerConfig.layerStyle) this.setStyle(layerConfig.layerStyle);
  }

  /**
   * Must override method to return the bounds of a layer in the given projection.
   * @param {OLProjection} projection - The projection to get the bounds into.
   * @param {number} stops - The number of stops to use to generate the extent.
   * @returns {Extent} The layer bounding box.
   */
  abstract onGetBounds(projection: OLProjection, stops: number): Extent | undefined;

  /**
   * Overrides the get of the OpenLayers Layer
   * @returns {Layer} The OpenLayers Layer
   */
  override getOLLayer(): Layer {
    // Call parent and cast
    return super.getOLLayer() as Layer;
  }

  /**
   * Gets the layer configuration associated with the layer.
   * @returns {AbstractBaseLayerEntryConfig} The layer configuration
   */
  override getLayerConfig(): AbstractBaseLayerEntryConfig {
    return super.getLayerConfig() as AbstractBaseLayerEntryConfig;
  }

  /**
   * Overrides the way the attributions are retrieved.
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
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override onRefresh(projection: OLProjection | undefined): void {
    // Refresh the layer source
    this.getOLSource().refresh();
  }

  /**
   * Overridable function that gets the extent of an array of features.
   * @param {string[]} objectIds - The IDs of the features to calculate the extent from.
   * @param {OLProjection} outProjection - The output projection for the extent.
   * @param {string} outfield - ID field to return for services that require a value in outfields.
   * @returns {Promise<Extent>} The extent of the features, if available
   */
  protected onGetExtentFromFeatures(objectIds: string[], outProjection: OLProjection, outfield?: string): Promise<Extent> {
    // Not implemented
    throw new NotImplementedError(`Feature geometry for ${objectIds}-${outfield} is unavailable from ${this.getLayerPath()}`);
  }

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

    // Apply render error handling to prevent "Cannot read properties of null (reading 'globalAlpha')" errors
    AbstractGVLayer.#addRenderErrorHandling(this.getOLLayer());
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
   * Overridable method called when the layer has started to load itself on the map.
   * @param {unknown} event - The event which is being triggered.
   */
  protected onLoading(event: unknown): void {
    // Increment the counter
    this.loadingCounter++;

    // Mark the current event with the loading counter, this is a trick using the wrapper to re-obtain it in the 'onLoaded' function below.
    // eslint-disable-next-line no-underscore-dangle
    this.#findWrapperBetweenEventHandlers(event)._loadingCounter = this.loadingCounter;

    // Log it, leaving the logDebug for dev purposes
    // eslint-disable-next-line no-underscore-dangle
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
   * @param {unknown} event - The event which is being triggered.
   */
  protected onLoaded(event: unknown): void {
    // Log it, leaving the logDebug for dev purposes
    // eslint-disable-next-line no-underscore-dangle
    // logger.logDebug('AFTER', this.#findWrapperBetweenEventHandlers(event)._loadingCounter);

    // If it's not the 'loaded' that correspond to the last 'loading' (asynchronicity thing)
    // eslint-disable-next-line no-underscore-dangle
    if (this.loadingCounter !== this.#findWrapperBetweenEventHandlers(event)._loadingCounter) return;

    // Log it, leaving the logDebug for dev purposes
    // eslint-disable-next-line no-underscore-dangle
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
      this.setVisible(layerConfig.initialSettings?.states?.visible !== false);

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
   * @param {unknown} event - The event which is being triggered.
   */
  protected onError(event: unknown): void {
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
      this.emitMessage('layers.errorNotLoaded', [this.getLayerName()], 'error', true);
    } else {
      // We've already emitted an error to the user about the layer being in error, skip so that we don't spam
    }

    // Emit event for all layer error events
    this.#emitLayerError({ error: event });
  }

  /**
   * Overridable method called when the layer image is in error and couldn't be loaded correctly.
   * We do not put the layer status as error, as this could be specific to a zoom level and the layer is otherwise fine.
   * @param {unknown} event - The event which is being triggered.
   */
  protected onImageLoadError(event: unknown): void {
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
      this.emitMessage('layers.errorImageLoad', [this.getLayerName()], 'error', true);
    } else {
      // We've already emitted an error to the user about the layer being in error, skip
    }

    // Emit event for all layer error events
    this.#emitLayerError({ error: event });
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
   * Gets the layer style
   * @returns The layer style
   */
  getStyle(): TypeLayerStyleConfig | undefined {
    return this.#layerStyle;
  }

  /**
   * Sets the layer style
   * @param {TypeStyleConfig | undefined} style - The layer style
   */
  setStyle(style: TypeLayerStyleConfig): void {
    this.#layerStyle = style;
    this.#emitLayerStyleChanged({ style });
  }

  /**
   * Gets the bounds for the layer in the given projection.
   * @param {OLProjection} projection - The projection to get the bounds into.
   * @param {number} stops - The number of stops to use to generate the extent.
   * @returns {Extent | undefined} The layer bounding box.
   */
  getBounds(projection: OLProjection, stops: number): Extent | undefined {
    // Redirect to overridable method
    return this.onGetBounds(projection, stops);
  }

  /**
   * Gets the temporal dimension that is associated to the layer.
   * @returns {TimeDimension | undefined} The temporal dimension associated to the layer or undefined.
   */
  getTemporalDimension(): TimeDimension | undefined {
    return this.getLayerConfig().getTemporalDimension();
  }

  /**
   * Gets the flag if layer use its time dimension, this can be use to exclude layers from time function like time slider
   * @returns {boolean} The flag indicating if the layer should be included in time awareness functions such as the Time Slider. True by default.
   */
  getIsTimeAware(): boolean {
    return this.#isTimeAware;
  }

  /**
   * Gets the external fragments order.
   * @returns {TypeDateFragments | undefined} The external fragmets order associated to the layer or undefined.
   */
  getExternalFragmentsOrder(): TypeDateFragments | undefined {
    return this.#externalFragmentsOrder;
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
   * Gets the extent of an array of features.
   * @param {string[]} objectIds - The IDs of the features to calculate the extent from.
   * @param {OLProjection} outProjection - The output projection for the extent.
   * @param {string} outfield - ID field to return for services that require a value in outfields.
   * @returns {Promise<Extent>} The extent of the features, if available
   */
  getExtentFromFeatures(objectIds: string[], outProjection: OLProjection, outfield?: string): Promise<Extent> {
    // Redirect
    return this.onGetExtentFromFeatures(objectIds, outProjection, outfield);
  }

  /**
   * Returns feature information for the layer specified.
   * @param {OLMap} map - The Map to get feature info from.
   * @param {QueryType} queryType - The type of query to perform.
   * @param {TypeLocation} location - An pixel, coordinate or polygon that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} The feature info table.
   */
  async getFeatureInfo(
    map: OLMap,
    queryType: QueryType,
    location: TypeLocation,
    queryGeometry: boolean = true,
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Get the layer config
    const layerConfig = this.getLayerConfig();

    // If the layer is not queryable
    if (layerConfig.source?.featureInfo?.queryable === false) {
      // Throw error
      throw new LayerNotQueryableError(layerConfig.layerPath, layerConfig.getLayerName());
    }

    // Log
    logger.logTraceCore('ABSTRACT-GV-LAYERS - getFeatureInfo', queryType);
    const logMarkerKey = `${queryType}`;
    logger.logMarkerStart(logMarkerKey);

    let promiseGetFeature: Promise<TypeFeatureInfoEntry[]>;
    switch (queryType) {
      case 'all':
        promiseGetFeature = this.getAllFeatureInfo(abortController);
        break;
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
   * Overridable function to get all feature information for all the features stored in the layer.
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected getAllFeatureInfo(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Crash on purpose
    throw new NotImplementedError(`getAllFeatureInfo not implemented on layer path ${this.getLayerPath()}`);
  }

  /**
   * Overridable function to return of feature information at a given pixel location.
   * @param {OLMap} map - The Map where to get Feature Info At Pixel from.
   * @param {Pixel} location - The pixel coordinate that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} abortController - The optional abort controller.
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
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
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
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
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
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
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
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/class-methods-use-this
  protected getFieldDomain(fieldName: string): null | codedValueType | rangeDomainType {
    // Log - REMOVED as it is trigger for every row of data table, just enable for debuggin purpose
    // logger.logWarning(`getFieldDomain is not implemented for ${fieldName} on layer path ${this.getLayerPath()}`);
    return null;
  }

  /**
   * Overridable function to return the type of the specified field from the metadata. If the type can not be found, return 'string'.
   * @param {string} fieldName - The field name for which we want to get the type.
   *
   * @returns {TypeOutfieldsType} The type of the field.
   */
  protected getFieldType(fieldName: string): TypeOutfieldsType {
    // Log
    logger.logWarning(`getFieldType is not implemented for ${fieldName} on layer path ${this.getLayerPath()}`);
    return 'string';
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
   * Overridable function returning the legend of the layer. Returns null when the layerPath specified is not found. If the style property
   * of the layerConfig object is undefined, the legend property of the object returned will be null.
   * @returns {Promise<TypeLegend | null>} The legend of the layer.
   */
  async onFetchLegend(): Promise<TypeLegend | null> {
    try {
      const legend: TypeLegend = {
        type: this.getLayerConfig().geoviewLayerConfig.geoviewLayerType,
        styleConfig: this.getStyle(),
        legend: await getLegendStyles(this.getStyle()),
      };
      return legend;
    } catch (error: unknown) {
      // Log
      logger.logError(error);
      return null;
    }
  }

  /**
   * Overridable function set the style according to the fetched legend information
   *
   * @param {TypeLegend} legend - The fetched legend information
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this, @typescript-eslint/no-unused-vars
  onSetStyleAccordingToLegend(legend: TypeLegend): void {
    // By default, nothing to do here, check for overrides in children classes
  }

  /**
   * Gets and formats the value of the field with the name passed in parameter. Vector GeoView layers convert dates to milliseconds
   * since the base date. Vector feature dates must be in ISO format.
   * @param {Feature} features - The features that hold the field values.
   * @param {string} fieldName - The field name.
   * @param {TypeOutfieldsType} fieldType - The field type.
   * @returns {string | number | Date} The formatted value of the field.
   */
  protected getFieldValue(feature: Feature, fieldName: string, fieldType: TypeOutfieldsType): string | number | Date {
    const fieldValue = feature.get(fieldName);
    let returnValue: string | number | Date;
    if (fieldType === 'date') {
      if (typeof fieldValue === 'string') {
        if (!this.#serverDateFragmentsOrder)
          this.#serverDateFragmentsOrder = DateMgt.getDateFragmentsOrder(DateMgt.deduceDateFormat(fieldValue));
        returnValue = DateMgt.applyInputDateFormat(fieldValue, this.#serverDateFragmentsOrder);
      } else {
        // All vector dates are kept internally in UTC.
        returnValue = DateMgt.convertToUTC(`${DateMgt.convertMilisecondsToDate(fieldValue)}Z`);
      }
      const reverseTimeZone = true;
      if (this.#externalFragmentsOrder)
        returnValue = DateMgt.applyOutputDateFormat(returnValue, this.#externalFragmentsOrder, reverseTimeZone);
      return returnValue;
    }
    return fieldValue;
  }

  /**
   * Converts the feature information to an array of TypeFeatureInfoEntry[] | undefined | null.
   * @param {Feature[]} features - The array of features to convert.
   * @param {OgcWmsLayerEntryConfig | EsriDynamicLayerEntryConfig | VectorLayerEntryConfig} layerConfig - The layer configuration.
   * @returns {TypeFeatureInfoEntry[]} The Array of feature information.
   */
  protected formatFeatureInfoResult(
    features: Feature[],
    layerConfig: OgcWmsLayerEntryConfig | EsriDynamicLayerEntryConfig | VectorLayerEntryConfig
  ): TypeFeatureInfoEntry[] {
    try {
      if (!features.length) return [];

      const outfields = layerConfig?.source?.featureInfo?.outfields;
      const domainsLookup = layerConfig.getLayerMetadata()?.fields as TypeJsonArray | undefined;

      // Hold a dictionary built on the fly for the field domains
      const dictFieldDomains: { [fieldName: string]: codedValueType | rangeDomainType | null } = {};
      // Hold a dictionary build on the fly for the field types
      const dictFieldTypes: { [fieldName: string]: TypeOutfieldsType } = {};
      // Create lookup dictionary of names to alias
      const aliasLookup = createAliasLookup(outfields);

      // Loop on the promised feature infos
      let featureKeyCounter = 0;
      let fieldKeyCounter = 0;
      const queryResult: TypeFeatureInfoEntry[] = [];

      // Dict to store created image sources to avoid recreating
      const imageSourceDict: { [styleAsJsonString: string]: string | undefined } = {};
      const layerStyle = this.getStyle()!;

      features.forEach((feature) => {
        // Check dict for existing image source and create it if it does not exist
        const geometryType = feature.getGeometry()
          ? (feature.getGeometry()!.getType() as TypeStyleGeometry)
          : (Object.keys(layerStyle)[0] as TypeStyleGeometry);

        let imageSource;
        if (layerStyle[geometryType]) {
          const styleSettings = layerStyle[geometryType];
          const { type } = styleSettings;

          // Calculate the feature style
          const featureStyle = processStyle[type][geometryType](
            styleSettings,
            feature,
            layerConfig.filterEquation,
            true,
            domainsLookup,
            aliasLookup
          );

          // Sometimes data is not well fomrated and some features has no style associated, just throw a warning
          if (featureStyle === undefined) {
            logger.logWarning(`Feature style is undefined for ${this.getLayerPath()}`);
          }

          // Create a string unique to the style, but geometry agnostic
          const styleClone = cloneDeep(featureStyle) as Style;
          styleClone?.setGeometry?.('');
          const styleString = `${geometryType}${JSON.stringify(styleClone)}`;

          // Use string as dict key
          if (!imageSourceDict[styleString])
            imageSourceDict[styleString] = getFeatureImageSource(
              feature,
              layerStyle,
              layerConfig.filterEquation,
              true,
              domainsLookup,
              aliasLookup
            );
          imageSource = imageSourceDict[styleString];
        }

        if (!imageSource)
          imageSource = getFeatureImageSource(feature, layerStyle, layerConfig.filterEquation, true, domainsLookup, aliasLookup);

        let extent;
        if (feature.getGeometry()) extent = feature.getGeometry()!.getExtent();

        const featureInfoEntry: TypeFeatureInfoEntry = {
          // feature key for building the data-grid
          featureKey: featureKeyCounter++,
          geoviewLayerType: this.getLayerConfig().geoviewLayerConfig.geoviewLayerType,
          extent,
          geometry: feature,
          featureIcon: imageSource,
          fieldInfo: {},
          nameField: layerConfig?.source?.featureInfo?.nameField || null,
          layerPath: layerConfig.layerPath,
        };

        const featureFields = feature.getKeys();
        featureFields.forEach((fieldName) => {
          if (fieldName !== 'geometry') {
            const fieldValue = feature.get(fieldName);
            // Skip complex fields
            if (fieldValue && typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
              return;
            }

            // Calculate the field domain if not already calculated
            if (!(fieldName in dictFieldDomains)) {
              // Calculate it
              dictFieldDomains[fieldName] = this.getFieldDomain(fieldName);
            }
            const fieldDomain = dictFieldDomains[fieldName];

            // Calculate the field type if not already calculated
            if (!(fieldName in dictFieldTypes)) {
              dictFieldTypes[fieldName] = this.getFieldType(fieldName);
            }
            const fieldType = dictFieldTypes[fieldName];
            const fieldEntry = outfields?.find((outfield) => outfield.name === fieldName || outfield.alias === fieldName);
            if (fieldEntry) {
              featureInfoEntry.fieldInfo[fieldEntry.name] = {
                fieldKey: fieldKeyCounter++,
                value:
                  // If fieldName is the alias for the entry, we will not get a value, so we try the fieldEntry name.
                  this.getFieldValue(feature, fieldName, fieldEntry.type as 'string' | 'number' | 'date') ||
                  this.getFieldValue(feature, fieldEntry.name, fieldEntry.type as 'string' | 'number' | 'date'),
                dataType: fieldEntry.type,
                alias: fieldEntry.alias,
                domain: fieldDomain,
              };
            } else if (!outfields) {
              featureInfoEntry.fieldInfo[fieldName] = {
                fieldKey: fieldKeyCounter++,
                value: this.getFieldValue(feature, fieldName, fieldType),
                dataType: fieldType,
                alias: fieldName,
                domain: fieldDomain,
              };
            }
          }
        });

        queryResult.push(featureInfoEntry);
      });

      return queryResult;
    } catch (error: unknown) {
      // Log
      logger.logError(error);
      return [];
    }
  }

  /**
   * Gets the layerFilter that is associated to the layer.
   * @returns {string | undefined} The filter associated to the layer or undefined.
   */
  getLayerFilter(): string | undefined {
    // Redirect
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.getLayerConfig() as any)?.layerFilter;
  }

  /**
   * Emits a layer-specific message event with localization support
   * @protected
   * @param {string} messageKey - The key used to lookup the localized message OR message
   * @param {string[]} messageParams - Array of parameters to be interpolated into the localized message
   * @param {SnackbarType} messageType - The message type
   * @param {boolean} [notification=false] - Whether to show this as a notification. Defaults to false
   * @returns {void}
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
    // eslint-disable-next-line no-param-reassign
    if (layerConfig.initialSettings?.className !== undefined) layerOptions.className = layerConfig.initialSettings.className;
    // eslint-disable-next-line no-param-reassign
    if (layerConfig.initialSettings?.extent !== undefined) layerOptions.extent = layerConfig.initialSettings.extent;
    // eslint-disable-next-line no-param-reassign
    if (layerConfig.initialSettings?.states?.opacity !== undefined) layerOptions.opacity = layerConfig.initialSettings.states.opacity;
  }

  /**
   * Extracts the relevant image, tile, or dispatching_ object from the event based on its structure.
   * This method attempts to find the corresponding object (`image`, `tile`, or `dispatching_`) in the event.
   * @param event - The event object, which could contain either an `image`, `tile`, or `dispatching_` property.
   * @returns {unknown} - The extracted object (either image, tile, or dispatching_).
   * @throws {NotImplementedError} - If the event doesn't match the expected structures.
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-underscore-dangle
      return eventAny.target.dispatching_;
    }

    // Throw error
    throw new NotImplementedError(`Not implemented event wrapper for layer ${this.getLayerPath()}`);
  }

  /**
   * Starts a periodic timer that monitors the loading status of a layer.
   * Every `DEFAULT_LOADING_PERIOD` milliseconds, it checks whether the layer is still loading. If so, it emits a warning message indicating
   * that the rendering is taking longer than expected. The interval stops automatically when the layer finishes loading
   * or encounters an error, or if a new loading process supersedes the current one (based on the loading counter).
   * @param {number} loadingCounter - A unique counter representing the loading instance. Only the interval tied to the current
   *                                  loading process will continue monitoring; outdated intervals will self-terminate.
   */
  #startLoadingPeriodWatcher(loadingCounter: number): void {
    // Do the following thing until we stop it
    doUntil(() => {
      // This is the right interval that we want to be checking the layer status
      const { layerStatus } = this.getLayerConfig();

      // Check if the loadingCounter is different than our current counter (we're on the wrong timer for the loading checker)
      if (this.loadingCounter !== loadingCounter) return true;

      // If loaded or error, we're done
      if (!layerStatus || layerStatus === 'loaded' || layerStatus === 'error') return true;

      // If still loading
      if (layerStatus === 'loading') {
        // Emit about the delay
        this.emitMessage('warning.layer.slowRender', [this.getLayerName()]);
      }

      // Continue loop
      return false;
    }, AbstractGVLayer.DEFAULT_LOADING_PERIOD);
  }

  // #region EVENTS

  /**
   * Emits an event to all handlers.
   * @param {LegendQueryingEvent} event The event to emit
   * @private
   */
  #emitLegendQuerying(): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLegendQueryingHandlers, undefined);
  }

  /**
   * Registers a legend querying event handler.
   * @param {LegendQueryingDelegate} callback The callback to be executed whenever the event is emitted
   */
  onLegendQuerying(callback: LegendQueryingDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLegendQueryingHandlers, callback);
  }

  /**
   * Unregisters a legend querying event handler.
   * @param {LegendQueryingDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offLegendQuerying(callback: LegendQueryingDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLegendQueryingHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {LegendQueriedEvent} event The event to emit
   * @private
   */
  #emitLegendQueried(event: LegendQueriedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLegendQueriedHandlers, event);
  }

  /**
   * Registers a legend queried event handler.
   * @param {LegendQueriedDelegate} callback The callback to be executed whenever the event is emitted
   */
  onLegendQueried(callback: LegendQueriedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLegendQueriedHandlers, callback);
  }

  /**
   * Unregisters a legend queried event handler.
   * @param {LegendQueriedDelegate} callback The callback to stop being called whenever the event is emitted
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

  // #endregion EVENTS
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
  filter: string;
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

// #endregion EVENT TYPES
