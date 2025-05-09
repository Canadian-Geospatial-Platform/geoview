import { MutableRefObject } from 'react';
import {
  Cartesian3,
  ImageryLayer,
  Rectangle,
  Viewer,
  Ellipsoid,
  ImageryProvider,
  Entity,
  RectangleGraphics,
  Color,
  HeightReference,
  ConstantProperty,
  DataSource,
  PointGraphics,
  BillboardGraphics,
  PolylineGraphics,
  PolygonGraphics,
  EllipseGraphics,
  ColorMaterialProperty,
} from 'cesium';
import { useStore } from 'zustand';
import TIFFImageryProvider from 'tiff-imagery-provider';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { useGeoViewStore } from '@/core/stores/stores-managers';
import { createCogProjectionObject } from './Projections';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { TypeOrderedLayerInfo } from './map-state';

const hiddenAlphaMultiplier = 0.2;

/**
 * Gets an ImageryLayer from Cesium based off the name of the layer.
 * @param viewer Cesium Viewer.
 * @param name Layer Name to return.
 * @returns ImageryLayer if layer is found, undefined otherwise.
 */
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

/**
 * State interface for various methods relating to Cesium.
 */
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
    zoomToExtent: (latLng?: [number, number], bbox?: [number, number, number, number]) => void;
    zoomToHome: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
    addCog: (url: string, epsg: number) => void;
    highlightLayer: (layerPath: string) => void;
  };
  setterActions: {
    setCesiumViewer: (viewer: Viewer | null) => void;
    setIsInitialized: (value: boolean) => void;
    setMapSize: (size: [number, number]) => void;
  };
}

type GenericGraphic = PointGraphics | RectangleGraphics | BillboardGraphics | PolylineGraphics | PolygonGraphics | EllipseGraphics;

const graphicKeys: (keyof Entity)[] = ['point', 'rectangle', 'billboard', 'polyline', 'polygon', 'ellipse'];

/**
 * Get the Bounding Rectangle for the entities in the datasource.
 *
 * @param dataSource  The Datasource containing the entities to get the rectangle bounds from.
 * @returns           The Rectangle containg all of the data for the dataSource.
 */
function getDataSourceRectangle(dataSource: DataSource): Rectangle | undefined {
  const ellipsoid = Ellipsoid.WGS84;
  const westArray: number[] = [];
  const southArray: number[] = [];
  const eastArray: number[] = [];
  const northArray: number[] = [];
  for (const entity of dataSource.entities.values) {
    const position = entity.position?.getValue();
    if (position) {
      const carto = ellipsoid.cartesianToCartographic(position);
      if (carto) {
        const lon = carto.longitude;
        const lat = carto.latitude;
        westArray.push(lon);
        eastArray.push(lon);
        southArray.push(lat);
        northArray.push(lat);
      }
    }
    for (const key of graphicKeys) {
      const graphic = entity[key] as GenericGraphic;
      if (graphic && 'positions' in graphic && graphic.positions?.getValue()) {
        for (const graphicPosition of graphic.positions.getValue()) {
          if (graphicPosition) {
            const carto = ellipsoid.cartesianToCartographic(graphicPosition);
            if (carto) {
              const lon = carto.longitude;
              const lat = carto.latitude;
              westArray.push(lon);
              eastArray.push(lon);
              southArray.push(lat);
              northArray.push(lat);
            }
          }
        }
      }
      if (graphic && 'hierarchy' in graphic && graphic.hierarchy?.getValue()) {
        const hierarchy = graphic.hierarchy.getValue();
        if (hierarchy && 'positions' in hierarchy) {
          for (const graphicPosition of hierarchy.positions) {
            if (graphicPosition) {
              const carto = ellipsoid.cartesianToCartographic(graphicPosition);
              if (carto) {
                const lon = carto.longitude;
                const lat = carto.latitude;
                westArray.push(lon);
                eastArray.push(lon);
                southArray.push(lat);
                northArray.push(lat);
              }
            }
          }
        }
      }
    }
  }
  if (westArray.length === 0 || southArray.length === 0 || eastArray.length === 0 || northArray.length === 0) {
    return undefined;
  }
  return new Rectangle(Math.min(...westArray), Math.min(...southArray), Math.max(...eastArray), Math.max(...northArray));
}

/**
 * Update the alpha on all colors for the GenericGraphic object.
 *
 * @param graphic   The Graphic to update the color alphas on.
 * @param hide      Whether or not to reduce or increase the alpha.
 */
