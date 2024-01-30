import { useEffect } from 'react';

import { createRoot } from 'react-dom/client';

import i18n from 'i18next';
import { I18nextProvider } from 'react-i18next';

import { ThemeProvider } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';

import TileLayer from 'ol/layer/Tile';
import { OverviewMap as OLOverviewMap } from 'ol/control';

import { getGeoViewStore } from '@/core/stores/stores-managers';

import { cgpvTheme } from '@/ui/style/theme';
import { OverviewMapToggle } from './overview-map-toggle';
import { useGeoViewMapId } from '@/app';
import { useAppDisplayLanguage, useAppDisplayTheme } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useMapElement, useMapOverviewMapHideZoom } from '@/core/stores/store-interface-and-intial-values/map-state';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { logger } from '@/core/utils/logger';
import { getSxClasses } from './overview-map-styles';


/**
 * Creates an overview map control and adds it to the map
 *
 * @returns {JSX.Element} returns empty container
 */
export function OverviewMap(): JSX.Element {
  // Log
  logger.logTraceRender('components/overview-map/overview-map');

  const mapId = useGeoViewMapId();

  // get the values from store
  const mapElement = useMapElement();
  const hideOnZoom = useMapOverviewMapHideZoom();
  const displayLanguage = useAppDisplayLanguage();
  const displayTheme = useAppDisplayTheme();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  /**
   * Return the map overview map
   * @returns {OLOverviewMap} the OL overview map
   */
  const getOverViewMap = (): OLOverviewMap => {
    return mapElement!
      .getControls()
      .getArray()
      .filter((item) => {
        return item instanceof OLOverviewMap;
      })[0] as OLOverviewMap;
  };

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('OVERVIEW-MAP - mount');

    // if zoom changed, view change:resolution event has been triggered
    const unsubMapZoom = getGeoViewStore(mapId).subscribe(
      (state) => state.mapState.zoom,
      (curZoom, prevZoom) => {
        if (curZoom !== prevZoom) {
          if (curZoom! < hideOnZoom) getOverViewMap().setMap(null);
          else getOverViewMap().setMap(mapElement!);
        }
      }
    );

    // if projection change
    const unsubMapCurrentProjection = getGeoViewStore(mapId).subscribe(
      (state) => state.mapState.currentProjection,
      (curProj, prevProj) => {
        if (curProj !== prevProj) {
          const overviewMap = getOverViewMap();

          // collapse the overview map, if not projection throw an error
          overviewMap.setCollapsed(true);
          overviewMap.setMap(null);

          // wait for the view change then set the map and open the overview
          // TODO: use async - look for better options then Timeout
          setTimeout(() => {
            overviewMap.setMap(mapElement!);
            setTimeout(() => overviewMap.setCollapsed(false), 500);
          }, 2000);
        }
      }
    );

    return () => {
      unsubMapZoom();
      unsubMapCurrentProjection();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('OVERVIEW-MAP - displayLanguage', displayLanguage, displayTheme);

    // get default overview map
    const defaultBasemap = MapEventProcessor.createOverviewMapBasemap(mapId);

    const toggleButton = document.createElement('div');

    const overviewMapControl = new OLOverviewMap({
      className: `ol-overviewmap ol-custom-overviewmap ${sxClasses.overviewMap}`,
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

    // remove the overview map control and link the new one on refresh
    mapElement!.removeControl(getOverViewMap());
    mapElement!.addControl(overviewMapControl);

    // set initial state for the overview map for the hideOnZoom
    if (mapElement!.getView().getZoom() && mapElement!.getView().getZoom()! < hideOnZoom) overviewMapControl.setMap(null);

    // need to recreate the i18n instance as the overviewmap is a new map inside the main map
    const i18nInstance = i18n.cloneInstance({
      lng: displayLanguage,
      fallbackLng: displayLanguage,
    });

    const root = createRoot(toggleButton!);
    root.render(
      <I18nextProvider i18n={i18nInstance}>
        <ThemeProvider theme={cgpvTheme}>
          <OverviewMapToggle overviewMap={overviewMapControl} />
        </ThemeProvider>
      </I18nextProvider>
    );

    // link the root to the the map so we can unmount
    MapEventProcessor.setMapOverviewMapRoot(mapId, root);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayLanguage, displayTheme]);

  return <div />;
}
