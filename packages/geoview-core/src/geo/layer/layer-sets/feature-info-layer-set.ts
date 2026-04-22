import type { Coordinate } from 'ol/coordinate';
import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import type { QueryType, TypeResultSet } from '@/api/types/map-schema-types';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { AbstractLayerSet } from '@/geo/layer/layer-sets/abstract-layer-set';
import { GVKML } from '@/geo/layer/gv-layers/vector/gv-kml';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import {
  setStoreFeatureInfoDetails,
  setStoreFeatureInfoDetailsUpdateFeaturesHaveGeometry,
  type TypeFeatureInfoResultSet,
} from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { getStoreAppShowUnsymbolizedFeatures } from '@/core/stores/store-interface-and-intial-values/app-state';
import { RequestAbortedError } from '@/core/exceptions/core-exceptions';
import { LayerNoLastQueryToPerformError } from '@/core/exceptions/geoview-exceptions';
import { logger } from '@/core/utils/logger';

/**
 * A Layer-set working with the LayerSetController at handling a result set of registered layers and synchronizing
 * events happening on them (in this case when the user click a location on the map) with a store
 * for UI updates.
 */
export class FeatureInfoLayerSet extends AbstractLayerSet {
  /** The query type */
  static QUERY_TYPE: QueryType = 'at_lon_lat';

  /** The lon/lat of the last query */
  #lastQueryLonLat: Coordinate | null = null;

  /** Callback delegates for the query ended event */
  #onQueryEndedHandlers: QueryEndedDelegate[] = [];

  /** The abort controller shared by all layer queries for the current queryLayers call. */
  #abortController: AbortController = new AbortController();

  // #region OVERRIDES

  /**
   * Overrides the behavior to apply when a feature-info-layer-set wants to check for condition to register a layer in its set.
   *
   * @param layer - The layer
   * @returns True when the layer should be registered to this feature-info-layer-set
   */
  protected override onRegisterLayerCheck(layer: AbstractBaseGVLayer): boolean {
    // Return if the layer is of queryable type and source is queryable
    return super.onRegisterLayerCheck(layer) && AbstractLayerSet.isQueryableType(layer) && AbstractLayerSet.isSourceQueryable(layer);
  }

  /**
   * Overrides the behavior to apply when an all-feature-info-layer-set wants to register a layer in its set.
   *
   * @param layer - The layer
   */
  protected override onRegisterLayer(layer: AbstractBaseGVLayer): void {
    // Call parent
    super.onRegisterLayer(layer);

    // Save in the store
    setStoreFeatureInfoDetails(this.getMapId(), layer.getLayerPath(), 'init', undefined, false);
  }

  /**
   * Overrides the behavior to apply when deleting from the store.
   *
   * @param layerPath - The layer path to delete from the store
   */
  protected override onDeleteFromStore(layerPath: string): void {
    // Remove it from feature info array (propagating to the store)
    this.controllerRegistry.detailsController.deleteFeatureInfo(layerPath);
  }

  // #endregion OVERRIDES

  // #region PUBLIC METHODS

  /**
   * Queries the features at the provided coordinate for all the registered layers.
   *
   * @param lonLatCoordinate - The longitude/latitude coordinate where to query the features
   * @param callbackWhenFirstQueryStarted - Optional callback to be executed when the first query has started progressing.
   * @returns A promise that resolves with the result of the query
   */
  async queryLayers(lonLatCoordinate: Coordinate, callbackWhenFirstQueryStarted?: () => void): Promise<TypeFeatureInfoResultSet> {
    // Abort all in-flight queries from a previous call and create a fresh controller for this call
    this.#abortController.abort();
    this.#abortController = new AbortController();
    const { signal } = this.#abortController;

    // The result set to be returned
    const querySet: TypeFeatureInfoResultSet = {};

    // Initialize the resultSet
    this.getRegisteredLayerPaths().forEach((layerPath) => {
      // Init the result set entry for the layer path
      querySet[layerPath] = {
        layerPath: layerPath,
        queryStatus: 'init',
        features: undefined,
        featuresHaveGeometry: false,
      };
    });

    // Keep the lon/lat for possible repeat
    this.#lastQueryLonLat = lonLatCoordinate;

    // Query each queryable layer and collect the promises
    const allPromises = this.getRegisteredLayerPaths()
      .filter((layerPath) => this.layerDomain.getGeoviewLayerRegular(layerPath).getQueryable())
      .map((layerPath) => {
        // Update
        querySet[layerPath].queryStatus = 'processing';

        // Save in the store
        setStoreFeatureInfoDetails(this.getMapId(), layerPath, 'processing', undefined, false);

        // Process query and handle results
        return this.#queryLayerAndProcess(layerPath, lonLatCoordinate, querySet, signal, callbackWhenFirstQueryStarted);
      });

    // Await for the promises to settle
    await Promise.allSettled(allPromises);

    // Emit the query layers has ended
    this.#emitQueryEnded({ coordinate: lonLatCoordinate, resultSet: querySet });

    // Return the results
    return querySet;
  }

