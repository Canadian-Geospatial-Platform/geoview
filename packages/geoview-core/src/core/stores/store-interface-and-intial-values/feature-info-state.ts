import { useStore } from 'zustand';

import type { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { useGeoViewStore } from '@/core/stores/stores-managers';
import type {
  TypeFeatureInfoEntry,
  TypeResultSet,
  TypeResultSetEntry,
  TypeQueryStatus,
  TypeFieldEntry,
} from '@/api/types/map-schema-types';
import type { TypeGeoviewLayerType } from '@/api/types/layer-schema-types';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { FeatureInfoEventProcessor } from '@/api/event-processors/event-processor-children/feature-info-event-processor';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with FeatureInfoEventProcessor vs FeatureInfoState

// #region INTERFACES & TYPES

type FeatureInfoActions = IFeatureInfoState['actions'];

export interface IFeatureInfoState {
  checkedFeatures: Array<TypeFeatureInfoEntry>;
  layerDataArray: TypeFeatureInfoResultSetEntry[];
  layerDataArrayBatch: TypeFeatureInfoResultSetEntry[];
  layerDataArrayBatchLayerPathBypass: string;
  selectedLayerPath: string;
  coordinateInfoEnabled: boolean;
  setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;

  actions: {
    addCheckedFeature: (feature: TypeFeatureInfoEntry) => void;
    removeCheckedFeature: (feature: TypeFeatureInfoEntry | 'all') => void;
    setLayerDataArray: (layerDataArray: TypeFeatureInfoResultSetEntry[]) => void;
    setLayerDataArrayBatch: (layerDataArray: TypeFeatureInfoResultSetEntry[]) => void;
    setLayerDataArrayBatchLayerPathBypass: (layerPath: string) => void;
    setSelectedLayerPath: (selectedLayerPath: string) => void;
    toggleCoordinateInfoEnabled: () => void;
  };

  setterActions: {
    addCheckedFeature: (feature: TypeFeatureInfoEntry) => void;
    removeCheckedFeature: (feature: TypeFeatureInfoEntry | 'all') => void;
    setLayerDataArray: (layerDataArray: TypeFeatureInfoResultSetEntry[]) => void;
    setLayerDataArrayBatch: (layerDataArray: TypeFeatureInfoResultSetEntry[]) => void;
    setLayerDataArrayBatchLayerPathBypass: (layerPath: string) => void;
    setSelectedLayerPath: (selectedLayerPath: string) => void;
    toggleCoordinateInfoEnabled: () => void;
  };
}

// #endregion INTERFACES & TYPES

/**
 * Initializes an FeatureInfo State and provide functions which use the get/set Zustand mechanisms.
 * @param {TypeSetStore} set - The setter callback to be used by this state
 * @param {TypeGetStore} get - The getter callback to be used by this state
 * @returns {IFeatureInfoState} - The initialized FeatureInfo State
 */
export function initFeatureInfoState(set: TypeSetStore, get: TypeGetStore): IFeatureInfoState {
  return {
    checkedFeatures: [],
    layerDataArray: [],
    layerDataArrayBatch: [],
    layerDataArrayBatchLayerPathBypass: '',
    selectedLayerPath: '',
    coordinateInfoEnabled: false,

    // Initialize default
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => {
      set({
        detailsState: {
          ...get().detailsState,
          coordinateInfoEnabled:
            (geoviewConfig.globalSettings?.coordinateInfoEnabled && !geoviewConfig.globalSettings?.hideCoordinateInfoSwitch) || false,
        },
      });
    },

    // #region ACTIONS

    actions: {
      addCheckedFeature: (feature: TypeFeatureInfoEntry) => {
        // Redirect to setter
        get().detailsState.setterActions.addCheckedFeature(feature);
      },
      removeCheckedFeature: (feature: TypeFeatureInfoEntry | 'all') => {
        // Redirect to setter
        get().detailsState.setterActions.removeCheckedFeature(feature);
      },
      setLayerDataArray(layerDataArray: TypeFeatureInfoResultSetEntry[]) {
        // Redirect to setter
        get().detailsState.setterActions.setLayerDataArray(layerDataArray);
      },
      setLayerDataArrayBatch(layerDataArrayBatch: TypeFeatureInfoResultSetEntry[]) {
        // Redirect to setter
        get().detailsState.setterActions.setLayerDataArrayBatch(layerDataArrayBatch);
      },
      setLayerDataArrayBatchLayerPathBypass(layerDataArrayBatchLayerPathBypass: string) {
        // Redirect to setter
        get().detailsState.setterActions.setLayerDataArrayBatchLayerPathBypass(layerDataArrayBatchLayerPathBypass);
      },
      setSelectedLayerPath(selectedLayerPath: string) {
        // Redirect to setter
        get().detailsState.setterActions.setSelectedLayerPath(selectedLayerPath);
      },
      toggleCoordinateInfoEnabled: (): void => {
        // Redirect to setter
        get().detailsState.setterActions.toggleCoordinateInfoEnabled();
      },
    },

    setterActions: {
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
                : get().detailsState.checkedFeatures.filter((featureInfoEntry) => featureInfoEntry.uid !== feature.uid),
          },
        });
      },
      setLayerDataArray(layerDataArray: TypeFeatureInfoResultSetEntry[]) {
        set({
          detailsState: {
            ...get().detailsState,
            layerDataArray,
          },
        });
      },
      setLayerDataArrayBatch(layerDataArrayBatch: TypeFeatureInfoResultSetEntry[]) {
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
      toggleCoordinateInfoEnabled: () => {
        const { coordinateInfoEnabled } = get().detailsState;
        set({
          detailsState: {
            ...get().detailsState,
            coordinateInfoEnabled: !coordinateInfoEnabled,
          },
        });
        const { clickCoordinates } = get().mapState;
        if (!coordinateInfoEnabled && clickCoordinates) {
          FeatureInfoEventProcessor.getCoordinateInfo(get().mapId, clickCoordinates);
        }
      },
    },

    // #endregion ACTIONS
  } as IFeatureInfoState;
}

