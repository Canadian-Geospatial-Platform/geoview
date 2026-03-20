import type { Coordinate } from 'ol/coordinate';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { FeatureInfoEventProcessor } from '@/api/event-processors/event-processor-children/feature-info-event-processor';
import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import type { QueryType, TypeFeatureInfoResult, TypeResultSet } from '@/api/types/map-schema-types';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { AbstractLayerSet, type PropagationType } from '@/geo/layer/layer-sets/abstract-layer-set';
import { GVKML } from '@/geo/layer/gv-layers/vector/gv-kml';
import type { LayerApi } from '@/geo/layer/layer';
import type {
  TypeFeatureInfoResultSet,
  TypeFeatureInfoResultSetEntry,
} from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { RequestAbortedError } from '@/core/exceptions/core-exceptions';
import { LayerNoLastQueryToPerformError } from '@/core/exceptions/geoview-exceptions';
import { logger } from '@/core/utils/logger';
import { GVEsriImage } from '../gv-layers/raster/gv-esri-image';

/**
 * A Layer-set working with the LayerApi at handling a result set of registered layers and synchronizing
 * events happening on them (in this case when the user click a location on the map) with a store
 * for UI updates.
 */
export class FeatureInfoLayerSet extends AbstractLayerSet {
  /** The query type */
  static QUERY_TYPE: QueryType = 'at_lon_lat';

  /** The resultSet object as existing in the base class, retyped here as a TypeFeatureInfoResultSet */
  declare resultSet: TypeFeatureInfoResultSet;

  /** The lon/lat of the last query */
  #lastQueryLonLat: Coordinate | null = null;

  /** Callback delegates for the query ended event */
  #onQueryEndedHandlers: QueryEndedDelegate[] = [];

  /** The abort controllers per layer path */
  #abortControllers: { [layerPath: string]: AbortController } = {};

  /**
   * The class constructor that instantiates a set of layers.
   *
   * @param layerApi - The layer Api to work with
   */
  constructor(layerApi: LayerApi) {
    super(layerApi);

    // Register a handler on the map click
    this.layerApi.mapViewer.onMapSingleClick((mapViewer, payload) => {
      // Query all layers which can be queried
      this.queryLayers(payload.lonlat).catch((error: unknown) => {
        // Log
        logger.logPromiseFailed('queryLayers in onMapSingleClick in FeatureInfoLayerSet', error);
      });
    });
  }

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
   * Overrides the behavior to apply when a feature-info-layer-set wants to register a layer in its set.
   *
   * @param layer - The layer
   */
  protected override onRegisterLayer(layer: AbstractBaseGVLayer): void {
    // Call parent
    super.onRegisterLayer(layer);

    // Update the resultSet data
    const layerPath = layer.getLayerPath();
    this.resultSet[layerPath].queryStatus = 'processed';
    this.resultSet[layerPath].features = undefined;
    this.resultSet[layerPath].featuresHaveGeometry = false;
  }

