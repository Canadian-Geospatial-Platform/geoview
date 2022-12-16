/* eslint-disable react/require-default-props */
import {
  TypeWindow,
  TypeJsonArray,
  TypeGeoviewLayerConfig,
  TypeGeoviewLayerType,
  SelectChangeEvent,
  snackbarMessagePayload,
  ButtonPropsLayerPanel,
  TypeListOfLayerEntryConfig,
  TypeJsonObject,
} from 'geoview-core';
import { DetailedReactHTMLElement } from 'react';

interface Props {
  mapId: string;
  layerSet: object;
}

const w = window as TypeWindow;

/**
 * Create an element that displays the details component
 *
 * @returns {JSX.Element} created details component
 */
export function DetailsItem({ mapId, layerSet }: Props): JSX.Element {
  const { cgpv } = w;
  const { api, react } = cgpv;

  const { useState, useEffect, useContext } = react;

  const [details, setDetails] = useState({ layerName: 'Click on map', features: [] });
  // eslint-disable-next-line @typescript-eslint/ban-types
  const [list, setList] = useState<DetailedReactHTMLElement<{}, HTMLElement>>();

  useEffect(() => {
    // create the listener to return the details
    // TODO: layer path are not define when layer is created, no result are assigned
    api.createFeatureInfoLayerSet(mapId, `${mapId}resultSetId`);
    api.event.on(
      api.eventNames.GET_FEATURE_INFO.ALL_QUERIES_DONE,
      (payload) =>
        setDetails({
          layerName: 'This is the layer',
          features: payload.resultSets['esriFeatureLYR4/8'] !== undefined ? payload.resultSets['esriFeatureLYR4/8'] : payload.resultSets.test,
        }),
      mapId
    );
    return () => {
      api.event.off(api.eventNames.GET_FEATURE_INFO.ALL_QUERIES_DONE, mapId);
    };
  }, []);

  // useEffect(() => {
  //   setDetails({
  //     layerName: 'This is the layer',
  //     features: layerSet.resultSets['esriFeatureLYR4/8'] !== undefined ? layerSet.resultSets['esriFeatureLYR4/8'] : [],
  //   });
  // }, [layerSet]);

  useEffect(() => {
    setList(api.map(mapId).details.createDetails(details));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details]);

  return <div>{list}</div>;
}
