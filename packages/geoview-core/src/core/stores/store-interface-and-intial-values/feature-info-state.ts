import { useStore } from 'zustand';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { api } from '@/app';
import { QueryType, TypeLayerData, TypeFeatureInfoEntry, TypeGeometry } from '@/geo/utils/layer-set';

import { useGeoViewStore } from '../stores-managers';

export interface IFeatureInfoState {
  checkedFeatures: Array<TypeFeatureInfoEntry>;
  layerDataArray: TypeLayerData[];
  layerDataArrayBatch: TypeLayerData[];
  layerDataArrayBatchLayerPathBypass: string;
  hoverDataArray: TypeLayerData[];
  allFeaturesDataArray: TypeLayerData[];
  selectedLayerPath: string;

  actions: {
    addCheckedFeature: (feature: TypeFeatureInfoEntry) => void;
    removeCheckedFeature: (feature: TypeFeatureInfoEntry | 'all') => void;
    setLayerDataArray: (layerDataArray: TypeLayerData[]) => void;
    setLayerDataArrayBatch: (layerDataArray: TypeLayerData[]) => void;
    setLayerDataArrayBatchLayerPathBypass: (layerPath: string) => void;
    setHoverDataArray: (hoverDataArray: TypeLayerData[]) => void;
    setAllFeaturesDataArray: (allFeaturesDataArray: TypeLayerData[]) => void;
    setSelectedLayerPath: (selectedLayerPath: string) => void;
    triggerGetAllFeatureInfo: (layerPath: string, queryType: QueryType) => void;
  };
}

export function initFeatureInfoState(set: TypeSetStore, get: TypeGetStore): IFeatureInfoState {
  return {
    checkedFeatures: [],
    layerDataArray: [],
    layerDataArrayBatch: [],
    layerDataArrayBatchLayerPathBypass: '',
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
      setLayerDataArray(layerDataArray: TypeLayerData[]) {
        set({
          detailsState: {
            ...get().detailsState,
            layerDataArray,
          },
        });
      },
      setLayerDataArrayBatch(layerDataArrayBatch: TypeLayerData[]) {
        set({
          detailsState: {
            ...get().detailsState,
            layerDataArrayBatch,
          },
        });
      },
      setLayerDataArrayBatchLayerPathBypass(layerDataArrayBatchLayerPathBypass: string) {
        set({
          detailsState: {
            ...get().detailsState,
            layerDataArrayBatchLayerPathBypass,
          },
        });
      },
      setHoverDataArray(hoverDataArray: TypeLayerData[]) {
        set({
          detailsState: {
            ...get().detailsState,
            hoverDataArray,
          },
        });
      },
      setAllFeaturesDataArray(allFeaturesDataArray: TypeLayerData[]) {
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
      triggerGetAllFeatureInfo(layerPath: string, queryType: QueryType = 'all') {
        api.maps[get().mapId].layer.allFeatureInfoLayerSet.queryLayer(layerPath, queryType);
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
export const useDetailsStoreLayerDataArrayBatch = () => useStore(useGeoViewStore(), (state) => state.detailsState.layerDataArrayBatch);
export const useDetailsStoreSelectedLayerPath = () => useStore(useGeoViewStore(), (state) => state.detailsState.selectedLayerPath);
export const useDetailsStoreAllFeaturesDataArray = () => useStore(useGeoViewStore(), (state) => state.detailsState.allFeaturesDataArray);

export const useDetailsStoreActions = () => useStore(useGeoViewStore(), (state) => state.detailsState.actions);