  /**
   * Repeats the last query if there was one.
   *
   * @returns A promise that resolves with the result of the query
   * @throws {LayerNoLastQueryToPerformError} When there's no last query to perform
   */
  repeatLastQuery(): Promise<TypeFeatureInfoResultSet> {
    // If no last query to perform
    if (!this.#lastQueryLonLat) throw new LayerNoLastQueryToPerformError();

    // Re-query the layers
    return this.queryLayers(this.#lastQueryLonLat);
  }

  /**
   * Clears the results for the provided layer path.
   *
   * @param layerPath - The layer path
   */
  clearResults(layerPath: string): void {
    // Save in the store
    setStoreFeatureInfoDetails(this.getMapId(), layerPath, 'init', undefined, false);
  }

  // #endregion PUBLIC METHODS

  // #region PRIVATE METHODS

  /**
   * Queries a single layer's features and processes the results.
   *
   * @param layerPath - The layer path to query
   * @param lonLatCoordinate - The longitude/latitude coordinate where to query the features
   * @param querySet - The result set to update with the query results
   * @param signal - The abort signal for this query call
   * @param callbackWhenFirstQueryStarted - Optional callback to be executed when the first query has started progressing
   */
  async #queryLayerAndProcess(
    layerPath: string,
    lonLatCoordinate: Coordinate,
    querySet: TypeFeatureInfoResultSet,
    signal: AbortSignal,
    callbackWhenFirstQueryStarted?: () => void
  ): Promise<void> {
    // Get the layer associated with the layer path
    const layer = this.layerDomain.getGeoviewLayerRegular(layerPath);

    try {
      // Process query on results data using the shared abort controller for this call
      const promiseResult = await this.queryLayerFeatures(
        layer,
        FeatureInfoLayerSet.QUERY_TYPE,
        lonLatCoordinate,
        true,
        this.#abortController
      );

      // Get the array of records in the results
      let arrayOfRecords = promiseResult.results;

      // GV: When using 'at_lon_lat' query type, the results may be returned without their geometries when a promiseGeometries is defined.
      // GV: We have to wait for the promise (promiseResult.promiseGeometries) to resolve if we want to know when the geometries are actually part of the results.

      // If there's a promise of geometries
      if (promiseResult.promiseGeometries) {
        // There's a promise that the geometries are coming, wait for them
        promiseResult.promiseGeometries
          .then(() => {
            // Ok, geometries have been loaded now
            // Update the query, mutating the object asynchronously, not ideal but works, caller should await on promiseGeometries if they want the geometries
            // eslint-disable-next-line no-param-reassign
            querySet[layerPath].featuresHaveGeometry = true;

            // Only propagate to the store if this query has not been superseded
            if (!signal.aborted) {
              setStoreFeatureInfoDetailsUpdateFeaturesHaveGeometry(this.getMapId(), layerPath, true);
            }
          })
          .catch((error: unknown) => {
            // Log
            logger.logPromiseFailed('Geometry error in promiseResult.promiseGeometries in queryLayers', error);
          });
      }

      // Get the layer config
      const layerConfig = layer.getLayerConfig();

      // TODO Double check this logic. If it get's reworked, possibly include the "formatEsriImageRecords" logic in the "alignRecordsWithOutFields"
      // If the response contain actual fields
      if (!(layer instanceof GVEsriImage) && AbstractLayerSet.recordsContainActualFields(layerConfig, arrayOfRecords)) {
        // Align fields with layerConfig fields
        AbstractLayerSet.alignRecordsWithOutFields(layerConfig, arrayOfRecords);
      }

      // Filter out unsymbolized features if the showUnsymbolizedFeatures config is false
      // GV: KML and ESRI Image is excluded as they currently have no symbology.
      if (!getStoreAppShowUnsymbolizedFeatures(this.getMapId()) && !(layer instanceof GVKML) && !(layer instanceof GVEsriImage)) {
        arrayOfRecords = arrayOfRecords.filter((record) => record.featureIcon);
        promiseResult.results = arrayOfRecords;
      }

      // Update
      // eslint-disable-next-line no-param-reassign
      querySet[layerPath].queryStatus = 'processed';
      // eslint-disable-next-line no-param-reassign
      querySet[layerPath].features = arrayOfRecords;

      // Only propagate to the store if this query has not been superseded
      if (!signal.aborted) {
        setStoreFeatureInfoDetails(this.getMapId(), layerPath, 'processed', arrayOfRecords, !promiseResult.promiseGeometries);
      }
    } catch (error: unknown) {
      // If aborted
      if (error instanceof RequestAbortedError || signal.aborted) {
        // Log
        logger.logDebug('Query aborted and replaced by another one.. keep spinning..');
      } else {
        // Update
        // eslint-disable-next-line no-param-reassign
        querySet[layerPath].queryStatus = 'error';

        // Save in the store that an error happened on the latest query
        setStoreFeatureInfoDetails(this.getMapId(), layerPath, 'error', undefined, false);

        // Log
        logger.logPromiseFailed('queryLayerFeatures in queryLayers in FeatureInfoLayerSet', error);
      }
    } finally {
      // Callback about it
      callbackWhenFirstQueryStarted?.();
    }
  }

  // #endregion PRIVATE METHODS

  // #region EVENTS

  /**
   * Emits a query ended event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitQueryEnded(event: QueryEndedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onQueryEndedHandlers, event);
  }

  /**
   * Registers a query ended event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onQueryEnded(callback: QueryEndedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onQueryEndedHandlers, callback);
  }

  /**
   * Unregisters a query ended event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offQueryEnded(callback: QueryEndedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onQueryEndedHandlers, callback);
  }

  // #endregion EVENTS
}

/**
 * Define a delegate for the event handler function signature
 */
type QueryEndedDelegate = EventDelegateBase<FeatureInfoLayerSet, QueryEndedEvent, void>;

/**
 * Define an event for the delegate
 */
export type QueryEndedEvent = {
  coordinate: Coordinate;
  resultSet: TypeResultSet;
};
