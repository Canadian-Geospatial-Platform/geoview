import { useContext, useEffect } from 'react';

import TileLayer from 'ol/layer/Tile';
import { OverviewMap as OLOverviewMap } from 'ol/control';

import { EVENT_NAMES } from '../../../api/events/event';
import { api } from '../../../app';
import { MapContext } from '../../app-start';

import { payloadIsABasemapLayerArray } from '../../types/cgpv-types';
import { payloadIsAMapViewProjection } from '../../../api/events/payloads/map-view-projection-payload';

export function OverviewMap(): JSX.Element {
  const mapConfig = useContext(MapContext);

  const mapId = mapConfig.id;

  useEffect(() => {
    // listen to adding a new basemap events
    api.event.on(
      EVENT_NAMES.BASEMAP.EVENT_BASEMAP_LAYERS_UPDATE,
      (payload) => {
        if (payloadIsABasemapLayerArray(payload)) {
          if (payload.handlerName === mapId) {
            const overviewMap = api
              .map(mapId)
              .map.getControls()
              .getArray()
              .filter((item) => {
                return item instanceof OLOverviewMap;
              })[0] as OLOverviewMap;

            // remove previous basemaps
            const layers = overviewMap.getOverviewMap().getAllLayers();

            // loop through all layers on the map
            for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
              const layer = layers[layerIndex];

              // get group id that this layer belongs to
              const layerId = layer.get('id');

              // check if the group id matches basemap
              if (layerId && layerId === 'basemap') {
                // remove the basemap layer
                overviewMap.getOverviewMap().removeLayer(layer);
              }
            }

            // add basemap layers
            payload.layers.forEach((layer) => {
              const basemapLayer = new TileLayer({
                opacity: layer.opacity,
                source: layer.source,
              });

              // set this basemap's group id to basemap
              basemapLayer.set('id', 'basemap');

              // add the basemap layer
              overviewMap.getOverviewMap().addLayer(basemapLayer);

              // render the layer
              basemapLayer.changed();
            });
          }
        }
      },
      mapId
    );

    // listen to geoview-basemap-panel package change projection event
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_VIEW_PROJECTION_CHANGE,
      (payload) => {
        if (payloadIsAMapViewProjection(payload)) {
          if (payload.handlerName === mapId) {
            const overviewMap = api
              .map(mapId)
              .map.getControls()
              .getArray()
              .filter((item) => {
                return item instanceof OLOverviewMap;
              })[0] as OLOverviewMap;

            // collapse the overview map, if not projection throw an error
            overviewMap.setCollapsed(true);
            overviewMap.setMap(null);

            // wait for the view change then set the amp and open the overview
            // TODO: look for better options then Timeout
            setTimeout(() => {
              overviewMap.setMap(api.map(mapId).map);

              setTimeout(() => overviewMap.setCollapsed(false), 500);
            }, 2000);
          }
        }
      },
      mapId
    );

    return () => {
      api.event.off(EVENT_NAMES.BASEMAP.EVENT_BASEMAP_LAYERS_UPDATE, mapId);
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_VIEW_PROJECTION_CHANGE, mapId);
    };
  }, [mapId]);

  useEffect(() => {
    const { map } = api.map(mapId);

    const defaultBasemap = api.map(mapId).basemap.activeBasemap;

    const overviewMapControl = new OLOverviewMap({
      // see in overviewmap-custom.html to see the custom CSS used
      className: `ol-overviewmap ol-custom-overviewmap`,
      layers: defaultBasemap?.layers.map((layer) => {
        // create a tile layer for this basemap layer
        const tileLayer = new TileLayer({
          opacity: layer.opacity,
          source: layer.source,
        });

        // add this layer to the basemap group
        tileLayer.set('id', 'basemap');

        return tileLayer;
      }),
      collapseLabel: '\u00BB',
      label: '\u00AB',
      collapsed: false,
      rotateWithView: true,
    });

    map.addControl(overviewMapControl);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div />;
}
