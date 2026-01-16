import type { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import type { TypeFeatureInfoEntry, TypeResultSet, TypeResultSetEntry, TypeQueryStatus, TypeFieldEntry } from '@/api/types/map-schema-types';
import type { TypeGeoviewLayerType } from '@/api/types/layer-schema-types';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
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
/**
 * Initializes an FeatureInfo State and provide functions which use the get/set Zustand mechanisms.
 * @param {TypeSetStore} set - The setter callback to be used by this state
 * @param {TypeGetStore} get - The getter callback to be used by this state
 * @returns {IFeatureInfoState} - The initialized FeatureInfo State
 */
export declare function initFeatureInfoState(set: TypeSetStore, get: TypeGetStore): IFeatureInfoState;
export type TypeFeatureInfoSetEntry = {
    queryStatus: TypeQueryStatus;
    features: TypeFeatureInfoEntry[] | undefined;
};
export type TypeFeatureInfoResultSetEntry = TypeResultSetEntry & TypeFeatureInfoSetEntry;
export type TypeFeatureInfoResultSet = TypeResultSet<TypeFeatureInfoResultSetEntry>;
export type TypeHoverFeatureInfo = {
    geoviewLayerType: TypeGeoviewLayerType;
    featureIcon: string | undefined;
    fieldInfo: TypeFieldEntry | undefined;
    nameField: string | null;
} | undefined | null;
export type TypeHoverSetEntry = {
    queryStatus: TypeQueryStatus;
    feature: TypeHoverFeatureInfo;
};
export type TypeHoverResultSetEntry = TypeResultSetEntry & TypeHoverSetEntry;
export type TypeHoverResultSet = TypeResultSet<TypeHoverResultSetEntry>;
export declare const useDetailsCheckedFeatures: () => TypeFeatureInfoEntry[];
export declare const useDetailsLayerDataArray: () => TypeFeatureInfoResultSetEntry[];
export declare const useDetailsLayerDataArrayBatch: () => TypeFeatureInfoResultSetEntry[];
export declare const useDetailsSelectedLayerPath: () => string;
export declare const useDetailsCoordinateInfoEnabled: () => boolean;
export declare const useDetailsStoreActions: () => FeatureInfoActions;
export {};
//# sourceMappingURL=feature-info-state.d.ts.map