import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { TypeMapFeaturesConfig } from '@/core/types/global-types';

import { TypeDisplayLanguage } from '@/geo/map/map-schema-types';
import { ILayerState, initializeLayerState } from './store-interface-and-intial-values/layer-state';

import { IMapState, initializeMapState } from './store-interface-and-intial-values/map-state';
import { IUIState, initializeUIState } from './store-interface-and-intial-values/ui-state';
import { IAppState, initializeAppState } from './store-interface-and-intial-values/app-state';
import { TypeLegendResultSets } from '@/api/events/payloads/get-legends-payload';
import { TypeFeatureInfoResultSets } from '@/api/events/payloads/get-feature-info-payload';
import { IDetailsState, initialDetailsState } from './store-interface-and-intial-values/details-state';
import { IMapDataTableState, initialDataTableState } from './store-interface-and-intial-values/data-table-state';

// export interface ILayersState {}

// export interface IFooterState {}

export type TypeSetStore = (
  partial: IGeoViewState | Partial<IGeoViewState> | ((state: IGeoViewState) => IGeoViewState | Partial<IGeoViewState>),
  replace?: boolean | undefined
) => void;
export type TypeGetStore = () => IGeoViewState;

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
  featureInfoResultSets: TypeFeatureInfoResultSets;
  legendResultSets: TypeLegendResultSets;
}

export const geoViewStoreDefinition = (set: TypeSetStore, get: TypeGetStore) =>
  ({
    displayLanguage: 'en' as TypeDisplayLanguage,
    mapId: '',
    mapConfig: undefined,
    setMapConfig: (config: TypeMapFeaturesConfig) => {
      set({ mapConfig: config, mapId: config.mapId, displayLanguage: config.displayLanguage });
    },
    appState: initializeAppState(set, get),
    legendState: initializeLayerState(set, get),
    mapState: initializeMapState(set, get),
    uiState: initializeUIState(set, get),
    detailsState: initialDetailsState(set, get),
    dataTableState: initialDataTableState(set, get),
    featureInfoResultSets: {} as TypeFeatureInfoResultSets,
    legendResultSets: {} as TypeLegendResultSets,
  } as IGeoViewState);

export const geoViewStoreDefinitionWithSubscribeSelector = subscribeWithSelector(geoViewStoreDefinition);

const fakeStore = create<IGeoViewState>()(geoViewStoreDefinitionWithSubscribeSelector);
export type GeoViewStoreType = typeof fakeStore;
