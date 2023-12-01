import { TypeLayersViewDisplayState, TypeLegendLayer } from '@/core/components/layers/types';
import { TypeGetStore, TypeSetStore } from '../geoview-store';
import { TypeStyleGeometry } from '@/geo/map/map-schema-types';
export interface ILayerState {
    highlightedLayer: string;
    selectedItem?: TypeLegendLayer;
    selectedIsVisible: boolean;
    selectedLayers: Record<string, {
        layer: string;
        icon: string;
    }[]>;
    selectedLayerPath: string | undefined | null;
    legendLayers: TypeLegendLayer[];
    displayState: TypeLayersViewDisplayState;
    actions: {
        getLayer: (layerPath: string) => TypeLegendLayer | undefined;
        setDisplayState: (newDisplayState: TypeLayersViewDisplayState) => void;
        setHighlightLayer: (layerPath: string) => void;
        setSelectedLayerPath: (layerPath: string) => void;
        setLayerOpacity: (layerPath: string, opacity: number) => void;
        toggleLayerVisibility: (layerPath: string) => void;
        toggleItemVisibility: (layerPath: string, geometryType: TypeStyleGeometry, itemName: string) => void;
        setAllItemsVisibility: (layerPath: string, visibility: 'yes' | 'no') => void;
        deleteLayer: (layerPath: string) => void;
        zoomToLayerExtent: (layerPath: string) => void;
    };
}
export declare function initializeLayerState(set: TypeSetStore, get: TypeGetStore): ILayerState;
export declare const useLayerHighlightedLayer: () => string;
export declare const useLayersList: () => TypeLegendLayer[];
export declare const useSelectedLayerPath: () => string | null | undefined;
export declare const useLayersDisplayState: () => TypeLayersViewDisplayState;
export declare const useLayerStoreActions: () => {
    getLayer: (layerPath: string) => TypeLegendLayer | undefined;
    setDisplayState: (newDisplayState: TypeLayersViewDisplayState) => void;
    setHighlightLayer: (layerPath: string) => void;
    setSelectedLayerPath: (layerPath: string) => void;
    setLayerOpacity: (layerPath: string, opacity: number) => void;
    toggleLayerVisibility: (layerPath: string) => void;
    toggleItemVisibility: (layerPath: string, geometryType: TypeStyleGeometry, itemName: string) => void;
    setAllItemsVisibility: (layerPath: string, visibility: 'yes' | 'no') => void;
    deleteLayer: (layerPath: string) => void;
    zoomToLayerExtent: (layerPath: string) => void;
};
export declare const useSelectedLayer: () => TypeLegendLayer | undefined;
export declare const useIconLayerSet: (layerPath: string) => string[];
