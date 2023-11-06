import debounce from 'lodash/debounce';

import { Map as OLMap, MapEvent, MapBrowserEvent, View } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { ObjectEvent } from 'ol/Object';
import { fromLonLat, toLonLat } from 'ol/proj';
import Overlay from 'ol/Overlay';
import { KeyboardPan } from 'ol/interaction';
import { Extent } from 'ol/extent';
import { FitOptions } from 'ol/View';

import { useStore } from 'zustand';
import { useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';

import { TypeValidMapProjectionCodes } from '@/core/types/global-types';
import { TypeFeatureInfoEntry, TypeMapMouseInfo } from '@/api/events/payloads';
import { TypeInteraction } from '@/geo/map/map-schema-types';
import { OL_ZOOM_DURATION, OL_ZOOM_PADDING } from '@/core/utils/constant';
import { TypeClickMarker, api } from '@/app';

interface TypeScaleInfo {
  lineWidth: string;
  labelGraphic: string;
  labelNumeric: string;
}

export interface IMapState {
  centerCoordinates: Coordinate;
  clickCoordinates: TypeMapMouseInfo | undefined;
  clickMarker: TypeClickMarker | undefined;
  currentProjection: TypeValidMapProjectionCodes;
  fixNorth: boolean;
  interaction: TypeInteraction;
  pointerPosition: TypeMapMouseInfo | undefined;
  mapElement: OLMap;
  mapLoaded: boolean;
  northArrow: boolean;
  overlayClickMarker: Overlay;
  overlayNorthMarker: Overlay;
  overviewMap: boolean;
  overviewMapHideZoom: number;
  rotation: number;
  scale: TypeScaleInfo;
  selectedFeatures: Array<TypeFeatureInfoEntry>;
  zoom: number;

  onMapMoveEnd: (event: MapEvent) => void;
  onMapPointerMove: (event: MapEvent) => void;
  onMapRotation: (event: ObjectEvent) => void;
  onMapSingleClick: (event: MapEvent) => void;
  onMapZoomEnd: (event: ObjectEvent) => void;

  actions: {
    hideClickMarker: () => void;
    setClickCoordinates: () => void;
    setFixNorth: (ifFix: boolean) => void;
    setMapElement: (mapElem: OLMap) => void;
    setMapKeyboardPanInteractions: (panDelta: number) => void;
    setOverlayClickMarker: (overlay: Overlay) => void;
    setOverlayClickMarkerRef: (htmlRef: HTMLElement) => void;
    setOverlayNorthMarker: (overlay: Overlay) => void;
    setOverlayNorthMarkerRef: (htmlRef: HTMLElement) => void;
    setRotation: (degree: number) => void;
    setZoom: (zoom: number) => void;
    showClickMarker: (marker: TypeClickMarker) => void;
    zoomToInitialExtent: () => void;
    zoomToMyLocation: (position: GeolocationPosition) => void;
  };
}

function setScale(mapId: string): TypeScaleInfo {
  const lineWidth = (document.getElementById(`${mapId}-scaleControlLine`)?.querySelector('.ol-scale-line-inner') as HTMLElement)?.style
    .width as string;
  const labelGraphic = document.getElementById(`${mapId}-scaleControlLine`)?.querySelector('.ol-scale-line-inner')?.innerHTML as string;
  const labelNumeric = document.getElementById(`${mapId}-scaleControlBar`)?.querySelector('.ol-scale-text')?.innerHTML as string;

  return { lineWidth, labelGraphic, labelNumeric };
}

export function initializeMapState(set: TypeSetStore, get: TypeGetStore) {
  const init = {
    centerCoordinates: [0, 0] as Coordinate,
    clickMarker: undefined,
    currentProjection: 3857,
    fixNorth: false,
    mapLoaded: false,
    overviewMapHideZoom: 0,
    pointerPosition: undefined,
    rotation: 0,
    scale: { lineWidth: '', labelGraphic: '', labelNumeric: '' },
    selectedFeatures: [],
    zoom: 0,

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

      // on map center coord change, hide click marker
      set({
        mapState: {
          ...get().mapState,
          clickMarker: undefined,
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
      hideClickMarker: () => {
        set({
          mapState: { ...get().mapState, clickMarker: undefined },
        });
      },
      setClickCoordinates: () => {
        set({
          mapState: {
            ...get().mapState,
            clickCoordinates: get().mapState.pointerPosition, // trigger click event from pointer position
          },
        });
      },
      setFixNorth: (isFix: boolean) => {
        set({
          mapState: {
            ...get().mapState,
            fixNorth: isFix,
          },
        });
      },
      setMapElement: (mapElem: OLMap) => {
        set({
          mapState: {
            ...get().mapState,
            mapLoaded: true,
            mapElement: mapElem,
            scale: setScale(get().mapId),
            zoom: mapElem.getView().getZoom() as number,
          },
        });
      },
      setMapKeyboardPanInteractions: (panDelta: number) => {
        const { mapElement } = get().mapState;

        // replace the KeyboardPan interraction by a new one
        // const mapElement = mapElementRef.current;
        mapElement.getInteractions().forEach((interactionItem) => {
          if (interactionItem instanceof KeyboardPan) {
            mapElement.removeInteraction(interactionItem);
          }
        });
        mapElement.addInteraction(new KeyboardPan({ pixelDelta: panDelta }));
      },
      setOverlayClickMarker: (overlay: Overlay) => {
        set({
          mapState: {
            ...get().mapState,
            overlayClickMarker: overlay,
          },
        });
      },
      setOverlayClickMarkerRef: (htmlRef: HTMLElement) => {
        const overlay = get().mapState.overlayClickMarker;
        if (overlay !== undefined) overlay.setElement(htmlRef);
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
      setRotation: (degree: number) => {
        set({
          mapState: {
            ...get().mapState,
            rotation: degree,
          },
        });

        // set ol map rotation
        get().mapState.mapElement.getView().animate({ rotation: degree });
      },
      setZoom: (zoom: number) => {
        set({
          mapState: {
            ...get().mapState,
            zoom,
          },
        });

        get().mapState.mapElement.getView().animate({ zoom, duration: OL_ZOOM_DURATION });
      },
      showClickMarker: (marker: TypeClickMarker) => {
        const projectedCoords = fromLonLat(marker.lnglat, `EPSG:${get().mapState.currentProjection}`);

        get().mapState.mapElement.getOverlayById(`${get().mapId}-clickmarker`).setPosition(projectedCoords);

        set({
          mapState: { ...get().mapState, clickMarker: { lnglat: projectedCoords } },
        });
      },
      zoomToInitialExtent: () => {
        const { center, zoom } = get().mapConfig!.map.viewSettings;
        const projectedCoords = fromLonLat(center, `EPSG:${get().mapState.currentProjection}`);
        const extent: Extent = [...projectedCoords, ...projectedCoords];
        const options: FitOptions = { padding: OL_ZOOM_PADDING, maxZoom: zoom, duration: OL_ZOOM_DURATION };

        // TODO: keep reference to geoview map instance in the store or keep accessing with api - discussion
        api.maps[get().mapId].zoomToExtent(extent, options);
      },
      zoomToMyLocation: (position: GeolocationPosition) => {
        const projectedCoords = fromLonLat(
          [position.coords.longitude, position.coords.latitude],
          `EPSG:${get().mapState.currentProjection}`
        );
        const extent: Extent = [...projectedCoords, ...projectedCoords];
        const options: FitOptions = { padding: OL_ZOOM_PADDING, maxZoom: 13, duration: OL_ZOOM_DURATION };

        // TODO: keep reference to geoview map instance in the store or keep accessing with api - discussion
        api.maps[get().mapId].zoomToExtent(extent, options);
      },
    },
  };

  return init;
}

// **********************************************************
// Map state selectors
// **********************************************************
export const useMapCenterCoordinates = () => useStore(useGeoViewStore(), (state) => state.mapState.centerCoordinates);
export const useMapClickMarker = () => useStore(useGeoViewStore(), (state) => state.mapState.clickMarker);
export const useMapProjection = () => useStore(useGeoViewStore(), (state) => state.mapState.currentProjection);
export const useMapElement = () => useStore(useGeoViewStore(), (state) => state.mapState.mapElement);
export const useMapFixNorth = () => useStore(useGeoViewStore(), (state) => state.mapState.fixNorth);
export const useMapInteraction = () => useStore(useGeoViewStore(), (state) => state.mapState.interaction);
export const useMapLoaded = () => useStore(useGeoViewStore(), (state) => state.mapState.mapLoaded);
export const useMapNorthArrow = () => useStore(useGeoViewStore(), (state) => state.mapState.northArrow);
export const useMapOverlayNorthMarker = () => useStore(useGeoViewStore(), (state) => state.mapState.overlayNorthMarker);
export const useMapOverviewMap = () => useStore(useGeoViewStore(), (state) => state.mapState.overviewMap);
export const useMapPointerPosition = () => useStore(useGeoViewStore(), (state) => state.mapState.pointerPosition);
export const useMapRotation = () => useStore(useGeoViewStore(), (state) => state.mapState.rotation);
export const useMapScale = () => useStore(useGeoViewStore(), (state) => state.mapState.scale);
export const useMapZoom = () => useStore(useGeoViewStore(), (state) => state.mapState.zoom);

export const useMapStoreActions = () => useStore(useGeoViewStore(), (state) => state.mapState.actions);
