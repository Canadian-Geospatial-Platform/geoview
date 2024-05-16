import { useStore } from 'zustand';

import { useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
import { SwiperEventProcessor } from '@/api/event-processors/event-processor-children/swiper-event-processor';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with SwiperEventProcessor vs SwiperState

// #region INTERFACES & TYPES

type SwiperActions = ISwiperState['actions'];

export interface ISwiperState {
  layerPaths: string[];

  actions: {
    setLayerPaths: (layerPaths: string[]) => void;
  };

  setterActions: {
    setLayerPaths: (layerPaths: string[]) => void;
  };
}

// #endregion INTERFACES & TYPES

/**
 * Initializes a Swiper state object.
 * @param {TypeSetStore} set - The store set callback function
 * @param {TypeSetStore} get - The store get callback function
 * @returns {ISwiperState} - The Swiper state object
 */
export function initializeSwiperState(set: TypeSetStore, get: TypeGetStore): ISwiperState {
  const init = {
    layerPaths: [],

    // #region ACTIONS

    actions: {
      setLayerPaths(layerPaths: string[]) {
        // Redirect to SwiperEventProcessor
        SwiperEventProcessor.setLayerPaths(get().mapId, layerPaths);
      },
    },

    setterActions: {
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

export const useSwiperStoreActions = (): SwiperActions => useStore(useGeoViewStore(), (state) => state.swiperState.actions);
