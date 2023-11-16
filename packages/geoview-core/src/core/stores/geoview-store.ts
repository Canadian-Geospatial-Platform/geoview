import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { IAppState, initializeAppState } from './store-interface-and-intial-values/app-state';
import { IDetailsState, initialDetailsState } from './store-interface-and-intial-values/details-state';
import { ILayerState, initializeLayerState } from './store-interface-and-intial-values/layer-state';
import { IMapState, initializeMapState } from './store-interface-and-intial-values/map-state';
import { IMapDataTableState, initialDataTableState } from './store-interface-and-intial-values/data-table-state';
import { IUIState, initializeUIState } from './store-interface-and-intial-values/ui-state';

import { TypeDisplayLanguage } from '@/geo/map/map-schema-types';
import { TypeLegendResultSets } from '@/api/events/payloads/get-legends-payload';
import { TypeFeatureInfoResultSets } from '@/api/events/payloads/get-feature-info-payload';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';

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

  // state interfaces
  appState: IAppState;
  detailsState: IDetailsState;
  dataTableState: IMapDataTableState;
  layerState: ILayerState;
  mapState: IMapState;
  uiState: IUIState;

  // results set
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
    detailsState: initialDetailsState(set, get),
    dataTableState: initialDataTableState(set, get),
    layerState: initializeLayerState(set, get),
    mapState: initializeMapState(set, get),
    uiState: initializeUIState(set, get),

    featureInfoResultSets: {} as TypeFeatureInfoResultSets,
    legendResultSets: {} as TypeLegendResultSets,
  } as IGeoViewState);

export const geoViewStoreDefinitionWithSubscribeSelector = subscribeWithSelector(geoViewStoreDefinition);

const fakeStore = create<IGeoViewState>()(geoViewStoreDefinitionWithSubscribeSelector);
export type GeoViewStoreType = typeof fakeStore;
