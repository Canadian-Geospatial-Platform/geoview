import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { TypeFeatureInfoEntry, TypeResultSet, TypeResultSetEntry, TypeQueryStatus, TypeFieldEntry } from '@/geo/map/map-schema-types';
import { TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
type FeatureInfoActions = IFeatureInfoState['actions'];
export interface IFeatureInfoState {
    checkedFeatures: Array<TypeFeatureInfoEntry>;
    layerDataArray: TypeFeatureInfoResultSetEntry[];
    layerDataArrayBatch: TypeFeatureInfoResultSetEntry[];
    layerDataArrayBatchLayerPathBypass: string;
    selectedLayerPath: string;
    actions: {
        addCheckedFeature: (feature: TypeFeatureInfoEntry) => void;
        removeCheckedFeature: (feature: TypeFeatureInfoEntry | 'all') => void;
        setLayerDataArray: (layerDataArray: TypeFeatureInfoResultSetEntry[]) => void;
        setLayerDataArrayBatch: (layerDataArray: TypeFeatureInfoResultSetEntry[]) => void;
        setLayerDataArrayBatchLayerPathBypass: (layerPath: string) => void;
        setSelectedLayerPath: (selectedLayerPath: string) => void;
    };
    setterActions: {
        addCheckedFeature: (feature: TypeFeatureInfoEntry) => void;
        removeCheckedFeature: (feature: TypeFeatureInfoEntry | 'all') => void;
        setLayerDataArray: (layerDataArray: TypeFeatureInfoResultSetEntry[]) => void;
        setLayerDataArrayBatch: (layerDataArray: TypeFeatureInfoResultSetEntry[]) => void;
        setLayerDataArrayBatchLayerPathBypass: (layerPath: string) => void;
        setSelectedLayerPath: (selectedLayerPath: string) => void;
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
    eventListenerEnabled: boolean;
    queryStatus: TypeQueryStatus;
    features: TypeFeatureInfoEntry[] | undefined | null;
};
export type TypeFeatureInfoResultSetEntry = TypeResultSetEntry & TypeFeatureInfoSetEntry;
export type TypeFeatureInfoResultSet = TypeResultSet<TypeFeatureInfoResultSetEntry>;
export type TypeHoverFeatureInfo = {
    geoviewLayerType: TypeGeoviewLayerType;
    featureIcon: HTMLCanvasElement;
    fieldInfo: TypeFieldEntry | undefined;
    nameField: string | null;
} | undefined | null;
export type TypeHoverSetEntry = {
    eventListenerEnabled: boolean;
    queryStatus: TypeQueryStatus;
    feature: TypeHoverFeatureInfo;
};
export type TypeHoverResultSetEntry = TypeResultSetEntry & TypeHoverSetEntry;
export type TypeHoverResultSet = TypeResultSet<TypeHoverResultSetEntry>;
export declare const useDetailsCheckedFeatures: () => TypeFeatureInfoEntry[];
export declare const useDetailsLayerDataArray: () => TypeFeatureInfoResultSetEntry[];
export declare const useDetailsLayerDataArrayBatch: () => TypeFeatureInfoResultSetEntry[];
export declare const useDetailsSelectedLayerPath: () => string;
export declare const useDetailsStoreActions: () => FeatureInfoActions;
export {};
