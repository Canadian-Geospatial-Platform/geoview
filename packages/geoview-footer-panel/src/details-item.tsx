/* eslint-disable react/require-default-props */
import type React from 'react';
import { PayloadBaseClass } from 'geoview-core/src/api/events/payloads';
import {
  TypeWindow,
  payloadIsAMapMouseEvent,
  payloadIsAllQueriesDone,
  TypeArrayOfLayerData,
  getLocalizedValue,
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

  const { useState, useEffect } = react;

  const [details, setDetails] = useState<TypeArrayOfLayerData>([]);
  // eslint-disable-next-line @typescript-eslint/ban-types
  const [list, setList] = useState<React.ReactElement>();
  const [lngLat, setLngLat] = useState<Coordinate>([]);
  const [handlerName, setHandlerName] = useState<string | null>(null);

  const allQueriesDoneListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAllQueriesDone(payload)) {
      const { resultSets } = payload;
      const newDetails: TypeArrayOfLayerData = [];
      Object.keys(resultSets).forEach((layerPath) => {
        const layerName = getLocalizedValue(api.map(mapId).layer.registeredLayers[layerPath].layerName, mapId)!;
        const features = resultSets[layerPath]!.data;
        if (features.length > 0) {
          newDetails.push({ layerPath, layerName, features });
        }
      });
      if (newDetails.length > 0) {
        setDetails(newDetails);
      } else {
        setDetails([]);
      }
    } else {
      setDetails([]);
    }
  };

  const eventMapSingleClickListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAMapMouseEvent(payload)) {
      const { coordinates } = payload;
      setHandlerName(payload.handlerName);
      setLngLat(coordinates.lnglat);
    } else {
      setLngLat([]);
    }
  };

  useEffect(() => {
    // create the listener to return the details
    api.event.on(api.eventNames.GET_FEATURE_INFO.ALL_QUERIES_DONE, allQueriesDoneListenerFunction, `${mapId}/$FeatureInfoLayerSet$`);
    api.event.on(api.eventNames.MAP.EVENT_MAP_SINGLE_CLICK, eventMapSingleClickListenerFunction, mapId);
    return () => {
      api.event.off(api.eventNames.GET_FEATURE_INFO.ALL_QUERIES_DONE, mapId, allQueriesDoneListenerFunction);
      api.event.off(api.eventNames.MAP.EVENT_MAP_SINGLE_CLICK, mapId, eventMapSingleClickListenerFunction);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setList(api.map(mapId).details.createDetails(mapId, details, { mapId, location: lngLat, handlerName }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details, lngLat]);

  return <div>{list}</div>;
}
