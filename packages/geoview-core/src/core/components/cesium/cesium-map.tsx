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
  WebMapServiceImageryProvider,
  Ellipsoid,
  BoundingSphere,
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

type MapProps = {
  viewer: MapViewer;
};

async function VectorLayerDataSource(viewer: MapViewer, layer: VectorLayer) {
  const source = layer.getSource();
  const style = layer.getStyle();
  console.log(style);
  const features = source!.getFeatures();
  if (features.length > 0) {
    const geoJsonFormatter = new GeoJSON();
    const projCode = viewer.getProjection().getCode();
    const geoJson = geoJsonFormatter.writeFeaturesObject(features, {
      featureProjection: projCode,
      dataProjection: 'EPSG:4326',
    });
    // filter geometries that are "Circles" and add elipsoid geometries for each.
    return GeoJsonDataSource.load(geoJson);
  }
  return undefined;
}

function getMapScale(pixSize: number): TypeScaleInfo {
  const lwm = 100;
  const lgm = ((pixSize * lwm) / 1000).toFixed(0);
  const lwi = 100;
  const lgi = ((pixSize * 0.621371 * lwi) / 1000).toFixed(0);
  return {
    labelGraphicMetric: `${lgm}km`,
    lineWidthMetric: `${lwm}px`,
    labelGraphicImperial: `${lgi}mi`,
    lineWidthImperial: `${lwi}px`,
    // The scale of the earth on the map compared to real world earth.
    labelNumeric: `1:${pixSize}km | 1:${pixSize * 0.621371}mi`,
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

export function CesiumMap(props: MapProps): JSX.Element {
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
      // const imageryProvider = ArcGisMapServerImageryProvider.fromUrl(
      //   'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
      //   {
      //     enablePickFeatures: false,
      //   }
      // );

      // const baseLayer = ImageryLayer.fromProviderAsync(imageryProvider, {});

      // eslint-disable-next-line react-hooks/exhaustive-deps
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
          // datasource.entities.values.forEach((entity) => {
          //   const featureId = entity.properties?.id?.getValue();
          //   const olFeature = layer.getSource().getFeatureById(featureId);

          //   if (olFeature) {
          //     const style = extractStyleForFeature(layer, olFeature);
          //     const stroke = style.getStroke();
          //     const fill = style.getFill();

          //     if (entity.polygon && fill) {
          //       entity.polygon.material = olColorToCesium(fill.getColor());
          //     }
          //     if (entity.polyline && stroke) {
          //       entity.polyline.material = olColorToCesium(stroke.getColor());
          //       entity.polyline.width = stroke.getWidth();
          //     }
          //     if (entity.point && style.getImage()) {
          //       const img = style.getImage();
          //       if (img.getFill()) {
          //         entity.point.color = olColorToCesium(img.getFill().getColor());
          //       }
          //       if (img.getRadius) {
          //         entity.point.pixelSize = img.getRadius();
          //       }
          //     }
          //   }
          // });
        } else if (layer instanceof ImageLayer) {
          const source = layer.getSource();
          if (source instanceof ImageWMS) {
            const url = source.getUrl();
            const params = source.getParams();
            const options: WebMapServiceImageryProvider.ConstructorOptions = {
              url: url!,
              layers: params.LAYERS,
              enablePickFeatures: false,
              parameters: {
                FORMAT: 'image/png',
                TRANSPARENT: 'TRUE',
              },
            };
            const imageryProvider = new WebMapServiceImageryProvider(options);
            cViewer.imageryLayers.addImageryProvider(imageryProvider);
          }
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

/*
function olColorToCesium(olColor) {
  // OL can be like [r, g, b, a] or a CSS string
  if (Array.isArray(olColor)) {
    return Color.fromBytes(olColor[0], olColor[1], olColor[2], olColor[3] * 255);
  }
  return Color.fromCssColorString(olColor);
}

function extractStyleForFeature(layer: VectorLayer, feature) {
  const style = layer.getStyle();
  return typeof style === 'function' ? (style as (any) => { any })(feature) : style;
}
*/
