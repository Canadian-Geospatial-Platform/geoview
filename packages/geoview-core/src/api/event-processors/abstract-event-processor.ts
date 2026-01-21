import type { GeoviewStoreType, IGeoviewState } from '@/core/stores/geoview-store';
import type { TypeAllFeatureInfoResultSetEntry } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import type {
  TypeFeatureInfoResultSetEntry,
  TypeHoverResultSetEntry,
} from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import type { TypeGeochartResultSetEntry } from '@/core/stores/store-interface-and-intial-values/geochart-state';
import { getGeoViewStore, getGeoViewStoreAsync } from '@/core/stores/stores-managers';
import { logger } from '@/core/utils/logger';
import { delay } from '@/core/utils/utilities';
import type { TypeResultSetEntry } from '@/api/types/map-schema-types';
import { GeoViewStoreOnMapNotFoundError } from '@/core/exceptions/geoview-exceptions';

/**
 * Holds the buffer, on a map basis, for the propagation in batch in the layer data array store
 */
export type BatchedPropagationLayerDataArrayByMap<T extends TypeResultSetEntry> = {
  [mapId: string]: T[][];
};

export abstract class AbstractEventProcessor {
  // The subscription array used to destroy the subscriptions
  #subscriptionArr: Array<() => void> = [];

  /**
   * Retrieves the Zustand store state for the specified map.
   * Provides synchronous access to the complete GeoView state including all store slices.
   * Used by event processors to read and modify state in their static methods.
   * @param {string} mapId - The unique identifier of the map to retrieve state for
   * @return {IGeoviewState} The complete store state for the map
   * @throws {GeoViewStoreOnMapNotFoundError} When no store exists for the given map ID
   * @protected
   * @static
   */
  protected static getState(mapId: string): IGeoviewState {
    // Get the GeoView Store for the given map
    const gvStore = getGeoViewStore(mapId);

    // If found
    if (gvStore) return gvStore.getState();

    // Not found
    throw new GeoViewStoreOnMapNotFoundError(mapId);
  }

  /**
   * Asynchronously retrieves the Zustand store state for the specified map.
   * Waits for the store to be available if it's still being created.
   * Provides asynchronous access to the complete GeoView state including all store slices.
   * Used by event processors during initialization when the store may not yet exist.
   * @param {string} mapId - The unique identifier of the map to retrieve state for
   * @return {Promise<IGeoviewState>} Promise resolving to the complete store state for the map
   * @throws {GeoViewStoreOnMapNotFoundError} When no store exists for the given map ID after waiting
   * @protected
   * @static
   */
  protected static async getStateAsync(mapId: string): Promise<IGeoviewState> {
    // Get the GeoView Store for the given map
    const gvStore = await getGeoViewStoreAsync(mapId);

    // If found
    if (gvStore) return gvStore.getState();

    // Not found
    throw new GeoViewStoreOnMapNotFoundError(mapId);
  }

  /**
   * Initializes the event processor with the provided store and sets up subscriptions.
   * This method calls the onInitialize hook which allows derived classes to register their store subscriptions.
   * All returned subscriptions are stored for cleanup during destruction.
   * @param {GeoviewStoreType} store - The GeoView store instance to initialize the processor with
   * @return {void}
   */
  initialize(store: GeoviewStoreType): void {
    // Call on initialize for the inherited classes to initialize and return their subscribtions
    const subs = this.onInitialize(store);
    if (subs) this.#subscriptionArr.push(...subs);
  }

  /**
   * Hook called during initialization to allow derived classes to set up their store subscriptions.
   * Override this method in derived event processors to register subscriptions to store state changes.
   * Return an array of unsubscribe functions that will be automatically cleaned up on destroy.
   * @param {GeoviewStoreType} store - The GeoView store instance for setting up subscriptions
   * @return {Array<() => void> | void} Array of unsubscribe functions for cleanup, or void if no subscriptions
   * @protected
   */
  // Added eslint-disable here, because we do want to override this method in children and keep 'this'.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/class-methods-use-this
  protected onInitialize(store: GeoviewStoreType): Array<() => void> | void {
    // ? Here, `store` is unused, but used in inherited classes, so the eslint-disable should be kept
    // This method should be overriden to initialize and return a list of subscribtions so that they can be destroyed later
    return undefined;
  }

  /**
   * Destroys the event processor by cleaning up all subscriptions and calling the onDestroy hook.
   * This method automatically unsubscribes from all store subscriptions that were registered during initialization.
   * Derived classes can override onDestroy to perform additional cleanup operations.
   * @return {void}
   */
  destroy(): void {
    // Call onDestroy for the inherited classes to destroy themselves. Their subscriptions returned upon initializations will already be destroyed.
    this.onDestroy();
  }

