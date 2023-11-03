import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { type MRT_ColumnFiltersState as MRTColumnFiltersState } from 'material-react-table';

import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { TypeArrayOfLayerData } from '@/core/components/details/details';

import { TypeDisplayLanguage } from '@/geo/map/map-schema-types';
import { ILayerState, initializeLayerState } from './layer-state';

import { IMapState, initializeMapState } from './store-interface-and-intial-values/map-state';
import { IUIState, initializeUIState } from './store-interface-and-intial-values/ui-state';
import { IAppState, initializeAppState } from './store-interface-and-intial-values/app-state';

// export interface IFooterState {}

export type TypeSetStore = (
  partial: IGeoViewState | Partial<IGeoViewState> | ((state: IGeoViewState) => IGeoViewState | Partial<IGeoViewState>),
  replace?: boolean | undefined
) => void;
export type TypeGetStore = () => IGeoViewState;

export interface IMapDataTableState {
  selectedLayerIndex: number;
  isEnlargeDataTable: boolean;

  FILTER_MAP_DELAY: number;
  toolbarRowSelectedMessage: Record<string, string>;
  columnFiltersMap: Record<string, MRTColumnFiltersState>;
  rowSelectionsMap: Record<string, Record<number, boolean>>;
  mapFilteredMap: Record<string, boolean>;
  rowsFilteredMap: Record<string, number>;
  setRowsFilteredMap: (rows: number, layerKey: string) => void;
  setMapFilteredMap: (mapFiltered: boolean, layerKey: string) => void;
  setRowSelectionsMap: (rowSelection: Record<number, boolean>, layerKey: string) => void;
  setColumnFiltersMap: (filtered: MRTColumnFiltersState, layerKey: string) => void;
  setIsEnlargeDataTable: (isEnlarge: boolean) => void;
  setSelectedLayerIndex: (idx: number) => void;
  setToolbarRowSelectedMessage: (message: string, layerKey: string) => void;
}

export interface IDetailsState {
  layerDataArray: TypeArrayOfLayerData;
  selectedLayerPath: string;
}

export interface IGeoViewState {
  displayLanguage: TypeDisplayLanguage;
  mapId: string;
  mapConfig: TypeMapFeaturesConfig | undefined;
  setMapConfig: (config: TypeMapFeaturesConfig) => void;
  appState: IAppState;
  legendState: ILayerState;
  mapState: IMapState;
  uiState: IUIState;
  detailsState: IDetailsState;
  dataTableState: IMapDataTableState;
}

export const geoViewStoreDefinition = (set: TypeSetStore, get: TypeGetStore) =>
  ({
    displayLanguage: 'en',
    mapId: '',
    mapConfig: undefined,
    setMapConfig: (config: TypeMapFeaturesConfig) => {
      set({ mapConfig: config, mapId: config.mapId, displayLanguage: config.displayLanguage });
    },
    appState: initializeAppState(set, get),
    mapState: initializeMapState(set, get),
    uiState: initializeUIState(set, get),
    legendState: initializeLayerState(set, get),
    detailsState: {
      layerDataArray: [],
      selectedLayerPath: '',
    },
    dataTableState: {
      selectedLayerIndex: 0,
      isEnlargeDataTable: false,
      mapFiltered: false,
      FILTER_MAP_DELAY: 1000,
      toolbarRowSelectedMessage: {},
      rowSelectionsMap: {},
      mapFilteredMap: {},
      columnFiltersMap: {},
      rowsFilteredMap: {},
      setRowsFilteredMap: (rows: number, layerKey: string) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            rowsFilteredMap: { ...get().dataTableState.rowsFilteredMap, [layerKey]: rows },
          },
        });
      },
      setMapFilteredMap: (mapFiltered: boolean, layerKey: string) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            mapFilteredMap: { ...get().dataTableState.mapFilteredMap, [layerKey]: mapFiltered },
          },
        });
      },
      setRowSelectionsMap: (rowSelection: Record<number, boolean>, layerKey: string) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            rowSelectionsMap: { ...get().dataTableState.rowSelectionsMap, [layerKey]: rowSelection },
          },
        });
      },

      setColumnFiltersMap: (filtered: MRTColumnFiltersState, layerKey: string) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            columnFiltersMap: { ...get().dataTableState.columnFiltersMap, [layerKey]: filtered },
          },
        });
      },
      setToolbarRowSelectedMessage: (message: string, layerKey: string) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            toolbarRowSelectedMessage: { ...get().dataTableState.toolbarRowSelectedMessage, [layerKey]: message },
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
      setSelectedLayerIndex: (idx: number) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            selectedLayerIndex: idx,
          },
        });
      },
    },
  } as unknown as IGeoViewState);

export const geoViewStoreDefinitionWithSubscribeSelector = subscribeWithSelector(geoViewStoreDefinition);

const fakeStore = create<IGeoViewState>()(geoViewStoreDefinitionWithSubscribeSelector);
export type GeoViewStoreType = typeof fakeStore;
