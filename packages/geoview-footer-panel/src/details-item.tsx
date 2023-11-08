/* eslint-disable react/require-default-props */
import type React from 'react';
// import { MapMouseEventPayload, PayloadBaseClass } from 'geoview-core/src/api/events/payloads';
import {
  useDetailsStoreLayerDataArray,
  MapMouseEventPayload,
  PayloadBaseClass,
  TypeWindow,
  payloadIsAMapMouseEvent,
  Coordinate,
} from 'geoview-core';

interface Props {
  mapId: string;
}

const w = window as TypeWindow;

/**
 * Create an element that displays the details component
 *
 * @returns {JSX.Element} created details component
 */
export function DetailsItem({ mapId }: Props): JSX.Element {
  const { cgpv } = w;
  const { api, react } = cgpv;

  // get values from the store
  const details = useDetailsStoreLayerDataArray();

  const { useState, useEffect } = react;

  //  const [details, setDetails] = useState<TypeArrayOfLayerData>([]);
  const [list, setList] = useState<React.ReactElement>();
  const [lngLat, setLngLat] = useState<Coordinate>([]);
  const [handlerName, setHandlerName] = useState<string | null>(null);

  const eventMapSingleClickListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAMapMouseEvent(payload)) {
      const { coordinates } = payload as MapMouseEventPayload;
      setHandlerName(payload.handlerName);
      setLngLat(coordinates.lnglat);
    } else {
      setLngLat([]);
    }
  };

  useEffect(() => {
    // create the listener to return the details
    api.event.on(api.eventNames.MAP.EVENT_MAP_SINGLE_CLICK, eventMapSingleClickListenerFunction, mapId);
    return () => {
      api.event.off(api.eventNames.MAP.EVENT_MAP_SINGLE_CLICK, mapId, eventMapSingleClickListenerFunction);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // once page loads, details is empty array based on the useState we defined
    // we need to create details if we click on a map and single click event triggered, then we have array of layers that is details
    // if (details.length > 0) {
    setList(api.maps[mapId].details.createDetails(mapId, details, { mapId, location: lngLat, handlerName }));
    // }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details, lngLat]);

  return <div>{list}</div>;
}