function updateGraphicAlpha(graphic: GenericGraphic, hide: boolean): void {
  const alphaMultiplier = hide ? hiddenAlphaMultiplier : 1 / hiddenAlphaMultiplier;
  if ('outlineColor' in graphic && graphic.outlineColor?.getValue()) {
    const outlineColor = graphic.outlineColor.getValue();
    outlineColor.alpha *= alphaMultiplier;
    // eslint-disable-next-line no-param-reassign
    graphic.outlineColor = outlineColor;
  }
  if ('color' in graphic && graphic.color?.getValue()) {
    const color = graphic.color.getValue();
    color.alpha *= alphaMultiplier;
    // eslint-disable-next-line no-param-reassign
    graphic.color = color;
  }
  if ('material' in graphic && graphic.material?.getValue()) {
    const material = graphic.material.getValue() as ColorMaterialProperty;
    const materialColor = material?.color;
    if (materialColor && 'alpha' in materialColor) {
      const alpha = materialColor.alpha as number;
      materialColor.alpha = alpha * alphaMultiplier;
      // eslint-disable-next-line no-param-reassign
      graphic.material = new ColorMaterialProperty(materialColor);
    }
  }
}
/**
 * Select the graphic objects from all the entities and update the alpha on them.
 *
 * @param dataSource  The DataSource containing all of the entities to hide or unhide.
 * @param hide        Whether or not to reduce or increase the alpha.
 */
