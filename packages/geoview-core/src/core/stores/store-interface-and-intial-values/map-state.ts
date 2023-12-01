import debounce from 'lodash/debounce';

import { Map as OLMap, MapEvent, MapBrowserEvent, View } from 'ol';
import { Coordinate } from 'ol/coordinate'; // only for typing
import { ObjectEvent } from 'ol/Object';
import { fromLonLat, toLonLat } from 'ol/proj';
import Overlay from 'ol/Overlay';
import { KeyboardPan } from 'ol/interaction'; // only for Typing
import { Extent } from 'ol/extent'; // only for Typing
import { FitOptions } from 'ol/View'; // only for typing

import { useStore } from 'zustand';
import { useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';

import { TypeMapFeaturesConfig, TypeValidMapProjectionCodes } from '@/core/types/global-types';
import { TypeFeatureInfoEntry, TypeGeometry, TypeMapMouseInfo } from '@/api/events/payloads';
import { TypeInteraction } from '@/geo/map/map-schema-types';
import { TypeClickMarker, api } from '@/app';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

// #region INTERFACES
interface TypeScaleInfo {
  lineWidth: string;
  labelGraphic: string;
  labelNumeric: string;
}

export interface TypeNorthArrow {
  degreeRotation: string;
  isNorthVisible: boolean;
}

export interface IMapState {
  attribution: string[];
  centerCoordinates: Coordinate;
  clickCoordinates?: TypeMapMouseInfo;
  clickMarker: TypeClickMarker | undefined;
  currentProjection: TypeValidMapProjectionCodes;
  fixNorth: boolean;
  highlightedFeatures: Array<TypeFeatureInfoEntry>;
  interaction: TypeInteraction;
  pointerPosition?: TypeMapMouseInfo;
  mapElement?: OLMap;
  mapLoaded: boolean;
  northArrow: boolean;
  northArrowElement: TypeNorthArrow;
  overlayClickMarker?: Overlay;
  overlayNorthMarker?: Overlay;
  overviewMap: boolean;
  overviewMapHideZoom: number;
  rotation: number;
  scale: TypeScaleInfo;
  selectedFeatures: Array<TypeFeatureInfoEntry>;
  size: [number, number];
  zoom: number;

  setDefaultConfigValues: (config: TypeMapFeaturesConfig) => void;

  events: {
    onMapMoveEnd: (event: MapEvent) => void;
    onMapPointerMove: (event: MapEvent) => void;
    onMapRotation: (event: ObjectEvent) => void;
    onMapSingleClick: (event: MapEvent) => void;
    onMapZoomEnd: (event: ObjectEvent) => void;
  };

  actions: {
    addHighlightedFeature: (feature: TypeFeatureInfoEntry) => void;
    addSelectedFeature: (feature: TypeFeatureInfoEntry) => void;
    getPixelFromCoordinate: (coord: Coordinate) => [number, number];
    getSize: () => [number, number];
    hideClickMarker: () => void;
    highlightBBox: (extent: Extent) => void;
    removeHighlightedFeature: (feature: TypeFeatureInfoEntry | 'all') => void;
    removeSelectedFeature: (feature: TypeFeatureInfoEntry | 'all') => void;
    setAttribution: (attribution: string[]) => void;
    setClickCoordinates: () => void;
    setFixNorth: (ifFix: boolean) => void;
    setMapElement: (mapElem: OLMap) => void;
    setMapKeyboardPanInteractions: (panDelta: number) => void;
    setOverlayClickMarker: (overlay: Overlay) => void;
    setOverlayClickMarkerRef: (htmlRef: HTMLElement) => void;
    setOverlayNorthMarker: (overlay: Overlay) => void;
    setOverlayNorthMarkerRef: (htmlRef: HTMLElement) => void;
    setRotation: (degree: number) => void;
    setZoom: (zoom: number, duration?: number) => void;
    showClickMarker: (marker: TypeClickMarker) => void;
    zoomToExtent: (extent: Extent, options?: FitOptions) => void;
    zoomToInitialExtent: () => void;
    zoomToGeoLocatorLocation: (coords: [number, number], bbox?: [number, number, number, number]) => void;
    zoomToMyLocation: (position: GeolocationPosition) => void;
  };
}
// #endregion INTERFACES

function setScale(mapId: string): TypeScaleInfo {
  const lineWidth = (document.getElementById(`${mapId}-scaleControlLine`)?.querySelector('.ol-scale-line-inner') as HTMLElement)?.style
    .width as string;
  const labelGraphic = document.getElementById(`${mapId}-scaleControlLine`)?.querySelector('.ol-scale-line-inner')?.innerHTML as string;
  const labelNumeric = document.getElementById(`${mapId}-scaleControlBar`)?.querySelector('.ol-scale-text')?.innerHTML as string;

  return { lineWidth, labelGraphic, labelNumeric };
}

export function initializeMapState(set: TypeSetStore, get: TypeGetStore): IMapState {
  const init = {
    attribution: [],
    centerCoordinates: [0, 0] as Coordinate,
    clickMarker: undefined,
    currentProjection: 3857 as TypeValidMapProjectionCodes,
    fixNorth: false,
    highlightedFeatures: [],
    interaction: 'static',
    mapLoaded: false,
    northArrow: false,
    northArrowElement: { degreeRotation: '180.0', isNorthVisible: true } as TypeNorthArrow,
    overviewMap: false,
    overviewMapHideZoom: 0,
    pointerPosition: undefined,
    rotation: 0,
    scale: { lineWidth: '', labelGraphic: '', labelNumeric: '' } as TypeScaleInfo,
    selectedFeatures: [],
    size: [0, 0] as [number, number],
    zoom: 0,

    // initialize default stores section from config information when store receive configuration file
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => {
      set({
        mapState: {
          ...get().mapState,
          centerCoordinates: geoviewConfig.map.viewSettings.center as Coordinate,
          currentProjection: geoviewConfig.map.viewSettings.projection as TypeValidMapProjectionCodes,
          interaction: geoviewConfig.map.interaction || 'dynamic',
          northArrow: geoviewConfig.components!.indexOf('north-arrow') > -1 || false,
          overviewMap: geoviewConfig.components!.indexOf('overview-map') > -1 || false,
          overviewMapHideZoom: geoviewConfig.overviewMap !== undefined ? geoviewConfig.overviewMap.hideOnZoom : 0,
          rotation: geoviewConfig.map.viewSettings.rotation || 0,
          zoom: geoviewConfig.map.viewSettings.zoom,
        },
      });
    },

    // #region EVENTS
    events: {
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

        // on map center coord change, update north arrow parameters
        set({
          mapState: {
            ...get().mapState,
            northArrowElement: {
              degreeRotation: api.geoUtilities.getNorthArrowAngle(get().mapState.mapElement!),
              isNorthVisible: api.geoUtilities.checkNorth(get().mapState.mapElement!),
            },
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
                pixel: get().mapState.mapElement!.getPixelFromCoordinate(coords),
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
    },
    // #endregion EVENTS

    // #region ACTIONS
    actions: {
      addHighlightedFeature: (feature: TypeFeatureInfoEntry) => {
        set({
          mapState: {
            ...get().mapState,
            highlightedFeatures: [...get().mapState.highlightedFeatures, feature],
          },
        });
      },
      addSelectedFeature: (feature: TypeFeatureInfoEntry) => {
        set({
          mapState: {
            ...get().mapState,
            selectedFeatures: [...get().mapState.selectedFeatures, feature],
          },
        });
      },
      getPixelFromCoordinate: (coord: Coordinate): [number, number] => {
        return get().mapState.mapElement!.getPixelFromCoordinate(coord) as unknown as [number, number];
      },
      getSize: (): [number, number] => {
        // TODO: use store see if we can have onResize event to keep tract and do like rotate
        const size = get().mapState.mapElement?.getSize() as unknown as [number, number];
        set({
          mapState: {
            ...get().mapState,
            size,
          },
        });
        return size;
      },
      hideClickMarker: () => {
        set({
          mapState: { ...get().mapState, clickMarker: undefined },
        });
      },
      highlightBBox: (extent: Extent) => {
        api.maps[get().mapId].layer.featureHighlight.highlightGeolocatorBBox(extent);
      },
      removeHighlightedFeature: (feature: TypeFeatureInfoEntry | 'all') => {
        set({
          mapState: {
            ...get().mapState,
            highlightedFeatures:
              feature === 'all'
                ? []
                : get().mapState.highlightedFeatures.filter(
                    (featureInfoEntry: TypeFeatureInfoEntry) =>
                      (featureInfoEntry.geometry as TypeGeometry).ol_uid !== (feature.geometry as TypeGeometry).ol_uid
                  ),
          },
        });
      },
      removeSelectedFeature: (feature: TypeFeatureInfoEntry | 'all') => {
        set({
          mapState: {
            ...get().mapState,
            selectedFeatures:
              feature === 'all'
                ? []
                : get().mapState.selectedFeatures.filter(
                    (featureInfoEntry: TypeFeatureInfoEntry) =>
                      (featureInfoEntry.geometry as TypeGeometry).ol_uid !== (feature.geometry as TypeGeometry).ol_uid
                  ),
          },
        });
      },
      setAttribution: (attribution: string[]) => {
        set({
          mapState: {
            ...get().mapState,
            attribution,
          },
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
        // TODO: use store (map event processor... no set state)
        const { mapElement } = get().mapState;

        // replace the KeyboardPan interraction by a new one
        // const mapElement = mapElementRef.current;
        mapElement!.getInteractions().forEach((interactionItem) => {
          if (interactionItem instanceof KeyboardPan) {
            mapElement!.removeInteraction(interactionItem);
          }
        });
        mapElement!.addInteraction(new KeyboardPan({ pixelDelta: panDelta }));
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
        // set ol map rotation
        // State is set by the map state store event does it
        get().mapState.mapElement!.getView().animate({ rotation: degree });
      },
      setZoom: (zoom: number, duration?: number) => {
        // set ol map zoom
        // State is set by the map state store event does it
        get().mapState.mapElement!.getView().animate({ zoom, duration });
      },
      showClickMarker: (marker: TypeClickMarker) => {
        // TODO: use store use api.projections
        const projectedCoords = fromLonLat(marker.lnglat, `EPSG:${get().mapState.currentProjection}`);

        //! (need to use state because it changes store and do action at the same time)
        get().mapState.mapElement!.getOverlayById(`${get().mapId}-clickmarker`).setPosition(projectedCoords);

        set({
          mapState: { ...get().mapState, clickMarker: { lnglat: projectedCoords } },
        });
      },
      zoomToExtent: (extent: Extent, options?: FitOptions) => {
        MapEventProcessor.zoomToExtent(get().mapId, extent, options);
      },
      zoomToInitialExtent: () => {
        MapEventProcessor.zoomToInitialExtent(get().mapId);
      },
      zoomToGeoLocatorLocation: (coords: Coordinate, bbox?: Extent): void => {
        MapEventProcessor.zoomToGeoLocatorLocation(get().mapId, coords, bbox);
      },
      zoomToMyLocation: (position: GeolocationPosition) => {
        MapEventProcessor.zoomToMyLocation(get().mapId, position);
      },
      // #endregion ACTIONS
    },
  } as IMapState;

  return init;
}

// **********************************************************
// Map state selectors
// **********************************************************
export const useMapAttribution = () => useStore(useGeoViewStore(), (state) => state.mapState.attribution);
export const useMapCenterCoordinates = () => useStore(useGeoViewStore(), (state) => state.mapState.centerCoordinates);
export const useMapClickMarker = () => useStore(useGeoViewStore(), (state) => state.mapState.clickMarker);
export const useMapProjection = () => useStore(useGeoViewStore(), (state) => state.mapState.currentProjection);
export const useMapElement = () => useStore(useGeoViewStore(), (state) => state.mapState.mapElement);
export const useMapFixNorth = () => useStore(useGeoViewStore(), (state) => state.mapState.fixNorth);
export const useMapInteraction = () => useStore(useGeoViewStore(), (state) => state.mapState.interaction);
export const useMapLoaded = () => useStore(useGeoViewStore(), (state) => state.mapState.mapLoaded);
export const useMapNorthArrow = () => useStore(useGeoViewStore(), (state) => state.mapState.northArrow);
export const useMapNorthArrowElement = () => useStore(useGeoViewStore(), (state) => state.mapState.northArrowElement);
export const useMapOverviewMap = () => useStore(useGeoViewStore(), (state) => state.mapState.overviewMap);
export const useMapPointerPosition = () => useStore(useGeoViewStore(), (state) => state.mapState.pointerPosition);
export const useMapRotation = () => useStore(useGeoViewStore(), (state) => state.mapState.rotation);
export const useMapSelectedFeatures = () => useStore(useGeoViewStore(), (state) => state.mapState.selectedFeatures);
export const useMapScale = () => useStore(useGeoViewStore(), (state) => state.mapState.scale);
export const useMapZoom = () => useStore(useGeoViewStore(), (state) => state.mapState.zoom);

export const useMapStoreActions = () => useStore(useGeoViewStore(), (state) => state.mapState.actions);