export type TypeFeatureInfoSetEntry = {
  queryStatus: TypeQueryStatus;
  features: TypeFeatureInfoEntry[] | undefined | null;
};

export type TypeFeatureInfoResultSetEntry = TypeResultSetEntry & TypeFeatureInfoSetEntry;

export type TypeFeatureInfoResultSet = TypeResultSet<TypeFeatureInfoResultSetEntry>;

export type TypeHoverFeatureInfo =
  | {
      geoviewLayerType: TypeGeoviewLayerType;
      featureIcon: string | undefined;
      fieldInfo: TypeFieldEntry | undefined;
      nameField: string | null;
    }
  | undefined
  | null;

export type TypeHoverSetEntry = {
  eventListenerEnabled: boolean;
  queryStatus: TypeQueryStatus;
  feature: TypeHoverFeatureInfo;
};

export type TypeHoverResultSetEntry = TypeResultSetEntry & TypeHoverSetEntry;

export type TypeHoverResultSet = TypeResultSet<TypeHoverResultSetEntry>;

// **********************************************************
// Details state selectors
// **********************************************************
export const useDetailsCheckedFeatures = (): TypeFeatureInfoEntry[] =>
  useStore(useGeoViewStore(), (state) => state.detailsState.checkedFeatures);
export const useDetailsLayerDataArray = (): TypeFeatureInfoResultSetEntry[] =>
  useStore(useGeoViewStore(), (state) => state.detailsState.layerDataArray);
export const useDetailsLayerDataArrayBatch = (): TypeFeatureInfoResultSetEntry[] =>
  useStore(useGeoViewStore(), (state) => state.detailsState.layerDataArrayBatch);
export const useDetailsSelectedLayerPath = (): string => useStore(useGeoViewStore(), (state) => state.detailsState.selectedLayerPath);
export const useDetailsCoordinateInfoEnabled = (): boolean =>
  useStore(useGeoViewStore(), (state) => state.detailsState.coordinateInfoEnabled);

// Store Actions
export const useDetailsStoreActions = (): FeatureInfoActions => useStore(useGeoViewStore(), (state) => state.detailsState.actions);
