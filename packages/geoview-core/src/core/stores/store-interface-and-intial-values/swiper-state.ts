import { useStore } from 'zustand';

import { useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';

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
export const useSwiperLayerPaths = (): string[] => useStore(useGeoViewStore(), (state) => state.swiperState.layerPaths);

// TODO: Refactor - We should explicit a type for the swiperState.actions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useSwiperStoreActions = (): any => useStore(useGeoViewStore(), (state) => state.swiperState.actions);
