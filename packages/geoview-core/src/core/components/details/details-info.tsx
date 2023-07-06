import { useState, useContext, useEffect } from 'react';
import { Typography, Box } from '@mui/material';
import { Coordinate } from 'ol/coordinate';
import { TypeArrayOfLayerData } from './details';
import { MapContext } from '../../app-start';
import { api, getLocalizedValue, payloadIsAMapMouseEvent, payloadIsAllQueriesDone } from '../../../app';

export function DetailsInfo() {
  const mapConfig = useContext(MapContext);
  const [details, setDetails] = useState<TypeArrayOfLayerData>([]);
  const [list, setList] = useState<React.ReactElement>();
  const [lngLat, setLngLat] = useState<Coordinate>([]);
  const [handlerName, setHandlerName] = useState<string | null>(null);
  const { mapId } = mapConfig;

  useEffect(() => {
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
            setDetails([]);
          }
        } else {
          setDetails([]);
        }
      },
      `${mapId}/$FeatureInfoLayerSet$`
    );

    api.event.on(
      api.eventNames.MAP.EVENT_MAP_SINGLE_CLICK,
      (payload) => {
        if (payloadIsAMapMouseEvent(payload)) {
          const { coordinates } = payload;
          setHandlerName(payload.handlerName);
          setLngLat(coordinates.lnglat);
        } else {
          setLngLat([]);
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
    setList(api.map(mapId).details.createDetails(mapId, details, { mapId, location: lngLat, handlerName }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details, lngLat]);

  return (
    <Box>
      <Typography>Details</Typography>
      <Box>{list}</Box>
    </Box>
  );
}
