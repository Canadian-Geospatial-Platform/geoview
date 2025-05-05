import { MutableRefObject } from 'react';
import { ImageryLayer, Viewer } from 'cesium';
import { useStore } from 'zustand';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { useGeoViewStore } from '@/core/stores/stores-managers';

function getImageryLayerByName(viewer: Viewer, name: string): ImageryLayer | undefined {
  // eslint-disable-next-line no-underscore-dangle
  const layers = viewer.imageryLayers._layers;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return layers.find((layer: any) => layer.name === name);
}

export interface ICesiumState {
  cViewerRef: MutableRefObject<Viewer | null>;
  isInitialized: boolean;
  setDefaultConfigValues: (config: TypeMapFeaturesConfig) => void;
  actions: {
    getCesiumViewerRef: () => MutableRefObject<Viewer | null>;
    toggleVisibility: (layerPath: string) => void;
    getIsInitialized: () => boolean;
    zoomToLayer: (layerPath: string) => void;
  };
  setterActions: {
    setCesiumViewer: (viewer: Viewer | null) => void;
    setIsInitialized: (value: boolean) => void;
  };
}

export type CesiumActions = ICesiumState['actions'];
export type CesiumSetterActions = ICesiumState['setterActions'];
export type CesiumSetRefType = (viewer: Viewer | null) => void;

const cViewerRef = { current: null } as MutableRefObject<Viewer | null>;
export function initializeCesiumState(set: TypeSetStore, get: TypeGetStore): ICesiumState {
  return {
    cViewerRef,
    isInitialized: false,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    setDefaultConfigValues: (_: TypeMapFeaturesConfig): void => {},

    actions: {
      getCesiumViewerRef: (): MutableRefObject<Viewer | null> => {
        return get().cesiumState.cViewerRef;
      },
      getIsInitialized: (): boolean => {
        return get().cesiumState.isInitialized;
      },
      toggleVisibility(layerPath: string): void {
        const viewer = get().cesiumState.cViewerRef.current;
        if (viewer) {
          const [ds] = viewer.dataSources.getByName(layerPath);
          if (ds) {
            ds.show = !ds.show;
            return;
          }
          const is = getImageryLayerByName(viewer, layerPath);
          if (is) {
            is.show = !is.show;
          }
        }
      },
      zoomToLayer(layerPath: string): void {
        const viewer = get().cesiumState.cViewerRef.current;
        if (viewer) {
          const [ds] = viewer.dataSources.getByName(layerPath);
          if (ds) {
            viewer.flyTo(ds, { duration: 0 }).catch(() => {});
            return;
          }
          const is = getImageryLayerByName(viewer, layerPath);
          if (is) {
            viewer.flyTo(is, { duration: 0 }).catch(() => {});
          }
        }
      },
    },
    setterActions: {
      setCesiumViewer: (viewer: Viewer | null): void => {
        set((state) => {
          cViewerRef.current = viewer;
          /* eslint-disable-next-line no-param-reassign */
          state.cesiumState.cViewerRef = cViewerRef;
          return state;
        });
      },
      setIsInitialized: (value: boolean): void => {
        set((state) => {
          /* eslint-disable-next-line no-param-reassign */
          state.cesiumState.isInitialized = value;
          return state;
        });
      },
    },
  };
}

export const useCesiumStoreActions = (): CesiumActions => useStore(useGeoViewStore(), (state) => state.cesiumState.actions);
export const useCesiumStoreSetterActions = (): CesiumSetterActions =>
  useStore(useGeoViewStore(), (state) => state.cesiumState.setterActions);
export const useCesiumSetRef = (): CesiumSetRefType =>
  useStore(useGeoViewStore(), (state) => state.cesiumState.setterActions.setCesiumViewer);
export const useCesiumIsInitialized = (): boolean => useStore(useGeoViewStore(), (state) => state.cesiumState.isInitialized);
