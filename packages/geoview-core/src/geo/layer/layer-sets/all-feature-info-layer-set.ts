import type { QueryType, TypeFeatureInfoResult } from '@/api/types/map-schema-types';
import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { AbstractLayerSet } from '@/geo/layer/layer-sets/abstract-layer-set';
import {
  deleteStoreDataTableFeatureAllInfo,
  setStoreDataTableQueryStatusAndFeatures,
  setStoreDataTableInitialSettings,
  getStoreDataTableQueryStatus,
} from '@/core/stores/states/data-table-state';
import { RequestAbortedError } from '@/core/exceptions/core-exceptions';
import { logger } from '@/core/utils/logger';

/**
 * A Layer-set working with the LayerSetController at handling a result set of registered layers and synchronizing
 * events happening on them (in this case when the user queries for all records within a layer) with a store
 * for UI updates.
 */
export class AllFeatureInfoLayerSet extends AbstractLayerSet {
  /** The query type */
  static QUERY_TYPE: QueryType = 'all';

  /** The abort controllers per layer path */
  #abortControllers: { [layerPath: string]: AbortController } = {};

  /** Callback delegates for the layer queried event */
  #onLayerQueriedHandlers: LayerQueriedDelegate[] = [];

  // #region OVERRIDES

  /**
   * Overrides the behavior to apply when a feature-info-layer-set wants to check for condition to register a layer in its set.
   *
   * @param layer - The layer
   * @returns True when the layer should be registered to this all-feature-info-layer-set
   */
  protected override onRegisterLayerCheck(layer: AbstractBaseGVLayer): boolean {
    // Want to exclude ESRI Image layers. They have "features", but probably not useful
    if (layer instanceof GVEsriImage) return false;

    // Return if the layer is of queryable type and source is queryable
    let isQueryable =
      super.onRegisterLayerCheck(layer) && AbstractLayerSet.isQueryableType(layer) && AbstractLayerSet.isSourceQueryable(layer);

    // In the case of a GVWMS, also check if we has a way to retrieve vector data
    if (isQueryable && layer instanceof GVWMS) {
      // If we have a WFS layer config associated with the WMS
      isQueryable = !!layer.getLayerConfig().getWfsLayerConfig();
    }

    if (isQueryable) {
      this.controllerRegistry.uiController.showTabButton('data-table');
    }

    // Return
    return isQueryable;
  }

  /**
   * Overrides the behavior to apply when an all-feature-info-layer-set wants to register a layer in its set.
   *
   * @param layer - The layer
   */
  protected override onRegisterLayer(layer: AbstractBaseGVLayer): void {
    // Call parent
    super.onRegisterLayer(layer);

    // Update the resultSet data
    const layerPath = layer.getLayerPath();

    // Propagate
    setStoreDataTableQueryStatusAndFeatures(this.getMapId(), layerPath, 'init', undefined);

    // Extra initialization of settings
    setStoreDataTableInitialSettings(this.getMapId(), layerPath);
  }

  /**
   * Overrides the behavior to apply when deleting from the store.
   *
   * @param layerPath - The layer path to delete from the store
   */
  protected override onDeleteFromStore(layerPath: string): void {
    // Remove it from data table info array
    deleteStoreDataTableFeatureAllInfo(this.getMapId(), layerPath, () => {
      this.controllerRegistry.uiController.hideTabButton('data-table');
    });
  }

  // #endregion OVERRIDES

  // #region PUBLIC METHODS

