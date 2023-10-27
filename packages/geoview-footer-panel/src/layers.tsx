/* eslint-disable react/require-default-props */
import type React from 'react';
import { TypeWindow, payloadIsALayerConfig, payloadIsRemoveGeoViewLayer } from 'geoview-core';
import { LayerConfigPayload, PayloadBaseClass, TypeRemoveGeoviewLayerPayload } from 'geoview-core/src/api/events/payloads';

interface Props {
  mapId: string;
}
const w = window as TypeWindow;

/**
 * Create an element that displays the layers component
 *
 * @returns {JSX.Element} created layers component
 */
export function Layers({ mapId }: Props): JSX.Element {
  const { cgpv } = w;
  const { api, react } = cgpv;

  const { useState, useEffect } = react;

  // eslint-disable-next-line @typescript-eslint/ban-types
  const [layers, setLayers] = useState<React.DetailedReactHTMLElement<{}, HTMLElement>>();
  const [mapLayers, setMapLayers] = useState<string[]>([]);

  const updateLayers = () => {
    if (api.maps[mapId].layer?.layerOrder !== undefined) setMapLayers([...api.maps[mapId].layer.layerOrder].reverse());
  };

  const eventMapLoadedListenerFunction = () => updateLayers();
  const eventRemoveLayerListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsRemoveGeoViewLayer(payload)) {
      setMapLayers((orderedLayers) =>
        orderedLayers.filter((layerId) => layerId !== (payload as TypeRemoveGeoviewLayerPayload).geoviewLayer.geoviewLayerId)
      );
    }
  };

  const eventAddLayerListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsALayerConfig(payload)) {
      api.event.on(
        api.eventNames.LAYER.EVENT_LAYER_ADDED,
        () => {
          updateLayers();
          api.event.off(api.eventNames.LAYER.EVENT_LAYER_ADDED, `${mapId}/${(payload as LayerConfigPayload).layerConfig.geoviewLayerId}`);
        },
        `${mapId}/${(payload as LayerConfigPayload).layerConfig.geoviewLayerId}`
      );
    }
  };

  useEffect(() => {
    api.event.on(api.eventNames.MAP.EVENT_MAP_LOADED, eventMapLoadedListenerFunction, mapId);
    api.event.on(api.eventNames.LAYER.EVENT_REMOVE_LAYER, eventRemoveLayerListenerFunction, mapId);
    api.event.on(api.eventNames.LAYER.EVENT_ADD_LAYER, eventAddLayerListenerFunction, mapId);

    return () => {
      api.event.off(api.eventNames.MAP.EVENT_MAP_LOADED, mapId, eventMapLoadedListenerFunction);
      api.event.off(api.eventNames.LAYER.EVENT_REMOVE_LAYER, mapId, eventRemoveLayerListenerFunction);
      api.event.off(api.eventNames.LAYER.EVENT_ADD_LAYER, mapId, eventAddLayerListenerFunction);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLayers(api.maps[mapId].layers.createLayers({ layerIds: mapLayers, isRemoveable: false, canSetOpacity: true, canZoomTo: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLayers]);

  return <div>{layers}</div>;
}
