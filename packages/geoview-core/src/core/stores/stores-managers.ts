// src/store/index.ts
import { useContext } from 'react';
import { createStore } from 'zustand';

import type { GeoviewStoreType } from './geoview-store';
import { StoreContext } from '@/core/stores/store-context';
import { whenThisThen, delay } from '@/core/utils/utilities';
import type { TypeResultSetEntry } from '@/api/types/map-schema-types';
import type { TypeFeatureInfoResultSetEntry, TypeHoverResultSetEntry } from './states/feature-info-state';
import type { TypeAllFeatureInfoResultSetEntry } from './states/data-table-state';
import type { TypeGeochartResultSetEntry } from './states/geochart-state';
import { logger } from '@/core/utils/logger';

// GV Store shouldn't import DomHelper
// GV This file is the equivalent of the controller-manager.ts file, but for the store.
// GV Store creation/removal lives in store-lifecycle.ts so the state slices can import this file without a cycle.

export interface StoresManagerState {
  stores: Record<string, GeoviewStoreType>;
}

export const useStoresManager = createStore<StoresManagerState>(() => ({
  stores: {},
}));

export const getGeoViewStore = (id: string): GeoviewStoreType => {
  return useStoresManager.getState().stores[id];
};

// async version to use when we need to access store and it may not be created yet
export const getGeoViewStoreAsync = (id: string): Promise<GeoviewStoreType> => {
  return whenThisThen(() => getGeoViewStore(id));
};

export function hasTimeSliderPlugin(store: GeoviewStoreType): boolean {
  return store.getState().mapConfig!.footerBar?.tabs.core.includes('time-slider') ?? false;
}

export function hasGeoChartPlugin(store: GeoviewStoreType): boolean {
  return store.getState().mapConfig!.footerBar?.tabs.core.includes('geochart') ?? false;
}

export function hasSwiperPlugin(store: GeoviewStoreType): boolean {
  return store.getState().mapConfig!.corePackages?.includes('swiper') ?? false;
}

export function hasDrawerPlugin(store: GeoviewStoreType): boolean {
  return store.getState().mapConfig!.navBar?.includes('drawer') ?? false;
}

export function hasFilterPanelPlugin(store: GeoviewStoreType): boolean {
  return store.getState().mapConfig!.appBar?.tabs?.core?.includes('filter-panel') ?? false;
}

export function hasStacBrowserPlugin(store: GeoviewStoreType): boolean {
  return store.getState().mapConfig!.appBar?.tabs?.core?.includes('stac-browser') ?? false;
}

/**
 * Hook to access the GeoView store from the context.
 *
 * @returns The GeoView store instance from the context.
 * @throws {Error} When used outside of a StoreContext.Provider.
 */
export const useGeoViewStore = (): GeoviewStoreType => {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useGeoViewStore must be used inside StoreContext.Provider');
  }
  return useStoresManager.getState().stores[ctx];
};

/**
 * Helper function to delete a layer information from an array when found.
 *
 * @param layerArray - The layer array to work with
 * @param layerPath - The layer path to delete
 * @param onDeleteCallback - The callback executed when the array is updated
 */
export const helperDeleteFromArray = <T extends TypeResultSetEntry>(
  layerArray: T[],
  layerPath: string,
  onDeleteCallback: (layerArray: T[]) => void
): void => {
  // Find the layer data info to delete from the array
  const layerDataInfoToDelIndex = layerArray.findIndex((layerInfo) => layerInfo.layerPath === layerPath);

  // If found
  if (layerDataInfoToDelIndex >= 0) {
    // Remove from the array
    layerArray.splice(layerDataInfoToDelIndex, 1);

    // Callback with updated array
    onDeleteCallback(layerArray);
  }
};