  /**
   * Helper function used to launch the query on a layer to get all of its feature information.
   *
   * @param layerPath - The layerPath that will be queried
   * @param queryType - The query type, default: AllFeatureInfoLayerSet.QUERY_TYPE
   * @returns A promise that resolves with the result of the query
   * @throws {NotSupportedError} When `queryType` is not one of the supported query types
   */
  // TODO: (future development) The queryType is a door opened to allow the triggering using a bounding box or a polygon.
  async queryLayer(layerPath: string, queryType: QueryType = AllFeatureInfoLayerSet.QUERY_TYPE): Promise<TypeFeatureInfoResult> {
    // Get the layer layer associated with the layer path
    const layer = this.layerDomain.getGeoviewLayerRegular(layerPath);

    // Propagate
    setStoreDataTableQueryStatusAndFeatures(this.getMapId(), layerPath, 'processing', undefined);

    // Abort any in-flight query for this layer path
    this.#abortControllers[layerPath]?.abort();

    // Create a fresh AbortController for this query
    this.#abortControllers[layerPath] = new AbortController();
    const { signal } = this.#abortControllers[layerPath];

    try {
      // Process query on results data
      const promiseResult = await this.queryLayerFeatures(
        layer,
        queryType,
        layerPath,
        false,
        this.mapViewer.getDisplayLanguage(),
        this.#abortControllers[layerPath]
      );

      // Get the array of records in the results
      const arrayOfRecords = promiseResult.results;

      // Align arrayOfRecords fields with layerConfig fields so callers receive the aligned data
      if (arrayOfRecords.length) {
        AbstractLayerSet.alignRecordsWithOutFields(layer.getLayerConfig(), arrayOfRecords);
      }

      // Only propagate to the store if this query has not been superseded by a newer one
      if (!signal.aborted && this.getRegisteredLayerPaths().includes(layerPath)) {
        // Update the store
        setStoreDataTableQueryStatusAndFeatures(this.getMapId(), layerPath, 'processed', arrayOfRecords);
      }

      // Emit the layer queried event
      this.#emitLayerQueried({ layerPath, result: promiseResult });

      // Return the result with aligned records
      return promiseResult;
    } catch (error: unknown) {
      // If aborted
      if (error instanceof RequestAbortedError || signal.aborted) {
        // Log
        logger.logDebug('Query aborted and replaced by another one.. keep spinning..');
      } else if (this.getRegisteredLayerPaths().includes(layerPath)) {
        // Log
        logger.logPromiseFailed('queryLayerFeatures in queryLayers in AllFeatureInfoLayerSet', error);

        // Propagate
        setStoreDataTableQueryStatusAndFeatures(this.getMapId(), layerPath, 'error', undefined);
      }

      // Re-throw so the caller can handle the error
      throw error;
    }
  }

  /**
   * Clears all stored features for a specific layer in the Feature Info result set.
   *
   * If the given `layerPath` exists in the internal `resultSet`, this method:
   * - Sets its `features` property to `null`, effectively removing all features.
   * - Propagates the updated layer result to the external store.
   * If the layer path does not exist in the result set, the method does nothing.
   *
   * @param layerPath - The unique path identifying the layer to clear
   */
  clearLayerFeatures(layerPath: string): void {
    // Propagate
    setStoreDataTableQueryStatusAndFeatures(this.getMapId(), layerPath, 'init', undefined);
  }

  /**
   * Waits for the query associated with a specific layer path to finish processing.
   *
   * This method returns a promise that resolves when the query status for the given `layerPath` in the store is 'processed'.
   *
   * @param layerPath - The unique path identifying the layer to check
   * @returns A promise that resolves when the query status is 'processed'
   */
  waitForLayerQueryToFinish(layerPath: string): Promise<void> {
    // First, check synchronously — the query may have ALREADY finished
    if (getStoreDataTableQueryStatus(this.getMapId(), layerPath) === 'processed') return Promise.resolve();

    // Otherwise, wait for the specific layer path to be queried
    return this.onceLayerQueried((event) => event.layerPath === layerPath).then(() => {});
  }

  // #endregion PUBLIC METHODS

  // #region EVENTS

  /**
   * Emits a layer queried event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitLayerQueried(event: LayerQueriedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerQueriedHandlers, event);
  }

  /**
   * Returns a promise that resolves the next time the layer queried event fires.
   *
   * @param filter - Optional filter predicate. When provided, only events passing the filter resolve the promise
   * @returns A promise that resolves with the event payload when layer queried fires (and passes the filter)
   */
  onceLayerQueried(filter?: (event: LayerQueriedEvent) => boolean): Promise<LayerQueriedEvent> {
    // Register a one-shot event handler that resolves a promise
    return EventHelper.onceEventPromise(this.#onLayerQueriedHandlers, filter);
  }

  /**
   * Registers a layer queried event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerQueried(callback: LayerQueriedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerQueriedHandlers, callback);
  }

  /**
   * Unregisters a layer queried event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerQueried(callback: LayerQueriedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerQueriedHandlers, callback);
  }

  // #endregion EVENTS
}

// #region EVENTS & DELEGATES

/**
 * Define an event for the delegate
 */
export interface LayerQueriedEvent {
  /** The layer path that was queried. */
  layerPath: string;

  /** The result of the query. */
  result: TypeFeatureInfoResult;
}

/**
 * Define a delegate for the event handler function signature
 */
export type LayerQueriedDelegate = EventDelegateBase<AllFeatureInfoLayerSet, LayerQueriedEvent, void>;

// #endregion EVENTS & DELEGATES
