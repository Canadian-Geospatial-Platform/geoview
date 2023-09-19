import { StoreApi } from 'zustand';
import OLMap from 'ol/Map';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
export interface IMapState {
    zoom?: number;
    currentCoordinates?: [number, number];
    mapLoaded: boolean;
    mapElement?: OLMap;
}
export interface IAppBarState {
    geoLocatorActive: boolean;
}
export interface IGeoViewState {
    mapId: string;
    mapConfig: TypeMapFeaturesConfig | undefined;
    mapState: IMapState;
    appBarState: IAppBarState;
    isCrosshairsActive: boolean;
    setMapConfig: (config: TypeMapFeaturesConfig) => void;
    onMapLoaded: (mapElem: OLMap) => void;
}
export type GeoViewStoreType = StoreApi<IGeoViewState>;
export declare const geoViewStoreDefinition: (set: (partial: IGeoViewState | Partial<IGeoViewState> | ((state: IGeoViewState) => IGeoViewState | Partial<IGeoViewState>), replace?: boolean | undefined) => void, get: () => IGeoViewState) => IGeoViewState;
