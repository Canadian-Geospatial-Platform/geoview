import { useEffect } from 'react';

import { createRoot } from 'react-dom/client';

import i18n from 'i18next';
import { I18nextProvider } from 'react-i18next';

import { ThemeProvider } from '@mui/material/styles';

import BaseLayer from 'ol/layer/Base';
import TileLayer from 'ol/layer/Tile';
import VectorTileLayer from 'ol/layer/VectorTile';
import { VectorTile } from 'ol/source';
import OLMap from 'ol/Map';
import { OverviewMap as OLOverviewMap } from 'ol/control';
import { applyStyle } from 'ol-mapbox-style';

import { cgpvTheme } from '@/ui/style/theme';
import { OverviewMapToggle } from './overview-map-toggle';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { useAppDisplayLanguage, useAppDisplayTheme } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useMapOverviewMapHideZoom, useMapProjection, useMapZoom } from '@/core/stores/store-interface-and-intial-values/map-state';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { logger } from '@/core/utils/logger';
import { Box } from '@/ui/layout';

type OverwiewMapProps = {
  olMap: OLMap;
};

function useCreateOverviewMapLayers(mapId: string): () => BaseLayer[] {
  const createLayers = (): BaseLayer[] => {
    const defaultBasemap = MapEventProcessor.createOverviewMapBasemap(mapId);

    const newLayers: BaseLayer[] = [];
    defaultBasemap?.layers.forEach((layer) => {
      // create a tile layer for this basemap layer
      let tileLayer;
      if (layer.source instanceof VectorTile) {
        tileLayer = new VectorTileLayer({
          opacity: layer.opacity,
          source: layer.source,
          declutter: true,
        });

        const tileGrid = layer.source.getTileGrid();
        if (tileGrid) {
          applyStyle(tileLayer, layer.styleUrl, {
            resolutions: tileGrid.getResolutions(),
          }).catch((err) => logger.logError(err));
        }
      } else {
        tileLayer = new TileLayer({
          opacity: layer.opacity,
          source: layer.source,
        });
      }

      if (tileLayer) {
        // add this layer to the basemap group
        tileLayer.set(mapId, 'basemap');
        newLayers.push(tileLayer as BaseLayer);
      }
    });
    return newLayers;
  };

  return createLayers;
}

/**
 * Creates an overview map control and adds it to the map
 * @param {OverwiewMapProps} props - Overview map props containing the viewer
 *
 * @returns {JSX.Element} returns empty container
 */
export function OverviewMap(props: OverwiewMapProps): JSX.Element {
  // Log
  logger.logTraceRender('components/overview-map/overview-map');

  const { olMap } = props;
  const mapId = useGeoViewMapId();
  const createLayers = useCreateOverviewMapLayers(mapId);

  // get the values from store
  const hideOnZoom = useMapOverviewMapHideZoom();
  const zoomLevel = useMapZoom();
  const projection = useMapProjection();
  const displayLanguage = useAppDisplayLanguage();
  const displayTheme = useAppDisplayTheme();

  useEffect(() => {
    logger.logTraceUseEffect('OVERVIEW-MAP - zoom level changed');
    const overviewMapCtrl = olMap
      .getControls()
      .getArray()
      .filter((item) => {
        return item instanceof OLOverviewMap;
      })[0] as OLOverviewMap;
    if (overviewMapCtrl) {
      if (zoomLevel < hideOnZoom) overviewMapCtrl.setMap(null);
      else overviewMapCtrl.setMap(olMap!);
    }
  }, [hideOnZoom, zoomLevel, olMap]);

  useEffect(() => {
    logger.logTraceUseEffect('OVERVIEW-MAP - projection changed');

    const overviewMapCtrl = olMap
      .getControls()
      .getArray()
      .filter((item) => {
        return item instanceof OLOverviewMap;
      })[0] as OLOverviewMap;
    if (overviewMapCtrl) {
      // collapse the overview map, if not projection throw an error
      overviewMapCtrl.setCollapsed(true);
      overviewMapCtrl.setMap(null);

      // wait for the view change then set the map and open the overview
      // TODO: use async - look for better options then Timeout
      setTimeout(() => {
        overviewMapCtrl.setMap(olMap!);
        setTimeout(() => {
          overviewMapCtrl.setCollapsed(false);
          overviewMapCtrl.getOverviewMap().setLayers(createLayers());
        }, 500);
      }, 2000);
    }
  }, [projection, olMap]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('OVERVIEW-MAP - displayLanguage', displayLanguage, displayTheme);

    const toggleButton = document.createElement('div');

    // If moving the overview map creation / updating somewhere else, maybe can do the below instead
    // overviewMapControl.element = toggleButton;

    const overviewMapControl = new OLOverviewMap({
      className: `ol-overviewmap ol-custom-overviewmap`,
      layers: createLayers(),
      collapseLabel: toggleButton,
      label: toggleButton,
      collapsed: false,
      rotateWithView: true,
      tipLabel: '',
    });

    // remove the overview map control and link the new one on refresh
    const overviewMapCtrl = olMap
      .getControls()
      .getArray()
      .filter((item) => {
        return item instanceof OLOverviewMap;
      })[0] as OLOverviewMap;
    olMap!.removeControl(overviewMapCtrl!);
    olMap!.addControl(overviewMapControl);

    // set initial state for the overview map for the hideOnZoom
    if (olMap!.getView().getZoom() && olMap!.getView().getZoom()! < hideOnZoom) overviewMapControl.setMap(null);

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

  return <Box />;
}
