import { Map as OLMap, MapEvent } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { ObjectEvent } from 'ol/Object';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { TypeLegendItemProps } from '../components/legend-2/types';
import { TypeMapMouseInfo } from '@/api/events/payloads';
import { TypeInteraction } from '@/geo/map/map-schema-types';
export interface IMapState {
    currentProjection: number;
    pointerPosition: TypeMapMouseInfo | undefined;
    mapCenterCoordinates: Coordinate;
    mapClickCoordinates: TypeMapMouseInfo | undefined;
    mapElement?: OLMap;
    mapLoaded: boolean;
    zoom?: number | undefined;
    onMapMoveEnd: (event: MapEvent) => void;
    onMapPointerMove: (event: MapEvent) => void;
    onMapSingleClick: (event: MapEvent) => void;
    onMapZoomEnd: (event: ObjectEvent) => void;
}
export interface IFooterBarState {
    expanded: boolean;
}
export interface IAppBarState {
    geoLocatorActive: boolean;
}
export interface ILegendState {
    selectedItem?: TypeLegendItemProps;
}
export interface IGeoViewState {
    mapId: string;
    mapConfig: TypeMapFeaturesConfig | undefined;
    interaction: TypeInteraction;
    mapState: IMapState;
    footerBarState: IFooterBarState;
    appBarState: IAppBarState;
    legendState: ILegendState;
    isCrosshairsActive: boolean;
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
