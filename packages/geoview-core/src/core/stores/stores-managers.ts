// src/store/index.ts
import { useContext } from 'react';
import { create, createStore } from 'zustand';
import { mountStoreDevtool } from 'simple-zustand-devtools';

import type { IGeoviewState, GeoviewStoreType } from './geoview-store';
import { geoviewStoreDefinitionWithSubscribeSelector } from './geoview-store';
import { StoreContext } from '@/core/app-start';
import { whenThisThen, isLocalhost, delay } from '@/core/utils/utilities';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { LocalStorage } from '@/core/utils/localStorage';
import type { TypeResultSetEntry } from '@/api/types/map-schema-types';
import {
  clearDetailsStateSubscriptions,
  initDetailsStateSubscriptions,
  type TypeFeatureInfoResultSetEntry,
  type TypeHoverResultSetEntry,
} from './store-interface-and-intial-values/feature-info-state';
import type { TypeAllFeatureInfoResultSetEntry } from './store-interface-and-intial-values/data-table-state';
import {
  clearGeochartStateSubscriptions,
  initGeochartStateSubscriptions,
  type TypeGeochartResultSetEntry,
} from './store-interface-and-intial-values/geochart-state';
import { logger } from '../utils/logger';

// GV This file is the equivalent of the controller-manager.ts file, but for the store.

export interface StoresManagerState {
  stores: Record<string, GeoviewStoreType>;
}

export const useStoresManager = createStore<StoresManagerState>(() => ({
  stores: {},
}));

// Check if running in dev or if the key is set in the local storage
const LOCAL_STORAGE_KEY_DEVTOOLS = 'GEOVIEW_DEVTOOLS';
const DEVTOOLS_ACTIVE = isLocalhost() || !!LocalStorage.getItemAsNumber(LOCAL_STORAGE_KEY_DEVTOOLS);

/**
 * Mounts Zustand DevTools for a specific store instance.
 *
 * @param instanceName - Unique name for this store instance
 * @param store - The Zustand store
 * @param container - The container element
 */
const mountZustandDevTools = (instanceName: string, store: GeoviewStoreType, container: HTMLElement): void => {
  if (DEVTOOLS_ACTIVE) {
    // Check if container already has devtools
    if (!container.hasAttribute('data-zustand-devtools')) {
      // Create new DevTools container
      const devToolsContainer = document.createElement('div');
      devToolsContainer.id = `devtools-${instanceName}`;
      container.appendChild(devToolsContainer);

      // Mount and mark container as having devtools mounted
      mountStoreDevtool(instanceName, store, devToolsContainer);
      container.setAttribute('data-zustand-devtools', 'true');
    }
  }
};

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

export function hasGeochartPlugin(store: GeoviewStoreType): boolean {
  return store.getState().mapConfig!.footerBar?.tabs.core.includes('geochart') ?? false;
}

export function hasSwiperPlugin(store: GeoviewStoreType): boolean {
  return store.getState().mapConfig!.corePackages?.includes('swiper') ?? false;
}

export function hasDrawerPlugin(store: GeoviewStoreType): boolean {
  return store.getState().mapConfig!.navBar?.includes('drawer') ?? false;
}

export const addGeoViewStore = (config: TypeMapFeaturesConfig): void => {
  if (!config.mapId) {
    return;
  }

  // Create the store
  const geoviewStore = create<IGeoviewState>()(geoviewStoreDefinitionWithSubscribeSelector);
  geoviewStore.getState().setMapConfig(config);

  // Initialize the store subscriptions
  initDetailsStateSubscriptions(geoviewStore);
  if (hasGeochartPlugin(geoviewStore)) initGeochartStateSubscriptions(geoviewStore);

  useStoresManager.setState((state) => ({
    stores: {
      ...state.stores,
      [config.mapId]: geoviewStore,
    },
  }));

  mountZustandDevTools(`getViewStore-${config.mapId}`, geoviewStore, geoviewStore.getState().appState.geoviewHTMLElement);
};

export const removeGeoviewStore = (id: string): void => {
  // Clear the store subscriptions
  clearDetailsStateSubscriptions(id);
  if (hasGeochartPlugin(getGeoViewStore(id))) clearGeochartStateSubscriptions(id);

  delete useStoresManager.getState().stores[id];
};

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
 * Holds the buffer, on a map basis, for the propagation in batch in the layer data array store
 */
export type BatchedPropagationLayerDataArrayByMap<T extends TypeResultSetEntry> = {
  [mapId: string]: T[][];
};

/**
 * Represents a subscription delegate
 */
export type SubscriptionDelegate = () => void;
