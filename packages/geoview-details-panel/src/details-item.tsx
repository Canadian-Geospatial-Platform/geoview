/* eslint-disable react/require-default-props */
import { ReactElement } from 'react';

import {
  TypeWindow,
  payloadIsAMapSingleClick,
  mapSingleClickPayload,
  TypeMapSingleClick,
  payloadIsAllQueriesDone,
  TypeArrayOfLayerData,
  getLocalizedValue,
} from 'geoview-core';

interface Props {
  mapId: string;
  buttonId?: string;
}

interface TypeofClickPayload {
  handlerName: string | null;
  coordinates: TypeMapSingleClick;
}

const w = window as TypeWindow;

/**
 * Create an element that displays the details component
 *
 * @returns {JSX.Element} created details component
 */
export function DetailsItem({ mapId, buttonId }: Props): JSX.Element {
  const { cgpv } = w;
  const { api, react } = cgpv;

  const { useState, useEffect } = react;

  const [details, setDetails] = useState<TypeArrayOfLayerData>([]);
  // eslint-disable-next-line @typescript-eslint/ban-types
  const [list, setList] = useState<ReactElement>();
  const [latLng, setLatLng] = useState<unknown>([]);
  const [clicked, setClicked] = useState<boolean>(false);
  const [clickPayload, setClickPayload] = useState<TypeofClickPayload>({ handlerName: '', coordinates: {} as TypeMapSingleClick });

  const panel = api.map(mapId).appBarButtons.getAppBarButtonPanelById(buttonId === undefined ? '' : buttonId)?.panel;

  useEffect(() => {
    // create the listener to return the details
    api.event.on(
      api.eventNames.GET_FEATURE_INFO.ALL_QUERIES_DONE,
      (payload) => {
        if (payloadIsAllQueriesDone(payload)) {
          const { resultSets } = payload;
          const newDetails: TypeArrayOfLayerData = [];
          Object.keys(resultSets).forEach((layerPath) => {
            const layerName = getLocalizedValue(api.map(mapId).layer.registeredLayers[layerPath].layerName, mapId)!;
            const features = resultSets[layerPath]!;
            if (features.length > 0) {
              newDetails.push({ layerPath, layerName, features });
            }
          });
          if (newDetails.length > 0) {
            setDetails(newDetails);
            // open the details panel
            panel?.open();
          } else {
            setDetails([]);
          }
        } else {
          setDetails([]);
        }
      },
      mapId,
      `${mapId}-DetailsAPI`
    );
    api.event.on(
      api.eventNames.MAP.EVENT_MAP_SINGLE_CLICK,
      (payload) => {
        if (payloadIsAMapSingleClick(payload)) {
          const { handlerName, coordinates } = payload;
          setClickPayload({ handlerName, coordinates });
          setLatLng(coordinates.lnglat);
          setClicked(true);
        } else {
          setLatLng([]);
        }
      },
      mapId
    );

    return () => {
      api.event.off(api.eventNames.GET_FEATURE_INFO.ALL_QUERIES_DONE, mapId);
      api.event.off(api.eventNames.MAP.EVENT_MAP_SINGLE_CLICK, mapId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setList(api.map(mapId).details.createDetails(mapId, details, { mapId, location: latLng, backgroundStyle: 'dark', singleColumn: true }));

    // show marker
    setTimeout(() => {
      if (clicked && Array.isArray(details) && details.length > 0) {
        const { handlerName, coordinates } = clickPayload;
        api.event.emit(mapSingleClickPayload(api.eventNames.MAP.EVENT_MAP_SINGLE_CLICK, handlerName, coordinates));
        setClicked(false);
      }
    }, 1000);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details, latLng]);

  return <div>{list}</div>;
}
