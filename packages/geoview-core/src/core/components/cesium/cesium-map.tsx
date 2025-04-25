/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-misused-promises */
import React, { useEffect, useRef } from 'react';
import {
  Cartesian2,
  Camera,
  Rectangle,
  Math as CesiumMath,
  Viewer,
  createWorldTerrainAsync,
  GeoJsonDataSource,
  Ellipsoid,
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
import { MapViewer } from '@/geo/map/map-viewer';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { TypeScaleInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import { ColorMaterialProperty, ConstantProperty, ImageryProvider, MaterialProperty } from '@cesium/engine';
import Icon from 'ol/style/Icon';
import Feature from 'ol/Feature';
import Style, { StyleLike } from 'ol/style/Style';
//import { FlatStyleLike } from 'ol/style/flat';
import { Geometry } from 'ol/geom';
import VectorSource from 'ol/source/Vector';

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

async function VectorLayerDataSource(viewer: MapViewer, layer: VectorLayer) {
  const source = layer.getSource();
  const features = source!.getFeatures();
  if (features.length > 0) {
    const geoJsonFormatter = new GeoJSON();
    const projCode = viewer.getProjection().getCode();
    const geoJson = geoJsonFormatter.writeFeaturesObject(features, {
      featureProjection: projCode,
      dataProjection: 'EPSG:4326',
    });
    return await GeoJsonDataSource.load(geoJson);
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
    console.log('lg', lg);
    lw = parseInt((lg / pixScale).toFixed(0));
    console.log('lw', lw);
    if (lw <= DesiredScaleLineLength) {
      return [`${lw}px`, `${lg} ${unit}`];
    }
  }
  unit = mode === ScaleMode.M ? 'm' : 'ft';
  scale = mode === ScaleMode.M ? ScaleM : ScaleFt;
  let pixScaleSmall = mode === ScaleMode.M ? pixScale * KmToM : pixScale * KmToFt;
  for (let i = 0; i < scale.length; i++) {
    lg = scale[i];
    console.log('lg', lg);
    lw = parseInt((lg / pixScaleSmall).toFixed(0));
    console.log('lw', lw);
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
    // The scale of the earth on the map compared to real world earth.
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
  MapEventProcessor.zoomToExtent(oViewer.mapId, projdExtent, { padding: [1, 1, 1, 1], maxZoom: 30, duration: 1 });
}

function styleVectorDataSource(datasource: GeoJsonDataSource | undefined, layer: VectorLayer) {
  if (!datasource || !layer) return;
  datasource.entities.values.forEach((entity) => {
    const featureId = entity.properties?.featureId?.getValue();
    const layerSource = layer.getSource();
    if (!layerSource) return;
    const olFeature = layerSource.getFeatures().find((feature) => feature.values_.featureId === featureId);
    console.log('olFeature', olFeature);
    if (olFeature) {
      let style = extractStyleForFeature(layer, olFeature);
      if (style instanceof Array) {
        style = style[0];
      }
      if (style == null) return;
      const stroke = style.getStroke();
      const fill = style.getFill();

      if (entity.polygon) {
        entity.polygon.material = fill ? olColorToCesiumProperty(fill.getColor()) : blank;
        entity.polygon.outlineColor = stroke ? olColorToCesiumProperty(stroke.getColor()) : blank;
        entity.polygon.outlineWidth = stroke ? new ConstantProperty(stroke.getWidth()) : 0;
      }
      if (entity.polyline) {
        entity.polyline.material = stroke ? olColorToCesiumProperty(stroke.getColor()) : blank;
        entity.polyline.width = stroke ? stroke.getWidth() : 0;
      }
      if (entity.billboard) {
        const img = style.getImage();
        if (img instanceof Icon) {
          let src = img.getSrc();
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
  //if (source instanceof ImageWMS) {
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
  //}
}

const blank = new ColorMaterialProperty(Color.fromBytes(0, 0, 0, 0));

export function CesiumMap(props: MapProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const { viewer } = props;

  useEffect(() => {
    if (!viewerRef.current) return undefined;

    Camera.DEFAULT_VIEW_RECTANGLE = Rectangle.fromDegrees(
      ...viewer.convertExtentFromMapProjToProj(viewer.map.getView().calculateExtent(), 'EPSG:4326')
    );
    Camera.DEFAULT_VIEW_FACTOR = 0;

    let cViewer: Viewer;

    const initCesium = async () => {
      const terrainProvider = await createWorldTerrainAsync();
      cViewer = new Viewer(viewerRef.current!, {
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
      cViewer.camera.changed.addEventListener(() => {
        setOLMapExtent(viewer, cViewer);
        const centerPixel = new Cartesian2(cViewer.canvas.clientWidth / 2, cViewer.canvas.clientHeight / 2);
        const centerRay = cViewer.camera.getPickRay(centerPixel);
        const centerPosition = cViewer.scene.globe.pick(centerRay!, cViewer.scene);
        const bSphere = new BoundingSphere(centerPosition, 1.0);
        const pixSize = cViewer.camera.getPixelSize(bSphere, cViewer.scene.drawingBufferWidth, cViewer.scene.drawingBufferHeight);
        const initialRes = (2 * Math.PI * Ellipsoid.WGS84.maximumRadius) / 256;
        const zoomLevel = parseFloat(Math.log2(initialRes / pixSize).toFixed(2));
        MapEventProcessor.setMapChangeSize(viewer.mapId, [10, 10], getMapScale(pixSize));
      });

      const layers = viewer.map.getAllLayers();
      layers.forEach(async (layer) => {
        if (layer instanceof VectorLayer) {
          const datasource = await VectorLayerDataSource(viewer, layer);
          datasource ? cViewer.dataSources.add(datasource) : null;
          styleVectorDataSource(datasource, layer);
        } else if (layer instanceof ImageLayer) {
          const imageryProvider = ImageLayerDataSource(viewer, layer);
          cViewer.imageryLayers.addImageryProvider(imageryProvider);
        }
      });
    };

    initCesium();

    return () => {
      if (cViewer && !cViewer.isDestroyed()) {
        cViewer.destroy();
      }
    };
  }, []);

  return <div ref={viewerRef} style={{ width: '100%', height: '100vh', display: 'block' }} />;
}

function olColorToCesiumProperty(olColor: [number, number, number, number] | string): MaterialProperty {
  // OL can be like [r, g, b, a] or a CSS string
  if (Array.isArray(olColor)) {
    return new ColorMaterialProperty(Color.fromBytes(olColor[0], olColor[1], olColor[2], olColor[3] * 255));
  }
  return new ColorMaterialProperty(Color.fromCssColorString(olColor));
}

// function extractStyleForFeature(layer: VectorLayer, feature: Feature) {
//   let style: StyleLike | FlatStyleLike | undefined | null = feature.getStyle();
//   if (style == null) {
//     style = layer.getStyle();
//   }
//   return typeof style === 'function' ? style(feature, 1) : style;
// }

// function extractStyleForFeature(layer: VectorLayer<VectorSource>, feature: Feature<Geometry>): Style | Style[] | null {
//   let style = feature.getStyle() ?? layer.getStyle();
//   return typeof style === 'function' ? style(feature, 0) : style;
// }
function extractStyleForFeature(layer: VectorLayer<VectorSource>, feature: Feature<Geometry>): Style | Style[] | null {
  const styleCandidate = feature.getStyle() ?? layer.getStyle();

  // Short-circuit if undefined, null, or void
  if (!styleCandidate) return null;

  // If it's a function, call it — assume it returns Style or Style[]
  if (typeof styleCandidate === 'function') {
    const result = styleCandidate(feature, 0);
    // You may want to do runtime checks here too
    return Array.isArray(result) || result instanceof Style ? result : null;
  }

  // Otherwise, assert it's Style or Style[]
  return Array.isArray(styleCandidate) || styleCandidate instanceof Style ? styleCandidate : null;
}
