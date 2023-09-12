import { StoreApi } from 'zustand';
import OLMap from 'ol/Map';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';

export interface GeoViewState {
  mapId: string;
  mapConfig: TypeMapFeaturesConfig | undefined;
  mapLoaded: boolean;
  isCrosshairsActive: boolean;
  mapElement?: OLMap;

  setCrosshairsActive: (isActive: boolean) => void;
  //
  setMapConfig: (config: TypeMapFeaturesConfig) => void;
  onMapLoaded: (mapElem: OLMap) => void;
}

export type GeoViewStoreType = StoreApi<GeoViewState>;

export const geoViewStoreDefinition = (
  set: (
    partial: GeoViewState | Partial<GeoViewState> | ((state: GeoViewState) => GeoViewState | Partial<GeoViewState>),
    replace?: boolean | undefined
  ) => void
  // get: () => GeoViewState
) =>
  ({
    mapId: '',
    mapLoaded: false,
    mapConfig: undefined,
    isCrosshairsActive: false,

    setMapConfig: (config: TypeMapFeaturesConfig) => {
      console.log('dsfsdfdfds get t');
      set({ mapConfig: config, mapId: config.mapId });
    },

    onMapLoaded: (mapElem: OLMap) => {
      set({ mapLoaded: true, mapElement: mapElem });
    },
    setCrosshairsActive: (isActive: boolean) => set({ isCrosshairsActive: isActive }),
  } as GeoViewState);
