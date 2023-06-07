import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';

import Overlay from 'ol/Overlay';
import { Coordinate } from 'ol/coordinate';
import { Geometry, LineString, MultiLineString, MultiPoint, MultiPolygon, Point, Polygon } from 'ol/geom';
import Feature from 'ol/Feature';
import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { fromLonLat } from 'ol/proj';
import { getCenter } from 'ol/extent';
import { Fill, Stroke, Style } from 'ol/style';
import CircleStyle from 'ol/style/Circle';
import { MapContext } from '../../app-start';

import { TypeFeatureInfoEntry, api, payloadIsAllQueriesDone } from '../../../app';
import { EVENT_NAMES } from '../../../api/events/event-types';
import { ClickMapMarker } from '../../../ui';

import { payloadIsAMarkerDefinition } from '../../../api/events/payloads/marker-definition-payload';
import { payloadIsAMapSingleClick } from '../../../api/events/payloads/map-slingle-click-payload';

/**
 * Create a react element to display a marker when a user clicks on
 * the map at the click location
 *
 * @returns {JSX.Element} the react element with a marker on click
 */
export function ClickMarker(): JSX.Element {
  const [showMarker, setShowMarker] = useState(false);
  const markerCoordinates = useRef<Coordinate>([0, 0]);
  const clickMarkerRef = useRef<HTMLDivElement>(null);

  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;
  const clickMarkerId = `${mapId}-clickmarker`;

  // create overlay for map click marker icon
  const clickMarkerOverlay = new Overlay({
    id: clickMarkerId,
    position: [-1, -1],
    positioning: 'center-center',
    offset: [0, -8],
    element: document.getElementById(clickMarkerId) as HTMLElement,
    stopEvent: false,
  });
  api.map(mapId).map.addOverlay(clickMarkerOverlay);

  // create resources to highlight features
  const animationSource = new VectorSource();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const overlayLayer = new VectorLayer({ source: animationSource, map: api.maps[mapId].map });

  // create feature to animate for selection
  const geom = new Point(fromLonLat([0, 0]));
  const animationPoint = new Feature(geom);
  const blankStyle = new Style({});
  const whiteFill = new Fill({ color: [255, 255, 255, 0.3] });
  const whiteStyle = new Style({ stroke: new Stroke({ color: 'white', width: 1.25 }), fill: whiteFill });
  animationPoint.setStyle(blankStyle);
  animationPoint.setId('animationPoint');
  animationSource.addFeature(animationPoint);

  // variables to hold ids that need to be cleared
  let intervalId: NodeJS.Timeout | undefined;
  let multiPointIds: string[] = [];
  let multiIntervals: NodeJS.Timer[] = [];

  /**
   * Remove the marker icon
   */
  const removeIcon = useCallback(() => {
    setShowMarker(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Show the marker icon
   * @param {Coordinate} lnglat the coordinate where to show the marker
   */
  function showMarkerIcon(lnglat: Coordinate) {
    // toggle the marker icon
    setShowMarker(true);
    api
      .map(mapId)
      .map.getOverlayById(`${mapId}-clickmarker`)
      .setPosition(fromLonLat(lnglat, `EPSG:${api.map(mapId).currentProjection}`));
  }

  /**
   * Set animation for points
   * @param {number} radius max radius of circle to draw
   * @param {Feature<Point>} pointFeature the feature to animate
   */
  function pointInterval(radius: number, pointFeature: Feature<Point>): NodeJS.Timeout {
    let animationRadius = radius;
    const pointIntervalId = setInterval(() => {
      const radStyle = new Style({
        image: new CircleStyle({
          radius: animationRadius,
          stroke: new Stroke({
            color: 'white',
          }),
          fill: whiteFill,
        }),
      });
      pointFeature.setStyle(radStyle);
      animationRadius -= 2;
      if (animationRadius <= 0) animationRadius = radius;
    }, 250);
    return pointIntervalId;
  }

  /**
   * Animate selected point
   * @param {TypeFeatureInfoEntry} feature the feature to animate
   */
  function animateSelection(feature: TypeFeatureInfoEntry) {
    const { height, width } = feature.featureIcon;
    const radius = Math.min(height, width) / 2 - 2 < 7 ? 7 : Math.min(height, width) / 2 - 2;
    const center = getCenter(feature.extent);
    (animationPoint.getGeometry() as Point).setCoordinates(center);
    intervalId = pointInterval(radius, animationPoint);
  }

  /**
   * Animate all points in MultiPoint feature
   * @param {TypeFeatureInfoEntry} feature the feature to animate
   */
  function animateMultiPoint(feature: TypeFeatureInfoEntry) {
    const geometry = feature.geometry!.getGeometry() as MultiPoint;
    const { height, width } = feature.featureIcon;
    const radius = Math.min(height, width) / 2 - 2 < 7 ? 7 : Math.min(height, width) / 2 - 2;
    const coordinates: Coordinate[] = geometry.getCoordinates();

    for (let i = 0; i < coordinates.length; i++) {
      const newPoint = new Point(coordinates[i]);
      const newFeature = new Feature(newPoint);
      newFeature.setStyle(whiteStyle);
      newFeature.setId(`multiPoint${i}`);
      multiPointIds.push(`multiPoint${i}`);
      animationSource.addFeature(newFeature);

      const multiIntervalId = pointInterval(radius, newFeature);
      multiIntervals.push(multiIntervalId);
    }
  }

  /**
   * Animate selected polygon
   * @param {Geometry} geometry the geometry of the polygon to select
   */
  function animatePolygon(geometry: Geometry) {
    (animationPoint as Feature).setGeometry(geometry);
    animationPoint.setStyle(whiteStyle);

    let counter = 10;
    let adjustGeometry = geometry.clone();
    intervalId = setInterval(() => {
      adjustGeometry.scale(0.1 * counter);
      (animationPoint as Feature).setGeometry(adjustGeometry);
      counter--;
      if (counter === 0) {
        counter = 10;
        adjustGeometry = geometry.clone();
      }
    }, 250);
  }

  /**
   * Animate selected lineString
   * @param {Geometry} geometry the geometry of the lineString to select
   */
  function animateLineString(geometry: Geometry) {
    (animationPoint as Feature).setGeometry(geometry);
    let counter = 0;
    intervalId = setInterval(() => {
      if (!(counter % 8)) animationPoint.setStyle(whiteStyle);
      else animationPoint.setStyle(blankStyle);
      counter++;
      if (counter > 9999) counter = 0;
    }, 250);
  }

  /**
   * Reset animation feature and clear intervals
   * @param {Geometry} geometry the geometry of the lineString to select
   */
  function resetAnimation() {
    if (intervalId) clearInterval(intervalId);

    if (multiPointIds) {
      for (let i = 0; i < multiPointIds.length; i++) {
        animationSource.removeFeature(animationSource.getFeatureById(multiPointIds[i]) as Feature);
        clearInterval(multiIntervals[i]);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
      multiPointIds = [];
      // eslint-disable-next-line react-hooks/exhaustive-deps
      multiIntervals = [];
    }

    (animationPoint as Feature).setGeometry(geom);
    animationPoint.setStyle(blankStyle);
  }

  useEffect(() => {
    const { map } = api.map(mapId);

    // remove the marker on map zoom and move
    map.getView().on('change:resolution', removeIcon);
    map.on('movestart', removeIcon);

    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK,
      (payload) => {
        if (payloadIsAMapSingleClick(payload)) {
          removeIcon();
          markerCoordinates.current = payload.coordinates.lnglat;
          resetAnimation();
        }
      },
      mapId
    );

    api.event.on(
      EVENT_NAMES.GET_FEATURE_INFO.ALL_QUERIES_DONE,
      (payload) => {
        if (payloadIsAllQueriesDone(payload)) {
          resetAnimation();
          const { resultSets } = payload;
          let feature: TypeFeatureInfoEntry | undefined;

          Object.keys(resultSets).every((layerPath) => {
            const features = resultSets[layerPath]!;
            if (features.length > 0 && features[0].geoviewLayerType !== 'ogcWms') {
              [feature] = features;
              return false;
            }

            return true;
          });

          if (feature) {
            const geometry = feature.geometry?.getGeometry();
            if (geometry instanceof Polygon || geometry instanceof MultiPolygon) {
              animatePolygon(geometry);
            } else if (geometry instanceof LineString || geometry instanceof MultiLineString) {
              animateLineString(geometry);
            } else if (geometry instanceof MultiPoint) {
              animateMultiPoint(feature);
            } else animateSelection(feature);
          } else showMarkerIcon(markerCoordinates.current);
        }
      },
      `${mapId}/$FeatureInfoLayerSet$`
    );

    api.event.on(
      EVENT_NAMES.MARKER_ICON.EVENT_MARKER_ICON_SHOW,
      (payload) => {
        if (payloadIsAMarkerDefinition(payload)) {
          // TODO: Also implement a symbology define by the payload for feature details item selection.
          showMarkerIcon(payload.lnglat);
        }
      },
      mapId
    );

    api.event.on(
      EVENT_NAMES.MARKER_ICON.EVENT_MARKER_ICON_HIDE,
      () => {
        setShowMarker(false);
      },
      mapId
    );

    return () => {
      api.event.off(EVENT_NAMES.GET_FEATURE_INFO.ALL_QUERIES_DONE, mapId);
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK, mapId);
      api.event.off(EVENT_NAMES.MARKER_ICON.EVENT_MARKER_ICON_SHOW, mapId);
      api.event.off(EVENT_NAMES.MARKER_ICON.EVENT_MARKER_ICON_HIDE, mapId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={clickMarkerRef} id={clickMarkerId} style={{ visibility: showMarker ? 'visible' : 'hidden' }}>
      <ClickMapMarker fontSize="medium" color="action" />
    </div>
  );
}
