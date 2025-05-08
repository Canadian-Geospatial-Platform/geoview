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
  ColorMaterialProperty,
  ConstantProperty,
  ImageryProvider,
  MaterialProperty,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  ImageryLayer,
  PointGraphics,
  EllipsoidGraphics,
  Cartesian3,
  Entity,
  ArcGisMapServerImageryProvider,
  Ellipsoid,
  WebMapTileServiceImageryProvider,
  UrlTemplateImageryProvider,
  PropertyBag,
  EllipseGraphics,
  HeightReference,
  PolylineGraphics,
  RuntimeError,
  CustomDataSource,
  ConstantPositionProperty,
} from 'cesium';
import 'cesium/Widgets/widgets.css';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import { toLonLat, transformExtent } from 'ol/proj';
import { WMTS, XYZ } from 'ol/source';
import ImageArcGISRest from 'ol/source/ImageArcGISRest';
import Icon from 'ol/style/Icon';
import Feature from 'ol/Feature';
import Style from 'ol/style/Style';
import { Circle, Geometry } from 'ol/geom';
import VectorSource from 'ol/source/Vector';
import TileLayer from 'ol/layer/Tile';
import CircleStyle from 'ol/style/Circle';
import { TypeScaleInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { MapViewer } from '@/geo/map/map-viewer';
import {
  useCesiumStoreSetterActions,
  useCesiumStoreActions,
  useCesiumSetRef,
} from '@/core/stores/store-interface-and-intial-values/cesium-state';
import { useAppStoreActions } from '@/core/stores/store-interface-and-intial-values/app-state';
import { CsvLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/csv-layer-entry-config';

type MapProps = {
  viewer: MapViewer;
};

type olColorType = [number, number, number, number] | string;

interface NamedImageryLayer extends ImageryLayer {
  name: string;
}

enum ScaleMode {
  M,
  I,
}

// Canada's bounding box, our default map extent.
const DEFAULT_EXTENTS = Rectangle.fromDegrees(-140.99778, 41.6751050889, -52.6480987209, 83.23324);

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

function olColorToCesiumColor(olColor: [number, number, number, number] | string): MaterialProperty {
  if (Array.isArray(olColor)) {
    return Color.fromBytes(olColor[0], olColor[1], olColor[2], olColor[3] * 255) as unknown as ColorMaterialProperty;
  }
  return Color.fromCssColorString(olColor) as unknown as ColorMaterialProperty;
}

function extractStyleForFeature(layer: VectorLayer<VectorSource>, feature: Feature<Geometry>): Style | Style[] | null {
  const styleCandidate = feature.getStyle() ?? layer.getStyle();
  if (!styleCandidate) return null;
  if (typeof styleCandidate === 'function') {
    const result = styleCandidate(feature, 0);
    return Array.isArray(result) || result instanceof Style ? result : null;
  }
  return Array.isArray(styleCandidate) || styleCandidate instanceof Style ? (styleCandidate as Style) : null;
}
function generateEllipseOutlinePositions(
  centerLon: number,
  centerLat: number,
  semiMajor: number,
  semiMinor: number,
  numPoints = 128
): Cartesian3[] {
  const positions: Cartesian3[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const x = semiMajor * Math.cos(angle);
    const y = semiMinor * Math.sin(angle);
    const lon = centerLon + x / 111319.9 / Math.cos((centerLat * Math.PI) / 180);
    const lat = centerLat + y / 110574.0;
    positions.push(Cartesian3.fromDegrees(lon, lat));
  }
  return positions;
}

function CsvLayerDataSource(layer: VectorLayer): CustomDataSource | undefined {
  const layerConfig = layer.get('layerConfig');
  const source = layer.getSource();
  const features = source!.getFeatures();
  const dataSource = new CustomDataSource();
  /* eslint-disable-next-line no-underscore-dangle */
  dataSource.name = layerConfig._layerPath;
  const { entities } = dataSource;
  entities.suspendEvents();
  features.forEach((el) => {
    const geom = el.getGeometry();
    const coords = geom.getCoordinates();
    const lonLat = toLonLat(coords);
    if (!lonLat[0] || !lonLat[1]) {
      return;
    }
    let style = extractStyleForFeature(layer, el);
    if (style instanceof Array) {
      [style] = style;
    }
    const id = el.getId();
    const ent = new Entity();
    ent.position = new ConstantPositionProperty(Cartesian3.fromDegrees(lonLat[0], lonLat[1]));
    ent.point = new PointGraphics();
    ent.properties = new PropertyBag({ featureId: id, style });
    entities.add(ent);
  });
  dataSource.show = layer.isVisible();
  return dataSource;
}

async function VectorLayerDataSource(viewer: MapViewer, layer: VectorLayer): Promise<GeoJsonDataSource | CustomDataSource | undefined> {
  if (layer.get('layerConfig') instanceof CsvLayerEntryConfig) {
    return Promise.resolve(CsvLayerDataSource(layer));
  }
  const layerPropsInt = layer.getPropertiesInternal();
  let layerPath;
  if (layerPropsInt?.layerConfig) {
    layerPath = layerPropsInt.layerConfig.layerPath;
  }
  const source = layer.getSource();
  let features = source!.getFeatures();
  if (features.length > 0) {
    const geoJsonFormatter = new GeoJSON();
    const projCode = viewer.getProjection().getCode();
    let geoJson;
    features = features.filter((f) => f && f.getGeometry());
    if (projCode === 'EPSG:4326') {
      geoJson = geoJsonFormatter.writeFeatures(features);
    } else {
      geoJson = geoJsonFormatter.writeFeaturesObject(features, {
        featureProjection: projCode,
        dataProjection: 'EPSG:4326',
      });
    }
    const circles = features.filter((feature) => {
      return feature.getGeometry() instanceof Circle;
    });
    const gJds = await GeoJsonDataSource.load(geoJson);
    if (circles.length > 0) {
      for (let i = 0; i < circles.length; i++) {
        const circle = circles[i];
        /* eslint-disable-next-line no-underscore-dangle */
        const name = circle.values_.featureId;
        const geom = circle.getGeometry();
        const radius = geom.getRadius();
        const centre = geom.getCenter();
        const lonLat = toLonLat(centre, projCode);
        const position = Cartesian3.fromDegrees(lonLat[0], lonLat[1]);
        const ellipse = new EllipseGraphics({
          semiMajorAxis: radius,
          semiMinorAxis: radius,
          heightReference: HeightReference.NONE,
        });
        const pointEntity = new Entity({ name, position, ellipse });
        const positions = generateEllipseOutlinePositions(lonLat[0], lonLat[1], radius, radius);
        pointEntity.polyline = new PolylineGraphics({
          positions,
        });
        pointEntity.properties = new PropertyBag({ featureId: name });
        gJds.entities.add(pointEntity);
      }
    }
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
  if (projdExtent.some((element) => !Number.isFinite(element))) {
    return;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    MapEventProcessor.zoomToExtent(oViewer.mapId, projdExtent, { padding: [1, 1, 1, 1], maxZoom: 30, duration: 1 }).catch((_e) => {});
  } finally {
    // eslint-disable-next-line no-empty
  }
}

/* eslint-disable no-param-reassign */
function styleVectorDataSource(datasource: GeoJsonDataSource | CustomDataSource | undefined, layer: VectorLayer): void {
  if (!datasource || !layer) return;
  datasource.entities.suspendEvents();
  datasource.entities.values.forEach((entity) => {
    const featureId = entity.properties?.featureId?.getValue();
    const layerSource = layer.getSource();
    if (!layerSource) return;
    // eslint-disable-next-line no-underscore-dangle
    const olFeature = layerSource.getFeatures().find((feature) => feature.values_.featureId === featureId);
    if (olFeature || entity.properties?.style) {
      let style;
      if (olFeature) {
        style = extractStyleForFeature(layer, olFeature);
      } else if (entity.properties?.style) {
        style = entity.properties.style.getValue();
      }
      if (style instanceof Array) {
        [style] = style;
      }
      if (style == null) return;
      const stroke = style.getStroke();
      const fill = style.getFill();

      if (entity.polygon) {
        entity.polygon.material = fill ? olColorToCesiumProperty(fill.getColor() as olColorType) : blank;
        entity.polygon.outlineColor = stroke ? olColorToCesiumColor(stroke.getColor() as olColorType) : blank;
        entity.polygon.outlineWidth = stroke ? new ConstantProperty(stroke.getWidth()) : ZeroProp;
      }
      if (entity.polyline) {
        entity.polyline.material = stroke ? olColorToCesiumProperty(stroke.getColor() as olColorType) : blank;
        entity.polyline.width = stroke ? new ConstantProperty(stroke.getWidth()) : ZeroProp;
      }
      if (entity.ellipse) {
        entity.ellipse.material = fill ? olColorToCesiumProperty(fill.getColor() as olColorType) : blank;
      }
      if (entity.point) {
        const img = style.getImage();
        const color = img.getFill() ? olColorToCesiumColor(img.getFill()!.getColor() as olColorType) : blank;
        const size = img.getSize()[0];
        const outlineColor = img.getStroke() ? olColorToCesiumColor(img.getStroke()!.getColor() as olColorType) : blank;
        const outlineWidth = img.getStroke() ? new ConstantProperty(img.getStroke()!.getWidth()) : ZeroProp;
        entity.point.outlineColor = outlineColor;
        entity.point.outlineWidth = outlineWidth;
        entity.point.color = color;
        entity.point.pixelSize = size;
      }
      if (entity.billboard) {
        const img = style.getImage();
        if (img instanceof Icon) {
          const src = img.getSrc();
          if (!src) return;
          entity.billboard.image = new ConstantProperty(src);
          entity.billboard.scale = new ConstantProperty(img.getScale()) || 1;
          entity.billboard.rotation = new ConstantProperty(img.getRotation()) || 0;
        } else if (img instanceof CircleStyle) {
          entity.billboard = undefined;
          const size = img.getSize();
          const outlineColor = img.getStroke() ? olColorToCesiumColor(img.getStroke()!.getColor() as olColorType) : blank;
          const outlineWidth = img.getStroke() ? new ConstantProperty(img.getStroke()!.getWidth()) : ZeroProp;
          if (size[0] !== size[1]) {
            const color = img.getFill() ? olColorToCesiumProperty(img.getFill()!.getColor() as olColorType) : blank;
            const radii = new Cartesian3(size[0] * 10000, size[1] * 10000, 100);
            entity.ellipsoid = new EllipsoidGraphics({
              radii,
              material: color,
              outlineColor,
              outlineWidth,
            });
          } else {
            const color = img.getFill() ? olColorToCesiumColor(img.getFill()!.getColor() as olColorType) : blank;
            entity.point = new PointGraphics({ color, pixelSize: size[0], outlineColor, outlineWidth });
          }
        }
      }
    }
  });
  datasource.entities.resumeEvents();
}

async function ImageLayerProvider(_viewer: MapViewer, layer: ImageLayer<ImageWMS | ImageArcGISRest>): Promise<ImageryProvider | undefined> {
  const source = layer.getSource();
  if (source instanceof ImageArcGISRest) {
    const url = source.getUrl();
    const params = source.getParams();
    // This doesnt work for ImageServers.
    if (url?.includes('ImageServer')) {
      return new UrlTemplateImageryProvider({
        url: url!,
      });
    }
    const prov = await ArcGisMapServerImageryProvider.fromUrl(url!, {
      ellipsoid: Ellipsoid.WGS84,
      rectangle: params.EXTENT,
      layers: params.LAYERS,
    });
    return prov;
  }
  if (source instanceof ImageWMS) {
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
  }
  return undefined;
}

function TileLayerDataSource(_viewer: MapViewer, layer: TileLayer<XYZ>): ImageryProvider | undefined {
  const source = layer.getSource();
  if (source instanceof WMTS) {
    const url = source!.getUrls()![0];
    const layerId = source!.getLayer();
    const matrixSet = source!.getMatrixSet();
    const format = source!.getFormat();
    const style = source!.getStyle();
    const credit = source!.getAttributions()!.toString();
    const conOptions: WebMapTileServiceImageryProvider.ConstructorOptions = {
      url: url!,
      layer: layerId!,
      style: style!,
      format: format!,
      tileMatrixSetID: matrixSet!,
      credit: credit!,
    };
    return new WebMapTileServiceImageryProvider(conOptions);
  }
  if (source instanceof XYZ) {
    const url = source!.getUrls()![0];
    return new UrlTemplateImageryProvider({
      url,
    });
  }
  return undefined;
}

function sendNotificationError(viewer: MapViewer, message: string): void {
  viewer.notifications.addNotificationError(message);
}

export function CesiumMap(props: MapProps): JSX.Element {
  const oViewerRef = useRef<HTMLDivElement>(null);
  const cViewerRef = useCesiumStoreActions().getCesiumViewerRef();
  const isInitialized = useCesiumStoreActions().getIsInitialized;
  const { setShow3dMap } = useAppStoreActions();
  const setCesiumViewer = useCesiumSetRef();
  const setCesiumSize = useCesiumStoreSetterActions().setMapSize;
  const setCesiumIsInitialized = useCesiumStoreSetterActions().setIsInitialized;
  const { viewer } = props;

  viewer.layer.onLayerAdded(() => {
    setShow3dMap(false);
  });

  viewer.layer.onLayerRemoved(() => {
    setShow3dMap(false);
  });

  useEffect(() => {
    if (!oViewerRef.current) return undefined;
    if (isInitialized()) return undefined;
    setCesiumIsInitialized(true);
    Camera.DEFAULT_VIEW_RECTANGLE = DEFAULT_EXTENTS;
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
      cViewer.scene.screenSpaceCameraController.minimumZoomDistance = 10;
      cViewer.scene.screenSpaceCameraController.maximumZoomDistance = 25000000;
      cViewerRef.current = cViewer;
      setCesiumViewer(cViewer);
      setCesiumSize([cViewer.canvas.width, cViewer.canvas.height]);
      cViewer.camera.flyTo({
        destination: Rectangle.fromDegrees(...viewer.convertExtentFromMapProjToProj(viewer.map.getView().calculateExtent(), 'EPSG:4326')),
        duration: 0,
      });
      const observer = new ResizeObserver(() => {
        setCesiumSize([cViewer.canvas.width, cViewer.canvas.height]);
      });
      observer.observe(cViewer.container);
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
            } else {
              const layerPropsInt = layer.getPropertiesInternal();
              let layerPath;
              let layerTitle = '';
              if (layerPropsInt?.layerConfig) {
                layerPath = layerPropsInt.layerConfig.layerPath;
                const gvLayerName = viewer.layer.getGeoviewLayer(layerPath)?.getGeoviewLayerName();
                if (gvLayerName) {
                  layerTitle = gvLayerName;
                }
              }
              if (layerTitle !== '') {
                sendNotificationError(viewer, `${layerTitle} could not be added to 3D Map.`);
              }
            }
          } else if (layer instanceof ImageLayer) {
            const imageryProvider = await ImageLayerProvider(viewer, layer);
            if (imageryProvider) {
              const ds = cViewer.imageryLayers.addImageryProvider(imageryProvider);
              const layerPropsInt = layer.getPropertiesInternal();
              let layerPath;
              if (layerPropsInt?.layerConfig) {
                layerPath = layerPropsInt.layerConfig.layerPath;
              }
              (ds as NamedImageryLayer).name = layerPath;
              ds.show = layer.isVisible();
            } else {
              const layerPropsInt = layer.getPropertiesInternal();
              let layerPath;
              let layerTitle = '';
              if (layerPropsInt?.layerConfig) {
                layerPath = layerPropsInt.layerConfig.layerPath;
                const gvLayerName = viewer.layer.getGeoviewLayer(layerPath)?.getGeoviewLayerName();
                if (gvLayerName) {
                  layerTitle = gvLayerName;
                }
              }
              if (layerTitle !== '') {
                sendNotificationError(viewer, `${layerTitle} could not be added to 3D Map.`);
              }
            }
          } else if (layer instanceof TileLayer) {
            const imageryProvider = TileLayerDataSource(viewer, layer);
            if (imageryProvider) {
              const ds = cViewer.imageryLayers.addImageryProvider(imageryProvider);
              const layerPropsInt = layer.getPropertiesInternal();
              let layerPath;
              if (layerPropsInt?.layerConfig) {
                layerPath = layerPropsInt.layerConfig.layerPath;
              }
              (ds as NamedImageryLayer).name = layerPath;
              ds.show = layer.isVisible();
            } else {
              const layerPropsInt = layer.getPropertiesInternal();
              let layerPath;
              let layerTitle = '';
              if (layerPropsInt?.layerConfig) {
                layerPath = layerPropsInt.layerConfig.layerPath;
                const gvLayerName = viewer.layer.getGeoviewLayer(layerPath)?.getGeoviewLayerName();
                if (gvLayerName) {
                  layerTitle = gvLayerName;
                }
              }
              if (layerTitle !== '') {
                sendNotificationError(viewer, `${layerTitle} could not be added to 3D Map.`);
              }
            }
          }
        })
      );
    };
    initCesium().catch((e: RuntimeError) => {
      sendNotificationError(viewer, `Failed to Initialize Cesium: ${e.message}`);
    });
    return () => {};
  });

  return <div ref={oViewerRef} style={{ width: '100%', height: '100vh', display: 'block' }} />;
}
