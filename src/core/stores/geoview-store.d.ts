import { type MRT_ColumnFiltersState as MRTColumnFiltersState } from 'material-react-table';
import { Map as OLMap, MapEvent } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { ObjectEvent } from 'ol/Object';
import { TypeMapFeaturesConfig, TypeValidMapProjectionCodes } from '@/core/types/global-types';
import { TypeArrayOfLayerData } from '@/core/components/details/details';
import { TypeLegendItemProps, TypeLegendLayer } from '@/core/components/layers/types';
import { TypeMapMouseInfo } from '@/api/events/payloads';
import { TypeDisplayLanguage, TypeInteraction } from '@/geo/map/map-schema-types';
import { NotificationDetailsType } from '@/core/types/cgpv-types';
export interface IMapState {
    currentProjection: TypeValidMapProjectionCodes;
    fixNorth: boolean;
    interaction: TypeInteraction;
    pointerPosition: TypeMapMouseInfo | undefined;
    mapCenterCoordinates: Coordinate;
    mapClickCoordinates: TypeMapMouseInfo | undefined;
    mapElement: OLMap;
    mapLoaded: boolean;
    mapRotation: number;
    northArrow: boolean;
    overviewMap: boolean;
    overviewMapHideZoom: number;
    zoom?: number | undefined;
    onMapMoveEnd: (event: MapEvent) => void;
    onMapPointerMove: (event: MapEvent) => void;
    onMapRotation: (event: ObjectEvent) => void;
    onMapSingleClick: (event: MapEvent) => void;
    onMapZoomEnd: (event: ObjectEvent) => void;
}
export interface IFooterBarState {
    expanded: boolean;
}
export interface IAppBarState {
    geoLocatorActive: boolean;
}
export interface INotificationsState {
    notifications: Array<NotificationDetailsType>;
}
export interface ILegendState {
    selectedItem?: TypeLegendItemProps;
    selectedIsVisible: boolean;
    selectedLayers: Record<string, {
        layer: string;
        icon: string;
    }[]>;
    currentRightPanelDisplay: 'overview' | 'layer-details' | 'none';
    legendLayers: TypeLegendLayer[];
}
export interface IMapDataTableState {
    selectedLayerIndex: number;
    isLoading: boolean;
    isEnlargeDataTable: boolean;
    FILTER_MAP_DELAY: number;
    toolbarRowSelectedMessage: string;
    storeColumnFilters: Record<string, MRTColumnFiltersState>;
    storeRowSelections: Record<string, Record<number, boolean>>;
    storeMapFiltered: Record<string, boolean>;
    setStoreMapFiltered: (mapFiltered: boolean, layerKey: string) => void;
    setStoreRowSelections: (rowSelection: Record<number, boolean>, layerKey: string) => void;
    setStoreColumnFilters: (filtered: MRTColumnFiltersState, layerKey: string) => void;
    setIsEnlargeDataTable: (isEnlarge: boolean) => void;
    setIsLoading: (loading: boolean) => void;
    setSelectedLayerIndex: (idx: number) => void;
    setToolbarRowSelectedMessage: (message: string) => void;
}
export interface IDetailsState {
    layerDataArray: TypeArrayOfLayerData;
    selectedLayerPath: string;
}
export interface IGeoViewState {
    displayLanguage: TypeDisplayLanguage;
    isCrosshairsActive: boolean;
    isFullScreen: boolean;
    mapId: string;
    mapConfig: TypeMapFeaturesConfig | undefined;
    appBarState: IAppBarState;
    footerBarState: IFooterBarState;
    legendState: ILegendState;
    mapState: IMapState;
    notificationState: INotificationsState;
    detailsState: IDetailsState;
    dataTableState: IMapDataTableState;
    setMapConfig: (config: TypeMapFeaturesConfig) => void;
    onMapLoaded: (mapElem: OLMap) => void;
}
export declare const geoViewStoreDefinition: (set: (partial: IGeoViewState | Partial<IGeoViewState> | ((state: IGeoViewState) => IGeoViewState | Partial<IGeoViewState>), replace?: boolean | undefined) => void, get: () => IGeoViewState) => IGeoViewState;
export declare const geoViewStoreDefinitionWithSubscribeSelector: import("zustand").StateCreator<IGeoViewState, [], [["zustand/subscribeWithSelector", never]], IGeoViewState>;
declare const fakeStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<IGeoViewState>, "subscribe"> & {
    subscribe: {
        (listener: (selectedState: IGeoViewState, previousSelectedState: IGeoViewState) => void): () => void;
        <U>(selector: (state: IGeoViewState) => U, listener: (selectedState: U, previousSelectedState: U) => void, options?: {
            equalityFn?: ((a: U, b: U) => boolean) | undefined;
            fireImmediately?: boolean | undefined;
        } | undefined): () => void;
    };
}>;
export type GeoViewStoreType = typeof fakeStore;
export {};
