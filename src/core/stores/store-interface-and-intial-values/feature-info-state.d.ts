import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { TypeArrayOfLayerData, TypeFeatureInfoEntry } from '@/api/events/payloads/get-feature-info-payload';
export interface IFeatureInfoState {
    checkedFeatures: Array<TypeFeatureInfoEntry>;
    layerDataArray: TypeArrayOfLayerData;
    layerDataArrayBatch: TypeArrayOfLayerData;
    layerDataArrayBatchLayerPathBypass: string;
    hoverDataArray: TypeArrayOfLayerData;
    allFeaturesDataArray: TypeArrayOfLayerData;
    selectedLayerPath: string;
    actions: {
        addCheckedFeature: (feature: TypeFeatureInfoEntry) => void;
        removeCheckedFeature: (feature: TypeFeatureInfoEntry | 'all') => void;
        setLayerDataArray: (layerDataArray: TypeArrayOfLayerData) => void;
        setLayerDataArrayBatch: (layerDataArray: TypeArrayOfLayerData) => void;
        setLayerDataArrayBatchLayerPathBypass: (layerPath: string) => void;
        setHoverDataArray: (hoverDataArray: TypeArrayOfLayerData) => void;
        setAllFeaturesDataArray: (allFeaturesDataArray: TypeArrayOfLayerData) => void;
        setSelectedLayerPath: (selectedLayerPath: string) => void;
    };
}
export declare function initFeatureInfoState(set: TypeSetStore, get: TypeGetStore): IFeatureInfoState;
export declare const useDetailsStoreCheckedFeatures: () => TypeFeatureInfoEntry[];
export declare const useDetailsStoreLayerDataArray: () => TypeArrayOfLayerData;
export declare const useDetailsStoreLayerDataArrayBatch: () => TypeArrayOfLayerData;
export declare const useDetailsStoreSelectedLayerPath: () => string;
export declare const useDetailsStoreActions: () => {
    addCheckedFeature: (feature: TypeFeatureInfoEntry) => void;
    removeCheckedFeature: (feature: TypeFeatureInfoEntry | 'all') => void;
    setLayerDataArray: (layerDataArray: TypeArrayOfLayerData) => void;
    setLayerDataArrayBatch: (layerDataArray: TypeArrayOfLayerData) => void;
    setLayerDataArrayBatchLayerPathBypass: (layerPath: string) => void;
    setHoverDataArray: (hoverDataArray: TypeArrayOfLayerData) => void;
    setAllFeaturesDataArray: (allFeaturesDataArray: TypeArrayOfLayerData) => void;
    setSelectedLayerPath: (selectedLayerPath: string) => void;
};
