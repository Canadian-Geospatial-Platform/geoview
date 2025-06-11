// src/store/index.ts
import React, { useContext } from 'react';
import { create, createStore } from 'zustand';
import { mountStoreDevtool } from 'simple-zustand-devtools';

import { destroyEventProcessors, initializeEventProcessors } from '@/api/event-processors';
import { IGeoviewState, GeoviewStoreType, geoviewStoreDefinitionWithSubscribeSelector } from './geoview-store';
import { MapContext } from '@/core/app-start';
import { logger } from '@/core/utils/logger';
import { whenThisThen } from '@/core/utils/utilities';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { getItemAsNumber } from '@/core//utils/localStorage';

export interface StoresManagerState {
  stores: Record<string, GeoviewStoreType>;
}

// Log
logger.logInfo('Loading stores-manager file.');

export const useStoresManager = createStore<StoresManagerState>(() => ({
  stores: {},
}));

// Check if running in dev or if the key is set in the local storage
const LOCAL_STORAGE_KEY_DEVTOOLS = 'GEOVIEW_DEVTOOLS';
const DEVTOOLS_ACTIVE = process.env.NODE_ENV === 'development' || !!getItemAsNumber(LOCAL_STORAGE_KEY_DEVTOOLS);

/**
 * Mounts Zustand DevTools for a specific store instance.
 *
 * @param {string} instanceName - Unique name for this store instance
 * @param {any} store - The Zustand store
 * @param {HTMLElement} container - The container element
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

export const addGeoViewStore = (config: TypeMapFeaturesConfig): void => {
  if (!config.mapId) {
    return;
  }

  // Log
  logger.logInfo(`Creating the store for map ${config.mapId}`);

  // Create the store
  const geoviewStore = create<IGeoviewState>()(geoviewStoreDefinitionWithSubscribeSelector);
  geoviewStore.getState().setMapConfig(config);

  // intialize event processor to make links between ui/store and back end/api
  initializeEventProcessors(geoviewStore);
  useStoresManager.setState((state) => ({
    stores: {
      ...state.stores,
      [config.mapId]: geoviewStore,
    },
  }));

  mountZustandDevTools(`getViewStore-${config.mapId}`, geoviewStore, geoviewStore.getState().appState.geoviewHTMLElement);

  logger.logInfo(`Store created for map ${config.mapId}`);
};

export const getGeoViewStore = (id: string): GeoviewStoreType => {
  return useStoresManager.getState().stores[id];
};

// async version to use when we need to access store and it may not be created yet
export const getGeoViewStoreAsync = (id: string): Promise<GeoviewStoreType> => {
  return whenThisThen(() => getGeoViewStore(id));
};

export const removeGeoviewStore = (id: string): void => {
  // delete the event processor, unsubscribe and remove the store for the manager
  destroyEventProcessors(getGeoViewStore(id));
  delete useStoresManager.getState().stores[id];
};

export const useGeoViewStore = (): GeoviewStoreType => {
  const toto = React;
  logger.logDebug(toto);

  let mapId = '';
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    mapId = useContext(MapContext).mapId;
    return useStoresManager.getState().stores[mapId];
  } catch (error: unknown) {
    logger.logError(error);

    // eslint-disable-next-line prefer-const
    let throww = true;
    if (throww) throw error;
    return useStoresManager.getState().stores[mapId];
  }
};
