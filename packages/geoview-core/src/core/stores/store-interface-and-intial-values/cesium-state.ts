import { MutableRefObject } from 'react';
import { Cartesian3, ImageryLayer, Rectangle, Viewer, Ellipsoid } from 'cesium';
import { useStore } from 'zustand';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { useGeoViewStore } from '@/core/stores/stores-managers';

function getImageryLayerByName(viewer: Viewer, name: string): ImageryLayer | undefined {
  // eslint-disable-next-line no-underscore-dangle
  const layers = [];
  const layerCollectionLength = viewer.imageryLayers.length;
  for (let i = 0; i < layerCollectionLength; i += 1) {
    layers.push(viewer.imageryLayers.get(i));
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return layers.find((layer: any) => layer.name === name);
}

export interface ICesiumState {
  cViewerRef: MutableRefObject<Viewer | null>;
  isInitialized: boolean;
  size: [number, number];
  setDefaultConfigValues: (config: TypeMapFeaturesConfig) => void;
  actions: {
    getCesiumViewerRef: () => MutableRefObject<Viewer | null>;
    toggleVisibility: (layerPath: string) => void;
    getIsInitialized: () => boolean;
    zoomToLayer: (layerPath: string) => void;
    zoomToExtent: (latLng: [number, number], bbox?: [number, number, number, number]) => void;
    zoomToHome: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
  };
  setterActions: {
    setCesiumViewer: (viewer: Viewer | null) => void;
    setIsInitialized: (value: boolean) => void;
    setMapSize: (size: [number, number]) => void;
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
    size: [0, 0],
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
      zoomToExtent(latLng: [number, number], bbox?: [number, number, number, number]): void {
        const viewer = get().cesiumState.cViewerRef.current;
        if (viewer) {
          if (bbox) {
            viewer.camera.flyTo({
              destination: Rectangle.fromDegrees(bbox[0], bbox[1], bbox[2], bbox[3]),
              duration: 0,
            });
          } else {
            viewer.camera.flyTo({
              destination: Cartesian3.fromDegrees(latLng[1], latLng[0], 50.0),
              duration: 0,
            });
          }
        }
      },
      zoomToHome(): void {
        const viewer = get().cesiumState.cViewerRef.current;
        if (viewer) {
          viewer.camera.flyHome(0);
        }
      },
      zoomIn(): void {
        const viewer = get().cesiumState.cViewerRef.current;
        if (viewer) {
          const cameraHeight = Ellipsoid.WGS84.cartesianToCartographic(viewer.scene.camera.position).height;
          const zoomNum = (cameraHeight - viewer.scene.screenSpaceCameraController.minimumZoomDistance) / 5;
          viewer.camera.zoomIn(zoomNum);
        }
      },
      zoomOut(): void {
        const viewer = get().cesiumState.cViewerRef.current;
        if (viewer) {
          const cameraHeight = Ellipsoid.WGS84.cartesianToCartographic(viewer.scene.camera.position).height;
          const zoomNum = (cameraHeight - viewer.scene.screenSpaceCameraController.minimumZoomDistance) / 5;
          viewer.camera.zoomOut(zoomNum);
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
      setMapSize: (size: [number, number]): void => {
        set({ cesiumState: { ...get().cesiumState, size } });
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
export const useCesiumMapSize = (): [number, number] => useStore(useGeoViewStore(), (state) => state.cesiumState.size);