function updateDataSourceAlpha(dataSource: DataSource, hide: boolean): void {
  for (const entity of dataSource.entities.values) {
    for (const key of graphicKeys) {
      const graphic = entity[key];
      if (graphic) updateGraphicAlpha(graphic as GenericGraphic, hide);
    }
  }
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
      /**
       * Returns the Cesium Viewer.
       * @returns The Cesium Viewer.
       */
      getCesiumViewerRef: (): MutableRefObject<Viewer | null> => {
        return get().cesiumState.cViewerRef;
      },
      /**
       * Returns the isInitialized boolean.
       * @returns isInitialized.
       */
      getIsInitialized: (): boolean => {
        return get().cesiumState.isInitialized;
      },
      /**
       * Show/Hide a layer in Cesium based off the given layerPath.
       * @param layerPath OL Layer path.
       */
      toggleVisibility(layerPath: string): void {
        const viewer = get().cesiumState.cViewerRef.current;
        if (viewer) {
          const curOrderedLayerInfo = MapEventProcessor.getMapOrderedLayerInfo(get().mapId);
          const layerInfos = MapEventProcessor.findMapLayerAndChildrenFromOrderedInfo(get().mapId, layerPath, curOrderedLayerInfo);

          let allOff = true;
          layerInfos.forEach((layerInfo: TypeOrderedLayerInfo) => {
            if (layerInfo) {
              const [ds] = viewer.dataSources.getByName(layerInfo.layerPath);
              if (ds) {
                if (ds.show) allOff = false;
              }
              const is = getImageryLayerByName(viewer, layerInfo.layerPath);
              if (is) {
                if (is.show) allOff = false;
              }
            }
          });

          layerInfos.forEach((layerInfo: TypeOrderedLayerInfo) => {
            if (layerInfo) {
              const [ds] = viewer.dataSources.getByName(layerInfo.layerPath);
              if (ds) {
                ds.show = allOff;
                return;
              }
              const is = getImageryLayerByName(viewer, layerInfo.layerPath);
              if (is) {
                is.show = allOff;
              }
            }
          });
        }
      },
      /**
       * Zoom Cesium camera to a layer represented by a layer path.
       * @param layerPath OL Layer Path
       * @returns void
       */
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
      /**
       * Zoom Cesium camera to a given lat/long point or bounding box.
       * @param latLng [Latitude, Longitude] in EPSG:4326.
       * @param bbox [West, South, East, North] in EPSG:4326.
       */
      zoomToExtent(latLng?: [number, number], bbox?: [number, number, number, number]): void {
        const viewer = get().cesiumState.cViewerRef.current;
        if (viewer) {
          if (bbox) {
            viewer.camera.flyTo({
              destination: Rectangle.fromDegrees(bbox[0], bbox[1], bbox[2], bbox[3]),
              duration: 0,
            });
          } else if (latLng) {
            viewer.camera.flyTo({
              destination: Cartesian3.fromDegrees(latLng[1], latLng[0], 50.0),
              duration: 0,
            });
          } else {
            throw new Error('No valid point or extents was found when attempting to zoom.');
          }
        }
      },
      /**
       * Zoom Cesium camera to the default extents.
       */
      zoomToHome(): void {
        const viewer = get().cesiumState.cViewerRef.current;
        if (viewer) {
          viewer.camera.flyHome(0);
        }
      },
      /**
       * Zoom Cesium camera forward.
       */
      zoomIn(): void {
        const viewer = get().cesiumState.cViewerRef.current;
        if (viewer) {
          const cameraHeight = Ellipsoid.WGS84.cartesianToCartographic(viewer.scene.camera.position).height;
          const zoomNum = (cameraHeight - viewer.scene.screenSpaceCameraController.minimumZoomDistance) / 5;
          viewer.camera.zoomIn(zoomNum);
        }
      },
      /**
       * Zoom Cesium camera backward.
       */
      zoomOut(): void {
        const viewer = get().cesiumState.cViewerRef.current;
        if (viewer) {
          const cameraHeight = Ellipsoid.WGS84.cartesianToCartographic(viewer.scene.camera.position).height;
          const zoomNum = (cameraHeight - viewer.scene.screenSpaceCameraController.minimumZoomDistance) / 5;
          viewer.camera.zoomOut(zoomNum);
        }
      },
      /**
       * Adding a COG to the Cesium map.
       * @param url URL to a Cloud Optimized Geotiff
       * @param epsg Number representing a EPSG code.
       */
      addCog(url: string, epsg: number): void {
        const viewer = get().cesiumState.cViewerRef.current;
        if (viewer) {
          TIFFImageryProvider.fromUrl(url, {
            projFunc: () => {
              return createCogProjectionObject(epsg);
            },
          })
            .then((provider) => {
              viewer.imageryLayers.addImageryProvider(provider as unknown as ImageryProvider);
            })
            .catch((e) => {
              throw e;
            });
        }
      },
      /**
       * Highlight the layer by reducing the alpha of all other layers and draw a black bounding box
       * surrounding the data in the selected DataSource or ImageryLayer.
       *
       * @param layerPath The name of the layer to retrieve the dataSource or ImageryLayer.
       * @returns         void.
       */
      highlightLayer(layerPath: string): void {
        const viewer = get().cesiumState.cViewerRef.current;
        if (viewer) {
          const id = 'highlight_bounding_box';
          const name = `${layerPath} highlight`;
          const [ds] = viewer.dataSources.getByName(layerPath);
          const is = getImageryLayerByName(viewer, layerPath);
          if (viewer.entities.getById(id)) {
            const highlightEntity = viewer.entities.getById(id);
            viewer.entities.remove(highlightEntity!);
            const dataSourcesLength = viewer.dataSources.length;
            for (let i = 0; i < dataSourcesLength; i++) {
              const dataSource = viewer.dataSources.get(i);
              if (dataSource !== ds) {
                updateDataSourceAlpha(dataSource, false);
              }
            }
            const imageryLayersLength = viewer.imageryLayers.length;
            for (let i = 0; i < imageryLayersLength; i++) {
              const imageryLayer = viewer.imageryLayers.get(i);
              if (imageryLayer !== is && !imageryLayer.isBaseLayer()) {
                imageryLayer.alpha *= 1 / hiddenAlphaMultiplier;
              }
            }
            if (highlightEntity!.name === name) {
              return;
            }
          }
          let coordinates;
          if (ds) {
            coordinates = getDataSourceRectangle(ds);
          }
          if (is) {
            coordinates = is.imageryProvider.rectangle;
          }
          const outlineColor = Color.BLACK;
          const outlineWidth = 2;
          const fill = new ConstantProperty(false);
          const outline = new ConstantProperty(true);
          const rectangle = new RectangleGraphics({
            coordinates,
            outline,
            outlineColor,
            outlineWidth,
            fill,
            heightReference: HeightReference.RELATIVE_TO_3D_TILE,
          });
          const entity = new Entity({ rectangle, id, name });
          viewer.entities.add(entity);
          const dataSourcesLength = viewer.dataSources.length;
          for (let i = 0; i < dataSourcesLength; i++) {
            const dataSource = viewer.dataSources.get(i);
            if (dataSource !== ds) {
              updateDataSourceAlpha(dataSource, true);
            }
          }
          const imageryLayersLength = viewer.imageryLayers.length;
          for (let i = 0; i < imageryLayersLength; i++) {
            const imageryLayer = viewer.imageryLayers.get(i);
            if (imageryLayer !== is && !imageryLayer.isBaseLayer()) {
              imageryLayer.alpha *= hiddenAlphaMultiplier;
            }
          }
          if (is) viewer.imageryLayers.raiseToTop(is);
          if (ds) viewer.dataSources.raiseToTop(ds);
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
