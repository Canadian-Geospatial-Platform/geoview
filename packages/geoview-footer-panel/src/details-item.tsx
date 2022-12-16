/* eslint-disable react/require-default-props */
import { DetailedReactHTMLElement } from 'react';

import { TypeWindow, payloadIsAllQueriesDone, TypeArrayOfLayerData, getLocalizedValue } from 'geoview-core';

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

  const [details, setDetails] = useState<TypeArrayOfLayerData>([{ layerPath: '', layerName: '', features: [] }]);
  // eslint-disable-next-line @typescript-eslint/ban-types
  const [list, setList] = useState<DetailedReactHTMLElement<{}, HTMLElement>>();

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
          } else {
            setDetails([{ layerPath: '', layerName: '', features: [] }]);
          }
        } else {
          setDetails([{ layerPath: '', layerName: '', features: [] }]);
        }
      },
      mapId,
      `${mapId}-DetailsAPI`
    );
    return () => {
      api.event.off(api.eventNames.GET_FEATURE_INFO.ALL_QUERIES_DONE, mapId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useEffect(() => {
  //   setDetails({
  //     layerName: 'This is the layer',
  //     features: layerSet.resultSets['esriFeatureLYR4/8'] !== undefined ? layerSet.resultSets['esriFeatureLYR4/8'] : [],
  //   });
  // }, [layerSet]);

  useEffect(() => {
    setList(api.map(mapId).details.createDetails(mapId, details));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details]);

  return <div>{list}</div>;
}
