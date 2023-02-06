/* eslint-disable react/require-default-props */
import { ReactElement } from 'react';

import { TypeWindow, payloadIsAllQueriesDone, payloadIsQueryLayer, TypeArrayOfLayerData, getLocalizedValue } from 'geoview-core';

interface Props {
  mapId: string;
  buttonId?: string;
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
            api
              .map(mapId)
              .appBarButtons.getAppBarButtonPanelById(buttonId === undefined ? '' : buttonId)
              ?.panel?.open();
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
      api.eventNames.GET_FEATURE_INFO.QUERY_LAYER,
      (payload) => {
        if (payloadIsQueryLayer(payload)) {
          const { location } = payload;
          setLatLng(location);
        } else {
          setLatLng([]);
        }
      },
      mapId
    );
    return () => {
      api.event.off(api.eventNames.GET_FEATURE_INFO.ALL_QUERIES_DONE, mapId);
      api.event.off(api.eventNames.GET_FEATURE_INFO.QUERY_LAYER, mapId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setList(api.map(mapId).details.createDetails(mapId, details, { mapId, location: latlng, backgroundStyle: 'dark', singleColumn: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details]);

  return <div>{list}</div>;
}
