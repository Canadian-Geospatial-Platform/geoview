import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { TypeArrayOfLayerData, TypeFeatureInfoEntry } from '@/api/events/payloads/get-feature-info-payload';
export interface IDetailsState {
    checkedFeatures: Array<TypeFeatureInfoEntry>;
    layerDataArray: TypeArrayOfLayerData;
    selectedLayerPath: string;
    actions: {
        addCheckedFeature: (feature: TypeFeatureInfoEntry) => void;
        removeCheckedFeature: (feature: TypeFeatureInfoEntry | 'all') => void;
        setLayerDataArray: (layerDataArray: TypeArrayOfLayerData) => void;
        setSelectedLayerPath: (selectedLayerPath: string) => void;
    };
}
export declare function initialDetailsState(set: TypeSetStore, get: TypeGetStore): IDetailsState;
export declare const useDetailsStoreCheckedFeatures: () => TypeFeatureInfoEntry[];
export declare const useDetailsStoreLayerDataArray: () => TypeArrayOfLayerData;
export declare const useDetailsStoreSelectedLayerPath: () => string;
export declare const useDetailsStoreActions: () => {
    addCheckedFeature: (feature: TypeFeatureInfoEntry) => void;
    removeCheckedFeature: (feature: TypeFeatureInfoEntry | 'all') => void;
    setLayerDataArray: (layerDataArray: TypeArrayOfLayerData) => void;
    setSelectedLayerPath: (selectedLayerPath: string) => void;
};
