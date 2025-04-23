import React, { useEffect, useRef } from 'react';
import { Viewer, createWorldTerrainAsync, ArcGisMapServerImageryProvider, ImageryLayer } from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { MapViewer } from '@/geo/map/map-viewer';
import GeoJSON from 'ol/format/GeoJSON';
import { GeoJsonDataSource, Color } from 'cesium';
import VectorLayer from 'ol/layer/Vector';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import { WebMapServiceImageryProvider } from 'cesium';

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
    return await GeoJsonDataSource.load(geoJson);
  }
  return undefined;
}
export function CesiumMap(props: MapProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const { viewer } = props;

  useEffect(() => {
    if (!viewerRef.current) return undefined;

    let cViewer: Viewer;

    const initCesium = async () => {
      const terrainProvider = await createWorldTerrainAsync();
      // const imageryProvider = ArcGisMapServerImageryProvider.fromUrl(
      //   'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
      //   {
      //     enablePickFeatures: false,
      //   }
      // );

      //const baseLayer = ImageryLayer.fromProviderAsync(imageryProvider, {});

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
      let layers = viewer.map.getAllLayers();
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
