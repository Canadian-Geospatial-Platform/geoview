import { StoreApi } from 'zustand';

// import OLMap from 'ol/map'; // TODO: When I use the import below instead of this one I have this TypeScript error
/*
Argument of type 'import("C:/Users/jolevesq/Sites/geoview/common/temp/node_modules/.pnpm/ol@7.5.2/node_modules/ol/Map").default' is not assignable to parameter of type 'import("C:/Users/jolevesq/Sites/geoview/common/temp/node_modules/.pnpm/ol@7.5.1/node_modules/ol/Map").default'.
  Types of property 'on' are incompatible.
*/
import { Map as OLMap, MapEvent } from 'ol';
import { Coordinate } from 'ol/coordinate';

import { TypeMapFeaturesConfig } from '@/core/types/global-types';

export interface IMapState {
  zoom?: number;
  currentCoordinates?: [number, number];
  currentMapCenterCoordinates: Coordinate;
  mapLoaded: boolean;
  mapElement?: OLMap;

  onMapMoveEnd: (event: MapEvent) => void;
}

export interface IFooterBarState {
  expanded: boolean;
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

// export interface ILegendState {}

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
      currentMapCenterCoordinates: [0, 0] as Coordinate,
      onMapMoveEnd: (event: MapEvent) => {
        set({
          mapState: {
            ...get().mapState,
            currentMapCenterCoordinates: event.map.getView().getCenter()!,
          },
        });
      },
    },
    footerBarState: {
      expanded: false,
    },
    appBarState: {
      geoLocatorActive: false,
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
