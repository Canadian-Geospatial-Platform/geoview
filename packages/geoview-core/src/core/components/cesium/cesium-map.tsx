import React, { useEffect, useRef } from 'react';
import {
  Cartesian2,
  Camera,
  Rectangle,
  Math as CesiumMath,
  Viewer,
  createWorldTerrainAsync,
  GeoJsonDataSource,
  BoundingSphere,
  WebMapServiceImageryProvider,
  Color,
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import { transformExtent } from 'ol/proj';
import {
  ColorMaterialProperty,
  ConstantProperty,
  ImageryProvider,
  MaterialProperty,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
} from '@cesium/engine';
import Icon from 'ol/style/Icon';
import Feature from 'ol/Feature';
import Style from 'ol/style/Style';
import { Geometry } from 'ol/geom';
import VectorSource from 'ol/source/Vector';
import { TypeScaleInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { MapViewer } from '@/geo/map/map-viewer';
import {
  useCesiumStoreSetterActions,
  useCesiumStoreActions,
  useCesiumSetRef,
  useCesiumIsInitialized,
} from '@/core/stores/store-interface-and-intial-values/cesium-state';
import { useAppShow3dMap } from '@/core/stores/store-interface-and-intial-values/app-state';

type MapProps = {
  viewer: MapViewer;
};

enum ScaleMode {
  M,
  I,
}

// Possible Scale Values;
const ScaleKm = [500, 200, 100, 50, 20, 10, 5, 2, 1];
const ScaleM = [500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5];
const ScaleMi = [500, 200, 100, 50, 20, 10, 5, 2, 1];
const ScaleFt = [2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.25];
// Approximate Screen Pixel Size;
const ScreenPixelSize = 0.000264583;
const DesiredScaleLineLength = 120; // px
// Coefficients here to allieviate the use of magic numbers;
const KmToMi = 0.621371;
const KmToFt = 3280.84;
const KmToM = 1000;
const blank = new ColorMaterialProperty(Color.fromBytes(0, 0, 0, 0));
const ZeroProp = new ConstantProperty(0);

function olColorToCesiumProperty(olColor: [number, number, number, number] | string): MaterialProperty {
  if (Array.isArray(olColor)) {
    return new ColorMaterialProperty(Color.fromBytes(olColor[0], olColor[1], olColor[2], olColor[3] * 255));
  }
  return new ColorMaterialProperty(Color.fromCssColorString(olColor));
}

function extractStyleForFeature(_layer: VectorLayer<VectorSource>, feature: Feature<Geometry>): Style | Style[] | null {
  const styleCandidate = feature.getStyle();
  if (!styleCandidate) return null;
  if (typeof styleCandidate === 'function') {
    const result = styleCandidate(feature, 0);
    return Array.isArray(result) || result instanceof Style ? result : null;
  }
  return Array.isArray(styleCandidate) || styleCandidate instanceof Style ? styleCandidate : null;
}

async function VectorLayerDataSource(viewer: MapViewer, layer: VectorLayer): Promise<GeoJsonDataSource | undefined> {
  const layerPropsInt = layer.getPropertiesInternal();
  let layerPath;
  if (layerPropsInt?.layerConfig) {
    layerPath = layerPropsInt.layerConfig.layerPath;
  }
  const source = layer.getSource();
  const features = source!.getFeatures();
  if (features.length > 0) {
    const geoJsonFormatter = new GeoJSON();
    const projCode = viewer.getProjection().getCode();
    const geoJson = geoJsonFormatter.writeFeaturesObject(features, {
      featureProjection: projCode,
      dataProjection: 'EPSG:4326',
    });
    const gJds = await GeoJsonDataSource.load(geoJson);
    if (layerPath) {
      gJds.name = layerPath;
    }
    gJds.show = layer.isVisible();
    return gJds;
  }
  return undefined;
}

function drillDownScale(pixScale: number, mode: ScaleMode): [string, string] {
  let scale = mode === ScaleMode.M ? ScaleKm : ScaleMi;
  let unit = mode === ScaleMode.M ? 'km' : 'mi';
  let lg;
  let lw;
  for (let i = 0; i < scale.length; i++) {
    lg = scale[i];
    lw = parseInt((lg / pixScale).toFixed(0), 10);
    if (lw <= DesiredScaleLineLength) {
      return [`${lw}px`, `${lg} ${unit}`];
    }
  }
  unit = mode === ScaleMode.M ? 'm' : 'ft';
  scale = mode === ScaleMode.M ? ScaleM : ScaleFt;
  const pixScaleSmall = mode === ScaleMode.M ? pixScale * KmToM : pixScale * KmToFt;
  for (let i = 0; i < scale.length; i++) {
    lg = scale[i];
    lw = parseInt((lg / pixScaleSmall).toFixed(0), 10);
    if (lw <= DesiredScaleLineLength) {
      return [`${lw}px`, `${lg} ${unit}`];
    }
  }
  return [`${lw}px`, `${lg} ${unit}`];
}

function getMapScale(pixSize: number): TypeScaleInfo {
  const pixSizeKm = pixSize / KmToM;
  const pixSizeMi = pixSizeKm * KmToMi;
  const [lwm, lgm] = drillDownScale(pixSizeKm, ScaleMode.M);
  const [lwi, lgi] = drillDownScale(pixSizeMi, ScaleMode.I);
  const denom = (pixSize / ScreenPixelSize).toFixed(0);
  return {
    labelGraphicMetric: lgm,
    lineWidthMetric: lwm,
    labelGraphicImperial: lgi,
    lineWidthImperial: lwi,
    labelNumeric: `1 : ${denom}`,
  };
}

function setOLMapExtent(oViewer: MapViewer, cViewer: Viewer): void {
  const scratchRectangle = new Rectangle();
  const rect = cViewer.camera.computeViewRectangle(cViewer.scene.globe.ellipsoid, scratchRectangle);
  const west = parseFloat(CesiumMath.toDegrees(rect!.west).toFixed(10));
  const south = parseFloat(CesiumMath.toDegrees(rect!.south).toFixed(10));
  const east = parseFloat(CesiumMath.toDegrees(rect!.east).toFixed(10));
  const north = parseFloat(CesiumMath.toDegrees(rect!.north).toFixed(10));
  const projdExtent = transformExtent([west, south, east, north], 'EPSG:4326', oViewer.getProjection().getCode());
  MapEventProcessor.zoomToExtent(oViewer.mapId, projdExtent, { padding: [1, 1, 1, 1], maxZoom: 30, duration: 1 }).catch((e) => {
    throw e;
  });
}

/* eslint-disable no-param-reassign */
function styleVectorDataSource(datasource: GeoJsonDataSource | undefined, layer: VectorLayer): void {
  if (!datasource || !layer) return;
  datasource.entities.values.forEach((entity) => {
    const featureId = entity.properties?.featureId?.getValue();
    const layerSource = layer.getSource();
    if (!layerSource) return;
    // eslint-disable-next-line no-underscore-dangle
    const olFeature = layerSource.getFeatures().find((feature) => feature.values_.featureId === featureId);
    if (olFeature) {
      let style = extractStyleForFeature(layer, olFeature);
      if (style instanceof Array) {
        [style] = style;
      }
      if (style == null) return;
      const stroke = style.getStroke();
      const fill = style.getFill();

      if (entity.polygon) {
        entity.polygon.material = fill ? olColorToCesiumProperty(fill.getColor() as [number, number, number, number]) : blank;
        entity.polygon.outlineColor = stroke ? olColorToCesiumProperty(stroke.getColor() as [number, number, number, number]) : blank;
        entity.polygon.outlineWidth = stroke ? new ConstantProperty(stroke.getWidth()) : ZeroProp;
      }
      if (entity.polyline) {
        entity.polyline.material = stroke ? olColorToCesiumProperty(stroke.getColor() as [number, number, number, number]) : blank;
        entity.polyline.width = stroke ? new ConstantProperty(stroke.getWidth()) : ZeroProp;
      }
      if (entity.billboard) {
        const img = style.getImage();
        if (img instanceof Icon) {
          const src = img.getSrc();
          if (!src) return;
          entity.billboard.image = new ConstantProperty(src);
          entity.billboard.scale = new ConstantProperty(img.getScale()) || 1;
          entity.billboard.rotation = new ConstantProperty(img.getRotation()) || 0;
        }
      }
    }
  });
}

function ImageLayerDataSource(_viewer: MapViewer, layer: ImageLayer<ImageWMS>): ImageryProvider {
  const source = layer.getSource();
  // if (source instanceof ImageWMS) {
  const url = source!.getUrl();
  const params = source!.getParams();
  const options: WebMapServiceImageryProvider.ConstructorOptions = {
    url: url!,
    layers: params.LAYERS,
    enablePickFeatures: false,
    parameters: {
      FORMAT: 'image/png',
      TRANSPARENT: 'TRUE',
    },
  };
  return new WebMapServiceImageryProvider(options);
  // }
}

export function CesiumMap(props: MapProps): JSX.Element {
  const oViewerRef = useRef<HTMLDivElement>(null);
  const cViewerRef = useCesiumStoreActions().getCesiumViewerRef();
  const isInitialized = useCesiumStoreActions().getIsInitialized;
  const setCesiumViewer = useCesiumSetRef();
  const setCesiumIsInitialized = useCesiumStoreSetterActions().setIsInitialized;
  const { viewer } = props;

  useEffect(() => {
    if (!oViewerRef.current) return undefined;
    if (isInitialized()) return undefined;
    setCesiumIsInitialized(true);
    Camera.DEFAULT_VIEW_RECTANGLE = Rectangle.fromDegrees(
      ...viewer.convertExtentFromMapProjToProj(viewer.map.getView().calculateExtent(), 'EPSG:4326')
    );
    Camera.DEFAULT_VIEW_FACTOR = 0;

    const initCesium = async (): Promise<void> => {
      const terrainProvider = await createWorldTerrainAsync();
      const cViewer = new Viewer(oViewerRef.current!, {
        terrainProvider,
        baseLayerPicker: false,
        animation: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        selectionIndicator: true,
        timeline: false,
        navigationHelpButton: false,
        shouldAnimate: true,
        sceneModePicker: false,
        useBrowserRecommendedResolution: false,
        orderIndependentTranslucency: false,
      });
      cViewerRef.current = cViewer;
      setCesiumViewer(cViewer);
      cViewer.camera.percentageChanged = 0.1;
      cViewer.camera.changed.addEventListener(() => {
        setOLMapExtent(viewer, cViewer);
        const centerPixel = new Cartesian2(cViewer.canvas.clientWidth / 2, cViewer!.canvas.clientHeight / 2);
        const centerRay = cViewer.camera.getPickRay(centerPixel);
        const centerPosition = cViewer.scene.globe.pick(centerRay!, cViewer!.scene);
        const bSphere = new BoundingSphere(centerPosition, 1.0);
        const pixSize = cViewer.camera.getPixelSize(bSphere, cViewer.scene.drawingBufferWidth, cViewer.scene.drawingBufferHeight);
        MapEventProcessor.setMapChangeSize(viewer.mapId, [10, 10], getMapScale(pixSize));
      });

      const sshandler = new ScreenSpaceEventHandler(cViewer.scene.canvas);
      sshandler.setInputAction((movement: ScreenSpaceEventHandler.MotionEvent) => {
        const cart = cViewer.scene.pickPosition(movement.endPosition);
        if (cart) {
          const cartographic = cViewer.scene.globe.ellipsoid.cartesianToCartographic(cart);
          const lnglat = [CesiumMath.toDegrees(cartographic.longitude), CesiumMath.toDegrees(cartographic.latitude)];
          MapEventProcessor.setMapPointerPosition(viewer.mapId, {
            lnglat,
            pixel: [movement.endPosition.x, movement.endPosition.y],
            projected: lnglat,
            dragging: false,
          });
        }
      }, ScreenSpaceEventType.MOUSE_MOVE);

      const layers = viewer.map.getAllLayers();
      await Promise.all(
        layers.map(async (layer) => {
          if (layer instanceof VectorLayer) {
            const datasource = await VectorLayerDataSource(viewer, layer);
            if (datasource) {
              await cViewer.dataSources.add(datasource);
              styleVectorDataSource(datasource, layer);
            }
          } else if (layer instanceof ImageLayer) {
            const imageryProvider = ImageLayerDataSource(viewer, layer);
            const ds = cViewer.imageryLayers.addImageryProvider(imageryProvider);
            const layerPropsInt = layer.getPropertiesInternal();
            let layerPath;
            if (layerPropsInt?.layerConfig) {
              layerPath = layerPropsInt.layerConfig.layerPath;
            }
            ds.name = layerPath;
            ds.show = layer.isVisible();
          }
        })
      );
    };
    initCesium().catch((e) => {
      throw e;
    });
    return () => {};
  });

  return <div ref={oViewerRef} style={{ width: '100%', height: '100vh', display: 'block' }} />;
}