/**
 * Helper method to propagate in the layerDataArray in a batched manner.
 * The propagation can be bypassed using 'layerPathBypass' parameter which tells the process to
 * immediately batch out the array in the store for faster triggering of the state, for faster updating of the UI.
 *
 * @param mapId - The map id
 * @param layerDataArray - The layer data array to hold in buffer during the batch
 * @param batchPropagationObject - A reference to the BatchedPropagationLayerDataArrayByMap object used to hold all the layer data arrays in the buffer
 * @param timeDelayBetweenPropagations - The delay between actual propagations in the store
 * @param onSetStoreLayerDataArray - The store action callback used to store the layerDataArray in the actual store
 * @param traceProcessorIndication? - Simple parameter for logging purposes
 * @param layerPathBypass? - Indicates a layer path which, when processed, should bypass the buffer period and immediately trigger an update to the store
 * @param onResetBypass? - The store action callback used to reset the layerPathBypass value in the store.
 *                                                     This is used so that when the bypass occurred once, it's not occuring again for all subsequent checks in the period of batch propagations.
 *                                                     It's up to the components to re-initialize the layerPathBypass at a certain time.
 *                                                     When no onResetBypass is specified, once the bypass occurs, all subsequent propagations happen immediately.
 * @returns Promise upon completion
 */
export const helperPropagateArrayStoreBatch = async <
  T extends TypeFeatureInfoResultSetEntry | TypeAllFeatureInfoResultSetEntry | TypeHoverResultSetEntry | TypeGeochartResultSetEntry,
>(
  mapId: string,
  layerDataArray: T[],
  batchPropagationObject: BatchedPropagationLayerDataArrayByMap<T>,
  timeDelayBetweenPropagations: number,
  onSetStoreLayerDataArray: (layerDataArray: T[]) => void,
  traceProcessorIndication?: string,
  layerPathBypass?: string,
  onResetBypass?: (layerPath: string) => void
): Promise<void> => {
  // Log
  logger.logTraceDetailed('propagateArrayStoreBatch', mapId, traceProcessorIndication);

  // Make sure the batch propagation for the map exists
  // eslint-disable-next-line no-param-reassign
  if (!batchPropagationObject[mapId]) batchPropagationObject[mapId] = [];

  // Log
  // logger.logDebug('Propagate in batch - buffering...', mapId, traceProcessorIndication, batchPropagationObject[mapId].length);

  // Clone the layer data array to preserve snapshot of features at this moment, avoiding issues with non-cloneable properties
  const clonedLayerDataArray = layerDataArray.map((layer) => {
    if ('features' in layer)
      return {
        ...layer,
        features: layer.features ? [...layer.features] : [],
      };
    return layer;
  });

  // Pile up the array
  batchPropagationObject[mapId].push(clonedLayerDataArray);

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
    onSetStoreLayerDataArray(mostUpdatedState);

    // Empty the list
    // eslint-disable-next-line no-param-reassign
    batchPropagationObject[mapId] = [];
  }
};

/**
 * Waits for a subscribed value to become defined.
 *
 * @param getValue - Returns the current value, or undefined while it is unavailable
 * @param subscribe - Registers a change listener and returns its unsubscribe function
 * @returns A promise that resolves with the first defined value
 * @throws When reading the value or subscribing throws
 */
export function helperWaitForValueWithSubscription<T>(
  getValue: () => T | undefined,
  subscribe: (listener: () => void) => () => void
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let isSettled = false;
    const subscription: { unsubscribe?: () => void } = {};
    const checkValue = (): void => {
      if (isSettled) return;

      try {
        const value = getValue();
        if (value === undefined) return;

        isSettled = true;
        subscription.unsubscribe?.();
        resolve(value);
      } catch (error: unknown) {
        isSettled = true;
        subscription.unsubscribe?.();
        reject(error);
      }
    };

    try {
      subscription.unsubscribe = subscribe(checkValue);
      if (isSettled) subscription.unsubscribe();
      else checkValue();
    } catch (error: unknown) {
      isSettled = true;
      subscription.unsubscribe?.();
      reject(error);
    }
  });
}

/**
 * Holds the buffer, on a map basis, for the propagation in batch in the layer data array store
 */
export type BatchedPropagationLayerDataArrayByMap<T extends TypeResultSetEntry> = {
  [mapId: string]: T[][];
};

/**
 * Represents a subscription delegate
 */
export type SubscriptionDelegate = () => void;
