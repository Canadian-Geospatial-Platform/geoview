import { create } from 'zustand';
import { mountStoreDevtool } from 'simple-zustand-devtools';

import type { IGeoviewState, GeoviewStoreType } from '@/core/stores/geoview-store';
import { geoviewStoreDefinitionWithSubscribeSelector } from '@/core/stores/geoview-store-definition';
import { getGeoViewStore, hasGeoChartPlugin, useStoresManager } from '@/core/stores/stores-managers';
import { clearDetailsStateSubscriptions, initDetailsStateSubscriptions } from '@/core/stores/states/feature-info-state';
import { clearGeochartStateSubscriptions, initGeochartStateSubscriptions } from '@/core/stores/states/geochart-state';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { LocalStorage } from '@/core/utils/localStorage';
import { isLocalhost } from '@/core/utils/runtime-utilities';

// GV Store creation/removal imports every state slice; never import this file from a slice or stores-managers.ts (#3711)

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

/**
 * Creates the GeoView store for a map, initializes its subscriptions and registers it in the stores manager.
 *
 * Does nothing when the configuration has no map id.
 *
 * @param config - The map features configuration used to initialize the store
 */
export const addGeoViewStore = (config: TypeMapFeaturesConfig): void => {
  if (!config.mapId) {
    return;
  }

  // Create the store
  const geoviewStore = create<IGeoviewState>()(geoviewStoreDefinitionWithSubscribeSelector);
  geoviewStore.getState().setMapConfig(config);

  // Initialize the store subscriptions
  initDetailsStateSubscriptions(geoviewStore);
  if (hasGeoChartPlugin(geoviewStore)) initGeochartStateSubscriptions(geoviewStore);

  useStoresManager.setState((state) => ({
    stores: {
      ...state.stores,
      [config.mapId]: geoviewStore,
    },
  }));

  mountZustandDevTools(`getViewStore-${config.mapId}`, geoviewStore, geoviewStore.getState().appState.geoviewHTMLElement);
};

/**
 * Clears the store subscriptions of a map and removes its GeoView store from the stores manager.
 *
 * @param id - The map identifier of the store to remove
 */
export const removeGeoviewStore = (id: string): void => {
  // Clear the store subscriptions
  clearDetailsStateSubscriptions(id);
  if (hasGeoChartPlugin(getGeoViewStore(id))) clearGeochartStateSubscriptions(id);

  delete useStoresManager.getState().stores[id];
};
