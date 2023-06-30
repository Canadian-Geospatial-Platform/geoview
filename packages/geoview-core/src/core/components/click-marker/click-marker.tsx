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
import { getUid } from 'ol';
import { MapContext } from '../../app-start';

import { PayloadBaseClass, TypeFeatureInfoEntry, api, payloadIsAllQueriesDone } from '../../../app';
import { EVENT_NAMES } from '../../../api/events/event-types';
import { ClickMapMarker } from '../../../ui';

import { payloadIsAMarkerDefinition } from '../../../api/events/payloads/marker-definition-payload';
import { payloadIsAMapMouseEvent } from '../../../api/events/payloads/map-mouse-event-payload';
import { featureHighlightPayload, payloadIsAFeatureHighlight } from '../../../api/events/payloads/feature-highlight-payload';
import { clearHighlightsPayload, payloadIsAClearHighlights } from '../../../api/events/payloads/clear-highlights-payload';

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

  // create styles to animate selections
  const blankStyle = new Style({});
  const whiteFill = new Fill({ color: [255, 255, 255, 0.3] });
  const whiteStyle = new Style({ stroke: new Stroke({ color: 'white', width: 1.25 }), fill: whiteFill });

  // variables to hold info about selected features
  let featureIds: string[] = [];
  let intervals: NodeJS.Timer[] = [];

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
   *
   * @param {number} radius max radius of circle to draw
   * @param {Feature<Point>} pointFeature the feature to animate
   * @returns {NodeJS.Timer} The interval timer.
   */
  function pointInterval(radius: number, pointFeature: Feature<Point>): NodeJS.Timer {
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
   * Set animation for polygons
   *
   * @param {Geometry} geometry the geometry to animate
   * @returns {NodeJS.Timer} The interval timer.
   */
  function polygonInterval(geometry: Geometry, feature: Feature): NodeJS.Timer {
    let counter = 10;
    let adjustGeometry = geometry.clone();
    const polygonIntervalId = setInterval(() => {
      adjustGeometry.scale(0.1 * counter);
      feature.setGeometry(adjustGeometry);
      counter--;
      if (counter === 0) {
        counter = 10;
        adjustGeometry = geometry.clone();
      }
    }, 250);
    return polygonIntervalId;
  }

  /**
   * Style, register, and add feature for animation
   *
   * @param {Feature} feature the feature to add
   * @param {string} id the id of the feature
   */
  function addFeatureAnimation(feature: Feature, id: string) {
    feature.setStyle(whiteStyle);
    feature.setId(id);
    featureIds.push(id);
    animationSource.addFeature(feature);
  }

  /**
   * Animate selected point
   *
   * @param {TypeFeatureInfoEntry} feature the point feature to animate
   */
  function animateSelection(feature: TypeFeatureInfoEntry) {
    const { height, width } = feature.featureIcon;
    const radius = Math.min(height, width) / 2 - 2 < 7 ? 7 : Math.min(height, width) / 2 - 2;
    const center = getCenter(feature.extent);
    const newPoint = new Point(center);
    const newFeature = new Feature(newPoint);
    const featureUid = getUid(feature.geometry);
    addFeatureAnimation(newFeature, featureUid);

    const multiIntervalId = pointInterval(radius, newFeature);
    intervals.push(multiIntervalId);
  }

  /**
   * Animate all points in MultiPoint feature
   *
   * @param {TypeFeatureInfoEntry} feature the MultiPoint feature to animate
   */
  function animateMultiPoint(feature: TypeFeatureInfoEntry) {
    const geometry = feature.geometry!.getGeometry() as MultiPoint;
    const { height, width } = feature.featureIcon;
    const radius = Math.min(height, width) / 2 - 2 < 7 ? 7 : Math.min(height, width) / 2 - 2;
    const coordinates: Coordinate[] = geometry.getCoordinates();
    const featureUid = getUid(feature.geometry);

    for (let i = 0; i < coordinates.length; i++) {
      const newPoint = new Point(coordinates[i]);
      const newFeature = new Feature(newPoint);
      const id = `${featureUid}-${i}`;
      addFeatureAnimation(newFeature, id);

      const multiIntervalId = pointInterval(radius, newFeature);
      intervals.push(multiIntervalId);
    }
  }

  /**
   * Animate selected polygon
   *
   * @param {TypeFeatureInfoEntry} feature the feature Polygon to animate
   */
  function animatePolygon(feature: TypeFeatureInfoEntry) {
    const newPolygon = feature.geometry!.getGeometry();
    const newFeature = new Feature(newPolygon);
    const featureUid = getUid(feature.geometry);
    addFeatureAnimation(newFeature, featureUid);

    const multiIntervalId = polygonInterval(feature.geometry!.getGeometry()! as Geometry, newFeature);
    intervals.push(multiIntervalId);
  }

  /**
   * Animate all points in MultiPolygon feature
   *
   * @param {TypeFeatureInfoEntry} feature the multiPolygon feature to animate
   */
  function animateMultiPolygon(feature: TypeFeatureInfoEntry) {
    const polygons = (feature.geometry?.getGeometry() as MultiPolygon).getPolygons();
    const featureUid = getUid(feature.geometry);

    for (let i = 0; i < polygons.length; i++) {
      const newPolygon = polygons[i];
      const newFeature = new Feature(newPolygon);
      const id = `${featureUid}-${i}`;
      addFeatureAnimation(newFeature, id);

      const multiIntervalId = polygonInterval(polygons[i], newFeature);
      intervals.push(multiIntervalId);
    }
  }

  /**
   * Animate selected lineString
   *
   * @param {TypeFeatureInfoEntry} feature the lineString feature to animate
   */
  function animateLineString(feature: TypeFeatureInfoEntry) {
    const newLineString = feature.geometry?.getGeometry();
    const newFeature = new Feature(newLineString);
    const featureUid = getUid(feature.geometry);
    addFeatureAnimation(newFeature, featureUid);
    let counter = 0;
    intervals.push(
      setInterval(() => {
        if (!(counter % 8)) newFeature.setStyle(whiteStyle);
        else newFeature.setStyle(blankStyle);
        counter++;
        if (counter > 9999) counter = 0;
      }, 250)
    );
  }

  /**
   * Reset animation feature and clear intervals
   *
   * @param {string} id the Uid of the feature to deselect, or 'all' to clear all
   */
  function resetAnimation(id: string) {
    if (id === 'all' && featureIds.length) {
      for (let i = 0; i < featureIds.length; i++) {
        animationSource.removeFeature(animationSource.getFeatureById(featureIds[i]) as Feature);
        clearInterval(intervals[i]);
      }
      featureIds = [];
      intervals = [];
    } else if (featureIds.length) {
      for (let i = featureIds.length - 1; i >= 0; i--) {
        if (featureIds[i] === id || featureIds[i].startsWith(`${id}-`)) {
          if (animationSource.getFeatureById(featureIds[i]))
            animationSource.removeFeature(animationSource.getFeatureById(featureIds[i]) as Feature);
          clearInterval(intervals[i]);
          intervals.splice(i, 1);
          featureIds.splice(i, 1);
        }
      }
    }
  }

  /**
   * Highlight a feature
   *
   * @param {TypeFeatureInfoEntry} feature the feature to highlight
   */
  function highlightFeature(feature: TypeFeatureInfoEntry) {
    removeIcon();
    const geometry = feature.geometry!.getGeometry();
    if (geometry instanceof Polygon) {
      animatePolygon(feature);
    } else if (geometry instanceof LineString || geometry instanceof MultiLineString) {
      animateLineString(feature);
    } else if (geometry instanceof MultiPoint) {
      animateMultiPoint(feature);
    } else if (geometry instanceof MultiPolygon) {
      animateMultiPolygon(feature);
    } else animateSelection(feature);
  }

  const highlightCallbackFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAFeatureHighlight(payload)) {
      highlightFeature(payload.feature);
    }
  };

  const clearHighlightCallbackFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAClearHighlights(payload)) {
      resetAnimation(payload.id);
    }
  };

  useEffect(() => {
    const { map } = api.map(mapId);

    // remove the marker on map zoom and move
    map.getView().on('change:resolution', removeIcon);
    map.on('movestart', removeIcon);

    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK,
      (payload) => {
        if (payloadIsAMapMouseEvent(payload)) {
          removeIcon();
          markerCoordinates.current = payload.coordinates.lnglat;
          api.event.emit(clearHighlightsPayload(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_CLEAR_HIGHLIGHTS, mapId, 'all'));
        }
      },
      mapId
    );

    api.event.on(
      EVENT_NAMES.GET_FEATURE_INFO.ALL_QUERIES_DONE,
      (payload) => {
        if (payloadIsAllQueriesDone(payload)) {
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
            api.event.emit(featureHighlightPayload(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_FEATURE, mapId, feature));
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

    api.event.on(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_FEATURE, highlightCallbackFunction, mapId);
    api.event.on(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_CLEAR_HIGHLIGHTS, clearHighlightCallbackFunction, mapId);

    return () => {
      api.event.off(EVENT_NAMES.GET_FEATURE_INFO.ALL_QUERIES_DONE, mapId);
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK, mapId);
      api.event.off(EVENT_NAMES.MARKER_ICON.EVENT_MARKER_ICON_SHOW, mapId);
      api.event.off(EVENT_NAMES.MARKER_ICON.EVENT_MARKER_ICON_HIDE, mapId);
      api.event.off(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_FEATURE, mapId, highlightCallbackFunction);
      api.event.off(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_CLEAR_HIGHLIGHTS, mapId, clearHighlightCallbackFunction);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={clickMarkerRef} id={clickMarkerId} style={{ visibility: showMarker ? 'visible' : 'hidden' }}>
      <ClickMapMarker fontSize="medium" color="action" />
    </div>
  );
}
