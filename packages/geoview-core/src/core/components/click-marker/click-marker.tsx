import React, { useCallback, useContext, useEffect, useRef } from 'react';

import { Coordinate } from 'ol/coordinate';
import { Geometry, LineString, MultiLineString, MultiPoint, MultiPolygon, Point, Polygon } from 'ol/geom';
import Feature from 'ol/Feature';
import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { getCenter } from 'ol/extent';
import { Fill, Stroke, Style } from 'ol/style';
import CircleStyle from 'ol/style/Circle';
import { getUid } from 'ol';
import { fromExtent } from 'ol/geom/Polygon';
import { MapContext } from '@/core/app-start';

import { getGeoViewStore } from '@/core/stores/stores-managers';

import { PayloadBaseClass, TypeFeatureInfoEntry, TypeJsonObject, api, payloadIsAllQueriesDone } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';
import { Box, ClickMapMarker } from '@/ui';

import {
  featureHighlightPayload,
  payloadIsAFeatureHighlight,
  clearHighlightsPayload,
  payloadIsAClearHighlights,
} from '@/api/events/payloads';
import { payloadIsABBoxHighlight } from '@/api/events/payloads/bbox-highlight-payload';
import { useMapClickMarker, useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';

export type TypeClickMarker = {
  lnglat: Coordinate;
  symbology?: TypeJsonObject;
};

/**
 * Create a react element to display a marker ( at the click location) when a user clicks on
 * the map
 *
 * @returns {JSX.Element} the react element with a marker on click
 */
export function ClickMarker(): JSX.Element {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  // internal state
  const markerCoordinates = useRef<Coordinate>();
  const clickMarkerRef = useRef<HTMLDivElement>(null);
  const clickMarkerId = `${mapId}-clickmarker`;

  // get values from the store
  const clickMarker = useMapClickMarker();
  const { hideClickMarker, setOverlayClickMarkerRef, showClickMarker } = useMapStoreActions();
  setTimeout(() => setOverlayClickMarkerRef(clickMarkerRef.current as HTMLElement), 0);

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
  let intervals: NodeJS.Timeout[] = [];

  /**
   * Remove the marker icon
   */
  const removeIcon = useCallback(() => {
    hideClickMarker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Set animation for points
   *
   * @param {number} radius max radius of circle to draw
   * @param {Feature<Point>} pointFeature the feature to animate
   * @returns {NodeJS.Timeout} The interval timer.
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
   * Set animation for polygons
   *
   * @param {Geometry} geometry the geometry to animate
   * @returns {NodeJS.Timeout} The interval timer.
   */
  function polygonInterval(geometry: Geometry, feature: Feature): NodeJS.Timeout {
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

  let bboxTimeout: NodeJS.Timeout;
  const highlightGeolocatorBBox = (payload: PayloadBaseClass) => {
    if (payloadIsABBoxHighlight(payload)) {
      if (animationSource.getFeatureById('geoLocatorFeature')) {
        animationSource.removeFeature(animationSource.getFeatureById('geoLocatorFeature') as Feature);
        clearTimeout(bboxTimeout);
      }
      const bboxFill = new Fill({ color: [0, 0, 0, 0.3] });
      const bboxStyle = new Style({ stroke: new Stroke({ color: 'black', width: 1.25 }), fill: bboxFill });
      const bboxPoly = fromExtent(payload.bbox);
      const bboxFeature = new Feature(bboxPoly);
      bboxFeature.setStyle(bboxStyle);
      bboxFeature.setId('geoLocatorFeature');
      animationSource.addFeature(bboxFeature);
      bboxTimeout = setTimeout(() => animationSource.removeFeature(animationSource.getFeatureById('geoLocatorFeature') as Feature), 5000);
    }
  };

  const highlightCallbackFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAFeatureHighlight(payload) && payload.feature.geometry) {
      highlightFeature(payload.feature);
    }
  };

  const clearHighlightCallbackFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAClearHighlights(payload)) {
      resetAnimation(payload.id);
    }
  };

  const allQueriesDoneListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAllQueriesDone(payload)) {
      const { eventType, resultSets } = payload;
      if (eventType === 'click') {
        let feature: TypeFeatureInfoEntry | undefined;

        Object.keys(resultSets).every((layerPath) => {
          const features = resultSets[layerPath]!.layerStatus === 'error' ? null : resultSets[layerPath]!.data.click?.features;
          if (features && features.length > 0 && features[0].geoviewLayerType !== 'ogcWms') {
            [feature] = features;
            return false;
          }

          return true;
        });

        if (feature) {
          api.event.emit(featureHighlightPayload(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_FEATURE, mapId, feature));
          hideClickMarker();
        } else showClickMarker({ lnglat: markerCoordinates.current! });
      }
    }
  };

  useEffect(() => {
    // if mapClickCoordinates changed, single click event has been triggered
    const unsubMapSingleClick = getGeoViewStore(mapId).subscribe(
      (state) => state.mapState.clickCoordinates,
      (curClick, prevClick) => {
        if (curClick !== prevClick) {
          showClickMarker({ lnglat: curClick!.lnglat });
          markerCoordinates.current = curClick!.lnglat;
          api.event.emit(clearHighlightsPayload(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_CLEAR, mapId, 'all'));
        }
      }
    );

    api.event.on(EVENT_NAMES.GET_FEATURE_INFO.ALL_QUERIES_DONE, allQueriesDoneListenerFunction, `${mapId}/FeatureInfoLayerSet`);
    api.event.on(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_FEATURE, highlightCallbackFunction, mapId);
    api.event.on(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_CLEAR, clearHighlightCallbackFunction, mapId);
    api.event.on(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_BBOX, highlightGeolocatorBBox, mapId);

    return () => {
      unsubMapSingleClick();
      api.event.off(EVENT_NAMES.GET_FEATURE_INFO.ALL_QUERIES_DONE, mapId, allQueriesDoneListenerFunction);
      api.event.off(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_FEATURE, mapId, highlightCallbackFunction);
      api.event.off(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_CLEAR, mapId, clearHighlightCallbackFunction);
      api.event.off(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_BBOX, mapId, highlightGeolocatorBBox);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      ref={clickMarkerRef}
      id={clickMarkerId}
      sx={{ position: 'absolute', visibility: clickMarker !== undefined ? 'visible' : 'hidden' }}
    >
      <ClickMapMarker
        sx={{
          animation: 'opacity 1s ease-in',
          '@keyframes opacity': {
            from: {
              opacity: 0,
            },
            to: {
              opacity: 1,
            },
          },
        }}
        fontSize="large"
        color="warning"
      />
    </Box>
  );
}
