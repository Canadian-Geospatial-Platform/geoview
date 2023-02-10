/* eslint-disable react/require-default-props */
import { DetailedReactHTMLElement } from 'react';
import { TypeWindow, payloadIsALayerConfig, payloadIsRemoveGeoViewLayer } from 'geoview-core';

interface Props {
  mapId: string;
}
const w = window as TypeWindow;

/**
 * Create an element that displays the legend component
 *
 * @returns {JSX.Element} created legend component
 */
export function LegendItem({ mapId }: Props): JSX.Element {
  const { cgpv } = w;
  const { api, react } = cgpv;

  const { useState, useEffect } = react;

  // eslint-disable-next-line @typescript-eslint/ban-types
  const [legend, setLegend] = useState<DetailedReactHTMLElement<{}, HTMLElement>>();
  const [mapLayers, setMapLayers] = useState<string[]>([]);

  const addLayer = (addGeoviewLayerId: string) => {
    if (Object.keys(api.map(mapId).layer.geoviewLayers).includes(addGeoviewLayerId)) {
      setMapLayers((orderedLayers) => [addGeoviewLayerId, ...orderedLayers]);
    } else {
      console.error('geoviewLayerId is not in the layers list');
    }
  };

  const removeLayer = (removeGeoviewLayerId: string) => {
    setMapLayers((orderedLayers) => orderedLayers.filter((layerId) => layerId !== removeGeoviewLayerId));
  };

  useEffect(() => {
    setMapLayers(Object.keys(api.map(mapId!).layer.geoviewLayers));
    api.event.on(
      api.eventNames.LAYER.EVENT_REMOVE_LAYER,
      (payload) => {
        if (payloadIsRemoveGeoViewLayer(payload)) {
          removeLayer(payload.geoviewLayer.geoviewLayerId);
        }
      },
      mapId
    );
    api.event.on(
      api.eventNames.LAYER.EVENT_ADD_LAYER,
      (payload) => {
        if (payloadIsALayerConfig(payload)) {
          api.event.on(
            api.eventNames.LAYER.EVENT_LAYER_ADDED,
            () => {
              addLayer(payload.layerConfig.geoviewLayerId);
              api.event.off(api.eventNames.LAYER.EVENT_LAYER_ADDED, mapId, payload.layerConfig.geoviewLayerId);
            },
            mapId,
            payload.layerConfig.geoviewLayerId
          );
        }
      },
      mapId
    );
    return () => {
      api.event.off(api.eventNames.LAYER.EVENT_ADD_LAYER, mapId);
      api.event.off(api.eventNames.LAYER.EVENT_REMOVE_LAYER, mapId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLegend(api.map(mapId).legend.createLegend({ layerIds: mapLayers, isRemoveable: false, canSetOpacity: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLayers]);

  return <div>{legend}</div>;
}
