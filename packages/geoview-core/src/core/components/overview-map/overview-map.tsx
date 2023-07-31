import { useContext, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import i18n from 'i18next';
import { I18nextProvider } from 'react-i18next';

import { ThemeProvider } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';

import TileLayer from 'ol/layer/Tile';
import { OverviewMap as OLOverviewMap } from 'ol/control';

import { OverviewMapToggle } from './overview-map-toggle';

import { EVENT_NAMES } from '@/api/events/event-types';
import { PayloadBaseClass, api, payloadIsANumber } from '@/app';
import { MapContext } from '@/core/app-start';

import { payloadIsAMapViewProjection } from '@/api/events/payloads';

import { cgpvTheme } from '@/ui/style/theme';

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
      backgroundColor: '#cccccc',
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
  const { map, mapFeaturesConfig } = api.map(mapId);
  const hideOnZoom = mapFeaturesConfig.overviewMap?.hideOnZoom || 0;

  const classes = useStyles();

  const handleProjectionChange = (payload: PayloadBaseClass) => {
    if (payloadIsAMapViewProjection(payload)) {
      const overviewMap = map
        .getControls()
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
  };

  const hideBasedOnZoom = (payload: PayloadBaseClass) => {
    if (payloadIsANumber(payload)) {
      const overviewMap = map
        .getControls()
        .getArray()
        .filter((item) => {
          return item instanceof OLOverviewMap;
        })[0] as OLOverviewMap;
      if (payload.value < hideOnZoom) overviewMap.setMap(null);
      else overviewMap.setMap(api.map(mapId).map);
    }
  };

  useEffect(() => {
    // listen to geoview-basemap-panel package change projection event
    api.event.on(EVENT_NAMES.MAP.EVENT_MAP_VIEW_PROJECTION_CHANGE, handleProjectionChange, mapId);
    api.event.on(EVENT_NAMES.MAP.EVENT_MAP_ZOOM_END, hideBasedOnZoom, mapId);

    return () => {
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_VIEW_PROJECTION_CHANGE, mapId, handleProjectionChange);
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_ZOOM_END, mapId, hideBasedOnZoom);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId]);

  useEffect(() => {
    // get default overview map
    const defaultBasemap = api.map(mapId).basemap.overviewMap;

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
    if (api.map(mapId).map.getView().getZoom() && api.map(mapId).map.getView().getZoom()! < hideOnZoom) overviewMapControl.setMap(null);

    // need to recreate the i18n instance as the overviewmap is a new map inside the main map
    const i18nInstance = i18n.cloneInstance({
      lng: mapFeaturesConfig.displayLanguage,
      fallbackLng: mapFeaturesConfig.displayLanguage,
    });

    const root = createRoot(toggleButton!);
    root.render(
      <I18nextProvider i18n={i18nInstance}>
        <ThemeProvider theme={cgpvTheme}>
          <OverviewMapToggle overviewMap={overviewMapControl} />
        </ThemeProvider>
      </I18nextProvider>
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div />;
}
