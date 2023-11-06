import { TypeLegendLayer } from '../../components/layers/types';
import { TypeGetStore, TypeSetStore } from '../geoview-store';
export interface ILayerState {
    selectedItem?: TypeLegendLayer;
    selectedIsVisible: boolean;
    selectedLayers: Record<string, {
        layer: string;
        icon: string;
    }[]>;
    selectedLayerPath: string | undefined | null;
    legendLayers: TypeLegendLayer[];
    actions: {
        setSelectedLayer: (layer: TypeLegendLayer) => void;
        setSelectedLayerPath: (layerPath: string) => void;
        setLayerOpacity: (layerPath: string, opacity: number) => void;
        toggleLayerVisibility: (layerPath: string) => void;
        toggleItemVisibility: (layerPath: string, itemName: string) => void;
        setAllItemsVisibility: (layerPath: string, visibility: boolean) => void;
    };
}
export declare function initializeLayerState(set: TypeSetStore, get: TypeGetStore): {
    selectedLayerPath: null;
    legendLayers: never[];
    actions: {
        setSelectedLayerPath: (layerPath: string) => void;
        setLayerOpacity: (layerPath: string, opacity: number) => void;
        toggleLayerVisibility: (layerPath: string) => void;
        toggleItemVisibility: (layerPath: string, itemName: string) => void;
        setAllItemsVisibility: (layerPath: string, visibility: boolean) => void;
    };
};
export declare const useLayersList: () => TypeLegendLayer[];
export declare const useSelectedLayerPath: () => string | null | undefined;
export declare const useLayerStoreActions: () => {
    setSelectedLayer: (layer: TypeLegendLayer) => void;
    setSelectedLayerPath: (layerPath: string) => void;
    setLayerOpacity: (layerPath: string, opacity: number) => void;
    toggleLayerVisibility: (layerPath: string) => void;
    toggleItemVisibility: (layerPath: string, itemName: string) => void;
    setAllItemsVisibility: (layerPath: string, visibility: boolean) => void;
};
export declare const useSelectedLayer: () => TypeLegendLayer | undefined;
export declare const useIconLayerSet: (layerPath: string) => string[];
