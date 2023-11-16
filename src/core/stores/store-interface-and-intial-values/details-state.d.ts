import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { TypeArrayOfLayerData } from '@/api/events/payloads/get-feature-info-payload';
export interface IDetailsState {
    layerDataArray: TypeArrayOfLayerData;
    selectedLayerPath: string;
    actions: {
        setLayerDataArray: (layerDataArray: TypeArrayOfLayerData) => void;
        setSelectedLayerPath: (selectedLayerPath: string) => void;
    };
}
export declare function initialDetailsState(set: TypeSetStore, get: TypeGetStore): IDetailsState;
export declare const useDetailsStoreLayerDataArray: () => TypeArrayOfLayerData;
export declare const useDetailsStoreSelectedLayerPath: () => string;
export declare const useDetailsStoreActions: () => {
    setLayerDataArray: (layerDataArray: TypeArrayOfLayerData) => void;
    setSelectedLayerPath: (selectedLayerPath: string) => void;
};
