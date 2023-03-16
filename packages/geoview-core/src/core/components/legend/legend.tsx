import { useContext, useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import { MapContext } from '../../app-start';
import { api } from '../../../app';
import { LegendItem } from './legend-item';
import { payloadIsRemoveGeoViewLayer } from '../../../api/events/payloads/geoview-layer-payload';
import { AbstractGeoViewLayer } from '../../../geo/layer/geoview-layers/abstract-geoview-layers';
import { payloadIsALayerConfig } from '../../../api/events/payloads/layer-config-payload';

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
  const [orderedMapLayers, setOrderedMapLayers] = useState<AbstractGeoViewLayer[]>([]);

  const addLayer = (geoviewLayerId: string) => {
    if (Object.keys(api.map(mapId).layer.geoviewLayers).includes(geoviewLayerId)) {
      const newLayer = api.map(mapId).layer.geoviewLayers[geoviewLayerId];
      setOrderedMapLayers((orderedLayers) => [newLayer, ...orderedLayers]);
    } else {
      // eslint-disable-next-line no-console
      console.error('geoviewLayerId is not in the layers list');
    }
  };

  useEffect(() => {
    setMapLayers(api.map(mapId).layer.geoviewLayers);
    api.event.on(
      api.eventNames.LAYER.EVENT_REMOVE_LAYER,
      (payload) => {
        if (payloadIsRemoveGeoViewLayer(payload)) {
          const removedGeoviewLayer = payload.geoviewLayer as AbstractGeoViewLayer;
          setOrderedMapLayers((orderedLayers) =>
            orderedLayers.filter((layer) => layer.geoviewLayerId !== removedGeoviewLayer.geoviewLayerId)
          );
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
              api.event.off(api.eventNames.LAYER.EVENT_LAYER_ADDED, `${mapId}/${payload.layerConfig.geoviewLayerId}`);
            },
            `${mapId}/${payload.layerConfig.geoviewLayerId}`
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
    if (Object.keys(mapLayers).length !== 0) {
      const layers: AbstractGeoViewLayer[] = [];
      configLayerIds.forEach((configId) => {
        layers.push(mapLayers[configId]);
      });
      setOrderedMapLayers(layers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLayers]);

  return (
    <Grid container spacing={2}>
      {orderedMapLayers.map((geoViewLayer) => {
        return (
          <LegendItem
            key={geoViewLayer.geoviewLayerId}
            layerId={geoViewLayer.geoviewLayerId}
            geoviewLayerInstance={geoViewLayer}
            isRemoveable={!configLayerIds.includes(geoViewLayer.geoviewLayerId)}
          />
        );
      })}
    </Grid>
  );
}
