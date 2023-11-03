import debounce from 'lodash/debounce';

import { Map as OLMap, MapEvent, MapBrowserEvent, View } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { ObjectEvent } from 'ol/Object';
import { toLonLat } from 'ol/proj';
import Overlay from 'ol/Overlay';

import { useStore } from 'zustand';
import { useGeoViewStore } from '../stores-managers';

import { TypeValidMapProjectionCodes } from '@/core/types/global-types';
import { TypeMapMouseInfo } from '@/api/events/payloads';
import { TypeInteraction } from '@/geo/map/map-schema-types';

interface TypeScaleInfo {
  lineWidth: string;
  labelGraphic: string;
  labelNumeric: string;
}

export interface IMapState {
  centerCoordinates: Coordinate;
  clickCoordinates: TypeMapMouseInfo | undefined;
  currentProjection: TypeValidMapProjectionCodes;
  fixNorth: boolean;
  interaction: TypeInteraction;
  pointerPosition: TypeMapMouseInfo | undefined;
  mapElement: OLMap;
  mapLoaded: boolean;
  northArrow: boolean;
  overlayNorthMarker: Overlay;
  overviewMap: boolean;
  overviewMapHideZoom: number;
  rotation: number;
  scale: TypeScaleInfo;
  zoom?: number | undefined;

  onMapMoveEnd: (event: MapEvent) => void;
  onMapPointerMove: (event: MapEvent) => void;
  onMapRotation: (event: ObjectEvent) => void;
  onMapSingleClick: (event: MapEvent) => void;
  onMapZoomEnd: (event: ObjectEvent) => void;

  actions: {
    setMapElement: (mapElem: OLMap) => void;
    setOverlayNorthMarker: (overlay: Overlay) => void;
    setOverlayNorthMarkerRef: (htmlRef: HTMLElement) => void;
  };
}

function setScale(mapId: string): TypeScaleInfo {
  const lineWidth = (document.getElementById(`${mapId}-scaleControlLine`)?.querySelector('.ol-scale-line-inner') as HTMLElement)?.style
    .width as string;
  const labelGraphic = document.getElementById(`${mapId}-scaleControlLine`)?.querySelector('.ol-scale-line-inner')?.innerHTML as string;
  const labelNumeric = document.getElementById(`${mapId}-scaleControlBar`)?.querySelector('.ol-scale-text')?.innerHTML as string;

  return { lineWidth, labelGraphic, labelNumeric };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initializeMapState(set: any, get: any) {
  const init = {
    centerCoordinates: [0, 0] as Coordinate,
    currentProjection: 3857,
    fixNorth: false,
    mapLoaded: false,
    overviewMapHideZoom: 0,
    pointerPosition: undefined,
    rotation: 0,
    scale: { lineWidth: '', labelGraphic: '', labelNumeric: '' },
    zoom: undefined,

    onMapMoveEnd: debounce((event: MapEvent) => {
      const coords = event.map.getView().getCenter()!;
      set({
        mapState: {
          ...get().mapState,
          centerCoordinates: coords,
        },
      });

      // on map center coord change, set the scale values
      set({
        mapState: {
          ...get().mapState,
          scale: setScale(get().mapId),
        },
      });

      // if crosshair is active and user use keyboard, update pointer position
      // this will enable mouse position and hover tooltip
      if (get().appState.isCrosshairsActive) {
        set({
          mapState: {
            ...get().mapState,
            pointerPosition: {
              projected: coords,
              pixel: get().mapState.mapElement.getPixelFromCoordinate(coords),
              lnglat: toLonLat(coords, `EPSG:${get().mapState.currentProjection}`),
              dragging: false,
            },
          },
        });
      }
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
          rotation: (event.target as View).getRotation(),
        },
      });
    }, 100),
    onMapSingleClick: (event: MapEvent) => {
      set({
        mapState: {
          ...get().mapState,
          clickCoordinates: {
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
            scale: setScale(get().mapId),
            zoom: mapElem.getView().getZoom(),
          },
        });
      },
      setOverlayNorthMarker: (overlay: Overlay) => {
        set({
          mapState: {
            ...get().mapState,
            overlayNorthMarker: overlay,
          },
        });
      },
      setOverlayNorthMarkerRef: (htmlRef: HTMLElement) => {
        const overlay = get().mapState.overlayNorthMarker;
        if (overlay !== undefined) overlay.setElement(htmlRef);
      },
    },
  };

  return init;
}

// **********************************************************
// Map state selectors
// **********************************************************
export const useMapCenterCoordinates = () => useStore(useGeoViewStore(), (state) => state.mapState.centerCoordinates);
export const useMapProjection = () => useStore(useGeoViewStore(), (state) => state.mapState.currentProjection);
export const useMapElement = () => useStore(useGeoViewStore(), (state) => state.mapState.mapElement);
export const useMapInteraction = () => useStore(useGeoViewStore(), (state) => state.mapState.interaction);
export const useMapOverlayNorthMarker = () => useStore(useGeoViewStore(), (state) => state.mapState.overlayNorthMarker);
export const useMapPointerPosition = () => useStore(useGeoViewStore(), (state) => state.mapState.pointerPosition);
export const useMapScale = () => useStore(useGeoViewStore(), (state) => state.mapState.scale);

export const useMapStoreActions = () => useStore(useGeoViewStore(), (state) => state.mapState.actions);
