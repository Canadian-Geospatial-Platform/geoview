import { useContext, useEffect } from 'react';
import ReactDOM from 'react-dom';

import { ThemeProvider } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';

import TileLayer from 'ol/layer/Tile';
import { OverviewMap as OLOverviewMap } from 'ol/control';

import { OverviewMapToggle } from './overview-map-toggle';

import { EVENT_NAMES } from '../../../api/events/event-types';
import { api } from '../../../app';
import { MapContext } from '../../app-start';

import { payloadIsABasemapLayerArray } from '../../../api/events/payloads/basemap-layers-payload';
import { payloadIsAMapViewProjection } from '../../../api/events/payloads/map-view-projection-payload';

import { cgpvTheme } from '../../../ui/style/theme';

/**
 * Size of the overview map container
 */
export const MINIMAP_SIZE = {
  width: '150px',
  height: '150px',
};

const useStyles = makeStyles((theme) => ({
  overviewMap: {
    bottom: 'auto',
    left: 'auto',
    right: theme.spacing(5),
    top: theme.spacing(5),
    margin: 5,
    padding: 0,
    '& .ol-overviewmap-map': {
      border: 'none',
      display: 'block !important',
      '-webkit-transition': '300ms linear',
      '-moz-transition': '300ms linear',
      '-o-transition': '300ms linear',
      '-ms-transition': '300ms linear',
      transition: '300ms linear',
    },
    '&.ol-uncollapsible': {
      bottom: 'auto',
      left: 'auto',
      right: 100,
      top: 100,
      margin: 5,
    },
    '&:not(.ol-collapsed)': {
      boxShadow: '0 1px 5px rgb(0 0 0 / 65%)',
      borderRadius: 4,
      border: 'none',
    },
    '&:is(.ol-collapsed)': {
      boxShadow: '0 1px 5px rgb(0 0 0 / 65%)',
      borderRadius: 4,
      border: 'none',
    },
    '& button': {
      zIndex: theme.zIndex.tooltip,
      position: 'absolute',
      top: 0,
      right: 0,
      left: 'auto !important',
      bottom: 'auto !important',
      background: '#cccccc',
      '&:hover': {
        outline: 'none',
      },
    },
    '&::before': {
      content: '""',
      display: 'block',
      position: 'absolute',
      width: 0,
      height: 0,
      borderRadius: 2,
      zIndex: theme.zIndex.appBar,
      right: 0,
      top: 0,
    },
    '& .ol-overviewmap-box': {
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    '& .ol-viewport': {
      borderRadius: 4,
      '& .ol-layer': {
        backgroundColor: '#FFF',
      },
    },
  },
}));

/**
 * Creates an overview map control and adds it to the map
 *
 * @returns {JSX.Element} returns empty container
 */
export function OverviewMap(): JSX.Element {
  const mapConfig = useContext(MapContext);

  const { mapId } = mapConfig;

  const classes = useStyles();

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
              const layerMapId = layer.get('mapId');

              // check if the group id matches basemap
              if (layerMapId && layerMapId === 'basemap') {
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
              basemapLayer.set('mapId', 'basemap');

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

            // wait for the view change then set the map and open the overview
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

    const toggleButton = document.createElement('div');

    const overviewMapControl = new OLOverviewMap({
      className: `ol-overviewmap ol-custom-overviewmap ${classes.overviewMap}`,
      layers: defaultBasemap?.layers.map((layer) => {
        // create a tile layer for this basemap layer
        const tileLayer = new TileLayer({
          opacity: layer.opacity,
          source: layer.source,
        });

        // add this layer to the basemap group
        tileLayer.set(mapId, 'basemap');

        return tileLayer;
      }),
      collapseLabel: toggleButton,
      label: toggleButton,
      collapsed: false,
      rotateWithView: true,
      tipLabel: '',
    });

    map.addControl(overviewMapControl);

    ReactDOM.render(
      <ThemeProvider theme={cgpvTheme}>
        <OverviewMapToggle overviewMap={overviewMapControl} />
      </ThemeProvider>,
      toggleButton
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div />;
}
