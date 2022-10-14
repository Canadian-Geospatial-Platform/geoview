import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';

import Overlay from 'ol/Overlay';
import { Coordinate } from 'ol/coordinate';
import { fromLonLat } from 'ol/proj';

import { MapContext } from '../../app-start';

import { api } from '../../../app';
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
  const clickMarkerRef = useRef<HTMLDivElement>(null);

  const mapConfig = useContext(MapContext);
  const mapId = mapConfig.id;
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

  useEffect(() => {
    const { map } = api.map(mapId);

    // remove the marker on map zoom and move
    map.getView().on('change:resolution', removeIcon);
    map.on('movestart', removeIcon);

    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK,
      (payload) => {
        if (payloadIsAMapSingleClick(payload)) {
          if (payload.handlerName!.includes(mapId)) {
            showMarkerIcon(payload.coordinates.lnglat);
          }
        }
      },
      mapId
    );

    api.event.on(
      EVENT_NAMES.MARKER_ICON.EVENT_MARKER_ICON_SHOW,
      (payload) => {
        if (payloadIsAMarkerDefinition(payload)) {
          if (payload.handlerName!.includes(mapId)) {
            // TODO: Also implement a symbology define by the payload for feature details item selection.
            showMarkerIcon(payload.lnglat);
          }
        }
      },
      mapId
    );

    api.event.on(
      EVENT_NAMES.MARKER_ICON.EVENT_MARKER_ICON_HIDE,
      (payload) => {
        // we do not need to verify the payload as no marker are pass
        // we only need to validate if we have handler name (map id)
        if (payload.handlerName!.includes(mapId)) {
          setShowMarker(false);
        }
      },
      mapId
    );

    return () => {
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
