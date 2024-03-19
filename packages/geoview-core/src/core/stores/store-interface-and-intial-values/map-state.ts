import debounce from 'lodash/debounce';

import { Map as OLMap, MapEvent, MapBrowserEvent, View } from 'ol';
import { Coordinate } from 'ol/coordinate'; // only for typing
import { ObjectEvent } from 'ol/Object'; // only for typing
import Overlay from 'ol/Overlay';
import { Extent } from 'ol/extent'; // only for Typing
import { FitOptions } from 'ol/View'; // only for typing
import TileLayer from 'ol/layer/Tile'; // only for typing
import { XYZ } from 'ol/source'; // only for typing

import { useStore } from 'zustand';
import { useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';

import { TypeBasemapOptions, TypeMapFeaturesConfig, TypeValidMapProjectionCodes } from '@/core/types/global-types';
import { TypeFeatureInfoEntry, TypeGeometry, TypeMapMouseInfo } from '@/api/events/payloads';
import { TypeInteraction, TypeHighlightColors } from '@/geo/map/map-schema-types';
import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { api } from '@/app';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { TypeClickMarker } from '@/core/components/click-marker/click-marker';

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

export interface TypeOrderedLayerInfo {
  alwaysVisible: boolean;
  hoverable?: boolean;
  layerPath: string;
  queryable?: boolean;
  removable: boolean;
  visible: boolean;
}

export interface IMapState {
  attribution: string[];
  basemapOptions: TypeBasemapOptions;
  centerCoordinates: Coordinate;
  clickCoordinates?: TypeMapMouseInfo;
  clickMarker: TypeClickMarker | undefined;
  currentProjection: TypeValidMapProjectionCodes;
  fixNorth: boolean;
  highlightColor?: TypeHighlightColors;
  highlightedFeatures: Array<TypeFeatureInfoEntry>;
  interaction: TypeInteraction;
  mapElement?: OLMap;
  mapExtent: Extent | undefined;
  mapLoaded: boolean;
  northArrow: boolean;
  northArrowElement: TypeNorthArrow;
  orderedLayerInfo: Array<TypeOrderedLayerInfo>;
  overlayClickMarker?: Overlay;
  overlayNorthMarker?: Overlay;
  overviewMap: boolean;
  overviewMapHideZoom: number;
  pointerPosition?: TypeMapMouseInfo;
  rotation: number;
  scale: TypeScaleInfo;
  size: [number, number];
  visibleLayers: string[];
  zoom: number;

  setDefaultConfigValues: (config: TypeMapFeaturesConfig) => void;

  events: {
    onMapChangeSize: (event: ObjectEvent) => void;
    onMapMoveEnd: (event: MapEvent) => void;
    onMapPointerMove: (event: MapEvent) => void;
    onMapRotation: (event: ObjectEvent) => void;
    onMapSingleClick: (event: MapEvent) => void;
    onMapZoomEnd: (event: ObjectEvent) => void;
  };

  actions: {
    addHighlightedFeature: (feature: TypeFeatureInfoEntry) => void;
    createBaseMapFromOptions: () => void;
    createEmptyBasemap: () => TileLayer<XYZ>;
    getAlwaysVisibleFromOrderedLayerInfo: (layerPath: string) => boolean;
    getIndexFromOrderedLayerInfo: (layerPath: string) => number;
    getPixelFromCoordinate: (coord: Coordinate) => [number, number];
    getRemovableFromOrderedLayerInfo: (layerPath: string) => boolean;
    getVisibilityFromOrderedLayerInfo: (layerPath: string) => boolean;
    hideClickMarker: () => void;
    highlightBBox: (extent: Extent, isLayerHighlight?: boolean) => void;
    removeHighlightedFeature: (feature: TypeFeatureInfoEntry | 'all') => void;
    reorderLayer: (layerPath: string, move: number) => void;
    setAttribution: (attribution: string[]) => void;
    setClickCoordinates: () => void;
    setFixNorth: (ifFix: boolean) => void;
    setHighlightColor: (color: TypeHighlightColors) => void;
    setHoverable: (layerPath: string, hoverable: boolean) => void;
    setInteraction: (interaction: TypeInteraction) => void;
    setMapElement: (mapElem: OLMap) => void;
    setMapKeyboardPanInteractions: (panDelta: number) => void;
    setOrderedLayerInfo: (newOrderedLayerInfo: Array<TypeOrderedLayerInfo>) => void;
    setOrToggleLayerVisibility: (layerPath: string, newValue?: boolean) => void;
    setOverlayClickMarker: (overlay: Overlay) => void;
    setOverlayClickMarkerRef: (htmlRef: HTMLElement) => void;
    setOverlayNorthMarker: (overlay: Overlay) => void;
    setOverlayNorthMarkerRef: (htmlRef: HTMLElement) => void;
    setProjection: (projectionCode: TypeValidMapProjectionCodes, view: View) => void;
    setQueryable: (layerPath: string, queryable: boolean) => void;
    setRotation: (degree: number) => void;
    setVisibleLayers: (newOrder: string[]) => void;
    setZoom: (zoom: number, duration?: number) => void;
    showClickMarker: (marker: TypeClickMarker) => void;
    transformPoints: (coords: Coordinate[], outputProjection: number) => Coordinate[];
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
    basemapOptions: { basemapId: 'transport', shaded: true, labeled: true },
    centerCoordinates: [0, 0] as Coordinate,
    clickMarker: undefined,
    currentProjection: 3857 as TypeValidMapProjectionCodes,
    fixNorth: false,
    highlightedFeatures: [],
    interaction: 'static',
    mapExtent: undefined,
    mapLoaded: false,
    northArrow: false,
    northArrowElement: { degreeRotation: '180.0', isNorthVisible: true } as TypeNorthArrow,
    orderedLayerInfo: [],
    overviewMap: false,
    overviewMapHideZoom: 0,
    pointerPosition: undefined,
    rotation: 0,
    scale: { lineWidth: '', labelGraphic: '', labelNumeric: '' } as TypeScaleInfo,
    size: [0, 0] as [number, number],
    visibleLayers: [],
    zoom: 0,

    // initialize default stores section from config information when store receive configuration file
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => {
      set({
        mapState: {
          ...get().mapState,
          basemapOptions: geoviewConfig.map.basemapOptions,
          centerCoordinates: geoviewConfig.map.viewSettings.center as Coordinate,
          currentProjection: geoviewConfig.map.viewSettings.projection as TypeValidMapProjectionCodes,
          highlightColor: geoviewConfig.map.highlightColor || 'black',
          interaction: geoviewConfig.map.interaction || 'dynamic',
          mapExtent: geoviewConfig.map.viewSettings.extent,
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
      onMapChangeSize: () => {
        set({
          mapState: {
            ...get().mapState,
            size: get().mapState.mapElement?.getSize() as unknown as [number, number],
          },
        });

        // on map size change, set the scale values... apply a timeout so it is set the first time sizew is set
        // ? this timeout is 0ms only to make the call when map change size is really done
        setTimeout(() => {
          set({
            mapState: {
              ...get().mapState,
              scale: setScale(get().mapId),
            },
          });
        }, 0);
      },
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
                lnglat: api.projection.transformPoints([coords], `EPSG:${get().mapState.currentProjection}`, `EPSG:4326`)[0],
                dragging: false,
              },
            },
          });
        }
      }, 100),
      onMapPointerMove: debounce(
        (event: MapEvent) => {
          set({
            mapState: {
              ...get().mapState,
              pointerPosition: {
                projected: (event as MapBrowserEvent<UIEvent>).coordinate,
                pixel: (event as MapBrowserEvent<UIEvent>).pixel,
                lnglat: api.projection.transformPoints(
                  [(event as MapBrowserEvent<UIEvent>).coordinate],
                  `EPSG:${get().mapState.currentProjection}`,
                  `EPSG:4326`
                )[0],
                dragging: (event as MapBrowserEvent<UIEvent>).dragging,
              },
            },
          });
        },
        10,
        { leading: true }
      ),
      onMapRotation: debounce((event: ObjectEvent) => {
        set({
          mapState: {
            ...get().mapState,
            rotation: (event.target as View).getRotation(),
          },
        });
      }, 100),
      onMapSingleClick: debounce(
        (event: MapEvent) => {
          set({
            mapState: {
              ...get().mapState,
              clickCoordinates: {
                projected: (event as MapBrowserEvent<UIEvent>).coordinate,
                pixel: (event as MapBrowserEvent<UIEvent>).pixel,
                lnglat: api.projection.transformPoints(
                  [(event as MapBrowserEvent<UIEvent>).coordinate],
                  `EPSG:${get().mapState.currentProjection}`,
                  `EPSG:4326`
                )[0],
                dragging: (event as MapBrowserEvent<UIEvent>).dragging,
              },
            },
          });
        },
        1500,
        { leading: true }
      ),
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
        if (feature.geoviewLayerType !== CONST_LAYER_TYPES.WMS) {
          set({
            mapState: {
              ...get().mapState,
              highlightedFeatures: [...get().mapState.highlightedFeatures, feature],
            },
          });
        }
      },
      createBaseMapFromOptions: () => {
        MapEventProcessor.resetBasemap(get().mapId);
      },
      createEmptyBasemap: (): TileLayer<XYZ> => {
        return MapEventProcessor.createEmptyBasemap(get().mapId);
      },
      getAlwaysVisibleFromOrderedLayerInfo: (layerPath: string): boolean => {
        const info = get().mapState.orderedLayerInfo;
        const pathInfo = info.find((item) => item.layerPath === layerPath);
        if (pathInfo) return pathInfo.alwaysVisible;
        return false;
      },
      getIndexFromOrderedLayerInfo: (layerPath: string): number => {
        const info = get().mapState.orderedLayerInfo;
        for (let i = 0; i < info.length; i++) if (info[i].layerPath === layerPath) return i;
        return -1;
      },
      getRemovableFromOrderedLayerInfo: (layerPath: string): boolean => {
        const info = get().mapState.orderedLayerInfo;
        const pathInfo = info.find((item) => item.layerPath === layerPath);
        return pathInfo!.removable;
      },
      getVisibilityFromOrderedLayerInfo: (layerPath: string): boolean => {
        const info = get().mapState.orderedLayerInfo;
        const pathInfo = info.find((item) => item.layerPath === layerPath);
        return pathInfo?.visible !== false;
      },
      getPixelFromCoordinate: (coord: Coordinate): [number, number] => {
        return get().mapState.mapElement!.getPixelFromCoordinate(coord) as unknown as [number, number];
      },
      hideClickMarker: () => {
        set({
          mapState: { ...get().mapState, clickMarker: undefined },
        });
      },
      highlightBBox: (extent: Extent, isLayerHighlight?: boolean) => {
        api.maps[get().mapId].layer.featureHighlight.highlightGeolocatorBBox(extent, isLayerHighlight);
      },
      removeHighlightedFeature: (feature: TypeFeatureInfoEntry | 'all') => {
        if (feature === 'all' || feature.geoviewLayerType !== CONST_LAYER_TYPES.WMS) {
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
        }
      },
      reorderLayer: (layerPath: string, move: number) => {
        const direction = move < 0 ? -1 : 1;
        let absoluteMoves = Math.abs(move);
        const orderedLayers = [...get().mapState.orderedLayerInfo];
        let startingIndex = -1;
        for (let i = 0; i < orderedLayers.length; i++) if (orderedLayers[i].layerPath === layerPath) startingIndex = i;
        const layerInfo = orderedLayers[startingIndex];
        const movedLayers = orderedLayers.filter((layer) => layer.layerPath.startsWith(layerPath));
        orderedLayers.splice(startingIndex, movedLayers.length);
        let nextIndex = startingIndex;
        const pathLength = layerInfo.layerPath.split('/').length;
        while (absoluteMoves > 0) {
          nextIndex += direction;
          if (nextIndex === orderedLayers.length || nextIndex === 0) {
            absoluteMoves = 0;
          } else if (orderedLayers[nextIndex].layerPath.split('/').length === pathLength) absoluteMoves--;
        }
        orderedLayers.splice(nextIndex, 0, ...movedLayers);
        get().mapState.actions.setOrderedLayerInfo(orderedLayers);
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
      setHighlightColor: (color: TypeHighlightColors) => {
        set({
          mapState: {
            ...get().mapState,
            highlightColor: color,
          },
        });
      },
      setHoverable: (layerPath: string, hoverable: boolean) => {
        const curLayerInfo = get().mapState.orderedLayerInfo;
        const layerInfo = curLayerInfo.find((info) => info.layerPath === layerPath);
        if (layerInfo) {
          layerInfo.hoverable = hoverable;
          set({
            mapState: {
              ...get().mapState,
              orderedLayerInfo: [...curLayerInfo],
            },
          });
        }
      },
      setInteraction: (interaction: TypeInteraction) => {
        set({
          mapState: {
            ...get().mapState,
            interaction,
          },
        });

        // enable or disable map interaction when type of map interaction is set
        get()
          .mapState.mapElement!.getInteractions()
          .forEach((x) => x.setActive(interaction === 'dynamic'));
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
        MapEventProcessor.setMapKeyboardPanInteractions(get().mapId, panDelta);
      },
      setOverlayClickMarker: (overlay: Overlay) => {
        set({
          mapState: {
            ...get().mapState,
            overlayClickMarker: overlay,
          },
        });
      },
      setOrderedLayerInfo: (newOrderedLayerInfo: Array<TypeOrderedLayerInfo>) => {
        set({
          mapState: {
            ...get().mapState,
            orderedLayerInfo: newOrderedLayerInfo,
          },
        });
        MapEventProcessor.setLayerZIndices(get().mapId);
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
      setProjection: (projectionCode: TypeValidMapProjectionCodes, view: View) => {
        set({
          mapState: {
            ...get().mapState,
            currentProjection: projectionCode,
          },
        });

        // set new view
        get().mapState.mapElement!.setView(view);

        // reload the basemap from new projection
        MapEventProcessor.resetBasemap(get().mapId);
      },
      setQueryable: (layerPath: string, queryable: boolean) => {
        const curLayerInfo = get().mapState.orderedLayerInfo;
        const layerInfo = curLayerInfo.find((info) => info.layerPath === layerPath);
        if (layerInfo) {
          layerInfo.queryable = queryable;
          if (queryable) layerInfo.hoverable = queryable;
          set({
            mapState: {
              ...get().mapState,
              orderedLayerInfo: [...curLayerInfo],
            },
          });
        }
      },
      setRotation: (degree: number) => {
        // set ol map rotation
        // State is set by the map state store event 'onMapRotation'
        get().mapState.mapElement!.getView().animate({ rotation: degree });
      },
      setVisibleLayers: (newOrder: string[]) => {
        set({
          mapState: {
            ...get().mapState,
            visibleLayers: newOrder,
          },
        });
      },
      setZoom: (zoom: number, duration?: number) => {
        // set ol map zoom
        // State is set by the map state store event 'onMapZoomEnd'
        get().mapState.mapElement!.getView().animate({ zoom, duration });
      },
      showClickMarker: (marker: TypeClickMarker) => {
        const projectedCoords = api.projection.transformPoints([marker.lnglat], `EPSG:4326`, `EPSG:${get().mapState.currentProjection}`);

        //! need to use state because it changes store and do action at the same time
        get().mapState.mapElement!.getOverlayById(`${get().mapId}-clickmarker`)!.setPosition(projectedCoords[0]);

        set({
          mapState: { ...get().mapState, clickMarker: { lnglat: projectedCoords[0] } },
        });
      },
      setOrToggleLayerVisibility: (layerPath: string, newValue?: boolean): void => {
        const curOrderedLayerInfo = get().mapState.orderedLayerInfo;
        const layerVisibility = get().mapState.actions.getVisibilityFromOrderedLayerInfo(layerPath);
        const layerInfos = curOrderedLayerInfo.filter((info) => info.layerPath.startsWith(layerPath));
        const parentLayerPathArray = layerPath.split('/');
        parentLayerPathArray.pop();
        const parentLayerPath = parentLayerPathArray.join('/');
        const parentLayerInfo = curOrderedLayerInfo.find((info) => info.layerPath === parentLayerPath);

        layerInfos.forEach((layerInfo) => {
          if (layerInfo && !layerInfo.alwaysVisible) {
            // eslint-disable-next-line no-param-reassign
            layerInfo!.visible = newValue || !layerVisibility;
            api.maps[get().mapId].layer.geoviewLayer(layerInfo.layerPath).setVisible(layerInfo.visible, layerInfo.layerPath);
          }
        });

        if (parentLayerInfo !== undefined) {
          const parentLayerVisibility = get().mapState.actions.getVisibilityFromOrderedLayerInfo(parentLayerPath);
          if ((!layerVisibility || newValue) && parentLayerVisibility === false) {
            if (parentLayerInfo) {
              parentLayerInfo.visible = true;
              api.maps[get().mapId].layer.geoviewLayer(parentLayerPath).setVisible(true, parentLayerPath);
            }
          }
          const children = curOrderedLayerInfo.filter(
            (info) => info.layerPath.startsWith(parentLayerPath) && info.layerPath !== parentLayerPath
          );
          if (!children.some((child) => child.visible === true)) get().mapState.actions.setOrToggleLayerVisibility(parentLayerPath, false);
        }

        set({
          mapState: {
            ...get().mapState,
            orderedLayerInfo: [...curOrderedLayerInfo],
          },
        });
      },
      transformPoints: (coords: Coordinate[], outputProjection: number): Coordinate[] => {
        return api.projection.transformPoints(coords, `EPSG:${get().mapState.currentProjection}`, `EPSG:${outputProjection}`);
      },
      zoomToExtent: (extent: Extent, options?: FitOptions): Promise<void> => {
        return MapEventProcessor.zoomToExtent(get().mapId, extent, options);
      },
      zoomToInitialExtent: (): Promise<void> => {
        return MapEventProcessor.zoomToInitialExtent(get().mapId);
      },
      zoomToGeoLocatorLocation: (coords: Coordinate, bbox?: Extent): Promise<void> => {
        return MapEventProcessor.zoomToGeoLocatorLocation(get().mapId, coords, bbox);
      },
      zoomToMyLocation: (position: GeolocationPosition): Promise<void> => {
        return MapEventProcessor.zoomToMyLocation(get().mapId, position);
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
export const useMapBasemapOptions = () => useStore(useGeoViewStore(), (state) => state.mapState.basemapOptions);
export const useMapCenterCoordinates = () => useStore(useGeoViewStore(), (state) => state.mapState.centerCoordinates);
export const useMapClickMarker = () => useStore(useGeoViewStore(), (state) => state.mapState.clickMarker);
export const useMapElement = () => useStore(useGeoViewStore(), (state) => state.mapState.mapElement);
export const useMapExtent = () => useStore(useGeoViewStore(), (state) => state.mapState.mapExtent);
export const useMapFixNorth = () => useStore(useGeoViewStore(), (state) => state.mapState.fixNorth);
export const useMapInteraction = () => useStore(useGeoViewStore(), (state) => state.mapState.interaction);
export const useMapHiglightColor = () => useStore(useGeoViewStore(), (state) => state.mapState.highlightColor);
export const useMapLoaded = () => useStore(useGeoViewStore(), (state) => state.mapState.mapLoaded);
export const useMapNorthArrow = () => useStore(useGeoViewStore(), (state) => state.mapState.northArrow);
export const useMapNorthArrowElement = () => useStore(useGeoViewStore(), (state) => state.mapState.northArrowElement);
export const useMapOrderedLayerInfo = () => useStore(useGeoViewStore(), (state) => state.mapState.orderedLayerInfo);
export const useMapOverviewMap = () => useStore(useGeoViewStore(), (state) => state.mapState.overviewMap);
export const useMapOverviewMapHideZoom = () => useStore(useGeoViewStore(), (state) => state.mapState.overviewMapHideZoom);
export const useMapPointerPosition = () => useStore(useGeoViewStore(), (state) => state.mapState.pointerPosition);
export const useMapProjection = () => useStore(useGeoViewStore(), (state) => state.mapState.currentProjection);
export const useMapRotation = () => useStore(useGeoViewStore(), (state) => state.mapState.rotation);
export const useMapScale = () => useStore(useGeoViewStore(), (state) => state.mapState.scale);
export const useMapSize = () => useStore(useGeoViewStore(), (state) => state.mapState.size);
export const useMapVisibleLayers = () => useStore(useGeoViewStore(), (state) => state.mapState.visibleLayers);
export const useMapZoom = () => useStore(useGeoViewStore(), (state) => state.mapState.zoom);

export const useMapStoreActions = () => useStore(useGeoViewStore(), (state) => state.mapState.actions);
