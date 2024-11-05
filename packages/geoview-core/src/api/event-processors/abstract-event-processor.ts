import { GeoviewStoreType, IGeoviewState } from '@/core/stores/geoview-store';
import { TypeAllFeatureInfoResultSetEntry } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { TypeFeatureInfoResultSetEntry, TypeHoverResultSetEntry } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { TypeGeochartResultSetEntry } from '@/core/stores/store-interface-and-intial-values/geochart-state';
import { getGeoViewStore, getGeoViewStoreAsync } from '@/core/stores/stores-managers';
import { logger } from '@/core/utils/logger';
import { delay } from '@/core/utils/utilities';
import { TypeResultSetEntry } from '@/geo/map/map-schema-types';

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
   * Shortcut to get the store state for a given map id
   *
   * @param {string} mapId the map id to retreive the state for
   * @returns {IGeoviewState} the store state
   */
  protected static getState(mapId: string): IGeoviewState {
    return getGeoViewStore(mapId).getState();
  }

  /**
   * Shortcut to get the store state for a given map id
   *
   * @param {string} mapId the map id to retreive the state for
   * @returns {IGeoviewState} the store state
   */
  protected static async getStateAsync(mapId: string): Promise<IGeoviewState> {
    const geoviewState = await getGeoViewStoreAsync(mapId);
    return geoviewState.getState();
  }

  /**
   * Initializes the processor
   * @param {GeoviewStoreType} store the store to initialize the processor with
   */
  public initialize(store: GeoviewStoreType): void {
    // Call on initialize for the inherited classes to initialize and return their subscribtions
    const subs = this.onInitialize(store);
    if (subs) this.#subscriptionArr.push(...subs);
  }

  // Added eslint-disable here, because we do want to override this method in children and keep 'this'.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/class-methods-use-this
  protected onInitialize(store: GeoviewStoreType): Array<() => void> | void {
    // ? Here, `store` is unused, but used in inherited classes, so the eslint-disable should be kept
    // This method should be overriden to initialize and return a list of subscribtions so that they can be destroyed later
    return undefined;
  }

  /**
   * Destroys the processor
   * @param {GeoviewStoreType} store the store to initialize the processor with
   */
  public destroy(): void {
    // Call onDestroy for the inherited classes to destroy themselves. Their subscriptions returned upon initializations will already be destroyed.
    this.onDestroy();
  }

  protected onDestroy(): void {
    // destroying all subscriptions
    this.#subscriptionArr.forEach((unsub) => unsub());
  }

  /**
   * Helper method to propagate in the layerDataArray in a batched manner.
   * The propagation can be bypassed using 'layerPathBypass' parameter which tells the process to
   * immediately batch out the array in the store for faster triggering of the state, for faster updating of the UI.
   * @param {string} mapId The map id
   * @param {T[]} layerDataArray The layer data array to hold in buffer during the batch
   * @param {BatchedPropagationLayerDataArrayByMap<T>} batchPropagationObject A reference to the BatchedPropagationLayerDataArrayByMap object used to hold all the layer data arrays in the buffer
   * @param {number} timeDelayBetweenPropagations The delay between actual propagations in the store
   * @param {(layerDataArray: T[]) => void} onSetLayerDataArray The store action callback used to store the layerDataArray in the actual store
   * @param {string} traceProcessorIndication? Simple parameter for logging purposes
   * @param {string} layerPathBypass? Indicates a layer path which, when processed, should bypass the buffer period and immediately trigger an update to the store
   * @param {(layerPath: string) => void} onResetBypass? The store action callback used to reset the layerPathBypass value in the store.
   *                                                     This is used so that when the bypass occurred once, it's not occuring again for all subsequent checks in the period of batch propagations.
   *                                                     It's up to the components to re-initialize the layerPathBypass at a certain time.
   *                                                     When no onResetBypass is specified, once the bypass occurs, all subsequent propagations happen immediately.
   * @returns {Promise<void>} Promise upon completion
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
