import debounce from 'lodash/debounce';

import { Map as OLMap, MapEvent, MapBrowserEvent, View } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { ObjectEvent } from 'ol/Object';
import { toLonLat } from 'ol/proj';

import { useStore } from 'zustand';
import { getGeoViewStore } from './stores-managers';

import { TypeValidMapProjectionCodes } from '@/core/types/global-types';
import { TypeMapMouseInfo } from '@/api/events/payloads';
import { TypeInteraction } from '@/geo/map/map-schema-types';

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

  actions: {
    setMapElement: (mapElem: OLMap) => void;
    setMessage: () => void;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initializeMapState(set: any, get: any) {
  const init = {
    fixNorth: false,
    mapLoaded: false,
    mapCenterCoordinates: [0, 0] as Coordinate,
    mapRotation: 0,
    overviewMapHideZoom: 0,
    pointerPosition: undefined,
    currentProjection: 3857,
    zoom: undefined,

    onMapMoveEnd: debounce((event: MapEvent) => {
      console.log(...get().state.appState.isCrosshairsActive);
      set({
        mapState: {
          ...get().mapState,
          mapCenterCoordinates: event.map.getView().getCenter()!,
        },
      });
    }, 100),
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
    onMapRotation: debounce((event: ObjectEvent) => {
      set({
        mapState: {
          ...get().mapState,
          mapRotation: (event.target as View).getRotation(),
        },
      });
    }, 100),
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
    onMapZoomEnd: debounce((event: ObjectEvent) => {
      set({
        mapState: {
          ...get().mapState,
          zoom: event.target.getZoom()!,
        },
      });
    }, 100),

    actions: {
      setMapElement: (mapElem: OLMap) => {
        set({
          mapState: {
            ...get().mapState,
            mapLoaded: true,
            mapElement: mapElem,
          },
        });
      },
      setMessage: () => {
        console.log('message');
      },
    },
  };

  return init;
}

// **********************************************************
// Map state selectors
// **********************************************************
export const useMapElement = (mapId: string) => useStore(getGeoViewStore(mapId), (state) => state.mapState.mapElement);
export const useMapInteraction = (mapId: string) => useStore(getGeoViewStore(mapId), (state) => state.mapState.interaction);
export const useMapPointerPosition = (mapId: string) => useStore(getGeoViewStore(mapId), (state) => state.mapState.pointerPosition);

export const useMapStoreActions = (mapId: string) => useStore(getGeoViewStore(mapId), (state) => state.mapState.actions);
