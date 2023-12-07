import { useStore } from 'zustand';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { TypeArrayOfLayerData, TypeFeatureInfoEntry, TypeGeometry } from '@/api/events/payloads/get-feature-info-payload';
import { useGeoViewStore } from '../stores-managers';

export interface IDetailsState {
  checkedFeatures: Array<TypeFeatureInfoEntry>;
  layerDataArray: TypeArrayOfLayerData;
  selectedLayerPath: string;
  selectedLayerIndex: number;

  actions: {
    addCheckedFeature: (feature: TypeFeatureInfoEntry) => void;
    removeCheckedFeature: (feature: TypeFeatureInfoEntry | 'all') => void;
    setLayerDataArray: (layerDataArray: TypeArrayOfLayerData) => void;
    setSelectedLayerPath: (selectedLayerPath: string) => void;
    setSelectedLayerIndex: (selectedLayerIndex: number) => void;
  };
}

export function initialDetailsState(set: TypeSetStore, get: TypeGetStore): IDetailsState {
  return {
    checkedFeatures: [],
    layerDataArray: [],
    selectedLayerPath: '',
    selectedLayerIndex: 0,

    // #region ACTIONS
    actions: {
      addCheckedFeature: (feature: TypeFeatureInfoEntry) => {
        set({
          detailsState: {
            ...get().detailsState,
            checkedFeatures: [...get().detailsState.checkedFeatures, feature],
          },
        });
      },
      removeCheckedFeature: (feature: TypeFeatureInfoEntry | 'all') => {
        set({
          detailsState: {
            ...get().detailsState,
            checkedFeatures:
              feature === 'all'
                ? []
                : get().detailsState.checkedFeatures.filter(
                    (featureInfoEntry: TypeFeatureInfoEntry) =>
                      (featureInfoEntry.geometry as TypeGeometry).ol_uid !== (feature.geometry as TypeGeometry).ol_uid
                  ),
          },
        });
      },
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
      setSelectedLayerIndex(selectedLayerIndex: number) {
        set({
          detailsState: {
            ...get().detailsState,
            selectedLayerIndex,
          },
        });
      },
    },
    // #endregion ACTIONS
  } as IDetailsState;
}

// **********************************************************
// Details state selectors
// **********************************************************
export const useDetailsStoreCheckedFeatures = () => useStore(useGeoViewStore(), (state) => state.detailsState.checkedFeatures);
export const useDetailsStoreLayerDataArray = () => useStore(useGeoViewStore(), (state) => state.detailsState.layerDataArray);
export const useDetailsStoreSelectedLayerPath = () => useStore(useGeoViewStore(), (state) => state.detailsState.selectedLayerPath);
export const useDetailsStoreSelectedLayerIndex = () => useStore(useGeoViewStore(), (state) => state.detailsState.selectedLayerIndex);

export const useDetailsStoreActions = () => useStore(useGeoViewStore(), (state) => state.detailsState.actions);
