import { useStore } from 'zustand';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { TypeArrayOfLayerData, TypeFeatureInfoEntry, TypeGeometry } from '@/api/events/payloads/get-feature-info-payload';
import { useGeoViewStore } from '../stores-managers';

export interface IFeatureInfoState {
  checkedFeatures: Array<TypeFeatureInfoEntry>;
  layerDataArray: TypeArrayOfLayerData;
  hoverDataArray: TypeArrayOfLayerData;
  allFeaturesDataArray: TypeArrayOfLayerData;
  selectedLayerPath: string;

  actions: {
    addCheckedFeature: (feature: TypeFeatureInfoEntry) => void;
    removeCheckedFeature: (feature: TypeFeatureInfoEntry | 'all') => void;
    setLayerDataArray: (layerDataArray: TypeArrayOfLayerData) => void;
    setHoverDataArray: (hoverDataArray: TypeArrayOfLayerData) => void;
    setAllFeaturesDataArray: (allFeaturesDataArray: TypeArrayOfLayerData) => void;
    setSelectedLayerPath: (selectedLayerPath: string) => void;
  };
}

export function initFeatureInfoState(set: TypeSetStore, get: TypeGetStore): IFeatureInfoState {
  return {
    checkedFeatures: [],
    layerDataArray: [],
    hoverDataArray: [],
    allFeaturesDataArray: [],
    selectedLayerPath: '',

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
      setHoverDataArray(hoverDataArray: TypeArrayOfLayerData) {
        set({
          detailsState: {
            ...get().detailsState,
            hoverDataArray,
          },
        });
      },
      setAllFeaturesDataArray(allFeaturesDataArray: TypeArrayOfLayerData) {
        set({
          detailsState: {
            ...get().detailsState,
            allFeaturesDataArray,
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
    // #endregion ACTIONS
  } as IFeatureInfoState;
}

// **********************************************************
// Details state selectors
// **********************************************************
export const useDetailsStoreCheckedFeatures = () => useStore(useGeoViewStore(), (state) => state.detailsState.checkedFeatures);
export const useDetailsStoreLayerDataArray = () => useStore(useGeoViewStore(), (state) => state.detailsState.layerDataArray);
export const useDetailsStoreSelectedLayerPath = () => useStore(useGeoViewStore(), (state) => state.detailsState.selectedLayerPath);

export const useDetailsStoreActions = () => useStore(useGeoViewStore(), (state) => state.detailsState.actions);
