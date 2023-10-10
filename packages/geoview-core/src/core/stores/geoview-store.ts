import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import debounce from 'lodash/debounce';

// import OLMap from 'ol/map'; // TODO: When I use the import below instead of this one I have this TypeScript error
/*
Argument of type 'import("C:/Users/jolevesq/Sites/geoview/common/temp/node_modules/.pnpm/ol@7.5.2/node_modules/ol/Map").default' is not assignable to parameter of type 'import("C:/Users/jolevesq/Sites/geoview/common/temp/node_modules/.pnpm/ol@7.5.1/node_modules/ol/Map").default'.
  Types of property 'on' are incompatible.
*/
import { Map as OLMap, MapEvent, MapBrowserEvent } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { ObjectEvent } from 'ol/Object';
import { toLonLat } from 'ol/proj';

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
  selectedLayers: string[];
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
    interaction: 'dynamic',
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
      onMapSingleClick: (event: MapEvent) => {
        set({
          mapState: {
            ...get().mapState,
            mapClickCoordinates: {
              projected: (event as MapBrowserEvent<UIEvent>).coordinate,
              pixel: (event as MapBrowserEvent<UIEvent>).pixel,
              lnglat: toLonLat((event as MapBrowserEvent<UIEvent>).coordinate, `EPSG:${get().mapState.currentProjection}`),
              dragging: (event as MapBrowserEvent<UIEvent>).dragging,
            },
          },
        });
      },
      onMapZoomEnd: (event: ObjectEvent) => {
        set({
          mapState: {
            ...get().mapState,
            zoom: event.target.getZoom()!,
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
    legendState: {
      selectedItem: undefined,
      selectedLayers: [],
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
  } as unknown as IGeoViewState);

export const geoViewStoreDefinitionWithSubscribeSelector = subscribeWithSelector(geoViewStoreDefinition);

const fakeStore = create<IGeoViewState>()(geoViewStoreDefinitionWithSubscribeSelector);
export type GeoViewStoreType = typeof fakeStore;
