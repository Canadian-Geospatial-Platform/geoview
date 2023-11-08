import { useStore } from 'zustand';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { TypeArrayOfLayerData } from '@/api/events/payloads/get-feature-info-payload';
import { useGeoViewStore } from '../stores-managers';

export interface IDetailsState {
  layerDataArray: TypeArrayOfLayerData;
  selectedLayerPath: string;

  actions: {
    setLayerDataArray: (layerDataArray: TypeArrayOfLayerData) => void;
    setSelectedLayerPath: (selectedLayerPath: string) => void;
  };
}

export function initialDetailsState(set: TypeSetStore, get: TypeGetStore): IDetailsState {
  return {
    layerDataArray: [],
    selectedLayerPath: '',

    actions: {
      setLayerDataArray(layerDataArray: TypeArrayOfLayerData) {
        set({
          detailsState: {
            ...get().detailsState,
            layerDataArray,
          },
        });
      },
      setSelectedLayerPath(selectedLayerPath: string) {
        set({
          detailsState: {
            ...get().detailsState,
            selectedLayerPath,
          },
        });
      },
    },
  } as IDetailsState;
}

// **********************************************************
// Details state selectors
// **********************************************************
export const useDetailsStoreLayerDataArray = () => useStore(useGeoViewStore(), (state) => state.detailsState.layerDataArray);
export const useDetailsStoreSelectedLayerPath = () => useStore(useGeoViewStore(), (state) => state.detailsState.selectedLayerPath);

export const useDetailsStoreActions = () => useStore(useGeoViewStore(), (state) => state.detailsState.actions);
