import { useContext, useEffect, useState } from 'react';
import { MapContext } from '../../app-start';
import { AbstractGeoViewLayer, api, payloadIsALayerConfig } from '../../../app';
import { List } from '../../../ui';
import { LegendItem } from './legend-item';

const sxStyles = {
  legend: {
    width: '100%',
    // maxWidth: 350, // for testing panel width
  },
};

/**
 * The Legend component is used to display a list of layers and their content.
 *
 * @returns {JSX.Element} returns the Legend component
 */
export function Legend(): JSX.Element | null {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  const configLayerIds = api.map(mapId).mapFeaturesConfig.map.listOfGeoviewLayerConfig?.map((element) => element.geoviewLayerId) || [];

  const [mapLayers, setMapLayers] = useState<{ [geoviewLayerId: string]: AbstractGeoViewLayer }>({});

  useEffect(() => {
    setMapLayers(api.map(mapId).layer.geoviewLayers);
    api.event.on(
      api.eventNames.LAYER.EVENT_REMOVE_LAYER,
      () => {
        setMapLayers(() => ({
          ...api.map(mapId).layer.geoviewLayers,
        }));
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
              setMapLayers(() => ({
                ...api.map(mapId).layer.geoviewLayers,
              }));
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
  }, []);

  return (
    <div>
      <List sx={sxStyles.legend}>
        {Object.keys(mapLayers).map((layerId) => {
          return (
            <LegendItem
              key={layerId}
              layerId={layerId}
              rootGeoViewLayer={mapLayers[layerId]}
              isRemoveable={!configLayerIds.includes(layerId)}
            />
          );
        })}
      </List>
    </div>
  );
}
