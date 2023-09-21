import { StoreApi } from 'zustand';
import OLMap from 'ol/Map';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { TypeLegendItemProps } from '../components/legend-2/types';

export interface IMapState {
  zoom?: number;
  currentCoordinates?: [number, number];
  mapLoaded: boolean;
  mapElement?: OLMap;
}

export interface IAppBarState {
  geoLocatorActive: boolean;
  // appBarButtons
}

// export interface INorthArrowState { }

// export interface INavBarState {}

// export interface INotificationsState {}

// export interface IMapDataTableState {}

// export interface ILayersState {}

// export interface IFooterState {}

export interface ILegendState {
  selectedItem?: TypeLegendItemProps;
}

export interface IGeoViewState {
  mapId: string;
  mapConfig: TypeMapFeaturesConfig | undefined;
  mapState: IMapState;
  appBarState: IAppBarState;
  legendState: ILegendState;

  isCrosshairsActive: boolean;

  setMapConfig: (config: TypeMapFeaturesConfig) => void;
  onMapLoaded: (mapElem: OLMap) => void;
}

export type GeoViewStoreType = StoreApi<IGeoViewState>;

export const geoViewStoreDefinition = (
  set: (
    partial: IGeoViewState | Partial<IGeoViewState> | ((state: IGeoViewState) => IGeoViewState | Partial<IGeoViewState>),
    replace?: boolean | undefined
  ) => void,
  get: () => IGeoViewState
) =>
  ({
    mapId: '',
    mapConfig: undefined,
    isCrosshairsActive: false,
    mapState: {
      mapLoaded: false,
    },
    appBarState: {
      geoLocatorActive: false,
    },
    legendState: {
      selectedItem: undefined,
    },

    setMapConfig: (config: TypeMapFeaturesConfig) => {
      set({ mapConfig: config, mapId: config.mapId });
    },

    onMapLoaded: (mapElem: OLMap) => {
      set({
        mapState: {
          ...get().mapState,
          mapLoaded: true,
          mapElement: mapElem,
        },
      });
    },
  } as IGeoViewState);
