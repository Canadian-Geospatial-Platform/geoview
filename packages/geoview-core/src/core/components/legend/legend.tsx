import { useState, useContext, useEffect } from 'react';
import { Typography, Box } from '@mui/material';
import { MapContext } from '../../app-start';
import { api, payloadIsALayerConfig } from '../../../app';

export function Legend() {
  const mapConfig = useContext(MapContext);
  // eslint-disable-next-line @typescript-eslint/ban-types
  const [legend, setLegend] = useState<React.DetailedReactHTMLElement<{}, HTMLElement>>();
  const [mapLayers, setMapLayers] = useState<string[]>([]);

  const { mapId } = mapConfig;
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLegend(api.map(mapId).legend.createLegend({ layerIds: mapLayers, isRemoveable: false, canSetOpacity: true, canZoomTo: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLayers]);

  return (
    <Box>
      <Typography>Legend</Typography>
      <Box>{legend}</Box>
    </Box>
  );
}
