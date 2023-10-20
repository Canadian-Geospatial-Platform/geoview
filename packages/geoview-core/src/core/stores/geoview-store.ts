import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import debounce from 'lodash/debounce';
import { type MRT_ColumnFiltersState as MRTColumnFiltersState } from 'material-react-table';
// import OLMap from 'ol/map'; // TODO: When I use the import below instead of this one I have this TypeScript error
/*
Argument of type 'import("C:/Users/jolevesq/Sites/geoview/common/temp/node_modules/.pnpm/ol@7.5.2/node_modules/ol/Map").default' is not assignable to parameter of type 'import("C:/Users/jolevesq/Sites/geoview/common/temp/node_modules/.pnpm/ol@7.5.1/node_modules/ol/Map").default'.
  Types of property 'on' are incompatible.
*/
import { Map as OLMap, MapEvent, MapBrowserEvent, View } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { ObjectEvent } from 'ol/Object';
import { toLonLat } from 'ol/proj';

import { TypeMapFeaturesConfig, TypeValidMapProjectionCodes } from '@/core/types/global-types';
import { TypeLegendItemProps } from '../components/legend-2/types';

import { TypeMapMouseInfo } from '@/api/events/payloads';
import { TypeDisplayLanguage, TypeInteraction } from '@/geo/map/map-schema-types';
import { NotificationDetailsType } from '@/core/types/cgpv-types';

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

export interface INotificationsState {
  notifications: Array<NotificationDetailsType>;
}

// export interface ILayersState {}

// export interface IFooterState {}

export interface ILegendState {
  selectedItem?: TypeLegendItemProps;
  selectedIsVisible: boolean;
  selectedLayers: Record<string, { layer: string; icon: string }[]>;
}

export interface IMapDataTableState {
  selectedLayerIndex: number;
  isLoading: boolean;
  isEnlargeDataTable: boolean;

  FILTER_MAP_DELAY: number;
  toolbarRowSelectedMessage: string;
  storeColumnFilters: Record<string, MRTColumnFiltersState>;
  storeRowSelections: Record<string, Record<number, boolean>>;
  storeMapFiltered: Record<string, boolean>;

  setStoreMapFiltered: (mapFiltered: boolean, layerKey: string) => void;
  setStoreRowSelections: (rowSelection: Record<number, boolean>, layerKey: string) => void;
  setStoreColumnFilters: (filtered: MRTColumnFiltersState, layerKey: string) => void;
  setIsEnlargeDataTable: (isEnlarge: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setSelectedLayerIndex: (idx: number) => void;
  setToolbarRowSelectedMessage: (message: string) => void;
}

export interface IGeoViewState {
  displayLanguage: TypeDisplayLanguage;
  isCrosshairsActive: boolean;
  isFullScreen: boolean;
  mapId: string;
  mapConfig: TypeMapFeaturesConfig | undefined;

  appBarState: IAppBarState;
  footerBarState: IFooterBarState;
  legendState: ILegendState;
  mapState: IMapState;
  notificationState: INotificationsState;
  dataTableState: IMapDataTableState;
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
    displayLanguage: 'en',
    mapId: '',
    mapConfig: undefined,
    isCrosshairsActive: false,
    isFullScreen: false,
    mapState: {
      fixNorth: false,
      mapLoaded: false,
      mapCenterCoordinates: [0, 0] as Coordinate,
      mapRotation: 0,
      overviewMapHideZoom: 0,
      pointerPosition: undefined,
      currentProjection: 3857,
      zoom: undefined,
      onMapMoveEnd: debounce((event: MapEvent) => {
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
    },
    footerBarState: {
      expanded: false,
    },
    appBarState: {
      geoLocatorActive: false,
    },
    legendState: {
      selectedItem: undefined,
      selectedIsVisible: true,
      selectedLayers: {},
    },
    notificationState: {
      notifications: [],
    },
    dataTableState: {
      selectedLayerIndex: 0,
      isLoading: false,
      isEnlargeDataTable: false,
      mapFiltered: false,
      FILTER_MAP_DELAY: 1000,
      toolbarRowSelectedMessage: '',
      storeRowSelections: {},
      storeMapFiltered: {},
      setStoreMapFiltered: (mapFiltered: boolean, layerKey: string) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            storeMapFiltered: { ...get().dataTableState.storeMapFiltered, [layerKey]: mapFiltered },
          },
        });
      },
      setStoreRowSelections: (rowSelection: Record<number, boolean>, layerKey: string) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            storeRowSelections: { ...get().dataTableState.storeRowSelections, [layerKey]: rowSelection },
          },
        });
      },
      storeColumnFilters: {},
      setStoreColumnFilters: (filtered: MRTColumnFiltersState, layerKey: string) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            storeColumnFilters: { ...get().dataTableState.storeColumnFilters, [layerKey]: filtered },
          },
        });
      },
      setToolbarRowSelectedMessage: (message: string) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            toolbarRowSelectedMessage: message,
          },
        });
      },
      setIsEnlargeDataTable: (isEnlarge: boolean) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            isEnlargeDataTable: isEnlarge,
          },
        });
      },
      setIsLoading: (loading: boolean) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            isLoading: loading,
          },
        });
      },
      setSelectedLayerIndex: (idx: number) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            selectedLayerIndex: idx,
          },
        });
      },
    },
    setMapConfig: (config: TypeMapFeaturesConfig) => {
      set({ mapConfig: config, mapId: config.mapId, displayLanguage: config.displayLanguage });
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