  /**
   * Hook called during destruction to allow derived classes to perform cleanup operations.
   * Override this method in derived event processors to clean up resources, timers, or other state.
   * The base implementation automatically unsubscribes from all store subscriptions registered during initialization.
   * @return {void}
   * @protected
   */
  protected onDestroy(): void {
    // destroying all subscriptions
    this.#subscriptionArr.forEach((unsub) => unsub());
  }

  /**
   * Batches layer data array propagations to the store for improved performance.
   * This method:
   * - Buffers layer data arrays to reduce store update frequency
   * - Delays propagation to batch multiple updates together
   * - Supports bypass mechanism for immediate propagation when needed
   * - Propagates the most recent state after the delay period
   * - Clears the buffer after propagation
   * The bypass feature allows immediate store updates for specific layers (e.g., when query completes).
   * @param {string} mapId - The unique identifier of the map
   * @param {T[]} layerDataArray - The layer data array to buffer during batching
   * @param {BatchedPropagationLayerDataArrayByMap<T>} batchPropagationObject - Reference to the batching buffer object holding all layer data arrays
   * @param {number} timeDelayBetweenPropagations - Delay in milliseconds between actual store propagations
   * @param {(layerDataArray: T[]) => void} onSetLayerDataArray - Store action callback to propagate the layerDataArray to the store
   * @param {string} [traceProcessorIndication] - Optional identifier for logging and debugging purposes
   * @param {string} [layerPathBypass] - Optional layer path that triggers immediate propagation when its query completes
   * @param {(layerPath: string) => void} [onResetBypass] - Optional callback to reset the bypass flag after use; when omitted, all subsequent propagations become immediate
   * @return {Promise<void>} Promise resolving when propagation is complete
   * @protected
   * @static
   */
  protected static async helperPropagateArrayStoreBatch<
    T extends TypeFeatureInfoResultSetEntry | TypeAllFeatureInfoResultSetEntry | TypeHoverResultSetEntry | TypeGeochartResultSetEntry,
  >(
    mapId: string,
    layerDataArray: T[],
    batchPropagationObject: BatchedPropagationLayerDataArrayByMap<T>,
    timeDelayBetweenPropagations: number,
    onSetLayerDataArray: (layerDataArray: T[]) => void,
    traceProcessorIndication?: string,
    layerPathBypass?: string,
    onResetBypass?: (layerPath: string) => void
  ): Promise<void> {
    // Log
    logger.logTraceDetailed('propagateArrayStoreBatch', mapId, traceProcessorIndication);

    // Make sure the batch propagation for the map exists
    // eslint-disable-next-line no-param-reassign
    if (!batchPropagationObject[mapId]) batchPropagationObject[mapId] = [];

    // Log
    // logger.logDebug('Propagate in batch - buffering...', mapId, traceProcessorIndication, batchPropagationObject[mapId].length);

    // Pile up the array
    batchPropagationObject[mapId].push(layerDataArray);

    // If there's a layer path bypass set
    let layerDataBypass;
    if (layerPathBypass) {
      // If the layerDataArray has the layer we have set as the bypass
      layerDataBypass = layerDataArray.find((layer) => layer.layerPath === layerPathBypass);
    }

    // If found the layer data according to the layer path to bypass
    let bypass = false;
    if (layerDataBypass) {
      // If it has features in a responded state
      if (layerDataBypass.queryStatus === 'processed' || layerDataBypass.queryStatus === 'error') {
        // Bypass
        bypass = true;

        // Log
        // logger.logDebug('Propagate in batch - bypass!', mapId, traceProcessorIndication, batchPropagationObject[mapId].length);

        // Reset the flag so it stops bypassing for the rest of the processing
        onResetBypass?.('');
      }
    }

    // If not bypassing the delay
    if (!bypass) {
      // Wait to batch the updates of the layerDataArray
      await delay(timeDelayBetweenPropagations);
    }

    // If any in the buffer
    if (batchPropagationObject[mapId].length) {
      // Alright, take the last one in the pile (the most recent updated state - as this is cumulative)
      const mostUpdatedState = batchPropagationObject[mapId][batchPropagationObject[mapId].length - 1];

      // Log
      // logger.logDebug(
      //   `Propagate in batch - buffered ${batchPropagationObject[mapId].length} layers`,
      //   mapId,
      //   traceProcessorIndication,
      //   JSON.parse(JSON.stringify(mostUpdatedState))
      // );

      // Propagate that one to the store
      onSetLayerDataArray(mostUpdatedState);

      // Empty the list
      // eslint-disable-next-line no-param-reassign
      batchPropagationObject[mapId] = [];
    }
  }
}
