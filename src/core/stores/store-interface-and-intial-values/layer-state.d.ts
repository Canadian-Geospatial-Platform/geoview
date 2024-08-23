import { Extent } from 'ol/extent';
import { TypeLayersViewDisplayState, TypeLegendItem, TypeLegendLayer } from '@/core/components/layers/types';
import { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
import { TypeResultSet, TypeResultSetEntry, TypeStyleConfig } from '@/geo/map/map-schema-types';
import { TypeGeoviewLayerType, TypeVectorLayerStyles } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
type LayerActions = ILayerState['actions'];
export interface ILayerState {
    highlightedLayer: string;
    selectedLayer: TypeLegendLayer;
    selectedLayerPath: string | undefined | null;
    legendLayers: TypeLegendLayer[];
    displayState: TypeLayersViewDisplayState;
    layerDeleteInProgress: boolean;
    selectedLayerSortingArrowId: string;
    actions: {
        deleteLayer: (layerPath: string) => void;
        getExtentFromFeatures: (layerPath: string, featureIds: string[]) => Promise<Extent | undefined>;
        getLayer: (layerPath: string) => TypeLegendLayer | undefined;
        getLayerBounds: (layerPath: string) => number[] | undefined;
        getLayerDeleteInProgress: () => boolean;
        refreshLayer: (layerPath: string) => void;
        setAllItemsVisibility: (layerPath: string, visibility: boolean) => void;
        setDisplayState: (newDisplayState: TypeLayersViewDisplayState) => void;
        setHighlightLayer: (layerPath: string) => void;
        setLayerDeleteInProgress: (newVal: boolean) => void;
        setLayerOpacity: (layerPath: string, opacity: number) => void;
        setSelectedLayerPath: (layerPath: string) => void;
        toggleItemVisibility: (layerPath: string, item: TypeLegendItem) => void;
        zoomToLayerExtent: (layerPath: string) => Promise<void>;
        setSelectedLayerSortingArrowId: (layerId: string) => void;
    };
    setterActions: {
        setDisplayState: (newDisplayState: TypeLayersViewDisplayState) => void;
        setHighlightLayer: (layerPath: string) => void;
        setLayerDeleteInProgress: (newVal: boolean) => void;
        setLegendLayers: (legendLayers: TypeLegendLayer[]) => void;
        setSelectedLayerPath: (layerPath: string) => void;
        setSelectedLayerSortingArrowId: (arrowId: string) => void;
    };
}
/**
 * Initializes a Layer State and provide functions which use the get/set Zustand mechanisms.
 * @param {TypeSetStore} set - The setter callback to be used by this state
 * @param {TypeGetStore} get - The getter callback to be used by this state
 * @returns The initialized Layer State
 */
export declare function initializeLayerState(set: TypeSetStore, get: TypeGetStore): ILayerState;
export type TypeLegendResultInfo = {
    legendQueryStatus: LegendQueryStatus;
    data: TypeLegend | undefined | null;
};
export type LegendQueryStatus = 'init' | 'querying' | 'queried';
export type TypeLegend = {
    type: TypeGeoviewLayerType;
    styleConfig?: TypeStyleConfig | null;
    legend: TypeVectorLayerStyles | HTMLCanvasElement | null;
};
export type TypeLegendResultSetEntry = TypeResultSetEntry & TypeLegendResultInfo;
export type TypeLegendResultSet = TypeResultSet<TypeLegendResultSetEntry>;
export declare const useLayerHighlightedLayer: () => string;
export declare const useLayerLegendLayers: () => TypeLegendLayer[];
export declare const useLayerSelectedLayer: () => TypeLegendLayer;
export declare const useLayerSelectedLayerPath: () => string | null | undefined;
export declare const useLayerDisplayState: () => TypeLayersViewDisplayState;
export declare const useSelectedLayerSortingArrowId: () => string;
export declare const useLayerStoreActions: () => LayerActions;
export declare const useSelectedLayer: () => TypeLegendLayer | undefined;
export declare const useIconLayerSet: (layerPath: string) => string[];
export {};