  /**
   * Overrides the behavior to apply when propagating to the store.
   *
   * @param resultSetEntry - The result set entry to propagate
   * @param type - The propagation type
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected override onPropagateToStore(resultSetEntry: TypeFeatureInfoResultSetEntry, type: PropagationType): void {
    // Redirect - Add layer to the list after registration
    this.#propagateToStore(resultSetEntry);
  }

  /**
   * Overrides the behavior to apply when deleting from the store.
   *
   * @param layerPath - The layer path to delete from the store
   */
  protected override onDeleteFromStore(layerPath: string): void {
    // Remove it from feature info array (propagating to the store)
    FeatureInfoEventProcessor.deleteFeatureInfo(this.getMapId(), layerPath);
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
    return this.queryLayers(this.#lastQueryLonLat, false);
  }

  /**
   * Queries the features at the provided coordinate for all the registered layers.
   *
   * @param lonLatCoordinate - The longitude/latitude coordinate where to query the features
   * @param fromClick - Optional whether the query is from a user click
   * @returns A promise that resolves with the result of the query
   */
  async queryLayers(lonLatCoordinate: Coordinate, fromClick: boolean = true): Promise<TypeFeatureInfoResultSet> {
    // FIXME: Watch out for code reentrancy between queries!
    // FIX.MECONT: The AbortController helps a lot, but there could be some minor timing issues left
    // FIX.MECONT: with the mutating this.resultSet.
    // FIX.MECONT: Consider using a LIFO pattern, per layer path, as the race condition resolution

    // Keep the lon/lat for possible repeat
    this.#lastQueryLonLat = lonLatCoordinate;

    // Prepare to hold all promises of features in the loop below
    const allPromises: Promise<TypeFeatureInfoResult>[] = [];

    // Reinitialize the resultSet
    // Loop on each layer path in the resultSet
    Object.keys(this.resultSet).forEach((layerPath) => {
      // Get the layer config and layer associated with the layer path
      const layer = this.layerApi.getGeoviewLayerRegular(layerPath);

      // If the layer is not queryable, skip it
      if (!layer.getQueryable()) return;

      // Flag processing
      this.resultSet[layerPath].features = undefined;
      this.resultSet[layerPath].featuresHaveGeometry = false;
      this.resultSet[layerPath].queryStatus = 'processing';

      // Propagate to store
      this.#propagateToStore(this.resultSet[layerPath]);

      // If the layer path has an abort controller
      if (Object.keys(this.#abortControllers).includes(layerPath)) {
        // Abort it
        this.#abortControllers[layerPath].abort();
      }

      // Create an AbortController for the query
      this.#abortControllers[layerPath] = new AbortController();

      // Process query on results data
      const promise = this.queryLayerFeatures(
        layer,
        FeatureInfoLayerSet.QUERY_TYPE,
        lonLatCoordinate,
        true,
        this.#abortControllers[layerPath]
      );

      // Add the promise
      allPromises.push(promise);

      // When the promise is done, propagate to store
      promise
        .then((promiseResult) => {
          // Get the array of records in the results
          const arrayOfRecords = promiseResult.results;

          // GV: When using 'at_lon_lat' query type, the results may be returned without their geometries when a promiseGeometries is defined.
          // GV: We have to wait for the promise (promiseResult.promiseGeometries) to resolve if we want to know when the geometries are actually part of the results.

          // If there's a promise of geometries
          if (promiseResult.promiseGeometries) {
            // There's a promise that the geometries are coming, wait for them
            promiseResult.promiseGeometries
              .then(() => {
                // Ok, geometries have been loaded now
                this.resultSet[layerPath].featuresHaveGeometry = true;

                // Propagate to store
                this.#propagateToStore(this.resultSet[layerPath]);
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
          if (
            !AppEventProcessor.getShowUnsymbolizedFeatures(this.getMapId()) &&
            !(layer instanceof GVKML) &&
            !(layer instanceof GVEsriImage)
          ) {
            // eslint-disable-next-line no-param-reassign
            promiseResult.results = arrayOfRecords.filter((record) => record.featureIcon);
          }

          // Keep the features retrieved
          this.resultSet[layerPath].features = arrayOfRecords;

          // Indicate that the geometries have been loaded if there was no promises for them (default)
          this.resultSet[layerPath].featuresHaveGeometry = !promiseResult.promiseGeometries;

          // Query was processed
          this.resultSet[layerPath].queryStatus = 'processed';
        })
        .catch((error: unknown) => {
          // If aborted
          if (error instanceof RequestAbortedError) {
            // Log
            logger.logDebug('Query aborted and replaced by another one.. keep spinning..');
          } else {
            // Error in the query
            this.resultSet[layerPath].features = undefined;
            this.resultSet[layerPath].featuresHaveGeometry = false;
            this.resultSet[layerPath].queryStatus = 'error';

            // Log
            logger.logPromiseFailed('queryLayerFeatures in queryLayers in FeatureInfoLayerSet', error);
          }
        })
        .finally(() => {
          // Propagate to store
          this.#propagateToStore(this.resultSet[layerPath]);
          if (fromClick) FeatureInfoEventProcessor.openDetailsPanelOnMapClick(this.getMapId());
        });
    });

    // Await for the promises to settle
    await Promise.allSettled(allPromises);

    // Emit the query layers has ended
    this.#emitQueryEnded({ coordinate: lonLatCoordinate, resultSet: this.resultSet });

    // Return the results
    return this.resultSet;
  }

  /**
   * Clears the results for the provided layer path.
   *
   * @param layerPath - The layer path
   */
  clearResults(layerPath: string): void {
    // Edit the result set
    this.resultSet[layerPath].features = undefined;
    this.resultSet[layerPath].featuresHaveGeometry = false;

    // Propagate to store
    this.#propagateToStore(this.resultSet[layerPath]);
  }

  /**
   * Propagates the resultSetEntry to the store.
   *
   * @param resultSetEntry - The result set entry to propagate to the store
   */
  #propagateToStore(resultSetEntry: TypeFeatureInfoResultSetEntry): void {
    // Propagate
    FeatureInfoEventProcessor.propagateFeatureInfoToStore(this.getMapId(), resultSetEntry);
  }

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
