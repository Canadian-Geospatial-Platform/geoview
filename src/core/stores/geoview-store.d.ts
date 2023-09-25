import { StoreApi } from 'zustand';
import { Map as OLMap, MapEvent } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { TypeMapMouseInfo } from '@/api/events/payloads';
export interface IMapState {
    zoom?: number;
    mapCenterCoordinates: Coordinate;
    pointerPosition: TypeMapMouseInfo | undefined;
    currentProjection: number;
    mapLoaded: boolean;
    mapElement?: OLMap;
    onMapMoveEnd: (event: MapEvent) => void;
    onMapPointerMove: (event: MapEvent) => void;
}
export interface IFooterBarState {
    expanded: boolean;
}
export interface IAppBarState {
    geoLocatorActive: boolean;
}
export interface IGeoViewState {
    mapId: string;
    mapConfig: TypeMapFeaturesConfig | undefined;
    mapState: IMapState;
    footerBarState: IFooterBarState;
    appBarState: IAppBarState;
    isCrosshairsActive: boolean;
    setMapConfig: (config: TypeMapFeaturesConfig) => void;
    onMapLoaded: (mapElem: OLMap) => void;
}
export type GeoViewStoreType = StoreApi<IGeoViewState>;
export declare const geoViewStoreDefinition: (set: (partial: IGeoViewState | Partial<IGeoViewState> | ((state: IGeoViewState) => IGeoViewState | Partial<IGeoViewState>), replace?: boolean | undefined) => void, get: () => IGeoViewState) => IGeoViewState;
