import { useStore } from 'zustand';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeLayerData, TypeFeatureInfoEntry, TypeGeometry } from '@/geo/utils/layer-set';

export interface IFeatureInfoState {
  checkedFeatures: Array<TypeFeatureInfoEntry>;
  layerDataArray: TypeLayerData[];
  layerDataArrayBatch: TypeLayerData[];
  layerDataArrayBatchLayerPathBypass: string;
  selectedLayerPath: string;

  actions: {
    addCheckedFeature: (feature: TypeFeatureInfoEntry) => void;
    removeCheckedFeature: (feature: TypeFeatureInfoEntry | 'all') => void;
    setLayerDataArray: (layerDataArray: TypeLayerData[]) => void;
    setLayerDataArrayBatch: (layerDataArray: TypeLayerData[]) => void;
    setLayerDataArrayBatchLayerPathBypass: (layerPath: string) => void;
    setSelectedLayerPath: (selectedLayerPath: string) => void;
  };
}

export function initFeatureInfoState(set: TypeSetStore, get: TypeGetStore): IFeatureInfoState {
  return {
    checkedFeatures: [],
    layerDataArray: [],
    layerDataArrayBatch: [],
    layerDataArrayBatchLayerPathBypass: '',
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
export const useDetailsCheckedFeatures = (): TypeFeatureInfoEntry[] =>
  useStore(useGeoViewStore(), (state) => state.detailsState.checkedFeatures);
export const useDetailsLayerDataArray = (): TypeLayerData[] => useStore(useGeoViewStore(), (state) => state.detailsState.layerDataArray);
export const useDetailsLayerDataArrayBatch = (): TypeLayerData[] =>
  useStore(useGeoViewStore(), (state) => state.detailsState.layerDataArrayBatch);
export const useDetailsSelectedLayerPath = (): string => useStore(useGeoViewStore(), (state) => state.detailsState.selectedLayerPath);

// TODO: Refactor - We should explicit a type for the layerState.actions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useDetailsStoreActions = (): any => useStore(useGeoViewStore(), (state) => state.detailsState.actions);
