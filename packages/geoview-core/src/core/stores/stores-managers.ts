// src/store/index.ts
import { useContext } from 'react';
import { create, createStore } from 'zustand';
import { mountStoreDevtool } from 'simple-zustand-devtools';

import { destroyEventProcessors, initializeEventProcessors } from '@/api/event-processors';
import { IGeoviewState, GeoviewStoreType, geoviewStoreDefinitionWithSubscribeSelector } from './geoview-store';
import { MapContext } from '@/core/app-start';
import { logger } from '@/core/utils/logger';
import { whenThisThen } from '@/core/utils/utilities';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';

export interface StoresManagerState {
  stores: Record<string, GeoviewStoreType>;
}

export const useStoresManager = createStore<StoresManagerState>(() => ({
  stores: {},
}));

/**
 * Mounts Zustand DevTools for a specific store instance.
 *
 * @param {string} instanceName - Unique name for this store instance
 * @param {any} store - The Zustand store
 * @param {HTMLElement} container - The container element
 */
const mountZustandDevTools = (instanceName: string, store: GeoviewStoreType, container: HTMLElement): void => {
  // Only mount in development
  if (process.env.NODE_ENV === 'development') {
    // Check if container already has devtools
    if (!container.hasAttribute('data-zustand-devtools')) {
      mountStoreDevtool(instanceName, store, container);
      // Mark container as having devtools mounted
      container.setAttribute('data-zustand-devtools', 'true');
    }
  }
};

export const addGeoViewStore = (config: TypeMapFeaturesConfig): void => {
  if (!config.mapId) {
    return;
  }

  // Log
  logger.logTraceCore(`Creating the store for map ${config.mapId}`);

  // Create the store
  const geoviewStore = create<IGeoviewState>()(geoviewStoreDefinitionWithSubscribeSelector);
  geoviewStore.getState().setMapConfig(config);

  // intialize event processor to make links between ui/store and back end/api
  initializeEventProcessors(geoviewStore);
  useStoresManager.setState((state) => ({
    stores: {
      ...state.stores,
      [config.mapId ?? 'unknown']: geoviewStore,
    },
  }));

  mountZustandDevTools(`getViewStore-${config.mapId}`, geoviewStore, geoviewStore.getState().appState.geoviewHTMLElement);
};

export const getGeoViewStore = (id: string | undefined): GeoviewStoreType => {
  return useStoresManager.getState().stores[id ?? 'unknown'];
};

// async version to use when we need to access store and it may not be created yet
export const getGeoViewStoreAsync = (id: string | undefined): Promise<GeoviewStoreType> => {
  return whenThisThen(() => getGeoViewStore(id));
};

export const removeGeoviewStore = (id: string): void => {
  // delete the event processor, unsubscribe and remove the store for the manager
  destroyEventProcessors(getGeoViewStore(id));
  delete useStoresManager.getState().stores[id];
};

export const useGeoViewStore = (): GeoviewStoreType => {
  const { mapId } = useContext(MapContext);

  return useStoresManager.getState().stores[mapId ?? 'unknown'];
};
