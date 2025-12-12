import type { Extent } from 'ol/extent';
import type { TypeLayersViewDisplayState, TypeLegendItem, TypeLegendLayer } from '@/core/components/layers/types';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import type { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
import type { TypeFeatureInfoEntryPartial, TypeLayerStyleConfig, TypeResultSet, TypeResultSetEntry } from '@/api/types/map-schema-types';
import type { TimeDimension } from '@/core/utils/date-mgt';
import type { TypeGeoviewLayerType } from '@/api/types/layer-schema-types';
import type { TypeVectorLayerStyles } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
type LayerActions = ILayerState['actions'];
export interface ILayerState {
    highlightedLayer: string;
    selectedLayer: TypeLegendLayer;
    selectedLayerPath: string | undefined | null;
    legendLayers: TypeLegendLayer[];
    displayState: TypeLayersViewDisplayState;
    layerDeleteInProgress: string;
    selectedLayerSortingArrowId: string;
    layersAreLoading: boolean;
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;
    actions: {
        deleteLayer: (layerPath: string) => void;
        getExtentFromFeatures: (layerPath: string, featureIds: number[], outfield?: string) => Promise<Extent>;
        queryLayerEsriDynamic: (layerPath: string, objectIDs: number[]) => Promise<TypeFeatureInfoEntryPartial[]>;
        getLayer: (layerPath: string) => TypeLegendLayer | undefined;
        getLayerBounds: (layerPath: string) => number[] | undefined;
        getLayerDefaultFilter: (layerPath: string) => string | undefined;
        getLayerDeleteInProgress: () => string;
        getLayerServiceProjection: (layerPath: string) => string | undefined;
        getLayerTimeDimension: (layerPath: string) => TimeDimension | undefined;
        refreshLayer: (layerPath: string) => void;
        reloadLayer: (layerPath: string) => void;
        setAllItemsVisibility: (layerPath: string, visibility: boolean) => void;
        setDisplayState: (newDisplayState: TypeLayersViewDisplayState) => void;
        setHighlightLayer: (layerPath: string) => void;
        setLayerDeleteInProgress: (newVal: string) => void;
        setLayerOpacity: (layerPath: string, opacity: number, updateLegendLayers?: boolean) => void;
        setLayerHoverable: (layerPath: string, enable: boolean) => void;
        setLayerQueryable: (layerPath: string, enable: boolean) => void;
        setSelectedLayerPath: (layerPath: string) => void;
        toggleItemVisibility: (layerPath: string, item: TypeLegendItem) => void;
        zoomToLayerExtent: (layerPath: string) => Promise<void>;
        zoomToLayerVisibleScale: (layerPath: string) => void;
        setSelectedLayerSortingArrowId: (layerId: string) => void;
    };
    setterActions: {
        setDisplayState: (newDisplayState: TypeLayersViewDisplayState) => void;
        setHighlightLayer: (layerPath: string) => void;
        setLayerDeleteInProgress: (newVal: string) => void;
        setLegendLayers: (legendLayers: TypeLegendLayer[]) => void;
        setSelectedLayerPath: (layerPath: string) => void;
        setSelectedLayerSortingArrowId: (arrowId: string) => void;
        setLayersAreLoading: (areLoading: boolean) => void;
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
export type LegendQueryStatus = 'init' | 'querying' | 'queried' | 'error';
export type TypeLegend = {
    type: TypeGeoviewLayerType;
    legend: TypeVectorLayerStyles | HTMLCanvasElement | null;
    styleConfig?: TypeLayerStyleConfig | null;
};
export type TypeLegendResultSetEntry = TypeResultSetEntry & TypeLegendResultInfo;
export type TypeLegendResultSet = TypeResultSet<TypeLegendResultSetEntry>;
export declare const useLayerHighlightedLayer: () => string;
export declare const useLayerLegendLayers: () => TypeLegendLayer[];
export declare const useLayerSelectedLayer: () => TypeLegendLayer;
export declare const useLayerSelectedLayerPath: () => string | null | undefined;
export declare const useLayerDisplayState: () => TypeLayersViewDisplayState;
export declare const useLayerDeleteInProgress: () => string;
export declare const useLayerSelectedLayerSortingArrowId: () => string;
export declare const useLayerAreLayersLoading: () => boolean;
export declare const useSelectedLayer: () => TypeLegendLayer | undefined;
export declare const useLayerIconLayerSet: (layerPath: string) => string[];
export declare const useLayerSelectorId: (layerPath: string) => string | undefined;
export declare const useLayerSelectorName: (layerPath: string) => string | undefined;
export declare const useLayerSelectorStatus: (layerPath: string) => import("@/api/types/layer-schema-types").TypeLayerStatus | undefined;
export declare const useLayerSelectorType: (layerPath: string) => TypeGeoviewLayerType | undefined;
export declare const useLayerSelectorControls: (layerPath: string) => import("@/api/types/layer-schema-types").TypeLayerControls | undefined;
export declare const useLayerSelectorChildren: (layerPath: string) => TypeLegendLayer[] | undefined;
export declare const useLayerSelectorItems: (layerPath: string) => TypeLegendItem[] | undefined;
export declare const useLayerSelectorIcons: (layerPath: string) => import("@/core/components/layers/types").TypeLegendLayerItem[] | undefined;
export declare const useLayerSelectorLegendQueryStatus: (layerPath: string) => LegendQueryStatus | undefined;
export declare const useLayerStoreActions: () => LayerActions;
export {};
//# sourceMappingURL=layer-state.d.ts.map