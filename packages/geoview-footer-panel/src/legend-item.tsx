/* eslint-disable react/require-default-props */
import type React from 'react';
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
  const [legend, setLegend] = useState<React.DetailedReactHTMLElement<{}, HTMLElement>>();
  const [mapLayers, setMapLayers] = useState<string[]>([]);

  const updateLayers = () => {
    if (api.map(mapId).layer?.layerOrder !== undefined) setMapLayers([...api.map(mapId).layer.layerOrder].reverse());
  };

  useEffect(() => {
    api.event.on(
      api.eventNames.MAP.EVENT_MAP_LOADED,
      () => {
        updateLayers();
      },
      mapId
    );
    api.event.on(
      api.eventNames.LAYER.EVENT_REMOVE_LAYER,
      (payload) => {
        if (payloadIsRemoveGeoViewLayer(payload)) {
          setMapLayers((orderedLayers) => orderedLayers.filter((layerId) => layerId !== payload.geoviewLayer.geoviewLayerId));
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
              updateLayers();
              api.event.off(api.eventNames.LAYER.EVENT_LAYER_ADDED, `${mapId}/${payload.layerConfig.geoviewLayerId}`);
            },
            `${mapId}/${payload.layerConfig.geoviewLayerId}`
          );
        }
      },
      mapId
    );
    return () => {
      api.event.off(api.eventNames.MAP.EVENT_MAP_LOADED, mapId);
      api.event.off(api.eventNames.LAYER.EVENT_ADD_LAYER, mapId);
      api.event.off(api.eventNames.LAYER.EVENT_REMOVE_LAYER, mapId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLegend(api.map(mapId).legend.createLegend({ layerIds: mapLayers, isRemoveable: false, canSetOpacity: true, canZoomTo: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLayers]);

  return <div>{legend}</div>;
}
