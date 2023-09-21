import { StoreApi } from 'zustand';

import debounce from 'lodash/debounce';

// import OLMap from 'ol/map'; // TODO: When I use the import below instead of this one I have this TypeScript error
/*
Argument of type 'import("C:/Users/jolevesq/Sites/geoview/common/temp/node_modules/.pnpm/ol@7.5.2/node_modules/ol/Map").default' is not assignable to parameter of type 'import("C:/Users/jolevesq/Sites/geoview/common/temp/node_modules/.pnpm/ol@7.5.1/node_modules/ol/Map").default'.
  Types of property 'on' are incompatible.
*/
import { Map as OLMap, MapEvent, MapBrowserEvent } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { toLonLat } from 'ol/proj';

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
      mapCenterCoordinates: [0, 0] as Coordinate,
      pointerPosition: undefined,
      currentProjection: 3857,
      onMapMoveEnd: (event: MapEvent) => {
        set({
          mapState: {
            ...get().mapState,
            mapCenterCoordinates: event.map.getView().getCenter()!,
          },
        });
      },
      onMapPointerMove: debounce((event: MapEvent) => {
        set({
          mapState: {
            ...get().mapState,
            pointerPosition: {
              projected: (event as MapBrowserEvent<UIEvent>).coordinate,
              pixel: (event as MapBrowserEvent<UIEvent>).pixel,
              lnglat: toLonLat((event as MapBrowserEvent<UIEvent>).coordinate, `EPSG:${get().mapState.currentProjection}`),
              dragging: (event as MapBrowserEvent<UIEvent>).dragging,
            },
          },
        });
      }, 10),
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
