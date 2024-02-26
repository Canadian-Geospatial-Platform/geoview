import { useStore } from 'zustand';

import { useGeoViewStore } from '../stores-managers';
import { TypeGetStore, TypeSetStore } from '../geoview-store';

// #region INTERFACES

export interface ISwiperState {
  layerPaths: string[];

  actions: {
    setLayerPaths: (layerPaths: string[]) => void;
  };
}

// #endregion INTERFACES

/**
 * Initializes a Swiper state object.
 * @param {TypeSetStore} set The store set callback function
 * @param {TypeSetStore} get The store get callback function
 * @returns {ISwiperState} The Swiper state object
 */
export function initializeSwiperState(set: TypeSetStore, get: TypeGetStore): ISwiperState {
  const init = {
    layerPaths: [],

    // #region ACTIONS

    actions: {
      setLayerPaths(layerPaths: string[]) {
        set({
          swiperState: {
            ...get().swiperState,
            layerPaths,
          },
        });
      },
    },

    // #endregion ACTIONS
  } as ISwiperState;

  return init;
}

// **********************************************************
// Swiper state selectors
// **********************************************************
export const useSwiperLayerPaths = () => useStore(useGeoViewStore(), (state) => state.swiperState.layerPaths);

export const useSwiperStoreActions = () => useStore(useGeoViewStore(), (state) => state.swiperState.actions);
